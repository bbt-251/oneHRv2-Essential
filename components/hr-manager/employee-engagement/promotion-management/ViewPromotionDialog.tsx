"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useFirestore } from "@/context/firestore-context";
import { EmployeeDocumentDialog } from "@/components/employee/documents/EmployeeDocumentDialog";
import {
    PromotionCommentModel,
    PromotionInstanceModel,
    PromotionPayment,
    STATUS_STYLES,
} from "@/lib/models/promotion-instance";
import {
    ArrowRight,
    Briefcase,
    Building,
    Calendar,
    ChevronDown,
    ChevronRight,
    DollarSign,
    MapPin,
    MessageSquare,
    Paperclip,
    TrendingUp,
    User,
} from "lucide-react";
import { useState } from "react";

interface ViewPromotionDialogProps {
    isOpen: boolean;
    onClose: () => void;
    promotion: (PromotionInstanceModel & { id: string }) | null;
    onStatusChange?: () => void;
}

export function ViewPromotionDialog({ isOpen, onClose, promotion }: ViewPromotionDialogProps) {
    const { hrSettings, documents } = useFirestore();
    const [activeTab, setActiveTab] = useState("details");
    const [showDocumentDialog, setShowDocumentDialog] = useState(false);

    if (!promotion) return null;

    const renderComments = () => {
        const comments = promotion.comments || [];
        if (comments.length === 0) return null;

        return (
            <div className="space-y-3">
                <h4 className="font-semibold text-brand-800 dark:text-foreground flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Comments ({comments.length})
                </h4>
                <ScrollArea className="h-[150px]">
                    <div className="space-y-3 pr-4">
                        {comments.map((c: PromotionCommentModel) => (
                            <div key={c.id} className="p-3 rounded-lg bg-muted/50 border">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-sm font-medium">{c.byName}</span>
                                    <span className="text-xs text-muted-foreground">
                                        {c.timestamp}
                                    </span>
                                </div>
                                <p className="text-sm text-muted-foreground">{c.text}</p>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </div>
        );
    };

    // Helper to get working location name
    const getLocationName = (locationId: string | null) => {
        if (!locationId) return "-";
        return hrSettings.locations?.find(l => l.id === locationId)?.name || locationId;
    };

    // Helper to render allowances
    const renderAllowances = () => {
        const allowances = promotion.associatedPayments || [];
        if (allowances.length === 0) return null;

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
                <h4 className="font-semibold text-brand-800 dark:text-foreground flex items-center gap-2">
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
                            {allowances.map((allowance: PromotionPayment) => (
                                <AllowanceRow
                                    key={allowance.id}
                                    allowance={allowance}
                                    sortedMonths={sortedMonths}
                                    calculateTotal={calculateTotal}
                                />
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>
        );
    };

    // Component for each allowance row with collapsible monthly breakdown
    function AllowanceRow({
        allowance,
        sortedMonths,
        calculateTotal,
    }: {
        allowance: PromotionPayment;
        sortedMonths: string[];
        calculateTotal: (monthlyAmounts: { [month: string]: number }) => number;
    }) {
        const [isOpen, setIsOpen] = useState(false);

        return (
            <>
                <TableRow>
                    <TableCell className="text-sm py-2 font-medium">
                        {allowance.paymentTypeLabel}
                    </TableCell>
                    <TableCell className="text-sm text-right py-2">
                        ${allowance.paymentAmount.toLocaleString()}/mo
                    </TableCell>
                    <TableCell className="text-sm text-right py-2 text-green-600 font-medium">
                        ${calculateTotal(allowance.monthlyAmounts || {}).toLocaleString()}/yr
                    </TableCell>
                    <TableCell className="text-center py-2">
                        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
                            <CollapsibleTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                    {isOpen ? (
                                        <ChevronDown className="h-4 w-4" />
                                    ) : (
                                        <ChevronRight className="h-4 w-4" />
                                    )}
                                </Button>
                            </CollapsibleTrigger>
                        </Collapsible>
                    </TableCell>
                </TableRow>
                {isOpen && (
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
                                        <div className="text-muted-foreground">{month}</div>
                                        <div className="font-medium">
                                            $
                                            {(
                                                allowance.monthlyAmounts?.[month] || 0
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
    }

    return (
        <>
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent className="sm:max-w-[1000px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-xl text-brand-800 dark:text-foreground">
                            {promotion.promotionName}
                        </DialogTitle>
                        <DialogDescription className="flex items-center gap-2 text-brand-600 dark:text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            {new Date(promotion.timestamp).toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                            })}
                        </DialogDescription>
                    </DialogHeader>

                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="details" className="flex items-center gap-2">
                                <TrendingUp className="h-4 w-4" />
                                Promotion Details
                            </TabsTrigger>
                            <TabsTrigger value="documents" className="flex items-center gap-2">
                                <Paperclip className="h-4 w-4" />
                                Attachments
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="details" className="space-y-6 py-4">
                            {/* Employee Info Card */}
                            <Card className="bg-gradient-to-br from-brand-50 to-accent-50 dark:from-muted/50 dark:to-muted/30 border-brand-200 dark:border-border">
                                <CardContent className="pt-6">
                                    <div className="flex items-center gap-4">
                                        <div className="h-16 w-16 rounded-full bg-brand-600 flex items-center justify-center text-white text-xl font-semibold">
                                            {promotion.employeeName
                                                .split(" ")
                                                .map(n => n[0])
                                                .join("")}
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-semibold text-brand-800 dark:text-foreground">
                                                {promotion.employeeName}
                                            </h3>
                                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                <span className="flex items-center gap-1">
                                                    <User className="h-3 w-3" />
                                                    {promotion.employeeID || "-"}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Building className="h-3 w-3" />
                                                    {hrSettings.departmentSettings.find(
                                                        d => d.id === promotion.department,
                                                    )?.name || "-"}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Promotion ID */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 rounded-lg bg-muted/50 border">
                                    <div className="text-xs text-muted-foreground mb-1">
                                        Promotion ID
                                    </div>
                                    <div className="text-sm font-medium text-foreground">
                                        {promotion.promotionID}
                                    </div>
                                </div>
                                <div className="p-4 rounded-lg bg-muted/50 border">
                                    <div className="text-xs text-muted-foreground mb-1">Period</div>
                                    <Badge variant="outline" className="font-medium">
                                        {promotion.period}
                                    </Badge>
                                </div>
                            </div>

                            {/* Evaluation Cycle & Reason */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 rounded-lg bg-muted/50 border">
                                    <div className="text-xs text-muted-foreground mb-1">
                                        Evaluation Cycle
                                    </div>
                                    <div className="text-sm font-medium text-foreground">
                                        {promotion.evaluationCycle}
                                    </div>
                                </div>
                                <div className="p-4 rounded-lg bg-muted/50 border">
                                    <div className="text-xs text-muted-foreground mb-1">
                                        Promotion Reason
                                    </div>
                                    <div className="text-sm font-medium text-foreground">
                                        {promotion.promotionReason || "-"}
                                    </div>
                                </div>
                            </div>

                            {/* Other Reason Description (if applicable) */}
                            {promotion.promotionReason === "Other" &&
                                promotion.otherReasonDescription && (
                                <div className="p-4 rounded-lg bg-muted/50 border">
                                    <div className="text-xs text-muted-foreground mb-1">
                                            Reason Description
                                    </div>
                                    <div className="text-sm text-foreground">
                                        {promotion.otherReasonDescription}
                                    </div>
                                </div>
                            )}

                            {/* Application Date */}
                            {promotion.applicationDate && (
                                <div className="p-4 rounded-lg bg-muted/50 border">
                                    <div className="text-xs text-muted-foreground mb-1">
                                        Application Date
                                    </div>
                                    <div className="text-sm font-medium text-foreground">
                                        {new Date(promotion.applicationDate).toLocaleDateString(
                                            "en-US",
                                            {
                                                year: "numeric",
                                                month: "long",
                                                day: "numeric",
                                            },
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Status & Status Info */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-muted-foreground">Status:</span>
                                    <Badge
                                        variant="outline"
                                        className={STATUS_STYLES[promotion.status]}
                                    >
                                        {promotion.status.charAt(0).toUpperCase() +
                                            promotion.status.slice(1)}
                                    </Badge>
                                </div>

                                {/* Status Change Info */}
                                {promotion.statusChangedAt && (
                                    <div className="text-xs text-muted-foreground">
                                        Status changed on{" "}
                                        {new Date(promotion.statusChangedAt).toLocaleDateString(
                                            "en-US",
                                            {
                                                year: "numeric",
                                                month: "long",
                                                day: "numeric",
                                                hour: "2-digit",
                                                minute: "2-digit",
                                            },
                                        )}
                                    </div>
                                )}

                                {/* Finalized Info */}
                                {promotion.finalizedAt && (
                                    <div className="text-xs text-green-600 dark:text-green-400">
                                        Finalized on{" "}
                                        {new Date(promotion.finalizedAt).toLocaleDateString(
                                            "en-US",
                                            {
                                                year: "numeric",
                                                month: "long",
                                                day: "numeric",
                                                hour: "2-digit",
                                                minute: "2-digit",
                                            },
                                        )}
                                    </div>
                                )}

                                {/* Employee Data Updated */}
                                {promotion.employeeDataUpdated && (
                                    <div className="text-xs text-green-600 dark:text-green-400">
                                        ✓ Employee data has been updated
                                    </div>
                                )}
                            </div>

                            {/* Changes Section */}
                            <div className="space-y-4">
                                <h4 className="font-semibold text-brand-800 dark:text-foreground flex items-center gap-2">
                                    <TrendingUp className="h-4 w-4" />
                                    Promotion Changes
                                </h4>

                                <div className="grid gap-3">
                                    {/* Position Change */}
                                    <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                                <Briefcase className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                            </div>
                                            <div>
                                                <div className="text-xs text-muted-foreground">
                                                    Position
                                                </div>
                                                <div className="text-sm font-medium">
                                                    {promotion.currentPosition}
                                                </div>
                                            </div>
                                        </div>
                                        <ArrowRight className="h-5 w-5 text-muted-foreground" />
                                        <div className="text-right">
                                            <div className="text-xs text-muted-foreground">
                                                New Position
                                            </div>
                                            <div className="text-sm font-semibold text-brand-700 dark:text-brand-400">
                                                {promotion.newPosition}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Grade & Step Change */}
                                    <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                                                <TrendingUp className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                                            </div>
                                            <div>
                                                <div className="text-xs text-muted-foreground">
                                                    Grade / Step
                                                </div>
                                                <div className="text-sm font-medium">
                                                    {promotion.currentGrade} / Step{" "}
                                                    {promotion.currentStep}
                                                </div>
                                            </div>
                                        </div>
                                        <ArrowRight className="h-5 w-5 text-muted-foreground" />
                                        <div className="text-right">
                                            <div className="text-xs text-muted-foreground">
                                                New Grade / Step
                                            </div>
                                            <div className="text-sm font-semibold text-brand-700 dark:text-brand-400">
                                                {promotion.newGrade} / Step {promotion.newStep}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Salary Change */}
                                    <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                                                <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
                                            </div>
                                            <div>
                                                <div className="text-xs text-muted-foreground">
                                                    Salary
                                                </div>
                                                <div className="text-sm font-medium">
                                                    ${promotion.currentSalary.toLocaleString()}
                                                </div>
                                            </div>
                                        </div>
                                        <ArrowRight className="h-5 w-5 text-muted-foreground" />
                                        <div className="text-right">
                                            <div className="text-xs text-muted-foreground">
                                                New Salary
                                            </div>
                                            <div className="text-sm font-semibold text-green-600 dark:text-green-400">
                                                ${promotion.newSalary.toLocaleString()}
                                                <span className="text-xs ml-1">
                                                    (+
                                                    {(
                                                        promotion.newSalary -
                                                        promotion.currentSalary
                                                    ).toLocaleString()}
                                                    )
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Entitlement Days Change */}
                                    <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                                                <Calendar className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                                            </div>
                                            <div>
                                                <div className="text-xs text-muted-foreground">
                                                    Entitlement Days
                                                </div>
                                                <div className="text-sm font-medium">
                                                    {promotion.currentEntitlementDays} days
                                                </div>
                                            </div>
                                        </div>
                                        <ArrowRight className="h-5 w-5 text-muted-foreground" />
                                        <div className="text-right">
                                            <div className="text-xs text-muted-foreground">
                                                New Entitlement
                                            </div>
                                            <div className="text-sm font-semibold text-brand-700 dark:text-brand-400">
                                                {promotion.newEntitlementDays} days
                                                <span className="text-xs ml-1">
                                                    (+
                                                    {promotion.newEntitlementDays -
                                                        promotion.currentEntitlementDays}
                                                    )
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Working Location Change */}
                                    <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-lg bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center">
                                                <MapPin className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                                            </div>
                                            <div>
                                                <div className="text-xs text-muted-foreground">
                                                    Working Location
                                                </div>
                                                <div className="text-sm font-medium">
                                                    {getLocationName(
                                                        promotion.currentWorkingLocation,
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <ArrowRight className="h-5 w-5 text-muted-foreground" />
                                        <div className="text-right">
                                            <div className="text-xs text-muted-foreground">
                                                New Location
                                            </div>
                                            <div className="text-sm font-semibold text-brand-700 dark:text-brand-400">
                                                {getLocationName(promotion.newWorkingLocation)}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Allowances Section */}
                            {renderAllowances()}

                            {/* Comments Section */}
                            {renderComments()}
                        </TabsContent>

                        <TabsContent value="documents" className="py-4">
                            <div className="space-y-4">
                                {/* Document Template */}
                                {promotion.documentTemplateId ? (
                                    <div className="p-4 rounded-lg bg-muted/50 border">
                                        <h4 className="font-semibold text-brand-800 dark:text-foreground mb-2">
                                            Promotion Letter Template
                                        </h4>
                                        <p className="text-sm text-muted-foreground mb-2">
                                            {documents.find(
                                                d => d.id === promotion.documentTemplateId,
                                            )?.name || "Unknown Template"}
                                        </p>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setShowDocumentDialog(true)}
                                        >
                                            View Promotion Letter
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="p-4 rounded-lg bg-muted/50 border">
                                        <h4 className="font-semibold text-brand-800 dark:text-foreground mb-2">
                                            Promotion Letter Template
                                        </h4>
                                        <p className="text-sm text-muted-foreground">
                                            No document template selected for this promotion.
                                        </p>
                                    </div>
                                )}

                                {/* Additional Documents */}
                                <div className="p-4 rounded-lg bg-muted/50 border">
                                    <div className="flex items-center justify-between mb-2">
                                        <h4 className="font-semibold text-brand-800 dark:text-foreground">
                                            Additional Documents
                                        </h4>
                                        <Button variant="outline" size="sm" disabled>
                                            Upload Document
                                        </Button>
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        No additional documents attached to this promotion instance.
                                    </p>
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>

                    <DialogFooter>
                        <Button variant="outline" onClick={onClose}>
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Document Dialog */}
            {promotion && (
                <EmployeeDocumentDialog
                    isOpen={showDocumentDialog}
                    onClose={() => setShowDocumentDialog(false)}
                    documentCategory="promotion_letter"
                    promotion={promotion}
                />
            )}
        </>
    );
}
