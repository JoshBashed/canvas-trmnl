import crypto from 'node:crypto';
import fsPromises from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import mime from 'mime-types';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { createAppApiRoutes } from '@/server/api/index.ts';
import { appEnv } from '@/server/appEnv.ts';
import { createDevRoutes } from '@/server/dev/index.tsx';
import { createTrmnlRoutes } from '@/server/trmnl/index.ts';
import { createRequestLogger } from '@/server/utilities/honoUtilities.ts';
import { ServerApp } from '@/shared/pages/App.tsx';
import { createLogger } from '@/shared/utilities/loggingUtilities.ts';
import { stringifyError, tryCatch } from '@/shared/utilities/tryCatch.ts';

const logger = createLogger('@/server/server');

const STATUS_CODE_START = 'data-status-code="';
const STATUS_CODE_END = '"';
const CONTENTLESS_STATUS_CODES = [101, 204, 205, 304];

export const serverMain = async () => {
    // Get the static directory.
    const dirname = path.dirname(fileURLToPath(import.meta.url));
    const staticPath = await fsPromises.realpath(path.join(dirname, 'static'));

    logger.info('Starting server...');
    const app = new Hono();

    app.get('/*', async (c, next) => {
        const logger = createRequestLogger(c);
        const staticFilePath = c.req.path;
        const filePath = path.resolve(path.join(staticPath, staticFilePath));

        // Resolve the file path to the absolute path.
        const [realPathSuccess, realPath] = await tryCatch(
            fsPromises.realpath(filePath),
        );
        if (!realPathSuccess) return await next();

        // Ensure the file is within the static directory.
        const relativePath = path.relative(staticPath, realPath);
        if (relativePath.startsWith('..') || path.isAbsolute(relativePath))
            return await next();

        // Ensure the file exists.
        const [fileStatSuccess, fileStat] = await tryCatch(
            fsPromises.stat(realPath),
        );
        if (!fileStatSuccess || !fileStat.isFile()) return await next();

        // Try to read the file.
        const [fileSuccess, file] = await tryCatch(
            fsPromises.readFile(realPath),
        );
        if (!fileSuccess) {
            logger.error('Failed to read file: %s', stringifyError(file));
            return await next();
        }

        // Calculate a hash
        const hash = crypto.createHash('sha256').update(file).digest('hex');

        // Get the request header's If-None-Match.
        const ifNoneMatch =
            c.req
                .header('If-None-Match')
                ?.split(',')
                .map((etag) => etag.trim()) ?? [];
        if (ifNoneMatch.includes(`"${hash}"`)) {
            return c.body(null, 304);
        }

        // Determine content type.
        const contentType = mime.lookup(filePath) || 'application/octet-stream';
        return c.body(new Uint8Array(file), {
            headers: {
                'Content-Type': contentType,
                ETag: `"${hash}"`,
                'X-Content-Type-Options': 'nosniff',
            },
        });
    });

    app.route('/trmnl', createTrmnlRoutes());
    app.route('/api', createAppApiRoutes());
    if (appEnv.dev) app.route('/dev', createDevRoutes());

    // Serve the app.
    app.get('/*', async (c) => {
        // Render the react app.
        const html = renderToString(
            <ServerApp pageName='App' url={c.req.path} />,
        );
        let statusCode = 200;
        const statusCodeStartIndex = html.indexOf(STATUS_CODE_START);
        const statusCodeEndIndex = html.indexOf(
            STATUS_CODE_END,
            statusCodeStartIndex + STATUS_CODE_START.length,
        );
        if (statusCodeStartIndex !== -1 && statusCodeEndIndex !== -1) {
            const statusCodeString = html.substring(
                statusCodeStartIndex + STATUS_CODE_START.length,
                statusCodeEndIndex,
            );
            const parsedStatusCode = parseInt(statusCodeString, 10);
            // Ensure the status code is within the valid range.
            if (
                !Number.isNaN(parsedStatusCode) &&
                parsedStatusCode >= 100 &&
                parsedStatusCode <= 599 &&
                !CONTENTLESS_STATUS_CODES.includes(parsedStatusCode)
            ) {
                statusCode = parsedStatusCode;
            }
        }

        return c.html(`<!DOCTYPE html>${html}`, {
            headers: {
                'Content-Security-Policy':
                    "script-src 'self'; object-src 'self'; base-uri 'self'; frame-ancestors 'none';",
                'Content-Type': 'text/html',
                'Cross-Origin-Opener-Policy': 'same-origin',
                'Strict-Transport-Security':
                    'max-age=31536000; includeSubDomains; preload',
            },
            status: statusCode as ContentfulStatusCode,
        });
    });

    serve({
        fetch: app.fetch,
        port: appEnv.port,
    });

    logger.info(`Server started on http://127.0.0.1:${appEnv.port}/.`);
};
