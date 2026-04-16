"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
    Search,
    Plus,
    Eye,
    Edit,
    Trash2,
    MoreVertical,
    Check,
    ChevronsUpDown,
    Filter,
    X,
    Loader2,
    CheckCircle,
} from "lucide-react";
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
import { cn } from "@/lib/utils";
import { DelegationModel, ExtendedDelegationModel } from "@/lib/models/delegation";
import { useFirestore } from "@/context/firestore-context";
import { useToast } from "@/context/toastContext";
import {
    createDelegation,
    createAndApproveDelegation,
    updateDelegation,
    deleteDelegation,
    approveDelegation,
} from "@/lib/backend/api/delegation/delegation-service";
import getFullName from "@/lib/util/getEmployeeFullName";
import { useAuth } from "@/context/authContext";
import { EmployeeModel } from "@/lib/models/employee";

export default function HRDelegationManagement() {
    const { userData } = useAuth();
    const { employees, delegations: firestoreDelegations, hrSettings } = useFirestore();
    const { showToast } = useToast();

    const [delegations, setDelegations] = useState<ExtendedDelegationModel[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [showFilterModal, setShowFilterModal] = useState(false);
    const [showApproveModal, setShowApproveModal] = useState(false);
    const [selectedDelegation, setSelectedDelegation] = useState<ExtendedDelegationModel | null>(
        null,
    );
    const [editingDelegation, setEditingDelegation] = useState<ExtendedDelegationModel | null>(
        null,
    );
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isApproving, setIsApproving] = useState(false);

    const [filterDelegatees, setFilterDelegatees] = useState<string[]>([]);
    const [filterStatuses, setFilterStatuses] = useState<string[]>([]);
    const [filterPeriodStart, setFilterPeriodStart] = useState("");
    const [filterPeriodEnd, setFilterPeriodEnd] = useState("");
    const [delegateeOpen, setDelegateeOpen] = useState(false);
    const [statusOpen, setStatusOpen] = useState(false);

    const [delegatorOpen, setDelegatorOpen] = useState(false);
    const [formDelegateeOpen, setFormDelegateeOpen] = useState(false);
    const [autoApprove, setAutoApprove] = useState(false);

    const [formData, setFormData] = useState({
        timestamp: new Date().toLocaleString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
        }),
        delegationID: `f0a3-${Math.random().toString(36).substring(2, 6)}`,
        delegator: "",
        delegatee: "",
        delegationStatus: "Created",
        periodStart: "",
        periodEnd: "",
    });

    // Extend delegations with employee names
    useEffect(() => {
        const extended = firestoreDelegations.map(d => {
            const delegator = employees.find(e => e.uid === d.delegator);
            const delegatee = employees.find(e => e.uid === d.delegatee);
            const acknowledgedBy = d.acknowledgedBy
                ? employees.find(e => e.uid === d.acknowledgedBy)
                : null;
            const approvedBy = d.approvedBy ? employees.find(e => e.uid === d.approvedBy) : null;

            return {
                ...d,
                delegatorName: delegator ? getFullName(delegator) : d.delegator,
                delegateeName: delegatee ? getFullName(delegatee) : d.delegatee,
                acknowledgedByName: acknowledgedBy ? getFullName(acknowledgedBy) : null,
                approvedByName: approvedBy ? getFullName(approvedBy) : null,
            };
        });
        setDelegations(extended);
    }, [firestoreDelegations, employees]);

    const filteredDelegations = delegations.filter(delegation => {
        const matchesSearch =
            delegation.delegationID.toLowerCase().includes(searchTerm.toLowerCase()) ||
            delegation.delegatorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            delegation.delegateeName.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesDelegatee =
            filterDelegatees.length === 0 || filterDelegatees.includes(delegation.delegatee);
        const matchesStatus =
            filterStatuses.length === 0 || filterStatuses.includes(delegation.delegationStatus);

        const matchesPeriodStart =
            !filterPeriodStart || delegation.periodStart >= filterPeriodStart;
        const matchesPeriodEnd = !filterPeriodEnd || delegation.periodEnd <= filterPeriodEnd;

        return (
            matchesSearch &&
            matchesDelegatee &&
            matchesStatus &&
            matchesPeriodStart &&
            matchesPeriodEnd
        );
    });

    const getStatusColor = (status: string) => {
        switch (status) {
            case "Approved":
                return "bg-green-100 text-green-800 border-green-200";
            case "Created":
                return "bg-gray-100 text-gray-800 border-gray-200";
            case "Acknowledged":
                return "bg-blue-100 text-blue-800 border-blue-200";
            case "Refused":
                return "bg-red-100 text-red-800 border-red-200";
            default:
                return "bg-gray-100 text-gray-800 border-gray-200";
        }
    };

    const handleView = (delegation: ExtendedDelegationModel) => {
        setSelectedDelegation(delegation);
        setShowViewModal(true);
    };

    const handleEdit = (delegation: ExtendedDelegationModel) => {
        setEditingDelegation(delegation);
        setFormData({
            timestamp: delegation.timestamp,
            delegationID: delegation.delegationID,
            delegator: delegation.delegator,
            delegatee: delegation.delegatee,
            delegationStatus: delegation.delegationStatus,
            periodStart: delegation.periodStart,
            periodEnd: delegation.periodEnd,
        });
        setShowCreateModal(true);
    };

    const handleDelete = async (delegation: ExtendedDelegationModel) => {
        setSelectedDelegation(delegation);
        setShowDeleteDialog(true);
    };

    const confirmDelete = async () => {
        if (selectedDelegation) {
            try {
                const success = await deleteDelegation(selectedDelegation.id, userData?.uid);
                if (success) {
                    showToast("Delegation deleted successfully", "Success", "success");
                } else {
                    showToast("Failed to delete delegation", "Error", "error");
                }
            } catch (error) {
                showToast("An unexpected error occurred", "Error", "error");
            }
            setShowDeleteDialog(false);
            setSelectedDelegation(null);
        }
    };

    const handleApprove = (delegation: ExtendedDelegationModel) => {
        setSelectedDelegation(delegation);
        setShowApproveModal(true);
    };

    const confirmApprove = async () => {
        if (!selectedDelegation || !userData?.uid) return;

        setIsApproving(true);
        try {
            const result = await approveDelegation(selectedDelegation.id, userData.uid);
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
            setSelectedDelegation(null);
        }
    };

    const handleCreateDelegation = async () => {
        if (
            !formData.delegator ||
            !formData.delegatee ||
            !formData.periodStart ||
            !formData.periodEnd
        ) {
            showToast("Please fill in all required fields", "Validation Error", "error");
            return;
        }

        setIsSubmitting(true);
        try {
            if (editingDelegation) {
                // Update existing delegation (only period can be updated if already acknowledged/approved)
                if (
                    editingDelegation.delegationStatus === "Approved" ||
                    editingDelegation.delegationStatus === "Acknowledged"
                ) {
                    // Only allow period updates for approved/acknowledged delegations
                    const success = await updateDelegation(
                        {
                            id: editingDelegation.id,
                            periodStart: formData.periodStart,
                            periodEnd: formData.periodEnd,
                        },
                        userData?.uid,
                    );

                    if (success) {
                        showToast("Delegation updated successfully", "Success", "success");
                    } else {
                        showToast("Failed to update delegation", "Error", "error");
                    }
                } else {
                    // Can update more fields if not yet acknowledged
                    const success = await updateDelegation(
                        {
                            id: editingDelegation.id,
                            delegator: formData.delegator,
                            delegatee: formData.delegatee,
                            periodStart: formData.periodStart,
                            periodEnd: formData.periodEnd,
                        },
                        userData?.uid,
                    );

                    if (success) {
                        showToast("Delegation updated successfully", "Success", "success");
                    } else {
                        showToast("Failed to update delegation", "Error", "error");
                    }
                }
            } else {
                // Create new delegation
                if (autoApprove) {
                    // Create and auto-approve as HR
                    const result = await createAndApproveDelegation(
                        {
                            timestamp: new Date().toISOString(),
                            delegationID: `DEL-${Date.now().toString().slice(-6)}`,
                            delegator: formData.delegator,
                            delegatorPosition:
                                employees.find(e => e.uid === formData.delegator)
                                    ?.employmentPosition || null,
                            delegatee: formData.delegatee,
                            delegateePosition:
                                employees.find(e => e.uid === formData.delegatee)
                                    ?.employmentPosition || null,
                            periodStart: formData.periodStart,
                            periodEnd: formData.periodEnd,
                        },
                        userData?.uid || "",
                    );

                    if (result.success) {
                        showToast(
                            "Delegation created and approved successfully",
                            "Success",
                            "success",
                        );
                    } else {
                        showToast(result.error || "Failed to create delegation", "Error", "error");
                    }
                } else {
                    // Create normally (requires acknowledgment then approval)
                    const newDelegationData = {
                        timestamp: new Date().toISOString(),
                        delegationID: `DEL-${Date.now().toString().slice(-6)}`,
                        delegator: formData.delegator,
                        delegatorPosition:
                            employees.find(e => e.uid === formData.delegator)?.employmentPosition ||
                            null,
                        delegatee: formData.delegatee,
                        delegateePosition:
                            employees.find(e => e.uid === formData.delegatee)?.employmentPosition ||
                            null,
                        delegationStatus: "Created" as const,
                        periodStart: formData.periodStart,
                        periodEnd: formData.periodEnd,
                        acknowledgedBy: null,
                        acknowledgedAt: null,
                        approvedBy: null,
                        approvedAt: null,
                    };

                    const result = await createDelegation(newDelegationData, userData?.uid);
                    if (result.success) {
                        showToast("Delegation created successfully", "Success", "success");
                    } else {
                        showToast(result.error || "Failed to create delegation", "Error", "error");
                    }
                }
            }

            setShowCreateModal(false);
            setEditingDelegation(null);
            setAutoApprove(false);
            // Reset form
            setFormData({
                timestamp: new Date().toLocaleString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true,
                }),
                delegationID: `f0a3-${Math.random().toString(36).substring(2, 6)}`,
                delegator: "",
                delegatee: "",
                delegationStatus: "Created",
                periodStart: "",
                periodEnd: "",
            });
        } catch (error) {
            showToast("An unexpected error occurred", "Error", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const clearAllFilters = () => {
        setSearchTerm("");
        setFilterDelegatees([]);
        setFilterStatuses([]);
        setFilterPeriodStart("");
        setFilterPeriodEnd("");
    };

    const hasApprovedFilters =
        searchTerm ||
        filterDelegatees.length > 0 ||
        filterStatuses.length > 0 ||
        filterPeriodStart ||
        filterPeriodEnd;

    // Calculate stats
    const totalDelegations = delegations.length;
    const approvedDelegations = delegations.filter(d => d.delegationStatus === "Approved").length;
    const pendingDelegations = delegations.filter(d => d.delegationStatus === "Created").length;
    const acknowledgedDelegations = delegations.filter(
        d => d.delegationStatus === "Acknowledged",
    ).length;
    const refusedDelegations = delegations.filter(d => d.delegationStatus === "Refused").length;

    const uniqueDelegatees = Array.from(new Set(delegations.map(d => d.delegatee)));
    const uniqueStatuses = ["Created", "Acknowledged", "Approved", "Refused"];

    // Get managers only
    const managers = employees.filter(emp => emp.role.includes("Manager"));

    return (
        <div className="p-8 space-y-6 bg-gray-50 min-h-screen dark:bg-background">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold text-brand-800 dark:text-foreground">
                        Delegation Management
                    </h1>
                    <p className="text-brand-600 mt-2 dark:text-muted-foreground">
                        Manage all delegation instances across the organization
                    </p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <Card className="border-brand-200 bg-gradient-to-br from-brand-50 to-brand-100 dark:from-brand-900/20 dark:to-brand-800/20">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-brand-600 dark:text-brand-400">
                                        Total
                                    </p>
                                    <p className="text-2xl font-bold text-brand-800 dark:text-foreground">
                                        {totalDelegations}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-gray-200 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900/20 dark:to-gray-800/20">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                        Created
                                    </p>
                                    <p className="text-2xl font-bold text-gray-800 dark:text-foreground">
                                        {pendingDelegations}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                                        Acknowledged
                                    </p>
                                    <p className="text-2xl font-bold text-blue-800 dark:text-foreground">
                                        {acknowledgedDelegations}
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
                                    <p className="text-2xl font-bold text-green-800 dark:text-foreground">
                                        {approvedDelegations}
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
                                        Refused
                                    </p>
                                    <p className="text-2xl font-bold text-red-800 dark:text-foreground">
                                        {refusedDelegations}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Search Bar and Filters */}
                <div className="flex gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input
                            placeholder="Search by Delegation ID, Delegator, or Delegatee..."
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
                    {hasApprovedFilters && (
                        <Button
                            variant="outline"
                            onClick={clearAllFilters}
                            className="border-gray-400 dark:border-gray-500 bg-transparent"
                        >
                            <X className="h-4 w-4 mr-2" />
                            Clear All
                        </Button>
                    )}
                    <Button
                        className="bg-brand-600 hover:bg-brand-700 text-white"
                        onClick={() => setShowCreateModal(true)}
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Create Delegation
                    </Button>
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
                                    <TableHead>Period</TableHead>
                                    <TableHead>Acknowledged By</TableHead>
                                    <TableHead>Approved By</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredDelegations.map(delegation => (
                                    <TableRow key={delegation.delegationID}>
                                        <TableCell className="font-medium">
                                            {new Date(delegation.timestamp).toLocaleString()}
                                        </TableCell>
                                        <TableCell>
                                            <span className="font-semibold text-brand-700 dark:text-brand-400">
                                                {delegation.delegationID}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <div>
                                                <div className="font-medium">
                                                    {delegation.delegatorName}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {delegation.delegatorPosition}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div>
                                                <div className="font-medium">
                                                    {delegation.delegateeName}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {delegation.delegateePosition}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                className={getStatusColor(
                                                    delegation.delegationStatus,
                                                )}
                                            >
                                                {delegation.delegationStatus}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-sm">
                                                <div>{delegation.periodStart}</div>
                                                <div className="text-gray-500">
                                                    to {delegation.periodEnd}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {delegation.acknowledgedByName ? (
                                                <div className="text-sm">
                                                    <div>{delegation.acknowledgedByName}</div>
                                                    <div className="text-gray-500">
                                                        {delegation.acknowledgedAt
                                                            ? new Date(
                                                                delegation.acknowledgedAt,
                                                            ).toLocaleDateString()
                                                            : ""}
                                                    </div>
                                                </div>
                                            ) : (
                                                <span className="text-gray-400">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {delegation.approvedByName ? (
                                                <div className="text-sm">
                                                    <div>{delegation.approvedByName}</div>
                                                    <div className="text-gray-500">
                                                        {delegation.approvedAt
                                                            ? new Date(
                                                                delegation.approvedAt,
                                                            ).toLocaleDateString()
                                                            : ""}
                                                    </div>
                                                </div>
                                            ) : (
                                                <span className="text-gray-400">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu
                                                key={`dropdown-${delegation.delegationID}`}
                                            >
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
                                                        onClick={() => handleView(delegation)}
                                                        className="focus:outline-none hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
                                                    >
                                                        <Eye className="h-4 w-4 mr-2" />
                                                        View Details
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => handleEdit(delegation)}
                                                        className="focus:outline-none hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
                                                    >
                                                        <Edit className="h-4 w-4 mr-2" />
                                                        Edit
                                                    </DropdownMenuItem>
                                                    {delegation.delegationStatus ===
                                                        "Acknowledged" && (
                                                        <DropdownMenuItem
                                                            onClick={() =>
                                                                handleApprove(delegation)
                                                            }
                                                            className="focus:outline-none hover:bg-green-50 dark:hover:bg-green-900/20 cursor-pointer text-green-600"
                                                        >
                                                            <CheckCircle className="h-4 w-4 mr-2" />
                                                            Approve
                                                        </DropdownMenuItem>
                                                    )}
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem
                                                        onClick={() => handleDelete(delegation)}
                                                        className="text-red-600 focus:outline-none hover:bg-red-50 dark:hover:bg-red-900/20 cursor-pointer"
                                                    >
                                                        <Trash2 className="h-4 w-4 mr-2" />
                                                        Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>

            {/* Create/Edit Delegation Modal */}
            <Dialog
                open={showCreateModal}
                onOpenChange={open => {
                    setShowCreateModal(open);
                    if (!open) {
                        setEditingDelegation(null);
                        setAutoApprove(false);
                        setFormData({
                            timestamp: new Date().toLocaleString("en-US", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                                hour12: true,
                            }),
                            delegationID: `f0a3-${Math.random().toString(36).substring(2, 6)}`,
                            delegator: "",
                            delegatee: "",
                            delegationStatus: "Created",
                            periodStart: "",
                            periodEnd: "",
                        });
                    }
                }}
            >
                <DialogContent className="max-w-3xl bg-white dark:bg-gray-900 z-[100]">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-semibold text-gray-900 dark:text-foreground">
                            {editingDelegation
                                ? "Edit Delegation Instance"
                                : "Add Delegation Instance"}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-6 py-4">
                        {/* Timestamp */}
                        <div className="grid grid-cols-[200px_1fr] items-center gap-4">
                            <Label className="text-right">
                                <span className="text-red-500">*</span> Timestamp :
                            </Label>
                            <Input
                                value={formData.timestamp}
                                disabled
                                className="bg-gray-50 dark:bg-gray-800"
                            />
                        </div>

                        {/* Delegation ID */}
                        <div className="grid grid-cols-[200px_1fr] items-center gap-4">
                            <Label className="text-right">
                                <span className="text-red-500">*</span> Delegation ID :
                            </Label>
                            <Input
                                value={formData.delegationID}
                                disabled
                                className="bg-gray-50 dark:bg-gray-800"
                            />
                        </div>

                        {/* Delegator */}
                        <div className="grid grid-cols-[200px_1fr] items-center gap-4">
                            <Label className="text-right">
                                <span className="text-red-500">*</span> Delegator :
                            </Label>
                            <Popover open={delegatorOpen} onOpenChange={setDelegatorOpen}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={delegatorOpen}
                                        disabled={
                                            !!editingDelegation &&
                                            (editingDelegation.delegationStatus ===
                                                "Acknowledged" ||
                                                editingDelegation.delegationStatus === "Approved")
                                        }
                                        className="w-full justify-between border-gray-300 dark:border-gray-600 bg-transparent"
                                    >
                                        {formData.delegator
                                            ? getFullName(
                                                employees.find(
                                                    e => e.uid === formData.delegator,
                                                ) || ({} as EmployeeModel),
                                            )
                                            : "Select delegator..."}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent
                                    className="p-0 bg-white dark:bg-gray-900 z-[300]"
                                    style={{ width: "var(--radix-popover-trigger-width)" }}
                                >
                                    <Command>
                                        <CommandInput placeholder="Search manager..." />
                                        <CommandList>
                                            <CommandEmpty>No manager found.</CommandEmpty>
                                            <CommandGroup>
                                                {managers.map(employee => (
                                                    <CommandItem
                                                        key={employee.uid}
                                                        value={employee.uid}
                                                        onSelect={() => {
                                                            setFormData({
                                                                ...formData,
                                                                delegator: employee.uid,
                                                                delegatee: "",
                                                            });
                                                            setDelegatorOpen(false);
                                                        }}
                                                        className="hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
                                                    >
                                                        <Check
                                                            className={cn(
                                                                "mr-2 h-4 w-4",
                                                                formData.delegator === employee.uid
                                                                    ? "opacity-100"
                                                                    : "opacity-0",
                                                            )}
                                                        />
                                                        <div>
                                                            <div className="font-medium">
                                                                {getFullName(employee)}
                                                            </div>
                                                            <div className="text-sm text-gray-500">
                                                                {employee.employmentPosition}
                                                            </div>
                                                        </div>
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>

                        {/* Delegatee */}
                        <div className="grid grid-cols-[200px_1fr] items-center gap-4">
                            <Label className="text-right">
                                <span className="text-red-500">*</span> Delegatee :
                            </Label>
                            <Popover open={formDelegateeOpen} onOpenChange={setFormDelegateeOpen}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={formDelegateeOpen}
                                        disabled={
                                            !!editingDelegation &&
                                            (editingDelegation.delegationStatus ===
                                                "Acknowledged" ||
                                                editingDelegation.delegationStatus === "Approved")
                                        }
                                        className="w-full justify-between border-gray-300 dark:border-gray-600 bg-transparent"
                                    >
                                        {formData.delegatee
                                            ? getFullName(
                                                employees.find(
                                                    e => e.uid === formData.delegatee,
                                                ) || ({} as EmployeeModel),
                                            )
                                            : "Select delegatee..."}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent
                                    className="p-0 bg-white dark:bg-gray-900 z-[300]"
                                    style={{ width: "var(--radix-popover-trigger-width)" }}
                                >
                                    <Command>
                                        <CommandInput placeholder="Search manager..." />
                                        <CommandList>
                                            <CommandEmpty>No manager found.</CommandEmpty>
                                            <CommandGroup>
                                                {managers
                                                    .filter(emp => emp.uid !== formData.delegator)
                                                    .map(employee => (
                                                        <CommandItem
                                                            key={employee.uid}
                                                            value={employee.uid}
                                                            onSelect={() => {
                                                                setFormData({
                                                                    ...formData,
                                                                    delegatee: employee.uid,
                                                                });
                                                                setFormDelegateeOpen(false);
                                                            }}
                                                            className="hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
                                                        >
                                                            <Check
                                                                className={cn(
                                                                    "mr-2 h-4 w-4",
                                                                    formData.delegatee ===
                                                                        employee.uid
                                                                        ? "opacity-100"
                                                                        : "opacity-0",
                                                                )}
                                                            />
                                                            <div>
                                                                <div className="font-medium">
                                                                    {getFullName(employee)}
                                                                </div>
                                                                <div className="text-sm text-gray-500">
                                                                    {employee.employmentPosition}
                                                                </div>
                                                            </div>
                                                        </CommandItem>
                                                    ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>

                        {/* Period Start */}
                        <div className="grid grid-cols-[200px_1fr] items-center gap-4">
                            <Label className="text-right">
                                <span className="text-red-500">*</span> Period Start :
                            </Label>
                            <div className="relative">
                                <Input
                                    type="date"
                                    value={formData.periodStart}
                                    onChange={e =>
                                        setFormData({ ...formData, periodStart: e.target.value })
                                    }
                                    className="border-gray-300 dark:border-gray-600"
                                />
                            </div>
                        </div>

                        {/* Period End */}
                        <div className="grid grid-cols-[200px_1fr] items-center gap-4">
                            <Label className="text-right">
                                <span className="text-red-500">*</span> Period End :
                            </Label>
                            <div className="relative">
                                <Input
                                    type="date"
                                    value={formData.periodEnd}
                                    onChange={e =>
                                        setFormData({ ...formData, periodEnd: e.target.value })
                                    }
                                    className="border-gray-300 dark:border-gray-600"
                                />
                            </div>
                        </div>

                        {/* Auto Approve Checkbox (only for new delegations) */}
                        {!editingDelegation && (
                            <div className="grid grid-cols-[200px_1fr] items-center gap-4">
                                <Label className="text-right">Auto Approve :</Label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="autoApprove"
                                        checked={autoApprove}
                                        onChange={e => setAutoApprove(e.target.checked)}
                                        className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                                    />
                                    <Label
                                        htmlFor="autoApprove"
                                        className="text-sm text-gray-600 dark:text-gray-400"
                                    >
                                        Create and approve immediately (as HR Manager)
                                    </Label>
                                </div>
                            </div>
                        )}

                        {/* Submit Button */}
                        <div className="flex justify-center pt-4">
                            <Button
                                onClick={handleCreateDelegation}
                                disabled={isSubmitting}
                                className="bg-gray-800 hover:bg-gray-900 text-white px-12 py-2 text-base disabled:opacity-50"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        {editingDelegation ? "Updating..." : "Creating..."}
                                    </>
                                ) : (
                                    "Submit"
                                )}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* View Delegation Modal */}
            <Dialog open={showViewModal} onOpenChange={setShowViewModal}>
                <DialogContent className="max-w-4xl bg-white dark:bg-gray-900 z-[100]">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-semibold text-brand-800 dark:text-foreground">
                            Delegation Details
                        </DialogTitle>
                    </DialogHeader>
                    {selectedDelegation && (
                        <div className="space-y-6 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-sm font-medium text-gray-500">
                                        Timestamp
                                    </Label>
                                    <p className="text-base mt-1">
                                        {new Date(selectedDelegation.timestamp).toLocaleString()}
                                    </p>
                                </div>
                                <div>
                                    <Label className="text-sm font-medium text-gray-500">
                                        Delegation ID
                                    </Label>
                                    <p className="text-base mt-1 font-semibold text-brand-700">
                                        {selectedDelegation.delegationID}
                                    </p>
                                </div>
                                <div>
                                    <Label className="text-sm font-medium text-gray-500">
                                        Delegator
                                    </Label>
                                    <p className="text-base mt-1">
                                        {selectedDelegation.delegatorName}
                                    </p>
                                    <p className="text-sm text-gray-500">
                                        {selectedDelegation.delegatorPosition}
                                    </p>
                                </div>
                                <div>
                                    <Label className="text-sm font-medium text-gray-500">
                                        Delegatee
                                    </Label>
                                    <p className="text-base mt-1">
                                        {selectedDelegation.delegateeName}
                                    </p>
                                    <p className="text-sm text-gray-500">
                                        {selectedDelegation.delegateePosition}
                                    </p>
                                </div>
                                <div>
                                    <Label className="text-sm font-medium text-gray-500">
                                        Status
                                    </Label>
                                    <div className="mt-1">
                                        <Badge
                                            className={getStatusColor(
                                                selectedDelegation.delegationStatus,
                                            )}
                                        >
                                            {selectedDelegation.delegationStatus}
                                        </Badge>
                                    </div>
                                </div>
                                <div>
                                    <Label className="text-sm font-medium text-gray-500">
                                        Period
                                    </Label>
                                    <p className="text-base mt-1">
                                        {selectedDelegation.periodStart} to{" "}
                                        {selectedDelegation.periodEnd}
                                    </p>
                                </div>
                                {selectedDelegation.acknowledgedByName && (
                                    <>
                                        <div>
                                            <Label className="text-sm font-medium text-gray-500">
                                                Acknowledged By
                                            </Label>
                                            <p className="text-base mt-1">
                                                {selectedDelegation.acknowledgedByName}
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                {selectedDelegation.acknowledgedAt
                                                    ? new Date(
                                                        selectedDelegation.acknowledgedAt,
                                                    ).toLocaleString()
                                                    : ""}
                                            </p>
                                        </div>
                                    </>
                                )}
                                {selectedDelegation.approvedByName && (
                                    <>
                                        <div>
                                            <Label className="text-sm font-medium text-gray-500">
                                                Approved By
                                            </Label>
                                            <p className="text-base mt-1">
                                                {selectedDelegation.approvedByName}
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                {selectedDelegation.approvedAt
                                                    ? new Date(
                                                        selectedDelegation.approvedAt,
                                                    ).toLocaleString()
                                                    : ""}
                                            </p>
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Delegator's Reportees Section */}
                            <div className="border-t pt-4">
                                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 block">
                                    Delegator's Reportees (that Delegatee will manage)
                                </Label>
                                {(() => {
                                    const delegator = employees.find(
                                        emp => emp.uid === selectedDelegation.delegator,
                                    );
                                    const reportees = delegator?.reportees || [];
                                    const reporteeEmployees = reportees
                                        .map(reporteeUid =>
                                            employees.find(e => e.uid === reporteeUid),
                                        )
                                        .filter(Boolean);

                                    if (reporteeEmployees.length === 0) {
                                        return (
                                            <p className="text-sm text-gray-500 italic">
                                                No reportees assigned to this delegator
                                            </p>
                                        );
                                    }

                                    return (
                                        <div className="space-y-2 max-h-96 overflow-y-auto">
                                            {reporteeEmployees.map(reportee => (
                                                <div
                                                    key={reportee?.uid}
                                                    className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded"
                                                >
                                                    <div>
                                                        <p className="font-medium text-sm">
                                                            {reportee
                                                                ? getFullName(reportee)
                                                                : "Unknown"}
                                                        </p>
                                                        <p className="text-xs text-gray-500">
                                                            {reportee?.employeeID}
                                                        </p>
                                                    </div>
                                                    <Badge variant="outline" className="text-xs">
                                                        {hrSettings.departmentSettings.find(
                                                            d => d.id === reportee?.department,
                                                        )?.name ?? "-"}
                                                    </Badge>
                                                </div>
                                            ))}
                                        </div>
                                    );
                                })()}
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <DialogContent className="max-w-md bg-white dark:bg-gray-900 z-[100]">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-semibold text-red-600 dark:text-red-400">
                            Confirm Deletion
                        </DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <p className="text-gray-700 dark:text-gray-300">
                            Are you sure you want to delete delegation{" "}
                            <span className="font-semibold">
                                {selectedDelegation?.delegationID}
                            </span>
                            ? This action cannot be undone.
                        </p>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={confirmDelete}>
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Approve Confirmation Modal */}
            <Dialog open={showApproveModal} onOpenChange={setShowApproveModal}>
                <DialogContent className="max-w-md bg-white dark:bg-gray-900 z-[100]">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-semibold text-green-800 dark:text-green-400">
                            Approve Delegation
                        </DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <p className="text-gray-600 dark:text-gray-400">
                            Are you sure you want to approve this delegation? The delegatee will
                            gain authority over the delegator's reportees.
                        </p>
                        {selectedDelegation && (
                            <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                <p className="font-medium">{selectedDelegation.delegationID}</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {selectedDelegation.delegatorName} →{" "}
                                    {selectedDelegation.delegateeName}
                                </p>
                                <p className="text-sm text-gray-500 mt-1">
                                    Period: {selectedDelegation.periodStart} to{" "}
                                    {selectedDelegation.periodEnd}
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

            {/* Filter Modal */}
            <Dialog open={showFilterModal} onOpenChange={setShowFilterModal}>
                <DialogContent className="max-w-2xl bg-white dark:bg-gray-900 z-[200]">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-semibold text-brand-800 dark:text-foreground">
                            Filter Delegations
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-6 py-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Status Filter */}
                            <div>
                                <Label>Status</Label>
                                <Popover open={statusOpen} onOpenChange={setStatusOpen}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            className="w-full justify-between border-gray-300 dark:border-gray-600 bg-transparent"
                                        >
                                            {filterStatuses.length > 0
                                                ? `${filterStatuses.length} selected`
                                                : "Select statuses..."}
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent
                                        className="p-0 bg-white dark:bg-gray-900 z-[300]"
                                        style={{ width: "var(--radix-popover-trigger-width)" }}
                                    >
                                        <Command>
                                            <CommandList>
                                                <CommandGroup>
                                                    {uniqueStatuses.map(status => (
                                                        <CommandItem
                                                            key={status}
                                                            value={status}
                                                            onSelect={() => {
                                                                setFilterStatuses(
                                                                    filterStatuses.includes(status)
                                                                        ? filterStatuses.filter(
                                                                            s => s !== status,
                                                                        )
                                                                        : [
                                                                            ...filterStatuses,
                                                                            status,
                                                                        ],
                                                                );
                                                            }}
                                                            className="hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
                                                        >
                                                            <Check
                                                                className={cn(
                                                                    "mr-2 h-4 w-4",
                                                                    filterStatuses.includes(status)
                                                                        ? "opacity-100"
                                                                        : "opacity-0",
                                                                )}
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

                            {/* Period Start Filter */}
                            <div>
                                <Label>Period Start (From)</Label>
                                <Input
                                    type="date"
                                    value={filterPeriodStart}
                                    onChange={e => setFilterPeriodStart(e.target.value)}
                                    className="border-gray-300 dark:border-gray-600"
                                />
                            </div>

                            {/* Period End Filter */}
                            <div>
                                <Label>Period End (To)</Label>
                                <Input
                                    type="date"
                                    value={filterPeriodEnd}
                                    onChange={e => setFilterPeriodEnd(e.target.value)}
                                    className="border-gray-300 dark:border-gray-600"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-4">
                            <Button variant="outline" onClick={() => setShowFilterModal(false)}>
                                Close
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setFilterDelegatees([]);
                                    setFilterStatuses([]);
                                    setFilterPeriodStart("");
                                    setFilterPeriodEnd("");
                                }}
                            >
                                Clear Filters
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
