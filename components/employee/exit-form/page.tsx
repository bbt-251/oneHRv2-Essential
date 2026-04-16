"use client";

import type React from "react";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, LogOut, Send, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { ExitInstanceModel } from "@/lib/models/exit-instance";
import { useToast } from "@/context/toastContext";
import {
    createExitInstance,
    updateExitInstance,
} from "@/lib/backend/api/exit-instance/exit-instance-service";
import { useAuth } from "@/context/authContext";
import { useFirestore } from "@/context/firestore-context";
import { Edit } from "lucide-react";
import { EXIT_MANAGEMENT_LOG_MESSAGES } from "@/lib/log-descriptions/exit-management";

export const exitReasons = [
    "Resignation",
    "Retirement",
    "Termination",
    "End of Contract",
    "Career Change",
    "Relocation",
    "Personal Reasons",
    "Health Issues",
    "Better Opportunity",
    "Other",
] as const;

export function ExitForm() {
    const { userData } = useAuth();
    const { exitInstances } = useFirestore();
    const { showToast } = useToast();

    // Find existing exit instance for current user
    const existingExitInstance = exitInstances.find(
        instance => instance.exitEmployeeUID === userData?.uid,
    );

    const [formData, setFormData] = useState<Partial<ExitInstanceModel>>({
        timestamp: existingExitInstance?.timestamp || new Date().toISOString(),
        exitID:
            existingExitInstance?.exitID ||
            `EXIT-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
        exitEmployeeUID: userData?.uid || "",
        exitType: "Voluntary", // Always voluntary for employee submissions
        exitLastDate: existingExitInstance?.exitLastDate || "",
        exitReason: existingExitInstance?.exitReason || "",
        exitReasonDescription: existingExitInstance?.exitReasonDescription || null,
        exitChecklist: existingExitInstance?.exitChecklist || "",
        exitInterview: existingExitInstance?.exitInterview || null,
        exitDocument: existingExitInstance?.exitDocument || "",
        eligibleToRehire: existingExitInstance?.eligibleToRehire ?? true,
        remarks: existingExitInstance?.remarks || null,
        exitEffectiveDate: existingExitInstance?.exitEffectiveDate || "",
        effectiveDateAccepted: existingExitInstance?.effectiveDateAccepted ?? false,
    });

    const [exitDate, setExitDate] = useState<Date | undefined>(
        existingExitInstance?.exitLastDate
            ? new Date(existingExitInstance.exitLastDate)
            : undefined,
    );
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [submitted, setSubmitted] = useState(!!existingExitInstance);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.exitLastDate || !formData.exitReason) {
            showToast("Please fill in all required fields.", "Missing Information", "error");
            return;
        }

        setIsSubmitting(true);

        try {
            const dataToSubmit: Omit<ExitInstanceModel, "id"> = {
                timestamp: formData.timestamp!,
                exitID: formData.exitID!,
                exitEmployeeUID: formData.exitEmployeeUID!,
                exitType: "Voluntary", // Always voluntary for employee submissions
                exitReason: formData.exitReason!,
                exitReasonDescription: formData.exitReasonDescription || null,
                exitChecklist: formData.exitChecklist || "",
                exitInterview: null,
                exitDocument: formData.exitDocument || "",
                eligibleToRehire: formData.eligibleToRehire ?? true,
                remarks: null,
                exitLastDate: formData.exitLastDate!,
                exitEffectiveDate: formData.exitLastDate!, // Same as last date for employee submissions
                effectiveDateAccepted: false, // Will be accepted by HR later
            };

            if (existingExitInstance) {
                // Update existing
                const success = await updateExitInstance(
                    {
                        ...dataToSubmit,
                        id: existingExitInstance.id,
                    },
                    userData?.uid ?? "",
                    EXIT_MANAGEMENT_LOG_MESSAGES.EXIT_INSTANCE_UPDATED(
                        dataToSubmit.exitID,
                        userData?.firstName + " " + userData?.surname || "Employee",
                    ),
                );
                if (success) {
                    showToast("Exit form updated successfully", "Success", "success");
                    setIsEditing(false);
                } else {
                    showToast("Failed to update exit form", "Error", "error");
                }
            } else {
                // Create new
                const success = await createExitInstance(
                    dataToSubmit,
                    userData?.uid ?? "",
                    EXIT_MANAGEMENT_LOG_MESSAGES.EXIT_INSTANCE_CREATED(
                        dataToSubmit.exitID,
                        userData?.firstName + " " + userData?.surname || "Employee",
                    ),
                );
                if (success) {
                    showToast("Exit form submitted successfully", "Success", "success");
                    setSubmitted(true);
                    setIsEditing(false);
                } else {
                    showToast("Failed to submit exit form", "Error", "error");
                }
            }
        } catch (error) {
            showToast("An unexpected error occurred", "Error", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDateSelect = (date: Date | undefined) => {
        setExitDate(date);
        setFormData({
            ...formData,
            exitLastDate: date ? format(date, "yyyy-MM-dd") : "",
        });
    };

    return (
        <div className="p-8 space-y-6 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen dark:from-background dark:to-background">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-8 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-2xl mb-4 shadow-lg">
                        <LogOut className="h-8 w-8 text-white" />
                    </div>
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-foreground mb-2">
                        Exit Form
                    </h1>
                    <p className="text-gray-600 dark:text-muted-foreground text-lg">
                        Please complete this form to initiate your exit process
                    </p>
                </div>

                {/* Form Card */}
                <Card className="border-gray-200 dark:border-gray-800 shadow-xl">
                    <CardHeader className="bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-950/20 dark:to-amber-950/20 border-b border-gray-200 dark:border-gray-800">
                        <CardTitle className="text-2xl text-gray-900 dark:text-foreground">
                            Exit Information
                        </CardTitle>
                        <CardDescription className="text-gray-600 dark:text-muted-foreground">
                            All fields marked with <span className="text-red-500">*</span> are
                            required
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-8">
                        <form
                            onSubmit={submitted ? e => e.preventDefault() : handleSubmit}
                            className="space-y-8"
                        >
                            {/* Read-only Fields */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Timestamp */}
                                <div className="space-y-2">
                                    <Label className="text-sm font-semibold text-gray-700 dark:text-foreground flex items-center gap-2">
                                        <span className="text-red-500">*</span>
                                        Time Stamp
                                    </Label>
                                    <Input
                                        value={format(
                                            new Date(formData.timestamp!),
                                            "MMMM dd, yyyy - hh:mm a",
                                        )}
                                        readOnly
                                        className="bg-gray-100 dark:bg-gray-900 border-gray-300 dark:border-gray-700 cursor-not-allowed"
                                        disabled={!isEditing && !!existingExitInstance}
                                    />
                                </div>

                                {/* Exit ID */}
                                <div className="space-y-2">
                                    <Label className="text-sm font-semibold text-gray-700 dark:text-foreground flex items-center gap-2">
                                        <span className="text-red-500">*</span>
                                        Exit ID
                                    </Label>
                                    <Input
                                        value={formData.exitID}
                                        readOnly
                                        className="bg-gray-100 dark:bg-gray-900 border-gray-300 dark:border-gray-700 cursor-not-allowed font-mono"
                                        disabled={!isEditing && !!existingExitInstance}
                                    />
                                </div>
                            </div>

                            {/* Exit Last Date */}
                            <div className="space-y-2">
                                <Label className="text-sm font-semibold text-gray-700 dark:text-foreground flex items-center gap-2">
                                    <span className="text-red-500">*</span>
                                    Exit Last Date
                                </Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className={cn(
                                                "w-full justify-start text-left font-normal border-gray-400 dark:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800",
                                                !exitDate && "text-muted-foreground",
                                            )}
                                            disabled={!isEditing && !!existingExitInstance}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {exitDate ? (
                                                format(exitDate, "MMMM dd, yyyy")
                                            ) : (
                                                <span>Pick your last working date</span>
                                            )}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent
                                        className="w-auto p-0 bg-white dark:bg-gray-800 z-[150]"
                                        align="start"
                                    >
                                        <Calendar
                                            mode="single"
                                            selected={exitDate}
                                            onSelect={handleDateSelect}
                                            initialFocus
                                            disabled={date => date < new Date()}
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>

                            {/* Exit Reason */}
                            <div className="space-y-2">
                                <Label className="text-sm font-semibold text-gray-700 dark:text-foreground flex items-center gap-2">
                                    <span className="text-red-500">*</span>
                                    Exit Reason
                                </Label>
                                <Select
                                    value={formData.exitReason}
                                    onValueChange={value =>
                                        setFormData({ ...formData, exitReason: value })
                                    }
                                    disabled={!isEditing && !!existingExitInstance}
                                >
                                    <SelectTrigger className="border-gray-400 dark:border-gray-500">
                                        <SelectValue placeholder="Select reason for exit" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white dark:bg-gray-800 border-gray-400 dark:border-gray-500 z-[150]">
                                        {exitReasons.map(reason => (
                                            <SelectItem key={reason} value={reason}>
                                                {reason}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Exit Reason Description */}
                            <div className="space-y-2">
                                <Label className="text-sm font-semibold text-gray-700 dark:text-foreground">
                                    Exit Reason Description
                                </Label>
                                <Textarea
                                    value={formData.exitReasonDescription || ""}
                                    onChange={e =>
                                        setFormData({
                                            ...formData,
                                            exitReasonDescription: e.target.value,
                                        })
                                    }
                                    placeholder="Please provide additional details about your exit reason (optional)"
                                    className="min-h-[150px] border-gray-400 dark:border-gray-500 resize-none"
                                    disabled={!isEditing && !!existingExitInstance}
                                />
                                <p className="text-xs text-gray-500 dark:text-muted-foreground">
                                    This information will help us improve our workplace environment
                                </p>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex justify-center pt-6 gap-4">
                                {submitted && !isEditing ? (
                                    <div className="text-center">
                                        <CheckCircle2 className="mx-auto h-12 w-12 text-green-500 mb-4" />
                                        <h3 className="text-xl font-semibold text-gray-900 dark:text-foreground mb-2">
                                            Exit Form Submitted Successfully
                                        </h3>
                                        <p className="text-gray-600 dark:text-muted-foreground">
                                            Your exit form has been submitted. You will receive
                                            further instructions from HR.
                                        </p>
                                    </div>
                                ) : existingExitInstance && !isEditing ? (
                                    <Button
                                        type="button"
                                        onClick={() => setIsEditing(true)}
                                        className="bg-gradient-to-r from-blue-400 to-blue-500 hover:from-blue-500 hover:to-blue-600 text-white px-12 py-6 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                                    >
                                        <Edit className="mr-2 h-5 w-5" />
                                        Edit Exit Form
                                    </Button>
                                ) : (
                                    <Button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 text-white px-12 py-6 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <CheckCircle2 className="mr-2 h-5 w-5 animate-spin" />
                                                {existingExitInstance
                                                    ? "Updating..."
                                                    : "Submitting..."}
                                            </>
                                        ) : (
                                            <>
                                                <Send className="mr-2 h-5 w-5" />
                                                {existingExitInstance
                                                    ? "Update Exit Form"
                                                    : "Submit Exit Form"}
                                            </>
                                        )}
                                    </Button>
                                )}
                                {isEditing && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setIsEditing(false)}
                                        className="px-12 py-6 text-lg font-semibold rounded-xl border-gray-400 dark:border-gray-500"
                                    >
                                        Cancel
                                    </Button>
                                )}
                            </div>
                        </form>
                    </CardContent>
                </Card>

                {/* Info Card */}
                <Card className="mt-6 border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/20">
                    <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                                <CheckCircle2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                                    What happens next?
                                </h3>
                                <p className="text-sm text-blue-700 dark:text-blue-300">
                                    After submitting this form, your manager and HR will be
                                    notified. You will receive further instructions regarding the
                                    exit process, including return of company property and final
                                    documentation.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
