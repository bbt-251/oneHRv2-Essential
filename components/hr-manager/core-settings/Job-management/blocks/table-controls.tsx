"use client";

export type { Density } from "../../blocks/data-toolbar";
export type ColumnControl = {
    id: string;
    label: string;
    visible: boolean;
};

// Re-export utility function
export { getDensityRowClasses } from "../../blocks/data-toolbar";
