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
import { EvaluationCampaignModel } from "@/lib/models/performance";
import { timestampFormat } from "@/lib/util/dayjs_format";
import dayjs from "dayjs";
import { BarChart, Edit, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface CampaignsTableProps {
    data: EvaluationCampaignModel[];
    onEdit: (campaign: EvaluationCampaignModel) => void;
    onDelete: (campaign: EvaluationCampaignModel) => void;
    onEpsCalculation: (campaignId: string, campaign: EvaluationCampaignModel) => void;
}

export default function CampaignsTable({
    data,
    onEdit,
    onDelete,
    onEpsCalculation,
}: CampaignsTableProps) {
    const { theme } = useTheme();
    const [displayNames, setDisplayNames] = useState<
        Record<string, { periodName: string; roundName: string }>
    >({});
    const [isLoadingNames, setIsLoadingNames] = useState<boolean>(false);

    useEffect(() => {
        const loadDisplayNames = async () => {
            if (data.length === 0) return;

            setIsLoadingNames(true);
            const names: Record<string, { periodName: string; roundName: string }> = {};

            for (const campaign of data) {
                if (campaign.periodID && campaign.roundID) {
                    const { periodName, roundName } =
                        await performanceDisplayService.getPeriodAndRoundDisplayNames(
                            campaign.periodID,
                            campaign.roundID,
                        );
                    names[campaign.id as string] = {
                        periodName: periodName || campaign.periodID,
                        roundName: roundName || campaign.roundID,
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
                <p>No evaluation campaigns configured yet.</p>
                <p className="text-sm mt-1">Click "Add Evaluation Campaign" to get started.</p>
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
                        <p>Loading evaluation campaigns...</p>
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
                            Campaign Name
                        </TableHead>
                        <TableHead className={theme === "dark" ? "text-gray-300" : ""}>
                            Period & Round
                        </TableHead>
                        <TableHead className={theme === "dark" ? "text-gray-300" : ""}>
                            Duration
                        </TableHead>
                        <TableHead className={theme === "dark" ? "text-gray-300" : ""}>
                            Employees
                        </TableHead>
                        <TableHead className={theme === "dark" ? "text-gray-300" : ""}>
                            Promotion
                        </TableHead>
                        <TableHead
                            className={`text-right ${theme === "dark" ? "text-gray-300" : ""}`}
                        >
                            Actions
                        </TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.map(campaign => (
                        <TableRow
                            key={campaign.timestamp}
                            className={`cursor-pointer ${
                                theme === "dark"
                                    ? "hover:bg-gray-900 border-gray-700"
                                    : "hover:bg-gray-50"
                            }`}
                            onClick={() => onEdit(campaign)}
                        >
                            <TableCell className={theme === "dark" ? "text-gray-300" : ""}>
                                {campaign.timestamp
                                    ? dayjs(campaign.timestamp).format(timestampFormat)
                                    : "N/A"}
                            </TableCell>
                            <TableCell
                                className={`font-medium ${theme === "dark" ? "text-white" : ""}`}
                            >
                                {campaign.campaignName}
                            </TableCell>
                            <TableCell>
                                <div
                                    className={`text-sm ${theme === "dark" ? "text-gray-300" : ""}`}
                                >
                                    <div>
                                        {displayNames[campaign.id as string]?.periodName ||
                                            campaign.periodID}
                                    </div>
                                    <Badge
                                        variant="secondary"
                                        className={`text-xs ${
                                            theme === "dark"
                                                ? "bg-gray-900 text-gray-300 border-gray-700"
                                                : "bg-gray-100 text-gray-600"
                                        }`}
                                    >
                                        {displayNames[campaign.id as string]?.roundName ||
                                            campaign.roundID}
                                    </Badge>
                                </div>
                            </TableCell>
                            <TableCell>
                                <div
                                    className={`text-sm ${theme === "dark" ? "text-gray-300" : ""}`}
                                >
                                    <div>{campaign.startDate}</div>
                                    <div
                                        className={`${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}
                                    >
                                        to {campaign.endDate}
                                    </div>
                                </div>
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
                                    {campaign.associatedEmployees.length} employees
                                </Badge>
                            </TableCell>
                            <TableCell>
                                <Badge
                                    variant={campaign.promotionTriggered ? "default" : "secondary"}
                                    className={
                                        campaign.promotionTriggered
                                            ? theme === "dark"
                                                ? "bg-green-600 text-white"
                                                : "bg-green-600 text-white"
                                            : theme === "dark"
                                                ? "bg-gray-900 text-gray-300 border-gray-700"
                                                : "bg-gray-100 text-gray-600"
                                    }
                                >
                                    {campaign.promotionTriggered ? "Yes" : "No"}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                                <TooltipProvider delayDuration={150}>
                                    <div className="flex justify-end space-x-2">
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={e => {
                                                        e.stopPropagation();
                                                        onEpsCalculation(
                                                            campaign?.id ?? "",
                                                            campaign,
                                                        );
                                                    }}
                                                    className={
                                                        theme === "dark"
                                                            ? "text-amber-400 hover:text-amber-300 hover:bg-black"
                                                            : "text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                                                    }
                                                >
                                                    <BarChart className="h-4 w-4" />
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent side="top">
                                                Calculate EPS
                                            </TooltipContent>
                                        </Tooltip>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={e => {
                                                        e.stopPropagation();
                                                        onEdit(campaign);
                                                    }}
                                                    className={
                                                        theme === "dark"
                                                            ? "text-amber-400 hover:text-amber-300 hover:bg-black"
                                                            : "text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                                                    }
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent side="top">
                                                Edit campaign
                                            </TooltipContent>
                                        </Tooltip>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={e => {
                                                        e.stopPropagation();
                                                        onDelete(campaign);
                                                    }}
                                                    className={
                                                        theme === "dark"
                                                            ? "text-red-400 hover:text-red-300 hover:bg-black"
                                                            : "text-red-600 hover:text-red-700 hover:bg-red-50"
                                                    }
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent side="top">
                                                Delete campaign
                                            </TooltipContent>
                                        </Tooltip>
                                    </div>
                                </TooltipProvider>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
