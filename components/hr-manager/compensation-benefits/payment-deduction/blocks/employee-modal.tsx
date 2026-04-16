import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

interface EmployeeModalProps {
    isEmployeeModalOpen: boolean;
    setIsEmployeeModalOpen: (open: boolean) => void;
    selectedEmployees: any[];
    positions: any[];
}

export function EmployeeModal({
    isEmployeeModalOpen,
    setIsEmployeeModalOpen,
    selectedEmployees,
    positions,
}: EmployeeModalProps) {
    return (
        <Dialog open={isEmployeeModalOpen} onOpenChange={setIsEmployeeModalOpen}>
            <DialogContent className="max-w-4xl">
                <DialogHeader>
                    <DialogTitle>Employee Details</DialogTitle>
                </DialogHeader>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Employee ID</TableHead>
                            <TableHead>First Name</TableHead>
                            <TableHead>Middle Name</TableHead>
                            <TableHead>Surname</TableHead>
                            <TableHead>Gender</TableHead>
                            <TableHead>Personal Phone</TableHead>
                            <TableHead>Employment Position</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {selectedEmployees.map(employee => (
                            <TableRow key={employee.id}>
                                <TableCell className="font-medium">{employee.employeeID}</TableCell>
                                <TableCell>{employee.firstName}</TableCell>
                                <TableCell>{employee.middleName}</TableCell>
                                <TableCell>{employee.surname}</TableCell>
                                <TableCell>{employee.gender}</TableCell>
                                <TableCell>{employee.personalPhoneNumber}</TableCell>
                                <TableCell>
                                    {positions.find(p => p.id == employee.employmentPosition)
                                        ?.name ?? ""}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </DialogContent>
        </Dialog>
    );
}
