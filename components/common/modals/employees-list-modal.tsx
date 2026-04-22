"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
    Table,
    TableHeader,
    TableBody,
    TableHead,
    TableRow,
    TableCell,
} from "@/components/ui/table";
import { useData } from "@/context/app-data-context";
import { EmployeeModel } from "@/lib/models/employee";

type EmployeesListModalProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    employees: EmployeeModel[];
    employeeUids: string[];
    title?: string;
};

export function EmployeesListModal({
    open,
    onOpenChange,
    employees,
    employeeUids,
    title = "Employees",
}: EmployeesListModalProps) {
    const { ...hrSettings } = useData();
    const departments = hrSettings?.departmentSettings;
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle
                        className="text-lg font-semibold text-[#3f3d56]"
                        style={{ fontFamily: "Montserrat, sans-serif" }}
                    >
                        {title}
                    </DialogTitle>
                </DialogHeader>

                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>First Name</TableHead>
                            <TableHead>Middle Name</TableHead>
                            <TableHead>Surname</TableHead>
                            <TableHead>Employee ID</TableHead>
                            <TableHead>Department</TableHead>
                            <TableHead className="text-right">Hourly Wage</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {(!employeeUids || employeeUids.length === 0) && (
                            <TableRow>
                                <TableCell
                                    colSpan={6}
                                    className="text-center text-muted-foreground"
                                >
                                    No employees in this request
                                </TableCell>
                            </TableRow>
                        )}
                        {employeeUids?.map(uid => {
                            const emp = employees.find(e => e.uid === uid);
                            if (!emp) return null;
                            return (
                                <TableRow key={uid}>
                                    <TableCell>{emp.firstName}</TableCell>
                                    <TableCell>{emp.middleName ?? "-"}</TableCell>
                                    <TableCell>{emp.surname}</TableCell>
                                    <TableCell>{emp.employeeID}</TableCell>
                                    <TableCell>
                                        {departments.find(d => d.id == emp.department)?.name ?? "-"}
                                    </TableCell>
                                    <TableCell className="text-right">{emp.hourlyWage}</TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </DialogContent>
        </Dialog>
    );
}

export default EmployeesListModal;
