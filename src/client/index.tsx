import React, { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import { ClientApp } from '@/shared/pages/App.tsx';
import {
    ROOT_ELEMENT_ID,
    SSR_DATA_ATTRIBUTE_NAME,
} from '@/shared/utilities/clientServerReactShared.ts';
import { createLogger } from '@/shared/utilities/loggingUtilities.ts';

const logger = createLogger('@/client/index');

document.addEventListener('DOMContentLoaded', () => {
    const root = document.getElementById(ROOT_ELEMENT_ID);
    if (!root) {
        logger.error('Root element (#%s) not found.', ROOT_ELEMENT_ID);
        return;
    }

    const app = (
        <StrictMode>
            <ClientApp />
        </StrictMode>
    );

    const didUseSSR =
        document.documentElement.getAttribute(SSR_DATA_ATTRIBUTE_NAME) ===
        'true';
    if (didUseSSR) hydrateRoot(root, app);
    else createRoot(root).render(app);
});
