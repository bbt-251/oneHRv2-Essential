"use client";

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
import { TransferModel, TransferStatus, TransferStage } from "@/lib/models/transfer";
import { useTheme } from "@/components/theme-provider";
import { Eye, Edit, Trash2, ArrowRight, Clock, CheckCircle, XCircle } from "lucide-react";
import dayjs from "dayjs";

interface TransferTableProps {
    transfers: TransferModel[];
    visibleColumns: Record<string, boolean>;
    transferTypes: any[];
    transferReasons: any[];
    onView: (transfer: TransferModel) => void;
    onEdit: (transfer: TransferModel) => void;
    onDelete: (transfer: TransferModel) => void;
}

export default function TransferTable({
    transfers,
    visibleColumns,
    transferTypes,
    transferReasons,
    onView,
    onEdit,
    onDelete,
}: TransferTableProps) {
    const { theme } = useTheme();

    // Get status badge color
    const getStatusColor = (status: TransferStatus) => {
        switch (status) {
            case "Requested":
                return "bg-blue-100 text-blue-700 border-blue-200";
            case "HR Assessment":
                return "bg-yellow-100 text-yellow-700 border-yellow-200";
            case "HR Approved":
            case "Current Manager Validated":
                return "bg-green-100 text-green-700 border-green-200";
            case "HR Refused":
            case "Current Manager Refused":
                return "bg-red-100 text-red-700 border-red-200";
            default:
                return "bg-gray-100 text-gray-700 border-gray-200";
        }
    };

    // Get stage badge color
    const getStageColor = (stage: TransferStage) => {
        switch (stage) {
            case "Open":
                return "bg-orange-100 text-orange-700 border-orange-200";
            case "Closed":
                return "bg-gray-100 text-gray-700 border-gray-200";
            default:
                return "bg-gray-100 text-gray-700 border-gray-200";
        }
    };

    // Get transfer type name - prefer stored name, fallback to lookup
    const getTransferTypeName = (transfer: TransferModel) => {
        if (transfer.transferTypeName) return transfer.transferTypeName;
        if (transfer.transferType) {
            const type = transferTypes?.find(t => t.id === transfer.transferType);
            return type?.name || transfer.transferType;
        }
        return "-";
    };

    // Get transfer reason name - prefer stored name, fallback to lookup
    const getTransferReasonName = (transfer: TransferModel) => {
        if (transfer.transferReasonName) return transfer.transferReasonName;
        if (transfer.transferReason) {
            const reason = transferReasons?.find(r => r.id === transfer.transferReason);
            return reason?.name || transfer.transferReason;
        }
        return "-";
    };

    if (transfers.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 px-4">
                <div
                    className={`p-4 rounded-full ${theme === "dark" ? "bg-gray-800" : "bg-gray-100"} mb-4`}
                >
                    <ArrowRight
                        className={`h-8 w-8 ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}
                    />
                </div>
                <h3
                    className={`text-lg font-semibold mb-2 ${theme === "dark" ? "text-white" : "text-gray-900"}`}
                >
                    No Transfer Requests
                </h3>
                <p className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>
                    You haven't submitted any transfer requests yet.
                </p>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            <Table>
                <TableHeader>
                    <TableRow className={theme === "dark" ? "border-gray-800" : "border-gray-200"}>
                        {visibleColumns.timestamp && (
                            <TableHead
                                className={theme === "dark" ? "text-gray-300" : "text-gray-600"}
                            >
                                Timestamp
                            </TableHead>
                        )}
                        {visibleColumns.transferID && (
                            <TableHead
                                className={theme === "dark" ? "text-gray-300" : "text-gray-600"}
                            >
                                Transfer ID
                            </TableHead>
                        )}
                        {visibleColumns.transferType && (
                            <TableHead
                                className={theme === "dark" ? "text-gray-300" : "text-gray-600"}
                            >
                                Transfer Type
                            </TableHead>
                        )}
                        {visibleColumns.transferReason && (
                            <TableHead
                                className={theme === "dark" ? "text-gray-300" : "text-gray-600"}
                            >
                                Reason
                            </TableHead>
                        )}
                        {visibleColumns.transferDesiredDate && (
                            <TableHead
                                className={theme === "dark" ? "text-gray-300" : "text-gray-600"}
                            >
                                Desired Date
                            </TableHead>
                        )}
                        {visibleColumns.transferStatus && (
                            <TableHead
                                className={theme === "dark" ? "text-gray-300" : "text-gray-600"}
                            >
                                Status
                            </TableHead>
                        )}
                        {visibleColumns.transferStage && (
                            <TableHead
                                className={theme === "dark" ? "text-gray-300" : "text-gray-600"}
                            >
                                Stage
                            </TableHead>
                        )}
                        {visibleColumns.actions && (
                            <TableHead
                                className={theme === "dark" ? "text-gray-300" : "text-gray-600"}
                            >
                                Actions
                            </TableHead>
                        )}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {transfers.map(transfer => (
                        <TableRow
                            key={transfer.id}
                            className={`${theme === "dark" ? "border-gray-800 hover:bg-gray-900" : "border-gray-200 hover:bg-gray-50"}`}
                        >
                            {visibleColumns.timestamp && (
                                <TableCell
                                    className={theme === "dark" ? "text-gray-300" : "text-gray-700"}
                                >
                                    {dayjs(transfer.timestamp).format("MMM DD, YYYY HH:mm")}
                                </TableCell>
                            )}
                            {visibleColumns.transferID && (
                                <TableCell
                                    className={`font-medium ${theme === "dark" ? "text-white" : "text-gray-900"}`}
                                >
                                    {transfer.transferID}
                                </TableCell>
                            )}
                            {visibleColumns.transferType && (
                                <TableCell
                                    className={theme === "dark" ? "text-gray-300" : "text-gray-700"}
                                >
                                    {getTransferTypeName(transfer)}
                                </TableCell>
                            )}
                            {visibleColumns.transferReason && (
                                <TableCell
                                    className={theme === "dark" ? "text-gray-300" : "text-gray-700"}
                                >
                                    {getTransferReasonName(transfer)}
                                </TableCell>
                            )}
                            {visibleColumns.transferDesiredDate && (
                                <TableCell
                                    className={theme === "dark" ? "text-gray-300" : "text-gray-700"}
                                >
                                    {transfer.transferDesiredDate
                                        ? dayjs(transfer.transferDesiredDate).format("MMM DD, YYYY")
                                        : "-"}
                                </TableCell>
                            )}
                            {visibleColumns.transferStatus && (
                                <TableCell>
                                    <Badge
                                        className={`text-xs px-2 py-1 border ${getStatusColor(transfer.transferStatus)}`}
                                    >
                                        {transfer.transferStatus}
                                    </Badge>
                                </TableCell>
                            )}
                            {visibleColumns.transferStage && (
                                <TableCell>
                                    <Badge
                                        className={`text-xs px-2 py-1 border ${getStageColor(transfer.transferStage)}`}
                                    >
                                        {transfer.transferStage}
                                    </Badge>
                                </TableCell>
                            )}
                            {visibleColumns.actions && (
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => onView(transfer)}
                                            className={`h-8 w-8 p-0 ${theme === "dark" ? "hover:bg-gray-800" : "hover:bg-gray-100"}`}
                                        >
                                            <Eye
                                                className={`h-4 w-4 ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}
                                            />
                                        </Button>
                                        {transfer.transferStatus ===
                                            "Current Manager Validated" && (
                                            <>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => onEdit(transfer)}
                                                    className={`h-8 w-8 p-0 ${theme === "dark" ? "hover:bg-gray-800" : "hover:bg-gray-100"}`}
                                                >
                                                    <Edit
                                                        className={`h-4 w-4 ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}
                                                    />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => onDelete(transfer)}
                                                    className={`h-8 w-8 p-0 hover:bg-red-50`}
                                                >
                                                    <Trash2 className="h-4 w-4 text-red-500" />
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                </TableCell>
                            )}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
