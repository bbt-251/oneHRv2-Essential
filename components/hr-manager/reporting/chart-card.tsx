"use client";

import { useMemo, useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    BarChart,
    Bar,
    LineChart as RechartsLineChart,
    Line,
    AreaChart as RechartsAreaChart,
    Area,
    PieChart as RechartsPieChart,
    Pie,
    XAxis,
    YAxis,
    CartesianGrid,
    ResponsiveContainer,
    Cell,
    Tooltip,
} from "recharts";
import { MoreHorizontal, Pencil, Trash2, GripVertical, BarChart3 } from "lucide-react";
import type { HrChartConfig, HrFilterConfig } from "./report-types";
import { generateHrReportingData, getHrReportingFieldLabel } from "./reporting-data";

interface ChartCardProps {
    chart: HrChartConfig;
    globalFilters?: HrFilterConfig[];
    onEdit: () => void;
    onDelete: () => void;
    hideActions?: boolean;
}

const CHART_COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6"];

export function HrChartCard({
    chart,
    globalFilters = [],
    onEdit,
    onDelete,
    hideActions = false,
}: ChartCardProps) {
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [data, setData] = useState<Record<string, number | string>[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const dataQueryKey = useMemo(
        () =>
            JSON.stringify({
                dimensions: chart.dimensions,
                measures: chart.measures,
                globalFilters,
                chartFilters: chart.filters,
            }),
        [chart.dimensions, chart.measures, globalFilters, chart.filters],
    );

    useEffect(() => {
        const loadData = async () => {
            if (chart.dimensions.length === 0 || chart.measures.length === 0) {
                setData([]);
                return;
            }

            setLoading(true);
            setError(null);
            try {
                const combinedFilters = [...globalFilters, ...chart.filters];
                const result = await generateHrReportingData(
                    chart.dimensions,
                    chart.measures,
                    combinedFilters,
                );
                setData(result);
            } catch (err) {
                console.error("Error loading HR chart data:", err);
                setError(err instanceof Error ? err.message : "Failed to load data");
                setData([]);
            } finally {
                setLoading(false);
            }
        };

        void loadData();
        // dataQueryKey fingerprints dimensions, measures, and filters (avoids redundant fetches on new array identity).
    }, [dataQueryKey]);

    const isEmpty = chart.dimensions.length === 0 || chart.measures.length === 0;

    const renderChart = () => {
        if (isEmpty) {
            return (
                <div className="h-[250px] flex items-center justify-center">
                    <div className="text-center">
                        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                            <BarChart3 className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Click edit to configure this chart
                        </p>
                    </div>
                </div>
            );
        }

        if (loading) {
            return (
                <div className="h-[250px] flex items-center justify-center">
                    <div className="text-center">
                        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3 animate-pulse">
                            <BarChart3 className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <p className="text-sm text-muted-foreground">Loading data...</p>
                    </div>
                </div>
            );
        }

        if (error) {
            return (
                <div className="h-[250px] flex items-center justify-center">
                    <div className="text-center">
                        <p className="text-sm text-destructive">{error}</p>
                    </div>
                </div>
            );
        }

        if (data.length === 0) {
            return (
                <div className="h-[250px] flex items-center justify-center">
                    <div className="text-center">
                        <p className="text-sm text-muted-foreground">No data available</p>
                    </div>
                </div>
            );
        }

        const dimension = chart.dimensions[0];

        switch (chart.chartType) {
            case "bar":
                return (
                    <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey={dimension} />
                            <YAxis />
                            <Tooltip />
                            {chart.measures.map((measure, index) => {
                                const measureKey = `${measure.field}_${measure.aggregation}`;
                                return (
                                    <Bar
                                        key={measureKey}
                                        dataKey={measureKey}
                                        fill={CHART_COLORS[index % CHART_COLORS.length]}
                                        radius={[4, 4, 0, 0]}
                                        name={getHrReportingFieldLabel(measure.field)}
                                    />
                                );
                            })}
                        </BarChart>
                    </ResponsiveContainer>
                );

            case "line":
                return (
                    <ResponsiveContainer width="100%" height={250}>
                        <RechartsLineChart
                            data={data}
                            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey={dimension} />
                            <YAxis />
                            <Tooltip />
                            {chart.measures.map((measure, index) => {
                                const measureKey = `${measure.field}_${measure.aggregation}`;
                                return (
                                    <Line
                                        key={measureKey}
                                        type="monotone"
                                        dataKey={measureKey}
                                        stroke={CHART_COLORS[index % CHART_COLORS.length]}
                                        strokeWidth={2}
                                        dot={{ r: 3 }}
                                        name={getHrReportingFieldLabel(measure.field)}
                                    />
                                );
                            })}
                        </RechartsLineChart>
                    </ResponsiveContainer>
                );

            case "area":
                return (
                    <ResponsiveContainer width="100%" height={250}>
                        <RechartsAreaChart
                            data={data}
                            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey={dimension} />
                            <YAxis />
                            <Tooltip />
                            {chart.measures.map((measure, index) => {
                                const measureKey = `${measure.field}_${measure.aggregation}`;
                                return (
                                    <Area
                                        key={measureKey}
                                        type="monotone"
                                        dataKey={measureKey}
                                        stroke={CHART_COLORS[index % CHART_COLORS.length]}
                                        fill={CHART_COLORS[index % CHART_COLORS.length]}
                                        fillOpacity={0.3}
                                        name={getHrReportingFieldLabel(measure.field)}
                                    />
                                );
                            })}
                        </RechartsAreaChart>
                    </ResponsiveContainer>
                );

            case "pie": {
                const firstMeasure = chart.measures[0];
                const pieMeasureKey = `${firstMeasure.field}_${firstMeasure.aggregation}`;
                const pieData = data.map((item, index) => ({
                    name: String(item[dimension] ?? "Unknown"),
                    value: Number(item[pieMeasureKey] ?? 0),
                    fill: CHART_COLORS[index % CHART_COLORS.length],
                }));
                return (
                    <ResponsiveContainer width="100%" height={250}>
                        <RechartsPieChart>
                            <Pie
                                data={pieData}
                                cx="50%"
                                cy="50%"
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                                label={({ name, percent }) =>
                                    `${name}: ${(percent * 100).toFixed(0)}%`
                                }
                                labelLine={false}
                            >
                                {pieData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </RechartsPieChart>
                    </ResponsiveContainer>
                );
            }

            case "table":
                return (
                    <div className="h-[250px] overflow-auto">
                        <table className="w-full text-xs">
                            <thead>
                                <tr className="border-b">
                                    {chart.dimensions.map(dim => {
                                        const dimensionLabel = getHrReportingFieldLabel(dim);
                                        return (
                                            <th
                                                key={dim}
                                                className="text-left py-3 px-3 font-semibold"
                                            >
                                                {dimensionLabel}
                                            </th>
                                        );
                                    })}
                                    {chart.measures.map(measure => {
                                        const measureKey = `${measure.field}_${measure.aggregation}`;
                                        const measureLabel = getHrReportingFieldLabel(
                                            measure.field,
                                        );
                                        return (
                                            <th
                                                key={measureKey}
                                                className="text-right py-3 px-3 font-semibold"
                                            >
                                                {measureLabel}
                                            </th>
                                        );
                                    })}
                                </tr>
                            </thead>
                            <tbody>
                                {data.slice(0, 5).map((row, index) => (
                                    <tr key={index} className="border-b">
                                        {chart.dimensions.map(dim => (
                                            <td key={dim} className="py-2 px-2">
                                                {String(row[dim] ?? "")}
                                            </td>
                                        ))}
                                        {chart.measures.map(measure => {
                                            const measureKey = `${measure.field}_${measure.aggregation}`;
                                            return (
                                                <td
                                                    key={measureKey}
                                                    className="py-2 px-2 text-right font-mono"
                                                >
                                                    {typeof row[measureKey] === "number"
                                                        ? (
                                                              row[measureKey] as number
                                                        ).toLocaleString()
                                                        : String(row[measureKey] ?? "")}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                );

            default:
                return (
                    <div className="h-[250px] flex items-center justify-center">
                        <p className="text-sm text-muted-foreground">Unsupported chart type</p>
                    </div>
                );
        }
    };

    return (
        <>
            <Card>
                <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            {!hideActions && (
                                <GripVertical className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity cursor-grab" />
                            )}
                            <CardTitle className="text-sm font-medium">{chart.title}</CardTitle>
                        </div>
                        {!hideActions && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                        <MoreHorizontal className="h-4 w-4" />
                                        <span className="sr-only">Chart actions</span>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={onEdit} className="cursor-pointer">
                                        <Pencil className="h-4 w-4 mr-2" />
                                        Edit Chart
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        onClick={() => setDeleteDialogOpen(true)}
                                        className="cursor-pointer text-destructive"
                                    >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Delete Chart
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                    </div>
                </CardHeader>
                <CardContent>{renderChart()}</CardContent>
            </Card>

            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Chart</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete &quot;{chart.title}&quot;? This action
                            cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={() => {
                                onDelete();
                                setDeleteDialogOpen(false);
                            }}
                        >
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
