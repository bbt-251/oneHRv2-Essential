"use client";

import { useTheme } from "@/components/theme-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { performanceDisplayService } from "@/lib/backend/api/performance-management/performance-display-service";
import { MonitoringPeriodModel } from "@/lib/models/performance";
import { timestampFormat } from "@/lib/util/dayjs_format";
import dayjs from "dayjs";
import { Edit, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

interface MonitoringTableProps {
    data: MonitoringPeriodModel[];
    onEdit: (period: MonitoringPeriodModel) => void;
    onDelete: (period: MonitoringPeriodModel) => void;
}

export default function MonitoringTable({ data, onEdit, onDelete }: MonitoringTableProps) {
    const { theme } = useTheme();
    const [displayNames, setDisplayNames] = useState<
        Record<string, { periodName: string; roundName: string }>
    >({});
    const [isLoadingNames, setIsLoadingNames] = useState(false);

    useEffect(() => {
        const loadDisplayNames = async () => {
            if (data.length === 0) return;

            setIsLoadingNames(true);
            const names: Record<string, { periodName: string; roundName: string }> = {};

            for (const period of data) {
                if (period.periodID && period.roundID) {
                    const { periodName, roundName } =
                        await performanceDisplayService.getPeriodAndRoundDisplayNames(
                            period.periodID,
                            period.roundID,
                        );
                    names[period.id as string] = {
                        periodName: periodName || period.periodID,
                        roundName: roundName || period.roundID,
                    };
                }
            }

            setDisplayNames(names);
            setIsLoadingNames(false);
        };

        loadDisplayNames();
    }, [data]);

    if (data.length === 0) {
        return (
            <div
                className={`text-center py-8 ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}
            >
                <p>No monitoring periods configured yet.</p>
                <p className="text-sm mt-1">Click "Add Monitoring Period" to get started.</p>
            </div>
        );
    }

    if (isLoadingNames) {
        return (
            <div
                className={`rounded-md border ${theme === "dark" ? "border-gray-700" : "border-gray-200"}`}
            >
                <div
                    className={`text-center py-8 ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}
                >
                    <div className="flex items-center justify-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                        <p>Loading monitoring periods...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div
            className={`rounded-md border ${theme === "dark" ? "border-gray-700" : "border-gray-200"}`}
        >
            <Table>
                <TableHeader>
                    <TableRow className={theme === "dark" ? "border-gray-700" : ""}>
                        <TableHead className={theme === "dark" ? "text-gray-300" : ""}>
                            Timestamp
                        </TableHead>
                        <TableHead className={theme === "dark" ? "text-gray-300" : ""}>
                            Monitoring Period Name
                        </TableHead>
                        <TableHead className={theme === "dark" ? "text-gray-300" : ""}>
                            Period
                        </TableHead>
                        <TableHead className={theme === "dark" ? "text-gray-300" : ""}>
                            Round
                        </TableHead>
                        <TableHead className={theme === "dark" ? "text-gray-300" : ""}>
                            Duration
                        </TableHead>
                        <TableHead
                            className={`text-right ${theme === "dark" ? "text-gray-300" : ""}`}
                        >
                            Actions
                        </TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.map(period => (
                        <TableRow
                            key={period.id}
                            className={`cursor-pointer ${
                                theme === "dark"
                                    ? "hover:bg-gray-900 border-gray-700"
                                    : "hover:bg-gray-50"
                            }`}
                            onClick={() => onEdit(period)}
                        >
                            <TableCell className={theme === "dark" ? "text-gray-300" : ""}>
                                {period.timestamp
                                    ? dayjs(period.timestamp).format(timestampFormat)
                                    : "N/A"}
                            </TableCell>
                            <TableCell
                                className={`font-medium ${theme === "dark" ? "text-white" : ""}`}
                            >
                                {period.monitoringPeriodName}
                            </TableCell>
                            <TableCell>
                                <Badge
                                    variant="outline"
                                    className={
                                        theme === "dark"
                                            ? "border-blue-400 text-blue-400 bg-blue-400/10"
                                            : "border-blue-200 text-blue-700 bg-blue-50"
                                    }
                                >
                                    {displayNames[period.id as string]?.periodName ||
                                        period.periodID}
                                </Badge>
                            </TableCell>
                            <TableCell className={theme === "dark" ? "text-gray-300" : ""}>
                                {displayNames[period.id as string]?.roundName || period.roundID}
                            </TableCell>
                            <TableCell>
                                <div
                                    className={`text-sm ${theme === "dark" ? "text-gray-300" : ""}`}
                                >
                                    <div>{period.startDate}</div>
                                    <div
                                        className={`${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}
                                    >
                                        to {period.endDate}
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell className="text-right">
                                <div className="flex justify-end space-x-2">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={e => {
                                            e.stopPropagation();
                                            onEdit(period);
                                        }}
                                        className={
                                            theme === "dark"
                                                ? "text-amber-400 hover:text-amber-300 hover:bg-gray-900"
                                                : "text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                                        }
                                    >
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={e => {
                                            e.stopPropagation();
                                            onDelete(period);
                                        }}
                                        className={
                                            theme === "dark"
                                                ? "text-red-400 hover:text-red-300 hover:bg-gray-900"
                                                : "text-red-600 hover:text-red-700 hover:bg-red-50"
                                        }
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
