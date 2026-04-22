"use client";

import type React from "react";

import { useState, useMemo } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Filter, Download, Eye, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTheme } from "@/components/theme-provider";
import { cn } from "@/lib/utils";

export interface ColumnDef {
    key: string;
    header: string;
    render?: (row: Record<string, unknown>) => React.ReactNode;
    align?: "left" | "center" | "right";
}

type TableRowData = Record<string, unknown>;

interface FilterModalProps {
    isOpen: boolean;
    onClose: () => void;
    data: TableRowData[];
    nonFilterableKeys: string[];
    onFilter: (filters: Record<string, string>) => void;
}

function FilterModal({ isOpen, onClose, data, nonFilterableKeys, onFilter }: FilterModalProps) {
    const [filters, setFilters] = useState<Record<string, string>>({});

    const fields = useMemo(() => {
        if (data.length === 0) return [];
        const sample = data[0];
        return Object.keys(sample).filter(
            key =>
                key !== "actions" &&
                (!nonFilterableKeys.length || !nonFilterableKeys.includes(key)),
        );
    }, [data, nonFilterableKeys]);

    const handleApplyFilters = () => {
        onFilter(filters);
        onClose();
    };

    const handleClearFilters = () => {
        setFilters({});
        onFilter({});
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl rounded-2xl">
                <DialogHeader>
                    <DialogTitle>Filter Data</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                    {fields.map(field => (
                        <div key={field} className="space-y-2">
                            <Label htmlFor={field} className="capitalize">
                                {field.replace(/([A-Z])/g, " $1").trim()}
                            </Label>
                            <Input
                                id={field}
                                placeholder={`Filter by ${field}`}
                                value={filters[field] || ""}
                                onChange={e =>
                                    setFilters(prev => ({ ...prev, [field]: e.target.value }))
                                }
                            />
                        </div>
                    ))}
                </div>
                <div className="flex justify-end gap-2 pt-4">
                    <Button variant="outline" onClick={handleClearFilters}>
                        Clear All
                    </Button>
                    <Button
                        onClick={handleApplyFilters}
                        className="bg-amber-600 hover:bg-amber-700 text-white"
                    >
                        Apply Filters
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

export interface ConfigTableProps {
    title: string;
    columns: ColumnDef[];
    data: TableRowData[];
    searchableKeys?: string[];
    nonFilterableKeys?: string[];
    onRowClick?: (row: TableRowData, index: number) => void;
    filterRenderer?: () => React.ReactNode;
    onAddClick?: () => void;
    addButtonText?: string;
}

// Update the ConfigTable component parameters
export function ConfigTable({
    title,
    columns,
    data,
    searchableKeys = [],
    nonFilterableKeys = [],
    onRowClick,
    filterRenderer,
    onAddClick,
    addButtonText = "Add New",
}: ConfigTableProps) {
    const { theme } = useTheme();
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>(
        columns.reduce((acc, col) => ({ ...acc, [col.key]: true }), {}),
    );
    const [showFilterModal, setShowFilterModal] = useState<boolean>(false);
    const [appliedFilters, setAppliedFilters] = useState<Record<string, string>>({});

    const filteredData = useMemo(() => {
        let filtered = data;

        // Apply search filter
        if (searchTerm && searchableKeys.length > 0) {
            filtered = filtered.filter(row =>
                searchableKeys.some(key =>
                    String(row[key] || "")
                        .toLowerCase()
                        .includes(searchTerm.toLowerCase()),
                ),
            );
        }

        // Apply column filters
        Object.entries(appliedFilters).forEach(([key, value]) => {
            if (value && value.trim()) {
                filtered = filtered.filter(row =>
                    String(row[key] || "")
                        .toLowerCase()
                        .includes(value.toLowerCase()),
                );
            }
        });

        return filtered;
    }, [data, searchTerm, searchableKeys, appliedFilters]);

    const visibleColumnDefs = columns.filter(col => visibleColumns[col.key]);

    const handleExport = () => {
        const csvContent = [
            visibleColumnDefs.map(col => col.header).join(","),
            ...filteredData.map(row =>
                visibleColumnDefs
                    .map(col => {
                        const value = row[col.key];
                        return typeof value === "string" ? `"${value}"` : value;
                    })
                    .join(","),
            ),
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${title.toLowerCase().replace(/\s+/g, "-")}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg rounded-2xl">
            <CardHeader
                className={`rounded-t-2xl ${theme === "dark" ? "bg-black border-slate-200" : "bg-amber-800 text-white"}`}
            >
                <div className="flex items-center justify-between">
                    <CardTitle
                        className={`text-xl font-bold ${theme === "dark" ? "text-white" : "text-primary-900"}`}
                    >
                        {title}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                        {filterRenderer && filterRenderer()}
                    </div>
                </div>

                {/* Toolbar */}
                <div
                    className={`flex items-center justify-between gap-4 pt-4 ${theme === "dark" ? "bg-black border-slate-200" : "bg-amber-800 text-white"}`}
                >
                    <div className="flex items-center gap-2 flex-1">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-amber-300" />
                            <Input
                                placeholder="Search..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="pl-10 bg-white/10 border-amber-600 text-white placeholder:text-amber-200"
                            />
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            onClick={onAddClick}
                            className={`rounded-xl ${theme === "dark" ? "bg-amber-600 hover:bg-amber-700 text-white" : "bg-amber-600 hover:bg-amber-700 text-white"}`}
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            {addButtonText}
                        </Button>

                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowFilterModal(true)}
                            className="text-white hover:bg-amber-700"
                        >
                            <Filter className="h-4 w-4 mr-1" />
                            All Filters
                        </Button>

                        <Select>
                            <SelectTrigger className="w-32 bg-white/10 border-amber-600 text-white">
                                <Eye className="h-4 w-4 mr-1" />
                                <SelectValue placeholder="Columns" />
                            </SelectTrigger>
                            <SelectContent>
                                {columns.map(col => (
                                    <div
                                        key={col.key}
                                        className="flex items-center space-x-2 px-2 py-1"
                                    >
                                        <Checkbox
                                            id={col.key}
                                            checked={visibleColumns[col.key]}
                                            onCheckedChange={checked =>
                                                setVisibleColumns(prev => ({
                                                    ...prev,
                                                    [col.key]: Boolean(checked),
                                                }))
                                            }
                                        />
                                        <Label htmlFor={col.key} className="text-sm">
                                            {col.header}
                                        </Label>
                                    </div>
                                ))}
                            </SelectContent>
                        </Select>

                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleExport}
                            className="text-white hover:bg-amber-700"
                        >
                            <Download className="h-4 w-4 mr-1" />
                            Export
                        </Button>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="p-0">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow
                                className={
                                    theme === "dark"
                                        ? "bg-black hover:bg-gray-800"
                                        : "bg-amber-800 hover:bg-amber-800"
                                }
                            >
                                {visibleColumnDefs.map(column => (
                                    <TableHead
                                        key={column.key}
                                        className={`${theme === "dark" ? "text-white" : "text-yellow-100"} font-semibold text-sm py-4 px-6 `}
                                    >
                                        {column.header}
                                    </TableHead>
                                ))}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredData.length === 0 ? (
                                <TableRow>
                                    <TableCell
                                        colSpan={visibleColumnDefs.length}
                                        className={`text-center py-8 ${theme === "dark" ? "text-white" : "text-gray-500"}`}
                                    >
                                        No data found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredData.map((row, index) => (
                                    <TableRow
                                        key={index}
                                        className={cn("transition-colors", {
                                            "cursor-pointer": onRowClick,
                                            "bg-white hover:bg-amber-100/50 dark:bg-black dark:hover:bg-slate-800/50":
                                                index % 2 === 0,
                                            "bg-amber-50 hover:bg-amber-100 dark:bg-slate-900 dark:hover:bg-slate-800":
                                                index % 2 !== 0,
                                        })}
                                        onClick={() => onRowClick?.(row, index)}
                                    >
                                        {visibleColumnDefs.map(column => (
                                            <TableCell
                                                key={column.key}
                                                className={cn(
                                                    {
                                                        "text-center": column.align === "center",
                                                        "text-right": column.align === "right",
                                                        "text-left": column.align === "left",
                                                    },
                                                    theme === "dark"
                                                        ? "text-white/70"
                                                        : "text-black/70",
                                                )}
                                            >
                                                {column.render
                                                    ? column.render(row)
                                                    : row[column.key]}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>

            <FilterModal
                isOpen={showFilterModal}
                onClose={() => setShowFilterModal(false)}
                data={data}
                nonFilterableKeys={nonFilterableKeys}
                onFilter={setAppliedFilters}
            />
        </Card>
    );
}

export default ConfigTable;
