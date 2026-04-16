import { collection, doc, writeBatch, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/backend/firebase/init";
import { hrSettingsService } from "@/lib/backend/firebase/hrSettingsService";
import { timestampFormat } from "@/lib/util/dayjs_format";
import dayjs from "dayjs";

/**
 * Service for importing leave types data
 */
export class LeaveTypesImportService {
    /**
     * Batch import leave types data
     * @param items - Array of leave types data to import
     * @returns Promise with successful count, failed count, and errors
     */
    static async batchImportLeaveTypes(items: Array<Record<string, any>>): Promise<{
        successful: number;
        failed: number;
        errors: string[];
    }> {
        const batch = writeBatch(db);
        const errors: string[] = [];
        let successful = 0;
        let failed = 0;

        try {
            // Preload existing leave types for create/update determination
            const existingLeaveTypes = await hrSettingsService.getAll("leaveTypes");

            // Create lookup map for existing leave types by name+acronym key
            const leaveTypesByNameAcronymKey = new Map<string, any>();
            existingLeaveTypes.forEach(leaveType => {
                const key = `${leaveType.name.toLowerCase().trim()}|${leaveType.acronym.toLowerCase().trim()}`;
                leaveTypesByNameAcronymKey.set(key, leaveType);
            });

            // Process each item
            for (let i = 0; i < items.length; i++) {
                const item = items[i];
                try {
                    // Normalize active to "Yes"/"No"
                    const active = normalizeActiveToYesNo(item.active);

                    // Validate and convert authorizedDays
                    const authorizedDays = Number(item.authorizedDays);
                    if (isNaN(authorizedDays) || authorizedDays < 0) {
                        failed++;
                        errors.push(`Row ${i + 1}: Authorized Days must be a positive number`);
                        continue;
                    }

                    // Determine create vs update
                    const nameAcronymKey = `${item.name.toLowerCase().trim()}|${item.acronym.toLowerCase().trim()}`;
                    const existingLeaveType = leaveTypesByNameAcronymKey.get(nameAcronymKey);

                    const timestamp = dayjs().format(timestampFormat);

                    if (existingLeaveType) {
                        // Update existing leave type
                        const docRef = doc(
                            db,
                            "hrSettings",
                            "main",
                            "leaveTypes",
                            existingLeaveType.id,
                        );
                        batch.update(docRef, {
                            name: item.name,
                            authorizedDays,
                            acronym: item.acronym,
                            active,
                            updatedAt: timestamp,
                        });
                    } else {
                        // Create new leave type
                        const docRef = doc(collection(db, "hrSettings", "main", "leaveTypes"));
                        batch.set(docRef, {
                            name: item.name,
                            authorizedDays,
                            acronym: item.acronym,
                            active,
                            createdAt: timestamp,
                            updatedAt: timestamp,
                        });
                    }

                    successful++;
                } catch (error) {
                    failed++;
                    errors.push(
                        `Row ${i + 1}: ${error instanceof Error ? error.message : "Unknown error"}`,
                    );
                }
            }

            // Commit batch
            await batch.commit();
        } catch (error) {
            console.error("Batch import error:", error);
            throw new Error(
                `Import failed: ${error instanceof Error ? error.message : "Unknown error"}`,
            );
        }

        return { successful, failed, errors };
    }
}

/**
 * Normalizes active field value to "Yes" or "No"
 * Accepts: yes/no/true/false/1/0 (case-insensitive)
 */
function normalizeActiveToYesNo(value: any): "Yes" | "No" {
    if (value === null || value === undefined) return "No";

    const str = String(value).trim().toLowerCase();
    return ["true", "yes", "1"].includes(str) ? "Yes" : "No";
}
