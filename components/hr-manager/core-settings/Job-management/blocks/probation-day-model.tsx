"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Edit } from "lucide-react";
import { useToast } from "@/context/toastContext";
import { useTheme } from "@/components/theme-provider";
import { useData } from "@/context/app-data-context";
import { CoreSettingsRepository as settingsService } from "@/lib/repository/hr-settings";

export default function ProbationEndPeriod() {
    const { showToast } = useToast();
    useTheme();
    const { probationDays } = useData();

    const [isEditing, setIsEditing] = useState<boolean>(false);
    const [formData, setFormData] = useState<{ value: number }>({
        value: probationDays?.[0]?.value || 0,
    });

    const handleEdit = () => {
        setFormData({ value: formData.value });
        setIsEditing(true);
    };

    const handleSave = () => {
        if (probationDays && probationDays.length > 0) {
            settingsService.update("probationDays", probationDays[0].id, formData).catch(error => {
                console.error("Error updating probation day:", error);
                showToast("Failed to update probation day", "error", "error");
            });
        } else {
            settingsService.create("probationDays", formData).catch(error => {
                console.error("Error creating probation day:", error);
                showToast("Failed to create probation day", "error", "error");
            });
        }
        showToast("Probation day saved successfully", "success", "success");
        setIsEditing(false);
    };

    const handleCancel = () => {
        setFormData({ value: formData.value });
        setIsEditing(false);
    };

    return (
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg rounded-2xl">
            <CardHeader className="bg-amber-800 text-white rounded-t-2xl">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-xl font-bold">
                        Probation End Period Configuration
                    </CardTitle>
                    {!isEditing && (
                        <Button
                            onClick={handleEdit}
                            className="bg-amber-600 hover:bg-amber-700 text-white rounded-xl"
                        >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Configuration
                        </Button>
                    )}
                </div>
            </CardHeader>
            <CardContent className="p-6">
                <div className="space-y-6">
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
                        <h3 className="text-lg font-semibold text-amber-800 mb-4">
                            Current Probation Period Configuration
                        </h3>

                        {isEditing ? (
                            <div className="space-y-4">
                                <div>
                                    <Label
                                        htmlFor="value"
                                        className="text-sm font-medium text-gray-700"
                                    >
                                        Probation Period (Days)
                                    </Label>
                                    <Input
                                        id="value"
                                        type="number"
                                        value={formData.value}
                                        onChange={e =>
                                            setFormData({
                                                ...formData,
                                                value: Number.parseInt(e.target.value) || 0,
                                            })
                                        }
                                        placeholder="Enter number of days"
                                        className="mt-1"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        Specify the number of days for the probation period
                                    </p>
                                </div>

                                <div className="flex justify-end gap-3 pt-4">
                                    <Button variant="outline" onClick={handleCancel}>
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={handleSave}
                                        className="bg-amber-600 hover:bg-amber-700"
                                    >
                                        Save Configuration
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600 mb-2">
                                        Probation Period Duration
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <span className="text-2xl font-bold text-amber-800">
                                            {formData.value}
                                        </span>
                                        <span className="text-lg text-gray-600">days</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-gray-500">Last Updated</p>
                                    <p className="text-sm text-gray-700">
                                        {probationDays?.[0]?.updatedAt}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                        <div className="flex items-start gap-3">
                            <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <span className="text-white text-xs font-bold">i</span>
                            </div>
                            <div>
                                <h4 className="font-medium text-blue-800 mb-1">
                                    About Probation Period
                                </h4>
                                <p className="text-sm text-blue-700">
                                    This configuration sets the standard probation period duration
                                    for all new employees. The probation period typically ranges
                                    from 30 to 365 days depending on company policy.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
