"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { useData } from "@/context/app-data-context";
import { useAuth } from "@/context/authContext";
import { EmployeeModel } from "@/lib/models/employee";
import { Download, Eye, Search } from "lucide-react";
import { useMemo, useState } from "react";

export default function TeamDirectoryPage() {
    const { employees, departmentSettings, locations, positions, shiftTypes } = useData();
    const { userData } = useAuth();

    // Filters and results state
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [departmentFilter, setDepartmentFilter] = useState<string>("all");
    const [locationFilter, setLocationFilter] = useState<string>("all");
    const [positionFilter, setPositionFilter] = useState<string>("all");
    const [shiftTypeFilter, setShiftTypeFilter] = useState<string>("all");
    // Helper functions to get human-readable names from IDs
    const getDepartmentName = useMemo<(id: string) => string>(
        () => (id: string) => {
            const dept = departmentSettings?.find(d => d.id === id);
            return dept?.name || id;
        },
    [departmentSettings],
    );

    const getLocationName = useMemo<(id: string) => string>(
        () => (id: string) => {
            const loc = locations?.find(l => l.id === id);
            return loc?.name || id;
        },
    [locations],
    );

    const getPositionName = useMemo<(id: string) => string>(
        () => (id: string) => {
            const pos = positions?.find(p => p.id === id);
            return pos?.name || id;
        },
    [positions],
    );

    const getShiftTypeName = useMemo<(id: string) => string>(
        () => (id: string) => {
            const shift = shiftTypes?.find(s => s.id === id);
            return shift?.name || id;
        },
    [shiftTypes],
    );

    // Filter employees to only current user's reportees (own + delegated)
    const reportees = useMemo<EmployeeModel[]>(
        () => employees.filter(emp => userData?.reportees?.includes(emp.uid)),
        [employees, userData?.reportees],
    );

    // Unique IDs for filter dropdowns
    const departmentIds = useMemo<string[]>(
        () => [...new Set(reportees.map(emp => emp.department).filter(Boolean))] as string[],
        [reportees],
    );

    const locationIds = useMemo<string[]>(
        () => [...new Set(reportees.map(emp => emp.workingLocation).filter(Boolean))] as string[],
        [reportees],
    );

    const positionIds = useMemo<string[]>(
        () =>
            [...new Set(reportees.map(emp => emp.employmentPosition).filter(Boolean))] as string[],
        [reportees],
    );

    const shiftTypeIds = useMemo<string[]>(
        () => [...new Set(reportees.map(emp => emp.shiftType).filter(Boolean))] as string[],
        [reportees],
    );

    const filteredEmployees = useMemo(() => {
        let filtered: EmployeeModel[] = reportees;

        // Text search across selected fields
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(
                emp =>
                    emp.firstName.toLowerCase().includes(term) ||
                    emp.surname.toLowerCase().includes(term) ||
                    (emp.employeeID && emp.employeeID.toLowerCase().includes(term)) ||
                    (emp.employmentPosition && emp.employmentPosition.toLowerCase().includes(term)),
            );
        }

        if (departmentFilter !== "all") {
            filtered = filtered.filter(emp => emp.department === departmentFilter);
        }

        if (locationFilter !== "all") {
            filtered = filtered.filter(emp => emp.workingLocation === locationFilter);
        }

        if (positionFilter !== "all") {
            filtered = filtered.filter(emp => emp.employmentPosition === positionFilter);
        }

        if (shiftTypeFilter !== "all") {
            filtered = filtered.filter(emp => emp.shiftType === shiftTypeFilter);
        }

        // Sort by first name, then by surname
        filtered = filtered.sort((a, b) => {
            const firstNameCompare = a.firstName.localeCompare(b.firstName);
            if (firstNameCompare !== 0) {
                return firstNameCompare;
            }
            return a.surname.localeCompare(b.surname);
        });

        return filtered;
    }, [reportees, searchTerm, departmentFilter, locationFilter, positionFilter, shiftTypeFilter]);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-foreground">
                        Team Directory
                    </h1>
                    <p className="text-gray-600 dark:text-muted-foreground mt-2">
                        Manage and view details of all employees reporting to you
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Export
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Eye className="h-5 w-5" />
                        Team Directory
                    </CardTitle>
                    <CardDescription>
                        Complete list of employees under your management with detailed information
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col gap-4 mb-6">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by name, ID, or position..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Filter by Department" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Departments</SelectItem>
                                    {departmentIds.map(deptId => (
                                        <SelectItem key={deptId} value={deptId}>
                                            {getDepartmentName(deptId)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Select value={positionFilter} onValueChange={setPositionFilter}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Filter by Position" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Positions</SelectItem>
                                    {positionIds.map(positionId => (
                                        <SelectItem key={positionId} value={positionId}>
                                            {getPositionName(positionId)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Select value={locationFilter} onValueChange={setLocationFilter}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Filter by Location" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Locations</SelectItem>
                                    {locationIds.map(locationId => (
                                        <SelectItem key={locationId} value={locationId}>
                                            {getLocationName(locationId)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Select value={shiftTypeFilter} onValueChange={setShiftTypeFilter}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Filter by Shift Type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Shift Types</SelectItem>
                                    {shiftTypeIds.map(shiftId => (
                                        <SelectItem key={shiftId} value={shiftId}>
                                            {getShiftTypeName(shiftId)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="mb-4">
                        <p className="text-sm text-muted-foreground">
                            Showing {filteredEmployees.length} of {reportees.length} employees
                        </p>
                    </div>

                    <div className="rounded-md border overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="font-semibold">First Name</TableHead>
                                    <TableHead className="font-semibold">Middle Name</TableHead>
                                    <TableHead className="font-semibold">Surname</TableHead>
                                    <TableHead className="font-semibold">Employee ID</TableHead>
                                    <TableHead className="font-semibold">Position</TableHead>
                                    <TableHead className="font-semibold">Department</TableHead>
                                    <TableHead className="font-semibold">
                                        Working Location
                                    </TableHead>
                                    <TableHead className="font-semibold">Shift Type</TableHead>
                                    <TableHead className="font-semibold">Phone Number</TableHead>
                                    <TableHead className="font-semibold">Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredEmployees.map(employee => (
                                    <TableRow key={employee.uid} className="hover:bg-muted/50">
                                        <TableCell className="font-medium">
                                            {employee.firstName}
                                        </TableCell>
                                        <TableCell>{employee.middleName}</TableCell>
                                        <TableCell className="font-medium">
                                            {employee.surname}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="font-mono">
                                                {employee.employeeID}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {getPositionName(employee.employmentPosition)}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="secondary">
                                                {getDepartmentName(employee.department)}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {getLocationName(employee.workingLocation)}
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={
                                                    employee.shiftType === "Night Shift"
                                                        ? "destructive"
                                                        : "default"
                                                }
                                                className="text-xs"
                                            >
                                                {getShiftTypeName(employee.shiftType)}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="font-mono text-sm">
                                            {employee.personalPhoneNumber}
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant="default"
                                                className="bg-green-100 text-green-800 dark:bg-black dark:text-green-300"
                                            >
                                                Active
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    {filteredEmployees.length === 0 && (
                        <div className="text-center py-8">
                            <p className="text-muted-foreground">
                                No employees found matching your criteria.
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
