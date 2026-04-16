"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import {
    Filter,
    X,
    CalendarIcon,
    Search,
    RotateCcw,
    Settings,
    CheckCircle,
    Target,
    User,
    CalendarIcon as CalendarIconAlt,
    BarChart3,
    FileText,
    Tag,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ObjectiveModel } from "@/lib/models/objective-model";

interface FilterCriteria {
    [key: string]: any;
}

interface FilterField {
    key: keyof ObjectiveModel;
    label: string;
    type: "text" | "select" | "date" | "number" | "boolean" | "multiselect" | "textarea";
    options?: string[];
    icon?: React.ReactNode;
    description?: string;
}

interface ObjectivesFilterModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onApplyFilters: (filters: FilterCriteria, activeFields: string[]) => void;
    currentFilters?: FilterCriteria;
    objectives: ObjectiveModel[];
}

const filterFields: FilterField[] = [
    {
        key: "title",
        label: "Objective Title",
        type: "text",
        icon: <Target className="h-4 w-4" />,
        description: "Filter by objective title or keywords",
    },
    {
        key: "SMARTObjective",
        label: "SMART Objective Description",
        type: "textarea",
        icon: <FileText className="h-4 w-4" />,
        description: "Filter by SMART objective content",
    },
    {
        key: "status",
        label: "Status",
        type: "select",
        icon: <Tag className="h-4 w-4" />,
        options: ["Created", "Approved", "Refused", "Acknowledged"],
        description: "Filter by objective status",
    },
    {
        key: "employee",
        label: "Employee",
        type: "select",
        icon: <User className="h-4 w-4" />,
        options: ["John Smith", "Sarah Johnson", "Mike Chen", "Emily Davis", "Alex Rodriguez"],
        description: "Filter by assigned employee",
    },
    {
        key: "deptKPI",
        label: "Department KPI",
        type: "select",
        icon: <BarChart3 className="h-4 w-4" />,
        options: [
            "Revenue Growth",
            "Customer Satisfaction",
            "Operational Efficiency",
            "Employee Engagement",
            "Quality Metrics",
        ],
        description: "Filter by department KPI",
    },
    {
        key: "targetDate",
        label: "Target Date",
        type: "date",
        icon: <CalendarIconAlt className="h-4 w-4" />,
        description: "Filter by target completion date",
    },
    {
        key: "timestamp",
        label: "Created Date",
        type: "date",
        icon: <CalendarIconAlt className="h-4 w-4" />,
        description: "Filter by objective creation date",
    },
    {
        key: "percentage",
        label: "Progress Percentage",
        type: "number",
        icon: <BarChart3 className="h-4 w-4" />,
        description: "Filter by completion percentage",
    },
    {
        key: "period",
        label: "Period",
        type: "text",
        icon: <CalendarIconAlt className="h-4 w-4" />,
        description: "Filter by evaluation period",
    },
    {
        key: "round",
        label: "Round",
        type: "text",
        icon: <Target className="h-4 w-4" />,
        description: "Filter by evaluation round",
    },
    {
        key: "selfEvaluationValue",
        label: "Self Rating (1-5)",
        type: "number",
        icon: <CheckCircle className="h-4 w-4" />,
        description: "Filter by self rating value",
    },
    {
        key: "managerEvaluationValue",
        label: "Manager Rating (1-5)",
        type: "number",
        icon: <CheckCircle className="h-4 w-4" />,
        description: "Filter by manager rating value",
    },
    {
        key: "approved",
        label: "Approved",
        type: "boolean",
        icon: <CheckCircle className="h-4 w-4" />,
        description: "Filter by approval status",
    },
];

export function ObjectivesFilterModal({
    open,
    onOpenChange,
    onApplyFilters,
    currentFilters = {},
    objectives,
}: ObjectivesFilterModalProps) {
    const [selectedFields, setSelectedFields] = useState<string[]>([]);
    const [filters, setFilters] = useState<FilterCriteria>({});
    const [dateRanges, setDateRanges] = useState<{ [key: string]: { from?: Date; to?: Date } }>({});

    useEffect(() => {
        if (open) {
            // Initialize with current filters
            setFilters(currentFilters);
            setSelectedFields(Object.keys(currentFilters));
        }
    }, [open, currentFilters]);

    const handleFieldToggle = (fieldKey: string, checked: boolean) => {
        if (checked) {
            setSelectedFields([...selectedFields, fieldKey]);
        } else {
            setSelectedFields(selectedFields.filter(key => key !== fieldKey));
            // Remove filter for unchecked field
            const newFilters = { ...filters };
            delete newFilters[fieldKey];
            setFilters(newFilters);
        }
    };

    const handleFilterChange = (fieldKey: string, value: any) => {
        setFilters({
            ...filters,
            [fieldKey]: value,
        });
    };

    const handleDateRangeChange = (fieldKey: string, range: { from?: Date; to?: Date }) => {
        setDateRanges({
            ...dateRanges,
            [fieldKey]: range,
        });

        // Update filters with date range
        if (range.from || range.to) {
            setFilters({
                ...filters,
                [fieldKey]: range,
            });
        } else {
            const newFilters = { ...filters };
            delete newFilters[fieldKey];
            setFilters(newFilters);
        }
    };

    const applyFilters = () => {
        onApplyFilters(filters, selectedFields);
        onOpenChange(false);
    };

    const clearFilters = () => {
        setFilters({});
        setSelectedFields([]);
        setDateRanges({});
        onApplyFilters({}, []);
    };

    const renderFilterInput = (field: FilterField) => {
        const value = filters[field.key];

        switch (field.type) {
            case "text":
                return (
                    <Input
                        value={value || ""}
                        onChange={e => handleFilterChange(field.key, e.target.value)}
                        placeholder={`Enter ${field.label.toLowerCase()}...`}
                        className="mt-2"
                    />
                );

            case "textarea":
                return (
                    <Textarea
                        value={value || ""}
                        onChange={e => handleFilterChange(field.key, e.target.value)}
                        placeholder={`Enter ${field.label.toLowerCase()}...`}
                        className="mt-2 min-h-20"
                    />
                );

            case "select":
                return (
                    <Select
                        value={value || "All"} // Updated default value to be a non-empty string
                        onValueChange={newValue => handleFilterChange(field.key, newValue)}
                    >
                        <SelectTrigger className="mt-2">
                            <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="All">All {field.label}</SelectItem>
                            {field.options?.map(option => (
                                <SelectItem key={option} value={option}>
                                    {option}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                );

            case "number":
                return (
                    <div className="mt-2 space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <Label className="text-xs text-gray-500">Min</Label>
                                <Input
                                    type="number"
                                    value={value?.min || ""}
                                    onChange={e =>
                                        handleFilterChange(field.key, {
                                            ...value,
                                            min: e.target.value
                                                ? Number(e.target.value)
                                                : undefined,
                                        })
                                    }
                                    placeholder="Min"
                                />
                            </div>
                            <div>
                                <Label className="text-xs text-gray-500">Max</Label>
                                <Input
                                    type="number"
                                    value={value?.max || ""}
                                    onChange={e =>
                                        handleFilterChange(field.key, {
                                            ...value,
                                            max: e.target.value
                                                ? Number(e.target.value)
                                                : undefined,
                                        })
                                    }
                                    placeholder="Max"
                                />
                            </div>
                        </div>
                    </div>
                );

            case "boolean":
                return (
                    <Select
                        value={value !== undefined ? value.toString() : "All"} // Updated default value to be a non-empty string
                        onValueChange={newValue =>
                            handleFilterChange(
                                field.key,
                                newValue === "" ? undefined : newValue === "true",
                            )
                        }
                    >
                        <SelectTrigger className="mt-2">
                            <SelectValue placeholder="Select option" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="All">All</SelectItem>
                            <SelectItem value="true">Yes</SelectItem>
                            <SelectItem value="false">No</SelectItem>
                        </SelectContent>
                    </Select>
                );

            case "date":
                const dateRange = dateRanges[field.key] || {};
                return (
                    <div className="mt-2 space-y-2">
                        <Label className="text-xs text-gray-500">Date Range</Label>
                        <div className="grid grid-cols-2 gap-2">
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className={cn(
                                            "justify-start text-left font-normal",
                                            !dateRange.from && "text-muted-foreground",
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {dateRange.from
                                            ? format(dateRange.from, "PPP")
                                            : "From date"}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={dateRange.from}
                                        onSelect={date =>
                                            handleDateRangeChange(field.key, {
                                                ...dateRange,
                                                from: date,
                                            })
                                        }
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>

                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className={cn(
                                            "justify-start text-left font-normal",
                                            !dateRange.to && "text-muted-foreground",
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {dateRange.to ? format(dateRange.to, "PPP") : "To date"}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={dateRange.to}
                                        onSelect={date =>
                                            handleDateRangeChange(field.key, {
                                                ...dateRange,
                                                to: date,
                                            })
                                        }
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    const activeFiltersCount = Object.keys(filters).length;
    const selectedFieldsCount = selectedFields.length;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                <DialogHeader className="pb-4">
                    <DialogTitle className="flex items-center gap-2 text-xl font-semibold text-brand-800 dark:text-foreground">
                        <Filter className="h-5 w-5 text-brand-600" />
                        Advanced Objective Filters
                        {activeFiltersCount > 0 && (
                            <Badge className="bg-brand-100 text-brand-800 border-brand-200 dark:bg-brand-900/20 dark:text-brand-300">
                                {activeFiltersCount} active
                            </Badge>
                        )}
                    </DialogTitle>
                    <p className="text-sm text-brand-600 dark:text-muted-foreground">
                        Select fields to filter by and set your criteria to refine the objectives
                        list
                    </p>
                </DialogHeader>

                <div className="flex-1 overflow-hidden">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
                        {/* Field Selection Panel */}
                        <div className="lg:col-span-1 border-r border-accent-200 dark:border-border pr-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-semibold text-brand-800 dark:text-foreground flex items-center gap-2">
                                    <Settings className="h-4 w-4" />
                                    Filter Fields
                                </h3>
                                <Badge variant="outline" className="text-xs">
                                    {selectedFieldsCount} selected
                                </Badge>
                            </div>

                            <ScrollArea className="h-[400px]">
                                <div className="space-y-3">
                                    {filterFields.map(field => (
                                        <div
                                            key={field.key}
                                            className={cn(
                                                "flex items-start space-x-3 p-3 rounded-lg border transition-all",
                                                selectedFields.includes(field.key)
                                                    ? "border-brand-200 bg-brand-50 dark:border-brand-800 dark:bg-brand-950/20"
                                                    : "border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600",
                                            )}
                                        >
                                            <Checkbox
                                                id={field.key}
                                                checked={selectedFields.includes(field.key)}
                                                onCheckedChange={checked =>
                                                    handleFieldToggle(field.key, checked as boolean)
                                                }
                                                className="mt-0.5"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <Label
                                                    htmlFor={field.key}
                                                    className="text-sm font-medium text-brand-700 dark:text-foreground cursor-pointer flex items-center gap-2"
                                                >
                                                    {field.icon}
                                                    {field.label}
                                                </Label>
                                                {field.description && (
                                                    <p className="text-xs text-brand-500 dark:text-brand-400 mt-1">
                                                        {field.description}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        </div>

                        {/* Filter Configuration Panel */}
                        <div className="lg:col-span-2">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-semibold text-brand-800 dark:text-foreground flex items-center gap-2">
                                    <Search className="h-4 w-4" />
                                    Filter Configuration
                                </h3>
                                {selectedFieldsCount > 0 && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={clearFilters}
                                        className="text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-950/20 bg-transparent"
                                    >
                                        <RotateCcw className="h-3 w-3 mr-2" />
                                        Clear All
                                    </Button>
                                )}
                            </div>

                            <ScrollArea className="h-[400px]">
                                {selectedFieldsCount === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full text-center py-12">
                                        <Filter className="h-12 w-12 text-gray-400 mb-4" />
                                        <h4 className="text-lg font-medium text-gray-600 dark:text-gray-400 mb-2">
                                            No Filter Fields Selected
                                        </h4>
                                        <p className="text-sm text-gray-500 dark:text-gray-500 max-w-sm">
                                            Select one or more fields from the left panel to
                                            configure your filtering criteria
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        {selectedFields.map(fieldKey => {
                                            const field = filterFields.find(
                                                f => f.key === fieldKey,
                                            );
                                            if (!field) return null;

                                            return (
                                                <div
                                                    key={fieldKey}
                                                    className="p-4 border border-accent-200 dark:border-border rounded-lg bg-white dark:bg-card"
                                                >
                                                    <div className="flex items-center justify-between mb-2">
                                                        <Label className="font-medium text-brand-700 dark:text-foreground flex items-center gap-2">
                                                            {field.icon}
                                                            {field.label}
                                                        </Label>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() =>
                                                                handleFieldToggle(fieldKey, false)
                                                            }
                                                            className="h-6 w-6 p-0 text-gray-400 hover:text-red-600"
                                                        >
                                                            <X className="h-3 w-3" />
                                                        </Button>
                                                    </div>
                                                    {renderFilterInput(field)}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </ScrollArea>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <Separator className="my-4" />
                <div className="flex items-center justify-between">
                    <div className="text-sm text-brand-600 dark:text-muted-foreground">
                        {selectedFieldsCount > 0 && (
                            <span>
                                {selectedFieldsCount} field{selectedFieldsCount !== 1 ? "s" : ""}{" "}
                                selected
                                {activeFiltersCount > 0 &&
                                    `, ${activeFiltersCount} filter${activeFiltersCount !== 1 ? "s" : ""} active`}
                            </span>
                        )}
                    </div>
                    <div className="flex gap-3">
                        <Button
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            className="border-gray-300 text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-800"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={applyFilters}
                            disabled={selectedFieldsCount === 0}
                            className="bg-brand-600 hover:bg-brand-700 text-white disabled:opacity-50"
                        >
                            <Search className="h-4 w-4 mr-2" />
                            Apply Filters
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
