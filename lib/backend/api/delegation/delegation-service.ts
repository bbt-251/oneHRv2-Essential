import { DelegationModel } from "@/lib/models/delegation";
import {
    deleteDoc,
    doc,
    getDoc,
    setDoc,
    updateDoc,
    collection,
    query,
    where,
    getDocs,
} from "firebase/firestore";
import { delegationCollection, employeeCollection } from "../../firebase/collections";
import { db } from "../../firebase/init";
import { EmployeeModel } from "@/lib/models/employee";
import { createLog } from "../logCollection";
import { DELEGATION_LOG_MESSAGES } from "@/lib/log-descriptions/manager-activities";
import { getTimestamp } from "@/lib/util/dayjs_format";
import { sendNotification } from "@/lib/util/notification/send-notification";
import { NotificationUser } from "@/lib/notifications/types";
import getFullName from "@/lib/util/getEmployeeFullName";

const collectionRef = delegationCollection;

// Helper function to get employee data for notifications
async function getEmployeeForNotification(uid: string): Promise<NotificationUser | null> {
    try {
        const docRef = doc(db, "employee", uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            const emp = docSnap.data() as EmployeeModel;
            return {
                uid: emp.uid,
                email: emp.personalEmail,
                telegramChatID: emp.telegramChatID || "",
            };
        }
        return null;
    } catch (error) {
        console.error("Error getting employee for notification:", error);
        return null;
    }
}

// Helper function to get all HR Managers for notifications
async function getHRManagers(): Promise<NotificationUser[]> {
    try {
        const q = query(employeeCollection, where("role", "array-contains", "HR Manager"));
        const snapshot = await getDocs(q);
        const hrManagers: NotificationUser[] = [];
        snapshot.forEach(doc => {
            const emp = doc.data() as EmployeeModel;
            hrManagers.push({
                uid: emp.uid,
                email: emp.personalEmail,
                telegramChatID: emp.telegramChatID || "",
            });
        });
        return hrManagers;
    } catch (error) {
        console.error("Error getting HR managers:", error);
        return [];
    }
}

export async function createDelegation(
    data: Omit<DelegationModel, "id">,
    actionBy?: string,
): Promise<{ success: boolean; error?: string; id?: string }> {
    try {
        const docRef = doc(collectionRef);
        const newDelegation = {
            ...data,
            id: docRef.id,
            // Initialize null fields
            acknowledgedBy: null,
            acknowledgedAt: null,
            approvedBy: null,
            approvedAt: null,
        };

        await setDoc(docRef, newDelegation);

        // Log delegation creation
        if (actionBy) {
            await createLog(
                DELEGATION_LOG_MESSAGES.CREATED({
                    delegationType: "Delegation",
                    fromEmployee: data.delegator || "Unknown",
                    toEmployee: data.delegatee || "Unknown",
                    createdBy: actionBy,
                }),
                actionBy,
                "Success",
            );
        }

        // Send notifications
        try {
            // Get delegator and delegatee info
            const delegator = await getEmployeeForNotification(data.delegator);
            const delegatee = await getEmployeeForNotification(data.delegatee);
            const hrManagers = await getHRManagers();

            if (delegatee) {
                // Notify delegatee
                await sendNotification({
                    users: [delegatee],
                    channels: ["inapp", "email", "telegram"],
                    messageKey: "DELEGATION_CREATED",
                    payload: {
                        delegationID: data.delegationID,
                        delegatorName: delegator ? getFullName(delegator as any) : data.delegator,
                        delegateeName: getFullName(delegatee as any),
                        periodStart: data.periodStart,
                        periodEnd: data.periodEnd,
                    },
                    title: "New Delegation Request",
                });
            }

            // Notify HR Managers
            if (hrManagers.length > 0) {
                await sendNotification({
                    users: hrManagers,
                    channels: ["inapp"],
                    messageKey: "DELEGATION_CREATED",
                    payload: {
                        delegationID: data.delegationID,
                        delegatorName: delegator ? getFullName(delegator as any) : data.delegator,
                        delegateeName: delegatee ? getFullName(delegatee as any) : data.delegatee,
                        periodStart: data.periodStart,
                        periodEnd: data.periodEnd,
                    },
                    title: "New Delegation Created",
                });
            }
        } catch (notifError) {
            console.error("Error sending notifications:", notifError);
            // Don't fail the creation if notifications fail
        }

        return { success: true, id: docRef.id };
    } catch (error) {
        console.log("Error", error);

        // Log creation failure
        if (actionBy) {
            await createLog(
                DELEGATION_LOG_MESSAGES.CREATED({
                    delegationType: "Delegation",
                    fromEmployee: data.delegator || "Unknown",
                    toEmployee: data.delegatee || "Unknown",
                    createdBy: actionBy,
                }),
                actionBy,
                "Failure",
            );
        }

        return { success: false, error: "Failed to create delegation" };
    }
}

// Acknowledge delegation - called by delegatee
export async function acknowledgeDelegation(
    delegationId: string,
    acknowledgedByUid: string,
): Promise<{ success: boolean; error?: string }> {
    try {
        const timestamp = getTimestamp();

        await updateDoc(doc(db, "delegation", delegationId), {
            delegationStatus: "Acknowledged",
            acknowledgedBy: acknowledgedByUid,
            acknowledgedAt: timestamp,
        });

        // Log acknowledgment
        const delegation = await getDelegationById(delegationId);
        if (delegation) {
            await createLog(
                {
                    title: "Delegation Acknowledged",
                    description: `Delegation '${delegation.delegationID}' acknowledged by delegatee`,
                    module: "Delegation Management",
                },
                acknowledgedByUid,
                "Success",
            );
        }

        // Send notifications
        try {
            const delegator = await getEmployeeForNotification(delegation?.delegator || "");
            const delegatee = await getEmployeeForNotification(acknowledgedByUid);
            const hrManagers = await getHRManagers();

            // Notify HR Managers
            if (hrManagers.length > 0) {
                await sendNotification({
                    users: hrManagers,
                    channels: ["inapp", "email"],
                    messageKey: "DELEGATION_ACKNOWLEDGED",
                    payload: {
                        delegationID: delegation?.delegationID || delegationId,
                        delegatorName: delegator
                            ? getFullName(delegator as any)
                            : delegation?.delegator || "Unknown",
                        delegateeName: delegatee ? getFullName(delegatee as any) : "Unknown",
                    },
                    title: "Delegation Acknowledged",
                });
            }

            // Notify delegator
            if (delegator) {
                await sendNotification({
                    users: [delegator],
                    channels: ["inapp"],
                    messageKey: "DELEGATION_ACKNOWLEDGED",
                    payload: {
                        delegationID: delegation?.delegationID || delegationId,
                        delegatorName: getFullName(delegator as any),
                        delegateeName: delegatee ? getFullName(delegatee as any) : "Unknown",
                    },
                    title: "Delegation Acknowledged",
                });
            }
        } catch (notifError) {
            console.error("Error sending notifications:", notifError);
        }

        return { success: true };
    } catch (error) {
        console.log("Error acknowledging delegation:", error);
        return { success: false, error: "Failed to acknowledge delegation" };
    }
}

// HR Approval - called by HR Manager
export async function approveDelegation(
    delegationId: string,
    approvedByUid: string,
): Promise<{ success: boolean; error?: string }> {
    try {
        const timestamp = getTimestamp();

        await updateDoc(doc(db, "delegation", delegationId), {
            delegationStatus: "Approved",
            approvedBy: approvedByUid,
            approvedAt: timestamp,
        });

        // Log approval
        const delegation = await getDelegationById(delegationId);
        if (delegation) {
            await createLog(
                DELEGATION_LOG_MESSAGES.APPROVED({
                    id: delegationId,
                    delegationId: delegation.delegationID,
                    fromEmployee: delegation.delegator,
                    toEmployee: delegation.delegatee,
                    approvedBy: approvedByUid,
                }),
                approvedByUid,
                "Success",
            );
        }

        // Send notifications
        try {
            const delegator = await getEmployeeForNotification(delegation?.delegator || "");
            const delegatee = await getEmployeeForNotification(delegation?.delegatee || "");

            // Notify delegatee
            if (delegatee) {
                await sendNotification({
                    users: [delegatee],
                    channels: ["inapp", "email"],
                    messageKey: "DELEGATION_APPROVED",
                    payload: {
                        delegationID: delegation?.delegationID || delegationId,
                        delegatorName: delegator
                            ? getFullName(delegator as any)
                            : delegation?.delegator || "Unknown",
                        delegateeName: getFullName(delegatee as any),
                        periodStart: delegation?.periodStart || "",
                        periodEnd: delegation?.periodEnd || "",
                    },
                    title: "Delegation Approved",
                });
            }

            // Notify delegator
            if (delegator) {
                await sendNotification({
                    users: [delegator],
                    channels: ["inapp"],
                    messageKey: "DELEGATION_APPROVED",
                    payload: {
                        delegationID: delegation?.delegationID || delegationId,
                        delegatorName: getFullName(delegator as any),
                        delegateeName: delegatee ? getFullName(delegatee as any) : "Unknown",
                        periodStart: delegation?.periodStart || "",
                        periodEnd: delegation?.periodEnd || "",
                    },
                    title: "Delegation Approved",
                });
            }
        } catch (notifError) {
            console.error("Error sending notifications:", notifError);
        }

        return { success: true };
    } catch (error) {
        console.log("Error approving delegation:", error);

        // Log approval failure
        const delegation = await getDelegationById(delegationId);
        if (delegation) {
            await createLog(
                DELEGATION_LOG_MESSAGES.APPROVED({
                    id: delegationId,
                    delegationId: delegation.delegationID,
                    fromEmployee: delegation.delegator,
                    toEmployee: delegation.delegatee,
                    approvedBy: approvedByUid,
                }),
                approvedByUid,
                "Failure",
            );
        }

        return { success: false, error: "Failed to approve delegation" };
    }
}

// Refuse/Reject delegation - can be done by delegatee or HR
export async function rejectDelegation(
    delegationId: string,
    rejectedByUid: string,
    rejectedByRole: "delegatee" | "hr",
): Promise<{ success: boolean; error?: string }> {
    try {
        await updateDoc(doc(db, "delegation", delegationId), {
            delegationStatus: "Refused",
        });

        // Log rejection
        const delegation = await getDelegationById(delegationId);
        if (delegation) {
            await createLog(
                DELEGATION_LOG_MESSAGES.REJECTED({
                    id: delegationId,
                    delegationId: delegation.delegationID,
                    fromEmployee: delegation.delegator,
                    toEmployee: delegation.delegatee,
                    rejectedBy: rejectedByUid,
                }),
                rejectedByUid,
                "Success",
            );
        }

        // Send notifications
        try {
            const delegator = await getEmployeeForNotification(delegation?.delegator || "");
            const delegatee = await getEmployeeForNotification(delegation?.delegatee || "");
            const hrManagers = await getHRManagers();

            // Notify HR Managers
            if (hrManagers.length > 0) {
                await sendNotification({
                    users: hrManagers,
                    channels: ["inapp"],
                    messageKey: "DELEGATION_REFUSED",
                    payload: {
                        delegationID: delegation?.delegationID || delegationId,
                        delegatorName: delegator
                            ? getFullName(delegator as any)
                            : delegation?.delegator || "Unknown",
                        delegateeName: delegatee ? getFullName(delegatee as any) : "Unknown",
                    },
                    title: "Delegation Refused",
                });
            }

            // Notify delegator
            if (delegator) {
                await sendNotification({
                    users: [delegator],
                    channels: ["inapp", "email"],
                    messageKey: "DELEGATION_REFUSED",
                    payload: {
                        delegationID: delegation?.delegationID || delegationId,
                        delegatorName: getFullName(delegator as any),
                        delegateeName: delegatee ? getFullName(delegatee as any) : "Unknown",
                    },
                    title: "Delegation Refused",
                });
            }
        } catch (notifError) {
            console.error("Error sending notifications:", notifError);
        }

        return { success: true };
    } catch (error) {
        console.log("Error rejecting delegation:", error);

        // Log rejection failure
        const delegation = await getDelegationById(delegationId);
        if (delegation) {
            await createLog(
                DELEGATION_LOG_MESSAGES.REJECTED({
                    id: delegationId,
                    delegationId: delegation.delegationID,
                    fromEmployee: delegation.delegator,
                    toEmployee: delegation.delegatee,
                    rejectedBy: rejectedByUid,
                }),
                rejectedByUid,
                "Failure",
            );
        }

        return { success: false, error: "Failed to reject delegation" };
    }
}

// HR can create and auto-approve
export async function createAndApproveDelegation(
    data: Omit<
        DelegationModel,
        | "id"
        | "delegationStatus"
        | "acknowledgedBy"
        | "acknowledgedAt"
        | "approvedBy"
        | "approvedAt"
    >,
    hrManagerUid: string,
): Promise<{ success: boolean; error?: string; id?: string }> {
    try {
        const timestamp = getTimestamp();
        const docRef = doc(collectionRef);

        const newDelegation: DelegationModel = {
            ...data,
            id: docRef.id,
            delegationStatus: "Approved",
            acknowledgedBy: hrManagerUid, // Auto-acknowledged by HR
            acknowledgedAt: timestamp,
            approvedBy: hrManagerUid,
            approvedAt: timestamp,
        };

        await setDoc(docRef, newDelegation);

        // Log creation and approval
        await createLog(
            {
                title: "Delegation Created and Approved by HR",
                description: `Delegation '${data.delegationID}' created and auto-approved by HR Manager`,
                module: "Delegation Management",
            },
            hrManagerUid,
            "Success",
        );

        return { success: true, id: docRef.id };
    } catch (error) {
        console.log("Error creating and approving delegation:", error);
        return { success: false, error: "Failed to create and approve delegation" };
    }
}

export async function getDelegationById(id: string): Promise<DelegationModel | null> {
    try {
        const docRef = doc(db, "delegation", id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() } as DelegationModel;
        }
        return null;
    } catch (error) {
        console.error("Error getting delegation:", error);
        return null;
    }
}

export async function updateDelegation(
    data: Partial<DelegationModel> & { id: string },
    updatedBy?: string,
): Promise<boolean> {
    const docRef = doc(db, "delegation", data.id);
    try {
        // Don't allow updating critical fields directly
        const { acknowledgedBy, acknowledgedAt, approvedBy, approvedAt, ...updateData } = data;
        await updateDoc(docRef, updateData as any);

        // Log update
        if (updatedBy) {
            await createLog(
                DELEGATION_LOG_MESSAGES.ASSIGNMENT_UPDATED({
                    id: data.id,
                    updatedBy,
                }),
                updatedBy,
                "Success",
            );
        }

        return true;
    } catch (err) {
        console.error(err);

        // Log update failure
        if (updatedBy) {
            await createLog(
                DELEGATION_LOG_MESSAGES.ASSIGNMENT_UPDATED({
                    id: data.id,
                    updatedBy,
                }),
                updatedBy,
                "Failure",
            );
        }

        return false;
    }
}

export async function deleteDelegation(id: string, deletedBy?: string): Promise<boolean> {
    const docRef = doc(db, "delegation", id);
    try {
        await deleteDoc(docRef);

        // Log deletion
        if (deletedBy) {
            const delegation = await getDelegationById(id);
            if (delegation) {
                await createLog(
                    {
                        title: "Delegation Deleted",
                        description: `Delegation '${delegation.delegationID}' from ${delegation.delegator} to ${delegation.delegatee} deleted by ${deletedBy}`,
                        module: "Delegation Management",
                    },
                    deletedBy,
                    "Success",
                );
            }
        }

        return true;
    } catch (err) {
        console.error(err);

        // Log deletion failure
        if (deletedBy) {
            const delegation = await getDelegationById(id);
            if (delegation) {
                await createLog(
                    {
                        title: "Delegation Deletion Failed",
                        description: `Failed to delete delegation '${delegation.delegationID}' from ${delegation.delegator} to ${delegation.delegatee}`,
                        module: "Delegation Management",
                    },
                    deletedBy,
                    "Failure",
                );
            }
        }

        return false;
    }
}
