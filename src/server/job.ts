import { eq, isNull, or } from 'drizzle-orm';
import { db } from '@/server/db/index.ts';
import { createLogger } from '@/shared/utilities/loggingUtilities.ts';
import { stringifyError, tryCatch } from '@/shared/utilities/tryCatch.ts';
import { canvasTokens } from './db/schema.ts';
import { encryptionUtilities } from './utilities/encryptionUtilities.ts';

const logger = createLogger('@/server/job');

export const jobMain = async () => {
    // Migrate the database to encrypt all stuffs.
    const [requiredEncryptionMigrationResult, requiredEncryptionMigration] =
        await tryCatch(
            db
                .select({
                    id: canvasTokens.id,
                })
                .from(canvasTokens)
                .where(
                    or(
                        isNull(canvasTokens.encryptedCanvasServer),
                        isNull(canvasTokens.encryptedCanvasToken),
                    ),
                ),
        );

    if (!requiredEncryptionMigrationResult) {
        logger.error(
            'Failed to query for required encryption migration: %s',
            stringifyError(requiredEncryptionMigration),
        );
        process.exit(1);
    }

    for (const row of requiredEncryptionMigration) {
        logger.info('Encrypting canvas token data for row id: %s', row.id);
        const [canvasTokenRowResult, canvasTokenRow] = await tryCatch(
            db.select().from(canvasTokens).where(eq(canvasTokens.id, row.id)),
        );

        if (!canvasTokenRowResult) {
            logger.error(
                'Failed to query for canvas token row id %s: %s',
                row.id,
                stringifyError(canvasTokenRow),
            );
            continue;
        }
        if (canvasTokenRow.length === 0) {
            logger.warn('No canvas token row found for id %s', row.id);
            continue;
        }
        const rowData = canvasTokenRow[0];
        const canvasTokenDecrypted = rowData.canvasToken;
        const canvasServerDecrypted = rowData.canvasServer;
        if (!canvasTokenDecrypted) {
            logger.warn('No canvas token to encrypt for row id %s', row.id);
            continue;
        }
        if (!canvasServerDecrypted) {
            logger.warn('No canvas server to encrypt for row id %s', row.id);
            continue;
        }

        const encryptedCanvasToken =
            encryptionUtilities.encryptString(canvasTokenDecrypted);
        const encryptedCanvasServer = encryptionUtilities.encryptString(
            canvasServerDecrypted,
        );

        const [updateResult, update] = await tryCatch(
            db
                .update(canvasTokens)
                .set({
                    encryptedCanvasServer,
                    encryptedCanvasToken,
                })
                .where(eq(canvasTokens.id, row.id)),
        );
        if (!updateResult) {
            logger.error(
                'Failed to update canvas token row id %s: %s',
                row.id,
                stringifyError(update),
            );
            continue;
        }
        logger.info(
            'Successfully encrypted canvas token data for row id: %s',
            row.id,
        );
    }

    // Count how many are still unencrypted.
    const [remainingUnencryptedResult, remainingUnencrypted] = await tryCatch(
        db
            .select()
            .from(canvasTokens)
            .where(
                or(
                    isNull(canvasTokens.encryptedCanvasServer),
                    isNull(canvasTokens.encryptedCanvasToken),
                ),
            ),
    );
    if (!remainingUnencryptedResult) {
        logger.error(
            'Failed to query for remaining unencrypted canvas tokens: %s',
            stringifyError(remainingUnencrypted),
        );
        process.exit(1);
    }

    if (remainingUnencrypted.length > 0) {
        logger.error(
            'There are still %s unencrypted canvas token rows remaining after migration.',
            remainingUnencrypted.length,
        );
        process.exit(1);
    }

    logger.info('Database encryption migration completed successfully.');
};
