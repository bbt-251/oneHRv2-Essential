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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { useFirestore } from "@/context/firestore-context";
import { useToast } from "@/context/toastContext";
import { promotionService } from "@/lib/backend/firebase/promotionService";
import { PromotionInstanceModel, PromotionPayment } from "@/lib/models/promotion-instance";
import getFullName from "@/lib/util/getEmployeeFullName";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

// Position option type
interface PositionOption {
    id: string;
    name: string;
    grade: string;
}

// Grade option type
interface GradeOption {
    id: string;
    grade: string;
}

interface EditPromotionDialogProps {
    isOpen: boolean;
    onClose: () => void;
    promotion: (PromotionInstanceModel & { id: string }) | null;
    hrUID: string;
    hrName: string;
}

export function EditPromotionDialog({
    isOpen,
    onClose,
    promotion,
    hrUID,
    hrName,
}: EditPromotionDialogProps) {
    // Get data directly from Firestore context
    const { activeEmployees, hrSettings, documents } = useFirestore();
    const { showToast } = useToast();

    // Get active positions for dropdown
    const positionOptions: PositionOption[] = useMemo(() => {
        return hrSettings.positions
            .filter(p => p.active === "Yes")
            .map(p => ({
                id: p.id,
                name: p.name,
                grade: p.grade,
            }));
    }, [hrSettings.positions]);

    // Get active grades for dropdown
    const gradeOptions: GradeOption[] = useMemo(() => {
        return hrSettings.grades
            .filter(g => g.active === "Yes")
            .map(g => ({
                id: g.id,
                grade: g.grade,
            }));
    }, [hrSettings.grades]);

    // Get salary scales for step/salary calculations
    const salaryScales = hrSettings.salaryScales || [];

    // Get salary from scale matrix based on grade and step
    const getSalaryFromScale = (gradeId: string, step: number): number => {
        // Find the salary scale that contains the selected grade
        const scaleObj = salaryScales.find(s => s.scales.some(sc => sc.grade === gradeId));
        if (!scaleObj) return 0;

        // Look up salary in the scales array (row is found from grade, column = step)
        const gradeIndex = gradeOptions.findIndex(g => g.id === gradeId);
        if (gradeIndex === -1) return 0;

        const scale = scaleObj.scales.find(s => s.row === gradeIndex + 1 && s.column === step);
        return scale?.salary || 0;
    };

    // Get employee data
    const employee = useMemo(() => {
        if (!promotion) return null;
        return activeEmployees.find(e => e.uid === promotion.employeeUID);
    }, [activeEmployees, promotion]);

    // Form state
    const [promotionName, setPromotionName] = useState<string>("");
    const [documentTemplateId, setDocumentTemplateId] = useState<string>("");
    const [newPosition, setNewPosition] = useState<string>("");
    const [newGrade, setNewGrade] = useState<string>("");
    const [newStep, setNewStep] = useState<string>("");
    const [newSalary, setNewSalary] = useState<string>("");
    const [newEntitlementDays, setNewEntitlementDays] = useState<string>("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Allowance state
    const [allowances, setAllowances] = useState<PromotionPayment[]>([]);
    const [isAllowanceModalOpen, setIsAllowanceModalOpen] = useState(false);
    const [editingAllowanceId, setEditingAllowanceId] = useState<string | null>(null);
    const [newAllowance, setNewAllowance] = useState<Partial<PromotionPayment>>({
        paymentTypeName: "",
        paymentTypeLabel: "",
        paymentAmount: 0,
        monthlyAmounts: {},
    });

    // Open allowance modal (for adding new)
    const openAllowanceModal = () => {
        setEditingAllowanceId(null);
        setNewAllowance({
            paymentTypeName: "",
            paymentTypeLabel: "",
            paymentAmount: 0,
            monthlyAmounts: {},
        });
        setIsAllowanceModalOpen(true);
    };

    // Open allowance modal (for editing existing)
    const openEditAllowanceModal = (allowance: PromotionPayment) => {
        setEditingAllowanceId(allowance.id);
        setNewAllowance({
            paymentTypeName: allowance.paymentTypeName,
            paymentTypeLabel: allowance.paymentTypeLabel,
            paymentAmount: allowance.paymentAmount,
            monthlyAmounts: allowance.monthlyAmounts || {},
        });
        setIsAllowanceModalOpen(true);
    };

    // Add or update allowance
    const saveAllowance = () => {
        if (!newAllowance.paymentTypeName) return;

        const paymentType = hrSettings.paymentTypes?.find(
            pt => pt.id === newAllowance.paymentTypeName,
        );

        const allowance: PromotionPayment = {
            id: editingAllowanceId || Date.now().toString(),
            paymentTypeName: newAllowance.paymentTypeName,
            paymentTypeLabel: paymentType?.paymentName || newAllowance.paymentTypeName,
            paymentAmount: newAllowance.paymentAmount || 0,
            monthlyAmounts: newAllowance.monthlyAmounts || {},
        };

        if (editingAllowanceId) {
            // Update existing allowance
            setAllowances(prev => prev.map(a => (a.id === editingAllowanceId ? allowance : a)));
            showToast("Allowance updated successfully", "Success", "success");
        } else {
            // Add new allowance
            setAllowances(prev => [...prev, allowance]);
            showToast("Allowance added successfully", "Success", "success");
        }

        setIsAllowanceModalOpen(false);
        setEditingAllowanceId(null);
    };

    // Remove allowance
    const removeAllowance = (allowanceId: string) => {
        setAllowances(prev => prev.filter(a => a.id !== allowanceId));
    };

    // Update monthly amount for new allowance
    const updateAllowanceMonthlyAmount = (month: string, value: number) => {
        setNewAllowance(prev => ({
            ...prev,
            monthlyAmounts: {
                ...prev.monthlyAmounts,
                [month]: value,
            },
        }));
    };

    // Set base amount and auto-fill all months
    const setAllowanceBaseAmount = (amount: number) => {
        const monthlyAmounts: { [month: string]: number } = {};
        [
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
        ].forEach(month => {
            monthlyAmounts[month] = amount;
        });

        setNewAllowance(prev => ({
            ...prev,
            paymentAmount: amount,
            monthlyAmounts,
        }));
    };

    // Check if editing is allowed (pending or refused status)
    // - pending: before employee acknowledges
    // - refused: after employee refused, HR can edit and resend offer
    const canEdit = useMemo(() => {
        if (!promotion) return false;
        return promotion.status === "pending" || promotion.status === "refused";
    }, [promotion]);

    // Reset form when dialog opens with new promotion data
    useEffect(() => {
        if (promotion && isOpen) {
            setPromotionName(promotion.promotionName);
            setDocumentTemplateId(promotion.documentTemplateId || "");
            setNewPosition(promotion.newPositionID || "");
            setNewGrade(promotion.newGradeID || "");
            setNewStep(promotion.newStep ? String(promotion.newStep) : "");
            setNewSalary(promotion.newSalary ? String(promotion.newSalary) : "");
            setNewEntitlementDays(
                promotion.newEntitlementDays ? String(promotion.newEntitlementDays) : "",
            );
            setAllowances(promotion.associatedPayments || []);
        }
    }, [promotion, isOpen]);

    // Auto-populate salary when grade and step change
    useEffect(() => {
        if (newGrade && newStep) {
            const salary = getSalaryFromScale(newGrade, parseInt(newStep));
            if (salary > 0) {
                setNewSalary(String(salary));
            }
        }
    }, [newGrade, newStep]);

    const handleClose = () => {
        onClose();
    };

    const handleSubmit = async () => {
        if (!promotion || !canEdit) {
            showToast(
                "Cannot edit this promotion. Only pending or refused promotions can be edited.",
                "Validation Error",
                "error",
            );
            return;
        }

        if (!promotionName) {
            showToast("Please enter a promotion name", "Validation Error", "error");
            return;
        }

        setIsSubmitting(true);

        try {
            // Get new position details
            const newPos = positionOptions.find(p => p.id === newPosition);
            const newPositionName = newPos?.name || promotion.newPosition;

            // Get new grade details
            const newGradeObj = gradeOptions.find(g => g.id === newGrade);
            const newGradeName = newGradeObj?.grade || promotion.newGrade;

            // Build changes description for logging
            const changes: string[] = [];
            if (promotionName !== promotion.promotionName) {
                changes.push(`name: "${promotion.promotionName}" → "${promotionName}"`);
            }
            if (documentTemplateId !== (promotion.documentTemplateId || "")) {
                const oldTemplate = promotion.documentTemplateId
                    ? documents.find(d => d.id === promotion.documentTemplateId)?.name ||
                      promotion.documentTemplateId
                    : "None";
                const newTemplate = documentTemplateId
                    ? documents.find(d => d.id === documentTemplateId)?.name || documentTemplateId
                    : "None";
                changes.push(`document template: "${oldTemplate}" → "${newTemplate}"`);
            }
            if (newPosition && newPosition !== promotion.newPositionID) {
                changes.push(`position: "${promotion.newPosition}" → "${newPositionName}"`);
            }
            if (newGrade && newGrade !== promotion.newGradeID) {
                changes.push(`grade: "${promotion.newGrade}" → "${newGradeName}"`);
            }
            if (newStep && parseInt(newStep) !== promotion.newStep) {
                changes.push(`step: ${promotion.newStep} → ${newStep}`);
            }
            if (newSalary && parseInt(newSalary) !== promotion.newSalary) {
                changes.push(`salary: ${promotion.newSalary} → ${newSalary}`);
            }
            if (
                newEntitlementDays &&
                parseInt(newEntitlementDays) !== promotion.newEntitlementDays
            ) {
                changes.push(
                    `entitlement days: ${promotion.newEntitlementDays} → ${newEntitlementDays}`,
                );
            }

            // Track allowance changes
            const oldAllowances = promotion.associatedPayments || [];
            const newAllowanceCount = allowances.length;
            const oldAllowanceCount = oldAllowances.length;
            if (newAllowanceCount !== oldAllowanceCount) {
                changes.push(`allowances: ${oldAllowanceCount} → ${newAllowanceCount}`);
            }

            const updateData: Partial<PromotionInstanceModel> = {
                promotionName,
                documentTemplateId: documentTemplateId || null,
            };

            if (newPosition) {
                updateData.newPositionID = newPosition;
                updateData.newPosition = newPositionName;
            }
            if (newGrade) {
                updateData.newGradeID = newGrade;
                updateData.newGrade = newGradeName;
            }
            if (newStep) {
                updateData.newStep = parseInt(newStep);
            }
            if (newSalary) {
                updateData.newSalary = parseInt(newSalary);
            }
            if (newEntitlementDays) {
                updateData.newEntitlementDays = parseInt(newEntitlementDays);
            }

            // Include allowances/associated payments in the update
            updateData.associatedPayments = allowances;

            // Determine if we need to reopen the promotion (if it was refused)
            const shouldReopen = promotion.status === "refused";

            // Update the promotion with logging
            const success = await promotionService.updateWithLog(
                promotion.id,
                updateData,
                promotion,
                hrUID,
                hrName,
                changes.join(", "),
                shouldReopen,
            );

            if (success) {
                handleClose();
                const message = shouldReopen
                    ? "Promotion updated and reopened successfully. Status changed to Pending."
                    : "Promotion updated successfully";
                showToast(message, "Success", "success");
            } else {
                showToast("Failed to update promotion. Please try again.", "Error", "error");
            }
        } catch (error) {
            console.error("Error updating promotion:", error);
            showToast("Failed to update promotion. Please try again.", "Error", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Get max steps for selected grade
    const maxSteps = useMemo(() => {
        if (!newGrade) return 5;
        const scaleWithGrade = salaryScales.find(s => s.scales.some(sc => sc.grade === newGrade));
        return scaleWithGrade?.numberOfSteps || 5;
    }, [newGrade, salaryScales]);

    if (!promotion || !employee) {
        return null;
    }

    // Get current values for display
    const currentPos = positionOptions.find(p => p.id === employee.employmentPosition);
    const currentPositionName = currentPos?.name || employee.employmentPosition || "—";
    const currentGradeObj = gradeOptions.find(g => g.id === employee.gradeLevel);
    const currentGradeName = currentGradeObj?.grade || employee.gradeLevel || "—";

    const isFormValid = promotionName && !isSubmitting && canEdit;

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-brand-800 dark:text-foreground">
                        Edit Promotion
                    </DialogTitle>
                    <DialogDescription className="text-brand-600 dark:text-muted-foreground">
                        Edit promotion details for {getFullName(employee)}. Only pending or refused
                        promotions can be edited.
                    </DialogDescription>
                </DialogHeader>

                {!canEdit && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                        <p className="font-medium">Cannot Edit Promotion</p>
                        <p className="text-sm">
                            This promotion has status "{promotion.status}". Only promotions with
                            status "pending" or "refused" can be edited.
                        </p>
                    </div>
                )}

                <div className="space-y-6 py-4">
                    {/* Employee Info */}
                    <div className="bg-muted/50 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h4 className="font-semibold">{getFullName(employee)}</h4>
                                <p className="text-sm text-muted-foreground">
                                    {employee.employeeID}
                                </p>
                            </div>
                            <Badge
                                variant={promotion.status === "pending" ? "default" : "secondary"}
                            >
                                {promotion.status}
                            </Badge>
                        </div>
                        <div className="mt-2 text-sm text-muted-foreground">
                            {currentPositionName} • {currentGradeName} • Step {employee.step}
                        </div>
                    </div>

                    <Separator />

                    {/* Promotion Name */}
                    <div className="space-y-2">
                        <Label>Promotion Name</Label>
                        <Input
                            placeholder="Enter promotion name..."
                            value={promotionName}
                            onChange={e => setPromotionName(e.target.value)}
                            disabled={!canEdit}
                        />
                    </div>

                    {/* Document Template Selection */}
                    <div className="space-y-2">
                        <Label>Document Template</Label>
                        <Select
                            value={documentTemplateId}
                            onValueChange={setDocumentTemplateId}
                            disabled={!canEdit}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select a document template" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="">None</SelectItem>
                                {documents
                                    .filter(doc => doc.status === "Published")
                                    .map(doc => (
                                        <SelectItem key={doc.id} value={doc.id}>
                                            {doc.name} - {doc.subject}
                                        </SelectItem>
                                    ))}
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                            Select a document template to generate a personalized promotion letter.
                        </p>
                    </div>

                    <Separator />

                    {/* Benefits Section */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <div className="h-6 w-1 bg-brand-600 rounded-full" />
                            <h3 className="font-semibold text-brand-800 dark:text-foreground">
                                Promotion Benefits
                            </h3>
                        </div>

                        <div className="pl-3 space-y-4">
                            {/* Position Change */}
                            <div className="grid grid-cols-[1fr,auto,1fr] gap-4 items-end">
                                <div className="space-y-2">
                                    <Label className="text-muted-foreground">
                                        Current Position
                                    </Label>
                                    <div className="h-10 px-3 py-2 rounded-md border bg-muted/50 flex items-center text-sm text-muted-foreground">
                                        {promotion.currentPosition}
                                    </div>
                                </div>
                                <div className="flex items-center justify-center h-10 text-muted-foreground">
                                    <span className="text-lg">→</span>
                                </div>
                                <div className="space-y-2">
                                    <Label>New Position</Label>
                                    <Select
                                        value={newPosition}
                                        onValueChange={setNewPosition}
                                        disabled={!canEdit}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select new position" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {positionOptions.map(pos => (
                                                <SelectItem key={pos.id} value={pos.id}>
                                                    {pos.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Grade Change */}
                            <div className="grid grid-cols-[1fr,auto,1fr] gap-4 items-end">
                                <div className="space-y-2">
                                    <Label className="text-muted-foreground">Current Grade</Label>
                                    <div className="h-10 px-3 py-2 rounded-md border bg-muted/50 flex items-center text-sm text-muted-foreground">
                                        {promotion.currentGrade}
                                    </div>
                                </div>
                                <div className="flex items-center justify-center h-10 text-muted-foreground">
                                    <span className="text-lg">→</span>
                                </div>
                                <div className="space-y-2">
                                    <Label>New Grade</Label>
                                    <Select
                                        value={newGrade}
                                        onValueChange={value => {
                                            setNewGrade(value);
                                            setNewStep("");
                                            setNewSalary("");
                                        }}
                                        disabled={!canEdit}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select new grade" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {gradeOptions.map(grade => (
                                                <SelectItem key={grade.id} value={grade.id}>
                                                    {grade.grade}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Step Change */}
                            <div className="grid grid-cols-[1fr,auto,1fr] gap-4 items-end">
                                <div className="space-y-2">
                                    <Label className="text-muted-foreground">Current Step</Label>
                                    <div className="h-10 px-3 py-2 rounded-md border bg-muted/50 flex items-center text-sm text-muted-foreground">
                                        Step {promotion.currentStep}
                                    </div>
                                </div>
                                <div className="flex items-center justify-center h-10 text-muted-foreground">
                                    <span className="text-lg">→</span>
                                </div>
                                <div className="space-y-2">
                                    <Label>New Step</Label>
                                    <Select
                                        value={newStep}
                                        onValueChange={setNewStep}
                                        disabled={!canEdit || !newGrade}
                                    >
                                        <SelectTrigger>
                                            <SelectValue
                                                placeholder={
                                                    newGrade
                                                        ? "Select new step"
                                                        : "Select grade first"
                                                }
                                            />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Array.from({ length: maxSteps }, (_, i) => i + 1).map(
                                                step => (
                                                    <SelectItem key={step} value={String(step)}>
                                                        Step {step}
                                                    </SelectItem>
                                                ),
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Salary Change */}
                            <div className="grid grid-cols-[1fr,auto,1fr] gap-4 items-end">
                                <div className="space-y-2">
                                    <Label className="text-muted-foreground">
                                        Current Salary ($)
                                    </Label>
                                    <div className="h-10 px-3 py-2 rounded-md border bg-muted/50 flex items-center text-sm text-muted-foreground">
                                        ${promotion.currentSalary.toLocaleString()}
                                    </div>
                                </div>
                                <div className="flex items-center justify-center h-10 text-muted-foreground">
                                    <span className="text-lg">→</span>
                                </div>
                                <div className="space-y-2">
                                    <Label>New Salary ($)</Label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                                            $
                                        </span>
                                        <Input
                                            type="number"
                                            placeholder="Enter new salary"
                                            value={newSalary}
                                            onChange={e => setNewSalary(e.target.value)}
                                            disabled={!canEdit}
                                            className="pl-12"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Entitlement Days Change */}
                            <div className="grid grid-cols-[1fr,auto,1fr] gap-4 items-end">
                                <div className="space-y-2">
                                    <Label className="text-muted-foreground">
                                        Current Leave Balance (Days)
                                    </Label>
                                    <div className="h-10 px-3 py-2 rounded-md border bg-muted/50 flex items-center text-sm text-muted-foreground">
                                        {promotion.currentEntitlementDays} days
                                    </div>
                                </div>
                                <div className="flex items-center justify-center h-10 text-muted-foreground">
                                    <span className="text-lg">→</span>
                                </div>
                                <div className="space-y-2">
                                    <Label>New Entitlement Days (Balance)</Label>
                                    <Input
                                        type="number"
                                        placeholder="Enter new days"
                                        value={newEntitlementDays}
                                        onChange={e => setNewEntitlementDays(e.target.value)}
                                        disabled={!canEdit}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Allowances Section */}
                    <div className="space-y-3 pt-4 border-t">
                        <div className="flex items-center justify-between">
                            <Label className="text-brand-700 dark:text-foreground font-medium">
                                Associated Allowances/Payments
                            </Label>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={openAllowanceModal}
                                disabled={!canEdit}
                                className="flex items-center gap-1"
                            >
                                <Plus className="h-4 w-4" />
                                Add Allowance
                            </Button>
                        </div>

                        {allowances && allowances.length > 0 ? (
                            <div className="border rounded-lg overflow-hidden">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-muted/50">
                                            <TableHead className="text-xs">Payment Type</TableHead>
                                            <TableHead className="text-xs text-right">
                                                Base Amount
                                            </TableHead>
                                            <TableHead className="text-xs text-center w-24">
                                                Actions
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {allowances.map(allowance => (
                                            <TableRow key={allowance.id}>
                                                <TableCell className="text-sm py-2">
                                                    {allowance.paymentTypeLabel}
                                                </TableCell>
                                                <TableCell className="text-sm text-right py-2">
                                                    ${allowance.paymentAmount.toLocaleString()}
                                                </TableCell>
                                                <TableCell className="text-center py-2">
                                                    <div className="flex items-center justify-center gap-1">
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() =>
                                                                openEditAllowanceModal(allowance)
                                                            }
                                                            disabled={!canEdit}
                                                            className="h-8 w-8 p-0 text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                                                        >
                                                            <Pencil className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() =>
                                                                removeAllowance(allowance.id)
                                                            }
                                                            disabled={!canEdit}
                                                            className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        ) : (
                            <div className="text-sm text-muted-foreground py-4 text-center bg-muted/20 rounded-lg">
                                No allowances added yet. Click "Add Allowance" to add payments.
                            </div>
                        )}
                    </div>
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button
                        variant="outline"
                        onClick={handleClose}
                        className="border-brand-300 text-brand-700 hover:bg-brand-50 dark:border-border dark:text-foreground dark:hover:bg-accent"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={!isFormValid || isSubmitting}
                        className="bg-brand-600 hover:bg-brand-700 text-white disabled:opacity-50"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Updating...
                            </>
                        ) : (
                            "Update Promotion"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>

            {/* Add/Edit Allowance Modal */}
            <Dialog open={isAllowanceModalOpen} onOpenChange={setIsAllowanceModalOpen}>
                <DialogContent className="max-w-[900px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-brand-800 dark:text-foreground">
                            {editingAllowanceId ? "Edit Allowance" : "Add Allowance"}
                        </DialogTitle>
                        <DialogDescription className="text-brand-600 dark:text-muted-foreground">
                            {editingAllowanceId
                                ? "Edit the payment/allowance for the employee."
                                : "Add a payment/allowance for the employee as part of this promotion."}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6 py-4">
                        {/* Payment Type Selection */}
                        <div className="space-y-2">
                            <Label>
                                Payment Type <span className="text-red-500">*</span>
                            </Label>
                            <Select
                                value={newAllowance.paymentTypeName}
                                onValueChange={value => {
                                    const paymentType = hrSettings.paymentTypes?.find(
                                        pt => pt.id === value,
                                    );
                                    setNewAllowance(prev => ({
                                        ...prev,
                                        paymentTypeName: value,
                                        paymentTypeLabel: paymentType?.paymentName || value,
                                    }));
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select payment type" />
                                </SelectTrigger>
                                <SelectContent>
                                    {hrSettings.paymentTypes?.map(pt => (
                                        <SelectItem key={pt.id} value={pt.id}>
                                            {pt.paymentName}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Base Amount */}
                        <div className="space-y-2">
                            <Label>Base Payment Amount ($)</Label>
                            <Input
                                type="number"
                                placeholder="Enter base amount"
                                value={newAllowance.paymentAmount || ""}
                                onChange={e =>
                                    setAllowanceBaseAmount(Number.parseFloat(e.target.value) || 0)
                                }
                                className="h-12"
                            />
                        </div>

                        {/* Monthly Amounts Table */}
                        <div className="space-y-3">
                            <div className="text-center">
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                    Enter amount for each month.
                                </p>
                                <h3 className="text-lg font-medium text-gray-900 dark:text-foreground">
                                    Monthly Breakdown:
                                </h3>
                            </div>

                            <div className="overflow-x-auto rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-brand-600 hover:bg-brand-600">
                                            <TableHead className="text-white text-center py-3 font-medium">
                                                Jan
                                            </TableHead>
                                            <TableHead className="text-white text-center py-3 font-medium">
                                                Feb
                                            </TableHead>
                                            <TableHead className="text-white text-center py-3 font-medium">
                                                Mar
                                            </TableHead>
                                            <TableHead className="text-white text-center py-3 font-medium">
                                                Apr
                                            </TableHead>
                                            <TableHead className="text-white text-center py-3 font-medium">
                                                May
                                            </TableHead>
                                            <TableHead className="text-white text-center py-3 font-medium">
                                                Jun
                                            </TableHead>
                                            <TableHead className="text-white text-center py-3 font-medium">
                                                Jul
                                            </TableHead>
                                            <TableHead className="text-white text-center py-3 font-medium">
                                                Aug
                                            </TableHead>
                                            <TableHead className="text-white text-center py-3 font-medium">
                                                Sep
                                            </TableHead>
                                            <TableHead className="text-white text-center py-3 font-medium">
                                                Oct
                                            </TableHead>
                                            <TableHead className="text-white text-center py-3 font-medium">
                                                Nov
                                            </TableHead>
                                            <TableHead className="text-white text-center py-3 font-medium">
                                                Dec
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        <TableRow className="hover:bg-gray-50 dark:hover:bg-gray-800">
                                            {[
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
                                            ].map(month => (
                                                <TableCell key={month} className="text-center p-2">
                                                    <Input
                                                        type="number"
                                                        placeholder="0"
                                                        value={
                                                            newAllowance.monthlyAmounts?.[month] ||
                                                            ""
                                                        }
                                                        onChange={e =>
                                                            updateAllowanceMonthlyAmount(
                                                                month,
                                                                Number.parseFloat(e.target.value) ||
                                                                    0,
                                                            )
                                                        }
                                                        className="w-full text-center border-0 bg-transparent focus:bg-white dark:focus:bg-gray-800 rounded-md h-10 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors px-1"
                                                    />
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="gap-2">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setIsAllowanceModalOpen(false);
                                setEditingAllowanceId(null);
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={saveAllowance}
                            disabled={!newAllowance.paymentTypeName}
                            className="bg-brand-600 hover:bg-brand-700 text-white"
                        >
                            {editingAllowanceId ? "Update Allowance" : "Add Allowance"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Dialog>
    );
}
