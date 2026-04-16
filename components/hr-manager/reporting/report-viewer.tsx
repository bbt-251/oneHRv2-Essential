"use client";

import { HrChartCard } from "./chart-card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit } from "lucide-react";
import type { HrSavedReport } from "./report-types";

interface HrReportViewerProps {
    report: HrSavedReport;
    onBack: () => void;
    onEdit?: () => void;
    canEdit?: boolean;
    hideActions?: boolean;
}

export function HrReportViewer({
    report,
    onBack,
    onEdit,
    canEdit = false,
    hideActions = false,
}: HrReportViewerProps) {
    return (
        <div className="flex flex-col min-h-[600px]">
            <div className="flex items-center justify-between px-6 py-4 border-b">
                <div className="flex items-center gap-4">
                    {!hideActions && (
                        <Button variant="ghost" size="icon" onClick={onBack}>
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    )}
                    <div>
                        <h1 className="text-lg font-semibold">{report.name}</h1>
                        <p className="text-sm text-muted-foreground">
                            {report.description || "No description"}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                            Last updated: {report.updatedAt.toLocaleDateString()}
                        </p>
                    </div>
                </div>
                {!hideActions && canEdit && onEdit && (
                    <Button size="sm" onClick={onEdit}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                    </Button>
                )}
            </div>

            <div className="flex-1 p-6 overflow-auto">
                {report.charts.length === 0 ? (
                    <div className="min-h-[400px] flex items-center justify-center">
                        <div className="text-center">
                            <h3 className="text-lg font-medium mb-2">No Charts</h3>
                            <p className="text-sm text-muted-foreground">
                                This report does not have any charts yet.
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {report.charts.map(chart => (
                            <HrChartCard
                                key={chart.id}
                                chart={chart}
                                globalFilters={report.globalFilters}
                                onEdit={() => {}}
                                onDelete={() => {}}
                                hideActions={true}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
