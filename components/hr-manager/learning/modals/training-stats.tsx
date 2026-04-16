"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ChevronLeft, Columns3, Filter, Download, LayoutGrid } from "lucide-react";
import { TrainingMaterialRequestModel } from "@/lib/models/training-material";
import { useFirestore } from "@/context/firestore-context";
import { isAssigned } from "@/components/employee/training-management/employee-learning";
import { numberCommaSeparator } from "@/lib/backend/functions/numberCommaSeparator";

interface TraineeStatsModalProps {
    isOpen: boolean;
    onClose: () => void;
    trainingMaterial: TrainingMaterialRequestModel | null;
}

interface TraineeStatus {
    employeeId: string;
    firstName: string;
    middleName: string;
    surname: string;
    position: string;
    department: string;
    location: string;
    status: "Set" | "In Progress" | "Completed";
}

interface TraineeQuizResult {
    employeeId: string;
    firstName: string;
    middleName: string;
    surname: string;
    position: string;
    department: string;
    location: string;
    score: number;
    rank: number;
}

export function TraineeStatsModal({ isOpen, onClose, trainingMaterial }: TraineeStatsModalProps) {
    const { employees, quizzes, hrSettings } = useFirestore();
    const positions = hrSettings?.positions || [];
    const departments = hrSettings?.departmentSettings || [];
    const locations = hrSettings?.locations || [];
    const [activeTab, setActiveTab] = useState("status");
    const [density, setDensity] = useState<"compact" | "normal" | "comfortable">("normal");

    // Status tab state
    const [statusFilters, setStatusFilters] = useState({
        employeeId: "",
        firstName: "",
        middleName: "",
        surname: "",
        position: "",
        department: "",
        location: "",
        status: "all",
    });

    const [statusColumns, setStatusColumns] = useState({
        employeeId: true,
        firstName: true,
        middleName: true,
        surname: true,
        position: true,
        department: true,
        location: true,
        status: true,
    });

    // Quiz results tab state
    const [quizFilters, setQuizFilters] = useState({
        employeeId: "",
        firstName: "",
        middleName: "",
        surname: "",
        position: "",
        department: "",
        location: "",
        score: "",
        rank: "",
    });

    const [quizColumns, setQuizColumns] = useState({
        employeeId: true,
        firstName: true,
        middleName: true,
        surname: true,
        position: true,
        department: true,
        location: true,
        score: true,
        rank: true,
    });

    const traineeStatusData: TraineeStatus[] = trainingMaterial
        ? employees
            .filter(employee => isAssigned(trainingMaterial, employee))
            .map(employee => {
                const materialStatus = employee?.trainingMaterialStatus?.find(
                    tms => tms.trainingMaterialID === trainingMaterial.id,
                );
                return {
                    employeeId: employee?.employeeID || "",
                    firstName: employee?.firstName || "",
                    middleName: employee?.middleName || "",
                    surname: employee?.surname || "",
                    position:
                          positions.find(pos => pos.id === employee?.employmentPosition)?.name ||
                          "",
                    department:
                          departments.find(dep => dep.id === employee?.department)?.name || "",
                    location:
                          locations.find(loc => loc.id === employee?.workingLocation)?.name || "",
                    status:
                          (materialStatus?.status === "In progress"
                              ? "In Progress"
                              : materialStatus?.status) || "Set",
                };
            })
        : [];

    const quizResultsData: TraineeQuizResult[] =
        trainingMaterial?.associatedQuiz
            ?.flatMap(quizId => {
                const quiz = quizzes.find(q => q.id === quizId);
                if (!quiz?.quizTakenTimestamp) return [];

                return quiz.quizTakenTimestamp.map(timestamp => {
                    const employee = employees.find(emp => emp.uid === timestamp.employeeUid);
                    return {
                        employeeId: employee?.employeeID || timestamp.employeeUid,
                        firstName: employee?.firstName || "",
                        middleName: employee?.middleName || "",
                        surname: employee?.surname || "",
                        position:
                            positions.find(pos => pos.id === employee?.employmentPosition)?.name ||
                            "",
                        department:
                            departments.find(dep => dep.id === employee?.department)?.name || "",
                        location:
                            locations.find(loc => loc.id === employee?.workingLocation)?.name || "",
                        score: timestamp.score,
                        rank: 0, // Will be calculated below
                    };
                });
            })
            .filter((result, index, arr) => {
                // Remove duplicates by employeeId, keeping the highest score
                const existingIndex = arr.findIndex(r => r.employeeId === result.employeeId);
                if (existingIndex === index) return true;
                if (result.score > arr[existingIndex].score) {
                    arr[existingIndex] = result;
                }
                return false;
            })
            .map(result => ({
                ...result,
                rank: 0, // Placeholder, will be set below
            }))
            .sort((a, b) => b.score - a.score)
            .map((result, index) => ({
                ...result,
                rank: index + 1,
            })) || [];

    // Filter status data
    const filteredStatusData = traineeStatusData.filter(trainee => {
        return (
            trainee.employeeId.toLowerCase().includes(statusFilters.employeeId.toLowerCase()) &&
            trainee.firstName.toLowerCase().includes(statusFilters.firstName.toLowerCase()) &&
            trainee.middleName.toLowerCase().includes(statusFilters.middleName.toLowerCase()) &&
            trainee.surname.toLowerCase().includes(statusFilters.surname.toLowerCase()) &&
            trainee.position.toLowerCase().includes(statusFilters.position.toLowerCase()) &&
            trainee.department.toLowerCase().includes(statusFilters.department.toLowerCase()) &&
            trainee.location.toLowerCase().includes(statusFilters.location.toLowerCase()) &&
            (statusFilters.status === "all" ||
                statusFilters.status === "" ||
                trainee.status === statusFilters.status)
        );
    });

    // Filter quiz data
    const filteredQuizData = quizResultsData.filter(trainee => {
        return (
            trainee.employeeId.toLowerCase().includes(quizFilters.employeeId.toLowerCase()) &&
            trainee.firstName.toLowerCase().includes(quizFilters.firstName.toLowerCase()) &&
            trainee.middleName.toLowerCase().includes(quizFilters.middleName.toLowerCase()) &&
            trainee.surname.toLowerCase().includes(quizFilters.surname.toLowerCase()) &&
            trainee.position.toLowerCase().includes(quizFilters.position.toLowerCase()) &&
            trainee.department.toLowerCase().includes(quizFilters.department.toLowerCase()) &&
            trainee.location.toLowerCase().includes(quizFilters.location.toLowerCase()) &&
            (quizFilters.score === "" || trainee.score.toString().includes(quizFilters.score)) &&
            (quizFilters.rank === "" || trainee.rank.toString().includes(quizFilters.rank))
        );
    });

    // Export to CSV function
    const exportToCSV = (data: any[], filename: string, columns: any) => {
        const visibleColumns = Object.entries(columns)
            .filter(([_, visible]) => visible)
            .map(([key]) => key);

        const headers = visibleColumns.map(key => key.replace(/([A-Z])/g, " $1").trim());
        const csvContent = [
            headers.join(","),
            ...data.map(row =>
                visibleColumns
                    .map(key => {
                        const value = row[key];
                        return typeof value === "string" && value.includes(",")
                            ? `"${value}"`
                            : value;
                    })
                    .join(","),
            ),
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        link.click();
    };

    const handleExportStatus = () => {
        exportToCSV(filteredStatusData, "trainee-status.csv", statusColumns);
    };

    const handleExportQuiz = () => {
        exportToCSV(filteredQuizData, "trainee-quiz-results.csv", quizColumns);
    };

    const densityClasses = {
        compact: "py-1",
        normal: "py-2",
        comfortable: "py-4",
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-[95vw] h-[90vh] flex flex-col justify-start p-0 gap-0">
                <DialogHeader className="px-6 pt-6 pb-4 border-b">
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
                            <ChevronLeft className="h-5 w-5" />
                        </Button>
                        <DialogTitle className="text-2xl font-semibold">
                            Trainee Statistics {trainingMaterial && `- ${trainingMaterial.name}`}
                        </DialogTitle>
                    </div>
                </DialogHeader>

                <div className="flex flex-col justify-start overflow-hidden">
                    <div className="px-6 pt-4">
                        <div className="flex border-b border-accent-200 dark:border-border">
                            <button
                                onClick={() => setActiveTab("status")}
                                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                                    activeTab === "status"
                                        ? "border-brand-600 text-brand-600"
                                        : "border-transparent text-muted-foreground hover:text-foreground"
                                }`}
                            >
                                Training Status By Trainee
                            </button>
                            <button
                                onClick={() => setActiveTab("quiz")}
                                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                                    activeTab === "quiz"
                                        ? "border-brand-600 text-brand-600"
                                        : "border-transparent text-muted-foreground hover:text-foreground"
                                }`}
                            >
                                Quiz Result By Trainee
                            </button>
                        </div>
                    </div>

                    {/* Training Status Tab */}
                    {activeTab === "status" && (
                        <div className="flex flex-col overflow-hidden mt-0 p-6 pt-4 flex-1">
                            <div className="flex flex-col gap-4 flex-1 overflow-hidden">
                                {/* Toolbar */}
                                <div className="flex items-center gap-2 p-3 bg-brand-700 dark:bg-brand-800 rounded-lg flex-shrink-0">
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
                                                <h4 className="font-medium text-sm">
                                                    Toggle Columns
                                                </h4>
                                                <div className="space-y-2">
                                                    {Object.entries(statusColumns).map(
                                                        ([key, value]) => (
                                                            <div
                                                                key={key}
                                                                className="flex items-center space-x-2"
                                                            >
                                                                <Checkbox
                                                                    id={`status-col-${key}`}
                                                                    checked={value}
                                                                    onCheckedChange={checked =>
                                                                        setStatusColumns({
                                                                            ...statusColumns,
                                                                            [key]: checked as boolean,
                                                                        })
                                                                    }
                                                                />
                                                                <Label
                                                                    htmlFor={`status-col-${key}`}
                                                                    className="text-sm cursor-pointer"
                                                                >
                                                                    {key
                                                                        .replace(/([A-Z])/g, " $1")
                                                                        .trim()}
                                                                </Label>
                                                            </div>
                                                        ),
                                                    )}
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
                                                <Filter className="h-4 w-4 mr-2" />
                                                Filters
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-80">
                                            <div className="space-y-3">
                                                <h4 className="font-medium text-sm">Filter Data</h4>
                                                <div className="space-y-2">
                                                    <div>
                                                        <Label className="text-xs">
                                                            Employee ID
                                                        </Label>
                                                        <Input
                                                            placeholder="Search..."
                                                            value={statusFilters.employeeId}
                                                            onChange={e =>
                                                                setStatusFilters({
                                                                    ...statusFilters,
                                                                    employeeId: e.target.value,
                                                                })
                                                            }
                                                            className="h-8"
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label className="text-xs">
                                                            First Name
                                                        </Label>
                                                        <Input
                                                            placeholder="Search..."
                                                            value={statusFilters.firstName}
                                                            onChange={e =>
                                                                setStatusFilters({
                                                                    ...statusFilters,
                                                                    firstName: e.target.value,
                                                                })
                                                            }
                                                            className="h-8"
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label className="text-xs">Surname</Label>
                                                        <Input
                                                            placeholder="Search..."
                                                            value={statusFilters.surname}
                                                            onChange={e =>
                                                                setStatusFilters({
                                                                    ...statusFilters,
                                                                    surname: e.target.value,
                                                                })
                                                            }
                                                            className="h-8"
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label className="text-xs">Status</Label>
                                                        <Select
                                                            value={statusFilters.status}
                                                            onValueChange={value =>
                                                                setStatusFilters({
                                                                    ...statusFilters,
                                                                    status: value,
                                                                })
                                                            }
                                                        >
                                                            <SelectTrigger className="h-8">
                                                                <SelectValue placeholder="All statuses" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="all">
                                                                    All statuses
                                                                </SelectItem>
                                                                <SelectItem value="Set">
                                                                    Set
                                                                </SelectItem>
                                                                <SelectItem value="In Progress">
                                                                    In Progress
                                                                </SelectItem>
                                                                <SelectItem value="Completed">
                                                                    Completed
                                                                </SelectItem>
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
                                                <LayoutGrid className="h-4 w-4 mr-2" />
                                                Density
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-48">
                                            <div className="space-y-2">
                                                <h4 className="font-medium text-sm">Row Density</h4>
                                                <Select
                                                    value={density}
                                                    onValueChange={(value: any) =>
                                                        setDensity(value)
                                                    }
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="compact">
                                                            Compact
                                                        </SelectItem>
                                                        <SelectItem value="normal">
                                                            Normal
                                                        </SelectItem>
                                                        <SelectItem value="comfortable">
                                                            Comfortable
                                                        </SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </PopoverContent>
                                    </Popover>

                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleExportStatus}
                                        className="text-white hover:bg-white/10"
                                    >
                                        <Download className="h-4 w-4 mr-2" />
                                        Export
                                    </Button>
                                </div>

                                {/* Table */}
                                <div className="flex-1 overflow-auto border rounded-lg">
                                    <Table>
                                        <TableHeader className="bg-brand-700 dark:bg-brand-800 sticky top-0 z-10">
                                            <TableRow className="hover:bg-transparent border-none">
                                                {statusColumns.employeeId && (
                                                    <TableHead className="text-white font-medium">
                                                        Employee ID
                                                    </TableHead>
                                                )}
                                                {statusColumns.firstName && (
                                                    <TableHead className="text-white font-medium">
                                                        First Name
                                                    </TableHead>
                                                )}
                                                {statusColumns.middleName && (
                                                    <TableHead className="text-white font-medium">
                                                        Middle Name
                                                    </TableHead>
                                                )}
                                                {statusColumns.surname && (
                                                    <TableHead className="text-white font-medium">
                                                        Surname
                                                    </TableHead>
                                                )}
                                                {statusColumns.position && (
                                                    <TableHead className="text-white font-medium">
                                                        Position
                                                    </TableHead>
                                                )}
                                                {statusColumns.department && (
                                                    <TableHead className="text-white font-medium">
                                                        Department
                                                    </TableHead>
                                                )}
                                                {statusColumns.location && (
                                                    <TableHead className="text-white font-medium">
                                                        Location
                                                    </TableHead>
                                                )}
                                                {statusColumns.status && (
                                                    <TableHead className="text-white font-medium">
                                                        Status
                                                    </TableHead>
                                                )}
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredStatusData.length === 0 ? (
                                                <TableRow>
                                                    <TableCell
                                                        colSpan={
                                                            Object.values(statusColumns).filter(
                                                                Boolean,
                                                            ).length
                                                        }
                                                        className="text-center py-8 text-muted-foreground"
                                                    >
                                                        No rows
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                filteredStatusData.map((trainee, index) => (
                                                    <TableRow
                                                        key={index}
                                                        className="hover:bg-accent/50"
                                                    >
                                                        {statusColumns.employeeId && (
                                                            <TableCell
                                                                className={densityClasses[density]}
                                                            >
                                                                {trainee.employeeId}
                                                            </TableCell>
                                                        )}
                                                        {statusColumns.firstName && (
                                                            <TableCell
                                                                className={densityClasses[density]}
                                                            >
                                                                {trainee.firstName}
                                                            </TableCell>
                                                        )}
                                                        {statusColumns.middleName && (
                                                            <TableCell
                                                                className={densityClasses[density]}
                                                            >
                                                                {trainee.middleName || "-"}
                                                            </TableCell>
                                                        )}
                                                        {statusColumns.surname && (
                                                            <TableCell
                                                                className={densityClasses[density]}
                                                            >
                                                                {trainee.surname || "-"}
                                                            </TableCell>
                                                        )}
                                                        {statusColumns.position && (
                                                            <TableCell
                                                                className={densityClasses[density]}
                                                            >
                                                                {trainee.position}
                                                            </TableCell>
                                                        )}
                                                        {statusColumns.department && (
                                                            <TableCell
                                                                className={densityClasses[density]}
                                                            >
                                                                {trainee.department || "-"}
                                                            </TableCell>
                                                        )}
                                                        {statusColumns.location && (
                                                            <TableCell
                                                                className={densityClasses[density]}
                                                            >
                                                                {trainee.location || "-"}
                                                            </TableCell>
                                                        )}
                                                        {statusColumns.status && (
                                                            <TableCell
                                                                className={densityClasses[density]}
                                                            >
                                                                <span
                                                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                                        trainee.status ===
                                                                        "Completed"
                                                                            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                                                            : trainee.status ===
                                                                                "In Progress"
                                                                                ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                                                                                : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400"
                                                                    }`}
                                                                >
                                                                    {trainee.status}
                                                                </span>
                                                            </TableCell>
                                                        )}
                                                    </TableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Quiz Results Tab */}
                    {activeTab === "quiz" && (
                        <div className="flex flex-col overflow-hidden mt-0 p-6 pt-4 flex-1">
                            <div className="flex flex-col gap-4 flex-1 overflow-hidden">
                                {/* Toolbar */}
                                <div className="flex items-center gap-2 p-3 bg-brand-700 dark:bg-brand-800 rounded-lg flex-shrink-0">
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
                                                <h4 className="font-medium text-sm">
                                                    Toggle Columns
                                                </h4>
                                                <div className="space-y-2">
                                                    {Object.entries(quizColumns).map(
                                                        ([key, value]) => (
                                                            <div
                                                                key={key}
                                                                className="flex items-center space-x-2"
                                                            >
                                                                <Checkbox
                                                                    id={`quiz-col-${key}`}
                                                                    checked={value}
                                                                    onCheckedChange={checked =>
                                                                        setQuizColumns({
                                                                            ...quizColumns,
                                                                            [key]: checked as boolean,
                                                                        })
                                                                    }
                                                                />
                                                                <Label
                                                                    htmlFor={`quiz-col-${key}`}
                                                                    className="text-sm cursor-pointer"
                                                                >
                                                                    {key
                                                                        .replace(/([A-Z])/g, " $1")
                                                                        .trim()}
                                                                </Label>
                                                            </div>
                                                        ),
                                                    )}
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
                                                <Filter className="h-4 w-4 mr-2" />
                                                Filters
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-80">
                                            <div className="space-y-3">
                                                <h4 className="font-medium text-sm">Filter Data</h4>
                                                <div className="space-y-2">
                                                    <div>
                                                        <Label className="text-xs">
                                                            Employee ID
                                                        </Label>
                                                        <Input
                                                            placeholder="Search..."
                                                            value={quizFilters.employeeId}
                                                            onChange={e =>
                                                                setQuizFilters({
                                                                    ...quizFilters,
                                                                    employeeId: e.target.value,
                                                                })
                                                            }
                                                            className="h-8"
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label className="text-xs">
                                                            First Name
                                                        </Label>
                                                        <Input
                                                            placeholder="Search..."
                                                            value={quizFilters.firstName}
                                                            onChange={e =>
                                                                setQuizFilters({
                                                                    ...quizFilters,
                                                                    firstName: e.target.value,
                                                                })
                                                            }
                                                            className="h-8"
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label className="text-xs">Score</Label>
                                                        <Input
                                                            placeholder="Search..."
                                                            value={quizFilters.score}
                                                            onChange={e =>
                                                                setQuizFilters({
                                                                    ...quizFilters,
                                                                    score: e.target.value,
                                                                })
                                                            }
                                                            className="h-8"
                                                        />
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
                                                <LayoutGrid className="h-4 w-4 mr-2" />
                                                Density
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-48">
                                            <div className="space-y-2">
                                                <h4 className="font-medium text-sm">Row Density</h4>
                                                <Select
                                                    value={density}
                                                    onValueChange={(value: any) =>
                                                        setDensity(value)
                                                    }
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="compact">
                                                            Compact
                                                        </SelectItem>
                                                        <SelectItem value="normal">
                                                            Normal
                                                        </SelectItem>
                                                        <SelectItem value="comfortable">
                                                            Comfortable
                                                        </SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </PopoverContent>
                                    </Popover>

                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleExportQuiz}
                                        className="text-white hover:bg-white/10"
                                    >
                                        <Download className="h-4 w-4 mr-2" />
                                        Export
                                    </Button>
                                </div>

                                {/* Table */}
                                <div className="overflow-auto border rounded-lg">
                                    <Table>
                                        <TableHeader className="bg-brand-700 dark:bg-brand-800 sticky top-0 z-10">
                                            <TableRow className="hover:bg-transparent border-none">
                                                {quizColumns.employeeId && (
                                                    <TableHead className="text-white font-medium">
                                                        Employee ID
                                                    </TableHead>
                                                )}
                                                {quizColumns.firstName && (
                                                    <TableHead className="text-white font-medium">
                                                        First Name
                                                    </TableHead>
                                                )}
                                                {quizColumns.middleName && (
                                                    <TableHead className="text-white font-medium">
                                                        Middle Name
                                                    </TableHead>
                                                )}
                                                {quizColumns.surname && (
                                                    <TableHead className="text-white font-medium">
                                                        Surname
                                                    </TableHead>
                                                )}
                                                {quizColumns.position && (
                                                    <TableHead className="text-white font-medium">
                                                        Position
                                                    </TableHead>
                                                )}
                                                {quizColumns.department && (
                                                    <TableHead className="text-white font-medium">
                                                        Department
                                                    </TableHead>
                                                )}
                                                {quizColumns.location && (
                                                    <TableHead className="text-white font-medium">
                                                        Location
                                                    </TableHead>
                                                )}
                                                {quizColumns.score && (
                                                    <TableHead className="text-white font-medium">
                                                        Score
                                                    </TableHead>
                                                )}
                                                {quizColumns.rank && (
                                                    <TableHead className="text-white font-medium">
                                                        Rank
                                                    </TableHead>
                                                )}
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredQuizData.length === 0 ? (
                                                <TableRow>
                                                    <TableCell
                                                        colSpan={
                                                            Object.values(quizColumns).filter(
                                                                Boolean,
                                                            ).length
                                                        }
                                                        className="text-center py-8 text-muted-foreground"
                                                    >
                                                        No rows
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                filteredQuizData.map((trainee, index) => (
                                                    <TableRow
                                                        key={index}
                                                        className="hover:bg-accent/50"
                                                    >
                                                        {quizColumns.employeeId && (
                                                            <TableCell
                                                                className={densityClasses[density]}
                                                            >
                                                                {trainee.employeeId}
                                                            </TableCell>
                                                        )}
                                                        {quizColumns.firstName && (
                                                            <TableCell
                                                                className={densityClasses[density]}
                                                            >
                                                                {trainee.firstName}
                                                            </TableCell>
                                                        )}
                                                        {quizColumns.middleName && (
                                                            <TableCell
                                                                className={densityClasses[density]}
                                                            >
                                                                {trainee.middleName || "-"}
                                                            </TableCell>
                                                        )}
                                                        {quizColumns.surname && (
                                                            <TableCell
                                                                className={densityClasses[density]}
                                                            >
                                                                {trainee.surname}
                                                            </TableCell>
                                                        )}
                                                        {quizColumns.position && (
                                                            <TableCell
                                                                className={densityClasses[density]}
                                                            >
                                                                {trainee.position}
                                                            </TableCell>
                                                        )}
                                                        {quizColumns.department && (
                                                            <TableCell
                                                                className={densityClasses[density]}
                                                            >
                                                                {trainee.department || "-"}
                                                            </TableCell>
                                                        )}
                                                        {quizColumns.location && (
                                                            <TableCell
                                                                className={densityClasses[density]}
                                                            >
                                                                {trainee.location || "-"}
                                                            </TableCell>
                                                        )}
                                                        {quizColumns.score && (
                                                            <TableCell
                                                                className={densityClasses[density]}
                                                            >
                                                                <span className="font-semibold text-brand-600">
                                                                    {numberCommaSeparator(
                                                                        trainee.score,
                                                                    )}
                                                                </span>
                                                            </TableCell>
                                                        )}
                                                        {quizColumns.rank && (
                                                            <TableCell
                                                                className={densityClasses[density]}
                                                            >
                                                                <span
                                                                    className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                                                                        trainee.rank === 1
                                                                            ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                                                                            : trainee.rank === 2
                                                                                ? "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400"
                                                                                : trainee.rank === 3
                                                                                    ? "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400"
                                                                                    : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                                                                    }`}
                                                                >
                                                                    {trainee.rank}
                                                                </span>
                                                            </TableCell>
                                                        )}
                                                    </TableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
