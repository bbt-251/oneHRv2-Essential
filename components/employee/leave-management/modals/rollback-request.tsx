import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { LeaveRepository } from "@/lib/repository/leave";

import { useToast } from "@/context/toastContext";
import { useAuth } from "@/context/authContext";
import { sendNotification } from "@/lib/util/notification/send-notification";
import { useData } from "@/context/app-data-context";
import { EMPLOYEE_MANAGEMENT_LOG_MESSAGES } from "@/lib/log-descriptions/employee-management";
import { LeaveModel } from "@/lib/models/leave";

interface RollbackRequestModalProps {
    selectedLeave: LeaveModel;
    isRollbackModalOpen: boolean;
    setIsRollbackModalOpen: (open: boolean) => void;
    onSuccess?: () => void;
}

export default function RollbackRequestModal({
    selectedLeave,
    isRollbackModalOpen,
    setIsRollbackModalOpen,
    onSuccess,
}: RollbackRequestModalProps) {
    const { showToast } = useToast();
    const { userData } = useAuth();
    const { employees, leaveTypes } = useData();
    const manager = employees.find(emp => emp.uid === userData?.reportingLineManager);

    const [reason, setReason] = useState<string>("");
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!reason.trim()) {
            showToast("Error", "Please provide a reason for the rollback request", "error");
            return;
        }

        setIsLoading(true);
        try {
            const response = await LeaveRepository.updateLeaveRequest({
                id: selectedLeave.id,
                rollbackStatus: "Requested",
                reason: reason.trim(),
                comments: [
                    ...(selectedLeave.comments || []),
                    {
                        comment: `Rollback requested: ${reason.trim()}`,
                        date: new Date().toISOString(),
                        by: userData?.id,
                    },
                ],
            });
            void EMPLOYEE_MANAGEMENT_LOG_MESSAGES.LEAVE_ROLLBACK_REQUESTED(
                leaveTypes.find(lt => lt.id == selectedLeave.leaveType)?.name || "Leave",
                userData?.firstName + " " + userData?.surname || "Employee",
            );

            if (response.success) {
                showToast("Rollback Requested", response.message, "success");
                setIsRollbackModalOpen(false);
                setReason("");
                onSuccess?.();

                await sendNotification({
                    users: [
                        {
                            uid: manager?.uid || "",
                            email: manager?.personalEmail || "",
                            telegramChatID: manager?.telegramChatID || "",
                        },
                    ],
                    channels: ["inapp", "telegram"],
                    messageKey: "LEAVE_ROLLBACK_INITIATED",
                    payload: {
                        employeeName: userData?.firstName + " " + userData?.surname || "Employee",
                        leaveType: selectedLeave.leaveType || "N/A",
                        startDate: selectedLeave.firstDayOfLeave,
                        endDate: selectedLeave.lastDayOfLeave,
                    },
                    title: "Leave Rollback Initiated",
                });
            } else {
                throw new Error(response.message);
            }
        } catch {
            showToast("Error", "Failed to submit rollback request. Please try again.", "error");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isRollbackModalOpen} onOpenChange={setIsRollbackModalOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Request Leave Rollback</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <label htmlFor="reason" className="block text-sm font-medium text-gray-700">
                            Reason for Rollback Request
                        </label>
                        <Textarea
                            id="reason"
                            value={reason}
                            onChange={e => setReason(e.target.value)}
                            placeholder="Please provide a reason for requesting this rollback..."
                            className="min-h-[100px]"
                            required
                        />
                    </div>

                    <DialogFooter className="mt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsRollbackModalOpen(false)}
                            disabled={isLoading}
                        >
                            Cancel
                        </Button>
                        <Button
                            className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white"
                            type="submit"
                            disabled={isLoading}
                        >
                            {isLoading ? "Submitting..." : "Submit Request"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
