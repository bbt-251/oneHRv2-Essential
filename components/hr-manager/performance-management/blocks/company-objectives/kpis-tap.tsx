"use client";
import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Link, Target, Users, Filter, X } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import {
    DepartmentKPIModel,
    StrategicObjectiveModel,
} from "@/lib/backend/firebase/hrSettingsService";
import DeleteConfirm from "@/components/hr-manager/core-settings/blocks/delete-confirm";
import { useFirestore } from "@/context/firestore-context";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface KPIsTapProps {
    departmentKPIs: DepartmentKPIModel[];
    strategicObjectives: StrategicObjectiveModel[];
    handleAddKPI: () => void;
    handleEditKPI: (kpi: DepartmentKPIModel) => void;
    handleDeleteKPI: (id: string) => void;
    hideAddButton?: boolean;
    hideActions?: boolean;
    currentPeriod?: {
        periodID: string | null;
        periodName: string;
    } | null;
}

export const KPIsTap = ({
    departmentKPIs,
    strategicObjectives,
    handleAddKPI,
    handleEditKPI,
    handleDeleteKPI,
    hideAddButton = false,
    hideActions = false,
    currentPeriod,
}: KPIsTapProps) => {
    const { theme } = useTheme();
    const { hrSettings } = useFirestore();

    // Filter state
    const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
    const [selectedSections, setSelectedSections] = useState<string[]>([]);
    const [selectedObjectives, setSelectedObjectives] = useState<string[]>([]);
    const [showFilters, setShowFilters] = useState(false);

    const departments = hrSettings.departmentSettings || [];
    const sections = hrSettings.sectionSettings || [];

    // Get active departments and sections
    const activeDepartments = departments.filter(d => d.active);
    const activeSections = sections.filter(s => s.active);

    // Filter KPIs based on selected filters
    const filteredKPIs = useMemo(() => {
        return departmentKPIs.filter(kpi => {
            // Department filter
            if (selectedDepartments.length > 0 && !selectedDepartments.includes(kpi.department)) {
                return false;
            }
            // Section filter
            if (selectedSections.length > 0) {
                const kpiSection = kpi.section || "";
                if (!selectedSections.includes(kpiSection)) {
                    return false;
                }
            }
            // Strategic objective filter
            if (selectedObjectives.length > 0) {
                const hasLinkedObjective = kpi.linkedObjectiveId?.some(id =>
                    selectedObjectives.includes(id),
                );
                if (!hasLinkedObjective) {
                    return false;
                }
            }
            return true;
        });
    }, [departmentKPIs, selectedDepartments, selectedSections, selectedObjectives]);

    const getDepartmentName = (departmentId: string) => {
        const department = departments.find(dept => dept.id === departmentId);
        return department?.name || departmentId;
    };

    const getSectionName = (sectionId: string) => {
        const section = sections.find(s => s.id === sectionId);
        return section?.name || sectionId;
    };

    const getCycleName = (periodId: string, roundId: string) => {
        const period = hrSettings.periodicOptions.find(p => p.id === periodId);
        const round = period?.evaluations.find(e => e.id === roundId);
        return period && round ? `${period.periodName} - ${round.round}` : "Unknown Cycle";
    };

    // Get sections for the selected departments (if any)
    const availableSections =
        selectedDepartments.length > 0
            ? activeSections.filter(s => selectedDepartments.includes(s.department))
            : activeSections;

    // Check if any filters are active
    const hasActiveFilters =
        selectedDepartments.length > 0 ||
        selectedSections.length > 0 ||
        selectedObjectives.length > 0;

    // Clear all filters
    const clearFilters = () => {
        setSelectedDepartments([]);
        setSelectedSections([]);
        setSelectedObjectives([]);
    };

    const renderNoObjectivesMessage = () => (
        <Card
            className={`border-dashed ${theme === "dark" ? "bg-black/20 border-gray-700" : "bg-gray-50"}`}
        >
            <CardContent className="p-8 text-center">
                <div className="flex justify-center mb-4">
                    <Target
                        className={`h-12 w-12 ${theme === "dark" ? "text-gray-500" : "text-gray-400"}`}
                    />
                </div>
                <h3
                    className={`text-lg font-semibold ${theme === "dark" ? "text-white" : "text-[#3f3d56]"}`}
                >
                    Add Strategic Objectives First
                </h3>
                <p
                    className={`mt-1 text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}
                >
                    You must add strategic objectives for the selected cycle before you can create
                    or view department KPIs.
                </p>
            </CardContent>
        </Card>
    );

    const renderNoKPIsMessage = () => (
        <Card
            className={`border-dashed ${theme === "dark" ? "bg-black/20 border-gray-700" : "bg-gray-50"}`}
        >
            <CardContent className="p-8 text-center">
                <div className="flex justify-center mb-4">
                    <Users
                        className={`h-12 w-12 ${theme === "dark" ? "text-gray-500" : "text-gray-400"}`}
                    />
                </div>
                <h3
                    className={`text-lg font-semibold ${theme === "dark" ? "text-white" : "text-[#3f3d56]"}`}
                >
                    {!currentPeriod ? "Select a Performance Period" : "No KPIs Found"}
                </h3>
                <p
                    className={`mt-1 text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}
                >
                    {!currentPeriod
                        ? "Please select a performance period to view or create department KPIs."
                        : "There are no department KPIs for the selected period."}
                </p>
                {!hideAddButton && currentPeriod && (
                    <Button
                        variant="outline"
                        onClick={handleAddKPI}
                        className={`mt-4 hover:opacity-80 bg-transparent ${theme === "dark" ? "text-white" : "text-[#3f3d56]"} ${theme === "dark" ? "border-white" : "border-[#3f3d56]"}`}
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Add the First KPI
                    </Button>
                )}
            </CardContent>
        </Card>
    );

    return (
        <>
            <div className="flex items-center justify-between">
                <div>
                    <h2
                        className={`text-2xl font-semibold ${theme === "dark" ? "text-white" : "text-[#3f3d56]"}`}
                    >
                        Department KPIs
                    </h2>
                    <p className={`mt-1 ${theme === "dark" ? "text-white" : "text-[#3f3d56]"}`}>
                        Department-specific metrics that support strategic objectives (
                        {filteredKPIs.length})
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {/* Filter Button */}
                    <Button
                        variant="outline"
                        onClick={() => setShowFilters(!showFilters)}
                        className={cn(
                            showFilters && "bg-gray-100 dark:bg-gray-800",
                            theme === "dark"
                                ? "text-white border-gray-700"
                                : "text-[#3f3d56] border-gray-300",
                        )}
                    >
                        <Filter className="h-4 w-4 mr-2" />
                        Filter
                        {hasActiveFilters && (
                            <Badge variant="secondary" className="ml-2 bg-blue-500 text-white">
                                {selectedDepartments.length +
                                    selectedSections.length +
                                    selectedObjectives.length}
                            </Badge>
                        )}
                    </Button>
                    {hasActiveFilters && (
                        <Button
                            variant="ghost"
                            onClick={clearFilters}
                            className={theme === "dark" ? "text-white" : "text-[#3f3d56]"}
                        >
                            <X className="h-4 w-4 mr-1" />
                            Clear
                        </Button>
                    )}
                </div>
            </div>

            {/* Filter Panel */}
            {showFilters && (
                <div className="grid grid-cols-3 gap-4 p-4 rounded-lg border bg-gray-50 dark:bg-gray-900/20">
                    {/* Department Filter */}
                    <div>
                        <label className="text-sm font-medium mb-2 block">Department</label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    className="w-full justify-between"
                                >
                                    {selectedDepartments.length > 0
                                        ? `${selectedDepartments.length} selected`
                                        : "All departments"}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                <Command>
                                    <CommandInput placeholder="Search departments..." />
                                    <CommandList>
                                        <CommandEmpty>No department found.</CommandEmpty>
                                        <CommandGroup>
                                            {activeDepartments.map(dept => {
                                                const isSelected = selectedDepartments.includes(
                                                    dept.id,
                                                );
                                                return (
                                                    <CommandItem
                                                        key={dept.id}
                                                        onSelect={() => {
                                                            if (isSelected) {
                                                                setSelectedDepartments(
                                                                    selectedDepartments.filter(
                                                                        id => id !== dept.id,
                                                                    ),
                                                                );
                                                            } else {
                                                                setSelectedDepartments([
                                                                    ...selectedDepartments,
                                                                    dept.id,
                                                                ]);
                                                            }
                                                        }}
                                                    >
                                                        <Check
                                                            className={cn(
                                                                "mr-2 h-4 w-4",
                                                                isSelected
                                                                    ? "opacity-100"
                                                                    : "opacity-0",
                                                            )}
                                                        />
                                                        {dept.name}
                                                    </CommandItem>
                                                );
                                            })}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                        {selectedDepartments.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                                {selectedDepartments.map(deptId => {
                                    const dept = departments.find(d => d.id === deptId);
                                    return (
                                        <Badge key={deptId} variant="secondary" className="text-xs">
                                            {dept?.name || deptId}
                                            <button
                                                className="ml-1 hover:text-red-500"
                                                onClick={e => {
                                                    e.stopPropagation();
                                                    setSelectedDepartments(
                                                        selectedDepartments.filter(
                                                            id => id !== deptId,
                                                        ),
                                                    );
                                                }}
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        </Badge>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Section Filter */}
                    <div>
                        <label className="text-sm font-medium mb-2 block">Section</label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    className="w-full justify-between"
                                    disabled={availableSections.length === 0}
                                >
                                    {selectedSections.length > 0
                                        ? `${selectedSections.length} selected`
                                        : availableSections.length === 0
                                            ? "No sections available"
                                            : "All sections"}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                <Command>
                                    <CommandInput placeholder="Search sections..." />
                                    <CommandList>
                                        <CommandEmpty>No section found.</CommandEmpty>
                                        <CommandGroup>
                                            {availableSections.map(section => {
                                                const isSelected = selectedSections.includes(
                                                    section.id,
                                                );
                                                return (
                                                    <CommandItem
                                                        key={section.id}
                                                        onSelect={() => {
                                                            if (isSelected) {
                                                                setSelectedSections(
                                                                    selectedSections.filter(
                                                                        id => id !== section.id,
                                                                    ),
                                                                );
                                                            } else {
                                                                setSelectedSections([
                                                                    ...selectedSections,
                                                                    section.id,
                                                                ]);
                                                            }
                                                        }}
                                                    >
                                                        <Check
                                                            className={cn(
                                                                "mr-2 h-4 w-4",
                                                                isSelected
                                                                    ? "opacity-100"
                                                                    : "opacity-0",
                                                            )}
                                                        />
                                                        {section.name}
                                                    </CommandItem>
                                                );
                                            })}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                        {selectedSections.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                                {selectedSections.map(sectionId => {
                                    const section = sections.find(s => s.id === sectionId);
                                    return (
                                        <Badge
                                            key={sectionId}
                                            variant="secondary"
                                            className="text-xs"
                                        >
                                            {section?.name || sectionId}
                                            <button
                                                className="ml-1 hover:text-red-500"
                                                onClick={e => {
                                                    e.stopPropagation();
                                                    setSelectedSections(
                                                        selectedSections.filter(
                                                            id => id !== sectionId,
                                                        ),
                                                    );
                                                }}
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        </Badge>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Strategic Objective Filter */}
                    <div>
                        <label className="text-sm font-medium mb-2 block">
                            Strategic Objective
                        </label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    className="w-full justify-between"
                                >
                                    {selectedObjectives.length > 0
                                        ? `${selectedObjectives.length} selected`
                                        : "All objectives"}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                <Command>
                                    <CommandInput placeholder="Search objectives..." />
                                    <CommandList>
                                        <CommandEmpty>No objective found.</CommandEmpty>
                                        <CommandGroup>
                                            {strategicObjectives.map(obj => {
                                                const isSelected = selectedObjectives.includes(
                                                    obj.id,
                                                );
                                                return (
                                                    <CommandItem
                                                        key={obj.id}
                                                        onSelect={() => {
                                                            if (isSelected) {
                                                                setSelectedObjectives(
                                                                    selectedObjectives.filter(
                                                                        id => id !== obj.id,
                                                                    ),
                                                                );
                                                            } else {
                                                                setSelectedObjectives([
                                                                    ...selectedObjectives,
                                                                    obj.id,
                                                                ]);
                                                            }
                                                        }}
                                                    >
                                                        <Check
                                                            className={cn(
                                                                "mr-2 h-4 w-4",
                                                                isSelected
                                                                    ? "opacity-100"
                                                                    : "opacity-0",
                                                            )}
                                                        />
                                                        {obj.title}
                                                    </CommandItem>
                                                );
                                            })}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                        {selectedObjectives.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                                {selectedObjectives.map(objId => {
                                    const obj = strategicObjectives.find(o => o.id === objId);
                                    return (
                                        <Badge key={objId} variant="secondary" className="text-xs">
                                            {obj?.title || objId}
                                            <button
                                                className="ml-1 hover:text-red-500"
                                                onClick={e => {
                                                    e.stopPropagation();
                                                    setSelectedObjectives(
                                                        selectedObjectives.filter(
                                                            id => id !== objId,
                                                        ),
                                                    );
                                                }}
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        </Badge>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* {strategicObjectives.length === 0 ? (
                renderNoObjectivesMessage()
            ) : */}

            {!currentPeriod ? (
                renderNoKPIsMessage()
            ) : filteredKPIs.length === 0 ? (
                hasActiveFilters ? (
                    <Card
                        className={`border-dashed ${theme === "dark" ? "bg-black/20 border-gray-700" : "bg-gray-50"}`}
                    >
                        <CardContent className="p-8 text-center">
                            <div className="flex justify-center mb-4">
                                <Filter
                                    className={`h-12 w-12 ${theme === "dark" ? "text-gray-500" : "text-gray-400"}`}
                                />
                            </div>
                            <h3
                                className={`text-lg font-semibold ${theme === "dark" ? "text-white" : "text-[#3f3d56]"}`}
                            >
                                No KPIs Match Filters
                            </h3>
                            <p
                                className={`mt-1 text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}
                            >
                                Try adjusting your filters or clear them to see more results.
                            </p>
                            <Button
                                variant="outline"
                                onClick={clearFilters}
                                className={`mt-4 hover:opacity-80 bg-transparent ${theme === "dark" ? "text-white" : "text-[#3f3d56]"} ${theme === "dark" ? "border-white" : "border-[#3f3d56]"}`}
                            >
                                Clear Filters
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    renderNoKPIsMessage()
                )
            ) : (
                <div className="grid gap-6">
                    {filteredKPIs.map(kpi => {
                        const linkedObjectives = strategicObjectives.filter(obj =>
                            kpi.linkedObjectiveId.includes(obj.id),
                        );
                        return (
                            <Card
                                key={kpi.id}
                                className={`shadow-md hover:shadow-lg transition-all duration-200 ${theme === "dark" ? "bg-black/20 border-gray-800/20" : "bg-white border-gray-200"}`}
                            >
                                <CardHeader className="pb-4">
                                    <div className="flex items-start justify-between">
                                        <div className="space-y-2">
                                            <CardTitle
                                                className={`text-xl ${theme === "dark" ? "text-white" : "text-[#3f3d56]"}`}
                                            >
                                                {kpi.title}
                                            </CardTitle>
                                            <CardDescription
                                                className={`text-base leading-relaxed ${theme === "dark" ? "text-white" : "text-[#3f3d56]"}`}
                                            >
                                                {kpi.description}
                                            </CardDescription>
                                        </div>
                                        {!hideActions && (
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleEditKPI(kpi)}
                                                    className={`hover:bg-black/5 ${theme === "dark" ? "text-white" : "text-[#3f3d56]"}`}
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <DeleteConfirm
                                                    onConfirm={() => handleDeleteKPI(kpi.id)}
                                                    itemName={`KPI (${kpi.title})`}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between flex-wrap gap-2">
                                            <div className="flex items-center gap-4 flex-wrap">
                                                <Badge
                                                    variant="outline"
                                                    style={{
                                                        borderColor: "#3f3d56",
                                                        color: "#ffe6a7",
                                                        backgroundColor: "#3f3d56",
                                                    }}
                                                >
                                                    {getDepartmentName(kpi.department)}
                                                </Badge>
                                                {kpi.section && (
                                                    <Badge
                                                        variant="outline"
                                                        className={
                                                            theme === "dark"
                                                                ? "border-gray-600 text-gray-300"
                                                                : "border-gray-300 text-gray-600"
                                                        }
                                                    >
                                                        {getSectionName(kpi.section)}
                                                    </Badge>
                                                )}
                                                <div
                                                    className={`text-sm ${theme === "dark" ? "text-white" : "text-[#3f3d56]"}`}
                                                >
                                                    Target:{" "}
                                                    <span
                                                        className={`font-medium ${theme === "dark" ? "text-white" : "text-[#3f3d56]"}`}
                                                    >
                                                        {kpi.target}
                                                    </span>
                                                </div>
                                                <Badge
                                                    variant="secondary"
                                                    style={{
                                                        backgroundColor: "#3f3d56",
                                                        color: "#ffe6a7",
                                                    }}
                                                >
                                                    {kpi.dataSource}
                                                </Badge>
                                            </div>
                                        </div>
                                        {linkedObjectives.length > 0 && (
                                            <div
                                                className="flex items-center gap-2 p-3 rounded-lg"
                                                style={{
                                                    backgroundColor: "rgba(63, 61, 86, 0.03)",
                                                    border: "1px solid rgba(63, 61, 86, 0.1)",
                                                }}
                                            >
                                                <Link
                                                    className={`h-4 w-4 ${theme === "dark" ? "text-white" : "text-[#3f3d56]"}`}
                                                />
                                                <span
                                                    className={`text-sm ${theme === "dark" ? "text-white" : "text-[#3f3d56]"}`}
                                                >
                                                    Linked to:{" "}
                                                    <span className="font-medium">
                                                        {linkedObjectives
                                                            .map(obj => obj.title)
                                                            .join(", ")}
                                                    </span>
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}
        </>
    );
};
