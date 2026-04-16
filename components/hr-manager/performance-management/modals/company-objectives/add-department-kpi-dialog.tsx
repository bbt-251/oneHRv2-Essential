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
    DepartmentSettingsModel,
    hrSettingsService,
} from "@/lib/backend/firebase/hrSettingsService";
import { useState } from "react";

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
import { Check, ChevronsUpDown, X } from "lucide-react";

interface AddDepartmentKPIDialogProps {
    open: boolean;
    setOpen: (value: boolean) => void;
    period: string;
    departments: DepartmentSettingsModel[];
}

function AddDepartmentKPIDialog({
    open,
    setOpen,
    period,
    departments,
}: AddDepartmentKPIDialogProps) {
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
    const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
    const [section, setSection] = useState<string | undefined>(undefined);
    const [target, setTarget] = useState("");
    const [linkedObjectiveId, setLinkedObjectiveId] = useState<string[]>([]);
    const [dataSource, setDataSource] = useState<"Manual" | "System" | "Employee Objectives">(
        "Manual",
    );
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Show section only when exactly one department is selected
    const showSectionField = selectedDepartments.length === 1;

    // Get sections for the selected department (only when single department selected)
    const departmentSections = showSectionField
        ? sections.filter(s => s.department === selectedDepartments[0] && s.active)
        : [];

    // Get period name for display
    const getPeriodName = (periodId: string) => {
        const periodObj = periodicOptions.find(p => p.id === periodId);
        return periodObj ? periodObj.periodName : "Unknown Period";
    };

    const resetForm = () => {
        setTitle("");
        setDescription("");
        setSelectedDepartments([]);
        setSection(undefined);
        setTarget("");
        setLinkedObjectiveId([]);
        setDataSource("Manual");
    };

    const handleClose = (isOpen: boolean) => {
        if (!isOpen) {
            resetForm();
        }
        setOpen(isOpen);
    };

    const handleSave = async () => {
        // Validation
        if (!title || !description || selectedDepartments.length === 0) {
            showToast("Please fill in all required fields.", "error", "error");
            return;
        }

        setIsSubmitting(true);

        try {
            if (selectedDepartments.length === 1) {
                // Single department - create one KPI
                const newKPI: any = {
                    title,
                    description,
                    department: selectedDepartments[0],
                    target,
                    linkedObjectiveId,
                    dataSource,
                    status: "Draft" as const,
                    period,
                };
                // Only add section if it has a value
                if (section) {
                    newKPI.section = section;
                }
                await hrSettingsService.create(
                    "departmentKPIs",
                    newKPI,
                    userData?.uid,
                    PERFORMANCE_MANAGEMENT_LOG_MESSAGES.DEPARTMENT_KPI_CREATED({
                        title,
                        departmentName:
                            departments.find(d => d.id === selectedDepartments[0])?.name ||
                            selectedDepartments[0],
                        count: 1,
                    }),
                );
                showToast("Department KPI created successfully", "success", "success");
            } else {
                // Multiple departments - create multiple KPIs using batch
                const kpiDataArray = selectedDepartments.map((deptId: string) => ({
                    title,
                    description,
                    department: deptId,
                    target,
                    linkedObjectiveId,
                    dataSource,
                    status: "Draft" as const,
                    period,
                }));

                const departmentNames = selectedDepartments
                    .map(deptId => departments.find(d => d.id === deptId)?.name || deptId)
                    .join(", ");

                const result = await hrSettingsService.batchCreate(
                    "departmentKPIs",
                    kpiDataArray,
                    userData?.uid,
                    PERFORMANCE_MANAGEMENT_LOG_MESSAGES.DEPARTMENT_KPI_CREATED({
                        title,
                        departmentName: departmentNames,
                        count: selectedDepartments.length,
                    }),
                );

                if (result.success) {
                    showToast(
                        `Created ${selectedDepartments.length} department KPIs successfully`,
                        "success",
                        "success",
                    );
                } else {
                    throw new Error(result.error || "Failed to create KPIs");
                }
            }

            // The parent component will handle refreshing the data
            resetForm();
            setOpen(false);
        } catch (error) {
            console.error("Failed to save department KPI:", error);
            showToast("Failed to create department KPI. Please try again.", "error", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className={`max-w-2xl ${theme === "dark" ? "bg-black" : "bg-white"}`}>
                <DialogHeader>
                    <DialogTitle>Create Department KPI</DialogTitle>
                    <DialogDescription>
                        Define a KPI that measures department performance
                    </DialogDescription>
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
                            {/* Multi-select popover for creation mode */}
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        className="w-full justify-between"
                                    >
                                        {selectedDepartments.length > 0
                                            ? `${selectedDepartments.length} department${selectedDepartments.length > 1 ? "s" : ""} selected`
                                            : "Select departments..."}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                    <Command>
                                        <CommandInput placeholder="Search departments..." />
                                        <CommandList>
                                            <CommandEmpty>No department found.</CommandEmpty>
                                            <CommandGroup>
                                                {departments
                                                    .filter(dept => dept.active)
                                                    .map(dept => {
                                                        const isSelected =
                                                            selectedDepartments.includes(dept.id);
                                                        return (
                                                            <CommandItem
                                                                key={dept.id}
                                                                onSelect={() => {
                                                                    if (isSelected) {
                                                                        setSelectedDepartments(
                                                                            selectedDepartments.filter(
                                                                                id =>
                                                                                    id !== dept.id,
                                                                            ),
                                                                        );
                                                                    } else {
                                                                        setSelectedDepartments([
                                                                            ...selectedDepartments,
                                                                            dept.id,
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
                                                                {dept.name}
                                                            </CommandItem>
                                                        );
                                                    })}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                            {/* Show selected department badges */}
                            {selectedDepartments.length > 0 && (
                                <div className="pt-2 flex flex-wrap gap-1">
                                    {selectedDepartments.map(deptId => {
                                        const dept = departments.find(d => d.id === deptId);
                                        return (
                                            <Badge
                                                key={deptId}
                                                variant="secondary"
                                                className="font-normal"
                                            >
                                                {dept?.name || deptId}
                                                <button
                                                    className="ml-1 hover:text-red-500"
                                                    onClick={e => {
                                                        e.stopPropagation();
                                                        setSelectedDepartments(
                                                            selectedDepartments.filter(
                                                                id => id !== deptId,
                                                            ),
                                                        );
                                                    }}
                                                >
                                                    <X className="h-3 w-3" />
                                                </button>
                                            </Badge>
                                        );
                                    })}
                                </div>
                            )}
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

                    {/* Section field - optional, appears only when exactly one department is selected */}
                    {showSectionField && (
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

                    {/* Info message when multiple departments selected */}
                    {selectedDepartments.length > 1 && (
                        <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                            <p className="text-xs text-blue-600 dark:text-blue-400">
                                This KPI will be applied to {selectedDepartments.length}{" "}
                                departments. The KPI will apply to the entire departments (all
                                sections).
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
                    {period && (
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
                                    {getPeriodName(period)}
                                </Badge>
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => handleClose(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={isSubmitting}>
                        {isSubmitting ? "Creating..." : "Create"} KPI
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default AddDepartmentKPIDialog;
