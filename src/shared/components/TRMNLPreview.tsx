import React, { type FC, useEffect, useState } from 'react';

const UNTRUSTED_CONTENT_HOST = 'https://untrustedusercontent.github.io/';

const JS_CODE = `
document.addEventListener('DOMContentLoaded', ()=>{
    // Get the verifyId
    const searchParams = new URLSearchParams(window.location.search);
    const verifyId = searchParams.get('verifyId');
    // Listen for messages from the parent window
    window.addEventListener('message', (event) => {
        if (event.data.type === 'replaceBody') {
            const host = document.getElementById('host');
            host.innerHTML = event.data.html;
            host.classList.remove(...host.classList);
            host.classList.add(...event.data.classes);
        }
        if (event.data.type === 'updateClasses') {
            const root = document.getElementById('root');
            root.classList.remove(...root.classList);
            root.classList.add(...event.data.classes);
        }
    });
    const ATTRIBUTE_MAP = new Map([
        ['className', 'class']
    ]);
    // Import fonts and css
    const el = (name, attributes = {}, children = []) => {
        const element = document.createElement(name);
        for (const [key, value] of Object.entries(attributes)) {
            const mappedKey = ATTRIBUTE_MAP.get(key) || key;
            element.setAttribute(mappedKey, value);
        }
        for (const child of children) {
            if (typeof child === 'string') {
                element.appendChild(document.createTextNode(child));
            } else {
                element.appendChild(child);
            }
        }
        return element;
    };
    const headElements = [
        el('link', { rel: 'stylesheet', href: 'https://trmnl.com/css/latest/plugins.css' }),
        el('script', { src: 'https://trmnl.com/js/latest/plugins.js' }),
        el('link', { rel: 'preconnect', href: 'https://fonts.googleapis.com' }),
        el('link', { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: 'anonymous' }),
        el('link', { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap' })
    ];
    for (const child of headElements) {
        document.head.appendChild(child);
    }
    const bodyElement = el('div', { id: 'root' }, [
        el('div', { id: 'host', className: 'view view--full' })
    ]);
    document.body.appendChild(bodyElement);
    document.body.classList.add('environment', 'trmnl');
    window.parent.postMessage({ verifyId, type: 'ready' }, '*');
});
`;

const FRIENDLY_NAME_MAP = {
    full: 'Fullscreen',
    halfHorizontal: 'Half Horizontal',
    halfVertical: 'Half Vertical',
    quadrant: 'Quadrant',
};

export interface TRMNLPreviewProps {
    html: {
        full: string;
        halfHorizontal: string;
        halfVertical: string;
        quadrant: string;
    } | null;
}

export const TRMNLPreview: FC<TRMNLPreviewProps> = ({ html }) => {
    const [selectedView, setSelectedView] = useState<
        'full' | 'halfHorizontal' | 'halfVertical' | 'quadrant'
    >('full');
    const [screenSettings, setScreenSettings] = useState<{
        darkMode: boolean;
    }>({
        darkMode: false,
    });
    const [iframeRef, setIframeRef] = useState<HTMLIFrameElement | null>(null);
    const [iframeReady, setIframeReady] = useState(false);
    useEffect(() => {
        if (!iframeRef) return;
        const url = new URL(UNTRUSTED_CONTENT_HOST);
        const verifyId = crypto.randomUUID();
        url.searchParams.set('js', btoa(JS_CODE));
        url.searchParams.set('verifyId', verifyId);
        iframeRef.src = url.toString();

        const handleMessage = (event: MessageEvent) => {
            if (event.data.verifyId !== verifyId) return;
            if (event.data.type === 'ready') {
                setIframeReady(true);
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [iframeRef]);
    useEffect(() => {
        if (!iframeRef || !iframeRef.contentWindow || !iframeReady) return;

        const viewClass = (
            {
                full: 'full',
                halfHorizontal: 'half_horizontal',
                halfVertical: 'half_vertical',
                quadrant: 'quadrant',
            } as const
        )[selectedView];

        iframeRef.contentWindow.postMessage(
            {
                classes: ['view', `view--${viewClass}`],
                html: html
                    ? html[selectedView]
                    : '<span class="title">Not ready...</span>',
                type: 'replaceBody',
            },
            '*',
        );
    }, [html, selectedView, iframeReady, iframeRef]);
    useEffect(() => {
        if (!iframeRef || !iframeRef.contentWindow || !iframeReady) return;
        iframeRef.contentWindow.postMessage(
            {
                classes: [
                    'screen',
                    screenSettings.darkMode ? 'dark-mode' : null,
                ].filter(Boolean),
                type: 'updateClasses',
            },
            '*',
        );
    }, [screenSettings, iframeReady, iframeRef]);

    return (
        <div className='flex flex-col rounded-3xl border border-zinc-700 bg-zinc-900'>
            <div className='flex w-full p-2'>
                <div className='flex w-full gap-2 overflow-hidden rounded-t-2xl'>
                    {(
                        [
                            'full',
                            'halfHorizontal',
                            'halfVertical',
                            'quadrant',
                        ] as const
                    ).map((view) => (
                        <button
                            className={`flex flex-1 cursor-pointer items-center justify-center text-white ${selectedView === view ? 'bg-zinc-800 hover:bg-zinc-700' : 'hover:bg-zinc-800'} rounded p-2 transition-colors duration-200`}
                            key={view}
                            onClick={() => setSelectedView(view)}
                            type='button'
                        >
                            {FRIENDLY_NAME_MAP[view]}
                        </button>
                    ))}
                    <button
                        aria-label={
                            screenSettings.darkMode ? 'Light Mode' : 'Dark Mode'
                        }
                        className={`flex aspect-square h-full items-center justify-center ${screenSettings.darkMode ? 'bg-zinc-800 hover:bg-zinc-700' : 'hover:bg-zinc-800'} cursor-pointer rounded transition-colors duration-200`}
                        onClick={() =>
                            setScreenSettings({
                                ...screenSettings,
                                darkMode: !screenSettings.darkMode,
                            })
                        }
                        type='button'
                    >
                        <svg
                            aria-label={
                                screenSettings.darkMode
                                    ? 'Light Mode'
                                    : 'Dark Mode'
                            }
                            className='h-4 w-4'
                            fill='none'
                            role='img'
                            stroke='currentColor'
                            strokeWidth={1.5}
                            viewBox='0 0 24 24'
                            xmlns='http://www.w3.org/2000/svg'
                        >
                            <path
                                d='M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z'
                                strokeLinecap='round'
                                strokeLinejoin='round'
                            />
                        </svg>
                    </button>
                </div>
            </div>
            <div className='h-[1px] w-full bg-zinc-700' />
            <div className='flex p-2'>
                <iframe
                    className='h-[480px] w-[800px] rounded-2xl'
                    ref={setIframeRef}
                    sandbox='allow-scripts'
                    src='about:blank'
                    title='Preview'
                />
            </div>
        </div>
    );
};
