"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Filter, Plus, X } from "lucide-react";
import type { HrFilterConfig } from "./report-types";
import {
    HR_AVAILABLE_DIMENSIONS,
    HR_AVAILABLE_MEASURES,
    getHrReportingFieldLabel,
} from "./reporting-data";
import {
    getFilterValueOptions,
    type FilterValueOption,
} from "@/lib/api/hr-reporting/hr-report-filter-options";

interface ReportFilterBarProps {
    filters: HrFilterConfig[];
    onFiltersChange: (filters: HrFilterConfig[]) => void;
}

const operators = [
    { value: "equals", label: "= (equals)" },
    { value: "not_equals", label: "!= (not equals)" },
    { value: "greater_than", label: "> (greater than)" },
    { value: "less_than", label: "< (less than)" },
    { value: "contains", label: "contains (contains)" },
    { value: "date_equals", label: "date = (date equals)" },
    { value: "date_before", label: "date < (date before)" },
    { value: "date_after", label: "date > (date after)" },
    { value: "date_between", label: "date between (date between)" },
];

const allFields = [...HR_AVAILABLE_DIMENSIONS, ...HR_AVAILABLE_MEASURES];

export function HrReportFilterBar({ filters, onFiltersChange }: ReportFilterBarProps) {
    const [isAdding, setIsAdding] = useState(false);
    const [newFilter, setNewFilter] = useState<HrFilterConfig>({
        field: "",
        operator: "equals",
        value: "",
    });
    const [valueOptions, setValueOptions] = useState<FilterValueOption[] | null>(null);
    const [valueOptionsLoading, setValueOptionsLoading] = useState(false);

    useEffect(() => {
        if (!newFilter.field) {
            setValueOptions(null);
            return;
        }
        let cancelled = false;
        setValueOptionsLoading(true);
        setValueOptions(null);
        getFilterValueOptions(newFilter.field)
            .then(opts => {
                if (!cancelled) {
                    setValueOptions(opts ?? null);
                }
            })
            .catch(() => {
                if (!cancelled) setValueOptions([]);
            })
            .finally(() => {
                if (!cancelled) setValueOptionsLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [newFilter.field]);

    const handleFieldChange = (field: string) => {
        setNewFilter({ ...newFilter, field, value: "" });
    };

    const handleAddFilter = () => {
        if (newFilter.field && newFilter.value) {
            onFiltersChange([...filters, newFilter]);
            setNewFilter({ field: "", operator: "equals", value: "" });
            setIsAdding(false);
        }
    };

    const handleRemoveFilter = (index: number) => {
        onFiltersChange(filters.filter((_, i) => i !== index));
    };

    const getFieldLabel = (fieldValue: string) => getHrReportingFieldLabel(fieldValue);

    const getOperatorLabel = (opValue: string) => {
        return operators.find(o => o.value === opValue)?.label || opValue;
    };

    return (
        <div className="flex items-center gap-2 px-6 py-3 border-b">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Filter className="h-4 w-4" />
                <span className="font-medium">Filters:</span>
            </div>

            <div className="flex items-center gap-2 flex-wrap flex-1">
                {filters.length === 0 && (
                    <span className="text-sm text-muted-foreground">No filters applied</span>
                )}

                {filters.map((filter, index) => (
                    <Badge
                        key={index}
                        variant="secondary"
                        className="flex items-center gap-1.5 px-2 py-1"
                    >
                        <span className="font-medium">{getFieldLabel(filter.field)}</span>
                        <span className="text-muted-foreground">
                            {getOperatorLabel(filter.operator)}
                        </span>
                        <span>{filter.value}</span>
                        <button onClick={() => handleRemoveFilter(index)} className="ml-1">
                            <X className="h-3 w-3" />
                        </button>
                    </Badge>
                ))}

                <Popover open={isAdding} onOpenChange={setIsAdding}>
                    <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className="h-7 border-dashed">
                            <Plus className="h-3 w-3 mr-1" />
                            Add Filter
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent
                        className="w-80 p-4 backdrop-blur-xl bg-background/80 border-border/50 shadow-lg"
                        align="start"
                    >
                        <div className="space-y-3">
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium">Field</label>
                                <Select value={newFilter.field} onValueChange={handleFieldChange}>
                                    <SelectTrigger className="h-9">
                                        <SelectValue placeholder="Select field" />
                                    </SelectTrigger>
                                    <SelectContent className="backdrop-blur-xl bg-popover/95 border-border/50 shadow-lg">
                                        {allFields.map(field => (
                                            <SelectItem
                                                key={field.value}
                                                value={field.value}
                                                className="focus:bg-accent/80 data-[highlighted]:bg-accent/80 rounded-sm py-2"
                                            >
                                                {field.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-medium">Operator</label>
                                <Select
                                    value={newFilter.operator}
                                    onValueChange={value =>
                                        setNewFilter({ ...newFilter, operator: value })
                                    }
                                >
                                    <SelectTrigger className="h-9">
                                        <SelectValue placeholder="Select operator" />
                                    </SelectTrigger>
                                    <SelectContent className="backdrop-blur-xl bg-popover/95 border-border/50 shadow-lg min-w-[12rem]">
                                        {operators.map(op => (
                                            <SelectItem
                                                key={op.value}
                                                value={op.value}
                                                className="focus:bg-accent/80 data-[highlighted]:bg-accent/80 rounded-sm py-2"
                                            >
                                                {op.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-medium">Value</label>
                                {valueOptionsLoading ? (
                                    <div className="h-9 rounded-md border border-input bg-muted/50 flex items-center px-3 text-sm text-muted-foreground">
                                        Loading options...
                                    </div>
                                ) : valueOptions !== null ? (
                                    <Select
                                        value={newFilter.value || undefined}
                                        onValueChange={value =>
                                            setNewFilter({ ...newFilter, value })
                                        }
                                    >
                                        <SelectTrigger className="h-9">
                                            <SelectValue placeholder="Select value..." />
                                        </SelectTrigger>
                                        <SelectContent className="backdrop-blur-xl bg-popover/95 border-border/50 shadow-lg max-h-60">
                                            {valueOptions.length === 0 ? (
                                                <div className="py-4 px-3 text-center text-sm text-muted-foreground">
                                                    No options available
                                                </div>
                                            ) : (
                                                valueOptions.map(opt => (
                                                    <SelectItem
                                                        key={opt.value}
                                                        value={opt.value}
                                                        className="focus:bg-accent/80 data-[highlighted]:bg-accent/80 rounded-sm py-2"
                                                    >
                                                        {opt.label}
                                                    </SelectItem>
                                                ))
                                            )}
                                        </SelectContent>
                                    </Select>
                                ) : (
                                    <Input
                                        placeholder="Enter value..."
                                        value={newFilter.value}
                                        onChange={e =>
                                            setNewFilter({ ...newFilter, value: e.target.value })
                                        }
                                        className="h-9"
                                        onKeyDown={e => {
                                            if (e.key === "Enter") {
                                                handleAddFilter();
                                            }
                                        }}
                                    />
                                )}
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setIsAdding(false)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    size="sm"
                                    onClick={handleAddFilter}
                                    disabled={!newFilter.field || !newFilter.value}
                                >
                                    Add
                                </Button>
                            </div>
                        </div>
                    </PopoverContent>
                </Popover>
            </div>

            {filters.length > 0 && (
                <Button variant="ghost" size="sm" onClick={() => onFiltersChange([])}>
                    Clear all
                </Button>
            )}
        </div>
    );
}
