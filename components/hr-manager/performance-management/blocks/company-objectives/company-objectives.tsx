"use client";

import { useTheme } from "@/components/theme-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/context/authContext";
import { useFirestore } from "@/context/firestore-context";
import { useToast } from "@/context/toastContext";
import {
    DepartmentKPIModel,
    hrSettingsService,
    StrategicObjectiveModel,
} from "@/lib/backend/firebase/hrSettingsService";
import { PERFORMANCE_MANAGEMENT_LOG_MESSAGES } from "@/lib/log-descriptions/performance-management";
import {
    Building2,
    Check,
    ChevronDown,
    Plus,
    Search,
    Target,
    TrendingUp,
    Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import AddDepartmentKPIDialog from "../../modals/company-objectives/add-department-kpi-dialog";
import EditDepartmentKPIDialog from "../../modals/company-objectives/edit-department-kpi-dialog";
import StrategicObjectiveModal from "../../modals/company-objectives/strategic-objective-modal";
import { KPIsTap } from "./kpis-tap";
import { ObjectivesTap } from "./objectives-tap";

interface ExtendedPeriodModel {
    id: string | null;
    periodName: string;
    year: number;
}

export default function CompanyObjectives({ hideAddButton = false }: { hideAddButton?: boolean }) {
    const { theme } = useTheme();
    const { hrSettings } = useFirestore();
    const periodicOptions = hrSettings?.periodicOptions || [];

    const { showToast } = useToast();
    const { userData } = useAuth();
    const [activeTab, setActiveTab] = useState("objectives");
    const [objectivesSearchTerm, setObjectivesSearchTerm] = useState("");
    const [kpisSearchTerm, setKpisSearchTerm] = useState("");

    const strategicObjectives = hrSettings.strategicObjectives;
    const departmentKPIs = hrSettings.departmentKPIs;
    const departments = hrSettings.departmentSettings;

    const [showObjectiveModal, setShowObjectiveModal] = useState<boolean>(false);
    const [showAddKPIModal, setShowAddKPIModal] = useState<boolean>(false);
    const [showEditKPIModal, setShowEditKPIModal] = useState<boolean>(false);
    const [editingObjective, setEditingObjective] = useState<StrategicObjectiveModel | null>(null);
    const [editingKPI, setEditingKPI] = useState<DepartmentKPIModel | null>(null);

    const [showPeriodicModal, setShowPeriodicModal] = useState<boolean>(false);
    const [currentPeriod, setCurrentPeriod] = useState<ExtendedPeriodModel | null>(null);
    const [periods, setPeriods] = useState<ExtendedPeriodModel[]>([]);

    useEffect(() => {
        const periodOptions = periodicOptions
            .sort((a, b) => (a.year < b.year ? 1 : -1))
            .map(p => ({
                id: p.id,
                periodName: p.periodName,
                year: p.year,
            }));
        setPeriods(periodOptions);
        setCurrentPeriod(periodOptions[0] || null);
    }, [periodicOptions]);

    const filteredStrategicObjectives = useMemo(() => {
        // Strategic objectives are no longer filtered by cycle
        // Apply search filter only
        if (objectivesSearchTerm) {
            const searchLower = objectivesSearchTerm.toLowerCase();
            return strategicObjectives.filter(
                obj =>
                    obj.title.toLowerCase().includes(searchLower) ||
                    obj.description.toLowerCase().includes(searchLower) ||
                    obj.owner.toLowerCase().includes(searchLower) ||
                    obj.perspective.toLowerCase().includes(searchLower),
            );
        }
        return strategicObjectives;
    }, [strategicObjectives, objectivesSearchTerm]);

    const filteredDepartmentKPIs = useMemo(() => {
        // If no current period is selected, show all KPIs
        // This prevents data loss during page reload when currentPeriod might be null temporarily
        if (!currentPeriod) {
            return departmentKPIs;
        }

        return departmentKPIs.filter(kpi => {
            const isCorrectPeriod = kpi.period === currentPeriod?.id;
            if (!isCorrectPeriod) {
                return false;
            }

            // Apply search filter
            if (kpisSearchTerm) {
                const searchLower = kpisSearchTerm.toLowerCase();
                const departmentName =
                    departments.find(dept => dept.id === kpi.department)?.name || "";
                return (
                    kpi.title.toLowerCase().includes(searchLower) ||
                    kpi.description.toLowerCase().includes(searchLower) ||
                    departmentName.toLowerCase().includes(searchLower) ||
                    kpi.target.toLowerCase().includes(searchLower) ||
                    kpi.dataSource.toLowerCase().includes(searchLower)
                );
            }
            return true;
        });
    }, [departmentKPIs, departments, kpisSearchTerm, currentPeriod]);

    const [objectiveForm, setObjectiveForm] = useState<
        Omit<StrategicObjectiveModel, "id" | "status">
    >({
        title: "",
        description: "",
        perspective: "Financial" as const,
        weight: 0,
        owner: "",
    });

    // Remove kpiForm since we now use separate dialogs with their own state

    const handleAddObjective = () => {
        setEditingObjective(null);
        setObjectiveForm({
            title: "",
            description: "",
            perspective: "Financial",
            weight: 0,
            owner: "",
        });
        setShowObjectiveModal(true);
    };
    const handleEditObjective = (objective: StrategicObjectiveModel) => {
        setEditingObjective(objective);
        setObjectiveForm({
            title: objective.title,
            description: objective.description,
            perspective: objective.perspective,
            weight: objective.weight,
            owner: objective.owner,
        });
        setShowObjectiveModal(true);
    };

    const handleSaveObjective = async () => {
        if (!objectiveForm.title || !objectiveForm.description) {
            showToast("Please fill in all required fields.", "error", "error");
            return;
        }

        try {
            if (editingObjective) {
                await hrSettingsService.update(
                    "strategicObjectives",
                    editingObjective.id,
                    objectiveForm,
                );
                showToast("Strategic objective updated successfully", "success", "success");
            } else {
                const newObjective = {
                    ...objectiveForm,
                    status: "Draft" as const,
                };
                await hrSettingsService.create("strategicObjectives", newObjective);
                showToast("Strategic objective created successfully", "success", "success");
            }

            setShowObjectiveModal(false);
        } catch (error) {
            console.error("Failed to save strategic objective:", error);
            const action = editingObjective ? "update" : "create";
            showToast(
                `Failed to ${action} strategic objective. Please try again.`,
                "error",
                "error",
            );
        }
    };
    const handleAddKPI = () => {
        if (!currentPeriod?.id) {
            showToast("Please select a performance period first.", "error", "error");
            return;
        }
        setShowAddKPIModal(true);
    };

    const handleEditKPI = (kpi: DepartmentKPIModel) => {
        setEditingKPI(kpi);
        setShowEditKPIModal(true);
    };
    const handleDeleteObjective = async (id: string) => {
        try {
            // Check if any department KPIs are linked to this strategic objective
            const linkedKPIs = departmentKPIs.filter(kpi => kpi.linkedObjectiveId.includes(id));

            let cleanupMessage = "";
            if (linkedKPIs.length > 0) {
                // Automatically clean up references in linked KPIs
                for (const kpi of linkedKPIs) {
                    const updatedLinkedIds = kpi.linkedObjectiveId.filter(kpiId => kpiId !== id);
                    await hrSettingsService.update("departmentKPIs", kpi.id, {
                        linkedObjectiveId: updatedLinkedIds,
                    });
                }

                const kpiTitles = linkedKPIs.map(kpi => kpi.title).join(", ");
                cleanupMessage = `Successfully removed references from ${linkedKPIs.length} department KPI(s): ${kpiTitles}. `;
            }

            // Delete the strategic objective
            await hrSettingsService.remove("strategicObjectives", id);

            if (cleanupMessage) {
                showToast(
                    `Strategic objective deleted successfully. ${cleanupMessage}`,
                    "success",
                    "success",
                );
            } else {
                showToast("Strategic objective deleted successfully", "success", "success");
            }
        } catch (error) {
            console.error("Failed to delete strategic objective:", error);
            showToast("Failed to delete strategic objective. Please try again.", "error", "error");
        }
    };

    const handleDeleteKPI = async (id: string) => {
        const kpiToDelete = departmentKPIs.find(kpi => kpi.id === id);
        const departmentName = kpiToDelete
            ? departments.find(d => d.id === kpiToDelete.department)?.name || kpiToDelete.department
            : "Unknown";

        await hrSettingsService.remove(
            "departmentKPIs",
            id,
            userData?.uid,
            kpiToDelete
                ? PERFORMANCE_MANAGEMENT_LOG_MESSAGES.DEPARTMENT_KPI_DELETED({
                    title: kpiToDelete.title,
                    departmentName,
                })
                : undefined,
        );
        showToast("Department KPI deleted successfully", "success", "success");
    };

    const handleSelectPeriodicOption = (option: ExtendedPeriodModel) => {
        setCurrentPeriod(option);
        setShowPeriodicModal(false);
    };

    return (
        <div className="min-h-screen ">
            <div
                className="border-b"
                style={{
                    borderColor: "rgba(63, 61, 86, 0.1)",
                    background:
                        "linear-gradient(to right, rgba(255, 230, 167, 0.05), rgba(63, 61, 86, 0.02))",
                }}
            >
                <div className="max-w-7xl mx-auto px-6 py-8">
                    <div className="flex items-center justify-between">
                        <div className="space-y-2">
                            <div className="flex items-center gap-3">
                                <div
                                    className="p-2 rounded-lg"
                                    style={{ backgroundColor: "#3f3d56", color: "#ffe6a7" }}
                                >
                                    <Building2 className="h-6 w-6" />
                                </div>
                                <h1
                                    className={`text-3xl font-bold tracking-tight ${theme === "dark" ? "text-white " : "text-[#3f3d56]"}`}
                                >
                                    Company Objectives & KPI Definition
                                </h1>
                            </div>
                            <p
                                className={`text-lg max-w-2xl  ${theme === "dark" ? "text-white " : "text-[#3f3d56]"}`}
                            >
                                Define strategic objectives and department KPIs to drive
                                organizational performance and alignment
                            </p>
                        </div>

                        <div className="flex items-center gap-4">
                            {activeTab === "kpis" && (
                                <div className="flex items-center gap-2">
                                    <Badge
                                        variant="secondary"
                                        onClick={() => setShowPeriodicModal(true)}
                                        className="cursor-pointer hover:opacity-90 transition-opacity"
                                        style={{
                                            backgroundColor: "#3f3d56",
                                            color: "#ffe6a7",
                                            border: "1px solid #3f3d56",
                                        }}
                                    >
                                        <TrendingUp className="h-3 w-3 mr-1" />
                                        {currentPeriod
                                            ? `${currentPeriod.periodName}`
                                            : "Select Period"}
                                        <ChevronDown className="h-4 w-4 ml-1" />
                                    </Badge>
                                </div>
                            )}
                            {!hideAddButton && (
                                <Button
                                    onClick={
                                        activeTab === "objectives"
                                            ? handleAddObjective
                                            : handleAddKPI
                                    }
                                    style={{ backgroundColor: "#3f3d56", color: "#ffe6a7" }}
                                    className="hover:opacity-90 shadow-lg"
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    {activeTab === "objectives" ? "Add Objective" : "Add KPI"}
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-8">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
                    <TabsList
                        className="grid w-full grid-cols-2 p-1 rounded-xl shadow-sm"
                        style={{ backgroundColor: "rgba(255, 230, 167, 0.15)" }}
                    >
                        <TabsTrigger
                            value="objectives"
                            className="transition-all duration-200 rounded-lg font-medium data-[state=active]:shadow-md text-white"
                            style={{
                                color: activeTab === "objectives" ? "#ffe6a7" : "#3f3d56",
                                backgroundColor:
                                    activeTab === "objectives" ? "#3f3d56" : "transparent",
                            }}
                        >
                            <Target className="h-4 w-4 mr-2" />
                            Strategic Objectives
                            <Badge
                                variant="secondary"
                                className="ml-2"
                                style={{
                                    backgroundColor: "#3f3d56",
                                    color: "#ffe6a7",
                                    border: "1px solid #3f3d56",
                                }}
                            >
                                {filteredStrategicObjectives.length}
                            </Badge>
                        </TabsTrigger>
                        <TabsTrigger
                            value="kpis"
                            className="transition-all duration-200 rounded-lg font-medium data-[state=active]:shadow-md text-white"
                            style={{
                                color: activeTab === "kpis" ? "#ffe6a7" : "#3f3d56",
                                backgroundColor: activeTab === "kpis" ? "#3f3d56" : "transparent",
                            }}
                        >
                            <Users className="h-4 w-4 mr-2" />
                            Department KPIs
                            <Badge
                                variant="secondary"
                                className="ml-2"
                                style={{
                                    backgroundColor: "#3f3d56",
                                    color: "#ffe6a7",
                                    border: "1px solid #3f3d56",
                                }}
                            >
                                {filteredDepartmentKPIs.length}
                            </Badge>
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="objectives" className="space-y-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="relative flex-1 max-w-md">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder="Search strategic objectives..."
                                    value={objectivesSearchTerm}
                                    onChange={e => setObjectivesSearchTerm(e.target.value)}
                                    className={`pl-10 ${theme === "dark" ? "bg-black border-gray-700" : "bg-white border-gray-200"}`}
                                />
                            </div>
                            <div
                                className={`text-sm ${theme === "dark" ? "text-white" : "text-[#3f3d56]"}`}
                            >
                                Total Weight:{" "}
                                {filteredStrategicObjectives.reduce(
                                    (sum, obj) => sum + obj.weight,
                                    0,
                                )}
                                %
                            </div>
                        </div>
                        <ObjectivesTap
                            strategicObjectives={filteredStrategicObjectives}
                            handleAddObjective={handleAddObjective}
                            handleEditObjective={handleEditObjective}
                            handleDeleteObjective={handleDeleteObjective}
                            hideAddButton={hideAddButton}
                            hideActions={hideAddButton}
                        />
                    </TabsContent>

                    <TabsContent value="kpis" className="space-y-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="relative flex-1 max-w-md">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder="Search department KPIs..."
                                    value={kpisSearchTerm}
                                    onChange={e => setKpisSearchTerm(e.target.value)}
                                    className={`pl-10 ${theme === "dark" ? "bg-black border-gray-700" : "bg-white border-gray-200"}`}
                                />
                            </div>
                        </div>
                        <KPIsTap
                            departmentKPIs={filteredDepartmentKPIs}
                            strategicObjectives={filteredStrategicObjectives}
                            handleAddKPI={handleAddKPI}
                            handleEditKPI={handleEditKPI}
                            handleDeleteKPI={handleDeleteKPI}
                            hideAddButton={hideAddButton}
                            hideActions={hideAddButton}
                            currentPeriod={
                                currentPeriod
                                    ? {
                                        periodID: currentPeriod.id,
                                        periodName: currentPeriod.periodName,
                                    }
                                    : null
                            }
                        />
                    </TabsContent>
                </Tabs>

                {/* Strategic Objective Modal */}
                <StrategicObjectiveModal
                    showObjectiveModal={showObjectiveModal}
                    setShowObjectiveModal={setShowObjectiveModal}
                    editingObjective={editingObjective}
                    objectiveForm={objectiveForm}
                    setObjectiveForm={setObjectiveForm}
                    handleSaveObjective={handleSaveObjective}
                />

                {/* Add Department KPI Dialog */}
                <AddDepartmentKPIDialog
                    open={showAddKPIModal}
                    setOpen={setShowAddKPIModal}
                    period={currentPeriod?.id || ""}
                    departments={departments}
                />

                {/* Edit Department KPI Dialog */}
                <EditDepartmentKPIDialog
                    open={showEditKPIModal}
                    setOpen={setShowEditKPIModal}
                    kpi={editingKPI}
                    departments={departments}
                />
                {/* Periodic Option Modal */}
                <Dialog open={showPeriodicModal} onOpenChange={setShowPeriodicModal}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Choose Periodic Option</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            {periods.map(option => (
                                <div
                                    key={option.id}
                                    className="flex items-center justify-between p-3 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                                    onClick={() => handleSelectPeriodicOption(option)}
                                >
                                    <span className="font-medium">{`${option.periodName}`}</span>
                                    {/* Compare IDs to show the checkmark */}
                                    {currentPeriod?.id === option.id && (
                                        <Check className="h-5 w-5 text-green-500" />
                                    )}
                                </div>
                            ))}
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}
