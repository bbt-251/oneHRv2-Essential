import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { DeductionTypeModel } from "@/lib/models/hr-settings";
import { Loader2 } from "lucide-react";

interface DeductionTypeFormProps {
    data?: DeductionTypeModel;
    isAddEditLoading: boolean;
    onSave: (data: DeductionTypeModel) => void;
    onCancel: () => void;
}

export function DeductionTypeForm({
    data,
    isAddEditLoading,
    onSave,
    onCancel,
}: DeductionTypeFormProps) {
    const [formData, setFormData] = useState<DeductionTypeModel>(
        data || {
            id: "",
            deductionName: "",
            active: true,
        },
    );

    const [errors, setErrors] = useState<Record<string, string>>({});

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.deductionName.trim()) {
            newErrors.deductionName = "Name is required";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (validateForm()) {
            const saveData = {
                ...formData,
            };
            onSave(saveData);
        }
    };

    const handleInputChange = (field: keyof DeductionTypeModel, value: any) => {
        setFormData({ ...formData, [field]: value });
        if (errors[field]) {
            setErrors({ ...errors, [field]: "" });
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
                <Label htmlFor="deductionName">
                    Name <span className="text-red-500">*</span>
                </Label>
                <Input
                    id="deductionName"
                    value={formData.deductionName}
                    onChange={e => handleInputChange("deductionName", e.target.value)}
                    placeholder="Enter deduction type deductionName"
                    className={errors.deductionName ? "border-red-500" : ""}
                />
                {errors.deductionName && (
                    <p className="text-sm text-red-500">{errors.deductionName}</p>
                )}
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
                        `${data ? "Update Deduction Type" : "Add Deduction Type"}`
                    )}
                </Button>
            </div>
        </form>
    );
}
