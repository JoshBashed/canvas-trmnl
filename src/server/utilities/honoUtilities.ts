import type { Context } from 'hono';

export const preformSafeContextJsonParse = async (
    c: Context,
): Promise<[true, unknown] | [false, undefined]> => {
    try {
        const json = await c.req.json();
        return [true, json];
    } catch (error) {
        return [false, undefined];
    }
};

export const preformSafeContextBodyParse = async (
    c: Context,
): Promise<[true, unknown] | [false, undefined]> => {
    try {
        const body = await c.req.parseBody();
        return [true, body];
    } catch (error) {
        return [false, undefined];
    }
};
