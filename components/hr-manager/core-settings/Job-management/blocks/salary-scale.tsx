"use client";

import { useTheme } from "@/components/theme-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { useToast } from "@/context/toastContext";
import {
    hrSettingsService,
    SalaryScaleModel,
    ScaleModel,
} from "@/lib/backend/firebase/hrSettingsService";
import { JOB_MANAGEMENT_LOG_MESSAGES } from "@/lib/log-descriptions/job-management";
import { cn } from "@/lib/utils";
import { Plus, Settings } from "lucide-react";
import { useState } from "react";

export default function SalaryScale() {
    const { hrSettings } = useFirestore();
    const salaryScales = hrSettings.salaryScales;
    const GradeDefinition = hrSettings.grades;

    const getGradeName = (grade: string) => {
        const gradeName = GradeDefinition.find(g => g.id === grade);
        return gradeName?.grade || "unknown";
    };

    const { showToast } = useToast();
    const { theme } = useTheme();
    const { userData } = useAuth();

    const [currentScale, setCurrentScale] = useState<SalaryScaleModel>(
        salaryScales[0] || {
            numberOfSteps: 5,
            scales: [],
        },
    );

    const [showConfigModal, setShowConfigModal] = useState(false);
    const [showCellModal, setShowCellModal] = useState(false);
    const [editingCell, setEditingCell] = useState<{ row: number; column: number } | null>(null);
    const [cellSalary, setCellSalary] = useState<number>(0);

    const [selectedGrades, setSelectedGrades] = useState<string[]>([]);

    const [configForm, setConfigForm] = useState({
        numberOfSteps: currentScale.numberOfSteps,
        grades:
            Array.from(new Set(currentScale.scales.map(s => s.grade))).join(", ") ||
            "Grade A, Grade B, Grade C",
    });

    const getUniqueGrades = () => {
        const grades = Array.from(new Set(currentScale.scales.map(s => s.grade)));
        return grades.length > 0 ? grades : ["Grade A", "Grade B", "Grade C"];
    };

    const getSalaryForCell = (row: number, column: number) => {
        const scale = currentScale.scales.find(s => s.row === row && s.column === column);
        return scale?.salary || 0;
    };

    const handleCellClick = (row: number, column: number) => {
        setEditingCell({ row, column });
        setCellSalary(getSalaryForCell(row, column));
        setShowCellModal(true);
    };

    const handleUpdateCell = () => {
        if (!editingCell) return;

        const updatedScales = [...currentScale.scales];
        const existingIndex = updatedScales.findIndex(
            s => s.row === editingCell.row && s.column === editingCell.column,
        );

        const grade = getUniqueGrades()[editingCell.row - 1] || `Grade ${editingCell.row}`;

        if (existingIndex >= 0) {
            updatedScales[existingIndex] = {
                ...updatedScales[existingIndex],
                salary: cellSalary,
            };
        } else {
            updatedScales.push({
                row: editingCell.row,
                column: editingCell.column,
                grade,
                salary: cellSalary,
            });
        }

        setCurrentScale({ ...currentScale, scales: updatedScales });
        setShowCellModal(false);
        setEditingCell(null);
    };

    const handleGradeToggle = (grade: string) => {
        setSelectedGrades(prev =>
            prev.includes(grade) ? prev.filter(g => g !== grade) : [...prev, grade],
        );
    };
    const handleConfigUpdate = () => {
        console.log("selectedGrades", selectedGrades);
        const grades = selectedGrades;
        const newScales: ScaleModel[] = [];

        // Generate new scale matrix based on configuration
        for (let row = 1; row <= grades.length; row++) {
            for (let col = 1; col <= configForm.numberOfSteps; col++) {
                const existingSalary = getSalaryForCell(row, col);
                newScales.push({
                    row,
                    column: col,
                    grade: grades[row - 1],
                    salary: existingSalary,
                });
            }
        }
        console.log("newScales", newScales);
        setCurrentScale({
            ...currentScale,
            numberOfSteps: configForm.numberOfSteps,
            scales: newScales,
        });
        setShowConfigModal(false);
    };

    const handleSaveScale = async () => {
        try {
            // the grade must be unique
            const existingSalaryScale = salaryScales.find(
                salaryScale =>
                    salaryScale.numberOfSteps === configForm.numberOfSteps &&
                    (!currentScale.id || salaryScale.id !== currentScale.id),
            );

            if (existingSalaryScale) {
                showToast("Number of steps must be unique", "error", "error");
                return;
            }

            if (salaryScales.length > 0) {
                const firstScaleId = salaryScales[0].id;
                await hrSettingsService.update(
                    "salaryScales",
                    firstScaleId,
                    currentScale,
                    userData?.uid ?? "",
                    JOB_MANAGEMENT_LOG_MESSAGES.SALARY_SCALE_UPDATED({
                        numberOfSteps: currentScale.numberOfSteps,
                        scales: [
                            ...currentScale.scales.map(s => ({
                                row: s.row,
                                column: s.column,
                                grade: s.grade,
                                salary: s ? s.salary : 0,
                            })),
                        ],
                        id: currentScale.id,
                    }),
                );
                showToast("Salary scale updated successfully", "success", "success");
            } else {
                // Only create a new document if none exists
                const docId = await hrSettingsService.create(
                    "salaryScales",
                    {
                        ...currentScale,
                    },
                    userData?.uid ?? "",
                    JOB_MANAGEMENT_LOG_MESSAGES.SALARY_SCALE_CREATED({
                        numberOfSteps: currentScale.numberOfSteps,
                        scales: [
                            ...currentScale.scales.map(s => ({
                                row: s.row,
                                column: s.column,
                                grade: s.grade,
                                salary: s ? s.salary : 0,
                            })),
                        ],
                    }),
                );
                // Update the current scale with the new ID
                setCurrentScale({
                    ...currentScale,
                    id: docId,
                });
                showToast("Salary scale created successfully", "success", "success");
            }
        } catch (error) {
            console.error("Error saving salary scale:", error);
            showToast("Failed to save salary scale", "error", "error");
        }
    };

    return (
        <Card
            className={`${theme === "dark" ? "bg-black border" : "bg-white/80 backdrop-blur-sm"} shadow-2xl rounded-2xl overflow-hidden`}
        >
            <CardHeader
                className={`${theme === "dark" ? "bg-black text-white" : "bg-amber-800 border-gray-200"} rounded-t-2xl`}
            >
                <div className="flex items-center justify-between">
                    <CardTitle
                        className={`text-xl font-bold ${theme === "dark" ? "text-white" : "text-white"}`}
                    >
                        gte
                    </CardTitle>
                    <div className="flex gap-2">
                        <Dialog open={showConfigModal} onOpenChange={setShowConfigModal}>
                            <DialogTrigger asChild>
                                <Button
                                    variant="outline"
                                    className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                                >
                                    <Settings className="h-4 w-4 mr-2" />
                                    Configure
                                </Button>
                            </DialogTrigger>
                            <DialogContent
                                className={`max-w-2xl rounded-2xl ${theme === "dark" ? "bg-black " : "bg-white backdrop-blur-sm border-0"}`}
                            >
                                <DialogHeader>
                                    <DialogTitle
                                        className={`text-xl font-bold ${theme === "dark" ? "text-white" : "text-black"}`}
                                    >
                                        Configure Salary Scale
                                    </DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                    <div>
                                        <Label
                                            htmlFor="numberOfSteps"
                                            className={`text-sm font-medium mb-2 block ${theme === "dark" ? "text-white" : "text-black"}`}
                                        >
                                            Number of Steps
                                        </Label>
                                        <Input
                                            id="numberOfSteps"
                                            type="number"
                                            min="1"
                                            max="10"
                                            value={configForm.numberOfSteps}
                                            onChange={e =>
                                                setConfigForm({
                                                    ...configForm,
                                                    numberOfSteps:
                                                        Number.parseInt(e.target.value) || 1,
                                                })
                                            }
                                            placeholder="Enter number of steps"
                                            className={cn(
                                                theme === "dark"
                                                    ? "bg-black text-white border-gray-600 placeholder:text-gray-500"
                                                    : "bg-white border-gray-300",
                                                "rounded-xl",
                                            )}
                                        />
                                    </div>
                                    <div>
                                        {GradeDefinition.map(grade => (
                                            <div
                                                key={grade.id}
                                                className="flex items-center space-x-2"
                                            >
                                                <Checkbox
                                                    id={`grade-${grade.id}`}
                                                    checked={selectedGrades.includes(grade.id)}
                                                    onCheckedChange={() =>
                                                        handleGradeToggle(grade.id)
                                                    }
                                                    className={
                                                        theme === "dark"
                                                            ? "border-gray-600 data-[state=checked]:bg-amber-600"
                                                            : "data-[state=checked]:bg-amber-600"
                                                    }
                                                />
                                                <Label
                                                    htmlFor={`grade-${grade.id}`}
                                                    className={`text-sm cursor-pointer flex-1 ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}
                                                >
                                                    <div>
                                                        <div className="font-medium">
                                                            {grade.grade}
                                                        </div>
                                                    </div>
                                                </Label>
                                            </div>
                                        ))}
                                        <Label
                                            htmlFor="grades"
                                            className={`text-sm font-medium mb-2 block ${theme === "dark" ? "text-white" : "text-black"}`}
                                        >
                                            Grades
                                        </Label>
                                    </div>
                                    <div className="flex justify-end gap-3">
                                        <Button
                                            variant="outline"
                                            onClick={() => setShowConfigModal(false)}
                                            className={`${theme === "dark" ? "text-white" : "text-black"}`}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            onClick={handleConfigUpdate}
                                            className="bg-amber-600 hover:bg-amber-700 text-white"
                                        >
                                            Update Configuration
                                        </Button>
                                    </div>
                                </div>
                            </DialogContent>
                        </Dialog>

                        <Button
                            onClick={handleSaveScale}
                            className="bg-amber-600 hover:bg-amber-700 text-white rounded-xl"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Save Scale
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-6">
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3
                            className={`text-lg font-semibold ${theme === "dark" ? "text-white" : "text-black"}`}
                        >
                            Salary Matrix ({getUniqueGrades().length} Grades ×{" "}
                            {currentScale.numberOfSteps} Steps)
                        </h3>
                        <Badge
                            className={`b text-amber-800 border-amber-200 ${theme === "dark" ? "text-white" : "text-black"}`}
                        >
                            {currentScale.scales.filter(s => s.salary && s.salary > 0).length} cells
                            configured
                        </Badge>
                    </div>

                    <div className="overflow-x-auto">
                        <Table className="border border-gray-200">
                            <TableHeader>
                                <TableRow
                                    className={`${theme === "dark" ? "bg-gray-900/50" : "bg-white"} hover:${theme === "dark" ? "bg-gray-700/50" : "bg-amber-50/50"} cursor-pointer transition-colors`}
                                >
                                    <TableHead
                                        className={`border  w-32 ${theme === "dark" ? "border-gray-200 font-semibold text-amber-800" : "border-gray-200 font-semibold text-amber-800"}`}
                                    >
                                        Grade / Step
                                    </TableHead>
                                    {Array.from({ length: currentScale.numberOfSteps }, (_, i) => (
                                        <TableHead
                                            key={i + 1}
                                            className={`border ${theme === "dark" ? "border-gray-200 font-semibold text-amber-800" : "border-gray-200 font-semibold text-amber-800"} text-center font-semibold text-amber-800 ${theme === "dark" ? "text-white" : "text-black"}`}
                                        >
                                            Step {i + 1}
                                        </TableHead>
                                    ))}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {getUniqueGrades().map((grade, rowIndex) => (
                                    <TableRow
                                        key={grade}
                                        className={`${rowIndex % 2 === 0 ? (theme === "dark" ? "bg-gray-900/50" : "bg-white") : theme === "dark" ? "bg-gray-800/50" : "bg-gray-50"} hover:${theme === "dark" ? "bg-gray-700/50" : "bg-amber-50/50"} cursor-pointer transition-colors`}
                                    >
                                        <TableCell className="border border-gray-200 font-semibold text-amber-800">
                                            {getGradeName(grade)}
                                        </TableCell>
                                        {Array.from(
                                            { length: currentScale.numberOfSteps },
                                            (_, colIndex) => {
                                                const salary = getSalaryForCell(
                                                    rowIndex + 1,
                                                    colIndex + 1,
                                                );
                                                return (
                                                    <TableCell
                                                        key={colIndex + 1}
                                                        className="border border-gray-200 text-center cursor-pointer ho00 transition-colors"
                                                        onClick={() =>
                                                            handleCellClick(
                                                                rowIndex + 1,
                                                                colIndex + 1,
                                                            )
                                                        }
                                                    >
                                                        {salary > 0 ? (
                                                            <div className="space-y-1">
                                                                <div className="font-semibold text-green-700">
                                                                    {salary.toLocaleString()}
                                                                </div>
                                                                <Badge className="bg-green-100 text-green-800 text-xs">
                                                                    Configured
                                                                </Badge>
                                                            </div>
                                                        ) : (
                                                            <div className="text-gray-400 py-4">
                                                                <div className="text-sm">
                                                                    Click to set
                                                                </div>
                                                                <div className="text-xs">
                                                                    salary
                                                                </div>
                                                            </div>
                                                        )}
                                                    </TableCell>
                                                );
                                            },
                                        )}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>

                <Dialog open={showCellModal} onOpenChange={setShowCellModal}>
                    <DialogContent
                        className={`max-w-md rounded-2xl ${theme === "dark" ? "bg-black " : "bg-white backdrop-blur-sm"}`}
                    >
                        <DialogHeader>
                            <DialogTitle
                                className={`text-xl font-bold ${theme === "dark" ? "text-white" : "text-primary-900"}`}
                            >
                                Set Salary -{" "}
                                {editingCell &&
                                    getGradeName(getUniqueGrades()[editingCell.row - 1])}{" "}
                                Step {editingCell?.column}
                            </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div>
                                <Label
                                    htmlFor="cellSalary"
                                    className={`text-lg font-semibold ${theme === "dark" ? "text-white" : "text-primary-900"}`}
                                >
                                    Salary Amount
                                </Label>
                                <Input
                                    id="cellSalary"
                                    type="number"
                                    value={cellSalary}
                                    onChange={e =>
                                        setCellSalary(Number.parseInt(e.target.value) || 0)
                                    }
                                    placeholder="Enter salary amount"
                                    className={cn(
                                        theme === "dark"
                                            ? "bg-black text-white border-gray-600 placeholder:text-gray-500"
                                            : "bg-white border-gray-300",
                                        "rounded-xl",
                                    )}
                                />
                            </div>
                            <div className="flex justify-end gap-3">
                                <Button
                                    className={`text-lg font-semibold ${theme === "dark" ? "text-white" : "text-primary-900"}`}
                                    variant="outline"
                                    onClick={() => setShowCellModal(false)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleUpdateCell}
                                    className="bg-amber-600 hover:bg-amber-700 text-white"
                                >
                                    Update Salary
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </CardContent>
        </Card>
    );
}
