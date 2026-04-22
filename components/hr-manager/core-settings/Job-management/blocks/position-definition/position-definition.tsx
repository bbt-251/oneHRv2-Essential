"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useData } from "@/context/app-data-context";
import { useToast } from "@/context/toastContext";
import { useConfirm } from "@/hooks/use-confirm-dialog";
import { hrSettingsService, PositionDefinitionModel } from "@/lib/backend/hr-settings-service";
import { useCallback, useMemo, useState } from "react";
import ConfigTable, { ColumnDef } from "../config-table";
import PositionDialog from "./add-edit-position";
import { useAuth } from "@/context/authContext";
import { JOB_MANAGEMENT_LOG_MESSAGES } from "@/lib/log-descriptions/job-management";

type FormState = PositionDefinitionModel;

const searchableKeys = ["name", "grade", "band", "active", "critical"];

const nonFilterableKeys = [
    "id",
    "createdAt",
    "updatedAt",
    "startDate",
    "endDate",
    "additionalInformation",
    "keys",
    "companyProfileUsed",
    "step",
    "competencies",
];

export default function PositionDefinition() {
    const { ...hrSettings } = useData();
    const { showToast } = useToast();
    const { confirm, ConfirmDialog } = useConfirm();
    const { userData } = useAuth();

    const items = hrSettings.positions;
    const [open, setOpen] = useState<boolean>(false);
    const [form, setForm] = useState<FormState | null>(null);
    const [mode, setMode] = useState<"add" | "edit">("add");
    const [saveLoading, setSaveLoading] = useState<boolean>(false);

    const [step, setStep] = useState<number>(0);
    const steps = ["Basic Info", "Description", "Additional"];
    const workflowStepOptions = ["Draft", "Review", "Approval", "Finalized"];

    const handleDelete = useCallback(
        (id: string) => {
            confirm("Are you sure ?", async () => {
                const removed = await hrSettingsService.remove(
                    "positions",
                    id,
                    userData?.uid ?? "",
                    JOB_MANAGEMENT_LOG_MESSAGES.POSITION_DELETED(id),
                );

                if (removed) {
                    showToast("Position deleted successfully", "Success", "success");
                } else {
                    showToast("Error deleting position", "Error", "error");
                }
            });
        },
        [confirm, showToast, userData?.uid],
    );

    const columns: ColumnDef[] = useMemo(
        () => [
            { key: "name", header: "Position Name" },
            {
                key: "grade",
                header: "Grade",
                render: (row: PositionDefinitionModel) =>
                    hrSettings.grades?.find(grade => grade.id === row.grade)?.grade ?? "",
            },
            { key: "band", header: "Band" },
            { key: "startDate", header: "Start Date" },
            { key: "endDate", header: "End Date" },
            {
                key: "active",
                header: "Active",
                render: row => (
                    <Badge
                        className={
                            row.active === "Yes"
                                ? "bg-green-100 text-green-800 border-green-200"
                                : "bg-gray-100 text-gray-800"
                        }
                    >
                        {row.active}
                    </Badge>
                ),
                align: "center",
            },
            {
                key: "critical",
                header: "Critical",
                render: row => (
                    <Badge
                        className={
                            row.critical === "Yes"
                                ? "bg-red-100 text-red-800 border-red-200"
                                : "bg-gray-100 text-gray-800"
                        }
                    >
                        {row.critical}
                    </Badge>
                ),
                align: "center",
            },
            {
                key: "actions",
                header: "Actions",
                render: row => (
                    <div className="flex items-center gap-2">
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={event => {
                                event.stopPropagation();
                                setMode("edit");
                                setForm({ ...(row as PositionDefinitionModel) });
                                setStep(0);
                                setOpen(true);
                            }}
                        >
                            Edit
                        </Button>
                        <Button
                            size="sm"
                            variant="destructive"
                            onClick={event => {
                                event.stopPropagation();
                                handleDelete(row.id as string);
                            }}
                        >
                            Delete
                        </Button>
                    </div>
                ),
            },
        ],
        [handleDelete, hrSettings.grades],
    );

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
        setStep(0);
        setOpen(true);
    }

    function handleRowClick(row: unknown) {
        setMode("edit");
        setForm({ ...(row as PositionDefinitionModel) });
        setStep(0);
        setOpen(true);
    }

    async function handleSave() {
        if (!form) return;

        setSaveLoading(true);
        const { id, createdAt: _createdAt, updatedAt: _updatedAt, ...newData } = form;

        try {
            if (mode === "add") {
                const createdId = await hrSettingsService.create(
                    "positions",
                    newData as Partial<FormState>,
                    userData?.uid ?? "",
                    JOB_MANAGEMENT_LOG_MESSAGES.POSITION_CREATED(newData),
                );

                if (createdId) {
                    showToast("Position created successfully", "Success", "success");
                    setOpen(false);
                } else {
                    showToast("Error creating position", "Error", "error");
                }
            } else {
                const updated = await hrSettingsService.update(
                    "positions",
                    id,
                    newData,
                    userData?.uid ?? "",
                    JOB_MANAGEMENT_LOG_MESSAGES.POSITION_UPDATED({ id, ...newData }),
                );

                if (updated) {
                    showToast("Position updated successfully", "Success", "success");
                    setOpen(false);
                } else {
                    showToast("Error updating position", "Error", "error");
                }
            }
        } finally {
            setSaveLoading(false);
        }
    }

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
                workflowStepOptions={workflowStepOptions}
                stepSelectValue={stepSelectValue}
                handleSave={handleSave}
                saveLoading={saveLoading}
            />
            {ConfirmDialog}
        </div>
    );
}
