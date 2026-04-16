"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Search,
    Users,
    Phone,
    Mail,
    Maximize2,
    Minimize2,
    ZoomIn,
    ZoomOut,
    Home,
    ChevronDown,
    ChevronUp,
} from "lucide-react";
import { useFirestore } from "@/context/firestore-context";
import { EmployeeModel } from "@/lib/models/employee";
import { hr } from "date-fns/locale";

interface OrganizationalChartModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface Employee {
    uid: string;
    name: string;
    position: string;
    department: string;
    level: "management" | "team" | "employee";
    phone: string;
    email: string;
    avatar?: string;
    managerId?: string;
    directReports?: string[];
}

export function OrganizationalChartModal({ isOpen, onClose }: OrganizationalChartModalProps) {
    const { activeEmployees: firestoreEmployees, hrSettings } = useFirestore();
    const departmentsData = hrSettings?.departmentSettings || [];
    const positionsData = hrSettings?.positions || [];

    const transformEmployee = (emp: EmployeeModel): Employee => {
        const name = `${emp.firstName} ${emp.middleName ? emp.middleName + " " : ""}${emp.surname}`;
        let level: "management" | "team" | "employee";
        if (emp.role.includes("HR Manager")) {
            level = "management";
        } else if (emp.role.includes("Manager")) {
            level = "team";
        } else {
            level = "employee";
        }
        return {
            uid: emp.uid,
            name,
            position: emp.employmentPosition,
            department: emp.department,
            level,
            phone: emp.companyPhoneNumber || emp.personalPhoneNumber,
            email: emp.companyEmail,
            avatar: emp.profilePicture,
            managerId: emp.reportingLineManager,
            directReports: emp.reportees ?? [],
        };
    };

    const employees = firestoreEmployees.map(transformEmployee);

    const [searchTerm, setSearchTerm] = useState("");
    const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [zoomLevel, setZoomLevel] = useState(100);
    const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);
    const [selectedLevels, setSelectedLevels] = useState<Set<string>>(
        new Set(["management", "team", "employee"]),
    );

    const filteredEmployees = employees.filter(employee => {
        const matchesSearch =
            employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            positionsData
                .find(p => p.id == employee?.position)
                ?.name?.toLowerCase()
                .includes(searchTerm.toLowerCase()) ||
            departmentsData
                .find(d => d.id == employee?.department)
                ?.name?.toLowerCase()
                .includes(searchTerm.toLowerCase());
        const matchesDepartment =
            selectedDepartment === "all" || employee.department === selectedDepartment;
        const matchesLevel = selectedLevels.has(employee.level);
        return matchesSearch && matchesDepartment && matchesLevel;
    });

    const rootEmployees = employees.filter(
        emp => !filteredEmployees.find(e => e.managerId == emp.managerId)?.managerId,
    );
    const initialExpanded = new Set(
        rootEmployees.flatMap(root => [
            root.uid,
            ...employees.filter(e => e.managerId === root.uid).map(e => e.uid),
        ]),
    );
    const [expandedNodes, setExpandedNodes] = useState<Set<string>>(initialExpanded);

    const departments = [
        "all",
        ...Array.from(new Set(employees.map(emp => emp.department).filter(dept => dept))),
    ];

    const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 10, 150));
    const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 10, 50));
    const handleZoomReset = () => setZoomLevel(100);

    const toggleNode = (id: string) => {
        setExpandedNodes(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    };

    const toggleLevel = (level: string) => {
        setSelectedLevels(prev => {
            const newSet = new Set(prev);
            if (newSet.has(level)) {
                newSet.delete(level);
            } else {
                newSet.add(level);
            }
            return newSet;
        });
    };

    const getLevelColor = (level: string) => {
        switch (level) {
            case "management":
                return "border-yellow-400 bg-gradient-to-br from-yellow-50 to-yellow-100";
            case "team":
                return "border-blue-400 bg-gradient-to-br from-blue-50 to-blue-100";
            case "employee":
                return "border-gray-400 bg-gradient-to-br from-gray-50 to-gray-100";
            default:
                return "border-gray-300 bg-white";
        }
    };

    const EmployeeCard = ({
        employee,
        isRoot = false,
    }: {
        employee: Employee;
        isRoot?: boolean;
    }) => {
        // Check if this employee matches the current filters
        const matchesCurrentFilters = filteredEmployees.some(fe => fe.uid === employee.uid);

        // Filter direct reports to only show those that match the search/filter criteria
        const allDirectReports = employees.filter(emp => emp.managerId === employee.uid);
        const directReports = allDirectReports.filter(report =>
            filteredEmployees.some(fe => fe.uid === report.uid),
        );

        const hasReports = directReports.length > 0;
        const isExpanded = expandedNodes.has(employee.uid);
        const isSelected = selectedEmployee === employee.uid;
        const isHighlighted =
            searchTerm &&
            (employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                positionsData
                    .find(p => p.id == employee?.position)
                    ?.name?.toLowerCase()
                    .includes(searchTerm.toLowerCase()) ||
                departmentsData
                    .find(d => d.id == employee?.department)
                    ?.name?.toLowerCase()
                    .includes(searchTerm.toLowerCase()));

        // Show employee if they match filters OR if they have children that match
        const shouldShow = matchesCurrentFilters || (hasReports && !isRoot);

        // Don't render if doesn't match and has no matching children (unless root)
        if (!shouldShow && !isRoot) {
            return null;
        }

        // Dim the card if it doesn't match but is shown because of children
        const isDimmed = !matchesCurrentFilters && hasReports;
        const departmentName = departmentsData.find(d => d.id == employee.department)?.name;
        const positionName = positionsData.find(p => p.id == employee.position)?.name;

        return (
            <div className="flex flex-col items-center">
                {/* Employee Card */}
                <Card
                    className={`
            ${getLevelColor(employee.level)} 
            ${isSelected ? "ring-4 ring-blue-500 shadow-2xl" : "shadow-lg"}
            ${isHighlighted ? "ring-2 ring-yellow-400" : ""}
            ${isDimmed ? "opacity-50" : "opacity-100"}
            hover:shadow-xl transition-all duration-300 cursor-pointer 
            border-2 w-64 relative
          `}
                    onClick={() => setSelectedEmployee(employee.uid)}
                >
                    <CardContent className="p-4">
                        <div className="flex flex-col items-center space-y-3">
                            {/* Avatar */}
                            <div className="relative">
                                <Avatar className="h-16 w-16 ring-4 ring-white shadow-md">
                                    <AvatarImage
                                        src={employee.avatar || "/placeholder.svg"}
                                        alt={employee.name}
                                    />
                                    <AvatarFallback className="bg-blue-600 text-white font-bold text-lg">
                                        {employee.name
                                            .split(" ")
                                            .map(n => n[0])
                                            .join("")}
                                    </AvatarFallback>
                                </Avatar>
                                {hasReports && (
                                    <Badge className="absolute -bottom-2 -right-2 h-6 w-6 rounded-full p-0 flex items-center justify-center bg-blue-600 text-white">
                                        {directReports.length}
                                    </Badge>
                                )}
                            </div>

                            {/* Info */}
                            <div className="text-center space-y-1 w-full">
                                <h3 className="font-bold text-sm text-gray-900 leading-tight">
                                    {employee.name}
                                </h3>
                                {positionName ? (
                                    <p className="text-xs font-semibold text-gray-700">
                                        {positionName}
                                    </p>
                                ) : (
                                    <></>
                                )}
                                {departmentName ? (
                                    <Badge
                                        variant="outline"
                                        className="text-xs border-gray-400 bg-white"
                                    >
                                        {departmentName}
                                    </Badge>
                                ) : (
                                    <></>
                                )}
                            </div>

                            {/* Contact Info */}
                            <div className="w-full space-y-1 text-xs bg-white/70 rounded-md p-2">
                                <div className="flex items-center gap-1.5 text-gray-700">
                                    <Phone className="h-3 w-3 flex-shrink-0" />
                                    <span className="truncate font-medium">{employee.phone}</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-gray-700">
                                    <Mail className="h-3 w-3 flex-shrink-0" />
                                    <span className="truncate font-medium">{employee.email}</span>
                                </div>
                            </div>

                            {/* Expand/Collapse Button */}
                            {hasReports && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-full text-xs gap-1 hover:bg-blue-100 text-gray-700"
                                    onClick={e => {
                                        e.stopPropagation();
                                        toggleNode(employee.uid);
                                    }}
                                >
                                    {isExpanded ? (
                                        <>
                                            <ChevronUp className="h-3 w-3" />
                                            Hide Reports
                                        </>
                                    ) : (
                                        <>
                                            <ChevronDown className="h-3 w-3" />
                                            Show {directReports.length} Reports
                                        </>
                                    )}
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Connection Line and Direct Reports */}
                {hasReports && isExpanded && (
                    <div className="flex flex-col items-center mt-4">
                        {/* Vertical line from parent */}
                        <div className="w-0.5 h-8 bg-gray-400"></div>

                        {/* Horizontal line connector */}
                        <div className="relative w-full">
                            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-full h-0.5 bg-gray-400"></div>
                            <div className="flex justify-center gap-8 pt-8">
                                {directReports.map((report, index) => (
                                    <div
                                        key={report.uid}
                                        className="relative flex flex-col items-center"
                                    >
                                        {/* Vertical line to child */}
                                        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 w-0.5 h-8 bg-gray-400"></div>
                                        <EmployeeCard employee={report} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent
                className={`${isFullscreen ? "max-w-[98vw] max-h-[98vh]" : "max-w-7xl max-h-[90vh]"} overflow-hidden flex flex-col bg-white dark:bg-gray-900`}
            >
                <DialogHeader className="pb-4 flex-shrink-0">
                    <div className="flex items-center justify-between">
                        <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
                            <div className="p-2 bg-yellow-100 rounded-xl dark:bg-yellow-900/30">
                                <Users className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                            </div>
                            Organizational Hierarchy
                        </DialogTitle>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsFullscreen(!isFullscreen)}
                            className="border-gray-300"
                        >
                            {isFullscreen ? (
                                <Minimize2 className="h-4 w-4" />
                            ) : (
                                <Maximize2 className="h-4 w-4" />
                            )}
                        </Button>
                    </div>
                </DialogHeader>

                {/* Controls */}
                <div className="flex-shrink-0 space-y-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                    {/* Search and Filters */}
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Search by name, position, or department..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="pl-10 border-gray-300 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                            />
                        </div>
                        <Select
                            value={selectedDepartment}
                            onValueChange={value => {
                                setSelectedDepartment(value);
                                // Auto-expand nodes when filtering to show results
                                if (value !== "all") {
                                    setExpandedNodes(new Set(employees.map(e => e.uid)));
                                }
                            }}
                        >
                            <SelectTrigger className="w-[220px] border-gray-300 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700">
                                <SelectValue placeholder="Select department" />
                            </SelectTrigger>
                            <SelectContent className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700">
                                {departments.map(dept => (
                                    <SelectItem
                                        key={dept}
                                        value={dept}
                                        className="bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 cursor-pointer"
                                    >
                                        {dept === "all"
                                            ? "All Departments"
                                            : (departmentsData?.find(d => d.id == dept)?.name ??
                                              "Unknown Department")}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {(searchTerm ||
                            selectedDepartment !== "all" ||
                            selectedLevels.size !== 3) && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    setSearchTerm("");
                                    setSelectedDepartment("all");
                                    setSelectedLevels(new Set(["management", "team", "employee"]));
                                }}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                Clear All
                            </Button>
                        )}
                    </div>

                    {/* Zoom Controls */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Zoom:
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleZoomOut}
                                className="h-8 w-8 p-0 bg-white dark:bg-gray-800 border-gray-300"
                            >
                                <ZoomOut className="h-4 w-4" />
                            </Button>
                            <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 w-12 text-center">
                                {zoomLevel}%
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleZoomIn}
                                className="h-8 w-8 p-0 bg-white dark:bg-gray-800 border-gray-300"
                            >
                                <ZoomIn className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleZoomReset}
                                className="h-8 px-3 bg-white dark:bg-gray-800 border-gray-300"
                            >
                                <Home className="h-4 w-4" />
                            </Button>
                        </div>

                        <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="level-management"
                                    checked={selectedLevels.has("management")}
                                    onChange={() => toggleLevel("management")}
                                    className="w-4 h-4 text-yellow-600 bg-gray-100 border-gray-300 rounded focus:ring-yellow-500 cursor-pointer"
                                />
                                <label
                                    htmlFor="level-management"
                                    className="text-gray-700 dark:text-gray-300 cursor-pointer select-none flex items-center gap-1.5"
                                >
                                    Top Management
                                </label>
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="level-team"
                                    checked={selectedLevels.has("team")}
                                    onChange={() => toggleLevel("team")}
                                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                                />
                                <label
                                    htmlFor="level-team"
                                    className="text-gray-700 dark:text-gray-300 cursor-pointer select-none flex items-center gap-1.5"
                                >
                                    Middle Management
                                </label>
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="level-employee"
                                    checked={selectedLevels.has("employee")}
                                    onChange={() => toggleLevel("employee")}
                                    className="w-4 h-4 text-gray-600 bg-gray-100 border-gray-300 rounded focus:ring-gray-500 cursor-pointer"
                                />
                                <label
                                    htmlFor="level-employee"
                                    className="text-gray-700 dark:text-gray-300 cursor-pointer select-none flex items-center gap-1.5"
                                >
                                    Employee
                                </label>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Chart Container */}
                <div className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div
                        className="min-h-full p-8 flex justify-center items-start gap-8"
                        style={{
                            transform: `scale(${zoomLevel / 100})`,
                            transformOrigin: "top center",
                            transition: "transform 0.3s ease",
                        }}
                    >
                        {rootEmployees.map(root => {
                            const hasMatching = filteredEmployees.some(
                                fe =>
                                    fe.uid === root.uid ||
                                    employees.some(
                                        e =>
                                            e.managerId === root.uid &&
                                            filteredEmployees.some(fe2 => fe2.uid === e.uid),
                                    ),
                            );
                            return hasMatching ? (
                                <EmployeeCard key={root.uid} employee={root} isRoot={true} />
                            ) : null;
                        })}
                    </div>
                </div>

                {/* No Results Message */}
                {filteredEmployees.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <Search className="h-16 w-16 text-gray-300 mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                            No employees found
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Try adjusting your search or filter criteria
                        </p>
                    </div>
                )}

                {/* Stats Footer */}
                <div className="flex-shrink-0 grid grid-cols-4 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                            {filteredEmployees.filter(e => e.level === "management").length}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                            Top Management
                        </div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                            {filteredEmployees.filter(e => e.level === "team").length}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                            Middle Management
                        </div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                            {filteredEmployees.filter(e => e.level === "employee").length}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">Employees</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                            {filteredEmployees.length}
                            {filteredEmployees.length !== employees.length && (
                                <span className="text-sm text-gray-500 ml-1">
                                    / {employees.length}
                                </span>
                            )}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                            {filteredEmployees.length !== employees.length ? "Showing" : "Total"}
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex-shrink-0 flex justify-between gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <Button
                        variant="outline"
                        onClick={() => {
                            setExpandedNodes(new Set(employees.map(e => e.uid)));
                        }}
                        className="border-gray-300 text-gray-700 dark:text-gray-300"
                    >
                        Expand All
                    </Button>
                    <div className="flex gap-3">
                        <Button
                            variant="outline"
                            onClick={onClose}
                            className="border-gray-300 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                        >
                            Close
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
