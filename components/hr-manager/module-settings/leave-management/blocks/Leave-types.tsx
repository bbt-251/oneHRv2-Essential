"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { FileText, Plus, Edit } from "lucide-react";
import { useData } from "@/context/app-data-context";
import { hrSettingsService, LeaveTypeModel } from "@/lib/backend/hr-settings-service";
import { useToast } from "@/context/toastContext";
import { useTheme } from "@/components/theme-provider";
import { cn } from "@/lib/utils";
import DeleteConfirm from "@/components/hr-manager/core-settings/blocks/delete-confirm";
import { LEAVE_MANAGEMENT_LOG_MESSAGES } from "@/lib/log-descriptions/leave-management";
import { useAuth } from "@/context/authContext";

// Leave Types Component

export default function LeaveTypes() {
    const { ...hrSettings } = useData();
    const { showToast } = useToast();
    const { theme } = useTheme();
    const { userData } = useAuth();
    const leaveTypes = hrSettings.leaveTypes;

    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [editingLeaveType, setEditingLeaveType] = useState<LeaveTypeModel | null>(null);
    const [formData, setFormData] = useState<LeaveTypeModel>({
        id: "",
        name: "",
        authorizedDays: 0,
        acronym: "",
        active: "Yes" as "Yes" | "No",
    });

    const handleAdd = () => {
        setEditingLeaveType(null);
        setFormData({
            id: "",
            name: "",
            authorizedDays: 0,
            acronym: "",
            active: "Yes" as "Yes" | "No",
        });
        setIsModalOpen(true);
    };

    const handleEdit = (leaveType: LeaveTypeModel) => {
        setEditingLeaveType(leaveType);
        setFormData(leaveType);
        setIsModalOpen(true);
    };

    const handleDelete = (id: string) => {
        hrSettingsService.remove(
            "leaveTypes",
            id,
            userData?.uid,
            LEAVE_MANAGEMENT_LOG_MESSAGES.LEAVE_TYPE_DELETED(id),
        );
        showToast("Leave type deleted successfully", "success", "success");
    };

    const handleSubmit = () => {
        try {
            // Validate required fields
            if (!formData.name.trim()) {
                showToast("Please enter a leave type name", "error", "error");
                return;
            }

            if (formData.authorizedDays <= 0) {
                showToast("Authorized days must be greater than 0", "error", "error");
                return;
            }

            if (!formData.acronym.trim()) {
                showToast("Please enter an acronym", "error", "error");
                return;
            }

            // Check for duplicate leave type name
            const existingLeaveType = leaveTypes.find(
                leaveType =>
                    leaveType.name.toLowerCase() === formData.name.toLowerCase() &&
                    (!editingLeaveType || leaveType.id !== editingLeaveType.id),
            );

            if (existingLeaveType) {
                showToast("Leave type name must be unique", "error", "error");
                return;
            }

            // Check for duplicate acronym
            const existingAcronym = leaveTypes.find(
                leaveType =>
                    leaveType.acronym.toLowerCase() === formData.acronym.toLowerCase() &&
                    (!editingLeaveType || leaveType.id !== editingLeaveType.id),
            );

            if (existingAcronym) {
                showToast("Leave type acronym must be unique", "error", "error");
                return;
            }

            if (editingLeaveType) {
                hrSettingsService.update(
                    "leaveTypes",
                    editingLeaveType.id,
                    formData,
                    userData?.uid,
                    LEAVE_MANAGEMENT_LOG_MESSAGES.LEAVE_TYPE_UPDATED({
                        id: editingLeaveType.id,
                        name: formData.name,
                        authorizedDays: formData.authorizedDays,
                        acronym: formData.acronym,
                        active: formData.active,
                    }),
                );
                showToast("Leave type updated successfully", "success", "success");
            } else {
                // Add new leave type
                hrSettingsService.create(
                    "leaveTypes",
                    formData,
                    userData?.uid,
                    LEAVE_MANAGEMENT_LOG_MESSAGES.LEAVE_TYPE_CREATED({
                        name: formData.name,
                        authorizedDays: formData.authorizedDays,
                        acronym: formData.acronym,
                        active: formData.active,
                    }),
                );
                showToast("Leave type created successfully", "success", "success");
            }

            setIsModalOpen(false);
            setEditingLeaveType(null);
        } catch (error) {
            console.error("Error in handleSubmit:", error);
            showToast("An error occurred while processing your request", "error", "error");
        }
    };

    return (
        <Card
            className={`${theme === "dark" ? "bg-black " : "bg-white/80 backdrop-blur-sm border-0"} shadow-2xl rounded-2xl overflow-hidden`}
        >
            <CardHeader
                className={`${theme === "dark" ? "bg-black text-white" : "bg-amber-800 border-gray-200"} rounded-t-2xl`}
            >
                <CardTitle className="flex items-center gap-2 text-white">
                    <FileText
                        className={`h-5 w-5  ${theme === "dark" ? "text-amber-600" : "text-amber-600"}`}
                    />
                    Leave Types
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 mt-4">
                <div className="flex justify-between items-center">
                    <p
                        className={`text-gray-600 ${theme === "dark" ? "text-white" : "text-gray-600"}`}
                    >
                        Configure different types of leave available to employees.
                    </p>
                    <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                        <DialogTrigger asChild>
                            <Button
                                onClick={handleAdd}
                                className="bg-amber-600 hover:bg-amber-700 text-white"
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Add Leave Type
                            </Button>
                        </DialogTrigger>
                        <DialogContent
                            className={`max-w-md rounded-2xl ${theme === "dark" ? "bg-black border-white" : "bg-white backdrop-blur-sm border-0"}`}
                        >
                            <DialogHeader>
                                <DialogTitle
                                    className={`text-xl font-bold ${theme === "dark" ? "text-white" : "text-black"}`}
                                >
                                    {editingLeaveType ? "Edit Leave Type" : "Add Leave Type"}
                                </DialogTitle>
                            </DialogHeader>

                            <div>
                                <Label
                                    htmlFor="name"
                                    className={` ${theme === "dark" ? "text-white" : "text-gray-600"}`}
                                >
                                    Name
                                </Label>
                                <Input
                                    className={
                                        theme === "dark"
                                            ? "bg-black text-white border-gray-600 placeholder:text-gray-500"
                                            : ""
                                    }
                                    id="name"
                                    value={formData.name}
                                    onChange={e =>
                                        setFormData(prev => ({ ...prev, name: e.target.value }))
                                    }
                                    placeholder="Enter leave type name"
                                    required
                                />
                            </div>

                            <div>
                                <Label
                                    htmlFor="authorizedDays"
                                    className={` ${theme === "dark" ? "text-white" : "text-gray-600"}`}
                                >
                                    Authorized Days
                                </Label>
                                <Input
                                    className={
                                        theme === "dark"
                                            ? "bg-black text-white border-gray-600 placeholder:text-gray-500"
                                            : ""
                                    }
                                    id="authorizedDays"
                                    type="number"
                                    min=""
                                    value={formData.authorizedDays || ""}
                                    onChange={e =>
                                        setFormData(prev => ({
                                            ...prev,
                                            authorizedDays: Number.parseInt(e.target.value) || 0,
                                        }))
                                    }
                                    placeholder="Enter number of authorized days"
                                    required
                                />
                            </div>

                            <div>
                                <Label
                                    htmlFor="acronym"
                                    className={` ${theme === "dark" ? "text-white" : "text-gray-600"}`}
                                >
                                    Acronym
                                </Label>
                                <Input
                                    className={
                                        theme === "dark"
                                            ? "bg-black text-white border-gray-600 placeholder:text-gray-500"
                                            : ""
                                    }
                                    id="acronym"
                                    value={formData.acronym}
                                    onChange={e =>
                                        setFormData(prev => ({
                                            ...prev,
                                            acronym: e.target.value.toUpperCase(),
                                        }))
                                    }
                                    placeholder="Enter acronym (e.g., AL, SL)"
                                    maxLength={5}
                                    required
                                />
                            </div>

                            <div>
                                <Label
                                    htmlFor="active"
                                    className={` ${theme === "dark" ? "text-white" : "text-gray-600"}`}
                                >
                                    Status
                                </Label>
                                <Select
                                    value={formData.active}
                                    onValueChange={(value: "Yes" | "No") =>
                                        setFormData(prev => ({ ...prev, active: value }))
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
                                                : "bg-gray-50 border-y border-gray-300",
                                            "w-40",
                                        )}
                                    >
                                        <SelectItem value="Yes">Active</SelectItem>
                                        <SelectItem value="No">Inactive</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex gap-2 pt-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 border-amber-600 text-amber-600 "
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleSubmit}
                                    type="submit"
                                    className="flex-1 bg-amber-600 hover:bg-amber-700 text-white"
                                >
                                    {editingLeaveType ? "Update" : "Add"} Leave Type
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>

                <div className="border rounded-lg">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Authorized Days</TableHead>
                                <TableHead>Acronym</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {leaveTypes.map(leaveType => (
                                <TableRow key={leaveType.id} className="cursor-pointer ">
                                    <TableCell>{leaveType.name}</TableCell>
                                    <TableCell>
                                        <Badge
                                            variant="outline"
                                            className="bg-blue-50 text-blue-700 border-blue-200"
                                        >
                                            {leaveType.authorizedDays} days
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant="outline"
                                            className="bg-gray-50 text-gray-700 border-gray-200"
                                        >
                                            {leaveType.acronym}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant={
                                                leaveType.active === "Yes" ? "default" : "secondary"
                                            }
                                            className={
                                                leaveType.active === "Yes"
                                                    ? "bg-green-100 text-green-800 border-green-200"
                                                    : "bg-red-100 text-red-800 border-red-200"
                                            }
                                        >
                                            {leaveType.active === "Yes" ? "Active" : "Inactive"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex gap-2 justify-end">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={e => {
                                                    e.stopPropagation();
                                                    handleEdit(leaveType);
                                                }}
                                                className="border-amber-600 text-amber-600 hover:bg-amber-50"
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <DeleteConfirm
                                                onConfirm={() => handleDelete(leaveType.id!)}
                                                itemName={`Leave type (${leaveType.name})`}
                                            />
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}
