import crypto from 'node:crypto';
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
    const staticPath = await fsPromises.realpath(path.join(dirname, 'static'));

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
        const relativePath = path.relative(staticPath, realPath);
        if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
            logger.warn('Path traversal attempt detected: %s', staticFilePath);
            return c.notFound();
        }

        // Try to read the file.
        const [fileSuccess, file] = await tryCatch(
            fsPromises.readFile(realPath),
        );
        if (!fileSuccess) {
            logger.error('Failed to read file: %s', stringifyError(file));
            return c.notFound();
        }

        // Calculate a hash
        const hash = crypto.createHash('sha256').update(file).digest('hex');

        // Get the request header's If-None-Match.
        const ifNoneMatch = c.req.header('If-None-Match');
        if (ifNoneMatch === `"${hash}"`) {
            return c.body(null, 304);
        }

        // Get the extension of the file.
        const contentType = mime.lookup(filePath) || 'application/octet-stream';
        return c.body(new Uint8Array(file), {
            headers: {
                'Content-Type': contentType,
                ETag: `"${hash}"`,
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
