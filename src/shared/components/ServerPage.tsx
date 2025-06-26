import React, { type FC, type ReactNode } from 'react';

interface ServerPageProps {
    title: string;
    head?: ReactNode;
    children: ReactNode;
}

export const ServerPage: FC<ServerPageProps> = ({ title, head, children }) => {
    return (
        <html lang='en' className='m-0 h-full w-full'>
            <head>
                <meta charSet='UTF-8' />
                <meta
                    name='viewport'
                    content='width=device-width, initial-scale=1.0'
                />
                <title>{`${title} - Canvas-TRMNL`}</title>
                <link rel='stylesheet' href='/static/styles.css' />
                <link rel='icon' href='/static/favicon.svg' />
                <link rel='preconnect' href='https://fonts.googleapis.com' />
                <link
                    rel='preconnect'
                    href='https://fonts.gstatic.com'
                    crossOrigin='anonymous'
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
                id='app'
            >
                {children}
            </body>
        </html>
    );
};
