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
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Edit, Trash2, Filter, Search } from "lucide-react";
import { hrSettingsService, ReasonOfLeavingModel } from "@/lib/backend/firebase/hrSettingsService";
import { useFirestore } from "@/context/firestore-context";
import { useToast } from "@/context/toastContext";
import DeleteConfirm from "../../blocks/delete-confirm";
import { useTheme } from "@/components/theme-provider";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/authContext";
import { JOB_MANAGEMENT_LOG_MESSAGES } from "@/lib/log-descriptions/job-management";

export default function ReasonForLeaving() {
    const { theme } = useTheme();
    const { showToast } = useToast();
    const { hrSettings } = useFirestore();
    const { userData } = useAuth();
    const reasons = hrSettings.reasonOfLeaving;

    const [showModal, setShowModal] = useState(false);
    const [showFilterModal, setShowFilterModal] = useState(false);
    const [editingReason, setEditingReason] = useState<ReasonOfLeavingModel | null>(null);
    const [searchTerm, setSearchTerm] = useState("");

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        startDate: "",
        endDate: "",
        active: "Yes" as "Yes" | "No",
    });

    const [filters, setFilters] = useState({
        name: "",
        startDate: "",
        endDate: "",
        active: "",
    });

    const [selectedFields, setSelectedFields] = useState({
        name: true,
        startDate: true,
        endDate: true,
        active: true,
    });

    const handleAdd = () => {
        setEditingReason(null);
        setFormData({ name: "", startDate: "", endDate: "", active: "Yes" });
        setShowModal(true);
    };

    const handleEdit = (reason: ReasonOfLeavingModel) => {
        setEditingReason(reason);
        setFormData({
            name: reason.name,
            startDate: reason.startDate,
            endDate: reason.endDate,
            active: reason.active,
        });
        setShowModal(true);
    };

    const handleRowClick = (reason: ReasonOfLeavingModel) => {
        handleEdit(reason);
    };

    const handleSubmit = () => {
        try {
            // required fields

            if (!formData.name.trim()) {
                showToast("Reason for leaving name is required", "error", "error");
                return;
            }

            if (new Date(formData.startDate) >= new Date(formData.endDate)) {
                showToast("Start date must be before end date", "Validation Error", "error");
                return;
            }

            // Check if the name already exists (case-insensitive)

            const existingReason = reasons.find(
                reason =>
                    reason.name.toLowerCase() === formData.name.toLowerCase() &&
                    (!editingReason || reason.id !== editingReason.id),
            );

            if (existingReason) {
                showToast("Reason for leaving name already exists", "error", "error");
                return;
            }
            setIsSubmitting(true);
            if (editingReason) {
                hrSettingsService.update(
                    "reasonOfLeaving",
                    editingReason.id,
                    formData,
                    userData?.uid ?? "",
                    JOB_MANAGEMENT_LOG_MESSAGES.REASON_LEAVING_UPDATED({
                        id: editingReason.id,
                        ...formData,
                    }),
                );
                showToast("Reason for leaving updated successfully", "success", "success");
            } else {
                hrSettingsService.create(
                    "reasonOfLeaving",
                    formData,
                    userData?.uid ?? "",
                    JOB_MANAGEMENT_LOG_MESSAGES.REASON_LEAVING_CREATED(formData),
                );
                showToast("Reason for leaving created successfully", "success", "success");
            }
            setShowModal(false);
            setIsSubmitting(false);
        } catch (error) {
            showToast("Failed to save reason for leaving", "error", "error");
            console.error("Failed to save reason for leaving:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await hrSettingsService.remove(
                "reasonOfLeaving",
                id,
                userData?.uid ?? "",
                JOB_MANAGEMENT_LOG_MESSAGES.REASON_LEAVING_DELETED(id),
            );
            showToast("Reason for leaving deleted successfully", "success", "success");
        } catch (error) {
            console.error("Failed to delete reason for leaving:", error);
            showToast("Failed to delete reason for leaving", "error", "error");
        }
    };

    const filteredData = reasons.filter(item => {
        const matchesSearch = Object.values(item).some(value =>
            value?.toString().toLowerCase().includes(searchTerm.toLowerCase()),
        );

        const matchesFilters = Object.entries(filters).every(([key, value]) => {
            if (!value) return true;
            const itemValue = item[key as keyof ReasonOfLeavingModel]?.toString().toLowerCase();
            return itemValue?.includes(value.toLowerCase());
        });

        return matchesSearch && matchesFilters;
    });

    const applyFilters = () => {
        setShowFilterModal(false);
    };

    const clearFilters = () => {
        setFilters({
            name: "",
            startDate: "",
            endDate: "",
            active: "",
        });
    };

    return (
        <Card
            className={cn(
                "shadow-lg rounded-2xl overflow-hidden",
                theme === "dark"
                    ? "bg-black border-white/10"
                    : "bg-white/80 backdrop-blur-sm border-0",
            )}
        >
            <CardHeader
                className={cn("rounded-t-2xl", theme === "dark" ? "bg-black" : "bg-amber-800")}
            >
                <div className="flex items-center justify-between">
                    <CardTitle
                        className={cn(
                            "text-xl font-bold",
                            theme === "dark" ? "text-white" : "text-white",
                        )}
                    >
                        Reason for Leaving
                    </CardTitle>
                    <div className="flex gap-2">
                        <Dialog open={showFilterModal} onOpenChange={setShowFilterModal}>
                            <DialogTrigger asChild>
                                <Button
                                    variant="outline"
                                    className={cn(
                                        "border-white/20 text-white",
                                        theme === "dark"
                                            ? "bg-black hover:bg-slate-700"
                                            : "bg-white/10 hover:bg-white/20",
                                    )}
                                >
                                    <Filter className="h-4 w-4 mr-2" />
                                    All Filters
                                </Button>
                            </DialogTrigger>
                            <DialogContent
                                className={cn(
                                    "max-w-md rounded-2xl",
                                    theme === "dark" ? "bg-black border-slate-700" : "bg-white",
                                )}
                            >
                                <DialogHeader>
                                    <DialogTitle
                                        className={cn(
                                            theme === "dark" ? "text-white" : "text-gray-900",
                                        )}
                                    >
                                        Filter Reasons for Leaving
                                    </DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                    <div>
                                        <Label
                                            className={
                                                "text-sm font-medium mb-2" +
                                                (theme === "dark" ? "text-white" : "text-gray-0")
                                            }
                                        >
                                            Select Fields to Display
                                        </Label>
                                        <div className="grid grid-cols-2 gap-2">
                                            {Object.entries(selectedFields).map(
                                                ([field, checked]) => (
                                                    <div
                                                        key={field}
                                                        className="flex items-center space-x-2"
                                                    >
                                                        <Checkbox
                                                            className={cn(
                                                                theme === "dark"
                                                                    ? "bg-white border-white"
                                                                    : "bg-white border-black",
                                                            )}
                                                            id={field}
                                                            checked={checked}
                                                            onCheckedChange={checked =>
                                                                setSelectedFields(prev => ({
                                                                    ...prev,
                                                                    [field]: !!checked,
                                                                }))
                                                            }
                                                        />
                                                        <Label
                                                            htmlFor={field}
                                                            className={`text-sm capitalize ${theme === "dark" ? "text-white" : "text-gray-900"}`}
                                                        >
                                                            {field
                                                                .replace(/([A-Z])/g, " $1")
                                                                .trim()}
                                                        </Label>
                                                    </div>
                                                ),
                                            )}
                                        </div>
                                    </div>

                                    <div className="border-t pt-4">
                                        <Label
                                            className={`text-sm font-medium mb-2 block ${theme === "dark" ? "text-white" : "text-gray-900"}`}
                                        >
                                            Filter Options
                                        </Label>
                                        <div className="grid grid-cols-2 gap-4">
                                            {selectedFields.name && (
                                                <div>
                                                    <Label
                                                        htmlFor="filter-name"
                                                        className={`text-sm capitalize ${theme === "dark" ? "text-white" : "text-black"}`}
                                                    >
                                                        Name
                                                    </Label>
                                                    <Input
                                                        id="filter-name"
                                                        value={filters.name}
                                                        onChange={e =>
                                                            setFilters(prev => ({
                                                                ...prev,
                                                                name: e.target.value,
                                                            }))
                                                        }
                                                        placeholder="Filter by name"
                                                        className={cn(
                                                            theme === "dark"
                                                                ? "bg-black text-white border-gray-600 placeholder:text-gray-500"
                                                                : "bg-white border-gray-300",
                                                            "rounded-xl",
                                                        )}
                                                    />
                                                </div>
                                            )}
                                            {selectedFields.startDate && (
                                                <div>
                                                    <Label
                                                        htmlFor="filter-startDate"
                                                        className={`text-sm capitalize ${theme === "dark" ? "text-white" : "text-black"}`}
                                                    >
                                                        Start Date
                                                    </Label>
                                                    <Input
                                                        className={cn(
                                                            theme === "dark"
                                                                ? "bg-black text-white border-gray-600 placeholder:text-gray-500"
                                                                : "bg-white border-gray-300",
                                                            "rounded-xl",
                                                        )}
                                                        id="filter-startDate"
                                                        value={filters.startDate}
                                                        onChange={e =>
                                                            setFilters(prev => ({
                                                                ...prev,
                                                                startDate: e.target.value,
                                                            }))
                                                        }
                                                        placeholder="Filter by start date"
                                                    />
                                                </div>
                                            )}
                                            {selectedFields.endDate && (
                                                <div>
                                                    <Label
                                                        htmlFor="filter-endDate"
                                                        className={`text-sm capitalize ${theme === "dark" ? "text-white" : "text-black"}`}
                                                    >
                                                        End Date
                                                    </Label>
                                                    <Input
                                                        className={cn(
                                                            theme === "dark"
                                                                ? "bg-black text-white border-gray-600 placeholder:text-gray-500"
                                                                : "bg-white border-gray-300",
                                                            "rounded-xl",
                                                        )}
                                                        id="filter-endDate"
                                                        value={filters.endDate}
                                                        onChange={e =>
                                                            setFilters(prev => ({
                                                                ...prev,
                                                                endDate: e.target.value,
                                                            }))
                                                        }
                                                        placeholder="Filter by end date"
                                                    />
                                                </div>
                                            )}
                                            {selectedFields.active && (
                                                <div>
                                                    <Label
                                                        htmlFor="filter-active"
                                                        className={`text-sm capitalize ${theme === "dark" ? "text-white" : "text-black"}`}
                                                    >
                                                        Status
                                                    </Label>
                                                    <Input
                                                        id="filter-active"
                                                        value={filters.active}
                                                        onChange={e =>
                                                            setFilters(prev => ({
                                                                ...prev,
                                                                active: e.target.value,
                                                            }))
                                                        }
                                                        placeholder="Filter by status"
                                                        className={cn(
                                                            theme === "dark"
                                                                ? "bg-black text-white border-gray-600 placeholder:text-gray-500"
                                                                : "bg-white border-gray-300",
                                                            "rounded-xl",
                                                        )}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex justify-end gap-3 pt-4 border-t">
                                        <Button
                                            variant="outline"
                                            onClick={clearFilters}
                                            className={`${theme === "dark" ? "text-white" : "text-black"}`}
                                        >
                                            Clear Filters
                                        </Button>
                                        <Button
                                            onClick={applyFilters}
                                            className="bg-amber-600 hover:bg-amber-700"
                                        >
                                            Apply Filters
                                        </Button>
                                    </div>
                                </div>
                            </DialogContent>
                        </Dialog>

                        <Dialog open={showModal} onOpenChange={setShowModal}>
                            <DialogTrigger asChild>
                                <Button
                                    onClick={handleAdd}
                                    className="bg-amber-600 hover:bg-amber-700 text-white rounded-xl"
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Reason
                                </Button>
                            </DialogTrigger>
                            <DialogContent
                                className={`max-w-md ${theme === "dark" ? "bg-black border-gray-600" : "bg-white border-gray-200"} rounded-2xl`}
                            >
                                <DialogHeader>
                                    <DialogTitle>
                                        {editingReason ? "Edit Reason" : "Add New Reason"}
                                    </DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                    <div>
                                        <Label
                                            htmlFor="name"
                                            className={cn(
                                                theme === "dark" ? "text-white" : "text-black",
                                            )}
                                        >
                                            Name
                                        </Label>
                                        <Input
                                            id="name"
                                            value={formData.name}
                                            onChange={e =>
                                                setFormData({ ...formData, name: e.target.value })
                                            }
                                            placeholder="Enter reason name"
                                            className={cn(
                                                theme === "dark"
                                                    ? "bg-black text-white border-gray-600"
                                                    : "bg-white border-gray-200",
                                                "rounded-xl",
                                            )}
                                        />
                                    </div>
                                    <div>
                                        <Label
                                            htmlFor="startDate"
                                            className={cn(
                                                theme === "dark" ? "text-white" : "text-black",
                                            )}
                                        >
                                            Start Date
                                        </Label>
                                        <Input
                                            id="startDate"
                                            type="date"
                                            value={formData.startDate}
                                            onChange={e =>
                                                setFormData({
                                                    ...formData,
                                                    startDate: e.target.value,
                                                })
                                            }
                                            className={cn(
                                                theme === "dark"
                                                    ? "bg-black text-white border-gray-600"
                                                    : "bg-white border-gray-200",
                                                "rounded-xl",
                                            )}
                                        />
                                    </div>
                                    <div>
                                        <Label
                                            htmlFor="endDate"
                                            className={cn(
                                                theme === "dark" ? "text-white" : "text-black",
                                            )}
                                        >
                                            End Date
                                        </Label>
                                        <Input
                                            id="endDate"
                                            type="date"
                                            value={formData.endDate}
                                            onChange={e =>
                                                setFormData({
                                                    ...formData,
                                                    endDate: e.target.value,
                                                })
                                            }
                                            className={cn(
                                                theme === "dark"
                                                    ? "bg-black text-white border-gray-600"
                                                    : "bg-white border-gray-200",
                                                "rounded-xl",
                                            )}
                                        />
                                    </div>
                                    <div>
                                        <Label
                                            htmlFor="active"
                                            className={cn(
                                                theme === "dark" ? "text-white" : "text-black",
                                            )}
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
                                                className={cn(
                                                    theme === "dark"
                                                        ? "bg-black text-white border-gray-600"
                                                        : "bg-white border-gray-200",
                                                    "rounded-xl",
                                                )}
                                            >
                                                <SelectValue placeholder="Select status" />
                                            </SelectTrigger>
                                            <SelectContent
                                                className={cn(
                                                    theme === "dark"
                                                        ? "bg-black text-white border-gray-600"
                                                        : "bg-white border-gray-200",
                                                    "rounded-xl",
                                                )}
                                            >
                                                <SelectItem value="Yes">Active</SelectItem>
                                                <SelectItem value="No">Inactive</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="flex justify-end gap-3">
                                        <Button
                                            className={cn(
                                                theme === "dark"
                                                    ? "bg-black text-white border-gray-600"
                                                    : "bg-white border-gray-200",
                                                "rounded-xl",
                                            )}
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
                                                : editingReason
                                                    ? "Update Reason"
                                                    : "Add Reason"}
                                        </Button>
                                    </div>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <div className="p-4 ">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input
                            placeholder="Search reasons for leaving..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </div>

                <Table>
                    <TableHeader>
                        <TableRow
                            className={
                                theme === "dark"
                                    ? "bg-black hover:bg-gray-800"
                                    : "bg-amber-800 hover:bg-amber-800"
                            }
                        >
                            {selectedFields.name && (
                                <TableHead className="text-yellow-100 font-semibold">
                                    Name
                                </TableHead>
                            )}
                            {selectedFields.startDate && (
                                <TableHead className="text-yellow-100 font-semibold">
                                    Start Date
                                </TableHead>
                            )}
                            {selectedFields.endDate && (
                                <TableHead className="text-yellow-100 font-semibold">
                                    End Date
                                </TableHead>
                            )}
                            {selectedFields.active && (
                                <TableHead className="text-yellow-100 font-semibold">
                                    Status
                                </TableHead>
                            )}
                            <TableHead className="text-yellow-100 font-semibold text-right">
                                Actions
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredData.map((reason, index) => (
                            <TableRow
                                key={reason.id}
                                className={cn(
                                    "cursor-pointer",
                                    theme === "dark" ? "bg-black" : "bg-white",
                                )}
                            >
                                {selectedFields.name && (
                                    <TableCell
                                        className={`font-semibold ${theme === "dark" ? "text-white" : "text-gray-900"}`}
                                    >
                                        {reason.name}
                                    </TableCell>
                                )}
                                {selectedFields.startDate && (
                                    <TableCell
                                        className={`font-semibold ${theme === "dark" ? "text-white" : "text-gray-900"}`}
                                    >
                                        {reason.startDate}
                                    </TableCell>
                                )}
                                {selectedFields.endDate && (
                                    <TableCell
                                        className={`font-semibold ${theme === "dark" ? "text-white" : "text-gray-900"}`}
                                    >
                                        {reason.endDate}
                                    </TableCell>
                                )}
                                {selectedFields.active && (
                                    <TableCell>
                                        <Badge
                                            className={
                                                reason.active === "Yes"
                                                    ? "bg-green-100 text-green-800 border-green-200"
                                                    : "bg-gray-100 text-gray-800 border-gray-200"
                                            }
                                        >
                                            {reason.active === "Yes" ? "Active" : "Inactive"}
                                        </Badge>
                                    </TableCell>
                                )}
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={e => {
                                                e.stopPropagation();
                                                handleEdit(reason);
                                            }}
                                            className="h-8 w-8 p-0 hover:bg-amber-100"
                                        >
                                            <Edit className="h-4 w-4 text-amber-600" />
                                        </Button>
                                        <DeleteConfirm
                                            onConfirm={() => handleDelete(reason.id!)}
                                            itemName={`reason for leaving (${reason.name})`}
                                        />
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
