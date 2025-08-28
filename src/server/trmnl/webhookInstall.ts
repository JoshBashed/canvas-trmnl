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

const WebhookInstallSchema = z.object({
    user: z.object({
        email: z.email(),
        first_name: z.string(),
        last_name: z.string(),
        locale: z.string(),
        name: z.string(),
        plugin_setting_id: z.number(),
        time_zone: z.string(),
        time_zone_iana: z.string(),
        utc_offset: z.number(),
        uuid: z.uuid(),
    }),
});

export const webhookInstall = async (c: Context) => {
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
    const [jsonResult, json] = await performSafeContextJsonParse(c);
    if (!jsonResult) {
        logger.info('Invalid JSON body.');
        return c.text('Invalid JSON body.', 400);
    }

    const parsedBody = WebhookInstallSchema.safeParse(json);
    if (!parsedBody.success) {
        logger.info('Invalid request body schema.', parsedBody.error);
        return c.text('Invalid request body schema.', 400);
    }
    const { user } = parsedBody.data;

    // Check of the consumer exists.
    const [trmnlDataQueryResult, trmnlDataQuery] = await tryCatch(
        db.select().from(trmnlData).where(eq(trmnlData.trmnlId, user.uuid)),
    );
    if (!trmnlDataQueryResult) {
        logger.error(
            'Failed to query db for consumer: %s',
            stringifyError(trmnlDataQueryResult),
        );
        return c.text('Internal server error.', 500);
    }

    if (trmnlDataQuery.length !== 0) {
        logger.warn('Consumer already exists with UUID: %s', user.uuid);
        return c.text('Consumer already exists.', 400);
    }

    // Insert the consumer and it's settings.
    const [insertResult, insert] = await tryCatch(
        db.transaction(async (tx) => {
            const [consumerInsertResult, consumerInsert] = await tryCatch(
                tx.insert(consumers).values({}).returning(),
            );
            if (!consumerInsertResult) {
                logger.error(
                    'Failed to insert consumer: %s',
                    stringifyError(consumerInsert),
                );
                tx.rollback();
                return;
            }
            if (consumerInsert.length === 0) {
                logger.error('Consumer insert returned no data.');
                tx.rollback();
                return;
            }
            const consumer = consumerInsert[0];

            const [trmnlDataInsertResult, trmnlDataInsert] = await tryCatch(
                tx.insert(trmnlData).values({
                    consumerId: consumer.id,
                    email: user.email,
                    name: user.name,
                    settingsId: user.plugin_setting_id,
                    trmnlId: user.uuid,
                }),
            );
            if (!trmnlDataInsertResult) {
                logger.error(
                    'Failed to insert trmnlData: %s',
                    stringifyError(trmnlDataInsert),
                );
                tx.rollback();
                return;
            }

            const [tokenUpdateResult, tokenUpdate] = await tryCatch(
                tx
                    .update(trmnlAuthorizationTokens)
                    .set({ used: true })
                    .where(eq(trmnlAuthorizationTokens.token, token)),
            );
            if (!tokenUpdateResult) {
                logger.error(
                    'Failed to update trmnlAuthorizationTokens: %s',
                    stringifyError(tokenUpdate),
                );
                tx.rollback();
                return;
            }
        }),
    );
    if (!insertResult) {
        logger.error(
            'Failed to insert consumer and trmnlData: %s',
            stringifyError(insert),
        );
        return c.text('Internal server error.', 500);
    }

    logger.info('Consumer and trmnlData inserted successfully.');
    return c.text('Operation completed successfully.', 200);
};
