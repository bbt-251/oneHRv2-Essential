export function numberCommaSeparator(num: string | number): string {
    const temp = Number(num);
    if (!Number.isNaN(temp) && temp % 1 != 0) {
        return Number(temp.toFixed(2)).toLocaleString();
    }
    return Number.isNaN(temp) ? num.toString() : temp.toLocaleString();
}
