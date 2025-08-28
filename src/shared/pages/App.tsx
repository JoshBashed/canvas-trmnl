import React, { type FC } from 'react';
import { BrowserRouter, Route, Routes, StaticRouter } from 'react-router';
import { Manage } from '@/shared/pages/app/Manage.tsx';
import { OauthCreate } from '@/shared/pages/app/oauth/Create.tsx';
import { Docs } from '@/shared/pages/Docs.tsx';
import { Home } from '@/shared/pages/Home.tsx';
import { NotFound } from '@/shared/pages/NotFound.tsx';

const AppRoutes = () => {
    return (
        <Routes>
            <Route element={<NotFound />} path='*' />
            <Route element={<Home />} index />
            <Route element={<Docs />} path='docs' />
            <Route element={<OauthCreate />} path='app/oauth/create' />
            <Route element={<Manage />} path='app/manage/:id' />
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
