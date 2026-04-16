"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useFirestore } from "@/context/firestore-context";
import { useHrSettings } from "@/hooks/use-hr-settings";
import type { OrderGuideModel } from "@/lib/models/order-guide-and-order-item";
import {
    BookOpen,
    Calendar,
    CheckCircle,
    ClipboardList,
    Edit,
    Eye,
    Filter,
    Package,
    Package2,
    Play,
    Plus,
    Route,
    Search,
    Sparkles,
    Star,
    Trash2,
    Users,
} from "lucide-react";
import { useState } from "react";
import { OrderItemManagementDialog } from "../order-item/blocks/dialog";
import { OrderGuideFormModal } from "./modals/add";
import { OrderGuideDeleteDialog } from "./modals/delete";
import { OrderGuideEditModal } from "./modals/edit";
import { OrderGuideInsightsModal } from "./modals/insights";
import { OrderGuideViewModal } from "./modals/view";

export function OrderGuideManagement() {
    const { orderGuides, loading, error } = useFirestore();
    const { hrSettings } = useHrSettings();
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [filterDepartment, setFilterDepartment] = useState<string>("all");
    const [statusFilter, setStatusFilter] = useState<string | null>(null);
    const [isFormModalOpen, setIsFormModalOpen] = useState<boolean>(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState<boolean>(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false);
    const [isOrderItemDialogOpen, setIsOrderItemDialogOpen] = useState<boolean>(false);
    const [isInsightsModalOpen, setIsInsightsModalOpen] = useState<boolean>(false); // Added state for insights modal
    const [selectedGuide, setSelectedGuide] = useState<OrderGuideModel | null>(null);
    const [editingGuide, setEditingGuide] = useState<OrderGuideModel | null>(null);
    const [insightsGuide, setInsightsGuide] = useState<OrderGuideModel | null>(null); // Added state for insights guide

    const handleCreate = () => {
        setEditingGuide(null);
        setIsFormModalOpen(true);
    };

    const handleEdit = (guide: OrderGuideModel) => {
        setEditingGuide(guide);
        setIsFormModalOpen(true);
    };

    const handleView = (guide: OrderGuideModel) => {
        setSelectedGuide(guide);
        setIsViewModalOpen(true);
    };

    const handleDelete = (guide: OrderGuideModel) => {
        setSelectedGuide(guide);
        setIsDeleteDialogOpen(true);
    };

    const handleShowInsights = (guide: OrderGuideModel) => {
        setInsightsGuide(guide);
        setIsInsightsModalOpen(true);
    };

    const filteredGuides = orderGuides.filter(guide => {
        const matchesSearch =
            guide.orderGuideName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            guide.orderGuideID.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesDepartment = filterDepartment === "all" || false; // Remove department filtering since OrderGuideEmployees no longer has department field

        const matchesStatus =
            statusFilter === null ||
            guide.associatedEmployees.some(
                emp =>
                    emp.status === statusFilter ||
                    (emp.status === "Done" && statusFilter === "Done"),
            );

        return matchesSearch && matchesDepartment && matchesStatus;
    });

    const departments = hrSettings?.departmentSettings?.filter(dept => dept.active) || [];

    // Calculate status stats across all order guides
    const employeeStatusStats = orderGuides.reduce(
        (stats, guide) => {
            guide.associatedEmployees.forEach(emp => {
                if (emp.status === "Not Started") stats.notStarted++;
                else if (emp.status === "In Progress") stats.inProgress++;
                else if (emp.status === "Done") stats.completed++;
            });
            return stats;
        },
        { notStarted: 0, inProgress: 0, completed: 0, total: 0 },
    );
    employeeStatusStats.total =
        employeeStatusStats.notStarted +
        employeeStatusStats.inProgress +
        employeeStatusStats.completed;

    const calculateAverageRating = (guide: OrderGuideModel): number => {
        const ratingsWithValues = guide.associatedEmployees.filter(
            emp => emp.rating !== null && emp.rating > 0,
        );
        if (ratingsWithValues.length === 0) return 0;
        const sum = ratingsWithValues.reduce((acc, emp) => acc + (emp.rating || 0), 0);
        return sum / ratingsWithValues.length;
    };

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

    // Show loading state
    if (loading) {
        return (
            <div className="p-8 space-y-6 min-h-screen">
                <div className="max-w-7xl mx-auto">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold">Order Guide Management</h1>
                        <p className=" mt-2">Loading order guides...</p>
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
                        <h1 className="text-3xl font-bold">Order Guide Management</h1>
                        <p className=" mt-2">
                            Create, edit, and manage order guides for your organization
                        </p>
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

    return (
        <div className="p-8 space-y-6 min-h-screen">
            <div className="mx-auto">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold">Order Guide Management</h1>
                        <p className=" mt-2">
                            Create, edit, and manage order guides for your organization
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <Button
                            onClick={() => setIsOrderItemDialogOpen(true)}
                            variant="outline"
                            className="border-brand-600"
                        >
                            <Package2 className="h-4 w-4 mr-2" />
                            Order Item
                        </Button>
                        <Button onClick={handleCreate} className="text-white">
                            <Plus className="h-4 w-4 mr-2" />
                            Create Order Guide
                        </Button>
                    </div>
                </div>

                {/* Status Cards */}
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
                                    <p className="text-sm font-medium">Total Assignments</p>
                                    <p className="text-2xl font-bold">
                                        {employeeStatusStats.total}
                                    </p>
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
                                    <p className="text-2xl font-bold">
                                        {employeeStatusStats.notStarted}
                                    </p>
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
                                    <p className="text-2xl font-bold">
                                        {employeeStatusStats.inProgress}
                                    </p>
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
                                        {employeeStatusStats.completed}
                                    </p>
                                </div>
                                <CheckCircle className="h-8 w-8 text-green-500" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Original Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
                    <Card className="">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium ">Total Guides</p>
                                    <p className="text-2xl font-bold ">{orderGuides.length}</p>
                                </div>
                                <div className="p-3 rounded-xl">
                                    <BookOpen className="h-5 w-5" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium">Total Employees</p>
                                    <p className="text-2xl font-bold">
                                        {orderGuides.reduce(
                                            (sum, g) => sum + g.associatedEmployees.length,
                                            0,
                                        )}
                                    </p>
                                </div>
                                <div className="p-3 rounded-xl">
                                    <Users className="h-5 w-5" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium">Total Items</p>
                                    <p className="text-2xl font-bold">
                                        {orderGuides.reduce(
                                            (sum, g) => sum + g.associatedItems.length,
                                            0,
                                        )}
                                    </p>
                                </div>
                                <div className="p-3 rounded-xl">
                                    <Package className="h-5 w-5" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium">Training Paths</p>
                                    <p className="text-2xl font-bold">
                                        {orderGuides.reduce(
                                            (sum, g) =>
                                                sum + (g.associatedTrainingPaths?.length || 0),
                                            0,
                                        )}
                                    </p>
                                </div>
                                <div className="p-3 rounded-xl">
                                    <Route className="h-5 w-5" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium">Training Materials</p>
                                    <p className="text-2xl font-bold">
                                        {orderGuides.reduce(
                                            (sum, g) => sum + g.associatedTrainingMaterials.length,
                                            0,
                                        )}
                                    </p>
                                </div>
                                <div className="p-3 rounded-xl">
                                    <BookOpen className="h-5 w-5" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 " />
                        <Input
                            placeholder="Search by name or ID..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="pl-10 border-accent-300 focus:border-brand-500"
                        />
                    </div>
                    <Select value={filterDepartment} onValueChange={setFilterDepartment}>
                        <SelectTrigger className="w-full sm:w-64 border-accent-300 focus:border-brand-500">
                            <Filter className="h-4 w-4 mr-2" />
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Departments</SelectItem>
                            {departments.map(dept => (
                                <SelectItem key={dept.id} value={dept.id}>
                                    {dept.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Order Guides List */}
                <div className="space-y-4">
                    {filteredGuides.map(guide => {
                        const averageRating = calculateAverageRating(guide);

                        return (
                            <Card
                                key={guide.id}
                                className="border-gray-200/60 hover:shadow-lg transition-all duration-200"
                            >
                                <CardContent className="p-6">
                                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-start justify-between mb-3">
                                                <div>
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <h3 className="text-xl font-bold ">
                                                            {guide.orderGuideName}
                                                        </h3>
                                                        <Badge className="border-brand-200">
                                                            {guide.orderGuideID}
                                                        </Badge>
                                                    </div>
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <div className="flex items-center gap-2">
                                                            {renderStarRating(averageRating)}
                                                            <span className="text-sm font-medium ">
                                                                {averageRating > 0
                                                                    ? `${averageRating.toFixed(1)} / 5.0`
                                                                    : "No ratings yet"}
                                                            </span>
                                                        </div>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() =>
                                                                handleShowInsights(guide)
                                                            }
                                                            className="border-purple-300 h-7 px-2"
                                                        >
                                                            <Sparkles className="h-3.5 w-3.5 mr-1" />
                                                            <span className="text-xs">
                                                                Insights
                                                            </span>
                                                        </Button>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-sm ">
                                                        <Calendar className="h-4 w-4" />
                                                        <span>Created: {guide.timestamp}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="p-2 rounded-lg">
                                                        <Users className="h-4 w-4" />
                                                    </div>
                                                    <div>
                                                        <p className="text-xs ">Employees</p>
                                                        <p className="font-semibold ">
                                                            {guide.associatedEmployees.length}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    <div className="p-2 bg-secondary-100 rounded-lg">
                                                        <Package className="h-4 w-4 text-secondary-600" />
                                                    </div>
                                                    <div>
                                                        <p className="text-xs ">Items</p>
                                                        <p className="font-semibold ">
                                                            {guide.associatedItems.length}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    <div className="p-2 bg-purple-100 rounded-lg">
                                                        <Route className="h-4 w-4 text-purple-600" />
                                                    </div>
                                                    <div>
                                                        <p className="text-xs ">Training Paths</p>
                                                        <p className="font-semibold ">
                                                            {guide.associatedTrainingPaths
                                                                ?.length || 0}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    <div className="p-2 bg-success-100 rounded-lg">
                                                        <BookOpen className="h-4 w-4 text-success-600" />
                                                    </div>
                                                    <div>
                                                        <p className="text-xs ">
                                                            Training Materials
                                                        </p>
                                                        <p className="font-semibold ">
                                                            {
                                                                guide.associatedTrainingMaterials
                                                                    .length
                                                            }
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleView(guide)}
                                                className="border-brand-300"
                                            >
                                                <Eye className="h-4 w-4 mr-1" />
                                                View
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleEdit(guide)}
                                                className="border-accent-300"
                                                disabled={false}
                                            >
                                                <Edit className="h-4 w-4 mr-1" />
                                                Edit
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleDelete(guide)}
                                                className="border-danger-300 text-danger-700"
                                            >
                                                <Trash2 className="h-4 w-4 mr-1" />
                                                Delete
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>

                {filteredGuides.length === 0 && (
                    <div className="text-center py-12">
                        <BookOpen className="h-16 w-1 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No order guides found</h3>
                        <p className="mb-4">
                            {searchTerm || filterDepartment !== "all"
                                ? "Try adjusting your search criteria"
                                : "Get started by creating your first order guide"}
                        </p>
                        {!searchTerm && filterDepartment === "all" && (
                            <Button
                                onClick={handleCreate}
                                className="bg-brand-600 hover:bg-brand-700 text-white"
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Create Order Guide
                            </Button>
                        )}
                    </div>
                )}
            </div>

            {/* Modals */}
            <OrderGuideFormModal
                isOpen={isFormModalOpen && !editingGuide}
                onClose={() => {
                    setIsFormModalOpen(false);
                    setEditingGuide(null);
                }}
            />

            <OrderGuideEditModal
                isOpen={isFormModalOpen && !!editingGuide}
                onClose={() => {
                    setIsFormModalOpen(false);
                    setEditingGuide(null);
                }}
                editingGuide={editingGuide}
            />

            <OrderGuideViewModal
                isOpen={isViewModalOpen}
                onClose={() => {
                    setIsViewModalOpen(false);
                    setSelectedGuide(null);
                }}
                guide={selectedGuide}
            />

            <OrderGuideDeleteDialog
                isOpen={isDeleteDialogOpen}
                onClose={() => {
                    setIsDeleteDialogOpen(false);
                    setSelectedGuide(null);
                }}
                guide={selectedGuide}
            />

            <OrderItemManagementDialog
                isOpen={isOrderItemDialogOpen}
                onClose={() => setIsOrderItemDialogOpen(false)}
            />

            <OrderGuideInsightsModal
                isOpen={isInsightsModalOpen}
                onClose={() => {
                    setIsInsightsModalOpen(false);
                    setInsightsGuide(null);
                }}
                guide={insightsGuide}
            />
        </div>
    );
}
