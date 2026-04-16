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
import { LoanTypeForm } from "./loan-type-components";
import { LoanTypeModel } from "@/lib/models/hr-settings";
import { useFirestore } from "@/context/firestore-context";
import { useToast } from "@/context/toastContext";
import { useConfirm } from "@/hooks/use-confirm-dialog";
import { hrSettingsService } from "@/lib/backend/firebase/hrSettingsService";

export function LoanType() {
    const { hrSettings } = useFirestore();
    const loanTypes = hrSettings.loanTypes;
    const { showToast } = useToast();
    const { confirm, ConfirmDialog } = useConfirm();
    const [isAddEditLoading, setIsAddEditLoading] = useState(false);
    const [density, setDensity] = useState<Density>("normal");
    const [showDialog, setShowDialog] = useState(false);
    const [showViewDialog, setShowViewDialog] = useState(false);
    const [editingItem, setEditingItem] = useState<LoanTypeModel | null>(null);
    const [viewingItem, setViewingItem] = useState<LoanTypeModel | null>(null);

    const loanTypeColumns: ColumnConfig[] = [
        { key: "loanName", label: "Loan Name", visible: true },
        {
            key: "loanInterestRate",
            label: "Loan Interest Rate (%)",
            visible: true,
        },
        {
            key: "marketInterestRate",
            label: "Market Interest Rate (%)",
            visible: true,
        },
        { key: "active", label: "Status", visible: true },
        { key: "timestamp", label: "Created", visible: true },
    ];

    const [columnConfig, setColumnConfig] = useState(loanTypeColumns);

    const handleAdd = () => {
        setEditingItem(null);
        setShowDialog(true);
    };

    const handleEdit = (item: LoanTypeModel) => {
        setEditingItem(item);
        setShowDialog(true);
    };

    const handleView = (item: LoanTypeModel) => {
        setViewingItem(item);
        setShowViewDialog(true);
    };

    const handleDelete = (item: LoanTypeModel) => {
        confirm("Are you sure ?", async () => {
            const res = await hrSettingsService.remove("loanTypes", item.id);
            if (res) {
                showToast("Loan type deleted successfully", "Success", "success");
            } else {
                showToast("Error deleting loan type", "Error", "error");
            }
        });
    };

    const handleSave = async (formData: LoanTypeModel) => {
        setIsAddEditLoading(true);

        const { id, ...data } = formData;
        if (editingItem) {
            const res = await hrSettingsService.update("loanTypes", editingItem.id, data);
            if (res) {
                showToast("Loan type updated successfully", "Success", "success");
                setShowDialog(false);
                setEditingItem(null);
            } else {
                showToast("Error updating payment type", "Error", "error");
            }
        } else {
            const res = await hrSettingsService.create("loanTypes", data);
            if (res) {
                showToast("Loan type created successfully", "Success", "success");
                setShowDialog(false);
                setEditingItem(null);
            } else {
                showToast("Error creating payment type", "Error", "error");
            }
        }
        setIsAddEditLoading(false);
    };

    const handleExport = () => {
        const headers = columnConfig.filter(col => col.visible).map(col => col.label);
        const csvContent = [
            headers.join(","),
            ...loanTypes.map(item =>
                columnConfig
                    .filter(col => col.visible)
                    .map(col => {
                        if (col.key === "active") {
                            return item.active ? "Active" : "Inactive";
                        }
                        if (col.key === "timestamp") {
                            return new Date(item.timestamp).toLocaleDateString();
                        }
                        return item[col.key as keyof LoanTypeModel];
                    })
                    .join(","),
            ),
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "loan-types.csv";
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
        <Card className="dark:bg-black dark:border-gray-700">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                    <Calculator className="h-5 w-5 text-amber-600" />
                    Loan Type Configuration
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                Loan Types
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Manage loan type configurations
                            </p>
                        </div>
                        <Button
                            onClick={handleAdd}
                            className="bg-amber-600 hover:bg-amber-700 text-white"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Loan Type
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

                    <Card className="dark:bg-black dark:border-gray-700">
                        <CardContent className="p-0">
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
                                    {loanTypes.map((item, index) => (
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
                                            {columnConfig
                                                .filter(col => visibleColumnKeys.includes(col.key))
                                                .map(column => (
                                                    <TableCell
                                                        key={column.key}
                                                        className="text-gray-900 dark:text-gray-200"
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
                                                        ) : column.key === "timestamp" ? (
                                                            new Date(
                                                                item.timestamp,
                                                            ).toLocaleDateString()
                                                        ) : (
                                                            item[column.key as keyof LoanTypeModel]
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
                                    {loanTypes.length === 0 && (
                                        <TableRow>
                                            <TableCell
                                                colSpan={columnConfig.length + 1}
                                                className="text-center py-8 text-gray-500 dark:text-gray-400"
                                            >
                                                No loan types found. Click "Add Loan Type" to create
                                                your first entry.
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
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto dark:bg-black dark:text-white">
                        <DialogHeader>
                            <DialogTitle>
                                {editingItem ? "Edit Loan Type" : "Add New Loan Type"}
                            </DialogTitle>
                        </DialogHeader>
                        <LoanTypeForm
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
                            <DialogTitle>Loan Type Details</DialogTitle>
                        </DialogHeader>
                        {viewingItem && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <div>
                                            <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                                Loan Name
                                            </Label>
                                            <p className="text-lg font-semibold text-gray-900 dark:text-white">
                                                {viewingItem.loanName}
                                            </p>
                                        </div>
                                        <div>
                                            <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                                Loan Interest Rate
                                            </Label>
                                            <p className="text-lg text-gray-900 dark:text-gray-200">
                                                {viewingItem.loanInterestRate}%
                                            </p>
                                        </div>
                                        <div>
                                            <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                                Market Interest Rate
                                            </Label>
                                            <p className="text-lg text-gray-900 dark:text-gray-200">
                                                {viewingItem.marketInterestRate}%
                                            </p>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
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
                                        <div>
                                            <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                                Created
                                            </Label>
                                            <p className="text-lg text-gray-900 dark:text-gray-200">
                                                {new Date(
                                                    viewingItem.timestamp,
                                                ).toLocaleDateString()}
                                            </p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                {new Date(
                                                    viewingItem.timestamp,
                                                ).toLocaleTimeString()}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex justify-end space-x-2 pt-4 border-t dark:border-gray-700">
                                    <Button
                                        variant="outline"
                                        onClick={() => setShowViewDialog(false)}
                                        className="dark:border-gray-600 dark:text-gray-300"
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
