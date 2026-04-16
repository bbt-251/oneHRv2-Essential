// components/AddObjectiveModal.tsx

"use client";

import type React from "react";
import { format } from "date-fns";
import {
    CalendarIcon,
    Save,
    X,
    Target,
    AlertCircle,
    Plus,
    Trash2,
    ChevronLeft,
    ChevronRight,
    Sparkles,
    Clock,
    Users,
    MessageSquare,
    Edit,
    Loader2,
} from "lucide-react";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";

import { ObjectiveModel } from "@/lib/models/objective-model";
import { cn } from "@/lib/utils";
import { useObjectiveForm } from "@/lib/util/employee-performance/use-objective-form";

export interface ObjectiveModelWithWeight extends ObjectiveModel {
    weight: number | null;
}

export interface AddObjectiveModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    editObjective?: ObjectiveModel | null;
}

export function AddObjectiveModal({
    open,
    onOpenChange,
    editObjective = null,
}: AddObjectiveModalProps) {
    const {
        currentStep,
        isSubmitting,
        isEditMode,
        formData,
        setFormData,
        canSetObjectives,
        currentCycle,
        nextStep,
        prevStep,
        isStepValid,
        handleSubmitObjective,
        generateSMARTObjective,
        addActionItem,
        updateActionItem,
        removeActionItem,
        addFeedback,
        updateFeedback,
        removeFeedback,
        generateLoading,
        departmentKPIs,
    } = useObjectiveForm({ editObjective, open, onOpenChange });

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl font-semibold text-brand-800 dark:text-foreground">
                        {isEditMode ? (
                            <Edit className="h-5 w-5 text-brand-600" />
                        ) : (
                            <Target className="h-5 w-5 text-brand-600" />
                        )}
                        {isEditMode
                            ? `Edit Objective - Step ${currentStep} of 3`
                            : `Add New Objective - Step ${currentStep} of 3`}
                    </DialogTitle>
                </DialogHeader>

                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-4">
                        {[1, 2, 3].map(step => (
                            <div key={step} className="flex items-center">
                                <div
                                    className={cn(
                                        "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                                        currentStep >= step
                                            ? "bg-brand-600 text-white"
                                            : "bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400",
                                    )}
                                >
                                    {step}
                                </div>
                                {step < 3 && (
                                    <div
                                        className={cn(
                                            "w-12 h-0.5 mx-2",
                                            currentStep > step
                                                ? "bg-brand-600"
                                                : "bg-gray-200 dark:bg-gray-700",
                                        )}
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                        {currentStep === 1 && "Objective Definition"}
                        {currentStep === 2 && "Action Items"}
                        {currentStep === 3 && "Feedback"}
                    </div>
                </div>

                {currentCycle && (
                    <Alert className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20 mb-6">
                        <AlertCircle className="h-4 w-4 text-blue-600" />
                        <AlertDescription className="text-blue-800 dark:text-blue-200">
                            Objective setting deadline: {currentCycle.endDate}
                        </AlertDescription>
                    </Alert>
                )}

                <form onSubmit={e => e.preventDefault()} className="space-y-6">
                    {currentStep === 1 && (
                        <div className="space-y-6">
                            <div className="flex items-center gap-2 mb-4">
                                <Clock className="h-5 w-5 text-brand-600" />
                                <h3 className="text-lg font-semibold text-brand-800 dark:text-foreground">
                                    Objective Definition
                                </h3>
                                {isEditMode && (
                                    <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded dark:bg-blue-900 dark:text-blue-300">
                                        Editing Mode
                                    </span>
                                )}
                            </div>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div>
                                        <Label className="text-sm font-semibold text-brand-700 dark:text-foreground">
                                            Timestamp
                                        </Label>
                                        <Input
                                            value={format(new Date(formData.timestamp), "PPpp")}
                                            disabled
                                            className="mt-1 bg-gray-50 dark:bg-gray-800"
                                        />
                                    </div>
                                    <div>
                                        <Label
                                            htmlFor="title"
                                            className="text-sm font-semibold text-brand-700 dark:text-foreground"
                                        >
                                            Objective Title *
                                        </Label>
                                        <Input
                                            id="title"
                                            value={formData.title}
                                            onChange={e =>
                                                setFormData({ ...formData, title: e.target.value })
                                            }
                                            placeholder="Enter a clear, specific objective title"
                                            className="mt-1"
                                            required
                                            disabled={!canSetObjectives}
                                        />
                                    </div>
                                    <div>
                                        <div className="flex items-center justify-between">
                                            <Label
                                                htmlFor="smart"
                                                className="text-sm font-semibold text-brand-700 dark:text-foreground"
                                            >
                                                SMART Objective Description *
                                            </Label>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={generateSMARTObjective}
                                                disabled={
                                                    generateLoading ||
                                                    !formData.title ||
                                                    !canSetObjectives
                                                }
                                                className="text-xs bg-transparent"
                                            >
                                                {generateLoading ? (
                                                    "Generating..."
                                                ) : (
                                                    <>
                                                        <Sparkles className="h-3 w-3 mr-1" />
                                                        Generate with AI
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                        <Textarea
                                            id="smart"
                                            value={formData.SMARTObjective}
                                            onChange={e =>
                                                setFormData({
                                                    ...formData,
                                                    SMARTObjective: e.target.value,
                                                })
                                            }
                                            placeholder="Specific, Measurable, Achievable, Relevant, Time-bound details"
                                            className="mt-1 min-h-24"
                                            required
                                            disabled={!canSetObjectives}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <Label className="text-sm font-semibold text-brand-700 dark:text-foreground">
                                            Department KPI
                                        </Label>
                                        <Select
                                            value={formData.deptKPI}
                                            onValueChange={value =>
                                                setFormData({ ...formData, deptKPI: value })
                                            }
                                            disabled={!canSetObjectives}
                                        >
                                            <SelectTrigger className="mt-1">
                                                <SelectValue placeholder="Select department KPI" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {departmentKPIs.map(kpi => (
                                                    <SelectItem key={kpi.id} value={kpi.id}>
                                                        {kpi.title}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <Label className="text-sm font-semibold text-brand-700 dark:text-foreground">
                                            Target Date *
                                        </Label>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    disabled={!canSetObjectives}
                                                    className={cn(
                                                        "w-full justify-start text-left font-normal mt-1",
                                                        !formData.targetDate &&
                                                            "text-muted-foreground",
                                                    )}
                                                >
                                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                                    {formData.targetDate
                                                        ? format(formData.targetDate, "PPP")
                                                        : "Select target date"}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                                <Calendar
                                                    mode="single"
                                                    selected={formData.targetDate || undefined}
                                                    onSelect={date =>
                                                        setFormData({
                                                            ...formData,
                                                            targetDate: date || null,
                                                        })
                                                    }
                                                    initialFocus
                                                    disabled={date =>
                                                        date <
                                                        new Date(new Date().setHours(0, 0, 0, 0))
                                                    }
                                                />
                                            </PopoverContent>
                                        </Popover>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {currentStep === 2 && (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <Users className="h-5 w-5 text-brand-600" />
                                    <h3 className="text-lg font-semibold text-brand-800 dark:text-foreground">
                                        Action Items
                                    </h3>
                                </div>
                                <Button
                                    type="button"
                                    onClick={addActionItem}
                                    disabled={!canSetObjectives}
                                    size="sm"
                                    variant="outline"
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Action Item
                                </Button>
                            </div>
                            <div className="space-y-4">
                                {formData.actionItems.length > 0 ? (
                                    formData.actionItems.map(item => (
                                        <div
                                            key={item.id}
                                            className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-4"
                                        >
                                            <div className="flex items-center justify-between">
                                                <Input
                                                    value={item.title}
                                                    onChange={e =>
                                                        updateActionItem(item.id, {
                                                            title: e.target.value,
                                                        })
                                                    }
                                                    placeholder="Action item title"
                                                    disabled={!canSetObjectives}
                                                    className="flex-1 mr-2"
                                                />
                                                <Button
                                                    type="button"
                                                    onClick={() => removeActionItem(item.id)}
                                                    disabled={!canSetObjectives}
                                                    size="sm"
                                                    variant="ghost"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                            <Textarea
                                                value={item.description}
                                                onChange={e =>
                                                    updateActionItem(item.id, {
                                                        description: e.target.value,
                                                    })
                                                }
                                                placeholder="Action item description"
                                                disabled={!canSetObjectives}
                                                className="min-h-16"
                                            />

                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <div>
                                                    <Label className="text-sm font-medium">
                                                        Due Date
                                                    </Label>
                                                    <Popover>
                                                        <PopoverTrigger asChild>
                                                            <Button
                                                                variant="outline"
                                                                disabled={!canSetObjectives}
                                                                className={cn(
                                                                    "w-full justify-start text-left font-normal mt-1",
                                                                    !item.dueDate &&
                                                                        "text-muted-foreground",
                                                                )}
                                                            >
                                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                                {item.dueDate
                                                                    ? format(item.dueDate, "PPP")
                                                                    : "Select date"}
                                                            </Button>
                                                        </PopoverTrigger>
                                                        <PopoverContent
                                                            className="w-auto p-0"
                                                            align="start"
                                                        >
                                                            <Calendar
                                                                mode="single"
                                                                selected={item.dueDate || undefined}
                                                                onSelect={date =>
                                                                    updateActionItem(item.id, {
                                                                        dueDate: date || null,
                                                                    })
                                                                }
                                                                initialFocus
                                                            />
                                                        </PopoverContent>
                                                    </Popover>
                                                </div>

                                                <div>
                                                    <Label className="text-sm font-medium">
                                                        Priority
                                                    </Label>
                                                    <Select
                                                        value={item.priority}
                                                        onValueChange={(
                                                            value: "Low" | "Medium" | "High",
                                                        ) =>
                                                            updateActionItem(item.id, {
                                                                priority: value,
                                                            })
                                                        }
                                                        disabled={!canSetObjectives}
                                                    >
                                                        <SelectTrigger className="mt-1">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="Low">Low</SelectItem>
                                                            <SelectItem value="Medium">
                                                                Medium
                                                            </SelectItem>
                                                            <SelectItem value="High">
                                                                High
                                                            </SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                <div>
                                                    <Label className="text-sm font-medium">
                                                        Status
                                                    </Label>
                                                    <Select
                                                        value={item.status}
                                                        onValueChange={(
                                                            value:
                                                                | "Not Started"
                                                                | "In Progress"
                                                                | "Completed",
                                                        ) =>
                                                            updateActionItem(item.id, {
                                                                status: value,
                                                            })
                                                        }
                                                        disabled={!canSetObjectives}
                                                    >
                                                        <SelectTrigger className="mt-1">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="Not Started">
                                                                Not Started
                                                            </SelectItem>
                                                            <SelectItem value="In Progress">
                                                                In Progress
                                                            </SelectItem>
                                                            <SelectItem value="Completed">
                                                                Completed
                                                            </SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                        No action items added yet. Click "Add Action Item" to get
                                        started.
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {currentStep === 3 && (
                        <div className="space-y-6">
                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800 mb-6">
                                <div className="flex items-center gap-2 mb-2">
                                    <MessageSquare className="h-5 w-5 text-blue-600" />
                                    <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200">
                                        Step 3: Feedback Collection
                                    </h3>
                                </div>
                                <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                                    Add initial feedback or comments for this objective.
                                </p>
                                <div className="flex gap-3">
                                    <Button
                                        type="button"
                                        onClick={() => addFeedback("Employee")}
                                        disabled={!canSetObjectives}
                                        size="sm"
                                        className="bg-blue-600 hover:bg-blue-700 text-white"
                                    >
                                        <Plus className="h-4 w-4 mr-2" />
                                        Add Employee Feedback
                                    </Button>
                                </div>
                            </div>
                            <div className="space-y-4">
                                {formData.feedback.length > 0 ? (
                                    formData.feedback.map((feedback, index) => (
                                        <div
                                            key={feedback.id}
                                            className="border-2 border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800 shadow-sm"
                                        >
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center gap-3">
                                                    <span
                                                        className={cn(
                                                            "px-3 py-1 rounded-full text-sm font-medium",
                                                            feedback.type === "Employee"
                                                                ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                                                                : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
                                                        )}
                                                    >
                                                        {feedback.type} Feedback #{index + 1}
                                                    </span>
                                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                                        {format(
                                                            new Date(feedback.timestamp),
                                                            "PPp",
                                                        )}
                                                    </span>
                                                </div>
                                                <Button
                                                    type="button"
                                                    onClick={() => removeFeedback(feedback.id)}
                                                    disabled={!canSetObjectives}
                                                    size="sm"
                                                    variant="ghost"
                                                    className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                            <Textarea
                                                value={feedback.content}
                                                onChange={e =>
                                                    updateFeedback(feedback.id, e.target.value)
                                                }
                                                placeholder={`Enter ${feedback.type.toLowerCase()} feedback content...`}
                                                disabled={!canSetObjectives}
                                                className="min-h-24 border-gray-300 dark:border-gray-600"
                                            />
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-12 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                                        <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                        <h4 className="text-lg font-medium text-gray-600 dark:text-gray-400 mb-2">
                                            No feedback added yet
                                        </h4>
                                        <p className="text-sm text-gray-500 dark:text-gray-500 mb-4">
                                            Use the buttons above to add initial feedback for this
                                            objective
                                        </p>
                                        <div className="flex justify-center gap-2">
                                            <Button
                                                type="button"
                                                onClick={() => addFeedback("Employee")}
                                                disabled={!canSetObjectives}
                                                size="sm"
                                                className="bg-blue-600 hover:bg-blue-700 text-white"
                                            >
                                                <Plus className="h-4 w-4 mr-2" />
                                                Employee Feedback
                                            </Button>
                                        </div>
                                    </div>
                                )}
                                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                                    <h4 className="font-medium text-green-800 dark:text-green-200 mb-2">
                                        Ready to Submit
                                    </h4>
                                    <p className="text-sm text-green-700 dark:text-green-300">
                                        Your objective is complete with{" "}
                                        {formData.actionItems.length} action items and{" "}
                                        {formData.feedback.length} feedback entries. Click "Submit
                                        for Approval" to finalize.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex justify-between pt-4 border-t border-accent-100 dark:border-border">
                        <div>
                            {currentStep > 1 && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={prevStep}
                                    className="..."
                                >
                                    <ChevronLeft className="h-4 w-4 mr-2" />
                                    Previous
                                </Button>
                            )}
                        </div>
                        <div className="flex gap-3">
                            {currentStep < 3 ? (
                                <Button
                                    type="button"
                                    className="bg-brand-600 hover:bg-brand-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                                    onClick={nextStep}
                                    disabled={!isStepValid(currentStep)}
                                >
                                    <ChevronRight className="h-4 w-4 ml-2" />
                                    Next
                                </Button>
                            ) : (
                                <Button
                                    onClick={handleSubmitObjective}
                                    disabled={isSubmitting}
                                    className="flex items-center gap-2"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="h-4 w-4" />
                                            {isEditMode ? "Update" : "Save"} Objective
                                        </>
                                    )}
                                </Button>
                            )}
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                className="..."
                            >
                                <X className="h-4 w-4 mr-2" />
                                Cancel
                            </Button>
                        </div>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
