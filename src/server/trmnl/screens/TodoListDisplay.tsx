import React, { type FC } from 'react';
import { CanvasLogo } from '@/server/trmnl/screens/CanvasLogo.tsx';

const TOO_OLD_OFFSET = 1000 * 60 * 60 * 24 * 40;
const ONE_DAY = 1000 * 60 * 60 * 24;
const RANDOM_EMOTICONS_ALL_DONE = [
    ':D',
    ':-D',
    'xD',
    '8D',
    ':)',
    ':O',
    ':]',
    ':3',
    '^_^',
    '(>_<)',
    '(^_^)',
    '\\(^_^)/',
    '(^o^)',
    '\\(^o^)/',
    '(^-^)',
    '(o_o)',
    ':-)',
    ':-]',
    ':-3',
    ':>',
    ':->',
    ':]',
    '=]',
    '=D',
    ':-P',
    ':P',
    ':-p',
    ':p',
    ';-)',
    ';)',
    ':-|',
    ':|',
    ':-/',
    ':/',
    ':-\\',
    ':\\',
    ':-S',
    ':S',
    ':-$',
    ':$',
    ':-*',
    ':*',
    ':-X',
    ':X',
    ':-#',
    ':#',
    ':-@',
    ':@',
    'O:)',
    'O:-)',
    '>:-)',
    '>:)',
    ':-]',
    ':-}',
    ':}',
    ':-]',
];

const stripNonAscii = (text: string) => {
    return text.replace(/[^\x20-\x7E]/g, '');
};

interface Assignment {
    id: number;
    courseId: number;
    name: string;
    description: string;
    dueAt: Date | null;
}

interface Course {
    id: number;
    name: string;
}

interface AssignmentWithCourse extends Omit<Assignment, 'courseId'> {
    course: Course;
}

interface TodoListDisplayProps {
    courses: Map<number, { id: number; name: string }>;
    assignments: Map<number, Assignment>;
    layout: 'full' | 'halfVertical' | 'halfHorizontal' | 'quadrant';
}

const SectionHeader: FC<{ title: string; className: string }> = ({
    title,
    className,
}) => (
    <div
        className={`w--full rounded--small rounded-t--medium p--2 ${className}`}
        style={{ borderRadius: '8px 8px 4px 4px' }}
    >
        <span className='title title--small text-stroke'>{title}</span>
    </div>
);

const AssignmentCompletionBox: FC<{
    mode: 'vertical' | 'horizontal';
    className: string;
    count: number;
    label: string;
}> = ({ mode, className, count, label }) => (
    <div
        className={`flex ${mode === 'horizontal' ? 'flex--row' : 'w--full flex--col'} flex--center rounded-small p--2 ${className}`}
        style={{ borderRadius: '8px', flex: 1 }}
    >
        <p
            className={`${mode === 'horizontal' ? 'label' : 'title title--small'} text-stroke`}
        >
            {count}
        </p>
        <span className='label text-stroke'>{label}</span>
    </div>
);

function processAssignments(
    assignments: Map<number, Assignment>,
    courses: Map<number, { id: number; name: string }>,
) {
    const now = new Date();
    const nowMs = now.getTime();
    const cutoffMs = nowMs + ONE_DAY;

    const values: AssignmentWithCourse[] = Array.from(assignments.values())
        .map((a) => {
            const course = courses.get(a.courseId);
            return course ? { ...a, course } : undefined;
        })
        .filter((x) => x !== undefined)
        .sort(
            (a, b) =>
                (a.dueAt ? a.dueAt.getTime() : Number.POSITIVE_INFINITY) -
                (b.dueAt ? b.dueAt.getTime() : Number.POSITIVE_INFINITY),
        );

    const overdueAssignments = values.filter((a) => {
        if (!a.dueAt) return false;
        const dueMs = a.dueAt.getTime();
        return dueMs < nowMs && dueMs + TOO_OLD_OFFSET >= nowMs;
    });

    const todayAssignments = values.filter((a) => {
        if (!a.dueAt) return false;
        const dueMs = a.dueAt.getTime();
        return dueMs >= nowMs && dueMs < cutoffMs;
    });

    const todoAssignments = values.filter((a) => {
        if (!a.dueAt) return false;
        const dueMs = a.dueAt.getTime();
        return dueMs >= cutoffMs;
    });

    return { overdueAssignments, todayAssignments, todoAssignments };
}

function capAssignments(
    overdueAssignments: AssignmentWithCourse[],
    todayAssignments: AssignmentWithCourse[],
    todoAssignments: AssignmentWithCourse[],
    layout: 'full' | 'halfVertical' | 'halfHorizontal' | 'quadrant',
) {
    if (layout === 'halfHorizontal') {
        const max = 3;
        return {
            overdueAssignmentsCapped: overdueAssignments.slice(0, max),
            todayAssignmentsCapped: todayAssignments.slice(0, max),
            todoAssignmentsCapped: todoAssignments.slice(0, max),
        };
    }

    const quotaMap = { full: 8, halfVertical: 7, quadrant: 3 } as const;
    let quota = quotaMap[layout];
    const splitHeight = 1;

    const overdueAssignmentsCapped = [];
    const todayAssignmentsCapped = [];
    const todoAssignmentsCapped = [];

    for (const assignment of overdueAssignments) {
        quota -= 1;
        if (quota < 0) break;
        overdueAssignmentsCapped.push(assignment);
    }
    if (overdueAssignments.length > 0) quota -= splitHeight;

    for (const assignment of todayAssignments) {
        quota -= 1;
        if (quota < 0) break;
        todayAssignmentsCapped.push(assignment);
    }
    if (todayAssignments.length > 0) quota -= splitHeight;

    for (const assignment of todoAssignments) {
        quota -= 1;
        if (quota < 0) break;
        todoAssignmentsCapped.push(assignment);
    }

    return {
        overdueAssignmentsCapped,
        todayAssignmentsCapped,
        todoAssignmentsCapped,
    };
}

const AssignmentItem: FC<{ assignment: AssignmentWithCourse }> = ({
    assignment,
}) => (
    <div className='item'>
        <div className='meta'></div>
        <div className='content'>
            <span
                className='title title--small clamp--1 w--full'
                style={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                }}
            >
                {stripNonAscii(assignment.name)}
            </span>
            <div
                className='flex w--full gap--small'
                style={{ maxWidth: '100%' }}
            >
                {assignment.dueAt && (
                    <span
                        className='label label--small label--underline clamp--none'
                        style={{ whiteSpace: 'nowrap' }}
                    >
                        {assignment.dueAt.toLocaleString()}
                    </span>
                )}
                <div
                    style={{
                        flexGrow: 1,
                        isolation: 'isolate',
                        minWidth: '0px',
                        position: 'relative',
                    }}
                >
                    <p
                        className='label label--small'
                        style={{
                            display: 'block',
                            overflow: 'hidden',
                            position: 'absolute',
                            right: 0,
                            textOverflow: 'ellipsis',
                            top: 0,
                            whiteSpace: 'nowrap',
                            width: '100%',
                        }}
                    >
                        {stripNonAscii(assignment.course.name)}
                    </p>
                </div>
            </div>
        </div>
    </div>
);

const AssignmentSection: FC<{
    name: string;
    className: string;
    assignments: AssignmentWithCourse[];
    layout: 'full' | 'halfVertical' | 'halfHorizontal' | 'quadrant';
}> = ({ name, className, assignments, layout }) => (
    <div
        className={`gap flex flex--col ${layout === 'halfHorizontal' ? 'h-full' : 'w-full'}`}
        style={{ flex: layout === 'halfHorizontal' ? 1 : undefined }}
    >
        <SectionHeader className={className} title={name} />
        {assignments.map((a) => (
            <AssignmentItem assignment={a} key={a.id} />
        ))}
    </div>
);

export const TodoListDisplay: FC<TodoListDisplayProps> = ({
    courses,
    assignments,
    layout,
}) => {
    const { overdueAssignments, todayAssignments, todoAssignments } =
        processAssignments(assignments, courses);
    const {
        overdueAssignmentsCapped,
        todayAssignmentsCapped,
        todoAssignmentsCapped,
    } = capAssignments(
        overdueAssignments,
        todayAssignments,
        todoAssignments,
        layout,
    );

    const sections = [
        {
            assignments: overdueAssignmentsCapped,
            className: 'bg--gray-2',
            name: 'Overdue',
        },
        {
            assignments: todayAssignmentsCapped,
            className: 'bg--gray-4',
            name: 'Today',
        },
        {
            assignments: todoAssignmentsCapped,
            className: 'bg--gray-6',
            name: 'Todo',
        },
    ];

    const completionBoxes = [
        {
            className: 'bg--gray-2',
            count: overdueAssignments.length,
            name: 'Overdue',
        },
        {
            className: 'bg--gray-4',
            count: todayAssignments.length,
            name: 'Today',
        },
        {
            className: 'bg--gray-6',
            count: todoAssignments.length,
            name: 'Todo',
        },
    ];

    return (
        <>
            <div className={`layout ${layout === 'full' ? '' : ''}`}>
                <div
                    className={`flex ${layout === 'halfVertical' ? 'flex--col' : 'flex--row'} gap h--full w--full`}
                >
                    {layout !== 'quadrant' && layout !== 'halfHorizontal' && (
                        <div
                            className={`gap flex ${layout === 'halfVertical' ? 'w--full flex--row' : 'h--full flex--col'}`}
                        >
                            {completionBoxes.map(
                                ({ className, count, name }) => (
                                    <AssignmentCompletionBox
                                        className={className}
                                        count={count}
                                        key={name}
                                        label={name}
                                        mode={
                                            layout === 'halfVertical'
                                                ? 'horizontal'
                                                : 'vertical'
                                        }
                                    />
                                ),
                            )}
                        </div>
                    )}
                    {sections.filter(
                        (section) => section.assignments.length > 0,
                    ).length > 0 ? (
                        <div
                            className={`${layout === 'halfHorizontal' ? 'grid--cols-3 grid' : 'gap flex flex--col'} ${layout === 'halfVertical' ? 'w--full' : 'h--full'}`}
                            style={{ flexGrow: 1, maxWidth: '100%' }}
                        >
                            {sections
                                .filter(
                                    (section) => section.assignments.length > 0,
                                )
                                .map((section) => (
                                    <AssignmentSection
                                        assignments={section.assignments}
                                        className={section.className}
                                        key={section.name}
                                        layout={layout}
                                        name={section.name}
                                    />
                                ))}
                        </div>
                    ) : (
                        <div
                            className='flex flex--center flex--col p--4'
                            style={{ flexGrow: 1 }}
                        >
                            <span className='title'>
                                {
                                    RANDOM_EMOTICONS_ALL_DONE[
                                        Math.floor(
                                            Math.random() *
                                                RANDOM_EMOTICONS_ALL_DONE.length,
                                        )
                                    ]
                                }
                            </span>
                            <span className='label'>All caught up!</span>
                        </div>
                    )}
                </div>
            </div>
            <div className='title_bar'>
                <CanvasLogo />
                <span className='title'>Canvas LMS</span>
            </div>
        </>
    );
};
