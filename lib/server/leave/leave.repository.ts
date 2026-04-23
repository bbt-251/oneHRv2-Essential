import { Filter, ObjectId, WithId } from "mongodb";
import { SessionClaims } from "@/lib/server/shared/types";
import { ManualApiError } from "@/lib/server/shared/errors";
import {
    filterDocumentsForSession,
    readString,
    requirePayload,
    toRecord,
} from "@/lib/server/shared/service-helpers";
import { validateStoredObjects } from "@/lib/server/shared/storage";
import { LeaveModel } from "@/lib/models/leave";
import { EmployeeModel } from "@/lib/models/employee";
import { getMongoCollection } from "@/lib/server/shared/db/mongo";
import { publishRealtimeResource } from "@/lib/server/shared/realtime/publish";
import { CreateLeaveRequestInput, UpdateLeaveRequestInput } from "@/lib/server/leave/leave.types";
import { getEmployeeByUid } from "@/lib/server/employee/employee.repository";

interface LeaveDocument extends Omit<LeaveModel, "id"> {
    _id: string;
}

const collectionName = "leaveManagements";

const buildLeaveIdFilter = (leaveId: string): Filter<LeaveDocument> => {
    if (ObjectId.isValid(leaveId)) {
        return {
            $or: [{ _id: leaveId }, { _id: new ObjectId(leaveId) as unknown as string }],
        };
    }

    return { _id: leaveId };
};

const toModel = (document: WithId<LeaveDocument>): LeaveModel => ({
    id: document._id,
    timestamp: document.timestamp,
    leaveRequestID: document.leaveRequestID,
    leaveState: document.leaveState,
    leaveStage: document.leaveStage,
    leaveType: document.leaveType,
    standIn: document.standIn,
    authorizedDays: document.authorizedDays,
    firstDayOfLeave: document.firstDayOfLeave,
    lastDayOfLeave: document.lastDayOfLeave,
    dateOfReturn: document.dateOfReturn,
    numberOfLeaveDaysRequested: document.numberOfLeaveDaysRequested,
    balanceLeaveDays: document.balanceLeaveDays,
    comments: document.comments,
    employeeID: document.employeeID,
    attachments: document.attachments,
    requestedFor: document.requestedFor,
    requestedBy: document.requestedBy,
    rollbackStatus: document.rollbackStatus,
    reason: document.reason,
    halfDayOption: document.halfDayOption,
});

const readNumber = (value: unknown): number | undefined =>
    typeof value === "number" && Number.isFinite(value) ? value : undefined;

const readNullableString = (value: unknown): string | null =>
    typeof value === "string" && value.trim() ? value : null;

const isSameOrBefore = (startDate: string, endDate: string): boolean =>
    new Date(`${startDate}T00:00:00.000Z`).getTime() <=
    new Date(`${endDate}T00:00:00.000Z`).getTime();

const getLeaveAttachmentOwnerUid = (payload: Record<string, unknown>): string | undefined =>
    readString(payload.requestedFor) || readString(payload.employeeID);

const hasCompleteLeaveValidationPayload = (payload?: Record<string, unknown>): boolean =>
    Boolean(
        payload &&
        getLeaveAttachmentOwnerUid(payload) &&
        readString(payload.leaveType) &&
        readString(payload.firstDayOfLeave) &&
        readString(payload.lastDayOfLeave) &&
        readNumber(payload.numberOfLeaveDaysRequested),
    );

const validateLeaveAttachments = async ({
    instanceKey,
    payload,
    entityId,
    skipValidation,
}: {
    instanceKey: string;
    payload: Record<string, unknown>;
    entityId?: string;
    skipValidation?: boolean;
}): void => {
    if (skipValidation) {
        return;
    }

    const attachments = Array.isArray(payload.attachments)
        ? payload.attachments.filter((value): value is string => typeof value === "string")
        : [];

    if (!attachments.length) {
        return;
    }

    await validateStoredObjects({
        objectKeys: attachments.filter(objectKey => !/^https?:\/\//.test(objectKey)),
        instanceKey,
        ownerUid: getLeaveAttachmentOwnerUid(payload),
        module: "leaveManagements",
        entityId,
    });
};

const findEmployeeByUid = async (employeeUid: string): Promise<EmployeeModel | null> =>
    getEmployeeByUid(employeeUid);

const readAttachments = (value: unknown): string[] =>
    Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];

const areStringArraysEqual = (left: string[], right: string[]): boolean =>
    left.length === right.length && left.every((value, index) => value === right[index]);

const validateLeavePayload = async ({
    payload,
    instanceKey,
    targetId,
    action,
    skipAttachmentValidation,
}: {
    payload: Record<string, unknown>;
    instanceKey: string;
    targetId?: string;
    action: "create" | "update" | "delete";
    skipAttachmentValidation?: boolean;
}): Promise<void> => {
    if (action === "delete") {
        return;
    }

    const employeeUid = getLeaveAttachmentOwnerUid(payload);

    if (!employeeUid) {
        throw new ManualApiError(
            400,
            "LEAVE_EMPLOYEE_REQUIRED",
            "Leave request must reference an employee.",
        );
    }

    const employee = await findEmployeeByUid(employeeUid);
    if (!employee) {
        throw new ManualApiError(
            404,
            "LEAVE_EMPLOYEE_NOT_FOUND",
            "Employee for leave request was not found.",
        );
    }

    const firstDayOfLeave = readString(payload.firstDayOfLeave);
    const lastDayOfLeave = readString(payload.lastDayOfLeave);
    const leaveType = readString(payload.leaveType);
    const requestedDays = readNumber(payload.numberOfLeaveDaysRequested);
    const authorizedDays = readNullableString(payload.authorizedDays);

    if (!leaveType) {
        throw new ManualApiError(400, "LEAVE_TYPE_REQUIRED", "Leave type is required.");
    }

    if (!firstDayOfLeave || !lastDayOfLeave) {
        throw new ManualApiError(
            400,
            "LEAVE_DATES_REQUIRED",
            "Leave request must include a start and end date.",
        );
    }

    if (!isSameOrBefore(firstDayOfLeave, lastDayOfLeave)) {
        throw new ManualApiError(
            400,
            "INVALID_LEAVE_DATE_RANGE",
            "Last day of leave must be on or after the first day of leave.",
        );
    }

    if (!requestedDays || requestedDays <= 0) {
        throw new ManualApiError(
            400,
            "INVALID_LEAVE_DAY_COUNT",
            "Leave request must request at least one day.",
        );
    }

    if (leaveType === "annual-paid-leave" && requestedDays > employee.balanceLeaveDays) {
        throw new ManualApiError(
            409,
            "LEAVE_BALANCE_INSUFFICIENT",
            "Requested leave days exceed the employee's available balance.",
            {
                requestedDays,
                balanceLeaveDays: employee.balanceLeaveDays,
            },
        );
    }

    if (authorizedDays) {
        const parsedAuthorizedDays = Number(authorizedDays);
        if (Number.isFinite(parsedAuthorizedDays) && parsedAuthorizedDays > 0) {
            if (requestedDays > parsedAuthorizedDays) {
                throw new ManualApiError(
                    409,
                    "LEAVE_AUTHORIZED_DAYS_EXCEEDED",
                    "Requested leave days exceed the authorized leave days for this leave type.",
                    {
                        requestedDays,
                        authorizedDays: parsedAuthorizedDays,
                    },
                );
            }
        }
    }

    await validateLeaveAttachments({
        instanceKey,
        payload,
        entityId: readString(payload.id) ?? targetId,
        skipValidation: skipAttachmentValidation,
    });
};

export const resolveLeaveOwnerUid = (payload?: Record<string, unknown>): string | undefined =>
    readString(payload?.employeeUid) ||
    readString(payload?.requestedFor) ||
    readString(payload?.employeeID) ||
    readString(toRecord(payload?.employee).uid);

export const listLeaveRequests = async (employeeUid?: string): Promise<LeaveModel[]> => {
    const collection = await getMongoCollection<LeaveDocument>(collectionName);
    const query: Filter<LeaveDocument> = employeeUid
        ? { $or: [{ employeeID: employeeUid }, { requestedFor: employeeUid }] }
        : {};

    return (await collection.find(query).toArray()).map(toModel);
};

export const getLeaveBalance = async (employeeUid: string): Promise<number> => {
    const employee = await getEmployeeByUid(employeeUid);
    return typeof employee?.balanceLeaveDays === "number" ? employee.balanceLeaveDays : 0;
};

export const createLeaveRequestRecord = async (
    payload: Omit<LeaveModel, "id">,
): Promise<LeaveModel> => {
    const collection = await getMongoCollection<LeaveDocument>(collectionName);
    const document: LeaveDocument = {
        _id: new ObjectId().toHexString(),
        ...payload,
    };

    await collection.insertOne(document);
    return toModel(document as WithId<LeaveDocument>);
};

export const updateLeaveRequestRecord = async (
    leaveId: string,
    payload: Partial<LeaveModel>,
): Promise<LeaveModel | null> => {
    const collection = await getMongoCollection<LeaveDocument>(collectionName);
    const updateData = Object.fromEntries(
        Object.entries(payload).filter(([, value]) => value !== undefined && value !== null),
    );

    if (Object.keys(updateData).length > 0) {
        await collection.updateOne(buildLeaveIdFilter(leaveId), { $set: updateData });
    }

    const updated = await collection.findOne(buildLeaveIdFilter(leaveId));
    return updated ? toModel(updated) : null;
};

const getLeaveRequestById = async (leaveId: string): Promise<LeaveModel | null> => {
    const collection = await getMongoCollection<LeaveDocument>(collectionName);
    const leave = await collection.findOne(buildLeaveIdFilter(leaveId));
    return leave ? toModel(leave) : null;
};

export const listLeaveRequestsForSession = async ({
    instanceKey,
    session,
    filters,
}: {
    instanceKey: string;
    session: SessionClaims;
    filters?: Record<string, unknown>;
}): Promise<Record<string, unknown>> => {
    const employeeUid = readString(filters?.employeeUid);
    const leaveId = readString(filters?.id);
    const leaveRequests = (await listLeaveRequests(employeeUid)).filter(request =>
        leaveId ? request.id === leaveId : true,
    );

    return {
        leaveManagements: filterDocumentsForSession(
            leaveRequests,
            "leaveManagements",
            instanceKey,
            session,
        ),
        leaveBalance: employeeUid ? await getLeaveBalance(employeeUid) : null,
    };
};

export const mutateLeaveRequest = async ({
    action,
    instanceKey,
    payload,
    targetId,
}: {
    action: "create" | "update" | "delete";
    instanceKey: string;
    payload?: Record<string, unknown>;
    targetId?: string;
}): Promise<Record<string, unknown>> => {
    const requestPayload = payload ? requirePayload(payload) : undefined;
    const shouldLoadExistingLeave =
        action === "update" &&
        Boolean(
            targetId &&
            (!hasCompleteLeaveValidationPayload(requestPayload) ||
                (requestPayload && "attachments" in requestPayload)),
        );
    const existingLeave =
        shouldLoadExistingLeave && targetId ? await getLeaveRequestById(targetId) : null;

    if (action === "update" && targetId && !existingLeave) {
        if (!hasCompleteLeaveValidationPayload(requestPayload)) {
            throw new ManualApiError(404, "LEAVE_NOT_FOUND", "Leave request could not be updated.");
        }
    }

    const validationPayload =
        action === "update" && existingLeave
            ? ({
                ...existingLeave,
                ...requestPayload,
                id: targetId,
            } as Record<string, unknown>)
            : requestPayload;
    const skipAttachmentValidation =
        action === "update" &&
        existingLeave !== null &&
        requestPayload !== undefined &&
        "attachments" in requestPayload &&
        areStringArraysEqual(
            readAttachments(existingLeave.attachments),
            readAttachments(requestPayload.attachments),
        );

    if (requestPayload) {
        await validateLeavePayload({
            payload: validationPayload ?? requestPayload,
            instanceKey,
            targetId,
            action,
            skipAttachmentValidation,
        });
    }

    if (action === "create") {
        const createdLeave = await createLeaveRequestRecord(
            requestPayload as Omit<LeaveModel, "id">,
        );
        await publishRealtimeResource({
            resource: "leaveManagements",
            resourceId: createdLeave.id,
            payload: await listLeaveRequests(resolveLeaveOwnerUid(requestPayload)),
            resourceOwnerUid: resolveLeaveOwnerUid(requestPayload),
            instanceKey,
        });

        return {
            leaveRequest: createdLeave,
        };
    }

    if (action === "update") {
        if (!targetId) {
            throw new ManualApiError(400, "TARGET_ID_REQUIRED", "targetId is required.");
        }

        const updatedLeave = await updateLeaveRequestRecord(
            targetId,
            requestPayload as Partial<LeaveModel>,
        );
        if (updatedLeave) {
            await publishRealtimeResource({
                resource: "leaveManagements",
                resourceId: targetId,
                payload: await listLeaveRequests(
                    resolveLeaveOwnerUid(requestPayload) ?? updatedLeave.employeeID,
                ),
                resourceOwnerUid: resolveLeaveOwnerUid(requestPayload) ?? updatedLeave.employeeID,
                instanceKey,
            });
        }

        return {
            leaveRequest: updatedLeave,
        };
    }

    throw new ManualApiError(
        400,
        "UNSUPPORTED_MUTATION",
        `Unsupported ${action} operation for leaveManagements.`,
    );
};

export class LeaveServerRepository {
    static async findById(
        id: string,
        instanceKey: string,
        session: SessionClaims,
    ): Promise<LeaveModel | null> {
        const payload = await listLeaveRequestsForSession({
            instanceKey,
            session,
            filters: { id },
        });

        return (payload.leaveManagements as LeaveModel[] | undefined)?.[0] ?? null;
    }

    static async create(
        payload: CreateLeaveRequestInput,
        instanceKey: string,
    ): Promise<LeaveModel> {
        const result = await mutateLeaveRequest({
            action: "create",
            instanceKey,
            payload: payload as unknown as Record<string, unknown>,
        });

        return result.leaveRequest as LeaveModel;
    }

    static async update(
        payload: UpdateLeaveRequestInput,
        instanceKey: string,
    ): Promise<LeaveModel | null> {
        const result = await mutateLeaveRequest({
            action: "update",
            instanceKey,
            targetId: payload.id,
            payload: payload as unknown as Record<string, unknown>,
        });

        return result.leaveRequest as LeaveModel | null;
    }
}
