import { getConnInfo } from '@hono/node-server/conninfo';
import type { Context } from 'hono';
import qs from 'qs';
import { appEnv } from '@/server/appEnv.ts';
import { createLogger } from '@/shared/utilities/loggingUtilities.ts';
import { tryCatch } from '@/shared/utilities/tryCatch.ts';

export const performSafeContextJsonParse = async (
    c: Context,
): Promise<[true, unknown] | [false, 'invalidText' | 'invalidJson']> => {
    const [textResult, text] = await tryCatch(c.req.text());
    if (!textResult) return [false, 'invalidText'];

    try {
        const json = JSON.parse(text as string);
        return [true, json];
    } catch {
        return [false, 'invalidJson'];
    }
};

export const performSafeContextFormBodyParse = async (
    c: Context,
): Promise<
    [true, unknown] | [false, 'textDecodeError' | 'invalidQueryString']
> => {
    const [textResult, text] = await tryCatch(c.req.text());
    if (!textResult) return [false, 'textDecodeError'];

    try {
        const parsed = qs.parse(text as string);
        return [true, parsed];
    } catch {
        return [false, 'invalidQueryString'];
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
