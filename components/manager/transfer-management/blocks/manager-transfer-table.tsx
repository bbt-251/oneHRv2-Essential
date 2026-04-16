"use client";

import { useState } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TransferModel, TransferStatus } from "@/lib/models/transfer";
import { TransferTypeModel, TransferReasonModel } from "@/lib/backend/firebase/hrSettingsService";
import { Eye, CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react";
import dayjs from "dayjs";

interface ManagerTransferTableProps {
    transfers: TransferModel[];
    transferTypes: TransferTypeModel[];
    transferReasons: TransferReasonModel[];
    onView: (transfer: TransferModel) => void;
    onApprove: (transfer: TransferModel) => void;
    onRefuse: (transfer: TransferModel) => void;
}

export default function ManagerTransferTable({
    transfers,
    transferTypes,
    transferReasons,
    onView,
    onApprove,
    onRefuse,
}: ManagerTransferTableProps) {
    // Get status badge color
    const getStatusColor = (status: TransferStatus) => {
        switch (status) {
            case "Requested":
                return "bg-blue-100 text-blue-700 border-blue-200";
            case "Current Manager Validated":
                return "bg-purple-100 text-purple-700 border-purple-200";
            case "Current Manager Refused":
                return "bg-red-100 text-red-700 border-red-200";
            case "HR Assessment":
                return "bg-yellow-100 text-yellow-700 border-yellow-200";
            case "HR Approved":
                return "bg-green-100 text-green-700 border-green-200";
            case "HR Refused":
                return "bg-red-100 text-red-700 border-red-200";
            default:
                return "bg-gray-100 text-gray-700 border-gray-200";
        }
    };

    // Get transfer type name
    const getTransferTypeName = (transfer: TransferModel) => {
        if (transfer.transferTypeName) return transfer.transferTypeName;
        if (transfer.transferType) {
            const type = transferTypes?.find(t => t.id === transfer.transferType);
            return type?.name || transfer.transferType;
        }
        return "-";
    };

    // Check if action buttons should be shown
    const canTakeAction = (transfer: TransferModel) => {
        return transfer.transferStatus === "Requested";
    };

    if (transfers.length === 0) {
        return (
            <div className="text-center py-12">
                <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900">No transfer requests found</h3>
                <p className="text-sm text-gray-500 mt-1">
                    There are no transfer requests from your reportees at this time.
                </p>
            </div>
        );
    }

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Transfer ID</TableHead>
                        <TableHead>Employee</TableHead>
                        <TableHead>Transfer Type</TableHead>
                        <TableHead>Desired Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Request Date</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {transfers.map(transfer => (
                        <TableRow key={transfer.id}>
                            <TableCell className="font-medium">{transfer.transferID}</TableCell>
                            <TableCell>{transfer.employeeFullName}</TableCell>
                            <TableCell>{getTransferTypeName(transfer)}</TableCell>
                            <TableCell>
                                {transfer.transferDesiredDate
                                    ? dayjs(transfer.transferDesiredDate).format("MMM DD, YYYY")
                                    : "-"}
                            </TableCell>
                            <TableCell>
                                <Badge
                                    className={`text-xs px-2 py-1 border ${getStatusColor(transfer.transferStatus)}`}
                                >
                                    {transfer.transferStatus}
                                </Badge>
                            </TableCell>
                            <TableCell>
                                {dayjs(transfer.timestamp).format("MMM DD, YYYY")}
                            </TableCell>
                            <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-2">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => onView(transfer)}
                                        className="h-8 w-8 p-0"
                                    >
                                        <Eye className="h-4 w-4" />
                                    </Button>
                                    {canTakeAction(transfer) && (
                                        <>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => onApprove(transfer)}
                                                className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                                            >
                                                <CheckCircle className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => onRefuse(transfer)}
                                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                            >
                                                <XCircle className="h-4 w-4" />
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
