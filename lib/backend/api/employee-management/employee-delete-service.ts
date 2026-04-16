import { admin } from "../../firebase/admin";
import {
    attendanceCollection,
    disciplinaryActionCollection,
    employeeCollection,
    employeeCompensationCollection,
    employeeDocumentCollection,
    employeeLoanCollection,
    overtimeRequestCollection,
    talentAcquisitionCollection,
    transferCollection,
} from "../../firebase/collections";
const db = admin.firestore();
import { EmployeeModel } from "@/lib/models/employee";
import { createLog } from "../logCollection";
import { LogInfo } from "@/lib/log-descriptions/employee-management";
import { deleteCompensation } from "../compensation-benefit/compensation-service";
import { deleteLoan } from "../compensation-benefit/loan-services";
import { deleteDisciplinaryAction } from "../disciplinary-actions/disciplinary-actions-service";
import { getDependentsByEmployee, deleteDependent } from "./dependent-service";
import { deleteEmployeeDocument } from "./employee-document-service";

/**
 * Completely delete an employee and all associated data from all collections.
 * This includes Firebase Auth user deletion.
 */
export async function deleteEmployeeCascade(
    employeeId: string,
    actionBy?: string,
    logInfo?: LogInfo,
): Promise<{ success: boolean; errors: string[] }> {
    const errors: string[] = [];

    try {
        // First get the employee data to get the UID
        const employee = await getEmployeeById(employeeId);
        if (!employee) {
            return { success: false, errors: ["Employee not found"] };
        }

        const employeeUid = employee.uid;

        // 1. Delete from Firebase Auth
        try {
            await admin.auth().deleteUser(employeeUid);
        } catch (authError: any) {
            console.error("Error deleting Firebase Auth user:", authError);
            errors.push(`Firebase Auth deletion failed: ${authError.message}`);
        }

        // 2. Delete employee document
        const employeeDeleted = await deleteEmployee(employeeId, actionBy, logInfo);
        if (!employeeDeleted) {
            errors.push("Failed to delete employee document");
        }

        // 3. Delete dependents
        try {
            console.log("Deleting dependents for employee:", employeeId);
            const dependents = await getDependentsByEmployee(employeeId);
            console.log("Found dependents to delete:", dependents.length);
            for (const dependent of dependents) {
                console.log("Deleting dependent:", dependent.id);
                if (dependent.id) await deleteDependent(dependent.id, undefined, undefined);
            }
            console.log("Successfully deleted all dependents");
        } catch (error: any) {
            console.error("Error deleting dependents:", error);
            if (error.code === "permission-denied") {
                errors.push(`Permission denied deleting dependents: ${error.message}`);
            } else {
                errors.push("Failed to delete dependents");
            }
        }

        // 4. Delete employee loans
        try {
            console.log("Deleting employee loans for UID:", employeeUid);

            const loansSnapshot = await db
                .collection("employeeLoan")
                .where("employeeUid", "==", employeeUid)
                .get();
            console.log("Found loans to delete:", loansSnapshot.docs.length);
            for (const loanDoc of loansSnapshot.docs) {
                console.log("Deleting loan:", loanDoc.id);
                await db.collection("employeeLoan").doc(loanDoc.id).delete();
            }
            console.log("Successfully deleted all loans");
        } catch (error: any) {
            console.error("Error deleting loans:", error);
            if (error.code === "permission-denied") {
                errors.push(`Permission denied deleting loans: ${error.message}`);
            } else {
                errors.push("Failed to delete employee loans");
            }
        }

        // 5. Delete employee compensation records
        try {
            console.log("Deleting compensation records for UID:", employeeUid);

            const compSnapshot = await db
                .collection("employeeCompensation")
                .where("employeeUid", "==", employeeUid)
                .get();
            console.log("Found compensation records to delete:", compSnapshot.docs.length);
            for (const compDoc of compSnapshot.docs) {
                console.log("Deleting compensation:", compDoc.id);
                await db.collection("employeeCompensation").doc(compDoc.id).delete();
            }
            console.log("Successfully deleted all compensation records");
        } catch (error: any) {
            console.error("Error deleting compensation:", error);
            if (error.code === "permission-denied") {
                errors.push(`Permission denied deleting compensation: ${error.message}`);
            } else {
                errors.push("Failed to delete employee compensation");
            }
        }

        // 6. Delete disciplinary actions
        try {
            console.log("Deleting disciplinary actions for UID:", employeeUid);

            const discSnapshot = await db
                .collection("disciplinaryAction")
                .where("employeeUid", "==", employeeUid)
                .get();
            console.log("Found disciplinary actions to delete:", discSnapshot.docs.length);
            for (const discDoc of discSnapshot.docs) {
                console.log("Deleting disciplinary action:", discDoc.id);
                await deleteDisciplinaryAction(discDoc.id, actionBy ?? "");
            }
            console.log("Successfully deleted all disciplinary actions");
        } catch (error: any) {
            console.error("Error deleting disciplinary actions:", error);
            if (error.code === "permission-denied") {
                errors.push(`Permission denied deleting disciplinary actions: ${error.message}`);
            } else {
                errors.push("Failed to delete disciplinary actions");
            }
        }

        // 7. Delete transfers
        try {
            console.log("Deleting transfers for UID:", employeeUid);

            const transferSnapshot = await db
                .collection("transfer")
                .where("employeeUID", "==", employeeUid)
                .get();
            console.log("Found transfers to delete:", transferSnapshot.docs.length);
            for (const transferDoc of transferSnapshot.docs) {
                console.log("Deleting transfer:", transferDoc.id);
                await db.collection("transfer").doc(transferDoc.id).delete();
            }
            console.log("Successfully deleted all transfers");
        } catch (error: any) {
            console.error("Error deleting transfers:", error);
            if (error.code === "permission-denied") {
                errors.push(`Permission denied deleting transfers: ${error.message}`);
            } else {
                errors.push("Failed to delete transfers");
            }
        }

        // 8. Delete overtime requests (remove from arrays)
        try {
            console.log("Deleting overtime requests for UID:", employeeUid);

            const otSnapshot = await db
                .collection("overtimeRequest")
                .where("employeeUids", "array-contains", employeeUid)
                .get();
            console.log("Found overtime requests to process:", otSnapshot.docs.length);
            for (const otDoc of otSnapshot.docs) {
                const data = otDoc.data();
                const updatedUids = data.employeeUids.filter((uid: string) => uid !== employeeUid);
                if (updatedUids.length === 0) {
                    // Delete the entire request if no employees left
                    console.log("Deleting overtime request:", otDoc.id);
                    await db.collection("overtimeRequest").doc(otDoc.id).delete();
                } else {
                    // Remove this employee from the array
                    console.log("Removing employee from overtime request:", otDoc.id);
                    await db
                        .collection("overtimeRequest")
                        .doc(otDoc.id)
                        .update({ employeeUids: updatedUids });
                }
            }
            console.log("Successfully processed all overtime requests");
        } catch (error: any) {
            console.error("Error deleting overtime requests:", error);
            if (error.code === "permission-denied") {
                errors.push(`Permission denied deleting overtime requests: ${error.message}`);
            } else {
                errors.push("Failed to delete overtime requests");
            }
        }

        // 9. Delete attendance records
        try {
            console.log("Deleting attendance records for UID:", employeeUid);

            const attSnapshot = await db
                .collection("attendance")
                .where("uid", "==", employeeUid)
                .get();
            console.log("Found attendance records to delete:", attSnapshot.docs.length);
            for (const attDoc of attSnapshot.docs) {
                console.log("Deleting attendance record:", attDoc.id);
                await db.collection("attendance").doc(attDoc.id).delete();
            }
            console.log("Successfully deleted all attendance records");
        } catch (error: any) {
            console.error("Error deleting attendance:", error);
            if (error.code === "permission-denied") {
                errors.push(`Permission denied deleting attendance: ${error.message}`);
            } else {
                errors.push("Failed to delete attendance records");
            }
        }

        // 10. Delete employee documents
        try {
            console.log("Deleting employee documents for UID:", employeeUid);

            const docSnapshot = await db
                .collection("employeeDocuments")
                .where("uid", "==", employeeUid)
                .get();
            console.log("Found employee documents to delete:", docSnapshot.docs.length);
            for (const doc of docSnapshot.docs) {
                console.log("Deleting employee document:", doc.id);
                await deleteEmployeeDocument(doc.id);
            }
            console.log("Successfully deleted all employee documents");
        } catch (error: any) {
            console.error("Error deleting employee documents:", error);
            if (error.code === "permission-denied") {
                errors.push(`Permission denied deleting employee documents: ${error.message}`);
            } else {
                errors.push("Failed to delete employee documents");
            }
        }

        // Continue with other deletions...
        // Note: This is a comprehensive implementation. In a real scenario,
        // you might want to add more error handling and potentially make some deletions optional.

        return { success: errors.length === 0, errors };
    } catch (error) {
        console.error("Critical error in deleteEmployeeCascade:", error);
        return { success: false, errors: ["Critical deletion error occurred"] };
    }
}

// Helper function to get employee by ID
async function getEmployeeById(id: string): Promise<EmployeeModel | null> {
    const docRef = db.collection("employee").doc(id);
    const snapshot = await docRef.get();
    if (snapshot.exists) {
        return { id: snapshot.id, ...snapshot.data() } as EmployeeModel;
    }
    return null;
}

// Helper function to delete employee
async function deleteEmployee(id: string, actionBy?: string, logInfo?: LogInfo): Promise<boolean> {
    const docRef = db.collection("employee").doc(id);
    try {
        await docRef.delete();
        // Log the deletion if logInfo is provided
        if (logInfo) {
            await createLog(logInfo, actionBy ?? "", "Success");
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
                actionBy ?? "",
                "Failure",
            );
        }
        return false;
    }
}
