import React, { type FC, type ReactNode, useEffect, useState } from 'react';
import { ROOT_ELEMENT_ID } from '@/shared/utilities/rootElementId.ts';

const isServer = typeof window === 'undefined';

interface PageProps {
    title: string;
    children: ReactNode;
    enableSSR?: boolean;
    statusCode?: number;
}

export const Page: FC<PageProps> = (props) => {
    const ssr = props.enableSSR ?? true;
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        setMounted(true);
    }, []);

    if (isServer)
        return ssr ? (
            <ServerPage {...props} />
        ) : (
            <ServerPage {...props}>{null}</ServerPage>
        );

    if (!mounted && !ssr) return null;
    return <ClientPage {...props} />;
};

const ServerPage: FC<PageProps> = ({ title, children, statusCode }) => {
    return (
        <html
            className='m-0 h-full w-full'
            data-status-code={statusCode ?? 200}
            lang='en'
        >
            <head>
                <meta charSet='UTF-8' />
                <meta
                    content='width=device-width, initial-scale=1.0'
                    name='viewport'
                />
                <title>{`${title}`}</title>
                <link href='/static/styles.css' rel='stylesheet' />
                <link href='/static/favicon.svg' rel='icon' />
                <link href='https://fonts.googleapis.com' rel='preconnect' />
                <link
                    crossOrigin='anonymous'
                    href='https://fonts.gstatic.com'
                    rel='preconnect'
                />
                <link
                    href='https://fonts.googleapis.com/css2?family=Merriweather:ital,opsz,wght@0,18..144,300..900;1,18..144,300..900&family=Space+Grotesk:wght@300..700&display=swap'
                    rel='stylesheet'
                />
                <script src='/static/index.js' />
            </head>
            <body
                className='m-0 h-full w-full bg-zinc-950 text-zinc-50'
                id={ROOT_ELEMENT_ID}
            >
                {children}
            </body>
        </html>
    );
};

const ClientPage: FC<PageProps> = ({ title, children }) => {
    useEffect(() => {
        document.title = title;
    }, [title]);

    return children;
};
