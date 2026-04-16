import { roleCollection } from "@/lib/backend/firebase/collections";
import { RoleModel } from "@/lib/models/career-path";
import {
    addDoc,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    updateDoc,
    query,
    where,
} from "firebase/firestore";

export const roleService = {
    createRole: async (roleData: Partial<RoleModel>, userId?: string): Promise<string> => {
        const role: RoleModel = {
            ...roleData,
            id: "",
            timestamp: new Date().toISOString(),
        } as RoleModel;

        const docRef = await addDoc(roleCollection, role as any);
        await updateDoc(docRef, { id: docRef.id });

        return docRef.id;
    },

    getRoles: async (): Promise<RoleModel[]> => {
        const snapshot = await getDocs(roleCollection);
        return snapshot.docs.map(doc => doc.data() as RoleModel);
    },

    getRoleById: async (id: string): Promise<RoleModel | null> => {
        const docRef = doc(roleCollection, id);
        const snapshot = await getDoc(docRef);
        return snapshot.exists() ? (snapshot.data() as RoleModel) : null;
    },

    updateRole: async (
        id: string,
        roleData: Partial<RoleModel>,
        userId?: string,
    ): Promise<void> => {
        const docRef = doc(roleCollection, id);
        await updateDoc(docRef, {
            ...roleData,
            timestamp: new Date().toISOString(),
        } as any);
    },

    deleteRole: async (id: string, userId?: string): Promise<void> => {
        await deleteDoc(doc(roleCollection, id));
    },

    // Additional helper methods
    getByTrackId: async (trackId: string): Promise<RoleModel[]> => {
        const q = query(roleCollection, where("trackId", "==", trackId));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => doc.data() as RoleModel);
    },

    getByLevel: async (level: string): Promise<RoleModel[]> => {
        const q = query(roleCollection, where("level", "==", level));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => doc.data() as RoleModel);
    },
};
