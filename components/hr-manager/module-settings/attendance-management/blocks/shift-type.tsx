import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Edit, Loader2, Plus, Trash2, Users } from "lucide-react";
import { useState } from "react";
import { useData } from "@/context/app-data-context";
import {
    ModuleSettingsRepository as settingsService,
    ShiftTypeModel,
} from "@/lib/repository/hr-settings";
import { timestampFormat } from "@/lib/util/dayjs_format";
import dayjs from "dayjs";
import { useToast } from "@/context/toastContext";
import { useConfirm } from "@/hooks/use-confirm-dialog";
import { useTheme } from "@/components/theme-provider";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/authContext";
import { SHIFT_TYPE_LOG_MESSAGES } from "@/lib/log-descriptions/attendance-management";

export function ShiftType() {
    const { shiftTypes, shiftHours } = useData();
    const { showToast } = useToast();
    const { confirm, ConfirmDialog } = useConfirm();
    const { theme } = useTheme();
    const { userData } = useAuth();

    const [isAddEditLoading, setIsAddEditLoading] = useState<boolean>(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
    const [editingShiftType, setEditingShiftType] = useState<ShiftTypeModel | null>(null);
    const [formData, setFormData] = useState<Partial<ShiftTypeModel>>({
        name: "",
        workingDays: [],
        startDate: "",
        endDate: "",
        active: "Yes",
    });

    // --- Dark mode styles (inline like ShiftHours) ---
    const cardBg = theme === "dark" ? "bg-black border-gray-800" : "bg-white border-gray-200";
    const headingColor = theme === "dark" ? "text-gray-100" : "text-gray-900";
    const bodyColor = theme === "dark" ? "text-gray-300" : "text-gray-600";
    const inputClass =
        theme === "dark"
            ? "bg-black border-gray-700 text-gray-100 placeholder-gray-400"
            : "bg-white border-gray-300 text-gray-900 placeholder-gray-500";
    const dialogContentClass =
        theme === "dark" ? "bg-black text-gray-100" : "bg-white text-gray-900";
    const tableRowHover = theme === "dark" ? "hover:bg-[#141414]" : "hover:bg-amber-50/50";
    const badgeYes =
        theme === "dark"
            ? "bg-green-900/50 text-green-400 border-green-800"
            : "bg-green-100 text-green-800";
    const badgeNo =
        theme === "dark" ? "bg-black text-gray-400 border-gray-600" : "bg-gray-100 text-gray-800";
    const badgeChip =
        theme === "dark"
            ? "bg-amber-900/50 text-amber-400 border-amber-800"
            : "bg-amber-50 text-amber-700 border-amber-200";

    // Available days of the week
    const daysOfWeek = [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
    ];

    const shiftHourOptions: { label: string; value: string }[] = shiftHours.map(sh => ({
        label: sh.name,
        value: sh.id,
    }));

    const handleAddShiftType = async () => {
        // required fields
        if (!formData.name?.trim()) {
            showToast("Name is required", "Error", "error");
            return;
        }
        if (!formData.workingDays?.length) {
            showToast("Working days are required", "Error", "error");
            return;
        }

        if (new Date(formData.startDate ?? "") >= new Date(formData.endDate ?? "")) {
            showToast("Start date must be before end date", "Validation Error", "error");
            return;
        }

        setIsAddEditLoading(true);
        const newShiftType: Omit<ShiftTypeModel, "id"> = {
            timestamp: dayjs().format(timestampFormat),
            name: formData.name || "",
            workingDays: formData.workingDays || [],
            startDate: formData.startDate || "",
            endDate: formData.endDate || "",
            active: formData.active || "Yes",
        };

        if (editingShiftType) {
            const { id: _id, ...data } = formData;
            const res = await settingsService.update(
                "shiftTypes",
                editingShiftType.id,
                data,
                userData?.uid ?? "",
                SHIFT_TYPE_LOG_MESSAGES.UPDATED({
                    id: editingShiftType.id,
                    name: data.name,
                    workingDays: data.workingDays,
                    startDate: data.startDate ?? undefined,
                    endDate: data.endDate ?? undefined,
                    active: data.active,
                }),
            );
            if (res) {
                showToast("Shift type updated successfully", "Success", "success");
                resetForm();
            } else {
                showToast("Error updating shift type", "Error", "error");
            }
        } else {
            const res = await settingsService.create(
                "shiftTypes",
                newShiftType,
                userData?.uid ?? "",
                SHIFT_TYPE_LOG_MESSAGES.CREATED({
                    name: newShiftType.name,
                    workingDays: newShiftType.workingDays,
                    startDate: newShiftType.startDate ?? "-",
                    endDate: newShiftType.endDate ?? "-",
                    active: newShiftType.active,
                }),
            );
            if (res) {
                showToast("Shift type created successfully", "Success", "success");
                resetForm();
            } else {
                showToast("Error creating shift type", "Error", "error");
            }
        }
        setIsAddEditLoading(false);
    };

    const handleEditShiftType = (shiftType: ShiftTypeModel) => {
        setEditingShiftType(shiftType);
        setFormData({
            name: shiftType.name,
            workingDays: [...shiftType.workingDays],
            startDate: shiftType.startDate,
            endDate: shiftType.endDate,
            active: shiftType.active,
        });
        setIsAddModalOpen(true);
    };

    const handleDeleteShiftType = (id: string) => {
        confirm("Are you sure ?", async () => {
            const res = await settingsService.remove(
                "shiftTypes",
                id,
                userData?.uid ?? "",
                SHIFT_TYPE_LOG_MESSAGES.DELETED(id),
            );
            if (res) {
                showToast("Shift type deleted successfully", "Success", "success");
            } else {
                showToast("Error deleting shift type", "Error", "error");
            }
        });
    };

    const resetForm = () => {
        setFormData({
            name: "",
            workingDays: [],
            startDate: "",
            endDate: "",
            active: "Yes",
        });
        setEditingShiftType(null);
        setIsAddModalOpen(false);
    };

    const handleDaySelection = (day: string, isSelected: boolean, shiftHour = "") => {
        if (isSelected) {
            setFormData(prev => ({
                ...prev,
                workingDays: [
                    ...(prev.workingDays || []),
                    { dayOfTheWeek: day, associatedShiftHour: shiftHour },
                ],
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                workingDays: prev.workingDays?.filter(wd => wd.dayOfTheWeek !== day) || [],
            }));
        }
    };

    const updateShiftHourForDay = (day: string, shiftHour: string) => {
        setFormData(prev => ({
            ...prev,
            workingDays:
                prev.workingDays?.map(wd =>
                    wd.dayOfTheWeek === day ? { ...wd, associatedShiftHour: shiftHour } : wd,
                ) || [],
        }));
    };

    const isDaySelected = (day: string) => {
        return formData.workingDays?.some(wd => wd.dayOfTheWeek === day) || false;
    };

    const getShiftHourForDay = (day: string) => {
        return formData.workingDays?.find(wd => wd.dayOfTheWeek === day)?.associatedShiftHour || "";
    };

    return (
        <Card className={cn(cardBg, "border")}>
            <CardHeader>
                <CardTitle className={cn("flex items-center gap-2", headingColor)}>
                    <Users className="h-5 w-5 text-amber-600" />
                    Shift Type
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex justify-between items-center">
                    <p className={cn(bodyColor)}>
                        Configure different shift types such as day, night, rotating, and flexible
                        shifts.
                    </p>

                    <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-amber-600 hover:bg-amber-700 text-white">
                                <Plus className="h-4 w-4 mr-2" />
                                Add Shift Type
                            </Button>
                        </DialogTrigger>
                        <DialogContent className={cn("sm:max-w-2xl", dialogContentClass)}>
                            <DialogHeader>
                                <DialogTitle>
                                    {editingShiftType ? "Edit Shift Type" : "Add Shift Type"}
                                </DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 max-h-96 overflow-y-auto">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Shift Type Name</Label>
                                        <Input
                                            id="name"
                                            className={inputClass}
                                            value={formData.name}
                                            onChange={e =>
                                                setFormData(prev => ({
                                                    ...prev,
                                                    name: e.target.value,
                                                }))
                                            }
                                            placeholder="Standard Weekday Shift"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="startDate">Start Date</Label>
                                        <Input
                                            id="startDate"
                                            type="date"
                                            className={inputClass}
                                            value={formData.startDate ?? undefined}
                                            onChange={e =>
                                                setFormData(prev => ({
                                                    ...prev,
                                                    startDate: e.target.value,
                                                }))
                                            }
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="endDate">End Date</Label>
                                        <Input
                                            id="endDate"
                                            type="date"
                                            className={inputClass}
                                            value={formData.endDate ?? undefined}
                                            onChange={e =>
                                                setFormData(prev => ({
                                                    ...prev,
                                                    endDate: e.target.value,
                                                }))
                                            }
                                        />
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <Label>Working Days & Associated Shift Hours</Label>
                                    <div
                                        className={cn(
                                            "space-y-3 p-4 rounded-lg border",
                                            theme === "dark"
                                                ? "border-gray-700"
                                                : "border-gray-200",
                                        )}
                                    >
                                        {daysOfWeek.map(day => (
                                            <div key={day} className="flex items-center gap-4">
                                                <div className="flex items-center space-x-2 min-w-[120px]">
                                                    <Checkbox
                                                        id={day}
                                                        checked={isDaySelected(day)}
                                                        onCheckedChange={checked =>
                                                            handleDaySelection(
                                                                day,
                                                                checked as boolean,
                                                                shiftHourOptions?.at(0)?.value,
                                                            )
                                                        }
                                                    />
                                                    <Label
                                                        htmlFor={day}
                                                        className="text-sm font-medium"
                                                    >
                                                        {day}
                                                    </Label>
                                                </div>
                                                {isDaySelected(day) && (
                                                    <div className="flex-1">
                                                        <Select
                                                            value={getShiftHourForDay(day)}
                                                            onValueChange={value =>
                                                                updateShiftHourForDay(day, value)
                                                            }
                                                        >
                                                            <SelectTrigger
                                                                className={cn(inputClass, "w-full")}
                                                            >
                                                                <SelectValue placeholder="Select shift hour" />
                                                            </SelectTrigger>
                                                            <SelectContent
                                                                className={dialogContentClass}
                                                            >
                                                                {shiftHourOptions.map(shiftHour => (
                                                                    <SelectItem
                                                                        key={shiftHour.value}
                                                                        value={shiftHour.value}
                                                                    >
                                                                        {shiftHour.label}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="active">Active Status</Label>
                                    <Select
                                        value={formData.active}
                                        onValueChange={(value: "Yes" | "No") =>
                                            setFormData(prev => ({ ...prev, active: value }))
                                        }
                                    >
                                        <SelectTrigger className={inputClass}>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className={dialogContentClass}>
                                            <SelectItem value="Yes">Yes</SelectItem>
                                            <SelectItem value="No">No</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="flex gap-2 pt-4">
                                    <Button
                                        variant="outline"
                                        onClick={resetForm}
                                        className="flex-1 bg-transparent"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={handleAddShiftType}
                                        className="bg-amber-600 hover:bg-amber-700 text-white flex-1"
                                    >
                                        {isAddEditLoading ? (
                                            <div className="flex items-center justify-center gap-2">
                                                <Loader2 className="animate-spin h-4 w-4" />
                                                {editingShiftType ? "Updating..." : "Adding..."}
                                            </div>
                                        ) : (
                                            `${editingShiftType ? "Update" : "Add"} Shift Type`
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>

                <div
                    className={cn(
                        "rounded-lg border",
                        theme === "dark" ? "border-gray-700" : "border-gray-200",
                    )}
                >
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className={headingColor}>Name</TableHead>
                                <TableHead className={headingColor}>Working Days</TableHead>
                                <TableHead className={headingColor}>Period</TableHead>
                                <TableHead className={headingColor}>Status</TableHead>
                                <TableHead className={cn("text-right", headingColor)}>
                                    Actions
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {shiftTypes.map(shiftType => (
                                <TableRow key={shiftType.id} className={tableRowHover}>
                                    <TableCell className={bodyColor}>{shiftType.name}</TableCell>
                                    <TableCell>
                                        <div className="space-y-1">
                                            {shiftType.workingDays.map((workingDay, index) => (
                                                <div key={index} className="text-xs">
                                                    <Badge variant="outline" className={badgeChip}>
                                                        {workingDay.dayOfTheWeek}:{" "}
                                                        {shiftHours.find(
                                                            sh =>
                                                                sh.id ==
                                                                workingDay.associatedShiftHour,
                                                        )?.name ?? ""}
                                                    </Badge>
                                                </div>
                                            ))}
                                        </div>
                                    </TableCell>
                                    <TableCell className={cn("text-sm", bodyColor)}>
                                        {shiftType.startDate} - {shiftType.endDate}
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant="outline"
                                            className={
                                                shiftType.active === "Yes" ? badgeYes : badgeNo
                                            }
                                        >
                                            {shiftType.active}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={e => {
                                                    e.stopPropagation();
                                                    handleEditShiftType(shiftType);
                                                }}
                                                className={cn(
                                                    "h-8 w-8 p-0 hover:bg-amber-50",
                                                    theme === "dark"
                                                        ? "text-amber-400 hover:text-amber-300 hover:bg-amber-500/10"
                                                        : "text-amber-600 hover:text-amber-700",
                                                )}
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={e => {
                                                    e.stopPropagation();
                                                    handleDeleteShiftType(shiftType.id!);
                                                }}
                                                className={cn(
                                                    "h-8 w-8 p-0 hover:bg-red-50",
                                                    theme === "dark"
                                                        ? "text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                                        : "text-red-600 hover:text-red-700",
                                                )}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
            {ConfirmDialog}
        </Card>
    );
}
