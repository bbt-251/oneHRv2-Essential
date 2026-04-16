import {
    leaveManagementCollection,
    overtimeRequestCollection,
    requestedAttendanceModificationCollection,
    attendanceLogicCollection,
    flexibilityParameterCollection,
} from "@/lib/backend/firebase/collections";
import { LeaveModel } from "@/lib/models/leave";
import { OvertimeRequestModel } from "@/lib/models/overtime-request";
import { AttendanceLogicModel } from "@/lib/models/attendance-logic";
import { FlexibilityParameterModel } from "@/lib/models/flexibilityParameter";
import { RequestModificationModel } from "@/lib/models/attendance";
import { useFirestoreGroup, CollectionConfig } from "./use-firestore-group";

export interface HRManagementState {
    leaveManagements: LeaveModel[];
    overtimeRequests: OvertimeRequestModel[];
    requestModifications: RequestModificationModel[];
    attendanceLogic: AttendanceLogicModel[];
    flexibilityParameter: FlexibilityParameterModel[];
}

export function useHRManagement() {
    const collections: Record<keyof HRManagementState, CollectionConfig<any>> = {
        leaveManagements: {
            collectionRef: leaveManagementCollection,
            key: "leaveManagements",
        },
        overtimeRequests: {
            collectionRef: overtimeRequestCollection,
            key: "overtimeRequests",
        },
        requestModifications: {
            collectionRef: requestedAttendanceModificationCollection,
            key: "requestModifications",
            userFilter: true, // Apply user-specific filtering for employees
        },
        attendanceLogic: {
            collectionRef: attendanceLogicCollection,
            key: "attendanceLogic",
        },
        flexibilityParameter: {
            collectionRef: flexibilityParameterCollection,
            key: "flexibilityParameter",
        },
    };

    const groupState = useFirestoreGroup(collections, "hr-management");

    return {
        leaveManagements: groupState.leaveManagements?.data || [],
        overtimeRequests: groupState.overtimeRequests?.data || [],
        requestModifications: groupState.requestModifications?.data || [],
        attendanceLogic: groupState.attendanceLogic?.data || [],
        flexibilityParameter: groupState.flexibilityParameter?.data || [],
        loading: Object.values(groupState).some(state => state?.loading) || false,
        error: Object.values(groupState).find(state => state?.error)?.error || null,
    };
}
