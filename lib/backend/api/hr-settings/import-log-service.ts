import { db } from "@/lib/backend/firebase/init";
import {
    collection,
    doc,
    addDoc,
    updateDoc,
    deleteDoc,
    getDocs,
    getDoc,
    query,
    orderBy,
    limit,
    where,
    serverTimestamp,
} from "firebase/firestore";
import { ImportLogModel } from "@/lib/models/import-log";
import { getTimestamp } from "@/lib/util/dayjs_format";

/**
 * Import Log Service - Handles CRUD operations for import logs
 * Manages audit trails and history of all import operations
 */
export class ImportLogService {
    /**
     * Get the importLogs subcollection reference
     */
    private static getImportLogsCollection() {
        return collection(db, "hrSettings", "main", "importLogs");
    }

    // ==================== IMPORT LOG CRUD OPERATIONS ====================

    /**
     * Creates a new import log entry
     */
    static async createImportLog(importLog: ImportLogModel): Promise<string> {
        try {
            const docRef = await addDoc(this.getImportLogsCollection(), {
                ...importLog,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });
            return docRef.id;
        } catch (error) {
            console.error("Error creating import log:", error);
            throw new Error("Failed to create import log");
        }
    }

    /**
     * Retrieves all import logs ordered by timestamp (most recent first)
     */
    static async getAllImportLogs(limitCount: number = 50): Promise<ImportLogModel[]> {
        try {
            const q = query(
                this.getImportLogsCollection(),
                orderBy("createdAt", "desc"),
                limit(limitCount),
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(
                doc =>
                    ({
                        id: doc.id,
                        ...doc.data(),
                    }) as ImportLogModel,
            );
        } catch (error) {
            console.error("Error fetching import logs:", error);
            throw new Error("Failed to fetch import logs");
        }
    }

    /**
     * Retrieves import logs by type
     */
    static async getImportLogsByType(
        type: string,
        limitCount: number = 20,
    ): Promise<ImportLogModel[]> {
        try {
            const q = query(
                this.getImportLogsCollection(),
                where("type", "==", type),
                orderBy("createdAt", "desc"),
                limit(limitCount),
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(
                doc =>
                    ({
                        id: doc.id,
                        ...doc.data(),
                    }) as ImportLogModel,
            );
        } catch (error) {
            console.error("Error fetching import logs by type:", error);
            throw new Error("Failed to fetch import logs by type");
        }
    }

    /**
     * Retrieves a single import log by ID
     */
    static async getImportLogById(id: string): Promise<ImportLogModel | null> {
        try {
            const docRef = doc(this.getImportLogsCollection(), id);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                return {
                    id: docSnap.id,
                    ...docSnap.data(),
                } as ImportLogModel;
            }
            return null;
        } catch (error) {
            console.error("Error fetching import log:", error);
            throw new Error("Failed to fetch import log");
        }
    }

    /**
     * Updates an import log
     */
    static async updateImportLog(id: string, updates: Partial<ImportLogModel>): Promise<void> {
        try {
            const docRef = doc(this.getImportLogsCollection(), id);
            await updateDoc(docRef, {
                ...updates,
                updatedAt: serverTimestamp(),
            });
        } catch (error) {
            console.error("Error updating import log:", error);
            throw new Error("Failed to update import log");
        }
    }

    /**
     * Deletes an import log
     */
    static async deleteImportLog(id: string): Promise<void> {
        try {
            const docRef = doc(this.getImportLogsCollection(), id);
            await deleteDoc(docRef);
        } catch (error) {
            console.error("Error deleting import log:", error);
            throw new Error("Failed to delete import log");
        }
    }
}
