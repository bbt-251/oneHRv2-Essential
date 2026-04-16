"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import {
    Search,
    MoreVertical,
    CheckCircle,
    XCircle,
    Filter,
    Check,
    ChevronsUpDown,
    Calendar,
    Eye,
    Loader2,
} from "lucide-react";
import { DelegationModel } from "@/lib/models/delegation";
import { useFirestore } from "@/context/firestore-context";
import { useToast } from "@/context/toastContext";
import {
    approveDelegation,
    rejectDelegation,
} from "@/lib/backend/api/delegation/delegation-service";
import getFullName from "@/lib/util/getEmployeeFullName";
import { useAuth } from "@/context/authContext";

const statusOptions = ["Pending", "Approved", "Cancelled"];

export function DelegationApproval() {
    const { userData } = useAuth();
    const { employees, delegations: firestoreDelegations } = useFirestore();
    const { showToast } = useToast();

    const [approvals, setApprovals] = useState<DelegationModel[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [showFilterModal, setShowFilterModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [showApproveModal, setShowApproveModal] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [selectedApproval, setSelectedApproval] = useState<DelegationModel | null>(null);
    const [isApproving, setIsApproving] = useState(false);
    const [isRejecting, setIsRejecting] = useState(false);

    // Filter states
    const [selectedDelegatees, setSelectedDelegatees] = useState<string[]>([]);
    const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
    const [filterDateFrom, setFilterDateFrom] = useState("");
    const [filterDateTo, setFilterDateTo] = useState("");
    const [openDelegateePopover, setOpenDelegateePopover] = useState(false);
    const [openStatusPopover, setOpenStatusPopover] = useState(false);

    // Filter logic
    const filteredApprovals = approvals.filter(approval => {
        const matchesSearch =
            approval.delegationID.toLowerCase().includes(searchTerm.toLowerCase()) ||
            approval.delegator.toLowerCase().includes(searchTerm.toLowerCase()) ||
            approval.delegatee.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesDelegatee =
            selectedDelegatees.length === 0 || selectedDelegatees.includes(approval.delegatee);

        const matchesStatus =
            selectedStatuses.length === 0 || selectedStatuses.includes(approval.delegationStatus);

        const matchesDateRange =
            (!filterDateFrom || approval.periodStart >= filterDateFrom) &&
            (!filterDateTo || approval.periodEnd <= filterDateTo);

        return matchesSearch && matchesDelegatee && matchesStatus && matchesDateRange;
    });

    useEffect(() => {
        setApprovals(firestoreDelegations.filter(d => d.delegatee == userData?.uid));
    }, [userData?.uid, firestoreDelegations]);

    const handleView = (approval: DelegationModel) => {
        setSelectedApproval(approval);
        setShowViewModal(true);
    };

    const handleApprove = (approval: DelegationModel) => {
        setSelectedApproval(approval);
        setShowApproveModal(true);
    };

    const handleReject = (approval: DelegationModel) => {
        setSelectedApproval(approval);
        setShowRejectModal(true);
    };

    const confirmApprove = async () => {
        if (selectedApproval) {
            setIsApproving(true);
            try {
                const result = await approveDelegation(selectedApproval.id, userData?.uid);
                if (result.success) {
                    showToast("Delegation approved successfully", "Success", "success");
                } else {
                    showToast(result.error || "Failed to approve delegation", "Error", "error");
                }
            } catch (error) {
                showToast("An unexpected error occurred", "Error", "error");
            } finally {
                setIsApproving(false);
                setShowApproveModal(false);
                setSelectedApproval(null);
            }
        }
    };

    const confirmReject = async () => {
        if (selectedApproval) {
            setIsRejecting(true);
            try {
                const result = await rejectDelegation(selectedApproval.id, userData?.uid);
                if (result.success) {
                    showToast("Delegation rejected successfully", "Success", "success");
                    setApprovals(
                        approvals.map(a =>
                            a.id === selectedApproval.id
                                ? { ...a, delegationStatus: "Cancelled" }
                                : a,
                        ),
                    );
                } else {
                    showToast(result.error || "Failed to reject delegation", "Error", "error");
                }
            } catch (error) {
                showToast("An unexpected error occurred", "Error", "error");
            } finally {
                setIsRejecting(false);
                setShowRejectModal(false);
                setSelectedApproval(null);
            }
        }
    };

    const clearAllFilters = () => {
        setSearchTerm("");
        setSelectedDelegatees([]);
        setSelectedStatuses([]);
        setFilterDateFrom("");
        setFilterDateTo("");
    };

    const hasActiveFilters =
        searchTerm ||
        selectedDelegatees.length > 0 ||
        selectedStatuses.length > 0 ||
        filterDateFrom ||
        filterDateTo;

    const pendingCount = approvals.filter(a => a.delegationStatus === "Pending").length;
    const approvedCount = approvals.filter(a => a.delegationStatus === "Approved").length;
    const rejectedCount = approvals.filter(a => a.delegationStatus === "Cancelled").length;

    return (
        <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="border-brand-200 bg-gradient-to-br from-brand-50 to-brand-100 dark:from-brand-900/20 dark:to-brand-800/20">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-brand-600 dark:text-brand-400">
                                    Total Approvals
                                </p>
                                <p className="text-3xl font-bold text-brand-800 dark:text-brand-300">
                                    {approvals.length}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-yellow-200 bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400">
                                    Pending
                                </p>
                                <p className="text-3xl font-bold text-yellow-800 dark:text-yellow-300">
                                    {pendingCount}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-green-200 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-green-600 dark:text-green-400">
                                    Approved
                                </p>
                                <p className="text-3xl font-bold text-green-800 dark:text-green-300">
                                    {approvedCount}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-red-200 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-red-600 dark:text-red-400">
                                    Cancelled
                                </p>
                                <p className="text-3xl font-bold text-red-800 dark:text-red-300">
                                    {rejectedCount}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Search and Filter Bar */}
            <div className="flex gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                        placeholder="Search by delegation ID, delegator, or delegatee..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="pl-10 border-gray-400 dark:border-gray-500"
                    />
                </div>
                <Button
                    variant="outline"
                    onClick={() => setShowFilterModal(true)}
                    className="border-gray-400 dark:border-gray-500"
                >
                    <Filter className="h-4 w-4 mr-2" />
                    Filters
                </Button>
                {hasActiveFilters && (
                    <Button
                        variant="outline"
                        onClick={clearAllFilters}
                        className="border-gray-400 bg-transparent"
                    >
                        Clear All
                    </Button>
                )}
            </div>

            {/* Table */}
            <Card className="border-gray-200/60 dark:border-gray-800/60">
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Timestamp</TableHead>
                                <TableHead>Delegation ID</TableHead>
                                <TableHead>Delegator</TableHead>
                                <TableHead>Delegatee</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Period Start</TableHead>
                                <TableHead>Period End</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredApprovals.map(approval => {
                                const delegatee = employees.find(e => e.uid == approval.delegatee);
                                const delegator = employees.find(e => e.uid == approval.delegator);
                                return (
                                    <TableRow key={approval.delegationID}>
                                        <TableCell className="font-medium">
                                            {new Date(approval.timestamp).toLocaleString()}
                                        </TableCell>
                                        <TableCell>{approval.delegationID}</TableCell>
                                        <TableCell>
                                            <div>
                                                <div className="font-medium">
                                                    {delegator ? getFullName(delegator) : "N/A"}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {delegator?.employeeID ?? ""}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div>
                                                <div className="font-medium">
                                                    {delegatee ? getFullName(delegatee) : "N/A"}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {delegatee?.employeeID ?? ""}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {approval.delegationStatus === "Pending" && (
                                                <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                                                    Pending
                                                </Badge>
                                            )}
                                            {approval.delegationStatus === "Approved" && (
                                                <Badge className="bg-green-100 text-green-800 border-green-200">
                                                    Approved
                                                </Badge>
                                            )}
                                            {approval.delegationStatus === "Cancelled" && (
                                                <Badge className="bg-red-100 text-red-800 border-red-200">
                                                    Cancelled
                                                </Badge>
                                            )}
                                        </TableCell>
                                        <TableCell>{approval.periodStart}</TableCell>
                                        <TableCell>{approval.periodEnd}</TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="sm">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent
                                                    align="end"
                                                    className="w-48 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700"
                                                >
                                                    <DropdownMenuItem
                                                        onClick={() => handleView(approval)}
                                                        className="focus:outline-none hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
                                                    >
                                                        <Eye className="h-4 w-4 mr-2" />
                                                        View Details
                                                    </DropdownMenuItem>
                                                    {approval.delegationStatus === "Pending" && (
                                                        <>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem
                                                                onClick={() =>
                                                                    handleApprove(approval)
                                                                }
                                                                className="focus:outline-none hover:bg-green-50 dark:hover:bg-green-900/20 cursor-pointer text-green-600"
                                                            >
                                                                <CheckCircle className="h-4 w-4 mr-2" />
                                                                Approve
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                onClick={() =>
                                                                    handleReject(approval)
                                                                }
                                                                className="focus:outline-none hover:bg-red-50 dark:hover:bg-red-900/20 cursor-pointer text-red-600"
                                                            >
                                                                <XCircle className="h-4 w-4 mr-2" />
                                                                Reject
                                                            </DropdownMenuItem>
                                                        </>
                                                    )}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Filter Modal */}
            <Dialog open={showFilterModal} onOpenChange={setShowFilterModal}>
                <DialogContent className="max-w-2xl bg-white dark:bg-gray-900 z-[200]">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-semibold text-brand-800 dark:text-foreground">
                            Filter Approvals
                        </DialogTitle>
                    </DialogHeader>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                        {/* Status Filter */}
                        <div>
                            <Label>Status</Label>
                            <Popover open={openStatusPopover} onOpenChange={setOpenStatusPopover}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        className="w-full justify-between border-gray-400 dark:border-gray-500 bg-transparent"
                                    >
                                        {selectedStatuses.length > 0
                                            ? `${selectedStatuses.length} selected`
                                            : "Select statuses..."}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent
                                    className="w-full p-0 bg-white dark:bg-gray-900 z-[300]"
                                    style={{ width: "var(--radix-popover-trigger-width)" }}
                                >
                                    <Command>
                                        <CommandList>
                                            <CommandEmpty>No status found.</CommandEmpty>
                                            <CommandGroup>
                                                {statusOptions.map(status => (
                                                    <CommandItem
                                                        key={status}
                                                        onSelect={() => {
                                                            setSelectedStatuses(prev =>
                                                                prev.includes(status)
                                                                    ? prev.filter(s => s !== status)
                                                                    : [...prev, status],
                                                            );
                                                        }}
                                                        className="hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
                                                    >
                                                        <Check
                                                            className={`mr-2 h-4 w-4 ${
                                                                selectedStatuses.includes(status)
                                                                    ? "opacity-100"
                                                                    : "opacity-0"
                                                            }`}
                                                        />
                                                        {status}
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>

                        {/* Period Start Date */}
                        <div>
                            <Label>Period Start (From)</Label>
                            <div className="relative">
                                <Input
                                    type="date"
                                    value={filterDateFrom}
                                    onChange={e => setFilterDateFrom(e.target.value)}
                                    className="border-gray-400 dark:border-gray-500"
                                />
                                <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                            </div>
                        </div>

                        {/* Period End Date */}
                        <div>
                            <Label>Period End (To)</Label>
                            <div className="relative">
                                <Input
                                    type="date"
                                    value={filterDateTo}
                                    onChange={e => setFilterDateTo(e.target.value)}
                                    className="border-gray-400 dark:border-gray-500"
                                />
                                <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowFilterModal(false)}>
                            Cancel
                        </Button>
                        <Button
                            className="bg-brand-600 hover:bg-brand-700 text-white"
                            onClick={() => setShowFilterModal(false)}
                        >
                            Apply Filters
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* View Details Modal */}
            <Dialog open={showViewModal} onOpenChange={setShowViewModal}>
                <DialogContent className="max-w-2xl bg-white dark:bg-gray-900">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-semibold text-brand-800 dark:text-foreground">
                            Delegation Details
                        </DialogTitle>
                    </DialogHeader>
                    {selectedApproval && (
                        <div className="space-y-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-gray-500">Delegation ID</Label>
                                    <p className="font-medium">{selectedApproval.delegationID}</p>
                                </div>
                                <div>
                                    <Label className="text-gray-500">Timestamp</Label>
                                    <p className="font-medium">
                                        {new Date(selectedApproval.timestamp).toLocaleString()}
                                    </p>
                                </div>
                                <div>
                                    <Label className="text-gray-500">Delegator</Label>
                                    <p className="font-medium">
                                        {employees.find(
                                            emp => emp.uid === selectedApproval.delegator,
                                        )
                                            ? getFullName(
                                                  employees.find(
                                                      emp => emp.uid === selectedApproval.delegator,
                                                  )!,
                                            )
                                            : selectedApproval.delegator}
                                    </p>
                                    <p className="text-sm text-gray-500">
                                        {employees.find(
                                            emp => emp.uid === selectedApproval.delegator,
                                        )?.employeeID ?? ""}
                                    </p>
                                </div>
                                <div>
                                    <Label className="text-gray-500">Delegatee</Label>
                                    <p className="font-medium">
                                        {employees.find(
                                            emp => emp.uid === selectedApproval.delegatee,
                                        )
                                            ? getFullName(
                                                  employees.find(
                                                      emp => emp.uid === selectedApproval.delegatee,
                                                  )!,
                                            )
                                            : selectedApproval.delegatee}
                                    </p>
                                    <p className="text-sm text-gray-500">
                                        {employees.find(
                                            emp => emp.uid === selectedApproval.delegatee,
                                        )?.employeeID ?? ""}
                                    </p>
                                </div>
                                <div>
                                    <Label className="text-gray-500">Status</Label>
                                    <div className="mt-1">
                                        {selectedApproval.delegationStatus === "Pending" && (
                                            <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                                                Pending
                                            </Badge>
                                        )}
                                        {selectedApproval.delegationStatus === "Approved" && (
                                            <Badge className="bg-green-100 text-green-800 border-green-200">
                                                Approved
                                            </Badge>
                                        )}
                                        {selectedApproval.delegationStatus === "Cancelled" && (
                                            <Badge className="bg-red-100 text-red-800 border-red-200">
                                                Cancelled
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <Label className="text-gray-500">Period</Label>
                                    <p className="font-medium">
                                        {selectedApproval.periodStart} to{" "}
                                        {selectedApproval.periodEnd}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowViewModal(false)}>
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Approve Confirmation Modal */}
            <Dialog open={showApproveModal} onOpenChange={setShowApproveModal}>
                <DialogContent className="max-w-md bg-white dark:bg-gray-900">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-semibold text-green-800 dark:text-green-400">
                            Approve Delegation
                        </DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <p className="text-gray-600 dark:text-gray-400">
                            Are you sure you want to approve this delegation request?
                        </p>
                        {selectedApproval && (
                            <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                <p className="font-medium">{selectedApproval.delegationID}</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {employees.find(emp => emp.uid === selectedApproval.delegator)
                                        ? getFullName(
                                              employees.find(
                                                  emp => emp.uid === selectedApproval.delegator,
                                              )!,
                                        )
                                        : selectedApproval.delegator}{" "}
                                    →{" "}
                                    {employees.find(emp => emp.uid === selectedApproval.delegatee)
                                        ? getFullName(
                                              employees.find(
                                                  emp => emp.uid === selectedApproval.delegatee,
                                              )!,
                                        )
                                        : selectedApproval.delegatee}
                                </p>
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowApproveModal(false)}>
                            Cancel
                        </Button>
                        <Button
                            className="bg-green-600 hover:bg-green-700 text-white"
                            onClick={confirmApprove}
                            disabled={isApproving}
                        >
                            {isApproving ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Approving...
                                </>
                            ) : (
                                <>
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Approve
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Reject Confirmation Modal */}
            <Dialog open={showRejectModal} onOpenChange={setShowRejectModal}>
                <DialogContent className="max-w-md bg-white dark:bg-gray-900">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-semibold text-red-800 dark:text-red-400">
                            Reject Delegation
                        </DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <p className="text-gray-600 dark:text-gray-400">
                            Are you sure you want to reject this delegation request?
                        </p>
                        {selectedApproval && (
                            <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                <p className="font-medium">{selectedApproval.delegationID}</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {employees.find(emp => emp.uid === selectedApproval.delegator)
                                        ? getFullName(
                                              employees.find(
                                                  emp => emp.uid === selectedApproval.delegator,
                                              )!,
                                        )
                                        : selectedApproval.delegator}{" "}
                                    →{" "}
                                    {employees.find(emp => emp.uid === selectedApproval.delegatee)
                                        ? getFullName(
                                              employees.find(
                                                  emp => emp.uid === selectedApproval.delegatee,
                                              )!,
                                        )
                                        : selectedApproval.delegatee}
                                </p>
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowRejectModal(false)}>
                            Cancel
                        </Button>
                        <Button
                            className="bg-red-600 hover:bg-red-700 text-white"
                            onClick={confirmReject}
                            disabled={isRejecting}
                        >
                            {isRejecting ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Rejecting...
                                </>
                            ) : (
                                <>
                                    <XCircle className="h-4 w-4 mr-2" />
                                    Reject
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
