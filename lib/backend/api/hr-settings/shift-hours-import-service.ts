import { collection, doc, writeBatch, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/backend/firebase/init";

/**
 * Service for importing shift hours data with batch upsert operations
 */
export class ShiftHoursImportService {
    /**
     * Batch import shift hours data with upsert logic (create or update by name)
     */
    static async batchImportShiftHours(
        importData: Array<{
            name: string;
            shiftHours: Array<{ startTime: string; endTime: string }>;
            active: "Yes" | "No";
            timestamp: string;
        }>,
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
            // Get all existing shift hours for upsert logic
            const existingShiftHours = await this.getAllExistingShiftHours();
            const existingByName = new Map(existingShiftHours.map(sh => [sh.name, sh]));

            // Prepare batch operations
            for (const item of importData) {
                try {
                    const existing = existingByName.get(item.name);

                    if (existing) {
                        // Update existing document
                        const docRef = doc(db, "hrSettings", "main", "shiftHours", existing.id);
                        batch.update(docRef, {
                            shiftHours: item.shiftHours,
                            active: item.active,
                            timestamp: item.timestamp,
                        });
                    } else {
                        // Create new document
                        const collectionRef = collection(db, "hrSettings", "main", "shiftHours");
                        const newDocRef = doc(collectionRef);
                        batch.set(newDocRef, {
                            name: item.name,
                            shiftHours: item.shiftHours,
                            active: item.active,
                            timestamp: item.timestamp,
                        });
                    }

                    successful++;
                } catch (error) {
                    failed++;
                    errors.push(
                        `Failed to process shift hour '${item.name}': ${error instanceof Error ? error.message : "Unknown error"}`,
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

    /**
     * Get all existing shift hours for upsert logic
     */
    private static async getAllExistingShiftHours(): Promise<
        Array<{
            id: string;
            name: string;
            shiftHours: Array<{ startTime: string; endTime: string }>;
            active: "Yes" | "No";
            timestamp: string;
        }>
        > {
        try {
            const collectionRef = collection(db, "hrSettings", "main", "shiftHours");
            const snapshot = await getDocs(collectionRef);
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            })) as Array<{
                id: string;
                name: string;
                shiftHours: Array<{ startTime: string; endTime: string }>;
                active: "Yes" | "No";
                timestamp: string;
            }>;
        } catch (error) {
            console.error("Error fetching existing shift hours:", error);
            return [];
        }
    }
}
