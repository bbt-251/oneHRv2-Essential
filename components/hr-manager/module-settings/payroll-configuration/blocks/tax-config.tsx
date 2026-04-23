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
import { TaxObligationForm, TaxObligationView } from "./tax-config-components";
import { TaxModel } from "@/lib/models/hr-settings";
import { useData } from "@/context/app-data-context";
import { useToast } from "@/context/toastContext";
import { useConfirm } from "@/hooks/use-confirm-dialog";
import { ModuleSettingsRepository as settingsService } from "@/lib/repository/hr-settings";

function TaxObligationTable({
    data,
    onAdd,
    onEdit,
    onView,
    onDelete,
    density,
    visibleColumns,
    onToggleColumn,
    onDensityChange,
    onExport,
    filtersContent,
    filtersActiveCount,
}: {
    data: TaxModel[];
    onAdd: () => void;
    onEdit: (item: TaxModel) => void;
    onView: (item: TaxModel) => void;
    onDelete: (item: TaxModel) => void;
    density: Density;
    visibleColumns: ColumnConfig[];
    onToggleColumn: (key: string) => void;
    onDensityChange: (density: Density) => void;
    onExport: () => void;
    filtersContent: React.ReactNode;
    filtersActiveCount: number;
}) {
    const visibleColumnKeys = visibleColumns.filter(col => col.visible).map(col => col.key);

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Tax Obligations
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Manage tax obligation configurations
                    </p>
                </div>
                <Button onClick={onAdd} className="bg-amber-600 hover:bg-amber-700 text-white">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Tax Obligation
                </Button>
            </div>

            <DataToolbar
                columns={visibleColumns}
                onToggleColumn={onToggleColumn}
                density={density}
                onDensityChange={onDensityChange}
                onExport={onExport}
                filtersContent={filtersContent}
                filtersActiveCount={filtersActiveCount}
            />

            <Card className="dark:bg-black dark:border-gray-700">
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-amber-800 hover:bg-amber-800">
                                {visibleColumns
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
                            {data.map((item, index) => (
                                <TableRow
                                    key={item.id}
                                    className={`${
                                        index % 2 === 0
                                            ? "bg-white dark:bg-black"
                                            : "bg-slate-50/50 dark:bg-gray-800/50"
                                    } hover:bg-amber-50/50 dark:hover:bg-gray-700/50 ${getDensityRowClasses(
                                        density,
                                    )}`}
                                >
                                    {visibleColumns
                                        .filter(col => visibleColumnKeys.includes(col.key))
                                        .map(column => (
                                            <TableCell
                                                key={column.key}
                                                className="text-gray-900 dark:text-gray-200"
                                            >
                                                {column.key === "taxName" ? (
                                                    item.taxName
                                                ) : column.key === "active" ? (
                                                    <Badge
                                                        variant={
                                                            item.active ? "default" : "secondary"
                                                        }
                                                    >
                                                        {item.active ? "Active" : "Inactive"}
                                                    </Badge>
                                                ) : column.key === "bracketsCount" ? (
                                                    item.taxRates?.length
                                                ) : column.key === "upperTaxRate" ? (
                                                    `${item.upperTaxRate}%`
                                                ) : column.key === "timestamp" ? (
                                                    new Date(item.timestamp).toLocaleDateString()
                                                ) : (
                                                    String(item[column.key as keyof TaxModel] ?? "")
                                                )}
                                            </TableCell>
                                        ))}
                                    <TableCell>
                                        <div className="flex space-x-1">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => onView(item)}
                                                className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-gray-700"
                                                title="View Details"
                                            >
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => onEdit(item)}
                                                className="h-8 w-8 p-0 text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-gray-700"
                                                title="Edit"
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => onDelete(item)}
                                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-gray-700"
                                                title="Delete"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {data?.length === 0 && (
                                <TableRow>
                                    <TableCell
                                        colSpan={visibleColumns?.length + 1}
                                        className="text-center py-8 text-gray-500 dark:text-gray-400"
                                    >
                                        No tax obligations found. Click &quot;Add Tax
                                        Obligation&quot; to create your first entry.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}

export function TaxConfiguration() {
    const { taxes } = useData();
    const { showToast } = useToast();
    const { confirm, ConfirmDialog } = useConfirm();
    const [isAddEditLoading, setIsAddEditLoading] = useState<boolean>(false);

    const [density, setDensity] = useState<Density>("normal");
    const [showDialog, setShowDialog] = useState<boolean>(false);
    const [showViewDialog, setShowViewDialog] = useState<boolean>(false);
    const [editingItem, setEditingItem] = useState<TaxModel | null>(null);
    const [viewingItem, setViewingItem] = useState<TaxModel | null>(null);

    const taxObligationColumns: ColumnConfig[] = [
        { key: "taxName", label: "Name", visible: true },
        { key: "active", label: "Status", visible: true },
        { key: "bracketsCount", label: "Tax Brackets", visible: true },
        { key: "upperTaxRate", label: "Upper Tax Rate", visible: true },
        { key: "timestamp", label: "Created", visible: true },
    ];

    const [columnConfig, setColumnConfig] = useState<ColumnConfig[]>(taxObligationColumns);

    const handleAdd = () => {
        setEditingItem(null);
        setShowDialog(true);
    };

    const handleEdit = (item: TaxModel) => {
        setEditingItem(item);
        setShowDialog(true);
    };

    const handleView = (item: TaxModel) => {
        setViewingItem(item);
        setShowViewDialog(true);
    };

    const handleDelete = (item: TaxModel) => {
        confirm("Are you sure ?", async () => {
            const res = await settingsService.remove("taxes", item.id);
            if (res) {
                showToast("Tax deleted successfully", "Success", "success");
            } else {
                showToast("Error deleting tax", "Error", "error");
            }
        });
    };

    const handleSave = async (formData: TaxModel) => {
        setIsAddEditLoading(true);

        const { id: _id, ...data } = formData;
        if (editingItem) {
            const res = await settingsService.update("taxes", editingItem.id, data);
            if (res) {
                showToast("Tax updated successfully", "Success", "success");
                setShowDialog(false);
                setEditingItem(null);
            } else {
                showToast("Error updating tax", "Error", "error");
            }
        } else {
            const res = await settingsService.create("taxes", data);
            if (res) {
                showToast("Tax type created successfully", "Success", "success");
                setShowDialog(false);
                setEditingItem(null);
            } else {
                showToast("Error creating tax", "Error", "error");
            }
        }
        setIsAddEditLoading(false);
    };

    const handleExport = () => {
        const headers = columnConfig.filter(col => col.visible).map(col => col.label);
        const csvContent = [
            headers.join(","),
            ...taxes.map(item =>
                columnConfig
                    .filter(col => col.visible)
                    .map(col => {
                        if (col.key === "active") {
                            return item.active ? "Active" : "Inactive";
                        }
                        if (col.key === "bracketsCount") {
                            return item.taxRates?.length;
                        }
                        if (col.key === "upperTaxRate") {
                            return `${item.upperTaxRate}%`;
                        }
                        if (col.key === "timestamp") {
                            return new Date(item.timestamp).toLocaleDateString();
                        }
                        return item[col.key as keyof TaxModel];
                    })
                    .join(","),
            ),
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "tax-obligations.csv";
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

    return (
        <Card className="dark:bg-black dark:border-gray-700">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                    <Calculator className="h-5 w-5 text-amber-600" />
                    Tax Configuration
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <TaxObligationTable
                    data={taxes}
                    onAdd={handleAdd}
                    onEdit={handleEdit}
                    onView={handleView}
                    onDelete={handleDelete}
                    density={density}
                    visibleColumns={columnConfig}
                    onToggleColumn={toggleColumn}
                    onDensityChange={setDensity}
                    onExport={handleExport}
                    filtersContent={filtersContent}
                    filtersActiveCount={0}
                />

                {/* Add/Edit Dialog */}
                <Dialog open={showDialog} onOpenChange={setShowDialog}>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto dark:bg-black dark:text-white">
                        <DialogHeader>
                            <DialogTitle>
                                {editingItem ? "Edit Tax Obligation" : "Add New Tax Obligation"}
                            </DialogTitle>
                        </DialogHeader>
                        <TaxObligationForm
                            data={editingItem || undefined}
                            isAddEditLoading={isAddEditLoading}
                            onSave={handleSave}
                            onCancel={() => setShowDialog(false)}
                        />
                    </DialogContent>
                </Dialog>

                {/* View Dialog */}
                <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
                    <DialogContent className="max-w-2xl dark:bg-black dark:text-white">
                        <DialogHeader>
                            <DialogTitle>Tax Obligation Details</DialogTitle>
                        </DialogHeader>
                        {viewingItem && (
                            <TaxObligationView
                                data={viewingItem}
                                onClose={() => setShowViewDialog(false)}
                                onEdit={() => {
                                    setShowViewDialog(false);
                                    handleEdit(viewingItem);
                                }}
                            />
                        )}
                    </DialogContent>
                </Dialog>
            </CardContent>
            {ConfirmDialog}
        </Card>
    );
}
