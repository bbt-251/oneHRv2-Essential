"use client";

import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useFirestore } from "@/context/firestore-context";
import { useToast } from "@/context/toastContext";
import { useConfirm } from "@/hooks/use-confirm-dialog";
import { batchUpdateEmployee } from "@/lib/backend/api/employee-management/employee-management-service";
import { EmployeeModel, PastPerformanceModel } from "@/lib/models/employee";
import { ObjectiveModel } from "@/lib/models/objective-model";
import { EvaluationCampaignModel } from "@/lib/models/performance";
import { Calendar, Plus, Bell } from "lucide-react";
import { useState } from "react";
import CampaignsTable from "./blocks/campaigns-table";
import CampaignModal from "./modals/campaign-modal";
import DeleteCampaignModal from "./modals/delete-campaign-modal";
import NotificationModal from "./modals/notification-modal";
import {
    computeObjectiveScorePct,
    computeCompetencyScorePct,
    computeEPS,
    computeRoundMetrics,
} from "@/lib/util/performance-rating";
import { useAuth } from "@/context/authContext";

export default function EvaluationCampaignsPage() {
    const { theme } = useTheme();
    const { confirm, ConfirmDialog } = useConfirm();
    const { showToast } = useToast();
    const { userData } = useAuth();
    const {
        hrSettings,
        employees,
        objectives,
        competenceAssessments,
        objectiveWeights,
        notifications,
    } = useFirestore();
    const [isCampaignModalOpen, setIsCampaignModalOpen] = useState<boolean>(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
    const [isNotificationModalOpen, setIsNotificationModalOpen] = useState<boolean>(false);
    const [selectedCampaign, setSelectedCampaign] = useState<EvaluationCampaignModel | null>(null);
    const acknowledgedApprovedObjectives = objectives.filter(
        o => o.status == "Approved" || o.status == "Acknowledged",
    );

    async function calculatePerformanceScore(
        campaignId: string,
        campaign: EvaluationCampaignModel,
    ) {
        const filteredObjectives = acknowledgedApprovedObjectives.filter(
            (doc: ObjectiveModel) =>
                doc.period == campaign?.periodID && doc.round == campaign?.roundID,
        );

        employees.map((val: EmployeeModel) => {
            const empObjectives: ObjectiveModel[] = filteredObjectives.filter(
                (doc: ObjectiveModel) => doc.employee == (val?.uid ?? ""),
            );
            // checking if competence is for employee, assessment campaign should be selected campaign
            const empCompetence = competenceAssessments.find(
                assessment =>
                    assessment.for === (val?.uid ?? "") &&
                    assessment.assessment.find(doc => doc?.campaignId === campaignId),
            );

            const assessmentValues = empCompetence?.assessment.find(
                ass => ass.evaluatedBy != val?.uid,
            );

            // Unified metrics using shared helper
            const weightsForCampaign =
                objectiveWeights?.find(ow => ow.campaignId === campaignId) ?? null;
            const { objectivePct, competencyPct, epsPct } = computeRoundMetrics({
                objectives: empObjectives,
                weightsForCampaign,
                competenceValues: assessmentValues?.competenceValues ?? [],
            });

            console.log(`employee: ${val.employeeID}`);
            console.log("empObjectives: ", empObjectives);
            console.log(`weightsForCampaign: `, weightsForCampaign);
            console.log(`objectivePct: `, objectivePct);

            // Convert to 0..5 scale for storage alongside previous schema
            const objectiveVal = Math.round((objectivePct / 100) * 5 * 100) / 100;
            const averageCompetence = Math.round((competencyPct / 100) * 5 * 100) / 100;
            val.performanceScore = Math.round((epsPct / 100) * 5 * 100) / 100; // 0..5 with two decimals

            // adding values to past performance array to the employee
            const pastPerformance: PastPerformanceModel = {
                id: crypto.randomUUID(),
                campaignId,
                campaignName: campaign.campaignName,
                period: campaign.periodID,
                round: campaign.roundID,
                startDate: campaign.startDate,
                endDate: campaign.endDate,
                competencyScore: averageCompetence, // 0..5
                objectiveScore: objectiveVal, // 0..5
                performanceScore: Math.round((epsPct / 100) * 5 * 100) / 100,
            };

            // pushing the current score to the past performance array by recalculating performance each time for that campaign
            val?.performance
                ? (val.performance = [
                    ...val.performance.filter(p => p.campaignId != pastPerformance.campaignId),
                    pastPerformance,
                ])
                : (val.performance = [pastPerformance]);

            let totalPastScore: number = 0;
            val?.performance?.forEach(d => (totalPastScore += d.performanceScore));

            // calculating the average performance score
            val.performanceScore = Number.isNaN(
                val?.performance?.length > 0 ? totalPastScore / val?.performance?.length : NaN,
            )
                ? 0
                : totalPastScore / val?.performance?.length;
        });

        const ret = await batchUpdateEmployee(employees);
        if (ret) {
            showToast("Performance score calculated successfully", "Success", "success");
        } else {
            showToast("Error calculating performance score", "Error", "error");
        }
    }

    const handleEpsCalculation = (campaignId: string, campaign: EvaluationCampaignModel) => {
        confirm(
            "Ready to calculate performance evaluation?",
            async () => await calculatePerformanceScore(campaignId, campaign),
            true,
        );
    };

    const handleEdit = (campaign: EvaluationCampaignModel) => {
        setSelectedCampaign(campaign);
        setIsCampaignModalOpen(true);
    };

    const handleDelete = (campaign: EvaluationCampaignModel) => {
        setSelectedCampaign(campaign);
        setIsDeleteModalOpen(true);
    };

    const handleCloseModals = () => {
        setIsCampaignModalOpen(false);
        setIsDeleteModalOpen(false);
        setSelectedCampaign(null);
    };

    const handleOpenCreateModal = () => {
        setSelectedCampaign(null);
        setIsCampaignModalOpen(true);
    };

    console.log(
        "notifications: ",
        notifications.filter(n => (n as any).uid == userData?.uid),
    );

    return (
        <>
            <Card
                className={
                    theme === "dark" ? "bg-black border-gray-700" : "bg-white border-gray-200"
                }
            >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                    <div className="flex items-center">
                        <Calendar className="h-5 w-5 text-amber-600 mr-2" />
                        <CardTitle
                            className={`text-lg font-semibold ${theme === "dark" ? "text-white" : "text-gray-900"}`}
                        >
                            Evaluation Campaigns
                        </CardTitle>
                    </div>
                    <div className="flex space-x-2">
                        <Button
                            onClick={() => setIsNotificationModalOpen(true)}
                            variant="outline"
                            className={
                                theme === "dark"
                                    ? "border-gray-600 text-white hover:bg-gray-700"
                                    : ""
                            }
                        >
                            <Bell className="h-4 w-4 mr-2" />
                            Push Notification
                        </Button>
                        <Button
                            onClick={handleOpenCreateModal}
                            className="bg-amber-600 hover:bg-amber-700 text-white"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Evaluation Campaign
                        </Button>
                    </div>
                </CardHeader>

                <CardContent className="space-y-6">
                    <p className={theme === "dark" ? "text-gray-300" : "text-gray-600"}>
                        Manage evaluation campaigns and track employee performance assessments.
                    </p>

                    <CampaignsTable
                        data={hrSettings.evaluationCampaigns}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onEpsCalculation={handleEpsCalculation}
                    />
                </CardContent>
            </Card>

            <CampaignModal
                isOpen={isCampaignModalOpen}
                onClose={handleCloseModals}
                campaign={selectedCampaign}
            />

            <DeleteCampaignModal
                isOpen={isDeleteModalOpen}
                onClose={handleCloseModals}
                campaign={selectedCampaign}
            />

            <NotificationModal
                isOpen={isNotificationModalOpen}
                onClose={() => setIsNotificationModalOpen(false)}
            />

            {/* Eps confirmation modal */}
            {ConfirmDialog}
        </>
    );
}
