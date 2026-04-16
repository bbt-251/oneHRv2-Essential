import { doc, setDoc, updateDoc, deleteDoc, getDoc } from "firebase/firestore";
import { db } from "./init";
import { TransferModel, RemarkModel } from "@/lib/models/transfer";
import { transferCollection } from "./collections";
import { getTimestamp } from "@/lib/util/dayjs_format";
import { createLog } from "../api/logCollection";
import { TRANSFER_LOG_MESSAGES } from "@/lib/log-descriptions/transfer";
import { OrderGuideService } from "../api/order-guide-service";
import { InterviewService } from "../api/interview-service";

/**
 * Add a new transfer request to the database
 * @param data - Transfer data to add
 * @returns true on success, false on failure
 */
export const addTransfer = async (data: TransferModel, actionBy?: string): Promise<boolean> => {
    let result: boolean = false;

    const docRef = doc(transferCollection);
    const transferData = { ...data, id: docRef.id };

    result = await setDoc(docRef, transferData)
        .then(() => {
            // Create activity log
            if (actionBy) {
                const logInfo = TRANSFER_LOG_MESSAGES.CREATED({
                    employeeUid: data.employeeUID,
                    transferID: data.transferID,
                    transferType: data.transferTypeName || data.transferType || "Unknown",
                });
                createLog(logInfo, actionBy, "Success");
            }
            return true;
        })
        .catch(err => {
            console.log("Error adding transfer:", err);
            // Create failure log
            if (actionBy) {
                const logInfo = TRANSFER_LOG_MESSAGES.CREATED({
                    employeeUid: data.employeeUID,
                    transferID: data.transferID,
                    transferType: data.transferTypeName || data.transferType || "Unknown",
                });
                createLog(logInfo, actionBy, "Failure");
            }
            return false;
        });

    return result;
};

/**
 * Update an existing transfer request
 * @param data - Transfer data with id to update
 * @returns true on success, error object on failure
 */
export const updateTransfer = async (
    data: TransferModel,
    actionBy?: string,
): Promise<boolean | Error> => {
    let result: boolean | Error = false;

    if (!data.id) {
        return new Error("Transfer ID is required for update");
    }

    const docRef = doc(db, "transfer", data.id);

    result = await updateDoc(docRef, data as unknown as Record<string, never>)
        .then(() => {
            // Create activity log
            if (actionBy) {
                const logInfo = TRANSFER_LOG_MESSAGES.UPDATED({
                    id: data.id!,
                    transferID: data.transferID,
                    status: data.transferStatus,
                    stage: data.transferStage,
                });
                createLog(logInfo, actionBy, "Success");
            }
            return true;
        })
        .catch(err => {
            console.log("Error updating transfer:", err);
            // Create failure log
            if (actionBy) {
                const logInfo = TRANSFER_LOG_MESSAGES.UPDATED({
                    id: data.id!,
                    transferID: data.transferID,
                    status: data.transferStatus,
                    stage: data.transferStage,
                });
                createLog(logInfo, actionBy, "Failure");
            }
            return err;
        });

    return result;
};

/**
 * Delete a transfer request from the database
 * @param id - ID of the transfer to delete
 * @returns true on success, false on failure
 */
export const deleteTransfer = async (id: string, actionBy?: string): Promise<boolean> => {
    let result: boolean = false;

    const docRef = doc(db, "transfer", id);

    // Get transfer data before deletion for logging
    let transferData: TransferModel | null = null;
    try {
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            transferData = docSnap.data() as TransferModel;
        }
    } catch (err) {
        console.log("Error fetching transfer for logging:", err);
    }

    result = await deleteDoc(docRef)
        .then(() => {
            // Create activity log
            if (actionBy && transferData) {
                const logInfo = TRANSFER_LOG_MESSAGES.DELETED({
                    id: id,
                    transferID: transferData.transferID,
                    employeeUid: transferData.employeeUID,
                });
                createLog(logInfo, actionBy, "Success");
            }
            return true;
        })
        .catch(err => {
            console.log("Error deleting transfer:", err);
            // Create failure log
            if (actionBy && transferData) {
                const logInfo = TRANSFER_LOG_MESSAGES.DELETED({
                    id: id,
                    transferID: transferData.transferID,
                    employeeUid: transferData.employeeUID,
                });
                createLog(logInfo, actionBy, "Failure");
            }
            return false;
        });

    return result;
};

/**
 * Generate a unique transfer ID
 * @returns A unique transfer ID in format TRF-YYYY-XXXX
 */
export const generateTransferID = (): string => {
    const year = new Date().getFullYear();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `TRF-${year}-${random}`;
};

/**
 * Create a new transfer request with auto-generated fields
 * @param employeeUID - Firebase Auth UID of the employee
 * @param employeeFullName - Full name of the employee
 * @param transferData - Additional transfer data
 * @returns true on success, false on failure
 */
export const createTransferRequest = async (
    employeeUID: string,
    employeeFullName: string,
    transferData: Partial<TransferModel>,
): Promise<boolean> => {
    const transferID = generateTransferID();
    const timestamp = getTimestamp();

    const newTransfer: TransferModel = {
        id: null,
        timestamp,
        transferID,
        employeeUID,
        employeeFullName,
        transferType: transferData.transferType || "",
        transferTypeName: transferData.transferTypeName ?? null,
        transferReason: transferData.transferReason ?? null,
        transferReasonName: transferData.transferReasonName ?? null,
        transferDescription: transferData.transferDescription || "",
        transferDesiredDate: transferData.transferDesiredDate || "",
        transferStage: "Open",
        transferStatus: "Requested",
        orderGuide: transferData.orderGuide ?? null,
        managerRemark: null,
        hrRemark: null,
        mitigationForTransferRisk: transferData.mitigationForTransferRisk ?? null,
        associatedInterview: transferData.associatedInterview ?? null,
    };

    return addTransfer(newTransfer, employeeUID);
};

/**
 * Approve a transfer request (HR)
 * @param id - ID of the transfer to approve
 * @param actionBy - UID of the user performing the action
 * @param comment - Comment made by the HR
 * @returns true on success, false on failure
 */
export const approveTransfer = async (
    id: string,
    actionBy?: string,
    comment?: string,
    actionByName?: string,
): Promise<boolean> => {
    let result: boolean = false;

    const docRef = doc(db, "transfer", id);

    // Get transfer data for logging
    let transferData: TransferModel | null = null;
    try {
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            transferData = docSnap.data() as TransferModel;
        }
    } catch (err) {
        console.log("Error fetching transfer for logging:", err);
    }

    const updateData: Partial<TransferModel> = {
        transferStatus: "HR Approved",
        transferStage: "Closed",
    };
    if (comment && actionBy && actionByName) {
        updateData.hrRemark = {
            content: comment || "",
            authorUID: actionBy || "",
            authorName: actionByName || "",
            timestamp: getTimestamp(),
            role: "HR",
        };
    }

    result = await updateDoc(docRef, updateData as unknown as Record<string, never>)
        .then(() => {
            // Create activity log
            if (actionBy && transferData) {
                const logInfo = TRANSFER_LOG_MESSAGES.APPROVED({
                    id: id,
                    transferID: transferData.transferID,
                    employeeUid: transferData.employeeUID,
                });
                createLog(logInfo, actionBy, "Success");
            }
            return true;
        })
        .catch(err => {
            console.log("Error approving transfer:", err);
            // Create failure log
            if (actionBy && transferData) {
                const logInfo = TRANSFER_LOG_MESSAGES.APPROVED({
                    id: id,
                    transferID: transferData.transferID,
                    employeeUid: transferData.employeeUID,
                });
                createLog(logInfo, actionBy, "Failure");
            }
            return false;
        });

    return result;
};

/**
 * Manager approves a transfer request
 * @param id - ID of the transfer to approve
 * @param actionBy - UID of the manager performing the action
 * @param authorName - Name of the manager performing the action
 * @param riskMitigationPlan - Risk mitigation plan (required for approval)
 * @returns true on success, false on failure
 */
export const managerApproveTransfer = async (
    id: string,
    actionBy?: string,
    authorName?: string,
    riskMitigationPlan?: string,
): Promise<boolean> => {
    let result: boolean = false;

    const docRef = doc(db, "transfer", id);

    // Get transfer data for logging
    let transferData: TransferModel | null = null;
    try {
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            transferData = docSnap.data() as TransferModel;
        }
    } catch (err) {
        console.log("Error fetching transfer for logging:", err);
    }

    const updateData: Partial<TransferModel> = {
        transferStatus: "Current Manager Validated",
    };

    if (riskMitigationPlan) {
        updateData.mitigationForTransferRisk = riskMitigationPlan;
    }

    result = await updateDoc(docRef, updateData as unknown as Record<string, never>)
        .then(() => {
            // Create activity log
            if (actionBy && transferData) {
                const logInfo = TRANSFER_LOG_MESSAGES.MANAGER_APPROVED({
                    id: id,
                    transferID: transferData.transferID,
                    employeeUid: transferData.employeeUID,
                });
                createLog(logInfo, actionBy, "Success");
            }
            return true;
        })
        .catch(err => {
            console.log("Error approving transfer:", err);
            // Create failure log
            if (actionBy && transferData) {
                const logInfo = TRANSFER_LOG_MESSAGES.MANAGER_APPROVED({
                    id: id,
                    transferID: transferData.transferID,
                    employeeUid: transferData.employeeUID,
                });
                createLog(logInfo, actionBy, "Failure");
            }
            return false;
        });

    return result;
};

/**
 * Manager refuses a transfer request
 * @param id - ID of the transfer to refuse
 * @param actionBy - UID of the manager performing the action
 * @param authorName - Name of the manager performing the action
 * @param remark - Remark explaining the refusal (required)
 * @returns true on success, false on failure
 */
export const managerRefuseTransfer = async (
    id: string,
    actionBy?: string,
    authorName?: string,
    remark?: string,
): Promise<boolean> => {
    let result: boolean = false;

    const docRef = doc(db, "transfer", id);

    // Get transfer data for logging
    let transferData: TransferModel | null = null;
    try {
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            transferData = docSnap.data() as TransferModel;
        }
    } catch (err) {
        console.log("Error fetching transfer for logging:", err);
    }

    // Create remark object with author info
    const managerRemark: RemarkModel | null = remark
        ? {
            content: remark,
            authorUID: actionBy || "",
            authorName: authorName || "Unknown",
            timestamp: getTimestamp(),
            role: "Manager",
        }
        : null;

    const updateData: {
        transferStatus: string;
        transferStage: string;
        managerRemark?: RemarkModel;
    } = {
        transferStatus: "Current Manager Refused",
        transferStage: "Closed",
    };

    if (managerRemark) {
        updateData.managerRemark = managerRemark;
    }

    result = await updateDoc(docRef, updateData as unknown as Record<string, never>)
        .then(() => {
            // Create activity log
            if (actionBy && transferData) {
                const logInfo = TRANSFER_LOG_MESSAGES.MANAGER_REFUSED({
                    id: id,
                    transferID: transferData.transferID,
                    employeeUid: transferData.employeeUID,
                    remark: remark,
                });
                createLog(logInfo, actionBy, "Success");
            }
            return true;
        })
        .catch(err => {
            console.log("Error refusing transfer:", err);
            // Create failure log
            if (actionBy && transferData) {
                const logInfo = TRANSFER_LOG_MESSAGES.MANAGER_REFUSED({
                    id: id,
                    transferID: transferData.transferID,
                    employeeUid: transferData.employeeUID,
                    remark: remark,
                });
                createLog(logInfo, actionBy, "Failure");
            }
            return false;
        });

    return result;
};

/**
 * Refuse a transfer request (HR)
 * @param id - ID of the transfer to refuse
 * @param remark - Remark explaining the refusal (required)
 * @param actionBy - UID of the user performing the action
 * @param authorName - Name of the user performing the action
 * @returns true on success, false on failure
 */
export const refuseTransfer = async (
    id: string,
    remark: string,
    actionBy?: string,
    authorName?: string,
): Promise<boolean> => {
    let result: boolean = false;

    const docRef = doc(db, "transfer", id);

    // Get transfer data for logging
    let transferData: TransferModel | null = null;
    try {
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            transferData = docSnap.data() as TransferModel;
        }
    } catch (err) {
        console.log("Error fetching transfer for logging:", err);
    }

    // Create remark object with author info
    const hrRemark: RemarkModel = {
        content: remark,
        authorUID: actionBy || "",
        authorName: authorName || "Unknown",
        timestamp: getTimestamp(),
        role: "HR",
    };

    const updateData: { transferStatus: string; transferStage: string; hrRemark: RemarkModel } = {
        transferStatus: "HR Refused",
        transferStage: "Closed",
        hrRemark,
    };

    result = await updateDoc(docRef, updateData as unknown as Record<string, never>)
        .then(() => {
            // Create activity log
            if (actionBy && transferData) {
                const logInfo = TRANSFER_LOG_MESSAGES.REFUSED({
                    id: id,
                    transferID: transferData.transferID,
                    employeeUid: transferData.employeeUID,
                    remark: remark,
                });
                createLog(logInfo, actionBy, "Success");
            }
            return true;
        })
        .catch(err => {
            console.log("Error refusing transfer:", err);
            // Create failure log
            if (actionBy && transferData) {
                const logInfo = TRANSFER_LOG_MESSAGES.REFUSED({
                    id: id,
                    transferID: transferData.transferID,
                    employeeUid: transferData.employeeUID,
                    remark: remark,
                });
                createLog(logInfo, actionBy, "Failure");
            }
            return false;
        });

    return result;
};

/**
 * Assign an order guide to a transfer request
 * @param id - ID of the transfer
 * @param orderGuideId - ID of the order guide to assign
 * @param actionBy - UID of the user performing the action
 * @returns true on success, false on failure
 */
export const assignOrderGuideToTransfer = async (
    id: string,
    orderGuideId: string,
    actionBy: string,
): Promise<boolean> => {
    let result = false;

    const docRef = doc(db, "transfer", id);

    // Get transfer data for logging
    let transferData: TransferModel | null = null;
    try {
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            transferData = docSnap.data() as TransferModel;
        }
    } catch (err) {
        console.log("Error fetching transfer for logging:", err);
    }

    const updateData: Partial<TransferModel> = {
        orderGuide: orderGuideId,
    };

    result = await updateDoc(docRef, updateData as unknown as Record<string, never>)
        .then(async () => {
            // Create activity log
            if (actionBy && transferData) {
                const logInfo = TRANSFER_LOG_MESSAGES.ORDER_GUIDE_ASSIGNED({
                    transferID: transferData.transferID,
                    orderGuideID: orderGuideId,
                });
                createLog(logInfo, actionBy, "Success");
            }
            return true;
        })
        .catch(err => {
            console.log("Error assigning order guide to transfer:", err);
            if (actionBy && transferData) {
                const logInfo = TRANSFER_LOG_MESSAGES.ORDER_GUIDE_ASSIGNED({
                    transferID: transferData.transferID,
                    orderGuideID: orderGuideId,
                });
                createLog(logInfo, actionBy, "Failure");
            }
            return false;
        });

    return result;
};

/**
 * Associate an interview with a transfer request
 * @param id - ID of the transfer
 * @param interviewId - ID of the interview to associate
 * @param actionBy - UID of the user performing the action
 * @returns true on success, false on failure
 */
export const associateInterviewWithTransfer = async (
    id: string,
    interviewId: string,
    actionBy: string,
): Promise<boolean> => {
    let result = false;

    const docRef = doc(db, "transfer", id);

    // Get transfer data
    let transferData: TransferModel | null = null;
    try {
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            transferData = docSnap.data() as TransferModel;
        }
    } catch (err) {
        console.log("Error fetching transfer:", err);
    }

    // Get existing associated interviews or create new array
    const existingInterviews = transferData?.associatedInterview || [];

    // Check if interview already associated
    if (existingInterviews.includes(interviewId)) {
        console.log("Interview already associated with this transfer");
        return true;
    }

    const updatedInterviews = [...existingInterviews, interviewId];

    const updateData: Partial<TransferModel> = {
        associatedInterview: updatedInterviews,
    };

    result = await updateDoc(docRef, updateData as unknown as Record<string, never>)
        .then(async () => {
            // Create activity log
            if (actionBy && transferData) {
                const logInfo = TRANSFER_LOG_MESSAGES.INTERVIEW_ASSOCIATED({
                    transferID: transferData.transferID,
                    interviewID: interviewId,
                });
                createLog(logInfo, actionBy, "Success");
            }
            return true;
        })
        .catch(err => {
            console.log("Error associating interview with transfer:", err);
            if (actionBy && transferData) {
                const logInfo = TRANSFER_LOG_MESSAGES.INTERVIEW_ASSOCIATED({
                    transferID: transferData.transferID,
                    interviewID: interviewId,
                });
                createLog(logInfo, actionBy, "Failure");
            }
            return false;
        });

    return result;
};

/**
 * Approve transfer and auto-create interview
 * @param id - ID of the transfer to approve
 * @param actionBy - UID of the user performing the action
 * @param comment - Comment made by the HR
 * @param actionByName - Name of the HR
 * @param createInterview - Whether to create an interview (optional)
 * @returns true on success, false on failure
 */
export const approveTransferWithInterview = async (
    id: string,
    actionBy?: string,
    comment?: string,
    actionByName?: string,
    createInterview: boolean = false,
): Promise<boolean> => {
    // First approve the transfer
    const approved = await approveTransfer(id, actionBy, comment, actionByName);

    if (!approved) {
        return false;
    }

    // If createInterview is true, create an interview for this transfer
    if (createInterview) {
        try {
            // Get transfer data
            const docRef = doc(db, "transfer", id);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const transferData = docSnap.data() as TransferModel;

                // Create interview for transfer
                await InterviewService.createInterview(
                    {
                        name: `Transfer Interview - ${transferData.employeeFullName}`,
                        type: "Transfer",
                        evaluators: [],
                        processStarted: false,
                        creationDate: getTimestamp(),
                        interviewID: `INT-TRANSFER-${Date.now()}`,
                    },
                    actionBy || "system",
                    {
                        title: "Interview Created for Transfer",
                        description: `Created interview for transfer ${transferData.transferID}`,
                        module: "Career Development",
                    },
                );
            }
        } catch (error) {
            console.error("Error creating interview:", error);
            // Transfer is already approved, so we return true even if interview creation fails
        }
    }

    return true;
};

/**
 * Complete transfer approval - assign order guide and create interview
 * This is the main function to call when HR approves a transfer
 * @param id - ID of the transfer to complete
 * @param orderGuideId - ID of the order guide to assign (optional)
 * @param actionBy - UID of the user performing the action
 * @param actionByName - Name of the user
 * @param createInterview - Whether to create an interview
 * @returns true on success, false on failure
 */
export const completeTransferApproval = async (
    id: string,
    orderGuideId: string | null,
    actionBy: string,
    actionByName?: string,
    createInterview: boolean = false,
): Promise<boolean> => {
    // First approve the transfer
    const approved = await approveTransfer(id, actionBy, undefined, actionByName);

    if (!approved) {
        return false;
    }

    // Get transfer data for order guide assignment
    const docRef = doc(db, "transfer", id);
    let transferData: TransferModel | null = null;

    try {
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            transferData = docSnap.data() as TransferModel;
        }
    } catch (err) {
        console.log("Error fetching transfer:", err);
    }

    // Assign order guide if provided
    if (orderGuideId && transferData) {
        await OrderGuideService.addEmployeeToOrderGuide(
            orderGuideId,
            transferData.employeeUID,
            actionBy,
            {
                title: "Employee Added to Order Guide",
                description: `Added ${transferData.employeeFullName} to order guide for transfer ${transferData.transferID}`,
                module: "Career Development",
            },
        );
    }

    // Create interview if requested
    if (createInterview && transferData) {
        try {
            const interview = await InterviewService.createInterview(
                {
                    name: `Transfer Interview - ${transferData.employeeFullName}`,
                    type: "Transfer",
                    evaluators: [],
                    processStarted: false,
                    creationDate: getTimestamp(),
                    interviewID: `INT-TRANSFER-${Date.now()}`,
                },
                actionBy,
                {
                    title: "Interview Created for Transfer",
                    description: `Created interview for transfer ${transferData.transferID}`,
                    module: "Career Development",
                },
            );

            // Associate the interview with the transfer
            await associateInterviewWithTransfer(id, interview.id!, actionBy);
        } catch (error) {
            console.error("Error creating interview:", error);
        }
    }

    return true;
};
