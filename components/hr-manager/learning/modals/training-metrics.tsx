"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
    UserX,
    UserCheck,
    CheckCircle2,
    ClipboardCheck,
    Award,
    MessageSquare,
    Star,
} from "lucide-react";
import { EmployeesFeedbackModal } from "./employees-feedback";
import { TrainingMaterialRequestModel } from "@/lib/models/training-material";
import { useFirestore } from "@/context/firestore-context";
import { isAssigned } from "@/components/employee/training-management/employee-learning";

interface TrainingMetricsModalProps {
    isOpen: boolean;
    onClose: () => void;
    trainingMaterial: TrainingMaterialRequestModel | null;
}

export function TrainingMetricsModal({
    isOpen,
    onClose,
    trainingMaterial,
}: TrainingMetricsModalProps) {
    const { employees, quizzes } = useFirestore();
    const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);

    // Calculate real metrics based on assigned employees and their training status
    const assignedEmployees = trainingMaterial
        ? employees.filter(employee => isAssigned(trainingMaterial, employee))
        : [];

    const trainingStatuses = assignedEmployees.map(employee => {
        const materialStatus = employee?.trainingMaterialStatus?.find(
            tms => tms.trainingMaterialID === trainingMaterial?.id,
        );
        return materialStatus?.status || "Set";
    });

    const notStartedCount = trainingStatuses.filter(status => status === "Set").length;
    const startedCount = trainingStatuses.filter(status => status === "In progress").length;
    const completedCount = trainingStatuses.filter(status => status === "Completed").length;
    const totalTrainees = assignedEmployees.length;

    // Calculate quiz metrics - include quiz info for each result
    const quizResultsWithInfo =
        trainingMaterial?.associatedQuiz?.flatMap(quizId => {
            const quiz = quizzes.find(q => q.id === quizId);
            if (!quiz?.quizTakenTimestamp) return [];

            return quiz.quizTakenTimestamp.map(result => ({
                ...result,
                quizId: quiz.id,
                passingRate: quiz.passingRate,
            }));
        }) || [];

    const quizTakenCount = quizResultsWithInfo.length;
    const quizPassingCount = quizResultsWithInfo.filter(
        result => result.score >= result.passingRate,
    ).length;

    // Calculate average rating from employee feedbacks
    const feedbacks = trainingMaterial?.employeeFeedbacks || [];
    const averageRating =
        feedbacks.length > 0
            ? feedbacks.reduce((sum, feedback) => sum + feedback.rating, 0) / feedbacks.length
            : 0;

    const metrics = {
        notStarted: {
            percentage: totalTrainees > 0 ? Math.round((notStartedCount / totalTrainees) * 100) : 0,
            statusCount: notStartedCount,
            totalTrainees,
        },
        started: {
            percentage: totalTrainees > 0 ? Math.round((startedCount / totalTrainees) * 100) : 0,
            statusCount: startedCount,
            totalTrainees,
        },
        completed: {
            percentage: totalTrainees > 0 ? Math.round((completedCount / totalTrainees) * 100) : 0,
            statusCount: completedCount,
            totalTrainees,
        },
        quizTaken: {
            percentage: totalTrainees > 0 ? Math.round((quizTakenCount / totalTrainees) * 100) : 0,
            takenCount: quizTakenCount,
            totalTrainees,
        },
        quizPassing: {
            percentage:
                quizTakenCount > 0 ? Math.round((quizPassingCount / quizTakenCount) * 100) : 0,
            passedCount: quizPassingCount,
            takenCount: quizTakenCount,
        },
    };

    const metricCards = [
        {
            title: "Trainees who haven't started training percentage",
            value: `${metrics.notStarted.percentage}`,
            icon: UserX,
            gradient: "from-red-50 to-red-100 dark:from-red-950/20 dark:to-red-900/20",
            iconColor: "text-red-600 dark:text-red-400",
            details: [
                `Number of trainees with the status "Set": ${metrics.notStarted.statusCount}`,
                `Number of trainees: ${metrics.notStarted.totalTrainees}`,
            ],
        },
        {
            title: "Trainees who have started training percentage",
            value: `${metrics.started.percentage}`,
            icon: UserCheck,
            gradient: "from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20",
            iconColor: "text-blue-600 dark:text-blue-400",
            details: [
                `Number of trainees with the status "Inprogress": ${metrics.started.statusCount}`,
                `Number of trainees: ${metrics.started.totalTrainees}`,
            ],
        },
        {
            title: "Trainees who have completed the training percentage",
            value: `${metrics.completed.percentage}`,
            icon: CheckCircle2,
            gradient: "from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20",
            iconColor: "text-green-600 dark:text-green-400",
            details: [
                `Number of trainees with the status "Completed": ${metrics.completed.statusCount}`,
                `Number of trainees: ${metrics.completed.totalTrainees}`,
            ],
        },
        {
            title: "Quiz taken percentage",
            value: `${metrics.quizTaken.percentage}`,
            icon: ClipboardCheck,
            gradient: "from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/20",
            iconColor: "text-purple-600 dark:text-purple-400",
            details: [
                `Number of trainees that took training quiz: ${metrics.quizTaken.takenCount}`,
                `Number of trainees: ${metrics.quizTaken.totalTrainees}`,
            ],
        },
    ];

    return (
        <>
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold text-brand-800 dark:text-white">
                            Training Metrics
                            {trainingMaterial && (
                                <span className="block text-sm font-normal text-muted-foreground mt-1">
                                    {trainingMaterial.name}
                                </span>
                            )}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-6 py-4">
                        {/* Top 4 metrics in 2x2 grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {metricCards.map((metric, index) => (
                                <Card
                                    key={index}
                                    className="overflow-hidden border-2 border-accent-200 dark:border-border hover:shadow-lg transition-shadow"
                                >
                                    <div className="bg-gradient-to-r from-brand-700 to-brand-800 dark:from-brand-800 dark:to-brand-900 p-4">
                                        <div className="flex items-center gap-3">
                                            <div
                                                className={`p-2 bg-white/10 rounded-lg ${metric.iconColor}`}
                                            >
                                                <metric.icon className="h-5 w-5 text-white" />
                                            </div>
                                            <h3 className="text-sm font-medium text-white leading-tight">
                                                {metric.title}
                                            </h3>
                                        </div>
                                    </div>
                                    <CardContent
                                        className={`p-6 bg-gradient-to-br ${metric.gradient}`}
                                    >
                                        <div className="text-center space-y-3">
                                            <div className="text-5xl font-bold text-brand-800 dark:text-brand-600">
                                                {metric.value}
                                            </div>
                                            <div className="space-y-1">
                                                {metric.details.map((detail, idx) => (
                                                    <p
                                                        key={idx}
                                                        className="text-sm text-muted-foreground"
                                                    >
                                                        {detail}
                                                    </p>
                                                ))}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        {/* Quiz passing percentage - centered */}
                        <div className="flex justify-center">
                            <Card className="w-full md:w-2/3 overflow-hidden border-2 border-accent-200 dark:border-border hover:shadow-lg transition-shadow">
                                <div className="bg-gradient-to-r from-brand-700 to-brand-800 dark:from-brand-800 dark:to-brand-900 p-4">
                                    <div className="flex items-center justify-center gap-3">
                                        <div className="p-2 bg-white/10 rounded-lg">
                                            <Award className="h-5 w-5 text-amber-300" />
                                        </div>
                                        <h3 className="text-sm font-medium text-white">
                                            Quiz passing percentage
                                        </h3>
                                    </div>
                                </div>
                                <CardContent className="p-6 bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/20 dark:to-amber-900/20">
                                    <div className="text-center space-y-3">
                                        <div className="text-5xl font-bold text-brand-800 dark:text-brand-600">
                                            {metrics.quizPassing.percentage}%
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-sm text-muted-foreground">
                                                Number of trainees who passed the training quiz:{" "}
                                                {metrics.quizPassing.passedCount}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                Number of trainees who took the training quiz:{" "}
                                                {metrics.quizPassing.takenCount}
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Five Star Rating Display and Trainees Feedback Button */}
                        <div className="flex items-center justify-between pt-4">
                            {/* Five Star Rating Display */}
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-brand-800 dark:text-white mr-2">
                                    Average Rating:
                                </span>
                                <div className="flex items-center gap-1">
                                    {[1, 2, 3, 4, 5].map(star => (
                                        <Star
                                            key={star}
                                            className={`h-6 w-6 ${
                                                star <= Math.round(averageRating)
                                                    ? "fill-amber-400 text-amber-400"
                                                    : "fill-gray-300 text-gray-300 dark:fill-gray-600 dark:text-gray-600"
                                            }`}
                                        />
                                    ))}
                                    <span className="ml-2 text-sm font-medium text-brand-800 dark:text-white">
                                        {averageRating.toFixed(1)} ({feedbacks.length} reviews)
                                    </span>
                                </div>
                            </div>

                            {/* Trainees Feedback Button */}
                            <Button
                                size="lg"
                                className="bg-brand-700 hover:bg-brand-800 text-white"
                                onClick={() => {
                                    setIsFeedbackModalOpen(true);
                                }}
                            >
                                <MessageSquare className="h-4 w-4 mr-2" />
                                Trainees Feedback
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <EmployeesFeedbackModal
                isOpen={isFeedbackModalOpen}
                onClose={() => setIsFeedbackModalOpen(false)}
                trainingMaterial={trainingMaterial}
            />
        </>
    );
}
