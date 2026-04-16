"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useFirestore } from "@/context/firestore-context";
import { useToast } from "@/context/toastContext";
import { useConfirm } from "@/hooks/use-confirm-dialog";
import EvaluationSuccessView from "./evaluation-success-view";
import { updateJobApplication } from "@/lib/backend/api/talent-acquisition/job-application-service";
import { updateJobPost } from "@/lib/backend/api/talent-acquisition/job-post-service";
import { getApplicantName } from "@/lib/backend/functions/getApplicantName";
import ApplicantModel from "@/lib/models/applicant";
import { EvaluationData, JobApplicationModel } from "@/lib/models/job-application";
import { EvaluatorModel, JobPostModel } from "@/lib/models/job-post";
import { getTimestamp } from "@/lib/util/dayjs_format";
import { Briefcase, Send, User } from "lucide-react";
import { useEffect, useState } from "react";

interface Props {
    jobPost: JobPostModel;
    evaluator: EvaluatorModel;
}

export default function EvaluationFormPage({ jobPost, evaluator }: Props) {
    const { showToast } = useToast();
    const { jobApplications, evaluationMetrics, applicants } = useFirestore();
    const { confirm, ConfirmDialog } = useConfirm();

    const [loading, setLoading] = useState<boolean>(false);
    const [submissionConfirmed, setSubmissionConfirmed] = useState<boolean>(false);
    const [submittedEvaluation, setSubmittedEvaluation] = useState<any>(null);
    const [isReadOnly, setIsReadOnly] = useState<boolean>(false);

    const evaluationMetric = evaluationMetrics.find(
        evaluation => evaluation.id === jobPost.associatedEvaluationMetrics,
    );
    const applicationsForThisJobPost = jobApplications
        .filter(application => application.jobPostId === jobPost.id)
        .filter(
            application =>
                !application?.evaluations?.some(e => e.evaluator.code === evaluator.code),
        );

    // Only include applicants who haven't been evaluated by this evaluator
    const applicantIds = applicationsForThisJobPost.map(application => application.applicantId);
    const applicantsForThisJob = applicants.filter(a => applicantIds.includes(a.id));
    const [applicant, setApplicant] = useState<ApplicantModel | null>(
        applicantsForThisJob[0] ?? null,
    );

    const [selectedApplicant, setSelectedApplicant] = useState<string | null>(
        applicant ? applicant.id : null,
    );
    useEffect(() => {
        if (applicant) setSelectedApplicant(applicant.id);
    }, [applicant]);

    // Update applicants when data changes (after evaluation submission)
    useEffect(() => {
        const updatedApplicantIds = applicationsForThisJobPost.map(
            application => application.applicantId,
        );
        const updatedApplicantsForThisJob = applicants.filter(a =>
            updatedApplicantIds.includes(a.id),
        );

        // If current applicant is no longer in the list, select the first available
        if (applicant && !updatedApplicantsForThisJob.find(a => a.id === applicant.id)) {
            const nextApplicant = updatedApplicantsForThisJob[0] ?? null;
            setApplicant(nextApplicant);
            setSelectedApplicant(nextApplicant ? nextApplicant.id : null);
        }
        // If no applicant is selected but there's available applicants, select the first
        else if (!applicant && updatedApplicantsForThisJob.length > 0) {
            const nextApplicant = updatedApplicantsForThisJob[0] ?? null;
            setApplicant(nextApplicant);
            setSelectedApplicant(nextApplicant ? nextApplicant.id : null);
        }
    }, [jobApplications, applicants, evaluator.code, jobPost.id]);

    // Ensure applicant is set when available
    useEffect(() => {
        if (!applicant && applicantsForThisJob.length > 0) {
            const nextApplicant = applicantsForThisJob[0];
            setApplicant(nextApplicant);
            setSelectedApplicant(nextApplicant.id);
        }
    }, [applicant, applicantsForThisJob]);

    const [formData, setFormData] = useState({
        behaviorAssessment: "",
        technicalAssessment: "",
        generalComment: "",
        metrics:
            evaluationMetric?.metrics.reduce(
                (acc, metric) => {
                    acc[metric.name] = "";
                    return acc;
                },
                {} as Record<string, string>,
            ) ?? {},
    });

    const resetFields = () => {
        setFormData({
            behaviorAssessment: "",
            technicalAssessment: "",
            generalComment: "",
            metrics:
                evaluationMetric?.metrics.reduce(
                    (acc, metric) => {
                        acc[metric.name] = "";
                        return acc;
                    },
                    {} as Record<string, string>,
                ) ?? {},
        });

        // Clear current selection - useEffect will handle selecting the next available applicant
        setApplicant(null);
        setSelectedApplicant(null);
    };

    const handleMetricChange = (metricName: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            metrics: {
                ...prev.metrics,
                [metricName]: value,
            },
        }));
    };

    const handleTextChange = (field: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            [field]: value,
        }));
    };

    const getScoreLabel = (score: string) => {
        const labels = {
            "1": "Poor",
            "2": "Below Average",
            "3": "Average",
            "4": "Good",
            "5": "Excellent",
        };
        return labels[score as keyof typeof labels] || "";
    };

    const validateForm = (): boolean => {
        // check if an applicant is chosen
        if (selectedApplicant === null) {
            showToast("Please choose an applicant.", "Warning", "warning");
            return false;
        }

        // Check text fields
        if (
            !formData.behaviorAssessment.trim() ||
            !formData.technicalAssessment.trim() ||
            !formData.generalComment.trim()
        ) {
            showToast("Please fill all text fields", "Error", "error");
            return false;
        }

        // Check character limits
        if (
            formData.behaviorAssessment.length > 1000 ||
            formData.technicalAssessment.length > 1000 ||
            formData.generalComment.length > 1000
        ) {
            showToast("Text fields exceed maximum character limit (1000)", "Error", "error");
            return false;
        }

        // Check if all metrics are filled (only if evaluationMetric exists)
        if (evaluationMetric) {
            const allMetricsFilled = evaluationMetric.metrics.every(
                metric =>
                    formData.metrics[metric.name] && formData.metrics[metric.name].trim() !== "",
            );

            if (!allMetricsFilled) {
                showToast("Please rate all evaluation metrics", "Error", "error");
                return false;
            }
        }

        return true;
    };

    const formatEvaluationData = (status: "draft" | "submitted"): EvaluationData => {
        if (!applicant || !jobPost) {
            throw new Error("Required data is missing");
        }

        let metricsWithScores: any[] = [];
        let weightedScore = 0;
        let passedThreshold = true;

        if (evaluationMetric) {
            metricsWithScores = evaluationMetric.metrics.map(metric => {
                const rawScore = formData.metrics[metric.name];
                const score = parseInt(rawScore);
                if (isNaN(score) || score < 1 || score > 5) {
                    throw new Error(`Invalid score for "${metric.name}". Must be between 1 and 5.`);
                }

                return {
                    name: metric.name,
                    score: score,
                    threshold: metric.threshold,
                    weight: metric.weight,
                };
            });

            const totalScore = metricsWithScores.reduce((sum, m) => sum + m.score, 0);
            const avgScore = totalScore / metricsWithScores.length;

            weightedScore = metricsWithScores.reduce(
                (sum, m) => sum + (m.score * m.weight) / 100,
                0,
            );

            passedThreshold = metricsWithScores.every(m => m.score >= m.threshold);
        }

        return {
            evaluator,
            behaviorAssessment: formData.behaviorAssessment.trim(),
            technicalAssessment: formData.technicalAssessment.trim(),
            generalComment: formData.generalComment.trim(),
            metrics: metricsWithScores,
            interviewDate: getTimestamp(),
            evaluationDate: getTimestamp(),
            status,
            weightedScore: parseFloat(weightedScore.toFixed(2)),
            passedThreshold,
        };
    };

    const handleSaveDraft = () => {
        if (!validateForm()) return;

        try {
            const evaluationData = formatEvaluationData("draft");
            console.log("Saving draft:", evaluationData);
            // Add save draft logic here
            showToast("Draft saved successfully", "Success", "success");
        } catch (error) {
            console.error("Error saving draft:", error);
            showToast("Error saving draft", "Error", "error");
        }
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;

        setLoading(true);

        try {
            const evaluationData = formatEvaluationData("submitted");
            const thisJobApplication = jobApplications.find(
                application =>
                    application.jobPostId === jobPost.id &&
                    application.applicantId === selectedApplicant,
            );

            // accept the invitation
            const updatedJobPost: JobPostModel = {
                ...jobPost,
                evaluators: [
                    ...jobPost.evaluators.filter(e => e.id !== evaluator.id),
                    { ...evaluator, status: "Accepted" },
                ],
            };

            if (thisJobApplication) {
                const update: JobApplicationModel = {
                    ...thisJobApplication,
                    // evaluations: [...thisJobApplication?.evaluations, evaluationData],
                    evaluations: [...(thisJobApplication?.evaluations ?? []), evaluationData],
                };

                console.log("update: ", update);

                const res = await updateJobApplication(update);
                if (res && applicant) {
                    // Set submission confirmed state and store evaluation data
                    setSubmissionConfirmed(true);
                    setSubmittedEvaluation(evaluationData);
                    setIsReadOnly(true);
                    showToast(
                        `${getApplicantName(applicant)} has been evaluated!`,
                        "Success",
                        "success",
                    );

                    await updateJobPost(updatedJobPost.id, updatedJobPost)
                        .then(async () => {})
                        .catch(err => {
                            console.error("failed to update job post: ", err);
                        });
                } else showToast(`Action failed. Please try again.`, "Error", "error");
            }
        } catch (error) {
            console.error("Error submitting evaluation:", error);
            showToast("Error submitting evaluation", "Error", "error");
        }

        setLoading(false);
    };

    const handleEvaluateAnother = () => {
        setSubmissionConfirmed(false);
        setSubmittedEvaluation(null);
        setIsReadOnly(false);
        resetFields();
    };

    return (
        <>
            {/* Main Form View */}
            {applicant && selectedApplicant && !submissionConfirmed && (
                <div className="min-h-screen py-8">
                    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                        {/* Header */}
                        <div className="mb-8">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="flex items-center gap-2">
                                    <User className="h-5 w-5" />
                                    <span className="text-lg font-medium">
                                        {getApplicantName(applicant)}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Briefcase className="h-5 w-5" />
                                    <span className="text-lg font-medium">{jobPost.jobTitle}</span>
                                </div>
                            </div>
                            <h1 className="text-3xl font-bold">
                                Evaluation Form for {getApplicantName(applicant)} regarding the
                                position {jobPost.jobTitle}
                            </h1>
                            <p className="mt-2">Interview Date: {getTimestamp()}</p>
                        </div>

                        <div className="my-4 flex justify-center items-center">
                            <Select
                                value={selectedApplicant ?? ""}
                                onValueChange={value => {
                                    if (!isReadOnly) {
                                        setSelectedApplicant(value);
                                        const thisApplicant = applicantsForThisJob.find(
                                            app => app.id === value,
                                        );
                                        if (thisApplicant) setApplicant(thisApplicant);
                                    }
                                }}
                                disabled={isReadOnly}
                            >
                                <SelectTrigger className="max-w">
                                    {getApplicantName(applicant)}
                                </SelectTrigger>
                                <SelectContent>
                                    {applicantsForThisJob.map(applicant => {
                                        return (
                                            <SelectItem key={applicant.id} value={applicant.id}>
                                                {getApplicantName(applicant)}
                                            </SelectItem>
                                        );
                                    })}
                                </SelectContent>
                            </Select>
                        </div>

                        <form className="space-y-8">
                            {/* Behavior Assessment Section */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-xl">
                                        Behavior Assessment Section
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <Textarea
                                        placeholder="Evaluate the candidate's behavior, attitude, and interpersonal skills during the interview..."
                                        value={formData.behaviorAssessment}
                                        onChange={e => {
                                            if (!isReadOnly) {
                                                handleTextChange(
                                                    "behaviorAssessment",
                                                    e.target.value,
                                                );
                                            }
                                        }}
                                        className="min-h-[150px] resize-none"
                                        disabled={isReadOnly}
                                    />
                                    <p className="text-sm mt-2">
                                        {formData.behaviorAssessment.length}/1000 characters
                                    </p>
                                </CardContent>
                            </Card>

                            {/* Technical Assessment Section */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-xl">
                                        Technical Assessment Section
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <Textarea
                                        placeholder="Assess the candidate's technical competencies, knowledge, and problem-solving approach..."
                                        value={formData.technicalAssessment}
                                        onChange={e => {
                                            if (!isReadOnly) {
                                                handleTextChange(
                                                    "technicalAssessment",
                                                    e.target.value,
                                                );
                                            }
                                        }}
                                        className="min-h-[150px] resize-none"
                                        disabled={isReadOnly}
                                    />
                                    <p className="text-sm mt-2">
                                        {formData.technicalAssessment.length}/1000 characters
                                    </p>
                                </CardContent>
                            </Card>

                            {/* Evaluation Metrics */}
                            {evaluationMetric && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-xl">
                                            Evaluation Metrics
                                        </CardTitle>
                                        <p className="">
                                            Rate each metric on a scale of 1-5 based on the
                                            candidate's performance
                                        </p>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        {evaluationMetric.metrics.map((metric, index) => (
                                            <div key={metric.name} className="space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <h3 className="font-semibold text-lg">
                                                            {metric.name}
                                                        </h3>
                                                        <p className="text-sm">
                                                            Threshold: {metric.threshold}/5 •
                                                            Weight: {metric.weight}%
                                                        </p>
                                                    </div>
                                                    <div className="text-sm">
                                                        {formData.metrics[metric.name] && (
                                                            <span className="font-medium">
                                                                Selected:{" "}
                                                                {formData.metrics[metric.name]}/5 -{" "}
                                                                {getScoreLabel(
                                                                    formData.metrics[metric.name],
                                                                )}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                <RadioGroup
                                                    value={formData.metrics[metric.name] || ""}
                                                    onValueChange={value => {
                                                        if (!isReadOnly) {
                                                            handleMetricChange(metric.name, value);
                                                        }
                                                    }}
                                                    className="flex gap-8"
                                                    disabled={isReadOnly}
                                                >
                                                    {[1, 2, 3, 4, 5].map(score => (
                                                        <div
                                                            key={score}
                                                            className="flex items-center space-x-2"
                                                        >
                                                            <RadioGroupItem
                                                                value={score.toString()}
                                                                id={`${metric.name}-${score}`}
                                                            />
                                                            <Label
                                                                htmlFor={`${metric.name}-${score}`}
                                                                className="cursor-pointer font-medium"
                                                            >
                                                                {score}
                                                            </Label>
                                                            <span className="text-xs">
                                                                {getScoreLabel(score.toString())}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </RadioGroup>

                                                {index < evaluationMetric.metrics.length - 1 && (
                                                    <Separator className="mt-6" />
                                                )}
                                            </div>
                                        ))}

                                        <div className="p-4 rounded-lg">
                                            <p className="text-sm font-medium">
                                                Total Weight:{" "}
                                                {evaluationMetric.metrics.reduce(
                                                    (sum, metric) => sum + metric.weight,
                                                    0,
                                                )}
                                                %
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* General Comment */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-xl">General Comment</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <Textarea
                                        placeholder="Provide overall feedback, recommendations, and any additional observations about the candidate..."
                                        value={formData.generalComment}
                                        onChange={e => {
                                            if (!isReadOnly) {
                                                handleTextChange("generalComment", e.target.value);
                                            }
                                        }}
                                        className="min-h-[150px] resize-none"
                                        disabled={isReadOnly}
                                    />
                                    <p className="text-sm mt-2">
                                        {formData.generalComment.length}/1000 characters
                                    </p>
                                </CardContent>
                            </Card>

                            {/* Action Buttons */}
                            <div className="flex gap-4 justify-end pt-6 border-t">
                                <Button
                                    type="button"
                                    onClick={() => {
                                        if (validateForm()) {
                                            confirm(
                                                `Are you sure you want to submit the evaluation for ${applicant ? getApplicantName(applicant) : "this applicant"}? This action cannot be undone.`,
                                                handleSubmit,
                                                true,
                                            );
                                        }
                                    }}
                                    className="flex items-center gap-2"
                                    disabled={loading || isReadOnly}
                                >
                                    <Send className="h-4 w-4" />
                                    {loading ? "Processing ..." : "Submit Evaluation"}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Success View */}
            {submissionConfirmed && submittedEvaluation && (
                <EvaluationSuccessView
                    jobPost={jobPost}
                    applicant={applicant}
                    submittedEvaluation={submittedEvaluation}
                    onEvaluateAnother={handleEvaluateAnother}
                />
            )}

            {/* No applicants fallback */}
            {applicantsForThisJob.length === 0 && (
                <div className="max-w h-screen flex justify-center items-center">
                    <div className="flex flex-col items-center justify-center h-64 text-center">
                        <svg
                            className="w-12 h-12 mb-4"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={1.5}
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                            />
                        </svg>
                        <h2 className="text-lg font-medium">
                            No applicants to evaluate at this time
                        </h2>
                        <p className="mt-2 text-sm">
                            You have evaluated all applicants for this job post. Please check back
                            later.
                        </p>
                    </div>
                </div>
            )}

            {/* Confirmation Dialog - Always rendered */}
            {ConfirmDialog}
        </>
    );
}
