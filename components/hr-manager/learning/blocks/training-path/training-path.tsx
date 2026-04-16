"use client";
import { useState } from "react";
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
    Award,
    Plus,
    Edit,
    Trash2,
    Eye,
    Search,
    CheckCircle,
    Clock,
    Users,
    MoreVertical,
    X,
} from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { TrainingPathModel } from "@/lib/models/training-path";
import { useFirestore } from "@/context/firestore-context";
import {
    createTrainingPath,
    deleteTrainingPath,
    updateTrainingPath,
} from "@/lib/backend/api/training/training-path.services";
import { useToast } from "@/context/toastContext";
import { LEARNING_LOG_MESSAGES } from "@/lib/log-descriptions/learning";
import { useAuth } from "@/context/authContext";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import dayjs from "dayjs";
import { dateFormat } from "@/lib/util/dayjs_format";
import { AddTrainingPath } from "./modals/add-training-path";
import { ViewPathModal } from "./modals/view-path-modal";
import { getCategoryDisplayString } from "@/lib/utils";

export function TrainingPath() {
    const { trainingPaths, hrSettings } = useFirestore();
    const categories = hrSettings.tmCategories;
    const { showToast } = useToast();
    const { userData } = useAuth();

    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [selectedPath, setSelectedPath] = useState<TrainingPathModel | null>(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState<boolean>(false);
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [isPopoverOpen, setIsPopoverOpen] = useState<boolean>(false);

    const handleCreate = async (newPath: Omit<TrainingPathModel, "id">): Promise<boolean> => {
        try {
            await createTrainingPath(
                newPath,
                userData?.uid ?? "",
                LEARNING_LOG_MESSAGES.TRAINING_PATH_CREATED(newPath.name),
            );
            return true;
        } catch (error) {
            console.error("Failed to create path:", error);
            return false;
        }
    };
    const handleAddNew = () => {
        setSelectedPath(null);
        setIsModalOpen(true);
    };

    const handleEdit = (path: TrainingPathModel) => {
        setSelectedPath(path);
        setIsModalOpen(true);
    };

    const handleUpdate = async (updatedPath: TrainingPathModel) => {
        try {
            if (!selectedPath) return;
            const success = await updateTrainingPath(
                updatedPath,
                userData?.uid ?? "",
                LEARNING_LOG_MESSAGES.TRAINING_PATH_UPDATED(updatedPath.name),
            );
            if (success) {
                showToast("Path updated successfully", "success", "success");
            }
        } catch (error) {
            showToast("Failed to update path", "error", "error");
        } finally {
            setIsModalOpen(false);
            setSelectedPath(null);
        }
    };

    const handleDelete = async (id: string) => {
        setDeleteId(id);
        setIsDeleteDialogOpen(true);
    };
    const confirmDelete = async () => {
        if (!deleteId) return;

        const pathToDelete = trainingPaths.find(p => p.id === deleteId);
        try {
            const success = await deleteTrainingPath(
                deleteId,
                userData?.uid ?? "",
                LEARNING_LOG_MESSAGES.TRAINING_PATH_DELETED(pathToDelete?.name || ""),
            );
            if (success) {
                showToast("Path deleted successfully", "success", "success");
            } else {
                showToast("Failed to delete path", "error", "error");
            }
        } catch (error) {
            showToast("An error occurred while deleting the request", "error", "error");
        } finally {
            setIsDeleteDialogOpen(false);
            setDeleteId(null);
        }
    };

    const handleViewPath = (path: TrainingPathModel) => {
        setSelectedPath(path);
        setIsViewModalOpen(true);
    };

    const handleApprove = async (id: string) => {
        const pathToApprove = trainingPaths.find(p => p.id === id);
        try {
            const success = await updateTrainingPath(
                { id, status: "Approved" },
                userData?.uid ?? "",
                LEARNING_LOG_MESSAGES.TRAINING_PATH_APPROVED(pathToApprove?.name || ""),
            );
            if (success) {
                showToast("Training path approved successfully", "success", "success");
            } else {
                showToast("Failed to approve training path", "error", "error");
            }
        } catch (error) {
            showToast("An error occurred while approving the training path", "error", "error");
        }
    };

    const handleRefuse = async (id: string) => {
        const pathToRefuse = trainingPaths.find(p => p.id === id);
        try {
            const success = await updateTrainingPath(
                { id, status: "Refused" },
                userData?.uid ?? "",
                LEARNING_LOG_MESSAGES.TRAINING_PATH_REFUSED(pathToRefuse?.name || ""),
            );
            if (success) {
                showToast("Training path refused successfully", "success", "success");
            } else {
                showToast("Failed to refuse training path", "error", "error");
            }
        } catch (error) {
            showToast("An error occurred while refusing the training path", "error", "error");
        }
    };

    const filteredPaths = trainingPaths.filter(
        path =>
            path.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            path.category.some(cat => cat.toLowerCase().includes(searchTerm.toLowerCase())) ||
            path.status.toLowerCase().includes(searchTerm.toLowerCase()),
    );

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="border-accent-200 dark:border-border">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg font-semibold text-brand-800 dark:text-foreground flex items-center gap-2">
                            <Award className="h-5 w-5 text-brand-500" />
                            Total Paths
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-brand-700 dark:text-foreground mb-2">
                            {trainingPaths.length}
                        </div>
                        <p className="text-sm text-brand-600 dark:text-muted-foreground">
                            Training paths created
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-accent-200 dark:border-border">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg font-semibold text-brand-800 dark:text-foreground flex items-center gap-2">
                            <CheckCircle className="h-5 w-5 text-green-500" />
                            Approved
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-green-600 mb-2">
                            {trainingPaths.filter(path => path.status === "Approved").length}
                        </div>
                        <p className="text-sm text-brand-600 dark:text-muted-foreground">
                            Approved paths
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
                            {trainingPaths.filter(path => path.status === "Created").length}
                        </div>
                        <p className="text-sm text-brand-600 dark:text-muted-foreground">
                            Awaiting approval
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-accent-200 dark:border-border">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg font-semibold text-brand-800 dark:text-foreground flex items-center gap-2">
                            <Users className="h-5 w-5 text-blue-500" />
                            Avg Duration
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-blue-600 mb-2">
                            {trainingPaths.length > 0
                                ? Math.round(
                                    trainingPaths.reduce(
                                        (acc, path) => acc + path.estimatedDuration,
                                        0,
                                    ) / trainingPaths.length,
                                )
                                : 0}
                        </div>
                        <p className="text-sm text-brand-600 dark:text-muted-foreground">
                            Weeks average
                        </p>
                    </CardContent>
                </Card>
            </div>

            <Card className="border-accent-200 dark:border-border">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-xl font-semibold text-brand-800 dark:text-foreground">
                            Training Paths
                        </CardTitle>
                        <Button
                            className="bg-brand-600 hover:bg-brand-700 text-white"
                            onClick={() => handleAddNew()}
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Add New Path
                        </Button>
                    </div>
                    <div className="flex items-center space-x-2 mt-4">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                            <Input
                                placeholder="Search training paths..."
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
                                    <TableHead>Category</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Duration</TableHead>
                                    <TableHead>Audience</TableHead>
                                    <TableHead>Date Range</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredPaths.map(path => (
                                    <TableRow key={path.id}>
                                        <TableCell className="font-medium">{path.name}</TableCell>
                                        <TableCell>
                                            <div className="flex flex-wrap gap-1">
                                                <Badge variant="secondary" className="text-xs">
                                                    {getCategoryDisplayString(
                                                        path.category,
                                                        hrSettings.tmCategories,
                                                    )}
                                                </Badge>
                                                {path.category.length > 2 && (
                                                    <Badge variant="outline" className="text-xs">
                                                        +{path.category.length - 2}
                                                    </Badge>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={
                                                    path.status === "Approved"
                                                        ? "default"
                                                        : path.status === "Created"
                                                            ? "secondary"
                                                            : "destructive"
                                                }
                                            >
                                                {path.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{path.estimatedDuration} weeks</TableCell>
                                        <TableCell>
                                            <div className="flex flex-wrap gap-1">
                                                {path.audienceTarget
                                                    .slice(0, 1)
                                                    .map((audience, index) => (
                                                        <Badge
                                                            key={index}
                                                            variant="outline"
                                                            className="text-xs"
                                                        >
                                                            {audience}
                                                        </Badge>
                                                    ))}
                                                {path.audienceTarget.length > 1 && (
                                                    <Badge variant="outline" className="text-xs">
                                                        +{path.audienceTarget.length - 1}
                                                    </Badge>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-sm">
                                            {dayjs(path.dateRange[0]).format(dateFormat)} to{" "}
                                            {dayjs(path.dateRange[1]).format(dateFormat)}
                                        </TableCell>
                                        <TableCell className="text-right pl-0">
                                            <Popover
                                                open={isPopoverOpen}
                                                onOpenChange={setIsPopoverOpen}
                                            >
                                                <PopoverTrigger asChild>
                                                    <Button variant="ghost" size="sm">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-40 flex flex-col items-start pl-0 ml-0">
                                                    <div className="flex flex-col space-y-2">
                                                        <Button
                                                            variant="ghost"
                                                            className="flex justify-start"
                                                            size="sm"
                                                            onClick={() => {
                                                                handleViewPath(path);
                                                                setIsPopoverOpen(false);
                                                            }}
                                                        >
                                                            <Eye className="h-4 w-4 mr-2" />
                                                            View
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            className="flex justify-start"
                                                            size="sm"
                                                            onClick={() => {
                                                                handleEdit(path);
                                                                setIsPopoverOpen(false);
                                                            }}
                                                        >
                                                            <Edit className="h-4 w-4 mr-2" />
                                                            Edit
                                                        </Button>
                                                        <Button
                                                            disabled={path.status !== "Created"}
                                                            className="flex justify-start"
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => {
                                                                handleApprove(path.id!);
                                                                setIsPopoverOpen(false);
                                                            }}
                                                        >
                                                            <CheckCircle className="h-4 w-4 mr-2" />
                                                            Approve
                                                        </Button>
                                                        <Button
                                                            disabled={path.status !== "Created"}
                                                            className="flex justify-start"
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => {
                                                                handleRefuse(path.id!);
                                                                setIsPopoverOpen(false);
                                                            }}
                                                        >
                                                            <X className="h-4 w-4 mr-2" />
                                                            Refuse
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => {
                                                                handleDelete(path.id!);
                                                                setIsPopoverOpen(false);
                                                            }}
                                                            className="text-red-600 hover:text-red-700 flex justify-start"
                                                        >
                                                            <Trash2 className="h-4 w-4 mr-2" />
                                                            Delete
                                                        </Button>
                                                    </div>
                                                </PopoverContent>
                                            </Popover>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            <AddTrainingPath
                isModalOpen={isModalOpen}
                setIsModalOpen={setIsModalOpen}
                selectedPath={selectedPath}
                handleCreate={handleCreate}
                handleUpdate={handleUpdate}
            />

            <ViewPathModal
                isViewModalOpen={isViewModalOpen}
                setIsViewModalOpen={setIsViewModalOpen}
                selectedPath={selectedPath}
            />

            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Are you sure?</DialogTitle>
                        <DialogDescription>
                            This action cannot be undone. This will permanently delete the training
                            path.
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
        </div>
    );
}
