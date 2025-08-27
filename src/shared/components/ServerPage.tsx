import React, { type FC, type ReactNode } from 'react';

const MOUNT_ID = 'app';

interface ServerPageProps {
    title: string;
    head?: ReactNode;
    children: ReactNode;
}

export const ServerPage: FC<ServerPageProps> = ({ title, head, children }) => {
    return (
        <html className='m-0 h-full w-full' lang='en'>
            <head>
                <meta charSet='UTF-8' />
                <meta
                    content='width=device-width, initial-scale=1.0'
                    name='viewport'
                />
                <title>{`${title} - Canvas-TRMNL`}</title>
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
                {head}
            </head>
            <body
                className='m-0 h-full w-full bg-zinc-950 text-zinc-50'
                id={MOUNT_ID}
            >
                {children}
            </body>
        </html>
    );
};
