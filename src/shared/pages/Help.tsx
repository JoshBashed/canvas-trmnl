import React from 'react';
import { Footer } from '@/shared/components/Footer.tsx';

export const Help = () => {
    return (
        <div className='flex min-h-screen flex-col'>
            <section className='flex items-center justify-center bg-radial-[circle_at_bottom] from-indigo-800 to-80% p-8 md:p-16'>
                <div className='flex w-full max-w-4xl flex-col gap-8'>
                    <h1 className='font-bold font-display text-4xl md:text-6xl'>
                        Help and Support
                    </h1>
                </div>
            </section>
            <section className='flex items-center justify-center bg-zinc-900 p-8 md:p-16'>
                <div className='flex w-full max-w-4xl flex-col gap-2'>
                    <p>
                        There is nothing here right now. Help us by opening a PR
                        on GitHub!
                    </p>
                </div>
            </section>
            <Footer />
        </div>
    );
};
