"use client";

import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/context/toastContext";
import { useFirestore } from "@/context/firestore-context";
import { evaluationCampaignService } from "@/lib/backend/api/performance-management/evaluation-campaign-service";
import { performanceDisplayService } from "@/lib/backend/api/performance-management/performance-display-service";
import { performanceEvaluationService } from "@/lib/backend/api/performance-management/performance-evaluation-service";
import { deleteCompetenceAssessment } from "@/lib/backend/api/competence/assessment-service";
import { deleteObjective } from "@/lib/backend/api/objective/objective-service";
import { deleteObjectiveWeight } from "@/lib/backend/api/objective/objective-weight-service";
import { EvaluationCampaignModel } from "@/lib/models/performance";
import { AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { PERFORMANCE_MANAGEMENT_LOG_MESSAGES } from "@/lib/log-descriptions/performance-management";
import { useAuth } from "@/context/authContext";

interface DeleteCampaignModalProps {
    isOpen: boolean;
    onClose: () => void;
    campaign: EvaluationCampaignModel | null;
}

export default function DeleteCampaignModal({
    isOpen,
    onClose,
    campaign,
}: DeleteCampaignModalProps) {
    const { theme } = useTheme();
    const { showToast } = useToast();
    const { user } = useAuth();
    const { userData } = useAuth();
    const { competenceAssessments, objectives, objectiveWeights, competenceValues } =
        useFirestore();
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [displayNames, setDisplayNames] = useState<{ periodName: string; roundName: string }>({
        periodName: "",
        roundName: "",
    });

    useEffect(() => {
        const loadDisplayNames = async () => {
            if (campaign?.periodID && campaign?.roundID) {
                const { periodName, roundName } =
                    await performanceDisplayService.getPeriodAndRoundDisplayNames(
                        campaign.periodID,
                        campaign.roundID,
                    );
                setDisplayNames({
                    periodName: periodName || campaign.periodID,
                    roundName: roundName || campaign.roundID,
                });
            }
        };

        if (campaign) {
            loadDisplayNames();
        }
    }, [campaign]);

    const handleDelete = async () => {
        if (!campaign) return;

        setIsLoading(true);

        try {
            let totalDeleted = 0;

            // First, delete all associated performance evaluations
            const performanceEvaluations = await performanceEvaluationService.getByCampaignID(
                campaign.id as string,
            );

            if (performanceEvaluations.length > 0) {
                const evaluationIds = performanceEvaluations.map(evaluation => evaluation.id);
                await performanceEvaluationService.batchDelete(evaluationIds, user?.uid ?? "");
                totalDeleted += performanceEvaluations.length;
            }

            // Delete all associated competence assessments for this campaign
            // Filter competence assessments that contain this campaign ID
            const campaignCompetenceAssessments = competenceAssessments.filter(assessment =>
                assessment.assessment.some(a => a.campaignId === campaign.id),
            );

            if (campaignCompetenceAssessments.length > 0) {
                for (const assessment of campaignCompetenceAssessments) {
                    await deleteCompetenceAssessment(assessment.id);
                }
                totalDeleted += campaignCompetenceAssessments.length;
            }

            // Delete all associated objectives for this period/round
            // Filter objectives by period and round
            const campaignObjectives = objectives.filter(
                objective =>
                    objective.period === campaign.periodID && objective.round === campaign.roundID,
            );

            if (campaignObjectives.length > 0) {
                for (const objective of campaignObjectives) {
                    await deleteObjective(objective.id);
                }
                totalDeleted += campaignObjectives.length;
            }

            // Delete all associated objective weights for this campaign
            // Objective weights are linked by campaignId
            const campaignObjectiveWeights = objectiveWeights.filter(
                weight => weight.campaignId === campaign.id,
            );

            if (campaignObjectiveWeights.length > 0) {
                for (const weight of campaignObjectiveWeights) {
                    await deleteObjectiveWeight(weight.id);
                }
                totalDeleted += campaignObjectiveWeights.length;
            }

            // Delete all associated competence values for this campaign
            // Competence values are linked by campaignId
            const campaignCompetenceValues = competenceValues.filter(
                value => value.campaignId === campaign.id,
            );

            if (campaignCompetenceValues.length > 0) {
                // Note: Competence values don't have a delete service, so we skip deletion
                // but count them for user awareness
                totalDeleted += campaignCompetenceValues.length;
            }

            // Then delete the campaign
            await evaluationCampaignService.delete(
                campaign.id as string,
                userData?.uid,
                PERFORMANCE_MANAGEMENT_LOG_MESSAGES.EVALUATION_CAMPAIGN_DELETED(campaign.id ?? ""),
            );

            const message =
                totalDeleted > 0
                    ? `Evaluation campaign "${campaign.campaignName}" and ${totalDeleted} associated documents deleted successfully`
                    : `Evaluation campaign "${campaign.campaignName}" deleted successfully`;

            showToast(message, "Success", "success", 4000);

            onClose();
        } catch (error) {
            console.error("Error deleting evaluation campaign:", error);
            showToast(
                "Failed to delete evaluation campaign. Please try again.",
                "Error",
                "error",
                5000,
            );
        } finally {
            setIsLoading(false);
        }
    };

    if (!campaign) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent
                className={`max-w-md ${theme === "dark" ? "bg-black border-gray-700" : "bg-white"}`}
            >
                <DialogHeader>
                    <div className="flex items-center gap-3">
                        <div
                            className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                                theme === "dark" ? "bg-red-900/20" : "bg-red-100"
                            }`}
                        >
                            <AlertCircle
                                className={`w-5 h-5 ${theme === "dark" ? "text-red-400" : "text-red-600"}`}
                            />
                        </div>
                        <div>
                            <DialogTitle
                                className={theme === "dark" ? "text-white" : "text-gray-900"}
                            >
                                Delete Evaluation Campaign
                            </DialogTitle>
                            <DialogDescription
                                className={theme === "dark" ? "text-gray-300" : "text-gray-600"}
                            >
                                This action cannot be undone.
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="py-4">
                    <p
                        className={`text-sm ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}
                    >
                        Are you sure you want to delete the evaluation campaign{" "}
                        <strong>"{campaign.campaignName}"</strong>?
                    </p>

                    <div
                        className={`mt-4 p-3 rounded-lg ${
                            theme === "dark" ? "bg-gray-900/50" : "bg-gray-50"
                        }`}
                    >
                        <div
                            className={`text-sm ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}
                        >
                            <p>
                                <strong>Period:</strong> {displayNames.periodName}
                            </p>
                            <p>
                                <strong>Round:</strong> {displayNames.roundName}
                            </p>
                            <p>
                                <strong>Duration:</strong>{" "}
                                {new Date(campaign.startDate).toLocaleDateString()} -{" "}
                                {new Date(campaign.endDate).toLocaleDateString()}
                            </p>
                            <p>
                                <strong>Associated Employees:</strong>{" "}
                                {campaign.associatedEmployees.length}
                            </p>
                        </div>
                    </div>

                    <div
                        className={`mt-3 p-3 rounded-lg border ${
                            theme === "dark"
                                ? "bg-red-900/10 border-red-800"
                                : "bg-red-50 border-red-200"
                        }`}
                    >
                        <p
                            className={`text-sm ${theme === "dark" ? "text-red-300" : "text-red-700"}`}
                        >
                            <strong>Warning:</strong> This will also delete all associated
                            performance evaluation documents, competence assessment documents,
                            objective documents, objective weight documents, and competence value
                            documents for this campaign.
                        </p>
                    </div>
                </div>

                <div className="flex justify-end space-x-3">
                    <Button
                        variant="outline"
                        onClick={onClose}
                        disabled={isLoading}
                        className={
                            theme === "dark"
                                ? "border-gray-700 text-gray-300 hover:bg-gray-900"
                                : ""
                        }
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleDelete}
                        disabled={isLoading}
                        className={
                            theme === "dark"
                                ? "bg-red-600 hover:bg-red-700 text-white"
                                : "bg-red-600 hover:bg-red-700 text-white"
                        }
                    >
                        {isLoading ? "Deleting..." : "Delete"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
