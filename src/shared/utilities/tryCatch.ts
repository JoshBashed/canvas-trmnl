export const tryCatch = async <T, E = unknown>(
    data: Promise<T>,
): Promise<[true, T] | [false, E]> => {
    try {
        const result = await data;
        return [true, result];
    } catch (error) {
        return [false, error as E];
    }
};

export const stringifyError = (error: unknown): string => {
    if (error instanceof Error) return error.message;

    if (typeof error === 'string') return error;
    if (typeof error === 'object' && error !== null)
        return JSON.stringify(error);

    return String(error);
};
