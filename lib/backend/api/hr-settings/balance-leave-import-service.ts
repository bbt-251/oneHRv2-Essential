import { db } from "@/lib/backend/firebase/init";
import { employeeCollection } from "@/lib/backend/firebase/collections";
import { query, where, getDocs, writeBatch, serverTimestamp } from "firebase/firestore";

/**
 * Balance Leave Days Import Service - Handles leave balance import operations
 * Updates employee leave balances in batches for better performance
 */
export class BalanceLeaveImportService {
    /**
     * Batch import balance leave days
     */
    static async batchImportBalanceLeaveDays(
        balanceData: Array<{
            employeeID: string;
            balanceLeaveDays: number;
            accrualLeaveDays?: number;
        }>,
    ): Promise<{
        successful: number;
        failed: number;
        errors: string[];
    }> {
        const errors: string[] = [];
        let successful = 0;
        let failed = 0;

        try {
            // Process in chunks of 500 (Firestore batch limit)
            const chunkSize = 500;
            const chunks = [];

            for (let i = 0; i < balanceData.length; i += chunkSize) {
                chunks.push(balanceData.slice(i, i + chunkSize));
            }

            for (const chunk of chunks) {
                const currentBatch = writeBatch(db);

                for (const balance of chunk) {
                    try {
                        // First, find the employee document
                        const employeeQuery = query(
                            employeeCollection,
                            where("employeeID", "==", balance.employeeID),
                        );
                        const employeeSnapshot = await getDocs(employeeQuery);

                        if (employeeSnapshot.empty) {
                            failed++;
                            errors.push(`Employee ${balance.employeeID}: Employee not found`);
                            continue;
                        }

                        const employeeDoc = employeeSnapshot.docs[0];
                        const updateData: any = {
                            balanceLeaveDays: balance.balanceLeaveDays,
                            updatedAt: serverTimestamp(),
                        };

                        if (balance.accrualLeaveDays !== undefined) {
                            updateData.accrualLeaveDays = balance.accrualLeaveDays;
                        }

                        currentBatch.update(employeeDoc.ref, updateData);
                        successful++;
                    } catch (error) {
                        failed++;
                        errors.push(`Employee ${balance.employeeID}: ${error}`);
                    }
                }

                await currentBatch.commit();
            }

            return { successful, failed, errors };
        } catch (error) {
            console.error("Error in batch import balance leave days:", error);
            throw new Error("Failed to batch import balance leave days");
        }
    }
}
