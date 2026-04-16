"use client";

import type React from "react";
import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { BarChart3, LineChart, PieChart, AreaChart, X, Table2, Search } from "lucide-react";
import type {
    HrChartConfig,
    HrChartType,
    HrMeasureConfig,
    HrAggregationType,
} from "./report-types";
import {
    HR_AVAILABLE_DIMENSIONS,
    HR_AVAILABLE_MEASURES,
    getHrReportingFieldLabel,
} from "./reporting-data";
import { HR_AGGREGATION_TYPES } from "./report-types";

interface ChartEditorDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    chart: HrChartConfig | null;
    onSave: (chart: HrChartConfig) => void;
}

const chartTypes: { value: HrChartType; label: string; icon: React.ReactNode }[] = [
    { value: "bar", label: "Bar", icon: <BarChart3 className="h-4 w-4" /> },
    { value: "line", label: "Line", icon: <LineChart className="h-4 w-4" /> },
    { value: "area", label: "Area", icon: <AreaChart className="h-4 w-4" /> },
    { value: "pie", label: "Pie", icon: <PieChart className="h-4 w-4" /> },
    { value: "table", label: "Table", icon: <Table2 className="h-4 w-4" /> },
];

export function HrChartEditorDialog({ open, onOpenChange, chart, onSave }: ChartEditorDialogProps) {
    const [editedChart, setEditedChart] = useState<HrChartConfig | null>(null);
    const [dimensionSearch, setDimensionSearch] = useState("");
    const [measureSearch, setMeasureSearch] = useState("");

    useEffect(() => {
        if (chart) {
            setEditedChart({ ...chart });
            setDimensionSearch("");
            setMeasureSearch("");
        }
    }, [chart]);

    if (!editedChart) return null;

    const addDimension = (dimension: string) => {
        if (!editedChart.dimensions.includes(dimension)) {
            setEditedChart({ ...editedChart, dimensions: [...editedChart.dimensions, dimension] });
            setDimensionSearch("");
        }
    };

    const removeDimension = (dimension: string) => {
        setEditedChart({
            ...editedChart,
            dimensions: editedChart.dimensions.filter(d => d !== dimension),
        });
    };

    const addMeasure = (field: string) => {
        if (editedChart.measures.some(m => m.field === field)) return;
        const newMeasure: HrMeasureConfig = { field, aggregation: "sum" };
        setEditedChart({ ...editedChart, measures: [...editedChart.measures, newMeasure] });
        setMeasureSearch("");
    };

    const removeMeasure = (field: string) => {
        setEditedChart({
            ...editedChart,
            measures: editedChart.measures.filter(m => m.field !== field),
        });
    };

    const updateMeasureAggregation = (field: string, aggregation: HrAggregationType) => {
        setEditedChart({
            ...editedChart,
            measures: editedChart.measures.map(m =>
                m.field === field ? { ...m, aggregation } : m,
            ),
        });
    };

    const handleSave = () => {
        onSave(editedChart);
        onOpenChange(false);
    };

    const availableDimensions = HR_AVAILABLE_DIMENSIONS.filter(
        d =>
            !editedChart.dimensions.includes(d.value) &&
            d.label.toLowerCase().includes(dimensionSearch.toLowerCase()),
    );

    const availableMeasures = HR_AVAILABLE_MEASURES.filter(
        m =>
            !editedChart.measures.some(existing => existing.field === m.value) &&
            m.label.toLowerCase().includes(measureSearch.toLowerCase()),
    );

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh]">
                <DialogHeader>
                    <DialogTitle>Edit HR Chart</DialogTitle>
                </DialogHeader>

                <ScrollArea className="max-h-[60vh] pr-4">
                    <div className="space-y-6 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="chart-title">Chart Title</Label>
                            <Input
                                id="chart-title"
                                value={editedChart.title}
                                onChange={e =>
                                    setEditedChart({ ...editedChart, title: e.target.value })
                                }
                                placeholder="Enter chart title..."
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Chart Type</Label>
                            <div className="grid grid-cols-3 gap-2">
                                {chartTypes.map(type => {
                                    const isActive = editedChart.chartType === type.value;
                                    return (
                                        <Button
                                            key={type.value}
                                            variant={isActive ? "default" : "outline"}
                                            size="sm"
                                            className={`justify-start gap-1.5 text-xs px-2 transition
                        ${isActive ? "ring-2 ring-offset-2 ring-primary ring-offset-background bg-primary/10 shadow-md" : ""}`}
                                            onClick={() =>
                                                setEditedChart({
                                                    ...editedChart,
                                                    chartType: type.value,
                                                })
                                            }
                                        >
                                            {type.icon}
                                            {type.label}
                                        </Button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Dimensions</Label>
                            <div className="flex flex-wrap gap-2 mb-2">
                                {editedChart.dimensions.map(dim => {
                                    const label = getHrReportingFieldLabel(dim);
                                    return (
                                        <Badge key={dim} variant="secondary" className="gap-1 pr-1">
                                            {label}
                                            <button
                                                onClick={() => removeDimension(dim)}
                                                className="ml-1"
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        </Badge>
                                    );
                                })}
                            </div>
                            <Select onValueChange={addDimension}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Add dimension..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <div className="sticky top-0 z-10 px-2 pb-2 pt-1 border-b bg-popover">
                                        <div className="flex items-center gap-2 rounded-md bg-muted px-2 py-1.5">
                                            <Search className="h-3 w-3 text-muted-foreground" />
                                            <input
                                                type="text"
                                                value={dimensionSearch}
                                                onChange={e => setDimensionSearch(e.target.value)}
                                                placeholder="Search dimensions..."
                                                className="bg-transparent text-xs outline-none w-full placeholder:text-muted-foreground"
                                            />
                                        </div>
                                    </div>
                                    {availableDimensions.length === 0 ? (
                                        <div className="px-3 py-2 text-xs text-muted-foreground">
                                            No dimensions match your search.
                                        </div>
                                    ) : (
                                        availableDimensions.map(dim => (
                                            <SelectItem key={dim.value} value={dim.value}>
                                                {dim.label}
                                            </SelectItem>
                                        ))
                                    )}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Measures</Label>
                            <div className="space-y-2 mb-2">
                                {editedChart.measures.map(measure => {
                                    const measureLabel = getHrReportingFieldLabel(measure.field);
                                    return (
                                        <div
                                            key={measure.field}
                                            className="p-2 rounded-md border flex items-center justify-between gap-2"
                                        >
                                            <div className="flex items-center gap-2 flex-1">
                                                <Badge variant="secondary">{measureLabel}</Badge>
                                                <Select
                                                    value={measure.aggregation}
                                                    onValueChange={(value: HrAggregationType) =>
                                                        updateMeasureAggregation(
                                                            measure.field,
                                                            value,
                                                        )
                                                    }
                                                >
                                                    <SelectTrigger className="h-7 w-24 text-xs">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {HR_AGGREGATION_TYPES.map(agg => (
                                                            <SelectItem
                                                                key={agg.value}
                                                                value={agg.value}
                                                            >
                                                                {agg.label}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <button onClick={() => removeMeasure(measure.field)}>
                                                <X className="h-4 w-4" />
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                            <Select onValueChange={addMeasure}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Add measure..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <div className="sticky top-0 z-10 px-2 pb-2 pt-1 border-b bg-popover">
                                        <div className="flex items-center gap-2 rounded-md bg-muted px-2 py-1.5">
                                            <Search className="h-3 w-3 text-muted-foreground" />
                                            <input
                                                type="text"
                                                value={measureSearch}
                                                onChange={e => setMeasureSearch(e.target.value)}
                                                placeholder="Search measures..."
                                                className="bg-transparent text-xs outline-none w-full placeholder:text-muted-foreground"
                                            />
                                        </div>
                                    </div>
                                    {availableMeasures.length === 0 ? (
                                        <div className="px-3 py-2 text-xs text-muted-foreground">
                                            No measures match your search.
                                        </div>
                                    ) : (
                                        availableMeasures.map(measure => (
                                            <SelectItem key={measure.value} value={measure.value}>
                                                {measure.label}
                                            </SelectItem>
                                        ))
                                    )}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </ScrollArea>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave}>Save Changes</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
