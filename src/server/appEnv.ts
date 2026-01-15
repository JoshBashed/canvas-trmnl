import { createLogger } from '@/shared/utilities/loggingUtilities.ts';

const logger = createLogger('@/server/appEnv');

export interface AppEnv {
    dev: boolean;
    databaseUrl: string;
    port: number;
    trmnl: {
        clientId: string;
        clientSecret: string;
    };
    encryptionKey: string;
    mode: 'server' | 'job';
}

export const appEnv: AppEnv = (() => {
    const dev = process.env.NODE_ENV === 'development';
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
        logger.error('DATABASE_URL is not set.');
        process.exit(1);
    }
    const trmnlClientId = process.env.TRMNL_CLIENT_ID;
    const trmnlClientSecret = process.env.TRMNL_CLIENT_SECRET;
    if (!trmnlClientId || !trmnlClientSecret) {
        logger.error('TRMNL_CLIENT_ID or TRMNL_CLIENT_SECRET is not set.');
        process.exit(1);
    }

    let port = 3000;
    if (!process.env.PORT) {
        logger.warn('PORT is not set. Using default port 3000.');
    } else {
        port = Number(process.env.PORT);
        if (Number.isNaN(port)) {
            logger.error('PORT is not a number.');
            process.exit(1);
        }
        if (port < 0 || port > 65535) {
            logger.error('PORT is not a valid port.');
            process.exit(1);
        }
    }

    const encryptionKey = process.env.ENCRYPTION_KEY;
    if (!encryptionKey) {
        logger.error('ENCRYPTION_KEY is not set.');
        process.exit(1);
    }

    const mode = process.env.APP_MODE ?? 'server';
    if (mode !== 'server' && mode !== 'job') {
        logger.error("APP_MODE must be either 'server' or 'job'.");
        process.exit(1);
    }

    return {
        databaseUrl,
        dev,
        encryptionKey,
        mode,
        port,
        trmnl: {
            clientId: trmnlClientId,
            clientSecret: trmnlClientSecret,
        },
    };
})();
