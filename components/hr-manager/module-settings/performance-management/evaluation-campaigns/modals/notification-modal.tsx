"use client";

import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/context/toastContext";
import { useFirestore } from "@/context/firestore-context";
import { EvaluationCampaignModel, PeriodicOptionModel } from "@/lib/models/performance";
import { sendNotification } from "@/lib/util/notification/send-notification";
import { dateFormat } from "@/lib/util/dayjs_format";
import dayjs from "dayjs";
import { useState } from "react";

interface NotificationModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type NotificationType = "evaluation_campaign" | "objective_self_assessment";

export default function NotificationModal({ isOpen, onClose }: NotificationModalProps) {
    const { theme } = useTheme();
    const { showToast } = useToast();
    const { hrSettings, employees } = useFirestore();
    const [notificationType, setNotificationType] =
        useState<NotificationType>("evaluation_campaign");
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const campaigns = hrSettings.evaluationCampaigns;
    const periods = hrSettings.periodicOptions;
    const today = dayjs();

    // Sort campaigns by round start date (from round's "to" field)
    const sortedCampaigns = campaigns
        .map(campaign => {
            const period = periods.find(p => p.id === campaign.periodID);
            const round = period?.evaluations.find(e => e.id === campaign.roundID);
            const startDate = round ? dayjs(round.to, dateFormat) : null;
            return { campaign, startDate };
        })
        .filter(item => item.startDate)
        .sort((a, b) => a.startDate!.valueOf() - b.startDate!.valueOf());

    // Find the current active campaign
    const findCurrentCampaign = (): EvaluationCampaignModel | null => {
        // Find campaign where today is between start and end date
        for (const { campaign } of sortedCampaigns) {
            const startDate = dayjs(campaign.startDate);
            const endDate = dayjs(campaign.endDate);
            if (today.isAfter(startDate) && today.isBefore(endDate)) {
                return campaign;
            }
        }

        return null;
    };

    const currentCampaign = findCurrentCampaign();

    const handleSend = async () => {
        if (!currentCampaign) {
            showToast("No active evaluation campaign found", "Warning", "warning");
            return;
        }

        setIsLoading(true);

        try {
            const campaign = currentCampaign;
            const periods = hrSettings.periodicOptions;
            const round = periods
                .find((p: PeriodicOptionModel) => p.id === campaign.periodID)
                ?.evaluations.find((r: any) => r.id === campaign.roundID);
            if (!round) {
                showToast("Round not found", "Error", "error");
                return;
            }

            const next = sortedCampaigns.findIndex(c => c.campaign.id === campaign.id) + 1;
            const nextCampaign = sortedCampaigns.length > next ? sortedCampaigns[next] : null;
            const nextRound =
                periods
                    .find((p: PeriodicOptionModel) => p.id === nextCampaign?.campaign?.periodID)
                    ?.evaluations?.find((r: any) => r.id === nextCampaign?.campaign?.roundID) ??
                null;
            const filteredEmployees = employees.filter(emp =>
                campaign.associatedEmployees.includes(emp.uid ?? ""),
            );

            let users;
            if (notificationType === "objective_self_assessment") {
                // Only send to employees for self-assessment reminder
                users = filteredEmployees.map(e => ({
                    uid: e.uid,
                    email: e.companyEmail || e.personalEmail || "",
                    telegramChatID: e.telegramChatID || "",
                    recipientType: "employee" as const,
                }));
            } else {
                // Send to both managers and employees for evaluation campaign reminder
                const managers = filteredEmployees.filter(emp => emp.role.includes("Manager"));
                const allEmployees = filteredEmployees;

                users = [
                    ...managers.map(m => ({
                        uid: m.uid,
                        email: m.companyEmail || m.personalEmail || "",
                        telegramChatID: m.telegramChatID || "",
                        recipientType: "manager" as const,
                    })),
                    ...allEmployees.map(e => ({
                        uid: e.uid,
                        email: e.companyEmail || e.personalEmail || "",
                        telegramChatID: e.telegramChatID || "",
                        recipientType: "employee" as const,
                    })),
                ];
            }

            const messageKey =
                notificationType === "evaluation_campaign"
                    ? "EVALUATION_CAMPAIGN_REMINDER"
                    : "OBJECTIVE_SELF_ASSESSMENT_REMINDER";

            await sendNotification({
                users,
                channels: ["inapp", "telegram"],
                messageKey,
                payload: {
                    roundName: round.round,
                    endDate: round.to,
                },
                title:
                    notificationType === "evaluation_campaign"
                        ? "Evaluation Campaign Reminder"
                        : "Objective Self Assessment Reminder",
                getCustomMessage: (recipientType, payload) => {
                    const { roundName, endDate } = payload;

                    if (notificationType === "objective_self_assessment") {
                        // Only sent to employees
                        return {
                            inapp: `Please finalize your objective and competence self-assessment for the round "${roundName}"`,
                            telegram: `Please finalize your objective and competence self-assessment for the round "${roundName}"`,
                        };
                    } else {
                        // Evaluation campaign reminder - sent to both managers and employees
                        const nextRoundText = nextRound
                            ? ` and setting new objective for the next round "${nextRound.round}"`
                            : "";
                        if (recipientType === "manager") {
                            return {
                                inapp: `The evaluation campaign for the round "${roundName}" has started and lasts until ${endDate}. Please start reviewing your reports objective performance${nextRoundText}`,
                                telegram: `The evaluation campaign for the round "${roundName}" has started and lasts until ${endDate}. Please start reviewing your reports objective performance${nextRoundText}`,
                            };
                        } else {
                            return {
                                inapp: `The evaluation campaign for the round "${roundName}" has started and lasts until ${endDate}. Please finalize your self-assessments for the round${nextRoundText}`,
                                telegram: `The evaluation campaign for the round "${roundName}" has started and lasts until ${endDate}. Please finalize your self-assessments for the round${nextRoundText}`,
                            };
                        }
                    }
                },
            });

            showToast("Notifications sent successfully", "Success", "success");
            onClose();
        } catch (error) {
            console.error("Error sending notifications:", error);
            showToast("Failed to send notifications", "Error", "error");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent
                className={`max-w-md ${theme === "dark" ? "bg-black border-gray-700" : "bg-white"}`}
            >
                <DialogHeader>
                    <DialogTitle className={theme === "dark" ? "text-white" : "text-gray-900"}>
                        Send Push Notification
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    {currentCampaign ? (
                        <div>
                            <Label className={theme === "dark" ? "text-white" : "text-gray-900"}>
                                Current Active Campaign
                            </Label>
                            <p
                                className={`mt-1 text-sm ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}
                            >
                                {currentCampaign.campaignName}
                            </p>
                        </div>
                    ) : (
                        <div>
                            <Label className={theme === "dark" ? "text-white" : "text-gray-900"}>
                                No Active Campaign
                            </Label>
                            <p
                                className={`mt-1 text-sm ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}
                            >
                                No evaluation campaign is currently active.
                            </p>
                        </div>
                    )}

                    <div>
                        <Label className={theme === "dark" ? "text-white" : "text-gray-900"}>
                            Notification Type
                        </Label>
                        <RadioGroup
                            value={notificationType}
                            onValueChange={value => setNotificationType(value as NotificationType)}
                        >
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem
                                    value="evaluation_campaign"
                                    id="evaluation_campaign"
                                />
                                <Label
                                    htmlFor="evaluation_campaign"
                                    className={theme === "dark" ? "text-white" : "text-gray-900"}
                                >
                                    Evaluation Campaign Reminder
                                </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem
                                    value="objective_self_assessment"
                                    id="objective_self_assessment"
                                />
                                <Label
                                    htmlFor="objective_self_assessment"
                                    className={theme === "dark" ? "text-white" : "text-gray-900"}
                                >
                                    Objective Self-Assessment Reminder
                                </Label>
                            </div>
                        </RadioGroup>
                    </div>

                    <div className="flex justify-end space-x-2">
                        <Button variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button onClick={handleSend} disabled={isLoading || !currentCampaign}>
                            {isLoading ? "Sending..." : "Send"}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
