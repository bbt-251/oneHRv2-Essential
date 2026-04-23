import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useData } from "@/context/app-data-context";
import { useToast } from "@/context/toastContext";
import { ModuleSettingsRepository as settingsService } from "@/lib/repository/hr-settings";
import { PensionModel } from "@/lib/models/hr-settings";
import { Loader2, PiggyBank } from "lucide-react";
import { useState } from "react";

export function Pension() {
    const { pension: pensionSettings } = useData();
    const pension = pensionSettings?.at(0) || null;
    const { showToast } = useToast();
    const [isAddEditLoading, setIsAddEditLoading] = useState<boolean>(false);
    const [employeeContributionDraft, setEmployeeContributionDraft] = useState<number | null>(null);
    const [employerContributionDraft, setEmployerContributionDraft] = useState<number | null>(null);
    const employeeContribution = employeeContributionDraft ?? pension?.employeePension ?? 0;
    const employerContribution = employerContributionDraft ?? pension?.employerPension ?? 0;

    const handleSave = async () => {
        setIsAddEditLoading(true);

        const newData: Omit<PensionModel, "id"> = {
            employerPensionType: "Percentage",
            employerPension: employerContribution,
            employeePensionType: "Percentage",
            employeePension: employeeContribution,
        };

        if (pension) {
            const res = await settingsService.update("pension", pension.id, newData);
            if (res) {
                showToast("Pension updated successfully", "Success", "success");
            } else {
                showToast("Error updating pension", "Error", "error");
            }
        } else {
            const res = await settingsService.create("pension", newData);
            if (res) {
                showToast("Pension created successfully", "Success", "success");
            } else {
                showToast("Error creating pension", "Error", "error");
            }
        }
        setIsAddEditLoading(false);
    };

    const handleReset = () => {
        setEmployeeContributionDraft(null);
        setEmployerContributionDraft(null);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <PiggyBank className="h-5 w-5 text-amber-600" />
                    Pension Configuration
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <h4 className="font-semibold text-gray-900 dark:text-white">
                            Employee Contribution
                        </h4>
                        <div className="space-y-3">
                            <div className="flex items-center">
                                <Input
                                    type="number"
                                    min="0"
                                    step="0.1"
                                    value={employeeContribution}
                                    onChange={e =>
                                        setEmployeeContributionDraft(
                                            Number.parseFloat(e.target.value) || 0,
                                        )
                                    }
                                    placeholder="Enter employee contribution percentage"
                                    className="w-full"
                                />
                                <span className="ml-2">%</span>
                            </div>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <h4 className="font-semibold text-gray-900 dark:text-white">
                            Employer Contribution
                        </h4>
                        <div className="space-y-3">
                            <div className="flex items-center">
                                <Input
                                    type="number"
                                    min="0"
                                    step="0.1"
                                    value={employerContribution}
                                    onChange={e =>
                                        setEmployerContributionDraft(
                                            Number.parseFloat(e.target.value) || 0,
                                        )
                                    }
                                    placeholder="Enter employer contribution percentage"
                                    className="w-full"
                                />
                                <span className="ml-2">%</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end space-x-2 pt-4 border-t">
                    <Button type="button" variant="outline" onClick={handleReset}>
                        Reset
                    </Button>
                    <Button
                        type="button"
                        onClick={handleSave}
                        className="bg-amber-600 hover:bg-amber-700"
                    >
                        {isAddEditLoading ? (
                            <div className="flex items-center justify-center gap-2">
                                <Loader2 className="animate-spin h-4 w-4" />
                                Saving...
                            </div>
                        ) : (
                            "Save Configuration"
                        )}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
