"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
    Search,
    Plus,
    Eye,
    Edit,
    Trash2,
    GitBranch,
    ChevronUp,
    ChevronDown,
    X,
} from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { SignatureWorkflowModel, ApproverModel } from "@/lib/models/signature-workflow";
import { useFirestore } from "@/context/firestore-context";
import { EmployeeMultiSelectDropdown } from "./employee-multi-select-dropdown";
import {
    createSignatureWorkflow,
    updateSignatureWorkflow,
    deleteSignatureWorkflow,
} from "@/lib/backend/api/hr-settings/signature-workflow-service";
import { useToast } from "@/context/toastContext";
import { useConfirm } from "@/hooks/use-confirm-dialog";
import { useAuth } from "@/context/authContext";

interface SignatureWorkflowTabProps {
    data: SignatureWorkflowModel[];
    setData: React.Dispatch<React.SetStateAction<SignatureWorkflowModel[]>>;
}

export function SignatureWorkflowTab({ data, setData }: SignatureWorkflowTabProps) {
    const { theme } = useTheme();
    const { activeEmployees, hrSettings } = useFirestore();
    const { showToast } = useToast();
    const { confirm, ConfirmDialog } = useConfirm();
    const { userData } = useAuth();

    const [searchTerm, setSearchTerm] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [editingItem, setEditingItem] = useState<SignatureWorkflowModel | null>(null);
    const [viewingItem, setViewingItem] = useState<SignatureWorkflowModel | null>(null);
    const [formData, setFormData] = useState<Omit<SignatureWorkflowModel, "id" | "timestamp">>({
        name: "",
        active: true,
        approvers: [],
    });
    const [selectedEmployeeIDs, setSelectedEmployeeIDs] = useState<string[]>([]);

    // Loading states
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState<string | null>(null);

    // Form validation
    const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

    const filteredData = data.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()),
    );

    const getDepartmentName = (departmentId: string) => {
        const department = hrSettings.departmentSettings?.find(d => d.id === departmentId);
        return department?.name || departmentId;
    };

    const getPositionName = (positionId: string) => {
        const position = hrSettings.positions?.find(p => p.id === positionId);
        return position?.name || positionId;
    };

    const handleAdd = () => {
        setEditingItem(null);
        setFormData({
            name: "",
            active: true,
            approvers: [],
        });
        setSelectedEmployeeIDs([]);
        setFormErrors({});
        setShowModal(true);
    };

    const handleEdit = (item: SignatureWorkflowModel) => {
        setEditingItem(item);
        setFormData({
            name: item.name,
            active: item.active,
            approvers: [...item.approvers],
        });
        setSelectedEmployeeIDs(item.approvers.map(a => a.employeeUID));
        setFormErrors({});
        setShowModal(true);
    };

    const handleView = (item: SignatureWorkflowModel) => {
        setViewingItem(item);
        setShowViewModal(true);
    };

    const handleDelete = async (id: string) => {
        const workflow = data.find(w => w.id === id);
        if (!workflow) return;

        confirm(
            `Are you sure you want to delete the signature workflow "${workflow.name}"?`,
            async () => {
                setIsDeleting(id);
                try {
                    const success = await deleteSignatureWorkflow(id, userData?.uid);
                    if (success) {
                        showToast("Signature workflow deleted successfully", "Success", "success");
                        // Data will be updated automatically via Firestore context
                    } else {
                        showToast("Failed to delete signature workflow", "Error", "error");
                    }
                } catch (error) {
                    console.error("Delete error:", error);
                    showToast(
                        "An error occurred while deleting the signature workflow",
                        "Error",
                        "error",
                    );
                } finally {
                    setIsDeleting(null);
                }
            },
        );
    };

    const handleRemoveApprover = (approverID: string) => {
        setFormData(prev => {
            const newApprovers = prev.approvers
                .filter(a => a.id !== approverID)
                .map((a, index) => ({ ...a, order: index + 1 }));
            return { ...prev, approvers: newApprovers };
        });
        setSelectedEmployeeIDs(prev =>
            prev.filter(id => {
                const approver = formData.approvers.find(a => a.id === approverID);
                return approver ? id !== approver.employeeUID : true;
            }),
        );
    };

    const handleMoveApprover = (approverID: string, direction: "up" | "down") => {
        setFormData(prev => {
            const index = prev.approvers.findIndex(a => a.id === approverID);
            if (
                (direction === "up" && index === 0) ||
                (direction === "down" && index === prev.approvers.length - 1)
            ) {
                return prev;
            }

            const newApprovers = [...prev.approvers];
            const swapIndex = direction === "up" ? index - 1 : index + 1;
            [newApprovers[index], newApprovers[swapIndex]] = [
                newApprovers[swapIndex],
                newApprovers[index],
            ];

            return {
                ...prev,
                approvers: newApprovers.map((a, i) => ({ ...a, order: i + 1 })),
            };
        });
    };

    const handleEmployeeSelectionChange = (selectedIds: string[]) => {
        setSelectedEmployeeIDs(selectedIds);

        // Convert selected employee IDs to approvers
        const newApprovers: ApproverModel[] = selectedIds
            .map((employeeUID, index) => {
                const employee = activeEmployees.find(emp => emp.uid === employeeUID);
                if (!employee) return null;

                const fullName = `${employee.firstName} ${employee.surname}`;
                return {
                    id: `${employeeUID}_${index}`,
                    employeeUID: employeeUID,
                    employeeName: fullName,
                    order: index + 1,
                };
            })
            .filter(Boolean) as ApproverModel[];

        setFormData(prev => ({
            ...prev,
            approvers: newApprovers,
        }));

        // Clear approvers error if there are now approvers
        if (newApprovers.length > 0 && formErrors.approvers) {
            setFormErrors(prev => ({ ...prev, approvers: "" }));
        }
    };

    const validateForm = () => {
        const errors: { [key: string]: string } = {};

        if (!formData.name.trim()) {
            errors.name = "Workflow name is required";
        }

        if (formData.approvers.length === 0) {
            errors.approvers = "At least one approver is required";
        }

        // Check for duplicate names
        const existingWorkflow = data.find(
            w =>
                w.name.toLowerCase() === formData.name.toLowerCase().trim() &&
                (!editingItem || w.id !== editingItem.id),
        );
        if (existingWorkflow) {
            errors.name = "A workflow with this name already exists";
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSave = async () => {
        if (!validateForm()) return;

        setIsSaving(true);
        try {
            const workflowData = {
                ...formData,
                name: formData.name.trim(),
                timestamp: new Date().toISOString(),
            };

            let success = false;
            if (editingItem) {
                success = await updateSignatureWorkflow(
                    { ...workflowData, id: editingItem.id },
                    userData?.uid,
                );
                if (success) {
                    showToast("Signature workflow updated successfully", "Success", "success");
                }
            } else {
                success = await createSignatureWorkflow(workflowData, userData?.uid);
                if (success) {
                    showToast("Signature workflow created successfully", "Success", "success");
                }
            }

            if (success) {
                setShowModal(false);
                setFormErrors({});
                // Data will be updated automatically via Firestore context
            } else {
                showToast("Failed to save signature workflow", "Error", "error");
            }
        } catch (error) {
            console.error("Save error:", error);
            showToast("An error occurred while saving the signature workflow", "Error", "error");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div className="relative max-w-md">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Search signature workflows..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className={`pl-10 rounded-lg ${theme === "dark" ? "bg-gray-900 border-gray-700" : "border-slate-200"}`}
                        />
                    </div>
                    <Button
                        onClick={handleAdd}
                        className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-2 rounded-lg"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Signature Workflow
                    </Button>
                </div>

                <Card
                    className={`${theme === "dark" ? "bg-gray-900 border-gray-800" : "bg-white/80 backdrop-blur-sm border-0 shadow-xl"} rounded-2xl overflow-hidden`}
                >
                    <CardHeader
                        className={`${theme === "dark" ? "bg-gray-800" : "bg-amber-800"} text-white p-6`}
                    >
                        <CardTitle className="flex items-center gap-4">
                            <GitBranch className="h-8 w-8" />
                            <div>
                                <div className="text-2xl">Signature Workflows</div>
                                <div
                                    className={`${theme === "dark" ? "text-gray-400" : "text-yellow-200"} text-sm font-normal`}
                                >
                                    {filteredData.length} total workflows
                                </div>
                            </div>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow
                                    className={
                                        theme === "dark"
                                            ? "bg-black hover:bg-black"
                                            : "bg-amber-800 hover:bg-amber-800"
                                    }
                                >
                                    <TableHead
                                        className={`${theme === "dark" ? "text-white" : "text-yellow-100"} font-semibold py-4 px-6`}
                                    >
                                        Name
                                    </TableHead>
                                    <TableHead
                                        className={`${theme === "dark" ? "text-white" : "text-yellow-100"} font-semibold py-4 px-6`}
                                    >
                                        Approvers
                                    </TableHead>
                                    <TableHead
                                        className={`${theme === "dark" ? "text-white" : "text-yellow-100"} font-semibold py-4 px-6`}
                                    >
                                        Status
                                    </TableHead>
                                    <TableHead
                                        className={`${theme === "dark" ? "text-white" : "text-yellow-100"} font-semibold py-4 px-6`}
                                    >
                                        Created
                                    </TableHead>
                                    <TableHead
                                        className={`${theme === "dark" ? "text-white" : "text-yellow-100"} font-semibold py-4 px-6 text-right`}
                                    >
                                        Actions
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredData.length === 0 ? (
                                    <TableRow>
                                        <TableCell
                                            colSpan={5}
                                            className={`text-center py-8 ${theme === "dark" ? "text-gray-400" : "text-slate-500"}`}
                                        >
                                            No signature workflows found. Click "Add Signature
                                            Workflow" to create one.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredData.map((item, index) => (
                                        <TableRow
                                            key={item.id}
                                            className={
                                                theme === "dark"
                                                    ? index % 2 === 0
                                                        ? "bg-black hover:bg-gray-800"
                                                        : "bg-gray-900 hover:bg-gray-800"
                                                    : index % 2 === 0
                                                        ? "bg-white hover:bg-amber-50/50"
                                                        : "bg-slate-50/50 hover:bg-amber-50/50"
                                            }
                                        >
                                            <TableCell
                                                className={`${theme === "dark" ? "text-white" : "text-slate-900"} px-6 font-medium`}
                                            >
                                                {item.name}
                                            </TableCell>
                                            <TableCell
                                                className={`${theme === "dark" ? "text-gray-300" : "text-slate-700"} px-6`}
                                            >
                                                <div className="flex flex-wrap gap-1">
                                                    {item.approvers.slice(0, 3).map(approver => (
                                                        <Badge
                                                            key={approver.id}
                                                            className="bg-blue-100 text-blue-800 text-xs"
                                                        >
                                                            {approver.order}.{" "}
                                                            {approver.employeeName}
                                                        </Badge>
                                                    ))}
                                                    {item.approvers.length > 3 && (
                                                        <Badge
                                                            className={
                                                                theme === "dark"
                                                                    ? "bg-gray-700 text-gray-300"
                                                                    : "bg-slate-100 text-slate-600 text-xs"
                                                            }
                                                        >
                                                            +{item.approvers.length - 3} more
                                                        </Badge>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="px-6">
                                                <Badge
                                                    className={`rounded-lg px-3 py-1 ${
                                                        item.active
                                                            ? theme === "dark"
                                                                ? "bg-green-900 text-green-300 border-green-700"
                                                                : "bg-green-100 text-green-800 border-green-200"
                                                            : theme === "dark"
                                                                ? "bg-gray-700 text-gray-300 border-gray-600"
                                                                : "bg-gray-100 text-gray-800 border-gray-200"
                                                    }`}
                                                >
                                                    {item.active ? "Active" : "Inactive"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell
                                                className={`${theme === "dark" ? "text-gray-400" : "text-slate-600"} px-6 text-sm`}
                                            >
                                                {new Date(item.timestamp).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell className="px-6 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => handleView(item)}
                                                        className={
                                                            theme === "dark"
                                                                ? "border-blue-700 text-blue-400 hover:bg-blue-900"
                                                                : "border-blue-200 text-blue-700 hover:bg-blue-50"
                                                        }
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => handleEdit(item)}
                                                        className={
                                                            theme === "dark"
                                                                ? "border-amber-700 text-amber-400 hover:bg-amber-900"
                                                                : "border-amber-200 text-amber-700 hover:bg-amber-50"
                                                        }
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => handleDelete(item.id)}
                                                        disabled={isDeleting === item.id}
                                                        className={
                                                            theme === "dark"
                                                                ? "border-red-700 text-red-400 hover:bg-red-900"
                                                                : "border-red-200 text-red-700 hover:bg-red-50"
                                                        }
                                                    >
                                                        {isDeleting === item.id ? (
                                                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-400 border-t-transparent" />
                                                        ) : (
                                                            <Trash2 className="h-4 w-4" />
                                                        )}
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* Add/Edit Modal */}
                <Dialog open={showModal} onOpenChange={setShowModal}>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-semibold text-amber-900 dark:text-amber-400">
                                {editingItem ? "Edit Signature Workflow" : "Add Signature Workflow"}
                            </DialogTitle>
                        </DialogHeader>

                        <div className="space-y-4">
                            <div>
                                <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                    Workflow Name <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    value={formData.name}
                                    onChange={e => {
                                        setFormData(prev => ({ ...prev, name: e.target.value }));
                                        if (formErrors.name) {
                                            setFormErrors(prev => ({ ...prev, name: "" }));
                                        }
                                    }}
                                    placeholder="Enter workflow name"
                                    className={`mt-1 ${formErrors.name ? "border-red-500 focus:border-red-500" : ""}`}
                                />
                                {formErrors.name && (
                                    <p className="text-xs text-red-500 mt-1">{formErrors.name}</p>
                                )}
                            </div>

                            <div className="flex items-center justify-between">
                                <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                    Active Status
                                </Label>
                                <Switch
                                    checked={formData.active}
                                    onCheckedChange={checked =>
                                        setFormData(prev => ({ ...prev, active: checked }))
                                    }
                                />
                            </div>

                            <div>
                                <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                    Approvers <span className="text-red-500">*</span>
                                </Label>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                                    Select employees to be approvers in the order they should sign
                                </p>

                                {/* Employee Multi-Select Dropdown */}
                                <EmployeeMultiSelectDropdown
                                    selectedEmployeeIDs={selectedEmployeeIDs}
                                    onSelectionChange={handleEmployeeSelectionChange}
                                    placeholder="Select approvers..."
                                />

                                {/* Approvers List */}
                                {formData.approvers.length === 0 ? (
                                    <div className="text-center py-6 border border-dashed border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-gray-800 mt-3">
                                        <p className="text-sm text-slate-500 dark:text-slate-400">
                                            No approvers selected yet
                                        </p>
                                        <p className="text-xs text-slate-400">
                                            Use the dropdown above to select employees
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-2 mt-3">
                                        {formData.approvers.map((approver, idx) => (
                                            <div
                                                key={approver.id}
                                                className="flex items-center justify-between p-3 bg-amber-50 dark:bg-gray-800 border border-amber-200 dark:border-gray-700 rounded-lg"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <span className="flex items-center justify-center w-6 h-6 bg-amber-600 text-white text-sm font-semibold rounded-full">
                                                        {approver.order}
                                                    </span>
                                                    <span className="font-medium dark:text-white">
                                                        {approver.employeeName}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() =>
                                                            handleMoveApprover(approver.id, "up")
                                                        }
                                                        disabled={idx === 0}
                                                        className="h-7 w-7 p-0"
                                                    >
                                                        <ChevronUp className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() =>
                                                            handleMoveApprover(approver.id, "down")
                                                        }
                                                        disabled={
                                                            idx === formData.approvers.length - 1
                                                        }
                                                        className="h-7 w-7 p-0"
                                                    >
                                                        <ChevronDown className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() =>
                                                            handleRemoveApprover(approver.id)
                                                        }
                                                        className="h-7 w-7 p-0 text-red-500 hover:text-red-700"
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {formErrors.approvers && (
                                    <p className="text-xs text-red-500 mt-1">
                                        {formErrors.approvers}
                                    </p>
                                )}
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t">
                                <Button
                                    variant="outline"
                                    onClick={() => setShowModal(false)}
                                    className="border-slate-200 dark:border-gray-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-gray-800"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleSave}
                                    disabled={
                                        isSaving ||
                                        !formData.name.trim() ||
                                        formData.approvers.length === 0
                                    }
                                    className="bg-amber-600 hover:bg-amber-700 text-white"
                                >
                                    {isSaving ? "Saving..." : editingItem ? "Update" : "Create"}
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* View Modal */}
                <Dialog open={showViewModal} onOpenChange={setShowViewModal}>
                    <DialogContent className="max-w-lg">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-semibold text-amber-900 dark:text-amber-400">
                                View Signature Workflow
                            </DialogTitle>
                        </DialogHeader>

                        {viewingItem && (
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label className="text-sm text-slate-500 dark:text-slate-400">
                                            Workflow Name
                                        </Label>
                                        <p className="font-medium dark:text-white">
                                            {viewingItem.name}
                                        </p>
                                    </div>
                                    <div>
                                        <Label className="text-sm text-slate-500 dark:text-slate-400">
                                            Status
                                        </Label>
                                        <Badge
                                            className={`mt-1 ${
                                                viewingItem.active
                                                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                                                    : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
                                            }`}
                                        >
                                            {viewingItem.active ? "Active" : "Inactive"}
                                        </Badge>
                                    </div>
                                    <div className="col-span-2">
                                        <Label className="text-sm text-slate-500 dark:text-slate-400">
                                            Created
                                        </Label>
                                        <p className="font-medium dark:text-white">
                                            {new Date(viewingItem.timestamp).toLocaleString()}
                                        </p>
                                    </div>
                                </div>

                                <div>
                                    <Label className="text-sm text-slate-500 dark:text-slate-400 mb-2 block">
                                        Approval Sequence
                                    </Label>
                                    <div className="space-y-2">
                                        {viewingItem.approvers.map((approver, idx) => (
                                            <div
                                                key={approver.id}
                                                className="flex items-center gap-3 p-2 bg-slate-50 dark:bg-gray-800 rounded-lg"
                                            >
                                                <span className="flex items-center justify-center w-6 h-6 bg-amber-600 text-white text-sm font-semibold rounded-full">
                                                    {approver.order}
                                                </span>
                                                <span className="dark:text-white">
                                                    {approver.employeeName}
                                                </span>
                                                {idx < viewingItem.approvers.length - 1 && (
                                                    <span className="text-slate-400 text-xs ml-auto">
                                                        then
                                                    </span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex justify-end pt-4 border-t">
                                    <Button
                                        variant="outline"
                                        onClick={() => setShowViewModal(false)}
                                        className="border-slate-200 dark:border-gray-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-gray-800"
                                    >
                                        Close
                                    </Button>
                                </div>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>
            </div>
            {ConfirmDialog}
        </>
    );
}
