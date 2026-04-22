import { OvertimeRequestModel } from "@/lib/models/overtime-request";
import { createLog } from "../logCollection";
import { OVERTIME_REQUEST_LOG_MESSAGES } from "@/lib/log-descriptions/manager-activities";
import { mutateCompactData } from "@/lib/backend/client/data-client";

export async function createOvertimeRequest(
    data: Omit<OvertimeRequestModel, "id">,
    actionBy: string,
): Promise<boolean> {
    try {
        await mutateCompactData({
            resource: "overtimeRequests",
            action: "create",
            payload: data as Record<string, unknown>,
        });

        await createLog(
            OVERTIME_REQUEST_LOG_MESSAGES.CREATED({
                employeeUids: data.employeeUids,
                overtimeType: data.overtimeType,
                date: data.overtimeDate,
                requestedBy: actionBy,
            }),
            actionBy,
            "Success",
        );

        return true;
    } catch (e) {
        console.log("Error", e);
        await createLog(
            OVERTIME_REQUEST_LOG_MESSAGES.CREATED({
                employeeUids: data.employeeUids,
                overtimeType: data.overtimeType,
                date: data.overtimeDate,
                requestedBy: actionBy,
            }),
            actionBy,
            "Failure",
        );

        return false;
    }
}

export async function deleteOvertimeRequest(
    id: string,
    actionBy: string,
    employeeUids?: string[],
): Promise<boolean> {
    try {
        await mutateCompactData({
            resource: "overtimeRequests",
            action: "delete",
            targetId: id,
        });

        await createLog(
            OVERTIME_REQUEST_LOG_MESSAGES.DELETED({
                id,
                employeeUids: employeeUids || [],
                deletedBy: actionBy,
            }),
            actionBy,
            "Success",
        );

        return true;
    } catch (err) {
        console.error(err);

        await createLog(
            OVERTIME_REQUEST_LOG_MESSAGES.DELETED({
                id,
                employeeUids: employeeUids || [],
                deletedBy: actionBy,
            }),
            actionBy,
            "Failure",
        );

        return false;
    }
}

export async function updateOvertimeRequest(
    data: Partial<OvertimeRequestModel> & { id: string },
    actionBy?: string,
): Promise<boolean> {
    try {
        await mutateCompactData({
            resource: "overtimeRequests",
            action: "update",
            targetId: data.id,
            payload: data as Record<string, unknown>,
        });

        if (actionBy && data.status === "approved") {
            await createLog(
                OVERTIME_REQUEST_LOG_MESSAGES.APPROVED({
                    id: data.id,
                    employeeUids: data.employeeUids || [],
                    approvedBy: actionBy,
                    overtimeType: data.overtimeType || "Overtime",
                    hours: data.duration || 0,
                }),
                actionBy,
                "Success",
            );
        } else if (actionBy && data.status === "rejected") {
            await createLog(
                OVERTIME_REQUEST_LOG_MESSAGES.REJECTED({
                    id: data.id,
                    employeeUids: data.employeeUids || [],
                    rejectedBy: actionBy,
                    reason: data.hrComments || undefined,
                }),
                actionBy,
                "Success",
            );
        } else if (actionBy) {
            await createLog(
                OVERTIME_REQUEST_LOG_MESSAGES.UPDATED({
                    id: data.id,
                    employeeUids: data.employeeUids || [],
                    updatedBy: actionBy,
                    overtimeType: data.overtimeType,
                }),
                actionBy,
                "Success",
            );
        }

        return true;
    } catch (err) {
        console.error(err);

        if (actionBy && data.status === "approved") {
            await createLog(
                OVERTIME_REQUEST_LOG_MESSAGES.APPROVED({
                    id: data.id,
                    employeeUids: data.employeeUids || [],
                    approvedBy: actionBy,
                    overtimeType: data.overtimeType || "Overtime",
                    hours: data.duration || 0,
                }),
                actionBy,
                "Failure",
            );
        } else if (actionBy && data.status === "rejected") {
            await createLog(
                OVERTIME_REQUEST_LOG_MESSAGES.REJECTED({
                    id: data.id,
                    employeeUids: data.employeeUids || [],
                    rejectedBy: actionBy,
                    reason: data.hrComments || undefined,
                }),
                actionBy,
                "Failure",
            );
        } else if (actionBy) {
            await createLog(
                OVERTIME_REQUEST_LOG_MESSAGES.UPDATED({
                    id: data.id,
                    employeeUids: data.employeeUids || [],
                    updatedBy: actionBy,
                    overtimeType: data.overtimeType,
                }),
                actionBy,
                "Failure",
            );
        }

        return false;
    }
}
