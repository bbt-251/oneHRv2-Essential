"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/authContext";
import { useFirestore } from "@/context/firestore-context";
import { useToast } from "@/context/toastContext";
import { promotionService } from "@/lib/backend/firebase/promotionService";
import {
    DEPARTMENTS,
    EvaluationCycleOption,
    PeriodOption,
    PromotionInstanceModel,
    STATUS_STYLES,
} from "@/lib/models/promotion-instance";
import {
    ArrowRight,
    Check,
    FileText,
    Filter,
    MoreHorizontal,
    Pencil,
    Plus,
    Search,
    Trash2,
    X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { CreatePromotionDialog } from "./CreatePromotionDialog";
import { DeletePromotionDialog } from "./DeletePromotionDialog";
import { ViewPromotionDialog } from "./ViewPromotionDialog";
import { EditPromotionDialog } from "./EditPromotionDialog";
import { PromotionLetterDialog } from "./PromotionLetterDialog";

// For backward compatibility
type PromotionInstance = PromotionInstanceModel;

// Export for use in other components
export type { PromotionInstance };

export function PromotionsPage() {
    const { hrSettings, promotionInstances } = useFirestore();
    const { showToast } = useToast();
    const { userData } = useAuth();

    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

    // Table search and filter state
    const [tableSearch, setTableSearch] = useState("");
    const [periodFilter, setPeriodFilter] = useState<string>("all");
    const [evaluationCycleFilter, setEvaluationCycleFilter] = useState<string>("all");
    const [departmentFilter, setDepartmentFilter] = useState<string>("all");

    // Details modal state
    const [selectedPromotion, setSelectedPromotion] = useState<
        (PromotionInstanceModel & { id: string }) | null
            >(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);

    // Edit modal state
    const [editPromotion, setEditPromotion] = useState<
        (PromotionInstanceModel & { id: string }) | null
            >(null);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

    // Delete confirmation state
    const [deletePromotion, setDeletePromotion] = useState<
        (PromotionInstanceModel & { id: string }) | null
            >(null);

    // Action modal states
    const [isActionModalOpen, setIsActionModalOpen] = useState(false);
    const [actionType, setActionType] = useState<"approve" | "reject" | "finalize" | "edit" | null>(
        null,
    );
    const [actionComment, setActionComment] = useState("");
    const [actionError, setActionError] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);
    const [selectedActionPromotion, setSelectedActionPromotion] = useState<
        (PromotionInstanceModel & { id: string }) | null
            >(null);

    // Promotion Letter modal state
    const [isLetterModalOpen, setIsLetterModalOpen] = useState(false);
    const [letterPromotion, setLetterPromotion] = useState<
        (PromotionInstanceModel & { id: string }) | null
            >(null);

    // Convert periodicOptions to PeriodOption format
    const periodOptions: PeriodOption[] = useMemo(() => {
        return hrSettings.periodicOptions.map(option => ({
            id: option.id || "",
            label: `${option.periodName} ${option.year}`,
        }));
    }, [hrSettings.periodicOptions]);

    // Convert evaluationCampaigns to EvaluationCycleOption format
    const evaluationCycleOptions: EvaluationCycleOption[] = useMemo(() => {
        return hrSettings.evaluationCampaigns.map(campaign => ({
            id: campaign.id || "",
            label: campaign.campaignName,
        }));
    }, [hrSettings.evaluationCampaigns]);

    // Filter promotions based on search and filters
    const filteredPromotions = useMemo(() => {
        return promotionInstances
            .map(p => ({ ...p, id: p.id || "" }))
            .filter(promo => {
                const matchesSearch =
                    promo.employeeName.toLowerCase().includes(tableSearch.toLowerCase()) ||
                    promo.department.toLowerCase().includes(tableSearch.toLowerCase()) ||
                    promo.promotionName.toLowerCase().includes(tableSearch.toLowerCase());
                const matchesPeriod = periodFilter === "all" || promo.period.includes(periodFilter);
                const matchesCycle =
                    evaluationCycleFilter === "all" ||
                    promo.evaluationCycle.includes(evaluationCycleFilter);
                const matchesDepartment =
                    departmentFilter === "all" || promo.department === departmentFilter;
                return matchesSearch && matchesPeriod && matchesCycle && matchesDepartment;
            });
    }, [promotionInstances, tableSearch, periodFilter, evaluationCycleFilter, departmentFilter]);

    const handleViewDetails = (promotion: PromotionInstanceModel & { id: string }) => {
        setSelectedPromotion(promotion);
        setIsDetailsOpen(true);
    };

    const handleOpenEditDialog = (promotion: PromotionInstanceModel & { id: string }) => {
        setEditPromotion(promotion);
        setIsEditDialogOpen(true);
    };

    const handleDeletePromotion = (promotion: PromotionInstanceModel & { id: string }) => {
        setDeletePromotion(promotion);
    };

    const confirmDelete = async () => {
        if (deletePromotion) {
            try {
                await promotionService.delete(deletePromotion.id);
                showToast(
                    `Successfully deleted promotion for ${deletePromotion.employeeName}`,
                    "Success",
                    "success",
                );
            } catch (error) {
                console.error("Error deleting promotion:", error);
                showToast("Failed to delete promotion", "Error", "error");
            } finally {
                setDeletePromotion(null);
            }
        }
    };

    const handleStatusChange = () => {
        // No need to manually reload - data comes from context
    };

    const openActionModal = (
        promotion: PromotionInstanceModel & { id: string },
        action: "approve" | "reject" | "finalize" | "edit",
    ) => {
        setSelectedActionPromotion(promotion);
        setActionType(action);
        setActionComment("");
        setActionError("");
        setIsActionModalOpen(true);
    };

    const handleAction = async () => {
        if (!selectedActionPromotion || !actionType) return;

        // Validate comment for reject action
        if (actionType === "reject" && !actionComment.trim()) {
            setActionError("Please provide a reason for rejecting the promotion");
            return;
        }

        setIsProcessing(true);
        try {
            let success = false;

            switch (actionType) {
                case "approve":
                    success = await promotionService.approvePromotion(
                        selectedActionPromotion.id,
                        userData?.uid || "unknown",
                        userData?.firstName && userData?.surname
                            ? `${userData.firstName} ${userData.surname}`
                            : "HR",
                    );
                    break;
                case "reject":
                    success = await promotionService.rejectPromotion(
                        selectedActionPromotion.id,
                        userData?.uid || "unknown",
                        userData?.firstName && userData?.surname
                            ? `${userData.firstName} ${userData.surname}`
                            : "HR",
                        actionComment,
                    );
                    break;
                case "finalize":
                    success = await promotionService.finalizePromotion(
                        selectedActionPromotion.id,
                        userData?.uid || "unknown",
                        userData?.firstName && userData?.surname
                            ? `${userData.firstName} ${userData.surname}`
                            : "HR",
                    );
                    break;
                case "edit":
                    // Open the EditPromotionDialog
                    setIsActionModalOpen(false);
                    handleOpenEditDialog(selectedActionPromotion);
                    return;
            }

            if (success) {
                showToast(
                    `Promotion ${actionType === "finalize" ? "finalized" : actionType + "d"} successfully`,
                    "Success",
                    "success",
                );
                setIsActionModalOpen(false);
                setSelectedActionPromotion(null);
                setActionType(null);
                setActionComment("");
            } else {
                showToast(
                    `Failed to ${actionType === "finalize" ? "finalize" : actionType} promotion`,
                    "Error",
                    "error",
                );
            }
        } catch (error) {
            console.error(`Error ${actionType}ing promotion:`, error);
            showToast("An error occurred", "Error", "error");
        } finally {
            setIsProcessing(false);
        }
    };

    const openLetterModal = (promotion: PromotionInstanceModel & { id: string }) => {
        setLetterPromotion(promotion);
        setIsLetterModalOpen(true);
    };

    const handlePrintLetter = () => {
        if (letterPromotion) {
            // Open print dialog
            window.print();
        }
    };

    const renderActionButtons = (promotion: PromotionInstanceModel & { id: string }) => {
        // For approved and completed statuses, always show Promotion Letter button below Edit
        const showLetterButton =
            promotion.status === "approved" || promotion.status === "completed";

        switch (promotion.status) {
            case "pending":
                // Employee hasn't responded yet - allow edit and delete only
                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Open menu</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleOpenEditDialog(promotion)}>
                                <Pencil className="h-4 w-4 mr-2" />
                                Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openLetterModal(promotion)}>
                                <FileText className="h-4 w-4 mr-2" />
                                Promotion Letter
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => handleDeletePromotion(promotion)}
                                className="text-destructive focus:text-destructive"
                            >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                );
            case "accepted":
                // Employee accepted - show Approve and Reject buttons
                return (
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 border-red-300 hover:bg-red-50"
                            onClick={() => openActionModal(promotion, "reject")}
                        >
                            <X className="h-4 w-4 mr-1" />
                            Reject
                        </Button>
                        <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white"
                            onClick={() => openActionModal(promotion, "approve")}
                        >
                            <Check className="h-4 w-4 mr-1" />
                            Approve
                        </Button>
                    </div>
                );
            case "approved":
                // HR approved - show in dropdown with Finalize
                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Open menu</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openLetterModal(promotion)}>
                                <FileText className="h-4 w-4 mr-2" />
                                Promotion Letter
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => openActionModal(promotion, "finalize")}
                            >
                                <ArrowRight className="h-4 w-4 mr-2" />
                                Finalize
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                );
            case "completed":
                // Finalized - show in dropdown
                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Open menu</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openLetterModal(promotion)}>
                                <FileText className="h-4 w-4 mr-2" />
                                Promotion Letter
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                );
            case "refused":
                // Employee refused - allow edit to reopen
                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Open menu</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleOpenEditDialog(promotion)}>
                                <Pencil className="h-4 w-4 mr-2" />
                                Edit & Reopen
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => handleDeletePromotion(promotion)}
                                className="text-destructive focus:text-destructive"
                            >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                );
            case "rejected":
                // HR rejected - allow edit to reopen
                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Open menu</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleOpenEditDialog(promotion)}>
                                <Pencil className="h-4 w-4 mr-2" />
                                Edit & Reopen
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => handleDeletePromotion(promotion)}
                                className="text-destructive focus:text-destructive"
                            >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                );
            default:
                return null;
        }
    };

    const clearFilters = () => {
        setTableSearch("");
        setPeriodFilter("all");
        setEvaluationCycleFilter("all");
        setDepartmentFilter("all");
    };

    const hasActiveFilters =
        tableSearch ||
        periodFilter !== "all" ||
        evaluationCycleFilter !== "all" ||
        departmentFilter !== "all";

    // Check if data is still loading
    const isLoading = !promotionInstances;

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-brand-800 dark:text-foreground">
                        Promotion Management
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Manage employee promotions, track status, and generate promotion letters
                    </p>
                </div>
            </div>

            {/* Search and Filter Bar */}
            <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by employee, department, or promotion name..."
                            value={tableSearch}
                            onChange={e => setTableSearch(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                    <Button
                        className="bg-brand-600 hover:bg-brand-700 text-white"
                        onClick={() => setIsCreateDialogOpen(true)}
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Create a promotion instance
                    </Button>
                </div>

                {/* Filter Bar */}
                <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Filter className="h-4 w-4" />
                        <span>Filters:</span>
                    </div>
                    <Select value={periodFilter} onValueChange={setPeriodFilter}>
                        <SelectTrigger className="w-[150px] h-9">
                            <SelectValue placeholder="Period" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Periods</SelectItem>
                            {periodOptions.map(period => (
                                <SelectItem key={period.id} value={period.label}>
                                    {period.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select value={evaluationCycleFilter} onValueChange={setEvaluationCycleFilter}>
                        <SelectTrigger className="w-[200px] h-9">
                            <SelectValue placeholder="Evaluation Cycle" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Cycles</SelectItem>
                            {evaluationCycleOptions.map(cycle => (
                                <SelectItem key={cycle.id} value={cycle.label}>
                                    {cycle.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                        <SelectTrigger className="w-[160px] h-9">
                            <SelectValue placeholder="Department" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Departments</SelectItem>
                            {DEPARTMENTS.map(dept => (
                                <SelectItem key={dept} value={dept}>
                                    {dept}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {hasActiveFilters && (
                        <Button variant="ghost" size="sm" onClick={clearFilters} className="h-9">
                            <X className="h-4 w-4 mr-1" />
                            Clear filters
                        </Button>
                    )}
                </div>

                <p className="text-sm text-brand-500 dark:text-muted-foreground">
                    {filteredPromotions.length} promotion instance
                    {filteredPromotions.length !== 1 ? "s" : ""} found
                </p>
            </div>

            {/* Table */}
            <div className="rounded-lg border border-accent-200 bg-white dark:bg-card dark:border-border overflow-hidden overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-accent-50 dark:bg-muted/50">
                            <TableHead className="font-semibold text-brand-700 dark:text-foreground">
                                ID
                            </TableHead>
                            <TableHead className="font-semibold text-brand-700 dark:text-foreground">
                                Promotion Name
                            </TableHead>
                            <TableHead className="font-semibold text-brand-700 dark:text-foreground">
                                Timestamp
                            </TableHead>
                            <TableHead className="font-semibold text-brand-700 dark:text-foreground">
                                Period
                            </TableHead>
                            <TableHead className="font-semibold text-brand-700 dark:text-foreground">
                                Evaluation Cycle
                            </TableHead>
                            <TableHead className="font-semibold text-brand-700 dark:text-foreground">
                                Employee
                            </TableHead>
                            <TableHead className="font-semibold text-brand-700 dark:text-foreground">
                                Position Change
                            </TableHead>
                            <TableHead className="font-semibold text-brand-700 dark:text-foreground">
                                Salary Change
                            </TableHead>
                            <TableHead className="font-semibold text-brand-700 dark:text-foreground">
                                Status
                            </TableHead>
                            <TableHead className="font-semibold text-brand-700 dark:text-foreground w-[50px]">
                                Actions
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredPromotions.length > 0 ? (
                            filteredPromotions.map(promotion => (
                                <TableRow
                                    key={promotion.id}
                                    className="hover:bg-accent-50 dark:hover:bg-muted/50 cursor-pointer"
                                    onClick={() => handleViewDetails(promotion)}
                                >
                                    <TableCell className="font-medium text-brand-800 dark:text-foreground">
                                        {promotion.promotionID}
                                    </TableCell>
                                    <TableCell className="text-brand-700 dark:text-foreground font-medium">
                                        {promotion.promotionName}
                                    </TableCell>
                                    <TableCell className="text-brand-600 dark:text-muted-foreground text-sm">
                                        {new Date(promotion.timestamp).toLocaleDateString("en-US", {
                                            year: "numeric",
                                            month: "short",
                                            day: "numeric",
                                        })}
                                    </TableCell>
                                    <TableCell className="text-brand-600 dark:text-muted-foreground">
                                        <Badge variant="outline">{promotion.period}</Badge>
                                    </TableCell>
                                    <TableCell className="text-brand-600 dark:text-muted-foreground text-sm">
                                        {promotion.evaluationCycle}
                                    </TableCell>
                                    <TableCell className="text-brand-700 dark:text-foreground">
                                        <div>{promotion.employeeName}</div>
                                    </TableCell>
                                    <TableCell className="text-brand-600 dark:text-muted-foreground">
                                        <div className="text-xs">
                                            <span className="text-muted-foreground">
                                                {promotion.currentPosition}
                                            </span>
                                            <span className="mx-1">→</span>
                                            <span className="font-medium text-foreground">
                                                {promotion.newPosition}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-brand-600 dark:text-muted-foreground">
                                        <div className="text-xs">
                                            <span className="text-muted-foreground">
                                                ${promotion.currentSalary.toLocaleString()}
                                            </span>
                                            <span className="mx-1">→</span>
                                            <span className="font-medium text-foreground">
                                                ${promotion.newSalary.toLocaleString()}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant="outline"
                                            className={STATUS_STYLES[promotion.status]}
                                        >
                                            {promotion.status.charAt(0).toUpperCase() +
                                                promotion.status.slice(1)}
                                        </Badge>
                                    </TableCell>
                                    <TableCell onClick={e => e.stopPropagation()}>
                                        {renderActionButtons(promotion)}
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell
                                    colSpan={10}
                                    className="h-24 text-center text-muted-foreground"
                                >
                                    No promotion instances found matching your criteria.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Create Dialog */}
            <CreatePromotionDialog
                isOpen={isCreateDialogOpen}
                onClose={() => {
                    setIsCreateDialogOpen(false);
                }}
            />

            {/* View/Edit Dialog */}
            <ViewPromotionDialog
                isOpen={isDetailsOpen}
                onClose={() => setIsDetailsOpen(false)}
                promotion={selectedPromotion}
                onStatusChange={handleStatusChange}
            />

            {/* Edit Promotion Dialog */}
            <EditPromotionDialog
                isOpen={isEditDialogOpen}
                onClose={() => {
                    setIsEditDialogOpen(false);
                    setEditPromotion(null);
                }}
                promotion={editPromotion}
                hrUID={userData?.uid || ""}
                hrName={
                    userData?.firstName && userData?.surname
                        ? `${userData.firstName} ${userData.surname}`
                        : "HR"
                }
            />

            {/* Delete Confirmation Dialog */}
            <DeletePromotionDialog
                isOpen={!!deletePromotion}
                onClose={() => setDeletePromotion(null)}
                onConfirm={confirmDelete}
                promotion={deletePromotion}
            />

            {/* Action Modal (Approve/Reject/Finalize) */}
            <Dialog open={isActionModalOpen} onOpenChange={setIsActionModalOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>
                            {actionType === "approve" && "Approve Promotion"}
                            {actionType === "reject" && "Reject Promotion"}
                            {actionType === "finalize" && "Finalize Promotion"}
                        </DialogTitle>
                        <DialogDescription>
                            {actionType === "approve" &&
                                "This will approve the promotion. The employee will be notified."}
                            {actionType === "reject" &&
                                "Please provide a reason for rejecting this promotion."}
                            {actionType === "finalize" &&
                                "This will update the employee's position, grade, step, salary, and leave entitlement. This action cannot be undone."}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        {actionType === "reject" && (
                            <div className="space-y-2">
                                <Label htmlFor="reject-comment">
                                    Reason for Rejection <span className="text-red-500">*</span>
                                </Label>
                                <Textarea
                                    id="reject-comment"
                                    placeholder="Enter reason for rejecting..."
                                    value={actionComment}
                                    onChange={e => {
                                        setActionComment(e.target.value);
                                        if (e.target.value.trim()) {
                                            setActionError("");
                                        }
                                    }}
                                    className={actionError ? "border-red-500" : ""}
                                    rows={4}
                                />
                                {actionError && (
                                    <p className="text-sm text-red-500">{actionError}</p>
                                )}
                            </div>
                        )}

                        {selectedActionPromotion && (
                            <div className="p-4 rounded-lg bg-muted/50 border">
                                <div className="text-sm text-muted-foreground mb-1">
                                    Promotion Details
                                </div>
                                <div className="font-medium">
                                    {selectedActionPromotion.promotionName}
                                </div>
                                <div className="text-sm">
                                    {selectedActionPromotion.employeeName} -{" "}
                                    {selectedActionPromotion.currentPosition} →{" "}
                                    {selectedActionPromotion.newPosition}
                                </div>
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsActionModalOpen(false)}
                            disabled={isProcessing}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleAction}
                            disabled={
                                isProcessing || (actionType === "reject" && !actionComment.trim())
                            }
                            variant={actionType === "reject" ? "destructive" : "default"}
                            className={
                                actionType === "approve"
                                    ? "bg-green-600 hover:bg-green-700"
                                    : actionType === "finalize"
                                        ? "bg-brand-600 hover:bg-brand-700"
                                        : ""
                            }
                        >
                            {isProcessing ? (
                                "Processing..."
                            ) : (
                                <>
                                    {actionType === "approve" && "Approve"}
                                    {actionType === "reject" && "Reject"}
                                    {actionType === "finalize" && "Finalize"}
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Promotion Letter Dialog */}
            <PromotionLetterDialog
                isOpen={isLetterModalOpen}
                onClose={() => setIsLetterModalOpen(false)}
                promotion={letterPromotion}
            />
        </div>
    );
}
