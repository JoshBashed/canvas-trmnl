import React, { type FC } from 'react';

const stripNonAlphaNumeric = (str: string) => {
    return str.replace(/[^a-zA-Z0-9 ]/g, '');
};

const CanvasLogo: FC = () => {
    return (
        <svg
            xmlns='http://www.w3.org/2000/svg'
            viewBox='0 0 127.17 127.21'
            role='img'
            aria-label='Canvas LMS'
            className='image'
        >
            <g id='Layer_2' data-name='Layer 2'>
                <g id='Layer_1-2' data-name='Layer 1'>
                    <path d='M18.45,63.47A18.4,18.4,0,0,0,2.31,45.23a73.13,73.13,0,0,0,0,36.47A18.38,18.38,0,0,0,18.45,63.47' />
                    <path d='M29.13,57.7a5.77,5.77,0,1,0,5.77,5.77,5.77,5.77,0,0,0-5.77-5.77' />
                    <path d='M108.72,63.47A18.38,18.38,0,0,0,124.86,81.7a73.13,73.13,0,0,0,0-36.47,18.4,18.4,0,0,0-16.14,18.24' />
                    <path d='M98,57.7a5.77,5.77,0,1,0,5.76,5.77A5.77,5.77,0,0,0,98,57.7' />
                    <path d='M63.46,108.77A18.39,18.39,0,0,0,45.23,124.9a73.13,73.13,0,0,0,36.47,0,18.38,18.38,0,0,0-18.24-16.13' />
                    <path d='M63.47,92.31a5.77,5.77,0,1,0,5.76,5.77,5.77,5.77,0,0,0-5.76-5.77' />
                    <path d='M63.47,18.44A18.37,18.37,0,0,0,81.7,2.31a73.13,73.13,0,0,0-36.47,0A18.39,18.39,0,0,0,63.47,18.44' />
                    <path d='M63.47,23.37a5.77,5.77,0,1,0,5.76,5.76,5.76,5.76,0,0,0-5.76-5.76' />
                    <path d='M95.44,95.44a18.4,18.4,0,0,0-1.5,24.29,73,73,0,0,0,25.78-25.79,18.39,18.39,0,0,0-24.28,1.5' />
                    <path d='M83.8,83.8a5.77,5.77,0,1,0,8.16,0,5.78,5.78,0,0,0-8.16,0' />
                    <path d='M31.59,31.59a18.36,18.36,0,0,0,1.5-24.28A72.93,72.93,0,0,0,7.31,33.09a18.36,18.36,0,0,0,24.28-1.5' />
                    <path d='M35.07,35.08a5.77,5.77,0,1,0,8.16,0,5.78,5.78,0,0,0-8.16,0' />
                    <path d='M95.4,31.53A18.39,18.39,0,0,0,119.69,33,72.88,72.88,0,0,0,93.9,7.25a18.39,18.39,0,0,0,1.5,24.28' />
                    <path d='M91.92,43.17a5.76,5.76,0,1,0-8.15,0,5.76,5.76,0,0,0,8.15,0' />
                    <path d='M31.56,95.37a18.39,18.39,0,0,0-24.28-1.5,73,73,0,0,0,25.78,25.79,18.38,18.38,0,0,0-1.5-24.29' />
                    <path d='M35,83.73a5.77,5.77,0,1,0,8.16,0,5.79,5.79,0,0,0-8.16,0' />
                </g>
            </g>
        </svg>
    );
};

interface TrmnlDisplayErrorProps {
    errorMessage: string;
}

export const TrmnlDisplayError: FC<TrmnlDisplayErrorProps> = ({
    errorMessage,
}) => {
    return (
        <>
            <div className='layout'>
                <div className='columns'>
                    <div className='column'>
                        <div className='markdown gap--large'>
                            <span className='title'>plugin error</span>
                            <p className='description'>{errorMessage}</p>
                        </div>
                    </div>
                </div>
            </div>
            <div className='title_bar'>
                <CanvasLogo />
                <span className='title'>Canvas LMS</span>
                {/* <span className="instance">Production</span> */}
            </div>
        </>
    );
};

interface TrmnlDisplayProps {
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

export const TrmnlDisplay: FC<TrmnlDisplayProps> = ({
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
                        data-list-limit='true'
                        data-list-max-height={
                            layout === 'full' || layout === 'halfVertical'
                                ? '340'
                                : '160'
                        }
                        data-list-hidden-count='true'
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
                                                        month: '2-digit',
                                                        day: '2-digit',
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
