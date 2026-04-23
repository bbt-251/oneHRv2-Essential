import crypto from "node:crypto";
import { Filter, ObjectId, WithId } from "mongodb";
import { SessionClaims } from "@/lib/server/shared/types";
import { DependentModel } from "@/lib/models/dependent";
import { EmployeeModel } from "@/lib/models/employee";
import { NotificationServerRepository } from "@/lib/server/notifications/notification.repository";
import { ProjectServerRepository } from "@/lib/server/projects/project.repository";
import {
    createAuthUserFromEmployee,
    deleteAuthUserByUid,
    syncAuthUserProfileFromEmployee,
    updateAuthUserPassword,
} from "@/lib/server/auth/auth.repository";
import { getMongoCollection, getMongoDb } from "@/lib/server/shared/db/mongo";
import { publishRealtimeResource } from "@/lib/server/shared/realtime/publish";
import {
    CreateDependentInput,
    CreateEmployeeInput,
    UpdateDependentInput,
    EmployeeListFilters,
    UpdateEmployeeInput,
} from "@/lib/server/employee/employee.types";

interface EmployeeDocument extends Omit<
    EmployeeModel,
    "id" | "password" | "lastChanged" | "passwordRecovery"
> {
    _id: string;
}

type MongoDocument<T> = T & { _id: string };

const employeeCollection = "employee";
const dependentsCollection = "dependents";
const loansCollection = "employeeLoan";
const compensationCollection = "employeeCompensation";
const attendanceCollection = "attendance";
const employeeDocumentsCollection = "documents";
const overtimeRequestsCollection = "overtimeRequests";
const requestModificationsCollection = "requestModifications";
const leaveManagementsCollection = "leaveManagements";

const stripUndefined = <T extends Record<string, unknown>>(input: T): Partial<T> =>
    Object.fromEntries(
        Object.entries(input).filter(([, value]) => value !== undefined),
    ) as Partial<T>;

const stripCredentialFields = <T extends Partial<EmployeeModel>>(
    data: T,
): Omit<T, "password" | "lastChanged" | "passwordRecovery"> => {
    const {
        password: _password,
        lastChanged: _lastChanged,
        passwordRecovery: _passwordRecovery,
        ...rest
    } = data;
    return rest;
};

const toEmployeeModel = (document: WithId<EmployeeDocument>): EmployeeModel => ({
    id: document._id,
    timestamp: document.timestamp,
    uid: document.uid,
    firstName: document.firstName,
    middleName: document.middleName,
    surname: document.surname,
    birthDate: document.birthDate,
    birthPlace: document.birthPlace,
    gender: document.gender,
    maritalStatus: document.maritalStatus,
    personalPhoneNumber: document.personalPhoneNumber,
    personalEmail: document.personalEmail,
    telegramChatID: document.telegramChatID,
    currentLocation: document.currentLocation,
    bankAccount: document.bankAccount,
    providentFundAccount: document.providentFundAccount,
    hourlyWage: document.hourlyWage,
    tinNumber: document.tinNumber,
    passportNumber: document.passportNumber,
    nationalIDNumber: document.nationalIDNumber,
    employeeID: document.employeeID,
    password: "",
    lastChanged: "",
    passwordRecovery: {
        timestamp: "",
        token: "",
    },
    signature: document.signature,
    signedDocuments: document.signedDocuments,
    profilePicture: document.profilePicture,
    company: document.company,
    contractType: document.contractType,
    contractHour: document.contractHour,
    hoursPerWeek: document.hoursPerWeek,
    contractStatus: document.contractStatus,
    contractStartingDate: document.contractStartingDate,
    contractTerminationDate: document.contractTerminationDate,
    contractDuration: document.contractDuration,
    hireDate: document.hireDate,
    contractDocument: document.contractDocument,
    probationPeriodEndDate: document.probationPeriodEndDate,
    lastDateOfProbation: document.lastDateOfProbation,
    reasonOfLeaving: document.reasonOfLeaving,
    salary: document.salary,
    currency: document.currency,
    eligibleLeaveDays: document.eligibleLeaveDays,
    companyEmail: document.companyEmail,
    companyPhoneNumber: document.companyPhoneNumber,
    associatedTax: document.associatedTax,
    pensionApplication: document.pensionApplication,
    employmentPosition: document.employmentPosition,
    positionLevel: document.positionLevel,
    section: document.section,
    department: document.department,
    workingLocation: document.workingLocation,
    workingArea: document.workingArea,
    homeLocation: document.homeLocation,
    managerPosition: document.managerPosition,
    reportees: document.reportees,
    reportingLineManagerPosition: document.reportingLineManagerPosition,
    reportingLineManager: document.reportingLineManager,
    gradeLevel: document.gradeLevel,
    step: document.step,
    shiftType: document.shiftType,
    role: document.role,
    unit: document.unit,
    emergencyContactName: document.emergencyContactName,
    relationshipToEmployee: document.relationshipToEmployee,
    phoneNumber1: document.phoneNumber1,
    phoneNumber2: document.phoneNumber2,
    emailAddress1: document.emailAddress1,
    emailAddress2: document.emailAddress2,
    physicalAddress1: document.physicalAddress1,
    physicalAddress2: document.physicalAddress2,
    notifications: document.notifications,
    claimedOvertimes: document.claimedOvertimes,
    timezone: document.timezone,
    customFields: document.customFields,
    balanceLeaveDays: document.balanceLeaveDays,
    accrualLeaveDays: document.accrualLeaveDays,
    lastELDUpdate: document.lastELDUpdate,
    documentRequests: document.documentRequests,
    associatedRestrictedDocuments: document.associatedRestrictedDocuments,
});

const toEmployeeDocument = (data: Omit<EmployeeModel, "id">, id: string): EmployeeDocument =>
    ({
        _id: id,
        ...stripCredentialFields(data),
    }) as EmployeeDocument;

const toModel = <T extends { id: string | null }>(
    document: MongoDocument<Record<string, unknown>> | null,
) =>
        document
            ? ({
                ...(document as unknown as T),
                id: document._id,
            } as T)
            : null;

export async function listEmployees(filters?: {
    id?: string;
    department?: string;
    uid?: string;
    companyEmail?: string;
    personalEmail?: string;
    uids?: string[];
}): Promise<EmployeeModel[]> {
    const collection = await getMongoCollection<EmployeeDocument>(employeeCollection);
    const query: Filter<EmployeeDocument> = {};

    if (filters?.id) {
        query._id = filters.id;
    } else if (filters?.department) {
        query.department = filters.department;
    } else if (filters?.uid) {
        query.uid = filters.uid;
    } else if (filters?.companyEmail) {
        query.companyEmail = filters.companyEmail;
    } else if (filters?.personalEmail) {
        query.personalEmail = filters.personalEmail;
    } else if (filters?.uids?.length) {
        query.uid = { $in: filters.uids };
    }

    return (await collection.find(query).toArray()).map(toEmployeeModel);
}

export async function getEmployeeById(id: string): Promise<EmployeeModel | null> {
    return (await listEmployees({ id }))[0] ?? null;
}

export async function getEmployeeByUid(uid: string): Promise<EmployeeModel | null> {
    return (await listEmployees({ uid }))[0] ?? null;
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
        const collection = await getMongoCollection<EmployeeDocument>(employeeCollection);
        const id = new ObjectId().toHexString();
        const document = toEmployeeDocument(employeeInput, id);
        await collection.insertOne(document);
        const employee = toEmployeeModel(document as WithId<EmployeeDocument>);

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
    const collection = await getMongoCollection<EmployeeDocument>(employeeCollection);
    const updateData = stripCredentialFields(
        Object.fromEntries(
            Object.entries(data).filter(([, value]) => value !== undefined && value !== null),
        ) as Partial<EmployeeModel>,
    );

    if (Object.keys(updateData).length > 0) {
        await collection.updateOne({ _id: id }, { $set: updateData });
    }

    const employee = await getEmployeeById(id);
    if (!employee) {
        return null;
    }

    await syncAuthUserProfileFromEmployee(employee);
    if (typeof data.password === "string" && data.password.trim()) {
        await updateAuthUserPassword(employee.uid, data.password);
    }

    await publishRealtimeResource({
        resource: "employees",
        resourceId: id,
        payload: await listEmployees(),
        resourceOwnerUid: employee.uid,
    });

    return employee;
}

export async function deleteEmployeeRecord(id: string): Promise<boolean> {
    const existing = await getEmployeeById(id);
    const collection = await getMongoCollection<EmployeeDocument>(employeeCollection);
    await collection.deleteOne({ _id: id });

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
    const collection = await getMongoCollection<EmployeeDocument>(employeeCollection);
    await Promise.all(
        employees.map(employee => {
            const updateData = stripCredentialFields(
                Object.fromEntries(
                    Object.entries(employee).filter(
                        ([key, value]) => key !== "id" && value !== undefined && value !== null,
                    ),
                ) as Partial<EmployeeModel>,
            );

            if (Object.keys(updateData).length === 0) {
                return Promise.resolve();
            }

            return collection.updateOne({ _id: employee.id }, { $set: updateData });
        }),
    );

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
    const collection = await getMongoCollection<EmployeeDocument>(employeeCollection);
    await collection.updateMany(
        { _id: { $in: employeeDocIds.filter(Boolean) } },
        { $addToSet: { claimedOvertimes: overtimeRequestId } },
    );

    await publishRealtimeResource({
        resource: "employees",
        resourceId: "batch-claimed-overtime",
        payload: await listEmployees(),
    });

    return true;
}

export async function listDependentsByEmployee(employeeId: string): Promise<DependentModel[]> {
    const collection =
        await getMongoCollection<MongoDocument<DependentModel>>(dependentsCollection);
    const dependents = await collection
        .find({ relatedTo: employeeId })
        .sort({ timestamp: -1 })
        .toArray();

    return dependents.map(document => {
        const { _id, ...rest } = document;
        return {
            ...rest,
            id: _id,
        };
    });
}

export async function getDependentById(id: string): Promise<DependentModel | null> {
    const collection =
        await getMongoCollection<MongoDocument<DependentModel>>(dependentsCollection);
    const document = await collection.findOne({ _id: id });

    return toModel<DependentModel>(
        document as unknown as MongoDocument<Record<string, unknown>> | null,
    );
}

export async function createDependentRecord(
    data: Omit<DependentModel, "id">,
): Promise<DependentModel> {
    const dependentID = data.dependentID || `DEP-${Date.now()}`;
    const collection =
        await getMongoCollection<MongoDocument<DependentModel>>(dependentsCollection);
    const id = new ObjectId().toHexString();
    const document: MongoDocument<DependentModel> = {
        _id: id,
        ...data,
        dependentID,
        timestamp: data.timestamp || new Date().toISOString(),
    };

    await collection.insertOne(document);
    const createdRecord = await getDependentById(id);

    await publishRealtimeResource({
        resource: "dependents",
        resourceId: id,
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
    const collection =
        await getMongoCollection<MongoDocument<DependentModel>>(dependentsCollection);

    await collection.updateOne(
        { _id: id },
        { $set: stripUndefined(data as Record<string, unknown>) },
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
    const collection =
        await getMongoCollection<MongoDocument<DependentModel>>(dependentsCollection);

    await collection.deleteOne({ _id: id });
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

    const db = await getMongoDb();
    await db.collection(loansCollection).deleteMany({ employeeUid: employee.uid });
    await db.collection(compensationCollection).deleteMany({ employees: employee.uid });
    await db.collection(attendanceCollection).deleteMany({ uid: employee.uid });
    await db.collection(employeeDocumentsCollection).deleteMany({ uid: employee.uid });

    const overtimeRecords = await db
        .collection<MongoDocument<{ employeeUids?: string[] }>>(overtimeRequestsCollection)
        .find({ employeeUids: employee.uid })
        .toArray();

    await Promise.all(
        overtimeRecords.map(async document => {
            const updatedUids = (document.employeeUids ?? []).filter(uid => uid !== employee.uid);
            if (updatedUids.length === 0) {
                await db.collection(overtimeRequestsCollection).deleteOne({ _id: document._id });
                return;
            }

            await db
                .collection(overtimeRequestsCollection)
                .updateOne({ _id: document._id }, { $set: { employeeUids: updatedUids } });
        }),
    );

    await db.collection(requestModificationsCollection).deleteMany({ uid: employee.uid });

    await NotificationServerRepository.deleteByUid(employee.uid);

    await db.collection(leaveManagementsCollection).deleteMany({
        $or: [
            { employeeID: employee.uid },
            { requestedFor: employee.uid },
            { requestedBy: employee.uid },
        ],
    });

    await ProjectServerRepository.deleteByEmployeeUid(employee.uid);

    await deleteEmployeeRecord(employeeId);
    return [];
}

export class EmployeeServerRepository {
    static async list(
        filters: EmployeeListFilters,
        _instanceKey: string,
        _session: SessionClaims,
    ): Promise<EmployeeModel[]> {
        return listEmployees(filters);
    }

    static async create(
        payload: CreateEmployeeInput,
        _instanceKey: string,
    ): Promise<EmployeeModel> {
        return createEmployeeRecord(payload);
    }

    static async update(
        payload: UpdateEmployeeInput,
        _instanceKey: string,
    ): Promise<EmployeeModel | null> {
        return updateEmployeeRecord(payload.id, payload);
    }

    static async delete(id: string, _instanceKey: string): Promise<void> {
        await deleteEmployeeRecord(id);
    }

    static async batchUpdate(
        employees: (Partial<EmployeeModel> & { id: string })[],
        _instanceKey: string,
    ): Promise<void> {
        await batchUpdateEmployees(employees);
    }

    static async appendClaimedOvertime(
        employeeDocIds: string[],
        overtimeRequestId: string,
        _instanceKey: string,
    ): Promise<void> {
        await appendClaimedOvertime(employeeDocIds, overtimeRequestId);
    }

    static async cascadeDelete(employeeUid: string, _instanceKey: string): Promise<string[]> {
        return deleteEmployeeCascadeRecords(employeeUid);
    }

    static async listDependents(
        employeeId: string,
        _instanceKey: string,
        _session: SessionClaims,
    ): Promise<DependentModel[]> {
        return listDependentsByEmployee(employeeId);
    }

    static async createDependent(
        payload: CreateDependentInput,
        _instanceKey: string,
    ): Promise<DependentModel> {
        return createDependentRecord(payload);
    }

    static async updateDependent(
        payload: UpdateDependentInput,
        _instanceKey: string,
    ): Promise<DependentModel | null> {
        return updateDependentRecord(payload.id, payload);
    }

    static async deleteDependent(id: string, _instanceKey: string): Promise<void> {
        await deleteDependentRecord(id);
    }
}
