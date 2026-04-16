import { collection, doc, writeBatch, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/backend/firebase/init";
import { hrSettingsService } from "@/lib/backend/firebase/hrSettingsService";
import { timestampFormat } from "@/lib/util/dayjs_format";
import dayjs from "dayjs";
import { HrSettingsByType } from "@/context/firestore-context";
import { EmployeeModel } from "@/lib/models/employee";

/**
 * Service for importing department settings data
 */
export class DepartmentSettingsImportService {
    /**
     * Batch import department settings data
     * @param items - Array of department data to import
     * @param ctx - Context containing hrSettings and employees for reference resolution
     * @returns Promise with successful count, failed count, and errors
     */
    static async batchImportDepartmentSettings(
        items: Array<Record<string, any>>,
        ctx: { hrSettings?: HrSettingsByType; employees?: EmployeeModel[] },
    ): Promise<{
        successful: number;
        failed: number;
        errors: string[];
    }> {
        const batch = writeBatch(db);
        const errors: string[] = [];
        let successful = 0;
        let failed = 0;

        try {
            // Preload existing departments for create/update determination
            const existingDepartments = await hrSettingsService.getAll("departmentSettings");

            // Create lookup maps for reference resolution
            const employeesByEmployeeID = new Map<string, EmployeeModel>();
            if (ctx.employees) {
                ctx.employees.forEach(emp => {
                    employeesByEmployeeID.set(emp.employeeID, emp);
                });
            }

            const locationsByName = new Map<string, any>();
            if (ctx.hrSettings?.locations) {
                ctx.hrSettings.locations.forEach(loc => {
                    locationsByName.set(loc.name, loc);
                });
            }

            // Create lookup map for existing departments by name+code key
            const departmentsByNameCodeKey = new Map<string, any>();
            existingDepartments.forEach(dept => {
                const key = `${dept.name.toLowerCase().trim()}|${dept.code.toLowerCase().trim()}`;
                departmentsByNameCodeKey.set(key, dept);
            });

            // Process each item
            for (let i = 0; i < items.length; i++) {
                const item = items[i];
                try {
                    // Normalize active to boolean
                    const active = normalizeActiveToBoolean(item.active);

                    // Resolve manager reference
                    let manager: string | null = null;
                    if (item.manager && String(item.manager).trim() !== "") {
                        const employee = employeesByEmployeeID.get(item.manager);
                        if (employee) {
                            manager = employee.uid;
                        } else {
                            failed++;
                            errors.push(
                                `Row ${i + 1}: Manager with employee ID '${item.manager}' does not exist`,
                            );
                            continue;
                        }
                    }

                    // Resolve location reference
                    let location: string | null = null;
                    if (item.location && String(item.location).trim() !== "") {
                        const loc = locationsByName.get(item.location);
                        if (loc) {
                            location = loc.id;
                        } else {
                            failed++;
                            errors.push(`Row ${i + 1}: Location '${item.location}' does not exist`);
                            continue;
                        }
                    }

                    // Determine create vs update
                    const nameCodeKey = `${item.name.toLowerCase().trim()}|${item.code.toLowerCase().trim()}`;
                    const existingDept = departmentsByNameCodeKey.get(nameCodeKey);

                    const timestamp = dayjs().format(timestampFormat);

                    if (existingDept) {
                        // Update existing department
                        const docRef = doc(
                            db,
                            "hrSettings",
                            "main",
                            "departmentSettings",
                            existingDept.id,
                        );
                        batch.update(docRef, {
                            name: item.name,
                            code: item.code,
                            manager,
                            location,
                            active,
                            updatedAt: timestamp,
                        });
                    } else {
                        // Create new department
                        const docRef = doc(
                            collection(db, "hrSettings", "main", "departmentSettings"),
                        );
                        batch.set(docRef, {
                            name: item.name,
                            code: item.code,
                            manager,
                            location,
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
 * Normalizes active field value to boolean
 * Accepts: yes/no/true/false/1/0 (case-insensitive)
 */
function normalizeActiveToBoolean(value: any): boolean {
    if (value === null || value === undefined) return false;

    const str = String(value).trim().toLowerCase();
    return ["true", "yes", "1"].includes(str);
}
