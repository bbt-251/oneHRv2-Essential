import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Edit, Loader2, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { TaxModel, TaxPercentageModel } from "@/lib/models/hr-settings";

interface TaxObligationFormProps {
    data?: TaxModel;
    isAddEditLoading: boolean;
    onSave: (data: TaxModel) => void;
    onCancel: () => void;
}

export function TaxObligationForm({
    data,
    isAddEditLoading,
    onSave,
    onCancel,
}: TaxObligationFormProps) {
    const [formData, setFormData] = useState<TaxModel>(
        data || {
            id: "",
            taxName: "",
            active: true,
            taxRates: [{ upperBound: 0, percentage: 0 }],
            upperTaxRate: 0,
            timestamp: new Date().toISOString(),
        },
    );

    const [errors, setErrors] = useState<Record<string, string>>({});

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.taxName.trim()) {
            newErrors.taxName = "Name is required";
        }

        if (formData.upperTaxRate < 0 || formData.upperTaxRate > 100) {
            newErrors.upperTaxRate = "Upper tax rate must be between 0 and 100";
        }

        formData.taxRates.forEach((bracket, index) => {
            if (bracket.upperBound < 0) {
                newErrors[`bracket_${index}_upperBound`] = "Upper bound must be non-negative";
            }
            if (bracket.percentage < 0 || bracket.percentage > 100) {
                newErrors[`bracket_${index}_percentage`] = "Percentage must be between 0 and 100";
            }
        });

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (validateForm()) {
            const saveData = {
                ...formData,
                timestamp: data ? formData.timestamp : new Date().toISOString(),
            };
            onSave(saveData);
        }
    };

    const handleInputChange = (field: keyof TaxModel, value: any) => {
        setFormData({ ...formData, [field]: value });
        if (errors[field]) {
            setErrors({ ...errors, [field]: "" });
        }
    };

    const handleBracketChange = (index: number, field: keyof TaxPercentageModel, value: any) => {
        const updatedBrackets = [...formData.taxRates];
        updatedBrackets[index] = { ...updatedBrackets[index], [field]: value };
        setFormData({ ...formData, taxRates: updatedBrackets });

        const errorKey = `bracket_${index}_${field}`;
        if (errors[errorKey]) {
            setErrors({ ...errors, [errorKey]: "" });
        }
    };

    const addTaxBracket = () => {
        const newBracket: TaxPercentageModel = {
            upperBound: 0,
            percentage: 0,
        };
        setFormData({
            ...formData,
            taxRates: [...formData.taxRates, newBracket],
        });
    };

    const removeTaxBracket = (index: number) => {
        if (formData.taxRates.length > 1) {
            const updatedBrackets = formData.taxRates.filter((_, i) => i !== index);
            setFormData({ ...formData, taxRates: updatedBrackets });
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="taxName">
                        Tax Obligation Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                        id="taxName"
                        value={formData.taxName}
                        onChange={e => handleInputChange("taxName", e.target.value)}
                        placeholder="Enter tax obligation taxName"
                        className={errors.taxName ? "border-red-500" : ""}
                    />
                    {errors.taxName && <p className="text-sm text-red-500">{errors.taxName}</p>}
                </div>
                <div className="flex items-center space-x-2 pt-6">
                    <Switch
                        id="active"
                        checked={formData.active}
                        onCheckedChange={checked => handleInputChange("active", checked)}
                    />
                    <Label htmlFor="active">Active</Label>
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <Label className="text-base font-medium">Tax Brackets</Label>
                    <Button
                        type="button"
                        onClick={addTaxBracket}
                        className="bg-amber-600 hover:bg-amber-700"
                        size="sm"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Tax Rate
                    </Button>
                </div>

                <div className="space-y-3">
                    {formData.taxRates.map((bracket, index) => (
                        <div
                            key={index}
                            className="flex items-center gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                        >
                            <div className="flex-1 space-y-2">
                                <Label htmlFor={`upperBound_${index}`}>Upper Bound:</Label>
                                <Input
                                    id={`upperBound_${index}`}
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={bracket.upperBound}
                                    onChange={e =>
                                        handleBracketChange(
                                            index,
                                            "upperBound",
                                            Number.parseFloat(e.target.value) || 0,
                                        )
                                    }
                                    placeholder="Enter upper bound"
                                    className={
                                        errors[`bracket_${index}_upperBound`]
                                            ? "border-red-500"
                                            : ""
                                    }
                                />
                                {errors[`bracket_${index}_upperBound`] && (
                                    <p className="text-sm text-red-500">
                                        {errors[`bracket_${index}_upperBound`]}
                                    </p>
                                )}
                            </div>
                            <div className="flex-1 space-y-2">
                                <Label htmlFor={`percentage_${index}`}>Percentage:</Label>
                                <Input
                                    id={`percentage_${index}`}
                                    type="number"
                                    min="0"
                                    max="100"
                                    step="0.1"
                                    value={bracket.percentage}
                                    onChange={e =>
                                        handleBracketChange(
                                            index,
                                            "percentage",
                                            Number.parseFloat(e.target.value) || 0,
                                        )
                                    }
                                    placeholder="Enter percentage"
                                    className={
                                        errors[`bracket_${index}_percentage`]
                                            ? "border-red-500"
                                            : ""
                                    }
                                />
                                {errors[`bracket_${index}_percentage`] && (
                                    <p className="text-sm text-red-500">
                                        {errors[`bracket_${index}_percentage`]}
                                    </p>
                                )}
                            </div>
                            {formData.taxRates.length > 1 && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeTaxBracket(index)}
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50 mt-6"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="upperTaxRate">Upper Tax Rate (%)</Label>
                <Input
                    id="upperTaxRate"
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={formData.upperTaxRate}
                    onChange={e =>
                        handleInputChange("upperTaxRate", Number.parseFloat(e.target.value) || 0)
                    }
                    placeholder="Enter upper tax rate"
                    className={errors.upperTaxRate ? "border-red-500" : ""}
                />
                <p className="text-sm text-gray-500">
                    This is the percentage that will be applied to the upper bound of the tax
                    bracket. If the tax system is flat, use this to set the fixed percentage.
                </p>
                {errors.upperTaxRate && (
                    <p className="text-sm text-red-500">{errors.upperTaxRate}</p>
                )}
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
                        `${data ? "Update Tax" : "Add Tax"}`
                    )}
                </Button>
            </div>
        </form>
    );
}

export interface TaxObligationViewProps {
    data: TaxModel;
    onClose: () => void;
    onEdit: () => void;
}

export function TaxObligationView({ data, onClose, onEdit }: TaxObligationViewProps) {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                    <div>
                        <Label className="text-sm font-medium text-gray-500">
                            Tax Obligation Name
                        </Label>
                        <p className="text-lg font-semibold">{data.taxName}</p>
                    </div>
                    <div>
                        <Label className="text-sm font-medium text-gray-500">Status</Label>
                        <Badge variant={data.active ? "default" : "secondary"}>
                            {data.active ? "Active" : "Inactive"}
                        </Badge>
                    </div>
                    <div>
                        <Label className="text-sm font-medium text-gray-500">Upper Tax Rate</Label>
                        <p className="text-lg">{data.upperTaxRate}%</p>
                    </div>
                </div>
                <div className="space-y-4">
                    <div>
                        <Label className="text-sm font-medium text-gray-500">
                            Total Tax Brackets
                        </Label>
                        <p className="text-lg">{data.taxRates.length}</p>
                    </div>
                    <div>
                        <Label className="text-sm font-medium text-gray-500">Created</Label>
                        <p className="text-lg">{new Date(data.timestamp).toLocaleDateString()}</p>
                        <p className="text-sm text-gray-500">
                            {new Date(data.timestamp).toLocaleTimeString()}
                        </p>
                    </div>
                </div>
            </div>

            <div className="space-y-3">
                <Label className="text-base font-medium">Tax Brackets</Label>
                <div className="space-y-2">
                    {data.taxRates.map((bracket, index) => (
                        <div
                            key={index}
                            className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-900 rounded-lg"
                        >
                            <span className="text-sm">
                                Bracket {index + 1}: Up to {bracket.upperBound.toLocaleString()} ETB
                            </span>
                            <Badge variant="outline">{bracket.percentage}%</Badge>
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4 border-t">
                <Button variant="outline" onClick={onClose}>
                    Close
                </Button>
                <Button onClick={onEdit} className="bg-amber-600 hover:bg-amber-700">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                </Button>
            </div>
        </div>
    );
}
