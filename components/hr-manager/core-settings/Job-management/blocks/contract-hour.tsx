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
import { Plus, Edit, Filter, Search } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import {
    ContractHourModel,
    CoreSettingsRepository as settingsService,
} from "@/lib/repository/hr-settings";
import { useData } from "@/context/app-data-context";
import DeleteConfirm from "../../blocks/delete-confirm";
import { useToast } from "@/context/toastContext";
import { useTheme } from "@/components/theme-provider";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/authContext";
import { JOB_MANAGEMENT_LOG_MESSAGES } from "@/lib/log-descriptions/job-management";

export default function ContractHour() {
    const { contractHours } = useData();
    const { theme } = useTheme();
    const { showToast } = useToast();
    const { userData } = useAuth();

    const [showModal, setShowModal] = useState<boolean>(false);
    const [showFilterModal, setShowFilterModal] = useState<boolean>(false);
    const [editingContractHour, setEditingContractHour] = useState<ContractHourModel | null>(null);
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [formData, setFormData] = useState<{
        hourPerWeek: number;
        startDate: string;
        endDate: string;
        active: string;
    }>({
        hourPerWeek: 0,
        startDate: "",
        endDate: "",
        active: "Yes",
    });

    const [filters, setFilters] = useState<{
        hourPerWeek: string;
        startDate: string;
        endDate: string;
        active: string;
    }>({
        hourPerWeek: "",
        startDate: "",
        endDate: "",
        active: "",
    });

    const [selectedFields, setSelectedFields] = useState<{
        hourPerWeek: boolean;
        startDate: boolean;
        endDate: boolean;
        active: boolean;
    }>({
        hourPerWeek: true,
        startDate: true,
        endDate: true,
        active: true,
    });

    const handleAdd = () => {
        setEditingContractHour(null);
        setFormData({ hourPerWeek: 0, startDate: "", endDate: "", active: "Yes" });
        setShowModal(true);
    };

    const handleEdit = (contractHour: ContractHourModel) => {
        setEditingContractHour(contractHour);
        setFormData({
            hourPerWeek: contractHour.hourPerWeek,
            startDate: contractHour.startDate,
            endDate: contractHour.endDate,
            active: contractHour.active,
        });
        setShowModal(true);
    };

    const handleSubmit = () => {
        try {
            setIsSubmitting(true);
            // required fields
            if (!formData.hourPerWeek) {
                showToast("Hour per week is required", "error", "error");
                return;
            }

            if (new Date(formData.startDate) >= new Date(formData.endDate)) {
                showToast("Start date must be before end date", "Validation Error", "error");
                return;
            }

            const existingContractHour = contractHours.find(
                contractHour =>
                    contractHour.hourPerWeek === formData.hourPerWeek &&
                    (!editingContractHour || contractHour.id !== editingContractHour.id),
            );

            if (existingContractHour) {
                showToast("Hour per week must be unique", "error", "error");
                return;
            }

            if (editingContractHour) {
                settingsService.update(
                    "contractHours",
                    editingContractHour.id,
                    formData,
                    userData?.uid ?? "",
                    JOB_MANAGEMENT_LOG_MESSAGES.CONTRACT_HOUR_UPDATED({
                        id: editingContractHour.id,
                        ...formData,
                    }),
                );
                showToast("Contract hour updated successfully", "success", "success");
            } else {
                settingsService.create(
                    "contractHours",
                    formData,
                    userData?.uid ?? "",
                    JOB_MANAGEMENT_LOG_MESSAGES.CONTRACT_HOUR_CREATED(formData),
                );
                showToast("Contract hour created successfully", "success", "success");
            }
            setShowModal(false);
            setIsSubmitting(false);
        } catch (error) {
            showToast("Failed to save contract hour", "error", "error");
            console.error("Failed to save contract hour:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = (id: string) => {
        settingsService.remove(
            "contractHours",
            id,
            userData?.uid ?? "",
            JOB_MANAGEMENT_LOG_MESSAGES.CONTRACT_HOUR_DELETED(id),
        );
    };

    const filteredData = contractHours.filter(item => {
        const matchesSearch = Object.values(item).some(value =>
            value?.toString().toLowerCase().includes(searchTerm.toLowerCase()),
        );

        const matchesFilters = Object.entries(filters).every(([key, value]) => {
            if (!value) return true;
            const itemValue = item[key as keyof ContractHourModel]?.toString().toLowerCase();
            return itemValue?.includes(value.toLowerCase());
        });

        return matchesSearch && matchesFilters;
    });

    const applyFilters = () => {
        setShowFilterModal(false);
    };

    const clearFilters = () => {
        setFilters({
            hourPerWeek: "",
            startDate: "",
            endDate: "",
            active: "",
        });
    };

    return (
        <Card
            className={`${theme === "dark" ? "bg-black " : "bg-white/80 backdrop-blur-sm -0"} shadow-2xl rounded-2xl overflow-hidden`}
        >
            <CardHeader
                className={`${theme === "dark" ? "bg-black text-white" : "bg-amber-800 border-gray-200"} rounded-t-2xl`}
            >
                <div className="flex items-center justify-between">
                    <CardTitle
                        className={`text-xl font-bold ${theme === "dark" ? "text-white" : "text-white"}`}
                    >
                        Contract Hour
                    </CardTitle>
                    <div className="flex gap-2">
                        <Dialog open={showFilterModal} onOpenChange={setShowFilterModal}>
                            <DialogTrigger asChild>
                                <Button
                                    variant="outline"
                                    className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                                >
                                    <Filter className="h-4 w-4 mr-2" />
                                    All Filters
                                </Button>
                            </DialogTrigger>
                            <DialogContent
                                className={`max-w-2xl rounded-2xl ${theme === "dark" ? "bg-black border-white" : "bg-white backdrop-blur-sm border-0"}`}
                            >
                                <DialogHeader>
                                    <DialogTitle
                                        className={`text-xl font-bold ${theme === "dark" ? "text-white" : "text-black"}`}
                                    >
                                        Filter Contract Hours
                                    </DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                    <div>
                                        <Label
                                            className={`text-sm font-medium mb-2 block ${theme === "dark" ? "text-white" : "text-black"}`}
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
                                                            className={`rounded-xl ${theme === "dark" ? "bg-amber-600 hover:bg-amber-700 text-white" : "bg-amber-600 hover:bg-amber-700 text-white"}`}
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
                                                            className={`text-sm capitalize ${theme === "dark" ? "text-white" : "text-black"}`}
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
                                            className={`text-sm font-medium mb-2 block ${theme === "dark" ? "text-white" : "text-black"}`}
                                        >
                                            Filter Options
                                        </Label>
                                        <div className="grid grid-cols-2 gap-4">
                                            {selectedFields.hourPerWeek && (
                                                <div>
                                                    <Label
                                                        htmlFor="filter-hourPerWeek"
                                                        className={`text-sm capitalize ${theme === "dark" ? "text-white" : "text-black"}`}
                                                    >
                                                        Hours Per Week
                                                    </Label>
                                                    <Input
                                                        className={cn(
                                                            theme === "dark"
                                                                ? "bg-black text-white border-gray-600 placeholder:text-gray-500"
                                                                : "bg-white border-gray-300",
                                                            "rounded-xl",
                                                        )}
                                                        id="filter-hourPerWeek"
                                                        type="number"
                                                        value={filters.hourPerWeek}
                                                        onChange={e =>
                                                            setFilters(prev => ({
                                                                ...prev,
                                                                hourPerWeek: e.target.value,
                                                            }))
                                                        }
                                                        placeholder="Filter by hours per week"
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
                                                        type="date"
                                                        value={filters.startDate}
                                                        onChange={e =>
                                                            setFilters(prev => ({
                                                                ...prev,
                                                                startDate: e.target.value,
                                                            }))
                                                        }
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
                                                        type="date"
                                                        value={filters.endDate}
                                                        onChange={e =>
                                                            setFilters(prev => ({
                                                                ...prev,
                                                                endDate: e.target.value,
                                                            }))
                                                        }
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
                                                    <Select
                                                        value={filters.active}
                                                        onValueChange={value =>
                                                            setFilters(prev => ({
                                                                ...prev,
                                                                active: value,
                                                            }))
                                                        }
                                                    >
                                                        <SelectTrigger
                                                            className={cn(
                                                                theme === "dark"
                                                                    ? "bg-black text-white border-gray-600"
                                                                    : "bg-white border-gray-300",
                                                                "rounded-xl",
                                                            )}
                                                        >
                                                            <SelectValue placeholder="Filter by status" />
                                                        </SelectTrigger>
                                                        <SelectContent
                                                            className={cn(
                                                                theme === "dark"
                                                                    ? "bg-black border-gray-600"
                                                                    : "bg-gray-50 border-y border-gray-300",
                                                                "w-40",
                                                            )}
                                                        >
                                                            <SelectItem value="all">All</SelectItem>
                                                            <SelectItem value="yes">
                                                                Active
                                                            </SelectItem>
                                                            <SelectItem value="no">
                                                                Inactive
                                                            </SelectItem>
                                                        </SelectContent>
                                                    </Select>
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
                                            className="bg-amber-600 hover:bg-amber-700 text-white"
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
                                    Add Contract Hour
                                </Button>
                            </DialogTrigger>
                            <DialogContent
                                className={`max-w-md rounded-2xl ${theme === "dark" ? "bg-black border-white" : "bg-white backdrop-blur-sm border-0"}`}
                            >
                                <DialogHeader>
                                    <DialogTitle
                                        className={`text-xl font-bold ${theme === "dark" ? "text-white" : "text-primary-900"}`}
                                    >
                                        {editingContractHour
                                            ? "Edit Contract Hour"
                                            : "Add New Contract Hour"}
                                    </DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                    <div>
                                        <Label htmlFor="hourPerWeek">Hours Per Week</Label>
                                        <Input
                                            id="hourPerWeek"
                                            type="number"
                                            value={formData.hourPerWeek}
                                            onChange={e =>
                                                setFormData({
                                                    ...formData,
                                                    hourPerWeek:
                                                        Number.parseInt(e.target.value) || 0,
                                                })
                                            }
                                            placeholder="Enter hours per week"
                                            className={cn(
                                                theme === "dark"
                                                    ? "bg-black text-white border-gray-600 placeholder:text-gray-500"
                                                    : "bg-white border-gray-300",
                                                "rounded-xl",
                                            )}
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="startDate">Start Date</Label>
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
                                                    ? "bg-black text-white border-gray-600 placeholder:text-gray-500"
                                                    : "bg-white border-gray-300",
                                                "rounded-xl",
                                            )}
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="endDate">End Date</Label>
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
                                                    ? "bg-black text-white border-gray-600 placeholder:text-gray-500"
                                                    : "bg-white border-gray-300",
                                                "rounded-xl",
                                            )}
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="active">Status</Label>
                                        <Select
                                            value={formData.active}
                                            onValueChange={value =>
                                                setFormData({ ...formData, active: value })
                                            }
                                        >
                                            <SelectTrigger
                                                className={cn(
                                                    theme === "dark"
                                                        ? "bg-black text-white border-gray-600"
                                                        : "bg-white border-gray-300",
                                                    "rounded-xl",
                                                )}
                                            >
                                                <SelectValue placeholder="Select status" />
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
                                    <div className="flex justify-end gap-3">
                                        <Button
                                            variant="outline"
                                            onClick={() => setShowModal(false)}
                                            className={cn(
                                                theme === "dark"
                                                    ? "text-white border-gray-600 hover:bg-gray-800"
                                                    : "text-gray-700 hover:bg-gray-100",
                                                "rounded-xl",
                                            )}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            onClick={handleSubmit}
                                            className={cn(
                                                "bg-amber-600 hover:bg-amber-700 text-white rounded-xl",
                                                isSubmitting && "opacity-70 cursor-not-allowed",
                                            )}
                                            disabled={isSubmitting}
                                        >
                                            {isSubmitting
                                                ? "Saving..."
                                                : editingContractHour
                                                    ? "Update Contract Hour"
                                                    : "Add Contract Hour"}
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
                            placeholder="Search contract hours..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className={cn(
                                "pl-10 rounded-xl",
                                theme === "dark"
                                    ? "bg-black border-gray-700 text-white placeholder-gray-400"
                                    : "bg-white border-gray-200",
                            )}
                        />
                    </div>
                </div>

                <Table>
                    <TableHeader>
                        <TableRow
                            className={`${theme === "dark" ? "bg-black" : "bg-amber-800 hover:bg-amber-800"}`}
                        >
                            {selectedFields.hourPerWeek && (
                                <TableHead className="text-yellow-100 font-semibold">
                                    Hours Per Week
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
                        {filteredData.map(contractHour => (
                            <TableRow
                                key={contractHour.id}
                                className={`${theme === "dark" ? "bg-black" : "bg-white"} cursor-pointer transition-colors`}
                            >
                                {selectedFields.hourPerWeek && (
                                    <TableCell>
                                        <Badge
                                            className={`bg-blue-100 text-blue-800 border-blue-200 ${theme === "dark" ? "bg-black" : "bg-white"}`}
                                        >
                                            {contractHour.hourPerWeek} hrs
                                        </Badge>
                                    </TableCell>
                                )}
                                {selectedFields.startDate && (
                                    <TableCell
                                        className={`text-${theme === "dark" ? "white" : "black"}`}
                                    >
                                        {contractHour.startDate}
                                    </TableCell>
                                )}
                                {selectedFields.endDate && (
                                    <TableCell
                                        className={`text-${theme === "dark" ? "white" : "black"}`}
                                    >
                                        {contractHour.endDate}
                                    </TableCell>
                                )}
                                {selectedFields.active && (
                                    <TableCell>
                                        <Badge
                                            className={cn(
                                                "px-2 py-1 text-xs font-medium rounded-full border",
                                                contractHour.active === "Yes"
                                                    ? theme === "dark"
                                                        ? "bg-green-900/30 text-green-300 border-green-800/50"
                                                        : "bg-green-100 text-green-800 border-green-200"
                                                    : theme === "dark"
                                                        ? "bg-gray-800/30 text-gray-400 border-gray-700/50"
                                                        : "bg-gray-100 text-gray-800 border-gray-200",
                                            )}
                                        >
                                            {contractHour.active === "Yes" ? "Active" : "Inactive"}
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
                                                handleEdit(contractHour);
                                            }}
                                            className={cn(
                                                "h-8 w-8 p-0",
                                                theme === "dark"
                                                    ? "text-amber-400 hover:bg-amber-900/30 hover:text-amber-300"
                                                    : "text-amber-600 hover:bg-amber-100 hover:text-amber-700",
                                            )}
                                        >
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <DeleteConfirm
                                            onConfirm={() => handleDelete(contractHour.id!)}
                                            itemName={`contract hour (${contractHour.hourPerWeek} hrs)`}
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
