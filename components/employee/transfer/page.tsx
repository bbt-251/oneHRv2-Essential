"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Columns, Filter, X, Plus } from "lucide-react";
import { useFirestore } from "@/context/firestore-context";
import { useTheme } from "@/components/theme-provider";
import { useAuth } from "@/context/authContext";
import { TransferModel, TransferStatus, TransferStage } from "@/lib/models/transfer";
import TransferTable from "./blocks/transfer-table";
import AddTransferDialog from "./modals/add-transfer-dialog";
import EditTransferDialog from "./modals/edit-transfer-dialog";
import ViewTransferDialog from "./modals/view-transfer-dialog";
import DeleteTransferDialog from "./modals/delete-transfer-dialog";

// Column definitions for employee view
const employeeColumnDefinitions = [
    { key: "timestamp", label: "Timestamp", defaultVisible: true },
    { key: "transferID", label: "Transfer ID", defaultVisible: true },
    { key: "transferType", label: "Transfer Type", defaultVisible: true },
    { key: "transferReason", label: "Reason", defaultVisible: true },
    { key: "transferDesiredDate", label: "Desired Date", defaultVisible: true },
    { key: "transferStatus", label: "Status", defaultVisible: true },
    { key: "transferStage", label: "Stage", defaultVisible: true },
    { key: "actions", label: "Actions", defaultVisible: true },
];

export default function EmployeeTransferPage() {
    const { userData } = useAuth();
    const { theme } = useTheme();
    const { transfers, hrSettings } = useFirestore();
    const { transferTypes, transferReasons } = hrSettings;

    // Dialog states
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [selectedTransfer, setSelectedTransfer] = useState<TransferModel | null>(null);

    // Handler functions
    const handleView = (transfer: TransferModel) => {
        setSelectedTransfer(transfer);
        setIsViewDialogOpen(true);
    };

    const handleEdit = (transfer: TransferModel) => {
        setSelectedTransfer(transfer);
        setIsEditDialogOpen(true);
    };

    const handleDelete = (transfer: TransferModel) => {
        setSelectedTransfer(transfer);
        setIsDeleteDialogOpen(true);
    };

    const refreshData = () => {
        // The data will automatically refresh through the Firestore context
    };

    // Filter transfers for current employee
    const employeeTransfers = useMemo(() => {
        if (!userData?.uid) return [];
        return transfers.filter((transfer: TransferModel) => transfer.employeeUID === userData.uid);
    }, [transfers, userData]);

    // Filter state
    const [filters, setFilters] = useState({
        transferID: "",
        transferType: "",
        transferStatus: "",
        transferStage: "",
        startDate: "",
        endDate: "",
    });

    // Column visibility state
    const [visibleColumns, setVisibleColumns] = useState(() => {
        const initial: Record<string, boolean> = {};
        employeeColumnDefinitions.forEach(col => {
            initial[col.key] = col.defaultVisible;
        });
        return initial;
    });

    // Toggle column visibility
    const toggleColumn = (columnKey: string) => {
        setVisibleColumns(prev => ({
            ...prev,
            [columnKey]: !prev[columnKey],
        }));
    };

    // Clear all filters
    const clearFilters = () => {
        setFilters({
            transferID: "",
            transferType: "",
            transferStatus: "",
            transferStage: "",
            startDate: "",
            endDate: "",
        });
    };

    // Filter transfers
    const filteredTransfers = useMemo(() => {
        return employeeTransfers.filter((transfer: TransferModel) => {
            const matchesTransferID =
                !filters.transferID ||
                transfer.transferID.toLowerCase().includes(filters.transferID.toLowerCase());

            const matchesType =
                !filters.transferType ||
                filters.transferType === "all" ||
                transfer.transferType === filters.transferType;

            const matchesStatus =
                !filters.transferStatus ||
                filters.transferStatus === "all" ||
                transfer.transferStatus === filters.transferStatus;

            const matchesStage =
                !filters.transferStage ||
                filters.transferStage === "all" ||
                transfer.transferStage === filters.transferStage;

            const matchesStartDate =
                !filters.startDate || new Date(transfer.timestamp) >= new Date(filters.startDate);

            const matchesEndDate =
                !filters.endDate || new Date(transfer.timestamp) <= new Date(filters.endDate);

            return (
                matchesTransferID &&
                matchesType &&
                matchesStatus &&
                matchesStage &&
                matchesStartDate &&
                matchesEndDate
            );
        });
    }, [filters, employeeTransfers]);

    // Count active filters
    const activeFiltersCount = Object.values(filters).filter(
        value => value !== "" && value !== "all",
    ).length;

    // Get status badge color
    const getStatusColor = (status: TransferStatus) => {
        switch (status) {
            case "Requested":
                return "bg-blue-100 text-blue-700 border-blue-200";
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

    return (
        <>
            <Card
                className={`border-0 shadow-2xl overflow-hidden ${theme === "dark" ? "bg-black" : "bg-white"}`}
            >
                <div className="p-8 pb-0">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2
                                className="text-2xl font-bold"
                                style={{ color: theme === "dark" ? "#ffffff" : "#3f3d56" }}
                            >
                                My Transfer Requests
                            </h2>
                            <p className="text-slate-500 font-medium mt-1">
                                {filteredTransfers.length} of {employeeTransfers.length} requests
                                {activeFiltersCount > 0 &&
                                    ` (${activeFiltersCount} filters applied)`}
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            {/* Clear Filter Button */}
                            {activeFiltersCount > 0 && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={clearFilters}
                                    className="rounded-xl bg-transparent text-slate-500 hover:text-slate-700 border-slate-300"
                                >
                                    <X className="w-4 h-4 mr-2" />
                                    Clear Filters ({activeFiltersCount})
                                </Button>
                            )}

                            {/* Column Visibility Control */}
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className={`rounded-xl bg-transparent ${theme === "dark" ? "text-white" : "text-slate-500"}`}
                                    >
                                        <Columns className="w-4 h-4 mr-2" />
                                        Columns
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent
                                    className={`w-80 p-4 ${theme === "dark" ? "bg-black" : "bg-white"}`}
                                    align="end"
                                >
                                    <div
                                        className={`space-y-4 ${theme === "dark" ? "text-white" : "text-slate-500"}`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <h4 className="font-semibold text-slate-700">
                                                Show/Hide Columns
                                            </h4>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => {
                                                    const allVisible = Object.values(
                                                        visibleColumns,
                                                    ).every(v => v);
                                                    const newState: Record<string, boolean> = {};
                                                    employeeColumnDefinitions.forEach(col => {
                                                        newState[col.key] = !allVisible;
                                                    });
                                                    setVisibleColumns(newState);
                                                }}
                                                className="text-xs"
                                            >
                                                {Object.values(visibleColumns).every(v => v)
                                                    ? "Hide All"
                                                    : "Show All"}
                                            </Button>
                                        </div>
                                        <Separator />
                                        <div className="space-y-3 max-h-64 overflow-y-auto">
                                            {employeeColumnDefinitions.map(column => (
                                                <div
                                                    key={column.key}
                                                    className="flex items-center space-x-2"
                                                >
                                                    <Checkbox
                                                        id={column.key}
                                                        checked={visibleColumns[column.key]}
                                                        onCheckedChange={() =>
                                                            toggleColumn(column.key)
                                                        }
                                                    />
                                                    <label
                                                        htmlFor={column.key}
                                                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                                    >
                                                        {column.label}
                                                    </label>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </PopoverContent>
                            </Popover>

                            {/* Advanced Filter Control */}
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className={`rounded-xl bg-transparent relative ${theme === "dark" ? "text-white" : "text-slate-500"}`}
                                    >
                                        <Filter className="w-4 h-4 mr-2" />
                                        Filter
                                        {activeFiltersCount > 0 && (
                                            <Badge
                                                variant="secondary"
                                                className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                                                style={{
                                                    backgroundColor: "#3f3d56",
                                                    color: "white",
                                                }}
                                            >
                                                {activeFiltersCount}
                                            </Badge>
                                        )}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent
                                    className={`w-[500px] p-6 ${theme === "dark" ? "bg-black" : "bg-white"}`}
                                    align="end"
                                >
                                    <div
                                        className={`space-y-4 ${theme === "dark" ? "text-white" : "text-slate-500"}`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <h4 className="font-semibold text-slate-700">
                                                Advanced Filters
                                            </h4>
                                            {activeFiltersCount > 0 && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={clearFilters}
                                                    className="text-xs text-slate-500 hover:text-slate-700"
                                                >
                                                    <X className="w-3 h-3 mr-1" />
                                                    Clear All
                                                </Button>
                                            )}
                                        </div>
                                        <Separator />

                                        <div className="space-y-4">
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium text-slate-600">
                                                        Transfer ID
                                                    </label>
                                                    <Input
                                                        placeholder="Search ID..."
                                                        value={filters.transferID}
                                                        onChange={e =>
                                                            setFilters(prev => ({
                                                                ...prev,
                                                                transferID: e.target.value,
                                                            }))
                                                        }
                                                        className="rounded-lg h-9"
                                                    />
                                                </div>

                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium text-slate-600">
                                                        Transfer Type
                                                    </label>
                                                    <Select
                                                        value={filters.transferType}
                                                        onValueChange={value =>
                                                            setFilters(prev => ({
                                                                ...prev,
                                                                transferType: value,
                                                            }))
                                                        }
                                                    >
                                                        <SelectTrigger className="rounded-lg h-9">
                                                            <SelectValue placeholder="All types" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="all">
                                                                All Types
                                                            </SelectItem>
                                                            {transferTypes?.map((type: any) => (
                                                                <SelectItem
                                                                    key={type.id}
                                                                    value={type.id}
                                                                >
                                                                    {type.name}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium text-slate-600">
                                                        Status
                                                    </label>
                                                    <Select
                                                        value={filters.transferStatus}
                                                        onValueChange={value =>
                                                            setFilters(prev => ({
                                                                ...prev,
                                                                transferStatus: value,
                                                            }))
                                                        }
                                                    >
                                                        <SelectTrigger className="rounded-lg h-9">
                                                            <SelectValue placeholder="All statuses" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="all">
                                                                All Statuses
                                                            </SelectItem>
                                                            <SelectItem value="Requested">
                                                                Requested
                                                            </SelectItem>
                                                            <SelectItem value="HR Assessment">
                                                                HR Assessment
                                                            </SelectItem>
                                                            <SelectItem value="HR Approved">
                                                                HR Approved
                                                            </SelectItem>
                                                            <SelectItem value="HR Refused">
                                                                HR Refused
                                                            </SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium text-slate-600">
                                                        Stage
                                                    </label>
                                                    <Select
                                                        value={filters.transferStage}
                                                        onValueChange={value =>
                                                            setFilters(prev => ({
                                                                ...prev,
                                                                transferStage: value,
                                                            }))
                                                        }
                                                    >
                                                        <SelectTrigger className="rounded-lg h-9">
                                                            <SelectValue placeholder="All stages" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="all">
                                                                All Stages
                                                            </SelectItem>
                                                            <SelectItem value="Open">
                                                                Open
                                                            </SelectItem>
                                                            <SelectItem value="Closed">
                                                                Closed
                                                            </SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium text-slate-600">
                                                        From Date
                                                    </label>
                                                    <Input
                                                        type="date"
                                                        value={filters.startDate}
                                                        onChange={e =>
                                                            setFilters(prev => ({
                                                                ...prev,
                                                                startDate: e.target.value,
                                                            }))
                                                        }
                                                        className="rounded-lg h-9"
                                                    />
                                                </div>

                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium text-slate-600">
                                                        To Date
                                                    </label>
                                                    <Input
                                                        type="date"
                                                        value={filters.endDate}
                                                        onChange={e =>
                                                            setFilters(prev => ({
                                                                ...prev,
                                                                endDate: e.target.value,
                                                            }))
                                                        }
                                                        className="rounded-lg h-9"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </PopoverContent>
                            </Popover>

                            {/* Create Transfer Button */}
                            <Button
                                onClick={() => setIsAddDialogOpen(true)}
                                className="rounded-xl bg-brand-600 hover:bg-brand-700 text-white"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                New Transfer Request
                            </Button>
                        </div>
                    </div>
                </div>

                <TransferTable
                    transfers={filteredTransfers}
                    visibleColumns={visibleColumns}
                    transferTypes={transferTypes}
                    transferReasons={transferReasons}
                    onView={handleView}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                />
            </Card>

            {/* Add Transfer Dialog */}
            <AddTransferDialog
                isOpen={isAddDialogOpen}
                onClose={() => setIsAddDialogOpen(false)}
                onSuccess={refreshData}
                transferTypes={transferTypes}
                transferReasons={transferReasons}
            />

            {/* Edit Transfer Dialog */}
            <EditTransferDialog
                isOpen={isEditDialogOpen}
                onClose={() => {
                    setIsEditDialogOpen(false);
                    setSelectedTransfer(null);
                }}
                onSuccess={refreshData}
                transfer={selectedTransfer}
                transferTypes={transferTypes}
                transferReasons={transferReasons}
            />

            {/* View Transfer Dialog */}
            <ViewTransferDialog
                isOpen={isViewDialogOpen}
                onClose={() => {
                    setIsViewDialogOpen(false);
                    setSelectedTransfer(null);
                }}
                transfer={selectedTransfer}
                transferTypes={transferTypes}
                transferReasons={transferReasons}
            />

            {/* Delete Transfer Dialog */}
            <DeleteTransferDialog
                isOpen={isDeleteDialogOpen}
                onClose={() => {
                    setIsDeleteDialogOpen(false);
                    setSelectedTransfer(null);
                }}
                onSuccess={refreshData}
                transfer={selectedTransfer}
                transferTypes={transferTypes}
                transferReasons={transferReasons}
            />
        </>
    );
}
