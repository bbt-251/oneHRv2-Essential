"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getApplicantName } from "@/lib/backend/functions/getApplicantName";
import ApplicantModel from "@/lib/models/applicant";
import { JobPostModel } from "@/lib/models/job-post";
import { Briefcase, User } from "lucide-react";

interface EvaluationSuccessViewProps {
    jobPost: JobPostModel;
    applicant: ApplicantModel | null;
    submittedEvaluation: any;
    onEvaluateAnother: () => void;
}

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

export default function EvaluationSuccessView({
    jobPost,
    applicant,
    submittedEvaluation,
    onEvaluateAnother,
}: EvaluationSuccessViewProps) {
    return (
        <div className="min-h-screen py-8">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Confirmation Message */}
                <Card className="mb-8 border-green-200 bg-green-50">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="flex-shrink-0">
                                <svg
                                    className="h-8 w-8 text-green-600"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-lg font-medium text-green-800">
                                    Evaluation Submitted Successfully
                                </h3>
                                <p className="text-sm text-green-700">
                                    {applicant
                                        ? `${getApplicantName(applicant)} has been evaluated for the ${jobPost.jobTitle} position.`
                                        : "Evaluation submitted successfully."}
                                </p>
                                <p className="text-xs text-green-600 mt-1">
                                    Submitted on{" "}
                                    {submittedEvaluation.evaluationDate
                                        ? new Date(
                                            submittedEvaluation.evaluationDate,
                                        ).toLocaleString()
                                        : "Just now"}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Read-only Form Display */}
                <div className="space-y-8">
                    {/* Header */}
                    <div className="mb-8">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="flex items-center gap-2">
                                <User className="h-5 w-5" />
                                <span className="text-lg font-medium">
                                    {applicant ? getApplicantName(applicant) : "Applicant"}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Briefcase className="h-5 w-5" />
                                <span className="text-lg font-medium">{jobPost.jobTitle}</span>
                            </div>
                        </div>
                        <h1 className="text-3xl font-bold">
                            Submitted Evaluation for{" "}
                            {applicant ? getApplicantName(applicant) : "Applicant"} regarding the
                            position {jobPost.jobTitle}
                        </h1>
                        <p className="mt-2 text-gray-400">
                            Interview Date:{" "}
                            {submittedEvaluation.interviewDate
                                ? new Date(submittedEvaluation.interviewDate).toLocaleString()
                                : "N/A"}
                        </p>
                    </div>

                    {/* Behavior Assessment Section - Read Only */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-xl">Behavior Assessment Section</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="p-4 bg-gray-50 rounded-lg border">
                                <p className="whitespace-pre-wrap text-gray-400">
                                    {submittedEvaluation.behaviorAssessment ||
                                        "No assessment provided"}
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Technical Assessment Section - Read Only */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-xl">Technical Assessment Section</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="p-4 bg-gray-50 rounded-lg border">
                                <p className="whitespace-pre-wrap text-gray-400">
                                    {submittedEvaluation.technicalAssessment ||
                                        "No assessment provided"}
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Evaluation Metrics - Read Only */}
                    {submittedEvaluation.metrics && submittedEvaluation.metrics.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-xl">Evaluation Metrics</CardTitle>
                                <p className="text-sm text-gray-400">
                                    Submitted ratings for each metric
                                </p>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {submittedEvaluation.metrics.map((metric: any, index: number) => (
                                    <div key={metric.name} className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h3 className="font-semibold text-lg">
                                                    {metric.name}
                                                </h3>
                                                <p className="text-sm text-gray-400">
                                                    Threshold: {metric.threshold}/5 • Weight:{" "}
                                                    {metric.weight}%
                                                </p>
                                            </div>
                                            <div className="text-sm font-medium text-gray-400">
                                                Rating: {metric.score}/5 -{" "}
                                                {getScoreLabel(metric.score.toString())}
                                            </div>
                                        </div>
                                        {index < submittedEvaluation.metrics.length - 1 && (
                                            <Separator className="mt-6" />
                                        )}
                                    </div>
                                ))}

                                <div className="p-4 rounded-lg bg-gray-50 border">
                                    <p className="text-sm font-medium text-gray-400">
                                        Total Weight:{" "}
                                        {submittedEvaluation.metrics.reduce(
                                            (sum: number, metric: any) => sum + metric.weight,
                                            0,
                                        )}
                                        % • Weighted Score:{" "}
                                        {submittedEvaluation.weightedScore?.toFixed(2) || "N/A"} •
                                        Passed Threshold:{" "}
                                        {submittedEvaluation.passedThreshold ? "Yes" : "No"}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* General Comment - Read Only */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-xl">General Comment</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="p-4 bg-gray-50 rounded-lg border">
                                <p className="whitespace-pre-wrap text-gray-400">
                                    {submittedEvaluation.generalComment || "No comment provided"}
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Action Buttons */}
                    <div className="flex gap-4 justify-end pt-6 border-t">
                        <Button
                            type="button"
                            onClick={onEvaluateAnother}
                            className="flex items-center gap-2"
                        >
                            <User className="h-4 w-4" />
                            Evaluate Another Applicant
                        </Button>
                        {/* <Button type="button" variant="outline" onClick={() => window.history.back()} className="flex items-center gap-2">
                            View All Evaluations
                        </Button> */}
                    </div>
                </div>
            </div>
        </div>
    );
}
