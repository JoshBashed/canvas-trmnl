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
import type { Logger } from '@/shared/utilities/loggingUtilities.ts';

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

const DATA = {
    createConsumer,
    fetchConsumerData,
    updateConsumerCanvasSettings,
} satisfies ProcedureItems;

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
        if (!(procedure in API)) {
            logger.info("Unknown procedure '%s'.", procedure);
            return c.json(
                createProcedureError({ data: 'procedureNotFound' }),
                400,
            );
        }

        logger.info("Handled by procedure '%s'.", procedure);
        const procedureKey = procedure as keyof typeof API;
        const procedureData = API[procedureKey];

        const requestData = procedureData.requestSchema.safeParse(data);
        if (!requestData.success) {
            logger.info('Invalid request data for procedure.');
            return c.json(
                createProcedureError({ data: 'schemaValidationError' }),
                400,
            );
        }
        const handler = DATA[procedureKey];

        type Grouped<T extends keyof typeof API> = {
            requestSchema: (typeof API)[T]['requestSchema'];
            handler: (
                logger: Logger,
                data: z.infer<(typeof API)[T]['requestSchema']>,
            ) => Promise<z.infer<(typeof API)[T]['responseSchema']>>;
        };
        const grouped: Grouped<typeof procedureKey> = {
            handler: handler as (
                logger: Logger,
                data: z.infer<
                    (typeof API)[typeof procedureKey]['requestSchema']
                >,
            ) => Promise<
                z.infer<(typeof API)[typeof procedureKey]['responseSchema']>
            >,
            requestSchema: procedureData.requestSchema,
        };

        return c.json(await grouped.handler(logger, requestData.data));
    });

    return app;
};
