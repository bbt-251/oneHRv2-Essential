"use client";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { TransferModel, TransferStatus, TransferStage } from "@/lib/models/transfer";
import { TransferTypeModel, TransferReasonModel } from "@/lib/backend/firebase/hrSettingsService";
import {
    Calendar,
    Clock,
    FileText,
    AlertCircle,
    CheckCircle,
    XCircle,
    ArrowRight,
    User,
    BookOpen,
    Users,
} from "lucide-react";
import dayjs from "dayjs";

interface ViewTransferDialogProps {
    isOpen: boolean;
    onClose: () => void;
    transfer: TransferModel | null;
    transferTypes: TransferTypeModel[];
    transferReasons: TransferReasonModel[];
}

export default function ViewTransferDialog({
    isOpen,
    onClose,
    transfer,
    transferTypes,
    transferReasons,
}: ViewTransferDialogProps) {
    // Get status badge color
    const getStatusColor = (status: TransferStatus) => {
        switch (status) {
            case "Requested":
                return "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800";
            case "Current Manager Validated":
                return "bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800";
            case "Current Manager Refused":
                return "bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800";
            case "HR Assessment":
                return "bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800";
            case "HR Approved":
                return "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800";
            case "HR Refused":
                return "bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800";
            default:
                return "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700";
        }
    };

    // Get stage badge color
    const getStageColor = (stage: TransferStage) => {
        switch (stage) {
            case "Open":
                return "bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800";
            case "Closed":
                return "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700";
            default:
                return "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700";
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

    // Get status icon
    const getStatusIcon = (status: TransferStatus) => {
        switch (status) {
            case "Requested":
                return <Clock className="h-4 w-4" />;
            case "Current Manager Validated":
                return <CheckCircle className="h-4 w-4" />;
            case "Current Manager Refused":
                return <XCircle className="h-4 w-4" />;
            case "HR Assessment":
                return <AlertCircle className="h-4 w-4" />;
            case "HR Approved":
                return <CheckCircle className="h-4 w-4" />;
            case "HR Refused":
                return <XCircle className="h-4 w-4" />;
            default:
                return <Clock className="h-4 w-4" />;
        }
    };

    if (!transfer) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader className="pb-4">
                    <DialogTitle className="text-xl font-bold text-brand-800 dark:text-brand-400 flex items-center gap-2">
                        <ArrowRight className="h-5 w-5 text-brand-600 dark:text-brand-500" />
                        Transfer Request Details
                    </DialogTitle>
                    <DialogDescription>
                        View details of the transfer request from your reportee
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Header Section */}
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                {transfer.transferID}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Transfer ID</p>
                        </div>
                        <div className="flex gap-2">
                            <Badge
                                className={`text-xs px-3 py-1 border ${getStatusColor(transfer.transferStatus)}`}
                            >
                                <span className="flex items-center gap-1">
                                    {getStatusIcon(transfer.transferStatus)}
                                    {transfer.transferStatus}
                                </span>
                            </Badge>
                            <Badge
                                className={`text-xs px-3 py-1 border ${getStageColor(transfer.transferStage)}`}
                            >
                                {transfer.transferStage}
                            </Badge>
                        </div>
                    </div>

                    {/* Employee Information */}
                    <div className="space-y-3">
                        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide flex items-center gap-2">
                            <User className="h-4 w-4" />
                            Employee Information
                        </h4>
                        <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                            <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Employee Name
                                </p>
                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                    {transfer.employeeFullName}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Employee ID
                                </p>
                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                    {transfer.employeeUID}
                                </p>
                            </div>
                        </div>
                    </div>

                    <Separator />

                    {/* Transfer Details */}
                    <div className="space-y-3">
                        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide flex items-center gap-2">
                            <ArrowRight className="h-4 w-4" />
                            Transfer Details
                        </h4>
                        <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                            <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Transfer Type
                                </p>
                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                    {getTransferTypeName(transfer)}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Transfer Reason
                                </p>
                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                    {getTransferReasonName(transfer)}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Desired Transfer Date
                                </p>
                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {transfer.transferDesiredDate
                                        ? dayjs(transfer.transferDesiredDate).format(
                                            "MMMM DD, YYYY",
                                        )
                                        : "-"}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Request Date
                                </p>
                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {dayjs(transfer.timestamp).format("MMM DD, YYYY HH:mm")}
                                </p>
                            </div>
                        </div>
                    </div>

                    <Separator />

                    {/* Description */}
                    {transfer.transferDescription && (
                        <>
                            <div className="space-y-3">
                                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide flex items-center gap-2">
                                    <FileText className="h-4 w-4" />
                                    Description
                                </h4>
                                <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                                    <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                                        {transfer.transferDescription}
                                    </p>
                                </div>
                            </div>
                            <Separator />
                        </>
                    )}

                    {/* Order Guide Section */}
                    {transfer.orderGuide && (
                        <>
                            <div className="space-y-3">
                                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide flex items-center gap-2">
                                    <BookOpen className="h-4 w-4 text-green-500 dark:text-green-400" />
                                    Order Guide
                                </h4>
                                <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                                    <p className="text-sm font-medium text-green-800 dark:text-green-200">
                                        Order Guide ID: {transfer.orderGuide}
                                    </p>
                                </div>
                            </div>
                            <Separator />
                        </>
                    )}

                    {/* Associated Interviews Section */}
                    {transfer.associatedInterview && transfer.associatedInterview.length > 0 && (
                        <>
                            <div className="space-y-3">
                                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide flex items-center gap-2">
                                    <Users className="h-4 w-4 text-blue-500 dark:text-blue-400" />
                                    Associated Interviews
                                </h4>
                                <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                                    <div className="space-y-2">
                                        {transfer.associatedInterview.map((interviewId, index) => (
                                            <p
                                                key={index}
                                                className="text-sm font-medium text-blue-800 dark:text-blue-200"
                                            >
                                                Interview #{index + 1}: {interviewId}
                                            </p>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <Separator />
                        </>
                    )}

                    {/* Risk Mitigation */}
                    {transfer.mitigationForTransferRisk && (
                        <>
                            <div className="space-y-3">
                                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide flex items-center gap-2">
                                    <AlertCircle className="h-4 w-4" />
                                    Risk Mitigation Plan
                                </h4>
                                <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                                    <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                                        {transfer.mitigationForTransferRisk}
                                    </p>
                                </div>
                            </div>
                            <Separator />
                        </>
                    )}

                    {/* Manager Remark */}
                    {transfer.managerRemark && (
                        <div className="space-y-3">
                            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide flex items-center gap-2">
                                <User className="h-4 w-4 text-purple-500 dark:text-purple-400" />
                                Manager Remark
                            </h4>
                            <div className="p-4 bg-purple-50 dark:bg-purple-950 rounded-lg border border-purple-200 dark:border-purple-800">
                                <div className="flex items-center gap-2 mb-2">
                                    <Badge className="bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800 text-xs">
                                        {transfer.managerRemark.authorName}
                                    </Badge>
                                    <span className="text-xs text-purple-500 dark:text-purple-400">
                                        {dayjs(transfer.managerRemark.timestamp).format(
                                            "MMM DD, YYYY HH:mm",
                                        )}
                                    </span>
                                </div>
                                <p className="text-sm text-purple-700 dark:text-purple-300">
                                    {transfer.managerRemark.content}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* HR Remark */}
                    {transfer.hrRemark && (
                        <div className="space-y-3">
                            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide flex items-center gap-2">
                                <XCircle className="h-4 w-4" />
                                HR Remark
                            </h4>
                            <div className="p-4 rounded-lg border bg-gray-50 dark:bg-gray-900 dark:border-gray-700">
                                <div className="flex items-center gap-2 mb-2">
                                    <Badge className="text-xs">
                                        {transfer.hrRemark.authorName}
                                    </Badge>
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                        {dayjs(transfer.hrRemark.timestamp).format(
                                            "MMM DD, YYYY HH:mm",
                                        )}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-700 dark:text-gray-300">
                                    {transfer.hrRemark.content}
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
