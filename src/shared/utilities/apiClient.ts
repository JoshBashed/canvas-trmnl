import {
    type CreateConsumerRequest,
    CreateConsumerRequestId,
    type CreateConsumerResponse,
    CreateConsumerResponseSchema,
    type FetchConsumerDataRequest,
    FetchConsumerDataRequestId,
    type FetchConsumerDataResponse,
    FetchConsumerDataResponseSchema,
    type GlobalErrorResponse,
    GlobalErrorResponseSchema,
    type GlobalRequest,
    type UpdateCanvasDataRequest,
    UpdateCanvasDataRequestId,
    type UpdateCanvasDataResponse,
    UpdateCanvasDataResponseSchema,
} from '@/shared/apiTypes.ts';
import {
    performSafeJsonParse,
    performSafeRequest,
} from '@/shared/utilities/fetchUtilities.ts';

const API_URL = '/api/performAction';

export const performCreateConsumer = async (
    data: CreateConsumerRequest,
): Promise<
    | [true, GlobalErrorResponse | CreateConsumerResponse]
    | [false, 'requestError' | 'jsonParseError' | 'schemaValidationError']
> => {
    const requestData: GlobalRequest = {
        procedure: CreateConsumerRequestId,
        data: data,
    };
    const [responseSuccess, response] = await performSafeRequest(API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
    });

    if (!responseSuccess) {
        return [false, 'requestError'];
    }

    const [jsonSuccess, json] = await performSafeJsonParse(
        await response.text(),
    );
    if (!jsonSuccess) {
        return [false, 'jsonParseError'];
    }

    const parseResult = CreateConsumerResponseSchema.safeParse(json);
    if (parseResult.success) {
        return [true, parseResult.data];
    }

    const globalErrorParseResult = GlobalErrorResponseSchema.safeParse(json);
    if (!globalErrorParseResult.success) {
        return [false, 'schemaValidationError'];
    }

    return [true, globalErrorParseResult.data];
};

export const performFetchConsumerData = async (
    data: FetchConsumerDataRequest,
): Promise<
    | [true, GlobalErrorResponse | FetchConsumerDataResponse]
    | [false, 'requestError' | 'jsonParseError' | 'schemaValidationError']
> => {
    const requestData: GlobalRequest = {
        procedure: FetchConsumerDataRequestId,
        data: data,
    };
    const [responseSuccess, response] = await performSafeRequest(API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
    });

    if (!responseSuccess) {
        return [false, 'requestError'];
    }

    const [jsonSuccess, json] = await performSafeJsonParse(
        await response.text(),
    );
    if (!jsonSuccess) {
        return [false, 'jsonParseError'];
    }

    const parseResult = FetchConsumerDataResponseSchema.safeParse(json);
    if (parseResult.success) {
        return [true, parseResult.data];
    }

    const globalErrorParseResult = GlobalErrorResponseSchema.safeParse(json);
    if (!globalErrorParseResult.success) {
        return [false, 'schemaValidationError'];
    }

    return [true, globalErrorParseResult.data];
};

export const performUpdateCanvasData = async (
    data: UpdateCanvasDataRequest,
): Promise<
    | [true, GlobalErrorResponse | UpdateCanvasDataResponse]
    | [false, 'requestError' | 'jsonParseError' | 'schemaValidationError']
> => {
    const requestData: GlobalRequest = {
        procedure: UpdateCanvasDataRequestId,
        data: data,
    };
    const [responseSuccess, response] = await performSafeRequest(API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
    });

    if (!responseSuccess) {
        return [false, 'requestError'];
    }

    const [jsonSuccess, json] = await performSafeJsonParse(
        await response.text(),
    );
    if (!jsonSuccess) {
        return [false, 'jsonParseError'];
    }

    const parseResult = UpdateCanvasDataResponseSchema.safeParse(json);
    if (parseResult.success) {
        return [true, parseResult.data];
    }

    const globalErrorParseResult = GlobalErrorResponseSchema.safeParse(json);
    if (!globalErrorParseResult.success) {
        return [false, 'schemaValidationError'];
    }

    return [true, globalErrorParseResult.data];
};
