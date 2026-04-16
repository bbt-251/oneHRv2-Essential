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
import { Plus, Briefcase, Trash2, Edit, Eye } from "lucide-react";
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
import { RoleModel, CAREER_LEVELS, CareerLevel } from "@/lib/models/career-path";
import { roleService } from "@/lib/api/career-path/role-service";
import { PositionSelect } from "@/components/ui/position-select";
import { CompetenceSelect } from "@/components/ui/competence-select";
import { TrainingSelect } from "@/components/ui/training-select";
import dayjs from "dayjs";

export default function RoleManagement() {
    const { showToast } = useToast();
    const { roles, tracks, hrSettings, trainingMaterials, trainingPaths } = useFirestore();
    const { userData } = useAuth();

    const positions = hrSettings.positions || [];
    const competencies = hrSettings.competencies || [];

    const [density, setDensity] = useState<Density>("normal");
    const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
    const [isViewOpen, setIsViewOpen] = useState<boolean>(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState<boolean>(false);
    const [selectedItem, setSelectedItem] = useState<RoleModel | null>(null);
    const [editingItem, setEditingItem] = useState<RoleModel | null>(null);
    const [deletingItem, setDeletingItem] = useState<RoleModel | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterTrack, setFilterTrack] = useState<string>("");
    const [filterLevel, setFilterLevel] = useState<string>("");
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const [formData, setFormData] = useState<Omit<RoleModel, "id">>({
        timestamp: new Date().toISOString(),
        roleTitle: null,
        track: null,
        level: null,
        requiredSkills: null,
        requiredCourses: null,
        prerequisiteRoles: null,
        potentialSuccessorRoles: null,
        estimatedTime: null,
    });

    const [columns, setColumns] = useState<ColumnConfig[]>([
        { key: "roleTitle", label: "Role Title", visible: true },
        { key: "track", label: "Track", visible: true },
        { key: "level", label: "Level", visible: true },
        { key: "requiredSkills", label: "Skills", visible: true },
        { key: "requiredCourses", label: "Courses", visible: true },
        { key: "timestamp", label: "Created", visible: false },
    ]);

    // Helper functions - defined before use
    const getTrackName = (trackId: string | null) => {
        if (!trackId) return "-";
        const track = tracks.find(t => t.id === trackId);
        return track?.name || "-";
    };

    const getRoleTitle = (role: RoleModel): string => {
        if (!role.roleTitle) return "-";
        const position = positions.find(p => p.id === role.roleTitle);
        return position?.name || role.roleTitle;
    };

    const getCompetenceName = (competenceId: string) => {
        const competence = competencies.find(c => c.id === competenceId);
        return competence?.competenceName || competenceId;
    };

    const getTrainingName = (trainingId: string) => {
        // Check training paths first
        const trainingPath = trainingPaths.find(t => t.id === trainingId);
        if (trainingPath) return trainingPath.name;

        // Check training materials
        const trainingMaterial = trainingMaterials.find(t => t.id === trainingId);
        return trainingMaterial?.name || trainingId;
    };

    // Filter roles after helper functions are defined
    const filteredRoles = roles.filter(role => {
        const roleTitle = getRoleTitle(role);
        const matchesSearch = roleTitle.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesTrack = !filterTrack || role.track === filterTrack;
        const matchesLevel = !filterLevel || role.level === filterLevel;
        return matchesSearch && matchesTrack && matchesLevel;
    });

    const resetForm = () => {
        setFormData({
            timestamp: new Date().toISOString(),
            roleTitle: null,
            track: null,
            level: null,
            requiredSkills: null,
            requiredCourses: null,
            prerequisiteRoles: null,
            potentialSuccessorRoles: null,
            estimatedTime: null,
        });
        setEditingItem(null);
    };

    const handleOpenForm = (item?: RoleModel) => {
        if (item) {
            setEditingItem(item);
            setFormData({
                timestamp: item.timestamp || new Date().toISOString(),
                roleTitle: item.roleTitle,
                track: item.track,
                level: item.level,
                requiredSkills: item.requiredSkills,
                requiredCourses: item.requiredCourses,
                prerequisiteRoles: item.prerequisiteRoles,
                potentialSuccessorRoles: item.potentialSuccessorRoles,
                estimatedTime: item.estimatedTime,
            });
        } else {
            resetForm();
        }
        setIsFormOpen(true);
    };

    const handleSave = async () => {
        if (!formData.roleTitle) {
            showToast("Please select a role title", "error", "error");
            return;
        }

        if (!formData.track) {
            showToast("Please select a track", "error", "error");
            return;
        }

        if (!formData.level) {
            showToast("Please select a career level", "error", "error");
            return;
        }

        const existingRole = roles.find(
            role =>
                role.roleTitle === formData.roleTitle &&
                role.track === formData.track &&
                (!editingItem || role.id !== editingItem.id),
        );

        if (existingRole) {
            showToast("Role with this title already exists in this track", "error", "error");
            return;
        }

        setIsSaving(true);
        try {
            if (editingItem) {
                await roleService.updateRole(editingItem.id, formData, userData?.uid);
                showToast("Role updated successfully", "success", "success");
            } else {
                await roleService.createRole(formData, userData?.uid);
                showToast("Role created successfully", "success", "success");
            }
            setIsFormOpen(false);
            resetForm();
        } catch (error) {
            showToast("Failed to save role", "error", "error");
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteClick = (item: RoleModel) => {
        setDeletingItem(item);
        setIsDeleteOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (deletingItem) {
            setIsDeleting(true);
            try {
                await roleService.deleteRole(deletingItem.id, userData?.uid);
                showToast("Role deleted successfully", "success", "success");
            } catch (error) {
                showToast("Failed to delete role", "error", "error");
                console.error(error);
            } finally {
                setIsDeleting(false);
            }
        }
        setIsDeleteOpen(false);
        setDeletingItem(null);
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
                    <Briefcase className="h-5 w-5 text-amber-600" />
                    Career Roles
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                    <p className="">Manage roles within each career track</p>
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
                                Add Role
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>
                                    {editingItem ? "Edit" : "Add"} Career Role
                                </DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                {/* Basic Info */}
                                <div className="space-y-2">
                                    <Label>Role Title *</Label>
                                    <p className="text-xs text-muted-foreground">
                                        Select a position from HR settings
                                    </p>
                                    <PositionSelect
                                        value={formData.roleTitle || ""}
                                        onChange={value =>
                                            setFormData(prev => ({
                                                ...prev,
                                                roleTitle: value || null,
                                            }))
                                        }
                                        placeholder="Select position..."
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Track *</Label>
                                        <select
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                            value={formData.track || ""}
                                            onChange={e =>
                                                setFormData(prev => ({
                                                    ...prev,
                                                    track: e.target.value || null,
                                                }))
                                            }
                                        >
                                            <option value="">Select a track</option>
                                            {tracks.map(track => (
                                                <option key={track.id} value={track.id}>
                                                    {track.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Career Level *</Label>
                                        <select
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                            value={formData.level || ""}
                                            onChange={e =>
                                                setFormData(prev => ({
                                                    ...prev,
                                                    level: (e.target.value ||
                                                        null) as CareerLevel | null,
                                                }))
                                            }
                                        >
                                            <option value="">Select level</option>
                                            {CAREER_LEVELS.map(level => (
                                                <option key={level} value={level}>
                                                    {level}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Requirements */}
                                <div className="space-y-2">
                                    <Label>Required Skills</Label>
                                    <p className="text-xs text-muted-foreground">
                                        Select competencies from HR settings
                                    </p>
                                    <CompetenceSelect
                                        value={formData.requiredSkills || []}
                                        onChange={value =>
                                            setFormData(prev => ({
                                                ...prev,
                                                requiredSkills: value.length > 0 ? value : null,
                                            }))
                                        }
                                        placeholder="Select required skills..."
                                        multiple={true}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Required Courses</Label>
                                    <p className="text-xs text-muted-foreground">
                                        Select training materials or paths
                                    </p>
                                    <TrainingSelect
                                        value={formData.requiredCourses || []}
                                        onChange={value =>
                                            setFormData(prev => ({
                                                ...prev,
                                                requiredCourses: value.length > 0 ? value : null,
                                            }))
                                        }
                                        placeholder="Select required courses..."
                                        multiple={true}
                                    />
                                </div>

                                {/* Progression */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Prerequisite Roles</Label>
                                        <p className="text-xs text-muted-foreground">
                                            Roles that must be completed first
                                        </p>
                                        <select
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                            value=""
                                            onChange={e => {
                                                if (
                                                    e.target.value &&
                                                    !formData.prerequisiteRoles?.includes(
                                                        e.target.value,
                                                    )
                                                ) {
                                                    setFormData(prev => ({
                                                        ...prev,
                                                        prerequisiteRoles: prev.prerequisiteRoles
                                                            ? [
                                                                ...prev.prerequisiteRoles,
                                                                e.target.value,
                                                            ]
                                                            : [e.target.value],
                                                    }));
                                                }
                                            }}
                                        >
                                            <option value="">Add prerequisite role...</option>
                                            {roles
                                                .filter(
                                                    r =>
                                                        r.id !== editingItem?.id &&
                                                        r.id !== formData.prerequisiteRoles?.[0],
                                                )
                                                .map(role => (
                                                    <option key={role.id} value={role.id}>
                                                        {getRoleTitle(role)} -{" "}
                                                        {getTrackName(role.track)}
                                                    </option>
                                                ))}
                                        </select>
                                        {formData.prerequisiteRoles &&
                                            formData.prerequisiteRoles.length > 0 && (
                                            <div className="flex flex-wrap gap-1 mt-2">
                                                {formData.prerequisiteRoles.map(prereqId => {
                                                    const prereqRole = roles.find(
                                                        r => r.id === prereqId,
                                                    );
                                                    return prereqRole ? (
                                                        <Badge
                                                            key={prereqId}
                                                            variant="secondary"
                                                            className="px-2 py-1"
                                                        >
                                                            {getRoleTitle(prereqRole)}
                                                            <button
                                                                onClick={() => {
                                                                    setFormData(prev => ({
                                                                        ...prev,
                                                                        prerequisiteRoles:
                                                                                prev.prerequisiteRoles?.filter(
                                                                                    id =>
                                                                                        id !==
                                                                                        prereqId,
                                                                                ) || null,
                                                                    }));
                                                                }}
                                                                className="ml-1 text-xs text-muted-foreground hover:text-destructive"
                                                            >
                                                                    ×
                                                            </button>
                                                        </Badge>
                                                    ) : null;
                                                })}
                                            </div>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Potential Successor Roles</Label>
                                        <p className="text-xs text-muted-foreground">
                                            Next possible positions
                                        </p>
                                        <select
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                            value=""
                                            onChange={e => {
                                                if (
                                                    e.target.value &&
                                                    !formData.potentialSuccessorRoles?.includes(
                                                        e.target.value,
                                                    )
                                                ) {
                                                    setFormData(prev => ({
                                                        ...prev,
                                                        potentialSuccessorRoles:
                                                            prev.potentialSuccessorRoles
                                                                ? [
                                                                    ...prev.potentialSuccessorRoles,
                                                                    e.target.value,
                                                                ]
                                                                : [e.target.value],
                                                    }));
                                                }
                                            }}
                                        >
                                            <option value="">Add successor role...</option>
                                            {roles
                                                .filter(r => r.id !== editingItem?.id)
                                                .map(role => (
                                                    <option key={role.id} value={role.id}>
                                                        {getRoleTitle(role)} -{" "}
                                                        {getTrackName(role.track)}
                                                    </option>
                                                ))}
                                        </select>
                                        {formData.potentialSuccessorRoles &&
                                            formData.potentialSuccessorRoles.length > 0 && (
                                            <div className="flex flex-wrap gap-1 mt-2">
                                                {formData.potentialSuccessorRoles.map(
                                                    succId => {
                                                        const succRole = roles.find(
                                                            r => r.id === succId,
                                                        );
                                                        return succRole ? (
                                                            <Badge
                                                                key={succId}
                                                                variant="outline"
                                                                className="px-2 py-1"
                                                            >
                                                                {getRoleTitle(succRole)}
                                                                <button
                                                                    onClick={() => {
                                                                        setFormData(prev => ({
                                                                            ...prev,
                                                                            potentialSuccessorRoles:
                                                                                    prev.potentialSuccessorRoles?.filter(
                                                                                        id =>
                                                                                            id !==
                                                                                            succId,
                                                                                    ) || null,
                                                                        }));
                                                                    }}
                                                                    className="ml-1 text-xs text-muted-foreground hover:text-destructive"
                                                                >
                                                                        ×
                                                                </button>
                                                            </Badge>
                                                        ) : null;
                                                    },
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Estimated Time */}
                                <div className="space-y-2">
                                    <Label>Estimated Time to Complete</Label>
                                    <Input
                                        value={formData.estimatedTime || ""}
                                        onChange={e =>
                                            setFormData(prev => ({
                                                ...prev,
                                                estimatedTime: e.target.value || null,
                                            }))
                                        }
                                        placeholder="e.g., 6-12 months"
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
                                    disabled={isSaving}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleSave}
                                    className="bg-amber-600 hover:bg-amber-700 text-white"
                                    disabled={isSaving}
                                >
                                    {isSaving ? "Saving..." : editingItem ? "Update" : "Create"}
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
                        <div className="flex gap-2">
                            <Input
                                placeholder="Search roles..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="w-48"
                            />
                            <select
                                className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                                value={filterTrack}
                                onChange={e => setFilterTrack(e.target.value)}
                            >
                                <option value="">All Tracks</option>
                                {tracks.map(track => (
                                    <option key={track.id} value={track.id}>
                                        {track.name}
                                    </option>
                                ))}
                            </select>
                            <select
                                className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                                value={filterLevel}
                                onChange={e => setFilterLevel(e.target.value)}
                            >
                                <option value="">All Levels</option>
                                {CAREER_LEVELS.map(level => (
                                    <option key={level} value={level}>
                                        {level}
                                    </option>
                                ))}
                            </select>
                        </div>
                    }
                    filtersActiveCount={
                        (searchQuery ? 1 : 0) + (filterTrack ? 1 : 0) + (filterLevel ? 1 : 0)
                    }
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
                            {filteredRoles.length === 0 ? (
                                <TableRow>
                                    <TableCell
                                        colSpan={columns.filter(col => col.visible).length + 1}
                                        className="text-center py-8 text-muted-foreground"
                                    >
                                        No roles found. Click "Add Role" to create one.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredRoles.map(item => (
                                    <TableRow key={item.id}>
                                        {columns
                                            .filter(col => col.visible)
                                            .map(col => (
                                                <TableCell
                                                    key={col.key}
                                                    className={getDensityClasses()}
                                                >
                                                    {col.key === "roleTitle" ? (
                                                        getRoleTitle(item)
                                                    ) : col.key === "track" ? (
                                                        <Badge variant="secondary">
                                                            {getTrackName(item.track)}
                                                        </Badge>
                                                    ) : col.key === "level" ? (
                                                        item.level ? (
                                                            <Badge variant="outline">
                                                                {item.level}
                                                            </Badge>
                                                        ) : (
                                                            "-"
                                                        )
                                                    ) : col.key === "requiredSkills" ? (
                                                        <div className="flex flex-wrap gap-1">
                                                            {(item.requiredSkills || [])
                                                                .slice(0, 2)
                                                                .map((skillId, idx) => (
                                                                    <Badge
                                                                        key={idx}
                                                                        variant="outline"
                                                                        className="text-xs"
                                                                    >
                                                                        {getCompetenceName(skillId)}
                                                                    </Badge>
                                                                ))}
                                                            {(item.requiredSkills || []).length >
                                                                2 && (
                                                                <Badge
                                                                    variant="outline"
                                                                    className="text-xs"
                                                                >
                                                                    +
                                                                    {(item.requiredSkills || [])
                                                                        .length - 2}
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    ) : col.key === "requiredCourses" ? (
                                                        <div className="flex flex-wrap gap-1">
                                                            {(item.requiredCourses || [])
                                                                .slice(0, 2)
                                                                .map((courseId, idx) => (
                                                                    <Badge
                                                                        key={idx}
                                                                        variant="default"
                                                                        className="text-xs bg-green-600"
                                                                    >
                                                                        {getTrainingName(courseId)}
                                                                    </Badge>
                                                                ))}
                                                            {(item.requiredCourses || []).length >
                                                                2 && (
                                                                <Badge
                                                                    variant="default"
                                                                    className="text-xs bg-green-600"
                                                                >
                                                                    +
                                                                    {(item.requiredCourses || [])
                                                                        .length - 2}
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
                                                        "-"
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
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>Role Details</DialogTitle>
                        </DialogHeader>
                        {selectedItem && (
                            <div className="space-y-4 py-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label className="text-muted-foreground">Role Title</Label>
                                        <p className="font-medium">{getRoleTitle(selectedItem)}</p>
                                    </div>
                                    <div>
                                        <Label className="text-muted-foreground">Track</Label>
                                        <p className="font-medium">
                                            {getTrackName(selectedItem.track)}
                                        </p>
                                    </div>
                                    <div>
                                        <Label className="text-muted-foreground">
                                            Career Level
                                        </Label>
                                        <p className="font-medium">{selectedItem.level || "-"}</p>
                                    </div>
                                    <div>
                                        <Label className="text-muted-foreground">
                                            Estimated Time
                                        </Label>
                                        <p className="font-medium">
                                            {selectedItem.estimatedTime || "-"}
                                        </p>
                                    </div>
                                </div>

                                <div>
                                    <Label className="text-muted-foreground">Required Skills</Label>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                        {(selectedItem.requiredSkills || []).length > 0 ? (
                                            selectedItem.requiredSkills?.map((skillId, idx) => (
                                                <Badge
                                                    key={idx}
                                                    variant="outline"
                                                    className="text-xs"
                                                >
                                                    {getCompetenceName(skillId)}
                                                </Badge>
                                            ))
                                        ) : (
                                            <span className="text-muted-foreground">-</span>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <Label className="text-muted-foreground">
                                        Required Courses
                                    </Label>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                        {(selectedItem.requiredCourses || []).length > 0 ? (
                                            selectedItem.requiredCourses?.map((courseId, idx) => (
                                                <Badge
                                                    key={idx}
                                                    variant="default"
                                                    className="text-xs bg-green-600"
                                                >
                                                    {getTrainingName(courseId)}
                                                </Badge>
                                            ))
                                        ) : (
                                            <span className="text-muted-foreground">-</span>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <Label className="text-muted-foreground">
                                        Prerequisite Roles
                                    </Label>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                        {(selectedItem.prerequisiteRoles || []).length > 0 ? (
                                            selectedItem.prerequisiteRoles?.map((prereqId, idx) => {
                                                const prereqRole = roles.find(
                                                    r => r.id === prereqId,
                                                );
                                                return prereqRole ? (
                                                    <Badge
                                                        key={idx}
                                                        variant="secondary"
                                                        className="text-xs"
                                                    >
                                                        {getRoleTitle(prereqRole)}
                                                    </Badge>
                                                ) : null;
                                            })
                                        ) : (
                                            <span className="text-muted-foreground">None</span>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <Label className="text-muted-foreground">
                                        Potential Successor Roles
                                    </Label>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                        {(selectedItem.potentialSuccessorRoles || []).length > 0 ? (
                                            selectedItem.potentialSuccessorRoles?.map(
                                                (succId, idx) => {
                                                    const succRole = roles.find(
                                                        r => r.id === succId,
                                                    );
                                                    return succRole ? (
                                                        <Badge
                                                            key={idx}
                                                            variant="outline"
                                                            className="text-xs"
                                                        >
                                                            {getRoleTitle(succRole)}
                                                        </Badge>
                                                    ) : null;
                                                },
                                            )
                                        ) : (
                                            <span className="text-muted-foreground">None</span>
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
                        )}
                    </DialogContent>
                </Dialog>

                {/* Delete Confirmation Dialog */}
                <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Delete Role</DialogTitle>
                            <DialogDescription>
                                Are you sure you want to delete the role "
                                {deletingItem ? getRoleTitle(deletingItem) : ""}"? This action
                                cannot be undone.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button
                                variant="outline"
                                onClick={() => setIsDeleteOpen(false)}
                                disabled={isDeleting}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={handleDeleteConfirm}
                                disabled={isDeleting}
                            >
                                {isDeleting ? "Deleting..." : "Delete"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </CardContent>
        </Card>
    );
}
