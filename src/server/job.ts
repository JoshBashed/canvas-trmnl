import { createLogger } from '@/shared/utilities/loggingUtilities.ts';

const logger = createLogger('@/server/job');

export const jobMain = async () => {
    logger.info('No jobs to run at this time.');
};
