"use client";

import { useTheme } from "@/components/theme-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/context/authContext";
import { useData } from "@/context/app-data-context";
import { useToast } from "@/context/toastContext";
import {
    CoreSettingsRepository as settingsService,
    MaritalStatusModel,
} from "@/lib/repository/hr-settings";
import { MARITAL_STATUS_LOG_MESSAGES } from "@/lib/log-descriptions/marital-document";
import { Edit, Heart, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { DataToolbar, Density } from "../blocks/data-toolbar";
import DeleteConfirm from "../blocks/delete-confirm";
import { AddMaritalStatusModal } from "../modals/add-marital-status";

export function MaritalStatusManagement() {
    const { maritalStatuses } = useData();
    const { showToast } = useToast();
    const { theme } = useTheme();
    const { userData } = useAuth();

    const [showAddModal, setShowAddModal] = useState<boolean>(false);
    const [editingStatus, setEditingStatus] = useState<MaritalStatusModel | null>(null);

    const [density, setDensity] = useState<Density>("normal");
    const [visibleColumns, setVisibleColumns] = useState<{ name: boolean; active: boolean }>({
        name: true,
        active: true,
    });
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [statusFilter, setStatusFilter] = useState<string>("all");

    const handleEdit = (status: MaritalStatusModel) => {
        setEditingStatus(status);
        setShowAddModal(true);
    };

    const handleAdd = () => {
        setEditingStatus(null);
        setShowAddModal(true);
    };

    const handleDelete = async (id: string) => {
        try {
            await settingsService.remove(
                "maritalStatuses",
                id,
                userData?.uid ?? "",
                MARITAL_STATUS_LOG_MESSAGES.DELETED(id),
            );
            showToast("Marital status deleted successfully", "success", "success");
        } catch (error) {
            console.error("Failed to delete marital status:", error);
            showToast("Failed to delete marital status", "error", "error");
        }
    };

    const filteredStatuses = useMemo(() => {
        return maritalStatuses.filter(s => {
            const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus =
                statusFilter === "all" ||
                (statusFilter === "active" && s.active) ||
                (statusFilter === "inactive" && !s.active);
            return matchesSearch && matchesStatus;
        });
    }, [maritalStatuses, searchTerm, statusFilter]);

    const cols = Object.entries(visibleColumns).map(([key, visible]) => ({
        key,
        visible,
        label: key.charAt(0).toUpperCase() + key.slice(1),
    }));
    const toggleCol = (key: string) =>
        setVisibleColumns(s => ({ ...s, [key]: !s[key as keyof typeof s] }));

    const activeFilters = (searchTerm ? 1 : 0) + (statusFilter !== "all" ? 1 : 0);

    const exportStatuses = () => {
        const headers = cols
            .filter(c => c.visible)
            .map(c => c.label)
            .join(",");
        const rows = filteredStatuses
            .map(s =>
                cols
                    .filter(c => c.visible)
                    .map(c => String(s[c.key as keyof MaritalStatusModel] ?? ""))
                    .join(","),
            )
            .join("\n");
        const csv = [headers, rows].join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "marital_statuses.csv";
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className={`min-h-screen  p-6 ${theme === "dark" ? "bg-black" : "bg-amber-50/30"}`}>
            <div className="max-w-7xl mx-auto space-y-8">
                <Card
                    className={`${theme === "dark" ? "bg-black " : "bg-white/80 backdrop-blur-sm "} shadow-2xl rounded-2xl overflow-hidden`}
                >
                    <div
                        className={`${theme === "dark" ? "bg-black text-white" : "bg-amber-800 text-white"} p-6`}
                    >
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-white/20 rounded-xl">
                                        <Heart className="h-8 w-8" />
                                    </div>
                                    <div>
                                        <div className="text-2xl font-bold">Marital Statuses</div>
                                        <div className="text-yellow-200 text-sm font-normal">
                                            {filteredStatuses.length} of {maritalStatuses.length}{" "}
                                            statuses
                                        </div>
                                    </div>
                                </div>

                                <Button
                                    onClick={handleAdd}
                                    className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-2 rounded-xl"
                                >
                                    <Plus className="h-5 w-5 mr-2" />
                                    Add Marital Status
                                </Button>

                                <AddMaritalStatusModal
                                    showAddModal={showAddModal}
                                    setShowAddModal={setShowAddModal}
                                    editingStatus={editingStatus}
                                    maritalStatuses={maritalStatuses}
                                />
                            </div>

                            <DataToolbar
                                columns={cols}
                                onToggleColumn={toggleCol}
                                density={density}
                                onDensityChange={setDensity}
                                onExport={exportStatuses}
                                filtersActiveCount={activeFilters}
                                filtersContent={
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <Label className="text-sm font-semibold text-slate-700">
                                                Search
                                            </Label>
                                            <Input
                                                placeholder="Search statuses..."
                                                value={searchTerm}
                                                onChange={e => setSearchTerm(e.target.value)}
                                                className="mt-2"
                                            />
                                        </div>
                                        <div>
                                            <Label className="text-sm font-semibold text-slate-700">
                                                Status
                                            </Label>
                                            <Select
                                                value={statusFilter}
                                                onValueChange={setStatusFilter}
                                            >
                                                <SelectTrigger className="mt-2">
                                                    <SelectValue placeholder="All" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="all">All</SelectItem>
                                                    <SelectItem value="active">Active</SelectItem>
                                                    <SelectItem value="inactive">
                                                        Inactive
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                }
                            />
                        </div>
                    </div>

                    {/* Table */}
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow
                                        className={
                                            theme === "dark"
                                                ? "bg-black hover:bg-gray-800"
                                                : "bg-amber-800 hover:bg-amber-800"
                                        }
                                    >
                                        {visibleColumns.name && (
                                            <TableHead className="text-yellow-100 font-semibold text-sm py-4 px-6">
                                                Name
                                            </TableHead>
                                        )}
                                        {visibleColumns.active && (
                                            <TableHead className="text-yellow-100 font-semibold text-sm py-4 px-6">
                                                Active
                                            </TableHead>
                                        )}
                                        <TableHead className="text-yellow-100 font-semibold text-sm py-4 px-6 text-right">
                                            Actions
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredStatuses.length > 0 ? (
                                        filteredStatuses.map((status, index) => (
                                            <TableRow
                                                key={status.id}
                                                className={`${
                                                    index % 2 === 0
                                                        ? theme === "dark"
                                                            ? "bg-black"
                                                            : "bg-white"
                                                        : ""
                                                } transition-all duration-200 border-amber-100 cursor-pointer`}
                                            >
                                                {visibleColumns.name && (
                                                    <TableCell
                                                        className={`px-6 font-semibold ${theme === "dark" ? "text-white" : "text-slate-900"}`}
                                                    >
                                                        {status.name}
                                                    </TableCell>
                                                )}
                                                {visibleColumns.active && (
                                                    <TableCell className="px-6">
                                                        <Badge
                                                            className={`rounded-lg px-3 py-1 ${
                                                                status.active === true
                                                                    ? `${theme === "dark" ? "bg-green-100 text-green-800 border-green-200" : "bg-green-100 text-green-800 border-green-200"}`
                                                                    : `${theme === "dark" ? "bg-gray-100 text-gray-800 border-gray-200" : "bg-gray-100 text-gray-800 border-gray-200"}`
                                                            }`}
                                                        >
                                                            {status.active ? "Active" : "Inactive"}
                                                        </Badge>
                                                    </TableCell>
                                                )}
                                                <TableCell className="px-6 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleEdit(status)}
                                                            className="h-9 w-9 p-0 hover:bg-amber-100 rounded-lg"
                                                        >
                                                            <Edit className="h-4 w-4 text-amber-600" />
                                                        </Button>
                                                        <DeleteConfirm
                                                            onConfirm={() =>
                                                                handleDelete(status.id)
                                                            }
                                                            itemName={`Marital Status (${status.name})`}
                                                        />
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell
                                                colSpan={
                                                    Object.values(visibleColumns).filter(Boolean)
                                                        .length + 1
                                                }
                                                className="text-center py-12"
                                            >
                                                <div className="flex flex-col items-center gap-4">
                                                    <div className="p-4 bg-amber-100 rounded-full">
                                                        <Heart className="h-10 w-10 text-slate-400" />
                                                    </div>
                                                    <div>
                                                        <p className="text-slate-500 text-lg font-medium">
                                                            No marital statuses found
                                                        </p>
                                                        <p className="text-slate-400 text-sm">
                                                            Try adjusting your search criteria
                                                        </p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
