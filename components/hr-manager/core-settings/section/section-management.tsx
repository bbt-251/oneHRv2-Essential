"use client";

import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Plus, Edit, Trash2, Layers, Users } from "lucide-react";
import { DataToolbar, type Density, getDensityRowClasses } from "../blocks/data-toolbar";
import { SectionSettingsModel } from "@/lib/backend/firebase/hrSettingsService";
import { EmployeeModel } from "@/lib/models/employee";
// Add these imports
import { hrSettingsService } from "@/lib/backend/firebase/hrSettingsService";
import { useFirestore } from "@/context/firestore-context";
import { useToast } from "@/context/toastContext";
import { AddSection } from "../modals/add-section-modal";
import { DetailEmployeeModal } from "../modals/employee-detail-modal";
import { useTheme } from "@/components/theme-provider";
import DeleteConfirm from "../blocks/delete-confirm";
import { useAuth } from "@/context/authContext";
import { SECTION_LOG_MESSAGES } from "@/lib/log-descriptions/department-section";

export function SectionManagement() {
    const { theme } = useTheme();
    const { hrSettings, employees } = useFirestore();
    const { userData } = useAuth();
    const departments = hrSettings.departmentSettings;
    // Keep original sections (department stored as id) and create a display copy
    // where department is the department name for showing in the table.
    const sections = hrSettings.sectionSettings; // original data (department is id)
    const displaySections = sections.map(s => ({
        ...s,
        department: departments.find(d => d.id == s.department)?.name ?? "",
    }));

    const findEmployeesBySectionId = (sectionId: string) => {
        return employees.filter(e => e.section === sectionId);
    };

    const { showToast } = useToast();
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEmployeesModal, setShowEmployeesModal] = useState(false);
    const [selectedSectionEmployees, setSelectedSectionEmployees] = useState<EmployeeModel[]>([]);
    const [selectedSectionName, setSelectedSectionName] = useState("");
    const [editingSection, setEditingSection] = useState<SectionSettingsModel | null>(null);

    // Toolbar state
    const [density, setDensity] = useState<Density>("normal");
    const [visibleColumns, setVisibleColumns] = useState({
        name: true,
        code: true,
        department: true,
        supervisor: true,
        employees: true,
        active: true,
    });
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [departmentFilter, setDepartmentFilter] = useState("all");

    const handleAdd = () => {
        setEditingSection(null);
        setShowAddModal(true);
    };

    const handleEdit = (section: SectionSettingsModel) => {
        // The table renders `displaySections` where `department` is the name.
        // Find the original section object by id so the modal receives the
        // section with `department` set to the department id (matching Select values).
        const original = sections.find(s => s.id === section.id) || null;
        setEditingSection(original);
        setShowAddModal(true);
    };

    const handleDelete = async (id: string) => {
        try {
            await hrSettingsService.remove(
                "sectionSettings",
                id,
                userData?.uid ?? "",
                SECTION_LOG_MESSAGES.DELETED(id),
            );
            showToast("Section deleted successfully", "success", "success");
        } catch (error) {
            console.error("Failed to delete section:", error);
            showToast("Failed to delete section", "error", "error");
        }
    };
    const handleViewEmployees = (employees: EmployeeModel[], sectionName: string) => {
        setSelectedSectionEmployees(employees);
        setSelectedSectionName(sectionName);
        setShowEmployeesModal(true);
    };

    // Derived data
    const filteredSections = useMemo(() => {
        // Filter the displaySections (department is the name) for rendering
        return displaySections.filter(s => {
            const matchesSearch =
                s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                s.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (s.supervisor && s.supervisor.toLowerCase().includes(searchTerm.toLowerCase()));
            const matchesStatus =
                statusFilter === "all" ||
                (statusFilter === "active" && s.active) ||
                (statusFilter === "inactive" && !s.active);
            const matchesDepartment =
                departmentFilter === "all" || s.department === departmentFilter;
            return matchesSearch && matchesStatus && matchesDepartment;
        });
    }, [sections, searchTerm, statusFilter, departmentFilter]);

    // Toolbar helpers
    const cols = Object.entries(visibleColumns).map(([key, visible]) => ({
        key,
        visible,
        label:
            key === "code"
                ? "Code"
                : key === "department"
                    ? "Department"
                    : key === "supervisor"
                        ? "Supervisor"
                        : key === "employees"
                            ? "Employees"
                            : key === "active"
                                ? "Active"
                                : key.charAt(0).toUpperCase() + key.slice(1),
    }));
    const toggleCol = (key: string) =>
        setVisibleColumns(s => ({ ...s, [key]: !s[key as keyof typeof s] }));

    const activeFilters =
        (searchTerm ? 1 : 0) +
        (statusFilter !== "all" ? 1 : 0) +
        (departmentFilter !== "all" ? 1 : 0);

    const exportSections = () => {
        const headers = cols
            .filter(c => c.visible)
            .map(c => c.label)
            .join(",");
        const rows = filteredSections
            .map(s =>
                cols
                    .filter(c => c.visible)
                    .map(c => {
                        if (c.key === "employees")
                            return String(findEmployeesBySectionId(s.id).length);
                        return String((s as any)[c.key] ?? "");
                    })
                    .join(","),
            )
            .join("\n");
        const csv = [headers, rows].join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "sections.csv";
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className={`${theme === "dark" ? "bg-black" : "bg-amber-50/30"} min-h-screen p-6`}>
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header + Toolbar wrapper */}
                <Card
                    className={`${theme === "dark" ? "bg-black" : "bg-white/80 backdrop-blur-sm"} shadow-2xl rounded-2xl overflow-hidden`}
                >
                    {/* Header */}
                    <div
                        className={`${theme === "dark" ? "bg-black text-white" : "bg-amber-800 text-white"} p-6`}
                    >
                        <div
                            className={`flex items-center justify-between gap-4 ${theme === "dark" ? "bg-black text-white" : "bg-amber-800 text-white"}`}
                        >
                            <div className="flex items-center gap-4">
                                <div
                                    className={`${theme === "dark" ? "bg-white/20" : "bg-white/20"} p-3 rounded-xl`}
                                >
                                    <Layers className="h-8 w-8" />
                                </div>
                                <div>
                                    <div className="text-2xl font-bold">Sections</div>
                                    <div
                                        className={`${theme === "dark" ? "text-gray-400" : "text-yellow-200"} text-sm font-normal`}
                                    >
                                        {filteredSections.length} sections
                                    </div>
                                </div>
                            </div>
                            <Button
                                onClick={handleAdd}
                                className={`${theme === "dark" ? "bg-white text-black hover:bg-gray-200" : "bg-amber-600 hover:bg-amber-700 text-white"} px-6 py-2 rounded-xl`}
                            >
                                <Plus className="h-5 w-5 mr-2" />
                                Add Section
                            </Button>
                            <AddSection
                                showAddModal={showAddModal}
                                setShowAddModal={setShowAddModal}
                                editingSection={editingSection}
                                sections={sections}
                            />
                        </div>
                    </div>

                    {/* Toolbar */}
                    <DataToolbar
                        columns={cols}
                        onToggleColumn={toggleCol}
                        density={density}
                        onDensityChange={setDensity}
                        onExport={exportSections}
                        filtersActiveCount={activeFilters}
                        filtersContent={
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <Label
                                        className={`${theme === "dark" ? "text-white" : "text-slate-700"} text-sm font-semibold`}
                                    >
                                        Search
                                    </Label>
                                    <Input
                                        placeholder="Search sections..."
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                        className={`${theme === "dark" ? "bg-black text-white border-gray-600" : ""} mt-2`}
                                    />
                                </div>
                                <div>
                                    <Label
                                        className={`${theme === "dark" ? "text-white" : "text-slate-700"} text-sm font-semibold`}
                                    >
                                        Status
                                    </Label>
                                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                                        <SelectTrigger
                                            className={`${theme === "dark" ? "bg-black text-white border-gray-600" : ""} mt-2`}
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
                                        className={`${theme === "dark" ? "text-white" : "text-slate-700"} text-sm font-semibold`}
                                    >
                                        Department
                                    </Label>
                                    <Select
                                        value={departmentFilter}
                                        onValueChange={setDepartmentFilter}
                                    >
                                        <SelectTrigger
                                            className={`${theme === "dark" ? "bg-black text-white border-gray-600" : ""} mt-2`}
                                        >
                                            <SelectValue placeholder="All Departments" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All</SelectItem>
                                            {departments.map(dept => (
                                                <SelectItem key={dept.id} value={dept.name}>
                                                    {dept.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        }
                    />
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow
                                        className={
                                            theme === "dark"
                                                ? "bg-black hover:bg-gray-800"
                                                : "bg-amber-800 hover:bg-amber-800"
                                        }
                                    >
                                        {visibleColumns.name && (
                                            <TableHead
                                                className={`${theme === "dark" ? "text-white" : "text-yellow-100"} font-semibold text-sm py-4 px-6`}
                                            >
                                                Name
                                            </TableHead>
                                        )}
                                        {visibleColumns.code && (
                                            <TableHead
                                                className={`${theme === "dark" ? "text-white" : "text-yellow-100"} font-semibold text-sm py-4 px-6`}
                                            >
                                                Code
                                            </TableHead>
                                        )}
                                        {visibleColumns.department && (
                                            <TableHead
                                                className={`${theme === "dark" ? "text-white" : "text-yellow-100"} font-semibold text-sm py-4 px-6`}
                                            >
                                                Department
                                            </TableHead>
                                        )}
                                        {visibleColumns.supervisor && (
                                            <TableHead
                                                className={`${theme === "dark" ? "text-white" : "text-yellow-100"} font-semibold text-sm py-4 px-6`}
                                            >
                                                Supervisor
                                            </TableHead>
                                        )}
                                        {visibleColumns.employees && (
                                            <TableHead
                                                className={`${theme === "dark" ? "text-white" : "text-yellow-100"} font-semibold text-sm py-4 px-6`}
                                            >
                                                Employees
                                            </TableHead>
                                        )}
                                        {visibleColumns.active && (
                                            <TableHead
                                                className={`${theme === "dark" ? "text-white" : "text-yellow-100"} font-semibold text-sm py-4 px-6`}
                                            >
                                                Active
                                            </TableHead>
                                        )}
                                        <TableHead
                                            className={`${theme === "dark" ? "text-white" : "text-yellow-100"} font-semibold text-sm py-4 px-6 text-right`}
                                        >
                                            Actions
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredSections.map((section, index) => {
                                        const sectionEmployees = findEmployeesBySectionId(
                                            section.id,
                                        );
                                        return (
                                            <TableRow
                                                key={section.id}
                                                className={`${
                                                    theme === "dark"
                                                        ? `border-gray-700 ${index % 2 === 0 ? "bg-black" : "bg-gray-900"} hover:bg-gray-800`
                                                        : `${index % 2 === 0 ? "bg-white" : "bg-slate-50/50"} hover:bg-amber-50/50`
                                                } transition-all duration-200 ${getDensityRowClasses(density)}`}
                                            >
                                                {visibleColumns.name && (
                                                    <TableCell
                                                        className={`${theme === "dark" ? "text-white" : "text-slate-900"} px-6 font-semibold`}
                                                    >
                                                        {section.name}
                                                    </TableCell>
                                                )}
                                                {visibleColumns.code && (
                                                    <TableCell className="px-6">
                                                        <Badge
                                                            className={`${theme === "dark" ? "bg-gray-700 text-white" : "bg-amber-100 text-amber-800 border-amber-200"} rounded-lg px-3 py-1`}
                                                        >
                                                            {section.code}
                                                        </Badge>
                                                    </TableCell>
                                                )}
                                                {visibleColumns.department && (
                                                    <TableCell
                                                        className={`${theme === "dark" ? "text-gray-300" : "text-slate-700"} px-6`}
                                                    >
                                                        {section.department}
                                                    </TableCell>
                                                )}
                                                {visibleColumns.supervisor && (
                                                    <TableCell
                                                        className={`${theme === "dark" ? "text-gray-300" : "text-slate-700"} px-6`}
                                                    >
                                                        {section.supervisor
                                                            ? employees.find(
                                                                e => e.uid === section.supervisor,
                                                            )?.firstName || "No supervisor"
                                                            : "No supervisor"}
                                                    </TableCell>
                                                )}
                                                {visibleColumns.employees && (
                                                    <TableCell className="px-6">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className={`${theme === "dark" ? "bg-gray-700 text-white hover:bg-gray-600 border-gray-600" : "bg-amber-100 text-amber-800 hover:bg-amber-200 border-amber-200"} rounded-lg px-4 py-2 transition-all duration-200 border`}
                                                            onClick={() =>
                                                                handleViewEmployees(
                                                                    sectionEmployees,
                                                                    section.name,
                                                                )
                                                            }
                                                        >
                                                            <Users className="h-4 w-4 mr-2" />
                                                            {sectionEmployees.length} Employees
                                                        </Button>
                                                    </TableCell>
                                                )}
                                                {visibleColumns.active && (
                                                    <TableCell className="px-6">
                                                        <Badge
                                                            className={`rounded-lg px-3 py-1 ${
                                                                section.active
                                                                    ? `${theme === "dark" ? "bg-green-900 text-green-300 border-green-700" : "bg-green-100 text-green-800 border-green-200"}`
                                                                    : `${theme === "dark" ? "bg-gray-700 text-gray-300 border-gray-600" : "bg-gray-100 text-gray-800 border-gray-200"}`
                                                            }`}
                                                        >
                                                            {section.active ? "Yes" : "No"}
                                                        </Badge>
                                                    </TableCell>
                                                )}
                                                <TableCell className="px-6 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleEdit(section)}
                                                            className={`${theme === "dark" ? "hover:bg-gray-700" : "hover:bg-amber-100"} h-9 w-9 p-0 rounded-lg`}
                                                        >
                                                            <Edit
                                                                className={`h-4 w-4 ${theme === "dark" ? "text-white" : "text-amber-600"}`}
                                                            />
                                                        </Button>
                                                        <DeleteConfirm
                                                            onConfirm={() =>
                                                                handleDelete(section.id!)
                                                            }
                                                            itemName={`section (${section.name})`}
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
                    selectedName={selectedSectionName}
                    selectedEmployees={selectedSectionEmployees}
                />
            </div>
        </div>
    );
}
