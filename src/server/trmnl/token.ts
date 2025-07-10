import { eq } from 'drizzle-orm';
import type { db } from '@/server/db/index.ts';
import { trmnlAuthorizationTokens } from '@/server/db/schema.ts';
import {
    createLogger,
    type Logger,
} from '@/shared/utilities/loggingUtilities.ts';
import { stringifyError, tryCatch } from '@/shared/utilities/tryCatch.ts';

export const verifyAccessToken = async (
    accessToken: string,
    database: typeof db,
    logger: Logger = createLogger('@/server/utilities/token'),
): Promise<[true, string] | [false, undefined]> => {
    const db = database;
    const authHeader = accessToken.trim();

    const token = authHeader.startsWith('Bearer ')
        ? authHeader.slice('Bearer '.length)
        : authHeader;

    const [querySuccess, query] = await tryCatch(
        db
            .select()
            .from(trmnlAuthorizationTokens)
            .where(eq(trmnlAuthorizationTokens.token, token)),
    );
    if (!querySuccess) {
        logger.error(
            'Database query failed while verifying token: %s',
            stringifyError(query),
        );
        return [false, undefined];
    }

    if (query.length === 0) {
        logger.info('Invalid token provided.');
        return [false, undefined];
    }

    return [true, token];
};
