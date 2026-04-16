"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Plus, Edit, Filter, Search, X } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { hrSettingsService, ProbationDayModel } from "@/lib/backend/firebase/hrSettingsService";
import { useFirestore } from "@/context/firestore-context";
import { useToast } from "@/context/toastContext";
import { useTheme } from "@/components/theme-provider";
import { cn } from "@/lib/utils";
import DeleteConfirm from "../../blocks/delete-confirm";
import { useAuth } from "@/context/authContext";
import { JOB_MANAGEMENT_LOG_MESSAGES } from "@/lib/log-descriptions/job-management";

export default function ProbationEndPeriod() {
    const { showToast } = useToast();
    const { theme } = useTheme();
    const { hrSettings } = useFirestore();
    const { userData } = useAuth();
    const probationDays = hrSettings.probationDays;

    const [showModal, setShowModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingDay, setEditingDay] = useState<ProbationDayModel | null>(null);
    const [formData, setFormData] = useState({
        value: 0,
    });

    const [showFilterModal, setShowFilterModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [visibleFields, setVisibleFields] = useState({
        value: true,
    });
    const [filters, setFilters] = useState({
        value: "",
    });

    const handleAdd = () => {
        setEditingDay(null);
        setFormData({ value: 0 });
        setShowModal(true);
    };

    const handleEdit = (day: ProbationDayModel) => {
        setEditingDay(day);
        setFormData({ value: day.value });
        setShowModal(true);
    };

    const handleRowClick = (day: ProbationDayModel) => {
        handleEdit(day);
    };

    const handleSubmit = async () => {
        try {
            setIsSubmitting(true);
            // required fields

            if (!formData.value) {
                showToast("Probation day value is required", "error", "error");
                return;
            }
            const existingDay = probationDays.find(
                day => day.value === formData.value && (!editingDay || day.id !== editingDay.id),
            );

            if (existingDay) {
                showToast("Probation day value already exists", "error", "error");
                return;
            }
            if (editingDay) {
                await hrSettingsService.update(
                    "probationDays",
                    editingDay.id,
                    formData,
                    userData?.uid ?? "",
                    JOB_MANAGEMENT_LOG_MESSAGES.PROBATION_PERIOD_UPDATED({
                        id: editingDay.id,
                        value: formData.value,
                    }),
                );
                showToast("Probation day updated successfully", "success", "success");
            } else {
                await hrSettingsService.create(
                    "probationDays",
                    formData,
                    userData?.uid ?? "",
                    JOB_MANAGEMENT_LOG_MESSAGES.PROBATION_PERIOD_CREATED({ value: formData.value }),
                );
                showToast("Probation day added successfully", "success", "success");
            }
            setShowModal(false);
            setIsSubmitting(false);
        } catch (error) {
            showToast("Failed to save probation day", "error", "error");
            console.error("Failed to save probation day:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        await hrSettingsService.remove(
            "probationDays",
            id,
            userData?.uid ?? "",
            JOB_MANAGEMENT_LOG_MESSAGES.PROBATION_PERIOD_DELETED(id),
        );
        showToast("Probation day deleted successfully", "success", "success");
    };

    const filteredData = probationDays.filter(day => {
        const matchesSearch = day.value.toString().includes(searchTerm.toLowerCase());
        const matchesFilters = !filters.value || day.value.toString().includes(filters.value);

        return matchesSearch && matchesFilters;
    });

    const handleApplyFilters = () => {
        setShowFilterModal(false);
    };

    const handleClearFilters = () => {
        setFilters({ value: "" });
        setSearchTerm("");
    };

    const handleFieldVisibilityChange = (field: string, checked: boolean) => {
        setVisibleFields(prev => ({ ...prev, [field]: checked }));
    };

    return (
        <Card
            className={`${theme === "dark" ? "bg-black " : "bg-white/80 backdrop-blur-sm "} shadow-2xl rounded-2xl overflow-hidden`}
        >
            <CardHeader
                className={`${theme === "dark" ? "bg-black text-white" : "bg-amber-800 border-gray-200"} rounded-t-2xl`}
            >
                <div className="flex items-center justify-between">
                    <CardTitle className="text-xl font-bold text-white">
                        Probation End Period
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
                                        Filter Probation Days
                                    </DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                    {/* Field Selection */}
                                    <div>
                                        <Label
                                            className={`text-sm font-medium mb-2 block ${theme === "dark" ? "text-white" : "text-black"}`}
                                        >
                                            Select Fields to Display
                                        </Label>
                                        <div className="space-y-2 mt-2">
                                            <div className="flex items-center space-x-2">
                                                <Checkbox
                                                    className={`rounded-xl ${theme === "dark" ? "bg-amber-600 hover:bg-amber-700 text-white" : "bg-amber-600 hover:bg-amber-700 text-white"}`}
                                                    id="field-value"
                                                    checked={visibleFields.value}
                                                    onCheckedChange={checked =>
                                                        handleFieldVisibilityChange(
                                                            "value",
                                                            checked as boolean,
                                                        )
                                                    }
                                                />
                                                <Label
                                                    htmlFor="field-value"
                                                    className={`text-sm capitalize ${theme === "dark" ? "text-white" : "text-black"}`}
                                                >
                                                    Days
                                                </Label>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Filter Inputs */}
                                    <div className="space-y-3">
                                        <Label
                                            className={`text-sm font-medium ${theme === "dark" ? "text-white" : "text-black"}`}
                                        >
                                            Filter by Fields
                                        </Label>

                                        {visibleFields.value && (
                                            <div>
                                                <Label
                                                    htmlFor="filter-value"
                                                    className={`text-xs text-gray-600 ${theme === "dark" ? "text-white" : "text-black"}`}
                                                >
                                                    Days
                                                </Label>
                                                <Input
                                                    className={cn(
                                                        theme === "dark"
                                                            ? "bg-black text-white border-gray-600 placeholder:text-gray-500"
                                                            : "bg-white border-gray-300",
                                                        "rounded-xl",
                                                    )}
                                                    id="filter-value"
                                                    type="number"
                                                    placeholder="Filter by days..."
                                                    value={filters.value}
                                                    onChange={e =>
                                                        setFilters(prev => ({
                                                            ...prev,
                                                            value: e.target.value,
                                                        }))
                                                    }
                                                />
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex justify-end gap-3">
                                        <Button
                                            variant="outline"
                                            onClick={handleClearFilters}
                                            className={`${theme === "dark" ? "text-white" : "text-black"}`}
                                        >
                                            Clear All
                                        </Button>
                                        <Button
                                            onClick={handleApplyFilters}
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
                                    Add Probation Days
                                </Button>
                            </DialogTrigger>
                            <DialogContent
                                className={`max-w-md rounded-2xl ${theme === "dark" ? "bg-black border-white" : "bg-white backdrop-blur-sm border-0"}`}
                            >
                                <DialogHeader>
                                    <DialogTitle
                                        className={`text-xl font-bold ${theme === "dark" ? "text-white" : "text-primary-900"}`}
                                    >
                                        {editingDay
                                            ? "Edit Probation Days"
                                            : "Add New Probation Days"}
                                    </DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                    <div>
                                        <Label
                                            htmlFor="value"
                                            className={`text-sm font-medium ${theme === "dark" ? "text-white" : "text-black"}`}
                                        >
                                            Days
                                        </Label>
                                        <Input
                                            id="value"
                                            type="number"
                                            value={formData.value}
                                            onChange={e =>
                                                setFormData({
                                                    ...formData,
                                                    value: Number.parseInt(e.target.value) || 0,
                                                })
                                            }
                                            placeholder="Enter number of days"
                                            className={cn(
                                                theme === "dark"
                                                    ? "bg-black text-white border-gray-600 placeholder:text-gray-500"
                                                    : "bg-white border-gray-300",
                                                "rounded-xl",
                                            )}
                                        />
                                    </div>
                                    <div className="flex justify-end gap-3">
                                        <Button
                                            variant="outline"
                                            onClick={() => setShowModal(false)}
                                            className={`${theme === "dark" ? "text-white" : "text-black"}`}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            onClick={handleSubmit}
                                            className="bg-amber-600 hover:bg-amber-700 text-white"
                                        >
                                            {editingDay ? "Update" : "Add"}
                                        </Button>
                                    </div>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60 h-4 w-4" />
                    <Input
                        placeholder="Search probation days..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/60"
                    />
                    {searchTerm && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSearchTerm("")}
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 text-white/60 hover:text-white"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow
                            className={`${theme === "dark" ? "bg-black" : "bg-amber-800 hover:bg-amber-800"}`}
                        >
                            {visibleFields.value && (
                                <TableHead className="text-yellow-100 font-semibold">
                                    Days
                                </TableHead>
                            )}
                            <TableHead className="text-yellow-100 font-semibold text-right">
                                Actions
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredData.map((day, index) => (
                            <TableRow
                                key={day.id}
                                className={`${index % 2 === 0 ? (theme === "dark" ? "bg-gray-900/50" : "bg-white") : theme === "dark" ? "bg-gray-800/50" : "bg-gray-50"} hover:${theme === "dark" ? "bg-gray-700/50" : "bg-amber-50/50"} cursor-pointer transition-colors`}
                            >
                                {visibleFields.value && (
                                    <TableCell className="font-semibold">
                                        <Badge
                                            className="bg-blue-100 text-blue-800 b                                        <Badge className={`bg-blue-100 text-blue-800 border-blue-200 ${theme === 'dark' ? 'bg-gray-900/50' : 'bg-white'}`}>{contractHour.hourPerWeek} hrs</Badge>
                                     order-blue-200"
                                        >
                                            {day.value} days
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
                                                handleEdit(day);
                                            }}
                                            className="h-8 w-8 p-0 hover:bg-amber-100"
                                        >
                                            <Edit className="h-4 w-4 text-amber-600" />
                                        </Button>
                                        <DeleteConfirm
                                            onConfirm={() => handleDelete(day.id!)}
                                            itemName={`probation day (${day.value})`}
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
