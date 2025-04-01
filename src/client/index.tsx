import { ClientApp } from '@/shared/pages/App.tsx';
import { createLogger } from '@/shared/utilities/loggingUtilities.ts';
import React, { StrictMode } from 'react';
import { hydrateRoot } from 'react-dom/client';

const logger = createLogger('@/client/index');

document.addEventListener('DOMContentLoaded', () => {
    const root = document.getElementById('app');
    if (!root) {
        logger.error('Root element not found');
        return;
    }

    hydrateRoot(
        root,
        <StrictMode>
            <ClientApp />
        </StrictMode>,
    );
});
