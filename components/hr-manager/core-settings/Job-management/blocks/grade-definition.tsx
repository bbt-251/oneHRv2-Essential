"use client";

import { useCallback, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Pencil, Trash2, Loader2, CalendarIcon } from "lucide-react";
import ConfigTable, { ColumnDef } from "./config-table";
import {
    CoreSettingsRepository as settingsService,
    GradeDefinitionModel,
} from "@/lib/repository/hr-settings";
import { useData } from "@/context/app-data-context";
import { useToast } from "@/context/toastContext";
import { useConfirm } from "@/hooks/use-confirm-dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import dayjs from "dayjs";
import { dateFormat } from "@/lib/util/dayjs_format";
import { useTheme } from "@/components/theme-provider";
import { useAuth } from "@/context/authContext";
import { JOB_MANAGEMENT_LOG_MESSAGES } from "@/lib/log-descriptions/job-management";

type FormState = GradeDefinitionModel & { id?: string };

export default function GradeDefinition() {
    const { grades: rows } = useData();
    const { showToast } = useToast();
    const { theme } = useTheme();
    const { confirm, ConfirmDialog } = useConfirm();
    const { userData } = useAuth();
    const [saveLoading, setSaveLoading] = useState<boolean>(false);
    const [formOpen, setFormOpen] = useState<boolean>(false);
    const [formState, setFormState] = useState<FormState>({
        id: "",
        createdAt: "",
        updatedAt: "",
        grade: "",
        startDate: "",
        endDate: "",
        active: "Yes",
    });

    const confirmDelete = useCallback(
        (id: string) => {
            confirm("Are you sure ?", async () => {
                const res = await settingsService.remove(
                    "grades",
                    id,
                    userData?.uid ?? "",
                    JOB_MANAGEMENT_LOG_MESSAGES.GRADE_DELETED(id),
                );
                if (res) {
                    showToast("Grade deleted successfully", "Success", "success");
                } else {
                    showToast("Error deleting grade", "Error", "error");
                }
            });
        },
        [confirm, showToast, userData?.uid],
    );

    const columns: ColumnDef[] = useMemo(
        () => [
            { key: "createdAt", header: "Timestamp" },
            { key: "grade", header: "Grade" },
            { key: "startDate", header: "Start Date" },
            { key: "endDate", header: "End Date" },
            {
                key: "active",
                header: "Active",
                render: r => (
                    <Badge
                        className={
                            r.active === "Yes"
                                ? "bg-green-100 text-green-800 border-green-200"
                                : "bg-gray-100 text-gray-800"
                        }
                    >
                        {r.active}
                    </Badge>
                ),
            },
            {
                key: "actions",
                header: "Actions",
                render: r => (
                    <div className="flex items-center gap-2">
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={e => {
                                e.stopPropagation();
                                openEdit(r);
                            }}
                        >
                            <Pencil className="h-4 w-4 mr-1" />
                            Edit
                        </Button>
                        <Button
                            size="sm"
                            variant="destructive"
                            onClick={e => {
                                e.stopPropagation();
                                confirmDelete(r.id!);
                            }}
                        >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete
                        </Button>
                    </div>
                ),
            },
        ],
        [confirmDelete],
    );

    function openAdd() {
        setFormState({
            id: "",
            grade: "",
            startDate: "",
            endDate: "",
            active: "Yes",
            createdAt: "",
            updatedAt: "",
        });
        setFormOpen(true);
    }

    function openEdit(item: GradeDefinitionModel) {
        setFormState({ ...item });
        setFormOpen(true);
    }

    function validate(s: FormState) {
        if (!s.grade.trim()) return "Grade is required.";

        if (new Date(s.startDate) > new Date(s.endDate))
            return "Start Date must be before End Date.";
        return null;
    }

    async function saveForm() {
        const err = validate(formState);
        if (err) {
            showToast(err, "Missing field", "warning");
            return;
        }
        setSaveLoading(true);
        const newGrade: Omit<GradeDefinitionModel, "id" | "createdAt" | "updatedAt"> = {
            grade: formState.grade,
            startDate: formState.startDate,
            endDate: formState.endDate,
            active: formState.active,
        };

        if (formState.id) {
            // update
            const { id: _id, ...data } = formState;
            const res = await settingsService.update(
                "grades",
                formState.id,
                data,
                userData?.uid ?? "",
                JOB_MANAGEMENT_LOG_MESSAGES.GRADE_UPDATED({ id: formState.id, ...data }),
            );
            if (res) {
                showToast("Grade updated successfully", "Success", "success");
                setFormOpen(false);
            } else {
                showToast("Error updating grade", "Error", "error");
            }
        } else {
            // add
            const res = await settingsService.create(
                "grades",
                newGrade,
                userData?.uid ?? "",
                JOB_MANAGEMENT_LOG_MESSAGES.GRADE_CREATED(newGrade),
            );
            if (res) {
                showToast("Grade created successfully", "Success", "success");
                setFormOpen(false);
            } else {
                showToast("Error creating grade", "Error", "error");
            }
        }

        setSaveLoading(false);
    }

    return (
        <>
            <ConfigTable
                title="Grade Definition"
                columns={columns}
                data={rows}
                searchableKeys={["type", "grade"]}
                nonFilterableKeys={["id", "createdAt", "updatedAt", "startDate", "endDate"]}
                onRowClick={row => {
                    // Clicking a row opens the "Add Grade" form pre-filled with that grade's details
                    openEdit(row as GradeDefinitionModel);
                }}
                onAddClick={openAdd}
            />

            {/* Add/Edit Grade Dialog */}
            <Dialog open={formOpen} onOpenChange={setFormOpen}>
                <DialogContent className="max-w-2xl rounded-2xl">
                    <DialogHeader>
                        <DialogTitle>{formState?.id ? "Edit Grade" : "Add Grade"}</DialogTitle>
                    </DialogHeader>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="grade">Grade</Label>
                            <Input
                                id="grade"
                                value={formState.grade}
                                onChange={e => setFormState(s => ({ ...s, grade: e.target.value }))}
                                placeholder="e.g., G5"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="startDate">Start Date</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className={`w-full justify-start text-left font-normal ${theme === "dark" ? "  text-slate-200" : "border-slate-300 bg-white"}`}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {formState.startDate
                                            ? dayjs(formState.startDate).format(dateFormat)
                                            : "Select date"}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <Calendar
                                        mode="single"
                                        selected={
                                            formState.startDate
                                                ? new Date(formState.startDate)
                                                : undefined
                                        }
                                        onSelect={date => {
                                            if (date) {
                                                setFormState(s => ({
                                                    ...s,
                                                    startDate: date.toISOString(),
                                                }));
                                            }
                                        }}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="endDate">End Date</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className={`w-full justify-start text-left font-normal ${theme === "dark" ? "  text-slate-200" : "border-slate-300 bg-white"}`}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {formState.endDate
                                            ? dayjs(formState.endDate).format(dateFormat)
                                            : "Select date"}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <Calendar
                                        mode="single"
                                        selected={
                                            formState.endDate
                                                ? new Date(formState.endDate)
                                                : undefined
                                        }
                                        onSelect={date => {
                                            if (date) {
                                                setFormState(s => ({
                                                    ...s,
                                                    endDate: date.toISOString(),
                                                }));
                                            }
                                        }}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="active">Active</Label>
                            <Select
                                value={formState.active}
                                onValueChange={v =>
                                    setFormState(s => ({ ...s, active: v as "Yes" | "No" }))
                                }
                            >
                                <SelectTrigger id="active">
                                    <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Yes">Yes</SelectItem>
                                    <SelectItem value="No">No</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <DialogFooter className="mt-6">
                        <Button variant="outline" onClick={() => setFormOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            className="bg-amber-600 hover:bg-amber-700 text-white"
                            onClick={saveForm}
                        >
                            {saveLoading ? (
                                <div className="flex items-center justify-center gap-2">
                                    <Loader2 className="animate-spin h-4 w-4" />
                                    {formState?.id ? "Saving..." : "Adding..."}
                                </div>
                            ) : (
                                `${formState?.id ? "Save changes" : "Add Grade"}`
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {ConfirmDialog}
        </>
    );
}
