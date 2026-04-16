"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useFirestore } from "@/context/firestore-context";
import { useToast } from "@/context/toastContext";
import { useConfirm } from "@/hooks/use-confirm-dialog";
import {
    CompetencePositionAssociationModel,
    hrSettingsService,
    PositionDefinitionModel,
} from "@/lib/backend/firebase/hrSettingsService";
import { createSuccessionPlan } from "@/lib/backend/api/succession-planning/succession-planning-service";
import dayjs from "dayjs";
import { useEffect, useMemo, useState } from "react";
import ConfigTable, { ColumnDef } from "../config-table";
import PositionDialog from "./add-edit-position";
import { times } from "lodash";
import { useAuth } from "@/context/authContext";
import { JOB_MANAGEMENT_LOG_MESSAGES } from "@/lib/log-descriptions/job-management";

export interface AvailableCompetency {
    id: string;
    timestamp: string;
    name: string;
    type: string;
}

type FormState = PositionDefinitionModel;

const searchableKeys = ["pid", "name", "type", "grade", "band", "active", "critical"];

const nonFilterableKeys = [
    "id",
    "createdAt",
    "updatedAt",
    "pid",
    "startDate",
    "endDate",
    "additionalInformation",
    "successionPlanningID",
    "keys",
    "companyProfileUsed",
    "step",
    "competencies",
];

export default function PositionDefinition() {
    const { hrSettings } = useFirestore();
    const { showToast } = useToast();
    const { confirm, ConfirmDialog } = useConfirm();
    const { userData } = useAuth();

    const [items, setItems] = useState<PositionDefinitionModel[]>([]);
    const [open, setOpen] = useState(false);
    const [form, setForm] = useState<FormState | null>(null);
    const [mode, setMode] = useState<"add" | "edit">("add");
    const [saveLoading, setSaveLoading] = useState(false);
    const [availableCompetencies, setAvailableCompetencies] = useState<AvailableCompetency[]>([]);
    const [originalCompetencies, setOriginalCompetencies] = useState<string[]>([]);

    // Wizard state - Updated steps to include Competencies
    const [step, setStep] = useState(0);
    const steps = ["Basic Info", "Description", "Competencies", "Additional"];

    const workflowStepOptions = ["Draft", "Review", "Approval", "Finalized"];

    const columns: ColumnDef[] = useMemo(
        () => [
            { key: "name", header: "Position Name" },
            {
                key: "grade",
                header: "Grade",
                render: (r: PositionDefinitionModel) =>
                    hrSettings.grades?.find(g => g.id == r.grade)?.grade ?? "",
            },
            { key: "band", header: "Band" },
            { key: "startDate", header: "Start Date" },
            { key: "endDate", header: "End Date" },
            {
                key: "active",
                header: "Active",
                render: r => (
                    <Badge
                        className={
                            r.active === "Yes"
                                ? "bg-green-100 text-green-800 border-green-200"
                                : "bg-gray-100 text-gray-800"
                        }
                    >
                        {r.active}
                    </Badge>
                ),
                align: "center",
            },
            {
                key: "critical",
                header: "Critical",
                render: r => (
                    <Badge
                        className={
                            r.critical === "Yes"
                                ? "bg-red-100 text-red-800 border-red-200"
                                : "bg-gray-100 text-gray-800"
                        }
                    >
                        {r.critical}
                    </Badge>
                ),
                align: "center",
            },
            {
                key: "actions",
                header: "Actions",
                render: r => (
                    <div className="flex items-center gap-2">
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={e => {
                                e.stopPropagation();
                                setMode("edit");
                                setOriginalCompetencies(
                                    (r as PositionDefinitionModel).competencies,
                                );
                                setForm({ ...(r as PositionDefinitionModel) });
                                setStep(0);
                                setOpen(true);
                            }}
                        >
                            Edit
                        </Button>
                        <Button
                            size="sm"
                            variant="destructive"
                            onClick={e => {
                                e.stopPropagation();
                                handleDelete(r.id as string);
                            }}
                        >
                            Delete
                        </Button>
                    </div>
                ),
            },
        ],
        [items],
    );

    useEffect(() => {
        setItems(hrSettings.positions);
    }, [hrSettings.positions]);

    useEffect(() => {
        const competences = hrSettings.competencies
            .filter(c => c.active == "Yes")
            .map(c => ({
                id: c.id,
                timestamp: c.createdAt,
                name: c.competenceName,
                type: c.competenceType,
            }));
        setAvailableCompetencies(competences);
    }, [hrSettings.competencies]);

    function openAdd() {
        setMode("add");
        setForm({
            id: "",
            name: "",
            startDate: "",
            endDate: "",
            positionDescription: "",
            additionalInformation: "",
            band: "",
            grade: "",
            active: "Yes",
            critical: "No",
            keys: [],
            companyProfile: null,
            companyProfileUsed: false,
            step: "Draft",
            competencies: [],
            createdAt: "",
            updatedAt: "",
        });
        setOriginalCompetencies([]);
        setStep(0);
        setOpen(true);
    }

    function handleRowClick(row: any) {
        setMode("edit");
        setForm({ ...row });
        setOriginalCompetencies(row.competencies);
        setStep(0);
        setOpen(true);
    }

    async function handleSave() {
        if (!form) return;
        setSaveLoading(true);
        const { id, createdAt, updatedAt, ...newData } = form;

        if (mode === "add") {
            let successionPlanningID: string | undefined = undefined;

            // If marked critical, create a succession plan first and link its ID
            if (form.critical === "Yes") {
                const planningID = `PLAN-${Date.now()}`;
                const planId = await createSuccessionPlan({
                    timestamp: dayjs().format("MMMM DD, YYYY - hh:mm"),
                    planningID,
                    planningStage: "Open",
                    positionID: "", // will be set after we know the position id, keep linkage via planningID
                    positionName: form.name,
                    positionPath: [],
                    candidates: [],
                    commonCompetence: [],
                    orderGuide: undefined,
                });
                if (planId) {
                    successionPlanningID = planningID;
                }
            }

            const res = await hrSettingsService.create(
                "positions",
                {
                    ...newData,
                    ...(successionPlanningID ? { successionPlanningID } : {}),
                } as any,
                userData?.uid ?? "",
                JOB_MANAGEMENT_LOG_MESSAGES.POSITION_CREATED(newData),
            );
            const toBeCreated: Omit<
                CompetencePositionAssociationModel,
                "id" | "createdAt" | "updatedAt"
            >[] = [];

            form?.competencies?.map(cid => {
                if (!originalCompetencies.includes(cid)) {
                    toBeCreated.push({
                        pid: res,
                        cid,
                        grade: form.grade,
                        threshold: 0,
                        active: "Yes",
                    });
                }
            });

            let result = true;

            if (toBeCreated.length) {
                result = (
                    await hrSettingsService.batchCreate(
                        "competencePositionAssociations",
                        toBeCreated,
                    )
                )?.success;
            }

            if (!result) {
                showToast("Error updating competence association", "Error", "error");
                setSaveLoading(false);
                return;
            }

            if (res) {
                showToast("Position created successfully", "Success", "success");
                setOpen(false);
            } else {
                showToast("Error creating position", "Error", "error");
            }
        } else {
            let result = true;

            const toBeDeleted: string[] = [];
            const toBeCreated: Omit<
                CompetencePositionAssociationModel,
                "id" | "createdAt" | "updatedAt"
            >[] = [];

            originalCompetencies.map(cid => {
                if (!form.competencies.includes(cid)) {
                    const cpa = hrSettings.competencePositionAssociations.find(
                        cpa => cpa.pid == id && cpa.cid == cid,
                    );
                    if (cpa) toBeDeleted.push(cpa.id);
                }
            });
            form?.competencies?.map(cid => {
                if (!originalCompetencies.includes(cid)) {
                    toBeCreated.push({
                        pid: id,
                        cid,
                        grade: form.grade,
                        threshold: 0,
                        active: "Yes",
                    });
                }
            });

            if (toBeCreated.length) {
                result = (
                    await hrSettingsService.batchCreate(
                        "competencePositionAssociations",
                        toBeCreated,
                    )
                )?.success;
            }
            if (toBeDeleted.length) {
                result = (
                    await hrSettingsService.batchDelete(
                        "competencePositionAssociations",
                        toBeDeleted,
                    )
                )?.success;
            }

            if (!result) {
                showToast("Error updating competence association", "Error", "error");
                setSaveLoading(false);
                return;
            }

            // For edits, if position becomes critical and had no successionPlanningID, create one
            let updatedData: Partial<PositionDefinitionModel> = { ...newData };
            const original = items.find(p => p.id === id);
            if (
                form.critical === "Yes" &&
                (!original?.successionPlanningID || original.successionPlanningID === "")
            ) {
                const planningID = `PLAN-${Date.now()}`;
                const planId = await createSuccessionPlan({
                    timestamp: dayjs().format("MMMM DD, YYYY - hh:mm"),
                    planningID,
                    planningStage: "Open",
                    positionID: id,
                    positionName: form.name,
                    positionPath: [],
                    candidates: [],
                    commonCompetence: [],
                    orderGuide: undefined,
                });
                if (planId) {
                    (updatedData as any).successionPlanningID = planningID;
                }
            }

            const res = await hrSettingsService.update(
                "positions",
                id,
                updatedData,
                userData?.uid ?? "",
                JOB_MANAGEMENT_LOG_MESSAGES.POSITION_UPDATED({ id, ...updatedData }),
            );
            if (res) {
                showToast("Position updated successfully", "Success", "success");
                setOpen(false);
            } else {
                showToast("Error updating position", "Error", "error");
            }
        }
        setSaveLoading(false);
    }

    async function handleDelete(id: string) {
        confirm("Are you sure ?", async () => {
            const res = await hrSettingsService.remove(
                "positions",
                id,
                userData?.uid ?? "",
                JOB_MANAGEMENT_LOG_MESSAGES.POSITION_DELETED(id),
            );
            if (res) {
                showToast("Position deleted successfully", "Success", "success");
            } else {
                showToast("Error deleting position", "Error", "error");
            }
        });
    }

    // Step Select: use sentinel "none" to avoid empty string SelectItem
    const stepSelectValue = (form?.step ?? "none") as string;

    return (
        <div className="space-y-3">
            <ConfigTable
                title="Position Definition"
                columns={columns}
                data={items}
                searchableKeys={searchableKeys}
                nonFilterableKeys={nonFilterableKeys}
                onRowClick={handleRowClick}
                onAddClick={openAdd}
            />

            <PositionDialog
                open={open}
                setOpen={setOpen}
                mode={mode}
                steps={steps}
                step={step}
                setStep={setStep}
                progress={((step + 1) / steps.length) * 100}
                form={form}
                setForm={setForm}
                hrSettings={hrSettings}
                availableCompetencies={availableCompetencies}
                workflowStepOptions={workflowStepOptions}
                stepSelectValue={stepSelectValue}
                handleSave={handleSave}
                saveLoading={false}
            />
            {ConfirmDialog}
        </div>
    );
}
