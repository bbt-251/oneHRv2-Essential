import { Filter, ObjectId, WithId } from "mongodb";
import { EmployeeModel } from "@/lib/models/employee";
import { getMongoCollection } from "@/lib/backend/persistence/mongo";

interface EmployeeDocument extends Omit<
    EmployeeModel,
    "id" | "password" | "lastChanged" | "passwordRecovery"
> {
    _id: string;
}

const collectionName = "employee";

const toModel = (document: WithId<EmployeeDocument>): EmployeeModel => ({
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

const toDocument = (data: Omit<EmployeeModel, "id">, id: string): EmployeeDocument =>
    ({
        _id: id,
        ...stripCredentialFields(data),
    }) as EmployeeDocument;

export const listMongoEmployees = async (filters?: {
    id?: string;
    department?: string;
    uid?: string;
    companyEmail?: string;
    personalEmail?: string;
    uids?: string[];
}): Promise<EmployeeModel[]> => {
    const collection = await getMongoCollection<EmployeeDocument>(collectionName);
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

    return (await collection.find(query).toArray()).map(toModel);
};

export const getMongoEmployeeById = async (id: string): Promise<EmployeeModel | null> => {
    const collection = await getMongoCollection<EmployeeDocument>(collectionName);
    const document = await collection.findOne({ _id: id });
    return document ? toModel(document) : null;
};

export const getMongoEmployeeByEmail = async (email: string): Promise<EmployeeModel | null> => {
    const normalizedEmail = email.trim().toLowerCase();
    const collection = await getMongoCollection<EmployeeDocument>(collectionName);
    const document = await collection.findOne({
        $or: [{ personalEmail: normalizedEmail }, { companyEmail: normalizedEmail }],
    });
    return document ? toModel(document) : null;
};

export const createMongoEmployeeRecord = async (
    data: Omit<EmployeeModel, "id">,
): Promise<EmployeeModel> => {
    const collection = await getMongoCollection<EmployeeDocument>(collectionName);
    const id = new ObjectId().toHexString();
    const document = toDocument(data, id);
    await collection.insertOne(document);
    return toModel(document as WithId<EmployeeDocument>);
};

export const updateMongoEmployeeRecord = async (
    id: string,
    data: Partial<EmployeeModel>,
): Promise<EmployeeModel | null> => {
    const collection = await getMongoCollection<EmployeeDocument>(collectionName);
    const updateData = stripCredentialFields(
        Object.fromEntries(
            Object.entries(data).filter(([, value]) => value !== undefined && value !== null),
        ) as Partial<EmployeeModel>,
    );

    if (Object.keys(updateData).length > 0) {
        await collection.updateOne({ _id: id }, { $set: updateData });
    }

    return getMongoEmployeeById(id);
};

export const deleteMongoEmployeeRecord = async (id: string): Promise<boolean> => {
    const collection = await getMongoCollection<EmployeeDocument>(collectionName);
    const result = await collection.deleteOne({ _id: id });
    return result.deletedCount > 0;
};

export const batchUpdateMongoEmployees = async (
    employees: (Partial<EmployeeModel> & { id: string })[],
): Promise<boolean> => {
    const collection = await getMongoCollection<EmployeeDocument>(collectionName);
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
    return true;
};

export const appendMongoClaimedOvertime = async (
    employeeDocIds: string[],
    overtimeRequestId: string,
): Promise<boolean> => {
    const collection = await getMongoCollection<EmployeeDocument>(collectionName);
    await collection.updateMany(
        { _id: { $in: employeeDocIds } },
        { $addToSet: { claimedOvertimes: overtimeRequestId } },
    );
    return true;
};
