import {
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    query,
    setDoc,
    updateDoc,
    where,
} from "firebase/firestore";
import { employeeInfoChangeRequestCollection } from "../firebase/collections";
import { db } from "../firebase/init";
import { EmployeeInfoChangeRequestModel } from "@/lib/models/employee-info-change-request";

const collectionRef = employeeInfoChangeRequestCollection;
const collectionName = collectionRef.id;

export async function createEmployeeInfoChangeRequest(
    data: Omit<EmployeeInfoChangeRequestModel, "id">,
): Promise<boolean> {
    try {
        const docRef = doc(collectionRef);

        // Ensure all fields have defined values to prevent Firebase errors
        const safeData = {
            ...data,
            id: docRef.id,
            // Provide default values for potentially undefined fields
            firstName: data.firstName || "",
            middleName: data.middleName || "",
            surname: data.surname || "",
            birthDate: data.birthDate || "",
            birthPlace: data.birthPlace || "",
            levelOfEducation: data.levelOfEducation || "",
            yearsOfExperience: data.yearsOfExperience || "",
            maritalStatus: data.maritalStatus || "",
            personalPhone: data.personalPhone || "",
            personalEmail: data.personalEmail || "",
            bankAccount: data.bankAccount || "",
            tinNumber: data.tinNumber || "",
            emergencyContactName: data.emergencyContactName || "",
            relationshipToEmployee: data.relationshipToEmployee || "",
            phoneNumber1: data.phoneNumber1 || "",
            phoneNumber2: data.phoneNumber2 || "",
            emailAddress1: data.emailAddress1 || "",
            emailAddress2: data.emailAddress2 || "",
            physicalAddress1: data.physicalAddress1 || "",
            physicalAddress2: data.physicalAddress2 || "",
            requestStatus: data.requestStatus || "pending",
            timestamp: data.timestamp || new Date().toISOString(),
            employeeId: data.employeeId || "",
            uid: data.uid || "",
        };

        await setDoc(docRef, safeData);
        return true;
    } catch (error) {
        console.log("Error creating employee info change request", error);
        return false;
    }
}

export async function getEmployeeInfoChangeRequestById(
    id: string,
): Promise<EmployeeInfoChangeRequestModel | null> {
    const docRef = doc(db, collectionName, id);
    const snapshot = await getDoc(docRef);
    if (snapshot.exists()) {
        return { id: snapshot.id, ...snapshot.data() } as EmployeeInfoChangeRequestModel;
    }
    return null;
}

export async function getEmployeeInfoChangeRequestsByUid(
    uid: string,
): Promise<EmployeeInfoChangeRequestModel[]> {
    const q = query(collectionRef, where("uid", "==", uid));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(
        doc => ({ id: doc.id, ...doc.data() }) as EmployeeInfoChangeRequestModel,
    );
}

export async function getEmployeeInfoChangeRequestsByEmployeeId(
    employeeId: string,
): Promise<EmployeeInfoChangeRequestModel[]> {
    const q = query(collectionRef, where("employeeId", "==", employeeId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(
        doc => ({ id: doc.id, ...doc.data() }) as EmployeeInfoChangeRequestModel,
    );
}

export async function updateEmployeeInfoChangeRequest(
    data: Partial<EmployeeInfoChangeRequestModel> & { id: string },
): Promise<boolean> {
    const docRef = doc(db, collectionName, data.id);
    try {
        await updateDoc(docRef, data as any);
        return true;
    } catch (err) {
        console.error(err);
        return false;
    }
}

export async function deleteEmployeeInfoChangeRequest(id: string): Promise<boolean> {
    const docRef = doc(db, collectionName, id);
    try {
        await deleteDoc(docRef);
        return true;
    } catch (err) {
        console.error(err);
        return false;
    }
}

export async function getAllEmployeeInfoChangeRequests(): Promise<
    EmployeeInfoChangeRequestModel[]
    > {
    const snapshot = await getDocs(collectionRef);
    return snapshot.docs.map(
        doc => ({ id: doc.id, ...doc.data() }) as EmployeeInfoChangeRequestModel,
    );
}
