import { eq } from 'drizzle-orm';
import type { Context } from 'hono';
import { z } from 'zod';
import { db } from '@/server/db/index.ts';
import {
    consumers,
    trmnlAuthorizationTokens,
    trmnlData,
} from '@/server/db/schema.ts';
import { verifyAccessToken } from '@/server/trmnl/token.ts';
import {
    createRequestLogger,
    performSafeContextJsonParse,
} from '@/server/utilities/honoUtilities.ts';
import { stringifyError, tryCatch } from '@/shared/utilities/tryCatch.ts';

const WebhookUninstallSchema = z.object({
    user_uuid: z.uuid(),
});

export const webhookUninstall = async (c: Context) => {
    const logger = createRequestLogger(c);
    const authHeader = c.req.header('Authorization');
    if (!authHeader) {
        logger.info('Missing Authorization header.');
        return c.text('Missing Authorization header.', 401);
    }

    const [tokenResult, token] = await verifyAccessToken(authHeader, db);
    if (!tokenResult) {
        logger.info('Invalid token.');
        return c.text('Invalid token.', 401);
    }

    // Parse and validate the request body
    const [jsonResult, body] = await performSafeContextJsonParse(c);
    if (!jsonResult) {
        logger.info('Invalid JSON body.');
        return c.text('Invalid JSON body.', 400);
    }

    const parsedBody = WebhookUninstallSchema.safeParse(body);
    if (!parsedBody.success) {
        logger.info('Invalid request body schema.', parsedBody.error);
        return c.text('Invalid request body schema.', 400);
    }
    const userId = parsedBody.data.user_uuid;

    // Check of the consumer exists.
    const [trmnlDataQueryResult, trmnlDataQuery] = await tryCatch(
        db.select().from(trmnlData).where(eq(trmnlData.trmnlId, userId)),
    );
    if (!trmnlDataQueryResult) {
        logger.error(
            'Failed to query db for trmnlData: %s',
            stringifyError(trmnlDataQueryResult),
        );
        return c.text('Internal server error.', 500);
    }
    if (trmnlDataQuery.length === 0) {
        logger.warn('TrmnlData does not exist for userId: %s', userId);
        return c.text('Missing data.', 400);
    }

    const consumerId = trmnlDataQuery[0].consumerId;

    // Insert the consumer and it's settings.
    const [deleteDataResult, deleteData] = await tryCatch(
        db.transaction(async (tx) => {
            const [consumerDeleteResult, consumerDelete] = await tryCatch(
                tx.delete(consumers).where(eq(consumers.id, consumerId)),
            );
            if (!consumerDeleteResult) {
                logger.error(
                    'Failed to delete consumer: %s',
                    stringifyError(consumerDelete),
                );
                tx.rollback();
            }

            const [deleteTokenResult, deleteToken] = await tryCatch(
                tx
                    .delete(trmnlAuthorizationTokens)
                    .where(eq(trmnlAuthorizationTokens.token, token)),
            );
            if (!deleteTokenResult) {
                logger.error(
                    'Failed to delete authorization token: %s',
                    stringifyError(deleteToken),
                );
                tx.rollback();
            }
        }),
    );

    if (!deleteDataResult) {
        logger.error(
            'Failed to delete consumer data: %s',
            stringifyError(deleteData),
        );
        return c.text('Internal server error.', 500);
    }

    logger.info('Successfully uninstalled consumer with userId: %s', userId);
    return c.text('Operation completed successfully.', 200);
};
