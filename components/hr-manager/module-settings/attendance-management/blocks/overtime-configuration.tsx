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
import { useData } from "@/context/app-data-context";
import { useToast } from "@/context/toastContext";
import { useConfirm } from "@/hooks/use-confirm-dialog";
import { hrSettingsService, OvertimeConfigurationModel } from "@/lib/backend/hr-settings-service";
import { saveBackendPayrollSettings } from "@/lib/backend/client/payroll-settings-client";
import { timestampFormat } from "@/lib/util/dayjs_format";
import dayjs from "dayjs";
import { Edit, Loader2, Plus, Timer, Trash2 } from "lucide-react";
import { useState } from "react";
import { useTheme } from "@/components/theme-provider";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/authContext";
import { OVERTIME_CONFIGURATION_LOG_MESSAGES } from "@/lib/log-descriptions/attendance-management";

export function OvertimeConfiguration() {
    const { ...hrSettings } = useData();
    const payrollSettingsDoc = hrSettings.payrollSettings?.at(0) ?? null;
    const { showToast } = useToast();
    const { confirm, ConfirmDialog } = useConfirm();
    const { theme } = useTheme();
    const { userData } = useAuth();

    const [isAddEditLoading, setIsAddEditLoading] = useState<boolean>(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
    const [editingConfig, setEditingConfig] = useState<OvertimeConfigurationModel | null>(null);
    const [formData, setFormData] = useState<Partial<OvertimeConfigurationModel>>({
        overtimeType: "",
        overtimeRate: 0,
        active: "Yes",
    });

    const standardMonthlyWorkingHours = payrollSettingsDoc?.monthlyWorkingHours ?? 173;
    const [standardMonthlyWorkingHoursDraft, setStandardMonthlyWorkingHoursDraft] =
        useState<number>(payrollSettingsDoc?.monthlyWorkingHours ?? 173);
    const [isSavingStandardMonthlyWorkingHours, setIsSavingStandardMonthlyWorkingHours] =
        useState<boolean>(false);
    const [showSetMonthlyWorkingHoursDialog, setShowSetMonthlyWorkingHoursDialog] =
        useState<boolean>(false);
    const overtimeConfigs: OvertimeConfigurationModel[] = hrSettings.overtimeTypes;

    const isWholeNumberPercent = (value: number) =>
        Number.isFinite(value) && Number.isInteger(value) && value > 0;

    // --- Dark mode styles (matching ShiftType approach) ---
    const cardBg = theme === "dark" ? "bg-black border-gray-800" : "bg-white border-gray-200";
    const headingColor = theme === "dark" ? "text-gray-100" : "text-gray-900";
    const bodyColor = theme === "dark" ? "text-gray-300" : "text-gray-600";
    const mutedText = theme === "dark" ? "text-gray-400" : "text-gray-500";
    const borderClass = theme === "dark" ? "border-gray-700" : "border-gray-200";
    const inputClass =
        theme === "dark"
            ? "bg-black border-gray-700 text-gray-100 placeholder-gray-400"
            : "bg-white border-gray-300 text-gray-900 placeholder-gray-500";
    const dialogContentClass =
        theme === "dark" ? "bg-black text-gray-100" : "bg-white text-gray-900";
    const tableRowHover = theme === "dark" ? "hover:bg-[#141414]" : "hover:bg-amber-50/50";
    const badgeChip =
        theme === "dark"
            ? "bg-amber-900/50 text-amber-400 border-amber-800"
            : "bg-amber-50 text-amber-700 border-amber-200";
    const badgeYes =
        theme === "dark"
            ? "bg-green-900/50 text-green-400 border-green-800"
            : "bg-green-100 text-green-800";
    const badgeNo =
        theme === "dark" ? "bg-black text-gray-400 border-gray-600" : "bg-gray-100 text-gray-800";

    async function runHourlyWageMigration(nextHours: number) {
        try {
            const res = await fetch("/api/migrate-hourly-wages", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ monthlyWorkingHours: nextHours }),
            });
            const data = (await res.json()) as {
                error?: string;
                updated?: number;
                skipped?: number;
            };
            if (!res.ok) {
                return {
                    ok: false as const,
                    error:
                        typeof data.error === "string"
                            ? data.error
                            : "Hourly wage migration failed",
                };
            }
            return {
                ok: true as const,
                updated: data.updated ?? 0,
                skipped: data.skipped ?? 0,
            };
        } catch {
            return {
                ok: false as const,
                error: "Could not reach hourly wage migration service",
            };
        }
    }

    const handleSaveStandardMonthlyWorkingHours = async (nextValue: number) => {
        if (!Number.isFinite(nextValue) || nextValue <= 0) {
            showToast("Standard Monthly Working Hours must be greater than 0", "Error", "error");
            return;
        }

        setIsSavingStandardMonthlyWorkingHours(true);
        try {
            const existingDoc = hrSettings.payrollSettings?.at(0) ?? null;
            let saved = false;

            if (existingDoc?.id) {
                const res = await saveBackendPayrollSettings({
                    ...existingDoc,
                    monthlyWorkingHours: nextValue,
                });

                if (res) {
                    saved = true;
                } else {
                    showToast("Error updating Standard Monthly Working Hours", "Error", "error");
                }
            } else {
                const baseCurrency = hrSettings.currencies?.at(0)?.name ?? "USD";
                const res = await saveBackendPayrollSettings({
                    baseCurrency,
                    taxRate: 0,
                    monthlyWorkingHours: nextValue,
                });

                if (res) {
                    saved = true;
                } else {
                    showToast("Error creating Standard Monthly Working Hours", "Error", "error");
                }
            }

            if (saved) {
                const mig = await runHourlyWageMigration(nextValue);
                if (mig.ok) {
                    showToast(
                        `Monthly working hours saved. Hourly wages recalculated: ${mig.updated} employee(s) updated, ${mig.skipped} unchanged.`,
                        "Success",
                        "success",
                    );
                } else {
                    showToast(
                        `Monthly working hours saved, but hourly wage recalculation failed: ${mig.error}`,
                        "Partial success",
                        "warning",
                    );
                }
            }
        } finally {
            setIsSavingStandardMonthlyWorkingHours(false);
        }
    };

    const handleAddConfig = async () => {
        // required fields
        if (!formData.overtimeType?.trim()) {
            showToast("Overtime type is required", "Error", "error");
            return;
        }
        if (!formData.overtimeRate) {
            showToast("Overtime rate is required", "Error", "error");
            return;
        }
        if (!isWholeNumberPercent(formData.overtimeRate)) {
            showToast(
                "Overtime rate must be a whole-number percent (e.g., 150 for 1.5x)",
                "Invalid Overtime Rate",
                "error",
            );
            return;
        }
        setIsAddEditLoading(true);
        const newConfig: Omit<OvertimeConfigurationModel, "id"> = {
            timestamp: dayjs().format(timestampFormat),
            overtimeType: formData.overtimeType || "",
            overtimeRate: formData.overtimeRate || 0,
            active: formData.active || "Yes",
        };

        if (editingConfig) {
            const { id: _id, ...data } = formData;
            const res = await hrSettingsService.update(
                "overtimeTypes",
                editingConfig.id,
                data,
                userData?.uid ?? "",
                OVERTIME_CONFIGURATION_LOG_MESSAGES.UPDATED({
                    id: editingConfig.id,
                    overtimeType: data.overtimeType,
                    overtimeRate: data.overtimeRate,
                    active: data.active,
                }),
            );
            if (res) {
                showToast("Overtime types updated successfully", "Success", "success");
                resetForm();
            } else {
                showToast("Error updating Overtime types", "Error", "error");
            }
        } else {
            const res = await hrSettingsService.create(
                "overtimeTypes",
                newConfig,
                userData?.uid ?? "",
                OVERTIME_CONFIGURATION_LOG_MESSAGES.CREATED({
                    overtimeType: newConfig.overtimeType,
                    overtimeRate: newConfig.overtimeRate,
                    active: newConfig.active,
                }),
            );
            if (res) {
                showToast("Overtime types created successfully", "Success", "success");
                resetForm();
            } else {
                showToast("Error creating overtime config", "Error", "error");
            }
        }

        setIsAddEditLoading(false);
    };

    const handleEditConfig = (config: OvertimeConfigurationModel) => {
        setEditingConfig(config);
        setFormData({
            overtimeType: config.overtimeType,
            overtimeRate: config.overtimeRate,
            active: config.active,
        });
        setIsAddModalOpen(true);
    };

    const handleDeleteConfig = (id: string) => {
        confirm("Are you sure ?", async () => {
            const res = await hrSettingsService.remove(
                "overtimeTypes",
                id,
                userData?.uid ?? "",
                OVERTIME_CONFIGURATION_LOG_MESSAGES.DELETED(id),
            );
            if (res) {
                showToast("Overtime type deleted successfully", "Success", "success");
            } else {
                showToast("Error deleting overtime type", "Error", "error");
            }
        });
    };

    const resetForm = () => {
        setFormData({
            overtimeType: "",
            overtimeRate: 0,
            active: "Yes",
        });
        setEditingConfig(null);
        setIsAddModalOpen(false);
    };

    return (
        <Card className={cn(cardBg, "border")}>
            <CardHeader>
                <CardTitle className={cn("flex items-center gap-2", headingColor)}>
                    <Timer className="h-5 w-5 text-amber-600" />
                    Overtime Configuration
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex justify-between items-start gap-4">
                    <p className={cn(bodyColor, "flex-1 min-w-0")}>
                        Set up overtime rules, rates, approval workflows, and calculation methods.
                    </p>

                    <div className="flex flex-col items-end gap-3 shrink-0">
                        <Button
                            type="button"
                            onClick={() => {
                                setStandardMonthlyWorkingHoursDraft(standardMonthlyWorkingHours);
                                setShowSetMonthlyWorkingHoursDialog(true);
                            }}
                            disabled={isSavingStandardMonthlyWorkingHours}
                            className="bg-amber-600 hover:bg-amber-700 text-white"
                        >
                            Set Monthly Working Hours
                        </Button>

                        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                            <DialogTrigger asChild>
                                <Button className="bg-amber-600 hover:bg-amber-700 text-white">
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Overtime Configuration
                                </Button>
                            </DialogTrigger>
                            <DialogContent className={cn("sm:max-w-md", dialogContentClass)}>
                                <DialogHeader>
                                    <DialogTitle>
                                        {editingConfig
                                            ? "Edit Overtime Configuration"
                                            : "Add Overtime Configuration"}
                                    </DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="overtimeType">Overtime Type</Label>
                                        <Input
                                            id="overtimeType"
                                            className={inputClass}
                                            value={formData.overtimeType}
                                            onChange={e =>
                                                setFormData(prev => ({
                                                    ...prev,
                                                    overtimeType: e.target.value,
                                                }))
                                            }
                                            placeholder="Standard"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="overtimeRate">Overtime Rate (%)</Label>
                                        <Input
                                            id="overtimeRate"
                                            type="number"
                                            step="1"
                                            min="1"
                                            className={inputClass}
                                            value={formData.overtimeRate}
                                            onChange={e =>
                                                setFormData(prev => ({
                                                    ...prev,
                                                    overtimeRate:
                                                        Number.parseFloat(e.target.value) || 0,
                                                }))
                                            }
                                            placeholder="150"
                                        />
                                        <p className={cn("text-xs", mutedText)}>
                                            Enter a whole-number percent (e.g., 150 means 1.5x
                                            regular rate).
                                        </p>
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
                                            onClick={handleAddConfig}
                                            className="bg-amber-600 hover:bg-amber-700 text-white flex-1"
                                        >
                                            {isAddEditLoading ? (
                                                <div className="flex items-center justify-center gap-2">
                                                    <Loader2 className="animate-spin h-4 w-4" />
                                                    {editingConfig ? "Updating..." : "Adding..."}
                                                </div>
                                            ) : (
                                                `${editingConfig ? "Update" : "Add"} Configuration`
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>

                <Dialog
                    open={showSetMonthlyWorkingHoursDialog}
                    onOpenChange={setShowSetMonthlyWorkingHoursDialog}
                >
                    <DialogContent className={cn("max-w-md", dialogContentClass)}>
                        <DialogHeader>
                            <DialogTitle>Set Standard Monthly Working Hours</DialogTitle>
                        </DialogHeader>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="standardMonthlyWorkingHoursDraft">
                                    Standard Monthly Working Hours (hours)
                                </Label>
                                <Input
                                    id="standardMonthlyWorkingHoursDraft"
                                    type="number"
                                    min={0}
                                    step="0.1"
                                    value={standardMonthlyWorkingHoursDraft}
                                    onChange={e =>
                                        setStandardMonthlyWorkingHoursDraft(
                                            Number.parseFloat(e.target.value) || 0,
                                        )
                                    }
                                    className={inputClass}
                                />
                            </div>

                            <div
                                className={cn(
                                    "flex justify-end space-x-2 pt-4 border-t",
                                    borderClass,
                                )}
                            >
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setShowSetMonthlyWorkingHoursDialog(false)}
                                    className="flex-1 bg-transparent"
                                    disabled={isSavingStandardMonthlyWorkingHours}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="button"
                                    onClick={async () => {
                                        await handleSaveStandardMonthlyWorkingHours(
                                            standardMonthlyWorkingHoursDraft,
                                        );
                                        setShowSetMonthlyWorkingHoursDialog(false);
                                    }}
                                    disabled={isSavingStandardMonthlyWorkingHours}
                                    className="bg-amber-600 hover:bg-amber-700 text-white flex-1"
                                >
                                    {isSavingStandardMonthlyWorkingHours ? (
                                        <span className="inline-flex items-center justify-center gap-2">
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Saving...
                                        </span>
                                    ) : (
                                        "Save"
                                    )}
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>

                <div className={cn("rounded-lg border", borderClass)}>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className={headingColor}>Overtime Type</TableHead>
                                <TableHead className={headingColor}>Rate (%)</TableHead>
                                <TableHead className={headingColor}>Status</TableHead>
                                <TableHead className={cn("text-right", headingColor)}>
                                    Actions
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {overtimeConfigs.map(config => (
                                <TableRow key={config.id} className={cn(tableRowHover)}>
                                    <TableCell className={bodyColor}>
                                        {config.overtimeType}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={badgeChip}>
                                            {config.overtimeRate}%
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant="outline"
                                            className={config.active === "Yes" ? badgeYes : badgeNo}
                                        >
                                            {config.active}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleEditConfig(config)}
                                                className={cn(
                                                    "h-8 w-8 p-0",
                                                    theme === "dark"
                                                        ? "text-amber-400 hover:text-amber-300 hover:bg-amber-500/10"
                                                        : "text-amber-600 hover:text-amber-700 hover:bg-amber-50",
                                                )}
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleDeleteConfig(config.id!)}
                                                className={cn(
                                                    "h-8 w-8 p-0",
                                                    theme === "dark"
                                                        ? "text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                                        : "text-red-600 hover:text-red-700 hover:bg-red-50",
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
