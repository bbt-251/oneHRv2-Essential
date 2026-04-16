import { collection, onSnapshot, query, Unsubscribe, where } from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "@/lib/backend/firebase/init";
import { useAuth } from "@/context/authContext";

export interface FirestoreGroupState<T> {
    data: T[];
    loading: boolean;
    error: string | null;
}

export interface CollectionConfig<T> {
    collectionRef: any;
    key: string;
    userFilter?: boolean;
    transform?: (doc: any) => T;
}

export function useFirestoreGroup<T extends { id: string }>(
    collections: Record<string, CollectionConfig<T>>,
    groupName: string,
): Record<string, FirestoreGroupState<T>> {
    const { userData, authLoading } = useAuth();
    const [groupState, setGroupState] = useState<Record<string, FirestoreGroupState<T>>>({});
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Wait for auth to finish loading before starting queries
        if (authLoading) {
            return;
        }

        const unsubscribes: Unsubscribe[] = [];
        let hasAnyData = false;

        // Initialize state for all collections in this group
        const initialState: Record<string, FirestoreGroupState<T>> = {};
        Object.keys(collections).forEach(key => {
            initialState[key] = {
                data: [],
                loading: true,
                error: null,
            };
        });
        setGroupState(initialState);

        try {
            Object.entries(collections).forEach(([key, config]) => {
                let q = query(config.collectionRef);

                // Apply user-specific filters if needed
                if (
                    config.userFilter &&
                    userData?.role?.length === 1 &&
                    userData?.role?.includes("Employee")
                ) {
                    q = query(config.collectionRef, where("uid", "==", userData?.uid));
                }

                const unsubscribe = onSnapshot(
                    q,
                    snapshot => {
                        const docsData = snapshot.docs.map(doc => {
                            const baseData = { id: doc.id, ...(doc.data() as any) };
                            return config.transform ? config.transform(baseData) : (baseData as T);
                        });

                        setGroupState(prev => ({
                            ...prev,
                            [key]: {
                                data: docsData,
                                loading: false,
                                error: null,
                            },
                        }));

                        // Check if this collection has data
                        if (docsData.length > 0) {
                            hasAnyData = true;
                        }
                    },
                    error => {
                        setError(error.message);
                        setGroupState(prev => ({
                            ...prev,
                            [key]: {
                                ...prev[key],
                                loading: false,
                                error: error.message,
                            },
                        }));

                        if (error.code === "permission-denied") {
                            setGroupState(prev => ({
                                ...prev,
                                [key]: {
                                    ...prev[key],
                                    data: [],
                                    loading: false,
                                    error: null,
                                },
                            }));
                        }
                    },
                );
                unsubscribes.push(unsubscribe);
            });

            // Set loading to false once all listeners are set up
            // In a real implementation, you might want to wait for actual data
            setTimeout(() => {
                setLoading(false);
            }, 1000);
        } catch (err) {
            setError("Failed to setup listeners");
            setLoading(false);
        }

        return () => {
            unsubscribes.forEach(unsub => unsub());
        };
    }, [userData?.uid, userData?.role, authLoading]);

    return groupState;
}
