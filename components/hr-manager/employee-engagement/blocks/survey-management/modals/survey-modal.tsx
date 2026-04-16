"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Plus, X, Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { ListOfQuestions, SurveyModel } from "@/lib/models/survey";
import { Badge } from "@/components/ui/badge";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { useFirestore } from "@/context/firestore-context";
import SurveyAudienceTarget from "../blocks/survey-audience-target";

const SurveyTargetSelector = ({
    formData,
    setFormData,
}: {
    formData: SurveyModel;
    setFormData: React.Dispatch<React.SetStateAction<SurveyModel>>;
}) => {
    const targetAudienceOptions = [
        { label: "All Employees", value: "all" },
        { label: "Employees", value: "employees" },
        { label: "Department", value: "department" },
        { label: "Section", value: "section" },
        { label: "Location", value: "location" },
        { label: "Grade", value: "grade" },
        { label: "Managers", value: "managers" },
        { label: "Not Managers", value: "not_managers" },
    ];

    const handleRemoveTarget = (targetToRemove: string) => {
        const targetDataMap: { [key: string]: keyof SurveyModel } = {
            employees: "employees",
            department: "departments",
            section: "sections",
            location: "locations",
            grade: "grades",
        };

        const updatedFormData = { ...formData };

        updatedFormData.surveyTarget = updatedFormData.surveyTarget?.filter(
            t => t !== targetToRemove,
        );

        const dataKey = targetDataMap[targetToRemove];
        if (dataKey && updatedFormData[dataKey]) {
            (updatedFormData as any)[dataKey] = [];
        }

        setFormData(updatedFormData);
    };

    return (
        <>
            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        className="w-full justify-between min-h-10 h-auto"
                    >
                        <div className="flex flex-wrap gap-1">
                            {formData.surveyTarget?.length
                                ? formData.surveyTarget.map(targetValue => {
                                    const target = targetAudienceOptions.find(
                                        opt => opt.value === targetValue,
                                    );
                                    return (
                                        <Badge
                                            key={targetValue}
                                            variant="secondary"
                                            className="font-normal flex items-center gap-1"
                                        >
                                            {target?.label || targetValue}
                                            <div
                                                role="button"
                                                tabIndex={0}
                                                aria-label={`Remove ${target?.label}`}
                                                onClick={e => {
                                                    e.stopPropagation();
                                                    handleRemoveTarget(targetValue);
                                                }}
                                                onKeyDown={e => {
                                                    if (e.key === "Enter" || e.key === " ") {
                                                        e.preventDefault();
                                                        handleRemoveTarget(targetValue);
                                                    }
                                                }}
                                                className="rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 p-0.5 focus:outline-none focus:ring-1 focus:ring-gray-400"
                                            >
                                                <X className="h-3 w-3" />
                                            </div>
                                        </Badge>
                                    );
                                })
                                : "Select..."}
                        </div>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                    <Command>
                        <CommandInput placeholder="Search..." />
                        <CommandList>
                            <CommandEmpty>No found.</CommandEmpty>
                            <CommandGroup>
                                {targetAudienceOptions?.map(item => {
                                    const isSelected = formData.surveyTarget?.includes(item.value);
                                    return (
                                        <CommandItem
                                            key={item.value}
                                            onSelect={() => {
                                                if (isSelected) {
                                                    handleRemoveTarget(item.value);
                                                } else {
                                                    const selectedTargets =
                                                        formData.surveyTarget || [];
                                                    setFormData({
                                                        ...formData,
                                                        surveyTarget: [
                                                            ...selectedTargets,
                                                            item.value,
                                                        ],
                                                    });
                                                }
                                            }}
                                        >
                                            <Check
                                                className={cn(
                                                    "mr-2 h-4 w-4",
                                                    isSelected ? "opacity-100" : "opacity-0",
                                                )}
                                            />
                                            {item.label}
                                        </CommandItem>
                                    );
                                })}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
            <SurveyAudienceTarget
                formData={formData}
                setFormData={data => setFormData(data as SurveyModel)}
            />
        </>
    );
};

interface SurveyModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (survey: SurveyModel) => void;
    survey?: SurveyModel | null;
    viewOnly?: boolean;
}

export function SurveyModal({
    isOpen,
    onClose,
    onSave,
    survey,
    viewOnly = false,
}: SurveyModalProps) {
    const { multipleChoices, shortAnswers, hrSettings, commonAnswers } = useFirestore();
    const [currentStep, setCurrentStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState<SurveyModel>({
        id: "",
        timestamp: "",
        startDate: "",
        endDate: "",
        duration: 3,
        publishStatus: "Unpublished",
        surveyTarget: ["all"],
        surveyTitle: "",
        description: "",
        listOfQuestions: [],
    });

    const [startDate, setStartDate] = useState<Date>();
    const [endDate, setEndDate] = useState<Date>();
    const [newQuestion, setNewQuestion] = useState<{ type: string; questionID: string }>({
        type: "",
        questionID: "",
    });

    useEffect(() => {
        if (survey) {
            setFormData(survey);
            if (survey.startDate) setStartDate(new Date(survey.startDate));
            if (survey.endDate) setEndDate(new Date(survey.endDate));
        } else {
            // Reset form for new survey
            const now = new Date();
            setFormData({
                id: "",
                timestamp: format(now, "MMMM dd, yyyy hh:mm a"),
                startDate: "",
                endDate: "",
                duration: 3,
                publishStatus: "Unpublished",
                surveyTarget: ["all"],
                surveyTitle: "",
                description: "",
                listOfQuestions: [],
            });
            setStartDate(undefined);
            setEndDate(undefined);
        }
        setCurrentStep(1);
    }, [survey, isOpen]);

    const handleInputChange = (field: keyof SurveyModel, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleDateChange = (field: "startDate" | "endDate", date: Date | undefined) => {
        if (date) {
            const formattedDate = format(date, "MMMM dd, yyyy");
            handleInputChange(field, formattedDate);
            if (field === "startDate") setStartDate(date);
            if (field === "endDate") setEndDate(date);
        }
    };

    const handleAddQuestion = () => {
        if (newQuestion.type && newQuestion.questionID) {
            const question: ListOfQuestions = {
                id: Date.now().toString(),
                type: newQuestion.type as "Multiple Choice" | "Short Answer" | "Common Answer",
                questionID: newQuestion.questionID,
            };
            setFormData(prev => ({
                ...prev,
                listOfQuestions: [...prev.listOfQuestions, question],
            }));
            setNewQuestion({ type: "", questionID: "" });
        }
    };

    const handleRemoveQuestion = (questionId: string) => {
        setFormData(prev => ({
            ...prev,
            listOfQuestions: prev.listOfQuestions.filter(q => q.id !== questionId),
        }));
    };

    const handleNext = () => {
        setCurrentStep(2);
    };

    const handleBack = () => {
        setCurrentStep(1);
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            await onSave(formData);
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderStep1 = () => (
        <div className="space-y-6">
            {/* Step indicator */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
                            1
                        </div>
                        <span className="font-medium text-gray-900 dark:text-foreground">
                            Survey Definition
                        </span>
                    </div>
                    <div className="w-24 h-0.5 bg-gray-200 dark:bg-border"></div>
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gray-200 text-gray-500 rounded-full flex items-center justify-center text-sm font-medium dark:bg-muted">
                            2
                        </div>
                        <span className="text-gray-500 dark:text-muted-foreground">
                            Survey Questions
                        </span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700 dark:text-foreground">
                        <span className="text-red-500">*</span> Timestamp :
                    </Label>
                    <Input
                        value={formData.timestamp}
                        onChange={e => handleInputChange("timestamp", e.target.value)}
                        className="bg-gray-50 dark:bg-muted"
                        readOnly
                    />
                </div>

                <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700 dark:text-foreground">
                        <span className="text-red-500">*</span> Survey Title :
                    </Label>
                    <Input
                        value={formData.surveyTitle}
                        onChange={e => handleInputChange("surveyTitle", e.target.value)}
                        placeholder="Enter survey title"
                        readOnly={viewOnly}
                        className={viewOnly ? "bg-gray-50 dark:bg-muted" : ""}
                    />
                </div>

                <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700 dark:text-foreground">
                        Description :
                    </Label>
                    {viewOnly ? (
                        <div className="p-3 bg-gray-50 dark:bg-muted rounded-md min-h-[80px]">
                            {formData.description || "No description provided"}
                        </div>
                    ) : (
                        <Textarea
                            value={formData.description || ""}
                            onChange={e => handleInputChange("description", e.target.value)}
                            placeholder="Enter survey description (optional)"
                            rows={3}
                            className="resize-none"
                        />
                    )}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700 dark:text-foreground">
                        <span className="text-red-500">*</span> Start Date :
                    </Label>
                    {viewOnly ? (
                        <Input
                            value={formData.startDate}
                            readOnly
                            className="bg-gray-50 dark:bg-muted"
                        />
                    ) : (
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    className={cn(
                                        "w-full justify-start text-left font-normal",
                                        !startDate && "text-muted-foreground",
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {startDate ? format(startDate, "MMMM dd, yyyy") : "Select date"}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    mode="single"
                                    selected={startDate}
                                    onSelect={date => handleDateChange("startDate", date)}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                    )}
                </div>

                <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700 dark:text-foreground">
                        <span className="text-red-500">*</span> End Date :
                    </Label>
                    {viewOnly ? (
                        <Input
                            value={formData.endDate}
                            readOnly
                            className="bg-gray-50 dark:bg-muted"
                        />
                    ) : (
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    className={cn(
                                        "w-full justify-start text-left font-normal",
                                        !endDate && "text-muted-foreground",
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {endDate ? format(endDate, "MMMM dd, yyyy") : "Select date"}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    mode="single"
                                    selected={endDate}
                                    onSelect={date => handleDateChange("endDate", date)}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700 dark:text-foreground">
                        <span className="text-red-500">*</span> Duration :
                    </Label>
                    <div className="flex items-center gap-2">
                        <Input
                            type="number"
                            value={formData.duration}
                            onChange={e =>
                                handleInputChange("duration", Number.parseInt(e.target.value) || 0)
                            }
                            className={`flex-1 ${viewOnly ? "bg-gray-50 dark:bg-muted" : ""}`}
                            min="1"
                            readOnly={viewOnly}
                        />
                        <span className="text-sm text-gray-600 dark:text-muted-foreground">
                            Minute(s)
                        </span>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700 dark:text-foreground">
                        <span className="text-red-500">*</span> Survey Target :
                    </Label>
                    {viewOnly ? (
                        <div className="flex flex-wrap gap-1">
                            {formData.surveyTarget?.map(target => (
                                <Badge key={target} variant="secondary">
                                    {target === "all"
                                        ? "All Employees"
                                        : target === "employees"
                                            ? "Employees"
                                            : target === "department"
                                                ? "Department"
                                                : target === "section"
                                                    ? "Section"
                                                    : target === "location"
                                                        ? "Location"
                                                        : target === "managers"
                                                            ? "Managers"
                                                            : target === "not_managers"
                                                                ? "Not Managers"
                                                                : target}
                                </Badge>
                            ))}
                        </div>
                    ) : (
                        <SurveyTargetSelector formData={formData} setFormData={setFormData} />
                    )}
                </div>

                {/* Display specific selections in view mode */}
                {viewOnly && (
                    <SurveyAudienceTarget
                        formData={formData}
                        setFormData={() => {}} // No-op for view mode
                        viewOnly={true}
                    />
                )}

                <div className="space-y-2"></div>
            </div>

            <div className="flex justify-end">
                {viewOnly ? (
                    <Button
                        onClick={handleNext}
                        className="bg-slate-700 hover:bg-slate-800 text-white"
                    >
                        Next
                    </Button>
                ) : (
                    <Button
                        onClick={handleNext}
                        className="bg-slate-700 hover:bg-slate-800 text-white"
                    >
                        Next
                    </Button>
                )}
            </div>
        </div>
    );

    const renderStep2 = () => (
        <div className="space-y-6">
            {/* Step indicator */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
                            ✓
                        </div>
                        <span className="text-gray-500 dark:text-muted-foreground">
                            Survey Definition
                        </span>
                    </div>
                    <div className="w-24 h-0.5 bg-blue-500"></div>
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
                            2
                        </div>
                        <span className="font-medium text-gray-900 dark:text-foreground">
                            Survey Questions
                        </span>
                    </div>
                </div>
            </div>

            {!viewOnly && (
                <div className="grid grid-cols-2 gap-4 items-end">
                    <div className="space-y-2">
                        <Select
                            value={newQuestion.type}
                            onValueChange={value =>
                                setNewQuestion(prev => ({ ...prev, type: value, questionID: "" }))
                            }
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select question type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Multiple Choice">Multiple Choice</SelectItem>
                                <SelectItem value="Short Answer">Short Answer</SelectItem>
                                <SelectItem value="Common Answer">Common Answer</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Select
                            value={newQuestion.questionID}
                            onValueChange={value =>
                                setNewQuestion(prev => ({ ...prev, questionID: value }))
                            }
                            disabled={!newQuestion.type}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select question" />
                            </SelectTrigger>
                            <SelectContent>
                                {newQuestion.type === "Multiple Choice" &&
                                    multipleChoices?.map(choice => (
                                        <SelectItem key={choice.id} value={choice.id}>
                                            {choice.name}
                                        </SelectItem>
                                    ))}
                                {newQuestion.type === "Short Answer" &&
                                    shortAnswers?.map(answer => (
                                        <SelectItem key={answer.id} value={answer.id}>
                                            {answer.name}
                                        </SelectItem>
                                    ))}
                                {newQuestion.type === "Common Answer" &&
                                    commonAnswers?.map(answer => (
                                        <SelectItem key={answer.id} value={answer.id}>
                                            {answer.title}
                                        </SelectItem>
                                    ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <Button
                        onClick={handleAddQuestion}
                        className="bg-slate-700 hover:bg-slate-800 text-white"
                        disabled={!newQuestion.type || !newQuestion.questionID}
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Add
                    </Button>
                </div>
            )}

            {formData.listOfQuestions.length > 0 && (
                <div className="space-y-3">
                    <h4 className="font-medium text-gray-900 dark:text-foreground">
                        Added Questions:
                    </h4>
                    {formData.listOfQuestions.map(question => {
                        const questionName =
                            question.type === "Multiple Choice"
                                ? multipleChoices.find(mc => mc.id === question.questionID)?.name
                                : question.type === "Short Answer"
                                    ? shortAnswers.find(sa => sa.id === question.questionID)?.name
                                    : commonAnswers.find(ca => ca.id === question.questionID)?.title;
                        return (
                            <div
                                key={question.id}
                                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg dark:bg-muted"
                            >
                                <div className="flex items-center gap-3">
                                    <span className="text-sm font-medium text-gray-700 dark:text-foreground">
                                        {question.type}
                                    </span>
                                    <span className="text-sm text-gray-600 dark:text-muted-foreground">
                                        -
                                    </span>
                                    <span className="text-sm text-gray-600 dark:text-muted-foreground">
                                        {questionName || question.questionID}
                                    </span>
                                </div>
                                {!viewOnly && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleRemoveQuestion(question.id)}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            <div className="flex justify-between">
                {viewOnly ? (
                    <>
                        <Button variant="outline" onClick={handleBack}>
                            Previous
                        </Button>
                        <Button variant="outline" onClick={onClose} className="bg-transparent">
                            Close
                        </Button>
                    </>
                ) : (
                    <>
                        <Button variant="outline" onClick={handleBack}>
                            Back
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className="bg-slate-700 hover:bg-slate-800 text-white"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                "Submit"
                            )}
                        </Button>
                    </>
                )}
            </div>
        </div>
    );

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-xl font-semibold">
                        {viewOnly ? "Survey Details" : survey ? "Edit Survey" : "Add Survey"}
                    </DialogTitle>
                </DialogHeader>

                <div className="py-4">{currentStep === 1 ? renderStep1() : renderStep2()}</div>
            </DialogContent>
        </Dialog>
    );
}
