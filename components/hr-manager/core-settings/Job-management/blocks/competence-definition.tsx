"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import ConfigTable, { ColumnDef } from "./config-table";
import { CompetenceModel, hrSettingsService } from "@/lib/backend/firebase/hrSettingsService";
import { useFirestore } from "@/context/firestore-context";
import { useToast } from "@/context/toastContext";
import dayjs from "dayjs";
import { timestampFormat } from "@/lib/util/dayjs_format";
import { useConfirm } from "@/hooks/use-confirm-dialog";
import { useAuth } from "@/context/authContext";
import { JOB_MANAGEMENT_LOG_MESSAGES } from "@/lib/log-descriptions/job-management";

export default function CompetenceDefinition() {
    const { hrSettings } = useFirestore();
    const { showToast } = useToast();
    const { confirm, ConfirmDialog } = useConfirm();
    const { userData } = useAuth();

    const [rows, setRows] = useState<CompetenceModel[]>([]);
    const [types, setTypes] = useState<string[]>(["Behavioral", "Technical", "Leadership"]);

    // Form state
    const [formOpen, setFormOpen] = useState(false);
    const [editingCompetence, setEditingCompetence] = useState<CompetenceModel | null>(null);
    const [showNewTypeInput, setShowNewTypeInput] = useState(false);
    const [saveLoading, setSaveLoading] = useState(false);
    const [newTypeInput, setNewTypeInput] = useState("");
    const [form, setForm] = useState<CompetenceModel>({
        id: "1",
        createdAt: dayjs().format(timestampFormat),
        updatedAt: "",
        competenceName: "",
        competenceType: "Behavioral",
        active: "Yes",
    });

    const columns: ColumnDef[] = [
        {
            key: "timestamp",
            header: "Timestamp",
            render: r => r.createdAt,
        },
        { key: "competenceName", header: "Competence Name" },
        {
            key: "competenceType",
            header: "Competence Type",
            render: r => (
                <Badge className="bg-amber-100 text-amber-800 border border-amber-200">
                    {r.competenceType}
                </Badge>
            ),
        },
        {
            key: "active",
            header: "Active",
            render: r => (
                <Badge
                    className={
                        r.active
                            ? "bg-green-100 text-green-800 border border-green-200"
                            : "bg-gray-100 text-gray-800"
                    }
                >
                    {r.active ? "Yes" : "No"}
                </Badge>
            ),
            align: "center",
        },
        {
            key: "actions",
            header: "Actions",
            align: "right",
            render: r => {
                const row = rows.find(x => x.id === r.id);
                return (
                    <div
                        className="flex items-center gap-2 justify-end"
                        onClick={e => e.stopPropagation()}
                    >
                        <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 px-2 hover:bg-amber-100"
                            onClick={() => openEdit(row ?? ({} as CompetenceModel))}
                            aria-label="Edit"
                        >
                            <Pencil className="h-4 w-4 text-amber-700" />
                        </Button>
                        <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 px-2 hover:bg-red-100"
                            onClick={() => handleDelete(row ?? ({} as CompetenceModel))}
                            aria-label="Delete"
                        >
                            <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                    </div>
                );
            },
        },
    ];

    useEffect(() => {
        setRows(hrSettings.competencies);
    }, [hrSettings.competencies]);

    function openAdd() {
        setEditingCompetence(null);
        setForm({
            id: "1",
            createdAt: dayjs().format(timestampFormat),
            updatedAt: "",
            competenceName: "",
            competenceType: types[0] ?? "Behavioral",
            active: "Yes",
        });
        setFormOpen(true);
    }

    function openEdit(row: CompetenceModel) {
        setEditingCompetence(row);
        setForm({ ...row });
        setFormOpen(true);
    }

    function handleDelete(row: CompetenceModel) {
        confirm("Are you sure ?", async () => {
            const res = await hrSettingsService.remove(
                "competencies",
                row.id,
                userData?.uid ?? "",
                JOB_MANAGEMENT_LOG_MESSAGES.COMPETENCE_DELETED(row.id),
            );
            if (res) {
                showToast("Competence deleted successfully", "Success", "success");
            } else {
                showToast("Error deleting competence", "Error", "error");
            }
        });
    }

    async function handleSave() {
        setSaveLoading(true);
        if (!form.id.trim() || !form.competenceName.trim() || !form.competenceType.trim()) {
            return;
        }

        const newCompetence: Omit<CompetenceModel, "id" | "createdAt" | "updatedAt"> = {
            competenceName: form.competenceName,
            competenceType: form.competenceType,
            active: form.active ?? "Yes",
        };

        if (editingCompetence) {
            const { id, ...data } = form;
            const res = await hrSettingsService.update(
                "competencies",
                editingCompetence.id,
                data,
                userData?.uid ?? "",
                JOB_MANAGEMENT_LOG_MESSAGES.COMPETENCE_UPDATED({
                    id: editingCompetence.id,
                    competenceName: data.competenceName,
                    competenceType: data.competenceType,
                    active: data.active,
                }),
            );
            if (res) {
                showToast("Competence updated successfully", "Success", "success");
                setFormOpen(false);
            } else {
                showToast("Error updating competence", "Error", "error");
            }
        } else {
            const res = await hrSettingsService.create(
                "competencies",
                newCompetence,
                userData?.uid ?? "",
                JOB_MANAGEMENT_LOG_MESSAGES.COMPETENCE_CREATED({
                    competenceName: newCompetence.competenceName,
                    competenceType: newCompetence.competenceType,
                    active: newCompetence.active,
                }),
            );
            if (res) {
                showToast("Competence created successfully", "Success", "success");
                setFormOpen(false);
            } else {
                showToast("Error creating competence", "Error", "error");
            }
        }
        setSaveLoading(false);
    }

    function handleAddNewType() {
        if (newTypeInput.trim()) {
            addNewType(newTypeInput);
        }
    }

    function addNewType(name: string) {
        const n = name.trim();
        if (!n) return;

        if (types.some(type => type.toLowerCase() === n.toLowerCase())) {
            alert("This competence type already exists!");
            return;
        }

        if (!types.includes(n)) setTypes(t => [n, ...t]);
        setForm(f => ({ ...f, competenceType: n }));
        setNewTypeInput("");
        setShowNewTypeInput(false);
    }

    return (
        <div className="space-y-4">
            {/* Add/Edit competency */}
            <div className="flex items-center justify-end">
                <Dialog open={formOpen} onOpenChange={setFormOpen}>
                    {/* Add/Edit Competence Form */}
                    <DialogContent className="max-w-md rounded-2xl">
                        <DialogHeader>
                            <DialogTitle>
                                {editingCompetence === null ? "Add Competence" : "Edit Competence"}
                            </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="createdAt">Timestamp</Label>
                                <Input
                                    id="createdAt"
                                    value={new Date(form.createdAt).toLocaleString()}
                                    readOnly
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="competenceName">Competence Name</Label>
                                <Input
                                    id="competenceName"
                                    value={form.competenceName}
                                    onChange={e =>
                                        setForm(f => ({ ...f, competenceName: e.target.value }))
                                    }
                                    placeholder="e.g., Problem Solving"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Competence Type</Label>
                                {!showNewTypeInput ? (
                                    <Select
                                        value={form.competenceType}
                                        onValueChange={v => {
                                            if (v === "ADD_NEW") {
                                                setShowNewTypeInput(true);
                                            } else {
                                                setForm(f => ({ ...f, competenceType: v }));
                                            }
                                        }}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {types.map(t => (
                                                <SelectItem key={t} value={t}>
                                                    {t}
                                                </SelectItem>
                                            ))}
                                            <SelectItem
                                                value="ADD_NEW"
                                                className="text-amber-600 font-medium"
                                            >
                                                <Plus className="h-4 w-4 mr-2 inline" />
                                                Add New Type
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                ) : (
                                    <div className="space-y-2">
                                        <div className="flex gap-2">
                                            <Input
                                                value={newTypeInput}
                                                onChange={e => setNewTypeInput(e.target.value)}
                                                placeholder="Enter new competence type"
                                                onKeyDown={e => {
                                                    if (e.key === "Enter") {
                                                        handleAddNewType();
                                                    } else if (e.key === "Escape") {
                                                        setShowNewTypeInput(false);
                                                        setNewTypeInput("");
                                                    }
                                                }}
                                                autoFocus
                                            />
                                            <Button
                                                size="sm"
                                                onClick={handleAddNewType}
                                                className="bg-amber-600 hover:bg-amber-700 text-white"
                                                disabled={!newTypeInput.trim()}
                                            >
                                                Add
                                            </Button>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => {
                                                setShowNewTypeInput(false);
                                                setNewTypeInput("");
                                            }}
                                            className="text-gray-500 hover:text-gray-700"
                                        >
                                            Cancel
                                        </Button>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="active">Active</Label>
                                <Select
                                    value={form.active}
                                    onValueChange={v =>
                                        setForm(s => ({ ...s, active: v as "Yes" | "No" }))
                                    }
                                >
                                    <SelectTrigger id="active">
                                        <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Yes">Yes</SelectItem>
                                        <SelectItem value="No">No</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <DialogFooter className="mt-4">
                            <Button
                                variant="outline"
                                onClick={() => setFormOpen(false)}
                                className="rounded-xl"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleSave}
                                className="bg-amber-600 hover:bg text-white rounded-xl"
                            >
                                {saveLoading ? (
                                    <div className="flex items-center justify-center gap-2">
                                        <Loader2 className="animate-spin h-4 w-4" />
                                        {editingCompetence ? "Saving..." : "Adding..."}
                                    </div>
                                ) : (
                                    `${editingCompetence ? "Save" : "Add"}`
                                )}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Table with universal filter modal via ConfigTable */}
            <ConfigTable
                title="Competence Definition"
                columns={columns}
                data={rows}
                nonFilterableKeys={["id", "createdAt", "updatedAt"]}
                searchableKeys={["competenceName", "competenceType"]}
                onAddClick={openAdd}
            />
            {ConfirmDialog}
        </div>
    );
}
