import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { PaymentTypeModel } from "@/lib/models/hr-settings";
import { Loader2, Plus } from "lucide-react";

type PaymentFieldValue = PaymentTypeModel[keyof PaymentTypeModel];

interface PaymentTypeFormProps {
    data?: PaymentTypeModel;
    isAddEditLoading: boolean;
    onSave: (data: PaymentTypeModel) => void;
    onCancel: () => void;
}

export function PaymentTypeForm({
    data,
    isAddEditLoading,
    onSave,
    onCancel,
}: PaymentTypeFormProps) {
    const predefinedTypes = [
        "Fixed",
        "Variable",
        "Bonus",
        "Allowance",
        "Commission",
        "Overtime",
        "Fringe Benefits",
        "Severance Pay",
        "Annual Leave",
    ];

    const [formData, setFormData] = useState<PaymentTypeModel>(
        data || {
            id: "",
            paymentName: "",
            paymentType: "",
            taxabilityThresholdType: "Percentage",
            taxabilityThresholdAmount: 0,
            taxabilityThresholdValue: 0,
            active: true,
        },
    );

    const [isCustom, setIsCustom] = useState<boolean>(
        data ? !predefinedTypes.includes(data.paymentType) : false,
    );

    // Check if payment type is Fringe Benefit, Bonus, Severance Pay, or Annual Leave
    const isFringeBenefit = formData.paymentType === "Fringe Benefits";
    const isBonus = formData.paymentType === "Bonus";
    const isSeverancePay = formData.paymentType === "Severance Pay";
    const isAnnualLeave = formData.paymentType === "Annual Leave";
    const hideTaxabilityFields = isFringeBenefit || isBonus || isSeverancePay || isAnnualLeave;

    const [customTypes, setCustomTypes] = useState<string[]>(
        data && !predefinedTypes.includes(data.paymentType) ? [data.paymentType] : [],
    );

    const [errors, setErrors] = useState<Record<string, string>>({});

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.paymentName.trim()) {
            newErrors.paymentName = "Payment Name is required";
        }

        if (!isCustom && !formData.paymentType.trim()) {
            newErrors.paymentType = "Payment Type is required";
        }

        if (formData.taxabilityThresholdAmount < 0) {
            newErrors.taxabilityThresholdAmount = "Threshold amount must be non-negative";
        }

        if (
            (formData.taxabilityThresholdType === "Percentage" ||
                formData.taxabilityThresholdType === "PercentageWithValue") &&
            formData.taxabilityThresholdAmount > 100
        ) {
            newErrors.taxabilityThresholdAmount = "Percentage cannot exceed 100%";
        }

        if (
            formData.taxabilityThresholdType === "PercentageWithValue" &&
            (formData.taxabilityThresholdValue ?? 0) < 0
        ) {
            newErrors.taxabilityThresholdValue = "Fixed value threshold must be non-negative";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (validateForm()) {
            // If payment type is Bonus, Fringe Benefits, Severance Pay, or Annual Leave, set threshold to N/A
            const dataToSave = { ...formData };
            if (isFringeBenefit || isBonus || isSeverancePay || isAnnualLeave) {
                dataToSave.taxabilityThresholdType = "N/A";
                dataToSave.taxabilityThresholdAmount = 0;
                dataToSave.taxabilityThresholdValue = 0;
            }
            onSave(dataToSave);
        }
    };

    const handleInputChange = (field: keyof PaymentTypeModel, value: PaymentFieldValue) => {
        setFormData({ ...formData, [field]: value });
        // Clear error when user starts typing
        if (errors[field]) {
            setErrors({ ...errors, [field]: "" });
        }
    };

    const handleAddCustomType = () => {
        if (formData.paymentType.trim() && !customTypes.includes(formData.paymentType.trim())) {
            setCustomTypes([...customTypes, formData.paymentType.trim()]);
            handleInputChange("paymentType", "");
            setIsCustom(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="paymentName">
                        Payment Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                        id="paymentName"
                        value={formData.paymentName}
                        onChange={e => handleInputChange("paymentName", e.target.value)}
                        placeholder="Enter payment name"
                        className={errors.paymentName ? "border-red-500" : ""}
                    />
                    {errors.paymentName && (
                        <p className="text-sm text-red-500">{errors.paymentName}</p>
                    )}
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="paymentType">
                    Payment Type <span className="text-red-500">*</span>
                </Label>
                <div className="flex gap-2">
                    <Select
                        value={isCustom ? "" : formData.paymentType}
                        onValueChange={value => {
                            if (value === "custom") {
                                setIsCustom(true);
                                handleInputChange("paymentType", "");
                            } else {
                                setIsCustom(false);
                                handleInputChange("paymentType", value);
                            }
                        }}
                    >
                        <SelectTrigger
                            className={`flex-1 ${errors.paymentType ? "border-red-500" : ""}`}
                        >
                            <SelectValue placeholder="Select payment type" />
                        </SelectTrigger>
                        <SelectContent>
                            {/* Predefined Types - visually distinguished */}
                            <SelectItem
                                value="Fixed"
                                className="hover:bg-amber-50 dark:hover:bg-amber-900/30 bg-amber-50/50 dark:bg-amber-900/20 font-medium"
                            >
                                <div className="flex items-center gap-2">
                                    <span className="text-amber-600 dark:text-amber-400">★</span>
                                    Fixed
                                </div>
                            </SelectItem>
                            <SelectItem
                                value="Variable"
                                className="hover:bg-amber-50 dark:hover:bg-amber-900/30 bg-amber-50/50 dark:bg-amber-900/20 font-medium"
                            >
                                <div className="flex items-center gap-2">
                                    <span className="text-amber-600 dark:text-amber-400">★</span>
                                    Variable
                                </div>
                            </SelectItem>
                            <SelectItem
                                value="Bonus"
                                className="hover:bg-amber-50 dark:hover:bg-amber-900/30 bg-amber-50/50 dark:bg-amber-900/20 font-medium"
                            >
                                <div className="flex items-center gap-2">
                                    <span className="text-amber-600 dark:text-amber-400">★</span>
                                    Bonus
                                </div>
                            </SelectItem>
                            <SelectItem
                                value="Allowance"
                                className="hover:bg-amber-50 dark:hover:bg-amber-900/30 bg-amber-50/50 dark:bg-amber-900/20 font-medium"
                            >
                                <div className="flex items-center gap-2">
                                    <span className="text-amber-600 dark:text-amber-400">★</span>
                                    Allowance
                                </div>
                            </SelectItem>
                            <SelectItem
                                value="Commission"
                                className="hover:bg-amber-50 dark:hover:bg-amber-900/30 bg-amber-50/50 dark:bg-amber-900/20 font-medium"
                            >
                                <div className="flex items-center gap-2">
                                    <span className="text-amber-600 dark:text-amber-400">★</span>
                                    Commission
                                </div>
                            </SelectItem>
                            <SelectItem
                                value="Overtime"
                                className="hover:bg-amber-50 dark:hover:bg-amber-900/30 bg-amber-50/50 dark:bg-amber-900/20 font-medium"
                            >
                                <div className="flex items-center gap-2">
                                    <span className="text-amber-600 dark:text-amber-400">★</span>
                                    Overtime
                                </div>
                            </SelectItem>
                            <SelectItem
                                value="Fringe Benefits"
                                className="hover:bg-amber-50 dark:hover:bg-amber-900/30 bg-amber-50/50 dark:bg-amber-900/20 font-medium"
                            >
                                <div className="flex items-center gap-2">
                                    <span className="text-amber-600 dark:text-amber-400">★</span>
                                    Fringe Benefits
                                </div>
                            </SelectItem>
                            <SelectItem
                                value="Severance Pay"
                                className="hover:bg-amber-50 dark:hover:bg-amber-900/30 bg-amber-50/50 dark:bg-amber-900/20 font-medium"
                            >
                                <div className="flex items-center gap-2">
                                    <span className="text-amber-600 dark:text-amber-400">★</span>
                                    Severance Pay
                                </div>
                            </SelectItem>
                            <SelectItem
                                value="Annual Leave"
                                className="hover:bg-amber-50 dark:hover:bg-amber-900/30 bg-amber-50/50 dark:bg-amber-900/20 font-medium"
                            >
                                <div className="flex items-center gap-2">
                                    <span className="text-amber-600 dark:text-amber-400">★</span>
                                    Annual Leave
                                </div>
                            </SelectItem>
                            {/* Separator */}
                            <div className="h-px bg-gray-200 dark:bg-gray-700 my-1" />
                            {/* User-Created Custom Types */}
                            {customTypes.map(type => (
                                <SelectItem key={type} value={type}>
                                    {type}
                                </SelectItem>
                            ))}
                            <SelectItem value="custom">+ Add New Type</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                {isCustom && (
                    <div className="mt-2 flex gap-2">
                        <Input
                            placeholder="Enter new payment type"
                            value={formData.paymentType}
                            onChange={e => {
                                handleInputChange("paymentType", e.target.value);
                            }}
                            onKeyDown={e => {
                                if (e.key === "Enter") {
                                    handleAddCustomType();
                                }
                            }}
                            className="flex-1"
                            autoFocus
                        />
                        <Button
                            type="button"
                            onClick={handleAddCustomType}
                            className="bg-amber-600 hover:bg-amber-700"
                            size="sm"
                        >
                            <Plus className="h-4 w-4" />
                        </Button>
                    </div>
                )}
                {errors.paymentType && <p className="text-sm text-red-500">{errors.paymentType}</p>}
            </div>

            {/* Taxability Threshold Fields - Hidden for Fringe Benefits and Bonus */}
            {!hideTaxabilityFields && (
                <>
                    <div className="space-y-2">
                        <Label htmlFor="taxabilityThresholdType">Taxability Threshold Type</Label>
                        <Select
                            value={formData.taxabilityThresholdType}
                            onValueChange={(
                                value: "Percentage" | "Value" | "PercentageWithValue",
                            ) => handleInputChange("taxabilityThresholdType", value)}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="N/A">N/A</SelectItem>
                                <SelectItem value="Percentage">Percentage</SelectItem>
                                <SelectItem value="Value">Value</SelectItem>
                                <SelectItem value="PercentageWithValue">
                                    Percentage with Value
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="taxabilityThresholdAmount">
                            Threshold Amount{" "}
                            {formData.taxabilityThresholdType === "Percentage"
                                ? "(%)"
                                : formData.taxabilityThresholdType === "PercentageWithValue"
                                    ? "(%)"
                                    : ""}
                        </Label>
                        <Input
                            id="taxabilityThresholdAmount"
                            type="number"
                            min="0"
                            max={
                                formData.taxabilityThresholdType === "Percentage" ||
                                formData.taxabilityThresholdType === "PercentageWithValue"
                                    ? "100"
                                    : undefined
                            }
                            step={
                                formData.taxabilityThresholdType === "Percentage" ||
                                formData.taxabilityThresholdType === "PercentageWithValue"
                                    ? "0.1"
                                    : "1"
                            }
                            value={formData.taxabilityThresholdAmount}
                            onChange={e =>
                                handleInputChange(
                                    "taxabilityThresholdAmount",
                                    Number.parseFloat(e.target.value) || 0,
                                )
                            }
                            placeholder={`Enter ${
                                formData.taxabilityThresholdType === "Percentage" ||
                                formData.taxabilityThresholdType === "PercentageWithValue"
                                    ? "percentage"
                                    : "amount"
                            }`}
                            className={errors.taxabilityThresholdAmount ? "border-red-500" : ""}
                        />
                        {errors.taxabilityThresholdAmount && (
                            <p className="text-sm text-red-500">
                                {errors.taxabilityThresholdAmount}
                            </p>
                        )}
                    </div>
                </>
            )}

            {formData.taxabilityThresholdType === "PercentageWithValue" && (
                <>
                    <div className="space-y-2">
                        <Label htmlFor="taxabilityThresholdValue">Fixed Value Threshold</Label>
                        <Input
                            id="taxabilityThresholdValue"
                            type="number"
                            min="0"
                            step="1"
                            value={formData.taxabilityThresholdValue || 0}
                            onChange={e =>
                                handleInputChange(
                                    "taxabilityThresholdValue",
                                    Number.parseFloat(e.target.value) || 0,
                                )
                            }
                            placeholder="Enter fixed value threshold"
                            className={errors.taxabilityThresholdValue ? "border-red-500" : ""}
                        />
                        {errors.taxabilityThresholdValue && (
                            <p className="text-sm text-red-500">
                                {errors.taxabilityThresholdValue}
                            </p>
                        )}
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-3">
                        <p className="text-sm text-blue-800 dark:text-blue-200">
                            <strong>How it works:</strong> The payment will be tax-free up to the
                            lesser of:
                            <br />• {formData.taxabilityThresholdAmount}% of the employee&apos;s
                            base salary, OR
                            <br />• {formData.taxabilityThresholdValue || 0} (whichever is smaller)
                            <br />
                            <br />
                            Any amount above this threshold will be added to taxable income.
                        </p>
                    </div>
                </>
            )}

            <div className="flex items-center space-x-2">
                <Switch
                    id="active"
                    checked={formData.active}
                    onCheckedChange={checked => handleInputChange("active", checked)}
                    className={formData.active ? "bg-amber-600" : ""}
                />
                <Label htmlFor="active">Active</Label>
            </div>

            <div className="flex justify-end space-x-2 pt-4 border-t">
                <Button type="button" variant="outline" onClick={onCancel}>
                    Cancel
                </Button>
                <Button type="submit" className="bg-amber-600 hover:bg-amber-700">
                    {isAddEditLoading ? (
                        <div className="flex items-center justify-center gap-2">
                            <Loader2 className="animate-spin h-4 w-4" />
                            {data ? "Updating..." : "Adding..."}
                        </div>
                    ) : (
                        `${data ? "Update Payment Type" : "Add Payment Type"}`
                    )}
                </Button>
            </div>
        </form>
    );
}
