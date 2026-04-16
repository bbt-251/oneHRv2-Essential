"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SearchableSelect, SearchableSelectItem } from "@/components/ui/searchable-select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/context/authContext";
import { useFirestore } from "@/context/firestore-context";
import { useToast } from "@/context/toastContext";
import { createManagerSwap } from "@/lib/backend/api/manager-swap/manager-swap-service";
import { MANAGER_SWAP_LOG_MESSAGES } from "@/lib/log-descriptions/manager-swap";
import { EmployeeModel } from "@/lib/models/employee";
import { ManagerSwapModel } from "@/lib/models/manager-swap";
import getFullName from "@/lib/util/getEmployeeFullName";
import { Eye, Loader2, Plus, Search, Users } from "lucide-react";
import { useState } from "react";

export function ManagerSwap() {
    const { employees, managerSwaps } = useFirestore();
    const { showToast } = useToast();
    const { userData } = useAuth();

    const [searchQuery, setSearchQuery] = useState("");
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [pendingSwapData, setPendingSwapData] = useState<Omit<ManagerSwapModel, "id"> | null>(
        null,
    );
    const [selectedSwap, setSelectedSwap] = useState<ManagerSwapModel | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form state for create/edit modal
    const [formData, setFormData] = useState({
        currentManager: "",
        replacingManager: "",
        effectiveDate: "",
        reason: "",
    });

    // Get manager names for display and search
    const getManagerName = (managerUid: string) => {
        const employee = employees.find(emp => emp.uid === managerUid);
        return employee ? getFullName(employee) : managerUid;
    };

    // Create manager items for searchable select
    const managerItems: SearchableSelectItem[] = employees
        .filter(emp => emp.role.includes("Manager"))
        .map(employee => ({
            id: employee.uid,
            label: `${getFullName(employee)}`,
        }));

    // Create replacing manager items (excluding current manager)
    const replacingManagerItems: SearchableSelectItem[] = employees
        .filter(emp => emp.role.includes("Manager") && formData.currentManager !== emp.uid)
        .map(employee => ({
            id: employee.uid,
            label: `${getFullName(employee)}`,
        }));

    // Filter swaps based on search
    const filteredSwaps = managerSwaps.filter(
        swap =>
            getManagerName(swap.currentManager).toLowerCase().includes(searchQuery.toLowerCase()) ||
            getManagerName(swap.replacingManager)
                .toLowerCase()
                .includes(searchQuery.toLowerCase()) ||
            swap.reason.toLowerCase().includes(searchQuery.toLowerCase()),
    );

    const handleView = (swap: ManagerSwapModel) => {
        setSelectedSwap(swap);
        setShowViewModal(true);
    };

    const handleSubmit = () => {
        if (
            !formData.currentManager ||
            !formData.replacingManager ||
            !formData.effectiveDate ||
            !formData.reason
        ) {
            showToast("Please fill in all required fields", "Validation Error", "error");
            return;
        }

        // Calculate affected employees
        const currentManager = employees.find(emp => emp.uid === formData.currentManager);
        const replacingManager = employees.find(emp => emp.uid === formData.replacingManager);
        const affectedEmployees = new Set([
            ...(currentManager?.reportees?.filter(Boolean) ?? []),
            ...(replacingManager?.reportees?.filter(Boolean) ?? []),
        ]).size;

        // Get the reportees being transferred
        const reporteesToTransfer = currentManager?.reportees?.filter(Boolean) ?? [];

        const swapData: Omit<ManagerSwapModel, "id"> = {
            timestamp: new Date().toISOString(),
            currentManager: formData.currentManager,
            replacingManager: formData.replacingManager,
            effectiveDate: formData.effectiveDate,
            reason: formData.reason,
            affectedEmployees: affectedEmployees,
            affectedEmployeeUIDs: reporteesToTransfer,
        };

        // Show confirmation modal instead of immediately creating
        setPendingSwapData(swapData);
        setShowConfirmModal(true);
    };

    const executeSwap = async () => {
        if (!pendingSwapData) return;

        setIsSubmitting(true);
        try {
            const currentManager = employees.find(
                emp => emp.uid === pendingSwapData.currentManager,
            );
            const replacingManager = employees.find(
                emp => emp.uid === pendingSwapData.replacingManager,
            );

            const result = await createManagerSwap(
                pendingSwapData,
                employees,
                userData?.uid ?? "",
                MANAGER_SWAP_LOG_MESSAGES.CREATED(
                    getFullName(
                        employees.find(e => e.uid === currentManager?.uid) ?? ({} as EmployeeModel),
                    ),
                    getFullName(
                        employees.find(e => e.uid === replacingManager?.uid) ??
                            ({} as EmployeeModel),
                    ),
                ),
            );

            if (result.success) {
                showToast("Manager swap completed successfully", "Success", "success");
                setShowConfirmModal(false);
                setShowCreateModal(false);
                setPendingSwapData(null);
                setFormData({
                    currentManager: "",
                    replacingManager: "",
                    effectiveDate: "",
                    reason: "",
                });
            } else {
                showToast(result.error || "Failed to create manager swap", "Error", "error");
            }
        } catch (error) {
            showToast("An unexpected error occurred", "Error", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-brand-800 dark:text-foreground">
                        Manager Swap
                    </h2>
                    <p className="text-brand-600 mt-1 dark:text-muted-foreground">
                        Transfer reportees from one manager to another
                    </p>
                </div>
                <Button
                    className="bg-brand-600 hover:bg-brand-700 text-white"
                    onClick={() => setShowCreateModal(true)}
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Swap Request
                </Button>
            </div>

            {/* Search Bar */}
            <div className="flex gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder="Search by manager name or reason..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="pl-10 border-gray-400 dark:border-gray-500"
                    />
                </div>
            </div>

            {/* Table */}
            <Card className="border-gray-200/60 dark:border-gray-800/60">
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Timestamp</TableHead>
                                <TableHead>Current Manager</TableHead>
                                <TableHead>New Manager</TableHead>
                                <TableHead>Effective Date</TableHead>
                                <TableHead>Affected Employees</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredSwaps.map(swap => (
                                <TableRow
                                    key={swap.id}
                                    onClick={() => handleView(swap)}
                                    className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50"
                                >
                                    <TableCell className="font-medium">
                                        {new Date(swap.timestamp).toLocaleString()}
                                    </TableCell>
                                    <TableCell>
                                        <div>
                                            <p className="font-medium text-gray-900 dark:text-foreground">
                                                {getManagerName(swap.currentManager)}
                                            </p>
                                            <p className="text-sm text-gray-500 dark:text-muted-foreground">
                                                {employees.find(
                                                    emp => emp.uid === swap.currentManager,
                                                )?.employeeID ?? ""}
                                            </p>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div>
                                            <p className="font-medium text-gray-900 dark:text-foreground">
                                                {getManagerName(swap.replacingManager)}
                                            </p>
                                            <p className="text-sm text-gray-500 dark:text-muted-foreground">
                                                {employees.find(
                                                    emp => emp.uid === swap.replacingManager,
                                                )?.employeeID ?? ""}
                                            </p>
                                        </div>
                                    </TableCell>
                                    <TableCell>{swap.effectiveDate}</TableCell>
                                    <TableCell>
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-2">
                                                <Users className="h-4 w-4 text-gray-400" />
                                                <span>{swap.affectedEmployees}</span>
                                            </div>
                                            {swap.affectedEmployeeUIDs &&
                                                swap.affectedEmployeeUIDs.length > 0 && (
                                                <div className="text-xs text-gray-500 dark:text-muted-foreground">
                                                    {swap.affectedEmployeeUIDs
                                                        .slice(0, 3)
                                                        .map((uid, idx) => (
                                                            <span key={uid}>
                                                                {idx > 0 && ", "}
                                                                {getManagerName(uid)}
                                                            </span>
                                                        ))}
                                                    {swap.affectedEmployeeUIDs.length > 3 &&
                                                            ` +${swap.affectedEmployeeUIDs.length - 3} more`}
                                                </div>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleView(swap)}
                                            className="hover:bg-gray-100 dark:hover:bg-gray-800"
                                        >
                                            <Eye className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* View Details Modal */}
            <Dialog open={showViewModal} onOpenChange={setShowViewModal}>
                <DialogContent className="max-w-2xl bg-white dark:bg-gray-900">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-semibold text-brand-800 dark:text-foreground">
                            Manager Swap Details
                        </DialogTitle>
                    </DialogHeader>
                    {selectedSwap && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-sm font-medium text-gray-500 dark:text-muted-foreground">
                                        Timestamp
                                    </Label>
                                    <p className="text-gray-900 dark:text-foreground">
                                        {selectedSwap.timestamp}
                                    </p>
                                </div>
                                <div>
                                    <Label className="text-sm font-medium text-gray-500 dark:text-muted-foreground">
                                        Effective Date
                                    </Label>
                                    <p className="text-gray-900 dark:text-foreground">
                                        {selectedSwap.effectiveDate}
                                    </p>
                                </div>
                            </div>
                            <div>
                                <Label className="text-sm font-medium text-gray-500 dark:text-muted-foreground">
                                    Current Manager
                                </Label>
                                <p className="text-gray-900 dark:text-foreground font-medium">
                                    {getManagerName(selectedSwap.currentManager)}
                                </p>
                                <p className="text-sm text-gray-500 dark:text-muted-foreground">
                                    {employees.find(emp => emp.uid === selectedSwap.currentManager)
                                        ?.employeeID ?? ""}
                                </p>
                            </div>
                            <div>
                                <Label className="text-sm font-medium text-gray-500 dark:text-muted-foreground">
                                    New Manager
                                </Label>
                                <p className="text-gray-900 dark:text-foreground font-medium">
                                    {getManagerName(selectedSwap.replacingManager)}
                                </p>
                                <p className="text-sm text-gray-500 dark:text-muted-foreground">
                                    {employees.find(
                                        emp => emp.uid === selectedSwap.replacingManager,
                                    )?.employeeID ?? ""}
                                </p>
                            </div>
                            <div>
                                <Label className="text-sm font-medium text-gray-500 dark:text-muted-foreground">
                                    Affected Employees ({selectedSwap.affectedEmployees})
                                </Label>
                                <div className="mt-2 space-y-2">
                                    {selectedSwap.affectedEmployeeUIDs &&
                                    selectedSwap.affectedEmployeeUIDs.length > 0 ? (
                                            <div className="bg-gray-50 dark:bg-gray-800 rounded-md p-3 max-h-40 overflow-y-auto">
                                                {selectedSwap.affectedEmployeeUIDs.map(uid => {
                                                    const employee = employees.find(
                                                        emp => emp.uid === uid,
                                                    );
                                                    return (
                                                        <div
                                                            key={uid}
                                                            className="flex items-center justify-between py-1 border-b border-gray-200 dark:border-gray-700 last:border-0"
                                                        >
                                                            <span className="text-gray-900 dark:text-foreground font-medium">
                                                                {employee ? getFullName(employee) : uid}
                                                            </span>
                                                            <span className="text-xs text-gray-500 dark:text-muted-foreground">
                                                                {employee?.employeeID || ""}
                                                            </span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <p className="text-gray-500 dark:text-muted-foreground">
                                            No affected employees recorded
                                            </p>
                                        )}
                                </div>
                            </div>
                            <div>
                                <Label className="text-sm font-medium text-gray-500 dark:text-muted-foreground">
                                    Reason
                                </Label>
                                <p className="text-gray-900 dark:text-foreground">
                                    {selectedSwap.reason}
                                </p>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowViewModal(false)}>
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Create Modal */}
            <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
                <DialogContent className="max-w-2xl bg-white dark:bg-gray-900">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-semibold text-brand-800 dark:text-foreground">
                            Create Manager Swap
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                                    Current Manager <span className="text-red-500">*</span>
                                </Label>
                                <SearchableSelect
                                    items={managerItems}
                                    selectedId={formData.currentManager}
                                    onChange={id =>
                                        setFormData({
                                            ...formData,
                                            currentManager: id,
                                            replacingManager: "",
                                        })
                                    }
                                    placeholder="Select current manager..."
                                    searchPlaceholder="Search managers..."
                                />
                            </div>

                            <div>
                                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                                    New Manager <span className="text-red-500">*</span>
                                </Label>
                                <SearchableSelect
                                    items={replacingManagerItems}
                                    selectedId={formData.replacingManager}
                                    onChange={id =>
                                        setFormData({ ...formData, replacingManager: id })
                                    }
                                    placeholder="Select replacing manager..."
                                    searchPlaceholder="Search managers..."
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                                    Effective Date <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    type="date"
                                    value={formData.effectiveDate}
                                    onChange={e =>
                                        setFormData({ ...formData, effectiveDate: e.target.value })
                                    }
                                    className="border-gray-400 dark:border-gray-500"
                                />
                            </div>
                        </div>

                        <div>
                            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                                Reason <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                value={formData.reason}
                                onChange={e => setFormData({ ...formData, reason: e.target.value })}
                                placeholder="Enter reason for manager swap"
                                className="border-gray-400 dark:border-gray-500"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            disabled={
                                isSubmitting ||
                                !formData.currentManager ||
                                !formData.replacingManager ||
                                !formData.effectiveDate ||
                                !formData.reason
                            }
                            className="bg-brand-600 hover:bg-brand-700 text-white disabled:opacity-50"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Processing...
                                </>
                            ) : (
                                "Create Swap"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Confirmation Modal for Swap */}
            <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
                <DialogContent className="max-w-md bg-white dark:bg-gray-900">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-semibold text-brand-800 dark:text-foreground">
                            Confirm Manager Swap
                        </DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <p className="text-gray-600 dark:text-gray-300 mb-4">
                            Are you sure you want to transfer{" "}
                            <strong>{pendingSwapData?.affectedEmployees || 0}</strong> employee(s)
                            from:
                        </p>
                        <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-md mb-2">
                            <p className="font-medium text-gray-900 dark:text-foreground">
                                {pendingSwapData && getManagerName(pendingSwapData.currentManager)}
                            </p>
                            <p className="text-sm text-gray-500">Current Manager</p>
                        </div>
                        <div className="flex justify-center my-2">
                            <span className="text-2xl">↓</span>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-md mb-4">
                            <p className="font-medium text-gray-900 dark:text-foreground">
                                {pendingSwapData &&
                                    getManagerName(pendingSwapData.replacingManager)}
                            </p>
                            <p className="text-sm text-gray-500">New Manager</p>
                        </div>
                        {pendingSwapData?.affectedEmployeeUIDs &&
                            pendingSwapData.affectedEmployeeUIDs.length > 0 && (
                            <div className="mt-4">
                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Affected Employees:
                                </p>
                                <div className="bg-gray-50 dark:bg-gray-800 rounded-md p-2 max-h-32 overflow-y-auto">
                                    {pendingSwapData.affectedEmployeeUIDs.map(uid => {
                                        const employee = employees.find(emp => emp.uid === uid);
                                        return (
                                            <div
                                                key={uid}
                                                className="py-1 text-sm border-b border-gray-200 dark:border-gray-700 last:border-0"
                                            >
                                                {employee ? getFullName(employee) : uid}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setShowConfirmModal(false)}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={executeSwap}
                            disabled={isSubmitting}
                            className="bg-brand-600 hover:bg-brand-700 text-white"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Processing...
                                </>
                            ) : (
                                "Confirm Transfer"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
