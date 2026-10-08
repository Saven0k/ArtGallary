export const translatedValue = (value: unknown, path: string): string => {
    let result = value;
    for (const key of path.split('.')) {
        if (!result || typeof result !== 'object' || !(key in result)) return path;
        result = (result as Record<string, unknown>)[key];
    }
    return typeof result === 'string' ? result : path;
};
