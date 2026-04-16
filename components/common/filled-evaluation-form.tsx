"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getApplicantName } from "@/lib/backend/functions/getApplicantName";
import ApplicantModel from "@/lib/models/applicant";
import { EvaluationData, JobApplicationModel } from "@/lib/models/job-application";
import { EvaluatorModel, JobPostModel } from "@/lib/models/job-post";
import { ArrowLeft, Briefcase, Calendar, CheckCircle, Star, User } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Props {
    applicant: ApplicantModel;
    evaluator: EvaluatorModel;
    evaluation: EvaluationData;
    jobPost: JobPostModel;
    jobApplication: JobApplicationModel;
}

export default function FilledEvaluationFormPage({
    applicant,
    evaluator,
    evaluation,
    jobPost,
    jobApplication,
}: Props) {
    const router = useRouter();

    const getScoreLabel = (score: number) => {
        const labels = {
            1: "Poor",
            2: "Below Average",
            3: "Average",
            4: "Good",
            5: "Excellent",
        };
        return labels[score as keyof typeof labels] || "";
    };

    const renderStars = (score: number) => {
        return (
            <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map(star => (
                    <Star
                        key={star}
                        className={`h-4 w-4 ${star <= score ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
                    />
                ))}
            </div>
        );
    };

    function recommendationBadge(weightedScore: number) {
        if (weightedScore >= 4.5) {
            return <Badge className="text-lg px-3 py-1">Strong Fit</Badge>;
        } else if (weightedScore >= 4.0) {
            return <Badge className="text-lg px-3 py-1">Good Fit</Badge>;
        } else if (weightedScore >= 3.0) {
            return <Badge className="text-lg px-3 py-1">Moderate Fit</Badge>;
        } else if (weightedScore >= 2.0) {
            return <Badge className="text-lg px-3 py-1">Weak Fit</Badge>;
        } else {
            return <Badge className="text-lg px-3 py-1">Not Recommended</Badge>;
        }
    }

    const totalWeight = Object.values(evaluation.metrics).reduce(
        (sum, metric) => sum + metric.weight,
        0,
    );
    const passedMetrics = Object.values(evaluation.metrics).filter(
        metric => metric.score >= metric.threshold,
    ).length;
    const totalMetrics = Object.values(evaluation.metrics).length;

    return (
        <div className="min-h-screen py-8">
            {/* Header */}

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-6">
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
                        <Badge variant="secondary">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            {jobApplication.status}
                        </Badge>
                    </div>

                    <h1 className="text-3xl font-bold mb-4">
                        Evaluation Form for {getApplicantName(applicant)} regarding the position{" "}
                        {jobPost.jobTitle}
                    </h1>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span>Interview: {evaluation.interviewDate}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            <span>Evaluator: {evaluator.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4" />
                            <span>Submitted: {evaluation.evaluationDate}</span>
                        </div>
                    </div>
                </div>

                {/* Overall Summary */}
                <Card className="mb-8">
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            <span>Evaluation Summary</span>
                            <Badge className="text-lg px-3 py-1">
                                {recommendationBadge(evaluation.weightedScore)}
                            </Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="text-center">
                                <div className="text-3xl font-bold mb-1">
                                    {evaluation.weightedScore}/5
                                </div>
                                <div className="text-sm">Overall Score</div>
                                <div className="flex justify-center mt-2">
                                    {renderStars(evaluation.weightedScore)}
                                </div>
                            </div>
                            <div className="text-center">
                                <div className="text-3xl font-bold mb-1">
                                    {passedMetrics}/{totalMetrics}
                                </div>
                                <div className="text-sm">Metrics Passed</div>
                            </div>
                            <div className="text-center">
                                <div className="text-3xl font-bold mb-1">{totalWeight}%</div>
                                <div className="text-sm">Total Weight</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="space-y-8">
                    {/* Behavior Assessment Section */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-xl">Behavior Assessment Section</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="p-4 rounded-lg">
                                <p className="leading-relaxed whitespace-pre-wrap">
                                    {evaluation.behaviorAssessment}
                                </p>
                            </div>
                            <p className="text-sm mt-2">
                                {evaluation.behaviorAssessment.length} characters
                            </p>
                        </CardContent>
                    </Card>

                    {/* Technical Assessment Section */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-xl">Technical Assessment Section</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="p-4 rounded-lg">
                                <p className="leading-relaxed whitespace-pre-wrap">
                                    {evaluation.technicalAssessment}
                                </p>
                            </div>
                            <p className="text-sm mt-2">
                                {evaluation.technicalAssessment.length} characters
                            </p>
                        </CardContent>
                    </Card>

                    {/* Evaluation Metrics */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-xl">Evaluation Metrics</CardTitle>
                            <p>Completed evaluation scores for each metric</p>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {Object.entries(evaluation.metrics).map(([name, metric], index) => (
                                <div key={metric.name} className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="font-semibold text-lg">{metric.name}</h3>
                                            <p className="text-sm">
                                                Threshold: {metric.threshold}/5 • Weight:{" "}
                                                {metric.weight}%
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Badge>
                                                    {metric.score >= metric.threshold
                                                        ? "Passed"
                                                        : "Failed"}
                                                </Badge>
                                            </div>
                                            <div className="text-sm">
                                                Score: {metric.score}/5 -{" "}
                                                {getScoreLabel(metric.score)}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between p-4 rounded-lg">
                                        <div className="flex items-center gap-4">
                                            <span className="text-2xl font-bold">
                                                {metric.score}
                                            </span>
                                            <div className="flex flex-col">
                                                <div className="flex items-center gap-2">
                                                    {renderStars(metric.score)}
                                                    <span className="text-sm font-medium">
                                                        {getScoreLabel(metric.score)}
                                                    </span>
                                                </div>
                                                <div className="text-xs mt-1">
                                                    Required: {metric.threshold}/5 or higher
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-lg font-bold">
                                                {metric.score >= metric.threshold ? "✓" : "✗"}
                                            </div>
                                        </div>
                                    </div>

                                    {index < Object.entries(evaluation.metrics).length - 1 && (
                                        <Separator className="mt-6" />
                                    )}
                                </div>
                            ))}

                            <div className="p-4 rounded-lg">
                                <div className="flex justify-between items-center">
                                    <p className="text-sm font-medium">
                                        Total Weight: {totalWeight}% • Metrics Passed:{" "}
                                        {passedMetrics}/{totalMetrics}
                                    </p>
                                    <Badge>Overall: {evaluation.weightedScore}/5</Badge>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* General Comment */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-xl">General Comment</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="p-4 rounded-lg">
                                <p className="leading-relaxed whitespace-pre-wrap">
                                    {evaluation.generalComment}
                                </p>
                            </div>
                            <p className="text-sm mt-2">
                                {evaluation.generalComment.length} characters
                            </p>
                        </CardContent>
                    </Card>

                    {/* Evaluator Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-xl">Evaluator Information</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm">Evaluator Name</p>
                                    <p className="font-medium">{evaluator.name}</p>
                                </div>
                                <div>
                                    <p className="text-sm">Role</p>
                                    <p className="font-medium">{evaluator.role}</p>
                                </div>
                                <div>
                                    <p className="text-sm">Submission Date</p>
                                    <p className="font-medium">{evaluation.evaluationDate}</p>
                                </div>
                                <div>
                                    <p className="text-sm">Status</p>
                                    <Badge>
                                        <CheckCircle className="h-3 w-3 mr-1" />
                                        {evaluation.status}
                                    </Badge>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
