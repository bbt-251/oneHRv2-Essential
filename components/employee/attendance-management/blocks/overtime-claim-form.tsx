"use client";

import { useTheme } from "next-themes";
import type React from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/context/authContext";
import { useToast } from "@/context/toastContext";
import { updateEmployee } from "@/lib/backend/api/employee-management/employee-management-service";
import { calculateDuration } from "@/lib/backend/functions/calculateDuration";
import { OvertimeRequestModel } from "@/lib/models/overtime-request";
import dayjs from "dayjs";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { OvertimeConfigurationModel } from "@/lib/backend/hr-settings-service";

interface OvertimeClaimFormProps {
    day: {
        day: number;
        month: string;
        year: number;
        status: string;
    };
    overtimeTypes: OvertimeConfigurationModel[];
    overtimeRequests: OvertimeRequestModel[];
    onClose: () => void;
}

export function OvertimeClaimForm({
    day,
    overtimeTypes,
    overtimeRequests,
    onClose,
}: OvertimeClaimFormProps) {
    const { showToast } = useToast();
    const { userData } = useAuth();
    const { theme } = useTheme();
    const isDark = theme === "dark";
    const [claimLoading, setClaimLoading] = useState<boolean>(false);

    const [formData, setFormData] = useState<{
        overtime: string;
        overtimeDate: string;
        overtimeStartTime: string;
        overtimeEndTime: string;
        overtimeDuration: string;
        overtimeType: string;
    }>({
        overtime: "",
        overtimeDate: `${day.year}-${String(
            new Date(`${day.month} 1, ${day.year}`).getMonth() + 1,
        ).padStart(2, "0")}-${String(day.day).padStart(2, "0")}`,
        overtimeStartTime: "",
        overtimeEndTime: "",
        overtimeDuration: "",
        overtimeType: "",
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setClaimLoading(true);
        const res = await updateEmployee({
            id: userData?.id ?? "",
            claimedOvertimes: [
                ...(userData?.claimedOvertimes?.filter(o => o != formData.overtime) ?? []),
                formData.overtime,
            ],
        });
        if (res) {
            showToast("Overtime claimed successfully", "Success", "success");
            onClose();
        } else {
            showToast("Error claiming overtime", "Error", "error");
        }
        setClaimLoading(false);
    };

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleTimeChange = (field: string, value: string) => {
        const newFormData = { ...formData, [field]: value };

        if (field === "overtimeStartTime" || field === "overtimeEndTime") {
            const startTime = field === "overtimeStartTime" ? value : formData.overtimeStartTime;
            const endTime = field === "overtimeEndTime" ? value : formData.overtimeEndTime;
            newFormData.overtimeDuration = calculateDuration(startTime, endTime);
        }

        setFormData(newFormData);
    };

    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent
                className={`max-w-2xl max-h-[90vh] overflow-y-auto ${
                    isDark ? "bg-slate-900" : "bg-white"
                }`}
            >
                <DialogHeader>
                    <div className="flex items-center justify-between">
                        <DialogTitle
                            className={`text-xl font-semibold ${
                                isDark ? "text-slate-200" : "text-[#3f3d56]"
                            }`}
                            style={{ fontFamily: "Montserrat, sans-serif" }}
                        >
                            Claim Overtime
                        </DialogTitle>
                    </div>
                </DialogHeader>

                <Card className={`border-0 shadow-sm ${isDark ? "bg-slate-900" : "bg-white"}`}>
                    <CardContent className="p-6">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Overtime Date */}
                            <div className="space-y-2">
                                <Label
                                    htmlFor="overtimeType"
                                    className={`text-sm font-medium ${
                                        isDark ? "text-slate-200" : "text-[#3f3d56]"
                                    }`}
                                    style={{
                                        fontFamily: "Montserrat, sans-serif",
                                    }}
                                >
                                    Available Overtime
                                </Label>
                                <Select
                                    value={formData.overtime}
                                    onValueChange={value => {
                                        handleInputChange("overtime", value);
                                        const selectedOT = overtimeRequests.find(
                                            ot => ot.id == value,
                                        );

                                        const selectedOvertime = selectedOT;

                                        [
                                            "overtimeDate",
                                            "overtimeStartTime",
                                            "overtimeEndTime",
                                            "overtimeType",
                                        ].forEach(key => {
                                            if (
                                                [
                                                    "overtimeDate",
                                                    "overtimeStartTime",
                                                    "overtimeEndTime",
                                                ].includes(key)
                                            ) {
                                                handleInputChange(
                                                    key,
                                                    dayjs(
                                                        selectedOvertime?.[
                                                            key as
                                                                | "overtimeDate"
                                                                | "overtimeStartTime"
                                                                | "overtimeEndTime"
                                                        ] ?? "",
                                                        "hh:mm A",
                                                    ).format("HH:mm"),
                                                );
                                            } else {
                                                handleInputChange(
                                                    key,
                                                    selectedOvertime?.overtimeType ?? "",
                                                );
                                            }
                                        });

                                        handleInputChange(
                                            "overtimeDuration",
                                            calculateDuration(
                                                selectedOT?.overtimeStartTime ?? "",
                                                selectedOT?.overtimeEndTime ?? "",
                                            ),
                                        );
                                    }}
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select overtime" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {overtimeRequests.map(o => {
                                            return (
                                                <SelectItem key={o.id} value={o.id}>
                                                    {`${o.overtimeDate}: ${o.overtimeStartTime} - ${o.overtimeEndTime}`}
                                                </SelectItem>
                                            );
                                        })}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Overtime Start Time */}
                            <div className="space-y-2">
                                <Label
                                    htmlFor="overtimeStartTime"
                                    className={`text-sm font-medium ${
                                        isDark ? "text-slate-200" : "text-[#3f3d56]"
                                    }`}
                                    style={{
                                        fontFamily: "Montserrat, sans-serif",
                                    }}
                                >
                                    Overtime Start Time
                                </Label>
                                <Input
                                    id="overtimeStartTime"
                                    type="time"
                                    value={formData.overtimeStartTime}
                                    onChange={e =>
                                        handleTimeChange("overtimeStartTime", e.target.value)
                                    }
                                    readOnly
                                />
                            </div>

                            {/* Overtime End Time */}
                            <div className="space-y-2">
                                <Label
                                    htmlFor="overtimeEndTime"
                                    className={`text-sm font-medium ${
                                        isDark ? "text-slate-200" : "text-[#3f3d56]"
                                    }`}
                                    style={{
                                        fontFamily: "Montserrat, sans-serif",
                                    }}
                                >
                                    Overtime End Time
                                </Label>
                                <Input
                                    id="overtimeEndTime"
                                    type="time"
                                    value={formData.overtimeEndTime}
                                    onChange={e =>
                                        handleTimeChange("overtimeEndTime", e.target.value)
                                    }
                                    readOnly
                                />
                            </div>

                            {/* Overtime Duration */}
                            <div className="space-y-2">
                                <Label
                                    htmlFor="overtimeDuration"
                                    className={`text-sm font-medium ${
                                        isDark ? "text-slate-200" : "text-[#3f3d56]"
                                    }`}
                                    style={{
                                        fontFamily: "Montserrat, sans-serif",
                                    }}
                                >
                                    Overtime Duration (Hour(s))
                                </Label>
                                <Input
                                    id="overtimeDuration"
                                    type="text"
                                    value={formData.overtimeDuration}
                                    placeholder="Calculated automatically"
                                    readOnly
                                />
                            </div>

                            {/* Overtime Type */}
                            <div className="space-y-2">
                                <Label
                                    htmlFor="overtimeType"
                                    className={`text-sm font-medium ${
                                        isDark ? "text-slate-200" : "text-[#3f3d56]"
                                    }`}
                                    style={{
                                        fontFamily: "Montserrat, sans-serif",
                                    }}
                                >
                                    Overtime Type
                                </Label>
                                <Select
                                    value={
                                        overtimeTypes.find(ot => ot.id == formData.overtimeType)
                                            ?.id ?? ""
                                    }
                                    onValueChange={value =>
                                        handleInputChange("overtimeType", value)
                                    }
                                    disabled
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select overtime type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {overtimeTypes.map((ot, index) => (
                                            <SelectItem key={index} value={ot.id}>
                                                {ot.overtimeType}
                                            </SelectItem>
                                        ))}
                                        <SelectItem value="weekend">Weekend Overtime</SelectItem>
                                        <SelectItem value="holiday">Holiday Overtime</SelectItem>
                                        <SelectItem value="emergency">
                                            Emergency Overtime
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Submit Buttons */}
                            <div className="flex flex-col sm:flex-row gap-3 pt-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={onClose}
                                    className={`flex-1 ${
                                        isDark
                                            ? "text-slate-200 border-slate-700 hover:bg-slate-800"
                                            : "text-[#3f3d56] border-gray-200 hover:bg-gray-50"
                                    }`}
                                    style={{
                                        fontFamily: "Montserrat, sans-serif",
                                    }}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={claimLoading}
                                    className="flex-1 bg-[#ffe6a7] hover:bg-[#ffe6a7]/80 text-[#3f3d56]"
                                    style={{
                                        fontFamily: "Montserrat, sans-serif",
                                    }}
                                >
                                    {claimLoading ? (
                                        <span className="flex items-center gap-2">
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Submitting...
                                        </span>
                                    ) : (
                                        "Submit Claim"
                                    )}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </DialogContent>
        </Dialog>
    );
}
