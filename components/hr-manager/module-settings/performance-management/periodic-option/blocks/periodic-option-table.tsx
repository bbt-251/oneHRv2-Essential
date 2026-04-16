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
import { PeriodicOptionModel } from "@/lib/models/performance";
import { timestampFormat } from "@/lib/util/dayjs_format";
import dayjs from "dayjs";
import { Edit, Trash2 } from "lucide-react";

interface PeriodicOptionTableProps {
    data: PeriodicOptionModel[];
    onEdit: (option: PeriodicOptionModel) => void;
    onDelete: (option: PeriodicOptionModel) => void;
}

export default function PeriodicOptionTable({ data, onEdit, onDelete }: PeriodicOptionTableProps) {
    const { theme } = useTheme();

    if (data.length === 0) {
        return (
            <div
                className={`text-center py-8 ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}
            >
                <p>No periodic options configured yet.</p>
                <p className="text-sm mt-1">Click "Add Period Option" to get started.</p>
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
                            Period Name
                        </TableHead>
                        <TableHead className={theme === "dark" ? "text-gray-300" : ""}>
                            Year
                        </TableHead>
                        <TableHead className={theme === "dark" ? "text-gray-300" : ""}>
                            Evaluation Rounds
                        </TableHead>
                        <TableHead
                            className={`text-right ${theme === "dark" ? "text-gray-300" : ""}`}
                        >
                            Actions
                        </TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.map(option => (
                        <TableRow
                            key={option.id}
                            className={`cursor-pointer ${
                                theme === "dark"
                                    ? "hover:bg-gray-900 border-gray-700"
                                    : "hover:bg-gray-50"
                            }`}
                            onClick={() => onEdit(option)}
                        >
                            <TableCell className={theme === "dark" ? "text-gray-300" : ""}>
                                {option.timestamp
                                    ? dayjs(option.timestamp).format(timestampFormat)
                                    : "N/A"}
                            </TableCell>
                            <TableCell
                                className={`font-medium ${theme === "dark" ? "text-white" : ""}`}
                            >
                                {option.periodName}
                            </TableCell>
                            <TableCell className={theme === "dark" ? "text-gray-300" : ""}>
                                {option.year}
                            </TableCell>
                            <TableCell>
                                <div className="space-y-1">
                                    {option.evaluations.map((evaluation, index) => (
                                        <Badge
                                            key={index}
                                            variant="secondary"
                                            className={`mr-1 ${
                                                theme === "dark"
                                                    ? "bg-gray-900 text-gray-300 border-gray-700"
                                                    : "bg-gray-100 text-gray-600"
                                            }`}
                                        >
                                            {evaluation.round}
                                        </Badge>
                                    ))}
                                </div>
                            </TableCell>
                            <TableCell className="text-right">
                                <div className="flex justify-end space-x-2">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={e => {
                                            e.stopPropagation();
                                            onEdit(option);
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
                                            onDelete(option);
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
