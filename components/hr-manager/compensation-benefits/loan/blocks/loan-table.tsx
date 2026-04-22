import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, Edit, Trash2, Eye, Columns, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { ExtendedEmployeeLoan } from "@/lib/models/employeeLoan";
import { EmployeeModel } from "@/lib/models/employee";
import { AddEditLoanDialog } from "./add-edit-loan-dialog";

interface LoanTypeOption {
    id: string;
    loanName?: string;
}

interface LoanTableProps {
    filteredLoans: ExtendedEmployeeLoan[];
    visibleColumns: { [key: string]: boolean };
    setVisibleColumns: (columns: { [key: string]: boolean }) => void;
    filters: { [key: string]: string };
    setFilters: (filters: { [key: string]: string }) => void;
    isFilterModalOpen: boolean;
    setIsFilterModalOpen: (open: boolean) => void;
    columnDefinitions: { key: string; label: string; width: string }[];
    loanTypes: LoanTypeOption[];
    getStatusBadge: (status: string) => { color: string; label: string };
    openViewDialog: (loan: ExtendedEmployeeLoan) => void;
    openInstallmentsModal: (loan: ExtendedEmployeeLoan) => void;
    openEditDialog: (loan: ExtendedEmployeeLoan) => void;
    deleteLoan: (id: string) => void;
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
    handleAddLoan: () => void;
    isAddEditLoading: boolean;
    handleReset: () => void;
}

export function LoanTable({
    filteredLoans,
    visibleColumns,
    setVisibleColumns,
    filters,
    setFilters,
    isFilterModalOpen,
    setIsFilterModalOpen,
    columnDefinitions,
    loanTypes,
    getStatusBadge,
    openViewDialog,
    openInstallmentsModal,
    openEditDialog,
    deleteLoan,
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
    handleAddLoan,
    isAddEditLoading,
    handleReset,
}: LoanTableProps) {
    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="text-xl font-semibold">Employee Loans</CardTitle>
                    <div className="flex items-center gap-2">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="outline"
                                    className="flex items-center gap-2 bg-transparent"
                                >
                                    <Columns className="h-4 w-4" />
                                    Columns
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                                {columnDefinitions.map(column => (
                                    <DropdownMenuCheckboxItem
                                        key={column.key}
                                        checked={
                                            visibleColumns[
                                                column.key as keyof typeof visibleColumns
                                            ]
                                        }
                                        onCheckedChange={checked =>
                                            setVisibleColumns({ [column.key]: checked })
                                        }
                                    >
                                        {column.label}
                                    </DropdownMenuCheckboxItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <Dialog open={isFilterModalOpen} onOpenChange={setIsFilterModalOpen}>
                            <DialogTrigger asChild>
                                <Button
                                    variant="outline"
                                    className="flex items-center gap-2 bg-transparent"
                                >
                                    <Filter className="h-4 w-4" />
                                    Filter
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold">Filter Employee Loans</h3>
                                    <div className="grid grid-cols-2 gap-4 py-4">
                                        {columnDefinitions.map(column => (
                                            <div key={column.key} className="space-y-2">
                                                <label className="text-sm font-medium">
                                                    {column.label}
                                                </label>
                                                <input
                                                    type="text"
                                                    placeholder={`Filter by ${column.label.toLowerCase()}`}
                                                    value={
                                                        filters[column.key as keyof typeof filters]
                                                    }
                                                    onChange={e =>
                                                        setFilters({ [column.key]: e.target.value })
                                                    }
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex justify-end gap-2">
                                        <Button
                                            variant="outline"
                                            onClick={() =>
                                                setFilters({
                                                    timestamp: "",
                                                    employee: "",
                                                    loanType: "",
                                                    loanAmount: "",
                                                    loanTotalAmount: "",
                                                    duration: "",
                                                    monthlyRepaymentAmount: "",
                                                    loanRepaymentStartMonth: "",
                                                    loanRepaymentEndMonth: "",
                                                    loanStatus: "",
                                                    paidAmount: "",
                                                    remainingAmount: "",
                                                })
                                            }
                                        >
                                            Clear All
                                        </Button>
                                        <Button onClick={() => setIsFilterModalOpen(false)}>
                                            Apply Filters
                                        </Button>
                                    </div>
                                </div>
                            </DialogContent>
                        </Dialog>

                        <AddEditLoanDialog
                            isAddDialogOpen={isAddDialogOpen}
                            setIsAddDialogOpen={setIsAddDialogOpen}
                            isEditMode={isEditMode}
                            editingLoan={editingLoan}
                            newLoan={newLoan}
                            setNewLoan={setNewLoan}
                            filteredEmployees={filteredEmployees}
                            isEmployeeDropdownOpen={isEmployeeDropdownOpen}
                            setIsEmployeeDropdownOpen={setIsEmployeeDropdownOpen}
                            employeeSearchTerm={employeeSearchTerm}
                            setEmployeeSearchTerm={setEmployeeSearchTerm}
                            months={months}
                            loanTypes={loanTypes}
                            handleAddLoan={handleAddLoan}
                            isAddEditLoading={isAddEditLoading}
                            handleReset={handleReset}
                        />
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow style={{ backgroundColor: "#3f3d56ff" }}>
                                {visibleColumns.timestamp && (
                                    <TableHead className="text-white text-center">
                                        Timestamp
                                    </TableHead>
                                )}
                                {visibleColumns.employee && (
                                    <TableHead className="text-white text-center">
                                        Employee
                                    </TableHead>
                                )}
                                {visibleColumns.loanType && (
                                    <TableHead className="text-white text-center">
                                        Loan Type
                                    </TableHead>
                                )}
                                {visibleColumns.loanAmount && (
                                    <TableHead className="text-white text-center">
                                        Loan Amount
                                    </TableHead>
                                )}
                                {visibleColumns.loanTotalAmount && (
                                    <TableHead className="text-white text-center">
                                        Loan Total Amount
                                    </TableHead>
                                )}
                                {visibleColumns.duration && (
                                    <TableHead className="text-white text-center">
                                        Duration
                                    </TableHead>
                                )}
                                {visibleColumns.monthlyRepaymentAmount && (
                                    <TableHead className="text-white text-center">
                                        Monthly Repayment
                                    </TableHead>
                                )}
                                {visibleColumns.loanRepaymentStartMonth && (
                                    <TableHead className="text-white text-center">
                                        Start Month
                                    </TableHead>
                                )}
                                {visibleColumns.loanRepaymentEndMonth && (
                                    <TableHead className="text-white text-center">
                                        End Month
                                    </TableHead>
                                )}
                                {visibleColumns.loanStatus && (
                                    <TableHead className="text-white text-center">Status</TableHead>
                                )}
                                {visibleColumns.paidAmount && (
                                    <TableHead className="text-white text-center">
                                        Paid Amount
                                    </TableHead>
                                )}
                                {visibleColumns.remainingAmount && (
                                    <TableHead className="text-white text-center">
                                        Remaining Amount
                                    </TableHead>
                                )}
                                <TableHead className="text-white text-center">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredLoans.map(loan => (
                                <TableRow key={loan.id}>
                                    {visibleColumns.timestamp && (
                                        <TableCell className="text-center">
                                            {loan.timestamp}
                                        </TableCell>
                                    )}
                                    {visibleColumns.employee && (
                                        <TableCell className="text-center">
                                            {loan.employeeName}
                                        </TableCell>
                                    )}
                                    {visibleColumns.loanType && (
                                        <TableCell className="text-center">
                                            {loanTypes.find(l => l.id == loan.loanType)?.loanName ??
                                                ""}
                                        </TableCell>
                                    )}
                                    {visibleColumns.loanAmount && (
                                        <TableCell className="text-center">
                                            {`ETB ${loan.loanAmount.toLocaleString()}`}
                                        </TableCell>
                                    )}
                                    {visibleColumns.loanTotalAmount && (
                                        <TableCell className="text-center">
                                            {`ETB ${loan.loanTotalAmount.toLocaleString()}`}
                                        </TableCell>
                                    )}
                                    {visibleColumns.duration && (
                                        <TableCell className="text-center">
                                            {loan.duration} months
                                        </TableCell>
                                    )}
                                    {visibleColumns.monthlyRepaymentAmount && (
                                        <TableCell className="text-center">
                                            {`ETB ${loan.monthlyRepaymentAmount.toLocaleString()}`}
                                        </TableCell>
                                    )}
                                    {visibleColumns.loanRepaymentStartMonth && (
                                        <TableCell className="text-center">
                                            {loan.loanRepaymentStartMonth}
                                        </TableCell>
                                    )}
                                    {visibleColumns.loanRepaymentEndMonth && (
                                        <TableCell className="text-center">
                                            {loan.loanRepaymentEndMonth}
                                        </TableCell>
                                    )}
                                    {visibleColumns.loanStatus && (
                                        <TableCell className="text-center">
                                            {(() => {
                                                const badge = getStatusBadge(loan.loanStatus);
                                                return (
                                                    <Badge className={badge.color}>
                                                        {badge.label}
                                                    </Badge>
                                                );
                                            })()}
                                        </TableCell>
                                    )}
                                    {visibleColumns.paidAmount && (
                                        <TableCell className="text-center">
                                            {`ETB ${loan.paidAmount.toLocaleString()}`}
                                        </TableCell>
                                    )}
                                    {visibleColumns.remainingAmount && (
                                        <TableCell className="text-center">
                                            {`ETB ${loan.remainingAmount.toLocaleString()}`}
                                        </TableCell>
                                    )}
                                    <TableCell className="text-center">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 w-8 p-0"
                                                >
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem
                                                    onClick={() => openViewDialog(loan)}
                                                >
                                                    <Eye className="mr-2 h-4 w-4" />
                                                    View Details
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() => openInstallmentsModal(loan)}
                                                >
                                                    <Edit className="mr-2 h-4 w-4" />
                                                    Monthly Installments
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() => openEditDialog(loan)}
                                                >
                                                    <Edit className="mr-2 h-4 w-4" />
                                                    Edit
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() => deleteLoan(loan.id)}
                                                    className="text-red-600"
                                                >
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}
