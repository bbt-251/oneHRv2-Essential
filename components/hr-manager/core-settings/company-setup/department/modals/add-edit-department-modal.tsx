import CascaderDropdown from "@/components/custom-cascader";
import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { useData } from "@/context/app-data-context";
import { useToast } from "@/context/toastContext";
import {
    CoreSettingsRepository as settingsService,
    DepartmentSettingsModel,
    LocationModel,
} from "@/lib/repository/hr-settings";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/context/authContext";
import { DEPARTMENT_LOG_MESSAGES } from "@/lib/log-descriptions/department-section";

interface LocationNode extends LocationModel {
    parentId?: string | null;
    children: LocationNode[];
    isExpanded?: boolean;
    description?: string;
    address?: string;
}

interface AddDepartmentProps {
    showAddModal: boolean;
    setShowAddModal: (show: boolean) => void;
    editingDepartment: DepartmentSettingsModel | null;
    departments: DepartmentSettingsModel[];
}

const AddEditDepartmentModal = ({
    showAddModal,
    setShowAddModal,
    editingDepartment,
    departments,
}: AddDepartmentProps) => {
    const { theme } = useTheme();
    const { showToast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const { employees, locations } = useData();
    const { userData } = useAuth();
    const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);

    const managers = employees.filter(e => e.role.includes("Manager"));
    const filteredLocations = locations.filter(location => location.active === "Yes");

    const buildLocationTree = (
        locations: LocationModel[],
        parentId: string | null = null,
    ): LocationNode[] => {
        return locations
            .filter(location => location.parentId === parentId)
            .map(location => ({
                ...location,
                children: buildLocationTree(locations, location.id),
            }));
    };

    const locationTree = buildLocationTree(filteredLocations);

    const locationOptions = useMemo(() => {
        const convertToOptions = (
            nodes: LocationNode[],
        ): { value: string; label: string; children?: ReturnType<typeof convertToOptions> }[] => {
            return nodes.map(node => ({
                value: node.id,
                label: node.name,
                children:
                    node.children && node.children.length > 0
                        ? convertToOptions(node.children)
                        : undefined,
            }));
        };
        return convertToOptions(locationTree);
    }, [locationTree]);

    const [formData, setFormData] = useState<{
        name: string;
        code: string;
        manager: string;
        location: string;
        active: boolean;
    }>({
        name: editingDepartment?.name ?? "",
        code: editingDepartment?.code ?? "",
        manager: editingDepartment?.manager ?? "",
        location: editingDepartment?.location ?? "",
        active: editingDepartment?.active ?? true,
    });

    const resetForm = () => {
        setFormData({
            name: editingDepartment?.name ?? "",
            code: editingDepartment?.code ?? "",
            manager: editingDepartment?.manager ?? "",
            location: editingDepartment?.location ?? "",
            active: editingDepartment?.active ?? true,
        });
        setSelectedLocationId(editingDepartment?.location ?? null);
    };

    useEffect(() => {
        if (editingDepartment) {
            setFormData({
                name: editingDepartment?.name ?? "",
                code: editingDepartment?.code ?? "",
                manager: editingDepartment?.manager ?? "",
                location: editingDepartment?.location ?? "",
                active: editingDepartment?.active ?? true,
            });
            // Find the location object by its name to get its ID
            const initialLocation = locations.find(loc => loc.name === editingDepartment.location);
            setSelectedLocationId(initialLocation ? initialLocation.id : null);
        } else {
            setFormData({ name: "", code: "", manager: "", location: "", active: true });
            setSelectedLocationId(null);
        }
    }, [editingDepartment, locations]);

    const handleLocationSelect = (locationId: string) => {
        setSelectedLocationId(locationId);

        const selected = locations.find(loc => loc.id === locationId);
        if (selected) {
            setFormData(prevFormData => ({
                ...prevFormData,
                location: selected.name,
            }));
        }
    };

    const handleSubmit = async () => {
        if (isSubmitting) return;

        if (!formData.name.trim()) {
            showToast("Department name is required", "error", "error");
            return;
        }
        if (!formData.code.trim()) {
            showToast("Department code is required", "error", "error");
            return;
        }
        if (!formData.manager.trim()) {
            showToast("Department manager is required", "error", "error");
            return;
        }

        const existingDepartment = departments.find(
            department =>
                department.name === formData.name &&
                (!editingDepartment || department.id !== editingDepartment.id),
        );

        if (existingDepartment) {
            showToast("Department name must be unique", "error", "error");
            return;
        }

        setIsSubmitting(true);

        try {
            if (editingDepartment) {
                await settingsService.update(
                    "departmentSettings",
                    editingDepartment.id,
                    formData,
                    userData?.uid ?? "",
                    DEPARTMENT_LOG_MESSAGES.UPDATED({
                        id: editingDepartment.id,
                        name: formData.name,
                        code: formData.code,
                        manager: formData.manager,
                        location: formData.location,
                        active: formData.active,
                    }),
                );
                showToast("Department updated successfully", "success", "success");
            } else {
                await settingsService.create(
                    "departmentSettings",
                    formData,
                    userData?.uid ?? "",
                    DEPARTMENT_LOG_MESSAGES.CREATED({
                        name: formData.name,
                        code: formData.code,
                        manager: formData.manager,
                        location: formData.location,
                        active: formData.active,
                    }),
                );
                showToast("Department created successfully", "success", "success");
            }
            setShowAddModal(false);
            resetForm();
        } catch (error) {
            console.error("Failed to save department:", error);
            showToast("Failed to save department", "error", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
            <DialogContent
                className={`max-w-md rounded-2xl border shadow-2xl ${
                    theme === "dark" ? "bg-black border-gray-800" : "bg-white border-gray-200"
                }`}
            >
                <DialogHeader className="pb-6">
                    <DialogTitle
                        className={`text-2xl font-bold ${
                            theme === "dark" ? "text-white" : "text-slate-900"
                        }`}
                    >
                        {editingDepartment ? "Edit Department" : "Add New Department"}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                    {[
                        {
                            key: "name",
                            label: "Department Name",
                            placeholder: "Enter department name",
                        },
                        {
                            key: "code",
                            label: "Department Code",
                            placeholder: "Enter department code",
                        },
                    ].map(({ key, label, placeholder }) => (
                        <div key={key} className="space-y-2">
                            <Label
                                className={`text-sm font-semibold ${
                                    theme === "dark" ? "text-gray-300" : "text-slate-700"
                                }`}
                            >
                                {label}
                            </Label>
                            <Input
                                value={formData[key as keyof typeof formData] as string}
                                onChange={e =>
                                    setFormData({
                                        ...formData,
                                        [key]: e.target.value,
                                    })
                                }
                                placeholder={placeholder}
                                className={`${
                                    theme === "dark"
                                        ? "bg-black border-gray-700 text-white placeholder-gray-500"
                                        : "bg-white border-gray-300 text-black placeholder-gray-400"
                                }`}
                            />
                        </div>
                    ))}

                    {/* managers select */}
                    <div className="space-y-2">
                        <Label className="text-sm font-semibold text-slate-700">Manager</Label>
                        <Select
                            value={formData.manager}
                            onValueChange={v => setFormData({ ...formData, manager: v })}
                        >
                            <SelectTrigger
                                className={
                                    theme === "dark" ? "bg-black text-white border-gray-600" : ""
                                }
                            >
                                <SelectValue placeholder="Select manager" />
                            </SelectTrigger>
                            <SelectContent
                                className={cn(
                                    theme === "dark"
                                        ? "bg-black border-gray-600"
                                        : "bg-white border-y border-amber-300",
                                    "w-40",
                                )}
                            >
                                {managers.map(manager => (
                                    <SelectItem key={manager.id} value={manager.uid}>
                                        {manager.firstName}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Location Selection */}
                    <div className="flex flex-col gap-2">
                        <Label className={theme === "dark" ? "text-gray-300" : "text-gray-700"}>
                            Location
                        </Label>
                        <CascaderDropdown
                            options={locationOptions}
                            setDynamicOptions={handleLocationSelect}
                            // Use the state that holds the ID
                            value={selectedLocationId || ""}
                        />
                        <p
                            className={`text-xs mt-1 ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}
                        >
                            Select department location from the list
                        </p>
                    </div>

                    <div className="flex items-center space-x-3">
                        <Checkbox
                            id="active"
                            checked={formData.active}
                            onCheckedChange={checked =>
                                setFormData({
                                    ...formData,
                                    active: checked as boolean,
                                })
                            }
                        />
                        <Label
                            htmlFor="active"
                            className={`text-sm font-semibold ${
                                theme === "dark" ? "text-gray-300" : "text-slate-700"
                            }`}
                        >
                            Active
                        </Label>
                    </div>

                    <div className="flex justify-end gap-3 pt-6">
                        <Button
                            variant="outline"
                            onClick={() => setShowAddModal(false)}
                            className={`rounded-lg ${
                                theme === "dark"
                                    ? "border-gray-700 text-gray-300 hover:bg-gray-800"
                                    : "border-gray-300 text-slate-700 hover:bg-gray-100"
                            }`}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            className={`rounded-lg ${
                                theme === "dark"
                                    ? "bg-amber-600 hover:bg-amber-700 text-white"
                                    : "bg-amber-600 hover:bg-amber-700 text-white"
                            }`}
                        >
                            {isSubmitting ? (
                                <div className="flex items-center justify-center gap-2">
                                    <Loader2 className="animate-spin h-4 w-4" />
                                    {editingDepartment ? "Updating..." : "Adding..."}
                                </div>
                            ) : (
                                `${editingDepartment ? "Update" : "Add"}`
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default AddEditDepartmentModal;
