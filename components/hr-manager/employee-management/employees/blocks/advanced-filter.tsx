"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Filter, X, ChevronDown } from "lucide-react";
import type { EmployeeModel } from "@/lib/models/employee";
import { useTheme } from "@/components/theme-provider";

export interface FilterConfig {
    field: keyof EmployeeModel;
    operator: "equals" | "contains" | "startsWith" | "endsWith" | "in";
    value: string | string[];
    label: string;
}

interface SelectOption {
    id: string;
    name: string;
}

interface AdvancedFilterHrSettings {
    positions?: SelectOption[];
    departmentSettings?: SelectOption[];
    contractTypes?: SelectOption[];
    levelOfEducations?: SelectOption[];
    maritalStatuses?: SelectOption[];
    sectionSettings?: SelectOption[];
    grades?: SelectOption[];
    shiftTypes?: SelectOption[];
}

interface AdvancedFilterProps {
    employees: EmployeeModel[];
    hrSettings?: AdvancedFilterHrSettings;
    onFiltersChange: (filters: FilterConfig[]) => void;
}

export function AdvancedFilter({ employees, hrSettings, onFiltersChange }: AdvancedFilterProps) {
    const { theme } = useTheme();
    const [open, setOpen] = useState<boolean>(false);
    const [filters, setFilters] = useState<FilterConfig[]>([]);

    // Build filter field config with dynamic options using hrSettings (if available) or falling back to values derived from employees
    const filterFields = useMemo(() => {
        const toOptions = (items: SelectOption[] | undefined) =>
            (items || []).map(i => ({ id: i.id, name: i.name }));

        const genderOptions = Array.from(new Set(employees.map(e => e.gender).filter(Boolean))).map(
            g => ({ id: g, name: g }),
        );
        const contractStatusOptions = Array.from(
            new Set(employees.map(e => e.contractStatus).filter(Boolean)),
        ).map(s => ({ id: s, name: s }));

        // Get unique reporting line managers with their full names, sorted alphabetically
        const reportingLineManagerOptions = Array.from(
            new Set(employees.map(e => e.reportingLineManager).filter(Boolean)),
        )
            .map(managerId => {
                const manager = employees.find(emp => emp.uid === managerId);
                const fullName = manager ? `${manager.firstName} ${manager.surname}` : managerId;
                return { id: managerId as string, name: fullName as string };
            })
            .sort((a, b) => a.name.localeCompare(b.name));

        return [
            { key: "firstName" as keyof EmployeeModel, label: "First Name", type: "text" },
            { key: "surname" as keyof EmployeeModel, label: "Surname", type: "text" },
            { key: "employeeID" as keyof EmployeeModel, label: "Employee ID", type: "text" },
            {
                key: "gender" as keyof EmployeeModel,
                label: "Gender",
                type: "select",
                options: genderOptions,
            },
            {
                key: "employmentPosition" as keyof EmployeeModel,
                label: "Position",
                type: "select",
                options: toOptions(hrSettings?.positions),
            },
            {
                key: "department" as keyof EmployeeModel,
                label: "Department",
                type: "select",
                options: toOptions(hrSettings?.departmentSettings),
            },
            {
                key: "contractType" as keyof EmployeeModel,
                label: "Contract Type",
                type: "select",
                options: toOptions(hrSettings?.contractTypes),
            },
            {
                key: "contractStatus" as keyof EmployeeModel,
                label: "Status",
                type: "select",
                options: contractStatusOptions,
            },
            {
                key: "levelOfEducation" as keyof EmployeeModel,
                label: "Education",
                type: "select",
                options: toOptions(hrSettings?.levelOfEducations),
            },
            {
                key: "maritalStatus" as keyof EmployeeModel,
                label: "Marital Status",
                type: "select",
                options: toOptions(hrSettings?.maritalStatuses),
            },
            {
                key: "section" as keyof EmployeeModel,
                label: "Section",
                type: "select",
                options: toOptions(hrSettings?.sectionSettings),
            },
            {
                key: "gradeLevel" as keyof EmployeeModel,
                label: "Grade Level",
                type: "select",
                options: toOptions(hrSettings?.grades),
            },
            {
                key: "shiftType" as keyof EmployeeModel,
                label: "Shift Type",
                type: "select",
                options: toOptions(hrSettings?.shiftTypes),
            },
            {
                key: "reportingLineManager" as keyof EmployeeModel,
                label: "Reporting Line Manager",
                type: "multiselect",
                options: reportingLineManagerOptions,
            },
        ];
    }, [employees, hrSettings]);

    const addFilter = () => {
        const newFilter: FilterConfig = {
            field: "firstName",
            operator: "contains",
            value: "",
            label: "First Name",
        };
        setFilters([...filters, newFilter]);
    };

    const updateFilter = (index: number, updates: Partial<FilterConfig>) => {
        const updatedFilters = filters.map((filter, i) =>
            i === index ? { ...filter, ...updates } : filter,
        );
        setFilters(updatedFilters);
        onFiltersChange(updatedFilters);
    };

    const removeFilter = (index: number) => {
        const updatedFilters = filters.filter((_, i) => i !== index);
        setFilters(updatedFilters);
        onFiltersChange(updatedFilters);
    };

    const clearAllFilters = () => {
        setFilters([]);
        onFiltersChange([]);
    };

    // Dynamic theme classes
    const popoverContentClasses =
        theme === "dark"
            ? "bg-black border-gray-700 text-white"
            : "bg-white border-gray-200 text-gray-900";
    const buttonClasses =
        theme === "dark"
            ? "bg-black border-gray-600 hover:bg-black text-gray-200"
            : "bg-white border-gray-300 hover:bg-gray-100 text-primary-700";
    const inputClasses =
        theme === "dark"
            ? "bg-black border-gray-600 focus:border-blue-500 focus:ring-blue-500"
            : "border-gray-300 focus:border-primary-500 focus:ring-primary-500";
    const labelClasses = theme === "dark" ? "text-gray-400" : "text-gray-600";
    const selectTriggerClasses =
        theme === "dark" ? "bg-black border-gray-600" : "bg-white border-gray-300";
    const selectContentClasses =
        theme === "dark" ? "bg-black border-gray-700 text-white" : "bg-white";

    // Search state for multi-select dropdowns
    const [multiSelectSearch, setMultiSelectSearch] = useState<Record<number, string>>({});

    const renderFilterValue = (filter: FilterConfig, index: number) => {
        const fieldConfig = filterFields.find(f => f.key === filter.field);

        // Handle multiselect type (for Reporting Line Manager)
        if (fieldConfig?.type === "multiselect") {
            const searchTerm = multiSelectSearch[index] || "";
            const filteredOptions =
                fieldConfig.options?.filter(option =>
                    option.name.toLowerCase().includes(searchTerm.toLowerCase()),
                ) || [];

            const selectedLabels =
                fieldConfig.options
                    ?.filter(o => Array.isArray(filter.value) && filter.value.includes(o.id))
                    .map(o => o.name) || [];

            return (
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            role="combobox"
                            className={`w-full justify-between h-auto min-h-10 text-left font-normal ${selectTriggerClasses}`}
                        >
                            <div className="flex flex-wrap gap-1">
                                {selectedLabels.length > 0 ? (
                                    selectedLabels.slice(0, 3).map(label => (
                                        <span
                                            key={label}
                                            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium mr-1 mb-1 ${
                                                theme === "dark"
                                                    ? "bg-blue-900 text-blue-200"
                                                    : "bg-blue-100 text-blue-800"
                                            }`}
                                        >
                                            {label}
                                        </span>
                                    ))
                                ) : (
                                    <span
                                        className={
                                            theme === "dark" ? "text-gray-400" : "text-gray-500"
                                        }
                                    >
                                        Select managers
                                    </span>
                                )}
                                {selectedLabels.length > 3 && (
                                    <span
                                        className={`text-xs ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}
                                    >
                                        +{selectedLabels.length - 3} more
                                    </span>
                                )}
                            </div>
                            <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0" align="start">
                        <div className="p-2">
                            <Input
                                placeholder="Search managers..."
                                value={searchTerm}
                                onChange={e =>
                                    setMultiSelectSearch(prev => ({
                                        ...prev,
                                        [index]: e.target.value,
                                    }))
                                }
                                className={inputClasses}
                            />
                        </div>
                        <ScrollArea className="h-[200px]">
                            <div className="p-2 pt-0">
                                {filteredOptions.length > 0 ? (
                                    filteredOptions.map(option => (
                                        <div
                                            key={option.id}
                                            className="flex items-center space-x-2 p-2 hover:bg-accent rounded-md cursor-pointer"
                                            onClick={() => {
                                                const currentValues = Array.isArray(filter.value)
                                                    ? filter.value
                                                    : [];
                                                const newValues = currentValues.includes(option.id)
                                                    ? currentValues.filter(
                                                        (v: string) => v !== option.id,
                                                    )
                                                    : [...currentValues, option.id];
                                                updateFilter(index, { value: newValues });
                                            }}
                                        >
                                            <Checkbox
                                                checked={
                                                    Array.isArray(filter.value) &&
                                                    filter.value.includes(option.id)
                                                }
                                                onCheckedChange={() => {
                                                    const currentValues = Array.isArray(
                                                        filter.value,
                                                    )
                                                        ? filter.value
                                                        : [];
                                                    const newValues = currentValues.includes(
                                                        option.id,
                                                    )
                                                        ? currentValues.filter(
                                                            (v: string) => v !== option.id,
                                                        )
                                                        : [...currentValues, option.id];
                                                    updateFilter(index, { value: newValues });
                                                }}
                                                className={
                                                    theme === "dark"
                                                        ? "border-gray-600 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                                                        : ""
                                                }
                                            />
                                            <span className="text-sm">{option.name}</span>
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-2 text-sm text-gray-500">
                                        No managers found
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                    </PopoverContent>
                </Popover>
            );
        }

        if (fieldConfig?.type === "select" && filter.operator === "in") {
            return (
                <div className="space-y-2">
                    <Label
                        className={`text-sm font-medium ${theme === "dark" ? "text-gray-300" : ""}`}
                    >
                        Select values:
                    </Label>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                        {fieldConfig.options?.map(option => (
                            <div key={option.id} className="flex items-center space-x-2">
                                <Checkbox
                                    id={`${index}-${option.id}`}
                                    checked={
                                        Array.isArray(filter.value) &&
                                        filter.value.includes(option.id)
                                    }
                                    onCheckedChange={(checked: boolean | "indeterminate") => {
                                        const currentValues = Array.isArray(filter.value)
                                            ? filter.value
                                            : [];
                                        const newValues =
                                            checked === true
                                                ? [...currentValues, option.id]
                                                : currentValues.filter(
                                                    (v: string) => v !== option.id,
                                                );
                                        updateFilter(index, { value: newValues });
                                    }}
                                    className={
                                        theme === "dark"
                                            ? "border-gray-600 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                                            : ""
                                    }
                                />
                                <label htmlFor={`${index}-${option.id}`} className="text-sm">
                                    {option.name}
                                </label>
                            </div>
                        ))}
                    </div>
                </div>
            );
        }

        if (fieldConfig?.type === "select") {
            return (
                <Select
                    value={typeof filter.value === "string" ? filter.value : ""}
                    onValueChange={(value: string) => updateFilter(index, { value })}
                >
                    <SelectTrigger className={`w-full ${selectTriggerClasses}`}>
                        <SelectValue placeholder="Select value" />
                    </SelectTrigger>
                    <SelectContent className={selectContentClasses}>
                        {fieldConfig.options?.map((option: SelectOption) => (
                            <SelectItem key={option.id} value={option.id}>
                                {option.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            );
        }

        return (
            <Input
                placeholder="Enter value"
                value={typeof filter.value === "string" ? filter.value : ""}
                onChange={e => updateFilter(index, { value: e.target.value })}
                className={inputClasses}
            />
        );
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className={buttonClasses}>
                    <Filter className="w-4 h-4 mr-2" />
                    Filters {filters.length > 0 && `(${filters.length})`}
                </Button>
            </PopoverTrigger>
            <PopoverContent className={`w-96 p-4 ${popoverContentClasses}`} align="start">
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h4
                            className={`font-medium ${theme === "dark" ? "text-gray-100" : "text-primary-900"}`}
                        >
                            Advanced Filters
                        </h4>
                        {filters.length > 0 && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={clearAllFilters}
                                className={
                                    theme === "dark"
                                        ? "text-red-400 hover:bg-red-900/50"
                                        : "text-red-600"
                                }
                            >
                                Clear All
                            </Button>
                        )}
                    </div>

                    <div className="space-y-4 max-h-80 overflow-y-auto p-1">
                        {filters.map((filter, index) => {
                            const fieldConfig = filterFields.find(f => f.key === filter.field);
                            return (
                                <div
                                    key={index}
                                    className={`p-3 border rounded-lg space-y-3 ${theme === "dark" ? "bg-black/50 border-gray-700" : "border-gray-200"}`}
                                >
                                    <div className="flex items-center justify-between">
                                        <Label className="text-sm font-medium">
                                            Filter {index + 1}
                                        </Label>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => removeFilter(index)}
                                            className={`h-6 w-6 p-0 ${theme === "dark" ? "hover:bg-gray-700" : ""}`}
                                        >
                                            <X className="w-3 h-3" />
                                        </Button>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <Label className={`text-xs ${labelClasses}`}>
                                                Field
                                            </Label>
                                            <Select
                                                value={filter.field}
                                                onValueChange={(value: string) => {
                                                    const selectedFieldConfig = filterFields.find(
                                                        f => f.key === value,
                                                    );
                                                    // For multiselect type, use "in" operator by default
                                                    const defaultOperator =
                                                        selectedFieldConfig?.type === "multiselect"
                                                            ? "in"
                                                            : selectedFieldConfig?.type === "select"
                                                                ? "equals"
                                                                : "contains";
                                                    const defaultValue =
                                                        selectedFieldConfig?.type === "multiselect"
                                                            ? []
                                                            : selectedFieldConfig?.type === "select"
                                                                ? ""
                                                                : filter.value;
                                                    updateFilter(index, {
                                                        field: value as keyof EmployeeModel,
                                                        label: selectedFieldConfig?.label || value,
                                                        value: defaultValue,
                                                        operator: defaultOperator,
                                                    });
                                                    // Clear search when changing field
                                                    setMultiSelectSearch(prev => {
                                                        const newState = { ...prev };
                                                        delete newState[index];
                                                        return newState;
                                                    });
                                                }}
                                            >
                                                <SelectTrigger className={selectTriggerClasses}>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className={selectContentClasses}>
                                                    {filterFields.map(field => (
                                                        <SelectItem
                                                            key={field.key}
                                                            value={field.key}
                                                        >
                                                            {field.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {fieldConfig?.type !== "multiselect" && (
                                            <div>
                                                <Label className={`text-xs ${labelClasses}`}>
                                                    Operator
                                                </Label>
                                                <Select
                                                    value={filter.operator}
                                                    onValueChange={(value: string) =>
                                                        updateFilter(index, {
                                                            operator:
                                                                value as FilterConfig["operator"],
                                                            value: value === "in" ? [] : "",
                                                        })
                                                    }
                                                >
                                                    <SelectTrigger className={selectTriggerClasses}>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent className={selectContentClasses}>
                                                        <SelectItem value="equals">
                                                            Equals
                                                        </SelectItem>
                                                        <SelectItem value="contains">
                                                            Contains
                                                        </SelectItem>
                                                        <SelectItem value="startsWith">
                                                            Starts with
                                                        </SelectItem>
                                                        <SelectItem value="endsWith">
                                                            Ends with
                                                        </SelectItem>
                                                        <SelectItem value="in">
                                                            In (multiple)
                                                        </SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        )}
                                    </div>

                                    <div>
                                        <Label className={`text-xs ${labelClasses}`}>Value</Label>
                                        {renderFilterValue(filter, index)}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <Button
                        onClick={addFilter}
                        variant="outline"
                        className={`w-full ${buttonClasses}`}
                    >
                        Add Filter
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    );
}
