"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
    Star,
    Upload,
    Link2,
    FileText,
    Clock,
    AlertTriangle,
    TrendingUp,
    TrendingDown,
    Minus,
    Save,
    Send,
    Lock,
    CheckCircle2,
    Loader2,
} from "lucide-react";

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { FinalizeConfirmationDialog } from "@/components/shared/finalize-confirmation-dialog";
import { Input } from "@/components/ui/input";

import { useTheme } from "@/components/theme-provider";
import { useFirestore } from "@/context/firestore-context";
import { useAuth } from "@/context/authContext";
import { useCycle } from "@/context/cycleContext";
import {
    AssessmentModel,
    CompetenceAssessmentModel,
    CompetenceValueModel,
} from "@/lib/models/competenceAssessment";
import {
    createCompetenceAssessment,
    updateCompetenceAssessment,
} from "@/lib/backend/api/competence/assessment-service";
import uploadFile from "@/lib/backend/firebase/upload/uploadFile";
import { useToast } from "@/context/toastContext";
import { getTimestamp } from "@/lib/util/dayjs_format";
import { sendNotification } from "@/lib/util/notification/send-notification";

export interface CompetenceValueUpdateModel extends CompetenceValueModel {
    comment?: string;
}

export function CompetencySelfAssessment() {
    const {
        hrSettings,
        competenceAssessments,
        competenceValues: competenceValueData,
        employees,
    } = useFirestore();
    const { userData } = useAuth();
    const { theme } = useTheme();
    const { showToast } = useToast();
    const { currentCycle, isActionAllowed } = useCycle();

    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [isSaving, setIsSaving] = useState<boolean>(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const [uploadingEvidence, setUploadingEvidence] = useState<Record<string, boolean>>({});
    const [uploadProgress, setUploadProgress] = useState<number>(0);
    const [isExistingAssessment, setIsExistingAssessment] = useState<boolean>(false);
    const hasUnsavedChanges = useRef<boolean>(false);
    const [validationErrors, setValidationErrors] = useState<string[]>([]);
    const [saveResult, setSaveResult] = useState<{
        success: boolean;
        message: string;
    } | null>(null);
    const [showFinalizeDialog, setShowFinalizeDialog] = useState<boolean>(false);

    // Check if assessment has been finalized
    const [isLocallyFinalized, setIsLocallyFinalized] = useState<boolean>(false);

    const [evidenceFiles, setEvidenceFiles] = useState<Record<string, string>>({});
    const [evidenceLinks, setEvidenceLinks] = useState<Record<string, string>>({});
    const [comments, setComments] = useState<Record<string, string>>({});
    const [scoreValues, setScoreValues] = useState<Record<string, number | null>>({});

    const [currentCompetency, setCurrentCompetency] = useState<string | null>(null);
    const [linkInputValue, setLinkInputValue] = useState<string>("");
    const [isLinkAlertOpen, setIsLinkAlertOpen] = useState<boolean>(false);

    const competencePositionAssociation = hrSettings?.competencePositionAssociations;
    const competencies = hrSettings?.competencies;

    const [competenceValues, setCompetenceValues] = useState<CompetenceValueModel[]>([]);
    const [filteredCompetenceValues, setFilteredCompetenceValues] = useState<
        CompetenceValueModel[]
    >([]);

    useEffect(() => {
        const filteredCompetenceValues = competenceValueData.filter(
            cv => cv.employeeUid == userData?.uid && cv.campaignId == currentCycle?.id,
        );
        setFilteredCompetenceValues(filteredCompetenceValues);
    }, [competenceValueData, userData?.uid]);

    useEffect(() => {
        const competenceValues: CompetenceValueModel[] = [];
        const uniqueCompetences = [
            ...new Set(
                competencePositionAssociation
                    .filter(cpa => cpa.pid == userData?.employmentPosition)
                    .map(cpa => cpa.cid),
            ),
        ];
        uniqueCompetences.map((competenceId, index) => {
            const cpa = competencePositionAssociation.find(
                c => c.cid == competenceId && c.pid == userData?.employmentPosition,
            );

            const competenceValue = filteredCompetenceValues.find(
                cv => cv.competenceId == competenceId,
            );

            competenceValues.push({
                id: competenceValue?.id ?? `${index}`,
                campaignId: currentCycle?.id || "",
                employeeUid: userData?.uid || "",
                competenceId,
                threshold: cpa?.threshold ?? 0,
                weight: competenceValue?.weight ?? null,
                value: null,
                evidenceFile: null,
                evidenceLink: null,
                employeeComment: null,
                managerComment: null,
            });
        });
        setCompetenceValues(competenceValues);
    }, [competencePositionAssociation, userData, filteredCompetenceValues]);

    const canAssess = isActionAllowed("self-assessment");
    const deadline = currentCycle?.endDate;

    // Check if the current user's self-assessment is finalized
    const hasFinalizedAssessment = competenceAssessments.some(
        ca =>
            ca.for === userData?.uid &&
            ca.assessment.some(
                a =>
                    a.campaignId === currentCycle?.id &&
                    a.evaluatedBy === userData?.uid &&
                    a.isFinalized === true,
            ),
    );

    // User can only edit if: they have assess permission AND the assessment hasn't been finalized
    const isAbleToEdit = canAssess && !hasFinalizedAssessment && !isLocallyFinalized;

    useEffect(() => {
        if (!competenceAssessments || competenceAssessments.length === 0) return;

        const existing = competenceAssessments.find(
            ca =>
                ca.for === userData?.uid &&
                ca.assessment.some(
                    a => a.campaignId === currentCycle?.id && a.evaluatedBy == userData?.uid,
                ),
        );

        setIsExistingAssessment(existing !== undefined);

        if (!existing) return;
        // flatten data into your local state
        const newScores: Record<string, number | null> = {};
        const newComments: Record<string, string> = {};
        const newEvidenceFiles: Record<string, string> = {};
        const newEvidenceLinks: Record<string, string> = {};

        existing.assessment
            .filter(a => a.evaluatedBy == userData?.uid)
            .forEach(a => {
                a.competenceValues.forEach(cv => {
                    newScores[cv.competenceId] = cv.value ?? null;
                    newComments[cv.competenceId] = cv.employeeComment ?? "";
                    if (cv.evidenceFile) newEvidenceFiles[cv.competenceId] = cv.evidenceFile;
                    if (cv.evidenceLink) newEvidenceLinks[cv.competenceId] = cv.evidenceLink;
                });
            });

        setScoreValues(newScores);
        setComments(newComments);
        setEvidenceFiles(newEvidenceFiles);
        setEvidenceLinks(newEvidenceLinks);
    }, [competenceAssessments, userData?.uid, currentCycle]);

    // Validation function for finalization
    const validateFinalization = (): string[] => {
        const errors: string[] = [];

        competenceValues.forEach(competenceValue => {
            const competence = competencies.find(s => s.id === competenceValue.competenceId);
            const score = scoreValues[competenceValue.competenceId];

            if (!score || score === 0) {
                errors.push(
                    `"${competence?.competenceName || competenceValue.competenceId}" - Rating is required`,
                );
            }
        });

        return errors;
    };

    const handleScoreChange = (competenceId: string, value: number) => {
        hasUnsavedChanges.current = true;
        setScoreValues(prev => ({
            ...prev,
            [competenceId]: value,
        }));
    };

    const handleCommentChange = (competenceId: string, comment: string) => {
        hasUnsavedChanges.current = true;
        setComments(prev => ({
            ...prev,
            [competenceId]: comment,
        }));
    };

    const handleEvidenceFile = async (competenceId: string, file: File) => {
        if (!file) return;

        setUploadingEvidence(prev => ({
            ...prev,
            [competenceId]: true,
        }));
        setUploadProgress(0);

        try {
            const downloadUrl = await uploadFile(
                file,
                `competency-evidence/${competenceId}`,
                undefined,
                setUploadProgress,
            );

            if (downloadUrl) {
                setEvidenceFiles(prev => ({
                    ...prev,
                    [competenceId]: downloadUrl,
                }));
                hasUnsavedChanges.current = true;
            } else {
                console.error("Upload completed but no download URL was returned.");
            }
        } catch (error) {
            console.error("An error occurred during file upload:", error);
        } finally {
            setUploadingEvidence(prev => ({
                ...prev,
                [competenceId]: false,
            }));
            setUploadProgress(0);
        }
    };

    const handleEvidenceLink = (competenceId: string, url: string, competenceName: string) => {
        if (url) {
            setEvidenceLinks(prev => ({
                ...prev,
                [competenceId]: url,
            }));
            hasUnsavedChanges.current = true;
            setLinkInputValue("");
            setIsLinkAlertOpen(false);
        }
    };

    const openLinkDialog = (competenceId: string) => {
        setCurrentCompetency(competenceId);
        setLinkInputValue(evidenceLinks[competenceId] || "");
        setIsLinkAlertOpen(true);
    };

    // Handle save for later (saves without finalizing)
    const handleSaveForLater = async () => {
        if (!isAbleToEdit || !currentCycle) return;

        setIsSaving(true);
        setSaveResult(null);
        setValidationErrors([]);

        const prevAssessment = competenceAssessments.find(ca => ca.for == userData?.uid);

        const assessment: AssessmentModel = {
            campaignId: currentCycle?.id ?? "",
            evaluatedBy: userData?.uid ?? "",
            isFinalized: false,
            competenceValues: competenceValues.map(cv => {
                const previousValue = prevAssessment?.assessment
                    ?.find(a => a.campaignId == cv.campaignId && a.evaluatedBy == userData?.uid)
                    ?.competenceValues?.find(c => c.competenceId == cv.competenceId);

                return {
                    ...cv,
                    campaignId: currentCycle.id || "",
                    employeeUid: userData?.uid ?? "",
                    threshold: cv.threshold ?? 0,
                    weight: cv.weight ?? null,
                    value: scoreValues[cv.competenceId] ?? previousValue?.value ?? null,
                    employeeComment: comments[cv.competenceId] ?? null,
                    evidenceFile: evidenceFiles[cv.competenceId] ?? null,
                    evidenceLink: evidenceLinks[cv.competenceId] ?? null,
                };
            }),
        };

        const competenceAssessment: Omit<CompetenceAssessmentModel, "id"> = {
            timestamp: getTimestamp(),
            for: userData?.uid ?? "",
            assessment: [
                assessment,
                ...(prevAssessment?.assessment?.filter(
                    a =>
                        a.campaignId !== assessment.campaignId ||
                        a.evaluatedBy !== assessment.evaluatedBy,
                ) ?? []),
            ],
        };

        let res = false;
        if (prevAssessment) {
            res = await updateCompetenceAssessment({
                assessment: competenceAssessment.assessment,
                id: prevAssessment.id,
            });
        } else {
            res = await createCompetenceAssessment(competenceAssessment);
        }

        if (res) {
            setSaveResult({
                success: true,
                message: "Your progress has been saved. You can continue editing later.",
            });
            setLastSaved(new Date());
            showToast("Progress saved successfully", "Success", "success");
        } else {
            setSaveResult({
                success: false,
                message: "Failed to save assessment. Please try again.",
            });
            showToast("Error saving assessment", "Error", "error");
        }

        setIsSaving(false);
    };

    // Handle finalize button click - shows confirmation dialog
    const handleFinalizeClick = () => {
        setSaveResult(null);
        setValidationErrors([]);

        // Validate all competencies have ratings
        const errors = validateFinalization();
        if (errors.length > 0) {
            setValidationErrors(errors);
            showToast(
                "Please provide ratings for all competencies before finalizing.",
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
        if (!isAbleToEdit || !currentCycle) return;

        // Close dialog
        setShowFinalizeDialog(false);

        setSaveResult(null);
        setValidationErrors([]);

        setIsSubmitting(true);

        const prevAssessment = competenceAssessments.find(ca => ca.for == userData?.uid);

        const assessment: AssessmentModel = {
            campaignId: currentCycle?.id ?? "",
            evaluatedBy: userData?.uid ?? "",
            isFinalized: true,
            competenceValues: competenceValues.map(cv => {
                const previousValue = prevAssessment?.assessment
                    ?.find(a => a.campaignId == cv.campaignId && a.evaluatedBy == userData?.uid)
                    ?.competenceValues?.find(c => c.competenceId == cv.competenceId);

                return {
                    ...cv,
                    campaignId: currentCycle.id || "",
                    employeeUid: userData?.uid ?? "",
                    threshold: cv.threshold ?? 0,
                    weight: cv.weight ?? null,
                    value: scoreValues[cv.competenceId] ?? previousValue?.value ?? null,
                    employeeComment: comments[cv.competenceId] ?? null,
                    evidenceFile: evidenceFiles[cv.competenceId] ?? null,
                    evidenceLink: evidenceLinks[cv.competenceId] ?? null,
                };
            }),
        };

        const competenceAssessment: Omit<CompetenceAssessmentModel, "id"> = {
            timestamp: getTimestamp(),
            for: userData?.uid ?? "",
            assessment: [
                assessment,
                ...(prevAssessment?.assessment?.filter(
                    a =>
                        a.campaignId !== assessment.campaignId ||
                        a.evaluatedBy !== assessment.evaluatedBy,
                ) ?? []),
            ],
        };

        let res = false;
        if (prevAssessment) {
            res = await updateCompetenceAssessment({
                assessment: competenceAssessment.assessment,
                id: prevAssessment.id,
            });
        } else {
            res = await createCompetenceAssessment(competenceAssessment);
        }

        if (res) {
            // Set local finalized state to immediately lock the form
            setIsLocallyFinalized(true);

            setSaveResult({
                success: true,
                message:
                    "Your self-assessment has been finalized successfully. You can no longer make changes.",
            });

            // Send notification to manager when employee finalizes competency self-assessment
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
                    messageKey: "EMPLOYEE_COMPETENCY_SELF_ASSESSMENT_COMPLETED",
                    payload: {
                        employeeName: userData?.firstName + " " + userData?.surname || "Employee",
                    },
                    title: "Employee Competency Self Assessment Completed",
                    getCustomMessage: () => ({
                        inapp: `${userData?.firstName + " " + userData?.surname || "Employee"} has finalized their competency self-assessment.`,
                        telegram: `${userData?.firstName + " " + userData?.surname || "Employee"} has finalized their competency self-assessment.`,
                    }),
                });
            }

            showToast(
                "Self-assessment finalized successfully. You can no longer make changes.",
                "Success",
                "success",
            );
        } else {
            setSaveResult({
                success: false,
                message: "Failed to finalize assessment. Please try again.",
            });
            showToast("Error finalizing assessment", "Error", "error");
        }

        setIsSubmitting(false);
    };
    const getThresholdDelta = (competenceId: string, score: number) => {
        const positionSkill = competenceValues.find(ps => ps.id === competenceId);
        if (!positionSkill || !score) return null;

        const delta = score - positionSkill.threshold;
        return {
            delta,
            isAbove: delta > 0,
            isBelow: delta < 0,
            isMet: delta >= 0,
        };
    };

    const calculateCompletionProgress = useCallback(() => {
        if (competenceValues.length === 0) return 0;

        const completedCount = competenceValues.filter(cv => {
            const hasScore = (scoreValues[cv.competenceId] ?? 0) > 0;
            return hasScore;
        }).length;

        return Math.round((completedCount / competenceValues.length) * 100);
    }, [competenceValues, scoreValues]);

    const renderStarRating = (skillId: string, currentScore: number, disabled: boolean) => {
        return (
            <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map(star => (
                    <button
                        key={star}
                        type="button"
                        disabled={disabled}
                        onClick={() => !disabled && handleScoreChange(skillId, star)}
                        className={`p-1 rounded transition-colors ${
                            disabled
                                ? "cursor-not-allowed opacity-50"
                                : "hover:bg-gray-100 dark:hover:bg-gray-800"
                        }`}
                    >
                        <Star
                            className={`w-6 h-6 transition-colors ${
                                star <= currentScore
                                    ? "fill-yellow-400 text-yellow-400"
                                    : "text-gray-300 dark:text-gray-600"
                            }`}
                        />
                    </button>
                ))}
                <span className="ml-2 text-sm font-medium">
                    {currentScore > 0 ? `${currentScore}/5` : "Not rated"}
                </span>
            </div>
        );
    };

    if (!competenceValues || competenceValues.length === 0) {
        return (
            <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                    <AlertTriangle className="w-12 h-12 text-amber-500 mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Competencies Mapped</h3>
                    <p className="text-gray-600 dark:text-gray-400 text-center mb-4">
                        No competencies are currently mapped to your position. Contact HR to set up
                        your competency profile.
                    </p>
                    <Button variant="outline">Contact HR</Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            {/* Locked State Alert */}
            {(hasFinalizedAssessment || isLocallyFinalized) && (
                <Alert className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
                    <Lock className="w-4 h-4 text-blue-600" />
                    <AlertDescription className="text-blue-800 dark:text-blue-200">
                        <div className="font-semibold">Self-Assessment Finalized</div>
                        <p className="text-sm mt-1">
                            Your competency self-assessment has been finalized and can no longer be
                            edited.
                        </p>
                    </AlertDescription>
                </Alert>
            )}

            {/* Deadline Info Alert */}
            {!isAbleToEdit && !hasFinalizedAssessment && !isLocallyFinalized && (
                <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                    <AlertDescription className="text-red-800 dark:text-red-200">
                        <div className="font-semibold">Self-Assessment Period Closed</div>
                        {deadline && (
                            <p className="text-sm mt-1">
                                The self-assessment deadline was {deadline}.
                            </p>
                        )}
                    </AlertDescription>
                </Alert>
            )}

            {/* Validation Errors Alert */}
            {validationErrors.length > 0 && (
                <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
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
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                    ) : (
                        <AlertTriangle className="w-4 h-4 text-red-600" />
                    )}
                    <AlertDescription
                        className={
                            saveResult.success
                                ? "text-green-800 dark:text-green-200"
                                : "text-red-800 dark:text-red-200"
                        }
                    >
                        {saveResult.message}
                    </AlertDescription>
                </Alert>
            )}

            {/* Info Bar */}
            {isAbleToEdit && (
                <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950">
                    <Clock className="w-4 h-4" />
                    <AlertDescription>
                        {deadline ? (
                            <>
                                Self-Assessment closes on <strong>{deadline}</strong>. Rate your
                                current mastery against the expected threshold.
                            </>
                        ) : (
                            "Rate your current mastery against the expected threshold for each competence."
                        )}
                    </AlertDescription>
                </Alert>
            )}

            {/* Progress Overview */}
            <Card className={`${theme === "dark" ? "bg-black" : "bg-white"}`}>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-lg text-foreground">
                            Assessment Progress
                        </CardTitle>
                        <Badge variant="outline" className="text-sm">
                            {calculateCompletionProgress()}% Complete
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent>
                    <Progress value={calculateCompletionProgress()} className="mb-2" />
                    <p className="text-sm text-foreground">
                        {
                            competenceValues.filter(cv => (scoreValues[cv.competenceId] ?? 0) > 0)
                                .length
                        }{" "}
                        of {competenceValues.length} competencies assessed
                    </p>
                </CardContent>
            </Card>

            {/* Skills Assessment */}
            <div className="space-y-4">
                {competenceValues.map(competenceValue => {
                    const competence = competencies.find(
                        s => s.id === competenceValue.competenceId,
                    );
                    if (!competence) return null;

                    const currentScore = scoreValues[competence.id] || 0;
                    const delta = getThresholdDelta(competence.id, currentScore);

                    return (
                        <Card
                            key={competence.id}
                            className={`"relative" ${theme === "dark" ? "bg-black" : "bg-white"}`}
                        >
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div
                                            className={`flex items-center gap-3 mb-2 ${theme === "dark" ? "text-white" : "text-black"}`}
                                        >
                                            <CardTitle className="text-xl">
                                                {competence.competenceName}
                                            </CardTitle>
                                            <Badge
                                                variant="secondary"
                                                className={`"text-xs" ${theme === "dark" ? "text-white" : "text-black"}`}
                                            >
                                                Expected ≥{competenceValue.threshold}
                                            </Badge>
                                            {competenceValue.weight && (
                                                <Badge
                                                    variant="outline"
                                                    className={`"text-xs" ${theme === "dark" ? "text-white" : "text-black"}`}
                                                >
                                                    Weight {competenceValue.weight}%
                                                </Badge>
                                            )}
                                        </div>
                                        {competence.competenceType && (
                                            <p
                                                className={`"text-sm" ${theme === "dark" ? "text-white" : "text-black"}`}
                                            >
                                                {competence.competenceType}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </CardHeader>

                            <CardContent className="space-y-4">
                                {/* Rating Control */}
                                <div>
                                    <label
                                        className={`"text-sm font-medium mb-2 block" ${theme === "dark" ? "text-white" : "text-black"}`}
                                    >
                                        Rate Your Current Mastery
                                    </label>
                                    {renderStarRating(competence.id, currentScore, !isAbleToEdit)}

                                    {/* Delta Hint */}
                                    {delta && (
                                        <div
                                            className={`flex items-center gap-2 mt-2 text-sm ${
                                                delta.isAbove
                                                    ? "text-green-600 dark:text-green-400"
                                                    : delta.isBelow
                                                        ? "text-red-600 dark:text-red-400"
                                                        : "text-gray-600 dark:text-gray-400"
                                            }`}
                                        >
                                            {delta.isAbove ? (
                                                <>
                                                    <TrendingUp className="w-4 h-4" />
                                                    You're {delta.delta} above threshold
                                                </>
                                            ) : delta.isBelow ? (
                                                <>
                                                    <TrendingDown className="w-4 h-4" />
                                                    You're {Math.abs(delta.delta)} below threshold
                                                </>
                                            ) : (
                                                <>
                                                    <Minus className="w-4 h-4" />
                                                    You meet the threshold
                                                </>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <Separator />

                                {/* Comment */}
                                <div>
                                    <label
                                        className={`"text-sm font-medium mb-2 block" ${theme === "dark" ? "text-white" : "text-black"}`}
                                    >
                                        Comments (Optional)
                                    </label>
                                    <Textarea
                                        placeholder="Share details about your experience, achievements, or areas for improvement..."
                                        value={comments[competence.id] || ""}
                                        onChange={e =>
                                            handleCommentChange(competence.id, e.target.value)
                                        }
                                        disabled={!isAbleToEdit}
                                        className={`"min-h-[80px]" ${theme === "dark" ? "text-white" : "text-black"}`}
                                    />
                                </div>

                                {/* Evidence */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-md">
                                            Supporting Evidence
                                        </CardTitle>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            Attach a single file or link as overall evidence for
                                            your assessment.
                                        </p>
                                    </CardHeader>
                                    <CardContent>
                                        {/* Display chosen evidence */}
                                        <div className="space-y-2 mb-4">
                                            {evidenceFiles[competence.id] && (
                                                <div className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 dark:bg-gray-800">
                                                    <FileText className="w-4 h-4 text-blue-500" />
                                                    <span className="text-sm flex-1 truncate">
                                                        {evidenceFiles[competence.id]
                                                            .split("/")
                                                            .pop()}
                                                    </span>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => {
                                                            setEvidenceFiles(prev => {
                                                                const newFiles = { ...prev };
                                                                delete newFiles[competence.id];
                                                                hasUnsavedChanges.current = true;
                                                                return newFiles;
                                                            });
                                                        }}
                                                    >
                                                        Remove
                                                    </Button>
                                                </div>
                                            )}
                                            {evidenceLinks[competence.id] && (
                                                <div className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 dark:bg-gray-800">
                                                    <Link2 className="w-4 h-4 text-green-500" />
                                                    <a
                                                        href={evidenceLinks[competence.id]}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-sm flex-1 truncate"
                                                    >
                                                        {evidenceLinks[competence.id]}
                                                    </a>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => {
                                                            setEvidenceLinks(prev => {
                                                                const newLinks = { ...prev };
                                                                delete newLinks[competence.id];
                                                                hasUnsavedChanges.current = true;
                                                                return newLinks;
                                                            });
                                                        }}
                                                    >
                                                        Remove
                                                    </Button>
                                                </div>
                                            )}
                                        </div>

                                        {/* Action buttons */}
                                        {isAbleToEdit && (
                                            <div className="flex gap-2">
                                                <div className="relative">
                                                    <input
                                                        type="file"
                                                        id={`evidence-file-upload-${competence.id}`}
                                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                        onChange={e => {
                                                            const file = e.target.files?.[0];
                                                            if (file)
                                                                handleEvidenceFile(
                                                                    competence.id,
                                                                    file,
                                                                );
                                                        }}
                                                        disabled={!!evidenceFiles[competence.id]}
                                                    />
                                                    <Button
                                                        asChild
                                                        variant="outline"
                                                        size="sm"
                                                        disabled={
                                                            !!evidenceFiles[competence.id] ||
                                                            uploadingEvidence[competence.id]
                                                        }
                                                    >
                                                        <div>
                                                            <Upload className="w-4 h-4 mr-2" />
                                                            {uploadingEvidence[competence.id]
                                                                ? "Uploading..."
                                                                : "Upload File"}
                                                        </div>
                                                    </Button>
                                                </div>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    disabled={!!evidenceLinks[competence.id]}
                                                    onClick={() => openLinkDialog(competence.id)}
                                                >
                                                    <Link2 className="w-4 h-4 mr-2" />
                                                    Add Link
                                                </Button>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Bottom Actions */}
            <Card>
                <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            {lastSaved && (
                                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                    <Save className="w-4 h-4" />
                                    Last saved: {lastSaved.toLocaleTimeString()}
                                </div>
                            )}
                        </div>

                        {/* Show different buttons based on edit state */}
                        {isAbleToEdit ? (
                            <div className="flex items-center gap-3">
                                <Button
                                    variant="outline"
                                    onClick={handleSaveForLater}
                                    disabled={isSaving || isSubmitting}
                                    className="min-w-[140px]"
                                >
                                    {isSaving ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="w-4 h-4 mr-2" />
                                            Save for Later
                                        </>
                                    )}
                                </Button>
                                <Button
                                    onClick={handleFinalizeClick}
                                    disabled={isSubmitting || isSaving}
                                    className="min-w-[160px]"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Finalizing...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle2 className="w-4 h-4 mr-2" />
                                            Finalize Assessment
                                        </>
                                    )}
                                </Button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 text-gray-500">
                                <Lock className="w-4 w-4" />
                                <span className="text-sm">Assessment locked</span>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Finalize Confirmation Dialog */}
            <FinalizeConfirmationDialog
                open={showFinalizeDialog}
                onOpenChange={setShowFinalizeDialog}
                onConfirm={handleFinalizeAssessment}
                assessmentType="competency-self"
                isSubmitting={isSubmitting}
            />

            <AlertDialog open={isLinkAlertOpen} onOpenChange={setIsLinkAlertOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            Add Evidence Link for{" "}
                            {currentCompetency &&
                                competencies?.find(c => c.id === currentCompetency)?.competenceName}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Please paste the URL of your supporting evidence below. Ensure the link
                            is publicly accessible if required.
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    <div className="py-2">
                        <Input
                            id="link-input"
                            placeholder="https://example.com/my-portfolio"
                            value={linkInputValue}
                            onChange={e => setLinkInputValue(e.target.value)}
                        />
                    </div>

                    <AlertDialogFooter>
                        <AlertDialogCancel
                            onClick={() => {
                                setLinkInputValue("");
                                setCurrentCompetency(null);
                            }}
                        >
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => {
                                if (currentCompetency) {
                                    const competence = competencies?.find(
                                        c => c.id === currentCompetency,
                                    );
                                    if (competence) {
                                        handleEvidenceLink(
                                            currentCompetency,
                                            linkInputValue,
                                            competence.competenceName,
                                        );
                                    }
                                }
                            }}
                        >
                            Save Link
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
