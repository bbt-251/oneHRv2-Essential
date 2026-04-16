import {
    employeeCompensationCollection,
    employeeLoanCollection,
    logCollection,
} from "@/lib/backend/firebase/collections";
import { EmployeeCompensationModel } from "@/lib/models/employeeCompensation";
import { EmployeeLoanModel } from "@/lib/models/employeeLoan";
import { LogModel } from "@/lib/models/log";
import { CollectionConfig, useFirestoreGroup } from "./use-firestore-group";

export interface AdditionalDataState {
    compensations: EmployeeCompensationModel[];
    employeeLoans: EmployeeLoanModel[];
    logs: LogModel[];
}

export function useAdditionalData() {
    const collections: Record<keyof AdditionalDataState, CollectionConfig<any>> = {
        compensations: {
            collectionRef: employeeCompensationCollection,
            key: "compensations",
        },
        employeeLoans: {
            collectionRef: employeeLoanCollection,
            key: "loans",
        },
        logs: {
            collectionRef: logCollection,
            key: "logs",
        },
    };

    const groupState = useFirestoreGroup(collections, "performance-data");

    return {
        compensations: groupState.compensations?.data || [],
        employeeLoans: groupState.employeeLoans?.data || [],
        logs: groupState.logs?.data || [],

        loading: Object.values(groupState).some(state => state?.loading) || false,
        error: Object.values(groupState).find(state => state?.error)?.error || null,
    };
}
