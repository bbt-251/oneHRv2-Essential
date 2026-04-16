import { onSnapshot, query, where } from "firebase/firestore";
import { employeeCollection } from "@/lib/backend/firebase/collections";
import { EmployeeModel } from "@/lib/models/employee";
import { DataGateway } from "@/lib/backend/gateways/types";

export const createFirebaseDataGateway = (): DataGateway => ({
    subscribeEmployeeByUid: (uid, callback, onError) => {
        const employeeQuery = query(employeeCollection, where("uid", "==", uid));

        return onSnapshot(
            employeeQuery,
            snapshot => {
                const employees = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                })) as EmployeeModel[];

                callback(employees, snapshot.metadata.hasPendingWrites);
            },
            error => {
                onError?.(error as Error);
            },
        );
    },
});
