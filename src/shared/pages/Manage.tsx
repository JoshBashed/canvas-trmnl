import React, { type FC, useEffect, useId, useMemo, useState } from 'react';
import { useLocation, useParams } from 'react-router';
import { LoadingIcon } from '@/shared/components/LoadingIcon.tsx';
import { apiClient } from '@/shared/utilities/apiClient.ts';

const normalizeDomain = (domain: string): string | null => {
    const protocolRegex = /^[a-zA-Z][a-zA-Z0-9+\-.]*:\/\//;
    const noProtocol = domain.replace(protocolRegex, '');
    try {
        const url = new URL(noProtocol);
        return url.hostname;
    } catch {
        return null;
    }
};

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
            const [dataResult, data] = await apiClient.fetchConsumerData({
                authToken: token,
                trmnlId: params.id ?? '',
            });
            if (cancelled) return;

            if (!dataResult) {
                setError(apiClient.formatError(data));
                return;
            }

            if (data.type === 'error') {
                setError(`Error: ${data.data}.`);
                return;
            }

            setConsumerData({
                name: data.data.name,
                settingsId: data.data.settingsId,
                trmnlId: data.data.trmnlId,
            });
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
                <div className='flex w-full max-w-md flex-col gap-2 rounded-md border border-zinc-700 bg-zinc-900 p-8 shadow'>
                    <h2 className='font-bold font-display text-2xl tracking-tight'>
                        Error
                    </h2>
                    <p className='text-sm text-zinc-400'>{error}</p>
                </div>
            )}
            {consumerData && (
                <ManagePage
                    name={consumerData.name}
                    token={token ?? ''}
                    trmnlId={consumerData.trmnlId}
                    trmnlSettingsId={consumerData.settingsId.toString()}
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
    const sanitizedDomain = useMemo(
        () => normalizeDomain(canvasServer),
        [canvasServer],
    );

    const accessibilityCanvasServerId = useId();
    const accessibilityCanvasTokenId = useId();

    return (
        <div className='flex w-full max-w-4xl flex-col gap-8'>
            <div className='flex items-center justify-between'>
                <a
                    className='flex gap-2 rounded text-sm text-zinc-400 hover:underline'
                    href={`https://usetrmnl.com/plugin_settings/${props.trmnlSettingsId}/edit?keyname=canvas_lms`}
                >
                    <svg
                        aria-label='back arrow'
                        className='size-5'
                        fill='currentColor'
                        role='img'
                        viewBox='0 0 20 20'
                        xmlns='http://www.w3.org/2000/svg'
                    >
                        <path
                            clipRule='evenodd'
                            d='M17 10a.75.75 0 0 1-.75.75H5.612l4.158 3.96a.75.75 0 1 1-1.04 1.08l-5.5-5.25a.75.75 0 0 1 0-1.08l5.5-5.25a.75.75 0 1 1 1.04 1.08L5.612 9.25H16.25A.75.75 0 0 1 17 10Z'
                            fillRule='evenodd'
                        />
                    </svg>
                    Back to settings
                </a>
                <span className='text-sm text-zinc-400'>
                    {props.name} ({props.trmnlSettingsId})
                </span>
            </div>

            <h1 className='font-bold font-display text-4xl tracking-tight'>
                Settings
            </h1>

            <div className='flex flex-col gap-6'>
                <div className='flex flex-col gap-2'>
                    <label
                        className='text-sm text-zinc-400'
                        htmlFor={accessibilityCanvasServerId}
                    >
                        Canvas Server (domain)
                    </label>
                    <input
                        className='rounded border border-zinc-700 bg-zinc-900 px-4 py-2 text-white placeholder-zinc-500 transition disabled:bg-zinc-800/50'
                        disabled={isLoading}
                        id={accessibilityCanvasServerId}
                        onChange={(e) => setCanvasServer(e.target.value)}
                        placeholder='canvas.instructure.com'
                        type='text'
                        value={canvasServer}
                    />
                </div>

                {sanitizedDomain && (
                    <div className='flex flex-col gap-2'>
                        <label
                            className='text-sm text-zinc-400'
                            htmlFor={accessibilityCanvasTokenId}
                        >
                            Canvas Access Token
                        </label>
                        <input
                            className='rounded border border-zinc-700 bg-zinc-900 px-4 py-2 text-white placeholder-zinc-500 transition disabled:bg-zinc-800/50'
                            disabled={isLoading}
                            id={accessibilityCanvasTokenId}
                            onChange={(e) => setCanvasToken(e.target.value)}
                            placeholder='your_canvas_token'
                            type='text'
                            value={canvasToken}
                        />
                        <p className='text-sm text-zinc-400'>
                            Find your token{' '}
                            <a
                                className='underline'
                                href={`https://${sanitizedDomain}/profile/settings`}
                                rel='noreferrer'
                                target='_blank'
                            >
                                here
                            </a>
                            . Then select <b>New Access Token</b>.{' '}
                            <span className='text-red-500'>
                                Do not share your token with anyone.
                            </span>
                        </p>
                    </div>
                )}

                {success && (
                    <div className='text-right text-green-500 text-sm'>
                        Settings updated successfully.
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
                        className='cursor-pointer rounded-full bg-white px-6 py-2 font-semibold text-black transition hover:underline disabled:cursor-not-allowed disabled:bg-zinc-300'
                        disabled={isLoading || !sanitizedDomain || !canvasToken}
                        onClick={async () => {
                            if (isLoading || !sanitizedDomain || !canvasToken)
                                return;
                            setIsLoading(true);
                            setError(null);
                            setSuccess(false);

                            if (!sanitizedDomain) {
                                setIsLoading(false);
                                setError('Invalid canvas server domain.');
                                return;
                            }

                            const [success, data] =
                                await apiClient.updateConsumerCanvasSettings({
                                    authToken: props.token,
                                    canvasAccessToken: canvasToken,
                                    canvasServer: new URL(
                                        sanitizedDomain,
                                    ).toString(),
                                    trmnlId: props.trmnlId,
                                });
                            setIsLoading(false);
                            if (!success) {
                                setError(apiClient.formatError(data));
                                return;
                            }
                            if (data.type === 'error') {
                                setError(`Error: ${data.data}.`);
                                return;
                            }
                            setSuccess(true);
                        }}
                        type='button'
                    >
                        Save
                    </button>
                </div>
            </div>
        </div>
    );
};
