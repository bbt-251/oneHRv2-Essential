export const groupBy = <T extends Record<string, unknown>>(
    key: keyof T,
    array: T[],
): Record<string, T[]> =>
        array?.reduce<Record<string, T[]>>((acc, val) => {
            const groupKey = String(val[key]);
            return {
                ...acc,
                [groupKey]: groupKey in acc ? acc[groupKey].concat(val) : [val],
            };
        }, {});
