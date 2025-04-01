import { LoadingIcon } from '@/shared/components/LoadingIcon.tsx';
import { performCreateConsumer } from '@/shared/utilities/apiClient.ts';
import React, { useEffect, useState, type FC } from 'react';

export const OauthCreate: FC = () => {
    const [state, setState] = useState<'loading' | 'error' | 'success'>(
        'loading',
    );
    const [stateText, setStateText] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const callbackURL = urlParams.get('callback_url');
        const code = urlParams.get('code');

        if (!callbackURL) {
            setState('error');
            setError('no callback URL provided.');
            return;
        }

        if (!code) {
            setState('error');
            setError('no code provided');
            return;
        }

        (async () => {
            setStateText('making request... :3');
            const [success, response] = await performCreateConsumer({ code });

            if (!success) {
                setState('error');
                setError(`request failed: ${response}.`);
                return;
            }

            if (response.type === 'globalError') {
                setState('error');
                setError(`request failed (api error): ${response.error}.`);
                return;
            }

            if (response.type === 'error') {
                setState('error');
                setError(
                    `request failed (procedure error): ${response.error}.`,
                );
                return;
            }

            if (response.type === 'success') {
                setState('success');
                setStateText('redirecting you back to trmnl... ;P');
                setTimeout(() => window.open(callbackURL, '_self'), 1000);
            }
        })();
    }, []);

    return (
        <div className='flex min-h-screen items-center justify-center bg-radial-[circle_at_bottom] bg-zinc-950 from-indigo-800 to-80% p-8 text-white'>
            <div className='flex w-full max-w-md flex-col gap-4 rounded-md border border-zinc-700 bg-zinc-900 p-8 text-center shadow'>
                {state === 'loading' && (
                    <>
                        <div className='flex items-center justify-center gap-2'>
                            <LoadingIcon />
                            <h1 className='font-bold font-display text-2xl tracking-tight'>
                                authenticating...
                            </h1>
                        </div>
                        {stateText && (
                            <p className='text-sm text-zinc-400'>{stateText}</p>
                        )}
                    </>
                )}
                {state === 'error' && (
                    <>
                        <h1 className='font-bold font-display text-2xl tracking-tight'>
                            error.
                        </h1>
                        <p className='text-sm text-zinc-400'>{error}</p>
                    </>
                )}
                {state === 'success' && (
                    <>
                        <h1 className='font-bold font-display text-2xl tracking-tight'>
                            success!
                        </h1>
                        <p className='text-sm text-zinc-400'>
                            redirecting you back to trmnl... ;P
                        </p>
                    </>
                )}
            </div>
        </div>
    );
};
