"use client";

import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/context/toastContext";
import { PeriodicOptionModel, PeriodicOptionRoundsModel } from "@/lib/models/performance";
import { dateFormat, getTimestamp } from "@/lib/util/dayjs_format";
import dayjs from "dayjs";
import { CalendarIcon, Plus, X } from "lucide-react";
import { useEffect, useState } from "react";

interface PeriodicOptionFormProps {
    initialData?: PeriodicOptionModel | null;
    onSubmit: (data: Omit<PeriodicOptionModel, "id">) => void;
    onCancel: () => void;
    isLoading?: boolean;
}

export default function PeriodicOptionForm({
    initialData,
    onSubmit,
    onCancel,
    isLoading = false,
}: PeriodicOptionFormProps) {
    const { theme } = useTheme();
    const { showToast } = useToast();
    const [formData, setFormData] = useState<PeriodicOptionModel>({
        id: null,
        timestamp: getTimestamp(),
        periodName: "",
        year: dayjs().year(),
        evaluations: [{ id: crypto.randomUUID(), round: "", from: "", to: "" }],
    });

    useEffect(() => {
        if (initialData) {
            setFormData({ ...initialData });
        }
    }, [initialData]);

    const addEvaluationRound = () => {
        setFormData(prev => ({
            ...prev,
            evaluations: [
                ...prev.evaluations,
                { id: crypto.randomUUID(), round: "", from: "", to: "" },
            ],
        }));
    };

    const removeEvaluationRound = (index: number) => {
        setFormData(prev => ({
            ...prev,
            evaluations: prev.evaluations.filter((_, i) => i !== index),
        }));
    };

    const updateEvaluationRound = (
        index: number,
        field: keyof PeriodicOptionRoundsModel,
        value: string,
    ) => {
        setFormData(prev => ({
            ...prev,
            evaluations: prev.evaluations.map((evaluation, i) =>
                i === index ? { ...evaluation, [field]: value } : evaluation,
            ),
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (!formData.periodName.trim()) {
            showToast("Period name is required", "Validation Error", "error");
            return;
        }

        if (!formData.year || formData.year < 2000) {
            showToast("Please enter a valid year", "Validation Error", "error");
            return;
        }

        if (
            formData.evaluations.some(
                evaluation => !evaluation.round.trim() || !evaluation.from || !evaluation.to,
            )
        ) {
            showToast(
                "All evaluation rounds must have complete information",
                "Validation Error",
                "error",
            );
            return;
        }

        // Check for duplicate round names
        const roundNames = formData.evaluations.map(evaluation => evaluation.round.toLowerCase());
        if (new Set(roundNames).size !== roundNames.length) {
            showToast("Round names must be unique", "Validation Error", "error");
            return;
        }

        // Check date validity
        for (const evaluation of formData.evaluations) {
            if (new Date(evaluation.from) >= new Date(evaluation.to)) {
                showToast(
                    "From date must be before to date for all rounds",
                    "Validation Error",
                    "error",
                );
                return;
            }
        }

        try {
            onSubmit({
                timestamp: formData.timestamp,
                periodName: formData.periodName.trim(),
                year: formData.year,
                evaluations: formData.evaluations,
            });
        } catch (error) {
            showToast("Failed to save periodic option", "Error", "error");
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label
                        htmlFor="periodName"
                        className={theme === "dark" ? "text-gray-300" : "text-gray-700"}
                    >
                        Period Name
                    </Label>
                    <Input
                        value={formData.periodName}
                        onChange={e =>
                            setFormData(prev => ({ ...prev, periodName: e.target.value }))
                        }
                        placeholder="Enter period name (e.g., Q1 Performance Review)"
                        className={
                            theme === "dark"
                                ? "bg-gray-900 border-gray-700 text-white placeholder:text-gray-400"
                                : ""
                        }
                    />
                </div>
                <div>
                    <Label
                        htmlFor="year"
                        className={theme === "dark" ? "text-gray-300" : "text-gray-700"}
                    >
                        Year
                    </Label>
                    <Input
                        type="number"
                        value={formData.year}
                        onChange={e =>
                            setFormData(prev => ({
                                ...prev,
                                year: Number.parseInt(e.target.value),
                            }))
                        }
                        placeholder="Enter year"
                        className={
                            theme === "dark"
                                ? "bg-gray-900 border-gray-700 text-white placeholder:text-gray-400"
                                : ""
                        }
                    />
                </div>
            </div>

            <div>
                <div className="flex items-center justify-between mb-4">
                    <Label className={theme === "dark" ? "text-gray-300" : "text-gray-700"}>
                        Evaluation Rounds
                    </Label>
                    <Button
                        type="button"
                        onClick={addEvaluationRound}
                        variant="outline"
                        size="sm"
                        className={
                            theme === "dark"
                                ? "border-amber-400 text-amber-400 hover:bg-gray-900 bg-transparent"
                                : "border-amber-600 text-amber-600 hover:bg-amber-50 bg-transparent"
                        }
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Round
                    </Button>
                </div>

                <div className="space-y-4">
                    {formData.evaluations.map((evaluation, index) => (
                        <div
                            key={index}
                            className={`border rounded-lg p-4 ${
                                theme === "dark"
                                    ? "border-gray-700 bg-gray-900/30"
                                    : "border-gray-200"
                            }`}
                        >
                            <div className="flex items-center justify-between mb-3">
                                <h4
                                    className={`font-medium ${theme === "dark" ? "text-white" : "text-gray-900"}`}
                                >
                                    Round {index + 1}
                                </h4>
                                {formData.evaluations.length > 1 && (
                                    <Button
                                        type="button"
                                        onClick={() => removeEvaluationRound(index)}
                                        variant="ghost"
                                        size="sm"
                                        className={
                                            theme === "dark"
                                                ? "text-red-400 hover:text-red-300 hover:bg-gray-900"
                                                : "text-red-600 hover:text-red-700 hover:bg-red-50"
                                        }
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <Label
                                        className={
                                            theme === "dark" ? "text-gray-300" : "text-gray-700"
                                        }
                                    >
                                        Round Name
                                    </Label>
                                    <Input
                                        value={evaluation.round}
                                        onChange={e =>
                                            updateEvaluationRound(index, "round", e.target.value)
                                        }
                                        placeholder="e.g., Q1 Review"
                                        className={
                                            theme === "dark"
                                                ? "bg-gray-900 border-gray-700 text-white placeholder:text-gray-400"
                                                : ""
                                        }
                                    />
                                </div>
                                <div>
                                    <Label
                                        className={
                                            theme === "dark" ? "text-gray-300" : "text-gray-700"
                                        }
                                    >
                                        From Date
                                    </Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                className={`w-full justify-start text-left font-normal ${theme === "dark" ? "border-gray-600 bg-gray-800 text-slate-200" : "border-slate-300 bg-white text-slate-700"} ${!evaluation.from ? "text-muted-foreground" : ""}`}
                                            >
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {evaluation.from
                                                    ? dayjs(evaluation.from).format(dateFormat)
                                                    : "Select date"}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0">
                                            <Calendar
                                                mode="single"
                                                selected={
                                                    evaluation.from
                                                        ? new Date(evaluation.from)
                                                        : undefined
                                                }
                                                onSelect={date =>
                                                    updateEvaluationRound(
                                                        index,
                                                        "from",
                                                        date ? dayjs(date).format(dateFormat) : "",
                                                    )
                                                }
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
                                </div>
                                <div>
                                    <Label
                                        className={
                                            theme === "dark" ? "text-gray-300" : "text-gray-700"
                                        }
                                    >
                                        To Date
                                    </Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                className={`w-full justify-start text-left font-normal ${theme === "dark" ? "border-gray-600 bg-gray-800 text-slate-200" : "border-slate-300 bg-white text-slate-700"} ${!evaluation.to ? "text-muted-foreground" : ""}`}
                                            >
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {evaluation.to
                                                    ? dayjs(evaluation.to).format(dateFormat)
                                                    : "Select date"}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0">
                                            <Calendar
                                                mode="single"
                                                selected={
                                                    evaluation.to
                                                        ? new Date(evaluation.to)
                                                        : undefined
                                                }
                                                onSelect={date =>
                                                    updateEvaluationRound(
                                                        index,
                                                        "to",
                                                        date ? dayjs(date).format(dateFormat) : "",
                                                    )
                                                }
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
                <Button
                    type="button"
                    variant="outline"
                    onClick={onCancel}
                    disabled={isLoading}
                    className={
                        theme === "dark" ? "border-gray-700 text-gray-300 hover:bg-gray-900" : ""
                    }
                >
                    Cancel
                </Button>
                <Button
                    type="submit"
                    disabled={isLoading}
                    className="bg-amber-600 hover:bg-amber-700 text-white"
                >
                    {isLoading ? "Saving..." : initialData ? "Update" : "Save"}
                </Button>
            </div>
        </form>
    );
}
