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
import { Check, ChevronsUpDown, Plus, Search, Loader2 } from "lucide-react";
import { ExtendedEmployeeLoan } from "@/lib/models/employeeLoan";
import { EmployeeModel } from "@/lib/models/employee";
import getFullName from "@/lib/util/getEmployeeFullName";
import dayjs from "dayjs";
import { useEffect } from "react";

// Helper function to calculate loan values
const calculateLoanValues = (loanAmount: number, interestRate: number, duration: number) => {
    const total = loanAmount * (1 + interestRate / 100);
    const monthly = duration > 0 ? total / duration : 0;
    return {
        loanTotalAmount: Math.round(total * 100) / 100,
        monthlyRepaymentAmount: Math.round(monthly * 100) / 100,
    };
};

interface AddEditLoanDialogProps {
    isAddDialogOpen: boolean;
    setIsAddDialogOpen: (open: boolean) => void;
    isEditMode: boolean;
    editingLoan: ExtendedEmployeeLoan | null;
    newLoan: Partial<ExtendedEmployeeLoan>;
    setNewLoan: (loan: Partial<ExtendedEmployeeLoan>) => void;
    filteredEmployees: EmployeeModel[];
    isEmployeeDropdownOpen: boolean;
    setIsEmployeeDropdownOpen: (open: boolean) => void;
    employeeSearchTerm: string;
    setEmployeeSearchTerm: (term: string) => void;
    months: string[];
    loanTypes: any[];
    handleAddLoan: () => void;
    isAddEditLoading: boolean;
    handleReset: () => void;
}

export function AddEditLoanDialog({
    isAddDialogOpen,
    setIsAddDialogOpen,
    isEditMode,
    editingLoan,
    newLoan,
    setNewLoan,
    filteredEmployees,
    isEmployeeDropdownOpen,
    setIsEmployeeDropdownOpen,
    employeeSearchTerm,
    setEmployeeSearchTerm,
    months,
    loanTypes,
    handleAddLoan,
    isAddEditLoading,
    handleReset,
}: AddEditLoanDialogProps) {
    // Helper to format number with commas for display
    const formatNumber = (num: number | undefined): string => {
        if (num === undefined || num === null || isNaN(num)) return "";
        return num.toLocaleString("en-US");
    };

    // Helper to parse number from formatted string
    const parseNumber = (value: string): number => {
        const cleaned = value.replace(/,/g, "");
        const parsed = Number(cleaned);
        return isNaN(parsed) ? 0 : parsed;
    };

    // Recalculate when loanType changes (if loanAmount is set)
    useEffect(() => {
        if (newLoan.loanType && newLoan.loanAmount && newLoan.loanAmount > 0) {
            const chosenLoanTypeData = loanTypes.find(type => type.id === newLoan.loanType);
            if (chosenLoanTypeData) {
                const calculated = calculateLoanValues(
                    newLoan.loanAmount,
                    chosenLoanTypeData.loanInterestRate,
                    newLoan.duration || 12,
                );
                // Only update if values have changed to avoid infinite loop
                if (
                    calculated.loanTotalAmount !== newLoan.loanTotalAmount ||
                    calculated.monthlyRepaymentAmount !== newLoan.monthlyRepaymentAmount
                ) {
                    setNewLoan({
                        ...newLoan,
                        loanTotalAmount: calculated.loanTotalAmount,
                        monthlyRepaymentAmount: calculated.monthlyRepaymentAmount,
                    });
                }
            }
        }
    }, [
        newLoan.loanType,
        newLoan.loanAmount,
        newLoan.duration,
        newLoan.loanTotalAmount,
        newLoan.monthlyRepaymentAmount,
        loanTypes,
    ]);

    return (
        <Dialog
            open={isAddDialogOpen}
            onOpenChange={open => {
                setIsAddDialogOpen(open);
                if (!open) handleReset();
            }}
        >
            <DialogTrigger asChild>
                <Button className="flex items-center gap-2 border border-gray-300 dark:border-gray-600">
                    <Plus className="h-4 w-4" />
                    Add Loan
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-2xl">
                <DialogHeader className="border-b pb-4">
                    <DialogTitle className="text-2xl font-semibold text-gray-900 dark:text-foreground">
                        {isEditMode ? "Edit" : editingLoan ? "View" : "Add"}
                    </DialogTitle>
                </DialogHeader>
                <div className="space-y-6 py-6">
                    {/* First Row - Employee */}
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                <span className="text-red-500">*</span> Employee :
                            </Label>
                            <Popover
                                open={isEmployeeDropdownOpen}
                                onOpenChange={setIsEmployeeDropdownOpen}
                            >
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={isEmployeeDropdownOpen}
                                        className="h-12 w-full justify-between rounded-lg border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm hover:border-gray-300 transition-colors"
                                    >
                                        {newLoan.employeeUid
                                            ? getFullName(
                                                filteredEmployees.find(
                                                    employee =>
                                                        employee.uid === newLoan.employeeUid,
                                                ) ?? ({} as EmployeeModel),
                                            )
                                            : "Select employee"}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent
                                    className="w-[var(--radix-popover-trigger-width)] p-0"
                                    align="start"
                                >
                                    <div className="p-2">
                                        <div className="relative">
                                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                placeholder="Search employees..."
                                                value={employeeSearchTerm}
                                                onChange={e =>
                                                    setEmployeeSearchTerm(e.target.value)
                                                }
                                                className="pl-8"
                                            />
                                        </div>
                                    </div>
                                    <div className="max-h-60 overflow-y-auto">
                                        {filteredEmployees.length === 0 ? (
                                            <div className="p-4 text-sm text-muted-foreground">
                                                No employees found.
                                            </div>
                                        ) : (
                                            filteredEmployees.map(employee => (
                                                <div
                                                    key={employee.uid}
                                                    className="flex items-center space-x-2 p-2 hover:bg-accent cursor-pointer"
                                                    onClick={() => {
                                                        setNewLoan({
                                                            ...newLoan,
                                                            employeeUid: employee.uid,
                                                            employeeName: getFullName(employee),
                                                        });
                                                        setIsEmployeeDropdownOpen(false);
                                                        setEmployeeSearchTerm("");
                                                    }}
                                                >
                                                    <Check
                                                        className={`h-4 w-4 ${
                                                            newLoan.employeeUid === employee.uid
                                                                ? "opacity-100"
                                                                : "opacity-0"
                                                        }`}
                                                    />
                                                    <div className="flex-1">
                                                        <div className="font-medium">
                                                            {getFullName(employee)}
                                                        </div>
                                                        <div className="text-sm text-muted-foreground">
                                                            {employee.employeeID}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                        )
                                    </div>
                                </PopoverContent>
                            </Popover>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                <span className="text-red-500">*</span> Loan Type :
                            </Label>
                            <Select
                                value={newLoan.loanType}
                                onValueChange={value =>
                                    setNewLoan({
                                        ...newLoan,
                                        loanType: value,
                                    })
                                }
                            >
                                <SelectTrigger className="h-12 rounded-lg border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm hover:border-gray-300 transition-colors">
                                    <SelectValue placeholder="Select loan type" />
                                </SelectTrigger>
                                <SelectContent className="rounded-lg shadow-lg">
                                    {loanTypes.map((l, index) => (
                                        <SelectItem key={index} value={l.id}>
                                            {l.loanName}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Second Row - Loan Amount and Total Amount */}
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label
                                htmlFor="loanAmount"
                                className="text-sm font-medium text-gray-700 dark:text-gray-300"
                            >
                                <span className="text-red-500">*</span> Loan Amount :
                            </Label>
                            <Input
                                id="loanAmount"
                                type="text"
                                value={formatNumber(newLoan.loanAmount)}
                                placeholder="Enter loan amount"
                                className="h-12 rounded-lg border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm hover:border-gray-300 transition-colors"
                                onChange={value => {
                                    const loanAmount = parseNumber(value.target.value);
                                    const chosenLoanTypeData = loanTypes.find(
                                        type => type.id === newLoan.loanType,
                                    );

                                    let loanTotalAmount = 0;
                                    let monthlyRepaymentAmount = 0;

                                    if (chosenLoanTypeData && loanAmount > 0) {
                                        const calculated = calculateLoanValues(
                                            loanAmount,
                                            chosenLoanTypeData.loanInterestRate,
                                            newLoan.duration || 12,
                                        );
                                        loanTotalAmount = calculated.loanTotalAmount;
                                        monthlyRepaymentAmount = calculated.monthlyRepaymentAmount;
                                    }

                                    setNewLoan({
                                        ...newLoan,
                                        loanAmount,
                                        loanTotalAmount,
                                        monthlyRepaymentAmount,
                                    });
                                }}
                                disabled={!newLoan.loanType}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label
                                htmlFor="loanTotalAmount"
                                className="text-sm font-medium text-gray-700 dark:text-gray-300"
                            >
                                <span className="text-red-500">*</span> Loan Total Amount :
                            </Label>
                            <Input
                                id="loanTotalAmount"
                                type="text"
                                value={formatNumber(newLoan.loanTotalAmount)}
                                disabled
                                className="h-12 rounded-lg border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
                            />
                        </div>
                    </div>

                    {/* Third Row - Monthly Repayment and Duration */}
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label
                                htmlFor="monthlyRepaymentAmount"
                                className="text-sm font-medium text-gray-700 dark:text-gray-300"
                            >
                                <span className="text-red-500">*</span> Monthly Repayment Amount :
                            </Label>
                            <Input
                                id="monthlyRepaymentAmount"
                                type="text"
                                value={formatNumber(newLoan.monthlyRepaymentAmount)}
                                disabled
                                className="h-12 rounded-lg border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label
                                htmlFor="duration"
                                className="text-sm font-medium text-gray-700 dark:text-gray-300"
                            >
                                <span className="text-red-500">*</span> Duration :
                            </Label>
                            <div className="relative">
                                <Input
                                    id="duration"
                                    type="number"
                                    min={0}
                                    value={newLoan.duration || ""}
                                    onChange={value => {
                                        const duration = Number(value.target.value) || 0;

                                        // Recalculate monthly repayment based on loanTotalAmount
                                        let monthlyRepaymentAmount = 0;
                                        if (duration > 0 && newLoan.loanTotalAmount) {
                                            monthlyRepaymentAmount =
                                                Math.round(
                                                    (newLoan.loanTotalAmount / duration) * 100,
                                                ) / 100;
                                        }

                                        setNewLoan({
                                            ...newLoan,
                                            duration,
                                            monthlyRepaymentAmount,
                                        });

                                        // Update end month based on start month and new duration
                                        if (duration > 0 && newLoan.loanRepaymentStartMonth) {
                                            const startMonth = dayjs(
                                                newLoan.loanRepaymentStartMonth,
                                                "MMMM YYYY",
                                            );
                                            if (startMonth.isValid()) {
                                                const endMonth = startMonth.add(
                                                    duration - 1,
                                                    "months",
                                                );
                                                setNewLoan({
                                                    ...newLoan,
                                                    duration,
                                                    loanRepaymentEndMonth:
                                                        endMonth.format("MMMM YYYY"),
                                                });
                                            }
                                        } else {
                                            setNewLoan({
                                                ...newLoan,
                                                duration,
                                                loanRepaymentEndMonth: "",
                                            });
                                        }
                                    }}
                                    placeholder="Enter duration"
                                    className="h-12 rounded-lg border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm hover:border-gray-300 transition-colors pr-20"
                                />
                                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500">
                                    Month(s)
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Fourth Row - Start Month and End Month */}
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                <span className="text-red-500">*</span> Loan Repayment Start Month :
                            </Label>
                            <Select
                                value={newLoan.loanRepaymentStartMonth}
                                onValueChange={val => {
                                    if (val) {
                                        const start = dayjs(val, "MMMM YYYY");
                                        const duration = newLoan.duration || 0;

                                        if (start.isValid() && duration > 0) {
                                            const endMonth = start.add(duration - 1, "months");
                                            setNewLoan({
                                                ...newLoan,
                                                loanRepaymentStartMonth: val,
                                                loanRepaymentEndMonth: endMonth.format("MMMM YYYY"),
                                            });
                                        } else {
                                            // If duration is not set or invalid, just set start month and clear end month
                                            setNewLoan({
                                                ...newLoan,
                                                loanRepaymentStartMonth: val,
                                                loanRepaymentEndMonth: "",
                                            });
                                        }
                                    } else {
                                        setNewLoan({
                                            ...newLoan,
                                            loanRepaymentStartMonth: val,
                                            loanRepaymentEndMonth: "",
                                        });
                                    }
                                }}
                            >
                                <SelectTrigger className="h-12 rounded-lg border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm hover:border-gray-300 transition-colors">
                                    <SelectValue placeholder="Select month" />
                                </SelectTrigger>
                                <SelectContent>
                                    {months.map(month => (
                                        <SelectItem key={month} value={month}>
                                            {month}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label
                                htmlFor="endMonth"
                                className="text-sm font-medium text-gray-700 dark:text-gray-300"
                            >
                                <span className="text-red-500">*</span> Loan Repayment End Month :
                            </Label>
                            <Input
                                id="endMonth"
                                placeholder="Auto-calculated based on duration"
                                value={newLoan.loanRepaymentEndMonth}
                                disabled
                                className="h-12 rounded-lg border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
                            />
                        </div>
                    </div>

                    {/* Fifth Row - Loan Status */}
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                <span className="text-red-500">*</span> Loan Status :
                            </Label>
                            <Select
                                disabled={!newLoan.loanType}
                                value={newLoan.loanStatus}
                                onValueChange={value =>
                                    setNewLoan({
                                        ...newLoan,
                                        loanStatus: value as any,
                                    })
                                }
                            >
                                <SelectTrigger className="h-12 rounded-lg border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm hover:border-gray-300 transition-colors">
                                    <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Ongoing">Ongoing</SelectItem>
                                    <SelectItem value="Terminated">Terminated</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div></div>
                    </div>
                </div>

                {/* Submit Button */}
                {(!editingLoan || isEditMode) && (
                    <div className="flex justify-center pt-6 border-t">
                        <Button
                            onClick={handleAddLoan}
                            disabled={isAddEditLoading}
                            className="px-12 py-3 text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed"
                            style={{
                                backgroundColor: "#3f3d56ff",
                            }}
                        >
                            {isAddEditLoading ? (
                                <div className="flex items-center justify-center gap-2">
                                    <Loader2 className="animate-spin h-4 w-4" />
                                    Loading...
                                </div>
                            ) : (
                                `${isEditMode ? "Update" : "Submit"}`
                            )}
                        </Button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
