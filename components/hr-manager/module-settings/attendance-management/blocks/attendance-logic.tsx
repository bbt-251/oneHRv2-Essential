"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Settings } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AttendanceLogicModel } from "@/lib/models/attendance-logic";
import { useFirestore } from "@/context/firestore-context";
import {
    createAttendanceLogic,
    updateAttendanceLogic,
} from "@/lib/backend/api/hr-settings/attendance-logic-service";
import { useToast } from "@/context/toastContext";
import { useTheme } from "@/components/theme-provider";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/authContext";

interface ExtendedAttendanceLogicModel extends Omit<AttendanceLogicModel, "chosenLogic"> {
    chosenLogic: 1 | 2 | 3 | 4 | null;
}

export function AttendanceLogic() {
    const { showToast } = useToast();
    const { attendanceLogic } = useFirestore();
    const { theme } = useTheme();
    const { userData } = useAuth();

    const [saveLoading, setSaveLoading] = useState(false);
    const [config, setConfig] = useState<ExtendedAttendanceLogicModel>({
        id: "",
        chosenLogic: null,
        halfPresentThreshold: null,
        presentThreshold: null,
    });

    useEffect(() => {
        const logic = attendanceLogic?.at(0);
        if (logic) setConfig(logic as ExtendedAttendanceLogicModel);
    }, [attendanceLogic]);

    const handleLogicChange = (logic: 1 | 2 | 3 | 4) => {
        setConfig(prev => ({
            ...prev,
            chosenLogic: logic,
            halfPresentThreshold: logic === 3 || logic === 4 ? prev.halfPresentThreshold : null,
            presentThreshold: logic === 3 || logic === 4 ? prev.presentThreshold : null,
        }));
    };

    const handleThresholdChange = (
        field: "halfPresentThreshold" | "presentThreshold",
        value: string,
    ) => {
        const numValue =
            value === "" ? null : Math.min(100, Math.max(0, Number.parseInt(value) || 0));
        setConfig(prev => ({
            ...prev,
            [field]: numValue,
        }));
    };

    const handleSave = async () => {
        setSaveLoading(true);
        if (attendanceLogic?.at(0)) {
            // update logic
            const res = await updateAttendanceLogic(
                config as AttendanceLogicModel,
                userData?.uid ?? "",
            );
            if (res) {
                showToast("Logic updated successfully", "Success", "success");
            } else {
                showToast("Error updating document", "Error", "error");
            }
        } else {
            // create logic
            const { id, ...data } = config;
            const res = await createAttendanceLogic(
                data as AttendanceLogicModel,
                userData?.uid ?? "",
            );
            if (res) {
                showToast("Logic created successfully", "Success", "success");
            } else {
                showToast("Error creating document", "Error", "error");
            }
        }
        setSaveLoading(false);
    };

    // THEME CLASSES
    const cardBg = theme === "dark" ? "bg-black border-gray-800" : "bg-white border-gray-200";
    const headingColor = theme === "dark" ? "text-gray-100" : "text-gray-900";
    const bodyColor = theme === "dark" ? "text-gray-300" : "text-gray-700";
    const mutedColor = theme === "dark" ? "text-gray-400" : "text-gray-600";
    const panelBorder = theme === "dark" ? "border-gray-700" : "border-gray-200";
    const panelBg = theme === "dark" ? "bg-black border-gray-700" : "bg-white";
    const inputClass =
        theme === "dark"
            ? "bg-black border-gray-600 text-white placeholder-gray-400"
            : "bg-white border-gray-300 text-black placeholder-gray-500";
    const noteBox =
        theme === "dark" ? "bg-amber-900/20 border-amber-700" : "bg-amber-50 border-amber-200";
    const noteStrong = theme === "dark" ? "text-amber-300" : "text-amber-700";

    return (
        <Card className={`${cardBg} border`}>
            <CardHeader>
                <CardTitle className={`flex items-center gap-2 ${headingColor}`}>
                    <Settings
                        className={`h-5 w-5 ${
                            theme === "dark" ? "text-amber-500" : "text-amber-600"
                        }`}
                    />
                    Attendance Logic Configuration
                </CardTitle>
            </CardHeader>

            <CardContent className="space-y-6">
                <div className="mb-6">
                    <p className={`${bodyColor} font-medium mb-4`}>
                        Please choose one of the attendance logic, this configuration is crucial as
                        it also impacts your payroll module.
                    </p>
                </div>

                {/* LOGIC 1 */}
                <div className={`space-y-3 p-4 border rounded-lg ${panelBorder} ${panelBg}`}>
                    <div className="flex items-center justify-between">
                        <div className="flex-1">
                            <h3 className={`font-medium ${headingColor}`}>
                                1. We are not interested in the attendance management, including
                                overtime
                            </h3>
                        </div>
                        <Switch
                            className={cn(
                                `data-[state=checked]:bg-black dark:data-[state=checked]:bg-amber-600`,
                                theme === "dark" && "data-[state=unchecked]:bg-gray-400",
                            )}
                            checked={config.chosenLogic === 1}
                            onCheckedChange={() => handleLogicChange(1)}
                            aria-label="Choose logic 1"
                        />
                    </div>
                    <p className={`text-sm ${mutedColor}`}>
                        This configuration removes the attendance management module, and the payroll
                        will be based on the provided employee fixed salary. Overtime payments won't
                        be considered in the payroll.
                    </p>
                </div>

                {/* LOGIC 2 */}
                <div className={`space-y-3 p-4 border rounded-lg ${panelBorder} ${panelBg}`}>
                    <div className="flex items-center justify-between">
                        <div className="flex-1">
                            <h3 className={`font-medium ${headingColor}`}>
                                2. We are not interested in the attendance management, excluding
                                overtime
                            </h3>
                        </div>
                        <Switch
                            className={cn(
                                `data-[state=checked]:bg-black dark:data-[state=checked]:bg-amber-600`,
                                theme === "dark" && "data-[state=unchecked]:bg-gray-400",
                            )}
                            checked={config.chosenLogic === 2}
                            onCheckedChange={() => handleLogicChange(2)}
                            aria-label="Choose logic 2"
                        />
                    </div>
                    <p className={`text-sm ${mutedColor}`}>
                        This configuration only gives access to the overtime feature of the
                        attendance management module, and the payroll will be based on the provided
                        employee fixed salary. Overtime payments will be considered in the payroll.
                    </p>
                </div>

                {/* LOGIC 3 */}
                <div className={`space-y-3 p-4 border rounded-lg ${panelBorder} ${panelBg}`}>
                    <div className="flex items-center justify-between">
                        <div className="flex-1">
                            <h3 className={`font-medium ${headingColor}`}>
                                3. We are interested in the attendance management, with a simple
                                clock in clock out mechanism
                            </h3>
                        </div>
                        <Switch
                            className={cn(
                                `data-[state=checked]:bg-black dark:data-[state=checked]:bg-amber-600`,
                                theme === "dark" && "data-[state=unchecked]:bg-gray-400",
                            )}
                            checked={config.chosenLogic === 3}
                            onCheckedChange={() => handleLogicChange(3)}
                            aria-label="Choose logic 3"
                        />
                    </div>
                    <p className={`text-sm ${mutedColor} mb-4`}>
                        This configuration gives you access to the complete attendance management
                        module, and the payroll will be based on the provided employee fixed salary.
                        Overtime payments will be considered in the payroll. The clock-in/clock-out
                        mechanism will only track employee presence or absence.
                    </p>

                    {config.chosenLogic === 3 && (
                        <div className={`p-4 rounded-lg border space-y-4 ${noteBox}`}>
                            <div className={`text-sm ${bodyColor}`}>
                                <strong className={noteStrong}>Note:</strong> An employee is either
                                Present, Half Present, or Absent. In order to determine that, we
                                need to define thresholds based on the daily worked hours that need
                                to be respected. For example, if an employee works less than the
                                half present threshold, they are considered absent. If they work
                                more than or equal to the half present threshold but less than the
                                present threshold, they are considered half present. If they work
                                more than or equal to the present threshold, they are considered
                                present. These thresholds must be defined below.
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label
                                        htmlFor="presentThreshold"
                                        className={`text-sm font-medium ${headingColor}`}
                                    >
                                        Present Threshold (%):{" "}
                                        <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="presentThreshold"
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={config.presentThreshold || ""}
                                        onChange={e =>
                                            handleThresholdChange(
                                                "presentThreshold",
                                                e.target.value,
                                            )
                                        }
                                        placeholder="80"
                                        className={`w-full ${inputClass}`}
                                    />
                                    <p className={`text-xs ${mutedColor}`}>
                                        Number must be between 0 and 100 (inclusive)
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <Label
                                        htmlFor="halfPresentThreshold"
                                        className={`text-sm font-medium ${headingColor}`}
                                    >
                                        Half Present Threshold (%):{" "}
                                        <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="halfPresentThreshold"
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={config.halfPresentThreshold || ""}
                                        onChange={e =>
                                            handleThresholdChange(
                                                "halfPresentThreshold",
                                                e.target.value,
                                            )
                                        }
                                        placeholder="40"
                                        className={`w-full ${inputClass}`}
                                    />
                                    <p className={`text-xs ${mutedColor}`}>
                                        Number must be between 0 and 100 (inclusive)
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* LOGIC 4 */}
                <div className={`space-y-3 p-4 border rounded-lg ${panelBorder} ${panelBg}`}>
                    <div className="flex items-center justify-between">
                        <div className="flex-1">
                            <h3 className={`font-medium ${headingColor}`}>
                                4. We are interested in the attendance management, with a precise
                                clock in clock out mechanism
                            </h3>
                        </div>
                        <Switch
                            className={cn(
                                `data-[state=checked]:bg-black dark:data-[state=checked]:bg-amber-600`,
                                theme === "dark" && "data-[state=unchecked]:bg-gray-400",
                            )}
                            checked={config.chosenLogic === 4}
                            onCheckedChange={() => handleLogicChange(4)}
                            aria-label="Choose logic 4"
                        />
                    </div>
                    <p className={`text-sm ${mutedColor} mb-4`}>
                        This configuration gives you access to the complete attendance management
                        module. Overtime payments will be considered in the payroll. The
                        clock-in/clock-out mechanism will precisely track employee monthly worked,
                        with the hourly wage, you can precisely determine the employee monthly
                        salary, making it variable and correlated with the number of hours worked.
                    </p>

                    {config.chosenLogic === 4 && (
                        <div className={`p-4 rounded-lg border space-y-4 ${noteBox}`}>
                            <div className={`text-sm ${bodyColor}`}>
                                <strong className={noteStrong}>Note:</strong> An employee is either
                                Present, Half Present, or Absent. In order to determine that, we
                                need to define thresholds based on the daily worked hours that need
                                to be respected. For example, if an employee works less than the
                                half present threshold, they are considered absent. If they work
                                more than or equal to the half present threshold but less than the
                                present threshold, they are considered half present. If they work
                                more than or equal to the present threshold, they are considered
                                present. These thresholds must be defined below.
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label
                                        htmlFor="presentThreshold4"
                                        className={`text-sm font-medium ${headingColor}`}
                                    >
                                        Present Threshold (%):{" "}
                                        <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="presentThreshold4"
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={config.presentThreshold || ""}
                                        onChange={e =>
                                            handleThresholdChange(
                                                "presentThreshold",
                                                e.target.value,
                                            )
                                        }
                                        placeholder="80"
                                        className={`w-full ${inputClass}`}
                                    />
                                    <p className={`text-xs ${mutedColor}`}>
                                        Number must be between 0 and 100 (inclusive)
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <Label
                                        htmlFor="halfPresentThreshold4"
                                        className={`text-sm font-medium ${headingColor}`}
                                    >
                                        Half Present Threshold (%):{" "}
                                        <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="halfPresentThreshold4"
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={config.halfPresentThreshold || ""}
                                        onChange={e =>
                                            handleThresholdChange(
                                                "halfPresentThreshold",
                                                e.target.value,
                                            )
                                        }
                                        placeholder="40"
                                        className={`w-full ${inputClass}`}
                                    />
                                    <p className={`text-xs ${mutedColor}`}>
                                        Number must be between 0 and 100 (inclusive)
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* SAVE */}
                <div className="flex justify-center pt-4">
                    <Button
                        onClick={handleSave}
                        disabled={saveLoading}
                        className={`text-white px-8 py-2 ${
                            theme === "dark"
                                ? "bg-amber-700 hover:bg-amber-800"
                                : "bg-gray-800 hover:bg-gray-900"
                        }`}
                    >
                        {saveLoading ? (
                            <div className="flex gap-2 items-center">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Saving
                            </div>
                        ) : (
                            "Save"
                        )}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
