"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Target,
    Calendar,
    CheckCircle,
    FileText,
    Users,
    Loader2,
    Link2,
    Upload,
    AlertTriangle,
    CheckCircle2,
    Lock,
    Save,
} from "lucide-react";
import { FinalizeConfirmationDialog } from "@/components/shared/finalize-confirmation-dialog";
import { ObjectiveModel, SelfEvaluationModel } from "@/lib/models/objective-model";
import {
    updateObjectivesSelfAssessments,
    saveSelfAssessmentWithDetails,
} from "@/lib/backend/api/Performance/objective.service";
import { useToast } from "@/context/toastContext";
import { useTheme } from "@/components/theme-provider";
import uploadFile from "@/lib/backend/firebase/upload/uploadFile";
import { sendNotification } from "@/lib/util/notification/send-notification";
import { useAuth } from "@/context/authContext";
import { useFirestore } from "@/context/firestore-context";
import { PERFORMANCE_MANAGEMENT_LOG_MESSAGES } from "@/lib/log-descriptions/performance-management";
import { useCycle } from "@/context/cycleContext";

export interface ObjectiveModelWithWeight extends ObjectiveModel {
    weight: number | null;
}

interface ObjectiveSelfAssessmentProps {
    objectives: ObjectiveModel[];
}

export function ObjectiveSelfAssessment({ objectives }: ObjectiveSelfAssessmentProps) {
    const { theme } = useTheme();
    const { userData } = useAuth();
    const { employees, hrSettings } = useFirestore();
    const { currentCycle, isActionAllowed } = useCycle();
    const [uploadProgress, setUploadProgress] = useState(0);
    const [evidenceFile, setEvidenceFile] = useState<string | null>(null);

    // Filter objectives to only show Approved or Acknowledged ones
    const filteredObjectives = objectives.filter(
        obj => obj.status === "Approved" || obj.status === "Acknowledged",
    );

    // Check if self-assessment is allowed and if it's been finalized
    const canAssess = isActionAllowed("self-assessment");
    const deadline = currentCycle?.endDate;

    // Check if any objective has been finalized (selfEvaluation exists and isFinalized is true)
    const hasFinalizedAssessment = filteredObjectives.some(
        obj => obj.selfEvaluation?.isFinalized === true,
    );

    // Local state to track finalization for immediate UI lock
    const [isLocallyFinalized, setIsLocallyFinalized] = useState(false);

    // User can only edit if: they have assess permission AND the assessment hasn't been finalized
    const isAbleToEdit = canAssess && !hasFinalizedAssessment && !isLocallyFinalized;

    const [assessments, setAssessments] = useState<Record<string, SelfEvaluationModel>>(() => {
        const initialAssessments: Record<string, SelfEvaluationModel> = {};
        filteredObjectives.forEach(obj => {
            if (obj.selfEvaluation) {
                initialAssessments[obj.id] = {
                    value: obj.selfEvaluation.value ?? null, // No default value
                    actualResult: obj.selfEvaluation.actualResult || "",
                    justification: obj.selfEvaluation.justification || "",
                    evidenceFile: obj.selfEvaluation.evidenceFile || null,
                };
            }
        });
        return initialAssessments;
    });

    const [completedActionItems, setCompletedActionItems] = useState<Record<string, string[]>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [lastSubmissionTime, setLastSubmissionTime] = useState<number>(0);
    const [validationErrors, setValidationErrors] = useState<string[]>([]);
    const [showFinalizeDialog, setShowFinalizeDialog] = useState(false);
    const [saveResult, setSaveResult] = useState<{
        success: boolean;
        message: string;
        savedCount: number;
        failedCount: number;
        errors: string[];
    } | null>(null);
    const { showToast } = useToast();

    useEffect(() => {
        const newAssessments = { ...assessments };
        let hasUpdates = false;

        filteredObjectives.forEach(obj => {
            if (!newAssessments[obj.id] && obj.selfEvaluation) {
                newAssessments[obj.id] = {
                    value: obj.selfEvaluation.value ?? null, // No default value
                    actualResult: obj.selfEvaluation.actualResult || "",
                    justification: obj.selfEvaluation.justification || "",
                    evidenceFile: obj.selfEvaluation.evidenceFile || null,
                    isFinalized: obj.selfEvaluation.isFinalized,
                };
                hasUpdates = true;
            }
        });

        if (hasUpdates) {
            setAssessments(newAssessments);
        }
    }, [filteredObjectives]);

    // Validation function for finalization
    const validateFinalization = (): string[] => {
        const errors: string[] = [];

        filteredObjectives.forEach(objective => {
            const assessment = assessments[objective.id];

            if (!assessment || assessment.value === null || assessment.value === undefined) {
                errors.push(`"${objective.title}" - Rating is required`);
            }
        });

        return errors;
    };

    const handleEvidenceFile = async (file: File, objectiveId: string) => {
        if (!file) return;

        // Validation rules
        const allowedMimes = ["application/pdf", "image/png", "image/jpeg"]; // jpg uses image/jpeg
        const allowedExts = [".pdf", ".png", ".jpg", ".jpeg"];
        const maxSizeBytes = 10 * 1024 * 1024; // 10 MB

        const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
        const isMimeOk = allowedMimes.includes(file.type);
        const isExtOk = allowedExts.includes(ext);

        if (!(isMimeOk && isExtOk)) {
            showToast("Only PDF, PNG, and JPG files are allowed.", "Invalid file type", "error");
            return;
        }
        if (file.size > maxSizeBytes) {
            showToast("Each file must be 10MB or smaller.", "File too large", "error");
            return;
        }

        try {
            const downloadUrl = await uploadFile(
                file,
                "competency-evidence",
                undefined,
                setUploadProgress,
            );

            if (downloadUrl) {
                // Update the specific objective's evidence file
                setAssessments(prev => ({
                    ...prev,
                    [objectiveId]: {
                        ...prev[objectiveId],
                        evidenceFile: downloadUrl,
                    },
                }));
            }
        } catch (error) {
            console.error("Error uploading file:", error);
            showToast("Failed to upload evidence. Please try again.", "Upload error", "error");
        } finally {
            setUploadProgress(0);
        }
    };

    const updateAssessment = (objectiveId: string, updates: Partial<SelfEvaluationModel>) => {
        setAssessments(prev => ({
            ...prev,
            [objectiveId]: {
                ...prev[objectiveId],
                ...updates,
            },
        }));
    };

    const toggleActionItemCompletion = (objectiveId: string, actionItemId: string) => {
        setCompletedActionItems(prev => {
            const currentCompleted = prev[objectiveId] || [];
            const isCompleted = currentCompleted.includes(actionItemId);

            return {
                ...prev,
                [objectiveId]: isCompleted
                    ? currentCompleted.filter(id => id !== actionItemId)
                    : [...currentCompleted, actionItemId],
            };
        });
    };

    // Handle save for later (saves without finalizing)
    const handleSaveForLater = async () => {
        if (!isAbleToEdit) return;

        const now = Date.now();
        if (now - lastSubmissionTime < 1000) {
            return;
        }
        setLastSubmissionTime(now);

        // Clear previous results
        setSaveResult(null);
        setValidationErrors([]);

        try {
            setIsSaving(true);

            // Prepare the objectives with their self-assessments (without finalizing)
            const objectivesToUpdate = Object.entries(assessments).map(([id, selfEvaluation]) => ({
                id,
                selfEvaluation: {
                    value: selfEvaluation.value ?? null,
                    actualResult: selfEvaluation.actualResult || "",
                    justification:
                        selfEvaluation.justification === undefined
                            ? null
                            : selfEvaluation.justification,
                    evidenceFile: selfEvaluation.evidenceFile || null,
                    isFinalized: false,
                },
                title: filteredObjectives.find(obj => obj.id === id)?.title,
            }));

            // Save to Firestore with detailed result
            const result = await saveSelfAssessmentWithDetails(
                objectivesToUpdate,
                userData?.uid ?? "",
            );

            if (result.success) {
                setSaveResult({
                    success: true,
                    message: `Successfully saved ${result.savedCount} self-assessment(s).`,
                    savedCount: result.savedCount,
                    failedCount: result.failedCount,
                    errors: [],
                });

                showToast(
                    "Your progress has been saved. You can continue editing later.",
                    "success",
                    "success",
                );
            } else {
                setSaveResult({
                    success: false,
                    message:
                        result.failedCount > 0
                            ? `Partially saved: ${result.savedCount} succeeded, ${result.failedCount} failed.`
                            : "Failed to save self-assessments.",
                    savedCount: result.savedCount,
                    failedCount: result.failedCount,
                    errors: result.results
                        .filter(r => !r.success)
                        .map(r => r.error || "Unknown error"),
                });

                showToast(
                    "Some self-assessments failed to save. Please review and try again.",
                    "error",
                    "error",
                );
            }
        } catch (error) {
            console.error("Error saving self-assessments:", error);
            setSaveResult({
                success: false,
                message: "An unexpected error occurred while saving.",
                savedCount: 0,
                failedCount: Object.keys(assessments).length,
                errors: [error instanceof Error ? error.message : "Unknown error"],
            });
            showToast("Failed to save self-assessments. Please try again.", "error", "error");
        } finally {
            setIsSaving(false);
        }
    };

    // Handle finalize button click - shows confirmation dialog
    const handleFinalizeClick = () => {
        // Clear previous results
        setSaveResult(null);
        setValidationErrors([]);

        // Validate all objectives have ratings
        const errors = validateFinalization();
        if (errors.length > 0) {
            setValidationErrors(errors);
            showToast(
                "Please provide ratings for all objectives before finalizing.",
                "Validation Error",
                "error",
            );
            return;
        }

        // Show confirmation dialog
        setShowFinalizeDialog(true);
    };

    // Handle finalize (validates and saves with isFinalized = true)
    const handleFinalizeAssessment = async () => {
        if (!isAbleToEdit) return;

        const now = Date.now();
        if (now - lastSubmissionTime < 1000) {
            return;
        }
        setLastSubmissionTime(now);

        // Close dialog
        setShowFinalizeDialog(false);

        // Clear previous results
        setSaveResult(null);
        setValidationErrors([]);

        try {
            setIsSubmitting(true);

            // Prepare the objectives with their self-assessments (with finalization)
            const objectivesToUpdate = Object.entries(assessments).map(([id, selfEvaluation]) => ({
                id,
                selfEvaluation: {
                    value: Math.max(1, Math.min(5, Math.round(selfEvaluation.value || 3))),
                    actualResult: selfEvaluation.actualResult || "",
                    justification:
                        selfEvaluation.justification === undefined
                            ? null
                            : selfEvaluation.justification,
                    evidenceFile: selfEvaluation.evidenceFile || null,
                    isFinalized: true,
                },
                title: filteredObjectives.find(obj => obj.id === id)?.title,
            }));

            // Save to Firestore with detailed result
            const result = await saveSelfAssessmentWithDetails(
                objectivesToUpdate,
                userData?.uid ?? "",
            );

            if (result.success) {
                // Set local finalized state to immediately lock the form
                setIsLocallyFinalized(true);

                setSaveResult({
                    success: true,
                    message: `Successfully finalized ${result.savedCount} self-assessment(s).`,
                    savedCount: result.savedCount,
                    failedCount: result.failedCount,
                    errors: [],
                });

                // Send notification to manager when employee finalizes self-assessment
                const manager = employees.find(emp => emp.uid === userData?.reportingLineManager);
                if (manager) {
                    await sendNotification({
                        users: [
                            {
                                uid: manager.uid,
                                email: manager.companyEmail || manager.personalEmail || "",
                                telegramChatID: manager.telegramChatID || "",
                                recipientType: "manager" as const,
                            },
                        ],
                        channels: ["inapp", "telegram"],
                        messageKey: "EMPLOYEE_OBJECTIVE_SELF_ASSESSMENT_COMPLETED",
                        payload: {
                            employeeName:
                                userData?.firstName + " " + userData?.surname || "Employee",
                        },
                        title: "Employee Objective Self Assessment Completed",
                        getCustomMessage: () => ({
                            inapp: `${userData?.firstName + " " + userData?.surname || "Employee"} has finalized their objective self-assessment.`,
                            telegram: `${userData?.firstName + " " + userData?.surname || "Employee"} has finalized their objective self-assessment.`,
                        }),
                    });
                }

                showToast(
                    "Your self-assessment has been finalized successfully. You can no longer make changes.",
                    "success",
                    "success",
                );
            } else {
                setSaveResult({
                    success: false,
                    message:
                        result.failedCount > 0
                            ? `Partially saved: ${result.savedCount} succeeded, ${result.failedCount} failed.`
                            : "Failed to finalize self-assessments.",
                    savedCount: result.savedCount,
                    failedCount: result.failedCount,
                    errors: result.results
                        .filter(r => !r.success)
                        .map(r => r.error || "Unknown error"),
                });

                showToast(
                    "Some self-assessments failed to finalize. Please review and try again.",
                    "error",
                    "error",
                );
            }
        } catch (error) {
            console.error("Error finalizing self-assessments:", error);
            setSaveResult({
                success: false,
                message: "An unexpected error occurred while finalizing.",
                savedCount: 0,
                failedCount: Object.keys(assessments).length,
                errors: [error instanceof Error ? error.message : "Unknown error"],
            });
            showToast("Failed to finalize self-assessments. Please try again.", "error", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "Created":
                return "bg-yellow-100 text-yellow-800 border-yellow-200";
            case "Approved":
                return "bg-green-100 text-green-800 border-green-200";
            case "Refused":
                return "bg-red-100 text-red-800 border-red-200";
            case "Acknowledged":
                return "bg-blue-100 text-blue-800 border-blue-200";
            default:
                return "bg-gray-100 text-gray-800 border-gray-200";
        }
    };

    return (
        <div className="space-y-6">
            {/* Locked State Alert */}
            {(hasFinalizedAssessment || isLocallyFinalized) && (
                <Alert className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
                    <Lock className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-800 dark:text-blue-200">
                        <div className="font-semibold">Self-Assessment Finalized</div>
                        <p className="text-sm mt-1">
                            Your self-assessment has been finalized and can no longer be edited.
                        </p>
                    </AlertDescription>
                </Alert>
            )}

            {/* Deadline Info Alert */}
            {!isAbleToEdit && !hasFinalizedAssessment && !isLocallyFinalized && (
                <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-800 dark:text-red-200">
                        <div className="font-semibold">Self-Assessment Period Closed</div>
                        {deadline && (
                            <p className="text-sm mt-1">
                                The self-assessment deadline was{" "}
                                {new Date(deadline).toLocaleDateString()}.
                            </p>
                        )}
                    </AlertDescription>
                </Alert>
            )}

            {/* Validation Errors Alert */}
            {validationErrors.length > 0 && (
                <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-800 dark:text-red-200">
                        <div className="font-semibold">Please fix the following errors:</div>
                        <ul className="list-disc pl-5 mt-2 text-sm">
                            {validationErrors.map((error, index) => (
                                <li key={index}>{error}</li>
                            ))}
                        </ul>
                    </AlertDescription>
                </Alert>
            )}

            {/* Save Result Alert */}
            {saveResult && (
                <Alert
                    className={
                        saveResult.success
                            ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20"
                            : "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20"
                    }
                >
                    {saveResult.success ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                    )}
                    <AlertDescription
                        className={
                            saveResult.success
                                ? "text-green-800 dark:text-green-200"
                                : "text-red-800 dark:text-red-200"
                        }
                    >
                        <div className="font-semibold">{saveResult.message}</div>
                        {saveResult.errors.length > 0 && (
                            <ul className="list-disc pl-5 mt-2 text-sm">
                                {saveResult.errors.map((error, index) => (
                                    <li key={index}>{error}</li>
                                ))}
                            </ul>
                        )}
                    </AlertDescription>
                </Alert>
            )}

            {filteredObjectives.map(objective => {
                const assessment = assessments[objective.id] || {
                    value: objective.selfEvaluation?.value,
                    actualResult: objective.selfEvaluation?.actualResult || "",
                    justification: objective.selfEvaluation?.justification || "",
                    evidenceFile: objective.selfEvaluation?.evidenceFile || null,
                };

                const objectiveCompletedItems = completedActionItems[objective.id] || [];

                return (
                    <Card
                        key={objective.id}
                        className={`border-gray-300 shadow-sm ${theme === "dark" ? "bg-black" : "bg-white"}`}
                    >
                        <CardHeader
                            className={`border-accent-200 shadow-sm ${theme === "dark" ? "bg-black" : "bg-white"}`}
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <CardTitle
                                        className={`text-lg font-semibold flex items-center gap-2 ${theme === "dark" ? "text-white" : "text-gray-900"}`}
                                    >
                                        <Target
                                            className={`h-5 w-5 ${theme === "dark" ? "text-white" : "text-gray-900"}`}
                                        />
                                        {objective.title}
                                    </CardTitle>
                                    <div className="flex items-center gap-2 mt-2">
                                        <Badge
                                            className={`text-xs ${theme === "dark" ? "text-white" : "text-gray-900"} ${getStatusColor(objective.status)}`}
                                        >
                                            {objective.status}
                                        </Badge>
                                        <div
                                            className={`flex items-center gap-1 text-sm ${theme === "dark" ? "text-white" : "text-gray-900"}`}
                                        >
                                            <Calendar className="h-4 w-4" />
                                            Due:{" "}
                                            {new Date(objective.targetDate).toLocaleDateString()}
                                        </div>
                                        {objective.deptKPI && (
                                            <Badge
                                                variant="outline"
                                                className={`text-xs ${theme === "dark" ? "text-white" : "text-gray-900"}`}
                                            >
                                                KPI:{" "}
                                                {hrSettings.departmentKPIs.find(
                                                    d => d.id === objective.deptKPI,
                                                )?.title ?? "-"}
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div>
                                <h4
                                    className={`font-medium text-gray-900 dark:text-foreground mb-2 ${theme === "dark" ? "text-white" : "text-gray-900"}`}
                                >
                                    SMART Objective
                                </h4>
                                <p
                                    className={`text-sm text-gray-600 dark:text-muted-foreground bg-gray-50 dark:bg-gray-800 p-3 rounded-md ${theme === "dark" ? "text-white" : "text-gray-900"}`}
                                >
                                    {objective.SMARTObjective}
                                </p>
                            </div>

                            <div
                                className={`border-t pt-4 ${theme === "dark" ? "border-gray-700" : "border-gray-200"}`}
                            >
                                <h4
                                    className={`font-medium text-gray-900 dark:text-foreground mb-4 flex items-center gap-2 ${theme === "dark" ? "text-white" : "text-gray-900"}`}
                                >
                                    <CheckCircle className="h-4 w-4" />
                                    Self-Evaluation
                                </h4>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label
                                            className={`block text-sm font-medium  mb-2 ${theme === "dark" ? "text-white" : "text-gray-900"}`}
                                        >
                                            Rating (1-5 Scale)
                                        </label>
                                        <Select
                                            value={assessment.value?.toString() || ""}
                                            onValueChange={(value: string) =>
                                                updateAssessment(objective.id, {
                                                    value: parseInt(value),
                                                })
                                            }
                                            disabled={!isAbleToEdit}
                                        >
                                            <SelectTrigger
                                                className={`border-accent-200 shadow-sm ${theme === "dark" ? "bg-black" : "bg-white"} ${!isAbleToEdit ? "opacity-60 cursor-not-allowed" : ""}`}
                                            >
                                                <SelectValue placeholder="Select a rating" />
                                            </SelectTrigger>
                                            <SelectContent
                                                className={`border-accent-200 shadow-sm ${theme === "dark" ? "bg-black text-white" : "bg-white text-black"}`}
                                            >
                                                <SelectItem value="1">1 - Poor</SelectItem>
                                                <SelectItem value="2">2 - Below Average</SelectItem>
                                                <SelectItem value="3">3 - Average</SelectItem>
                                                <SelectItem value="4">4 - Good</SelectItem>
                                                <SelectItem value="5">5 - Excellent</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="mt-4">
                                    <label
                                        className={`block text-sm font-medium  mb-2 ${theme === "dark" ? "text-white" : "text-gray-900"}`}
                                    >
                                        Actual Results Achieved
                                    </label>
                                    <Textarea
                                        placeholder="Describe the actual results you achieved for this objective..."
                                        value={assessment.actualResult}
                                        onChange={e =>
                                            updateAssessment(objective.id, {
                                                actualResult: e.target.value,
                                            })
                                        }
                                        className={`min-h-[80px] ${theme === "dark" ? "text-white" : "text-gray-900"} ${!isAbleToEdit ? "opacity-60 cursor-not-allowed" : ""}`}
                                        disabled={!isAbleToEdit}
                                    />
                                </div>

                                <div className="mt-4">
                                    <label
                                        className={`block text-sm font-medium  mb-2 ${theme === "dark" ? "text-white" : "text-gray-900"}`}
                                    >
                                        Justification & Comments
                                    </label>
                                    <Textarea
                                        placeholder="Provide justification for your self-evaluation, challenges faced, and additional context..."
                                        value={assessment.justification || ""}
                                        onChange={e =>
                                            updateAssessment(objective.id, {
                                                justification: e.target.value,
                                            })
                                        }
                                        className={`min-h-[100px] ${theme === "dark" ? "text-white" : "text-gray-900"} ${!isAbleToEdit ? "opacity-60 cursor-not-allowed" : ""}`}
                                        disabled={!isAbleToEdit}
                                    />
                                </div>

                                {/* Evidence */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-md font-normal">
                                            Supporting Evidence
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        {/* Display chosen evidence */}
                                        <div className="space-y-2 mb-4">
                                            {evidenceFile && (
                                                <div className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 dark:bg-gray-800">
                                                    <FileText className="w-4 h-4 text-blue-500" />
                                                    <span className="text-sm flex-1 truncate">
                                                        {evidenceFile.split("/").pop()}
                                                    </span>
                                                    {isAbleToEdit && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => setEvidenceFile(null)}
                                                        >
                                                            Remove
                                                        </Button>
                                                    )}
                                                </div>
                                            )}
                                            {assessments[objective.id]?.evidenceFile && (
                                                <div className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 dark:bg-gray-800">
                                                    <Link2 className="w-4 h-4 text-green-500" />
                                                    <a
                                                        href={
                                                            assessments[objective.id]
                                                                .evidenceFile || ""
                                                        }
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-sm flex-1 truncate"
                                                    >
                                                        {assessments[objective.id].evidenceFile
                                                            ?.split("/")
                                                            .pop()}
                                                    </a>
                                                    {isAbleToEdit && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => {
                                                                setAssessments(prev => ({
                                                                    ...prev,
                                                                    [objective.id]: {
                                                                        ...prev[objective.id],
                                                                        evidenceFile: null,
                                                                    },
                                                                }));
                                                            }}
                                                        >
                                                            Remove
                                                        </Button>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {/* Action buttons */}
                                        {isAbleToEdit && (
                                            <div className="flex gap-2">
                                                <div className="relative">
                                                    <input
                                                        type="file"
                                                        id={`evidence-file-upload-${objective.id}`}
                                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                        accept=".pdf,.png,.jpg,.jpeg"
                                                        onChange={e => {
                                                            const file = e.target.files?.[0];
                                                            if (file)
                                                                handleEvidenceFile(
                                                                    file,
                                                                    objective.id,
                                                                );
                                                        }}
                                                        disabled={
                                                            !!assessments[objective.id]
                                                                ?.evidenceFile
                                                        }
                                                    />
                                                    <Button
                                                        asChild
                                                        variant="outline"
                                                        size="sm"
                                                        disabled={
                                                            !!assessments[objective.id]
                                                                ?.evidenceFile
                                                        }
                                                    >
                                                        <div>
                                                            <Upload className="w-4 h-4 mr-2" />
                                                            Upload File
                                                        </div>
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>

                            {objective.actionItems && objective.actionItems.length > 0 && (
                                <div className="border-t pt-4">
                                    <h4
                                        className={`font-medium mb-3 flex items-center gap-2 ${theme === "dark" ? "text-white" : "text-gray-900"}`}
                                    >
                                        <FileText
                                            className={`h-4 w-4 ${theme === "dark" ? "text-white" : "text-gray-900"}`}
                                        />
                                        Related Action Items
                                    </h4>
                                    <div className="space-y-3">
                                        {objective.actionItems.map(item => {
                                            const isCompleted = objectiveCompletedItems.includes(
                                                item.id,
                                            );
                                            return (
                                                <div
                                                    key={item.id}
                                                    className={`flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-md ${theme === "dark" ? "bg-black" : "bg-white"}`}
                                                >
                                                    <Checkbox
                                                        id={`action-${objective.id}-${item.id}`}
                                                        checked={isCompleted}
                                                        onCheckedChange={() =>
                                                            toggleActionItemCompletion(
                                                                objective.id,
                                                                item.id,
                                                            )
                                                        }
                                                        className={`mt-0.5 ${theme === "dark" ? "text-white" : "text-gray-900"}`}
                                                    />
                                                    <div className="flex-1">
                                                        <label
                                                            htmlFor={`action-${objective.id}-${item.id}`}
                                                            className={`text-sm cursor-pointer ${isCompleted ? "line-through text-gray-500" : "text-gray-700 dark:text-gray-300"}`}
                                                        >
                                                            {item.actionItem}
                                                        </label>
                                                        {item.description && (
                                                            <p
                                                                className={`text-xs mt-1 ${isCompleted ? "line-through text-gray-500" : "text-gray-600 dark:text-gray-400"}`}
                                                            >
                                                                {item.description}
                                                            </p>
                                                        )}
                                                        <div className="flex items-center gap-2 mt-1">
                                                            {item.employee && (
                                                                <Badge
                                                                    variant="secondary"
                                                                    className="text-xs"
                                                                >
                                                                    Employee
                                                                </Badge>
                                                            )}
                                                            {item.manager && (
                                                                <Badge
                                                                    variant="outline"
                                                                    className="text-xs"
                                                                >
                                                                    Manager
                                                                </Badge>
                                                            )}
                                                            {isCompleted && (
                                                                <Badge
                                                                    variant="default"
                                                                    className="text-xs bg-green-100 text-green-800"
                                                                >
                                                                    Completed
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <div className="mt-3 text-sm text-gray-600 dark:text-gray-400">
                                        Completed: {objectiveCompletedItems.length} of{" "}
                                        {objective.actionItems.length} action items
                                    </div>
                                </div>
                            )}

                            {(objective.employeeFeedback?.length > 0 ||
                                objective.managerFeedback?.length > 0) && (
                                <div className="border-t pt-4">
                                    <h4
                                        className={`font-medium mb-3 flex items-center gap-2 ${theme === "dark" ? "text-white" : "text-gray-900"}`}
                                    >
                                        <Users
                                            className={`h-4 w-4 ${theme === "dark" ? "text-white" : "text-gray-900"}`}
                                        />
                                        Previous Feedback
                                    </h4>
                                    {objective.employeeFeedback?.length > 0 && (
                                        <div className="mb-3">
                                            <h5
                                                className={`text-sm font-medium mb-2 ${theme === "dark" ? "text-white" : "text-gray-900"}`}
                                            >
                                                Employee Feedback
                                            </h5>
                                            {objective.employeeFeedback.map((feedback, index) => (
                                                <div
                                                    key={index}
                                                    className={`text-sm ${theme === "dark" ? "bg-blue-50 dark:bg-blue-900/20" : "bg-blue-50 dark:bg-blue-900/20"} p-2 rounded-md mb-1`}
                                                >
                                                    {typeof feedback === "string"
                                                        ? feedback
                                                        : JSON.stringify(feedback)}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    {objective.managerFeedback?.length > 0 && (
                                        <div>
                                            <h5
                                                className={`text-sm font-medium mb-2 ${theme === "dark" ? "text-white" : "text-gray-900"}`}
                                            >
                                                Manager Feedback
                                            </h5>
                                            {objective.managerFeedback.map((feedback, index) => (
                                                <div
                                                    key={index}
                                                    className={`text-sm ${theme === "dark" ? "bg-green-50 dark:bg-green-900/20" : "bg-green-50"} p-2 rounded-md mb-1`}
                                                >
                                                    {typeof feedback === "string"
                                                        ? feedback
                                                        : JSON.stringify(feedback)}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                );
            })}

            {/* Action Buttons */}
            {isAbleToEdit && (
                <div className="flex justify-end gap-3 mt-6">
                    <Button
                        variant="outline"
                        onClick={handleSaveForLater}
                        disabled={isSaving || isSubmitting || filteredObjectives.length === 0}
                    >
                        {isSaving ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save className="mr-2 h-4 w-4" />
                                Save for Later
                            </>
                        )}
                    </Button>
                    <Button
                        className={`text-white ${theme === "dark" ? "text-white" : "text-black"}`}
                        onClick={handleFinalizeClick}
                        disabled={isSubmitting || isSaving || filteredObjectives.length === 0}
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Finalizing...
                            </>
                        ) : (
                            <>
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Finalize Self-Assessment
                            </>
                        )}
                    </Button>
                </div>
            )}

            {/* Finalize Confirmation Dialog */}
            <FinalizeConfirmationDialog
                open={showFinalizeDialog}
                onOpenChange={setShowFinalizeDialog}
                onConfirm={handleFinalizeAssessment}
                assessmentType="objective-self"
                isSubmitting={isSubmitting}
            />
        </div>
    );
}
