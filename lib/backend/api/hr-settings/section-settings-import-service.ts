import { HrSettingsByType } from "@/context/firestore-context";
import { hrSettingsService } from "@/lib/backend/firebase/hrSettingsService";
import { db } from "@/lib/backend/firebase/init";
import { EmployeeModel } from "@/lib/models/employee";
import { timestampFormat } from "@/lib/util/dayjs_format";
import dayjs from "dayjs";
import { collection, doc, writeBatch } from "firebase/firestore";

/**
 * Service for importing section settings data
 */
export class SectionSettingsImportService {
    /**
     * Batch import section settings data
     * @param items - Array of section data to import
     * @param ctx - Context containing hrSettings and employees for reference resolution
     * @returns Promise with successful count, failed count, and errors
     */
    static async batchImportSectionSettings(
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
            // Preload existing sections for create/update determination
            const existingSections = await hrSettingsService.getAll("sectionSettings");

            // Create lookup maps for reference resolution
            const employeesByEmployeeID = new Map<string, EmployeeModel>();
            if (ctx.employees) {
                ctx.employees.forEach(emp => {
                    employeesByEmployeeID.set(emp.employeeID, emp);
                });
            }

            const departmentsByName = new Map<string, any>();
            if (ctx.hrSettings?.departmentSettings) {
                ctx.hrSettings.departmentSettings.forEach(dept => {
                    departmentsByName.set(dept.name, dept);
                });
            }

            // Create lookup map for existing sections by name+code key
            const sectionsByNameCodeKey = new Map<string, any>();
            existingSections.forEach(section => {
                const key = `${section.name.toLowerCase().trim()}|${section.code.toLowerCase().trim()}`;
                sectionsByNameCodeKey.set(key, section);
            });

            // Process each item
            for (let i = 0; i < items.length; i++) {
                const item = items[i];
                try {
                    // Normalize active to boolean
                    const active = normalizeActiveToBoolean(item.active);

                    // Resolve supervisor reference
                    let supervisor: string | null = null;
                    if (item.supervisor && String(item.supervisor).trim() !== "") {
                        const employee = employeesByEmployeeID.get(item.supervisor);
                        if (employee) {
                            supervisor = employee.uid;
                        } else {
                            failed++;
                            errors.push(
                                `Row ${i + 1}: Supervisor with employee ID '${item.supervisor}' does not exist`,
                            );
                            continue;
                        }
                    }

                    // Resolve department reference
                    let department: string | null = null;
                    if (item.department && String(item.department).trim() !== "") {
                        const dept = departmentsByName.get(item.department);
                        if (dept) {
                            department = dept.id;
                        } else {
                            failed++;
                            errors.push(
                                `Row ${i + 1}: Department '${item.department}' does not exist`,
                            );
                            continue;
                        }
                    }

                    // Determine create vs update
                    const nameCodeKey = `${item.name.toLowerCase().trim()}|${item.code.toLowerCase().trim()}`;
                    const existingSection = sectionsByNameCodeKey.get(nameCodeKey);

                    const timestamp = dayjs().format(timestampFormat);

                    if (existingSection) {
                        // Update existing section
                        const docRef = doc(
                            db,
                            "hrSettings",
                            "main",
                            "sectionSettings",
                            existingSection.id,
                        );
                        batch.update(docRef, {
                            name: item.name,
                            code: item.code,
                            department,
                            supervisor,
                            active,
                            updatedAt: timestamp,
                        });
                    } else {
                        // Create new section
                        const docRef = doc(collection(db, "hrSettings", "main", "sectionSettings"));
                        batch.set(docRef, {
                            name: item.name,
                            code: item.code,
                            department,
                            supervisor,
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
