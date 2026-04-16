"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { useFirestore } from "@/context/firestore-context";
import { useToast } from "@/context/toastContext";
import {
    AccrualConfigurationModel,
    hrSettingsService,
} from "@/lib/backend/firebase/hrSettingsService";
import { LEAVE_MANAGEMENT_LOG_MESSAGES } from "@/lib/log-descriptions/leave-management";
import { useAuth } from "@/context/authContext";

export default function AccrualConfiguration() {
    const { theme } = useTheme();
    const { hrSettings } = useFirestore();
    const { showToast } = useToast();
    const { userData } = useAuth();
    const accrualConfiguration = hrSettings.accrualConfigurations;
    const [formData, setFormData] = useState<Omit<AccrualConfigurationModel, "id">>({
        limitUnusedDays: accrualConfiguration?.[0]?.limitUnusedDays,
        limitMonths: accrualConfiguration?.[0]?.limitMonths,
    });

    const handleSave = () => {
        if (accrualConfiguration && accrualConfiguration.length > 0) {
            hrSettingsService
                .update(
                    "accrualConfigurations",
                    accrualConfiguration[0].id,
                    formData,
                    userData?.uid,
                    LEAVE_MANAGEMENT_LOG_MESSAGES.ACCRUAL_CONFIGURATION_UPDATED({
                        limitUnusedDays: formData.limitUnusedDays,
                        limitMonths: formData.limitMonths,
                    }),
                )
                .catch(error => {
                    console.error("Error updating accrual configuration:", error);
                    showToast("Failed to update accrual configuration", "error", "error");
                });
        } else {
            hrSettingsService
                .create(
                    "accrualConfigurations",
                    formData,
                    userData?.uid,
                    LEAVE_MANAGEMENT_LOG_MESSAGES.ACCRUAL_CONFIGURATION_UPDATED({
                        limitUnusedDays: formData.limitUnusedDays,
                        limitMonths: formData.limitMonths,
                    }),
                )
                .catch(error => {
                    console.error("Error creating accrual configuration:", error);
                    showToast("Failed to create accrual configuration", "error", "error");
                });
        }
        showToast("Accrual Configuration saved successfully", "success", "success");
    };
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5 text-amber-600" />
                    Accrual Configuration
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div
                    className={`p-4 rounded-lg ${theme === "dark" ? "bg-black  text-white" : "bg-white/80 backdrop-blur-sm text-gray-700"}`}
                >
                    <p
                        className={`text-sm leading-relaxed ${theme === "dark" ? "text-white" : "text-gray-700"}`}
                    >
                        Accrual Leave is a type of Leave that allows employees to carry over a
                        certain number of unused leave from one year to the next. The transferred
                        number of leave is to be consumed in the first months. Accrual Leave
                        configuration enables to configure the number of unused leave transferable
                        and the number of months that an employee disposes to consume his/her
                        accrual leave before he/she loses them.
                    </p>
                </div>

                <div className="max-w-2xl space-y-6">
                    <div>
                        <Label htmlFor="limitUnusedDays" className="text-red-500">
                            * Limit of Number of Unused Days :
                        </Label>
                        <Input
                            id="limitUnusedDays"
                            type="number"
                            min="0"
                            value={formData.limitUnusedDays}
                            onChange={e =>
                                setFormData(prev => ({
                                    ...prev,
                                    limitUnusedDays: Number.parseInt(e.target.value) || 0,
                                }))
                            }
                            className="mt-1 max-w-xs"
                        />
                    </div>

                    <div>
                        <Label htmlFor="limitMonths" className="text-red-500">
                            * Limit of Number of Months :
                        </Label>
                        <Input
                            id="limitMonths"
                            type="number"
                            min="0"
                            value={formData.limitMonths}
                            onChange={e =>
                                setFormData(prev => ({
                                    ...prev,
                                    limitMonths: Number.parseInt(e.target.value) || 0,
                                }))
                            }
                            className="mt-1 max-w-xs"
                        />
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
