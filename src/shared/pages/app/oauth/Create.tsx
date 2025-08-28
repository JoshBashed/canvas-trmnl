import React, { type FC, useEffect, useState } from 'react';
import { LoadingIcon } from '@/shared/components/LoadingIcon.tsx';
import { Page } from '@/shared/components/Page.tsx';
import { apiClient } from '@/shared/utilities/apiClient.ts';

export const OauthCreate: FC = () => {
    const [state, setState] = useState<'loading' | 'error' | 'success'>(
        'loading',
    );
    const [stateText, setStateText] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const rawCallbackURL = urlParams.get('callback_url');
        const code = urlParams.get('code');
        const ALLOWED_BASE_DOMAIN = 'usetrmnl.com';

        if (!rawCallbackURL) {
            setState('error');
            setError('No callback URL provided.');
            return;
        }

        let callbackURL: URL;
        try {
            callbackURL = new URL(rawCallbackURL);
        } catch {
            setState('error');
            setError('Invalid callback URL.');
            return;
        }

        if (callbackURL.protocol !== 'https:') {
            setState('error');
            setError('Callback URL must use HTTPS.');
            return;
        }

        const isAllowedDomain =
            callbackURL.hostname === ALLOWED_BASE_DOMAIN ||
            callbackURL.hostname.endsWith(`.${ALLOWED_BASE_DOMAIN}`);
        if (!isAllowedDomain) {
            setState('error');
            setError('Invalid callback URL.');
            return;
        }

        if (!code) {
            setState('error');
            setError('No code provided.');
            return;
        }

        (async () => {
            setStateText('Creating account...');
            const [dataResult, data] = await apiClient.createConsumer({ code });

            if (!dataResult) {
                setState('error');
                setError(apiClient.formatError(data));
                return;
            }

            if (data.type === 'error') {
                setState('error');
                setError(`Error: ${data.data}.`);
                return;
            }

            setState('success');
            setTimeout(
                () => window.location.replace(callbackURL.toString()),
                3000,
            );
        })();
    }, []);

    return (
        <Page
            description='Creating a plugin instance...'
            enableSSR={false}
            title='Linking Account'
        >
            <div className='flex min-h-screen items-center justify-center bg-radial-[circle_at_bottom] bg-zinc-950 from-indigo-800 to-80% p-8 text-white'>
                <div className='flex w-full max-w-md flex-col gap-2 rounded-md border border-zinc-700 bg-zinc-900 p-8 shadow'>
                    {state === 'loading' && (
                        <>
                            <div className='flex gap-2'>
                                <LoadingIcon />
                                <h1 className='font-bold font-display text-2xl tracking-tight'>
                                    Authenticating...
                                </h1>
                            </div>
                            {stateText && (
                                <p className='text-sm text-zinc-400'>
                                    {stateText}
                                </p>
                            )}
                        </>
                    )}
                    {state === 'error' && (
                        <>
                            <h1 className='font-bold font-display text-2xl tracking-tight'>
                                Error
                            </h1>
                            <p className='text-sm text-zinc-400'>{error}</p>
                        </>
                    )}
                    {state === 'success' && (
                        <>
                            <h1 className='font-bold font-display text-2xl tracking-tight'>
                                Success
                            </h1>
                            <p className='text-sm text-zinc-400'>
                                You will be redirected shortly.
                            </p>
                        </>
                    )}
                </div>
            </div>
        </Page>
    );
};
