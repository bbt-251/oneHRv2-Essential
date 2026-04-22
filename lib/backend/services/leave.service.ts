import {
    getLeaveBalance,
    listLeaveRequests,
    createLeaveRequestRecord,
    updateLeaveRequestRecord,
} from "@/lib/backend/persistence/leave.repository";
import { inMemoryStore } from "@/lib/backend/persistence/in-memory-store";
import { SessionClaims } from "@/lib/backend/core/types";
import { ManualApiError } from "@/lib/backend/core/errors";
import { getManualRealtimeBroker } from "@/lib/backend/realtime/subscription-broker";
import {
    filterDocumentsForSession,
    readString,
    requirePayload,
    toRecord,
} from "@/lib/backend/services/service-helpers";
import { validateStoredObjects } from "@/lib/backend/services/storage.service";
import { LeaveModel } from "@/lib/models/leave";
import { EmployeeModel } from "@/lib/models/employee";

const isLegacyLeavePayload = (payload: Record<string, unknown>): boolean =>
    typeof payload.leaveRequestID === "string" || Array.isArray(payload.attachments);

const getLeaveAttachmentOwnerUid = (payload: Record<string, unknown>): string | undefined =>
    readString(payload.requestedFor) || readString(payload.employeeID);

const readNumber = (value: unknown): number | undefined =>
    typeof value === "number" && Number.isFinite(value) ? value : undefined;

const readNullableString = (value: unknown): string | null =>
    typeof value === "string" && value.trim() ? value : null;

const isSameOrBefore = (startDate: string, endDate: string): boolean =>
    new Date(`${startDate}T00:00:00.000Z`).getTime() <=
    new Date(`${endDate}T00:00:00.000Z`).getTime();

const realtimeBroker = getManualRealtimeBroker();

const findEmployeeByUid = async (employeeUid: string): Promise<EmployeeModel | null> => {
    const employee =
        inMemoryStore
            .queryCollection("employee")
            .map(document => ({ id: document.id, ...document.data }) as EmployeeModel)
            .find(document => document.uid === employeeUid) ??
        inMemoryStore
            .queryCollection("employees")
            .map(document => ({ id: document.id, ...document.data }) as EmployeeModel)
            .find(document => document.uid === employeeUid);

    return employee ?? null;
};

const getLegacyLeaveById = (leaveId: string): LeaveModel | null => {
    const document = inMemoryStore.getDocument(`leaveManagements/${leaveId}`);
    return document ? ({ id: document.id, ...document.data } as LeaveModel) : null;
};

const publishLegacyLeaveRealtime = async ({
    instanceKey,
    leaveId,
    employeeUid,
}: {
    instanceKey: string;
    leaveId: string;
    employeeUid?: string;
}) => {
    realtimeBroker.publish({
        operation: "modified",
        instanceKey,
        resource: "leaveManagements",
        resourceId: leaveId,
        payload: {
            leaveManagements: inMemoryStore
                .queryCollection("leaveManagements")
                .map(document => ({ id: document.id, ...document.data })),
        },
        resourceOwnerUid: employeeUid,
        actorUid: employeeUid,
    });
};

const validateLeaveAttachments = ({
    instanceKey,
    payload,
    entityId,
}: {
    instanceKey: string;
    payload: Record<string, unknown>;
    entityId?: string;
}): void => {
    const attachments = Array.isArray(payload.attachments)
        ? payload.attachments.filter((value): value is string => typeof value === "string")
        : [];

    if (!attachments.length) {
        return;
    }

    validateStoredObjects({
        objectKeys: attachments.filter(objectKey => !/^https?:\/\//.test(objectKey)),
        instanceKey,
        ownerUid: getLeaveAttachmentOwnerUid(payload),
        module: "leaveManagements",
        entityId,
    });
};

const validateLegacyLeavePayload = async ({
    payload,
    instanceKey,
    targetId,
    action,
}: {
    payload: Record<string, unknown>;
    instanceKey: string;
    targetId?: string;
    action: "create" | "update" | "delete";
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

    validateLeaveAttachments({
        instanceKey,
        payload,
        entityId: readString(payload.id) ?? targetId,
    });
};

export const listLeaveRequestsForSession = ({
    instanceKey,
    session,
    filters,
}: {
    instanceKey: string;
    session: SessionClaims;
    filters?: Record<string, unknown>;
}): Record<string, unknown> => {
    const employeeUid = readString(filters?.employeeUid);
    const leaveId = readString(filters?.id);
    const leaveRequests = listLeaveRequests(employeeUid).filter(request =>
        leaveId ? request.id === leaveId : true,
    );

    return {
        leaveManagements: filterDocumentsForSession(
            leaveRequests,
            "leaveManagements",
            instanceKey,
            session,
        ),
        leaveBalance: employeeUid ? getLeaveBalance(employeeUid) : null,
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

    if (requestPayload && isLegacyLeavePayload(requestPayload)) {
        await validateLegacyLeavePayload({
            payload: requestPayload,
            instanceKey,
            targetId,
            action,
        });

        if (action === "create") {
            const createdDocument = inMemoryStore.createDocument(
                "leaveManagements",
                requestPayload,
            );
            const createdLeave = {
                id: createdDocument.id,
                ...requestPayload,
            } as LeaveModel;

            await publishLegacyLeaveRealtime({
                instanceKey,
                leaveId: createdDocument.id,
                employeeUid: resolveLeaveOwnerUid(requestPayload),
            });

            return {
                leaveRequest: createdLeave,
            };
        }

        if (action === "update") {
            if (!targetId) {
                throw new ManualApiError(400, "TARGET_ID_REQUIRED", "targetId is required.");
            }

            inMemoryStore.updateDocument(`leaveManagements/${targetId}`, requestPayload);
            const updatedLeave = getLegacyLeaveById(targetId);

            if (!updatedLeave) {
                throw new ManualApiError(
                    404,
                    "LEAVE_NOT_FOUND",
                    "Updated leave request could not be loaded.",
                );
            }

            await publishLegacyLeaveRealtime({
                instanceKey,
                leaveId: targetId,
                employeeUid: resolveLeaveOwnerUid(requestPayload) ?? updatedLeave.employeeID,
            });

            return {
                leaveRequest: updatedLeave,
            };
        }
    }

    if (action === "create") {
        return {
            leaveRequest: createLeaveRequestRecord(requestPayload as never),
        };
    }

    if (action === "update") {
        if (!targetId) {
            throw new ManualApiError(400, "TARGET_ID_REQUIRED", "targetId is required.");
        }

        return {
            leaveRequest: updateLeaveRequestRecord(targetId, requestPayload as never),
        };
    }

    throw new ManualApiError(
        400,
        "UNSUPPORTED_MUTATION",
        `Unsupported ${action} operation for leaveManagements.`,
    );
};

export const resolveLeaveOwnerUid = (payload?: Record<string, unknown>): string | undefined =>
    readString(payload?.employeeUid) ||
    readString(payload?.requestedFor) ||
    readString(payload?.employeeID) ||
    readString(toRecord(payload?.employee).uid);
