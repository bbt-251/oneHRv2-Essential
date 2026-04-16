"use client";
import { useState } from "react";
import type React from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Clock,
    FileText,
    Users,
    BookOpen,
    Plus,
    Edit,
    Trash2,
    Eye,
    Search,
    MoreVertical,
    Check,
    X,
} from "lucide-react";
import { TrainingMaterialRequestModel } from "@/lib/models/training-material";
import { useFirestore } from "@/context/firestore-context";
import { useToast } from "@/context/toastContext";
import {
    createTrainingMaterial,
    deleteTrainingMaterial,
    HRApproveTrainingMaterial,
    HRRefuseTrainingMaterial,
    updateTrainingMaterial,
} from "@/lib/backend/api/training/training-material-services";
import { useAuth } from "@/context/authContext";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter } from "next/navigation";
import { AddTrainingMaterialRequest } from "./blocks/add-training-material-request";
import TrainingRequestMaterialDetail from "../../modals/training-material-detail/training-request-material-detail";
import { getCategoryDisplayString } from "@/lib/utils";

export function TrainingMaterialRequest() {
    const { trainingMaterials, hrSettings } = useFirestore();
    const { userData } = useAuth();

    const trainingMaterial = trainingMaterials.filter(
        request => request.approvalStatus === "Awaiting HR Approval" || "Approved",
    );

    const { activeEmployees } = useFirestore();
    const { showToast } = useToast();
    const router = useRouter();

    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [selectedRequest, setSelectedRequest] = useState<TrainingMaterialRequestModel | null>(
        null,
    );
    const [isViewModalOpen, setIsViewModalOpen] = useState<boolean>(false);
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false);
    const [deleteId, setDeleteId] = useState<string | null>(null);

    const [isRefuseDialogOpen, setIsRefuseDialogOpen] = useState<boolean>(false);
    const [refuseComments, setRefuseComments] = useState<string>("");
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const [isApproveDialogOpen, setIsApproveDialogOpen] = useState<boolean>(false);
    const [approveComments, setApproveComments] = useState<string>("");

    const handleCreate = async (
        newRequest: Omit<TrainingMaterialRequestModel, "id">,
    ): Promise<boolean> => {
        try {
            await createTrainingMaterial(newRequest, userData?.uid ?? "");
            return true;
        } catch (error) {
            console.error("Failed to create request:", error);
            return false;
        }
    };

    const handleAddNew = () => {
        setSelectedRequest(null);
        setIsModalOpen(true);
    };

    const handleEdit = (request: TrainingMaterialRequestModel) => {
        setSelectedRequest(request);
        setIsModalOpen(true);
    };

    const handleUpdate = async (updatedRequest: TrainingMaterialRequestModel) => {
        try {
            if (!selectedRequest) return;
            const success = await updateTrainingMaterial(updatedRequest, userData?.uid ?? "");
            if (success) {
                showToast("Request updated successfully", "success", "success");
            }
        } catch (error) {
            showToast("Failed to update request", "error", "error");
        } finally {
            setIsModalOpen(false);
            setSelectedRequest(null);
        }
    };

    const handleDelete = async (id: string) => {
        setDeleteId(id);
        setIsDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (!deleteId) return;

        const materialToDelete = trainingMaterials.find(m => m.id === deleteId);
        try {
            const success = await deleteTrainingMaterial(deleteId, userData?.uid ?? "");
            if (success) {
                showToast("Request deleted successfully", "success", "success");
            } else {
                showToast("Failed to delete request", "error", "error");
            }
        } catch (error) {
            showToast("An error occurred while deleting the request", "error", "error");
        } finally {
            setIsDeleteDialogOpen(false);
            setDeleteId(null);
        }
    };

    const handleView = (request: TrainingMaterialRequestModel) => {
        setSelectedRequest(request);
        setIsViewModalOpen(true);
    };

    const handleApprove = async () => {
        if (!selectedRequest?.id) {
            return;
        }

        setIsLoading(true);
        try {
            const success = await HRApproveTrainingMaterial(
                selectedRequest.id,
                approveComments,
                userData?.uid ?? "",
            );

            if (success) {
                showToast("Training material approved successfully", "success", "success");
            } else {
                throw new Error("Failed to approve training material");
            }
        } catch (error) {
            console.error("Error approving training material:", error);
            showToast("Failed to approve training material", "error", "error");
        } finally {
            setIsLoading(false);
            setIsApproveDialogOpen(false);
            setApproveComments("");
        }
    };

    const handleRefuse = async () => {
        if (!selectedRequest?.id) {
            return;
        }

        setIsLoading(true);
        try {
            const success = await HRRefuseTrainingMaterial(
                selectedRequest.id,
                refuseComments,
                userData?.uid ?? "",
            );

            if (success) {
                showToast("Training material Refuse successfully", "success", "success");
            } else {
                throw new Error("Failed to Refuse training material");
            }
        } catch (error) {
            console.error("Error Refusing training material:", error);
            showToast("Failed to Refuse training material", "error", "error");
        } finally {
            setIsLoading(false);
            setIsRefuseDialogOpen(false);
            setRefuseComments("");
        }
    };

    const filteredRequests = trainingMaterial.filter(
        request =>
            request.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            request.createdBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
            request.category.some(cat => cat.toLowerCase().includes(searchTerm.toLowerCase())),
    );

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="border-accent-200 dark:border-border">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg font-semibold text-brand-800 dark:text-foreground flex items-center gap-2">
                            <FileText className="h-5 w-5 text-brand-500" />
                            Total Requests
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-brand-700 dark:text-foreground mb-2">
                            {trainingMaterial.length}
                        </div>
                        <p className="text-sm text-brand-600 dark:text-muted-foreground">
                            All time
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-accent-200 dark:border-border">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg font-semibold text-brand-800 dark:text-foreground flex items-center gap-2">
                            <Clock className="h-5 w-5 text-orange-500" />
                            Pending
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-orange-600 mb-2">
                            {
                                trainingMaterial.filter(r => r.approvalStatus.includes("Awaiting"))
                                    .length
                            }
                        </div>
                        <p className="text-sm text-brand-600 dark:text-muted-foreground">
                            Awaiting approval
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-accent-200 dark:border-border">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg font-semibold text-brand-800 dark:text-foreground flex items-center gap-2">
                            <BookOpen className="h-5 w-5 text-green-500" />
                            Approved
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-green-600 mb-2">
                            {trainingMaterial.filter(r => r.approvalStatus === "Approved").length}
                        </div>
                        <p className="text-sm text-brand-600 dark:text-muted-foreground">
                            Ready for use
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-accent-200 dark:border-border">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg font-semibold text-brand-800 dark:text-foreground flex items-center gap-2">
                            <Users className="h-5 w-5 text-blue-500" />
                            In Progress
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-blue-600 mb-2">
                            {trainingMaterial.filter(r => r.status === "In Progress").length}
                        </div>
                        <p className="text-sm text-brand-600 dark:text-muted-foreground">
                            Active training
                        </p>
                    </CardContent>
                </Card>
            </div>
            <Card className="border-accent-200 dark:border-border">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-xl font-semibold text-brand-800 dark:text-foreground">
                            Training Material Requests
                        </CardTitle>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                className="border-brand-600 text-brand-600 hover:bg-brand-50 bg-transparent"
                                onClick={() => router.push("quiz-management")}
                            >
                                <BookOpen className="h-4 w-4 mr-2" />
                                Quiz Management
                            </Button>
                            <Button
                                className="bg-brand-600 hover:bg-brand-700 text-white"
                                onClick={handleAddNew}
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Add New Request
                            </Button>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2 mt-4">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                            <Input
                                placeholder="Search requests..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Created By</TableHead>
                                    <TableHead>Category</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Approval Status</TableHead>
                                    <TableHead>Medium</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {trainingMaterial.length === 0 ? (
                                    <TableRow>
                                        <TableCell
                                            colSpan={7}
                                            className="text-center py-4 text-muted-foreground"
                                        >
                                            No training material requests found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredRequests.map(request => (
                                        <TableRow key={request.id}>
                                            <TableCell className="font-medium">
                                                {request.name}
                                            </TableCell>
                                            <TableCell>
                                                {
                                                    activeEmployees.find(
                                                        emp => emp.uid === request.createdBy,
                                                    )?.firstName
                                                }
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-wrap gap-1">
                                                    {request.category
                                                        .slice(0, 2)
                                                        .map((cat, index) => (
                                                            <Badge
                                                                key={index}
                                                                variant="secondary"
                                                                className="text-xs"
                                                            >
                                                                {getCategoryDisplayString(
                                                                    request.category,
                                                                    hrSettings.tmCategories,
                                                                )}
                                                            </Badge>
                                                        ))}
                                                    {request.category.length > 2 && (
                                                        <Badge
                                                            variant="outline"
                                                            className="text-xs"
                                                        >
                                                            +{request.category.length - 2}
                                                        </Badge>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={
                                                        request.status === "Completed"
                                                            ? "default"
                                                            : request.status === "In Progress"
                                                                ? "secondary"
                                                                : "outline"
                                                    }
                                                >
                                                    {request.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={
                                                        request.approvalStatus === "Approved"
                                                            ? "default"
                                                            : request.approvalStatus.includes(
                                                                "Awaiting",
                                                            )
                                                                ? "secondary"
                                                                : "destructive"
                                                    }
                                                >
                                                    {request.approvalStatus}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline">{request.medium}</Badge>
                                            </TableCell>
                                            <TableCell>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-8 w-8 p-0"
                                                        >
                                                            <MoreVertical className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem
                                                            onClick={() => handleView(request)}
                                                            className="cursor-pointer"
                                                        >
                                                            <Eye className="mr-2 h-4 w-4" />
                                                            View
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() => handleEdit(request)}
                                                            className="cursor-pointer"
                                                        >
                                                            <Edit className="mr-2 h-4 w-4" />
                                                            Edit
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() => {
                                                                setSelectedRequest(request);
                                                                setIsApproveDialogOpen(true);
                                                            }}
                                                            disabled={
                                                                isLoading ||
                                                                request.approvalStatus ===
                                                                    "Approved" ||
                                                                request.approvalStatus === "Refused"
                                                            }
                                                            className="cursor-pointer text-green-600"
                                                        >
                                                            <Check className="mr-2 h-4 w-4" />
                                                            Approve
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() => {
                                                                setSelectedRequest(request);
                                                                setIsRefuseDialogOpen(true);
                                                            }}
                                                            disabled={
                                                                isLoading ||
                                                                request.approvalStatus ===
                                                                    "Approved" ||
                                                                request.approvalStatus === "Refused"
                                                            }
                                                            className="cursor-pointer text-orange-600"
                                                        >
                                                            <X className="mr-2 h-4 w-4" />
                                                            Refuse
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() =>
                                                                handleDelete(request.id!)
                                                            }
                                                            className="cursor-pointer text-red-600"
                                                        >
                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                            Delete
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            <AddTrainingMaterialRequest
                isModalOpen={isModalOpen}
                setIsModalOpen={setIsModalOpen}
                selectedRequest={selectedRequest}
                handleCreate={handleCreate}
                handleUpdate={handleUpdate}
            />

            <TrainingRequestMaterialDetail
                isViewModalOpen={isViewModalOpen}
                setIsViewModalOpen={setIsViewModalOpen}
                selectedRequest={selectedRequest}
            />
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Are you sure?</DialogTitle>
                        <DialogDescription>
                            This action cannot be undone. This will permanently delete the training
                            material request.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={confirmDelete}>
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* refuse dialog */}
            <Dialog open={isRefuseDialogOpen} onOpenChange={setIsRefuseDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Refuse Training Material</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to refuse this training material? Please provide a
                            reason for refusal.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <label htmlFor="refuseComments" className="text-sm font-medium">
                                Reason for Refusal{" "}
                                <span className="text-muted-foreground">Optional</span>
                            </label>
                            <textarea
                                id="refuseComments"
                                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                placeholder="Enter reason for refusal..."
                                value={refuseComments}
                                onChange={e => setRefuseComments(e.target.value)}
                                required
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setIsRefuseDialogOpen(false);
                                setRefuseComments("");
                            }}
                            disabled={isLoading}
                        >
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleRefuse} disabled={isLoading}>
                            {isLoading ? "Refusing..." : "Refuse"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* approve dialog */}
            <Dialog open={isApproveDialogOpen} onOpenChange={setIsApproveDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Approve Training Material</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to approve this training material? Please provide
                            a reason for approval.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <label htmlFor="approveComments" className="text-sm font-medium">
                                Reason for Approval{" "}
                                <span className="text-muted-foreground">Optional</span>
                            </label>
                            <textarea
                                id="approveComments"
                                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                placeholder="Enter reason for approval..."
                                value={approveComments}
                                onChange={e => setApproveComments(e.target.value)}
                                required
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setIsApproveDialogOpen(false);
                                setApproveComments("");
                            }}
                            disabled={isLoading}
                        >
                            Cancel
                        </Button>
                        <Button variant="default" onClick={handleApprove} disabled={isLoading}>
                            {isLoading ? "Approving..." : "Approve"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
