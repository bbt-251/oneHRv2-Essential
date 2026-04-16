"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { X, Users, Plus, Edit, Trash2, Eye } from "lucide-react";
import { DependentModel } from "@/lib/models/dependent";
import { EmployeeModel } from "@/lib/models/employee";
import { AddDependentModal } from "./add-dependent-modal";
import { EditDependentModal } from "./edit-dependent-modal";
import { ViewDependentDetailModal } from "./view-dependent-detail-modal";
import { useToast } from "@/context/toastContext";
import { deleteDependent } from "@/lib/backend/api/employee-management/dependent-service";
import { EMPLOYEE_MANAGEMENT_LOG_MESSAGES } from "@/lib/log-descriptions/employee-management";
import { useAuth } from "@/context/authContext";
import { useFirestore } from "@/context/firestore-context";

interface DependentsModalProps {
    employee: EmployeeModel;
    onClose: () => void;
}

export function DependentsModal({ employee, onClose }: DependentsModalProps) {
    const { showToast } = useToast();
    const { userData } = useAuth();
    const { dependents, loading: dependentsLoading, error: dependentsError } = useFirestore();
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Modal states
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [selectedDependent, setSelectedDependent] = useState<DependentModel | null>(null);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);

    // Filter dependents for this employee
    useEffect(() => {
        setIsLoading(dependentsLoading);
        setError(dependentsError);

        if (dependentsError) {
            showToast(dependentsError, "error", "error");
        } else if (!dependentsLoading) {
            setIsLoading(false);
        }
    }, [dependentsLoading, dependentsError]);

    const handleAddSuccess = () => {
        setShowAddModal(false);
        showToast("Dependent added successfully", "success", "success");
    };

    const handleEditSuccess = () => {
        setShowEditModal(false);
        setSelectedDependent(null);
        showToast("Dependent updated successfully", "success", "success");
    };

    const handleDelete = async (dependent: DependentModel) => {
        try {
            const dependentName = `${dependent.firstName} ${dependent.lastName}`;
            const employeeName = `${employee.firstName} ${employee.surname}`;
            await deleteDependent(
                dependent.id!,
                userData?.uid ?? "",
                EMPLOYEE_MANAGEMENT_LOG_MESSAGES.DEPENDENT_DELETED(
                    dependentName,
                    dependent.relationship,
                    employeeName,
                ),
            );
            showToast("Dependent deleted successfully", "success", "success");
        } catch (error) {
            console.error("Error deleting dependent:", error);
            showToast("Failed to delete dependent", "error", "error");
        }
    };

    const handleDeleteClick = (dependent: DependentModel) => {
        setSelectedDependent(dependent);
        setShowDeleteDialog(true);
    };

    const handleViewDependent = (dependent: DependentModel) => {
        setSelectedDependent(dependent);
        setShowViewModal(true);
    };

    const handleEditDependent = (dependent: DependentModel) => {
        setSelectedDependent(dependent);
        setShowEditModal(true);
    };

    return (
        <>
            <Dialog open={true} onOpenChange={onClose}>
                <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden p-0">
                    <DialogHeader className="p-6 border-b">
                        <div className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-2">
                                <Users className="w-5 h-5" />
                                <DialogTitle>
                                    Dependents For {employee.firstName} {employee.surname}
                                </DialogTitle>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-primary-900">
                                Dependents ({dependents.length})
                            </h3>
                            <Button
                                onClick={() => setShowAddModal(true)}
                                className="bg-primary-600 hover:bg-primary-700"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Add Dependent
                            </Button>
                        </div>

                        {error && (
                            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
                                <p className="text-red-700">{error}</p>
                            </div>
                        )}

                        <div className="border border-gray-200 rounded-lg overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow className="">
                                        <TableHead>Dependent ID</TableHead>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Relationship</TableHead>
                                        <TableHead>Date of Birth</TableHead>
                                        <TableHead>Gender</TableHead>
                                        <TableHead>Phone Number</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {dependents.map(dependent => (
                                        <TableRow key={dependent.id} className="cursor-pointer">
                                            <TableCell className="font-mono text-sm">
                                                {dependent.dependentID}
                                            </TableCell>
                                            <TableCell className="font-medium">
                                                {dependent.firstName}{" "}
                                                {dependent.middleName
                                                    ? dependent.middleName + " "
                                                    : ""}{" "}
                                                {dependent.lastName}
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    className={
                                                        dependent.relationship === "Spouse"
                                                            ? "bg-pink-100 text-pink-800"
                                                            : "bg-blue-100 text-blue-800"
                                                    }
                                                >
                                                    {dependent.relationship}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>{dependent.dateOfBirth}</TableCell>
                                            <TableCell>{dependent.gender}</TableCell>
                                            <TableCell className="text-sm">
                                                {dependent.phoneNumber}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={e => {
                                                            e.stopPropagation();
                                                            handleViewDependent(dependent);
                                                        }}
                                                        title="View details"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={e => {
                                                            e.stopPropagation();
                                                            handleEditDependent(dependent);
                                                        }}
                                                        title="Edit"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </Button>
                                                    <AlertDialog
                                                        open={showDeleteDialog}
                                                        onOpenChange={setShowDeleteDialog}
                                                    >
                                                        <AlertDialogTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={e => {
                                                                    e.stopPropagation();
                                                                    handleDeleteClick(dependent);
                                                                }}
                                                                className="text-red-600"
                                                                title="Delete"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </Button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>
                                                                    Delete Dependent
                                                                </AlertDialogTitle>
                                                                <AlertDialogDescription>
                                                                    Are you sure you want to delete{" "}
                                                                    {selectedDependent?.firstName}{" "}
                                                                    {selectedDependent?.lastName}?
                                                                    This action cannot be undone.
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>
                                                                    Cancel
                                                                </AlertDialogCancel>
                                                                <AlertDialogAction
                                                                    onClick={e => {
                                                                        e.stopPropagation();
                                                                        if (selectedDependent) {
                                                                            handleDelete(
                                                                                selectedDependent,
                                                                            );
                                                                        }
                                                                        setShowDeleteDialog(false);
                                                                    }}
                                                                    className="bg-red-600 hover:bg-red-700"
                                                                >
                                                                    Delete
                                                                </AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>

                        {dependents.length === 0 && !isLoading && (
                            <div className="text-center py-8 text-muted-foreground">
                                <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                <p>No dependents added yet.</p>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Modal Components */}
            <AddDependentModal
                employeeUid={employee.uid}
                employeeName={`${employee.firstName} ${employee.surname}`}
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                onSuccess={handleAddSuccess}
            />

            <EditDependentModal
                dependent={selectedDependent}
                isOpen={showEditModal}
                onClose={() => {
                    setShowEditModal(false);
                    setSelectedDependent(null);
                }}
                onSuccess={handleEditSuccess}
            />

            <ViewDependentDetailModal
                dependent={selectedDependent}
                isOpen={showViewModal}
                onClose={() => {
                    setShowViewModal(false);
                    setSelectedDependent(null);
                }}
                onEdit={() => {
                    setShowViewModal(false);
                    setShowEditModal(true);
                }}
                onDelete={() => {
                    if (selectedDependent) {
                        handleDelete(selectedDependent);
                        setShowViewModal(false);
                        setSelectedDependent(null);
                    }
                }}
            />
        </>
    );
}
