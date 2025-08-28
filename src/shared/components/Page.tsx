import React, { type FC, type ReactNode, useEffect } from 'react';
import {
    ROOT_ELEMENT_ID,
    SSR_DATA_ATTRIBUTE_NAME,
} from '@/shared/utilities/clientServerReactShared.ts';

interface PageProps {
    title: string;
    description: string;
    children: ReactNode;
    enableSSR?: boolean;
    statusCode?: number;
}

interface ProvidedPageProps {
    title: string;
    description: string;
    children: ReactNode;
    enableSSR: boolean;
    statusCode: number;
}

export const Page: FC<PageProps> = (props) => {
    const isServer = typeof window === 'undefined';
    const ssr = props.enableSSR ?? true;
    const statusCode = props.statusCode ?? 200;
    const propsData: ProvidedPageProps = {
        children: props.children,
        description: props.description,
        enableSSR: ssr,
        statusCode: statusCode,
        title: props.title,
    };

    if (isServer)
        return ssr ? (
            <ServerPage {...propsData} />
        ) : (
            <ServerPage {...propsData}>{null}</ServerPage>
        );

    return <ClientPage {...propsData} />;
};

const ServerPage: FC<ProvidedPageProps> = ({
    title,
    description,
    children,
    statusCode,
    enableSSR,
}) => {
    return (
        <html
            className='m-0 h-full w-full'
            data-status-code={statusCode ?? 200}
            lang='en'
            {...{
                [SSR_DATA_ATTRIBUTE_NAME]: enableSSR ? 'true' : 'false',
            }}
        >
            <head>
                <meta charSet='UTF-8' />
                <meta
                    content='width=device-width, initial-scale=1.0'
                    name='viewport'
                />
                <link href='https://fonts.googleapis.com' rel='preconnect' />
                <link as='style' href='/assets/styles.css' rel='preload' />
                <link as='script' href='/assets/index.js' rel='preload' />
                <link
                    crossOrigin='anonymous'
                    href='https://fonts.gstatic.com'
                    rel='preconnect'
                />
                <title>{`${title}`}</title>
                <meta content={description} name='description' />
                <link href='/assets/styles.css' rel='stylesheet' />
                <link href='/favicon.svg' rel='icon' />
                <link
                    href='https://fonts.googleapis.com/css2?family=Merriweather:ital,opsz,wght@0,18..144,300..900;1,18..144,300..900&family=Space+Grotesk:wght@300..700&display=swap'
                    rel='stylesheet'
                />
                <script defer src='/assets/index.js' />
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

const ClientPage: FC<ProvidedPageProps> = ({ title, children }) => {
    useEffect(() => {
        document.title = title;
    }, [title]);

    return children;
};
