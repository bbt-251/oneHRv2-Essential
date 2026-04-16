"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CascaderDropdown, { Option as CascaderOption } from "@/components/custom-cascader";
import { useAuth } from "@/context/authContext";
import { useFirestore } from "@/context/firestore-context";
import { ArrowLeft, BookOpen, FileText, Filter, Headphones, Play, Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
    ExtendedTrainingMaterialModel,
    ExtendedTrainingPathModel,
    isAssigned,
} from "../employee-learning";
import TrainingCards from "./training-cards";
import { updateEmployee } from "@/lib/backend/api/employee-management/employee-management-service";
import { EmployeeModel } from "@/lib/models/employee";

export type AllTrainingDataModel =
    | (ExtendedTrainingMaterialModel & {
          type: "Training Material";
          starred: boolean;
      })
    | (ExtendedTrainingPathModel & { type: "Training Path"; starred: boolean });

export function AllTraining() {
    const { userData } = useAuth();
    const router = useRouter();
    const { trainingMaterials, trainingPaths, hrSettings } = useFirestore();
    const categories = hrSettings.tmCategories;
    const lengths = hrSettings.tmLengths;
    const complexity = hrSettings.tmComplexity;
    const [filteredTrainingData, setFilteredTrainingData] = useState<AllTrainingDataModel[]>([]);
    const [trainingData, setTrainingData] = useState<AllTrainingDataModel[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("all");
    const [categoryTreeOptions, setCategoryTreeOptions] = useState<CascaderOption[]>([]);
    const [formatFilter, setFormatFilter] = useState("all");
    const [lengthFilter, setLengthFilter] = useState("all");
    const [complexityFilter, setComplexityFilter] = useState("all");
    const [requirementFilter, setRequirementFilter] = useState("all");
    const [starredFilter, setStarredFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");
    const [typeFilter, setTypeFilter] = useState("all");
    const [activeTab, setActiveTab] = useState("all");

    const getFilteredData = useCallback(
        (trainingData: AllTrainingDataModel[]) => {
            let baseData = trainingData;

            if (activeTab === "my") {
                baseData = trainingData.filter(item =>
                    item.type == "Training Material"
                        ? userData?.trainingMaterialStatus?.find(tm => tm.status == "Completed")
                        : item.progress > 0 || item.starred,
                );
            }

            return baseData.filter(item => {
                const matchesSearch =
                    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    (item.type === "Training Material" ? item.outputValue : item.description)
                        .toLowerCase()
                        .includes(searchTerm.toLowerCase());

                const matchesCategory =
                    categoryFilter === "all" ||
                    // item.category is an array of category IDs; if cascader selects a leaf id, match directly
                    item.category.includes(categoryFilter);

                const matchesFormat =
                    formatFilter === "all" ||
                    (item as ExtendedTrainingMaterialModel).format === formatFilter;

                const matchesComplexity =
                    complexityFilter === "all" ||
                    (item as ExtendedTrainingMaterialModel)?.complexity === complexityFilter;

                const matchesRequirement =
                    requirementFilter === "all" ||
                    (item as ExtendedTrainingMaterialModel)?.requirementLevel === requirementFilter;

                const matchesLength =
                    lengthFilter === "all" ||
                    (item as ExtendedTrainingMaterialModel)?.length === lengthFilter;

                const matchesStarred =
                    starredFilter === "all" ||
                    (starredFilter === "starred" && item.starred) ||
                    (starredFilter === "unstarred" && !item.starred);

                let matchesStatus = false;
                if (item.type === "Training Material") {
                    const status = userData?.trainingMaterialStatus?.find(
                        tm => tm.trainingMaterialID == item.id,
                    )?.status;
                    matchesStatus =
                        statusFilter === "all" ||
                        (statusFilter === "completed" && status == "Completed") ||
                        (statusFilter === "in-progress" && status == "In progress") ||
                        (statusFilter === "not-started" && !status);
                } else {
                    matchesStatus =
                        statusFilter === "all" ||
                        (statusFilter === "completed" && item.progress === 100) ||
                        (statusFilter === "in-progress" &&
                            item.progress > 0 &&
                            item.progress < 100) ||
                        (statusFilter === "not-started" && item.progress === 0);
                }

                const matchesType =
                    typeFilter === "all" ||
                    (typeFilter === "material" && item.type === "Training Material") ||
                    (typeFilter === "path" && item.type === "Training Path");

                return (
                    matchesSearch &&
                    matchesCategory &&
                    matchesFormat &&
                    matchesComplexity &&
                    matchesRequirement &&
                    matchesLength &&
                    matchesStarred &&
                    matchesStatus &&
                    matchesType
                );
            });
        },
        [
            activeTab,
            searchTerm,
            categoryFilter,
            formatFilter,
            lengthFilter,
            complexityFilter,
            requirementFilter,
            starredFilter,
            statusFilter,
            typeFilter,
        ],
    );

    useEffect(() => {
        // build cascader options from category tree
        const toOptions = (nodes: any[]): CascaderOption[] =>
            nodes
                .filter(n => n.active === "Yes")
                .map(n => ({
                    value: n.id,
                    label: n.name,
                    children:
                        n.subcategory && n.subcategory.length
                            ? toOptions(n.subcategory)
                            : undefined,
                }));

        setCategoryTreeOptions(toOptions(categories || []));
    }, [categories]);

    useEffect(() => {
        // training materials
        const filteredTMs = trainingMaterials.filter(
            tm =>
                tm.approvalStatus == "Approved" &&
                isAssigned(tm, userData ?? ({} as EmployeeModel)),
        ); //here add assigned filter

        const materials: ExtendedTrainingMaterialModel[] = filteredTMs.map(tm => ({
            ...tm,
            progress:
                userData?.trainingMaterialsProgress?.find(p => p.trainingMaterial == tm.id)
                    ?.progress ?? 0,
        }));

        // training paths
        const filteredPaths = trainingPaths.filter(
            tp => tp.status == "Approved" && isAssigned(tp, userData ?? ({} as EmployeeModel)),
        ); //here add assigned filter

        const paths: ExtendedTrainingPathModel[] = [];
        filteredPaths.map(tp => {
            const completed = tp.trainingMaterials.filter(
                id =>
                    userData?.trainingMaterialStatus?.find(i => i.trainingMaterialID == id)
                        ?.status == "Completed",
            );

            paths.push({
                ...tp,
                progress:
                    tp.trainingMaterials.length > 0
                        ? (completed.length * 100) / tp.trainingMaterials.length
                        : 0,
                completedModules: completed.length,
            });
        });

        const trainingData = [
            ...materials.map(m => ({
                ...m,
                type: "Training Material" as const,
                starred: false,
            })),
            ...paths.map(p => ({
                ...p,
                type: "Training Path" as const,
                starred: false,
            })),
        ];

        setTrainingData(trainingData);
        setFilteredTrainingData(getFilteredData(trainingData));
    }, [trainingMaterials, trainingPaths, userData?.trainingMaterialsProgress, getFilteredData]);

    const clearAllFilters = () => {
        setSearchTerm("");
        setCategoryFilter("all");
        setFormatFilter("all");
        setLengthFilter("all");
        setComplexityFilter("all");
        setRequirementFilter("all");
        setStarredFilter("all");
        setStatusFilter("all");
        setTypeFilter("all");
    };

    const getComplexityIcon = (complexity: string) => {
        switch (complexity.toLowerCase()) {
            case "beginner":
                return <div className="w-2 h-2 bg-green-500 rounded-full" title="Beginner" />;
            case "intermediate":
                return <div className="w-2 h-2 bg-yellow-500 rounded-full" title="Intermediate" />;
            case "advanced":
                return <div className="w-2 h-2 bg-red-500 rounded-full" title="Advanced" />;
            default:
                return <div className="w-2 h-2 bg-gray-400 rounded-full" title="Unknown" />;
        }
    };

    const getQuizIcon = (hasQuiz: boolean) => {
        return hasQuiz ? (
            <div
                className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center"
                title="Has Quiz"
            >
                <span className="text-white text-xs font-bold">?</span>
            </div>
        ) : null;
    };

    const getMaterialTypeIcon = (format: string) => {
        switch (format.toLowerCase()) {
            case "video":
                return <Play className="h-4 w-4 text-red-500" />;
            case "document":
                return <FileText className="h-4 w-4 text-blue-500" />;
            case "interactive":
                return <Headphones className="h-4 w-4 text-green-500" />;
            default:
                return <BookOpen className="h-4 w-4 text-gray-500" />;
        }
    };

    const handleStartTraining = (item: any) => {
        const status = userData?.trainingMaterialStatus?.find(
            tm => tm.trainingMaterialID == item.id,
        )?.status;
        if (status != "In progress" && status != "Completed") {
            updateEmployee({
                id: userData?.id ?? "",
                trainingMaterialStatus: [
                    ...(userData?.trainingMaterialStatus?.filter(
                        t => t.trainingMaterialID != item.id,
                    ) ?? []),
                    { status: "In progress", trainingMaterialID: item.id },
                ],
            });
        }
        router.push(`/training-viewer?id=${item.id}`);
    };

    const handleStartTrainingPath = (item: any) => {
        router.push(`/training-path-viewer?id=${item.id}`);
    };

    return (
        <div className="space-y-6 p-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button
                        variant="outline"
                        onClick={() => router.push(`/learning`)}
                        className="flex items-center gap-2"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Learning
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold text-brand-800 dark:text-white">
                            All Training Resources
                        </h1>
                        <p className="text-brand-600 dark:text-brand-300">
                            Explore all available training materials and paths
                        </p>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                    <TabsTrigger value="all" className="text-sm font-medium">
                        All Training
                    </TabsTrigger>
                    <TabsTrigger value="my" className="text-sm font-medium">
                        My Training
                    </TabsTrigger>
                </TabsList>

                <TabsContent value={activeTab} className="space-y-6">
                    {/* Filter Bar */}
                    <div className="bg-gradient-to-r from-brand-50 to-brand-100 dark:from-brand-950 dark:from-black dark:to-black p-6 rounded-xl border border-brand-200 dark:border-brand-800 space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Filter className="h-5 w-5 text-brand-600" />
                                <h3 className="font-semibold text-brand-800 dark:text-white">
                                    Filter & Search
                                </h3>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={clearAllFilters}
                                className="text-brand-600 hover:text-brand-700 border-brand-300 hover:border-brand-400 bg-transparent"
                            >
                                <X className="h-4 w-4 mr-1" />
                                Clear All
                            </Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {/* Search */}
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-brand-500" />
                                <Input
                                    placeholder="Search training..."
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    className="pl-10 border-brand-300 focus:border-brand-500"
                                />
                            </div>

                            <Select value={typeFilter} onValueChange={setTypeFilter}>
                                <SelectTrigger className="border-brand-300 focus:border-brand-500">
                                    <SelectValue placeholder="Type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Types</SelectItem>
                                    <SelectItem value="material">Training Materials</SelectItem>
                                    <SelectItem value="path">Training Paths</SelectItem>
                                </SelectContent>
                            </Select>

                            {/* Category Filter (Cascader) */}
                            <div className="relative">
                                <CascaderDropdown
                                    options={categoryTreeOptions}
                                    value={categoryFilter === "all" ? "" : categoryFilter}
                                    setDynamicOptions={val => setCategoryFilter(val || "all")}
                                    placeholder="All Categories"
                                    // match the Select trigger style without changing overall layout
                                    buttonClassName="w-full h-10 justify-between text-left rounded-md border border-brand-300 focus:border-brand-500 bg-white text-brand-900 dark:bg-black dark:text-white"
                                    contentClassName="max-h-64 overflow-y-auto"
                                />
                            </div>

                            {/* Format Filter */}
                            <Select value={formatFilter} onValueChange={setFormatFilter}>
                                <SelectTrigger className="border-brand-300 focus:border-brand-500">
                                    <SelectValue placeholder="Format" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Formats</SelectItem>
                                    <SelectItem value="Video">Video</SelectItem>
                                    <SelectItem value="Audio">Audio</SelectItem>
                                    <SelectItem value="PDF">PDF</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            {/* Status Filter */}
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="border-brand-300 focus:border-brand-500">
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="completed">Completed</SelectItem>
                                    <SelectItem value="in-progress">In Progress</SelectItem>
                                    <SelectItem value="not-started">Not Started</SelectItem>
                                </SelectContent>
                            </Select>

                            {/* Complexity Filter */}
                            <Select value={complexityFilter} onValueChange={setComplexityFilter}>
                                <SelectTrigger className="border-brand-300 focus:border-brand-500">
                                    <SelectValue placeholder="Complexity" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Levels</SelectItem>
                                    {complexity
                                        .filter(c => c.active == "Yes")
                                        .map(c => (
                                            <SelectItem key={c.id} value={c.id}>
                                                {c.name}
                                            </SelectItem>
                                        ))}
                                </SelectContent>
                            </Select>

                            {/* Requirement Filter */}
                            <Select value={requirementFilter} onValueChange={setRequirementFilter}>
                                <SelectTrigger className="border-brand-300 focus:border-brand-500">
                                    <SelectValue placeholder="Requirement" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Requirements</SelectItem>
                                    <SelectItem value="Mandatory">Mandatory</SelectItem>
                                    <SelectItem value="Optional">Optional</SelectItem>
                                </SelectContent>
                            </Select>

                            {/* Length Filter */}
                            <Select value={lengthFilter} onValueChange={setLengthFilter}>
                                <SelectTrigger className="border-brand-300 focus:border-brand-500">
                                    <SelectValue placeholder="Length" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Length</SelectItem>
                                    {lengths
                                        .filter(c => c.active == "Yes")
                                        .map(c => (
                                            <SelectItem key={c.id} value={c.id}>
                                                {c.name}
                                            </SelectItem>
                                        ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex items-center justify-between text-sm text-brand-600 dark:text-brand-300">
                            <span>
                                Showing {filteredTrainingData.length} of{" "}
                                {activeTab === "all"
                                    ? trainingData.length
                                    : trainingData.filter(item => item.progress > 0 || item.starred)
                                        .length}{" "}
                                resources
                            </span>
                            <div className="flex items-center gap-4">
                                <span>
                                    {
                                        filteredTrainingData.filter(
                                            item => item.type === "Training Material",
                                        ).length
                                    }{" "}
                                    Materials
                                </span>
                                <span>
                                    {
                                        filteredTrainingData.filter(
                                            item => item.type === "Training Path",
                                        ).length
                                    }{" "}
                                    Paths
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Training Cards */}
                    <TrainingCards
                        userData={userData}
                        filteredTrainingData={filteredTrainingData}
                        complexity={complexity}
                        categories={categories}
                        lengths={lengths}
                        handleStartTraining={handleStartTraining}
                        handleStartTrainingPath={handleStartTrainingPath}
                        getMaterialTypeIcon={getMaterialTypeIcon}
                        getComplexityIcon={getComplexityIcon}
                        getQuizIcon={getQuizIcon}
                    />

                    {filteredTrainingData.length === 0 && (
                        <div className="text-center py-12">
                            <BookOpen className="h-12 w-12 text-brand-400 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-brand-800 dark:text-white mb-2">
                                No resources found
                            </h3>
                            <p className="text-brand-600 dark:text-brand-300">
                                {activeTab === "my"
                                    ? "You haven't started any training or marked any as favorites yet."
                                    : "Try adjusting your filters to see more results."}
                            </p>
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}
