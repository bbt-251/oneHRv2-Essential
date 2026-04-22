"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, Download, Edit, Loader2, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import dayjs from "dayjs";
import { timestampFormat } from "@/lib/util/dayjs_format";
import { HolidayModel, hrSettingsService } from "@/lib/backend/hr-settings-service";
import { useToast } from "@/context/toastContext";
import { useData } from "@/context/app-data-context";
import { useConfirm } from "@/hooks/use-confirm-dialog";
import { useTheme } from "@/components/theme-provider";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/authContext";
import { HOLIDAY_SETUP_LOG_MESSAGES } from "@/lib/log-descriptions/attendance-management";

export function HolidaySetup() {
    const { ...hrSettings } = useData();
    const { showToast } = useToast();
    const { confirm, ConfirmDialog } = useConfirm();
    const { theme } = useTheme();
    const { userData } = useAuth();

    const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
    const [isFetchModalOpen, setIsFetchModalOpen] = useState<boolean>(false);
    const [isAddEditLoading, setIsAddEditLoading] = useState<boolean>(false);
    const [fetchLoading, setFetchLoading] = useState<boolean>(false);

    const [editingHoliday, setEditingHoliday] = useState<HolidayModel | null>(null);
    const [formData, setFormData] = useState<Partial<HolidayModel>>({
        id: "",
        name: "",
        date: "",
        active: "Yes",
    });
    const [fetchData, setFetchData] = useState<{ year: string; country: string }>({
        year: new Date().getFullYear().toString(),
        country: "",
    });
    const holidays: HolidayModel[] = hrSettings.holidays;

    // THEME CLASSES
    const cardBg = theme === "dark" ? "bg-black border-gray-800" : "bg-white border-gray-200";
    const headingColor = theme === "dark" ? "text-gray-100" : "text-gray-900";
    const bodyColor = theme === "dark" ? "text-gray-300" : "text-gray-700";
    const mutedColor = theme === "dark" ? "text-gray-400" : "text-gray-600";
    const panelBorder = theme === "dark" ? "border-gray-800" : "border-gray-200";
    const tableHeaderBg = theme === "dark" ? "bg-black" : "bg-gray-50";
    const tableRowHover = theme === "dark" ? "hover:bg-[#141414]" : "hover:bg-gray-50";
    const inputClass =
        theme === "dark"
            ? "bg-black border-gray-600 text-white placeholder-gray-400"
            : "bg-white border-gray-300 text-black placeholder-gray-500";
    const selectTriggerClass =
        theme === "dark"
            ? "bg-black border-gray-600 text-white"
            : "bg-white border-gray-300 text-black";
    const selectContentClass = theme === "dark" ? "bg-black border border-gray-700" : "bg-white";
    const dialogContentClass =
        theme === "dark"
            ? "bg-black text-gray-100 border border-gray-800"
            : "bg-white text-gray-900";
    const accentIcon = theme === "dark" ? "text-amber-500" : "text-amber-600";
    const primaryBtn =
        theme === "dark"
            ? "bg-amber-700 hover:bg-amber-800 text-white"
            : "bg-amber-600 hover:bg-amber-700 text-white";
    const outlineAmber =
        theme === "dark"
            ? "border-amber-600 text-amber-400 hover:bg-amber-900/20"
            : "border-amber-600 text-amber-600 hover:bg-amber-50";
    const badgeYes =
        theme === "dark"
            ? "bg-green-900/30 text-green-300 border border-green-700"
            : "bg-green-100 text-green-800";
    const badgeNo =
        theme === "dark"
            ? "bg-black text-gray-300 border border-gray-700"
            : "bg-gray-100 text-gray-800";
    const iconBtnAmber =
        theme === "dark"
            ? "text-amber-400 hover:text-amber-300 hover:bg-amber-900/20"
            : "text-amber-600 hover:text-amber-700 hover:bg-amber-50";
    const iconBtnRed =
        theme === "dark"
            ? "text-red-400 hover:text-red-300 hover:bg-red-900/20"
            : "text-red-600 hover:text-red-700 hover:bg-red-50";

    const handleAddHoliday = async () => {
        // required fields
        if (!formData.name || !formData.date) {
            showToast("Name and date are required", "Error", "error");
            return;
        }
        setIsAddEditLoading(true);
        const newHoliday: Omit<HolidayModel, "id"> = {
            timestamp: dayjs().format(timestampFormat),
            name: formData.name || "",
            date: formData.date || "",
            active: formData.active || "Yes",
        };

        if (editingHoliday) {
            const { id: _id, ...data } = formData;

            const res = await hrSettingsService.update(
                "holidays",
                editingHoliday.id,
                data,
                userData?.uid ?? "",
                HOLIDAY_SETUP_LOG_MESSAGES.UPDATED({
                    id: editingHoliday.id,
                    name: formData.name,
                    date: formData.date,
                    active: formData.active,
                }),
            );
            if (res) {
                showToast("Holiday updated successfully", "Success", "success");
                resetForm();
            } else {
                showToast("Error updating holiday", "Error", "error");
            }
        } else {
            const res = await hrSettingsService.create(
                "holidays",
                newHoliday,
                userData?.uid ?? "",
                HOLIDAY_SETUP_LOG_MESSAGES.CREATED({
                    name: newHoliday.name,
                    date: newHoliday.date,
                    active: newHoliday.active,
                }),
            );
            if (res) {
                showToast("Holiday created successfully", "Success", "success");
                resetForm();
            } else {
                showToast("Error creating holiday", "Error", "error");
            }
        }
        setIsAddEditLoading(false);
    };

    const handleEditHoliday = (holiday: HolidayModel) => {
        setEditingHoliday(holiday);
        setFormData({
            id: holiday.id,
            name: holiday.name,
            date: holiday.date,
            active: holiday.active,
        });
        setIsAddModalOpen(true);
    };

    const handleDeleteHoliday = (id: string) => {
        confirm("Are you sure ?", async () => {
            const res = await hrSettingsService.remove(
                "holidays",
                id,
                userData?.uid ?? "",
                HOLIDAY_SETUP_LOG_MESSAGES.DELETED(id),
            );
            if (res) {
                showToast("Holiday deleted successfully", "Success", "success");
            } else {
                showToast("Error deleting holiday", "Error", "error");
            }
        });
    };

    const resetForm = () => {
        setFormData({
            id: "",
            name: "",
            date: "",
            active: "Yes",
        });
        setEditingHoliday(null);
        setIsAddModalOpen(false);
    };

    const handleFetchHolidays = async () => {
        setFetchLoading(true);
        // NOTE: if you renamed your API route to /api/holidays (App Router),
        // update this path accordingly.
        const res = await fetch("/api/generation/holidays", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                year: fetchData.year,
                country: fetchData.country,
            }),
        });

        if (!res.ok) {
            showToast("Failed to fetch holidays", "Error", "error");
            setFetchLoading(false);
            return;
        }

        const data: HolidayModel[] = await res.json();
        data.forEach(d => {
            d.timestamp = dayjs().format(timestampFormat);
            d.active = "Yes";
        });

        const response = await hrSettingsService.batchCreate(
            "holidays",
            data,
            userData?.uid ?? "",
            HOLIDAY_SETUP_LOG_MESSAGES.CREATED({
                name: "Batch Holiday Import",
                date: "Multiple dates",
                active: "Yes",
            }),
        );
        if (response.success) {
            showToast("Holidays fetched successfully", "Success", "success");
        } else {
            showToast(
                response.error ?? "Error saving fetched data, please try again",
                "Error",
                "error",
            );
            setFetchLoading(false);
            return;
        }
        setIsFetchModalOpen(false);
        setFetchData({ year: new Date().getFullYear().toString(), country: "" });
        setFetchLoading(false);
    };

    return (
        <Card className={cn(cardBg, "border")}>
            <CardHeader>
                <CardTitle className={cn("flex items-center gap-2", headingColor)}>
                    <Calendar className={cn("h-5 w-5", accentIcon)} />
                    Holiday Setup
                </CardTitle>
            </CardHeader>

            <CardContent className="space-y-6">
                <div className="flex flex-col sm:flex-row gap-4">
                    {/* ADD / EDIT */}
                    <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                        <DialogTrigger asChild>
                            <Button className={primaryBtn} aria-label="Add Holiday">
                                <Plus className="h-4 w-4 mr-2" />
                                Add Holiday
                            </Button>
                        </DialogTrigger>
                        <DialogContent className={cn("sm:max-w-md", dialogContentClass)}>
                            <DialogHeader>
                                <DialogTitle className={headingColor}>
                                    {editingHoliday ? "Edit Holiday" : "Add Holiday"}
                                </DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name" className={bodyColor}>
                                        Holiday Name
                                    </Label>
                                    <Input
                                        id="name"
                                        value={formData.name}
                                        onChange={e =>
                                            setFormData(prev => ({ ...prev, name: e.target.value }))
                                        }
                                        placeholder="New Year's Day"
                                        className={inputClass}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="date" className={bodyColor}>
                                        Date
                                    </Label>
                                    <Input
                                        id="date"
                                        type="date"
                                        value={formData.date}
                                        onChange={e =>
                                            setFormData(prev => ({ ...prev, date: e.target.value }))
                                        }
                                        className={inputClass}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="active" className={bodyColor}>
                                        Active Status
                                    </Label>
                                    <Select
                                        value={formData.active}
                                        onValueChange={(value: "Yes" | "No") =>
                                            setFormData(prev => ({ ...prev, active: value }))
                                        }
                                    >
                                        <SelectTrigger className={selectTriggerClass}>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className={selectContentClass}>
                                            <SelectItem value="Yes">Yes</SelectItem>
                                            <SelectItem value="No">No</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex gap-2 pt-4">
                                    <Button
                                        variant="outline"
                                        onClick={resetForm}
                                        className={cn("flex-1 bg-transparent", panelBorder)}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={handleAddHoliday}
                                        className={cn("flex-1", primaryBtn)}
                                        disabled={isAddEditLoading}
                                        aria-label={
                                            editingHoliday ? "Update Holiday" : "Add Holiday"
                                        }
                                    >
                                        {isAddEditLoading ? (
                                            <div className="flex items-center justify-center gap-2">
                                                <Loader2 className="animate-spin h-4 w-4" />
                                                {editingHoliday ? "Updating..." : "Adding..."}
                                            </div>
                                        ) : (
                                            `${editingHoliday ? "Update" : "Add"} Holiday`
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>

                    {/* FETCH */}
                    <Dialog open={isFetchModalOpen} onOpenChange={setIsFetchModalOpen}>
                        <DialogTrigger asChild>
                            <Button
                                variant="outline"
                                className={cn("bg-transparent", outlineAmber)}
                                aria-label="Fetch Holidays"
                            >
                                <Download className="h-4 w-4 mr-2" />
                                Fetch Holidays
                            </Button>
                        </DialogTrigger>
                        <DialogContent className={cn("sm:max-w-md", dialogContentClass)}>
                            <DialogHeader>
                                <DialogTitle className={headingColor}>
                                    Fetch Public Holidays
                                </DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="year" className={bodyColor}>
                                        Year
                                    </Label>
                                    <Input
                                        id="year"
                                        type="number"
                                        value={fetchData.year}
                                        onChange={e =>
                                            setFetchData(prev => ({
                                                ...prev,
                                                year: e.target.value,
                                            }))
                                        }
                                        placeholder="2025"
                                        className={inputClass}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="country" className={bodyColor}>
                                        Country
                                    </Label>
                                    <Select
                                        value={fetchData.country}
                                        onValueChange={value =>
                                            setFetchData(prev => ({ ...prev, country: value }))
                                        }
                                    >
                                        <SelectTrigger className={selectTriggerClass}>
                                            <SelectValue placeholder="Select country" />
                                        </SelectTrigger>
                                        <SelectContent className={selectContentClass}>
                                            <SelectItem value="United States">
                                                United States
                                            </SelectItem>
                                            <SelectItem value="United Kingdom">
                                                United Kingdom
                                            </SelectItem>
                                            <SelectItem value="Canada">Canada</SelectItem>
                                            <SelectItem value="Australia">Australia</SelectItem>
                                            <SelectItem value="Ethiopia">Ethiopia</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex gap-2 pt-4">
                                    <Button
                                        variant="outline"
                                        onClick={() => setIsFetchModalOpen(false)}
                                        className={cn("flex-1 bg-transparent", panelBorder)}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={handleFetchHolidays}
                                        className={cn("flex-1", primaryBtn)}
                                        disabled={fetchLoading}
                                    >
                                        {fetchLoading ? (
                                            <div className="flex items-center justify-center gap-2">
                                                <Loader2 className="animate-spin h-4 w-4" />
                                                Fetching...
                                            </div>
                                        ) : (
                                            "Fetch"
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* TABLE */}
                <div className={cn("rounded-lg overflow-hidden border", panelBorder)}>
                    <Table>
                        <TableHeader className={tableHeaderBg}>
                            <TableRow>
                                <TableHead className={headingColor}>Name</TableHead>
                                <TableHead className={headingColor}>Date</TableHead>
                                <TableHead className={headingColor}>Status</TableHead>
                                <TableHead className={cn("text-right", headingColor)}>
                                    Actions
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {holidays.length === 0 ? (
                                <TableRow>
                                    <TableCell
                                        colSpan={4}
                                        className={cn("py-10 text-center", mutedColor)}
                                    >
                                        No holidays yet. Use{" "}
                                        <span className="font-medium">Add Holiday</span> or{" "}
                                        <span className="font-medium">Fetch Holidays</span>.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                holidays.map(holiday => (
                                    <TableRow key={holiday.id} className={tableRowHover}>
                                        <TableCell className={bodyColor}>{holiday.name}</TableCell>
                                        <TableCell className={bodyColor}>
                                            {holiday.date
                                                ? dayjs(holiday.date).format("MMM D, YYYY")
                                                : "-"}
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                className={cn(
                                                    "px-2.5 py-1 text-xs font-medium",
                                                    holiday.active === "Yes" ? badgeYes : badgeNo,
                                                )}
                                            >
                                                {holiday.active}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleEditHoliday(holiday)}
                                                    className={cn("h-8 w-8 p-0", iconBtnAmber)}
                                                    aria-label="Edit holiday"
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleDeleteHoliday(holiday.id!)}
                                                    className={cn("h-8 w-8 p-0", iconBtnRed)}
                                                    aria-label="Delete holiday"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>

            {ConfirmDialog}
        </Card>
    );
}
