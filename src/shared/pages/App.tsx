import { ServerPage } from '@/shared/components/ServerPage.tsx';
import { Home } from '@/shared/pages/Home.tsx';
import { Help } from '@/shared/pages/Help.tsx';
import { NotFound } from '@/shared/pages/NotFound.tsx';
import { Manage } from '@/shared/pages/Manage.tsx';
import { OauthCreate } from '@/shared/pages/oauth/Create.tsx';
import React, { type FC } from 'react';
import { BrowserRouter, Route, Routes, StaticRouter } from 'react-router';

const AppRoutes = () => {
    return (
        <Routes>
            <Route path='*' element={<NotFound />} />
            <Route path='app'>
                <Route index element={<Home />} />
                <Route path='help' element={<Help />} />
                <Route path='oauth'>
                    <Route path='create' element={<OauthCreate />} />
                </Route>
                <Route path='manage/:id' element={<Manage />} />
            </Route>
        </Routes>
    );
};

export const ClientApp: FC = () => {
    return (
        <BrowserRouter>
            <AppRoutes />
        </BrowserRouter>
    );
};

export const ServerApp: FC<{ url: string; pageName: string }> = ({ url }) => {
    return (
        <ServerPage title='App'>
            <StaticRouter location={url}>
                <AppRoutes />
            </StaticRouter>
        </ServerPage>
    );
};
