"use client";

import { useState, useEffect } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/lib/backend/firebase/init";
import { DependentModel } from "@/lib/models/dependent";

export interface DependentsDataState {
    dependents: DependentModel[];
    loading: boolean;
    error: string | null;
}

export function useDependentsData(): DependentsDataState {
    const [dependents, setDependents] = useState<DependentModel[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let unsubscribe: () => void;

        const loadDependents = async () => {
            try {
                setLoading(true);
                setError(null);

                const dependentsRef = collection(db, "dependents");
                const q = query(dependentsRef);

                unsubscribe = onSnapshot(
                    q,
                    snapshot => {
                        const dependentsData = snapshot.docs.map(
                            doc => ({ id: doc.id, ...doc.data() }) as DependentModel,
                        );
                        setDependents(dependentsData);
                        setLoading(false);
                    },
                    err => {
                        console.error("Error loading dependents:", err);
                        setError("Failed to load dependents");
                        setLoading(false);
                    },
                );
            } catch (err) {
                console.error("Error setting up dependents listener:", err);
                setError("Failed to load dependents");
                setLoading(false);
            }
        };

        loadDependents();

        return () => {
            if (unsubscribe) {
                unsubscribe();
            }
        };
    }, []);

    return {
        dependents,
        loading,
        error,
    };
}
