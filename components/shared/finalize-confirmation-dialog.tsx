"use client";

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
import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertTriangle, Calculator, Lock, ArrowRight } from "lucide-react";

export type AssessmentType =
    | "objective-self"
    | "objective-manager"
    | "competency-self"
    | "competency-manager";

interface FinalizeConfirmationDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
    assessmentType: AssessmentType;
    willCalculateEPS?: boolean;
    isSubmitting?: boolean;
    employeeName?: string;
}

const getAssessmentTypeInfo = (type: AssessmentType) => {
    switch (type) {
        case "objective-self":
            return {
                title: "Finalize Objective Self-Assessment",
                warning:
                    "Once finalized, you will not be able to make any changes to your self-assessment.",
                actionLabel: "Finalize Self-Assessment",
            };
        case "objective-manager":
            return {
                title: "Finalize Manager Objective Review",
                warning: "Once finalized, you will not be able to make any changes to this review.",
                actionLabel: "Finalize Review",
            };
        case "competency-self":
            return {
                title: "Finalize Competency Self-Assessment",
                warning:
                    "Once finalized, you will not be able to make any changes to your self-assessment.",
                actionLabel: "Finalize Self-Assessment",
            };
        case "competency-manager":
            return {
                title: "Finalize Manager Competency Review",
                warning: "Once finalized, you will not be able to make any changes to this review.",
                actionLabel: "Finalize Review",
            };
    }
};

export function FinalizeConfirmationDialog({
    open,
    onOpenChange,
    onConfirm,
    assessmentType,
    willCalculateEPS = false,
    isSubmitting = false,
    employeeName,
}: FinalizeConfirmationDialogProps) {
    const typeInfo = getAssessmentTypeInfo(assessmentType);

    // Get the appropriate description based on type
    const getDescription = () => {
        switch (assessmentType) {
            case "objective-self":
                return "You are about to finalize your objective self-assessment.";
            case "objective-manager":
                return employeeName
                    ? `You are about to finalize the objective review for ${employeeName}.`
                    : "You are about to finalize the objective review.";
            case "competency-self":
                return "You are about to finalize your competency self-assessment.";
            case "competency-manager":
                return employeeName
                    ? `You are about to finalize the competency review for ${employeeName}.`
                    : "You are about to finalize the competency review.";
            default:
                return "You are about to finalize this assessment.";
        }
    };

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent className="max-w-lg">
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                        <Lock className="h-5 w-5 text-brand-600" />
                        {typeInfo.title}
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-left">
                        {getDescription()}
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <div className="space-y-4 py-4">
                    {/* Warning Section */}
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                        <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                        <div className="text-sm">
                            <span className="font-medium text-amber-800 dark:text-amber-200">
                                Important:{" "}
                            </span>
                            <span className="text-amber-700 dark:text-amber-300">
                                Once finalized, you will not be able to make any changes to this
                                assessment.
                            </span>
                        </div>
                    </div>

                    {/* EPS Calculation Section */}
                    {willCalculateEPS && (
                        <div className="flex items-start gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
                            <Calculator className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                            <div className="text-sm">
                                <div className="font-medium text-green-800 dark:text-green-200 mb-1">
                                    EPS Will Be Calculated
                                </div>
                                <div className="text-green-700 dark:text-green-300">
                                    This finalization will complete all required reviews. The
                                    Employee Performance Score (EPS) will be automatically
                                    calculated and recorded.
                                </div>
                                <div className="flex items-center gap-2 mt-2 text-xs text-green-600 dark:text-green-400">
                                    <Badge
                                        variant="outline"
                                        className="bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 border-green-300 dark:border-green-700"
                                    >
                                        Objective Score
                                    </Badge>
                                    <ArrowRight className="h-3 w-3" />
                                    <Badge
                                        variant="outline"
                                        className="bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 border-green-300 dark:border-green-700"
                                    >
                                        Competency Score
                                    </Badge>
                                    <ArrowRight className="h-3 w-3" />
                                    <Badge
                                        variant="outline"
                                        className="bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 border-green-300 dark:border-green-700"
                                    >
                                        EPS
                                    </Badge>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Summary */}
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                        <ul className="list-disc pl-5 space-y-1">
                            <li>Your responses will be locked and saved</li>
                            <li>The assessment will be marked as complete</li>
                            {willCalculateEPS && (
                                <li className="text-green-600 dark:text-green-400 font-medium">
                                    Performance score will be calculated automatically
                                </li>
                            )}
                        </ul>
                    </div>
                </div>

                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={onConfirm}
                        disabled={isSubmitting}
                        className="bg-brand-600 hover:bg-brand-700 text-white"
                    >
                        {isSubmitting ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                Finalizing...
                            </>
                        ) : (
                            <>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                {typeInfo.actionLabel}
                            </>
                        )}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
