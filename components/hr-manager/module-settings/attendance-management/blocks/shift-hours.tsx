"use client";

import { Badge } from "@/components/ui/badge";
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectValue,
    SelectTrigger,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { AlertTriangle, Clock, Edit, Loader2, Plus, Settings, Trash2 } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/context/toastContext";
import {
    hrSettingsService,
    ShiftHourDivision,
    ShiftHourModel,
} from "@/lib/backend/hr-settings-service";
import { useData } from "@/context/app-data-context";
import { FlexibilityParameterModel } from "@/lib/models/flexibilityParameter";
import {
    createParameter,
    updateParameter,
} from "@/lib/backend/api/hr-settings/flexibility-parameter";
import { useTheme } from "@/components/theme-provider";
import { cn } from "@/lib/utils";
import dayjs from "dayjs";
import { timestampFormat } from "@/lib/util/dayjs_format";
import { useConfirm } from "@/hooks/use-confirm-dialog";
import { useAuth } from "@/context/authContext";
import { SHIFT_HOURS_LOG_MESSAGES } from "@/lib/log-descriptions/attendance-management";

export function ShiftHours() {
    const { flexibilityParameter: parameterData, ...hrSettings } = useData();
    const { showToast } = useToast();
    const { theme } = useTheme();
    const { confirm, ConfirmDialog } = useConfirm();
    const { userData } = useAuth();

    const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
    const [isFlexibilityModalOpen, setIsFlexibilityModalOpen] = useState<boolean>(false);
    const [flexibilityMinute, setFlexibilityMinute] = useState<number>(
        parameterData?.at(0)?.minute ?? 0,
    );
    const [editingShiftHour, setEditingShiftHour] = useState<ShiftHourModel | null>(null);
    const [isAddEditLoading, setIsAddEditLoading] = useState<boolean>(false);
    const [isDoneLoading, setIsDoneLoading] = useState<boolean>(false);
    const [formData, setFormData] = useState<Partial<ShiftHourModel>>({
        id: "",
        name: "",
        shiftHours: [{ startTime: "", endTime: "" }],
        active: "Yes",
    });
    const shiftHours: ShiftHourModel[] = hrSettings.shiftHours;
    const flexibilityParameter: FlexibilityParameterModel = {
        id: parameterData?.at(0)?.id ?? "",
        minute: flexibilityMinute,
    };

    // THEME CLASSES
    const cardBg = theme === "dark" ? "bg-black border-gray-700" : "bg-white border-gray-200";
    const headingColor = theme === "dark" ? "text-gray-100" : "text-gray-900";
    const bodyColor = theme === "dark" ? "text-gray-300" : "text-gray-700";
    const mutedColor = theme === "dark" ? "text-gray-400" : "text-gray-600";
    const panelBorder = theme === "dark" ? "border-gray-800" : "border-gray-200";
    const tableHeaderBg = theme === "dark" ? "bg-black" : "bg-gray-50";
    const tableRowHover = theme === "dark" ? "hover:bg-[#141414]" : "hover:bg-amber-50/50";
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
    const chipBadge =
        theme === "dark"
            ? "bg-amber-900/20 text-amber-300 border-amber-700"
            : "bg-amber-50 text-amber-700 border-amber-200";

    const handleAddShiftHour = async () => {
        setIsAddEditLoading(true);
        const newShiftHour: Omit<ShiftHourModel, "id"> = {
            timestamp: dayjs().format(timestampFormat),
            name: formData.name || "",
            shiftHours: formData?.shiftHours?.map(sh => ({
                startTime: dayjs(sh.startTime, "HH:mm").format("hh:mm A"),
                endTime: dayjs(sh.endTime, "HH:mm").format("hh:mm A"),
            })) || [{ startTime: "", endTime: "" }],
            active: formData.active || "Yes",
        };

        if (editingShiftHour) {
            const { timestamp: _timestamp, ...data } = newShiftHour;
            const res = await hrSettingsService.update(
                "shiftHours",
                editingShiftHour.id,
                data,
                userData?.uid ?? "",
                SHIFT_HOURS_LOG_MESSAGES.UPDATED({
                    id: editingShiftHour.id,
                    name: data.name,
                    shiftHours: data.shiftHours,
                    active: data.active,
                }),
            );
            if (res) {
                showToast("Shift hour updated successfully", "Success", "success");
                resetForm();
            } else {
                showToast("Error updating shift hour", "Error", "error");
            }
        } else {
            const res = await hrSettingsService.create(
                "shiftHours",
                newShiftHour,
                userData?.uid ?? "",
                SHIFT_HOURS_LOG_MESSAGES.CREATED({
                    name: newShiftHour.name,
                    shiftHours: newShiftHour.shiftHours,
                    active: newShiftHour.active,
                }),
            );
            if (res) {
                showToast("Shift hour created successfully", "Success", "success");
                resetForm();
            } else {
                showToast("Error creating shift hour", "Error", "error");
            }
        }
        setIsAddEditLoading(false);
    };

    const handleEditShiftHour = (shiftHour: ShiftHourModel) => {
        setEditingShiftHour(shiftHour);
        console.log(shiftHour);
        setFormData({
            id: shiftHour.id,
            name: shiftHour.name,
            shiftHours: shiftHour.shiftHours.map(sh => ({
                startTime: dayjs(sh.startTime, "hh:mm A").format("HH:mm"),
                endTime: dayjs(sh.endTime, "hh:mm A").format("HH:mm"),
            })),
            active: shiftHour.active,
        });
        setIsAddModalOpen(true);
    };

    const handleDeleteShiftHour = async (id: string) => {
        confirm("Are you sure ?", async () => {
            const res = await hrSettingsService.remove(
                "shiftHours",
                id,
                userData?.uid ?? "",
                SHIFT_HOURS_LOG_MESSAGES.DELETED(id),
            );
            if (res) {
                showToast("Shift hour deleted successfully", "Success", "success");
            } else {
                showToast("Error deleting shift hour", "Error", "error");
            }
        });
    };

    const resetForm = () => {
        setFormData({
            id: "",
            name: "",
            shiftHours: [{ startTime: "", endTime: "" }],
            active: "Yes",
        });
        setEditingShiftHour(null);
        setIsAddModalOpen(false);
    };

    const addShiftDivision = () => {
        setFormData(prev => ({
            ...prev,
            shiftHours: [...(prev.shiftHours || []), { startTime: "", endTime: "" }],
        }));
    };

    const removeShiftDivision = (index: number) => {
        setFormData(prev => ({
            ...prev,
            shiftHours: prev.shiftHours?.filter((_, i) => i !== index) || [],
        }));
    };

    const updateShiftDivision = (index: number, field: keyof ShiftHourDivision, value: string) => {
        setFormData(prev => ({
            ...prev,
            shiftHours:
                prev.shiftHours?.map((division, i) =>
                    i === index ? { ...division, [field]: value } : division,
                ) || [],
        }));
    };

    const handleSaveFlexibilityParameter = async () => {
        setIsDoneLoading(true);
        if (flexibilityParameter.id !== "") {
            const res = await updateParameter(flexibilityParameter);
            if (res) {
                showToast("Flexibility parameter updated successfully", "Success", "success");
                setIsFlexibilityModalOpen(false);
            } else {
                showToast("Error updating flexibility parameter", "Error", "error");
            }
        } else {
            const { id: _id, ...data } = flexibilityParameter;
            const res = await createParameter(data);
            if (res) {
                showToast("Flexibility parameter created successfully", "Success", "success");
                setIsFlexibilityModalOpen(false);
            } else {
                showToast("Error creating flexibility parameter", "Error", "error");
            }
        }
        setIsDoneLoading(false); // fix: turn it off after request finishes
    };

    return (
        <Card className={cn(cardBg, "border")}>
            <CardHeader>
                <CardTitle className={cn("flex items-center gap-2", headingColor)}>
                    <Clock className={cn("h-5 w-5", accentIcon)} />
                    Shift Hours
                </CardTitle>
            </CardHeader>

            <CardContent className="space-y-6">
                <div className="flex justify-between items-center">
                    <p className={cn(bodyColor)}>
                        Define shift timings, break periods, and working hour configurations.
                    </p>

                    <div className="flex gap-2">
                        {/* FLEXIBILITY PARAMETER */}
                        <Dialog
                            open={isFlexibilityModalOpen}
                            onOpenChange={setIsFlexibilityModalOpen}
                        >
                            <DialogTrigger asChild>
                                <Button
                                    variant="outline"
                                    className={cn("bg-transparent", outlineAmber)}
                                >
                                    <Settings className="h-4 w-4 mr-2" />
                                    Flexibility Parameter
                                </Button>
                            </DialogTrigger>
                            <DialogContent className={cn("sm:max-w-lg", dialogContentClass)}>
                                <DialogHeader>
                                    <DialogTitle
                                        className={cn("flex items-center gap-2", headingColor)}
                                    >
                                        <AlertTriangle className={cn("h-5 w-5", accentIcon)} />
                                        Define Flexibility Parameter
                                    </DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                    <div className={cn("text-sm leading-relaxed", bodyColor)}>
                                        The flexibility parameter allows you to set a buffer time in
                                        minutes for employees to clock in and clock out. For
                                        example, if the flexibility parameter is set to{" "}
                                        <span className="font-medium">15</span> minutes, employees
                                        can clock in up to 15 minutes before or after their
                                        scheduled start time and clock out up to 15 minutes before
                                        or after their scheduled end time.
                                    </div>

                                    <div className="space-y-2">
                                        <Label
                                            htmlFor="flexibilityMinutes"
                                            className={cn("text-sm font-medium", headingColor)}
                                        >
                                            Flexibility Parameter (minutes):{" "}
                                            <span className="text-red-500">*</span>
                                        </Label>
                                        <Input
                                            id="flexibilityMinutes"
                                            type="number"
                                            min="0"
                                            value={flexibilityMinute}
                                            onChange={e =>
                                                setFlexibilityMinute(
                                                    Number.parseInt(e.target.value) || 0,
                                                )
                                            }
                                            placeholder="Enter number of minutes"
                                            className={cn("w-full", inputClass)}
                                        />
                                    </div>

                                    <div className="flex gap-2 pt-4">
                                        <Button
                                            variant="outline"
                                            onClick={() => setIsFlexibilityModalOpen(false)}
                                            className={cn("flex-1 bg-transparent", panelBorder)}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            onClick={handleSaveFlexibilityParameter}
                                            className={cn("flex-1", primaryBtn)}
                                            disabled={isDoneLoading}
                                        >
                                            {isDoneLoading ? (
                                                <div className="flex items-center justify-center gap-2">
                                                    <Loader2 className="animate-spin h-4 w-4" />
                                                    Saving...
                                                </div>
                                            ) : (
                                                "Done"
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            </DialogContent>
                        </Dialog>

                        {/* ADD / EDIT SHIFT HOUR */}
                        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                            <DialogTrigger asChild>
                                <Button className={primaryBtn}>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Shift Hour
                                </Button>
                            </DialogTrigger>
                            <DialogContent className={cn("sm:max-w-lg", dialogContentClass)}>
                                <DialogHeader>
                                    <DialogTitle className={headingColor}>
                                        {editingShiftHour ? "Edit Shift Hour" : "Add Shift Hour"}
                                    </DialogTitle>
                                </DialogHeader>

                                <div className="space-y-4 max-h-[60vh] px-1 md:px-4 overflow-y-auto">
                                    <div className="space-y-2">
                                        <Label htmlFor="name" className={bodyColor}>
                                            Shift Name
                                        </Label>
                                        <Input
                                            id="name"
                                            value={formData.name}
                                            onChange={e =>
                                                setFormData(prev => ({
                                                    ...prev,
                                                    name: e.target.value,
                                                }))
                                            }
                                            placeholder="Morning Shift"
                                            className={inputClass}
                                        />
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <Label className={bodyColor}>
                                                Shift Hour Divisions
                                            </Label>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={addShiftDivision}
                                                className={cn("bg-transparent", outlineAmber)}
                                            >
                                                <Plus className="h-4 w-4 mr-1" />
                                                Add Division
                                            </Button>
                                        </div>

                                        {formData.shiftHours?.map((division, index) => (
                                            <div
                                                key={index}
                                                className={cn(
                                                    "flex items-center gap-2 p-3 rounded-lg",
                                                    theme === "dark"
                                                        ? "border border-gray-700 bg-black"
                                                        : "border border-gray-200 bg-white",
                                                )}
                                            >
                                                <div className="flex-1 space-y-2">
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <div>
                                                            <Label
                                                                className={cn("text-xs", bodyColor)}
                                                            >
                                                                Start Time
                                                            </Label>
                                                            <Input
                                                                type="time"
                                                                value={division.startTime}
                                                                onChange={e =>
                                                                    updateShiftDivision(
                                                                        index,
                                                                        "startTime",
                                                                        e.target.value,
                                                                    )
                                                                }
                                                                className={cn(
                                                                    "text-sm",
                                                                    inputClass,
                                                                )}
                                                            />
                                                        </div>
                                                        <div>
                                                            <Label
                                                                className={cn("text-xs", bodyColor)}
                                                            >
                                                                End Time
                                                            </Label>
                                                            <Input
                                                                type="time"
                                                                value={division.endTime}
                                                                onChange={e => {
                                                                    console.log(e.target.value);
                                                                    updateShiftDivision(
                                                                        index,
                                                                        "endTime",
                                                                        e.target.value,
                                                                    );
                                                                }}
                                                                className={cn(
                                                                    "text-sm",
                                                                    inputClass,
                                                                )}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                                {(formData.shiftHours?.length || 0) > 1 && (
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => removeShiftDivision(index)}
                                                        className={cn("p-1", iconBtnRed)}
                                                        aria-label="Remove division"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        ))}
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
                                            onClick={handleAddShiftHour}
                                            className={cn("flex-1", primaryBtn)}
                                            disabled={isAddEditLoading}
                                            aria-label={
                                                editingShiftHour
                                                    ? "Update Shift Hour"
                                                    : "Add Shift Hour"
                                            }
                                        >
                                            {isAddEditLoading ? (
                                                <div className="flex items-center justify-center gap-2">
                                                    <Loader2 className="animate-spin h-4 w-4" />
                                                    {editingShiftHour ? "Updating..." : "Adding..."}
                                                </div>
                                            ) : (
                                                `${editingShiftHour ? "Update" : "Add"} Shift Hour`
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>

                {/* TABLE */}
                <div className={cn("rounded-lg overflow-hidden border", panelBorder)}>
                    <Table>
                        <TableHeader className={tableHeaderBg}>
                            <TableRow>
                                <TableHead className={headingColor}>Name</TableHead>
                                <TableHead className={headingColor}>Time Divisions</TableHead>
                                <TableHead className={headingColor}>Status</TableHead>
                                <TableHead className={cn("text-right", headingColor)}>
                                    Actions
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {shiftHours?.length === 0 ? (
                                <TableRow>
                                    <TableCell
                                        colSpan={4}
                                        className={cn("py-10 text-center", mutedColor)}
                                    >
                                        No shift hours yet. Use{" "}
                                        <span className="font-medium">Add Shift Hour</span>.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                shiftHours.map(shiftHour => (
                                    <TableRow key={shiftHour.id} className={tableRowHover}>
                                        <TableCell className={bodyColor}>
                                            {shiftHour.name}
                                        </TableCell>
                                        <TableCell>
                                            <div className="space-y-1">
                                                {shiftHour.shiftHours.map((division, index) => (
                                                    <Badge
                                                        key={index}
                                                        variant="outline"
                                                        className={cn("mr-1", chipBadge)}
                                                    >
                                                        {division.startTime} - {division.endTime}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                className={cn(
                                                    "px-2.5 py-1 text-xs font-medium",
                                                    shiftHour.active === "Yes" ? badgeYes : badgeNo,
                                                )}
                                            >
                                                {shiftHour.active}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={e => {
                                                        e.stopPropagation();
                                                        handleEditShiftHour(shiftHour);
                                                    }}
                                                    className={cn("h-8 w-8 p-0", iconBtnAmber)}
                                                    aria-label="Edit shift hour"
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={async e => {
                                                        e.stopPropagation();
                                                        await handleDeleteShiftHour(shiftHour.id!);
                                                    }}
                                                    className={cn("h-8 w-8 p-0", iconBtnRed)}
                                                    aria-label="Delete shift hour"
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
