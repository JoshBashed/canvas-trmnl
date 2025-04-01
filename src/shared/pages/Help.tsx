import React from 'react';

export const Help = () => {
    return (
        <div className='flex min-h-screen flex-col'>
            <section className='flex items-center justify-center bg-radial-[circle_at_bottom] from-indigo-800 to-80% p-8 md:p-16'>
                <div className='flex w-full max-w-4xl flex-col gap-8'>
                    <h1 className='font-bold font-display text-4xl md:text-6xl'>
                        help
                    </h1>
                </div>
            </section>
            <section className='flex items-center justify-center bg-zinc-900 p-8 md:p-16'>
                <div className='flex w-full max-w-4xl flex-col gap-2'>
                    <p>todo</p>
                </div>
            </section>
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
        </div>
    );
};
