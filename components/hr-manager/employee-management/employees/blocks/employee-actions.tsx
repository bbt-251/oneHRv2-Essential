"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    MoreHorizontal,
    Edit,
    Key,
    ClipboardList,
    DollarSign,
    Users,
    User,
    Trash2,
} from "lucide-react";
import type { EmployeeModel } from "@/lib/models/employee";
import { useTheme } from "@/components/theme-provider";

interface EmployeeActionsProps {
    employee: EmployeeModel;
    onEdit: (employee: EmployeeModel) => void;
    onViewProfile: (employee: EmployeeModel) => void;
    onChangePassword: (employee: EmployeeModel) => void;
    onViewEmployeeLog: (employee: EmployeeModel) => void;
    onViewCompensation: (employee: EmployeeModel) => void;
    onManageDependents: (employee: EmployeeModel) => void;
    onDelete: (employee: EmployeeModel) => void;
}

export function EmployeeActions({
    employee,
    onEdit,
    onViewProfile,
    onChangePassword,
    onViewEmployeeLog,
    onViewCompensation,
    onManageDependents,
    onDelete,
}: EmployeeActionsProps) {
    const { theme } = useTheme();
    const [open, setOpen] = useState<boolean>(false);

    const handleAction = (action: () => void) => {
        action();
        setOpen(false);
    };

    return (
        <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    className={`h-8 w-8 p-0 ${theme === "dark" ? "text-white border border-gray-700 hover:bg-gray-800" : "bg-primary-100"}`}
                >
                    <MoreHorizontal className={`h-4 w-4 ${theme === "dark" ? "text-white" : ""}`} />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                align="end"
                className={`w-56 ${theme === "dark" ? "bg-black text-white border-gray-800" : ""}`}
            >
                <DropdownMenuItem
                    onClick={() => handleAction(() => onEdit(employee))}
                    className={theme === "dark" ? "focus:bg-gray-800 focus:text-white" : ""}
                >
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                    onClick={() => handleAction(() => onViewProfile(employee))}
                    className={theme === "dark" ? "focus:bg-gray-800 focus:text-white" : ""}
                >
                    <User className="mr-2 h-4 w-4" />
                    Profile
                </DropdownMenuItem>
                <DropdownMenuItem
                    onClick={() => handleAction(() => onChangePassword(employee))}
                    className={theme === "dark" ? "focus:bg-gray-800 focus:text-white" : ""}
                >
                    <Key className="mr-2 h-4 w-4" />
                    Change Password
                </DropdownMenuItem>
                <DropdownMenuItem
                    onClick={() => handleAction(() => onViewEmployeeLog(employee))}
                    className={theme === "dark" ? "focus:bg-gray-800 focus:text-white" : ""}
                >
                    <ClipboardList className="mr-2 h-4 w-4" />
                    Employee Log
                </DropdownMenuItem>
                <DropdownMenuItem
                    onClick={() => handleAction(() => onViewCompensation(employee))}
                    className={theme === "dark" ? "focus:bg-gray-800 focus:text-white" : ""}
                >
                    <DollarSign className="mr-2 h-4 w-4" />
                    See Compensation & Benefits
                </DropdownMenuItem>
                <DropdownMenuItem
                    onClick={() => handleAction(() => onManageDependents(employee))}
                    className={theme === "dark" ? "focus:bg-gray-800 focus:text-white" : ""}
                >
                    <Users className="mr-2 h-4 w-4" />
                    Manage Dependents
                </DropdownMenuItem>
                <div
                    className={`border-t ${theme === "dark" ? "border-gray-700" : "border-gray-200"} my-1`}
                ></div>
                <DropdownMenuItem
                    onClick={() => handleAction(() => onDelete(employee))}
                    className={`text-red-600 focus:bg-red-50 focus:text-red-600 dark:text-red-400 dark:focus:bg-red-950`}
                >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Employee
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
