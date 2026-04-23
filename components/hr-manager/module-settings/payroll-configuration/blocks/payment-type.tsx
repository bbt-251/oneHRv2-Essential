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
import { PaymentTypeForm } from "./payment-type-component";
import { PaymentTypeModel } from "@/lib/models/hr-settings";
import { useToast } from "@/context/toastContext";
import { useConfirm } from "@/hooks/use-confirm-dialog";
import { ModuleSettingsRepository as settingsService } from "@/lib/repository/hr-settings";
import { useData } from "@/context/app-data-context";
import { PAYROLL_CONFIGURATION_LOG_MESSAGES } from "@/lib/log-descriptions/payroll-configuration";
import { useAuth } from "@/context/authContext";

export function PaymentType() {
    const { paymentTypes } = useData();
    const { showToast } = useToast();
    const { confirm, ConfirmDialog } = useConfirm();
    const { userData } = useAuth();
    const [isAddEditLoading, setIsAddEditLoading] = useState<boolean>(false);
    const [density, setDensity] = useState<Density>("normal");
    const [showDialog, setShowDialog] = useState<boolean>(false);
    const [showViewDialog, setShowViewDialog] = useState<boolean>(false);
    const [editingItem, setEditingItem] = useState<PaymentTypeModel | null>(null);
    const [viewingItem, setViewingItem] = useState<PaymentTypeModel | null>(null);

    const paymentTypeColumns: ColumnConfig[] = [
        { key: "paymentName", label: "Payment Name", visible: true },
        { key: "paymentType", label: "Payment Type", visible: true },
        {
            key: "taxabilityThresholdType",
            label: "Threshold Type",
            visible: true,
        },
        {
            key: "taxabilityThresholdAmount",
            label: "Threshold Amount",
            visible: true,
        },
        { key: "active", label: "Status", visible: true },
    ];

    const [columnConfig, setColumnConfig] = useState<ColumnConfig[]>(paymentTypeColumns);

    const handleAdd = () => {
        setEditingItem(null);
        setShowDialog(true);
    };

    const handleEdit = (item: PaymentTypeModel) => {
        setEditingItem(item);
        setShowDialog(true);
    };

    const handleView = (item: PaymentTypeModel) => {
        setViewingItem(item);
        setShowViewDialog(true);
    };

    const handleDelete = (item: PaymentTypeModel) => {
        confirm("Are you sure ?", async () => {
            const res = await settingsService.remove(
                "paymentTypes",
                item.id,
                userData?.uid,
                PAYROLL_CONFIGURATION_LOG_MESSAGES.PAYMENT_TYPE_DELETED(item.id),
            );
            if (res) {
                showToast("Payment type deleted successfully", "Success", "success");
            } else {
                showToast("Error deleting payment type", "Error", "error");
            }
        });
    };

    const handleSave = async (formData: PaymentTypeModel) => {
        setIsAddEditLoading(true);

        const { id: _id, ...data } = formData;
        if (editingItem) {
            const res = await settingsService.update(
                "paymentTypes",
                editingItem.id,
                data,
                userData?.uid,
                PAYROLL_CONFIGURATION_LOG_MESSAGES.PAYMENT_TYPE_UPDATED({
                    id: editingItem.id,
                    name: data.paymentName,
                    active: data.active,
                }),
            );
            if (res) {
                showToast("Payment type updated successfully", "Success", "success");
                setShowDialog(false);
                setEditingItem(null);
            } else {
                showToast("Error updating payment type", "Error", "error");
            }
        } else {
            const res = await settingsService.create(
                "paymentTypes",
                data,
                userData?.uid,
                PAYROLL_CONFIGURATION_LOG_MESSAGES.PAYMENT_TYPE_CREATED({
                    name: data.paymentName,
                    active: data.active,
                }),
            );
            if (res) {
                showToast("Payment type created successfully", "Success", "success");
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
            ...paymentTypes.map(item =>
                columnConfig
                    .filter(col => col.visible)
                    .map(col => {
                        if (col.key === "active") {
                            return item.active ? "Active" : "Inactive";
                        }
                        return item[col.key as keyof PaymentTypeModel];
                    })
                    .join(","),
            ),
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "payment-types.csv";
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
                <Label>Payment Type</Label>
                <Select>
                    <SelectTrigger>
                        <SelectValue placeholder="All types" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Fixed">Fixed</SelectItem>
                        <SelectItem value="Variable">Variable</SelectItem>
                        <SelectItem value="Bonus">Bonus</SelectItem>
                        <SelectItem value="Allowance">Allowance</SelectItem>
                    </SelectContent>
                </Select>
            </div>
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
                    Payment Type Configuration
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 dark:bg-black">
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                Payment Types
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Manage payment type configurations
                            </p>
                        </div>
                        <Button
                            onClick={handleAdd}
                            className="bg-amber-600 hover:bg-amber-700 text-white"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Payment Type
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
                                    {paymentTypes.map((item, index) => (
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
                                                        ) : column.key ===
                                                          "taxabilityThresholdAmount" ? (
                                                                item.taxabilityThresholdType ===
                                                            "N/A" ? (
                                                                        "-"
                                                                    ) : (
                                                                        `${item.taxabilityThresholdAmount}${
                                                                            item.taxabilityThresholdType ===
                                                                    "Percentage"
                                                                                ? "%"
                                                                                : ""
                                                                        }`
                                                                    )
                                                            ) : (
                                                                item[
                                                                column.key as keyof PaymentTypeModel
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
                                    {paymentTypes.length === 0 && (
                                        <TableRow>
                                            <TableCell
                                                colSpan={columnConfig.length + 1}
                                                className="text-center py-8 text-gray-500 dark:text-gray-400"
                                            >
                                                No payment types found. Click &quot;Add Payment
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
                                {editingItem ? "Edit Payment Type" : "Add New Payment Type"}
                            </DialogTitle>
                        </DialogHeader>
                        <PaymentTypeForm
                            data={editingItem || undefined}
                            onSave={handleSave}
                            isAddEditLoading={isAddEditLoading}
                            onCancel={() => setShowDialog(false)}
                        />
                    </DialogContent>
                </Dialog>

                {/* View Dialog */}
                <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
                    <DialogContent className="max-w-2xl dark:bg-black">
                        <DialogHeader>
                            <DialogTitle className="dark:text-white">
                                Payment Type Details
                            </DialogTitle>
                        </DialogHeader>
                        {viewingItem && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <div>
                                            <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                                Payment Name
                                            </Label>
                                            <p className="text-lg dark:text-white">
                                                {viewingItem.paymentName}
                                            </p>
                                        </div>
                                        <div>
                                            <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                                Payment Type
                                            </Label>
                                            <p className="text-lg dark:text-white">
                                                {viewingItem.paymentType}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <div>
                                            <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                                Threshold Type
                                            </Label>
                                            <p className="text-lg dark:text-white">
                                                {viewingItem.taxabilityThresholdType}
                                            </p>
                                        </div>
                                        <div>
                                            <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                                Threshold Amount
                                            </Label>
                                            <p className="text-lg dark:text-white">
                                                {viewingItem.taxabilityThresholdType === "N/A"
                                                    ? "-"
                                                    : viewingItem.taxabilityThresholdAmount}
                                                {viewingItem.taxabilityThresholdType ===
                                                "Percentage"
                                                    ? "%"
                                                    : ""}
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
