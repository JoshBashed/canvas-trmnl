import React from 'react';
import { Footer } from '@/shared/components/Footer.tsx';

export const Home = () => {
    return (
        <div className='flex min-h-screen flex-col'>
            {/* hero */}
            <section className='flex items-center justify-center bg-radial-[circle_at_bottom] from-indigo-800 to-80% p-8 md:min-h-[60vh] md:p-16'>
                <div className='flex w-full max-w-4xl flex-col gap-8'>
                    <div className='flex flex-col gap-4'>
                        <h1 className='font-bold font-display text-4xl md:text-6xl'>
                            Canvas-TRMNL
                        </h1>
                        <p className='text-xl text-zinc-300 md:text-2xl'>
                            See your canvas assignments at a glance.
                        </p>
                    </div>
                    <a
                        className='inline-block w-max rounded-full bg-zinc-50 px-4 py-2 text-zinc-950 hover:underline'
                        href='https://usetrmnl.com/plugin_settings/new?keyname=canvas_lms'
                    >
                        Add to TRMNL
                    </a>
                </div>
            </section>
            <section className='flex items-center justify-center bg-zinc-900 p-8 md:p-16'>
                <div className='flex w-full max-w-4xl flex-col gap-8'>
                    <h2 className='font-bold font-display text-3xl md:text-4xl'>
                        Features
                    </h2>
                    <div className='grid gap-10 text-left md:grid-cols-3'>
                        <div className='flex flex-col gap-2'>
                            <h3 className='font-semibold text-xl'>FOSS</h3>
                            <p className='text-zinc-400'>
                                Open source, free to use, and free to modify.
                            </p>
                        </div>
                        <div className='flex flex-col gap-2'>
                            <h3 className='font-semibold text-xl'>Clean UI</h3>
                            <p className='text-zinc-400'>
                                Focus on your assignments, not clutter.
                            </p>
                        </div>
                        <div className='flex flex-col gap-2'>
                            <h3 className='font-semibold text-xl'>
                                Simple Setup
                            </h3>
                            <p className='text-zinc-400'>
                                No complicated setup, just add the plugin to
                                TRMNL and you're good to go.
                            </p>
                        </div>
                    </div>
                </div>
            </section>
            <Footer />
        </div>
    );
};
