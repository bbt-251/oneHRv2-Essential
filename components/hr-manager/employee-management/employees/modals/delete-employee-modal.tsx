"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Trash2, AlertTriangle, Shield, User, Mail, Phone } from "lucide-react";
import type { EmployeeModel } from "@/lib/models/employee";
import { useTheme } from "@/components/theme-provider";
import { useToast } from "@/context/toastContext";
import getEmployeeFullName from "@/lib/util/getEmployeeFullName";
import { cascadeDeleteEmployeeWithBackend } from "@/lib/backend/client/employee-client";

interface DeleteEmployeeModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    employee: EmployeeModel | null;
}

export function DeleteEmployeeModal({ open, onOpenChange, employee }: DeleteEmployeeModalProps) {
    const { theme } = useTheme();
    const { showToast } = useToast();
    const [isDeleting, setIsDeleting] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const handleConfirmDelete = async () => {
        if (!employee) return;

        setIsDeleting(true);
        setError(null);

        try {
            const result = await cascadeDeleteEmployeeWithBackend(employee.uid);

            if (result.success) {
                showToast(`Employee ${employeeName} deleted successfully`, "success", "success");
                onOpenChange(false);
            } else {
                const message = result.errors[0] || "Failed to delete employee";
                setError(message);
                showToast(message, "error", "error");
            }
        } catch {
            showToast("An error occurred while deleting the employee", "error", "error");
        } finally {
            setIsDeleting(false);
        }
    };

    if (!employee) return null;

    const employeeName = getEmployeeFullName(employee);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className={`max-w-md ${theme === "dark" ? "bg-black text-white border-gray-800" : "bg-white"}`}
            >
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-red-600">
                        <Trash2 className="h-5 w-5" />
                        Delete Employee
                    </DialogTitle>
                    <DialogDescription
                        className={theme === "dark" ? "text-gray-300" : "text-gray-600"}
                    >
                        This action cannot be undone. All employee data will be permanently deleted.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Employee Information */}
                    <div
                        className={`p-4 rounded-lg border ${theme === "dark" ? "bg-gray-900 border-gray-700" : "bg-gray-50 border-gray-200"}`}
                    >
                        <div className="flex items-center gap-3 mb-3">
                            <div
                                className={`p-2 rounded-full ${theme === "dark" ? "bg-gray-800" : "bg-gray-200"}`}
                            >
                                <User
                                    className={`h-4 w-4 ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}
                                />
                            </div>
                            <div>
                                <h4 className="font-semibold">{employeeName}</h4>
                                <p
                                    className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}
                                >
                                    ID: {employee.employeeID}
                                </p>
                            </div>
                        </div>

                        <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2">
                                <Mail
                                    className={`h-4 w-4 ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}
                                />
                                <span
                                    className={theme === "dark" ? "text-gray-300" : "text-gray-700"}
                                >
                                    {employee.companyEmail || employee.personalEmail}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Phone
                                    className={`h-4 w-4 ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}
                                />
                                <span
                                    className={theme === "dark" ? "text-gray-300" : "text-gray-700"}
                                >
                                    {employee.personalPhoneNumber}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Badge
                                    variant={
                                        employee.contractStatus === "active"
                                            ? "default"
                                            : "secondary"
                                    }
                                >
                                    {employee.contractStatus}
                                </Badge>
                                <Badge variant="outline">{employee.employmentPosition}</Badge>
                            </div>
                        </div>
                    </div>

                    {/* Warning Alerts */}
                    <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                        <AlertDescription className="text-red-800 dark:text-red-200">
                            <strong>Warning:</strong> This will permanently delete:
                        </AlertDescription>
                    </Alert>

                    <div
                        className={`space-y-1 text-sm ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}
                    >
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                            <span>Employee profile and personal information</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                            <span>Employment contract and position details</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                            <span>Attendance and time records</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                            <span>Compensation and benefits data</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                            <span>Documents and files</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                            <span>Dependents and related records</span>
                        </div>
                    </div>

                    {/* Authorization Notice */}
                    <Alert className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
                        <Shield className="h-4 w-4 text-blue-600" />
                        <AlertDescription className="text-blue-800 dark:text-blue-200">
                            Only HR Managers can perform this action. This deletion will be logged
                            for audit purposes.
                        </AlertDescription>
                    </Alert>

                    {/* Error Display */}
                    {error && (
                        <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
                            <AlertTriangle className="h-4 w-4 text-red-600" />
                            <AlertDescription className="text-red-800 dark:text-red-200">
                                {error}
                            </AlertDescription>
                        </Alert>
                    )}
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isDeleting}
                        className={theme === "dark" ? "border-gray-600 hover:bg-gray-800" : ""}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleConfirmDelete}
                        disabled={isDeleting}
                        className="bg-red-600 hover:bg-red-700"
                    >
                        {isDeleting ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                Deleting...
                            </>
                        ) : (
                            <>
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete Employee
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
