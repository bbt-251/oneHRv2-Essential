import { inMemoryStore } from "@/lib/backend/persistence/in-memory-store";
import { LeaveModel } from "@/lib/models/leave";

const leaveCollection = "leaveManagements";

const listCollection = <T>(collectionName: string): T[] =>
    inMemoryStore
        .queryCollection(collectionName)
        .map(document => ({ id: document.id, ...document.data }) as T);

const getDocument = <T>(path: string): T | null => {
    const document = inMemoryStore.getDocument(path);
    return document ? ({ id: document.id, ...document.data } as T) : null;
};

export const listLeaveRequests = (employeeUid?: string): LeaveModel[] => {
    const allLeave = listCollection<LeaveModel>(leaveCollection);
    return employeeUid
        ? allLeave.filter(
            leave => leave.employeeID === employeeUid || leave.requestedFor === employeeUid,
        )
        : allLeave;
};

export const createLeaveRequestRecord = (payload: Omit<LeaveModel, "id">): LeaveModel => {
    const created = inMemoryStore.createDocument(
        leaveCollection,
        payload as Record<string, unknown>,
    );

    return {
        ...payload,
        id: created.id,
    };
};

export const updateLeaveRequestRecord = (
    leaveId: string,
    payload: Partial<LeaveModel>,
): LeaveModel | null => {
    inMemoryStore.updateDocument(
        `${leaveCollection}/${leaveId}`,
        payload as Record<string, unknown>,
    );
    return getDocument<LeaveModel>(`${leaveCollection}/${leaveId}`);
};

export const getLeaveBalance = (employeeUid: string): number => {
    const employeeDocument =
        getDocument<Record<string, unknown>>(`employee/${employeeUid}`) ??
        listCollection<Record<string, unknown>>("employee").find(
            employee => String(employee.uid ?? "") === employeeUid,
        ) ??
        listCollection<Record<string, unknown>>("employees").find(
            employee => String(employee.uid ?? "") === employeeUid,
        );

    return typeof employeeDocument?.balanceLeaveDays === "number"
        ? employeeDocument.balanceLeaveDays
        : 0;
};
