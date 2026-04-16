"use client";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
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
import { Textarea } from "@/components/ui/textarea";
import {
    DepartmentKPIModel,
    DepartmentSettingsModel,
    hrSettingsService,
} from "@/lib/backend/firebase/hrSettingsService";
import { useEffect, useState } from "react";

import { useTheme } from "@/components/theme-provider";
import { Badge } from "@/components/ui/badge";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAuth } from "@/context/authContext";
import { useFirestore } from "@/context/firestore-context";
import { useToast } from "@/context/toastContext";
import { PERFORMANCE_MANAGEMENT_LOG_MESSAGES } from "@/lib/log-descriptions/performance-management";
import { cn } from "@/lib/utils";
import { Check, ChevronsUpDown } from "lucide-react";

interface EditDepartmentKPIDialogProps {
    open: boolean;
    setOpen: (value: boolean) => void;
    kpi: DepartmentKPIModel | null;
    departments: DepartmentSettingsModel[];
}

function EditDepartmentKPIDialog({
    open,
    setOpen,
    kpi,
    departments,
}: EditDepartmentKPIDialogProps) {
    const { theme } = useTheme();
    const { hrSettings } = useFirestore();
    const { showToast } = useToast();
    const { userData } = useAuth();

    const periodicOptions = hrSettings?.periodicOptions || [];
    const sections = hrSettings?.sectionSettings || [];
    const strategicObjectives = hrSettings?.strategicObjectives || [];

    // Form state
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [department, setDepartment] = useState("");
    const [section, setSection] = useState<string | undefined>(undefined);
    const [target, setTarget] = useState("");
    const [linkedObjectiveId, setLinkedObjectiveId] = useState<string[]>([]);
    const [dataSource, setDataSource] = useState<"Manual" | "System" | "Employee Objectives">(
        "Manual",
    );
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Load KPI data when dialog opens with data
    useEffect(() => {
        if (kpi) {
            setTitle(kpi.title);
            setDescription(kpi.description);
            setDepartment(kpi.department);
            setSection(kpi.section);
            setTarget(kpi.target);
            setLinkedObjectiveId(kpi.linkedObjectiveId || []);
            setDataSource(kpi.dataSource);
        }
    }, [kpi]);

    // Get sections for the selected department
    const departmentSections = department
        ? sections.filter(s => s.department === department && s.active)
        : [];

    // Get period name for display
    const getPeriodName = (periodId: string) => {
        const periodObj = periodicOptions.find(p => p.id === periodId);
        return periodObj ? periodObj.periodName : "Unknown Period";
    };

    const handleClose = (isOpen: boolean) => {
        if (!isOpen) {
            // Reset form when closing
            setTitle("");
            setDescription("");
            setDepartment("");
            setSection(undefined);
            setTarget("");
            setLinkedObjectiveId([]);
            setDataSource("Manual");
        }
        setOpen(isOpen);
    };

    const handleSave = async () => {
        // Validation
        if (!title || !description || !department) {
            showToast("Please fill in all required fields.", "error", "error");
            return;
        }

        if (!kpi) {
            showToast("No KPI selected for editing.", "error", "error");
            return;
        }

        setIsSubmitting(true);

        try {
            const updatedKPI: any = {
                title,
                description,
                department,
                target,
                linkedObjectiveId,
                dataSource,
            };

            // Only add section if it has a value
            if (section) {
                updatedKPI.section = section;
            }

            await hrSettingsService.update(
                "departmentKPIs",
                kpi.id,
                updatedKPI,
                userData?.uid,
                PERFORMANCE_MANAGEMENT_LOG_MESSAGES.DEPARTMENT_KPI_UPDATED({
                    title,
                    departmentName: departments.find(d => d.id === department)?.name || department,
                }),
            );
            showToast("Department KPI updated successfully", "success", "success");

            // Reset form
            setTitle("");
            setDescription("");
            setDepartment("");
            setSection(undefined);
            setTarget("");
            setLinkedObjectiveId([]);
            setDataSource("Manual");

            setOpen(false);
        } catch (error) {
            console.error("Failed to update department KPI:", error);
            showToast("Failed to update department KPI. Please try again.", "error", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Don't render if no KPI is provided
    if (!kpi) {
        return null;
    }

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className={`max-w-2xl ${theme === "dark" ? "bg-black" : "bg-white"}`}>
                <DialogHeader>
                    <DialogTitle>Edit Department KPI</DialogTitle>
                    <DialogDescription>Update the KPI details</DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <div>
                        <Label htmlFor="kpi-title">Title *</Label>
                        <Input
                            id="kpi-title"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            placeholder="Enter KPI title"
                        />
                    </div>

                    <div>
                        <Label htmlFor="kpi-description">Description *</Label>
                        <Textarea
                            id="kpi-description"
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            placeholder="Describe the KPI measurement"
                            rows={3}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="department">Department *</Label>
                            <Select
                                value={department}
                                onValueChange={value => {
                                    setDepartment(value);
                                    setSection(undefined); // Reset section when department changes
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select department" />
                                </SelectTrigger>
                                <SelectContent>
                                    {departments
                                        .filter(dept => dept.active)
                                        .map(dept => (
                                            <SelectItem key={dept.id} value={dept.id}>
                                                {dept.name}
                                            </SelectItem>
                                        ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label htmlFor="target">Target</Label>
                            <Input
                                id="target"
                                value={target}
                                onChange={e => setTarget(e.target.value)}
                                placeholder="e.g., 15%, $1M, 95%"
                            />
                        </div>
                    </div>

                    {/* Section field - optional */}
                    {department && (
                        <div>
                            <Label htmlFor="section">Section (Optional)</Label>
                            <Select
                                value={section || ""}
                                onValueChange={value => setSection(value || undefined)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select section (optional)" />
                                </SelectTrigger>
                                <SelectContent>
                                    {departmentSections.length > 0 ? (
                                        departmentSections.map(s => (
                                            <SelectItem key={s.id} value={s.id}>
                                                {s.name}
                                            </SelectItem>
                                        ))
                                    ) : (
                                        <SelectItem value="no-sections" disabled>
                                            No sections for this department
                                        </SelectItem>
                                    )}
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-gray-500 mt-1">
                                Leave empty to make this KPI apply to the entire department
                            </p>
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="linked-objective">Link to Strategic Objective</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    className="w-full justify-between"
                                >
                                    {linkedObjectiveId.length > 0
                                        ? `${linkedObjectiveId.length} selected`
                                        : "Select strategic objective..."}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                <Command>
                                    <CommandInput placeholder="Search strategic objective..." />
                                    <CommandList>
                                        <CommandEmpty>No strategic objective found.</CommandEmpty>
                                        <CommandGroup>
                                            {strategicObjectives?.map(objective => {
                                                const isSelected = linkedObjectiveId.includes(
                                                    objective.id,
                                                );
                                                return (
                                                    <CommandItem
                                                        key={objective.id}
                                                        onSelect={() => {
                                                            if (isSelected) {
                                                                setLinkedObjectiveId(
                                                                    linkedObjectiveId.filter(
                                                                        id => id !== objective.id,
                                                                    ),
                                                                );
                                                            } else {
                                                                setLinkedObjectiveId([
                                                                    ...linkedObjectiveId,
                                                                    objective.id,
                                                                ]);
                                                            }
                                                        }}
                                                    >
                                                        <Check
                                                            className={cn(
                                                                "mr-2 h-4 w-4",
                                                                isSelected
                                                                    ? "opacity-100"
                                                                    : "opacity-0",
                                                            )}
                                                        />
                                                        {objective.title}
                                                    </CommandItem>
                                                );
                                            })}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                        <div className="pt-1 flex flex-wrap gap-1">
                            {linkedObjectiveId.map(id => {
                                const objective = strategicObjectives.find(emp => emp.id === id);
                                return (
                                    <Badge variant="secondary" key={id} className="font-normal">
                                        {objective?.title || id}
                                    </Badge>
                                );
                            })}
                        </div>
                    </div>

                    <div>
                        <Label htmlFor="data-source">Data Source</Label>
                        <Select
                            value={dataSource}
                            onValueChange={(value: any) => setDataSource(value)}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Manual">Manual Entry</SelectItem>
                                <SelectItem value="System">System Integration</SelectItem>
                                <SelectItem value="Employee Objectives">
                                    Employee Objectives
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Performance Period Display */}
                    {kpi.period && (
                        <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                            <Label className="text-sm text-gray-500 dark:text-gray-400">
                                Performance Period
                            </Label>
                            <div className="flex items-center gap-2 mt-1">
                                <Badge
                                    variant="outline"
                                    style={{
                                        borderColor: "#3f3d56",
                                        color: "#ffe6a7",
                                        backgroundColor: "#3f3d56",
                                    }}
                                >
                                    {getPeriodName(kpi.period)}
                                </Badge>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                This KPI is linked to the selected performance period. To change the
                                period, please close this modal and select a different period from
                                the dropdown.
                            </p>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => handleClose(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={isSubmitting}>
                        {isSubmitting ? "Updating..." : "Update"} KPI
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default EditDepartmentKPIDialog;
