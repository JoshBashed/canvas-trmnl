import React, { StrictMode } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { ClientApp } from '@/shared/pages/App.tsx';
import { createLogger } from '@/shared/utilities/loggingUtilities.ts';
import { ROOT_ELEMENT_ID } from '@/shared/utilities/rootElementId.ts';

const logger = createLogger('@/client/index');

document.addEventListener('DOMContentLoaded', () => {
    const root = document.getElementById(ROOT_ELEMENT_ID);
    if (!root) {
        logger.error('Root element (#%s) not found.', ROOT_ELEMENT_ID);
        return;
    }

    hydrateRoot(
        root,
        <StrictMode>
            <ClientApp />
        </StrictMode>,
    );
});
