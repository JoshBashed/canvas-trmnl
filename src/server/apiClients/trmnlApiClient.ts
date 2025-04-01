import { z } from 'zod';
import {
    performSafeJsonParse,
    performSafeRequest,
} from '@/shared/utilities/fetchUtilities.ts';

const TRMNL_BASE_URL = 'https://usetrmnl.com';

const TrmnlErrorResponseSchema = z.object({
    error: z.literal(true),
    message: z.string(),
});

// OauthToken
const TrmnlOAuthTokenSuccessResponseSchema = z.object({
    error: z.undefined(),
    access_token: z.string(),
});
export type TrmnlOAuthTokenSuccessResponse = z.infer<
    typeof TrmnlOAuthTokenSuccessResponseSchema
>;
const TrmnlOAuthTokenResponseSchema = z.union([
    TrmnlOAuthTokenSuccessResponseSchema,
    TrmnlErrorResponseSchema,
]);
export interface TrmnlOAuthTokenRequest {
    code: string;
    clientId: string;
    clientSecret: string;
    grantType: 'authorization_code';
}
export type TrmnlOAuthTokenResponse = z.infer<
    typeof TrmnlOAuthTokenResponseSchema
>;
export type TrmnlOAuthTokenErrors =
    | 'requestError'
    | 'jsonParseError'
    | 'schemaValidationError'
    | 'trmnlError';

export const fetchTrmnlOAuthToken = async (
    request: TrmnlOAuthTokenRequest,
): Promise<
    | [true, TrmnlOAuthTokenSuccessResponse]
    | [false, Omit<TrmnlOAuthTokenErrors, 'trmnlError'>]
    | [false, 'trmnlError', string]
> => {
    const url = new URL('/oauth/token', TRMNL_BASE_URL);
    const jsonRequest = {
        code: request.code,
        client_id: request.clientId,
        client_secret: request.clientSecret,
        grant_type: request.grantType,
    };

    // Make the request.
    const [responseSuccess, response] = await performSafeRequest(
        url.toString(),
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(jsonRequest),
        },
    );

    if (!responseSuccess) {
        return [false, 'requestError'];
    }

    // Parse the response.
    const [jsonSuccess, json] = await performSafeJsonParse(
        await response.text(),
    );

    if (!jsonSuccess) {
        return [false, 'jsonParseError'];
    }

    // Validate the response.
    const parseResult = TrmnlOAuthTokenResponseSchema.safeParse(json);

    if (!parseResult.success) {
        return [false, 'schemaValidationError'];
    }

    // Check for errors.
    if (parseResult.data.error) {
        return [false, 'trmnlError', parseResult.data.message];
    }

    return [true, parseResult.data];
};
