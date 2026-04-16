"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Bell } from "lucide-react";
import { DataToolbar, Density } from "../blocks/data-toolbar";
import { hrSettingsService, NotificationTypeModel } from "@/lib/backend/firebase/hrSettingsService";
import { useToast } from "@/context/toastContext";
import { useTheme } from "@/components/theme-provider";
import DeleteConfirm from "../blocks/delete-confirm";
import { AddNotificationType } from "../modals/add-notification-type";
import { useFirestore } from "@/context/firestore-context";
import { useAuth } from "@/context/authContext";
import { NOTIFICATION_TYPE_LOG_MESSAGES } from "@/lib/log-descriptions/notification-location";

export function NotificationTypeManagement() {
    const { hrSettings } = useFirestore();
    const { showToast } = useToast();
    const { theme } = useTheme();
    const { userData } = useAuth();
    const notificationTypes = hrSettings.notificationTypes;

    const [showAddModal, setShowAddModal] = useState<boolean>(false);
    const [editingNotification, setEditingNotification] = useState<NotificationTypeModel | null>(
        null,
    );

    const [density, setDensity] = useState<Density>("normal");
    const [visibleColumns, setVisibleColumns] = useState({
        notificationType: true,
        text: true,
        active: true,
    });
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [activeFilter, setActiveFilter] = useState<string>("");

    const activeOptions = ["Yes", "No"];

    const handleEdit = (notification: NotificationTypeModel) => {
        setEditingNotification(notification);
        setShowAddModal(true);
    };

    const handleDelete = async (id: string) => {
        try {
            await hrSettingsService.remove(
                "notificationTypes",
                id,
                userData?.uid ?? "",
                NOTIFICATION_TYPE_LOG_MESSAGES.DELETED(id),
            );
            showToast("Notification type deleted successfully", "success", "success");
        } catch (error) {
            console.error("Failed to delete notification type:", error);
            showToast("Failed to delete notification type", "error", "error");
        }
    };

    const filteredNotifications = useMemo(() => {
        return notificationTypes.filter(n => {
            const matchesSearch =
                n.notificationType.toLowerCase().includes(searchTerm.toLowerCase()) ||
                n.text.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesActive = !activeFilter || n.active === activeFilter;
            return matchesSearch && matchesActive;
        });
    }, [notificationTypes, searchTerm, activeFilter]);

    const cols = Object.entries(visibleColumns).map(([key, visible]) => ({
        key,
        visible,
        label:
            key === "notificationType"
                ? "Notification Type"
                : key.charAt(0).toUpperCase() + key.slice(1),
    }));
    const toggleCol = (key: string) =>
        setVisibleColumns(s => ({ ...s, [key]: !s[key as keyof typeof s] }));

    const activeFilters = (searchTerm ? 1 : 0) + (activeFilter ? 1 : 0);

    const exportNotifications = () => {
        const headers = cols
            .filter(c => c.visible)
            .map(c => c.label)
            .join(",");
        const rows = filteredNotifications
            .map(n =>
                cols
                    .filter(c => c.visible)
                    .map(c => {
                        const key = c.key as keyof NotificationTypeModel;
                        return key === "id" ? n.id : n[key];
                    })
                    .join(","),
            )
            .join("\n");
        const csv = `${headers}\n${rows}`;
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "notification-types.csv";
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleAdd = () => {
        setEditingNotification(null);
        setShowAddModal(true);
    };

    return (
        <div className="space-y-6">
            <Card
                className={`${theme === "dark" ? "bg-black" : "bg-white/80 backdrop-blur-sm"} shadow-2xl rounded-2xl overflow-hidden`}
            >
                <div
                    className={`${theme === "dark" ? "bg-black text-white" : "bg-amber-800 text-white"} p-6`}
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div
                                className={`${theme === "dark" ? "bg-white/20" : "bg-white/20"} p-3 rounded-xl backdrop-blur-sm`}
                            >
                                <Bell className="h-8 w-8 text-white" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-white">
                                    Notification Type Management
                                </h2>
                                <p className="text-amber-100 mt-1">
                                    Configure notification types and messages
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            {/* Add Modal */}

                            <Button
                                onClick={handleAdd}
                                className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-2 rounded-xl"
                            >
                                <Plus className="h-5 w-5 mr-2" />
                                Add Notification Type
                            </Button>

                            <AddNotificationType
                                showAddModal={showAddModal}
                                setShowAddModal={setShowAddModal}
                                editingNotification={editingNotification}
                                notificationTypes={notificationTypes}
                            />
                        </div>
                    </div>

                    {/* Toolbar */}
                    <div className="mt-6">
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-1">
                            <DataToolbar
                                columns={cols}
                                onToggleColumn={toggleCol}
                                density={density}
                                onDensityChange={setDensity}
                                onExport={exportNotifications}
                                filtersActiveCount={activeFilters}
                                filtersContent={
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <Label className="text-sm font-semibold text-slate-700">
                                                Search
                                            </Label>
                                            <Input
                                                placeholder="Search notification types..."
                                                value={searchTerm}
                                                onChange={e => setSearchTerm(e.target.value)}
                                                className="mt-2"
                                            />
                                        </div>
                                        <div>
                                            <Label className="text-sm font-semibold text-slate-700">
                                                Active Status
                                            </Label>
                                            <Select
                                                value={activeFilter}
                                                onValueChange={setActiveFilter}
                                            >
                                                <SelectTrigger className="mt-2">
                                                    <SelectValue placeholder="All statuses" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="all">
                                                        All statuses
                                                    </SelectItem>
                                                    {activeOptions.map(option => (
                                                        <SelectItem key={option} value={option}>
                                                            {option}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                }
                            />
                        </div>
                    </div>
                </div>

                {/* Table */}
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
                                    {visibleColumns.notificationType && (
                                        <TableHead
                                            className={`${theme === "dark" ? "text-white" : "text-yellow-100"} font-semibold text-sm py-4 px-6`}
                                        >
                                            Notification Type
                                        </TableHead>
                                    )}
                                    {visibleColumns.text && (
                                        <TableHead
                                            className={`${theme === "dark" ? "text-white" : "text-yellow-100"} font-semibold text-sm py-4 px-6`}
                                        >
                                            Text
                                        </TableHead>
                                    )}
                                    {visibleColumns.active && (
                                        <TableHead
                                            className={`${theme === "dark" ? "text-white" : "text-yellow-100"} font-semibold text-sm py-4 px-6`}
                                        >
                                            Active
                                        </TableHead>
                                    )}
                                    <TableHead
                                        className={`${theme === "dark" ? "text-white" : "text-yellow-100"} font-semibold text-sm py-4 px-6 text-right`}
                                    >
                                        Actions
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredNotifications.length > 0 ? (
                                    filteredNotifications.map((n, index) => (
                                        <TableRow
                                            key={n.id}
                                            className={`${
                                                index % 2 === 0
                                                    ? theme === "dark"
                                                        ? "bg-black"
                                                        : "bg-white"
                                                    : theme === "dark"
                                                        ? "bbg-black"
                                                        : ""
                                            } hover:bg-amber-50/50 transition-all duration-200 border-amber-100 cursor-pointer`}
                                        >
                                            {visibleColumns.notificationType && (
                                                <TableCell
                                                    className={`${theme === "dark" ? "text-white" : "text-slate-900"} px-6 font-semibold`}
                                                >
                                                    {n.notificationType}
                                                </TableCell>
                                            )}
                                            {visibleColumns.text && (
                                                <TableCell
                                                    className={`${theme === "dark" ? "text-white" : "text-slate-700"} px-6 max-w-md truncate`}
                                                >
                                                    {n.text}
                                                </TableCell>
                                            )}
                                            {visibleColumns.active && (
                                                <TableCell className="px-6">
                                                    <Badge
                                                        className={`rounded-lg px-3 py-1 ${
                                                            n.active === "Yes"
                                                                ? `${theme === "dark" ? "bg-green-100 text-green-800 border-green-200" : "bg-green-100 text-green-800 border-green-200"}`
                                                                : `${theme === "dark" ? "bg-gray-100 text-gray-800 border-gray-200" : "bg-gray-100 text-gray-800 border-gray-200"}`
                                                        }`}
                                                    >
                                                        {n.active}
                                                    </Badge>
                                                </TableCell>
                                            )}
                                            <TableCell className="px-6 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={e => {
                                                            e.stopPropagation();
                                                            handleEdit(n);
                                                        }}
                                                        className="h-9 w-9 p-0 hover:bg-amber-100 rounded-lg"
                                                    >
                                                        <Edit className="h-4 w-4 text-amber-600" />
                                                    </Button>
                                                    <DeleteConfirm
                                                        onConfirm={() => handleDelete(n.id!)}
                                                        itemName={`notification type (${n.notificationType})`}
                                                    />
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell
                                            colSpan={
                                                Object.values(visibleColumns).filter(Boolean)
                                                    .length + 1
                                            }
                                            className="text-center py-12"
                                        >
                                            <div className="flex flex-col items-center gap-4">
                                                <div
                                                    className={`${theme === "dark" ? "bg-black" : "bg-amber-100"} p-4 rounded-full`}
                                                >
                                                    <Bell className="h-10 w-10 text-slate-400" />
                                                </div>
                                                <div>
                                                    <p className="text-slate-500 text-lg font-medium">
                                                        No notification types found
                                                    </p>
                                                    <p className="text-slate-400 text-sm">
                                                        Try adjusting your search criteria
                                                    </p>
                                                </div>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
