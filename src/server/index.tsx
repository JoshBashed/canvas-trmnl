import fsPromises from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import mime from 'mime-types';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { createAppApiRoutes } from '@/server/api/index.ts';
import { appEnv } from '@/server/appEnv.ts';
import { createTrmnlRoutes } from '@/server/trmnl/index.ts';
import { createRequestLogger } from '@/server/utilities/honoUtilities.ts';
import { ServerApp } from '@/shared/pages/App.tsx';
import { createLogger } from '@/shared/utilities/loggingUtilities.ts';
import { stringifyError, tryCatch } from '@/shared/utilities/tryCatch.ts';

const logger = createLogger('@/server/index');

const main = async () => {
    // Get the static directory.
    const dirname = path.dirname(fileURLToPath(import.meta.url));
    const staticPath = path.join(dirname, 'static');

    logger.info('Starting server...');
    const app = new Hono();

    app.get('/', async (c) => {
        return c.redirect('/app');
    });

    // Serve the app.
    app.get('/app/*', async (c) => {
        // Render the react app.
        const html = renderToString(
            <ServerApp pageName='App' url={c.req.path} />,
        );

        return c.html(html, {
            headers: {
                'Content-Type': 'text/html',
            },
        });
    });

    // Serve static files
    app.get('/static/*', async (c) => {
        const logger = createRequestLogger(c);
        const staticFilePath = c.req.path.replace('/static/', '');
        const filePath = path.resolve(path.join(staticPath, staticFilePath));

        // Resolve the file path to the absolute path.
        const [realPathSuccess, realPath] = await tryCatch(
            fsPromises.realpath(filePath),
        );
        if (!realPathSuccess) {
            logger.error(
                'Failed to resolve file path: %s',
                stringifyError(realPath),
            );
            return c.notFound();
        }

        // Ensure the file is within the static directory.
        if (!realPath.startsWith(staticPath)) {
            logger.warn('Path traversal attempt detected: %s', staticFilePath);
            return c.notFound();
        }

        // Check if the file exists.
        const [fileExistsSuccess, fileExists] = await tryCatch(
            fsPromises.access(realPath),
        );
        if (!fileExistsSuccess) {
            logger.error('File not found: %s', stringifyError(fileExists));
            return c.notFound();
        }

        // Get the extension of the file.
        const contentType = mime.lookup(filePath);
        const fileBuffer = await fsPromises.readFile(realPath);
        return c.body(new Uint8Array(fileBuffer), {
            headers: {
                'Content-Type':
                    contentType === false
                        ? 'application/octet-stream'
                        : contentType,
            },
        });
    });

    app.route('/trmnl', createTrmnlRoutes());
    app.route('/api', createAppApiRoutes());

    serve({
        fetch: app.fetch,
        port: appEnv.port,
    });

    logger.info(`Server started on http://127.0.0.1:${appEnv.port}/.`);
};

main();
