"use client";

import { useTheme } from "@/components/theme-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    DepartmentSettingsModel,
    hrSettingsService,
} from "@/lib/backend/firebase/hrSettingsService";
import { DEPARTMENT_LOG_MESSAGES } from "@/lib/log-descriptions/department-section";
import { EmployeeModel } from "@/lib/models/employee";
import { Building2, Edit, Plus, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { DataToolbar, Density, getDensityRowClasses } from "../../blocks/data-toolbar";
import DeleteConfirm from "../../blocks/delete-confirm";
import { DetailEmployeeModal } from "../../modals/employee-detail-modal";
import AddEditDepartmentModal from "./modals/add-edit-department-modal";

export function Department() {
    const { theme } = useTheme();
    const { showToast } = useToast();
    const { hrSettings, employees } = useFirestore();
    const { userData } = useAuth();
    const departments = hrSettings.departmentSettings.map(d => ({
        ...d,
        location: hrSettings.locations.find(l => l.id === d.location)?.name ?? d.location,
    }));

    const [showAddModal, setShowAddModal] = useState<boolean>(false);
    const [showEmployeesModal, setShowEmployeesModal] = useState<boolean>(false);
    const [selectedDepartmentEmployees, setSelectedDepartmentEmployees] = useState<EmployeeModel[]>(
        [],
    );
    const [selectedDepartmentName, setSelectedDepartmentName] = useState<string>("");
    const [editingDepartment, setEditingDepartment] = useState<DepartmentSettingsModel | null>(
        null,
    );

    const [density, setDensity] = useState<Density>("normal");
    const [visibleColumns, setVisibleColumns] = useState({
        name: true,
        code: true,
        manager: true,
        location: true,
        employees: true,
        active: true,
    });
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [locationFilter, setLocationFilter] = useState("all");

    const findEmployeesByDepartmentId = (departmentId: string) => {
        return employees.filter(e => e.department === departmentId);
    };

    const handleAdd = () => {
        setEditingDepartment(null);
        setShowAddModal(true);
    };
    const handleEdit = (department: DepartmentSettingsModel) => {
        setEditingDepartment(department);
        setShowAddModal(true);
    };

    const handleDelete = async (id: string) => {
        {
            try {
                await hrSettingsService.remove(
                    "departmentSettings",
                    id,
                    userData?.uid ?? "",
                    DEPARTMENT_LOG_MESSAGES.DELETED(id),
                );
                showToast("Department deleted successfully", "success");
            } catch (error) {
                console.error("Failed to delete department:", error);
                showToast("Failed to delete department", "error");
            }
        }
    };

    const handleViewEmployees = (employees: EmployeeModel[], deptName: string) => {
        setSelectedDepartmentEmployees(employees);
        setSelectedDepartmentName(deptName);
        setShowEmployeesModal(true);
    };

    const filteredDepartments = useMemo(() => {
        return departments.filter(d => {
            const matchesSearch =
                d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                d.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                d.manager.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus =
                statusFilter === "all" ||
                (statusFilter === "active" && d.active) ||
                (statusFilter === "inactive" && !d.active);
            const matchesLocation = locationFilter === "all" || d.location.includes(locationFilter);
            return matchesSearch && matchesStatus && matchesLocation;
        });
    }, [departments, searchTerm, statusFilter, locationFilter]);

    const cols = Object.entries(visibleColumns).map(([key, visible]) => ({
        key,
        visible,
        label: key.charAt(0).toUpperCase() + key.slice(1),
    }));
    const toggleCol = (key: string) =>
        setVisibleColumns(s => ({ ...s, [key]: !s[key as keyof typeof s] }));

    const activeFilters =
        (searchTerm ? 1 : 0) +
        (statusFilter !== "all" ? 1 : 0) +
        (locationFilter !== "all" ? 1 : 0);

    const exportDepartments = () => {
        const headers = cols
            .filter(c => c.visible)
            .map(c => c.label)
            .join(",");
        const rows = filteredDepartments
            .map(d =>
                cols
                    .filter(c => c.visible)
                    .map(c => {
                        if (c.key === "employees")
                            return String(findEmployeesByDepartmentId(d.id).length);
                        return String((d as any)[c.key] ?? "");
                    })
                    .join(","),
            )
            .join("\n");
        const csv = [headers, rows].join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "departments.csv";
        a.click();
        URL.revokeObjectURL(url);
    };

    const locations = Array.from(new Set(departments.map(d => d.location)));

    return (
        <div className={`${theme === "dark" ? "bg-black" : "bg-amber-50/30"} min-h-screen p-6`}>
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <Card
                    className={`${
                        theme === "dark" ? "bg-black " : "bg-white/80 backdrop-blur-sm border-0"
                    } shadow-2xl rounded-2xl overflow-hidden`}
                >
                    <CardHeader
                        className={`${
                            theme === "dark" ? "bg-black text-white" : "bg-amber-800 text-white"
                        } p-6`}
                    >
                        <CardTitle className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <div
                                    className={`${
                                        theme === "dark" ? "bg-white/20" : "bg-white/20"
                                    } p-3 rounded-xl`}
                                >
                                    <Building2 className="h-8 w-8" />
                                </div>
                                <div>
                                    <div className="text-2xl font-bold">Departments</div>
                                    <div
                                        className={`${
                                            theme === "dark" ? "text-gray-400" : "text-yellow-200"
                                        } text-sm font-normal`}
                                    >
                                        {filteredDepartments.length} departments
                                    </div>
                                </div>
                            </div>
                            <Button
                                onClick={handleAdd}
                                className={`${
                                    theme === "dark"
                                        ? "bg-white text-black hover:bg-gray-200"
                                        : "bg-amber-600 hover:bg-amber-700 text-white"
                                } px-6 py-2 rounded-xl`}
                            >
                                <Plus className="h-5 w-5 mr-2" />
                                Add Department
                            </Button>
                            <AddEditDepartmentModal
                                showAddModal={showAddModal}
                                setShowAddModal={setShowAddModal}
                                editingDepartment={editingDepartment}
                                departments={departments}
                            />
                        </CardTitle>
                    </CardHeader>

                    {/* Toolbar */}
                    <DataToolbar
                        columns={cols}
                        onToggleColumn={toggleCol}
                        density={density}
                        onDensityChange={setDensity}
                        onExport={exportDepartments}
                        filtersActiveCount={activeFilters}
                        filtersContent={
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div>
                                    <Label
                                        className={`${
                                            theme === "dark" ? "text-white" : "text-slate-700"
                                        } text-sm font-semibold`}
                                    >
                                        Search
                                    </Label>
                                    <Input
                                        placeholder="Search departments..."
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                        className={`${
                                            theme === "dark"
                                                ? "bg-black text-white border-gray-600"
                                                : ""
                                        } mt-2`}
                                    />
                                </div>
                                <div>
                                    <Label
                                        className={`${
                                            theme === "dark" ? "text-white" : "text-slate-700"
                                        } text-sm font-semibold`}
                                    >
                                        Status
                                    </Label>
                                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                                        <SelectTrigger
                                            className={`${
                                                theme === "dark"
                                                    ? "bg-black text-white border-gray-600"
                                                    : ""
                                            } mt-2`}
                                        >
                                            <SelectValue placeholder="All Status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All</SelectItem>
                                            <SelectItem value="active">Active</SelectItem>
                                            <SelectItem value="inactive">Inactive</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label
                                        className={`${
                                            theme === "dark" ? "text-white" : "text-slate-700"
                                        } text-sm font-semibold`}
                                    >
                                        Location
                                    </Label>
                                    <Select
                                        value={locationFilter}
                                        onValueChange={setLocationFilter}
                                    >
                                        <SelectTrigger
                                            className={`${
                                                theme === "dark"
                                                    ? "bg-black text-white border-gray-600"
                                                    : ""
                                            } mt-2`}
                                        >
                                            <SelectValue placeholder="All Locations" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All</SelectItem>
                                            {locations.map(loc => (
                                                <SelectItem key={loc} value={loc}>
                                                    {loc}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div
                                    className={`${
                                        theme === "dark" ? "text-gray-400" : "text-slate-500"
                                    } self-end text-sm`}
                                >
                                    Filters update automatically
                                </div>
                            </div>
                        }
                    />

                    {/* Table */}
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow
                                        className={`${
                                            theme === "dark"
                                                ? "bg-black hover:bg-black"
                                                : "bg-amber-800 hover:bg-amber-800"
                                        } border-none`}
                                    >
                                        {visibleColumns.name && (
                                            <TableHead
                                                className={`${
                                                    theme === "dark"
                                                        ? "text-white"
                                                        : "text-yellow-100"
                                                } font-semibold text-sm py-4 px-6`}
                                            >
                                                Name
                                            </TableHead>
                                        )}
                                        {visibleColumns.code && (
                                            <TableHead
                                                className={`${
                                                    theme === "dark"
                                                        ? "text-white"
                                                        : "text-yellow-100"
                                                } font-semibold text-sm py-4 px-6`}
                                            >
                                                Code
                                            </TableHead>
                                        )}
                                        {visibleColumns.manager && (
                                            <TableHead
                                                className={`${
                                                    theme === "dark"
                                                        ? "text-white"
                                                        : "text-yellow-100"
                                                } font-semibold text-sm py-4 px-6`}
                                            >
                                                Manager
                                            </TableHead>
                                        )}
                                        {visibleColumns.location && (
                                            <TableHead
                                                className={`${
                                                    theme === "dark"
                                                        ? "text-white"
                                                        : "text-yellow-100"
                                                } font-semibold text-sm py-4 px-6`}
                                            >
                                                Location
                                            </TableHead>
                                        )}
                                        {visibleColumns.employees && (
                                            <TableHead
                                                className={`${
                                                    theme === "dark"
                                                        ? "text-white"
                                                        : "text-yellow-100"
                                                } font-semibold text-sm py-4 px-6`}
                                            >
                                                Employees
                                            </TableHead>
                                        )}
                                        {visibleColumns.active && (
                                            <TableHead
                                                className={`${
                                                    theme === "dark"
                                                        ? "text-white"
                                                        : "text-yellow-100"
                                                } font-semibold text-sm py-4 px-6`}
                                            >
                                                Active
                                            </TableHead>
                                        )}
                                        <TableHead
                                            className={`${
                                                theme === "dark" ? "text-white" : "text-yellow-100"
                                            } font-semibold text-sm py-4 px-6 text-right`}
                                        >
                                            Actions
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredDepartments.map((department, index) => {
                                        const departmentEmployees = findEmployeesByDepartmentId(
                                            department.id,
                                        );
                                        return (
                                            <TableRow
                                                key={department.id}
                                                className={`${
                                                    theme === "dark"
                                                        ? `border-gray-700 ${
                                                            index % 2 === 0
                                                                ? "bg-black"
                                                                : "bg-black"
                                                        } hover:bg-gray-800`
                                                        : `${index % 2 === 0 ? "bg-white" : ""} `
                                                } transition-all duration-200 ${getDensityRowClasses(
                                                    density,
                                                )}`}
                                            >
                                                {visibleColumns.name && (
                                                    <TableCell
                                                        className={`${
                                                            theme === "dark"
                                                                ? "text-white"
                                                                : "text-slate-900"
                                                        } px-6 font-semibold`}
                                                    >
                                                        {department.name}
                                                    </TableCell>
                                                )}
                                                {visibleColumns.code && (
                                                    <TableCell className="px-6">
                                                        <Badge
                                                            className={`${
                                                                theme === "dark"
                                                                    ? "bg-gray-700 text-white"
                                                                    : "bg-amber-100 text-amber-800 border-amber-200"
                                                            } rounded-lg px-3 py-1`}
                                                        >
                                                            {department.code}
                                                        </Badge>
                                                    </TableCell>
                                                )}
                                                {visibleColumns.manager && (
                                                    <TableCell
                                                        className={`${
                                                            theme === "dark"
                                                                ? "text-gray-300"
                                                                : "text-slate-700"
                                                        } px-6`}
                                                    >
                                                        {
                                                            employees.find(
                                                                employee =>
                                                                    employee.uid ===
                                                                    department.manager,
                                                            )?.firstName
                                                        }
                                                    </TableCell>
                                                )}
                                                {visibleColumns.location && (
                                                    <TableCell
                                                        className={`${
                                                            theme === "dark"
                                                                ? "text-gray-300"
                                                                : "text-slate-700"
                                                        } px-6`}
                                                    >
                                                        {department.location}
                                                    </TableCell>
                                                )}
                                                {visibleColumns.employees && (
                                                    <TableCell className="px-6">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className={`${
                                                                theme === "dark"
                                                                    ? "bg-gray-700 text-white hover:bg-gray-600 border-gray-600"
                                                                    : "bg-amber-100 text-amber-800 hover:bg-amber-200 border-amber-200"
                                                            } rounded-lg px-4 py-2 transition-all duration-200 border`}
                                                            onClick={() =>
                                                                handleViewEmployees(
                                                                    departmentEmployees,
                                                                    department.name,
                                                                )
                                                            }
                                                        >
                                                            <Users className="h-4 w-4 mr-2" />
                                                            {departmentEmployees.length} Employees
                                                        </Button>
                                                    </TableCell>
                                                )}
                                                {visibleColumns.active && (
                                                    <TableCell className="px-6">
                                                        <Badge
                                                            className={`rounded-lg px-3 py-1 ${
                                                                department.active
                                                                    ? `${
                                                                        theme === "dark"
                                                                            ? "bg-green-900 text-green-300 border-green-700"
                                                                            : "bg-green-100 text-green-800 border-green-200"
                                                                    }`
                                                                    : `${
                                                                        theme === "dark"
                                                                            ? "bg-gray-700 text-gray-300 border-gray-600"
                                                                            : "bg-gray-100 text-gray-800 border-gray-200"
                                                                    }`
                                                            }`}
                                                        >
                                                            {department.active ? "Yes" : "No"}
                                                        </Badge>
                                                    </TableCell>
                                                )}
                                                <TableCell className="px-6 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleEdit(department)}
                                                            className={`${
                                                                theme === "dark"
                                                                    ? "hover:bg-gray-700"
                                                                    : "hover:bg-amber-100"
                                                            } h-9 w-9 p-0 rounded-lg`}
                                                        >
                                                            <Edit
                                                                className={`h-4 w-4 ${
                                                                    theme === "dark"
                                                                        ? "text-white"
                                                                        : "text-amber-600"
                                                                }`}
                                                            />
                                                        </Button>
                                                        <DeleteConfirm
                                                            onConfirm={() =>
                                                                handleDelete(department.id!)
                                                            }
                                                            itemName={`department (${department.name})`}
                                                        />
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>

                <DetailEmployeeModal
                    showEmployeesModal={showEmployeesModal}
                    setShowEmployeesModal={setShowEmployeesModal}
                    selectedEmployees={selectedDepartmentEmployees}
                    selectedName={selectedDepartmentName}
                />
            </div>
        </div>
    );
}
