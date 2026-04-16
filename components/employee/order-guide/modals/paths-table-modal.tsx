"use client";

import { Route, BookOpen, Play, CheckCircle, Circle, Clock } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    TrainingPathModel,
    TrainingMaterialModel,
    PathProgress,
} from "@/lib/models/order-guide-and-order-item";
import dayjs from "dayjs";
import { useRouter } from "next/navigation";

interface PathsTableModalProps {
    isOpen: boolean;
    onClose: () => void;
    paths: TrainingPathModel[];
    allMaterials: TrainingMaterialModel[];
    onShowMaterials: (materialIds: string[]) => void;
    pathProgress?: PathProgress[];
    onUpdatePathProgress?: (pathId: string, status: "To Do" | "In Progress" | "Done") => void;
    orderGuideId?: string;
    employeeUid?: string;
}

export function PathsTableModal({
    isOpen,
    onClose,
    paths,
    allMaterials,
    onShowMaterials,
    pathProgress = [],
    onUpdatePathProgress,
    orderGuideId,
    employeeUid,
}: PathsTableModalProps) {
    const router = useRouter();

    // Get progress for a specific path
    const getPathProgress = (pathId: string): PathProgress | undefined => {
        return pathProgress.find(p => p.pathId === pathId);
    };

    // Get status badge styling
    const getStatusBadge = (status: string) => {
        switch (status) {
            case "Done":
                return "bg-green-100 text-green-800 border-green-300";
            case "In Progress":
                return "bg-blue-100 text-blue-800 border-blue-300";
            default:
                return "bg-gray-100 text-gray-800 border-gray-300";
        }
    };

    // Get status icon
    const getStatusIcon = (status: string) => {
        switch (status) {
            case "Done":
                return <CheckCircle className="h-4 w-4 text-green-600" />;
            case "In Progress":
                return <Clock className="h-4 w-4 text-blue-600" />;
            default:
                return <Circle className="h-4 w-4 text-gray-400" />;
        }
    };

    const getPathStatusBadge = (status: string) => {
        return <Badge>{status}</Badge>;
    };

    // Calculate completion stats
    const completedCount = pathProgress.filter(p => p.status === "Done").length;
    const totalCount = paths.length;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-6xl z-[100] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-xl font-semibold flex items-center gap-2">
                        <Route className="h-5 w-5" />
                        Training Paths
                        {totalCount > 0 && (
                            <Badge className="ml-2 bg-green-100 text-green-800">
                                {completedCount}/{totalCount} completed
                            </Badge>
                        )}
                    </DialogTitle>
                </DialogHeader>
                <div className="mt-4">
                    {paths.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="font-semibold">Status</TableHead>
                                    <TableHead className="font-semibold">Name</TableHead>
                                    <TableHead className="font-semibold">Due Date</TableHead>
                                    <TableHead className="font-semibold">
                                        Estimated Duration
                                    </TableHead>
                                    <TableHead className="font-semibold">
                                        Training Materials
                                    </TableHead>
                                    <TableHead className="font-semibold text-right">
                                        Actions
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {paths.map(path => {
                                    const pathMaterials = allMaterials.filter(
                                        m => path.trainingMaterials?.includes(m.id) || false,
                                    );
                                    const progress = getPathProgress(path.id || "");
                                    const status = progress?.status || "To Do";

                                    return (
                                        <TableRow key={path.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    {getStatusIcon(status)}
                                                    <Badge className={getStatusBadge(status)}>
                                                        {status}
                                                    </Badge>
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-medium">
                                                {path.name}
                                            </TableCell>
                                            <TableCell className="text-sm">
                                                {path.dateRange
                                                    ? dayjs(path.dateRange[1]).format(
                                                        "MMMM DD, YYYY",
                                                    )
                                                    : "No due date"}
                                            </TableCell>
                                            <TableCell className="text-sm">
                                                {path.estimatedDuration}
                                            </TableCell>
                                            <TableCell>
                                                <button
                                                    onClick={() =>
                                                        onShowMaterials(
                                                            pathMaterials.map(m => m.id),
                                                        )
                                                    }
                                                    className="flex items-center gap-2 px-2 py-1 rounded transition-colors"
                                                >
                                                    <BookOpen className="h-4 w-4" />
                                                    <span className="text-sm underline">
                                                        {pathMaterials.length} materials
                                                    </span>
                                                </button>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-1">
                                                    {onUpdatePathProgress && (
                                                        <>
                                                            {status === "To Do" && (
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    onClick={() =>
                                                                        onUpdatePathProgress(
                                                                            path.id || "",
                                                                            "In Progress",
                                                                        )
                                                                    }
                                                                    className="text-blue-600 border-blue-300 hover:bg-blue-50"
                                                                >
                                                                    <Play className="h-3 w-3 mr-1" />
                                                                    Start
                                                                </Button>
                                                            )}
                                                            {status === "In Progress" && (
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    onClick={() =>
                                                                        onUpdatePathProgress(
                                                                            path.id || "",
                                                                            "Done",
                                                                        )
                                                                    }
                                                                    className="text-green-600 border-green-300 hover:bg-green-50"
                                                                >
                                                                    <CheckCircle className="h-3 w-3 mr-1" />
                                                                    Complete
                                                                </Button>
                                                            )}
                                                        </>
                                                    )}
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() =>
                                                            router.push(
                                                                `/training-path-viewer?id=${path.id}`,
                                                            )
                                                        }
                                                    >
                                                        Open
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    ) : (
                        <p className="text-sm italic">No training paths available</p>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
