import type { z } from 'zod';
import type { API } from '@/shared/api/api.ts';
import type { Logger } from '@/shared/utilities/loggingUtilities.ts';

export const CREATE_PROCEDURE_FN = <Id extends keyof typeof API>(
    fn: (
        logger: Logger,
        data: z.infer<(typeof API)[Id]['requestSchema']>,
    ) => Promise<z.infer<(typeof API)[Id]['responseSchema']>>,
): ((
    logger: Logger,
    data: z.infer<(typeof API)[Id]['requestSchema']>,
) => Promise<z.infer<(typeof API)[Id]['responseSchema']>>) => fn;
