"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Edit } from "lucide-react";

import ConfigTable from "./config-table";
import {
    ContractTypeModel,
    CoreSettingsRepository as settingsService,
} from "@/lib/repository/hr-settings";
import { useData } from "@/context/app-data-context";
import DeleteConfirm from "../../blocks/delete-confirm";
import { useTheme } from "@/components/theme-provider";
import { cn } from "@/lib/utils";
import { useToast } from "@/context/toastContext";
import { useAuth } from "@/context/authContext";
import { JOB_MANAGEMENT_LOG_MESSAGES } from "@/lib/log-descriptions/job-management";

export default function ContractType() {
    const { contractTypes } = useData();
    const { theme } = useTheme();
    const { showToast } = useToast();
    const { userData } = useAuth();

    const [showModal, setShowModal] = useState<boolean>(false);
    const [editingContractType, setEditingContractType] = useState<ContractTypeModel | null>(null);

    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

    const [formData, setFormData] = useState<{
        name: string;
        startDate: string;
        endDate: string;
        active: "Yes" | "No";
    }>({
        name: "",
        startDate: "",
        endDate: "",
        active: "Yes" as "Yes" | "No",
    });

    const handleAdd = () => {
        setEditingContractType(null);
        setFormData({ name: "", startDate: "", endDate: "", active: "Yes" });
        setShowModal(true);
    };

    const handleEdit = (contractType: ContractTypeModel) => {
        setEditingContractType(contractType);
        setFormData({
            name: contractType.name,
            startDate: contractType.startDate,
            endDate: contractType.endDate,
            active: contractType.active,
        });
        setShowModal(true);
    };

    const handleSubmit = () => {
        try {
            setIsSubmitting(true);
            // required fields
            if (!formData.name.trim()) {
                showToast("Contract type name is required", "error", "error");
                return;
            }

            if (new Date(formData.startDate) >= new Date(formData.endDate)) {
                showToast("Start date must be before end date", "Validation Error", "error");
                return;
            }

            // Check if the name already exists (case-insensitive)
            const existingContractType = contractTypes.find(
                contractType =>
                    contractType.name.toLowerCase() === formData.name.toLowerCase() &&
                    (!editingContractType || contractType.id !== editingContractType.id),
            );

            if (existingContractType) {
                showToast("Contract type name already exists", "error", "error");
                return;
            }

            if (editingContractType) {
                settingsService.update(
                    "contractTypes",
                    editingContractType.id,
                    formData,
                    userData?.uid ?? "",
                    JOB_MANAGEMENT_LOG_MESSAGES.CONTRACT_TYPE_UPDATED({
                        id: editingContractType.id,
                        name: formData.name,
                        startDate: formData.startDate,
                        endDate: formData.endDate,
                        active: formData.active,
                    }),
                );
                showToast("Contract type updated successfully", "Success", "success");
            } else {
                settingsService.create(
                    "contractTypes",
                    formData,
                    userData?.uid ?? "",
                    JOB_MANAGEMENT_LOG_MESSAGES.CONTRACT_TYPE_CREATED({
                        name: formData.name,
                        startDate: formData.startDate,
                        endDate: formData.endDate,
                        active: formData.active,
                    }),
                );
                showToast("Contract type created successfully", "Success", "success");
            }
            setShowModal(false);
        } catch (error) {
            showToast("Failed to save contract type", "error", "error");
            console.error("Failed to save contract type:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = (id: string) => {
        settingsService.remove(
            "contractTypes",
            id,
            userData?.uid ?? "",
            JOB_MANAGEMENT_LOG_MESSAGES.CONTRACT_TYPE_DELETED(id),
        );
        showToast("Contract type deleted successfully", "success", "success");
    };

    const columns = [
        { key: "name", header: "Name" },
        { key: "startDate", header: "Start Date" },
        { key: "endDate", header: "End Date" },
        {
            key: "active",
            header: "Status",
            render: (row: ContractTypeModel) => (
                <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                        row.active === "Yes"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                    }`}
                >
                    {row.active === "Yes" ? "Active" : "Inactive"}
                </span>
            ),
        },
        {
            key: "actions",
            header: "Actions",
            render: (row: ContractTypeModel) => (
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={e => {
                            e.stopPropagation();
                            handleEdit(row);
                        }}
                        className="h-8 w-8 p-0 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                    >
                        <Edit className="h-4 w-4" />
                    </Button>
                    <DeleteConfirm
                        onConfirm={() => handleDelete(row.id!)}
                        itemName={`contract type (${row.name})`}
                    />
                </div>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            <ConfigTable
                title="Contract Types"
                columns={columns}
                data={contractTypes}
                searchableKeys={["name", "startDate", "endDate", "active"]}
                nonFilterableKeys={["actions"]}
                onAddClick={handleAdd}
                addButtonText="Add Contract Type"
            />

            <Dialog open={showModal} onOpenChange={setShowModal}>
                <DialogContent
                    className={`max-w-md rounded-2xl ${theme === "dark" ? "bg-black border-white" : "bg-white backdrop-blur-sm border-0"}`}
                >
                    <DialogHeader>
                        <DialogTitle
                            className={`text-xl font-bold ${theme === "dark" ? "text-white" : "text-primary-900"}`}
                        >
                            {editingContractType ? "Edit Contract Type" : "Add New Contract Type"}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label
                                htmlFor="name"
                                className={theme === "dark" ? "text-white" : "text-slate-900"}
                            >
                                Contract Name
                            </Label>
                            <Input
                                className={
                                    theme === "dark"
                                        ? "bg-black text-white border-gray-600 placeholder:text-gray-500"
                                        : ""
                                }
                                id="name"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Enter contract name"
                            />
                        </div>
                        <div>
                            <Label
                                htmlFor="startDate"
                                className={theme === "dark" ? "text-white" : "text-slate-900"}
                            >
                                Start Date
                            </Label>
                            <Input
                                className={
                                    theme === "dark"
                                        ? "bg-black text-white border-gray-600 placeholder:text-gray-500"
                                        : ""
                                }
                                id="startDate"
                                type="date"
                                value={formData.startDate}
                                onChange={e =>
                                    setFormData({ ...formData, startDate: e.target.value })
                                }
                            />
                        </div>
                        <div>
                            <Label
                                htmlFor="endDate"
                                className={theme === "dark" ? "text-white" : "text-slate-900"}
                            >
                                End Date
                            </Label>
                            <Input
                                className={
                                    theme === "dark"
                                        ? "bg-black text-white border-gray-600 placeholder:text-gray-500"
                                        : ""
                                }
                                id="endDate"
                                type="date"
                                value={formData.endDate}
                                onChange={e =>
                                    setFormData({ ...formData, endDate: e.target.value })
                                }
                            />
                        </div>
                        <div>
                            <Label
                                htmlFor="active"
                                className={theme === "dark" ? "text-white" : "text-slate-900"}
                            >
                                Status
                            </Label>
                            <Select
                                value={formData.active}
                                onValueChange={(value: "Yes" | "No") =>
                                    setFormData({ ...formData, active: value })
                                }
                            >
                                <SelectTrigger
                                    className={
                                        theme === "dark"
                                            ? "bg-black text-white border-gray-600"
                                            : ""
                                    }
                                >
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent
                                    className={cn(
                                        theme === "dark"
                                            ? "bg-black border-gray-600"
                                            : "bg-gray-50/80 border-y border-gray-300",
                                        "w-40",
                                    )}
                                >
                                    {" "}
                                    <SelectItem value="Yes">Active</SelectItem>
                                    <SelectItem value="No">Inactive</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex justify-end gap-3">
                            <Button
                                className={`${theme === "dark" ? " text-white" : "text-black"}`}
                                variant="outline"
                                onClick={() => setShowModal(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleSubmit}
                                className="bg-amber-600 hover:bg-amber-700 text-white"
                            >
                                {isSubmitting
                                    ? "Saving..."
                                    : editingContractType
                                        ? "Update Contract Type"
                                        : "Add Contract Type"}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
