"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Badge } from "@/components/ui/badge";
import { X, ClipboardList, Search } from "lucide-react";
import type { EmployeeModel } from "@/lib/models/employee";

interface EmployeeFieldChange {
    field: string;
    previousValue: string;
    newValue: string;
}

interface EmployeeLogEntry {
    id: string;
    employeeId: string;
    action: string;
    description: string;
    timestamp: string;
    performedBy: string;
    category: "login" | "profile" | "document" | "system";
    fieldChanges?: EmployeeFieldChange[];
}

interface EmployeeLogModalProps {
    employee: EmployeeModel;
    onClose: () => void;
}

export function EmployeeLogModal({ employee, onClose }: EmployeeLogModalProps) {
    const [logs] = useState<EmployeeLogEntry[]>([
        {
            id: "1",
            employeeId: employee.id,
            action: "Login",
            description: "User logged into the system",
            timestamp: "2024-01-20 09:15:23",
            performedBy: "System",
            category: "login",
        },
        {
            id: "2",
            employeeId: employee.id,
            action: "Profile Updated",
            description: "Personal information updated",
            timestamp: "2024-01-19 14:30:12",
            performedBy: "HR Admin",
            category: "profile",
            fieldChanges: [
                {
                    field: "Personal Phone Number",
                    previousValue: "+251912345677",
                    newValue: "+251912345678",
                },
                {
                    field: "Marital Status",
                    previousValue: "Single",
                    newValue: "Married",
                },
            ],
        },
        {
            id: "3",
            employeeId: employee.id,
            action: "Salary Updated",
            description: "Employee salary adjusted",
            timestamp: "2024-01-18 11:45:00",
            performedBy: "HR Manager",
            category: "profile",
            fieldChanges: [
                {
                    field: "Salary",
                    previousValue: "40000 ETB",
                    newValue: "45000 ETB",
                },
            ],
        },
        {
            id: "4",
            employeeId: employee.id,
            action: "Document Uploaded",
            description: "Medical certificate uploaded",
            timestamp: "2024-01-17 11:45:00",
            performedBy: employee.firstName + " " + employee.surname,
            category: "document",
        },
        {
            id: "5",
            employeeId: employee.id,
            action: "Password Changed",
            description: "User password was reset by administrator",
            timestamp: "2024-01-15 16:20:45",
            performedBy: "HR Admin",
            category: "system",
        },
    ]);

    const [searchTerm, setSearchTerm] = useState<string>("");
    const [categoryFilter, setCategoryFilter] = useState<string>("all");

    const filteredLogs = logs.filter(log => {
        const matchesSearch =
            searchTerm === "" ||
            log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.description.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesCategory = categoryFilter === "all" || log.category === categoryFilter;

        return matchesSearch && matchesCategory;
    });

    const getCategoryBadge = (category: string) => {
        const colors = {
            login: "bg-blue-100 text-blue-800",
            profile: "bg-green-100 text-green-800",
            document: "bg-purple-100 text-purple-800",
            system: "bg-orange-100 text-orange-800",
        };
        return (
            <Badge
                className={colors[category as keyof typeof colors] || "bg-gray-100 text-gray-800"}
            >
                {category}
            </Badge>
        );
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg w-full max-w-5xl max-h-[90vh] overflow-hidden shadow-xl">
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <div className="flex items-center gap-2">
                        <ClipboardList className="w-5 h-5 text-primary-600" />
                        <h2 className="text-xl font-semibold text-primary-900">
                            Employee Activity Log
                        </h2>
                    </div>
                    <Button variant="ghost" size="sm" onClick={onClose}>
                        <X className="w-4 h-4" />
                    </Button>
                </div>

                <div className="p-6">
                    <div className="bg-secondary-50 p-4 rounded-lg mb-6">
                        <p className="text-sm text-primary-800">
                            <strong>Employee:</strong> {employee.firstName} {employee.surname} (
                            {employee.employeeID})
                        </p>
                    </div>

                    <div className="flex gap-4 mb-6">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Search activities..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                            <SelectTrigger className="w-48">
                                <SelectValue placeholder="Filter by category" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Categories</SelectItem>
                                <SelectItem value="login">Login</SelectItem>
                                <SelectItem value="profile">Profile</SelectItem>
                                <SelectItem value="document">Document</SelectItem>
                                <SelectItem value="system">System</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-secondary-100">
                                    <TableHead>Timestamp</TableHead>
                                    <TableHead>Action</TableHead>
                                    <TableHead>Description</TableHead>
                                    <TableHead>Field Changes</TableHead>
                                    <TableHead>Category</TableHead>
                                    <TableHead>Performed By</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredLogs.map(log => (
                                    <TableRow key={log.id}>
                                        <TableCell className="font-mono text-sm">
                                            {log.timestamp}
                                        </TableCell>
                                        <TableCell className="font-medium">{log.action}</TableCell>
                                        <TableCell>{log.description}</TableCell>
                                        <TableCell>
                                            {log.fieldChanges ? (
                                                <div className="space-y-1">
                                                    {log.fieldChanges.map((change, index) => (
                                                        <div
                                                            key={index}
                                                            className="text-xs bg-gray-50 p-2 rounded border"
                                                        >
                                                            <div className="font-medium text-primary-800">
                                                                {change.field}
                                                            </div>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <span className="text-red-600 line-through">
                                                                    {change.previousValue}
                                                                </span>
                                                                <span className="text-gray-400">
                                                                    →
                                                                </span>
                                                                <span className="text-green-600 font-medium">
                                                                    {change.newValue}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <span className="text-gray-400">
                                                    No field changes
                                                </span>
                                            )}
                                        </TableCell>
                                        <TableCell>{getCategoryBadge(log.category)}</TableCell>
                                        <TableCell>{log.performedBy}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    {filteredLogs.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                            <ClipboardList className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p>No activity logs found matching your criteria.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
