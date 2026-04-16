"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Users, Search, Download, Eye, X } from "lucide-react";
import { EmployeeModel } from "@/lib/models/employee";
// Add these imports
import { useTheme } from "@/components/theme-provider";
import { cn } from "@/lib/utils";

interface DetailEmployeeModalProps {
    showEmployeesModal: boolean;
    setShowEmployeesModal: (show: boolean) => void;
    selectedName: string;
    selectedEmployees: EmployeeModel[];
}
export function DetailEmployeeModal({
    showEmployeesModal,
    setShowEmployeesModal,
    selectedName,
    selectedEmployees,
}: DetailEmployeeModalProps) {
    const { theme } = useTheme();

    // Employee modal state
    const [employeeSearchTerm, setEmployeeSearchTerm] = useState<string>("");
    const [employeeStatusFilter, setEmployeeStatusFilter] = useState<string>("all");
    const [employeeVisibleColumns, setEmployeeVisibleColumns] = useState({
        name: true,
        position: true,
        email: true,
        phone: true,
        joinDate: true,
        status: true,
    });

    const filteredEmployees = useMemo(() => {
        return selectedEmployees.filter(e => {
            const matchesSearch =
                e.firstName.toLowerCase().includes(employeeSearchTerm.toLowerCase()) ||
                e.positionLevel.toLowerCase().includes(employeeSearchTerm.toLowerCase()) ||
                e.personalEmail.toLowerCase().includes(employeeSearchTerm.toLowerCase());
            const matchesStatus =
                employeeStatusFilter === "all" ||
                (employeeStatusFilter === "active" && e.contractStatus === "Active") ||
                (employeeStatusFilter === "inactive" && e.contractStatus !== "Active");

            return matchesSearch && matchesStatus;
        });
    }, [selectedEmployees, employeeSearchTerm, employeeStatusFilter]);

    // Employee CSV export (modal)
    const exportEmployees = () => {
        const header = Object.keys(employeeVisibleColumns)
            .filter(k => employeeVisibleColumns[k as keyof typeof employeeVisibleColumns])
            .join(",");
        const rows = filteredEmployees
            .map(e =>
                Object.keys(employeeVisibleColumns)
                    .filter(k => employeeVisibleColumns[k as keyof typeof employeeVisibleColumns])
                    .map(k => (e as any)[k])
                    .join(","),
            )
            .join("\n");
        const csv = [header, rows].join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${selectedName}_employees.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <Dialog open={showEmployeesModal} onOpenChange={setShowEmployeesModal}>
            <DialogContent
                className={`max-w-6xl rounded-2xl shadow-2xl ${theme === "dark" ? "bg-black border border-gray-800" : "bg-white border-0"}`}
            >
                <DialogHeader className="pb-6">
                    <DialogTitle
                        className={`flex items-center gap-3 text-xl font-bold ${theme === "dark" ? "text-white" : "text-slate-900"}`}
                    >
                        <div
                            className={`p-2 rounded-xl ${theme === "dark" ? "bg-black" : "bg-amber-100"}`}
                        >
                            <Users
                                className={`h-6 w-6 ${theme === "dark" ? "text-white" : "text-amber-600"}`}
                            />
                        </div>
                        {selectedName} - Employees ({filteredEmployees.length})
                    </DialogTitle>
                </DialogHeader>

                {/* Employee Filters and Controls */}
                <div className="space-y-4 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                            <Input
                                placeholder="Search employees..."
                                value={employeeSearchTerm}
                                onChange={e => setEmployeeSearchTerm(e.target.value)}
                                className={`pl-10 rounded-lg focus:ring-amber-500 ${theme === "dark" ? "bg-black text-white border-gray-700 focus:border-white" : "border-slate-200 focus:border-amber-500"}`}
                            />
                        </div>
                        <Select
                            value={employeeStatusFilter}
                            onValueChange={setEmployeeStatusFilter}
                        >
                            <SelectTrigger
                                className={`rounded-lg border-slate-200 focus:border-amber-500 focus:ring-amber-500 ${theme === "dark" ? "bg-black text-white" : "bg-white text-slate-700"}`}
                            >
                                <SelectValue placeholder="Filter by status" />
                            </SelectTrigger>
                            <SelectContent
                                className={cn(
                                    theme === "dark"
                                        ? "bg-black border-gray-600"
                                        : "bg-amber-50/80 border-y border-amber-300",
                                    "w-40",
                                )}
                            >
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="inactive">Inactive</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button
                            onClick={exportEmployees}
                            className="bg-green-600 hover:bg-green-700 text-white rounded-lg"
                        >
                            <Download className="h-4 w-4 mr-2" />
                            Export CSV
                        </Button>
                    </div>

                    {/* Column Visibility Controls */}
                    <div
                        className={`flex flex-wrap gap-2 p-4 ${theme === "dark" ? "bg-black" : "bg-amber-50"}`}
                    >
                        <span className="text-sm font-semibold text-slate-700 mr-2">
                            Show columns:
                        </span>
                        {Object.entries(employeeVisibleColumns).map(([column, visible]) => (
                            <Button
                                key={column}
                                variant={visible ? "default" : "outline"}
                                size="sm"
                                onClick={() =>
                                    setEmployeeVisibleColumns({
                                        ...employeeVisibleColumns,
                                        [column]: !visible,
                                    })
                                }
                                className={`text-xs ${visible ? "bg-amber-600 text-white" : "bg-white text-slate-700 border-amber-300"}`}
                            >
                                {visible ? (
                                    <Eye className="h-3 w-3 mr-1" />
                                ) : (
                                    <X className="h-3 w-3 mr-1" />
                                )}
                                {column.charAt(0).toUpperCase() + column.slice(1)}
                            </Button>
                        ))}
                    </div>
                </div>

                {/* Employee Table */}
                <div className="max-h-96 overflow-y-auto">
                    {filteredEmployees.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow
                                    className={
                                        theme === "dark"
                                            ? "bg-black hover:bg-black border-b border-gray-800"
                                            : "bg-amber-100 hover:bg-amber-100"
                                    }
                                >
                                    {" "}
                                    {employeeVisibleColumns.name && (
                                        <TableHead
                                            className={`${theme === "dark" ? "text-white" : "text-amber-900"} font-semibold`}
                                        >
                                            Name
                                        </TableHead>
                                    )}
                                    {employeeVisibleColumns.position && (
                                        <TableHead
                                            className={`${theme === "dark" ? "text-white" : "text-amber-900"} font-semibold`}
                                        >
                                            Position
                                        </TableHead>
                                    )}
                                    {employeeVisibleColumns.email && (
                                        <TableHead
                                            className={`${theme === "dark" ? "text-white" : "text-amber-900"} font-semibold`}
                                        >
                                            Email
                                        </TableHead>
                                    )}
                                    {employeeVisibleColumns.phone && (
                                        <TableHead
                                            className={`${theme === "dark" ? "text-white" : "text-amber-900"} font-semibold`}
                                        >
                                            Phone
                                        </TableHead>
                                    )}
                                    {employeeVisibleColumns.joinDate && (
                                        <TableHead
                                            className={`${theme === "dark" ? "text-white" : "text-amber-900"} font-semibold`}
                                        >
                                            Join Date
                                        </TableHead>
                                    )}
                                    {employeeVisibleColumns.status && (
                                        <TableHead
                                            className={`${theme === "dark" ? "text-white" : "text-amber-900"} font-semibold`}
                                        >
                                            Status
                                        </TableHead>
                                    )}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredEmployees.map((employee, index) => (
                                    <TableRow
                                        key={employee.id}
                                        className={`${
                                            theme === "dark"
                                                ? `border-b border-gray-800 ${index % 2 === 0 ? "bg-black" : "bg-gray-900"} hover:bg-gray-800`
                                                : `${index % 2 === 0 ? "bg-white" : "bg-slate-50/50"} hover:bg-amber-50/50`
                                        } transition-all duration-200`}
                                    >
                                        {employeeVisibleColumns.name && (
                                            <TableCell
                                                className={`font-semibold ${theme === "dark" ? "text-white" : "text-slate-900"}`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 bg-amber-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                                                        {`${employee.firstName[0] || ""}${employee.surname[0] || ""}`}
                                                    </div>
                                                    {`${employee.firstName} ${employee.surname}`}
                                                </div>
                                            </TableCell>
                                        )}
                                        {employeeVisibleColumns.position && (
                                            <TableCell
                                                className={
                                                    theme === "dark"
                                                        ? "text-gray-300"
                                                        : "text-slate-700"
                                                }
                                            >
                                                {employee.employmentPosition}
                                            </TableCell>
                                        )}
                                        {employeeVisibleColumns.email && (
                                            <TableCell className="text-slate-600 text-sm">
                                                {employee.personalEmail}
                                            </TableCell>
                                        )}
                                        {employeeVisibleColumns.phone && (
                                            <TableCell className="text-slate-600 text-sm">
                                                {employee.personalPhoneNumber}
                                            </TableCell>
                                        )}
                                        {employeeVisibleColumns.joinDate && (
                                            <TableCell className="text-slate-600 text-sm">
                                                {new Date(employee.hireDate).toLocaleDateString()}
                                            </TableCell>
                                        )}
                                        {employeeVisibleColumns.status && (
                                            <TableCell>
                                                <Badge
                                                    className={`rounded-lg px-2 py-1 text-xs border ${
                                                        employee.contractStatus === "Active"
                                                            ? theme === "dark"
                                                                ? "bg-green-900 text-green-300 border-green-700"
                                                                : "bg-green-100 text-green-800 border-green-200"
                                                            : theme === "dark"
                                                                ? "bg-gray-800 text-gray-300 border-gray-600"
                                                                : "bg-gray-100 text-gray-800 border-gray-200"
                                                    }`}
                                                >
                                                    {employee.contractStatus}
                                                </Badge>
                                            </TableCell>
                                        )}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <div className="text-center py-12">
                            <div
                                className={`p-4 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center ${theme === "dark" ? "bg-gray-900" : "bg-amber-100"}`}
                            >
                                <Users
                                    className={`h-10 w-10 ${theme === "dark" ? "text-gray-600" : "text-slate-400"}`}
                                />
                            </div>
                            <p
                                className={`${theme === "dark" ? "text-gray-400" : "text-slate-500"} text-lg`}
                            >
                                No employees found
                            </p>
                            <p
                                className={`${theme === "dark" ? "text-gray-500" : "text-slate-400"} text-sm`}
                            >
                                Try adjusting your search criteria
                            </p>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
