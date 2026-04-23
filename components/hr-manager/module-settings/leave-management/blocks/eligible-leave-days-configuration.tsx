"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { useTheme } from "@/components/theme-provider";
import { Clock } from "lucide-react";
import { useData } from "@/context/app-data-context";
import {
    EligibleLeaveDaysModel,
    ModuleSettingsRepository as settingsService,
} from "@/lib/repository/hr-settings";
import { useToast } from "@/context/toastContext";
import { LEAVE_MANAGEMENT_LOG_MESSAGES } from "@/lib/log-descriptions/leave-management";
import { useAuth } from "@/context/authContext";

// Leave Types Component

export default function EligibleLeaveDaysConfiguration() {
    const { theme } = useTheme();
    const { eligibleLeaveDays } = useData();
    const { showToast } = useToast();
    const { userData } = useAuth();

    const [formData, setFormData] = useState<Omit<EligibleLeaveDaysModel, "id">>({
        numberOfYears: eligibleLeaveDays?.[0]?.numberOfYears,
        numberOfDays: eligibleLeaveDays?.[0]?.numberOfDays,
        createdAt: eligibleLeaveDays?.[0]?.createdAt,
        updatedAt: eligibleLeaveDays?.[0]?.updatedAt,
    });

    const handleSave = () => {
        // required fields validation
        if (!formData.numberOfYears || !formData.numberOfDays) {
            showToast("Please fill in all required fields", "error", "error");
            return;
        }
        if (eligibleLeaveDays.length > 0) {
            settingsService.update(
                "eligibleLeaveDays",
                eligibleLeaveDays[0].id,
                formData,
                userData?.uid,
                LEAVE_MANAGEMENT_LOG_MESSAGES.ELIGIBLE_LEAVE_DAYS_UPDATED({
                    numberOfYears: formData.numberOfYears,
                    numberOfDays: formData.numberOfDays,
                }),
            );
        } else {
            settingsService.create(
                "eligibleLeaveDays",
                formData,
                userData?.uid,
                LEAVE_MANAGEMENT_LOG_MESSAGES.ELIGIBLE_LEAVE_DAYS_UPDATED({
                    numberOfYears: formData.numberOfYears,
                    numberOfDays: formData.numberOfDays,
                }),
            );
        }
        showToast("Eligible Leave Days Configuration saved successfully", "success", "success");
    };

    return (
        <Card
            className={`${theme === "dark" ? "bg-black " : "bg-white/80 backdrop-blur-sm"} shadow-2xl rounded-2xl overflow-hidden`}
        >
            <CardHeader
                className={`${theme === "dark" ? "bg-black text-white" : "bg-amber-800 border-gray-200"} rounded-t-2xl`}
            >
                <CardTitle className={`flex items-center gap-2 text-white`}>
                    <Clock className="h-5 w-5 text-amber-600" />
                    Eligible Leave Days Configuration
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 mt-4">
                <div className="max-w-2xl space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <Label htmlFor="createdAt" className="text-red-500">
                                * Created At :
                            </Label>
                            <Input
                                id="createdAt"
                                value={formData.createdAt}
                                className="mt-1"
                                readOnly
                                disabled={true}
                            />
                        </div>

                        <div>
                            <Label htmlFor="updatedAt" className="text-red-500">
                                * Updated At :
                            </Label>
                            <Input
                                id="updatedAt"
                                value={formData.updatedAt}
                                className="mt-1"
                                readOnly
                                disabled={true}
                            />
                        </div>
                    </div>

                    <div>
                        <Label htmlFor="numberOfYears" className="text-red-500">
                            * Number of Years :
                        </Label>
                        <Input
                            id="numberOfYears"
                            type="number"
                            min="1"
                            value={formData.numberOfYears}
                            onChange={e =>
                                setFormData(prev => ({
                                    ...prev,
                                    numberOfYears: Number.parseInt(e.target.value) || 1,
                                }))
                            }
                            className="mt-1 max-w-xs"
                        />
                        <p className="text-sm text-gray-500 mt-1">
                            representing the number of years required for the ELD to be increased
                        </p>
                    </div>

                    <div>
                        <Label htmlFor="numberOfDays" className="text-red-500">
                            * Number of Days :
                        </Label>
                        <Input
                            id="numberOfDays"
                            type="number"
                            min="1"
                            value={formData.numberOfDays}
                            onChange={e =>
                                setFormData(prev => ({
                                    ...prev,
                                    numberOfDays: Number.parseInt(e.target.value) || 1,
                                }))
                            }
                            className="mt-1 max-w-xs"
                        />
                        <p className="text-sm text-gray-500 mt-1">
                            representing the number of days that will be added in the current ELD
                        </p>
                    </div>

                    <div className="flex justify-end pt-4">
                        <Button
                            onClick={handleSave}
                            className="bg-gray-700 hover:bg-gray-800 text-white px-8"
                        >
                            Save
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
