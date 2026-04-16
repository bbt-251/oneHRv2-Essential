"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2, CalendarIcon, ChevronsUpDown, Check, X } from "lucide-react";
import MultipleChoiceModel from "@/lib/models/multiple-choice";
import ShortAnswerModel from "@/lib/models/short-answer";
import dayjs from "dayjs";
import { dateFormat } from "@/lib/util/dayjs_format";
import { Calendar } from "@/components/ui/calendar";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { QuizModel } from "@/lib/models/quiz.ts";
import { AudienceTarget } from "../blocks/audience-target";
interface QuizFormProps {
    isEdit: boolean;
    currentStep: number;
    setCurrentStep: (step: number) => void;
    formData: Partial<QuizModel>;
    setFormData: (data: Partial<QuizModel>) => void;
    multipleChoiceQuestions: MultipleChoiceModel[];
    shortAnswerQuestions: ShortAnswerModel[];
}

export function QuizForm({
    currentStep,
    formData,
    setFormData,
    multipleChoiceQuestions,
    shortAnswerQuestions,
}: QuizFormProps) {
    const handleAddMultipleChoice = () => {
        const currentQuestions = formData.multipleChoice || [];
        setFormData({ ...formData, multipleChoice: [...currentQuestions, ""] });
    };

    const handleRemoveMultipleChoice = (indexToRemove: number) => {
        const updatedQuestions = formData.multipleChoice?.filter(
            (_, index) => index !== indexToRemove,
        );
        setFormData({ ...formData, multipleChoice: updatedQuestions });
    };

    const handleMultipleChoiceChange = (indexToUpdate: number, questionId: string) => {
        const updatedQuestions = formData.multipleChoice?.map((id, index) =>
            index === indexToUpdate ? questionId : id,
        );
        setFormData({ ...formData, multipleChoice: updatedQuestions });
    };

    const handleAddShortAnswer = () => {
        const currentQuestions = formData.shortAnswer || [];
        setFormData({ ...formData, shortAnswer: [...currentQuestions, { id: "", value: "" }] });
    };

    const handleRemoveShortAnswer = (indexToRemove: number) => {
        const updatedQuestions = formData.shortAnswer?.filter(
            (_, index) => index !== indexToRemove,
        );
        setFormData({ ...formData, shortAnswer: updatedQuestions });
    };

    const handleShortAnswerChange = (indexToUpdate: number, questionId: string) => {
        const updatedQuestions = formData.shortAnswer?.map((item, index) =>
            index === indexToUpdate ? { ...item, id: questionId } : item,
        );
        setFormData({ ...formData, shortAnswer: updatedQuestions });
    };

    const handleShortAnswerValueChange = (indexToUpdate: number, value: string) => {
        const updatedQuestions = formData.shortAnswer?.map((item, index) =>
            index === indexToUpdate ? { ...item, value } : item,
        );
        setFormData({ ...formData, shortAnswer: updatedQuestions });
    };

    const handleRemoveTarget = (targetToRemove: string) => {
        const targetDataMap: { [key: string]: keyof QuizModel } = {
            employees: "employees",
            department: "departments",
            section: "sections",
            location: "locations",
            grade: "grades",
        };

        const updatedFormData = { ...formData };

        // 1. Remove the target from the audienceTarget array
        updatedFormData.audienceTarget = updatedFormData.audienceTarget?.filter(
            t => t !== targetToRemove,
        );

        // 2. Delete the specific data associated with that target
        const dataKey = targetDataMap[targetToRemove];
        if (dataKey && updatedFormData[dataKey]) {
            delete updatedFormData[dataKey];
        }

        setFormData(updatedFormData);
    };

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

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-center space-x-4 mb-6">
                <div
                    className={`flex items-center ${currentStep >= 1 ? "text-brand-600" : "text-gray-400"}`}
                >
                    <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 1 ? "bg-brand-600 text-white" : "bg-gray-200 text-gray-600"}`}
                    >
                        1
                    </div>
                    <span className="ml-2 font-medium">Quiz Information</span>
                </div>
                <div
                    className={`w-8 h-0.5 ${currentStep >= 2 ? "bg-brand-600" : "bg-gray-200"}`}
                ></div>
                <div
                    className={`flex items-center ${currentStep >= 2 ? "text-brand-600" : "text-gray-400"}`}
                >
                    <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 2 ? "bg-brand-600 text-white" : "bg-gray-200 text-gray-600"}`}
                    >
                        2
                    </div>
                    <span className="ml-2 font-medium">Quiz Questions</span>
                </div>
            </div>

            {currentStep === 1 && (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="quiz-title">Quiz Title *</Label>
                            <Input
                                id="quiz-title"
                                value={formData.quizTitle || ""}
                                onChange={e =>
                                    setFormData({ ...formData, quizTitle: e.target.value })
                                }
                                placeholder="Enter quiz title"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="passing-rate">Passing Rate (%) *</Label>
                            <Input
                                id="passing-rate"
                                type="number"
                                value={formData.passingRate || ""}
                                onChange={e =>
                                    setFormData({
                                        ...formData,
                                        passingRate: Number(e.target.value),
                                    })
                                }
                                placeholder="70"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="start-date">Start Date *</Label>

                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className={`w-full justify-start text-left font-normal`}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {formData.startDate
                                            ? dayjs(formData.startDate).format(dateFormat)
                                            : "Select date"}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <Calendar
                                        mode="single"
                                        selected={
                                            formData.startDate
                                                ? new Date(formData.startDate)
                                                : undefined
                                        }
                                        onSelect={date =>
                                            setFormData({
                                                ...formData,
                                                startDate: date?.toISOString() || "",
                                            })
                                        }
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="end-date">End Date *</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className={`w-full justify-start text-left font-normal`}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {formData.endDate
                                            ? dayjs(formData.endDate).format(dateFormat)
                                            : "Select date"}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <Calendar
                                        mode="single"
                                        selected={
                                            formData.endDate
                                                ? new Date(formData.endDate)
                                                : undefined
                                        }
                                        onSelect={date =>
                                            setFormData({
                                                ...formData,
                                                endDate: date?.toISOString() || "",
                                            })
                                        }
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="active-status">Active Status</Label>
                            <Select
                                value={formData.active || "Yes"}
                                onValueChange={(value: "Yes" | "No") =>
                                    setFormData({ ...formData, active: value })
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Yes">Yes</SelectItem>
                                    <SelectItem value="No">No</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Audience Target</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        className="w-full justify-between min-h-10 h-auto"
                                    >
                                        <div className="flex flex-wrap gap-1">
                                            {formData.audienceTarget?.length
                                                ? formData.audienceTarget.map(targetValue => {
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
                                                                    handleRemoveTarget(
                                                                        targetValue,
                                                                    );
                                                                }}
                                                                onKeyDown={e => {
                                                                    if (
                                                                        e.key === "Enter" ||
                                                                          e.key === " "
                                                                    ) {
                                                                        e.preventDefault();
                                                                        handleRemoveTarget(
                                                                            targetValue,
                                                                        );
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
                                                    const isSelected =
                                                        formData.audienceTarget?.includes(
                                                            item.value,
                                                        );
                                                    return (
                                                        <CommandItem
                                                            key={item.value}
                                                            onSelect={() => {
                                                                if (isSelected) {
                                                                    handleRemoveTarget(item.value);
                                                                } else {
                                                                    const selectedTargets =
                                                                        formData.audienceTarget ||
                                                                        [];
                                                                    setFormData({
                                                                        ...formData,
                                                                        audienceTarget: [
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
                                                                    isSelected
                                                                        ? "opacity-100"
                                                                        : "opacity-0",
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
                        </div>
                    </div>

                    <AudienceTarget formData={formData} setFormData={setFormData} />

                    <div className="flex items-center space-x-2">
                        <Switch
                            id="timer-enabled"
                            checked={formData.questionTimerEnabled || false}
                            onCheckedChange={checked =>
                                setFormData({ ...formData, questionTimerEnabled: checked })
                            }
                        />
                        <Label htmlFor="timer-enabled">Enable Question Timer</Label>
                    </div>

                    {formData.questionTimerEnabled && (
                        <div className="space-y-2">
                            <Label htmlFor="timer">Timer (minutes)</Label>
                            <Input
                                id="timer"
                                type="number"
                                value={formData.timer || ""}
                                onChange={e =>
                                    setFormData({ ...formData, timer: Number(e.target.value) })
                                }
                                placeholder="30"
                            />
                        </div>
                    )}
                </div>
            )}

            {currentStep === 2 && (
                <div className="space-y-6 max-h-96 overflow-y-auto p-1">
                    <div className="space-y-4 p-2 border rounded-lg">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-brand-800 dark:text-white">
                                Multiple Choice Questions
                            </h3>
                            <Button variant="outline" size="sm" onClick={handleAddMultipleChoice}>
                                <Plus className="h-4 w-4 mr-1" />
                                Add
                            </Button>
                        </div>
                        {formData.multipleChoice && formData.multipleChoice.length > 0 ? (
                            <div className="space-y-3">
                                {formData.multipleChoice.map((selectedId, index) => (
                                    <Card
                                        key={index}
                                        className="border-brand-100 dark:border-brand-700"
                                    >
                                        <CardContent className="p-4 flex items-center gap-4">
                                            <div className="flex-grow">
                                                <Label
                                                    htmlFor={`mc-select-${index}`}
                                                    className="sr-only"
                                                >
                                                    Multiple Choice Question
                                                </Label>
                                                <Select
                                                    value={selectedId}
                                                    onValueChange={value =>
                                                        handleMultipleChoiceChange(index, value)
                                                    }
                                                >
                                                    <SelectTrigger id={`mc-select-${index}`}>
                                                        <SelectValue placeholder="Select a question" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {multipleChoiceQuestions.map(question => (
                                                            <SelectItem
                                                                key={question.id}
                                                                value={question.id}
                                                                disabled={
                                                                    formData.multipleChoice?.includes(
                                                                        question.id,
                                                                    ) && selectedId !== question.id
                                                                }
                                                            >
                                                                {question.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleRemoveMultipleChoice(index)}
                                                className="text-red-600 hover:text-red-700 h-9 w-9 flex-shrink-0"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            <p className="text-center text-sm text-gray-500 py-4">
                                No multiple choice questions added.
                            </p>
                        )}
                    </div>

                    <div className="space-y-4 p-2 border rounded-lg">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-brand-800 dark:text-white">
                                Short Answer Questions
                            </h3>
                            <Button variant="outline" size="sm" onClick={handleAddShortAnswer}>
                                <Plus className="h-4 w-4 mr-1" />
                                Add
                            </Button>
                        </div>
                        {formData.shortAnswer && formData.shortAnswer.length > 0 ? (
                            <div className="space-y-3">
                                {formData.shortAnswer.map((item, index) => (
                                    <Card
                                        key={index}
                                        className="border-brand-100 dark:border-brand-700"
                                    >
                                        <CardContent className="p-4 flex items-center gap-4">
                                            <div className="flex-grow space-y-2">
                                                <Label
                                                    htmlFor={`sa-select-${index}`}
                                                    className="sr-only"
                                                >
                                                    Short Answer Question
                                                </Label>
                                                <Select
                                                    value={item.id}
                                                    onValueChange={value =>
                                                        handleShortAnswerChange(index, value)
                                                    }
                                                >
                                                    <SelectTrigger id={`sa-select-${index}`}>
                                                        <SelectValue placeholder="Select a question" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {shortAnswerQuestions.map(question => (
                                                            <SelectItem
                                                                key={question.id}
                                                                value={question.id}
                                                                disabled={
                                                                    formData.shortAnswer?.some(
                                                                        sa => sa.id === question.id,
                                                                    ) && item.id !== question.id
                                                                }
                                                            >
                                                                {question.question}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <div className="flex items-center gap-2">
                                                    <Label
                                                        htmlFor={`sa-value-${index}`}
                                                        className="text-sm font-medium"
                                                    >
                                                        Value:
                                                    </Label>
                                                    <Input
                                                        id={`sa-value-${index}`}
                                                        placeholder="e.g., 85"
                                                        type="number"
                                                        min={0}
                                                        max={100}
                                                        value={item.value}
                                                        onChange={e =>
                                                            handleShortAnswerValueChange(
                                                                index,
                                                                Math.min(
                                                                    100,
                                                                    Math.max(
                                                                        0,
                                                                        parseInt(e.target.value),
                                                                    ),
                                                                ).toString(),
                                                            )
                                                        }
                                                        className="h-9"
                                                    />
                                                </div>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleRemoveShortAnswer(index)}
                                                className="text-red-600 hover:text-red-700 h-9 w-9 flex-shrink-0"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            <p className="text-center text-sm text-gray-500 py-4">
                                No short answer questions added.
                            </p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
