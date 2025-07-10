import { getConnInfo } from '@hono/node-server/conninfo';
import type { Context } from 'hono';
import { appEnv } from '@/server/appEnv.ts';
import { createLogger } from '@/shared/utilities/loggingUtilities.ts';

export const performSafeContextJsonParse = async (
    c: Context,
): Promise<[true, unknown] | [false, undefined]> => {
    try {
        const json = await c.req.json();
        return [true, json];
    } catch (_error) {
        return [false, undefined];
    }
};

export const performSafeContextBodyParse = async (
    c: Context,
): Promise<[true, unknown] | [false, undefined]> => {
    try {
        const body = await c.req.parseBody();
        return [true, body];
    } catch (_error) {
        return [false, undefined];
    }
};

export const createRequestLogger = (c: Context) => {
    const ip =
        (!appEnv.dev ? c.req.header('x-forwarded-for') : undefined) ||
        getConnInfo(c).remote.address ||
        'unknown';
    const uuid = crypto.randomUUID();
    const logger = createLogger(`[r:${uuid}]`);
    logger.info("Request from '%s' to '%s'.", ip, c.req.path);

    return logger;
};
