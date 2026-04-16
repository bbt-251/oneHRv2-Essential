"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Loader2 } from "lucide-react";
import ConfigTable, { ColumnDef } from "./config-table";
import { useFirestore } from "@/context/firestore-context";
import { useToast } from "@/context/toastContext";
import { useConfirm } from "@/hooks/use-confirm-dialog";
import {
    CompetencePositionAssociationModel,
    hrSettingsService,
} from "@/lib/backend/firebase/hrSettingsService";
import { useAuth } from "@/context/authContext";
import { JOB_MANAGEMENT_LOG_MESSAGES } from "@/lib/log-descriptions/job-management";

interface ExtendedAssociation extends CompetencePositionAssociationModel {
    position: string;
    competence: string;
}

export default function CompetencePositionAssociation() {
    const { hrSettings } = useFirestore();
    const { showToast } = useToast();
    const { confirm, ConfirmDialog } = useConfirm();
    const { userData } = useAuth();

    const [associations, setAssociations] = useState<ExtendedAssociation[]>([]);

    const [showModal, setShowModal] = useState(false);
    const [saveLoading, setSaveLoading] = useState(false);
    const [editingAssociation, setEditingAssociation] =
        useState<CompetencePositionAssociationModel | null>(null);

    const [formData, setFormData] = useState<CompetencePositionAssociationModel>({
        id: "",
        pid: "",
        cid: "",
        grade: "",
        threshold: 0,
        active: "Yes",
        createdAt: "",
        updatedAt: "",
    });

    const activeOptions = ["Yes", "No"] as const;

    const columns: ColumnDef[] = [
        {
            key: "pid",
            header: "Position",
            render: (row: CompetencePositionAssociationModel) =>
                hrSettings.positions?.find(p => p.id == row.pid)?.name ?? "",
        },
        {
            key: "cid",
            header: "Competence",
            render: (row: CompetencePositionAssociationModel) =>
                hrSettings.competencies?.find(c => c.id == row.cid)?.competenceName ?? "",
        },
        {
            key: "grade",
            header: "Grade",
            render: (r: CompetencePositionAssociationModel) =>
                hrSettings.grades?.find(g => g.id == r.grade)?.grade ?? "",
        },
        { key: "threshold", header: "Threshold" },
        {
            key: "active",
            header: "Status",
            render: (row: CompetencePositionAssociationModel) => (
                <Badge
                    className={
                        row.active === "Yes"
                            ? "bg-green-100 text-green-800 border-green-200"
                            : "bg-gray-100 text-gray-800 border-gray-200"
                    }
                >
                    {row.active}
                </Badge>
            ),
        },
        {
            key: "actions",
            header: "Actions",
            align: "right" as const,
            render: (row: CompetencePositionAssociationModel) => (
                <div className="flex justify-end gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={e => {
                            e.stopPropagation();
                            handleEdit(row);
                        }}
                        className="h-8 w-8 p-0 hover:bg-amber-100"
                    >
                        <Edit className="h-4 w-4 text-amber-600" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={e => {
                            e.stopPropagation();
                            handleDelete(row);
                        }}
                        className="h-8 w-8 p-0 hover:bg-red-100"
                    >
                        <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                </div>
            ),
        },
    ];

    useEffect(() => {
        const associations: ExtendedAssociation[] = hrSettings.competencePositionAssociations.map(
            c => ({
                ...c,
                position: hrSettings.positions?.find(p => p.id == c.pid)?.name ?? "",
                competence: hrSettings.competencies?.find(p => p.id == c.cid)?.competenceName ?? "",
            }),
        );
        setAssociations(associations);
    }, [hrSettings.competencePositionAssociations]);

    const handleAdd = () => {
        setEditingAssociation(null);
        setFormData({
            id: "",
            pid: "",
            cid: "",
            grade: "",
            threshold: 0,
            active: "Yes",
            createdAt: "",
            updatedAt: "",
        });
        setShowModal(true);
    };

    const handleEdit = (association: CompetencePositionAssociationModel) => {
        setEditingAssociation(association);
        setFormData({
            id: "",
            pid: association.pid,
            cid: association.cid,
            grade: association.grade,
            threshold: association.threshold,
            active: association.active,
            createdAt: "",
            updatedAt: "",
        });
        setShowModal(true);
    };

    const handleRowClick = (row: CompetencePositionAssociationModel) => {
        handleEdit(row);
    };

    const handleSubmit = async () => {
        // Check for existing association with same pid and cid
        const existingAssociation = hrSettings.competencePositionAssociations.find(
            assoc =>
                assoc.pid === formData.pid &&
                assoc.cid === formData.cid &&
                assoc.id !== editingAssociation?.id,
        );

        if (existingAssociation) {
            showToast(
                "This position and competence combination already exists",
                "Duplicate Entry",
                "error",
            );
            return;
        }

        setSaveLoading(true);
        const newData: Omit<CompetencePositionAssociationModel, "id" | "createdAt" | "updatedAt"> =
            {
                pid: formData.pid ?? "",
                cid: formData.cid ?? "",
                grade: formData.grade ?? "",
                threshold: formData.threshold ?? 0,
                active: formData.active ?? "Yes",
            };

        if (editingAssociation) {
            const { id, ...data } = formData;
            const res = await hrSettingsService.update(
                "competencePositionAssociations",
                editingAssociation.id,
                data,
                userData?.uid ?? "",
                JOB_MANAGEMENT_LOG_MESSAGES.COMPETENCE_ASSOCIATION_UPDATED({} as any),
            );
            if (res) {
                showToast("Association updated successfully", "Success", "success");
                setShowModal(false);
            } else {
                showToast("Error updating association", "Error", "error");
            }
        } else {
            const res = await hrSettingsService.create(
                "competencePositionAssociations",
                newData,
                userData?.uid ?? "",
                JOB_MANAGEMENT_LOG_MESSAGES.COMPETENCE_ASSOCIATION_CREATED({} as any),
            );
            if (res) {
                showToast("Association created successfully", "Success", "success");
                setShowModal(false);
            } else {
                showToast("Error creating association", "Error", "error");
            }
        }
        setSaveLoading(false);
    };

    const handleDelete = (cpa: CompetencePositionAssociationModel) => {
        confirm("Are you sure ?", async () => {
            const position = hrSettings.positions.find(p => p.id == cpa.pid);
            if (position) {
                const competencies = position.competencies.filter(c => c !== cpa.cid);
                await hrSettingsService.update("positions", position.id, { competencies });
            }
            const res = await hrSettingsService.remove(
                "competencePositionAssociations",
                cpa.id,
                userData?.uid ?? "",
                JOB_MANAGEMENT_LOG_MESSAGES.COMPETENCE_ASSOCIATION_DELETED({} as any),
            );
            if (res) {
                showToast("Association deleted successfully", "Success", "success");
            } else {
                showToast("Error deleting association", "Error", "error");
            }
        });
    };

    return (
        <div>
            <ConfigTable
                title="Competence Position Association"
                columns={columns}
                data={associations}
                searchableKeys={["position", "competence", "grade"]}
                nonFilterableKeys={["id", "createdAt", "updatedAt", "pid", "cid"]}
                onRowClick={handleRowClick}
                filterRenderer={() => (
                    <Dialog open={showModal} onOpenChange={setShowModal}>
                        <DialogTrigger asChild>
                            <Button
                                onClick={handleAdd}
                                className="bg-amber-600 hover:bg-amber-700 text-white rounded-xl"
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Add Association
                            </Button>
                        </DialogTrigger>
                    </Dialog>
                )}
            />

            <Dialog open={showModal} onOpenChange={setShowModal}>
                <DialogContent className="max-w-md bg-white rounded-2xl">
                    <DialogHeader>
                        <DialogTitle>
                            {editingAssociation ? "Edit Association" : "Add New Association"}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="cid">Competence</Label>
                            <Select
                                value={formData.cid}
                                onValueChange={value => setFormData({ ...formData, cid: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select competence" />
                                </SelectTrigger>
                                <SelectContent>
                                    {hrSettings.competencies
                                        ?.filter(c => c.active == "Yes")
                                        ?.map(competence => (
                                            <SelectItem key={competence.id} value={competence.id}>
                                                {competence.competenceName}
                                            </SelectItem>
                                        ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label htmlFor="pid">Position</Label>
                            <Select
                                value={formData.pid}
                                onValueChange={value => {
                                    setFormData({
                                        ...formData,
                                        pid: value,
                                        grade:
                                            hrSettings.positions?.find(p => p.id == value)?.grade ??
                                            "",
                                    });
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select position" />
                                </SelectTrigger>
                                <SelectContent>
                                    {hrSettings.positions
                                        ?.filter(c => c.active == "Yes")
                                        ?.map(position => (
                                            <SelectItem key={position.id} value={position.id}>
                                                {position.name}
                                            </SelectItem>
                                        ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label htmlFor="grade">Grade</Label>
                            <Select
                                disabled
                                value={formData.grade}
                                onValueChange={value => setFormData({ ...formData, grade: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select grade" />
                                </SelectTrigger>
                                <SelectContent>
                                    {hrSettings.grades
                                        ?.filter(c => c.active == "Yes")
                                        ?.map(grade => (
                                            <SelectItem key={grade.id} value={grade.id}>
                                                {grade.grade}
                                            </SelectItem>
                                        ))}
                                </SelectContent>
                            </Select>
                            <p className="text-sm text-gray-500 font-light">Auto filled data</p>
                        </div>

                        <div>
                            <Label htmlFor="threshold">Threshold</Label>
                            <Input
                                id="threshold"
                                type="number"
                                value={formData.threshold}
                                onChange={e =>
                                    setFormData({ ...formData, threshold: Number(e.target.value) })
                                }
                                placeholder="Enter threshold value"
                                min="0"
                                max="100"
                            />
                        </div>

                        <div>
                            <Label htmlFor="active">Active</Label>
                            <Select
                                value={formData.active}
                                onValueChange={(value: "Yes" | "No") =>
                                    setFormData({ ...formData, active: value })
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent>
                                    {activeOptions.map(option => (
                                        <SelectItem key={option} value={option}>
                                            {option}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex justify-end gap-3">
                            <Button variant="outline" onClick={() => setShowModal(false)}>
                                Cancel
                            </Button>
                            <Button
                                onClick={handleSubmit}
                                className="bg-amber-600 hover:bg-amber-700"
                            >
                                {saveLoading ? (
                                    <div className="flex items-center justify-center gap-2">
                                        <Loader2 className="animate-spin h-4 w-4" />
                                        {editingAssociation ? "Updating..." : "Adding..."}
                                    </div>
                                ) : (
                                    `${editingAssociation ? "Update" : "Add"}`
                                )}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
            {ConfirmDialog}
        </div>
    );
}
