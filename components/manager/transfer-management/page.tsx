"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/context/authContext";
import { useFirestore } from "@/context/firestore-context";
import { TransferModel } from "@/lib/models/transfer";
import { AlertCircle, ArrowRight, CheckCircle, Clock, Search, XCircle } from "lucide-react";
import { useMemo, useState } from "react";
import ManagerTransferTable from "./blocks/manager-transfer-table";
import ApproveTransferDialog from "./modals/approve-transfer-dialog";
import RefuseTransferDialog from "./modals/refuse-transfer-dialog";
import ViewTransferDialog from "./modals/view-transfer-dialog";

export default function ManagerTransferManagementPage() {
    const { userData } = useAuth();
    const { transfers, employees, hrSettings } = useFirestore();
    const { transferTypes, transferReasons } = hrSettings;

    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [selectedTransfer, setSelectedTransfer] = useState<TransferModel | null>(null);
    const [isViewOpen, setIsViewOpen] = useState(false);
    const [isApproveOpen, setIsApproveOpen] = useState(false);
    const [isRefuseOpen, setIsRefuseOpen] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);

    // Get reportees' UIDs - employees whose reportingLineManager is the current user
    const reporteeUIDs = useMemo(() => {
        if (!employees || !userData?.uid) return [];
        return employees
            .filter(emp => emp.reportingLineManager === userData.uid)
            .map(emp => emp.uid);
    }, [employees, userData?.uid]);

    // Filter transfers for manager's reportees that are in "Requested" status
    const reporteeTransfers = useMemo(() => {
        if (!transfers || !reporteeUIDs.length) return [];

        return transfers.filter(transfer => {
            // Only show transfers for manager's reportees
            if (!reporteeUIDs.includes(transfer.employeeUID)) return false;

            // Apply status filter
            if (statusFilter !== "all") {
                if (statusFilter === "pending") {
                    return transfer.transferStatus === "Requested";
                } else if (statusFilter === "validated") {
                    return transfer.transferStatus === "Current Manager Validated";
                } else if (statusFilter === "refused") {
                    return transfer.transferStatus === "Current Manager Refused";
                }
            }

            // Apply search filter
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                return (
                    transfer.transferID.toLowerCase().includes(query) ||
                    transfer.employeeFullName.toLowerCase().includes(query) ||
                    (transfer.transferTypeName?.toLowerCase() || "").includes(query)
                );
            }

            return true;
        });
    }, [transfers, reporteeUIDs, statusFilter, searchQuery]);

    // Stats
    const stats = useMemo(() => {
        const pending = reporteeTransfers.filter(t => t.transferStatus === "Requested").length;
        const validated = reporteeTransfers.filter(
            t => t.transferStatus === "Current Manager Validated",
        ).length;
        const refused = reporteeTransfers.filter(
            t => t.transferStatus === "Current Manager Refused",
        ).length;
        return { pending, validated, refused, total: reporteeTransfers.length };
    }, [reporteeTransfers]);

    const handleView = (transfer: TransferModel) => {
        setSelectedTransfer(transfer);
        setIsViewOpen(true);
    };

    const handleApprove = (transfer: TransferModel) => {
        setSelectedTransfer(transfer);
        setIsApproveOpen(true);
    };

    const handleRefuse = (transfer: TransferModel) => {
        setSelectedTransfer(transfer);
        setIsRefuseOpen(true);
    };

    const handleSuccess = () => {
        setRefreshKey(prev => prev + 1);
    };

    return (
        <div className="space-y-6 p-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <ArrowRight className="h-6 w-6 text-brand-600" />
                        Reportee Transfer Requests
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Review and validate transfer requests from your team members
                    </p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Pending Review</p>
                                <p className="text-2xl font-bold text-blue-600">{stats.pending}</p>
                            </div>
                            <Clock className="h-8 w-8 text-blue-500 opacity-50" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Validated</p>
                                <p className="text-2xl font-bold text-green-600">
                                    {stats.validated}
                                </p>
                            </div>
                            <CheckCircle className="h-8 w-8 text-green-500 opacity-50" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Refused</p>
                                <p className="text-2xl font-bold text-red-600">{stats.refused}</p>
                            </div>
                            <XCircle className="h-8 w-8 text-red-500 opacity-50" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Total</p>
                                <p className="text-2xl font-bold text-gray-600">{stats.total}</p>
                            </div>
                            <AlertCircle className="h-8 w-8 text-gray-500 opacity-50" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder="Search by transfer ID, employee name, or type..."
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </div>
                        <div className="w-full md:w-48">
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Filter by status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="pending">Pending Review</SelectItem>
                                    <SelectItem value="validated">Validated</SelectItem>
                                    <SelectItem value="refused">Refused</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Transfer Table */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Transfer Requests</CardTitle>
                </CardHeader>
                <CardContent>
                    <ManagerTransferTable
                        key={refreshKey}
                        transfers={reporteeTransfers}
                        transferTypes={transferTypes || []}
                        transferReasons={transferReasons || []}
                        onView={handleView}
                        onApprove={handleApprove}
                        onRefuse={handleRefuse}
                    />
                </CardContent>
            </Card>

            {/* Dialogs */}
            <ViewTransferDialog
                isOpen={isViewOpen}
                onClose={() => setIsViewOpen(false)}
                transfer={selectedTransfer}
                transferTypes={transferTypes || []}
                transferReasons={transferReasons || []}
            />
            <ApproveTransferDialog
                isOpen={isApproveOpen}
                onClose={() => setIsApproveOpen(false)}
                onSuccess={handleSuccess}
                transfer={selectedTransfer}
            />
            <RefuseTransferDialog
                isOpen={isRefuseOpen}
                onClose={() => setIsRefuseOpen(false)}
                onSuccess={handleSuccess}
                transfer={selectedTransfer}
            />
        </div>
    );
}
