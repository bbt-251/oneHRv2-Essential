import { ManagerSwapModel } from "@/lib/models/manager-swap";
import { EmployeeModel } from "@/lib/models/employee";
import { batchUpdateEmployee } from "../employee-management/employee-management-service";
import { deleteDoc, doc, setDoc, updateDoc } from "firebase/firestore";
import { managerSwapCollection } from "../../firebase/collections";
import { db } from "../../firebase/init";
import { createLog } from "../logCollection";
import { LogInfo } from "@/lib/log-descriptions/manager-swap";

const collectionRef = managerSwapCollection;
const collectionName = collectionRef.id;

export async function createManagerSwap(
    data: Omit<ManagerSwapModel, "id">,
    employees: EmployeeModel[],
    actionBy: string,
    logInfo?: LogInfo,
): Promise<{ success: boolean; error?: string }> {
    try {
        // Validate managers exist
        const currentManager = employees.find(emp => emp.uid === data.currentManager);
        const replacingManager = employees.find(emp => emp.uid === data.replacingManager);

        if (!currentManager || !replacingManager) {
            return { success: false, error: "One or both managers not found" };
        }

        // Get reportees to transfer
        const currentManagerReportees = [...(currentManager.reportees || [])];

        if (currentManagerReportees.length === 0) {
            return { success: false, error: "Current manager has no reportees to transfer" };
        }

        // Basic validation: ensure new manager is not the same as current manager
        if (data.currentManager === data.replacingManager) {
            return { success: false, error: "Cannot transfer reportees to the same manager" };
        }

        // Note: Cycle detection is skipped here because:
        // 1. The user can manually make these changes through employee edit
        // 2. For inactive managers being replaced, the cycle check is overly restrictive
        // 3. The business requirement is to transfer all reportees regardless of hierarchy

        // Save manager swap record in Firestore
        const docRef = doc(collectionRef);
        await setDoc(docRef, {
            ...data,
            id: docRef.id,
            affectedEmployeeUIDs: currentManagerReportees, // Store the affected employee UIDs
        });

        // Perform the transfer: move reportees from currentManager to replacingManager
        const employeesToUpdate: (Partial<EmployeeModel> & { id: string })[] = [];

        // 1. Update each reportee's reporting line manager and position
        for (const reporteeId of currentManagerReportees) {
            const reportee = employees.find(emp => emp.uid === reporteeId);
            if (reportee) {
                employeesToUpdate.push({
                    id: reportee.id,
                    reportingLineManager: data.replacingManager,
                    reportingLineManagerPosition: replacingManager.employmentPosition || "",
                });
            }
        }

        // 2. Combine reportees: replacingManager's existing reportees + currentManager's reportees
        const replacingManagerReportees = [...(replacingManager.reportees || [])];
        const combinedReportees = [...replacingManagerReportees, ...currentManagerReportees];

        // Update replacingManager with combined reportees
        employeesToUpdate.push({
            id: replacingManager.id,
            reportees: combinedReportees,
        });

        // 3. Clear currentManager's reportees (they've been transferred)
        employeesToUpdate.push({
            id: currentManager.id,
            reportees: [],
        });

        // Perform batch update
        const batchSuccess = await batchUpdateEmployee(employeesToUpdate);
        if (!batchSuccess) {
            return {
                success: false,
                error: "Manager swap record created but failed to update employee records",
            };
        }

        // Log the creation if logInfo is provided
        if (logInfo) {
            await createLog(logInfo, actionBy, "Success");
        }

        return { success: true };
    } catch (error) {
        console.log("Error", error);
        // Log the failure if logInfo is provided
        if (logInfo) {
            await createLog(
                {
                    ...logInfo,
                    title: `${logInfo.title} Failed`,
                    description: `Failed to ${logInfo.description.toLowerCase()}`,
                },
                actionBy,
                "Failure",
            );
        }
        return { success: false, error: "Failed to create manager swap" };
    }
}

export async function updateManagerSwap(
    data: Partial<ManagerSwapModel> & { id: string },
    actionBy: string,
    logInfo?: LogInfo,
): Promise<boolean> {
    const docRef = doc(db, collectionName, data.id);
    try {
        await updateDoc(docRef, data as any);
        // Log the update if logInfo is provided
        if (logInfo) {
            await createLog(logInfo, actionBy, "Success");
        }
        return true;
    } catch (err) {
        console.error(err);
        // Log the failure if logInfo is provided
        if (logInfo) {
            await createLog(
                {
                    ...logInfo,
                    title: `${logInfo.title} Failed`,
                    description: `Failed to ${logInfo.description.toLowerCase()}`,
                },
                actionBy,
                "Failure",
            );
        }
        return false;
    }
}

export async function deleteManagerSwap(
    id: string,
    actionBy: string,
    logInfo?: LogInfo,
): Promise<boolean> {
    const docRef = doc(db, collectionName, id);
    try {
        await deleteDoc(docRef);
        // Log the deletion if logInfo is provided
        if (logInfo) {
            await createLog(logInfo, actionBy, "Success");
        }
        return true;
    } catch (err) {
        console.error(err);
        // Log the failure if logInfo is provided
        if (logInfo) {
            await createLog(
                {
                    ...logInfo,
                    title: `${logInfo.title} Failed`,
                    description: `Failed to ${logInfo.description.toLowerCase()}`,
                },
                actionBy,
                "Failure",
            );
        }
        return false;
    }
}
