"use client";

import { useState, useEffect } from "react";
import { collection, onSnapshot, query } from "firebase/firestore";
import { db } from "@/lib/backend/firebase/init";
import { TransferModel } from "@/lib/models/transfer";

export interface TransfersDataState {
    transfers: TransferModel[];
    loading: boolean;
    error: string | null;
}

export function useTransfersData(): TransfersDataState {
    const [transfers, setTransfers] = useState<TransferModel[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let unsubscribe: () => void;

        const loadTransfers = async () => {
            try {
                setLoading(true);
                setError(null);

                const transfersRef = collection(db, "transfer");
                const q = query(transfersRef);

                unsubscribe = onSnapshot(
                    q,
                    snapshot => {
                        const transfersData = snapshot.docs.map(
                            doc => ({ id: doc.id, ...doc.data() }) as TransferModel,
                        );
                        setTransfers(transfersData);
                        setLoading(false);
                    },
                    err => {
                        console.error("Error loading transfers:", err);
                        setError("Failed to load transfers");
                        setLoading(false);
                    },
                );
            } catch (err) {
                console.error("Error setting up transfers listener:", err);
                setError("Failed to load transfers");
                setLoading(false);
            }
        };

        loadTransfers();

        return () => {
            if (unsubscribe) {
                unsubscribe();
            }
        };
    }, []);

    return {
        transfers,
        loading,
        error,
    };
}
