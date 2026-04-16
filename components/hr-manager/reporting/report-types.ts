"use client";

export type HrChartType = "bar" | "line" | "area" | "pie" | "table";

export type HrShareMode = "private" | "public" | "roles" | "users";

export type HrAggregationType = "sum" | "min" | "max" | "count" | "average";

export interface HrSharingConfig {
    mode: HrShareMode;
    sharedWithRoles: string[];
    sharedWithUsers: string[];
}

export interface HrFilterConfig {
    field: string;
    operator: string;
    value: string;
}

export interface HrMeasureConfig {
    field: string;
    aggregation: HrAggregationType;
}

export interface HrChartConfig {
    id: string;
    title: string;
    dimensions: string[];
    measures: HrMeasureConfig[];
    filters: HrFilterConfig[];
    chartType: HrChartType;
}

export interface HrSavedReport {
    id: string;
    name: string;
    description: string;
    charts: HrChartConfig[];
    globalFilters: HrFilterConfig[];
    createdAt: Date;
    updatedAt: Date;
    isShared: boolean;
    shareLink?: string;
    sharing: HrSharingConfig;
    createdBy?: string;
    isArchived?: boolean;
}

export const createDefaultHrChart = (): HrChartConfig => ({
    id: crypto.randomUUID(),
    title: "New HR Chart",
    dimensions: [],
    measures: [],
    filters: [],
    chartType: "bar",
});

export const HR_AGGREGATION_TYPES: { value: HrAggregationType; label: string }[] = [
    { value: "sum", label: "Sum" },
    { value: "min", label: "Min" },
    { value: "max", label: "Max" },
    { value: "count", label: "Count" },
    { value: "average", label: "Average" },
];
