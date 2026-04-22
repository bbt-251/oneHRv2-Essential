"use client";

import type React from "react";

import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
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
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, MapPin, ChevronRight, ChevronDown, GripVertical } from "lucide-react";
import { DataToolbar, Density } from "../blocks/data-toolbar";
import {
    hrSettingsService,
    HrSettingsType,
    LocationModel,
} from "@/lib/backend/hr-settings-service";
import { useData } from "@/context/app-data-context";
import { AddLocation } from "../modals/add-location";
import { useToast } from "@/context/toastContext";
import { useTheme } from "@/components/theme-provider";
import dayjs from "dayjs";
import { dateFormat } from "@/lib/util/dayjs_format";
import { useAuth } from "@/context/authContext";
import { LOCATION_LOG_MESSAGES } from "@/lib/log-descriptions/notification-location";

interface LocationNode extends LocationModel {
    parentId?: string | null;
    children: LocationNode[];
    description?: string;
    address?: string;
}
export function LocationManagement() {
    const { theme } = useTheme();

    const { showToast } = useToast();
    const { ...hrSettings } = useData();
    const { userData } = useAuth();
    const rawLocations = hrSettings.locations;
    const [showAddModal, setShowAddModal] = useState<boolean>(false);
    const [editingLocation, setEditingLocation] = useState<LocationNode | null>(null);
    const [selectedParent, setSelectedParent] = useState<LocationNode | null>(null);
    const [draggedItem, setDraggedItem] = useState<LocationNode | null>(null);
    const [expandedLocationIds, setExpandedLocationIds] = useState<string[]>([]);

    const locations = useMemo(() => {
        const itemMap: Record<string, LocationNode> = {};
        const roots: LocationNode[] = [];

        for (const item of rawLocations) {
            itemMap[item.id] = { ...item, children: [] };
        }

        for (const item of rawLocations) {
            const node = itemMap[item.id];
            if (node.parentId && itemMap[node.parentId]) {
                itemMap[node.parentId].children.push(node);
            } else {
                roots.push(node);
            }
        }

        return roots;
    }, [rawLocations]);

    const getAllDescendantIds = (node: LocationNode): string[] => {
        let ids: string[] = [];
        const traverse = (currentNode: LocationNode) => {
            for (const child of currentNode.children) {
                ids.push(child.id);
                traverse(child);
            }
        };
        traverse(node);
        return ids;
    };

    const [density, setDensity] = useState<Density>("normal");
    const [visibleColumns, setVisibleColumns] = useState<{
        name: boolean;
        type: boolean;
        startDate: boolean;
        endDate: boolean;
        active: boolean;
        address: boolean;
        description: boolean;
    }>({
        name: true,
        type: true,
        startDate: true,
        endDate: true,
        active: true,
        address: true,
        description: true,
    });
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [filterType, setFilterType] = useState<string>("all");

    const [locationTypesState] = useState<{ value: string; label: string }[]>([
        { value: "country", label: "Country" },
        { value: "region", label: "Region/State" },
        { value: "city", label: "City" },
        { value: "office", label: "Office/Facility" },
        { value: "department", label: "Department" },
        { value: "building", label: "Building" },
        { value: "floor", label: "Floor" },
    ]);

    const addNewLocation = () => {
        setEditingLocation(null);
        setShowAddModal(true);
    };

    const handleAdd = (parent?: LocationNode) => {
        setEditingLocation(null);
        setSelectedParent(parent || null);
        setShowAddModal(true);
    };

    const handleEdit = (location: LocationNode) => {
        setEditingLocation(location);
        setSelectedParent(null);
        setShowAddModal(true);
    };

    const findLocationById = (nodes: LocationNode[], id: string): LocationNode | null => {
        for (const node of nodes) {
            if (node.id === id) return node;
            const found = findLocationById(node.children, id);
            if (found) return found;
        }
        return null;
    };

    const handleDelete = async (type: HrSettingsType, id: string) => {
        const nodeToDelete = findLocationById(locations, id);

        if (!nodeToDelete) {
            console.error("Could not find the location to delete in the component's state.");
            showToast("Error: Location not found.", "error", "error");
            return;
        }

        const descendantIds = getAllDescendantIds(nodeToDelete);
        const hasChildren = descendantIds.length > 0;

        let confirmMessage =
            "Are you sure you want to delete this location? This action cannot be undone.";
        if (hasChildren) {
            confirmMessage = `This location has ${descendantIds.length} sub-locations. Deleting it is irreversible and will remove ALL of them. Are you sure you want to proceed?`;
        }

        if (window.confirm(confirmMessage)) {
            try {
                const allIdsToDelete = [id, ...descendantIds];

                await Promise.all(
                    allIdsToDelete.map(deleteId => hrSettingsService.remove(type, deleteId)),
                );

                showToast(
                    hasChildren
                        ? `Successfully deleted location and its ${descendantIds.length} sub-locations.`
                        : "Location deleted successfully.",
                    "success",
                    "success",
                );
            } catch (error) {
                console.error("Error during cascading delete:", error);
                showToast("An error occurred while deleting the location(s).", "error", "error");
            }
        }
    };

    const flattenLocations = (nodes: LocationNode[]): LocationNode[] => {
        const result: LocationNode[] = [];
        const walk = (arr: LocationNode[]) => {
            for (const n of arr) {
                result.push(n);
                walk(n.children);
            }
        };
        walk(nodes);
        return result;
    };

    const filteredLocations = useMemo(() => {
        const all = flattenLocations(locations);
        return all.filter(l => {
            const matchesSearch = l.name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesType = filterType === "all" || l.type === filterType;
            return matchesSearch && matchesType;
        });
    }, [locations, searchTerm, filterType]);

    const cols = Object.entries(visibleColumns).map(([key, visible]) => ({
        key,
        visible,
        label:
            key === "startDate"
                ? "Start Date"
                : key === "endDate"
                    ? "End Date"
                    : key.charAt(0).toUpperCase() + key.slice(1),
    }));
    const toggleCol = (key: string) =>
        setVisibleColumns(s => ({ ...s, [key]: !s[key as keyof typeof s] }));

    const activeFilters = (searchTerm ? 1 : 0) + (filterType !== "all" ? 1 : 0);

    const exportLocations = () => {
        const headers = cols
            .filter(c => c.visible)
            .map(c => c.label)
            .join(",");
        const rows = filteredLocations
            .map(l =>
                cols
                    .filter(c => c.visible)
                    .map(c => {
                        if (c.key === "type")
                            return (
                                locationTypesState.find(t => t.value === l.type)?.label ?? l.type
                            );
                        return String(
                            l[
                                c.key as keyof Pick<
                                    LocationNode,
                                    | "name"
                                    | "type"
                                    | "startDate"
                                    | "endDate"
                                    | "active"
                                    | "address"
                                    | "description"
                                >
                            ] ?? "",
                        );
                    })
                    .join(","),
            )
            .join("\n");
        const csv = [headers, rows].join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "locations.csv";
        a.click();
        URL.revokeObjectURL(url);
    };

    const typeColor = (type: string) =>
        (
            ({
                country: "bg-purple-100 text-purple-800 border-purple-200",
                region: "bg-blue-100 text-blue-800 border-blue-200",
                city: "bg-green-100 text-green-800 border-green-200",
                office: "bg-yellow-100 text-yellow-800 border-yellow-200",
                department: "bg-orange-100 text-orange-800 border-orange-200",
                building: "bg-red-100 text-red-800 border-red-200",
                floor: "bg-amber-100 text-amber-800 border-amber-200",
            }) as Record<string, string>
        )[type] || "bg-gray-100 text-gray-800 border-gray-200";

    const handleDragStart = (e: React.DragEvent, location: LocationNode) => {
        setDraggedItem(location);
        e.dataTransfer.effectAllowed = "move";
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
    };

    const handleDrop = async (e: React.DragEvent, targetLocation: LocationNode) => {
        e.preventDefault();
        if (!draggedItem || draggedItem.id === targetLocation.id) return;
        await hrSettingsService.update(
            "locations",
            draggedItem.id,
            {
                parentId: targetLocation.id,
            },
            userData?.uid ?? "",
            LOCATION_LOG_MESSAGES.MOVED({
                id: draggedItem.id,
                parentId: targetLocation.id,
            }),
        );
        setDraggedItem(null);
    };

    const renderLocationTree = (nodes: LocationNode[], level = 0) =>
        nodes.map(l => (
            <div key={l.id} className="space-y-2">
                <div
                    className={`flex items-center gap-3 p-3 rounded-lg ${theme === "dark" ? "hover:bg-black" : "hover:bg-amber-50/50"} transition-all cursor-move`}
                    style={{ marginLeft: `${level * 24}px` }}
                    draggable
                    onDragStart={e => handleDragStart(e, l)}
                    onDragOver={handleDragOver}
                    onDrop={e => handleDrop(e, l)}
                >
                    <GripVertical
                        className={`h-4 w-4 ${theme === "dark" ? "text-gray-500" : "text-gray-400"}`}
                    />

                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                            setExpandedLocationIds(current =>
                                current.includes(l.id)
                                    ? current.filter(id => id !== l.id)
                                    : [...current, l.id],
                            )
                        }
                        className={`h-6 w-6 p-0 ${theme === "dark" ? "hover:bg-slate-700" : "hover:bg-amber-100"}`}
                        disabled={l.children.length === 0}
                    >
                        {l.children.length > 0 ? (
                            expandedLocationIds.includes(l.id) ? (
                                <ChevronDown className="h-4 w-4" />
                            ) : (
                                <ChevronRight className="h-4 w-4" />
                            )
                        ) : (
                            <div className="h-4 w-4" />
                        )}
                    </Button>

                    <div className="flex-1 flex items-center gap-3 flex-wrap">
                        {visibleColumns.name && (
                            <div
                                className={`font-semibold ${theme === "dark" ? "text-white" : "text-slate-900"}`}
                            >
                                {l.name}
                            </div>
                        )}
                        {visibleColumns.type && (
                            <Badge className={`text-xs ${typeColor(l.type)}`}>
                                {locationTypesState.find(t => t.value === l.type)?.label}
                            </Badge>
                        )}
                        {visibleColumns.startDate && (
                            <div
                                className={`text-xs ${theme === "dark" ? "text-slate-400" : "text-slate-600"}`}
                            >
                                Start: {new Date(l.startDate).toLocaleDateString()}
                            </div>
                        )}
                        {visibleColumns.endDate && (
                            <div
                                className={`text-xs ${theme === "dark" ? "text-slate-400" : "text-slate-600"}`}
                            >
                                End: {new Date(l.endDate).toLocaleDateString()}
                            </div>
                        )}
                        {visibleColumns.active && (
                            <Badge
                                className={
                                    l.active === "Yes"
                                        ? "bg-green-100 text-green-800"
                                        : "bg-red-100 text-red-800"
                                }
                            >
                                {l.active}
                            </Badge>
                        )}
                        {visibleColumns.address && l.address && (
                            <div
                                className={`text-sm truncate max-w-[200px] ${theme === "dark" ? "text-slate-400" : "text-slate-600"}`}
                                title={l.address}
                            >
                                {l.address}
                            </div>
                        )}
                        {visibleColumns.description && l.description && (
                            <div
                                className={`text-sm truncate max-w-[200px] ${theme === "dark" ? "text-slate-400" : "text-slate-600"}`}
                                title={l.description}
                            >
                                {l.description}
                            </div>
                        )}
                    </div>

                    <div className="flex-shrink-0 flex gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleAdd(l)}
                            className={`h-8 w-8 p-0 ${theme === "dark" ? "hover:bg-green-900/50" : "hover:bg-green-100"}`}
                        >
                            <Plus className="h-4 w-4 text-green-600" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(l)}
                            className={`h-8 w-8 p-0 ${theme === "dark" ? "hover:bg-amber-900/50" : "hover:bg-amber-100"}`}
                        >
                            <Edit className="h-4 w-4 text-amber-600" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete("locations", l.id!)}
                            className={`h-8 w-8 p-0 ${theme === "dark" ? "hover:bg-red-900/50" : "hover:bg-red-100"}`}
                        >
                            <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                    </div>
                </div>

                {expandedLocationIds.includes(l.id) &&
                    l.children.length > 0 &&
                    renderLocationTree(l.children, level + 1)}
            </div>
        ));
    return (
        <div className={`min-h-screen  p-6 ${theme === "dark" ? "bg-black" : "bg-amber-50/30"}`}>
            <div className="max-w-7xl mx-auto space-y-8">
                <Card
                    className={`${theme === "dark" ? "bg-black " : "bg-white/80 backdrop-blur-sm "} shadow-2xl rounded-2xl overflow-hidden`}
                >
                    <div
                        className={`${theme === "dark" ? "bg-black text-white" : "bg-amber-800 text-white"} p-6`}
                    >
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <div
                                        className={`p-3 rounded-xl ${theme === "dark" ? "bg-white/20" : "bg-white/20"}`}
                                    >
                                        <MapPin className="h-8 w-8" />
                                    </div>
                                    <div>
                                        <div className="text-2xl font-bold">Location Hierarchy</div>
                                        <div className="text-yellow-200 text-sm font-normal">
                                            {filteredLocations.length} locations found • Drag & drop
                                            to reorganize
                                        </div>
                                    </div>
                                </div>

                                <Button
                                    onClick={addNewLocation}
                                    className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-2 rounded-xl"
                                >
                                    <Plus className="h-5 w-5 mr-2" />
                                    Add Location
                                </Button>

                                <AddLocation
                                    showAddModal={showAddModal}
                                    setShowAddModal={setShowAddModal}
                                    editingLocation={editingLocation}
                                    selectedParent={selectedParent}
                                    setSelectedParent={setSelectedParent}
                                    locations={locations}
                                />
                            </div>

                            <DataToolbar
                                columns={cols}
                                onToggleColumn={toggleCol}
                                density={density}
                                onDensityChange={setDensity}
                                onExport={exportLocations}
                                filtersActiveCount={activeFilters}
                                filtersContent={
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <Label className="text-sm font-semibold text-slate-700">
                                                Search
                                            </Label>
                                            <Input
                                                placeholder="Search by name or location ID..."
                                                value={searchTerm}
                                                onChange={e => setSearchTerm(e.target.value)}
                                                className="mt-2"
                                            />
                                        </div>
                                        <div>
                                            <Label className="text-sm font-semibold text-slate-700">
                                                Type
                                            </Label>
                                            <Select
                                                value={filterType}
                                                onValueChange={setFilterType}
                                            >
                                                <SelectTrigger className="mt-2">
                                                    <SelectValue placeholder="All Types" />
                                                </SelectTrigger>
                                                <SelectContent
                                                    className={` ${theme === "dark" ? "bg-black text-white border border-gray-800" : "bg-white"}`}
                                                >
                                                    <SelectItem value="all">All</SelectItem>
                                                    {locationTypesState.map(t => (
                                                        <SelectItem key={t.value} value={t.value}>
                                                            {t.label}
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

                    <CardContent className={`p-6 ${theme === "dark" ? "bg-black" : ""}`}>
                        <div className="space-y-2">
                            {searchTerm || filterType !== "all" ? (
                                <div className="space-y-2">
                                    {filteredLocations.map(l => (
                                        <div
                                            key={l.id}
                                            className="flex items-center gap-3 p-3 rounded-lg hover:bg-amber-50/50 transition-all"
                                        >
                                            <div className="flex-1 flex items-center gap-3 flex-wrap">
                                                {visibleColumns.name && (
                                                    <div
                                                        className={`font-semibold ${theme === "dark" ? "text-white" : "text-slate-900"}`}
                                                    >
                                                        {l.name}
                                                    </div>
                                                )}
                                                {visibleColumns.type && (
                                                    <Badge
                                                        className={`text-xs ${typeColor(l.type)}`}
                                                    >
                                                        {
                                                            locationTypesState.find(
                                                                t => t.value === l.type,
                                                            )?.label
                                                        }
                                                    </Badge>
                                                )}
                                                {visibleColumns.startDate && (
                                                    <div
                                                        className={`text-xs ${theme === "dark" ? "text-slate-400" : "text-slate-600"}`}
                                                    >
                                                        Start:{" "}
                                                        {dayjs(l.startDate).format(dateFormat)}
                                                    </div>
                                                )}
                                                {visibleColumns.endDate && (
                                                    <div
                                                        className={`text-xs ${theme === "dark" ? "text-slate-400" : "text-slate-600"}`}
                                                    >
                                                        End: {dayjs(l.endDate).format(dateFormat)}
                                                    </div>
                                                )}
                                                {visibleColumns.active && (
                                                    <Badge
                                                        className={
                                                            l.active === "Yes"
                                                                ? "bg-green-100 text-green-800"
                                                                : "bg-red-100 text-red-800"
                                                        }
                                                    >
                                                        {l.active}
                                                    </Badge>
                                                )}
                                                {visibleColumns.address && l.address && (
                                                    <div
                                                        className={`text-sm truncate max-w-[200px] ${theme === "dark" ? "text-slate-400" : "text-slate-600"}`}
                                                        title={l.address}
                                                    >
                                                        {l.address}
                                                    </div>
                                                )}
                                                {visibleColumns.description && l.description && (
                                                    <div
                                                        className={`text-sm truncate max-w-[200px] ${theme === "dark" ? "text-slate-400" : "text-slate-600"}`}
                                                        title={l.description}
                                                    >
                                                        {l.description}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleAdd(l)}
                                                    className="h-8 w-8 p-0 hover:bg-green-100"
                                                >
                                                    <Plus className="h-4 w-4 text-green-600" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleEdit(l)}
                                                    className="h-8 w-8 p-0 hover:bg-amber-100"
                                                >
                                                    <Edit className="h-4 w-4 text-amber-600" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    // Add this line
                                                    onClick={() => handleDelete("locations", l.id!)}
                                                    className="h-8 w-8 p-0 hover:bg-red-100"
                                                >
                                                    <Trash2 className="h-4 w-4 text-red-600" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                renderLocationTree(locations)
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
