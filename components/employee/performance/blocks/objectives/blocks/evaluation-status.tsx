"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CheckCircle, ThumbsUp, ThumbsDown, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { performanceEvaluationService } from "@/lib/backend/api/performance-management/performance-evaluation-service";
import { toast } from "sonner";
import { EvaluationCampaignModel } from "@/lib/models/performance";
import { PerformanceEvaluationModel } from "@/lib/models/performance-evaluation";

interface EvaluationStatusProps {
    currentEvaluation: PerformanceEvaluationModel | null;
    currentCycle: EvaluationCampaignModel | null;
    userRole?: "employee" | "manager" | "hr";
}

export function EvaluationStatus({
    currentEvaluation,
    currentCycle,
    userRole = "employee",
}: EvaluationStatusProps) {
    const [showRefusalDialog, setShowRefusalDialog] = useState(false);
    const [refusalReason, setRefusalReason] = useState("");
    const [isAccepting, setIsAccepting] = useState(false);
    const [isRefusing, setIsRefusing] = useState(false);
    const [showAcceptConfirm, setShowAcceptConfirm] = useState(false);

    const handleAcceptEvaluation = async () => {
        if (!currentEvaluation) return;

        setShowAcceptConfirm(false);
        setIsAccepting(true);
        try {
            await performanceEvaluationService.update(currentEvaluation.id, {
                confirmationStatus: "Accepted",
                stage: "Closed",
            });
            toast.success("Performance evaluation accepted successfully!");
        } catch (error) {
            console.error("Error accepting evaluation:", error);
            toast.error("Failed to accept performance evaluation");
        } finally {
            setIsAccepting(false);
        }
    };

    const handleRefuseEvaluation = async () => {
        if (!currentEvaluation || !refusalReason.trim()) return;

        setIsRefusing(true);
        try {
            await performanceEvaluationService.update(currentEvaluation.id, {
                confirmationStatus: "Refused",
                comment: refusalReason.trim(),
            });
            toast.success("Performance evaluation refused. Your feedback has been recorded.");
            setShowRefusalDialog(false);
            setRefusalReason("");
        } catch (error) {
            console.error("Error refusing evaluation:", error);
            toast.error("Failed to refuse performance evaluation");
        } finally {
            setIsRefusing(false);
        }
    };

    if (!currentEvaluation) return null;

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle>Performance Evaluation Confirmation</CardTitle>
                    <CardDescription>
                        Please review and confirm your performance evaluation for{" "}
                        {currentCycle?.campaignName || "this period"}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                            <h4 className="font-medium">Evaluation Status</h4>
                            <p className="text-sm text-gray-600 dark:text-muted-foreground">
                                {currentEvaluation.stage === "Open"
                                    ? "Your performance evaluation is ready for review"
                                    : "Your performance evaluation has been processed"}
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Badge
                                variant={
                                    currentEvaluation.confirmationStatus === "Accepted"
                                        ? "default"
                                        : currentEvaluation.confirmationStatus === "Refused"
                                            ? "destructive"
                                            : "secondary"
                                }
                            >
                                {currentEvaluation.confirmationStatus}
                            </Badge>
                            {currentEvaluation.stage !== "Open" && (
                                <Badge variant="outline">{currentEvaluation.stage}</Badge>
                            )}
                        </div>
                    </div>

                    {currentEvaluation.stage === "Open" &&
                        currentEvaluation.confirmationStatus === "Not Confirmed" && (
                        <div className="flex gap-3">
                            <Button
                                onClick={() => setShowAcceptConfirm(true)}
                                disabled={isAccepting || isRefusing}
                                className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                            >
                                {isAccepting ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                            Accepting...
                                    </>
                                ) : (
                                    <>
                                        <ThumbsUp className="h-4 w-4" />
                                            Accept Evaluation
                                    </>
                                )}
                            </Button>
                            <Button
                                onClick={() => setShowRefusalDialog(true)}
                                disabled={isAccepting || isRefusing}
                                variant="outline"
                                className="flex items-center gap-2 border-red-300 text-red-600 hover:bg-red-50"
                            >
                                {isRefusing ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                                            Processing...
                                    </>
                                ) : (
                                    <>
                                        <ThumbsDown className="h-4 w-4" />
                                            Refuse Evaluation
                                    </>
                                )}
                            </Button>
                        </div>
                    )}

                    {currentEvaluation.confirmationStatus === "Accepted" && (
                        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                            <span className="text-green-800 font-medium">Evaluation Accepted</span>
                        </div>
                    )}

                    {currentEvaluation.confirmationStatus === "Refused" && (
                        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <AlertTriangle className="h-5 w-5 text-red-600" />
                            <span className="text-red-800 font-medium">Evaluation Refused</span>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Accept Confirmation Dialog */}
            <Dialog open={showAcceptConfirm} onOpenChange={setShowAcceptConfirm}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Accept Performance Evaluation</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to accept this performance evaluation? This action
                            cannot be undone and will finalize your evaluation for{" "}
                            {currentCycle?.campaignName || "this period"}.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowAcceptConfirm(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleAcceptEvaluation}
                            className="bg-green-600 hover:bg-green-700"
                        >
                            Yes, Accept Evaluation
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Refusal Reason Dialog */}
            <Dialog open={showRefusalDialog} onOpenChange={setShowRefusalDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Refuse Performance Evaluation</DialogTitle>
                        <DialogDescription>
                            Please provide a reason for refusing this performance evaluation. Your
                            feedback will be recorded and shared with management.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="refusal-reason">Reason for Refusal</Label>
                            <Textarea
                                id="refusal-reason"
                                placeholder="Please explain why you are refusing this evaluation..."
                                value={refusalReason}
                                onChange={e => setRefusalReason(e.target.value)}
                                rows={4}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowRefusalDialog(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleRefuseEvaluation}
                            disabled={!refusalReason.trim() || isRefusing}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            {isRefusing ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    Submitting...
                                </>
                            ) : (
                                "Submit Refusal"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
