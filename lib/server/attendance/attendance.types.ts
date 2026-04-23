import { AttendanceModel, RequestModificationModel } from "@/lib/models/attendance";
import { LateComersModel } from "@/lib/models/late-comers";
import { OvertimeRequestModel } from "@/lib/models/overtime-request";

export type AttendanceListFilters = {
    id?: string;
    uid?: string;
    month?: string;
    year?: number;
};

export type CreateAttendanceInput = Omit<AttendanceModel, "id">;

export type UpdateAttendanceInput = Partial<AttendanceModel> & {
    id: string;
};

export type GenerateAttendanceInput = {
    uid: string;
    shiftType: string;
};

export type AttendanceRecordPayload = {
    attendance: AttendanceModel;
};

export type AttendanceListPayload = {
    attendances: AttendanceModel[];
};

export type CreateOvertimeRequestInput = Omit<OvertimeRequestModel, "id">;

export type UpdateOvertimeRequestInput = Partial<OvertimeRequestModel> & {
    id: string;
};

export type OvertimeRequestRecordPayload = {
    overtimeRequest: OvertimeRequestModel;
};

export type CreateRequestModificationInput = Omit<RequestModificationModel, "id">;

export type UpdateRequestModificationInput = Partial<RequestModificationModel> & {
    id: string;
};

export type RequestModificationRecordPayload = {
    requestModification: RequestModificationModel;
};

export type CreateLateComerInput = Omit<LateComersModel, "id">;

export type LateComerListPayload = {
    lateComers: LateComersModel[];
};
