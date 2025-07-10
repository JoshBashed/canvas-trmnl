import { eq } from "drizzle-orm";
import { CREATE_PROCEDURE_FN } from "@/server/api/createProcedure.ts";
import { verifyTrmnlToken } from "@/server/apiClients/trmnlApiClient.ts";
import { db } from "@/server/db/index.ts";
import { canvasTokens, trmnlData } from "@/server/db/schema.ts";
import { stringifyError, tryCatch } from "@/shared/utilities/tryCatch.ts";

export const updateConsumerCanvasSettings =
    CREATE_PROCEDURE_FN<"updateConsumerCanvasSettings">(
        async (logger, data) => {
            const token = await verifyTrmnlToken(data.authToken);
            if (!token) {
                logger.info("Invalid token: %s.", data.authToken);
                return {
                    data: "authenticationError",
                    type: "error",
                };
            }

            if (
                token.payload.sub?.toLowerCase() !== data.trmnlId.toLowerCase()
            ) {
                logger.warn(
                    "JWT sub does not match trmnlId. JWT sub: %s, trmnlId: %s.",
                    token.payload.sub ?? "undefined",
                    data.trmnlId,
                );
                return {
                    data: "authenticationError",
                    type: "error",
                };
            }

            // Match the trmnlId to the consumer token.
            const [trmnlDataQuerySuccess, trmnlDataQuery] = await tryCatch(
                db
                    .select()
                    .from(trmnlData)
                    .where(eq(trmnlData.trmnlId, data.trmnlId)),
            );
            if (!trmnlDataQuerySuccess) {
                logger.error(
                    "Failed to query trmnlData for trmnlId %s: %s",
                    data.trmnlId,
                    stringifyError(trmnlDataQuery),
                );
                return {
                    data: "databaseQueryError",
                    type: "error",
                };
            }
            if (trmnlDataQuery.length === 0) {
                logger.warn(
                    "trmnlData does not exist for trmnlId: %s",
                    data.trmnlId,
                );
                return {
                    data: "consumerNotFoundError",
                    type: "error",
                };
            }
            const { consumerId } = trmnlDataQuery[0];

            // Try parse as URL
            const parseUrl = async (domain: string): Promise<URL> => {
                const url = new URL(domain);
                return url;
            };
            const [urlResult, url] = await tryCatch(
                parseUrl(data.canvasServer),
            );
            if (!urlResult) {
                logger.warn("Invalid canvas url: %s.", data.canvasServer);
                return {
                    data: "invalidUrlError",
                    type: "error",
                };
            }

            // Update the settings id for the consumer.
            const [updateResult, update] = await tryCatch(
                db
                    .insert(canvasTokens)
                    .values({
                        consumerId: consumerId,
                        canvasToken: data.canvasAccessToken,
                        canvasServer: url.hostname,
                    })
                    .onConflictDoUpdate({
                        target: canvasTokens.consumerId,
                        set: {
                            canvasToken: data.canvasAccessToken,
                            canvasServer: url.hostname,
                        },
                    }),
            );
            if (!updateResult) {
                logger.error(
                    "Failed to update canvas settings: %s",
                    stringifyError(update),
                );
                return {
                    data: "databaseUpdateError",
                    type: "error",
                };
            }

            return {
                data: null,
                type: "okay",
            };
        },
    );
