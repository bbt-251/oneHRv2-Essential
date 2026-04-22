import crypto from "node:crypto";
import { inMemoryStore } from "@/lib/backend/persistence/in-memory-store";
import { DependentModel } from "@/lib/models/dependent";
import { EmployeeModel } from "@/lib/models/employee";
import {
    deleteAuthUserByUid,
    createAuthUserFromEmployee,
    syncAuthUserProfileFromEmployee,
    updateAuthUserPassword,
} from "@/lib/backend/persistence/auth.repository";
import {
    appendMongoClaimedOvertime,
    batchUpdateMongoEmployees,
    createMongoEmployeeRecord,
    deleteMongoEmployeeRecord,
    getMongoEmployeeById,
    listMongoEmployees,
    updateMongoEmployeeRecord,
} from "@/lib/backend/persistence/employee-mongo";
import { getMongoDb } from "@/lib/backend/persistence/mongo";
import {
    getInMemoryDocumentByPath,
    listInMemoryCollection,
    stripUndefined,
} from "@/lib/backend/persistence/in-memory-utils";
import { publishRealtimeResource } from "@/lib/backend/persistence/realtime-publish";

const dependentsCollection = "dependents";
const loansCollection = "employeeLoan";
const compensationCollection = "employeeCompensation";
const attendanceCollection = "attendance";
const employeeDocumentsCollection = "employeeDocuments";
const overtimeRequestsCollection = "overtimeRequest";
const notificationsCollection = "notifications";
const requestModificationsCollection = "requestModifications";
const leaveManagementsCollection = "leaveManagements";
const projectsCollection = "projects";

export async function listEmployees(filters?: {
    id?: string;
    department?: string;
    uid?: string;
    companyEmail?: string;
    personalEmail?: string;
    uids?: string[];
}): Promise<EmployeeModel[]> {
    return listMongoEmployees(filters);
}

export async function getEmployeeById(id: string): Promise<EmployeeModel | null> {
    return getMongoEmployeeById(id);
}

export async function getEmployeeByUid(uid: string): Promise<EmployeeModel | null> {
    const employees = await listEmployees({ uid });
    return employees[0] ?? null;
}

export async function getEmployeeDocumentId(uid: string): Promise<string | null> {
    const employee = await getEmployeeByUid(uid);
    return employee?.id ?? null;
}

export async function createEmployeeRecord(
    data: Omit<EmployeeModel, "id">,
): Promise<EmployeeModel> {
    const employeeInput = {
        ...data,
        uid: data.uid || crypto.randomUUID(),
    };

    await createAuthUserFromEmployee(employeeInput);

    try {
        const employee = await createMongoEmployeeRecord(employeeInput);
        await publishRealtimeResource({
            resource: "employees",
            resourceId: employee.id,
            payload: await listEmployees(),
            resourceOwnerUid: employee.uid,
        });
        return employee;
    } catch (error) {
        await deleteAuthUserByUid(employeeInput.uid);
        throw error;
    }
}

export async function updateEmployeeRecord(
    id: string,
    data: Partial<EmployeeModel>,
): Promise<EmployeeModel | null> {
    const updated = await updateMongoEmployeeRecord(id, data);
    if (updated) {
        await syncAuthUserProfileFromEmployee(updated);
        if (typeof data.password === "string" && data.password.trim()) {
            await updateAuthUserPassword(updated.uid, data.password);
        }
        await publishRealtimeResource({
            resource: "employees",
            resourceId: id,
            payload: await listEmployees(),
            resourceOwnerUid: updated.uid,
        });
    }
    return updated;
}

export async function deleteEmployeeRecord(id: string): Promise<boolean> {
    const existing = await getEmployeeById(id);
    await deleteMongoEmployeeRecord(id);
    if (existing?.uid) {
        await deleteAuthUserByUid(existing.uid);
    }
    await publishRealtimeResource({
        resource: "employees",
        resourceId: id,
        payload: await listEmployees(),
        resourceOwnerUid: existing?.uid,
    });
    return true;
}

export async function batchUpdateEmployees(
    employees: (Partial<EmployeeModel> & { id: string })[],
): Promise<boolean> {
    await batchUpdateMongoEmployees(employees);
    await publishRealtimeResource({
        resource: "employees",
        resourceId: "batch",
        payload: await listEmployees(),
    });
    return true;
}

export async function appendClaimedOvertime(
    employeeDocIds: string[],
    overtimeRequestId: string,
): Promise<boolean> {
    await appendMongoClaimedOvertime(employeeDocIds.filter(Boolean), overtimeRequestId);
    await publishRealtimeResource({
        resource: "employees",
        resourceId: "batch-claimed-overtime",
        payload: await listEmployees(),
    });
    return true;
}

export async function listDependentsByEmployee(employeeId: string): Promise<DependentModel[]> {
    return listInMemoryCollection<DependentModel>(dependentsCollection, [
        { kind: "where", field: "relatedTo", op: "==", value: employeeId },
        { kind: "orderBy", field: "timestamp", direction: "desc" },
    ]);
}

export async function getDependentById(id: string): Promise<DependentModel | null> {
    return getInMemoryDocumentByPath<DependentModel>(`${dependentsCollection}/${id}`);
}

export async function createDependentRecord(
    data: Omit<DependentModel, "id">,
): Promise<DependentModel> {
    const dependentID = data.dependentID || `DEP-${Date.now()}`;
    const created = inMemoryStore.createDocument(dependentsCollection, {
        ...data,
        dependentID,
        timestamp: data.timestamp || new Date().toISOString(),
    });
    const createdRecord = await getDependentById(created.id);
    await publishRealtimeResource({
        resource: "dependents",
        resourceId: created.id,
        payload: await listDependentsByEmployee(data.relatedTo),
        resourceOwnerUid: data.relatedTo,
    });
    return createdRecord as DependentModel;
}

export async function updateDependentRecord(
    id: string,
    data: Partial<DependentModel>,
): Promise<DependentModel | null> {
    const current = await getDependentById(id);
    inMemoryStore.updateDocument(
        `${dependentsCollection}/${id}`,
        stripUndefined(data as Record<string, unknown>),
    );
    const updated = await getDependentById(id);
    const employeeId = updated?.relatedTo ?? current?.relatedTo;
    if (employeeId) {
        await publishRealtimeResource({
            resource: "dependents",
            resourceId: id,
            payload: await listDependentsByEmployee(employeeId),
            resourceOwnerUid: employeeId,
        });
    }
    return updated;
}

export async function deleteDependentRecord(id: string): Promise<boolean> {
    const current = await getDependentById(id);
    inMemoryStore.deleteDocument(`${dependentsCollection}/${id}`);
    if (current) {
        await publishRealtimeResource({
            resource: "dependents",
            resourceId: id,
            payload: await listDependentsByEmployee(current.relatedTo),
            resourceOwnerUid: current.relatedTo,
        });
    }
    return true;
}

export async function deleteEmployeeCascadeRecords(employeeId: string): Promise<string[]> {
    const employee = await getEmployeeById(employeeId);
    if (!employee) {
        return ["Employee not found"];
    }

    const dependents = await listDependentsByEmployee(employeeId);
    await Promise.all(dependents.map(dependent => deleteDependentRecord(dependent.id ?? "")));

    const loans = listInMemoryCollection<{ id: string; employeeUid: string }>(loansCollection, [
        { kind: "where", field: "employeeUid", op: "==", value: employee.uid },
    ]);
    await Promise.all(
        loans.map(loan => inMemoryStore.deleteDocument(`${loansCollection}/${loan.id}`)),
    );

    const compensation = listInMemoryCollection<{ id: string; employees: string[] }>(
        compensationCollection,
    ).filter(item => item.employees.includes(employee.uid));
    await Promise.all(
        compensation.map(record =>
            inMemoryStore.deleteDocument(`${compensationCollection}/${record.id}`),
        ),
    );

    const attendanceRecords = inMemoryStore.queryCollection(attendanceCollection, [
        { kind: "where", field: "uid", op: "==", value: employee.uid },
    ]);
    await Promise.all(
        attendanceRecords.map(document =>
            inMemoryStore.deleteDocument(`${attendanceCollection}/${document.id}`),
        ),
    );

    const documentRecords = inMemoryStore.queryCollection(employeeDocumentsCollection, [
        { kind: "where", field: "uid", op: "==", value: employee.uid },
    ]);
    await Promise.all(
        documentRecords.map(document =>
            inMemoryStore.deleteDocument(`${employeeDocumentsCollection}/${document.id}`),
        ),
    );

    const overtimeRecords = inMemoryStore.queryCollection(overtimeRequestsCollection, [
        { kind: "where", field: "employeeUids", op: "array-contains", value: employee.uid },
    ]);
    await Promise.all(
        overtimeRecords.map(async document => {
            const data = document.data as { employeeUids?: string[] };
            const updatedUids = (data.employeeUids ?? []).filter(uid => uid !== employee.uid);
            if (updatedUids.length === 0) {
                inMemoryStore.deleteDocument(`${overtimeRequestsCollection}/${document.id}`);
                return;
            }

            inMemoryStore.updateDocument(`${overtimeRequestsCollection}/${document.id}`, {
                employeeUids: updatedUids,
            });
        }),
    );

    const requestModificationRecords = inMemoryStore.queryCollection(
        requestModificationsCollection,
        [{ kind: "where", field: "uid", op: "==", value: employee.uid }],
    );
    await Promise.all(
        requestModificationRecords.map(document =>
            inMemoryStore.deleteDocument(`${requestModificationsCollection}/${document.id}`),
        ),
    );

    const notificationRecords = inMemoryStore.queryCollection(notificationsCollection, [
        { kind: "where", field: "uid", op: "==", value: employee.uid },
    ]);
    await Promise.all(
        notificationRecords.map(document =>
            inMemoryStore.deleteDocument(`${notificationsCollection}/${document.id}`),
        ),
    );

    const leaveRecords = inMemoryStore.queryCollection(leaveManagementsCollection, [
        { kind: "where", field: "employeeID", op: "==", value: employee.uid },
    ]);
    const requestedForLeaveRecords = inMemoryStore.queryCollection(leaveManagementsCollection, [
        { kind: "where", field: "requestedFor", op: "==", value: employee.uid },
    ]);
    const requestedByLeaveRecords = inMemoryStore.queryCollection(leaveManagementsCollection, [
        { kind: "where", field: "requestedBy", op: "==", value: employee.uid },
    ]);
    const leaveDocuments = new Map(
        [...leaveRecords, ...requestedForLeaveRecords, ...requestedByLeaveRecords].map(document => [
            document.id,
            document,
        ]),
    );
    await Promise.all(
        Array.from(leaveDocuments.values()).map(document =>
            inMemoryStore.deleteDocument(`${leaveManagementsCollection}/${document.id}`),
        ),
    );

    const projectRecords = inMemoryStore.queryCollection(projectsCollection);
    await Promise.all(
        projectRecords.map(async document => {
            const data = document.data as {
                assignedMembers?: string[];
                employeeAllocations?: Array<{ uid?: string; allocation?: number }>;
            };

            const nextAssignedMembers = Array.isArray(data.assignedMembers)
                ? data.assignedMembers.filter(uid => uid !== employee.uid)
                : [];
            const nextAllocations = Array.isArray(data.employeeAllocations)
                ? data.employeeAllocations.filter(entry => entry.uid !== employee.uid)
                : [];

            if (
                nextAssignedMembers.length === (data.assignedMembers?.length ?? 0) &&
                nextAllocations.length === (data.employeeAllocations?.length ?? 0)
            ) {
                return;
            }

            inMemoryStore.updateDocument(`${projectsCollection}/${document.id}`, {
                assignedMembers: nextAssignedMembers,
                employeeAllocations: nextAllocations,
            });
        }),
    );

    const db = await getMongoDb();
    await db.collection("attendance").deleteMany({ uid: employee.uid });
    await deleteMongoEmployeeRecord(employeeId);
    await deleteAuthUserByUid(employee.uid);
    await publishRealtimeResource({
        resource: "employees",
        resourceId: employeeId,
        payload: await listEmployees(),
        resourceOwnerUid: employee.uid,
    });

    return [];
}
