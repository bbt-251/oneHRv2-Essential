import { ManualApiError } from "@/lib/server/shared/errors";
import { LeaveModel } from "@/lib/models/leave";
import { authorizeRequest } from "@/lib/server/shared/auth/authorization";
import { SessionClaims } from "@/lib/server/shared/types";
import { getCurrentInstanceKey } from "@/lib/server/shared/config";
import { serviceSuccess } from "@/lib/server/shared/result";
import { LeaveServerRepository, resolveLeaveOwnerUid } from "@/lib/server/leave/leave.repository";
import {
    CreateLeaveRequestInput,
    LeaveRecordPayload,
    UpdateLeaveRequestInput,
} from "@/lib/server/leave/leave.types";

const getLeaveOwnerUid = (leaveRequest: LeaveModel): string | undefined =>
    leaveRequest.requestedFor || leaveRequest.employeeID || leaveRequest.requestedBy || undefined;

export class LeaveService {
    static async getLeaveRequestById(id: string, session: SessionClaims | null) {
        const instanceKey = getCurrentInstanceKey();
        const authorizedSession = authorizeRequest({
            session,
            instanceKey,
            resource: "leaveManagements",
            action: "read",
        });
        const leaveRequest = await LeaveServerRepository.findById(
            id,
            instanceKey,
            authorizedSession,
        );
        if (!leaveRequest) {
            throw new ManualApiError(404, "LEAVE_NOT_FOUND", "Leave request was not found.");
        }

        authorizeRequest({
            session,
            instanceKey,
            resource: "leaveManagements",
            action: "read",
            resourceOwnerUid: getLeaveOwnerUid(leaveRequest),
        });

        return serviceSuccess<LeaveRecordPayload>("Leave request loaded successfully.", {
            leaveRequest,
        });
    }

    static async createLeaveRequest(
        payload: CreateLeaveRequestInput,
        session: SessionClaims | null,
    ) {
        const instanceKey = getCurrentInstanceKey();
        authorizeRequest({
            session,
            instanceKey,
            resource: "leaveManagements",
            action: "create",
            resourceOwnerUid: resolveLeaveOwnerUid(payload as Record<string, unknown>),
        });

        return serviceSuccess<LeaveRecordPayload>("Leave request created successfully.", {
            leaveRequest: await LeaveServerRepository.create(payload, instanceKey),
        });
    }

    static async updateLeaveRequest(input: UpdateLeaveRequestInput, session: SessionClaims | null) {
        const instanceKey = getCurrentInstanceKey();
        authorizeRequest({
            session,
            instanceKey,
            resource: "leaveManagements",
            action: "update",
            resourceOwnerUid: resolveLeaveOwnerUid(input as Record<string, unknown>),
        });

        const leaveRequest = await LeaveServerRepository.update(input, instanceKey);
        if (!leaveRequest) {
            throw new ManualApiError(404, "LEAVE_NOT_FOUND", "Leave request could not be updated.");
        }

        return serviceSuccess<LeaveRecordPayload>("Leave request updated successfully.", {
            leaveRequest,
        });
    }
}
