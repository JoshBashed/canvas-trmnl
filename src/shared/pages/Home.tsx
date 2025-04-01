import React from 'react';
import { Footer } from '@/shared/components/Footer.tsx';

export const Home = () => {
    return (
        <div className='flex min-h-screen flex-col'>
            {/* hero */}
            <section className='flex items-center justify-center bg-radial-[circle_at_bottom] from-indigo-800 to-80% p-8 md:min-h-[60vh] md:p-16'>
                <div className='flex w-full max-w-4xl flex-col gap-8'>
                    <h1 className='font-bold font-display text-4xl md:text-6xl'>
                        canvas-trmnl :3
                    </h1>
                    <p className='text-xl text-zinc-300 md:text-2xl'>
                        see your canvas assignments at a glance.
                    </p>
                    <a
                        href='https://usetrmnl.com/plugin_settings/new?keyname=canvas_lms'
                        className='inline-block w-max rounded-full bg-zinc-50 px-4 py-2 text-zinc-950 hover:underline'
                    >
                        get started
                    </a>
                </div>
            </section>
            <section className='flex items-center justify-center bg-zinc-900 p-8 md:p-16'>
                <div className='flex w-full max-w-4xl flex-col gap-8'>
                    <h2 className='font-bold font-display text-3xl md:text-4xl'>
                        what it do :3
                    </h2>
                    <div className='grid gap-10 text-left md:grid-cols-3'>
                        <div className='flex flex-col gap-2'>
                            <h3 className='font-semibold text-xl'>foss</h3>
                            <p className='text-zinc-400'>
                                open-source, free software. no strings attached.
                            </p>
                        </div>
                        <div className='flex flex-col gap-2'>
                            <h3 className='font-semibold text-xl'>clean ui</h3>
                            <p className='text-zinc-400'>
                                no clutter. just the info you need.
                            </p>
                        </div>
                        <div className='flex flex-col gap-2'>
                            <h3 className='font-semibold text-xl'>
                                easy to use
                            </h3>
                            <p className='text-zinc-400'>
                                no sign-up required. just a few clicks and
                                you're golden.
                            </p>
                        </div>
                    </div>
                </div>
            </section>
            <Footer />
        </div>
    );
};
