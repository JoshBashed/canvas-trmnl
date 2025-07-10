import React, { type FC } from 'react';

export const Footer: FC = () => {
    return (
        <footer className='flex items-center justify-center p-8 md:p-16'>
            <div className='flex w-full max-w-4xl gap-2 text-sm text-zinc-400'>
                <div className='flex flex-col gap-2'>
                    <span>
                        Made by{' '}
                        <a
                            className='underline'
                            href='https://github.com/JoshuaBrest/'
                        >
                            josh
                        </a>
                        .
                    </span>
                    <span>&copy; {new Date().getFullYear()}</span>
                </div>
                <div className='flex-grow' />
                <div className='text-right'>
                    <a
                        className='underline'
                        href='https://github.com/JoshuaBrest/canvas-trmnl'
                    >
                        GitHub
                    </a>
                </div>
            </div>
        </footer>
    );
};
