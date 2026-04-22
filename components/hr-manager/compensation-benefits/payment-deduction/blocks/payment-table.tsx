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

interface PaymentTypeOption {
    id: string;
    paymentName?: string;
}

interface PaymentEntry {
    id: string;
    timestamp: string;
    employees: EmployeeModel[];
    paymentTypeName: string;
    paymentAmount: number;
    monthlyAmounts: { [month: string]: number };
}

interface PaymentTableProps {
    paymentsData: PaymentEntry[];
    paymentTypes: PaymentTypeOption[];
    openEmployeeModal: (employees: EmployeeModel[]) => void;
    openAmountModal: (amounts: { [month: string]: number }) => void;
    openEditDialog: (payment: PaymentEntry) => void;
    handleDelete: (id: string) => void;
}

export function PaymentTable({
    paymentsData,
    paymentTypes,
    openEmployeeModal,
    openAmountModal,
    openEditDialog,
    handleDelete,
}: PaymentTableProps) {
    return (
        <Table>
            <TableHeader>
                <TableRow style={{ backgroundColor: "#3f3d56ff" }}>
                    <TableHead className="text-white text-center w-1/6">Timestamp</TableHead>
                    <TableHead className="text-white text-center w-1/6">
                        Payment Type Name
                    </TableHead>
                    <TableHead className="text-white text-center w-1/6">Employees</TableHead>
                    <TableHead className="text-white text-center w-1/6">Payment Amount</TableHead>
                    <TableHead className="text-white text-center w-1/6">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {paymentsData.map(payment => (
                    <TableRow key={payment.id}>
                        <TableCell className="font-medium text-center">
                            {payment.timestamp}
                        </TableCell>
                        <TableCell className="text-center">
                            {paymentTypes.find(pt => pt.id == payment.paymentTypeName)
                                ?.paymentName ?? ""}
                        </TableCell>
                        <TableCell className="text-center">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => openEmployeeModal(payment.employees)}
                            >
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </TableCell>
                        <TableCell className="text-center">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => openAmountModal(payment.monthlyAmounts)}
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
                                    <DropdownMenuItem onClick={() => openEditDialog(payment)}>
                                        <Edit className="h-4 w-4 mr-2" />
                                        Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={() => handleDelete(payment.id)}
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
