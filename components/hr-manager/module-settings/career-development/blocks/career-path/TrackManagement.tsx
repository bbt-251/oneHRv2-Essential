"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
    DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Route, Trash2, Edit, Eye } from "lucide-react";
import { ColumnConfig, DataToolbar, Density } from "../../../../core-settings/blocks/data-toolbar";
import { useFirestore } from "@/context/firestore-context";
import { useToast } from "@/context/toastContext";
import { useAuth } from "@/context/authContext";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { TrackModel, CAREER_LEVELS } from "@/lib/models/career-path";
import { trackService } from "@/lib/api/career-path/track-service";
import { PositionSelect } from "@/components/ui/position-select";
import { CompetenceSelect } from "@/components/ui/competence-select";
import dayjs from "dayjs";

export default function TrackManagement() {
    const { showToast } = useToast();
    const { tracks, hrSettings } = useFirestore();
    const { userData } = useAuth();

    const positions = hrSettings.positions || [];
    const competencies = hrSettings.competencies || [];

    const [density, setDensity] = useState<Density>("normal");
    const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
    const [isViewOpen, setIsViewOpen] = useState<boolean>(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState<boolean>(false);
    const [selectedItem, setSelectedItem] = useState<TrackModel | undefined>();
    const [editingItem, setEditingItem] = useState<TrackModel | undefined>();
    const [deletingItem, setDeletingItem] = useState<TrackModel | undefined>();
    const [searchQuery, setSearchQuery] = useState("");

    const [formData, setFormData] = useState<Omit<TrackModel, "id">>({
        name: "",
        description: "",
        color: "#f59e0b",
        entryRoles: [],
        exitRoles: [],
        keySkills: [],
        careerLevels: [],
        timestamp: new Date().toISOString(),
    });

    const [columns, setColumns] = useState<ColumnConfig[]>([
        { key: "name", label: "Name", visible: true },
        { key: "description", label: "Description", visible: true },
        { key: "color", label: "Color", visible: true },
        { key: "careerLevels", label: "Career Levels", visible: true },
        { key: "timestamp", label: "Created", visible: false },
    ]);

    const filteredTracks = tracks.filter(
        track =>
            track.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            track.description.toLowerCase().includes(searchQuery.toLowerCase()),
    );

    const resetForm = () => {
        setFormData({
            name: "",
            description: "",
            color: "#f59e0b",
            entryRoles: [],
            exitRoles: [],
            keySkills: [],
            careerLevels: [],
            timestamp: new Date().toISOString(),
        });
        setEditingItem(undefined);
    };

    const handleOpenForm = (item?: TrackModel) => {
        if (item) {
            setEditingItem(item);
            setFormData({
                name: item.name,
                description: item.description,
                color: item.color || "#f59e0b",
                entryRoles: item.entryRoles || [],
                exitRoles: item.exitRoles || [],
                keySkills: item.keySkills || [],
                careerLevels: item.careerLevels || [],
                timestamp: item.timestamp || new Date().toISOString(),
            });
        } else {
            resetForm();
        }
        setIsFormOpen(true);
    };

    const handleSave = async () => {
        if (!formData.name.trim()) {
            showToast("Please enter a name", "error", "error");
            return;
        }

        const existingTrack = tracks.find(
            track =>
                track.name.toLowerCase() === formData.name.toLowerCase() &&
                (!editingItem || track.id !== editingItem.id),
        );

        if (existingTrack) {
            showToast("Track name must be unique", "error", "error");
            return;
        }

        try {
            if (editingItem) {
                await trackService.updateTrack(editingItem.id, formData, userData?.uid);
                showToast("Track updated successfully", "success", "success");
            } else {
                await trackService.createTrack(formData, userData?.uid);
                showToast("Track created successfully", "success", "success");
            }
            setIsFormOpen(false);
            resetForm();
        } catch (error) {
            showToast("Failed to save track", "error", "error");
            console.error(error);
        }
    };

    const handleDeleteClick = (item: TrackModel) => {
        setDeletingItem(item);
        setIsDeleteOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (deletingItem) {
            try {
                await trackService.deleteTrack(deletingItem.id, userData?.uid);
                showToast("Track deleted successfully", "success", "success");
            } catch (error) {
                showToast("Failed to delete track", "error", "error");
                console.error(error);
            }
        }
        setIsDeleteOpen(false);
        setDeletingItem(undefined);
    };

    const handleToggleColumn = (key: string) => {
        setColumns(prev =>
            prev.map(col => (col.key === key ? { ...col, visible: !col.visible } : col)),
        );
    };

    const getDensityClasses = () => {
        switch (density) {
            case "compact":
                return "text-xs py-1 px-2";
            case "comfortable":
                return "text-sm py-3 px-4";
            default:
                return "text-sm py-4 px-4";
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Route className="h-5 w-5 text-amber-600" />
                    Career Tracks
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                    <p className="">
                        Manage career tracks that define progression paths for employees
                    </p>
                    <Dialog
                        open={isFormOpen}
                        onOpenChange={open => {
                            setIsFormOpen(open);
                            if (!open) resetForm();
                        }}
                    >
                        <DialogTrigger asChild>
                            <Button
                                onClick={() => handleOpenForm()}
                                className="bg-amber-600 hover:bg-amber-700 text-white"
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Add Track
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>
                                    {editingItem ? "Edit" : "Add"} Career Track
                                </DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Name *</Label>
                                    <Input
                                        id="name"
                                        value={formData.name}
                                        onChange={e =>
                                            setFormData(prev => ({ ...prev, name: e.target.value }))
                                        }
                                        placeholder="e.g., Engineering Track"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="description">Description</Label>
                                    <Textarea
                                        id="description"
                                        value={formData.description}
                                        onChange={e =>
                                            setFormData(prev => ({
                                                ...prev,
                                                description: e.target.value,
                                            }))
                                        }
                                        placeholder="Describe this career track"
                                        rows={3}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="color">Color</Label>
                                    <div className="flex items-center gap-2">
                                        <Input
                                            type="color"
                                            id="color"
                                            value={formData.color || "#f59e0b"}
                                            onChange={e =>
                                                setFormData(prev => ({
                                                    ...prev,
                                                    color: e.target.value,
                                                }))
                                            }
                                            className="w-16 h-10"
                                        />
                                        <span className="text-sm text-muted-foreground">
                                            {formData.color}
                                        </span>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Career Levels</Label>
                                    <div className="flex flex-wrap gap-2">
                                        {CAREER_LEVELS.map(level => (
                                            <Button
                                                key={level}
                                                variant={
                                                    formData.careerLevels.includes(level)
                                                        ? "default"
                                                        : "outline"
                                                }
                                                size="sm"
                                                className={
                                                    formData.careerLevels.includes(level)
                                                        ? "bg-amber-600"
                                                        : ""
                                                }
                                                onClick={() => {
                                                    const newLevels =
                                                        formData.careerLevels.includes(level)
                                                            ? formData.careerLevels.filter(
                                                                l => l !== level,
                                                            )
                                                            : [...formData.careerLevels, level];
                                                    setFormData(prev => ({
                                                        ...prev,
                                                        careerLevels: newLevels,
                                                    }));
                                                }}
                                            >
                                                {level}
                                            </Button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>Entry Roles</Label>
                                    <p className="text-xs text-muted-foreground">
                                        Starting positions for this career track
                                    </p>
                                    <div className="flex flex-wrap gap-2 mb-2">
                                        {formData.entryRoles.map(roleId => {
                                            const position = positions.find(p => p.id === roleId);
                                            return (
                                                <Badge
                                                    key={roleId}
                                                    variant="secondary"
                                                    className="px-2 py-1"
                                                >
                                                    {position?.name || roleId}
                                                    <button
                                                        onClick={() => {
                                                            setFormData(prev => ({
                                                                ...prev,
                                                                entryRoles: prev.entryRoles.filter(
                                                                    id => id !== roleId,
                                                                ),
                                                            }));
                                                        }}
                                                        className="ml-1 text-xs text-muted-foreground hover:text-destructive"
                                                    >
                                                        ×
                                                    </button>
                                                </Badge>
                                            );
                                        })}
                                    </div>
                                    <PositionSelect
                                        value={formData.entryRoles[0] || ""}
                                        onChange={value => {
                                            if (value && !formData.entryRoles.includes(value)) {
                                                setFormData(prev => ({
                                                    ...prev,
                                                    entryRoles: [...prev.entryRoles, value],
                                                }));
                                            }
                                        }}
                                        placeholder="Add entry role..."
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Exit Roles</Label>
                                    <p className="text-xs text-muted-foreground">
                                        Career peak positions for this track
                                    </p>
                                    <div className="flex flex-wrap gap-2 mb-2">
                                        {formData.exitRoles.map(roleId => {
                                            const position = positions.find(p => p.id === roleId);
                                            return (
                                                <Badge
                                                    key={roleId}
                                                    variant="secondary"
                                                    className="px-2 py-1"
                                                >
                                                    {position?.name || roleId}
                                                    <button
                                                        onClick={() => {
                                                            setFormData(prev => ({
                                                                ...prev,
                                                                exitRoles: prev.exitRoles.filter(
                                                                    id => id !== roleId,
                                                                ),
                                                            }));
                                                        }}
                                                        className="ml-1 text-xs text-muted-foreground hover:text-destructive"
                                                    >
                                                        ×
                                                    </button>
                                                </Badge>
                                            );
                                        })}
                                    </div>
                                    <PositionSelect
                                        value={formData.exitRoles[0] || ""}
                                        onChange={value => {
                                            if (value && !formData.exitRoles.includes(value)) {
                                                setFormData(prev => ({
                                                    ...prev,
                                                    exitRoles: [...prev.exitRoles, value],
                                                }));
                                            }
                                        }}
                                        placeholder="Add exit role..."
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Key Skills</Label>
                                    <p className="text-xs text-muted-foreground">
                                        Core competencies required across this track
                                    </p>
                                    <CompetenceSelect
                                        value={formData.keySkills}
                                        onChange={value =>
                                            setFormData(prev => ({ ...prev, keySkills: value }))
                                        }
                                        placeholder="Select key skills..."
                                        multiple={true}
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-2">
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setIsFormOpen(false);
                                        resetForm();
                                    }}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleSave}
                                    className="bg-amber-600 hover:bg-amber-700 text-white"
                                >
                                    {editingItem ? "Update" : "Create"}
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>

                <DataToolbar
                    columns={columns}
                    onToggleColumn={handleToggleColumn}
                    density={density}
                    onDensityChange={setDensity}
                    onExport={() => {}}
                    filtersContent={
                        <Input
                            placeholder="Search tracks..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-64"
                        />
                    }
                    filtersActiveCount={searchQuery ? 1 : 0}
                />

                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                {columns
                                    .filter(col => col.visible)
                                    .map(col => (
                                        <TableHead key={col.key} className={getDensityClasses()}>
                                            {col.label}
                                        </TableHead>
                                    ))}
                                <TableHead className={getDensityClasses()}>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredTracks.length === 0 ? (
                                <TableRow>
                                    <TableCell
                                        colSpan={columns.filter(col => col.visible).length + 1}
                                        className="text-center py-8 text-muted-foreground"
                                    >
                                        No tracks found. Click "Add Track" to create one.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredTracks.map(item => (
                                    <TableRow key={item.id}>
                                        {columns
                                            .filter(col => col.visible)
                                            .map(col => (
                                                <TableCell
                                                    key={col.key}
                                                    className={getDensityClasses()}
                                                >
                                                    {col.key === "color" ? (
                                                        <div className="flex items-center gap-2">
                                                            <div
                                                                className="w-4 h-4 rounded"
                                                                style={{
                                                                    backgroundColor:
                                                                        item.color || "#f59e0b",
                                                                }}
                                                            />
                                                        </div>
                                                    ) : col.key === "careerLevels" ? (
                                                        <div className="flex flex-wrap gap-1">
                                                            {(item.careerLevels || [])
                                                                .slice(0, 3)
                                                                .map((level, idx) => (
                                                                    <Badge
                                                                        key={idx}
                                                                        variant="outline"
                                                                        className="text-xs"
                                                                    >
                                                                        {level}
                                                                    </Badge>
                                                                ))}
                                                            {(item.careerLevels || []).length >
                                                                3 && (
                                                                <Badge
                                                                    variant="outline"
                                                                    className="text-xs"
                                                                >
                                                                    +
                                                                    {(item.careerLevels || [])
                                                                        .length - 3}
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    ) : col.key === "timestamp" ? (
                                                        item.timestamp ? (
                                                            dayjs(item.timestamp).format(
                                                                "MMM DD, YYYY",
                                                            )
                                                        ) : (
                                                            "-"
                                                        )
                                                    ) : (
                                                        (item as any)[col.key] || "-"
                                                    )}
                                                </TableCell>
                                            ))}
                                        <TableCell className={getDensityClasses()}>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => {
                                                        setSelectedItem(item);
                                                        setIsViewOpen(true);
                                                    }}
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleOpenForm(item)}
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDeleteClick(item)}
                                                    className="text-red-600 hover:text-red-700"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* View Dialog */}
                <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Track Details</DialogTitle>
                        </DialogHeader>
                        {selectedItem && (
                            <div className="space-y-4 py-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label className="text-muted-foreground">Name</Label>
                                        <p className="font-medium">{selectedItem.name}</p>
                                    </div>
                                    <div>
                                        <Label className="text-muted-foreground">Color</Label>
                                        <div className="flex items-center gap-2 mt-1">
                                            <div
                                                className="w-6 h-6 rounded"
                                                style={{
                                                    backgroundColor:
                                                        selectedItem.color || "#f59e0b",
                                                }}
                                            />
                                        </div>
                                    </div>
                                    <div className="col-span-2">
                                        <Label className="text-muted-foreground">Description</Label>
                                        <p className="font-medium">
                                            {selectedItem.description || "-"}
                                        </p>
                                    </div>
                                    <div>
                                        <Label className="text-muted-foreground">
                                            Career Levels
                                        </Label>
                                        <div className="flex flex-wrap gap-1 mt-1">
                                            {(selectedItem.careerLevels || []).map((level, idx) => (
                                                <Badge key={idx} variant="outline">
                                                    {level}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <Label className="text-muted-foreground">Entry Roles</Label>
                                        <div className="flex flex-wrap gap-1 mt-1">
                                            {(selectedItem.entryRoles || []).length > 0 ? (
                                                selectedItem.entryRoles?.map((roleId, idx) => {
                                                    const position = positions.find(
                                                        p => p.id === roleId,
                                                    );
                                                    return (
                                                        <Badge key={idx} variant="secondary">
                                                            {position?.name || roleId}
                                                        </Badge>
                                                    );
                                                })
                                            ) : (
                                                <span className="text-muted-foreground">-</span>
                                            )}
                                        </div>
                                    </div>

                                    <div>
                                        <Label className="text-muted-foreground">Exit Roles</Label>
                                        <div className="flex flex-wrap gap-1 mt-1">
                                            {(selectedItem.exitRoles || []).length > 0 ? (
                                                selectedItem.exitRoles?.map((roleId, idx) => {
                                                    const position = positions.find(
                                                        p => p.id === roleId,
                                                    );
                                                    return (
                                                        <Badge key={idx} variant="secondary">
                                                            {position?.name || roleId}
                                                        </Badge>
                                                    );
                                                })
                                            ) : (
                                                <span className="text-muted-foreground">-</span>
                                            )}
                                        </div>
                                    </div>

                                    <div>
                                        <Label className="text-muted-foreground">Key Skills</Label>
                                        <div className="flex flex-wrap gap-1 mt-1">
                                            {(selectedItem.keySkills || []).length > 0 ? (
                                                selectedItem.keySkills?.map((skillId, idx) => {
                                                    const competence = competencies.find(
                                                        c => c.id === skillId,
                                                    );
                                                    return (
                                                        <Badge
                                                            key={idx}
                                                            variant="outline"
                                                            className="bg-amber-50"
                                                        >
                                                            {competence?.competenceName || skillId}
                                                        </Badge>
                                                    );
                                                })
                                            ) : (
                                                <span className="text-muted-foreground">-</span>
                                            )}
                                        </div>
                                    </div>
                                    <div>
                                        <Label className="text-muted-foreground">Created</Label>
                                        <p className="font-medium">
                                            {selectedItem.timestamp
                                                ? dayjs(selectedItem.timestamp).format(
                                                    "MMM DD, YYYY HH:mm",
                                                )
                                                : "-"}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>

                {/* Delete Confirmation Dialog */}
                <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Delete Track</DialogTitle>
                            <DialogDescription>
                                Are you sure you want to delete the track "{deletingItem?.name}"?
                                This action cannot be undone.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
                                Cancel
                            </Button>
                            <Button variant="destructive" onClick={handleDeleteConfirm}>
                                Delete
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </CardContent>
        </Card>
    );
}
