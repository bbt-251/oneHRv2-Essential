"use client";

import { useState } from "react";
import { HrChartCard } from "./chart-card";
import { HrChartEditorDialog } from "./chart-editor-dialog";
import { HrReportFilterBar } from "./report-filter-bar";
import { Button } from "@/components/ui/button";
import { Save, ArrowLeft, Plus, LayoutGrid } from "lucide-react";
import {
    createDefaultHrChart,
    type HrChartConfig,
    type HrSavedReport,
    type HrFilterConfig,
} from "./report-types";
import { SaveReportDialog } from "./save-report-dialog";

interface HrReportBuilderProps {
    initialReport?: HrSavedReport | null;
    onBack: () => void;
    onSave: (report: HrSavedReport) => void;
}

export function HrReportBuilder({ initialReport, onBack, onSave }: HrReportBuilderProps) {
    const [charts, setCharts] = useState<HrChartConfig[]>(
        initialReport?.charts ?? [createDefaultHrChart()],
    );
    const [globalFilters, setGlobalFilters] = useState<HrFilterConfig[]>(
        initialReport?.globalFilters ?? [],
    );
    const [activeReport, setActiveReport] = useState<HrSavedReport | null>(initialReport || null);
    const [editingChart, setEditingChart] = useState<HrChartConfig | null>(null);
    const [saveDialogOpen, setSaveDialogOpen] = useState(false);

    const handleAddChart = () => {
        const newChart = createDefaultHrChart();
        setCharts([...charts, newChart]);
        setEditingChart(newChart);
    };

    const handleEditChart = (chart: HrChartConfig) => {
        setEditingChart(chart);
    };

    const handleSaveChart = (updatedChart: HrChartConfig) => {
        setCharts(charts.map(c => (c.id === updatedChart.id ? updatedChart : c)));
        setEditingChart(null);
    };

    const handleDeleteChart = (chartId: string) => {
        setCharts(charts.filter(c => c.id !== chartId));
    };

    const handleSaveReport = (name: string, description: string) => {
        const report: HrSavedReport = activeReport
            ? {
                ...activeReport,
                name,
                description,
                charts,
                globalFilters,
                updatedAt: new Date(),
            }
            : {
                id: "",
                name,
                description,
                charts,
                globalFilters,
                createdAt: new Date(),
                updatedAt: new Date(),
                isShared: false,
                sharing: { mode: "private", sharedWithRoles: [], sharedWithUsers: [] },
                createdBy: "",
            };

        setActiveReport(report);
        onSave(report);
    };

    return (
        <div className="flex flex-col min-h-[600px]">
            <div className="flex items-center justify-between px-6 py-4 border-b">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={onBack}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-lg font-semibold">
                            {activeReport ? activeReport.name : "New HR Report"}
                        </h1>
                        {activeReport && (
                            <p className="text-sm text-muted-foreground">
                                Last updated: {activeReport.updatedAt.toLocaleDateString()}
                            </p>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={handleAddChart}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Chart
                    </Button>
                    <Button size="sm" onClick={() => setSaveDialogOpen(true)}>
                        <Save className="h-4 w-4 mr-2" />
                        {activeReport ? "Update" : "Save"}
                    </Button>
                </div>
            </div>

            <HrReportFilterBar filters={globalFilters} onFiltersChange={setGlobalFilters} />

            <div className="flex-1 p-6 overflow-auto">
                {charts.length === 0 ? (
                    <div className="min-h-[400px] flex items-center justify-center">
                        <div className="text-center">
                            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                                <LayoutGrid className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <h3 className="text-lg font-medium mb-2">No Charts Yet</h3>
                            <p className="text-sm text-muted-foreground mb-4">
                                Add your first chart to start building your HR report.
                            </p>
                            <Button onClick={handleAddChart}>
                                <Plus className="h-4 w-4 mr-2" />
                                Add Chart
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {charts.map(chart => (
                            <HrChartCard
                                key={chart.id}
                                chart={chart}
                                globalFilters={globalFilters}
                                onEdit={() => handleEditChart(chart)}
                                onDelete={() => handleDeleteChart(chart.id)}
                            />
                        ))}
                    </div>
                )}
            </div>

            <HrChartEditorDialog
                open={!!editingChart}
                onOpenChange={open => !open && setEditingChart(null)}
                chart={editingChart}
                onSave={handleSaveChart}
            />

            <SaveReportDialog
                open={saveDialogOpen}
                onOpenChange={setSaveDialogOpen}
                onSave={handleSaveReport}
                existingReport={activeReport as never}
            />
        </div>
    );
}
