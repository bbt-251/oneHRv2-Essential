"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { MinMaxSlider } from "@/components/ui/min-max-slider";
import { Search, Eye, Filter, Loader2, Download } from "lucide-react";
import { CycleProvider } from "@/context/cycleContext";
import { useFirestore } from "@/context/firestore-context";
import { useAuth } from "@/context/authContext";
import {
    calculateEmployeePerformanceScores,
    getEmployeeFullName,
    getDepartmentName,
    getPositionName,
    EnhancedPerformanceEvaluationModel,
} from "@/lib/util/performance/employee-performance-utils";
import { ViewEmployeePerformanceModal } from "../modals/view-employee-performance";

interface ExtendedEnhancedPerformanceEvaluationModel extends EnhancedPerformanceEvaluationModel {
    contractStatus: "active" | "inactive";
}

function EmployeePerformanceContent() {
    const { employees, performanceEvaluations, hrSettings } = useFirestore();
    const { userData } = useAuth();

    const [dataSource, setDataSource] = useState<ExtendedEnhancedPerformanceEvaluationModel[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterDepartment, setFilterDepartment] = useState<string>("all");
    const [filterPosition, setFilterPosition] = useState<string>("all");
    const [filterContractStatus, setFilterContractStatus] = useState<string>("all");
    const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
    const [selectedEmployee, setSelectedEmployee] =
        useState<EnhancedPerformanceEvaluationModel | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Score range filters
    const [objectiveScoreRange, setObjectiveScoreRange] = useState<[number, number]>([0, 5]);
    const [competenceScoreRange, setCompetenceScoreRange] = useState<[number, number]>([0, 5]);
    const [overallScoreRange, setOverallScoreRange] = useState<[number, number]>([0, 5]);

    // Get selected period from hrSettings
    const selectedPeriod = hrSettings.periodicOptions?.find(p => p.year === selectedYear);

    useEffect(() => {
        if (!employees.length || !performanceEvaluations.length || !selectedPeriod) {
            setLoading(false);
            return;
        }

        const peByEmployeeUidAndPerformanceYear: Record<string, any[]> = {};
        performanceEvaluations.map(d =>
            peByEmployeeUidAndPerformanceYear[`${d.employeeUid}%${selectedPeriod.year}`] !==
            undefined
                ? peByEmployeeUidAndPerformanceYear[`${d.employeeUid}%${selectedPeriod.year}`].push(
                    d,
                )
                : (peByEmployeeUidAndPerformanceYear[`${d.employeeUid}%${selectedPeriod.year}`] = [
                    d,
                ]),
        );

        const dataSource: ExtendedEnhancedPerformanceEvaluationModel[] = [];
        Object.keys(peByEmployeeUidAndPerformanceYear).map(val => {
            const employeeUid = val.split("%")[0];
            const employee = employees.find(e => e.uid === employeeUid);
            const d = peByEmployeeUidAndPerformanceYear[val];

            if (!employee) return; // Skip if employee not found

            // Calculate performance scores
            const performanceScores = calculateEmployeePerformanceScores(
                employee,
                selectedPeriod,
                performanceEvaluations,
            );

            dataSource.push({
                ...d[0],
                employeeName: getEmployeeFullName(employee),
                department: getDepartmentName(employee.department, hrSettings),
                position: getPositionName(employee.employmentPosition, hrSettings),
                performanceYear: selectedPeriod.year,
                performanceScores,
                contractStatus: employee.contractStatus,
            });
        });

        // Sort by employee name
        dataSource.sort((a, b) => a.employeeName.localeCompare(b.employeeName));

        setDataSource(dataSource);
        setLoading(false);
    }, [employees, performanceEvaluations, selectedPeriod, hrSettings]);

    const filteredData = dataSource.filter(item => {
        const matchesSearch =
            item.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.position?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            false ||
            item.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            false;

        const matchesDepartment =
            filterDepartment === "all" || item.department === filterDepartment;
        const matchesPosition = filterPosition === "all" || item.position === filterPosition;
        const matchesContractStatus =
            filterContractStatus === "all" || item.contractStatus === filterContractStatus;

        // Score range filters
        const matchesObjectiveScore =
            item.performanceScores.overallObjectiveScore >= objectiveScoreRange[0] &&
            item.performanceScores.overallObjectiveScore <= objectiveScoreRange[1];
        const matchesCompetenceScore =
            item.performanceScores.overallCompetencyScore >= competenceScoreRange[0] &&
            item.performanceScores.overallCompetencyScore <= competenceScoreRange[1];
        const matchesOverallScore =
            item.performanceScores.overallPerformanceScore >= overallScoreRange[0] &&
            item.performanceScores.overallPerformanceScore <= overallScoreRange[1];

        return (
            matchesSearch &&
            matchesDepartment &&
            matchesPosition &&
            matchesContractStatus &&
            matchesObjectiveScore &&
            matchesCompetenceScore &&
            matchesOverallScore
        );
    });

    const uniqueDepartments = Array.from(new Set(dataSource.map(item => item.department))).filter(
        Boolean,
    );
    const uniquePositions = Array.from(new Set(dataSource.map(item => item.position))).filter(
        Boolean,
    );
    const yearOptions = Array.from(
        new Set(hrSettings.periodicOptions?.map(p => p.year).filter(Boolean) || []),
    ).sort((a, b) => b - a);

    const stats = {
        total: dataSource.length,
        highPerformers: dataSource.filter(
            item => item.performanceScores.overallPerformanceScore >= 4.0,
        ).length,
        averagePerformers: dataSource.filter(
            item =>
                item.performanceScores.overallPerformanceScore >= 3.0 &&
                item.performanceScores.overallPerformanceScore < 4.0,
        ).length,
        needsImprovement: dataSource.filter(
            item => item.performanceScores.overallPerformanceScore < 3.0,
        ).length,
    };

    const getPerformanceColor = (score: number) => {
        if (score >= 4.0) return "bg-green-100 text-green-800";
        if (score >= 3.0) return "bg-yellow-100 text-yellow-800";
        return "bg-red-100 text-red-800";
    };

    const exportToCSV = () => {
        if (!filteredData.length) {
            alert("No data available to export");
            return;
        }

        // Create CSV header
        let csvContent = "data:text/csv;charset=utf-8,";
        const headers = [
            "Employee Name",
            "Position",
            "Department",
            "Performance Year",
            "Objective Score",
            "Competency Score",
            "Overall Score",
        ];

        // Add round headers if they exist
        if (selectedPeriod?.evaluations?.length) {
            selectedPeriod.evaluations.forEach(evaluation => {
                headers.push(`Round ${evaluation.round} - Objective`);
                headers.push(`Round ${evaluation.round} - Competency`);
                headers.push(`Round ${evaluation.round} - Performance`);
            });
        }

        csvContent += headers.join(",") + "\r\n";

        // Add data rows
        filteredData.forEach(item => {
            const row = [
                `"${item.employeeName.replace(/"/g, '""')}"`,
                `"${item.position?.replace(/"/g, '""') || ""}"`,
                `"${item.department?.replace(/"/g, '""') || ""}"`,
                item.performanceYear,
                item.performanceScores.overallObjectiveScore.toFixed(1),
                item.performanceScores.overallCompetencyScore.toFixed(1),
                item.performanceScores.overallPerformanceScore.toFixed(1),
            ];

            // Add round data if it exists
            if (selectedPeriod?.evaluations?.length) {
                selectedPeriod.evaluations.forEach(evaluation => {
                    const roundScore =
                        item.performanceScores.roundScores[`round${evaluation.round}`];
                    row.push(
                        roundScore?.objectiveScore !== "N/A"
                            ? roundScore.objectiveScore.toFixed(1)
                            : "N/A",
                    );
                    row.push(
                        roundScore?.competencyScore !== "N/A"
                            ? roundScore.competencyScore.toFixed(1)
                            : "N/A",
                    );
                    row.push(
                        roundScore?.performanceScore !== "N/A"
                            ? roundScore.performanceScore.toFixed(1)
                            : "N/A",
                    );
                });
            }

            csvContent += row.join(",") + "\r\n";
        });

        // Create download link
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `employee_performance_${selectedYear}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="p-6 space-y-6 min-h-screen">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Employee Performance</h1>
                    <p className="text-gray-600 mt-1">View and analyze employee performance data</p>
                </div>
                <Button
                    onClick={exportToCSV}
                    disabled={loading || !filteredData.length}
                    className="gap-2"
                >
                    <Download className="h-4 w-4" />
                    Export CSV
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">
                            Total Employees
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.total}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">
                            High Performers
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                            {stats.highPerformers}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">
                            Average Performers
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-yellow-600">
                            {stats.averagePerformers}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">
                            Needs Improvement
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">
                            {stats.needsImprovement}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                        placeholder="Search employees..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="pl-10"
                    />
                </div>

                {/* Filter controls */}
                <div className="flex items-center space-x-2">
                    <Filter className="h-4 w-4 text-gray-500" />
                    <Select value={filterDepartment} onValueChange={setFilterDepartment}>
                        <SelectTrigger className="w-40">
                            <SelectValue placeholder="All Departments" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Departments</SelectItem>
                            {uniqueDepartments.map(dept => (
                                <SelectItem key={dept} value={dept}>
                                    {dept}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={filterPosition} onValueChange={setFilterPosition}>
                        <SelectTrigger className="w-40">
                            <SelectValue placeholder="All Positions" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Positions</SelectItem>
                            {uniquePositions.map(pos => (
                                <SelectItem key={pos} value={pos}>
                                    {pos}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select
                        value={selectedYear.toString()}
                        onValueChange={value => setSelectedYear(Number(value))}
                    >
                        <SelectTrigger className="w-32">
                            <SelectValue placeholder="Year" />
                        </SelectTrigger>
                        <SelectContent>
                            {yearOptions.map(year => (
                                <SelectItem key={year} value={year.toString()}>
                                    {year}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={filterContractStatus} onValueChange={setFilterContractStatus}>
                        <SelectTrigger className="w-40">
                            <SelectValue placeholder="All Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Score Range Filters */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Score Range Filters</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <MinMaxSlider
                            label="Objective Score"
                            min={0}
                            max={5}
                            step={0.1}
                            value={objectiveScoreRange}
                            onValueChange={setObjectiveScoreRange}
                        />
                        <MinMaxSlider
                            label="Competence Score"
                            min={0}
                            max={5}
                            step={0.1}
                            value={competenceScoreRange}
                            onValueChange={setCompetenceScoreRange}
                        />
                        <MinMaxSlider
                            label="Overall Score"
                            min={0}
                            max={5}
                            step={0.1}
                            value={overallScoreRange}
                            onValueChange={setOverallScoreRange}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Performance Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Employee Performance Overview</CardTitle>
                    <CardDescription>
                        <p>Count: {filteredData.length}</p>
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex items-center justify-center h-64">
                            <Loader2 className="h-8 w-8 animate-spin" />
                            <span className="ml-2">Loading performance data...</span>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Employee Name</TableHead>
                                    <TableHead>Position</TableHead>
                                    <TableHead>Department</TableHead>
                                    <TableHead>Performance Year</TableHead>
                                    <TableHead>Objective Score</TableHead>
                                    <TableHead>Competency Score</TableHead>
                                    <TableHead>Overall Score</TableHead>
                                    {/* Dynamic Round Headers */}
                                    {selectedPeriod?.evaluations?.map(evaluation => (
                                        <TableHead key={`round-${evaluation.round}`}>
                                            Round - {evaluation.round}
                                            <div className="text-xs text-gray-500">
                                                {evaluation.from} - {evaluation.to}
                                            </div>
                                        </TableHead>
                                    ))}
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredData.map(item => (
                                    <TableRow key={item.id}>
                                        <TableCell className="font-medium">
                                            {item.employeeName}
                                        </TableCell>
                                        <TableCell>{item.position}</TableCell>
                                        <TableCell>{item.department}</TableCell>
                                        <TableCell>{item.performanceYear}</TableCell>
                                        <TableCell>
                                            <Badge
                                                className={getPerformanceColor(
                                                    item.performanceScores.overallObjectiveScore,
                                                )}
                                            >
                                                {item.performanceScores.overallObjectiveScore.toFixed(
                                                    1,
                                                )}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                className={getPerformanceColor(
                                                    item.performanceScores.overallCompetencyScore,
                                                )}
                                            >
                                                {item.performanceScores.overallCompetencyScore.toFixed(
                                                    1,
                                                )}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                className={getPerformanceColor(
                                                    item.performanceScores.overallPerformanceScore,
                                                )}
                                            >
                                                {item.performanceScores.overallPerformanceScore.toFixed(
                                                    1,
                                                )}
                                            </Badge>
                                        </TableCell>
                                        {/* Dynamic Round Columns */}
                                        {selectedPeriod?.evaluations?.map(evaluation => {
                                            const roundScore =
                                                item.performanceScores.roundScores[
                                                    `round${evaluation.round}`
                                                ];
                                            return (
                                                <TableCell key={`round-${evaluation.round}`}>
                                                    <div className="text-xs text-gray-600">
                                                        <div>
                                                            O: {roundScore?.objectiveScore || "N/A"}
                                                        </div>
                                                        <div>
                                                            C:{" "}
                                                            {roundScore?.competencyScore || "N/A"}
                                                        </div>
                                                        <div>
                                                            P:{" "}
                                                            {roundScore?.performanceScore || "N/A"}
                                                        </div>
                                                    </div>
                                                </TableCell>
                                            );
                                        })}
                                        <TableCell>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => {
                                                    setSelectedEmployee(item);
                                                    setIsModalOpen(true);
                                                }}
                                            >
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Employee Performance Detail Modal */}
            {selectedEmployee && (
                <ViewEmployeePerformanceModal
                    isOpen={isModalOpen}
                    onClose={() => {
                        setIsModalOpen(false);
                        setSelectedEmployee(null);
                    }}
                    employeeUid={selectedEmployee.employeeUid}
                    performanceData={selectedEmployee}
                    selectedYear={selectedYear}
                />
            )}
        </div>
    );
}

export default function EmployeePerformancePage() {
    return (
        <CycleProvider>
            <EmployeePerformanceContent />
        </CycleProvider>
    );
}
