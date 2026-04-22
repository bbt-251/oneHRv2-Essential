import { Button } from "@/components/ui/button";
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
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Edit, Trash2 } from "lucide-react";
import { EmployeeModel } from "@/lib/models/employee";

interface DeductionTypeOption {
    id: string;
    deductionName?: string;
}

interface DeductionEntry {
    timestamp: string;
    id: string;
    employees: EmployeeModel[];
    deductionTypeName: string;
    deductionAmount: number;
    monthlyAmounts: { [month: string]: number };
}

interface DeductionTableProps {
    deductionsData: DeductionEntry[];
    deductionTypes: DeductionTypeOption[];
    openEmployeeModal: (employees: EmployeeModel[]) => void;
    openAmountModal: (amounts: { [month: string]: number }) => void;
    openEditDeductionDialog: (deduction: DeductionEntry) => void;
    handleDelete: (id: string) => void;
}

export function DeductionTable({
    deductionsData,
    deductionTypes,
    openEmployeeModal,
    openAmountModal,
    openEditDeductionDialog,
    handleDelete,
}: DeductionTableProps) {
    return (
        <Table>
            <TableHeader>
                <TableRow style={{ backgroundColor: "#3f3d56ff" }}>
                    <TableHead className="text-white text-center w-1/6">Timestamp</TableHead>
                    <TableHead className="text-white text-center w-1/6">
                        Deduction Type Name
                    </TableHead>
                    <TableHead className="text-white text-center w-1/6">Employees</TableHead>
                    <TableHead className="text-white text-center w-1/6">Deduction Amount</TableHead>
                    <TableHead className="text-white text-center w-1/6">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {deductionsData.map(deduction => (
                    <TableRow key={deduction.id}>
                        <TableCell className="font-medium text-center">
                            {deduction.timestamp}
                        </TableCell>
                        <TableCell className="text-center">
                            {deductionTypes.find(d => d.id == deduction.deductionTypeName)
                                ?.deductionName ?? ""}
                        </TableCell>
                        <TableCell className="text-center">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => openEmployeeModal(deduction.employees)}
                            >
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </TableCell>
                        <TableCell className="text-center">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => openAmountModal(deduction.monthlyAmounts)}
                            >
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </TableCell>
                        <TableCell className="text-center">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                    <DropdownMenuItem
                                        onClick={() => openEditDeductionDialog(deduction)}
                                    >
                                        <Edit className="h-4 w-4 mr-2" />
                                        Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={() => handleDelete(deduction.id)}
                                        className="text-red-600"
                                    >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Delete
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}
