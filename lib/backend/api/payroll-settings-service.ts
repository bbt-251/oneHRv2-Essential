import PayrollPDFSettingsModel from "@/lib/models/payrollPDFSettings";
import { collection, deleteDoc, doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase/init";

// Collection reference - using single document approach for settings
const PAYROLL_PDF_SETTINGS_COLLECTION = "payrollPDFSettings";
const SETTINGS_DOC_ID = "default"; // Single document for settings

/**
 * Get the payroll PDF settings
 * Returns the settings document or creates a default one if not exists
 */
export async function getPayrollPDFSettings(): Promise<PayrollPDFSettingsModel | null> {
    try {
        const collectionRef = collection(db, PAYROLL_PDF_SETTINGS_COLLECTION);
        const docRef = doc(collectionRef, SETTINGS_DOC_ID);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return docSnap.data() as PayrollPDFSettingsModel;
        }

        // Return null if no settings exist yet
        return null;
    } catch (error) {
        console.error("Error getting payroll PDF settings:", error);
        return null;
    }
}

/**
 * Create or initialize payroll PDF settings
 * Returns the created settings
 */
export async function createPayrollPDFSettings(
    data: Omit<PayrollPDFSettingsModel, "id" | "createdAt" | "updatedAt">,
): Promise<PayrollPDFSettingsModel | null> {
    try {
        const collectionRef = collection(db, PAYROLL_PDF_SETTINGS_COLLECTION);
        const docRef = doc(collectionRef, SETTINGS_DOC_ID);

        const now = new Date().toISOString();
        const newSettings: PayrollPDFSettingsModel = {
            ...data,
            id: SETTINGS_DOC_ID,
            createdAt: now,
            updatedAt: now,
        };

        await setDoc(docRef, newSettings);
        return newSettings;
    } catch (error) {
        console.error("Error creating payroll PDF settings:", error);
        return null;
    }
}

/**
 * Update payroll PDF settings
 * Returns the updated settings
 */
export async function updatePayrollPDFSettings(
    data: Partial<Omit<PayrollPDFSettingsModel, "id" | "createdAt" | "updatedAt">>,
): Promise<PayrollPDFSettingsModel | null> {
    try {
        const collectionRef = collection(db, PAYROLL_PDF_SETTINGS_COLLECTION);
        const docRef = doc(collectionRef, SETTINGS_DOC_ID);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
            // If doesn't exist, create with provided data
            return createPayrollPDFSettings({
                header: data.header || null,
                footer: data.footer || null,
                signature: data.signature || null,
                stamp: data.stamp || null,
            });
        }

        const existingData = docSnap.data() as PayrollPDFSettingsModel;
        const now = new Date().toISOString();

        const updatedSettings: PayrollPDFSettingsModel = {
            ...existingData,
            ...data,
            updatedAt: now,
        };

        await updateDoc(docRef, {
            ...data,
            updatedAt: now,
        } as any);

        return updatedSettings;
    } catch (error) {
        console.error("Error updating payroll PDF settings:", error);
        return null;
    }
}

/**
 * Delete payroll PDF settings (reset to default)
 */
export async function deletePayrollPDFSettings(): Promise<boolean> {
    try {
        const collectionRef = collection(db, PAYROLL_PDF_SETTINGS_COLLECTION);
        const docRef = doc(collectionRef, SETTINGS_DOC_ID);

        await deleteDoc(docRef);
        return true;
    } catch (error) {
        console.error("Error deleting payroll PDF settings:", error);
        return false;
    }
}

/**
 * Save complete payroll PDF settings (create or update)
 * This is the main function to save settings from the UI
 */
export async function savePayrollPDFSettings(settings: {
    headerID: string;
    footerID: string;
    stampID: string;
    signatureID: string;
}): Promise<PayrollPDFSettingsModel | null> {
    try {
        // Map the UI fields to the model fields
        const data = {
            header: settings.headerID || null,
            footer: settings.footerID || null,
            signature: settings.signatureID || null,
            stamp: settings.stampID || null,
        };

        const existingSettings = await getPayrollPDFSettings();

        if (existingSettings) {
            return await updatePayrollPDFSettings(data);
        } else {
            return await createPayrollPDFSettings(data);
        }
    } catch (error) {
        console.error("Error saving payroll PDF settings:", error);
        return null;
    }
}
