import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, ChevronDown, Search, X, Loader2 } from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { EmployeeModel } from "@/lib/models/employee";

interface DeductionEntry {
    timestamp: string;
    id: string;
    employees: EmployeeModel[];
    deductionTypeName: string;
    deductionAmount: number;
    monthlyAmounts: { [month: string]: number };
}

interface AddEditDeductionDialogProps {
    isAddDeductionDialogOpen: boolean;
    setIsAddDeductionDialogOpen: (open: boolean) => void;
    isDeductionEditMode: boolean;
    editingDeductionId: string | null;
    newDeduction: Partial<DeductionEntry>;
    setNewDeduction: (deduction: Partial<DeductionEntry>) => void;
    selectedEmployeesForDeductionForm: EmployeeModel[];
    setSelectedEmployeesForDeductionForm: (employees: EmployeeModel[]) => void;
    deductionEmployeeSearchTerm: string;
    setDeductionEmployeeSearchTerm: (term: string) => void;
    isDeductionEmployeePopoverOpen: boolean;
    setIsDeductionEmployeePopoverOpen: (open: boolean) => void;
    filteredDeductionEmployees: EmployeeModel[];
    handleDeductionEmployeeToggle: (employee: EmployeeModel) => void;
    removeDeductionEmployee: (id: string) => void;
    deductionTypes: any[];
    handleAddDeduction: () => void;
    isAddEditLoading: boolean;
    deductionsData: DeductionEntry[];
}

export function AddEditDeductionDialog({
    isAddDeductionDialogOpen,
    setIsAddDeductionDialogOpen,
    isDeductionEditMode,
    editingDeductionId,
    newDeduction,
    setNewDeduction,
    selectedEmployeesForDeductionForm,
    setSelectedEmployeesForDeductionForm,
    deductionEmployeeSearchTerm,
    setDeductionEmployeeSearchTerm,
    isDeductionEmployeePopoverOpen,
    setIsDeductionEmployeePopoverOpen,
    filteredDeductionEmployees,
    handleDeductionEmployeeToggle,
    removeDeductionEmployee,
    deductionTypes,
    handleAddDeduction,
    isAddEditLoading,
    deductionsData,
}: AddEditDeductionDialogProps) {
    return (
        <Dialog open={isAddDeductionDialogOpen} onOpenChange={setIsAddDeductionDialogOpen}>
            <DialogTrigger asChild>
                <Button className="flex items-center gap-2 border border-gray-300 dark:border-gray-600">
                    <Plus className="h-4 w-4" />
                    Add Deduction
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-full max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-2xl mx-4">
                <DialogHeader className="border-b pb-4">
                    <DialogTitle className="text-2xl font-semibold text-gray-900 dark:text-foreground">
                        {isDeductionEditMode ? "Edit Deduction" : "Add"}
                    </DialogTitle>
                </DialogHeader>
                <div className="space-y-8 p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label
                                htmlFor="deductionEmployees"
                                className="text-sm font-medium text-gray-700 dark:text-gray-300"
                            >
                                * Employees :
                            </Label>
                            <Popover
                                open={isDeductionEmployeePopoverOpen}
                                onOpenChange={setIsDeductionEmployeePopoverOpen}
                            >
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={isDeductionEmployeePopoverOpen}
                                        className="h-12 w-full justify-between rounded-lg border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm hover:border-gray-300 transition-colors"
                                    >
                                        <div className="flex flex-wrap gap-1 flex-1">
                                            {selectedEmployeesForDeductionForm.length === 0 ? (
                                                <span className="text-gray-500">
                                                    Select employees...
                                                </span>
                                            ) : (
                                                selectedEmployeesForDeductionForm.map(employee => (
                                                    <div
                                                        key={employee.id}
                                                        className="flex items-center gap-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-md text-sm"
                                                    >
                                                        {employee.firstName} {employee.surname}
                                                        <span
                                                            role="button"
                                                            tabIndex={0}
                                                            onClick={e => {
                                                                e.stopPropagation();
                                                                removeDeductionEmployee(
                                                                    employee.id,
                                                                );
                                                            }}
                                                            onKeyDown={e => {
                                                                if (
                                                                    e.key === "Enter" ||
                                                                    e.key === " "
                                                                ) {
                                                                    e.preventDefault();
                                                                    removeDeductionEmployee(
                                                                        employee.id,
                                                                    );
                                                                }
                                                            }}
                                                            className="ml-1 hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full p-0.5 cursor-pointer"
                                                        >
                                                            <X className="h-3 w-3" />
                                                        </span>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                        <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent
                                    className="w-[var(--radix-popover-trigger-width)] p-0"
                                    align="start"
                                >
                                    <div className="p-2">
                                        <div className="relative">
                                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                                            <Input
                                                placeholder="Search employees..."
                                                value={deductionEmployeeSearchTerm}
                                                onChange={e =>
                                                    setDeductionEmployeeSearchTerm(e.target.value)
                                                }
                                                className="pl-8"
                                            />
                                        </div>
                                    </div>
                                    <div className="max-h-60 overflow-y-auto">
                                        {filteredDeductionEmployees.length === 0 ? (
                                            <div className="p-4 text-center text-gray-500">
                                                No employees found
                                            </div>
                                        ) : (
                                            filteredDeductionEmployees.map(employee => (
                                                <div
                                                    key={employee.id}
                                                    className="flex items-center space-x-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
                                                    onClick={() =>
                                                        handleDeductionEmployeeToggle(employee)
                                                    }
                                                >
                                                    <Checkbox
                                                        checked={selectedEmployeesForDeductionForm.some(
                                                            emp => emp.id === employee.id,
                                                        )}
                                                        onChange={() =>
                                                            handleDeductionEmployeeToggle(employee)
                                                        }
                                                    />
                                                    <div className="flex-1">
                                                        <div className="font-medium">
                                                            {employee.firstName} {employee.surname}
                                                        </div>
                                                        <div className="text-sm text-gray-500">
                                                            {employee.employmentPosition}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                    {selectedEmployeesForDeductionForm.length > 0 && (
                                        <div className="border-t p-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => {
                                                    setSelectedEmployeesForDeductionForm([]);
                                                    setDeductionEmployeeSearchTerm("");
                                                }}
                                                className="w-full"
                                            >
                                                Clear All (
                                                {selectedEmployeesForDeductionForm.length})
                                            </Button>
                                        </div>
                                    )}
                                </PopoverContent>
                            </Popover>
                        </div>

                        <div className="space-y-2">
                            <Label
                                htmlFor="deductionType"
                                className="text-sm font-medium text-gray-700 dark:text-gray-300"
                            >
                                Deduction Type Name :
                            </Label>
                            <Select
                                value={newDeduction.deductionTypeName || ""}
                                onValueChange={value =>
                                    setNewDeduction({ ...newDeduction, deductionTypeName: value })
                                }
                            >
                                <SelectTrigger className="h-12 rounded-lg border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm hover:border-gray-300 transition-colors">
                                    <SelectValue placeholder="Select deduction type" />
                                </SelectTrigger>
                                <SelectContent className="rounded-lg shadow-lg">
                                    {deductionTypes.map(dt => (
                                        <SelectItem
                                            key={dt.id}
                                            value={dt.id}
                                            className="hover:bg-gray-50 dark:hover:bg-gray-800"
                                        >
                                            {dt.deductionName}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label
                                htmlFor="deductionAmount"
                                className="text-sm font-medium text-gray-700 dark:text-gray-300"
                            >
                                Base Deduction Amount :
                            </Label>
                            <Input
                                id="deductionAmount"
                                type="number"
                                placeholder="Enter base amount"
                                value={newDeduction.deductionAmount || ""}
                                onChange={e => {
                                    const baseAmount = Number.parseFloat(e.target.value) || 0;
                                    const monthlyAmounts = {
                                        January: baseAmount,
                                        February: baseAmount,
                                        March: baseAmount,
                                        April: baseAmount,
                                        May: baseAmount,
                                        June: baseAmount,
                                        July: baseAmount,
                                        August: baseAmount,
                                        September: baseAmount,
                                        October: baseAmount,
                                        November: baseAmount,
                                        December: baseAmount,
                                    };
                                    setNewDeduction({
                                        ...newDeduction,
                                        deductionAmount: baseAmount,
                                        monthlyAmounts: monthlyAmounts,
                                    });
                                }}
                                className="h-12 rounded-lg border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm hover:border-gray-300 transition-colors"
                            />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="text-center">
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                Enter amount for each month by double clicking on the cell.
                            </p>
                            <h3 className="text-lg font-medium text-gray-900 dark:text-foreground">
                                Set Value for each month:
                            </h3>
                        </div>

                        <div className="overflow-x-auto rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                            <Table>
                                <TableHeader>
                                    <TableRow
                                        style={{ backgroundColor: "#3f3d56ff" }}
                                        className="hover:bg-[#3f3d56ff]"
                                    >
                                        <TableHead className="text-white text-center w-1/12 py-4 font-medium">
                                            January
                                        </TableHead>
                                        <TableHead className="text-white text-center w-1/12 py-4 font-medium">
                                            February
                                        </TableHead>
                                        <TableHead className="text-white text-center w-1/12 py-4 font-medium">
                                            March
                                        </TableHead>
                                        <TableHead className="text-white text-center w-1/12 py-4 font-medium">
                                            April
                                        </TableHead>
                                        <TableHead className="text-white text-center w-1/12 py-4 font-medium">
                                            May
                                        </TableHead>
                                        <TableHead className="text-white text-center w-1/12 py-4 font-medium">
                                            June
                                        </TableHead>
                                        <TableHead className="text-white text-center w-1/12 py-4 font-medium">
                                            July
                                        </TableHead>
                                        <TableHead className="text-white text-center w-1/12 py-4 font-medium">
                                            August
                                        </TableHead>
                                        <TableHead className="text-white text-center w-1/12 py-4 font-medium">
                                            September
                                        </TableHead>
                                        <TableHead className="text-white text-center w-1/12 py-4 font-medium">
                                            October
                                        </TableHead>
                                        <TableHead className="text-white text-center w-1/12 py-4 font-medium">
                                            November
                                        </TableHead>
                                        <TableHead className="text-white text-center w-1/12 py-4 font-medium">
                                            December
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    <TableRow className="hover:bg-gray-50 dark:hover:bg-gray-800">
                                        {[
                                            "January",
                                            "February",
                                            "March",
                                            "April",
                                            "May",
                                            "June",
                                            "July",
                                            "August",
                                            "September",
                                            "October",
                                            "November",
                                            "December",
                                        ].map(month => (
                                            <TableCell key={month} className="text-center p-2">
                                                <Input
                                                    type="number"
                                                    placeholder="0"
                                                    value={
                                                        newDeduction.monthlyAmounts?.[month] || ""
                                                    }
                                                    onChange={e => {
                                                        const monthlyAmounts = {
                                                            ...newDeduction.monthlyAmounts,
                                                        };
                                                        monthlyAmounts[month] =
                                                            Number.parseFloat(e.target.value) || 0;
                                                        setNewDeduction({
                                                            ...newDeduction,
                                                            monthlyAmounts,
                                                        });
                                                    }}
                                                    className="w-full text-center border-0 bg-transparent focus:bg-white dark:focus:bg-gray-800 rounded-md h-10 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                                />
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </div>
                    </div>

                    <div className="flex justify-center pt-6">
                        <Button
                            onClick={handleAddDeduction}
                            className="px-12 py-3 bg-[#3f3d56ff] hover:bg-[#2f2d46ff] text-white rounded-lg font-medium shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]"
                            size="lg"
                        >
                            {isAddEditLoading ? (
                                <div className="flex items-center justify-center gap-2">
                                    <Loader2 className="animate-spin h-4 w-4" />
                                    {isDeductionEditMode ? "Updating..." : "Submitting..."}
                                </div>
                            ) : (
                                `${isDeductionEditMode ? "Update Deduction" : "Submit"}`
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
