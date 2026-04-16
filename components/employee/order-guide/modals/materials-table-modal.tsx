"use client";

import { BookOpen, Play, CheckCircle, Circle, Clock } from "lucide-react";
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
import { TrainingMaterialModel, MaterialProgress } from "@/lib/models/order-guide-and-order-item";
import dayjs from "dayjs";
import { useRouter } from "next/navigation";
import { useHrSettings } from "@/hooks/use-hr-settings";

interface MaterialsTableModalProps {
    isOpen: boolean;
    onClose: () => void;
    materials: TrainingMaterialModel[];
    materialProgress?: MaterialProgress[];
    onUpdateMaterialProgress?: (
        materialId: string,
        status: "To Do" | "In Progress" | "Done",
    ) => void;
    orderGuideId?: string;
    employeeUid?: string;
}

export function MaterialsTableModal({
    isOpen,
    onClose,
    materials,
    materialProgress = [],
    onUpdateMaterialProgress,
    orderGuideId,
    employeeUid,
}: MaterialsTableModalProps) {
    const { hrSettings } = useHrSettings();
    const router = useRouter();

    const getCategoryName = (categoryId: string) => {
        const category = hrSettings.tmCategories?.find(cat => cat.id === categoryId);
        return category?.name || categoryId;
    };

    const getLengthName = (lengthId: string) => {
        const length = hrSettings.tmLengths?.find(len => len.id === lengthId);
        return length?.name || lengthId;
    };

    const getComplexityName = (complexityId: string) => {
        const complexity = hrSettings.tmComplexity?.find(comp => comp.id === complexityId);
        return complexity?.name || complexityId;
    };

    // Get progress for a specific material
    const getMaterialProgress = (materialId: string): MaterialProgress | undefined => {
        return materialProgress.find(p => p.materialId === materialId);
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

    // Calculate completion stats
    const completedCount = materialProgress.filter(p => p.status === "Done").length;
    const totalCount = materials.length;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-6xl z-[100] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-xl font-semibold flex items-center gap-2">
                        <BookOpen className="h-5 w-5" />
                        Training Materials
                        {totalCount > 0 && (
                            <Badge className="ml-2 bg-green-100 text-green-800">
                                {completedCount}/{totalCount} completed
                            </Badge>
                        )}
                    </DialogTitle>
                </DialogHeader>
                <div className="mt-4">
                    {materials.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="font-semibold">Status</TableHead>
                                    <TableHead className="font-semibold">Name</TableHead>
                                    <TableHead className="font-semibold">Category</TableHead>
                                    <TableHead className="font-semibold">Format</TableHead>
                                    <TableHead className="font-semibold">Length</TableHead>
                                    <TableHead className="font-semibold">Complexity</TableHead>
                                    <TableHead className="font-semibold text-right">
                                        Actions
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {materials.map(material => {
                                    const progress = getMaterialProgress(material.id || "");
                                    const status = progress?.status || "To Do";

                                    return (
                                        <TableRow key={material.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    {getStatusIcon(status)}
                                                    <Badge className={getStatusBadge(status)}>
                                                        {status}
                                                    </Badge>
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-medium">
                                                {material.name}
                                            </TableCell>
                                            <TableCell className="text-sm">
                                                {Array.isArray(material.category)
                                                    ? material.category
                                                        .map(catId => getCategoryName(catId))
                                                        .join(", ")
                                                    : getCategoryName(material.category)}
                                            </TableCell>
                                            <TableCell className="text-sm">
                                                {material.format}
                                            </TableCell>
                                            <TableCell className="text-sm">
                                                {getLengthName(material.length)}
                                            </TableCell>
                                            <TableCell>
                                                <Badge>
                                                    {getComplexityName(material.complexity)}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-1">
                                                    {onUpdateMaterialProgress && (
                                                        <>
                                                            {status === "To Do" && (
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    onClick={() =>
                                                                        onUpdateMaterialProgress(
                                                                            material.id || "",
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
                                                                        onUpdateMaterialProgress(
                                                                            material.id || "",
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
                                                                `/training-viewer?id=${material.id}`,
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
                        <p className="text-sm italic">No materials available</p>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
