import { Hono } from 'hono';
import type { z } from 'zod';
import { createConsumer } from '@/server/controllers/createConsumer.ts';
import { fetchConsumerData } from '@/server/controllers/fetchConsumerData.ts';
import { updateConsumerCanvasSettings } from '@/server/controllers/updateConsumerCanvasSettings.ts';
import {
    createRequestLogger,
    performSafeContextJsonParse,
} from '@/server/utilities/honoUtilities.ts';
import { API } from '@/shared/api/api.ts';
import {
    type ProcedureErrorResponse,
    ProcedureRequestSchema,
} from '@/shared/api/index.ts';
import {
    createLogger,
    type Logger,
} from '@/shared/utilities/loggingUtilities.ts';

const createProcedureError = (
    data: Omit<ProcedureErrorResponse, 'type'>,
): ProcedureErrorResponse => ({
    type: 'procedureError',
    ...data,
});

type ProcedureItems = {
    [Key in keyof typeof API]: (
        logger: Logger,
        data: z.infer<(typeof API)[Key]['requestSchema']>,
    ) => Promise<z.infer<(typeof API)[Key]['responseSchema']>>;
};

const HANDLERS = {
    createConsumer,
    fetchConsumerData,
    updateConsumerCanvasSettings,
} satisfies ProcedureItems;

const ids = Object.values(API).map((v) => v.id);
if (new Set(ids).size !== ids.length) {
    createLogger('@/server/api/index').fatal('Duplicate procedure IDs found.');
}

const ID_MAP = new Map(
    Object.entries(API).map(([_, value]) => [value.id, value.name] as const),
);

export const createAppApiRoutes = (): Hono => {
    const app = new Hono();

    app.post('/performAction', async (c) => {
        const logger = createRequestLogger(c);

        const [jsonResult, json] = await performSafeContextJsonParse(c);
        if (!jsonResult) {
            return c.json(
                createProcedureError({ data: 'invalidJSONObject' }),
                400,
            );
        }

        const procedureResult = ProcedureRequestSchema.safeParse(json);
        if (!procedureResult.success) {
            logger.info('Invalid procedure object.');
            return c.json(
                createProcedureError({
                    data: 'procedureSchemaValidationError',
                }),
                400,
            );
        }

        const { procedure, data } = procedureResult.data;
        const procedureName = ID_MAP.get(
            procedure as (typeof API)[keyof typeof API]['id'],
        );
        if (!procedureName) {
            logger.info("Unknown procedure '%s'.", procedure);
            return c.json(
                createProcedureError({ data: 'procedureNotFound' }),
                400,
            );
        }

        logger.info(
            "Routing to procedure '%s' (%s).",
            procedure,
            procedureName,
        );
        const procedureData = API[procedureName];

        const requestData = procedureData.requestSchema.safeParse(data);
        if (!requestData.success) {
            logger.info('Invalid request data for procedure.');
            return c.json(
                createProcedureError({ data: 'schemaValidationError' }),
                400,
            );
        }
        const handler = HANDLERS[procedureName];

        type Name = typeof procedureName;
        const typedHandler = handler as (
            logger: Logger,
            data: z.infer<(typeof API)[Name]['requestSchema']>,
        ) => Promise<z.infer<(typeof API)[Name]['responseSchema']>>;

        return c.json(await typedHandler(logger, requestData.data));
    });

    return app;
};
