import { Hono } from 'hono';
import { generate } from '@/server/trmnl/generate.tsx';
import { webhookInstall } from '@/server/trmnl/webhookInstall.ts';
import { createRequestLogger } from '@/server/utilities/honoUtilities.ts';

export const createTrmnlRoutes = (): Hono => {
    const app = new Hono();

    // Redirect routes...
    app.get('/help/', async (c) => {
        createRequestLogger(c);
        return c.redirect('/docs/');
    });
    app.get('/oauth/new/', async (c) => {
        const logger = createRequestLogger(c);

        const code = c.req.query('code');
        if (!code) {
            logger.info('Missing code.');
            return c.text('Missing code.', 400);
        }

        const callbackUrl = c.req.query('installation_callback_url');
        if (!callbackUrl) {
            logger.info('Missing installation_callback_url.');
            return c.text('Missing installation_callback_url.', 400);
        }

        return c.redirect(
            `/app/oauth/create/?code=${encodeURIComponent(code)}&callback_url=${encodeURIComponent(callbackUrl)}`,
        );
    });
    app.get('/settings/', async (c) => {
        const logger = createRequestLogger(c);

        const code = c.req.query('uuid');
        if (!code) {
            logger.info('Missing uuid.');
            return c.text('Missing uuid.', 400);
        }
        const jwt = c.req.query('jwt');
        if (!jwt) {
            logger.info('Missing jwt.');
            return c.text('Missing jwt.', 400);
        }

        return c.redirect(
            `/app/manage/${encodeURIComponent(code)}/?token=${encodeURIComponent(jwt)}`,
        );
    });

    // Webhook routes...
    app.post('/webhook/install/', webhookInstall);
    app.post('/webhook/uninstall/', webhookInstall);

    // Generate routes...
    app.post('/generate/', generate);

    return app;
};
