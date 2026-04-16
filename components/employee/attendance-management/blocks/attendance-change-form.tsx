"use client";

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
import { Textarea } from "@/components/ui/textarea";
import { DailyAttendance, WorkedHoursModel } from "@/lib/models/attendance";
import { formatHour, getUserTimezone } from "@/lib/util/dayjs_format";
import dayjs from "dayjs";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/authContext";
import { useFirestore } from "@/context/firestore-context";

interface ClockEntry {
    id: string;
    type: "Clock In" | "Clock Out";
    hour: string;
}

interface AttendanceChangeFormProps {
    day: {
        day: number;
        month: string;
        year: number;
        status: string;
        dailyAttendance: DailyAttendance;
    };
    onClose: () => void;
    onSubmit: (data: any, comment: string) => Promise<void>;
}

const getTypeLabel = (type: string) => {
    switch (type) {
        case "clockIn":
            return "Clock In";
        case "clockOut":
            return "Clock Out";
        case "breakOut":
            return "Break Out";
        case "breakIn":
            return "Break In";
        default:
            return type;
    }
};

export function AttendanceChangeForm({ day, onClose, onSubmit }: AttendanceChangeFormProps) {
    const [formData, setFormData] = useState({
        timestamp: "",
        date: `${day.year}-${String(
            new Date(`${day.month} 1, ${day.year}`).getMonth() + 1,
        ).padStart(2, "0")}-${String(day.day).padStart(2, "0")}`,
        workedHours: "",
        status: "pending",
        comment: "",
    });
    const [submitLoading, setSubmitLoading] = useState(false);
    const [oldValues, setOldValues] = useState<WorkedHoursModel[]>([]);

    // Get employee's stored timezone, fallback to current browser timezone
    const { employees } = useFirestore();
    const { userData } = useAuth();
    const employeeData = employees.find(emp => emp.uid === userData?.uid);
    const userTimezone = employeeData?.timezone || getUserTimezone();

    const [newValues, setNewValues] = useState<WorkedHoursModel[]>([
        {
            id: "new-1",
            type: "Clock In",
            hour: "",
            timestamp: "",
        },
        {
            id: "new-2",
            type: "Clock Out",
            hour: "",
            timestamp: "",
        },
    ]);

    useEffect(() => {
        const workedHours = day?.dailyAttendance?.workedHours ?? [];
        const sortedWorkedHours = [...workedHours].sort((a, b) => {
            const timeA = dayjs(a.timestamp);
            const timeB = dayjs(b.timestamp);

            if (timeA.isBefore(timeB)) return -1;
            if (timeA.isAfter(timeB)) return 1;
            return 0;
        });
        setOldValues(sortedWorkedHours);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        setSubmitLoading(true);
        e.preventDefault();
        const workedHours = newValues.map(wh => ({
            ...wh,
            timestamp: dayjs(
                `${day.year}-${String(new Date(`${day.month} 1, ${day.year}`).getMonth() + 1).padStart(2, "0")}-${String(day.day).padStart(2, "0")}T${wh.hour}:00`,
            ).toISOString(),
            hour: "", // Derive from timestamp when displaying
        }));

        await onSubmit(workedHours, formData.comment);
        setSubmitLoading(false);
    };

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const addOldValue = () => {
        const newEntry: WorkedHoursModel = {
            id: crypto.randomUUID(),
            type: "Clock In",
            hour: "",
            timestamp: "",
        };
        setOldValues(prev => [...prev, newEntry]);
    };

    const addNewValue = () => {
        const newEntry: WorkedHoursModel = {
            id: crypto.randomUUID(),
            type: "Clock In",
            hour: "",
            timestamp: "",
        };
        setNewValues(prev => [...prev, newEntry]);
    };

    const removeNewValue = (id: string) => {
        setNewValues(prev => prev.filter(entry => entry.id !== id));
    };

    const updateNewValue = (id: string, field: keyof ClockEntry, value: string) => {
        setNewValues(prev =>
            prev.map(entry => (entry.id === id ? { ...entry, [field]: value } : entry)),
        );
    };

    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-center justify-between">
                        <DialogTitle
                            className="text-xl font-semibold text-[#3f3d56]"
                            style={{ fontFamily: "Montserrat, sans-serif" }}
                        >
                            Attendance Change Request
                        </DialogTitle>
                    </div>
                </DialogHeader>

                <Card className="border-0 shadow-sm">
                    <CardContent className="p-6">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Old Values */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <Label
                                            className="text-sm font-medium text-[#3f3d56]"
                                            style={{
                                                fontFamily: "Montserrat, sans-serif",
                                            }}
                                        >
                                            Old Values
                                        </Label>
                                    </div>
                                    <div className="space-y-3 bg-red-50 p-4 rounded-lg border border-red-200">
                                        {oldValues.map((entry, index) => (
                                            <div
                                                key={index}
                                                className="flex justify-between items-center"
                                            >
                                                <span
                                                    className="text-sm text-[#3f3d56] opacity-70"
                                                    style={{
                                                        fontFamily: "Montserrat, sans-serif",
                                                    }}
                                                >
                                                    {getTypeLabel(entry.type)}:
                                                </span>
                                                <span
                                                    className="text-sm font-medium text-[#3f3d56]"
                                                    style={{
                                                        fontFamily: "Montserrat, sans-serif",
                                                    }}
                                                >
                                                    {entry.hour}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* New Values */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <Label
                                            className="text-sm font-medium text-[#3f3d56]"
                                            style={{
                                                fontFamily: "Montserrat, sans-serif",
                                            }}
                                        >
                                            New Values
                                        </Label>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={addNewValue}
                                            className="text-[#3f3d56] border-gray-200 hover:bg-gray-50 bg-transparent"
                                            style={{
                                                fontFamily: "Montserrat, sans-serif",
                                            }}
                                        >
                                            <Plus className="h-4 w-4 mr-1" />
                                            Add
                                        </Button>
                                    </div>
                                    <div className="space-y-3 bg-green-50 p-4 rounded-lg border border-green-200">
                                        {newValues.map(entry => (
                                            <div key={entry.id} className="flex gap-2 items-end">
                                                <div className="flex-1">
                                                    <Label
                                                        className="text-xs text-[#3f3d56] opacity-60"
                                                        style={{
                                                            fontFamily: "Montserrat, sans-serif",
                                                        }}
                                                    >
                                                        Type
                                                    </Label>
                                                    <Select
                                                        value={entry.type}
                                                        onValueChange={value =>
                                                            updateNewValue(entry.id, "type", value)
                                                        }
                                                    >
                                                        <SelectTrigger className="w-full">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="Clock In">
                                                                Clock In
                                                            </SelectItem>
                                                            <SelectItem value="Clock Out">
                                                                Clock Out
                                                            </SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="flex-1">
                                                    <Label
                                                        className="text-xs text-[#3f3d56] opacity-60"
                                                        style={{
                                                            fontFamily: "Montserrat, sans-serif",
                                                        }}
                                                    >
                                                        Time
                                                    </Label>
                                                    <Input
                                                        type="time"
                                                        value={entry.hour}
                                                        onChange={e => {
                                                            updateNewValue(
                                                                entry.id,
                                                                "hour",
                                                                e.target.value,
                                                            );
                                                        }}
                                                        className="w-full"
                                                        required
                                                    />
                                                </div>
                                                {newValues.length > 1 && (
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => removeNewValue(entry.id)}
                                                        className="text-red-600 border-red-200 hover:bg-red-50"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Comment */}
                            <div className="space-y-2">
                                <Label
                                    htmlFor="comment"
                                    className="text-sm font-medium text-[#3f3d56]"
                                    style={{
                                        fontFamily: "Montserrat, sans-serif",
                                    }}
                                >
                                    Comment
                                </Label>
                                <Textarea
                                    id="comment"
                                    placeholder="Please provide a reason for this change request..."
                                    value={formData.comment}
                                    onChange={e => handleInputChange("comment", e.target.value)}
                                    className="w-full min-h-[100px]"
                                    required
                                />
                            </div>

                            {/* Submit Buttons */}
                            <div className="flex flex-col sm:flex-row gap-3 pt-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={onClose}
                                    className="flex-1 text-[#3f3d56] border-gray-200 hover:bg-gray-50 bg-transparent"
                                    style={{
                                        fontFamily: "Montserrat, sans-serif",
                                    }}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={submitLoading}
                                    className="flex-1 bg-[#3f3d56] hover:bg-[#3f3d56]/90 text-white"
                                    style={{
                                        fontFamily: "Montserrat, sans-serif",
                                    }}
                                >
                                    {submitLoading && (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    )}
                                    {submitLoading ? "Submitting..." : "Submit Request"}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </DialogContent>
        </Dialog>
    );
}
