"use client";

export { AppDataProvider as DataProvider, useData } from "@/context/app-data-context";
export type {
    AppDataContextValue as DataContextValue,
    InAppNotificationModel,
} from "@/context/app-data-context";
export type { ProjectAllocationModel, ProjectModel } from "@/lib/models/project";
