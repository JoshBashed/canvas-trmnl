import * as jose from 'jose';
import { z } from 'zod';
import {
    performSafeJsonParse,
    performSafeRequest,
} from '@/shared/utilities/fetchUtilities.ts';
import { createLogger } from '@/shared/utilities/loggingUtilities.ts';

const logger = createLogger('@/server/apiClients/trmnlApiClient');

const TRMNL_BASE_URL = 'https://usetrmnl.com';
const TRMNL_JWK_URL = `${TRMNL_BASE_URL}/.well-known/jwks.json`;
const JWK_CACHE_TTL = 4 * 60 * 60 * 1000; // 4 hour in milliseconds

const TrmnlErrorResponseSchema = z.object({
    error: z.literal(true),
    message: z.string(),
});
export type TrmnlErrorResponse = z.infer<typeof TrmnlErrorResponseSchema>;
class TrmnlCachedJWK {
    private static shared: TrmnlCachedJWK = new TrmnlCachedJWK();
    private jwks: Awaited<ReturnType<typeof jose.createRemoteJWKSet>> | null =
        null;
    private lastUpdate = 0;

    private constructor() {}

    public static getShared(): TrmnlCachedJWK {
        return TrmnlCachedJWK.shared;
    }

    private needsUpdate(): boolean {
        const now = Date.now();
        return this.lastUpdate + JWK_CACHE_TTL < now;
    }

    private async initializeJWKSet(): Promise<void> {
        this.jwks = jose.createRemoteJWKSet(new URL(TRMNL_JWK_URL));
    }

    public async verifyToken(
        token: string,
    ): Promise<jose.JWTVerifyResult | false> {
        if (this.jwks === null) {
            await this.initializeJWKSet();
            this.lastUpdate = Date.now();
        }
        if (!this.jwks) {
            logger.error('JWKs are not initialized.');
            return false;
        }

        if (this.needsUpdate()) {
            logger.info('JWKs cache is stale, reinitializing.');
            try {
                await this.jwks.reload();
            } catch (error) {
                logger.error(
                    'Failed to reload JWKs: %s',
                    error instanceof Error ? error.message : String(error),
                );
                return false;
            }
            this.lastUpdate = Date.now();
        }

        try {
            const verified = await jose.jwtVerify(token, this.jwks);
            return verified;
        } catch (error) {
            logger.error(
                'Failed to verify token: %s',
                error instanceof Error ? error.message : String(error),
            );
            return false;
        }
    }
}

export const verifyTrmnlToken = async (
    token: string,
): Promise<jose.JWTVerifyResult | false> => {
    const jwkSet = TrmnlCachedJWK.getShared();
    return await jwkSet.verifyToken(token);
};

// OauthToken
const TrmnlOAuthTokenSuccessResponseSchema = z.object({
    access_token: z.string(),
    error: z.undefined(),
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
        client_id: request.clientId,
        client_secret: request.clientSecret,
        code: request.code,
        grant_type: request.grantType,
    };

    // Make the request.
    const [responseSuccess, response] = await performSafeRequest(
        url.toString(),
        {
            body: JSON.stringify(jsonRequest),
            headers: {
                'Content-Type': 'application/json',
            },
            method: 'POST',
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
