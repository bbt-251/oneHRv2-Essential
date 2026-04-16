"use client";

import { useTheme } from "@/components/theme-provider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Database, FileText, Upload, Filter, X } from "lucide-react";
import React, { useState, useEffect } from "react";
import ImportPage from "./import/page";
import { useFirestore } from "@/context/firestore-context";

export default function DataIntegration() {
    const [activeTab, setActiveTab] = useState<string>("import");
    const [currentPage, setCurrentPage] = useState(1);
    const { theme } = useTheme();
    const { logs, activeEmployees } = useFirestore();

    // Filter states
    const [startDate, setStartDate] = useState<string>("");
    const [endDate, setEndDate] = useState<string>("");
    const [moduleFilter, setModuleFilter] = useState<string>("");
    const [titleFilter, setTitleFilter] = useState<string>("");
    const [statusFilter, setStatusFilter] = useState<string>("");
    const [actionByFilter, setActionByFilter] = useState<string>("");

    // Pagination constants
    const itemsPerPage = 10;
    const sortedLogs = logs.sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );

    // Filtering logic
    const filteredLogs = sortedLogs.filter(log => {
        const logDate = new Date(log.timestamp);
        const start = startDate ? new Date(startDate) : null;
        const end = endDate ? new Date(endDate) : null;

        if (start && logDate < start) return false;
        if (end && logDate > end) return false;
        if (moduleFilter && !log.module.toLowerCase().includes(moduleFilter.toLowerCase()))
            return false;
        if (titleFilter && !log.title.toLowerCase().includes(titleFilter.toLowerCase()))
            return false;
        if (statusFilter && log.status !== statusFilter) return false;
        if (actionByFilter && log.actionBy !== actionByFilter) return false;

        return true;
    });

    const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);

    // Get current page items
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentLogs = filteredLogs.slice(startIndex, endIndex);

    // Handle page change
    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    // Reset page when switching tabs or filters change
    React.useEffect(() => {
        setCurrentPage(1);
    }, [activeTab, startDate, endDate, moduleFilter, titleFilter, statusFilter, actionByFilter]);

    return (
        <div className="space-y-6">
            <div>
                <h1
                    className={`text-2xl font-bold ${theme === "dark" ? "text-white" : "text-gray-900"}`}
                >
                    Data Integration
                </h1>
                <p className={`mt-1 ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>
                    Manage data import and integration settings
                </p>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-8">
                    <TabsTrigger value="import" className="flex items-center gap-2">
                        <Database className="h-4 w-4" />
                        Import
                    </TabsTrigger>
                    <TabsTrigger value="hr-activity-log" className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        HR Activity Log
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="import" className="space-y-6">
                    <ImportPage />
                </TabsContent>

                <TabsContent value="hr-activity-log" className="space-y-6">
                    <Card
                        className={`${
                            theme === "dark"
                                ? "bg-black border-gray-700"
                                : "bg-white border-gray-200"
                        } shadow-sm`}
                    >
                        <CardHeader>
                            <CardTitle
                                className={`text-2xl font-semibold ${
                                    theme === "dark" ? "text-white" : "text-gray-900"
                                }`}
                            >
                                HR Activity Log
                            </CardTitle>
                            <CardDescription
                                className={`text-lg mt-2 ${
                                    theme === "dark" ? "text-gray-300" : "text-gray-600"
                                }`}
                            >
                                Track and monitor HR system activities and changes (
                                {filteredLogs.length} total entries)
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="mb-6 p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
                                <div className="flex items-center gap-2 mb-4">
                                    <Filter className="h-5 w-5" />
                                    <h3 className="text-lg font-medium">Filters</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">
                                            Start Date & Time
                                        </label>
                                        <Input
                                            type="datetime-local"
                                            value={startDate}
                                            onChange={e => setStartDate(e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">
                                            End Date & Time
                                        </label>
                                        <Input
                                            type="datetime-local"
                                            value={endDate}
                                            onChange={e => setEndDate(e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">
                                            Module
                                        </label>
                                        <Input
                                            placeholder="Filter by module"
                                            value={moduleFilter}
                                            onChange={e => setModuleFilter(e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">
                                            Title
                                        </label>
                                        <Input
                                            placeholder="Filter by title"
                                            value={titleFilter}
                                            onChange={e => setTitleFilter(e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">
                                            Status
                                        </label>
                                        <Select
                                            value={statusFilter}
                                            onValueChange={setStatusFilter}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select status" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Success">Success</SelectItem>
                                                <SelectItem value="Failed">Failed</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">
                                            Action By
                                        </label>
                                        <Select
                                            value={actionByFilter}
                                            onValueChange={setActionByFilter}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select employee" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {activeEmployees.map(emp => (
                                                    <SelectItem key={emp.uid} value={emp.uid}>
                                                        {emp.firstName} {emp.surname}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="mt-4">
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            setStartDate("");
                                            setEndDate("");
                                            setModuleFilter("");
                                            setTitleFilter("");
                                            setStatusFilter("");
                                            setActionByFilter("");
                                        }}
                                        className="flex items-center gap-2"
                                    >
                                        <X className="h-4 w-4" />
                                        Clear Filters
                                    </Button>
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-gray-200 dark:border-border">
                                            <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-muted-foreground">
                                                Timestamp
                                            </th>
                                            <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-muted-foreground">
                                                Module
                                            </th>
                                            <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-muted-foreground">
                                                Title
                                            </th>
                                            <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-muted-foreground">
                                                Description
                                            </th>
                                            <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-muted-foreground">
                                                Status
                                            </th>
                                            <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-muted-foreground">
                                                Action By
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {currentLogs.map(log => (
                                            <tr
                                                key={log.id}
                                                className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer dark:border-border dark:hover:bg-transparent dark:hover:border-gray-400"
                                            >
                                                <td className="py-4 px-4 text-gray-600 dark:text-muted-foreground">
                                                    {log.timestamp}
                                                </td>
                                                <td className="py-4 px-4 text-gray-900 dark:text-foreground">
                                                    {log.module}
                                                </td>
                                                <td className="py-4 px-4 text-gray-900 dark:text-foreground">
                                                    {log.title}
                                                </td>
                                                <td className="py-4 px-4 text-gray-600 dark:text-muted-foreground">
                                                    {log.description}
                                                </td>
                                                <td className="py-4 px-4">
                                                    <Badge
                                                        className={
                                                            log.status === "Success"
                                                                ? "bg-green-100 text-green-800"
                                                                : "bg-red-100 text-red-800"
                                                        }
                                                    >
                                                        {log.status}
                                                    </Badge>
                                                </td>
                                                <td className="py-4 px-4">
                                                    <div>
                                                        <div className="font-medium text-gray-900 dark:text-foreground">
                                                            {(() => {
                                                                const employee =
                                                                    activeEmployees.find(
                                                                        emp =>
                                                                            emp.uid ===
                                                                            log.actionBy,
                                                                    );
                                                                return employee
                                                                    ? `${employee.firstName} ${employee.surname}`
                                                                    : log.actionBy;
                                                            })()}
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="flex items-center justify-between mt-6">
                                    <div className="text-sm text-gray-600 dark:text-gray-400">
                                        Showing {startIndex + 1} to{" "}
                                        {Math.min(endIndex, filteredLogs.length)} of{" "}
                                        {filteredLogs.length} entries
                                    </div>
                                    <Pagination>
                                        <PaginationContent>
                                            <PaginationItem>
                                                <PaginationPrevious
                                                    onClick={() =>
                                                        handlePageChange(
                                                            Math.max(1, currentPage - 1),
                                                        )
                                                    }
                                                    className={
                                                        currentPage === 1
                                                            ? "pointer-events-none opacity-50"
                                                            : "cursor-pointer"
                                                    }
                                                />
                                            </PaginationItem>

                                            {/* Page numbers */}
                                            {Array.from({ length: totalPages }, (_, i) => i + 1)
                                                .filter(page => {
                                                    // Show first page, last page, current page, and pages around current
                                                    return (
                                                        page === 1 ||
                                                        page === totalPages ||
                                                        (page >= currentPage - 1 &&
                                                            page <= currentPage + 1)
                                                    );
                                                })
                                                .map((page, index, array) => {
                                                    // Add ellipsis if there's a gap
                                                    const prevPage = array[index - 1];
                                                    if (prevPage && page - prevPage > 1) {
                                                        return (
                                                            <React.Fragment
                                                                key={`ellipsis-${page}`}
                                                            >
                                                                <PaginationItem>
                                                                    <span className="px-3 py-2">
                                                                        ...
                                                                    </span>
                                                                </PaginationItem>
                                                                <PaginationItem>
                                                                    <PaginationLink
                                                                        onClick={() =>
                                                                            handlePageChange(page)
                                                                        }
                                                                        isActive={
                                                                            currentPage === page
                                                                        }
                                                                        className="cursor-pointer"
                                                                    >
                                                                        {page}
                                                                    </PaginationLink>
                                                                </PaginationItem>
                                                            </React.Fragment>
                                                        );
                                                    }
                                                    return (
                                                        <PaginationItem key={page}>
                                                            <PaginationLink
                                                                onClick={() =>
                                                                    handlePageChange(page)
                                                                }
                                                                isActive={currentPage === page}
                                                                className="cursor-pointer"
                                                            >
                                                                {page}
                                                            </PaginationLink>
                                                        </PaginationItem>
                                                    );
                                                })}

                                            <PaginationItem>
                                                <PaginationNext
                                                    onClick={() =>
                                                        handlePageChange(
                                                            Math.min(totalPages, currentPage + 1),
                                                        )
                                                    }
                                                    className={
                                                        currentPage === totalPages
                                                            ? "pointer-events-none opacity-50"
                                                            : "cursor-pointer"
                                                    }
                                                />
                                            </PaginationItem>
                                        </PaginationContent>
                                    </Pagination>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
