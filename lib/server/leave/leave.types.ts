import { LeaveModel } from "@/lib/models/leave";

export type CreateLeaveRequestInput = Omit<LeaveModel, "id">;

export type UpdateLeaveRequestInput = Partial<LeaveModel> & {
    id: string;
};

export type LeaveRecordPayload = {
    leaveRequest: LeaveModel;
};
