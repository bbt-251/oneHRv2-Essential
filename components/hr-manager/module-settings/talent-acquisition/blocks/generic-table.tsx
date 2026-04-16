"use client";

import type React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Edit, Trash2, Eye } from "lucide-react";
import { ColumnConfig, Density } from "../../../core-settings/blocks/data-toolbar";
import { useTheme } from "@/components/theme-provider";
import DeleteConfirm from "@/components/hr-manager/core-settings/blocks/delete-confirm";

export default function GenericTable<
    T extends { id: string; name: string; active: boolean; timestamp: string },
>({
    data,
    columns,
    onView,
    onEdit,
    onDelete,
    density,
}: {
    data: T[];
    columns: ColumnConfig[];
    onView: (item: T) => void;
    onEdit: (item: T) => void;
    onDelete: (id: string) => void;
    density: Density;
}) {
    const { theme } = useTheme();
    const visibleColumns = columns.filter(col => col.visible);

    return (
        <Card>
            <CardContent className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow
                            className={` ${theme === "dark" ? " bg-black" : "bg-amber-800 hover:bg-amber-800"}`}
                        >
                            {visibleColumns.map(column => (
                                <TableHead
                                    key={column.key}
                                    className="text-yellow-100 font-semibold"
                                >
                                    {column.label}
                                </TableHead>
                            ))}
                            <TableHead className="text-yellow-100 font-semibold">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.map((item, index) => (
                            <TableRow key={item.id} className="cursor-pointer ">
                                {visibleColumns.map(column => (
                                    <TableCell key={column.key}>
                                        {column.key === "active" ? (
                                            <Badge
                                                variant={item.active ? "default" : "secondary"}
                                                className={
                                                    item.active
                                                        ? "bg-green-100 text-green-800"
                                                        : "bg-gray-100 text-gray-800"
                                                }
                                            >
                                                {item.active ? "Active" : "Inactive"}
                                            </Badge>
                                        ) : column.key === "timestamp" ? (
                                            <span className="text-xs text-gray-500">
                                                {new Date(item.timestamp).toLocaleDateString()}
                                            </span>
                                        ) : (
                                            String((item as any)[column.key] || "-")
                                        )}
                                    </TableCell>
                                ))}
                                <TableCell>
                                    <div className="flex space-x-1">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => onView(item)}
                                            className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                            title="View Details"
                                        >
                                            <Eye className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => onEdit(item)}
                                            className="h-8 w-8 p-0 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                                            title="Edit"
                                        >
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <DeleteConfirm
                                            onConfirm={() => onDelete(item.id!)}
                                            itemName={`Leave type (${item.name})`}
                                        />
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                        {data.length === 0 && (
                            <TableRow>
                                <TableCell
                                    colSpan={visibleColumns.length + 1}
                                    className="text-center py-8 text-gray-500"
                                >
                                    No data found. Click "Add" to create your first entry.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
