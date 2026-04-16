"use client";

import { useState } from "react";
import { HrReportsManager } from "./reports-manager";
import { HrReportBuilder } from "./report-builder";
import { HrReportViewer } from "./report-viewer";
import type { HrSavedReport } from "./report-types";
import { useAuth } from "@/context/authContext";
import { createHrReport, updateHrReport } from "@/lib/api/hr-reporting/hr-report-service";
import { useToast } from "@/context/toastContext";

type View = "list" | "builder" | "viewer";

export function HrReportingDashboard() {
    const [view, setView] = useState<View>("list");
    const [editingReport, setEditingReport] = useState<HrSavedReport | null>(null);
    const { user } = useAuth();
    const { showToast } = useToast();

    const handleEditReport = (report: HrSavedReport) => {
        setEditingReport(report);
        setView("builder");
    };

    const handleViewReport = (report: HrSavedReport) => {
        setEditingReport(report);
        setView("viewer");
    };

    const handleCreateReport = () => {
        setEditingReport(null);
        setView("builder");
    };

    const handleBack = () => {
        setEditingReport(null);
        setView("list");
    };

    const handleSaveReport = async (report: HrSavedReport) => {
        if (!user) {
            showToast("You must be logged in to save reports", "❌", "error");
            return;
        }

        try {
            if (report.id && editingReport) {
                await updateHrReport(report.id, {
                    name: report.name,
                    description: report.description,
                    charts: report.charts,
                    globalFilters: report.globalFilters,
                    sharing: report.sharing,
                    shareLink: report.shareLink,
                });
                showToast("HR report updated successfully", "✅", "success");
            } else {
                await createHrReport(report, user.uid);
                showToast("HR report saved successfully", "✅", "success");
            }
            setView("list");
        } catch (error) {
            console.error("Error saving HR report:", error);
            showToast(
                `Failed to save report: ${error instanceof Error ? error.message : "Unknown error"}`,
                "❌",
                "error",
            );
        }
    };

    if (view === "builder") {
        return (
            <HrReportBuilder
                initialReport={editingReport}
                onBack={handleBack}
                onSave={handleSaveReport}
            />
        );
    }

    if (view === "viewer" && editingReport) {
        return (
            <HrReportViewer
                report={editingReport}
                onBack={handleBack}
                onEdit={() => setView("builder")}
                canEdit={editingReport.createdBy === user?.uid}
            />
        );
    }

    return (
        <HrReportsManager
            onEditReport={handleEditReport}
            onCreateReport={handleCreateReport}
            onViewReport={handleViewReport}
        />
    );
}
