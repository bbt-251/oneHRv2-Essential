"use client";

import { useTheme } from "@/components/theme-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/authContext";
import { useFirestore } from "@/context/firestore-context";
import { useToast } from "@/context/toastContext";
import { promotionService } from "@/lib/backend/firebase/promotionService";
import { EmployeeModel } from "@/lib/models/employee";
import {
    PromotionInstanceModel,
    PromotionStatus,
    STATUS_STYLES,
} from "@/lib/models/promotion-instance";
import { getTimestamp } from "@/lib/util/dayjs_format";
import { sendNotification } from "@/lib/util/notification/send-notification";
import { getEmployeeFullName } from "@/lib/util/performance/employee-performance-utils";
import {
    Briefcase,
    Building,
    Calendar,
    Check,
    ChevronDown,
    ChevronRight,
    DollarSign,
    Loader2,
    MoreHorizontal,
    Search,
    TrendingUp,
    X,
    XCircle,
} from "lucide-react";
import { useMemo, useState } from "react";

export function EmployeePromotionOffersPage() {
    const { userData } = useAuth();
    const { promotionInstances, hrSettings, employees } = useFirestore();
    const { theme } = useTheme();
    const { showToast } = useToast();

    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [selectedPromotion, setSelectedPromotion] = useState<PromotionInstanceModel | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    // Refusal modal state
    const [isRefuseModalOpen, setIsRefuseModalOpen] = useState(false);
    const [refuseComment, setRefuseComment] = useState("");
    const [refuseError, setRefuseError] = useState("");

    // Filter promotions for current employee
    const employeePromotions = useMemo(() => {
        if (!userData?.uid) return [];
        return promotionInstances.filter(
            (promo: PromotionInstanceModel) => promo.employeeUID === userData.uid,
        );
    }, [promotionInstances, userData]);

    // Filter by search and status
    const filteredPromotions = useMemo(() => {
        return employeePromotions.filter((promo: PromotionInstanceModel) => {
            const matchesSearch =
                promo.promotionName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                promo.newPosition.toLowerCase().includes(searchQuery.toLowerCase()) ||
                promo.department.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesStatus = statusFilter === "all" || promo.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [employeePromotions, searchQuery, statusFilter]);

    const handleViewDetails = (promotion: PromotionInstanceModel) => {
        setSelectedPromotion(promotion);
        setIsDetailsOpen(true);
    };

    const handleAcceptPromotion = async () => {
        if (!selectedPromotion) return;

        setIsProcessing(true);
        try {
            await promotionService.update(selectedPromotion.id!, {
                status: "accepted" as PromotionStatus,
                comments: [
                    ...(selectedPromotion.comments || []),
                    {
                        id: Date.now().toString(),
                        timestamp: getTimestamp(),
                        by: userData?.uid || "",
                        byName: getEmployeeFullName(userData as EmployeeModel),
                        text: "Promotion accepted by employee",
                    },
                ],
            });
            showToast("Promotion accepted successfully!", "Success", "success");
            setIsDetailsOpen(false);
        } catch (error) {
            console.error("Error accepting promotion:", error);
            showToast("Failed to accept promotion", "Error", "error");
        } finally {
            setIsProcessing(false);
        }
    };

    const openRefuseModal = (promotion: PromotionInstanceModel) => {
        setSelectedPromotion(promotion);
        setRefuseComment("");
        setRefuseError("");
        setIsRefuseModalOpen(true);
    };

    const handleRefusePromotion = async () => {
        if (!selectedPromotion) return;

        // Validate comment is mandatory
        if (!refuseComment.trim()) {
            setRefuseError("Please provide a reason for refusing the promotion");
            return;
        }

        setIsProcessing(true);
        try {
            await promotionService.update(selectedPromotion.id!, {
                status: "refused" as PromotionStatus,
                comments: [
                    ...(selectedPromotion.comments || []),
                    {
                        id: Date.now().toString(),
                        timestamp: getTimestamp(),
                        by: userData?.uid || "",
                        byName: getEmployeeFullName(userData as EmployeeModel),
                        text: `Promotion refused by employee. Reason: ${refuseComment.trim()}`,
                    },
                ],
            });

            // Notify HR about the refusal
            // Get all HR users from employees list
            const hrUsers =
                employees
                    ?.filter(
                        (emp: EmployeeModel) =>
                            emp.role?.includes("HR") || emp.role?.includes("hr"),
                    )
                    .map((emp: EmployeeModel) => ({
                        uid: emp.uid,
                        email: emp.emailAddress1 || "",
                        telegramChatID: emp.telegramChatID || "",
                    })) || [];

            if (hrUsers.length > 0) {
                try {
                    await sendNotification({
                        users: hrUsers,
                        channels: ["inapp"],
                        messageKey: "PROMOTION_REFUSED",
                        payload: {
                            promotionID: selectedPromotion.promotionID,
                            promotionName: selectedPromotion.promotionName,
                            employeeName: selectedPromotion.employeeName,
                            reason: refuseComment.trim(),
                        },
                        title: "Promotion Refused",
                    });
                } catch (notifyError) {
                    console.error("Failed to send notification:", notifyError);
                }
            }

            showToast("Promotion refused. HR has been notified.", "Success", "success");
            setIsRefuseModalOpen(false);
            setIsDetailsOpen(false);
        } catch (error) {
            console.error("Error refusing promotion:", error);
            showToast("Failed to refuse promotion", "Error", "error");
        } finally {
            setIsProcessing(false);
        }
    };

    const hasActiveFilters = searchQuery || statusFilter !== "all";

    const clearFilters = () => {
        setSearchQuery("");
        setStatusFilter("all");
    };

    // Calculate salary increase percentage
    const getSalaryIncrease = (current: number, newSalary: number) => {
        const increase = ((newSalary - current) / current) * 100;
        return increase.toFixed(1);
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
                                My Promotion Offers
                            </h2>
                            <p className="text-slate-500 font-medium mt-1">
                                {filteredPromotions.length} of {employeePromotions.length}{" "}
                                promotions
                                {hasActiveFilters && " (filtered)"}
                            </p>
                        </div>

                        <div className="flex items-center gap-3">
                            {hasActiveFilters && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={clearFilters}
                                    className="rounded-xl bg-transparent text-slate-500 hover:text-slate-700 border-slate-300"
                                >
                                    <X className="w-4 h-4 mr-2" />
                                    Clear Filters
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Search and Filter */}
                    <div className="flex gap-4 mb-6">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Search promotions..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 rounded-lg border border-input bg-background"
                            />
                        </div>
                        <select
                            value={statusFilter}
                            onChange={e => setStatusFilter(e.target.value)}
                            className="px-4 py-2 rounded-lg border border-input bg-background"
                        >
                            <option value="all">All Statuses</option>
                            <option value="pending">Pending</option>
                            <option value="approved">Approved</option>
                            <option value="rejected">Rejected</option>
                            <option value="completed">Completed</option>
                        </select>
                    </div>
                </div>

                {/* Promotions List */}
                <div className="p-8 pt-4">
                    {filteredPromotions.length > 0 ? (
                        <div className="grid gap-4">
                            {filteredPromotions.map((promotion: PromotionInstanceModel) => (
                                <div
                                    key={promotion.id}
                                    className="p-6 rounded-xl border bg-card hover:shadow-lg transition-shadow cursor-pointer"
                                    onClick={() => handleViewDetails(promotion)}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="font-semibold text-lg">
                                                    {promotion.promotionName}
                                                </h3>
                                                <Badge
                                                    variant="outline"
                                                    className={STATUS_STYLES[promotion.status]}
                                                >
                                                    {promotion.status.charAt(0).toUpperCase() +
                                                        promotion.status.slice(1)}
                                                </Badge>
                                            </div>

                                            <div className="flex items-center gap-6 text-sm text-muted-foreground">
                                                <div className="flex items-center gap-1">
                                                    <Calendar className="h-4 w-4" />
                                                    {promotion.timestamp}
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Building className="h-4 w-4" />
                                                    {hrSettings.departmentSettings.find(
                                                        d => d.id === promotion.department,
                                                    )?.name ?? "-"}
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Briefcase className="h-4 w-4" />
                                                    {promotion.currentPosition} →{" "}
                                                    {promotion.newPosition}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="text-right">
                                            <div className="flex items-center gap-1 text-green-600 font-semibold">
                                                <TrendingUp className="h-4 w-4" />+
                                                {getSalaryIncrease(
                                                    promotion.currentSalary,
                                                    promotion.newSalary,
                                                )}
                                                %
                                            </div>
                                            <div className="text-sm text-muted-foreground">
                                                ${promotion.currentSalary.toLocaleString()} → $
                                                {promotion.newSalary.toLocaleString()}
                                            </div>

                                            {/* Action dropdown for pending promotions */}
                                            {promotion.status === "pending" && (
                                                <div
                                                    className="mt-4 pt-4 border-t"
                                                    onClick={e => e.stopPropagation()}
                                                >
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="outline" size="sm">
                                                                <MoreHorizontal className="h-4 w-4 mr-2" />
                                                                Actions
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem
                                                                onClick={() => {
                                                                    setSelectedPromotion(promotion);
                                                                    handleAcceptPromotion();
                                                                }}
                                                                className="text-green-600 cursor-pointer"
                                                            >
                                                                <Check className="h-4 w-4 mr-2" />
                                                                Accept Promotion
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                onClick={() =>
                                                                    openRefuseModal(promotion)
                                                                }
                                                                className="text-red-600 cursor-pointer"
                                                            >
                                                                <XCircle className="h-4 w-4 mr-2" />
                                                                Refuse Promotion
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                            <p className="text-muted-foreground">No promotion offers found</p>
                        </div>
                    )}
                </div>
            </Card>

            {/* Details Dialog */}
            <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
                <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                    {selectedPromotion && (
                        <>
                            <DialogHeader>
                                <DialogTitle className="text-xl">
                                    {selectedPromotion.promotionName}
                                </DialogTitle>
                                <DialogDescription>
                                    <div className="flex items-center gap-2 mt-2">
                                        <Badge
                                            variant="outline"
                                            className={STATUS_STYLES[selectedPromotion.status]}
                                        >
                                            {selectedPromotion.status.charAt(0).toUpperCase() +
                                                selectedPromotion.status.slice(1)}
                                        </Badge>
                                        <span className="text-muted-foreground">•</span>
                                        <span className="text-muted-foreground">
                                            {new Date(
                                                selectedPromotion.timestamp,
                                            ).toLocaleDateString()}
                                        </span>
                                    </div>
                                </DialogDescription>
                            </DialogHeader>

                            <div className="space-y-4 py-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 rounded-lg bg-muted/50 border">
                                        <div className="text-xs text-muted-foreground mb-1">
                                            Period
                                        </div>
                                        <Badge variant="outline">{selectedPromotion.period}</Badge>
                                    </div>
                                    <div className="p-4 rounded-lg bg-muted/50 border">
                                        <div className="text-xs text-muted-foreground mb-1">
                                            Evaluation Cycle
                                        </div>
                                        <div className="text-sm font-medium">
                                            {selectedPromotion.evaluationCycle}
                                        </div>
                                    </div>
                                </div>

                                <Separator />

                                {/* Position Change */}
                                <div className="space-y-2">
                                    <h4 className="font-semibold flex items-center gap-2">
                                        <Briefcase className="h-4 w-4" />
                                        Position Change
                                    </h4>
                                    <div className="flex items-center justify-between p-3 rounded-lg border">
                                        <div>
                                            <div className="text-xs text-muted-foreground">
                                                Current
                                            </div>
                                            <div className="font-medium">
                                                {selectedPromotion.currentPosition}
                                            </div>
                                            <div className="text-sm text-muted-foreground">
                                                Grade {selectedPromotion.currentGrade} • Step{" "}
                                                {selectedPromotion.currentStep}
                                            </div>
                                        </div>
                                        <div className="text-muted-foreground">→</div>
                                        <div className="text-right">
                                            <div className="text-xs text-muted-foreground">New</div>
                                            <div className="font-medium text-brand-600">
                                                {selectedPromotion.newPosition}
                                            </div>
                                            <div className="text-sm text-muted-foreground">
                                                Grade {selectedPromotion.newGrade} • Step{" "}
                                                {selectedPromotion.newStep}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Salary Change */}
                                <div className="space-y-2">
                                    <h4 className="font-semibold flex items-center gap-2">
                                        <DollarSign className="h-4 w-4" />
                                        Salary Change
                                    </h4>
                                    <div className="flex items-center justify-between p-3 rounded-lg border">
                                        <div>
                                            <div className="text-xs text-muted-foreground">
                                                Current Salary
                                            </div>
                                            <div className="font-medium">
                                                ${selectedPromotion.currentSalary.toLocaleString()}
                                            </div>
                                        </div>
                                        <div className="text-muted-foreground">→</div>
                                        <div className="text-right">
                                            <div className="text-xs text-muted-foreground">
                                                New Salary
                                            </div>
                                            <div className="font-medium text-green-600">
                                                ${selectedPromotion.newSalary.toLocaleString()}
                                                <span className="text-xs ml-1">
                                                    (+
                                                    {getSalaryIncrease(
                                                        selectedPromotion.currentSalary,
                                                        selectedPromotion.newSalary,
                                                    )}
                                                    %)
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Entitlement Days */}
                                <div className="space-y-2">
                                    <h4 className="font-semibold flex items-center gap-2">
                                        <Calendar className="h-4 w-4" />
                                        Leave Entitlement
                                    </h4>
                                    <div className="flex items-center justify-between p-3 rounded-lg border">
                                        <div>
                                            <div className="text-xs text-muted-foreground">
                                                Current Days
                                            </div>
                                            <div className="font-medium">
                                                {selectedPromotion.currentEntitlementDays} days
                                            </div>
                                        </div>
                                        <div className="text-muted-foreground">→</div>
                                        <div className="text-right">
                                            <div className="text-xs text-muted-foreground">
                                                New Days
                                            </div>
                                            <div className="font-medium text-brand-600">
                                                {selectedPromotion.newEntitlementDays} days
                                                <span className="text-xs ml-1">
                                                    (+
                                                    {selectedPromotion.newEntitlementDays -
                                                        selectedPromotion.currentEntitlementDays}
                                                    )
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Associated Allowances/Payments */}
                                {selectedPromotion.associatedPayments &&
                                    selectedPromotion.associatedPayments.length > 0 && (
                                    <AllowanceTable
                                        allowances={selectedPromotion.associatedPayments}
                                    />
                                )}
                            </div>

                            <DialogFooter>
                                {selectedPromotion.status === "pending" && (
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="outline">
                                                <MoreHorizontal className="h-4 w-4 mr-2" />
                                                Actions
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem
                                                onClick={handleAcceptPromotion}
                                                disabled={isProcessing}
                                                className="text-green-600 cursor-pointer"
                                            >
                                                {isProcessing ? (
                                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                ) : (
                                                    <Check className="h-4 w-4 mr-2" />
                                                )}
                                                Accept Promotion
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                onClick={() => openRefuseModal(selectedPromotion)}
                                                disabled={isProcessing}
                                                className="text-red-600 cursor-pointer"
                                            >
                                                {isProcessing ? (
                                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                ) : (
                                                    <XCircle className="h-4 w-4 mr-2" />
                                                )}
                                                Refuse Promotion
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                )}
                                {selectedPromotion.status !== "approved" && (
                                    <Button
                                        variant="outline"
                                        onClick={() => setIsDetailsOpen(false)}
                                    >
                                        Close
                                    </Button>
                                )}
                            </DialogFooter>
                        </>
                    )}
                </DialogContent>
            </Dialog>

            {/* Refuse Promotion Modal */}
            <Dialog open={isRefuseModalOpen} onOpenChange={setIsRefuseModalOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle className="text-xl text-red-600">Refuse Promotion</DialogTitle>
                        <DialogDescription>
                            Please provide a reason for refusing this promotion offer. This comment
                            is mandatory and will be shared with HR.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="refuse-comment">
                                Reason for Refusal <span className="text-red-500">*</span>
                            </Label>
                            <Textarea
                                id="refuse-comment"
                                placeholder="Please explain why you are refusing this promotion..."
                                value={refuseComment}
                                onChange={e => {
                                    setRefuseComment(e.target.value);
                                    if (e.target.value.trim()) {
                                        setRefuseError("");
                                    }
                                }}
                                className={refuseError ? "border-red-500" : ""}
                                rows={4}
                            />
                            {refuseError && <p className="text-sm text-red-500">{refuseError}</p>}
                        </div>

                        {selectedPromotion && (
                            <div className="p-4 rounded-lg bg-muted/50 border">
                                <div className="text-sm text-muted-foreground mb-1">
                                    Promotion Details
                                </div>
                                <div className="font-medium">{selectedPromotion.promotionName}</div>
                                <div className="text-sm">
                                    {selectedPromotion.currentPosition} →{" "}
                                    {selectedPromotion.newPosition}
                                </div>
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsRefuseModalOpen(false)}
                            disabled={isProcessing}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleRefusePromotion}
                            disabled={isProcessing || refuseComment.trim() === ""}
                        >
                            {isProcessing ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <XCircle className="h-4 w-4 mr-2" />
                                    Refuse Promotion
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

// Component for each allowance row with collapsible monthly breakdown
function AllowanceTable({
    allowances,
}: {
    allowances: PromotionInstanceModel["associatedPayments"];
}) {
    const [expandedAllowanceId, setExpandedAllowanceId] = useState<string | null>(null);

    if (!allowances || allowances.length === 0) return null;

    // Sort months in chronological order
    const sortedMonths = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
    ];

    // Calculate total annual amount
    const calculateTotal = (monthlyAmounts: { [month: string]: number }) => {
        return sortedMonths.reduce((total, month) => {
            return total + (monthlyAmounts?.[month] || 0);
        }, 0);
    };

    return (
        <div className="space-y-3">
            <h4 className="font-semibold flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Associated Allowances/Payments
            </h4>
            <div className="border rounded-lg overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/50">
                            <TableHead className="text-xs">Payment Type</TableHead>
                            <TableHead className="text-xs text-right">Monthly</TableHead>
                            <TableHead className="text-xs text-right">Annual Total</TableHead>
                            <TableHead className="text-xs text-center w-16">Details</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {allowances.map(allowance => {
                            const isExpanded = expandedAllowanceId === allowance.id;
                            return (
                                <>
                                    <TableRow key={allowance.id}>
                                        <TableCell className="text-sm py-2 font-medium">
                                            {allowance.paymentTypeLabel}
                                        </TableCell>
                                        <TableCell className="text-sm text-right py-2">
                                            ${allowance.paymentAmount.toLocaleString()}/mo
                                        </TableCell>
                                        <TableCell className="text-sm text-right py-2 text-green-600 font-medium">
                                            $
                                            {calculateTotal(
                                                allowance.monthlyAmounts || {},
                                            ).toLocaleString()}
                                            /yr
                                        </TableCell>
                                        <TableCell className="text-center py-2">
                                            <Collapsible
                                                open={isExpanded}
                                                onOpenChange={() =>
                                                    setExpandedAllowanceId(
                                                        isExpanded ? null : allowance.id,
                                                    )
                                                }
                                            >
                                                <CollapsibleTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 w-8 p-0"
                                                    >
                                                        {isExpanded ? (
                                                            <ChevronDown className="h-4 w-4" />
                                                        ) : (
                                                            <ChevronRight className="h-4 w-4" />
                                                        )}
                                                    </Button>
                                                </CollapsibleTrigger>
                                            </Collapsible>
                                        </TableCell>
                                    </TableRow>
                                    {isExpanded && (
                                        <TableRow>
                                            <TableCell colSpan={4} className="p-3 bg-muted/20">
                                                <div className="text-xs font-medium text-muted-foreground mb-2">
                                                    Monthly Breakdown:
                                                </div>
                                                <div className="grid grid-cols-6 gap-2 text-xs">
                                                    {sortedMonths.map(month => (
                                                        <div
                                                            key={month}
                                                            className="p-2 rounded bg-background border text-center"
                                                        >
                                                            <div className="text-muted-foreground">
                                                                {month}
                                                            </div>
                                                            <div className="font-medium">
                                                                $
                                                                {(
                                                                    allowance.monthlyAmounts?.[
                                                                        month
                                                                    ] || 0
                                                                ).toLocaleString()}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </>
                            );
                        })}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
