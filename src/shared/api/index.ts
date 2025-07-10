import { z } from 'zod';

export const CREATE_SUCCESS = <Schema extends z.ZodType>(schema: Schema) => {
    return z.object({
        data: schema,
        type: z.literal('okay'),
    });
};

export const CREATE_ERROR = <Schema extends z.ZodType>(schema: Schema) => {
    return z.object({
        data: schema,
        type: z.literal('error'),
    });
};

export const CREATE_RESULT = <
    SuccessSchema extends z.ZodType,
    ErrorSchema extends z.ZodType,
>(
    successSchema: SuccessSchema,
    errorSchema: ErrorSchema,
) => {
    return z.union([CREATE_ERROR(errorSchema), CREATE_SUCCESS(successSchema)]);
};

export const CREATE_PROCEDURE = <
    Id extends string,
    Name extends string,
    RequestSchema extends z.ZodType,
    ResponseSchema extends z.ZodType,
>({
    id,
    name,
    requestSchema,
    responseSchema,
}: {
    id: Id;
    name: Name;
    requestSchema: RequestSchema;
    responseSchema: ResponseSchema;
}) => {
    return {
        id,
        name,
        requestSchema,
        responseSchema,
    };
};

export const ProcedureRequestSchema = z.object({
    data: z.any().optional(),
    procedure: z.string(),
});
export type ProcedureRequest = z.infer<typeof ProcedureRequestSchema>;

export const ProcedureErrorResponseSchema = z.object({
    data: z.enum([
        'invalidJSONObject',
        'procedureSchemaValidationError',
        'procedureNotFound',
        'schemaValidationError',
    ]),
    message: z.string().optional(),
    type: z.literal('procedureError'),
});
export type ProcedureErrorResponse = z.infer<
    typeof ProcedureErrorResponseSchema
>;
