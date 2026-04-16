"use client";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/context/authContext";
import { useFirestore } from "@/context/firestore-context";
import { useToast } from "@/context/toastContext";
import {
    createTrainingMaterial,
    deleteTrainingMaterial,
    updateTrainingMaterial,
} from "@/lib/backend/api/training/training-material-services";
import { TrainingMaterialRequestModel } from "@/lib/models/training-material";
import {
    BookOpen,
    Check,
    Clock,
    Edit,
    Eye,
    FileText,
    MoreVertical,
    Plus,
    Search,
    Send,
    Trash2,
    Users,
    X,
} from "lucide-react";
import { useRouter } from "next/navigation";

import { isAssigned } from "@/components/employee/training-management/employee-learning";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { sendNotification } from "@/lib/util/notification/send-notification";
import { getCategoryDisplayString } from "@/lib/utils";
import TrainingRequestMaterialDetail from "../../modals/training-material-detail/training-request-material-detail";
import { TrainingMetricsModal } from "../../modals/training-metrics";
import { TraineeStatsModal } from "../../modals/training-stats";
import { AddTrainingMaterialRequest } from "../training-material-request/blocks/add-training-material-request";

export function TrainingMaterial() {
    const { employees, trainingMaterials, hrSettings, surveys } = useFirestore();
    const { userData } = useAuth();

    const getCategoryName = (catId: string) => {
        const category = hrSettings.tmCategories.find(dept => dept.id === catId);
        return category?.name || "-";
    };

    const { showToast } = useToast();
    const router = useRouter();

    const trainingMaterial = trainingMaterials.filter(
        request => request.approvalStatus === "Approved",
    );

    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [selectedRequest, setSelectedRequest] = useState<TrainingMaterialRequestModel | null>(
        null,
    );
    const [isViewModalOpen, setIsViewModalOpen] = useState<boolean>(false);
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [isSendSurveyModalOpen, setIsSendSurveyModalOpen] = useState<boolean>(false);
    const [selectedSurveyIds, setSelectedSurveyIds] = useState<string[]>([]);
    const [currentTrainingMaterial, setCurrentTrainingMaterial] =
        useState<TrainingMaterialRequestModel | null>(null);
    const [isTraineeStatsModalOpen, setIsTraineeStatsModalOpen] = useState<boolean>(false);
    const [selectedTrainingMaterialForStats, setSelectedTrainingMaterialForStats] =
        useState<TrainingMaterialRequestModel | null>(null);
    const [isTrainingMetricsModalOpen, setIsTrainingMetricsModalOpen] = useState<boolean>(false);
    const [selectedTrainingMaterialForMetrics, setSelectedTrainingMaterialForMetrics] =
        useState<TrainingMaterialRequestModel | null>(null);

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

    const handleApprove = async (id: string) => {
        console.log("Approve", id);
    };

    const handleRefuse = async (id: string) => {
        console.log("Refuse", id);
    };

    const handlePublish = async (request: TrainingMaterialRequestModel) => {
        const res = await updateTrainingMaterial(
            { id: request.id, publishState: true },
            userData?.uid ?? "",
        );
        if (res) {
            showToast("Training material published successfully", "success", "success");

            // Send notification to assigned employees
            const assignedEmployees = employees.filter(emp => isAssigned(request, emp));
            const notificationUsers = assignedEmployees.map(emp => ({
                uid: emp.uid,
                email: emp.companyEmail || emp.personalEmail || "",
                telegramChatID: emp.telegramChatID || "",
                recipientType: "employee" as const,
            }));

            if (notificationUsers.length > 0) {
                await sendNotification({
                    users: notificationUsers,
                    channels: ["inapp", "telegram"],
                    messageKey: "TRAINING_MATERIAL_PUBLISHED",
                    payload: {
                        trainingMaterialName: request.name,
                    },
                    title: "Training Material Published",
                });
            }
        } else {
            showToast("Failed to publish training material", "error", "error");
        }
    };

    const handleUnpublish = async (request: TrainingMaterialRequestModel) => {
        const res = await updateTrainingMaterial(
            { id: request.id, publishState: false },
            userData?.uid ?? "",
        );
        if (res) {
            showToast("Training material unpublished successfully", "success", "success");
        } else {
            showToast("Failed to unpublish training material", "error", "error");
        }
    };

    const handleSendSurvey = (request: TrainingMaterialRequestModel) => {
        setCurrentTrainingMaterial(request);
        setSelectedSurveyIds(request.sentSurveyIDs || []);
        setIsSendSurveyModalOpen(true);
    };

    const handleSendSurveySubmit = async () => {
        if (!currentTrainingMaterial) return;

        try {
            const success = await updateTrainingMaterial(
                {
                    id: currentTrainingMaterial.id,
                    sentSurveyIDs: selectedSurveyIds,
                },
                userData?.uid ?? "",
            );
            if (success) {
                showToast("Surveys sent successfully", "success", "success");
                setIsSendSurveyModalOpen(false);
                setCurrentTrainingMaterial(null);
                setSelectedSurveyIds([]);
            } else {
                showToast("Failed to send surveys", "error", "error");
            }
        } catch (error) {
            showToast("An error occurred while sending surveys", "error", "error");
        }
    };

    const handleViewTrainingMetric = (request: TrainingMaterialRequestModel) => {
        setSelectedTrainingMaterialForMetrics(request);
        setIsTrainingMetricsModalOpen(true);
    };

    const handleTraineeStats = (request: TrainingMaterialRequestModel) => {
        setSelectedTrainingMaterialForStats(request);
        setIsTraineeStatsModalOpen(true);
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
                                onClick={() => router.push("/hr/quiz-management")}
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
                                                    employees.find(
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
                                                        {/* From your existing code */}
                                                        <DropdownMenuItem
                                                            onClick={() => handleEdit(request)}
                                                            className="cursor-pointer"
                                                        >
                                                            <Edit className="mr-2 h-4 w-4" />
                                                            Edit
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

                                                        {/* New actions based on the image */}
                                                        <DropdownMenuItem
                                                            onClick={() => handlePublish(request)}
                                                            className="cursor-pointer"
                                                            disabled={request.publishState}
                                                        >
                                                            <Check className="mr-2 h-4 w-4" />
                                                            Publish
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() => handleUnpublish(request)}
                                                            className="cursor-pointer"
                                                            disabled={!request.publishState}
                                                        >
                                                            <X className="mr-2 h-4 w-4" />
                                                            Unpublish
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() =>
                                                                handleSendSurvey(request)
                                                            }
                                                            className="cursor-pointer"
                                                        >
                                                            <Send className="mr-2 h-4 w-4" />
                                                            Send Survey
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() =>
                                                                handleViewTrainingMetric(request)
                                                            }
                                                            className="cursor-pointer"
                                                        >
                                                            <Eye className="mr-2 h-4 w-4" />
                                                            View training metric
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() =>
                                                                handleTraineeStats(request)
                                                            }
                                                            className="cursor-pointer"
                                                        >
                                                            <Eye className="mr-2 h-4 w-4" />
                                                            Trainee stats
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
                <Dialog open={isSendSurveyModalOpen} onOpenChange={setIsSendSurveyModalOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Send Surveys</DialogTitle>
                            <DialogDescription>
                                Select surveys to send for this training material.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-medium">Select Surveys</label>
                                <Select
                                    value=""
                                    onValueChange={value => {
                                        if (!selectedSurveyIds.includes(value)) {
                                            setSelectedSurveyIds([...selectedSurveyIds, value]);
                                        }
                                    }}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Choose surveys..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {surveys
                                            .filter(survey => survey.publishStatus === "Published")
                                            .filter(
                                                survey => !selectedSurveyIds.includes(survey.id),
                                            )
                                            .map(survey => (
                                                <SelectItem key={survey.id} value={survey.id}>
                                                    {survey.surveyTitle}
                                                </SelectItem>
                                            ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            {selectedSurveyIds.length > 0 && (
                                <div>
                                    <label className="text-sm font-medium">Selected Surveys</label>
                                    <div className="space-y-2 mt-2">
                                        {selectedSurveyIds.map(surveyId => {
                                            const survey = surveys.find(s => s.id === surveyId);
                                            return (
                                                <div
                                                    key={surveyId}
                                                    className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded"
                                                >
                                                    <span className="text-sm">
                                                        {survey?.surveyTitle || surveyId}
                                                    </span>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() =>
                                                            setSelectedSurveyIds(
                                                                selectedSurveyIds.filter(
                                                                    id => id !== surveyId,
                                                                ),
                                                            )
                                                        }
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                        <DialogFooter>
                            <Button
                                variant="outline"
                                onClick={() => setIsSendSurveyModalOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleSendSurveySubmit}
                                disabled={selectedSurveyIds.length === 0}
                            >
                                Send Surveys
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </Dialog>

            <TraineeStatsModal
                isOpen={isTraineeStatsModalOpen}
                onClose={() => setIsTraineeStatsModalOpen(false)}
                trainingMaterial={selectedTrainingMaterialForStats}
            />

            <TrainingMetricsModal
                isOpen={isTrainingMetricsModalOpen}
                onClose={() => setIsTrainingMetricsModalOpen(false)}
                trainingMaterial={selectedTrainingMaterialForMetrics}
            />
        </>
    );
}
