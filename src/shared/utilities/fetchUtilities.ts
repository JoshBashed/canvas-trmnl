import { createLogger } from '@/shared/utilities/loggingUtilities.ts';

const logger = createLogger('@/shared/utilities/fetchUtilities');

/**
 * perform a request returning a tuple of success and the response or error.
 * @param url The URL to request.
 * @param request The request options.
 * @returns A tuple of success and the response or error.
 */
export const performSafeRequest = async (
    url: string,
    request?: RequestInit,
): Promise<[true, Response] | [false, Error]> => {
    try {
        const response = await fetch(url, request);
        return [true, response];
    } catch (error) {
        if (error instanceof Error) {
            logger.warn('Fetch error to `%s`: %s', url, error.message);
            return [false, error];
        }
        return [false, new Error('Unknown error')];
    }
};

/**
 * perform a safe JSON parse returning a tuple of success and the JSON or error.
 * @param string The string to parse.
 * @returns A tuple of success and the JSON (unknown) or error.
 */
export const performSafeJsonParse = async (
    string: string,
): Promise<[true, unknown] | [false, Error]> => {
    try {
        const json = JSON.parse(string);
        return [true, json];
    } catch (error) {
        if (error instanceof Error) {
            logger.warn('Parsing json error: %s', error.message);
            return [false, error];
        }
        return [false, new Error('Unknown error')];
    }
};

/**
 * Create a search params object from a record.
 * @param params The record of parameters.
 * @returns The search params object.
 */
export const createSearchParams = (
    params: Record<
        string,
        string | number | Array<string | number> | undefined
    >,
): URLSearchParams => {
    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
        if (value === undefined) {
            continue;
        }

        if (Array.isArray(value)) {
            for (const item of value) {
                searchParams.append(key, String(item));
            }
        } else {
            searchParams.append(key, String(value));
        }
    }
    return searchParams;
};
