import { z } from 'zod';

export const CreateConsumerRequestId = 'bac379d4-a5be-4de7-835a-9ac8c1b6c48d';
export const CreateConsumerRequestSchema = z.object({
    code: z.string(),
});
export type CreateConsumerRequest = z.infer<typeof CreateConsumerRequestSchema>;
export const CreateConsumerResponseSchema = z.union([
    z.object({
        type: z.literal('error'),
        error: z.enum(['trmnlError', 'databaseInsertError']),
    }),
    z.object({
        type: z.literal('success'),
    }),
]);
export type CreateConsumerResponse = z.infer<
    typeof CreateConsumerResponseSchema
>;

export const UpdateCanvasDataRequestId = '856c99bd-6ad7-4b7e-a0df-3e219ca622e2';
export const UpdateCanvasDataRequestSchema = z.object({
    trmnlId: z.string().uuid(),
    canvasServer: z.string().url(),
    canvasAccessToken: z.string(),
});
export type UpdateCanvasDataRequest = z.infer<
    typeof UpdateCanvasDataRequestSchema
>;
export const UpdateCanvasDataResponseSchema = z.union([
    z.object({
        type: z.literal('error'),
        error: z.enum([
            'invalidUrlError',
            'consumerNotFoundError',
            'databaseQueryError',
            'databaseInsertError',
        ]),
    }),
    z.object({
        type: z.literal('success'),
    }),
]);
export type UpdateCanvasDataResponse = z.infer<
    typeof UpdateCanvasDataResponseSchema
>;

export const GlobalRequestSchema = z.object({
    procedure: z.enum([CreateConsumerRequestId, UpdateCanvasDataRequestId]),
    data: z.any().optional(),
});
export type GlobalRequest = z.infer<typeof GlobalRequestSchema>;

export const GlobalErrorResponseSchema = z.object({
    type: z.literal('globalError'),
    error: z.enum([
        'jsonParseError',
        'globalSchemaValidationError',
        'procedureSchemaValidationError',
    ]),
    message: z.string().optional(),
});
export type GlobalErrorResponse = z.infer<typeof GlobalErrorResponseSchema>;
