import { LoadingIcon } from '@/shared/components/LoadingIcon.tsx';
import {
    performFetchConsumerData,
    performUpdateCanvasData,
} from '@/shared/utilities/apiClient.ts';
import React, { useEffect, useMemo, useState, type FC } from 'react';
import { useLocation, useParams } from 'react-router';

export const Manage: FC = () => {
    const [consumerData, setConsumerData] = useState<{
        trmnlId: string;
        name: string;
        settingsId: number;
    } | null>(null);
    const [error, setError] = useState<string | null>(null);
    const params = useParams<{ id: string }>();
    const location = useLocation();
    const token = useMemo(() => {
        const url = new URLSearchParams(location.search);
        return url.get('token');
    }, [location.search]);

    useEffect(() => {
        let cancelled = false;

        setError(null);
        setConsumerData(null);

        if (!token) {
            setError('No auth token provided in the URL.');
            return;
        }

        (async () => {
            const [success, data] = await performFetchConsumerData({
                trmnlId: params.id ?? '',
                authToken: token,
            });
            if (cancelled) return;

            if (!success) {
                setError(`Request failed: ${data}.`);
                return;
            }

            if (data.type === 'globalError') {
                setError(`Request failed (API error): ${data.error}.`);
                return;
            }

            if (data.type === 'error') {
                setError(`Request failed (procedure error): ${data.error}.`);
                return;
            }

            if (data.type === 'success') {
                setConsumerData({
                    trmnlId: data.data.trmnlId,
                    name: data.data.name,
                    settingsId: data.data.settingsId,
                });
                return;
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [params.id, token]);

    return (
        <div
            className={`flex min-h-screen justify-center bg-radial-[circle_at_bottom] bg-zinc-950 from-indigo-800 to-80% p-8 text-white md:p-16 ${consumerData === null ? 'items-center' : ''}`}
        >
            {consumerData === null && error === null && <LoadingIcon />}
            {error && (
                <div className='flex w-full max-w-md flex-col gap-4 rounded-md border border-zinc-700 bg-zinc-900 p-8 text-center shadow'>
                    <h2 className='font-bold font-display text-2xl tracking-tight'>
                        error
                    </h2>
                    <p className='text-sm text-zinc-400'>{error}</p>
                </div>
            )}
            {consumerData && (
                <ManagePage
                    trmnlId={consumerData.trmnlId}
                    trmnlSettingsId={consumerData.settingsId.toString()}
                    name={consumerData.name}
                    token={token ?? ''}
                />
            )}
        </div>
    );
};

export const ManagePage: FC<{
    trmnlId: string;
    trmnlSettingsId: string;
    name: string;
    token: string;
}> = (props) => {
    const [canvasServer, setCanvasServer] = useState('');
    const [canvasToken, setCanvasToken] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    return (
        <div className='flex w-full max-w-4xl flex-col gap-8'>
            <div className='flex items-center justify-between'>
                <a
                    href={`https://usetrmnl.com/plugin_settings/${props.trmnlSettingsId}/edit?keyname=canvas_lms`}
                    className='flex gap-2 rounded text-sm text-zinc-400 hover:underline'
                >
                    <svg
                        role='img'
                        aria-label='back arrow'
                        xmlns='http://www.w3.org/2000/svg'
                        viewBox='0 0 20 20'
                        fill='currentColor'
                        className='size-5'
                    >
                        <path
                            fillRule='evenodd'
                            d='M17 10a.75.75 0 0 1-.75.75H5.612l4.158 3.96a.75.75 0 1 1-1.04 1.08l-5.5-5.25a.75.75 0 0 1 0-1.08l5.5-5.25a.75.75 0 1 1 1.04 1.08L5.612 9.25H16.25A.75.75 0 0 1 17 10Z'
                            clipRule='evenodd'
                        />
                    </svg>
                    back to trmnl
                </a>
                <span className='text-sm text-zinc-400'>
                    {props.name} ({props.trmnlSettingsId})
                </span>
            </div>

            <div className='flex flex-col gap-2'>
                <h1 className='font-bold font-display text-4xl tracking-tight'>
                    manage plugin
                </h1>
                <p className='text-sm text-zinc-400'>
                    update your canvas connection settings.
                </p>
            </div>

            <div className='flex flex-col gap-6'>
                <div className='flex flex-col gap-2'>
                    <label
                        htmlFor='canvas-server'
                        className='text-sm text-zinc-400'
                    >
                        canvas server domain
                    </label>
                    <input
                        type='text'
                        id='canvas-server'
                        placeholder='canvas.instructure.com'
                        disabled={isLoading}
                        value={canvasServer}
                        onChange={(e) => setCanvasServer(e.target.value)}
                        className='rounded border border-zinc-700 bg-zinc-900 px-4 py-2 text-white placeholder-zinc-500 transition disabled:bg-zinc-800/50'
                    />
                </div>

                {canvasServer !== '' && (
                    <div className='flex flex-col gap-2'>
                        <label
                            htmlFor='canvas-token'
                            className='text-sm text-zinc-400'
                        >
                            canvas token
                        </label>
                        <input
                            type='text'
                            id='canvas-token'
                            placeholder='your_canvas_token'
                            disabled={isLoading}
                            value={canvasToken}
                            onChange={(e) => setCanvasToken(e.target.value)}
                            className='rounded border border-zinc-700 bg-zinc-900 px-4 py-2 text-white placeholder-zinc-500 transition disabled:bg-zinc-800/50'
                        />
                        <p className='text-sm text-zinc-400'>
                            find your token{' '}
                            <a
                                href={`https://${canvasServer}/profile/settings`}
                                target='_blank'
                                rel='noreferrer'
                                className='underline'
                            >
                                here
                            </a>
                            . then select <b>New Access Token</b>.{' '}
                            <span className='text-red-500'>
                                do not share your token with anyone.
                            </span>
                        </p>
                    </div>
                )}

                {success && (
                    <div className='text-right text-green-500 text-sm'>
                        settings updated successfully.
                    </div>
                )}
                {error && (
                    <div className='text-right text-red-500 text-sm'>
                        {error}
                    </div>
                )}

                <div className='flex items-center justify-end gap-2'>
                    {isLoading && <LoadingIcon />}
                    <button
                        type='button'
                        className='cursor-pointer rounded-full bg-white px-6 py-2 font-semibold text-black transition hover:underline disabled:cursor-not-allowed disabled:bg-zinc-300'
                        disabled={isLoading}
                        onClick={async () => {
                            if (isLoading) return;
                            setIsLoading(true);
                            setError(null);
                            setSuccess(false);

                            let url: URL;
                            try {
                                url = new URL(`https://${canvasServer}`);
                            } catch {
                                setIsLoading(false);
                                setError('invalid canvas server domain.');
                                return;
                            }

                            const [success, data] =
                                await performUpdateCanvasData({
                                    authToken: props.token,
                                    canvasServer: url.toString(),
                                    canvasAccessToken: canvasToken,
                                    trmnlId: props.trmnlId,
                                });
                            setIsLoading(false);
                            if (!success) {
                                setError(`request failed: ${data}.`);
                                return;
                            }
                            if (data.type === 'globalError') {
                                setError(
                                    `request failed (api error): ${data.error}.`,
                                );
                                return;
                            }
                            if (data.type === 'error') {
                                setError(
                                    `request failed (procedure error): ${data.error}.`,
                                );
                                return;
                            }
                            if (data.type === 'success') setSuccess(true);
                        }}
                    >
                        save settings
                    </button>
                </div>
            </div>
        </div>
    );
};
