import React, { type FC } from 'react';
import { CanvasLogo } from '@/server/trmnl/screens/CanvasLogo.tsx';

const stripNonAlphaNumeric = (str: string) => {
    return str.replace(/[^a-zA-Z0-9 ]/g, '');
};

interface TodoListDisplayProps {
    courses: Map<number, { id: number; name: string }>;
    assignments: Map<
        number,
        {
            id: number;
            courseId: number;
            name: string;
            description: string;
            dueAt: Date | null;
        }
    >;
    layout: 'full' | 'halfVertical' | 'halfHorizontal' | 'quadrant';
}

export const TodoListDisplay: FC<TodoListDisplayProps> = ({
    courses,
    assignments,
    layout,
}) => {
    const currentTime = new Date();
    const earliestAssignments = Array.from(assignments.values())
        .filter((assignment) => assignment.dueAt !== null)
        .sort(
            (a, b) =>
                (a.dueAt ?? new Date(0)).getTime() -
                (b.dueAt ?? new Date(0)).getTime(),
        );

    return (
        <>
            <div className='layout'>
                <div className='columns'>
                    <div
                        className='column'
                        data-list-hidden-count='true'
                        data-list-limit='true'
                        data-list-max-height={
                            layout === 'full' || layout === 'halfVertical'
                                ? '340'
                                : '160'
                        }
                    >
                        {earliestAssignments.map((item, index) => {
                            return (
                                <div className='item' key={item.id}>
                                    <div className='meta'>
                                        <span className='index'>
                                            {index + 1}
                                        </span>
                                    </div>
                                    <div className='content'>
                                        <span className='title title--small'>
                                            {stripNonAlphaNumeric(item.name)}
                                        </span>
                                        <span className='description'>
                                            {courses.get(item.courseId)?.name ??
                                                'Unknown Course'}
                                        </span>
                                        <div className='flex gap--small'>
                                            <span className='label label--small label--underline'>
                                                {item.dueAt?.toLocaleDateString(
                                                    'en-US',
                                                    {
                                                        day: '2-digit',
                                                        month: '2-digit',
                                                        year: '2-digit',
                                                    },
                                                )}
                                            </span>
                                            {currentTime.getTime() >
                                            (
                                                item.dueAt ?? new Date(0)
                                            ).getTime() ? (
                                                <span className='label label--small label--error'>
                                                    overdue
                                                </span>
                                            ) : (
                                                <span className='label label--small label--success'>
                                                    upcoming
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
            <div className='title_bar'>
                <CanvasLogo />
                <span className='title'>Canvas LMS</span>
            </div>
        </>
    );
};
