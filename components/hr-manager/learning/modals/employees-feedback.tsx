"use client";

import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Columns3, Filter, Rows, Download, ChevronLeft, ChevronRight, Star, X } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { TrainingMaterialRequestModel } from "@/lib/models/training-material";
import { useFirestore } from "@/context/firestore-context";
import { isAssigned } from "@/components/employee/training-management/employee-learning";

interface EmployeeFeedback {
    employeeId: string;
    firstName: string;
    middleName: string;
    employmentPosition: string;
    department: string;
    rating: number;
    comment: string;
}

interface EmployeesFeedbackModalProps {
    isOpen: boolean;
    onClose: () => void;
    trainingMaterial: TrainingMaterialRequestModel | null;
}

export function EmployeesFeedbackModal({
    isOpen,
    onClose,
    trainingMaterial,
}: EmployeesFeedbackModalProps) {
    const { employees, hrSettings } = useFirestore();
    const positions = hrSettings?.positions || [];
    const departments = hrSettings?.departmentSettings || [];
    const [currentPage, setCurrentPage] = useState(1);
    const [density, setDensity] = useState<"compact" | "normal" | "comfortable">("normal");
    const [filters, setFilters] = useState({
        employeeId: "",
        firstName: "",
        middleName: "",
        employmentPosition: "",
        department: "",
        rating: "all",
        comment: "",
    });
    const [visibleColumns, setVisibleColumns] = useState({
        employeeId: true,
        firstName: true,
        middleName: true,
        employmentPosition: true,
        department: true,
        rating: true,
        comment: true,
    });

    const itemsPerPage = density === "compact" ? 15 : density === "normal" ? 10 : 8;

    // Real data from training material feedbacks
    const feedbackData: EmployeeFeedback[] =
        trainingMaterial?.employeeFeedbacks?.map(feedback => {
            const employee = employees.find(emp => emp.uid === feedback.employeeUid);
            return {
                employeeId: employee?.employeeID || feedback.employeeUid,
                firstName: employee?.firstName || "",
                middleName: employee?.middleName || "",
                employmentPosition:
                    positions.find(pos => pos.id === employee?.employmentPosition)?.name || "",
                department: departments.find(dep => dep.id === employee?.department)?.name || "",
                rating: feedback.rating,
                comment: feedback.comment,
            };
        }) || [];

    const filteredData = useMemo(() => {
        return feedbackData.filter(item => {
            return (
                item.employeeId.toLowerCase().includes(filters.employeeId.toLowerCase()) &&
                item.firstName.toLowerCase().includes(filters.firstName.toLowerCase()) &&
                item.middleName.toLowerCase().includes(filters.middleName.toLowerCase()) &&
                item.employmentPosition
                    .toLowerCase()
                    .includes(filters.employmentPosition.toLowerCase()) &&
                item.department.toLowerCase().includes(filters.department.toLowerCase()) &&
                (filters.rating === "" ||
                    filters.rating === "all" ||
                    item.rating.toString() === filters.rating) &&
                item.comment.toLowerCase().includes(filters.comment.toLowerCase())
            );
        });
    }, [feedbackData, filters]);

    const totalItems = filteredData.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
    const currentData = filteredData.slice(startIndex, endIndex);

    const handleExport = () => {
        const headers = Object.keys(visibleColumns)
            .filter(key => visibleColumns[key as keyof typeof visibleColumns])
            .map(key => {
                const headerMap: Record<string, string> = {
                    employeeId: "Employee ID",
                    firstName: "First Name",
                    middleName: "Middle Name",
                    employmentPosition: "Employment Position",
                    department: "Department",
                    rating: "Rating",
                    comment: "Comment",
                };
                return headerMap[key];
            });

        const csvContent = [
            headers.join(","),
            ...filteredData.map(row => {
                const values = [];
                if (visibleColumns.employeeId) values.push(`"${row.employeeId}"`);
                if (visibleColumns.firstName) values.push(`"${row.firstName}"`);
                if (visibleColumns.middleName) values.push(`"${row.middleName}"`);
                if (visibleColumns.employmentPosition) values.push(`"${row.employmentPosition}"`);
                if (visibleColumns.department) values.push(`"${row.department}"`);
                if (visibleColumns.rating) values.push(row.rating);
                if (visibleColumns.comment) values.push(`"${row.comment.replace(/"/g, '""')}"`);
                return values.join(",");
            }),
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute(
            "download",
            `employees_feedback_${trainingMaterial?.id || "export"}_${new Date().toISOString().split("T")[0]}.csv`,
        );
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const clearFilters = () => {
        setFilters({
            employeeId: "",
            firstName: "",
            middleName: "",
            employmentPosition: "",
            department: "",
            rating: "all",
            comment: "",
        });
        setCurrentPage(1);
    };

    const hasActiveFilters = Object.entries(filters).some(([key, value]) => {
        if (key === "rating") return value !== "all" && value !== "";
        return value !== "";
    });

    const toggleColumn = (column: keyof typeof visibleColumns) => {
        setVisibleColumns(prev => ({ ...prev, [column]: !prev[column] }));
    };

    const renderStars = (rating: number) => {
        return (
            <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map(star => (
                    <Star
                        key={star}
                        className={`h-4 w-4 ${
                            star <= rating
                                ? "fill-amber-400 text-amber-400"
                                : "fill-gray-300 text-gray-300 dark:fill-gray-600 dark:text-gray-600"
                        }`}
                    />
                ))}
            </div>
        );
    };

    const densityPadding = density === "compact" ? "py-1" : density === "normal" ? "py-2" : "py-3";

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-[95vw] max-h-[90vh] overflow-hidden flex flex-col">
                <DialogHeader className="flex-shrink-0">
                    <DialogTitle className="text-2xl font-bold text-brand-800 dark:text-white">
                        Employees Feedback
                        {trainingMaterial && (
                            <span className="block text-sm font-normal text-muted-foreground mt-1">
                                {trainingMaterial.name}
                            </span>
                        )}
                    </DialogTitle>
                </DialogHeader>

                <div className="flex-1 flex flex-col overflow-hidden">
                    {/* Toolbar */}
                    <div className="flex items-center gap-2 p-4 bg-brand-700 dark:bg-brand-800 rounded-t-lg flex-shrink-0">
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-white hover:bg-white/10"
                                >
                                    <Columns3 className="h-4 w-4 mr-2" />
                                    Columns
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-64">
                                <div className="space-y-3">
                                    <h4 className="font-semibold text-sm">Toggle Columns</h4>
                                    {Object.keys(visibleColumns).map(column => (
                                        <div key={column} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={column}
                                                checked={
                                                    visibleColumns[
                                                        column as keyof typeof visibleColumns
                                                    ]
                                                }
                                                onCheckedChange={() =>
                                                    toggleColumn(
                                                        column as keyof typeof visibleColumns,
                                                    )
                                                }
                                            />
                                            <Label
                                                htmlFor={column}
                                                className="text-sm cursor-pointer"
                                            >
                                                {column
                                                    .replace(/([A-Z])/g, " $1")
                                                    .replace(/^./, str => str.toUpperCase())
                                                    .trim()}
                                            </Label>
                                        </div>
                                    ))}
                                </div>
                            </PopoverContent>
                        </Popover>

                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-white hover:bg-white/10"
                                >
                                    <Filter className="h-4 w-4 mr-2" />
                                    Filters
                                    {hasActiveFilters && (
                                        <span className="ml-1 px-1.5 py-0.5 bg-amber-400 text-brand-800 rounded-full text-xs">
                                            •
                                        </span>
                                    )}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-80">
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h4 className="font-semibold text-sm">Filter Data</h4>
                                        {hasActiveFilters && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={clearFilters}
                                                className="h-auto p-1"
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                    <div className="space-y-3">
                                        <div>
                                            <Label htmlFor="filter-employeeId" className="text-xs">
                                                Employee ID
                                            </Label>
                                            <Input
                                                id="filter-employeeId"
                                                placeholder="Search..."
                                                value={filters.employeeId}
                                                onChange={e =>
                                                    setFilters({
                                                        ...filters,
                                                        employeeId: e.target.value,
                                                    })
                                                }
                                                className="h-8"
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="filter-firstName" className="text-xs">
                                                First Name
                                            </Label>
                                            <Input
                                                id="filter-firstName"
                                                placeholder="Search..."
                                                value={filters.firstName}
                                                onChange={e =>
                                                    setFilters({
                                                        ...filters,
                                                        firstName: e.target.value,
                                                    })
                                                }
                                                className="h-8"
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="filter-department" className="text-xs">
                                                Department
                                            </Label>
                                            <Input
                                                id="filter-department"
                                                placeholder="Search..."
                                                value={filters.department}
                                                onChange={e =>
                                                    setFilters({
                                                        ...filters,
                                                        department: e.target.value,
                                                    })
                                                }
                                                className="h-8"
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="filter-rating" className="text-xs">
                                                Rating
                                            </Label>
                                            <Select
                                                value={filters.rating || "all"}
                                                onValueChange={value =>
                                                    setFilters({ ...filters, rating: value })
                                                }
                                            >
                                                <SelectTrigger className="h-8">
                                                    <SelectValue placeholder="All ratings" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="all">All ratings</SelectItem>
                                                    <SelectItem value="5">5 stars</SelectItem>
                                                    <SelectItem value="4">4 stars</SelectItem>
                                                    <SelectItem value="3">3 stars</SelectItem>
                                                    <SelectItem value="2">2 stars</SelectItem>
                                                    <SelectItem value="1">1 star</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </div>
                            </PopoverContent>
                        </Popover>

                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-white hover:bg-white/10"
                                >
                                    <Rows className="h-4 w-4 mr-2" />
                                    Density
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-48">
                                <div className="space-y-2">
                                    <h4 className="font-semibold text-sm mb-3">Row Density</h4>
                                    <Button
                                        variant={density === "compact" ? "default" : "ghost"}
                                        size="sm"
                                        className="w-full justify-start"
                                        onClick={() => setDensity("compact")}
                                    >
                                        Compact
                                    </Button>
                                    <Button
                                        variant={density === "normal" ? "default" : "ghost"}
                                        size="sm"
                                        className="w-full justify-start"
                                        onClick={() => setDensity("normal")}
                                    >
                                        Normal
                                    </Button>
                                    <Button
                                        variant={density === "comfortable" ? "default" : "ghost"}
                                        size="sm"
                                        className="w-full justify-start"
                                        onClick={() => setDensity("comfortable")}
                                    >
                                        Comfortable
                                    </Button>
                                </div>
                            </PopoverContent>
                        </Popover>

                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-white hover:bg-white/10"
                            onClick={handleExport}
                        >
                            <Download className="h-4 w-4 mr-2" />
                            Export
                        </Button>
                    </div>

                    {/* Table Container */}
                    <div className="flex-1 overflow-auto border-x border-b border-accent-200 dark:border-border rounded-b-lg">
                        <Table>
                            <TableHeader className="sticky top-0 bg-brand-700 dark:bg-brand-800 z-10">
                                <TableRow className="hover:bg-transparent border-b-0">
                                    {visibleColumns.employeeId && (
                                        <TableHead className="text-amber-200 font-semibold">
                                            Employee ID
                                        </TableHead>
                                    )}
                                    {visibleColumns.firstName && (
                                        <TableHead className="text-amber-200 font-semibold">
                                            First Name
                                        </TableHead>
                                    )}
                                    {visibleColumns.middleName && (
                                        <TableHead className="text-amber-200 font-semibold">
                                            Middle Name
                                        </TableHead>
                                    )}
                                    {visibleColumns.employmentPosition && (
                                        <TableHead className="text-amber-200 font-semibold">
                                            Employment Position
                                        </TableHead>
                                    )}
                                    {visibleColumns.department && (
                                        <TableHead className="text-amber-200 font-semibold">
                                            Department
                                        </TableHead>
                                    )}
                                    {visibleColumns.rating && (
                                        <TableHead className="text-amber-200 font-semibold">
                                            Rating
                                        </TableHead>
                                    )}
                                    {visibleColumns.comment && (
                                        <TableHead className="text-amber-200 font-semibold">
                                            Comment
                                        </TableHead>
                                    )}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {currentData.length === 0 ? (
                                    <TableRow>
                                        <TableCell
                                            colSpan={
                                                Object.values(visibleColumns).filter(Boolean).length
                                            }
                                            className="h-64 text-center text-muted-foreground"
                                        >
                                            {hasActiveFilters
                                                ? "No results found for the current filters"
                                                : "No rows"}
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    currentData.map((feedback, index) => (
                                        <TableRow key={index} className="hover:bg-accent/50">
                                            {visibleColumns.employeeId && (
                                                <TableCell
                                                    className={`font-medium ${densityPadding}`}
                                                >
                                                    {feedback.employeeId}
                                                </TableCell>
                                            )}
                                            {visibleColumns.firstName && (
                                                <TableCell className={densityPadding}>
                                                    {feedback.firstName}
                                                </TableCell>
                                            )}
                                            {visibleColumns.middleName && (
                                                <TableCell className={densityPadding}>
                                                    {feedback.middleName}
                                                </TableCell>
                                            )}
                                            {visibleColumns.employmentPosition && (
                                                <TableCell className={densityPadding}>
                                                    {feedback.employmentPosition}
                                                </TableCell>
                                            )}
                                            {visibleColumns.department && (
                                                <TableCell className={densityPadding}>
                                                    {feedback.department}
                                                </TableCell>
                                            )}
                                            {visibleColumns.rating && (
                                                <TableCell className={densityPadding}>
                                                    {renderStars(feedback.rating)}
                                                </TableCell>
                                            )}
                                            {visibleColumns.comment && (
                                                <TableCell
                                                    className={`max-w-xs truncate ${densityPadding}`}
                                                >
                                                    {feedback.comment}
                                                </TableCell>
                                            )}
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination */}
                    <div className="flex items-center justify-end gap-4 p-4 border-t border-accent-200 dark:border-border flex-shrink-0">
                        <span className="text-sm text-muted-foreground">
                            {totalItems === 0 ? "0-0" : `${startIndex + 1}-${endIndex}`} of{" "}
                            {totalItems}
                        </span>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                disabled={currentPage === 1 || totalItems === 0}
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                    setCurrentPage(prev => Math.min(totalPages, prev + 1))
                                }
                                disabled={currentPage === totalPages || totalItems === 0}
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
