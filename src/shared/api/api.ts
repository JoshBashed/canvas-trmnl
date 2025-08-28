import { z } from 'zod';
import { CREATE_PROCEDURE, CREATE_RESULT } from '@/shared/api/index.ts';

const CreateConsumer = CREATE_PROCEDURE({
    id: 'bac379d4-a5be-4de7-835a-9ac8c1b6c48d',
    name: 'createConsumer',
    requestSchema: z.object({
        code: z.string(),
    }),
    responseSchema: CREATE_RESULT(
        z.null(),
        z.enum(['trmnlError', 'databaseInsertError']),
    ),
});

const FetchConsumerData = CREATE_PROCEDURE({
    id: '776eee94-2de5-44cb-bbed-1e1f65a68d73',
    name: 'fetchConsumerData',
    requestSchema: z.object({
        authToken: z.string(),
        trmnlId: z.uuid(),
    }),
    responseSchema: CREATE_RESULT(
        z.object({
            name: z.string(),
            settingsId: z.number(),
            trmnlId: z.uuid(),
        }),
        z.enum([
            'authenticationError',
            'authorizationError',
            'consumerNotFoundError',
            'databaseQueryError',
        ]),
    ),
});

const UpdateConsumerCanvasSettings = CREATE_PROCEDURE({
    id: 'e6d25226-fc23-45b9-bbd7-4e74f44285e6',
    name: 'updateConsumerCanvasSettings',
    requestSchema: z.object({
        authToken: z.string(),
        canvasAccessToken: z.string(),
        canvasServer: z.url(),
        trmnlId: z.uuid(),
    }),
    responseSchema: CREATE_RESULT(
        z.null(),
        z.enum([
            'authenticationError',
            'authorizationError',
            'invalidUrlError',
            'consumerNotFoundError',
            'databaseQueryError',
            'databaseInsertError',
        ]),
    ),
});

export const API = {
    createConsumer: CreateConsumer,
    fetchConsumerData: FetchConsumerData,
    updateConsumerCanvasSettings: UpdateConsumerCanvasSettings,
} as const;
