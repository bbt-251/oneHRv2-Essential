"use client";

import { Package, Play, CheckCircle, Circle, Clock, Loader2 } from "lucide-react";
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
import { OrderItemModel, ItemProgress } from "@/lib/models/order-guide-and-order-item";
import { OrderGuideService, OrderItemService } from "@/lib/backend/api/order-guide-service";
import { useFirestore } from "@/context/firestore-context";
import { useToast } from "@/context/toastContext";
import { useAuth } from "@/context/authContext";
import { useState, useEffect } from "react";
import dayjs from "dayjs";

interface ItemsTableModalProps {
    isOpen: boolean;
    onClose: () => void;
    orderGuideId: string;
}

export function ItemsTableModal({ isOpen, onClose, orderGuideId }: ItemsTableModalProps) {
    const { orderGuides, orderItems } = useFirestore();
    const { showToast } = useToast();
    const { user, userData } = useAuth();

    const [initialLoading, setInitialLoading] = useState(true);
    const [items, setItems] = useState<OrderItemModel[]>([]);
    const [itemProgress, setItemProgress] = useState<ItemProgress[]>([]);
    const [orderGuideStatus, setOrderGuideStatus] = useState<
        "Not Started" | "In Progress" | "Done"
    >("Not Started");
    const [loadingItemId, setLoadingItemId] = useState<string | null>(null);

    // Fetch data when modal opens or orderGuideId changes
    useEffect(() => {
        if (isOpen && orderGuideId) {
            fetchInitialData();
        }
    }, [isOpen, orderGuideId]);

    // Also re-fetch when orderGuides changes (real-time updates)
    useEffect(() => {
        if (isOpen && orderGuideId && orderGuides.length > 0) {
            const orderGuide = orderGuides.find(og => og.id === orderGuideId);
            if (orderGuide) {
                const employeeData = orderGuide.associatedEmployees.find(
                    emp => emp.uid === user?.uid,
                );
                if (employeeData) {
                    setItemProgress(employeeData.itemProgress || []);
                    setOrderGuideStatus(employeeData.status || "Not Started");
                }
            }
        }
    }, [isOpen, orderGuideId, orderGuides, user?.uid]);

    const fetchInitialData = async () => {
        if (!orderGuideId) return;

        try {
            // Get order guide from context
            const orderGuide = orderGuides.find(og => og.id === orderGuideId);
            if (!orderGuide) {
                showToast("Order guide not found", "Error", "error");
                return;
            }

            // Get employee progress
            const employeeData = orderGuide.associatedEmployees.find(emp => emp.uid === user?.uid);
            if (employeeData) {
                setItemProgress(employeeData.itemProgress || []);
                setOrderGuideStatus(employeeData.status || "Not Started");
            }

            // Fetch items in parallel
            const itemIds = orderGuide.associatedItems || [];
            if (itemIds.length > 0) {
                const fetchedItems = await Promise.all(
                    itemIds.map(id => OrderItemService.getOrderItemById(id)),
                ).then(results => results.filter(Boolean) as OrderItemModel[]);
                setItems(fetchedItems);
            } else {
                setItems([]);
            }
        } catch (error) {
            console.error("Error fetching items:", error);
            showToast("Failed to load items", "Error", "error");
        } finally {
            setInitialLoading(false);
        }
    };

    // Check if order guide is in progress - items can only be tracked when order guide is In Progress
    const canTrackItems = orderGuideStatus === "In Progress";

    // Get progress for a specific item
    const getItemProgress = (itemId: string): ItemProgress | undefined => {
        return itemProgress.find(p => p.itemId === itemId);
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

    // Handle marking item as started
    const handleStartItem = async (itemId: string) => {
        if (!user?.uid) return;

        setLoadingItemId(itemId);
        try {
            await OrderGuideService.updateItemProgress(
                orderGuideId,
                user.uid,
                itemId,
                "In Progress",
                null,
                user.uid,
                userData?.firstName + " " + userData?.surname || "Employee",
            );
            showToast("Item started", "Success", "success");
            // Data will update automatically via onSnapshot
        } catch (error) {
            console.error("Error starting item:", error);
            showToast("Failed to start item", "Error", "error");
        } finally {
            setLoadingItemId(null);
        }
    };

    // Handle marking item as completed
    const handleCompleteItem = async (itemId: string) => {
        if (!user?.uid) return;

        setLoadingItemId(itemId);
        try {
            await OrderGuideService.updateItemProgress(
                orderGuideId,
                user.uid,
                itemId,
                "Done",
                null,
                user.uid,
                userData?.firstName + " " + userData?.surname || "Employee",
            );
            showToast("Item completed!", "Success", "success");
            // Data will update automatically via onSnapshot
        } catch (error) {
            console.error("Error completing item:", error);
            showToast("Failed to complete item", "Error", "error");
        } finally {
            setLoadingItemId(null);
        }
    };

    // Calculate completion stats
    const completedCount = itemProgress.filter(p => p.status === "Done").length;
    const totalCount = items.length;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-6xl z-[100] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-xl font-semibold flex items-center gap-2">
                        <Package className="h-5 w-5" />
                        Associated Items
                        {totalCount > 0 && (
                            <Badge className="ml-2 bg-blue-100 text-blue-800">
                                {completedCount}/{totalCount} completed
                            </Badge>
                        )}
                    </DialogTitle>
                </DialogHeader>
                <div className="mt-4">
                    {initialLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-brand" />
                            <span className="ml-2">Loading items...</span>
                        </div>
                    ) : items.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="font-semibold">Status</TableHead>
                                    <TableHead className="font-semibold">Item Name</TableHead>
                                    <TableHead className="font-semibold">
                                        Item Description
                                    </TableHead>
                                    <TableHead className="font-semibold">Progress</TableHead>
                                    <TableHead className="font-semibold text-right">
                                        Actions
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {items.map(item => {
                                    const progress = getItemProgress(item.id || "");
                                    const status = progress?.status || "To Do";

                                    return (
                                        <TableRow key={item.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    {getStatusIcon(status)}
                                                    <Badge className={getStatusBadge(status)}>
                                                        {status}
                                                    </Badge>
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-medium">
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="outline">{item.itemID}</Badge>
                                                    {item.itemName}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-sm max-w-xs truncate">
                                                {item.itemDescription}
                                            </TableCell>
                                            <TableCell className="text-sm">
                                                {progress?.startedAt && (
                                                    <div className="text-xs text-gray-500">
                                                        <div>
                                                            Started:{" "}
                                                            {dayjs(progress.startedAt).format(
                                                                "MMM DD, YYYY HH:mm",
                                                            )}
                                                        </div>
                                                        {progress.completedAt && (
                                                            <div className="text-green-600">
                                                                Completed:{" "}
                                                                {dayjs(progress.completedAt).format(
                                                                    "MMM DD, YYYY HH:mm",
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {canTrackItems && (
                                                    <div className="flex justify-end gap-1">
                                                        {status === "To Do" && (
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() =>
                                                                    handleStartItem(item.id || "")
                                                                }
                                                                className="text-blue-600 border-blue-300 hover:bg-blue-50"
                                                                disabled={loadingItemId !== null}
                                                            >
                                                                {loadingItemId === item.id ? (
                                                                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                                                ) : (
                                                                    <Play className="h-3 w-3 mr-1" />
                                                                )}
                                                                {loadingItemId === item.id
                                                                    ? "Starting..."
                                                                    : "Start"}
                                                            </Button>
                                                        )}
                                                        {status === "In Progress" && (
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() =>
                                                                    handleCompleteItem(
                                                                        item.id || "",
                                                                    )
                                                                }
                                                                className="text-green-600 border-green-300 hover:bg-green-50"
                                                                disabled={loadingItemId !== null}
                                                            >
                                                                {loadingItemId === item.id ? (
                                                                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                                                ) : (
                                                                    <CheckCircle className="h-3 w-3 mr-1" />
                                                                )}
                                                                {loadingItemId === item.id
                                                                    ? "Completing..."
                                                                    : "Complete"}
                                                            </Button>
                                                        )}
                                                    </div>
                                                )}
                                                {!canTrackItems && orderGuideStatus !== "Done" && (
                                                    <span className="text-xs text-gray-400 italic">
                                                        Start the order guide to track items
                                                    </span>
                                                )}
                                                {orderGuideStatus === "Done" && (
                                                    <Badge className="bg-green-100 text-green-800">
                                                        Completed
                                                    </Badge>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    ) : (
                        <p className="text-sm italic text-center py-8 text-gray-500">
                            No items available
                        </p>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
