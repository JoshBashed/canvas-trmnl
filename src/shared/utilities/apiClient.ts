import type { z } from 'zod';
import { API } from '@/shared/api/api.ts';
import {
    type ProcedureErrorResponse,
    ProcedureErrorResponseSchema,
} from '@/shared/api/index.ts';
import {
    performSafeJsonParse,
    performSafeRequest,
} from '@/shared/utilities/fetchUtilities.ts';
import { createLogger } from '@/shared/utilities/loggingUtilities.ts';

const API_URL = '/api/performAction';

interface APIClientError {
    type: 'clientError';
    data:
        | 'requestError'
        | 'jsonParseError'
        | 'schemaValidationError'
        | 'unknownError';
}

type ClientResponse<T extends keyof typeof API> =
    | [true, z.infer<(typeof API)[T]['responseSchema']>]
    | [false, ProcedureErrorResponse]
    | [false, APIClientError];

type ClientImplementation = {
    [Key in keyof typeof API]: (
        data: z.infer<(typeof API)[Key]['requestSchema']>,
    ) => Promise<ClientResponse<Key>>;
};

interface BaseAPIClient {
    formatError(error: ProcedureErrorResponse | APIClientError): string;
}

class APIClient implements BaseAPIClient {
    private static instance = new APIClient();
    private logger = createLogger('@/shared/utilities/apiClient');

    private constructor() {
        for (const item in API) {
            Object.defineProperty(this, item, {
                configurable: false,
                enumerable: true,
                value: this.clientMethod.bind(this, item as keyof typeof API),
                writable: false,
            });
        }
    }

    private async clientMethod<T extends keyof typeof API>(
        methodName: keyof typeof API,
        requestData: z.infer<(typeof API)[T]['requestSchema']>,
    ): Promise<ClientResponse<T>> {
        this.logger.debug("Making '%s' procedure call.", methodName);
        const [requestSuccess, requestResult] = await performSafeRequest(
            API_URL,
            {
                body: JSON.stringify({
                    data: requestData,
                    procedure: API[methodName].id,
                }),
                headers: {
                    'Content-Type': 'application/json',
                },
                method: 'POST',
            },
        );

        if (!requestSuccess) {
            this.logger.error(
                "Request failed for '%s': %o",
                methodName,
                requestResult,
            );
            return [
                false,
                {
                    data: 'requestError',
                    type: 'clientError',
                },
            ];
        }

        const [jsonSuccess, json] = await performSafeJsonParse(
            await requestResult.text(),
        );

        if (!jsonSuccess) {
            this.logger.error(
                "JSON parse failed for '%s': %o",
                methodName,
                json,
            );
            return [
                false,
                {
                    data: 'jsonParseError',
                    type: 'clientError',
                },
            ];
        }

        const responseSchema = API[methodName].responseSchema;

        const parseResult = responseSchema.safeParse(json);
        if (parseResult.success) {
            this.logger.debug(
                "Response for '%s' successfully parsed.",
                methodName,
                parseResult.data,
            );
            // See https://github.com/colinhacks/zod/issues/5154
            // FIXME: Remove this once the issue is resolved
            // @ts-expect-error
            return [true, parseResult.data];
        }

        // Try to parse as GlobalErrorResponse
        const globalErrorParseResult =
            ProcedureErrorResponseSchema.safeParse(json);
        if (globalErrorParseResult.success) {
            this.logger.error(
                "Response for '%s' is a GlobalErrorResponse.",
                methodName,
                globalErrorParseResult.data,
            );
            return [false, globalErrorParseResult.data];
        }

        this.logger.error(
            "Response for '%s' failed schema validation: %o",
            methodName,
            parseResult.error,
        );

        return [
            false,
            {
                data: 'schemaValidationError',
                type: 'clientError',
            },
        ];
    }

    public static getInstance(): Readonly<APIClient> {
        return APIClient.instance;
    }

    public formatError(error: ProcedureErrorResponse | APIClientError): string {
        return `${error.type === 'clientError' ? 'Client Error: ' : 'API Error: '}${
            'message' in error ? error.message : error.data
        }${!('message' in error) ? ` (${error.data})` : ''}.`;
    }
}

export const apiClient =
    APIClient.getInstance() as Readonly<ClientImplementation> & BaseAPIClient;
