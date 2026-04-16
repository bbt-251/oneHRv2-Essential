import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { LoanTypeModel } from "@/lib/models/hr-settings";
import { Loader2 } from "lucide-react";

interface LoanTypeFormProps {
    data?: LoanTypeModel;
    isAddEditLoading: boolean;
    onSave: (data: LoanTypeModel) => void;
    onCancel: () => void;
}

export function LoanTypeForm({ data, isAddEditLoading, onSave, onCancel }: LoanTypeFormProps) {
    const [formData, setFormData] = useState<LoanTypeModel>(
        data || {
            id: "",
            loanName: "",
            loanInterestRate: 0,
            marketInterestRate: 0,
            active: true,
            timestamp: new Date().toISOString(),
        },
    );

    const [errors, setErrors] = useState<Record<string, string>>({});

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.loanName.trim()) {
            newErrors.loanName = "Loan name is required";
        }

        if (formData.loanInterestRate < 0) {
            newErrors.loanInterestRate = "Loan interest rate must be non-negative";
        }

        if (formData.marketInterestRate < 0) {
            newErrors.marketInterestRate = "Market interest rate must be non-negative";
        }

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

    const handleInputChange = (field: keyof LoanTypeModel, value: any) => {
        setFormData({ ...formData, [field]: value });
        if (errors[field]) {
            setErrors({ ...errors, [field]: "" });
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
                <Label htmlFor="loanName">
                    Loan Name <span className="text-red-500">*</span>
                </Label>
                <Input
                    id="loanName"
                    value={formData.loanName}
                    onChange={e => handleInputChange("loanName", e.target.value)}
                    placeholder="Enter loan name"
                    className={errors.loanName ? "border-red-500" : ""}
                />
                {errors.loanName && <p className="text-sm text-red-500">{errors.loanName}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="loanInterestRate">
                        Loan Interest Rate (%) <span className="text-red-500">*</span>
                    </Label>
                    <Input
                        id="loanInterestRate"
                        type="number"
                        min="0"
                        step="0.1"
                        value={formData.loanInterestRate}
                        onChange={e =>
                            handleInputChange(
                                "loanInterestRate",
                                Number.parseFloat(e.target.value) || 0,
                            )
                        }
                        placeholder="Enter loan interest rate"
                        className={errors.loanInterestRate ? "border-red-500" : ""}
                    />
                    {errors.loanInterestRate && (
                        <p className="text-sm text-red-500">{errors.loanInterestRate}</p>
                    )}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="marketInterestRate">
                        Market Interest Rate (%) <span className="text-red-500">*</span>
                    </Label>
                    <Input
                        id="marketInterestRate"
                        type="number"
                        min="0"
                        step="0.1"
                        value={formData.marketInterestRate}
                        onChange={e =>
                            handleInputChange(
                                "marketInterestRate",
                                Number.parseFloat(e.target.value) || 0,
                            )
                        }
                        placeholder="Enter market interest rate"
                        className={errors.marketInterestRate ? "border-red-500" : ""}
                    />
                    {errors.marketInterestRate && (
                        <p className="text-sm text-red-500">{errors.marketInterestRate}</p>
                    )}
                </div>
            </div>

            <div className="flex items-center space-x-2">
                <Switch
                    id="active"
                    checked={formData.active}
                    onCheckedChange={checked => handleInputChange("active", checked)}
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
                        `${data ? "Update Loan Type" : "Add Loan Type"}`
                    )}
                </Button>
            </div>
        </form>
    );
}
