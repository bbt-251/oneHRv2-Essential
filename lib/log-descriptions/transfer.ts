import { LogInfo } from "@/lib/backend/api/logCollection";

export const TRANSFER_LOG_MESSAGES = {
    CREATED: (data: {
        employeeUid: string;
        transferID: string;
        transferType: string;
    }): LogInfo => ({
        title: "Transfer Request Created",
        description: `Created new transfer request for employee ${data.employeeUid} with ID: ${data.transferID}, type: ${data.transferType}`,
        module: "Career Development",
    }),

    UPDATED: (data: {
        id: string;
        transferID?: string;
        status?: string;
        stage?: string;
    }): LogInfo => ({
        title: "Transfer Request Updated",
        description: `Updated transfer request for ID: ${data.id}${data.transferID ? `, Transfer ID: ${data.transferID}` : ""}${data.status ? `, status: ${data.status}` : ""}${data.stage ? `, stage: ${data.stage}` : ""}`,
        module: "Career Development",
    }),

    APPROVED: (data: { id: string; transferID: string; employeeUid: string }): LogInfo => ({
        title: "Transfer Request Approved",
        description: `Approved transfer request ${data.transferID} for employee ${data.employeeUid}`,
        module: "Career Development",
    }),

    REFUSED: (data: {
        id: string;
        transferID: string;
        employeeUid: string;
        remark?: string;
    }): LogInfo => ({
        title: "Transfer Request Refused",
        description: `Refused transfer request ${data.transferID} for employee ${data.employeeUid}${data.remark ? ` with remark: ${data.remark}` : ""}`,
        module: "Career Development",
    }),

    MANAGER_APPROVED: (data: { id: string; transferID: string; employeeUid: string }): LogInfo => ({
        title: "Transfer Request Validated by Manager",
        description: `Manager validated transfer request ${data.transferID} for employee ${data.employeeUid}`,
        module: "Career Development",
    }),

    MANAGER_REFUSED: (data: {
        id: string;
        transferID: string;
        employeeUid: string;
        remark?: string;
    }): LogInfo => ({
        title: "Transfer Request Refused by Manager",
        description: `Manager refused transfer request ${data.transferID} for employee ${data.employeeUid}${data.remark ? ` with remark: ${data.remark}` : ""}`,
        module: "Career Development",
    }),

    DELETED: (data: { id: string; transferID: string; employeeUid: string }): LogInfo => ({
        title: "Transfer Request Deleted",
        description: `Deleted transfer request ${data.transferID} for employee ${data.employeeUid}`,
        module: "Career Development",
    }),

    STATUS_CHANGED: (data: {
        transferID: string;
        oldStatus: string;
        newStatus: string;
    }): LogInfo => ({
        title: "Transfer Request Status Changed",
        description: `Changed status for transfer ${data.transferID} from ${data.oldStatus} to ${data.newStatus}`,
        module: "Career Development",
    }),

    STAGE_CHANGED: (data: { transferID: string; oldStage: string; newStage: string }): LogInfo => ({
        title: "Transfer Request Stage Changed",
        description: `Changed stage for transfer ${data.transferID} from ${data.oldStage} to ${data.newStage}`,
        module: "Career Development",
    }),

    ORDER_GUIDE_ASSIGNED: (data: { transferID: string; orderGuideID: string }): LogInfo => ({
        title: "Order Guide Assigned to Transfer",
        description: `Assigned order guide ${data.orderGuideID} to transfer request ${data.transferID}`,
        module: "Career Development",
    }),

    INTERVIEW_ASSOCIATED: (data: { transferID: string; interviewID: string }): LogInfo => ({
        title: "Interview Associated with Transfer",
        description: `Associated interview ${data.interviewID} with transfer request ${data.transferID}`,
        module: "Career Development",
    }),
};
