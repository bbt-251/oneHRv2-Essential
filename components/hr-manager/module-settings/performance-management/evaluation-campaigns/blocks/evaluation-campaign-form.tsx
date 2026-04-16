"use client";

import CascaderDropdown, { Option } from "@/components/custom-cascader";
import { useTheme } from "@/components/theme-provider";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useFirestore } from "@/context/firestore-context";
import { useToast } from "@/context/toastContext";
import { EvaluationCampaignModel, PeriodicOptionModel } from "@/lib/models/performance";
import { dateFormat, getTimestamp } from "@/lib/util/dayjs_format";
import getEmployeeFullName from "@/lib/util/getEmployeeFullName";
import dayjs from "dayjs";
import { CalendarIcon } from "lucide-react";
import { useEffect, useState } from "react";

interface CampaignsFormProps {
    initialData?: EvaluationCampaignModel | null;
    onSubmit: (data: Omit<EvaluationCampaignModel, "id">) => void;
    onCancel: () => void;
    isLoading?: boolean;
}

export default function CampaignsForm({
    initialData,
    onSubmit,
    onCancel,
    isLoading = false,
}: CampaignsFormProps) {
    const { theme } = useTheme();
    const { showToast } = useToast();
    const { activeEmployees, hrSettings } = useFirestore();
    const [formData, setFormData] = useState<EvaluationCampaignModel>({
        id: null,
        timestamp: getTimestamp(),
        periodID: "",
        roundID: "",
        campaignName: "",
        startDate: "",
        endDate: "",
        associatedEmployees: [],
        promotionTriggered: false,
    });
    const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
    const [periodRoundSelection, setPeriodRoundSelection] = useState<string>("");

    // Initialize employees with all selected by default
    useEffect(() => {
        const allEmployeeIds = activeEmployees.map(emp => emp.uid);
        setSelectedEmployees(allEmployeeIds);
    }, [activeEmployees]);

    useEffect(() => {
        if (initialData) {
            setFormData({ ...initialData });
            setSelectedEmployees(initialData.associatedEmployees);
            setPeriodRoundSelection(`${initialData.periodID}|${initialData.roundID}`);
        }
    }, [initialData]);

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

    // Employee selection handlers
    const handleSelectAllEmployees = () => {
        const allEmployeeIds = activeEmployees.map(emp => emp.uid);
        setSelectedEmployees(allEmployeeIds);
    };

    const handleRemoveAllEmployees = () => {
        setSelectedEmployees([]);
    };

    const handleEmployeeToggle = (employeeUid: string) => {
        setSelectedEmployees(prev =>
            prev.includes(employeeUid)
                ? prev.filter(id => id !== employeeUid)
                : [...prev, employeeUid],
        );
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (!formData.campaignName.trim()) {
            showToast("Campaign name is required", "Validation Error", "error");
            return;
        }

        if (!formData.periodID.trim()) {
            showToast("Period is required", "Validation Error", "error");
            return;
        }

        if (!formData.roundID.trim()) {
            showToast("Round is required", "Validation Error", "error");
            return;
        }

        if (new Date(formData.startDate) >= new Date(formData.endDate)) {
            showToast("Start date must be before end date", "Validation Error", "error");
            return;
        }

        if (selectedEmployees.length === 0) {
            showToast("At least one employee must be selected", "Validation Error", "error");
            return;
        }

        try {
            onSubmit({
                timestamp: formData.timestamp,
                periodID: formData.periodID.trim(),
                roundID: formData.roundID.trim(),
                campaignName: formData.campaignName.trim(),
                startDate: formData.startDate,
                endDate: formData.endDate,
                associatedEmployees: selectedEmployees,
                promotionTriggered: formData.promotionTriggered,
            });
        } catch (error) {
            showToast("Failed to save evaluation campaign", "Error", "error");
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div>
                <Label
                    htmlFor="campaignName"
                    className={theme === "dark" ? "text-gray-300" : "text-gray-700"}
                >
                    Campaign Name
                </Label>
                <Input
                    value={formData.campaignName}
                    onChange={e => setFormData(prev => ({ ...prev, campaignName: e.target.value }))}
                    placeholder="Enter campaign name (e.g., Annual Performance Review 2024)"
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

            <Accordion type="single" collapsible className="w-full">
                <AccordionItem
                    value="employees"
                    className={theme === "dark" ? "border-gray-700" : ""}
                >
                    <AccordionTrigger
                        className={`hover:no-underline ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}
                    >
                        <div className="flex items-center justify-between w-full pr-4">
                            <span>Associated Employees ({selectedEmployees.length} selected)</span>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-4 pt-4">
                        <div className="flex gap-2 mb-4">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={handleSelectAllEmployees}
                                className={
                                    theme === "dark"
                                        ? "border-gray-700 text-gray-300 hover:bg-gray-900"
                                        : ""
                                }
                            >
                                Select All
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={handleRemoveAllEmployees}
                                className={
                                    theme === "dark"
                                        ? "border-gray-700 text-gray-300 hover:bg-gray-900"
                                        : ""
                                }
                            >
                                Remove All
                            </Button>
                        </div>

                        <div
                            className={`max-h-96 overflow-y-auto rounded-md border p-4 ${theme === "dark" ? "border-gray-700 bg-gray-900/30" : "border-gray-200 bg-gray-50"}`}
                        >
                            <div className="grid grid-cols-1 gap-3">
                                {activeEmployees.map(employee => (
                                    <div key={employee.uid} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={`employee-${employee.uid}`}
                                            checked={selectedEmployees.includes(employee.uid)}
                                            onCheckedChange={() =>
                                                handleEmployeeToggle(employee.uid)
                                            }
                                            className={
                                                theme === "dark"
                                                    ? "border-gray-600 data-[state=checked]:bg-amber-600"
                                                    : "data-[state=checked]:bg-amber-600"
                                            }
                                        />
                                        <Label
                                            htmlFor={`employee-${employee.uid}`}
                                            className={`text-sm cursor-pointer flex-1 ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}
                                        >
                                            <div>
                                                <div className="font-medium">
                                                    {getEmployeeFullName(employee)}
                                                </div>
                                                <div
                                                    className={`text-xs ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}
                                                >
                                                    Employee ID: <em>{employee.employeeID}</em>
                                                </div>
                                                <div
                                                    className={`text-xs ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}
                                                >
                                                    Employment Position:{" "}
                                                    <em>
                                                        {hrSettings.positions.find(
                                                            p =>
                                                                p.id ===
                                                                employee.employmentPosition,
                                                        )?.name ?? "-"}
                                                    </em>
                                                </div>
                                            </div>
                                        </Label>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>

            <div className="flex items-center space-x-2">
                <Checkbox
                    id="promotionTriggered"
                    checked={formData.promotionTriggered}
                    onCheckedChange={checked =>
                        setFormData(prev => ({ ...prev, promotionTriggered: checked as boolean }))
                    }
                    className={
                        theme === "dark"
                            ? "border-gray-700 data-[state=checked]:bg-amber-600"
                            : "data-[state=checked]:bg-amber-600"
                    }
                />
                <Label
                    htmlFor="promotionTriggered"
                    className={`text-sm ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}
                >
                    Trigger promotions based on evaluation results
                </Label>
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
