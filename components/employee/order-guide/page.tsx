"use client";

import type React from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { OrderGuideService, OrderItemService } from "@/lib/backend/api/order-guide-service";
import { ORDER_GUIDE_LOG_MESSAGES } from "@/lib/log-descriptions/order-guide";
import type {
    EmployeeOrderGuideAssignment,
    OrderItemModel,
    TrainingMaterialModel,
    TrainingPathModel,
} from "@/lib/models/order-guide-and-order-item";
import { BookOpen, CheckCircle, ClipboardList, Package, Play, Route, Search } from "lucide-react";
import { useState } from "react";
import { DetailsModal } from "./modals/details-modal";
import { ItemsTableModal } from "./modals/items-table-modal";
import { MaterialsTableModal } from "./modals/materials-table-modal";
import { EmployeeOrderGuideRatingModal } from "./modals/order-guide-rating-modal";
import { PathsTableModal } from "./modals/paths-table-modal";

export function MyOrderGuides() {
    const { orderGuides, loading, error } = useFirestore();

    const [searchQuery, setSearchQuery] = useState<string>("");
    const [statusFilter, setStatusFilter] = useState<string | null>(null);
    const [selectedGuide, setSelectedGuide] = useState<EmployeeOrderGuideAssignment | null>(null);
    const [isRatingModalOpen, setIsRatingModalOpen] = useState<boolean>(false);
    const [detailsModal, setDetailsModal] = useState<{
        title: string;
        icon: React.ReactNode;
        items: string[];
    } | null>(null);
    const [itemsTableModal, setItemsTableModal] = useState<OrderItemModel[] | null>(null);
    const [materialsTableModal, setMaterialsTableModal] = useState<TrainingMaterialModel[] | null>(
        null,
    );
    const [pathsTableModal, setPathsTableModal] = useState<{
        paths: TrainingPathModel[];
        allMaterials: TrainingMaterialModel[];
    } | null>(null);

    const { user, userData } = useAuth();

    // Filter order guides for current employee
    const employeeOrderGuides = orderGuides
        .filter(guide => guide.associatedEmployees.some(emp => emp.uid === user?.uid))
        .map(guide => {
            const employeeData = guide.associatedEmployees.find(emp => emp.uid === user?.uid);
            return {
                ...guide,
                status: employeeData?.status || "Not Started",
                rating: employeeData?.rating,
                comment: employeeData?.comment,
                itemProgress: employeeData?.itemProgress || [],
                materialProgress: employeeData?.materialProgress || [],
                pathProgress: employeeData?.pathProgress || [],
            } as EmployeeOrderGuideAssignment;
        });

    const handleStart = async (guide: EmployeeOrderGuideAssignment) => {
        if (!user?.uid) return;

        try {
            // Find the order guide and update this employee's status
            const orderGuide = orderGuides.find(og =>
                og.associatedEmployees.some(emp => emp.uid === user.uid),
            );

            if (!orderGuide) return;

            // Update the employee's status to "In Progress"
            const updatedEmployees = orderGuide.associatedEmployees.map(emp =>
                emp.uid === user.uid ? { ...emp, status: "In Progress" as const } : emp,
            );

            await OrderGuideService.updateOrderGuide(
                orderGuide.id!,
                {
                    ...orderGuide,
                    associatedEmployees: updatedEmployees,
                },
                user?.uid ?? "",
                ORDER_GUIDE_LOG_MESSAGES.ORDER_GUIDE_STARTED(
                    orderGuide.orderGuideName,
                    userData?.firstName + " " + userData?.surname || "Employee",
                ),
            );

            // Context will automatically update via Firestore listeners
        } catch (error) {
            console.error("Error starting order guide:", error);
        }
    };

    const handleFinish = (guide: EmployeeOrderGuideAssignment) => {
        setSelectedGuide(guide);
        setIsRatingModalOpen(true);
    };

    const handleRatingSubmit = async (rating: number, comment: string) => {
        if (!selectedGuide || !user?.uid) return;

        try {
            // Find the order guide and update this employee's rating and comment
            const orderGuide = orderGuides.find(og =>
                og.associatedEmployees.some(emp => emp.uid === user.uid),
            );

            if (!orderGuide) return;

            // Update the employee's status to "Done", and add rating/comment
            const updatedEmployees = orderGuide.associatedEmployees.map(emp =>
                emp.uid === user.uid
                    ? {
                        ...emp,
                        status: "Done" as const,
                        rating: rating,
                        comment: comment.trim() || null,
                    }
                    : emp,
            );

            await OrderGuideService.updateOrderGuide(
                orderGuide.id!,
                {
                    ...orderGuide,
                    associatedEmployees: updatedEmployees,
                },
                user?.uid ?? "",
                ORDER_GUIDE_LOG_MESSAGES.ORDER_GUIDE_COMPLETED(
                    orderGuide.orderGuideName,
                    userData?.firstName + " " + userData?.surname || "Employee",
                ),
            );

            // Context will automatically update via Firestore listeners
        } catch (error) {
            console.error("Error submitting rating:", error);
        } finally {
            setIsRatingModalOpen(false);
            setSelectedGuide(null);
        }
    };

    const [currentGuideForItems, setCurrentGuideForItems] = useState<{
        orderGuideId: string;
        employeeUid: string;
        itemProgress: any[];
        orderGuideStatus: "Not Started" | "In Progress" | "Done";
        itemIds: string[];
    } | null>(null);

    const showItemsDetails = async (itemIds: string[], guide: EmployeeOrderGuideAssignment) => {
        try {
            // Get the latest order guide from context for real-time itemProgress
            const latestOrderGuide = orderGuides.find(og => og.id === guide.id);
            const latestEmployeeData = latestOrderGuide?.associatedEmployees.find(
                emp => emp.uid === user?.uid,
            );

            // Use Promise.all for parallel fetching - much faster than sequential
            const items = await Promise.all(
                itemIds.map(id => OrderItemService.getOrderItemById(id)),
            ).then(results => results.filter(Boolean) as OrderItemModel[]);

            setItemsTableModal(items);
            // Store current guide info with LATEST progress from context (real-time)
            setCurrentGuideForItems({
                orderGuideId: guide.id || "",
                employeeUid: user?.uid || "",
                itemProgress: latestEmployeeData?.itemProgress || guide.itemProgress || [],
                orderGuideStatus: latestEmployeeData?.status || guide.status,
                itemIds: itemIds,
            });
        } catch (error) {
            console.error("Error fetching items:", error);
        }
    };

    // Handle updating item progress
    const handleUpdateItemProgress = async (
        itemId: string,
        status: "To Do" | "In Progress" | "Done",
        comment?: string,
    ) => {
        if (!currentGuideForItems || !user?.uid) return;

        try {
            await OrderGuideService.updateItemProgress(
                currentGuideForItems.orderGuideId,
                currentGuideForItems.employeeUid,
                itemId,
                status,
                comment || null,
                user.uid,
                userData?.firstName + " " + userData?.surname || "Employee",
            );

            // Get the latest order guide from context for real-time itemProgress
            const latestOrderGuide = orderGuides.find(
                og => og.id === currentGuideForItems.orderGuideId,
            );
            const latestEmployeeData = latestOrderGuide?.associatedEmployees.find(
                emp => emp.uid === user.uid,
            );

            // Update state with latest real-time data from context
            setCurrentGuideForItems({
                ...currentGuideForItems,
                itemProgress: latestEmployeeData?.itemProgress || currentGuideForItems.itemProgress,
                orderGuideStatus:
                    latestEmployeeData?.status || currentGuideForItems.orderGuideStatus,
            });

            // Re-fetch items in parallel for faster load
            if (currentGuideForItems.itemIds) {
                const freshItems = await Promise.all(
                    currentGuideForItems.itemIds.map(id => OrderItemService.getOrderItemById(id)),
                ).then(results => results.filter(Boolean) as OrderItemModel[]);
                setItemsTableModal(freshItems);
            }
        } catch (error) {
            console.error("Error updating item progress:", error);
        }
    };

    const [currentGuideForMaterials, setCurrentGuideForMaterials] = useState<{
        orderGuideId: string;
        employeeUid: string;
        materialProgress: any[];
    } | null>(null);

    const [currentGuideForPaths, setCurrentGuideForPaths] = useState<{
        orderGuideId: string;
        employeeUid: string;
        pathProgress: any[];
    } | null>(null);

    const showMaterialsDetails = async (
        materialIds: string[],
        guide?: EmployeeOrderGuideAssignment,
    ) => {
        try {
            const materials = await OrderGuideService.getTrainingMaterialsByIds(materialIds);
            setMaterialsTableModal(materials);
            if (guide) {
                setCurrentGuideForMaterials({
                    orderGuideId: guide.id || "",
                    employeeUid: user?.uid || "",
                    materialProgress: guide.materialProgress || [],
                });
            }
        } catch (error) {
            console.error("Error fetching materials:", error);
        }
    };

    const showPathsDetails = async (
        pathIds: string[],
        materialIds: string[],
        guide?: EmployeeOrderGuideAssignment,
    ) => {
        try {
            const [paths, allMaterials] = await Promise.all([
                OrderGuideService.getTrainingPathsByIds(pathIds),
                OrderGuideService.getTrainingMaterialsByIds(materialIds),
            ]);
            setPathsTableModal({ paths, allMaterials });
            if (guide) {
                setCurrentGuideForPaths({
                    orderGuideId: guide.id || "",
                    employeeUid: user?.uid || "",
                    pathProgress: guide.pathProgress || [],
                });
            }
        } catch (error) {
            console.error("Error fetching paths:", error);
        }
    };

    // Handle updating material progress
    const handleUpdateMaterialProgress = async (
        materialId: string,
        status: "To Do" | "In Progress" | "Done",
    ) => {
        if (!currentGuideForMaterials || !user?.uid) return;

        try {
            await OrderGuideService.updateMaterialProgress(
                currentGuideForMaterials.orderGuideId,
                currentGuideForMaterials.employeeUid,
                materialId,
                status,
                user.uid,
                userData?.firstName + " " + userData?.surname || "Employee",
            );
        } catch (error) {
            console.error("Error updating material progress:", error);
        }
    };

    // Handle updating path progress
    const handleUpdatePathProgress = async (
        pathId: string,
        status: "To Do" | "In Progress" | "Done",
    ) => {
        if (!currentGuideForPaths || !user?.uid) return;

        try {
            await OrderGuideService.updatePathProgress(
                currentGuideForPaths.orderGuideId,
                currentGuideForPaths.employeeUid,
                pathId,
                status,
                user.uid,
                userData?.firstName + " " + userData?.surname || "Employee",
            );
        } catch (error) {
            console.error("Error updating path progress:", error);
        }
    };

    // Check if all items are completed
    const areAllItemsCompleted = (guide: EmployeeOrderGuideAssignment): boolean => {
        const totalItems = guide.associatedItems.length;
        if (totalItems === 0) return false;

        const completedItems = (guide.itemProgress || []).filter(p => p.status === "Done").length;
        return completedItems === totalItems;
    };

    // Get completion message for disabled button
    const getCompletionMessage = (guide: EmployeeOrderGuideAssignment): string => {
        const totalItems = guide.associatedItems.length;
        const completedItems = (guide.itemProgress || []).filter(p => p.status === "Done").length;
        return `Complete all ${totalItems} items to finish (${completedItems}/${totalItems} done)`;
    };

    const getStatusBadge = (status: EmployeeOrderGuideAssignment["status"]) => {
        const statusConfig = {
            "Not Started": " border-gray-300",
            "In Progress": "bg-blue-100 text-blue-800 border-blue-300",
            Done: "bg-green-100 text-green-800 border-green-300",
        };
        return <Badge className={statusConfig[status]}>{status}</Badge>;
    };

    const getPathStatusBadge = (status: string) => {
        const statusConfig = {
            "Not Started": " border-gray-300",
            "In Progress": "bg-blue-100 text-blue-800 border-blue-300",
            Completed: "bg-green-100 text-green-800 border-green-300",
            Created: " border-gray-300",
            Approved: "bg-green-100 text-green-800 border-green-300",
            Refused: "bg-red-100 text-red-800 border-red-300",
        };
        return (
            <Badge
                className={
                    statusConfig[status as keyof typeof statusConfig] || statusConfig["Not Started"]
                }
            >
                {status}
            </Badge>
        );
    };

    const filteredGuides = employeeOrderGuides.filter(guide => {
        const searchMatch =
            guide.orderGuideName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            guide.orderGuideID.toLowerCase().includes(searchQuery.toLowerCase());
        const statusMatch =
            statusFilter === null ||
            (guide.status === "Done" ? "Done" : guide.status) === statusFilter;
        return searchMatch && statusMatch;
    });

    const stats = {
        total: employeeOrderGuides.length,
        notStarted: employeeOrderGuides.filter(g => g.status === "Not Started").length,
        inProgress: employeeOrderGuides.filter(g => g.status === "In Progress").length,
        completed: employeeOrderGuides.filter(g => g.status === "Done").length,
    };

    // Show loading state
    if (loading) {
        return (
            <div className="p-8 space-y-6 min-h-screen">
                <div className="max-w-7xl mx-auto">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold ">My Order Guides</h1>
                        <p className=" mt-2">Loading your order guides...</p>
                    </div>
                    <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
                    </div>
                </div>
            </div>
        );
    }

    // Show error state
    if (error) {
        return (
            <div className="p-8 space-y-6 min-h-screen">
                <div className="max-w-7xl mx-auto">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold ">My Order Guides</h1>
                        <p className=" mt-2">View and manage your assigned order guides</p>
                    </div>
                    <div className="flex items-center justify-center py-12">
                        <div className="text-center">
                            <p className="text-red-600 mb-4">{error}</p>
                            <Button onClick={() => window.location.reload()}>Try Again</Button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Show authentication required state
    if (!user?.uid) {
        return (
            <div className="p-8 space-y-6 min-h-screen">
                <div className="max-w-7xl mx-auto">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold ">My Order Guides</h1>
                        <p className=" mt-2">View and manage your assigned order guides</p>
                    </div>
                    <div className="flex items-center justify-center py-12">
                        <div className="text-center">
                            <p className="">Please sign in to view your order guides</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 space-y-6 min-h-screen">
            <div className="mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold">My Order Guides</h1>
                    <p className="mt-2">View and manage your assigned order guides</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <Card
                        className={`border-brand-200 cursor-pointer transition-all ${statusFilter === null ? "ring-2 ring-blue-500" : ""}`}
                        onClick={() =>
                            setStatusFilter(statusFilter === null ? "Not Started" : null)
                        }
                    >
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium">Total Guides</p>
                                    <p className="text-2xl font-bold">{stats.total}</p>
                                </div>
                                <ClipboardList className="h-8 w-8" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card
                        className={`border-gray-200 cursor-pointer transition-all ${statusFilter === "Not Started" ? "ring-2 ring-blue-500" : ""}`}
                        onClick={() =>
                            setStatusFilter(statusFilter === "Not Started" ? null : "Not Started")
                        }
                    >
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium">Not Started</p>
                                    <p className="text-2xl font-bold">{stats.notStarted}</p>
                                </div>
                                <ClipboardList className="h-8 w-8" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card
                        className={`border-blue-200 cursor-pointer transition-all ${statusFilter === "In Progress" ? "ring-2 ring-blue-500" : ""}`}
                        onClick={() =>
                            setStatusFilter(statusFilter === "In Progress" ? null : "In Progress")
                        }
                    >
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium">In Progress</p>
                                    <p className="text-2xl font-bold">{stats.inProgress}</p>
                                </div>
                                <Play className="h-8 w-8" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card
                        className={`border-green-200 cursor-pointer transition-all ${statusFilter === "Done" ? "ring-2 ring-blue-500" : ""}`}
                        onClick={() => setStatusFilter(statusFilter === "Done" ? null : "Done")}
                    >
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-green-600">Completed</p>
                                    <p className="text-2xl font-bold text-green-800">
                                        {stats.completed}
                                    </p>
                                </div>
                                <CheckCircle className="h-8 w-8 text-green-500" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="mb-6">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 " />
                        <Input
                            placeholder="Search by order guide name or ID..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="pl-10 border-gray-400"
                        />
                    </div>
                </div>

                <Card className="border-gray-200/60">
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow className="">
                                    <TableHead className="font-semibold">Timestamp</TableHead>
                                    <TableHead className="font-semibold">Order Guide ID</TableHead>
                                    <TableHead className="font-semibold">
                                        Order Guide Name
                                    </TableHead>
                                    <TableHead className="font-semibold">Status</TableHead>
                                    <TableHead className="font-semibold">
                                        Associated Items
                                    </TableHead>
                                    <TableHead className="font-semibold">
                                        Training Materials
                                    </TableHead>
                                    <TableHead className="font-semibold">Training Paths</TableHead>
                                    <TableHead className="font-semibold text-right">
                                        Actions
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredGuides.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="text-center py-8 ">
                                            No order guides found
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredGuides.map(guide => (
                                        <TableRow key={guide.id} className="">
                                            <TableCell className="text-sm ">
                                                {guide.timestamp}
                                            </TableCell>
                                            <TableCell>
                                                <Badge className="border-brand-200">
                                                    {guide.orderGuideID}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="font-medium ">
                                                {guide.orderGuideName}
                                            </TableCell>
                                            <TableCell>{getStatusBadge(guide.status)}</TableCell>
                                            <TableCell>
                                                <button
                                                    onClick={() =>
                                                        showItemsDetails(
                                                            guide.associatedItems,
                                                            guide,
                                                        )
                                                    }
                                                    className="flex items-center gap-2  px-2 py-1 rounded transition-colors"
                                                >
                                                    <Package className="h-4 w-4 text-orange-500" />
                                                    <span className="text-sm  underline">
                                                        {guide.associatedItems.length} items
                                                        {guide.itemProgress &&
                                                            guide.itemProgress.length > 0 && (
                                                            <span className="ml-1 text-xs text-green-600">
                                                                    (
                                                                {
                                                                    guide.itemProgress.filter(
                                                                        p =>
                                                                            p.status === "Done",
                                                                    ).length
                                                                }{" "}
                                                                    done)
                                                            </span>
                                                        )}
                                                    </span>
                                                </button>
                                            </TableCell>
                                            <TableCell>
                                                <button
                                                    onClick={() =>
                                                        showMaterialsDetails(
                                                            guide.associatedTrainingMaterials,
                                                            guide,
                                                        )
                                                    }
                                                    className="flex items-center gap-2  px-2 py-1 rounded transition-colors"
                                                >
                                                    <BookOpen className="h-4 w-4 text-green-500" />
                                                    <span className="text-sm  underline">
                                                        {guide.associatedTrainingMaterials.length}{" "}
                                                        materials
                                                        {guide.materialProgress &&
                                                            guide.materialProgress.length > 0 && (
                                                            <span className="ml-1 text-xs text-green-600">
                                                                    (
                                                                {
                                                                    guide.materialProgress.filter(
                                                                        p =>
                                                                            p.status === "Done",
                                                                    ).length
                                                                }{" "}
                                                                    done)
                                                            </span>
                                                        )}
                                                    </span>
                                                </button>
                                            </TableCell>
                                            <TableCell>
                                                <button
                                                    onClick={() =>
                                                        showPathsDetails(
                                                            guide.associatedTrainingPaths || [],
                                                            guide.associatedTrainingMaterials,
                                                            guide,
                                                        )
                                                    }
                                                    className="flex items-center gap-2 px-2 py-1 rounded transition-colors"
                                                >
                                                    <Route className="h-4 w-4 text-purple-500" />
                                                    <span className="text-sm  underline">
                                                        {
                                                            (guide.associatedTrainingPaths || [])
                                                                .length
                                                        }{" "}
                                                        paths
                                                        {guide.pathProgress &&
                                                            guide.pathProgress.length > 0 && (
                                                            <span className="ml-1 text-xs text-green-600">
                                                                    (
                                                                {
                                                                    guide.pathProgress.filter(
                                                                        p =>
                                                                            p.status === "Done",
                                                                    ).length
                                                                }{" "}
                                                                    done)
                                                            </span>
                                                        )}
                                                    </span>
                                                </button>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    {guide.status === "Not Started" && (
                                                        <Button
                                                            size="sm"
                                                            onClick={() => handleStart(guide)}
                                                            className="bg-blue-600 hover:bg-blue-700 text-white"
                                                        >
                                                            <Play className="h-4 w-4 mr-1" />
                                                            Start
                                                        </Button>
                                                    )}
                                                    {guide.status === "In Progress" && (
                                                        <>
                                                            {areAllItemsCompleted(guide) ? (
                                                                <Button
                                                                    size="sm"
                                                                    onClick={() =>
                                                                        handleFinish(guide)
                                                                    }
                                                                    className="bg-green-600 hover:bg-green-700 text-white"
                                                                >
                                                                    <CheckCircle className="h-4 w-4 mr-1" />
                                                                    Finish
                                                                </Button>
                                                            ) : (
                                                                <Button
                                                                    size="sm"
                                                                    disabled
                                                                    className="bg-gray-400 cursor-not-allowed text-white"
                                                                    title={getCompletionMessage(
                                                                        guide,
                                                                    )}
                                                                >
                                                                    <CheckCircle className="h-4 w-4 mr-1" />
                                                                    Finish
                                                                </Button>
                                                            )}
                                                        </>
                                                    )}
                                                    {guide.status === "Done" && (
                                                        <Badge className="bg-green-100 text-green-800 border-green-300">
                                                            Completed
                                                        </Badge>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>

            <ItemsTableModal
                isOpen={itemsTableModal !== null}
                onClose={() => {
                    setItemsTableModal(null);
                    setCurrentGuideForItems(null);
                }}
                orderGuideId={currentGuideForItems?.orderGuideId || ""}
            />

            <DetailsModal
                isOpen={detailsModal !== null}
                onClose={() => setDetailsModal(null)}
                title={detailsModal?.title || ""}
                icon={detailsModal?.icon}
                items={detailsModal?.items || []}
            />

            <MaterialsTableModal
                isOpen={materialsTableModal !== null}
                onClose={() => {
                    setMaterialsTableModal(null);
                    setCurrentGuideForMaterials(null);
                }}
                materials={materialsTableModal || []}
                materialProgress={currentGuideForMaterials?.materialProgress || []}
                onUpdateMaterialProgress={handleUpdateMaterialProgress}
                orderGuideId={currentGuideForMaterials?.orderGuideId}
                employeeUid={currentGuideForMaterials?.employeeUid}
            />

            <PathsTableModal
                isOpen={pathsTableModal !== null}
                onClose={() => {
                    setPathsTableModal(null);
                    setCurrentGuideForPaths(null);
                }}
                paths={pathsTableModal?.paths || []}
                allMaterials={pathsTableModal?.allMaterials || []}
                onShowMaterials={materialIds => showMaterialsDetails(materialIds)}
                pathProgress={currentGuideForPaths?.pathProgress || []}
                onUpdatePathProgress={handleUpdatePathProgress}
                orderGuideId={currentGuideForPaths?.orderGuideId}
                employeeUid={currentGuideForPaths?.employeeUid}
            />

            <EmployeeOrderGuideRatingModal
                isOpen={isRatingModalOpen}
                onClose={() => {
                    setIsRatingModalOpen(false);
                    setSelectedGuide(null);
                }}
                onSubmit={handleRatingSubmit}
                orderGuideName={selectedGuide?.orderGuideName || ""}
            />
        </div>
    );
}
