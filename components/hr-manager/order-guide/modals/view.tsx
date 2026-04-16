"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Users,
    Package,
    BookOpen,
    Calendar,
    FileText,
    Star,
    Route,
    MessageSquare,
    CheckCircle,
    Circle,
    Clock,
    ChevronDown,
    ChevronRight,
} from "lucide-react";
import type { OrderGuideModel, ItemProgress } from "@/lib/models/order-guide-and-order-item";
import { useState } from "react";
import { useFirestore } from "@/context/firestore-context";
import getFullName from "@/lib/util/getEmployeeFullName";
import dayjs from "dayjs";

interface OrderGuideViewModalProps {
    isOpen: boolean;
    onClose: () => void;
    guide: OrderGuideModel | null;
}

export function OrderGuideViewModal({ isOpen, onClose, guide }: OrderGuideViewModalProps) {
    const { employees, trainingMaterials, trainingPaths, orderItems } = useFirestore();
    const [visibleComments, setVisibleComments] = useState<Set<string>>(new Set());
    const [expandedEmployee, setExpandedEmployee] = useState<string | null>(null);

    if (!guide) return null;

    const toggleComment = (uid: string) => {
        setVisibleComments(prev => {
            const newSet = new Set(prev);
            if (newSet.has(uid)) {
                newSet.delete(uid);
            } else {
                newSet.add(uid);
            }
            return newSet;
        });
    };

    const renderStars = (rating = 0) => {
        return (
            <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map(star => (
                    <Star
                        key={star}
                        className={`h-4 w-4 ${
                            star <= rating
                                ? "fill-yellow-400 text-yellow-400"
                                : "fill-gray-200 text-gray-200"
                        }`}
                    />
                ))}
            </div>
        );
    };

    const toggleEmployeeItems = (uid: string) => {
        setExpandedEmployee(prev => (prev === uid ? null : uid));
    };

    const getItemProgress = (employeeUid: string, itemId: string): ItemProgress | undefined => {
        const employee = guide.associatedEmployees.find(emp => emp.uid === employeeUid);
        return employee?.itemProgress?.find(p => p.itemId === itemId);
    };

    const getItemStatusBadge = (status: string) => {
        switch (status) {
            case "Done":
                return "bg-green-100 text-green-800 border-green-300";
            case "In Progress":
                return "bg-blue-100 text-blue-800 border-blue-300";
            default:
                return "bg-gray-100 text-gray-800 border-gray-300";
        }
    };

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

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto z-[100]">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-semibold flex items-center gap-2">
                        <FileText className="h-6 w-6" />
                        Order Guide Details
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6 mt-6">
                    {/* Header Info */}
                    <div className="p-6 rounded-lg border">
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <h2 className="text-2xl font-bold mb-2">{guide.orderGuideName}</h2>
                                <div className="flex items-center gap-3">
                                    <Badge>{guide.orderGuideID}</Badge>
                                    <div className="flex items-center gap-2 text-sm">
                                        <Calendar className="h-4 w-4" />
                                        <span>Created: {guide.timestamp}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Associated Employees */}
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="p-2 rounded-lg">
                                    <Users className="h-5 w-5" />
                                </div>
                                <h3 className="text-lg font-semibold">
                                    Associated Employees ({guide.associatedEmployees.length})
                                </h3>
                            </div>
                            <div className="space-y-4">
                                {guide.associatedEmployees.map(employee => {
                                    const e = employees.find(emp => emp.uid === employee.uid);
                                    const name = e ? getFullName(e) : "N/A";
                                    const completedCount =
                                        employee.itemProgress?.filter(p => p.status === "Done")
                                            .length || 0;
                                    const totalItems = guide.associatedItems.length;
                                    const isExpanded = expandedEmployee === employee.uid;

                                    return (
                                        <div
                                            key={employee.uid}
                                            className="p-4 rounded-lg border space-y-3"
                                        >
                                            <div className="flex items-start gap-4">
                                                <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0">
                                                    <span className="font-medium">
                                                        {name.substring(0, 2).toUpperCase()}
                                                    </span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start justify-between gap-2 mb-2">
                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-semibold">{name}</p>
                                                            <p className="text-sm">
                                                                Employee ID: {e?.employeeID}
                                                            </p>
                                                            <p className="text-xs mt-1">
                                                                Status:{" "}
                                                                <span className="font-medium">
                                                                    {employee.status ||
                                                                        "Not Started"}
                                                                </span>
                                                                {totalItems > 0 && (
                                                                    <span className="ml-2 text-gray-500">
                                                                        ({completedCount}/
                                                                        {totalItems} items
                                                                        completed)
                                                                    </span>
                                                                )}
                                                            </p>
                                                        </div>
                                                        <div className="flex-shrink-0">
                                                            {renderStars(employee.rating || 0)}
                                                        </div>
                                                    </div>
                                                    <div className="mt-2 flex gap-2 flex-wrap">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() =>
                                                                toggleComment(employee.uid)
                                                            }
                                                            className="text-xs h-8 gap-2"
                                                        >
                                                            <MessageSquare className="h-3 w-3" />
                                                            {visibleComments.has(employee.uid)
                                                                ? "Hide Comment"
                                                                : "View Comment"}
                                                        </Button>
                                                        {totalItems > 0 && (
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() =>
                                                                    toggleEmployeeItems(
                                                                        employee.uid,
                                                                    )
                                                                }
                                                                className="text-xs h-8 gap-2"
                                                            >
                                                                {isExpanded ? (
                                                                    <ChevronDown className="h-3 w-3" />
                                                                ) : (
                                                                    <ChevronRight className="h-3 w-3" />
                                                                )}
                                                                {isExpanded
                                                                    ? "Hide Items"
                                                                    : "View Items"}
                                                            </Button>
                                                        )}
                                                    </div>
                                                    {visibleComments.has(employee.uid) && (
                                                        <div className="mt-3">
                                                            <label className="text-xs font-medium mb-1 block">
                                                                Comment:
                                                            </label>
                                                            {employee.comment ? (
                                                                <Textarea
                                                                    value={employee.comment}
                                                                    readOnly
                                                                    className="min-h-[60px] text-sm resize-none"
                                                                />
                                                            ) : (
                                                                <p className="text-sm italic p-3 rounded border">
                                                                    No comment available
                                                                </p>
                                                            )}
                                                        </div>
                                                    )}

                                                    {/* Item Progress Table */}
                                                    {isExpanded && totalItems > 0 && (
                                                        <div className="mt-4 border rounded-lg overflow-hidden">
                                                            <Table>
                                                                <TableHeader>
                                                                    <TableRow className="bg-gray-50">
                                                                        <TableHead className="font-semibold">
                                                                            Status
                                                                        </TableHead>
                                                                        <TableHead className="font-semibold">
                                                                            Item Name
                                                                        </TableHead>
                                                                        <TableHead className="font-semibold">
                                                                            Item Description
                                                                        </TableHead>
                                                                        <TableHead className="font-semibold">
                                                                            Progress
                                                                        </TableHead>
                                                                    </TableRow>
                                                                </TableHeader>
                                                                <TableBody>
                                                                    {guide.associatedItems.map(
                                                                        itemId => {
                                                                            const item =
                                                                                orderItems.find(
                                                                                    i =>
                                                                                        i.id ===
                                                                                        itemId,
                                                                                );
                                                                            const progress =
                                                                                getItemProgress(
                                                                                    employee.uid,
                                                                                    itemId,
                                                                                );
                                                                            const status =
                                                                                progress?.status ||
                                                                                "To Do";

                                                                            return (
                                                                                <TableRow
                                                                                    key={itemId}
                                                                                >
                                                                                    <TableCell>
                                                                                        <div className="flex items-center gap-2">
                                                                                            {getStatusIcon(
                                                                                                status,
                                                                                            )}
                                                                                            <Badge
                                                                                                className={getItemStatusBadge(
                                                                                                    status,
                                                                                                )}
                                                                                            >
                                                                                                {
                                                                                                    status
                                                                                                }
                                                                                            </Badge>
                                                                                        </div>
                                                                                    </TableCell>
                                                                                    <TableCell className="font-medium">
                                                                                        <div className="flex items-center gap-2">
                                                                                            <Badge variant="outline">
                                                                                                {item?.itemID ||
                                                                                                    "N/A"}
                                                                                            </Badge>
                                                                                            {item?.itemName ||
                                                                                                itemId}
                                                                                        </div>
                                                                                    </TableCell>
                                                                                    <TableCell className="text-sm max-w-xs truncate">
                                                                                        {item?.itemDescription ||
                                                                                            "-"}
                                                                                    </TableCell>
                                                                                    <TableCell className="text-sm">
                                                                                        {progress?.startedAt && (
                                                                                            <div className="text-xs text-gray-500">
                                                                                                <div>
                                                                                                    Started:{" "}
                                                                                                    {dayjs(
                                                                                                        progress.startedAt,
                                                                                                    ).format(
                                                                                                        "MMM DD, YYYY HH:mm",
                                                                                                    )}
                                                                                                </div>
                                                                                                {progress.completedAt && (
                                                                                                    <div className="text-green-600">
                                                                                                        Completed:{" "}
                                                                                                        {dayjs(
                                                                                                            progress.completedAt,
                                                                                                        ).format(
                                                                                                            "MMM DD, YYYY HH:mm",
                                                                                                        )}
                                                                                                    </div>
                                                                                                )}
                                                                                            </div>
                                                                                        )}
                                                                                        {!progress?.startedAt && (
                                                                                            <span className="text-xs text-gray-400">
                                                                                                Not
                                                                                                started
                                                                                            </span>
                                                                                        )}
                                                                                    </TableCell>
                                                                                </TableRow>
                                                                            );
                                                                        },
                                                                    )}
                                                                </TableBody>
                                                            </Table>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Associated Items */}
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="p-2 rounded-lg">
                                    <Package className="h-5 w-5" />
                                </div>
                                <h3 className="text-lg font-semibold">
                                    Associated Items ({guide.associatedItems.length})
                                </h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {guide.associatedItems.map((itemId, index) => {
                                    const item = orderItems.find(i => i.id === itemId);
                                    return (
                                        <div
                                            key={index}
                                            className="flex items-center gap-3 p-3 rounded-lg border"
                                        >
                                            <div className="w-8 h-8 rounded-lg flex items-center justify-center">
                                                <span className="font-semibold text-sm">
                                                    {index + 1}
                                                </span>
                                            </div>
                                            <p className="font-medium">
                                                {item?.itemName || itemId}
                                            </p>
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>

                    {guide.associatedTrainingPaths && guide.associatedTrainingPaths.length > 0 && (
                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="p-2 rounded-lg">
                                        <Route className="h-5 w-5" />
                                    </div>
                                    <h3 className="text-lg font-semibold">
                                        Training Paths ({guide.associatedTrainingPaths.length})
                                    </h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {guide.associatedTrainingPaths?.map((pathId, index) => {
                                        const path = trainingPaths.find(p => p.id === pathId);
                                        return (
                                            <div
                                                key={index}
                                                className="flex items-center gap-3 p-3 rounded-lg border"
                                            >
                                                <Route className="h-5 w-5" />
                                                <p className="font-medium">
                                                    {path?.name || pathId}
                                                </p>
                                            </div>
                                        );
                                    })}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Training Materials */}
                    {guide.associatedTrainingMaterials.length > 0 && (
                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="p-2 rounded-lg">
                                        <BookOpen className="h-5 w-5" />
                                    </div>
                                    <h3 className="text-lg font-semibold">
                                        Training Materials (
                                        {guide.associatedTrainingMaterials.length})
                                    </h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {guide.associatedTrainingMaterials.map((materialId, index) => {
                                        const material = trainingMaterials.find(
                                            m => m.id === materialId,
                                        );
                                        return (
                                            <div
                                                key={index}
                                                className="flex items-center gap-3 p-3 rounded-lg border"
                                            >
                                                <BookOpen className="h-5 w-5" />
                                                <p className="font-medium">
                                                    {material?.name || materialId}
                                                </p>
                                            </div>
                                        );
                                    })}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Footer */}
                    <div className="flex justify-end pt-6 border-t">
                        <Button onClick={onClose} className="px-8">
                            Close
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
