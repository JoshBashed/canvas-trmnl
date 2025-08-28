import React, { type FC } from 'react';
import { BrowserRouter, Route, Routes, StaticRouter } from 'react-router';
import { Docs } from '@/shared/pages/Docs.tsx';
import { Home } from '@/shared/pages/Home.tsx';
import { Manage } from '@/shared/pages/Manage.tsx';
import { NotFound } from '@/shared/pages/NotFound.tsx';
import { OauthCreate } from '@/shared/pages/oauth/Create.tsx';

const AppRoutes = () => {
    return (
        <Routes>
            <Route element={<NotFound />} path='*' />
            <Route element={<Home />} index />
            <Route element={<Docs />} path='docs' />
            <Route path='oauth'>
                <Route element={<OauthCreate />} path='create' />
            </Route>
            <Route element={<Manage />} path='manage/:id' />
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
        <StaticRouter location={url}>
            <AppRoutes />
        </StaticRouter>
    );
};
