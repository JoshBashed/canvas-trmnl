import { CREATE_PROCEDURE_FN } from '@/server/api/createProcedure.ts';
import { fetchTrmnlOAuthToken } from '@/server/apiClients/trmnlApiClient.ts';
import { appEnv } from '@/server/appEnv.ts';
import { db } from '@/server/db/index.ts';
import { trmnlAuthorizationTokens } from '@/server/db/schema.ts';
import { stringifyError, tryCatch } from '@/shared/utilities/tryCatch.ts';

export const createConsumer = CREATE_PROCEDURE_FN<'createConsumer'>(
    async (logger, data) => {
        // Make a request to the external API.
        const [tokenSuccess, token, reason] = await fetchTrmnlOAuthToken({
            clientId: appEnv.trmnl.clientId,
            clientSecret: appEnv.trmnl.clientSecret,
            code: data.code,
            grantType: 'authorization_code',
        });

        if (!tokenSuccess) {
            logger.info(
                'Failed to fetch token from Trmnl: %s',
                reason ?? token,
            );
            return {
                data: 'trmnlError',
                type: 'error',
            };
        }

        // Create a key for the auth token.
        const [insertResult, insert] = await tryCatch(
            db
                .insert(trmnlAuthorizationTokens)
                .values({
                    token: token.access_token,
                })
                .onConflictDoNothing(),
        );
        if (!insertResult) {
            logger.error('Failed to insert token: %s', stringifyError(insert));
            return {
                data: 'databaseInsertError',
                type: 'error',
            };
        }

        return {
            data: null,
            type: 'okay',
        };
    },
);
