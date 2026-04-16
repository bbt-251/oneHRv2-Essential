"use client";

import { useState, useEffect } from "react";
import { Plus, Search, Edit, Trash2, Eye, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { OrderItemModel } from "@/lib/models/order-guide-and-order-item";
import { OrderItemAddModal } from "./modals/add";
import { OrderItemEditModal } from "./modals/edit";
import { OrderItemDeleteDialog } from "./modals/delete";
import { OrderItemViewModal } from "./modals/view";
import { OrderItemService } from "@/lib/backend/api/order-guide-service";
import { useFirestore } from "@/context/firestore-context";
import { ORDER_GUIDE_LOG_MESSAGES } from "@/lib/log-descriptions/order-guide";
import { useAuth } from "@/context/authContext";

export function OrderItemManagement() {
    const { orderItems, loading, error } = useFirestore();
    const { userData } = useAuth();
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState<boolean>(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false);
    const [selectedItem, setSelectedItem] = useState<OrderItemModel | null>(null);
    const [editingItem, setEditingItem] = useState<OrderItemModel | null>(null);

    const filteredItems = orderItems.filter(
        item =>
            item.itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.itemID.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.itemDescription.toLowerCase().includes(searchQuery.toLowerCase()),
    );

    const handleCreateItem = async (item: Omit<OrderItemModel, "id" | "timestamp">) => {
        try {
            const newItem = await OrderItemService.createOrderItem(
                item,
                userData?.uid ?? "",
                ORDER_GUIDE_LOG_MESSAGES.ORDER_ITEM_CREATED(item.itemName),
            );
            setIsAddModalOpen(false);
            // Context will automatically update via Firestore listeners
        } catch (error) {
            console.error("Error creating order item:", error);
        }
    };

    const handleUpdateItem = async (updatedItem: OrderItemModel) => {
        try {
            if (!updatedItem.id) return;
            await OrderItemService.updateOrderItem(
                updatedItem.id,
                updatedItem,
                userData?.uid ?? "",
                ORDER_GUIDE_LOG_MESSAGES.ORDER_ITEM_UPDATED(updatedItem.itemName),
            );
            setEditingItem(null);
            setIsEditModalOpen(false);
            // Context will automatically update via Firestore listeners
        } catch (error) {
            console.error("Error updating order item:", error);
        }
    };

    const handleDeleteItem = async () => {
        if (!selectedItem?.id) return;

        try {
            await OrderItemService.deleteOrderItem(
                selectedItem.id,
                userData?.uid ?? "",
                ORDER_GUIDE_LOG_MESSAGES.ORDER_ITEM_DELETED(selectedItem.itemName),
            );
            setIsDeleteDialogOpen(false);
            setSelectedItem(null);
            // Context will automatically update via Firestore listeners
        } catch (error) {
            console.error("Error deleting order item:", error);
        }
    };

    const handleEdit = (item: OrderItemModel) => {
        setEditingItem(item);
        setIsEditModalOpen(true);
    };

    const handleView = (item: OrderItemModel) => {
        setSelectedItem(item);
        setIsViewModalOpen(true);
    };

    const handleDelete = (item: OrderItemModel) => {
        setSelectedItem(item);
        setIsDeleteDialogOpen(true);
    };

    const activeItemsCount = orderItems.filter(item => item.active === "Yes").length;
    const inactiveItemsCount = orderItems.filter(item => item.active === "No").length;

    return (
        <div className="space-y-6">
            {/* Header - Only show when not in dialog context */}
            <div className="flex items-center justify-between">
                <div>
                    <p className="mt-1">Create, manage, and organize order items</p>
                </div>
                <Button
                    onClick={() => {
                        setEditingItem(null);
                        setIsAddModalOpen(true);
                    }}
                    className=""
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Order Item
                </Button>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Items</CardTitle>
                        <Package className="h-4 w-4" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{orderItems.length}</div>
                        <p className="text-xs mt-1">All order items in system</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Items</CardTitle>
                        <Package className="h-4 w-4" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{activeItemsCount}</div>
                        <p className="text-xs mt-1">Currently available items</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Inactive Items</CardTitle>
                        <Package className="h-4 w-4" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{inactiveItemsCount}</div>
                        <p className="text-xs mt-1">Discontinued items</p>
                    </CardContent>
                </Card>
            </div>

            {/* Search and Filter */}
            <Card>
                <CardHeader>
                    <CardTitle>Order Items</CardTitle>
                    <CardDescription>View and manage all order items</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="mb-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4" />
                            <Input
                                placeholder="Search by item name, ID, or description..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                    </div>

                    {/* Table */}
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="font-semibold">Item ID</TableHead>
                                    <TableHead className="font-semibold">Item Name</TableHead>
                                    <TableHead className="font-semibold">Description</TableHead>
                                    <TableHead className="font-semibold">Status</TableHead>
                                    <TableHead className="font-semibold text-right">
                                        Actions
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredItems.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-8">
                                            No order items found
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredItems.map(item => (
                                        <TableRow key={item.id}>
                                            <TableCell className="font-medium">
                                                {item.itemID}
                                            </TableCell>
                                            <TableCell>{item.itemName}</TableCell>
                                            <TableCell className="max-w-xs truncate">
                                                {item.itemDescription}
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={
                                                        item.active === "Yes"
                                                            ? "default"
                                                            : "secondary"
                                                    }
                                                    className={
                                                        item.active === "Yes"
                                                            ? "bg-green-100 text-green-800"
                                                            : "bg-red-100 text-red-800"
                                                    }
                                                >
                                                    {item.active === "Yes" ? "Active" : "Inactive"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleView(item)}
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleEdit(item)}
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleDelete(item)}
                                                        className="text-red-600"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* Modals */}
            <OrderItemAddModal
                isOpen={isAddModalOpen}
                onClose={() => {
                    setIsAddModalOpen(false);
                }}
                onSubmit={handleCreateItem}
            />

            <OrderItemEditModal
                isOpen={isEditModalOpen}
                onClose={() => {
                    setIsEditModalOpen(false);
                    setEditingItem(null);
                }}
                onSubmit={handleUpdateItem}
                editingItem={editingItem}
            />

            <OrderItemViewModal
                isOpen={isViewModalOpen}
                onClose={() => {
                    setIsViewModalOpen(false);
                    setSelectedItem(null);
                }}
                item={selectedItem}
            />

            <OrderItemDeleteDialog
                isOpen={isDeleteDialogOpen}
                onClose={() => {
                    setIsDeleteDialogOpen(false);
                    setSelectedItem(null);
                }}
                onConfirm={handleDeleteItem}
                itemName={selectedItem?.itemName || ""}
            />
        </div>
    );
}
