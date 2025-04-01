import React, { type FC } from 'react';

export const Footer: FC = () => {
    return (
        <footer className='flex items-center justify-center p-8 md:p-16'>
            <div className='flex w-full max-w-4xl gap-2 text-sm text-zinc-400'>
                <div className='flex flex-col gap-2'>
                    <span>
                        made with love by{' '}
                        <a
                            href='https://github.com/JoshuaBrest/'
                            className='underline'
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
                        href='https://github.com/JoshuaBrest/canvas-trmnl'
                        className='underline'
                    >
                        view on github
                    </a>
                </div>
            </div>
        </footer>
    );
};
