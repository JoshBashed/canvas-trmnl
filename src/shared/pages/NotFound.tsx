import React, { type FC } from 'react';

export const NotFound: FC = () => {
    return (
        <div className='flex min-h-screen items-center justify-center bg-radial-[circle_at_bottom] bg-zinc-950 from-indigo-800 to-80% p-8 text-white'>
            <div className='flex w-full max-w-md flex-col gap-4 rounded-md border border-zinc-700 bg-zinc-900 p-8 shadow'>
                <div className='flex flex-col gap-2'>
                    <h1 className='font-bold font-display text-4xl tracking-tight'>
                        404
                    </h1>
                    <p className='text-sm text-zinc-400'>
                        Unknown page. The page you are looking for does not
                        exist.
                    </p>
                </div>
                <a
                    href='/'
                    className='inline-block rounded-full bg-white px-4 py-2 text-center font-semibold text-black hover:underline'
                >
                    Return
                </a>
            </div>
        </div>
    );
};
