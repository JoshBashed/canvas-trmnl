import React, { type FC } from 'react';
import { BrowserRouter, Route, Routes, StaticRouter } from 'react-router';
import { ServerPage } from '@/shared/components/ServerPage.tsx';
import { Help } from '@/shared/pages/Help.tsx';
import { Home } from '@/shared/pages/Home.tsx';
import { Manage } from '@/shared/pages/Manage.tsx';
import { NotFound } from '@/shared/pages/NotFound.tsx';
import { OauthCreate } from '@/shared/pages/oauth/Create.tsx';

const AppRoutes = () => {
    return (
        <Routes>
            <Route element={<NotFound />} path='*' />
            <Route path='app'>
                <Route element={<Home />} index />
                <Route element={<Help />} path='help' />
                <Route path='oauth'>
                    <Route element={<OauthCreate />} path='create' />
                </Route>
                <Route element={<Manage />} path='manage/:id' />
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
