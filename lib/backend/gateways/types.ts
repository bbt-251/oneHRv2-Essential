import { EmployeeModel } from "@/lib/models/employee";

export interface AuthIdentity {
    uid: string;
    email: string | null;
}

export type Unsubscribe = () => void;

export interface AuthGateway {
    onAuthStateChanged(callback: (identity: AuthIdentity | null) => void): Unsubscribe;
    signOut(): Promise<void>;
}

export interface DataGateway {
    subscribeEmployeeByUid(
        uid: string,
        callback: (employees: EmployeeModel[], hasPendingWrites: boolean) => void,
        onError?: (error: Error) => void,
    ): Unsubscribe;
}

export interface StorageGateway {
    getSignedUploadUrl(path: string, contentType: string): Promise<string>;
    getSignedDownloadUrl(path: string): Promise<string>;
}
