import { EmployeeLoanModel } from "@/lib/models/employeeLoan";
import { deleteDoc, doc, setDoc, updateDoc } from "firebase/firestore";
import { employeeLoanCollection } from "../../firebase/collections";
import { db } from "../../firebase/init";
import { createLog } from "../logCollection";
import { LogInfo } from "@/lib/log-descriptions/compensation";

const collectionRef = employeeLoanCollection;
const collectionName = collectionRef.id;

export async function createLoan(
    data: Omit<EmployeeLoanModel, "id">,
    actionBy?: string,
    logInfo?: LogInfo,
): Promise<boolean> {
    try {
        // Save employee in Firestore
        const docRef = doc(collectionRef);
        await setDoc(docRef, {
            ...data,
            id: docRef.id,
        });

        // Log the creation if logInfo is provided
        if (logInfo) {
            await createLog(logInfo, actionBy ?? "", "Success");
        }

        return true;
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
                actionBy ?? "",
                "Failure",
            );
        }
        return false;
    }
}

export async function updateLoan(
    data: Partial<EmployeeLoanModel> & { id: string },
    actionBy?: string,
    logInfo?: LogInfo,
): Promise<boolean> {
    const docRef = doc(db, collectionName, data.id);
    try {
        await updateDoc(docRef, data as any);
        // Log the update if logInfo is provided
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

export async function deleteLoan(
    id: string,
    actionBy?: string,
    logInfo?: LogInfo,
): Promise<boolean> {
    const docRef = doc(db, collectionName, id);
    try {
        await deleteDoc(docRef);
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
