"use client";

import CascaderDropdown, { Option } from "@/components/custom-cascader";
import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useFirestore } from "@/context/firestore-context";
import { useToast } from "@/context/toastContext";
import { MonitoringPeriodModel, PeriodicOptionModel } from "@/lib/models/performance";
import { dateFormat, getTimestamp } from "@/lib/util/dayjs_format";
import dayjs from "dayjs";
import { CalendarIcon } from "lucide-react";
import { useEffect, useState } from "react";

interface MonitoringFormProps {
    initialData?: MonitoringPeriodModel | null;
    onSubmit: (data: Omit<MonitoringPeriodModel, "id">) => void;
    onCancel: () => void;
    isLoading?: boolean;
}

export default function MonitoringForm({
    initialData,
    onSubmit,
    onCancel,
    isLoading = false,
}: MonitoringFormProps) {
    const { theme } = useTheme();
    const { showToast } = useToast();
    const { hrSettings } = useFirestore();
    const [formData, setFormData] = useState<MonitoringPeriodModel>({
        id: null,
        timestamp: getTimestamp(),
        periodID: "",
        roundID: "",
        monitoringPeriodName: "",
        startDate: "",
        endDate: "",
    });
    const [periodRoundSelection, setPeriodRoundSelection] = useState<string>("");

    // Create cascader options from periodic options
    const createCascaderOptions = (): Option[] => {
        return hrSettings.periodicOptions.map((periodOption: PeriodicOptionModel) => ({
            value: periodOption.id || "",
            label: `${periodOption.periodName} (${periodOption.year})`,
            children: periodOption.evaluations.map(evaluation => ({
                value: `${periodOption.id}|${evaluation.id}`,
                label: evaluation.round,
            })),
        }));
    };

    // Handle period/round selection from cascader
    const handlePeriodRoundSelect = (value: string) => {
        setPeriodRoundSelection(value);
        const [periodID, roundID] = value.split("|");
        setFormData(prev => ({
            ...prev,
            periodID: periodID || "",
            roundID: roundID || "",
        }));
    };

    useEffect(() => {
        if (initialData) {
            setFormData({ ...initialData });
            setPeriodRoundSelection(`${initialData.periodID}|${initialData.roundID}`);
        }
    }, [initialData]);

    useEffect(() => {
        if (initialData) {
            setFormData({ ...initialData });
        }
    }, [initialData]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (!formData.periodID.trim()) {
            showToast("Period is required", "Validation Error", "error");
            return;
        }

        if (!formData.roundID.trim()) {
            showToast("Round is required", "Validation Error", "error");
            return;
        }

        if (!formData.monitoringPeriodName.trim()) {
            showToast("Monitoring period name is required", "Validation Error", "error");
            return;
        }
        if (new Date(formData.startDate) >= new Date(formData.endDate)) {
            showToast("Start date must be before end date", "Validation Error", "error");
            return;
        }

        try {
            onSubmit({
                timestamp: formData.timestamp,
                periodID: formData.periodID.trim(),
                roundID: formData.roundID.trim(),
                monitoringPeriodName: formData.monitoringPeriodName.trim(),
                startDate: formData.startDate,
                endDate: formData.endDate,
            });
        } catch (error) {
            showToast("Failed to save monitoring period", "Error", "error");
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div>
                <Label
                    htmlFor="monitoringPeriodName"
                    className={theme === "dark" ? "text-gray-300" : "text-gray-700"}
                >
                    Monitoring Period Name
                </Label>
                <Input
                    value={formData.monitoringPeriodName}
                    onChange={e =>
                        setFormData(prev => ({ ...prev, monitoringPeriodName: e.target.value }))
                    }
                    placeholder="Enter monitoring period name (e.g., Annual Performance Review 2024)"
                    className={
                        theme === "dark"
                            ? "bg-gray-900 border-gray-700 text-white placeholder:text-gray-400"
                            : ""
                    }
                />
            </div>

            <div>
                <Label className={theme === "dark" ? "text-gray-300" : "text-gray-700"}>
                    Period & Round
                </Label>
                <div className="mt-2">
                    <CascaderDropdown
                        options={createCascaderOptions()}
                        setDynamicOptions={handlePeriodRoundSelect}
                        value={periodRoundSelection}
                    />
                </div>
                <p
                    className={`text-xs mt-1 ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}
                >
                    Select period and evaluation round from periodic options
                </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label
                        htmlFor="startDate"
                        className={theme === "dark" ? "text-gray-300" : "text-gray-700"}
                    >
                        Start Date
                    </Label>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                className={`w-full justify-start text-left font-normal ${theme === "dark" ? "border-gray-600 bg-gray-800 text-slate-200" : "border-slate-300 bg-white text-slate-700"} ${!formData.startDate ? "text-muted-foreground" : ""}`}
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
                                    formData.startDate ? new Date(formData.startDate) : undefined
                                }
                                onSelect={date =>
                                    setFormData(prev => ({
                                        ...prev,
                                        startDate: date ? dayjs(date).format(dateFormat) : "",
                                    }))
                                }
                                initialFocus
                            />
                        </PopoverContent>
                    </Popover>
                </div>
                <div>
                    <Label
                        htmlFor="endDate"
                        className={theme === "dark" ? "text-gray-300" : "text-gray-700"}
                    >
                        End Date
                    </Label>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                className={`w-full justify-start text-left font-normal ${theme === "dark" ? "border-gray-600 bg-gray-800 text-slate-200" : "border-slate-300 bg-white text-slate-700"} ${!formData.endDate ? "text-muted-foreground" : ""}`}
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
                                selected={formData.endDate ? new Date(formData.endDate) : undefined}
                                onSelect={date =>
                                    setFormData(prev => ({
                                        ...prev,
                                        endDate: date ? dayjs(date).format(dateFormat) : "",
                                    }))
                                }
                                initialFocus
                            />
                        </PopoverContent>
                    </Popover>
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
