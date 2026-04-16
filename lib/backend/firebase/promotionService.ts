import { EMPLOYEE_ENGAGEMENT_LOG_MESSAGES } from "@/lib/log-descriptions/employee-engagement";
import {
    PromotionCommentModel,
    PromotionInstanceModel,
    PromotionStatus,
} from "@/lib/models/promotion-instance";
import { DocumentDefinitionModel } from "@/lib/models/document";
import { NotificationPayloads } from "@/lib/notifications/messages";
import { timestampFormat } from "@/lib/util/dayjs_format";
import { sendNotification } from "@/lib/util/notification/send-notification";
import dayjs from "dayjs";
import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    DocumentData,
    getDoc,
    getDocs,
    limit,
    orderBy,
    query,
    updateDoc,
    where,
    writeBatch,
} from "firebase/firestore";
import {
    getEmployeeByUid,
    updateEmployee,
    getAllEmployees,
} from "../api/employee-management/employee-management-service";
import { createLog } from "../api/logCollection";
import { createCompensation } from "../api/compensation-benefit/compensation-service";
import { getDocuments } from "../api/hr-settings/document-service";
import { db } from "./init";
import { EmployeeCompensationModel } from "@/lib/models/employeeCompensation";

const COLLECTION_NAME = "promotionInstance";

/**
 * Log promotion activity to HR Activity Log (Firestore)
 * Replaces console logging with persistent audit trail
 */
async function logActivity(
    action: string,
    promotion: PromotionInstanceModel & { id: string },
    userUID: string,
    userName: string,
    details?: string,
): Promise<void> {
    // Also log to console for debugging
    const logEntry = {
        timestamp: dayjs().format(timestampFormat),
        action,
        promotionID: promotion.promotionID,
        userUID,
        userName,
        details,
    };
    console.log(`[PROMOTION ACTIVITY]`, logEntry);

    // Map action to appropriate log message and save to Firestore
    try {
        let logInfo;

        switch (action) {
            case "CREATED":
                logInfo = EMPLOYEE_ENGAGEMENT_LOG_MESSAGES.PROMOTION_CREATED({
                    promotionName: promotion.promotionName,
                    employeeName: promotion.employeeName,
                });
                break;
            case "ACCEPTED":
                logInfo = EMPLOYEE_ENGAGEMENT_LOG_MESSAGES.PROMOTION_STATUS_CHANGED({
                    promotionName: promotion.promotionName,
                    employeeName: promotion.employeeName,
                    oldStatus: "pending",
                    newStatus: "accepted",
                });
                break;
            case "REFUSED":
                logInfo = EMPLOYEE_ENGAGEMENT_LOG_MESSAGES.PROMOTION_REJECTED({
                    promotionName: promotion.promotionName,
                    employeeName: promotion.employeeName,
                    reason: details,
                });
                break;
            case "REOPENED":
                logInfo = EMPLOYEE_ENGAGEMENT_LOG_MESSAGES.PROMOTION_STATUS_CHANGED({
                    promotionName: promotion.promotionName,
                    employeeName: promotion.employeeName,
                    oldStatus: "refused",
                    newStatus: "pending",
                });
                break;
            case "APPROVED":
                logInfo = EMPLOYEE_ENGAGEMENT_LOG_MESSAGES.PROMOTION_APPROVED({
                    promotionName: promotion.promotionName,
                    employeeName: promotion.employeeName,
                });
                break;
            case "REJECTED":
                logInfo = EMPLOYEE_ENGAGEMENT_LOG_MESSAGES.PROMOTION_REJECTED({
                    promotionName: promotion.promotionName,
                    employeeName: promotion.employeeName,
                    reason: details,
                });
                break;
            case "FINALIZED":
                logInfo = EMPLOYEE_ENGAGEMENT_LOG_MESSAGES.PROMOTION_COMPLETED({
                    promotionName: promotion.promotionName,
                    employeeName: promotion.employeeName,
                });
                break;
            case "DELETED":
                logInfo = EMPLOYEE_ENGAGEMENT_LOG_MESSAGES.PROMOTION_DELETED({
                    promotionName: promotion.promotionName,
                    employeeName: promotion.employeeName,
                });
                break;
            case "UPDATED":
                logInfo = EMPLOYEE_ENGAGEMENT_LOG_MESSAGES.PROMOTION_UPDATED({
                    promotionName: promotion.promotionName,
                    employeeName: promotion.employeeName,
                    changes: details,
                });
                break;
            default:
                // Fallback for any other actions
                logInfo = {
                    title: `Promotion ${action}`,
                    description: `${action} promotion "${promotion.promotionName}" for employee ${promotion.employeeName}${details ? `: ${details}` : ""}`,
                    module: "Employee Engagement",
                };
        }

        await createLog(logInfo, userUID, "Success");
    } catch (error) {
        console.error("[PROMOTION ACTIVITY LOG ERROR] Failed to create activity log:", error);
        // Don't throw - log failures shouldn't break the promotion workflow
    }
}

type PromotionNotificationType = keyof Pick<
    NotificationPayloads,
    | "PROMOTION_OFFER"
    | "PROMOTION_ACCEPTED"
    | "PROMOTION_REFUSED"
    | "PROMOTION_APPROVED"
    | "PROMOTION_REJECTED"
    | "PROMOTION_FINALIZED"
    | "PROMOTION_REOPENED"
>;

interface NotificationRecipient {
    uid: string;
    email: string;
    telegramChatID: string;
    recipientType: "hr" | "employee";
}

/**
 * Send promotion notification using the actual notification system
 */
async function sendPromotionNotification<T extends PromotionNotificationType>(
    recipientType: "employee" | "hr",
    recipient: NotificationRecipient,
    promotion: PromotionInstanceModel & { id: string },
    notificationType: T,
    payload: NotificationPayloads[T],
) {
    try {
        const titleMap: Record<PromotionNotificationType, string> = {
            PROMOTION_OFFER: "Promotion Offer",
            PROMOTION_ACCEPTED: "Promotion Accepted",
            PROMOTION_REFUSED: "Promotion Refused",
            PROMOTION_APPROVED: "Promotion Approved",
            PROMOTION_REJECTED: "Promotion Rejected",
            PROMOTION_FINALIZED: "Promotion Finalized",
            PROMOTION_REOPENED: "Promotion Reopened",
        };

        await sendNotification({
            users: [
                {
                    uid: recipient.uid,
                    email: recipient.email,
                    telegramChatID: recipient.telegramChatID,
                    recipientType: recipientType,
                },
            ],
            channels: ["inapp", "telegram", "email"],
            messageKey: notificationType,
            payload: payload,
            title: titleMap[notificationType],
        });

        console.log(
            `[NOTIFICATION SENT] ${notificationType} to ${recipientType} (${recipient.uid}) for promotion ${promotion.promotionID}`,
        );
    } catch (error) {
        console.error(`[NOTIFICATION ERROR] Failed to send ${notificationType}:`, error);
        // Don't throw - notification failures shouldn't break the promotion workflow
    }
}

export const promotionService = {
    /**
     * Create a new promotion instance
     */
    async create(
        data: Omit<PromotionInstanceModel, "id"> & { id?: string },
        employeeData?: { email?: string; telegramChatID?: string },
        createdByUID?: string,
        createdByName?: string,
    ): Promise<string> {
        const subcollectionRef = collection(db, COLLECTION_NAME);

        const dataWithTimestamp = {
            ...data,
            createdAt: dayjs().format(timestampFormat),
            updatedAt: dayjs().format(timestampFormat),
        };

        const docRef = await addDoc(subcollectionRef, dataWithTimestamp);
        const promotionId = docRef.id;

        // Send notification to employee about promotion offer
        if (data.employeeUID) {
            const promotionWithId = { ...data, id: promotionId } as PromotionInstanceModel & {
                id: string;
            };
            await sendPromotionNotification(
                "employee",
                {
                    uid: data.employeeUID,
                    email: employeeData?.email || "",
                    telegramChatID: employeeData?.telegramChatID || "",
                    recipientType: "employee",
                },
                promotionWithId,
                "PROMOTION_OFFER",
                {
                    promotionID: data.promotionID,
                    promotionName: data.promotionName,
                    newPosition: data.newPosition,
                    newGrade: data.newGrade,
                    newSalary: data.newSalary,
                },
            );

            // Log the creation activity
            if (createdByUID) {
                await logActivity(
                    "CREATED",
                    promotionWithId,
                    createdByUID,
                    createdByName || createdByUID,
                );
            }
        }

        return promotionId;
    },

    /**
     * Get a promotion instance by ID
     */
    async get(id: string) {
        const docRef = doc(db, COLLECTION_NAME, id);
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) {
            return null;
        }
        return { id: docSnap.id, ...docSnap.data() } as PromotionInstanceModel & {
            id: string;
        };
    },

    /**
     * Get all promotion instances
     */
    async getAll(): Promise<Array<PromotionInstanceModel & { id: string }>> {
        const subcollectionRef = collection(db, COLLECTION_NAME);
        const snapshot = await getDocs(subcollectionRef);
        return snapshot.docs.map(
            d => ({ id: d.id, ...d.data() }) as PromotionInstanceModel & { id: string },
        );
    },

    /**
     * Get promotion instances by status
     */
    async getByStatus(
        status: PromotionStatus,
    ): Promise<Array<PromotionInstanceModel & { id: string }>> {
        const subcollectionRef = collection(db, COLLECTION_NAME);
        const q = query(
            subcollectionRef,
            where("status", "==", status),
            orderBy("timestamp", "desc"),
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(
            d => ({ id: d.id, ...d.data() }) as PromotionInstanceModel & { id: string },
        );
    },

    /**
     * Get promotion instances by employee UID
     */
    async getByEmployee(
        employeeUID: string,
    ): Promise<Array<PromotionInstanceModel & { id: string }>> {
        const subcollectionRef = collection(db, COLLECTION_NAME);
        const q = query(
            subcollectionRef,
            where("employeeUID", "==", employeeUID),
            orderBy("timestamp", "desc"),
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(
            d => ({ id: d.id, ...d.data() }) as PromotionInstanceModel & { id: string },
        );
    },

    /**
     * Get pending promotions for an employee (for employee view)
     * Returns promotions with status "pending" or "refused" that need employee action
     */
    async getPendingForEmployee(
        employeeUID: string,
    ): Promise<Array<PromotionInstanceModel & { id: string }>> {
        const allPromotions = await this.getByEmployee(employeeUID);
        // Filter for pending and refused statuses
        return allPromotions.filter(p => p.status === "pending" || p.status === "refused");
    },

    /**
     * Get promotion instances by period
     */
    async getByPeriod(period: string): Promise<Array<PromotionInstanceModel & { id: string }>> {
        const subcollectionRef = collection(db, COLLECTION_NAME);
        const q = query(
            subcollectionRef,
            where("period", "==", period),
            orderBy("timestamp", "desc"),
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(
            d => ({ id: d.id, ...d.data() }) as PromotionInstanceModel & { id: string },
        );
    },

    /**
     * Get recent promotion instances
     */
    async getRecent(count: number = 10): Promise<Array<PromotionInstanceModel & { id: string }>> {
        const subcollectionRef = collection(db, COLLECTION_NAME);
        const q = query(subcollectionRef, orderBy("timestamp", "desc"), limit(count));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(
            d => ({ id: d.id, ...d.data() }) as PromotionInstanceModel & { id: string },
        );
    },

    /**
     * Update a promotion instance
     */
    async update(id: string, data: Partial<PromotionInstanceModel>): Promise<boolean> {
        try {
            const docRef = doc(db, COLLECTION_NAME, id);
            const dataWithTimestamp = {
                ...data,
                updatedAt: dayjs().format(timestampFormat),
            };
            await updateDoc(docRef, dataWithTimestamp as DocumentData);
            return true;
        } catch (e) {
            console.log("error", e);
            return false;
        }
    },

    /**
     * Update a promotion instance with HR Activity Log
     * Only allowed when status is pending or refused
     * Optionally reopens the promotion (changes status back to pending)
     */
    async updateWithLog(
        id: string,
        data: Partial<PromotionInstanceModel>,
        originalPromotion: PromotionInstanceModel & { id: string },
        updatedByUID: string,
        updatedByName: string,
        changesDescription?: string,
        reopenPromotion: boolean = false,
    ): Promise<boolean> {
        // Check if editing is allowed (only pending or refused status)
        if (originalPromotion.status !== "pending" && originalPromotion.status !== "refused") {
            console.error(`Cannot edit promotion with status: ${originalPromotion.status}`);
            return false;
        }

        try {
            const docRef = doc(db, COLLECTION_NAME, id);

            // Build update data
            const updateData: Record<string, unknown> = {
                ...data,
                updatedAt: dayjs().format(timestampFormat),
            };

            // If reopening, change status back to pending
            if (reopenPromotion && originalPromotion.status === "refused") {
                updateData.status = "pending";
                updateData.statusChangedAt = dayjs().format(timestampFormat);
                updateData.statusChangedBy = updatedByUID;
            }

            await updateDoc(docRef, updateData as DocumentData);

            // Log the update activity
            await logActivity(
                "UPDATED",
                originalPromotion,
                updatedByUID,
                updatedByName,
                changesDescription,
            );

            return true;
        } catch (e) {
            console.log("error", e);
            return false;
        }
    },

    /**
     * Update promotion status with additional metadata
     */
    async updateStatus(
        id: string,
        status: PromotionStatus,
        changedBy?: string,
        changedByName?: string,
    ): Promise<boolean> {
        const updateData: Partial<PromotionInstanceModel> = {
            status,
            statusChangedAt: dayjs().format(timestampFormat),
        };

        if (changedBy) {
            updateData.statusChangedBy = changedBy;
        }

        return this.update(id, updateData);
    },

    /**
     * Add a comment to a promotion instance
     */
    async addComment(
        id: string,
        comment: Omit<PromotionCommentModel, "id" | "timestamp">,
    ): Promise<boolean> {
        try {
            const promotion = await this.get(id);
            if (!promotion) return false;

            const newComment: PromotionCommentModel = {
                id: `comment-${Date.now()}`,
                timestamp: dayjs().format(timestampFormat),
                by: comment.by,
                byName: comment.byName,
                text: comment.text,
            };

            const comments = promotion.comments || [];
            return this.update(id, { comments: [...comments, newComment] });
        } catch (e) {
            console.error("Error adding comment:", e);
            return false;
        }
    },

    /**
     * Accept a promotion offer (employee action)
     * Workflow: pending -> accepted
     */
    async acceptPromotion(
        id: string,
        employeeUID: string,
        employeeName: string,
        hrContacts?: Array<{ uid: string; email?: string; telegramChatID?: string }>,
    ): Promise<boolean> {
        try {
            const promotion = await this.get(id);
            if (!promotion) return false;

            const success = await this.updateStatus(id, "accepted", employeeUID, employeeName);

            if (success) {
                await logActivity("ACCEPTED", promotion, employeeUID, employeeName);
                // Notify HR about promotion acceptance
                const hrRecipients = hrContacts?.length
                    ? hrContacts
                    : [{ uid: "hr", email: "", telegramChatID: "" }];
                for (const hr of hrRecipients) {
                    await sendPromotionNotification(
                        "hr",
                        {
                            uid: hr.uid,
                            email: hr.email || "",
                            telegramChatID: hr.telegramChatID || "",
                            recipientType: "hr",
                        },
                        promotion,
                        "PROMOTION_ACCEPTED",
                        {
                            promotionID: promotion.promotionID,
                            promotionName: promotion.promotionName,
                            employeeName: promotion.employeeName,
                        },
                    );
                }
            }

            return success;
        } catch (e) {
            console.error("Error accepting promotion:", e);
            return false;
        }
    },

    /**
     * Refuse a promotion offer (employee action)
     * Workflow: pending -> refused
     * Requires a comment explaining the refusal
     */
    async refusePromotion(
        id: string,
        employeeUID: string,
        employeeName: string,
        comment: string,
        hrContacts?: Array<{ uid: string; email?: string; telegramChatID?: string }>,
    ): Promise<boolean> {
        try {
            const promotion = await this.get(id);
            if (!promotion) return false;

            // Add the refusal comment first
            await this.addComment(id, {
                by: employeeUID,
                byName: employeeName,
                text: comment,
            });

            // Then update status
            const success = await this.updateStatus(id, "refused", employeeUID, employeeName);

            if (success) {
                await logActivity("REFUSED", promotion, employeeUID, employeeName, comment);
                // Notify HR about promotion refusal
                const hrRecipients = hrContacts?.length
                    ? hrContacts
                    : [{ uid: "hr", email: "", telegramChatID: "" }];
                for (const hr of hrRecipients) {
                    await sendPromotionNotification(
                        "hr",
                        {
                            uid: hr.uid,
                            email: hr.email || "",
                            telegramChatID: hr.telegramChatID || "",
                            recipientType: "hr",
                        },
                        promotion,
                        "PROMOTION_REFUSED",
                        {
                            promotionID: promotion.promotionID,
                            promotionName: promotion.promotionName,
                            employeeName: promotion.employeeName,
                            reason: comment,
                        },
                    );
                }
            }

            return success;
        } catch (e) {
            console.error("Error refusing promotion:", e);
            return false;
        }
    },

    /**
     * Reopen a refused promotion (HR action) - set back to pending
     * Workflow: refused -> pending
     * HR can reopen and employee needs to respond again
     */
    async reopenPromotion(
        id: string,
        hrUID: string,
        hrName: string,
        comment?: string,
        employeeData?: { email?: string; telegramChatID?: string },
    ): Promise<boolean> {
        try {
            const promotion = await this.get(id);
            if (!promotion) return false;

            // Add comment if provided
            if (comment) {
                await this.addComment(id, {
                    by: hrUID,
                    byName: hrName,
                    text: `Reopened by HR: ${comment}`,
                });
            }

            const success = await this.updateStatus(id, "pending", hrUID, hrName);

            if (success) {
                await logActivity("REOPENED", promotion, hrUID, hrName);
                // Notify employee about the reopening
                await sendPromotionNotification(
                    "employee",
                    {
                        uid: promotion.employeeUID,
                        email: employeeData?.email || "",
                        telegramChatID: employeeData?.telegramChatID || "",
                        recipientType: "employee",
                    },
                    promotion,
                    "PROMOTION_REOPENED",
                    {
                        promotionID: promotion.promotionID,
                        promotionName: promotion.promotionName,
                        employeeName: promotion.employeeName,
                    },
                );
            }

            return success;
        } catch (e) {
            console.error("Error reopening promotion:", e);
            return false;
        }
    },

    /**
     * Approve a promotion (HR action after employee accepts)
     * Workflow: accepted -> approved
     */
    async approvePromotion(
        id: string,
        hrUID: string,
        hrName: string,
        employeeData?: { email?: string; telegramChatID?: string },
    ): Promise<boolean> {
        try {
            const promotion = await this.get(id);
            if (!promotion) return false;

            const success = await this.updateStatus(id, "approved", hrUID, hrName);

            if (success) {
                await logActivity("APPROVED", promotion, hrUID, hrName);
                // Notify employee about approval
                await sendPromotionNotification(
                    "employee",
                    {
                        uid: promotion.employeeUID,
                        email: employeeData?.email || "",
                        telegramChatID: employeeData?.telegramChatID || "",
                        recipientType: "employee",
                    },
                    promotion,
                    "PROMOTION_APPROVED",
                    {
                        promotionID: promotion.promotionID,
                        promotionName: promotion.promotionName,
                        employeeName: promotion.employeeName,
                    },
                );
            }

            return success;
        } catch (e) {
            console.error("Error approving promotion:", e);
            return false;
        }
    },

    /**
     * Reject a promotion (HR action)
     * Workflow: accepted -> rejected
     * Requires a comment explaining the rejection
     */
    async rejectPromotion(
        id: string,
        hrUID: string,
        hrName: string,
        comment: string,
        employeeData?: { email?: string; telegramChatID?: string },
    ): Promise<boolean> {
        try {
            const promotion = await this.get(id);
            if (!promotion) return false;

            // Add the rejection comment first
            await this.addComment(id, {
                by: hrUID,
                byName: hrName,
                text: comment,
            });

            // Then update status
            const success = await this.updateStatus(id, "rejected", hrUID, hrName);

            if (success) {
                await logActivity("REJECTED", promotion, hrUID, hrName, comment);
                // Notify employee about rejection
                await sendPromotionNotification(
                    "employee",
                    {
                        uid: promotion.employeeUID,
                        email: employeeData?.email || "",
                        telegramChatID: employeeData?.telegramChatID || "",
                        recipientType: "employee",
                    },
                    promotion,
                    "PROMOTION_REJECTED",
                    {
                        promotionID: promotion.promotionID,
                        promotionName: promotion.promotionName,
                        employeeName: promotion.employeeName,
                        reason: comment,
                    },
                );
            }

            return success;
        } catch (e) {
            console.error("Error rejecting promotion:", e);
            return false;
        }
    },

    /**
     * Finalize a promotion and update employee data
     * Workflow: approved -> completed
     * This updates the promotion status and applies changes to the employee's record
     */
    async finalizePromotion(
        id: string,
        hrUID: string,
        hrName: string,
        employeeContactData?: { email?: string; telegramChatID?: string },
    ): Promise<boolean> {
        try {
            const promotion = await this.get(id);
            if (!promotion) return false;

            // First, update the employee's data with the promotion changes
            const employeeUpdateData = {
                // Store previous values for audit trail
                previousPosition: promotion.currentPosition,
                previousGrade: promotion.currentGrade,
                previousStep: promotion.currentStep,
                previousSalary: promotion.currentSalary,
                previousEntitlementDays: promotion.currentEntitlementDays,
                lastPromotionDate: dayjs().format(timestampFormat),
            };

            const employee = await getEmployeeByUid(promotion.employeeUID);
            if (employee) {
                await updateEmployee({
                    id: employee.id,
                    employmentPosition: promotion.newPositionID,
                    gradeLevel: promotion.newGradeID,
                    step: promotion.newStep ?? undefined,
                    salary: promotion.newSalary,
                    eligibleLeaveDays: promotion.newEntitlementDays,
                });

                // Create compensation entries for allowances if any exist
                const allowances = promotion.associatedPayments || [];
                if (allowances.length > 0) {
                    console.log(
                        `[PROMOTION FINALIZATION] Creating ${allowances.length} compensation entries for employee ${promotion.employeeUID}`,
                    );

                    for (const allowance of allowances) {
                        // Convert monthly amounts object to array (January to December)
                        const months = [
                            "January",
                            "February",
                            "March",
                            "April",
                            "May",
                            "June",
                            "July",
                            "August",
                            "September",
                            "October",
                            "November",
                            "December",
                        ];

                        const paymentAmounts: number[] = months.map(
                            month => allowance.monthlyAmounts?.[month] || 0,
                        );

                        // Create compensation entry for this allowance
                        const compensationData: Omit<EmployeeCompensationModel, "id"> = {
                            timestamp: dayjs().format(timestampFormat),
                            employees: [promotion.employeeUID],
                            type: "Payment" as const,
                            paymentType: allowance.paymentTypeName,
                            paymentAmount: paymentAmounts,
                            deduction: null,
                            deductionType: null,
                            deductionAmount: null,
                        };

                        const compensationCreated = await createCompensation(
                            compensationData,
                            hrUID,
                            {
                                title: "Allowance Created from Promotion",
                                description: `Created ${allowance.paymentTypeLabel || allowance.paymentTypeName} allowance ($${allowance.paymentAmount}/month) for ${promotion.employeeName} from promotion "${promotion.promotionName}"`,
                                module: "Compensation & Benefits",
                            },
                        );

                        if (compensationCreated) {
                            console.log(
                                `[PROMOTION FINALIZATION] Successfully created compensation: ${allowance.paymentTypeLabel || allowance.paymentTypeName}`,
                            );
                        } else {
                            console.error(
                                `[PROMOTION FINALIZATION] Failed to create compensation: ${allowance.paymentTypeLabel || allowance.paymentTypeName}`,
                            );
                        }
                    }
                }

                // Prepare promotion update data
                const updateData: Partial<PromotionInstanceModel> = {
                    status: "completed",
                    statusChangedAt: dayjs().format(timestampFormat),
                    statusChangedBy: hrUID,
                    finalizedAt: dayjs().format(timestampFormat),
                    employeeDataUpdated: true,
                };

                const success = await this.update(id, updateData);

                if (success) {
                    const allowanceCount = allowances.length;
                    const allowanceText =
                        allowanceCount > 0 ? ` and ${allowanceCount} allowance(s)` : "";
                    await logActivity(
                        "FINALIZED",
                        promotion,
                        hrUID,
                        hrName,
                        `Employee data updated: New position: ${promotion.newPosition}, Salary: ${promotion.newSalary}${allowanceText}`,
                    );
                    // Notify employee about finalization
                    await sendPromotionNotification(
                        "employee",
                        {
                            uid: promotion.employeeUID,
                            email: employeeContactData?.email || "",
                            telegramChatID: employeeContactData?.telegramChatID || "",
                            recipientType: "employee",
                        },
                        promotion,
                        "PROMOTION_FINALIZED",
                        {
                            promotionID: promotion.promotionID,
                            promotionName: promotion.promotionName,
                            employeeName: promotion.employeeName,
                            newPosition: promotion.newPosition,
                            newGrade: promotion.newGrade,
                            newSalary: promotion.newSalary,
                        },
                    );
                }

                return success;
            } else {
                console.error(`Employee not found with UID: ${promotion.employeeUID}`);
                return false;
            }
        } catch (e) {
            console.error("Error finalizing promotion:", e);
            return false;
        }
    },

    /**
     * Delete a promotion instance
     */
    async delete(id: string, deletedByUID?: string, deletedByName?: string): Promise<boolean> {
        try {
            // Get promotion data before deletion for logging
            const promotion = deletedByUID ? await this.get(id) : null;

            const docRef = doc(db, COLLECTION_NAME, id);
            await deleteDoc(docRef);

            // Log the deletion activity
            if (deletedByUID && promotion) {
                await logActivity(
                    "DELETED",
                    promotion,
                    deletedByUID,
                    deletedByName || deletedByUID,
                );
            }

            return true;
        } catch (e) {
            console.log("error", e);
            return false;
        }
    },

    /**
     * Batch create promotion instances
     */
    async batchCreate(
        dataArray: Array<Omit<PromotionInstanceModel, "id">>,
        employeeContactMap?: Map<string, { email?: string; telegramChatID?: string }>,
    ): Promise<{ success: boolean; ids?: string[]; error?: string }> {
        if (!dataArray.length) {
            return { success: false, error: "No data provided" };
        }

        const batch = writeBatch(db);
        const subcollectionRef = collection(db, COLLECTION_NAME);
        const ids: string[] = [];

        try {
            dataArray.forEach(data => {
                const docRef = doc(subcollectionRef);
                ids.push(docRef.id);

                batch.set(docRef, {
                    ...data,
                    createdAt: dayjs().format(timestampFormat),
                    updatedAt: dayjs().format(timestampFormat),
                });
            });

            await batch.commit();

            // Send notifications for each created promotion
            for (let i = 0; i < dataArray.length; i++) {
                const data = dataArray[i];
                if (data.employeeUID) {
                    const contactInfo = employeeContactMap?.get(data.employeeUID);
                    const promotionWithId = { ...data, id: ids[i] } as PromotionInstanceModel & {
                        id: string;
                    };
                    await sendPromotionNotification(
                        "employee",
                        {
                            uid: data.employeeUID,
                            email: contactInfo?.email || "",
                            telegramChatID: contactInfo?.telegramChatID || "",
                            recipientType: "employee",
                        },
                        promotionWithId,
                        "PROMOTION_OFFER",
                        {
                            promotionID: data.promotionID,
                            promotionName: data.promotionName,
                            newPosition: data.newPosition,
                            newGrade: data.newGrade,
                            newSalary: data.newSalary,
                        },
                    );
                }
            }

            return { success: true, ids };
        } catch (error: any) {
            console.error("Batch create failed:", error);
            return {
                success: false,
                error: error.message || "Batch write failed",
            };
        }
    },

    /**
     * Batch delete promotion instances
     */
    async batchDelete(ids: string[]): Promise<{ success: boolean; error?: string }> {
        if (!ids.length) {
            return { success: false, error: "No IDs provided" };
        }

        const batch = writeBatch(db);

        try {
            ids.forEach(id => {
                const docRef = doc(db, COLLECTION_NAME, id);
                batch.delete(docRef);
            });

            await batch.commit();
            return { success: true };
        } catch (error: any) {
            console.error("Batch delete failed:", error);
            return {
                success: false,
                error: error.message || "Batch delete failed",
            };
        }
    },

    /**
     * Generate a unique promotion ID
     */
    generatePromotionID(): string {
        const timestamp = Date.now().toString().slice(-6);
        return `PROMO-${timestamp}`;
    },
};
