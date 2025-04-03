import { fetchTrmnlOAuthToken } from '@/server/apiClients/trmnlApiClient.ts';
import { appEnv } from '@/server/appEnv.ts';
import { db } from '@/server/db/index.ts';
import {
    canvasTokens,
    trmnlAuthorizationTokens,
    trmnlData,
} from '@/server/db/schema.ts';
import { preformSafeContextJsonParse } from '@/server/utilities/honoUtilities.ts';
import {
    CreateConsumerRequestId,
    CreateConsumerRequestSchema,
    type CreateConsumerResponseSchema,
    type GlobalErrorResponse,
    GlobalRequestSchema,
    UpdateCanvasDataRequestId,
    UpdateCanvasDataRequestSchema,
    type UpdateCanvasDataResponseSchema,
} from '@/shared/apiTypes.ts';
import { createLogger } from '@/shared/utilities/loggingUtilities.ts';
import { eq } from 'drizzle-orm';
import { Hono } from 'hono';
import type { ZodType, z } from 'zod';

const logger = createLogger('@/server/apiController');

const createGlobalError = (
    data: Omit<GlobalErrorResponse, 'type'>,
): GlobalErrorResponse => ({
    type: 'globalError',
    ...data,
});

interface RouteData<Request extends ZodType, Response extends ZodType> {
    requestSchema: Request;
    procedure: (data: z.infer<Request>) => Promise<z.infer<Response>>;
}

const createConsumer: RouteData<
    typeof CreateConsumerRequestSchema,
    typeof CreateConsumerResponseSchema
> = {
    requestSchema: CreateConsumerRequestSchema,
    procedure: async (data) => {
        // Make a request to the external API.
        const [tokenSuccess, token, reason] = await fetchTrmnlOAuthToken({
            code: data.code,
            clientId: appEnv.trmnl.clientId,
            clientSecret: appEnv.trmnl.clientSecret,
            grantType: 'authorization_code',
        });

        if (!tokenSuccess) {
            logger.info(
                'Failed to fetch token from Trmnl: %s',
                reason ?? token,
            );
            return {
                type: 'error',
                error: 'trmnlError',
            };
        }

        // Create a key for the auth token.
        const insertResult = await db
            .insert(trmnlAuthorizationTokens)
            .values({
                token: token.access_token,
            })
            .onConflictDoNothing()
            .execute()
            .then(() => true)
            .catch((error) => {
                logger.error(
                    'Failed to insert token into database: %s',
                    error instanceof Error ? error.message : error,
                );
                return false;
            });

        if (!insertResult)
            return {
                type: 'error',
                error: 'databaseInsertError',
            };

        return {
            type: 'success',
        };
    },
};

const updateCanvasData: RouteData<
    typeof UpdateCanvasDataRequestSchema,
    typeof UpdateCanvasDataResponseSchema
> = {
    requestSchema: UpdateCanvasDataRequestSchema,
    procedure: async (data) => {
        // Match the trmnlId to the consumer token.
        const [trmnlDataQuerySuccess, trmnlDataQuery]:
            | [true, Array<typeof trmnlData.$inferSelect>]
            | [false, undefined] = await db
            .select()
            .from(trmnlData)
            .where(eq(trmnlData.trmnlId, data.trmnlId))
            .execute()
            .then(
                (result) =>
                    [true, result] as [
                        true,
                        Array<typeof trmnlData.$inferSelect>,
                    ],
            )
            .catch((error) => {
                logger.error(
                    'Failed to query trmnl data while updating canvas data: %s',
                    error instanceof Error ? error.message : error,
                );
                return [false, undefined] as const;
            });

        if (!trmnlDataQuerySuccess) {
            return {
                type: 'error',
                error: 'databaseQueryError',
            };
        }

        if (trmnlDataQuery.length === 0) {
            return {
                type: 'error',
                error: 'consumerNotFoundError',
            };
        }

        const trmnlDataRow = trmnlDataQuery[0];

        // Get the base URL from the canvas server.
        let canvasServerUrl: URL;
        try {
            canvasServerUrl = new URL(data.canvasServer);
        } catch (error) {
            logger.info(
                'Received invalid URL while updating canvas data: %s',
                String(error instanceof Error ? error.message : error),
            );
            return {
                type: 'error',
                error: 'invalidUrlError',
            };
        }

        // Update the canvas data.
        const insertResult = await db
            .insert(canvasTokens)
            .values({
                consumerId: trmnlDataRow.consumerId,
                canvasServer: canvasServerUrl.hostname,
                canvasToken: data.canvasAccessToken,
            })
            .onConflictDoUpdate({
                target: canvasTokens.consumerId,
                set: {
                    canvasServer: canvasServerUrl.hostname,
                    canvasToken: data.canvasAccessToken,
                },
            })
            .execute()
            .then(() => true)
            .catch((error) => {
                logger.error(
                    'Failed to insert canvas data into database: %s',
                    error instanceof Error ? error.message : error,
                );
                return false;
            });
        if (!insertResult) {
            return {
                type: 'error',
                error: 'databaseInsertError',
            };
        }

        // Done :)
        return {
            type: 'success',
            trmnlSettingsId: trmnlDataRow.settingsId,
        };
    },
};

const PROCEDURES: Record<
    z.infer<typeof GlobalRequestSchema>['procedure'],
    RouteData<z.ZodType, z.ZodType>
> = {
    [CreateConsumerRequestId]: createConsumer,
    [UpdateCanvasDataRequestId]: updateCanvasData,
} as const;

export const createAppApiRoutes = (): Hono => {
    const app = new Hono();

    app.post('/performAction', async (c) => {
        const [jsonSuccess, json] = await preformSafeContextJsonParse(c);
        if (!jsonSuccess) {
            return c.json(createGlobalError({ error: 'jsonParseError' }), 400);
        }

        const globalSchemaResult = GlobalRequestSchema.safeParse(json);
        if (!globalSchemaResult.success) {
            return c.json(
                createGlobalError({
                    error: 'globalSchemaValidationError',
                    message: globalSchemaResult.error.message,
                }),
            );
        }

        const { procedure, data } = globalSchemaResult.data;

        const handler = PROCEDURES[procedure];

        const handlerSchemaResult = handler.requestSchema.safeParse(data);
        if (!handlerSchemaResult.success) {
            return c.json(
                createGlobalError({
                    error: 'procedureSchemaValidationError',
                    message: handlerSchemaResult.error.message,
                }),
            );
        }

        const handlerResult = await handler.procedure(data);

        return c.json(handlerResult);
    });

    return app;
};
