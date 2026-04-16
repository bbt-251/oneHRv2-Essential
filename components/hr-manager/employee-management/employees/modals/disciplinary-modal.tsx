"use client";

import type React from "react";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertTriangle, Plus, Edit, Trash2 } from "lucide-react";
import { EmployeeModel } from "@/lib/models/employee";
import { DisciplinaryActionModel } from "@/lib/models/disciplinary-action";
import { useFirestore } from "@/context/firestore-context";
import { useAuth } from "@/context/authContext";
import { useConfirm } from "@/hooks/use-confirm-dialog";
import { useToast } from "@/context/toastContext";
import { deleteDisciplinaryAction } from "@/lib/backend/api/disciplinary-actions/disciplinary-actions-service";
import { DISCIPLINARY_ACTION_LOG_MESSAGES } from "@/lib/log-descriptions/disciplinary-actions";
import { DisciplinaryActionModal } from "@/components/common/disciplinary-actions/modals/action-modal";

interface DisciplinaryModalProps {
    isOpen: boolean;
    employee: EmployeeModel;
    onClose: () => void;
}

export function DisciplinaryModal({ isOpen, employee, onClose }: DisciplinaryModalProps) {
    const { disciplinaryActions: allDisciplinaryActions, hrSettings } = useFirestore();
    const { userData } = useAuth();
    const { showToast } = useToast();
    const { confirm, ConfirmDialog } = useConfirm();

    // Filter disciplinary actions for this specific employee
    const employeeDisciplinaryActions = allDisciplinaryActions.filter(
        action => action.employeeUid === employee.uid,
    );

    const [showActionModal, setShowActionModal] = useState<boolean>(false);
    const [editingAction, setEditingAction] = useState<DisciplinaryActionModel | null>(null);

    const handleAddAction = () => {
        setEditingAction(null);
        setShowActionModal(true);
    };

    const handleEditAction = (action: DisciplinaryActionModel) => {
        setEditingAction(action);
        setShowActionModal(true);
    };

    const handleSaveAction = async (action: DisciplinaryActionModel) => {
        setShowActionModal(false);
        setEditingAction(null);
        showToast("Disciplinary action saved successfully", "Success", "success");
    };

    const handleDeleteAction = async (id: string) => {
        confirm(
            "Are you sure you want to delete this disciplinary action? This action cannot be undone.",
            async () => {
                const action = employeeDisciplinaryActions.find(a => a.id === id);
                const result = await deleteDisciplinaryAction(
                    id,
                    userData?.uid ?? "",
                    DISCIPLINARY_ACTION_LOG_MESSAGES.DELETED({
                        id: id,
                        employeeUid: action?.employeeUid || "",
                        actionID: action?.actionID || "",
                    }),
                );

                if (result) {
                    showToast("Disciplinary action deleted successfully", "Success", "success");
                } else {
                    showToast("Error deleting disciplinary action", "Error", "error");
                }
            },
        );
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "Waiting HR Approval":
                return "bg-orange-100 text-orange-800";
            case "Raised":
                return "bg-yellow-100 text-yellow-800";
            case "Approved":
                return "bg-green-100 text-green-800";
            case "Rejected":
                return "bg-red-100 text-red-800";
            case "Appealed":
                return "bg-blue-100 text-blue-800";
            case "Appeal Approved":
                return "bg-purple-100 text-purple-800";
            case "Appeal Refused":
                return "bg-pink-100 text-pink-800";
            default:
                return "bg-gray-100 text-gray-800";
        }
    };

    const getStageColor = (stage: string) => {
        return stage === "Open" ? "bg-orange-100 text-orange-800" : "bg-gray-100 text-gray-800";
    };

    const getOccurrenceColor = (level: string) => {
        switch (level) {
            case "First Occurrence":
                return "bg-green-100 text-green-800";
            case "Second Occurrence":
                return "bg-yellow-100 text-yellow-800";
            case "Third Occurrence":
                return "bg-red-100 text-red-800";
            default:
                return "bg-gray-100 text-gray-800";
        }
    };

    return (
        <>
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden">
                    <DialogHeader className="flex-shrink-0">
                        <div className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5 text-primary-600" />
                                <DialogTitle className="text-xl font-semibold text-primary-900">
                                    Disciplinary Actions
                                </DialogTitle>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="p-6">
                        <div className="bg-secondary-50 p-4 rounded-lg mb-6">
                            <p className="text-sm text-primary-800">
                                <strong>Employee:</strong> {employee.firstName} {employee.surname} (
                                {employee.employeeID})
                            </p>
                        </div>

                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-primary-900">
                                Disciplinary Records
                            </h3>
                            <Button
                                onClick={handleAddAction}
                                className="bg-primary-600 hover:bg-primary-700"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Add Action
                            </Button>
                        </div>

                        <div className="border border-gray-200 rounded-lg overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-secondary-100">
                                        <TableHead>Action ID</TableHead>
                                        <TableHead>Reported Date</TableHead>
                                        <TableHead>Violation Date</TableHead>
                                        <TableHead>Location</TableHead>
                                        <TableHead>Occurrence</TableHead>
                                        <TableHead>Stage</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {employeeDisciplinaryActions.length === 0 ? (
                                        <TableRow>
                                            <TableCell
                                                colSpan={8}
                                                className="text-center py-4 text-muted-foreground"
                                            >
                                                No disciplinary actions found
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        employeeDisciplinaryActions.map(action => (
                                            <TableRow key={action.id}>
                                                <TableCell className="font-mono text-sm">
                                                    {action.actionID}
                                                </TableCell>
                                                <TableCell>
                                                    {new Date(
                                                        action.reportedDateAndTime,
                                                    ).toLocaleDateString()}
                                                </TableCell>
                                                <TableCell>
                                                    {new Date(
                                                        action.violationDateAndTime,
                                                    ).toLocaleDateString()}
                                                </TableCell>
                                                <TableCell>
                                                    {(() => {
                                                        const location = hrSettings.locations.find(
                                                            loc =>
                                                                loc.id ===
                                                                action.violationLocationId,
                                                        );
                                                        return location
                                                            ? location.name
                                                            : action.violationLocationId;
                                                    })()}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        className={getOccurrenceColor(
                                                            action.occurrenceLevel,
                                                        )}
                                                    >
                                                        {action.occurrenceLevel}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge className={getStageColor(action.stage)}>
                                                        {action.stage}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        className={getStatusColor(action.status)}
                                                    >
                                                        {action.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleEditAction(action)}
                                                        >
                                                            <Edit className="w-4 h-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() =>
                                                                action.id &&
                                                                handleDeleteAction(action.id)
                                                            }
                                                            className="text-red-600"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <DisciplinaryActionModal
                isOpen={showActionModal}
                onClose={() => {
                    setShowActionModal(false);
                    setEditingAction(null);
                }}
                onSave={handleSaveAction}
                editingAction={editingAction}
                viewOnly={false}
                HRView={true}
            />

            {ConfirmDialog}
        </>
    );
}
