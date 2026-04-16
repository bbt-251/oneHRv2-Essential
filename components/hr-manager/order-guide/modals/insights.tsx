"use client";

import { useEffect, useState } from "react";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useFirestore } from "@/context/firestore-context";
import { EmployeeModel } from "@/lib/models/employee";
import type { OrderGuideModel, OrderItemModel } from "@/lib/models/order-guide-and-order-item";
import getFullName from "@/lib/util/getEmployeeFullName";
import { Sparkles, Star, Package, CheckCircle, Clock, Circle, BarChart3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { OrderGuideService } from "@/lib/backend/api/order-guide-service";

interface OrderGuideInsightsModalProps {
    isOpen: boolean;
    onClose: () => void;
    guide: OrderGuideModel | null;
}

export function OrderGuideInsightsModal({ isOpen, onClose, guide }: OrderGuideInsightsModalProps) {
    const { activeEmployees, orderItems } = useFirestore();
    const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);
    const [employeeItemProgress, setEmployeeItemProgress] = useState<
        {
            employeeUid: string;
            employeeName: string;
            itemProgress: any[];
        }[]
    >([]);
    const [loadingProgress, setLoadingProgress] = useState(false);
    const [summary, setSummary] = useState("Generating insights...");
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isOpen && guide) {
            generateInsightsSummary(guide);
            loadEmployeeProgress(guide);
        }
    }, [isOpen, guide]);

    const loadEmployeeProgress = async (guide: OrderGuideModel) => {
        setLoadingProgress(true);
        try {
            // Get order items for this guide
            const guideItems = orderItems.filter(item =>
                guide.associatedItems.includes(item.id || ""),
            );
            const itemMap = new Map(guideItems.map(item => [item.id, item]));

            // Build progress data for each employee
            const progressData = guide.associatedEmployees.map(emp => {
                const employee = activeEmployees.find(e => e.uid === emp.uid);
                return {
                    employeeUid: emp.uid,
                    employeeName: employee ? getFullName(employee) : "Unknown Employee",
                    itemProgress: (emp.itemProgress || []).map(progress => ({
                        ...progress,
                        itemName: itemMap.get(progress.itemId)?.itemName || "Unknown Item",
                    })),
                };
            });

            setEmployeeItemProgress(progressData);
        } catch (error) {
            console.error("Error loading employee progress:", error);
        } finally {
            setLoadingProgress(false);
        }
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

    if (!guide) return null;

    const renderStarRating = (rating: number) => {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;
        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

        return (
            <div className="flex items-center gap-1">
                {[...Array(fullStars)].map((_, i) => (
                    <Star key={`full-${i}`} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                ))}
                {hasHalfStar && (
                    <Star
                        className="h-4 w-4 fill-yellow-400 text-yellow-400"
                        style={{ clipPath: "inset(0 50% 0 0)" }}
                    />
                )}
                {[...Array(emptyStars)].map((_, i) => (
                    <Star key={`empty-${i}`} className="h-4 w-4 text-gray-300" />
                ))}
            </div>
        );
    };

    const generateInsightsSummary = async (guide: OrderGuideModel) => {
        setIsLoading(true);
        try {
            const response = await fetch("/api/summarize-comments", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ orderGuide: guide }),
            });

            if (!response.ok) {
                throw new Error("Failed to fetch summary");
            }

            const data = await response.json();
            setSummary(data.summary);
        } catch (error) {
            setSummary("Failed to generate insights. Please try again later.");
            console.error("Error generating summary:", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto z-[100]">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-semibold flex items-center gap-2">
                        <Sparkles className="h-6 w-6" />
                        AI Insights - {guide.orderGuideName}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6 mt-4">
                    {/* AI Summary */}
                    <div className="p-4 rounded-lg border">
                        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                            <Sparkles className="h-5 w-5" />
                            Summary
                        </h3>
                        <p className="text-sm leading-relaxed">
                            {isLoading ? "Generating insights..." : summary}
                        </p>
                    </div>

                    {/* Employee Progress Section */}
                    <div>
                        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                            <BarChart3 className="h-5 w-5" />
                            Employee Progress
                        </h3>
                        {loadingProgress ? (
                            <p className="text-sm text-gray-500">Loading progress...</p>
                        ) : (
                            <div className="space-y-4">
                                {employeeItemProgress.map(empProgress => {
                                    const totalItems = guide.associatedItems.length;
                                    const completedItems = empProgress.itemProgress.filter(
                                        p => p.status === "Done",
                                    ).length;
                                    const inProgressItems = empProgress.itemProgress.filter(
                                        p => p.status === "In Progress",
                                    ).length;
                                    const completionPercent =
                                        totalItems > 0
                                            ? Math.round((completedItems / totalItems) * 100)
                                            : 0;

                                    return (
                                        <div
                                            key={empProgress.employeeUid}
                                            className="p-4 rounded-lg border"
                                        >
                                            <div
                                                className="flex items-center justify-between cursor-pointer"
                                                onClick={() =>
                                                    setSelectedEmployee(
                                                        selectedEmployee === empProgress.employeeUid
                                                            ? null
                                                            : empProgress.employeeUid,
                                                    )
                                                }
                                            >
                                                <div>
                                                    <p className="font-semibold">
                                                        {empProgress.employeeName}
                                                    </p>
                                                    <p className="text-sm text-gray-500">
                                                        {completedItems}/{totalItems} items
                                                        completed ({completionPercent}%)
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Badge className={getStatusBadge("Done")}>
                                                        {completedItems} Done
                                                    </Badge>
                                                    <Badge
                                                        className={getStatusBadge("In Progress")}
                                                    >
                                                        {inProgressItems} In Progress
                                                    </Badge>
                                                </div>
                                            </div>

                                            {/* Progress bar */}
                                            <div className="mt-3">
                                                <div className="w-full bg-gray-200 rounded-full h-2">
                                                    <div
                                                        className="bg-green-600 h-2 rounded-full transition-all"
                                                        style={{ width: `${completionPercent}%` }}
                                                    />
                                                </div>
                                            </div>

                                            {/* Expanded item progress details */}
                                            {selectedEmployee === empProgress.employeeUid && (
                                                <div className="mt-4">
                                                    <Table>
                                                        <TableHeader>
                                                            <TableRow>
                                                                <TableHead>Status</TableHead>
                                                                <TableHead>Item</TableHead>
                                                                <TableHead>Completed At</TableHead>
                                                            </TableRow>
                                                        </TableHeader>
                                                        <TableBody>
                                                            {guide.associatedItems.map(itemId => {
                                                                const progress =
                                                                    empProgress.itemProgress.find(
                                                                        p => p.itemId === itemId,
                                                                    );
                                                                const item = orderItems.find(
                                                                    i => i.id === itemId,
                                                                );
                                                                const status =
                                                                    progress?.status || "To Do";

                                                                return (
                                                                    <TableRow key={itemId}>
                                                                        <TableCell>
                                                                            <div className="flex items-center gap-2">
                                                                                {getStatusIcon(
                                                                                    status,
                                                                                )}
                                                                                <Badge
                                                                                    className={getStatusBadge(
                                                                                        status,
                                                                                    )}
                                                                                >
                                                                                    {status}
                                                                                </Badge>
                                                                            </div>
                                                                        </TableCell>
                                                                        <TableCell>
                                                                            {item?.itemName ||
                                                                                "Unknown Item"}
                                                                        </TableCell>
                                                                        <TableCell>
                                                                            {progress?.completedAt
                                                                                ? new Date(
                                                                                    progress.completedAt,
                                                                                ).toLocaleDateString()
                                                                                : "-"}
                                                                        </TableCell>
                                                                    </TableRow>
                                                                );
                                                            })}
                                                        </TableBody>
                                                    </Table>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Individual Comments */}
                    <div>
                        <h3 className="text-lg font-semibold mb-3">Employee Comments</h3>
                        <div className="space-y-3">
                            {guide.associatedEmployees.map(employee => (
                                <div key={employee.uid} className="p-4 rounded-lg border">
                                    <div className="flex items-start justify-between mb-2">
                                        <div>
                                            <p className="font-semibold">
                                                {getFullName(
                                                    activeEmployees.find(
                                                        e => e.uid === employee.uid,
                                                    ) as EmployeeModel,
                                                )}
                                            </p>
                                            <p className="text-sm">Employee UID: {employee.uid}</p>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            {employee.rating && renderStarRating(employee.rating)}
                                        </div>
                                    </div>
                                    {employee.comment ? (
                                        <p className="text-sm mt-2">{employee.comment}</p>
                                    ) : (
                                        <p className="text-sm italic mt-2">No comment provided</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
