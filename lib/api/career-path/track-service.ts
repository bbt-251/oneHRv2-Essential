import { trackCollection } from "@/lib/backend/firebase/collections";
import { TrackModel } from "@/lib/models/career-path";
import { addDoc, deleteDoc, doc, getDoc, getDocs, updateDoc } from "firebase/firestore";

export const trackService = {
    createTrack: async (
        trackData: Omit<TrackModel, "id" | "timestamp">,
        userId?: string,
    ): Promise<string> => {
        const track: TrackModel = {
            ...trackData,
            id: "",
            timestamp: new Date().toISOString(),
        };

        const docRef = await addDoc(trackCollection, track);
        await updateDoc(docRef, { id: docRef.id });

        return docRef.id;
    },

    getTracks: async (): Promise<TrackModel[]> => {
        const snapshot = await getDocs(trackCollection);
        return snapshot.docs.map(doc => doc.data() as TrackModel);
    },

    getTrackById: async (id: string): Promise<TrackModel | null> => {
        const docRef = doc(trackCollection, id);
        const snapshot = await getDoc(docRef);
        return snapshot.exists() ? (snapshot.data() as TrackModel) : null;
    },

    updateTrack: async (
        id: string,
        trackData: Partial<TrackModel>,
        userId?: string,
    ): Promise<void> => {
        const docRef = doc(trackCollection, id);
        await updateDoc(docRef, {
            ...trackData,
            timestamp: new Date().toISOString(),
        } as any);
    },

    deleteTrack: async (id: string, userId?: string): Promise<void> => {
        await deleteDoc(doc(trackCollection, id));
    },
};
