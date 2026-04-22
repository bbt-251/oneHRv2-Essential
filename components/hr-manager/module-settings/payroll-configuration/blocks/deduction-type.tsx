import {
    ColumnConfig,
    DataToolbar,
    Density,
    getDensityRowClasses,
} from "@/components/hr-manager/core-settings/blocks/data-toolbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
import { Calculator, Edit, Eye, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { DeductionTypeForm } from "./deduction-type-components";
import { DeductionTypeModel } from "@/lib/models/hr-settings";
import { useData } from "@/context/app-data-context";
import { useToast } from "@/context/toastContext";
import { useConfirm } from "@/hooks/use-confirm-dialog";
import { hrSettingsService } from "@/lib/backend/hr-settings-service";

export function DeductionType() {
    const { ...hrSettings } = useData();
    const deductionTypes = hrSettings.deductionTypes;
    const { showToast } = useToast();
    const { confirm, ConfirmDialog } = useConfirm();
    const [isAddEditLoading, setIsAddEditLoading] = useState<boolean>(false);
    const [density, setDensity] = useState<Density>("normal");
    const [showDialog, setShowDialog] = useState<boolean>(false);
    const [showViewDialog, setShowViewDialog] = useState<boolean>(false);
    const [editingItem, setEditingItem] = useState<DeductionTypeModel | null>(null);
    const [viewingItem, setViewingItem] = useState<DeductionTypeModel | null>(null);

    const deductionTypeColumns: ColumnConfig[] = [
        { key: "deductionName", label: "Name", visible: true },
        { key: "active", label: "Status", visible: true },
    ];

    const [columnConfig, setColumnConfig] = useState<ColumnConfig[]>(deductionTypeColumns);

    const handleAdd = () => {
        setEditingItem(null);
        setShowDialog(true);
    };

    const handleEdit = (item: DeductionTypeModel) => {
        setEditingItem(item);
        setShowDialog(true);
    };

    const handleView = (item: DeductionTypeModel) => {
        setViewingItem(item);
        setShowViewDialog(true);
    };

    const handleDelete = (item: DeductionTypeModel) => {
        confirm("Are you sure ?", async () => {
            const res = await hrSettingsService.remove("deductionTypes", item.id);
            if (res) {
                showToast("Deduction type deleted successfully", "Success", "success");
            } else {
                showToast("Error deleting deduction type", "Error", "error");
            }
        });
    };

    const handleSave = async (formData: DeductionTypeModel) => {
        setIsAddEditLoading(true);

        const { id: _id, ...data } = formData;
        if (editingItem) {
            const res = await hrSettingsService.update("deductionTypes", editingItem.id, data);
            if (res) {
                showToast("Deduction type updated successfully", "Success", "success");
                setShowDialog(false);
                setEditingItem(null);
            } else {
                showToast("Error updating deduction type", "Error", "error");
            }
        } else {
            const res = await hrSettingsService.create("deductionTypes", data);
            if (res) {
                showToast("Deduction type created successfully", "Success", "success");
                setShowDialog(false);
                setEditingItem(null);
            } else {
                showToast("Error creating deduction type", "Error", "error");
            }
        }
        setIsAddEditLoading(false);
    };

    const handleExport = () => {
        const headers = columnConfig.filter(col => col.visible).map(col => col.label);
        const csvContent = [
            headers.join(","),
            ...deductionTypes.map(item =>
                columnConfig
                    .filter(col => col.visible)
                    .map(col => {
                        if (col.key === "active") {
                            return item.active ? "Active" : "Inactive";
                        }
                        return item[col.key as keyof DeductionTypeModel];
                    })
                    .join(","),
            ),
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "deduction-types.csv";
        a.click();
        window.URL.revokeObjectURL(url);
    };

    const toggleColumn = (key: string) => {
        setColumnConfig(
            columnConfig.map(col => (col.key === key ? { ...col, visible: !col.visible } : col)),
        );
    };

    const filtersContent = (
        <div className="space-y-4">
            <div className="space-y-2">
                <Label>Status</Label>
                <Select>
                    <SelectTrigger>
                        <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>
    );

    const visibleColumnKeys = columnConfig.filter(col => col.visible).map(col => col.key);

    return (
        <Card className="dark:bg-black">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 dark:text-white">
                    <Calculator className="h-5 w-5 text-amber-600" />
                    Deduction Type Configuration
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 dark:bg-black">
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                Deduction Types
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Manage deduction type configurations
                            </p>
                        </div>
                        <Button
                            onClick={handleAdd}
                            className="bg-amber-600 hover:bg-amber-700 text-white"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Deduction Type
                        </Button>
                    </div>

                    <DataToolbar
                        columns={columnConfig}
                        onToggleColumn={toggleColumn}
                        density={density}
                        onDensityChange={setDensity}
                        onExport={handleExport}
                        filtersContent={filtersContent}
                        filtersActiveCount={0}
                    />

                    <Card className="dark:bg-black">
                        <CardContent className="p-0 dark:bg-black">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-amber-800 hover:bg-amber-800">
                                        {columnConfig
                                            .filter(col => visibleColumnKeys.includes(col.key))
                                            .map(column => (
                                                <TableHead
                                                    key={column.key}
                                                    className="text-yellow-100 font-semibold"
                                                >
                                                    {column.label}
                                                </TableHead>
                                            ))}
                                        <TableHead className="text-yellow-100 font-semibold">
                                            Actions
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {deductionTypes.map((item, index) => (
                                        <TableRow
                                            key={item.id}
                                            className={`${
                                                index % 2 === 0
                                                    ? "bg-white dark:bg-black"
                                                    : "bg-slate-50/50 dark:bg-black"
                                            } hover:bg-amber-50/50 dark:hover:bg-gray-700 ${getDensityRowClasses(
                                                density,
                                            )}`}
                                        >
                                            {columnConfig
                                                .filter(col => visibleColumnKeys.includes(col.key))
                                                .map(column => (
                                                    <TableCell
                                                        key={column.key}
                                                        className="dark:text-white"
                                                    >
                                                        {column.key === "active" ? (
                                                            <Badge
                                                                variant={
                                                                    item.active
                                                                        ? "default"
                                                                        : "secondary"
                                                                }
                                                            >
                                                                {item.active
                                                                    ? "Active"
                                                                    : "Inactive"}
                                                            </Badge>
                                                        ) : (
                                                            item[
                                                                column.key as keyof DeductionTypeModel
                                                            ]
                                                        )}
                                                    </TableCell>
                                                ))}
                                            <TableCell>
                                                <div className="flex space-x-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleView(item)}
                                                        className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-gray-700"
                                                        title="View Details"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleEdit(item)}
                                                        className="h-8 w-8 p-0 text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-gray-700"
                                                        title="Edit"
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleDelete(item)}
                                                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-gray-700"
                                                        title="Delete"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {deductionTypes.length === 0 && (
                                        <TableRow>
                                            <TableCell
                                                colSpan={columnConfig.length + 1}
                                                className="text-center py-8 text-gray-500 dark:text-gray-400"
                                            >
                                                No deduction types found. Click &quot;Add Deduction
                                                Type&quot; to create your first entry.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>

                {/* Add/Edit Dialog */}
                <Dialog open={showDialog} onOpenChange={setShowDialog}>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto dark:bg-black">
                        <DialogHeader>
                            <DialogTitle className="dark:text-white">
                                {editingItem ? "Edit Deduction Type" : "Add New Deduction Type"}
                            </DialogTitle>
                        </DialogHeader>
                        <DeductionTypeForm
                            data={editingItem || undefined}
                            isAddEditLoading={isAddEditLoading}
                            onSave={handleSave}
                            onCancel={() => setShowDialog(false)}
                        />
                    </DialogContent>
                </Dialog>

                {/* View Dialog */}
                <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
                    <DialogContent className="max-w-2xl dark:bg-black">
                        <DialogHeader>
                            <DialogTitle className="dark:text-white">
                                Deduction Type Details
                            </DialogTitle>
                        </DialogHeader>
                        {viewingItem && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <div>
                                            <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                                Name
                                            </Label>
                                            <p className="text-lg font-semibold dark:text-white">
                                                {viewingItem.deductionName}
                                            </p>
                                        </div>
                                        <div>
                                            <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                                Status
                                            </Label>
                                            <Badge
                                                variant={
                                                    viewingItem.active ? "default" : "secondary"
                                                }
                                            >
                                                {viewingItem.active ? "Active" : "Inactive"}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex justify-end space-x-2 pt-4 border-t dark:border-gray-700">
                                    <Button
                                        variant="outline"
                                        onClick={() => setShowViewDialog(false)}
                                        className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
                                    >
                                        Close
                                    </Button>
                                    <Button
                                        onClick={() => {
                                            setShowViewDialog(false);
                                            handleEdit(viewingItem);
                                        }}
                                        className="bg-amber-600 hover:bg-amber-700 text-white"
                                    >
                                        <Edit className="h-4 w-4 mr-2" />
                                        Edit
                                    </Button>
                                </div>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>

                {/* Delete Confirmation Dialog */}
                {ConfirmDialog}
            </CardContent>
        </Card>
    );
}
