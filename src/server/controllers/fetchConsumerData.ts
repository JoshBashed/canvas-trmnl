import { eq } from "drizzle-orm";
import { CREATE_PROCEDURE_FN } from "@/server/api/createProcedure.ts";
import { verifyTrmnlToken } from "@/server/apiClients/trmnlApiClient.ts";
import { db } from "@/server/db/index.ts";
import { trmnlData } from "@/server/db/schema.ts";
import { stringifyError, tryCatch } from "@/shared/utilities/tryCatch.ts";

export const fetchConsumerData = CREATE_PROCEDURE_FN<"fetchConsumerData">(
    async (logger, data) => {
        const token = await verifyTrmnlToken(data.authToken);
        if (!token) {
            logger.info("Invalid token: %s.", data.authToken);
            return {
                data: "authenticationError",
                type: "error",
            };
        }

        if (token.payload.sub?.toLowerCase() !== data.trmnlId.toLowerCase()) {
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

        const dataResult = trmnlDataQuery[0];

        return {
            data: {
                name: dataResult.name,
                settingsId: dataResult.settingsId,
                trmnlId: dataResult.trmnlId,
            },
            type: "okay",
        };
    },
);
