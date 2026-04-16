"use client";

import { useTheme } from "@/components/theme-provider";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/context/toastContext";
import { evaluationCampaignService } from "@/lib/backend/api/performance-management/evaluation-campaign-service";
import { performanceEvaluationService } from "@/lib/backend/api/performance-management/performance-evaluation-service";
import { EvaluationCampaignModel } from "@/lib/models/performance";
import { useState } from "react";
import CampaignsForm from "../blocks/evaluation-campaign-form";
import { PERFORMANCE_MANAGEMENT_LOG_MESSAGES } from "@/lib/log-descriptions/performance-management";
import { useAuth } from "@/context/authContext";

interface CampaignModalProps {
    isOpen: boolean;
    onClose: () => void;
    campaign?: EvaluationCampaignModel | null;
}

export default function CampaignModal({ isOpen, onClose, campaign = null }: CampaignModalProps) {
    const { theme }: { theme: string } = useTheme();
    const { showToast } = useToast();
    const { userData } = useAuth();
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const handleSubmit = async (data: Omit<EvaluationCampaignModel, "id">) => {
        setIsLoading(true);

        try {
            if (campaign) {
                // Update existing campaign
                await evaluationCampaignService.update(
                    campaign.id as string,
                    data,
                    userData?.uid,
                    PERFORMANCE_MANAGEMENT_LOG_MESSAGES.EVALUATION_CAMPAIGN_UPDATED({
                        id: campaign.id as string,
                        title: data.campaignName,
                        status: data.promotionTriggered ? "triggered" : "active",
                        period: data.periodID,
                        round: data.roundID,
                    }),
                );

                // Manage performance evaluation documents for employee changes
                const oldEmployeeUids = campaign.associatedEmployees;
                const newEmployeeUids = data.associatedEmployees;
                const employeesChanged =
                    JSON.stringify(oldEmployeeUids.sort()) !==
                    JSON.stringify(newEmployeeUids.sort());
                const datesChanged =
                    campaign.startDate !== data.startDate || campaign.endDate !== data.endDate;

                let message = "Evaluation campaign updated successfully";
                let updatedCount = 0;

                if (employeesChanged) {
                    const changes =
                        await performanceEvaluationService.manageCampaignEmployeeChanges(
                            campaign.id as string,
                            oldEmployeeUids,
                            newEmployeeUids,
                            data.startDate,
                            data.endDate,
                            data.periodID,
                            data.roundID,
                            userData?.uid as string,
                        );

                    if (changes.created > 0 || changes.deleted > 0) {
                        message += ` (${changes.created} evaluations created, ${changes.deleted} evaluations removed)`;
                    }
                }

                // Update stages if campaign dates changed
                if (datesChanged) {
                    updatedCount =
                        await performanceEvaluationService.updateCampaignEvaluationStages(
                            campaign.id as string,
                            data.startDate,
                            data.endDate,
                            userData?.uid as string,
                        );

                    if (updatedCount > 0 && !employeesChanged) {
                        message += ` (${updatedCount} evaluation stages updated)`;
                    } else if (updatedCount > 0 && employeesChanged) {
                        message += ` and ${updatedCount} stages updated`;
                    }
                }

                showToast(message, "Success", "success", 4000, "normal");
            } else {
                // Create new campaign
                const campaignID = await evaluationCampaignService.create(
                    data,
                    userData?.uid,
                    PERFORMANCE_MANAGEMENT_LOG_MESSAGES.EVALUATION_CAMPAIGN_CREATED({
                        title: data.campaignName,
                        status: data.promotionTriggered ? "triggered" : "active",
                        period: data.periodID,
                        round: data.roundID,
                    }),
                );

                // Create performance evaluation documents for all associated employees
                if (data.associatedEmployees.length > 0) {
                    await performanceEvaluationService.createForCampaign(
                        campaignID,
                        data.associatedEmployees,
                        data.startDate,
                        data.endDate,
                        data.periodID,
                        data.roundID,
                        userData?.uid as string,
                    );

                    showToast(
                        `Evaluation campaign created successfully with ${data.associatedEmployees.length} performance evaluations`,
                        "Success",
                        "success",
                        4000,
                        "normal",
                    );
                }
                showToast(
                    "Evaluation campaign created successfully",
                    "Success",
                    "success",
                    4000,
                    "normal",
                );
            }

            onClose();
        } catch (error) {
            console.error("Error saving evaluation campaign:", error);
            showToast(
                `Failed to ${campaign ? "update" : "create"} evaluation campaign. Please try again.`,
                "Error",
                "error",
                5000,
                "high",
            );
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent
                className={`max-w-4xl max-h-[90vh] overflow-y-auto ${
                    theme === "dark" ? "bg-black border-gray-700" : "bg-white"
                }`}
            >
                <DialogHeader>
                    <DialogTitle className={theme === "dark" ? "text-white" : "text-gray-900"}>
                        {campaign ? "Edit Evaluation Campaign" : "Add Evaluation Campaign"}
                    </DialogTitle>
                </DialogHeader>

                <CampaignsForm
                    initialData={campaign || undefined}
                    onSubmit={handleSubmit}
                    onCancel={onClose}
                    isLoading={isLoading}
                />
            </DialogContent>
        </Dialog>
    );
}
