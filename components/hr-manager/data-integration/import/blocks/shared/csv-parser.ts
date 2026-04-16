/**
 * CSV parsing and file reading utilities
 */

/**
 * Reads file content as text
 */
export function readFileContent(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = event => {
            const content = event.target?.result as string;
            resolve(content);
        };

        reader.onerror = () => {
            reject(new Error("Failed to read file"));
        };

        reader.readAsText(file);
    });
}

/**
 * Creates header mapping from fields array for CSV parsing
 */
export function createHeaderMapping(
    fields: Array<{ key: string; label: string; required: boolean | "create-only"; type: string }>,
): Record<string, string> {
    const mapping: Record<string, string> = {};
    fields.forEach(field => {
        mapping[field.label] = field.key;
    });
    return mapping;
}

/**
 * Parses CSV content to array of objects
 * @param csvContent - The CSV file content as string
 * @param headerMapping - Optional mapping from CSV header to desired key name
 */
export function parseCSV(
    csvContent: string,
    headerMapping?: Record<string, string>,
): Record<string, any>[] {
    const lines = csvContent.split("\n").filter(line => line.trim() !== "");
    if (lines.length < 2) {
        throw new Error("CSV must contain at least a header row and one data row");
    }

    const headers = lines[0].split(",").map(header => header.trim().replace(/"/g, ""));
    const data: Record<string, any>[] = [];

    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(",").map(value => value.trim().replace(/"/g, ""));
        const row: Record<string, any> = {};

        headers.forEach((header, index) => {
            // Use header mapping if provided, otherwise use the header as-is
            const key = headerMapping?.[header] || header;
            row[key] = values[index] || "";
        });

        data.push(row);
    }

    return data;
}
