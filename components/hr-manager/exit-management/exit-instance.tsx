"use client";

import {
    Dialog,
    DialogContent as DialogContentComponent,
    DialogHeader as DialogHeaderComponent,
    DialogFooter as DialogFooterComponent,
    DialogTitle as DialogTitleComponent,
    DialogDescription as DialogDescriptionComponent,
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableHeader,
    TableBody,
    TableRow,
    TableHead,
    TableCell,
} from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";

import {
    Plus,
    Search,
    Eye,
    Edit,
    Trash2,
    UserX,
    Users,
    CheckCircle,
    XCircle,
    ClipboardList,
    Copy,
    Filter,
    X,
    ChevronsUpDown,
    Check,
    MoreVertical,
    Columns,
} from "lucide-react";
import { ExitInstanceModel } from "@/lib/models/exit-instance";
import { useAuth } from "@/context/authContext";
import { useFirestore } from "@/context/firestore-context";
import { useToast } from "@/context/toastContext";
import {
    createExitInstance,
    updateExitInstance,
    deleteExitInstance,
} from "@/lib/backend/api/exit-instance/exit-instance-service";
import { EXIT_MANAGEMENT_LOG_MESSAGES } from "@/lib/log-descriptions/exit-management";
import { updateExitChecklist } from "@/lib/backend/api/exit-instance/exit-checklist-service";
import { getPositionName } from "@/lib/util/performance/employee-performance-utils";
import { useHrSettings } from "@/hooks/use-hr-settings";
import getFullName from "@/lib/util/getEmployeeFullName";
import { useConfirm } from "@/hooks/use-confirm-dialog";
import { ExitInstanceFormModal } from "./modals/instance-form";
import { ExitInstanceViewModal } from "./modals/instance-view";
import { ChecklistStatus } from "@/lib/models/exit-checklist";
import { EmployeeModel } from "@/lib/models/employee";

export interface ExtendedExitInstance extends ExitInstanceModel {
    exitEmployeePosition: string;
    exitEmployeeName: string;
    checklistName: string;
    checklistStatus: ChecklistStatus | "N/A";
}

export function ExitInstanceManagement() {
    const {
        exitInstances: firestoreExitInstances,
        employees,
        exitChecklists,
        exitInterviewQuestions,
    } = useFirestore();
    const { hrSettings } = useHrSettings();
    const { showToast } = useToast();
    const { confirm, ConfirmDialog } = useConfirm();
    const { userData } = useAuth();

    // Transform firestore data to display format
    const exitInstances: ExtendedExitInstance[] = firestoreExitInstances.map(instance => {
        const employee = employees.find(emp => emp.uid === instance.exitEmployeeUID);
        const positionName = employee?.employmentPosition
            ? getPositionName(employee.employmentPosition, hrSettings)
            : "N/A";
        const fullName = employee ? getFullName(employee) : "Unknown Employee";
        const checklist = exitChecklists.find(ch => ch.id == instance.exitChecklist.checklistId);
        return {
            ...instance,
            checklistName: checklist?.checklistName ?? "N/A",
            checklistStatus: checklist?.checklistStatus ?? "N/A",
            exitEmployeeName: fullName,
            exitEmployeePosition: positionName,
        };
    });

    const [visibleColumns, setVisibleColumns] = useState({
        timestamp: true,
        exitID: true,
        exitEmployee: true,
        exitEmployeePosition: true,
        exitType: true,
        exitChecklistStatus: true,
        exitChecklist: true,
        exitInterview: true,
        exitDocument: true,
        eligibleToRehire: true,
        exitLastDate: true,
        exitEffectiveDate: true,
        effectiveDateAccepted: true,
    });

    const [searchTerm, setSearchTerm] = useState("");

    const [showFilterModal, setShowFilterModal] = useState(false);
    const [filterPosition, setFilterPosition] = useState<string[]>([]);
    const [filterExitType, setFilterExitType] = useState<string[]>([]);
    const [filterExitReason, setFilterExitReason] = useState<string[]>([]);
    const [filterRehireEligibility, setFilterRehireEligibility] = useState<string[]>([]);
    const [filterDateFrom, setFilterDateFrom] = useState<string>("");
    const [filterDateTo, setFilterDateTo] = useState<string>("");

    const [positionOpen, setPositionOpen] = useState(false);
    const [exitTypeOpen, setExitTypeOpen] = useState(false);
    const [exitReasonOpen, setExitReasonOpen] = useState(false);
    const [rehireOpen, setRehireOpen] = useState(false);

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editingInstance, setEditingInstance] = useState<ExtendedExitInstance | null>(null);
    const [viewingInstance, setViewingInstance] = useState<ExtendedExitInstance | null>(null);

    const [activeCardFilter, setActiveCardFilter] = useState<string | null>(null);

    const toggleColumn = (column: keyof typeof visibleColumns) => {
        setVisibleColumns(prev => ({ ...prev, [column]: !prev[column] }));
    };

    const filteredInstances = exitInstances.filter(instance => {
        const matchesSearch =
            instance.exitID.toLowerCase().includes(searchTerm.toLowerCase()) ||
            instance.exitEmployeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            instance.exitType.toLowerCase().includes(searchTerm.toLowerCase()) ||
            instance.exitReason.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesPosition =
            filterPosition.length === 0 ||
            filterPosition.includes(instance.exitEmployeePosition || "");
        const matchesExitType =
            filterExitType.length === 0 || filterExitType.includes(instance.exitType);
        const matchesExitReason =
            filterExitReason.length === 0 || filterExitReason.includes(instance.exitReason);
        const matchesRehireEligibility =
            filterRehireEligibility.length === 0 ||
            (filterRehireEligibility.includes("yes") && instance.eligibleToRehire) ||
            (filterRehireEligibility.includes("no") && !instance.eligibleToRehire);

        const instanceDate = new Date(instance.exitLastDate);
        const matchesDateFrom = !filterDateFrom || instanceDate >= new Date(filterDateFrom);
        const matchesDateTo = !filterDateTo || instanceDate <= new Date(filterDateTo);

        let matchesCardFilter = true;
        if (activeCardFilter === "voluntary") {
            matchesCardFilter = instance.exitType === "Voluntary";
        } else if (activeCardFilter === "involuntary") {
            matchesCardFilter = instance.exitType === "Involuntary";
        } else if (activeCardFilter === "rehire") {
            matchesCardFilter = instance.eligibleToRehire === true;
        }

        return (
            matchesSearch &&
            matchesPosition &&
            matchesExitType &&
            matchesExitReason &&
            matchesRehireEligibility &&
            matchesDateFrom &&
            matchesDateTo &&
            matchesCardFilter
        );
    });

    const clearAllFilters = () => {
        setFilterPosition([]);
        setFilterExitType([]);
        setFilterExitReason([]);
        setFilterRehireEligibility([]);
        setFilterDateFrom("");
        setFilterDateTo("");
        setSearchTerm("");
        setActiveCardFilter(null);
    };

    const applyFilters = () => {
        setShowFilterModal(false);
    };

    const handleCreate = () => {
        setIsCreateModalOpen(true);
    };

    const handleEdit = (instance: ExtendedExitInstance) => {
        setEditingInstance(instance);
    };

    const handleView = (instance: ExtendedExitInstance) => {
        setViewingInstance(instance);
    };

    const handleDelete = (instance: any) => {
        confirm(
            `Are you sure you want to delete the exit instance for ${instance.fullName}? This action cannot be undone.`,
            async () => {
                try {
                    const success = await deleteExitInstance(
                        instance.id,
                        userData?.uid ?? "",
                        instance.id,
                        getFullName(
                            employees.find(e => e.uid == instance.exitEmployeeUID) ??
                                ({} as EmployeeModel),
                        ),
                    );
                    if (success) {
                        showToast("Exit instance deleted successfully", "Success", "success");
                    } else {
                        showToast("Failed to delete exit instance", "Error", "error");
                    }
                } catch (error) {
                    showToast("An unexpected error occurred", "Error", "error");
                }
            },
        );
    };

    const handleSave = async (instance: Omit<ExitInstanceModel, "id">) => {
        try {
            if (editingInstance) {
                // Update existing instance
                const success = await updateExitInstance(
                    {
                        ...instance,
                        id: editingInstance.id,
                    },
                    EXIT_MANAGEMENT_LOG_MESSAGES.EXIT_INSTANCE_UPDATED(
                        instance.exitID,
                        getFullName(
                            employees.find(e => e.uid == instance.exitEmployeeUID) ??
                                ({} as EmployeeModel),
                        ),
                    ),
                    userData?.uid ?? "",
                );
                if (success) {
                    showToast("Exit instance updated successfully", "Success", "success");
                    setIsCreateModalOpen(false);
                    setEditingInstance(null);
                } else {
                    showToast("Failed to update exit instance", "Error", "error");
                }
            } else {
                // Create new instance
                const success = await createExitInstance(
                    instance,
                    EXIT_MANAGEMENT_LOG_MESSAGES.EXIT_INSTANCE_CREATED(
                        instance.exitID,
                        getFullName(
                            employees.find(e => e.uid == instance.exitEmployeeUID) ??
                                ({} as EmployeeModel),
                        ),
                    ),
                    userData?.uid ?? "",
                );
                if (success) {
                    showToast("Exit instance created successfully", "Success", "success");
                    setIsCreateModalOpen(false);
                    setEditingInstance(null);
                } else {
                    showToast("Failed to create exit instance", "Error", "error");
                }
            }
        } catch (error) {
            showToast("An unexpected error occurred", "Error", "error");
        }
    };

    const handleStartChecklist = async (instance: ExitInstanceModel) => {
        try {
            // Update the checklist status to 'ongoing'
            const success = await updateExitChecklist(
                {
                    id: instance.exitChecklist.checklistId,
                    checklistStatus: "ongoing",
                },
                userData?.uid ?? "",
                EXIT_MANAGEMENT_LOG_MESSAGES.EXIT_CHECKLIST_UPDATED(instance.exitID),
            );

            if (success) {
                showToast("Checklist started successfully", "Success", "success");
            } else {
                showToast("Failed to start checklist", "Error", "error");
            }
        } catch (error) {
            showToast("An unexpected error occurred", "Error", "error");
        }
    };

    const handleCopyInterviewLink = (instance: ExitInstanceModel) => {
        const interviewLink = `https://hrms.example.com/exit-interview/${instance.exitID}`;
        navigator.clipboard.writeText(interviewLink);
        console.log("[v0] Copied interview link:", interviewLink);
        alert("Interview link copied to clipboard!");
    };

    const totalInstances = exitInstances.length;
    const voluntaryExits = exitInstances.filter(i => i.exitType === "Voluntary").length;
    const involuntaryExits = exitInstances.filter(i => i.exitType === "Involuntary").length;
    const eligibleForRehire = exitInstances.filter(i => i.eligibleToRehire).length;

    const hasActiveFilters =
        filterPosition.length > 0 ||
        filterExitType.length > 0 ||
        filterExitReason.length > 0 ||
        filterRehireEligibility.length > 0 ||
        filterDateFrom ||
        filterDateTo ||
        searchTerm ||
        activeCardFilter !== null;

    const toggleSelection = (
        value: string,
        currentValues: string[],
        setter: (values: string[]) => void,
    ) => {
        if (currentValues.includes(value)) {
            setter(currentValues.filter(v => v !== value));
        } else {
            setter([...currentValues, value]);
        }
    };

    const positions = hrSettings.positions?.map(p => p.name) || [];
    const exitTypes = ["Voluntary", "Involuntary"];
    const exitReasons = [
        "Career Growth",
        "Relocation",
        "Better Compensation",
        "Performance Issues",
        "Personal Reasons",
        "Retirement",
    ];
    const rehireOptions = [
        { value: "yes", label: "Eligible" },
        { value: "no", label: "Not Eligible" },
    ];

    const formatTimestamp = (timestamp: string) => {
        return new Date(timestamp).toLocaleString();
    };

    const getChecklistStatusBadge = (status: ChecklistStatus) => {
        const statusConfig = {
            draft: { className: "bg-gray-100 text-gray-800 border-gray-200", label: "Draft" },
            ongoing: { className: "bg-blue-100 text-blue-800 border-blue-200", label: "Ongoing" },
            done: { className: "bg-green-100 text-green-800 border-green-200", label: "Done" },
        };
        const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
        return <Badge className={config.className}>{config.label}</Badge>;
    };

    const handleCardClick = (filterType: string | null) => {
        if (activeCardFilter === filterType) {
            setActiveCardFilter(null);
        } else {
            setActiveCardFilter(filterType);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-brand-800 dark:text-foreground">
                        Exit Instance Management
                    </h1>
                    <p className="text-brand-600 mt-2 dark:text-muted-foreground">
                        Manage employee exit instances and track exit processes
                    </p>
                </div>
                <Button
                    onClick={handleCreate}
                    className="bg-brand-600 hover:bg-brand-700 text-white"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Exit Instance
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card
                    className={cn(
                        "border-brand-200 bg-gradient-to-br from-brand-50 to-brand-100 dark:from-brand-900/20 dark:to-brand-800/20 cursor-pointer transition-all hover:shadow-lg hover:scale-105",
                        activeCardFilter === null && "ring-2 ring-brand-500",
                    )}
                    onClick={() => handleCardClick(null)}
                >
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-brand-600 dark:text-muted-foreground">
                                    Total Exits
                                </p>
                                <p className="text-2xl font-bold text-brand-800 dark:text-foreground">
                                    {totalInstances}
                                </p>
                            </div>
                            <div className="p-3 bg-brand-200 rounded-lg dark:bg-brand-800">
                                <UserX className="h-6 w-6 text-brand-700 dark:text-brand-300" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card
                    className={cn(
                        "border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 cursor-pointer transition-all hover:shadow-lg hover:scale-105",
                        activeCardFilter === "voluntary" && "ring-2 ring-blue-500",
                    )}
                    onClick={() => handleCardClick("voluntary")}
                >
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-blue-600 dark:text-muted-foreground">
                                    Voluntary
                                </p>
                                <p className="text-2xl font-bold text-blue-800 dark:text-foreground">
                                    {voluntaryExits}
                                </p>
                            </div>
                            <div className="p-3 bg-blue-200 rounded-lg dark:bg-blue-800">
                                <Users className="h-6 w-6 text-blue-700 dark:text-blue-300" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card
                    className={cn(
                        "border-red-200 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 cursor-pointer transition-all hover:shadow-lg hover:scale-105",
                        activeCardFilter === "involuntary" && "ring-2 ring-red-500",
                    )}
                    onClick={() => handleCardClick("involuntary")}
                >
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-red-600 dark:text-muted-foreground">
                                    Involuntary
                                </p>
                                <p className="text-2xl font-bold text-red-800 dark:text-foreground">
                                    {involuntaryExits}
                                </p>
                            </div>
                            <div className="p-3 bg-red-200 rounded-lg dark:bg-red-800">
                                <XCircle className="h-6 w-6 text-red-700 dark:text-red-300" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card
                    className={cn(
                        "border-green-200 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 cursor-pointer transition-all hover:shadow-lg hover:scale-105",
                        activeCardFilter === "rehire" && "ring-2 ring-green-500",
                    )}
                    onClick={() => handleCardClick("rehire")}
                >
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-green-600 dark:text-muted-foreground">
                                    Eligible to Rehire
                                </p>
                                <p className="text-2xl font-bold text-green-800 dark:text-foreground">
                                    {eligibleForRehire}
                                </p>
                            </div>
                            <div className="p-3 bg-green-200 rounded-lg dark:bg-green-800">
                                <CheckCircle className="h-6 w-6 text-green-700 dark:text-green-300" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Search and Filter Bar */}
            <div className="space-y-4">
                <div className="flex items-center gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Search by Exit ID, Full Name, Type, or Reason..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="pl-10 border-gray-400 dark:border-gray-500"
                        />
                    </div>
                    <Button
                        variant="outline"
                        onClick={() => setShowFilterModal(true)}
                        className="border-gray-400 dark:border-gray-500"
                    >
                        <Filter className="h-4 w-4 mr-2" />
                        Filters
                    </Button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="outline"
                                className="border-gray-400 dark:border-gray-500 bg-transparent"
                            >
                                <Columns className="h-4 w-4 mr-2" />
                                Columns
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 bg-white dark:bg-gray-900">
                            <DropdownMenuCheckboxItem
                                checked={visibleColumns.timestamp}
                                onCheckedChange={() => toggleColumn("timestamp")}
                                onSelect={e => e.preventDefault()}
                            >
                                Time Stamp
                            </DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem
                                checked={visibleColumns.exitID}
                                onCheckedChange={() => toggleColumn("exitID")}
                                onSelect={e => e.preventDefault()}
                            >
                                Exit ID
                            </DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem
                                checked={visibleColumns.exitEmployee}
                                onCheckedChange={() => toggleColumn("exitEmployee")}
                                onSelect={e => e.preventDefault()}
                            >
                                Exit Employee
                            </DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem
                                checked={visibleColumns.exitEmployeePosition}
                                onCheckedChange={() => toggleColumn("exitEmployeePosition")}
                                onSelect={e => e.preventDefault()}
                            >
                                Exit Employee Position
                            </DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem
                                checked={visibleColumns.exitType}
                                onCheckedChange={() => toggleColumn("exitType")}
                                onSelect={e => e.preventDefault()}
                            >
                                Exit Type
                            </DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem
                                checked={visibleColumns.exitChecklistStatus}
                                onCheckedChange={() => toggleColumn("exitChecklistStatus")}
                                onSelect={e => e.preventDefault()}
                            >
                                Exit Checklist Status
                            </DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem
                                checked={visibleColumns.exitChecklist}
                                onCheckedChange={() => toggleColumn("exitChecklist")}
                                onSelect={e => e.preventDefault()}
                            >
                                Exit Checklist
                            </DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem
                                checked={visibleColumns.exitInterview}
                                onCheckedChange={() => toggleColumn("exitInterview")}
                                onSelect={e => e.preventDefault()}
                            >
                                Exit Interview
                            </DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem
                                checked={visibleColumns.exitDocument}
                                onCheckedChange={() => toggleColumn("exitDocument")}
                                onSelect={e => e.preventDefault()}
                            >
                                Exit Document
                            </DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem
                                checked={visibleColumns.eligibleToRehire}
                                onCheckedChange={() => toggleColumn("eligibleToRehire")}
                                onSelect={e => e.preventDefault()}
                            >
                                Eligible To Rehire
                            </DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem
                                checked={visibleColumns.exitLastDate}
                                onCheckedChange={() => toggleColumn("exitLastDate")}
                                onSelect={e => e.preventDefault()}
                            >
                                Exit Last Date
                            </DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem
                                checked={visibleColumns.exitEffectiveDate}
                                onCheckedChange={() => toggleColumn("exitEffectiveDate")}
                                onSelect={e => e.preventDefault()}
                            >
                                Exit Effective Date
                            </DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem
                                checked={visibleColumns.effectiveDateAccepted}
                                onCheckedChange={() => toggleColumn("effectiveDateAccepted")}
                                onSelect={e => e.preventDefault()}
                            >
                                Effective Date Accepted
                            </DropdownMenuCheckboxItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    {hasActiveFilters && (
                        <Button
                            variant="ghost"
                            onClick={clearAllFilters}
                            className="text-red-600 hover:text-red-700"
                        >
                            <X className="h-4 w-4 mr-2" />
                            Clear All
                        </Button>
                    )}
                </div>
            </div>

            {/* Table */}
            <Card className="border-gray-200/60 dark:border-gray-800/60">
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    {visibleColumns.timestamp && <TableHead>Time Stamp</TableHead>}
                                    {visibleColumns.exitID && <TableHead>Exit ID</TableHead>}
                                    {visibleColumns.exitEmployee && (
                                        <TableHead>Exit Employee</TableHead>
                                    )}
                                    {visibleColumns.exitEmployeePosition && (
                                        <TableHead>Exit Employee Position</TableHead>
                                    )}
                                    {visibleColumns.exitType && <TableHead>Exit Type</TableHead>}
                                    {visibleColumns.exitChecklistStatus && (
                                        <TableHead>Exit Checklist Status</TableHead>
                                    )}
                                    {visibleColumns.exitChecklist && (
                                        <TableHead>Exit Checklist</TableHead>
                                    )}
                                    {visibleColumns.exitInterview && (
                                        <TableHead>Exit Interview</TableHead>
                                    )}
                                    {visibleColumns.exitDocument && (
                                        <TableHead>Exit Document</TableHead>
                                    )}
                                    {visibleColumns.eligibleToRehire && (
                                        <TableHead>Eligible To Rehire</TableHead>
                                    )}
                                    {visibleColumns.exitLastDate && (
                                        <TableHead>Exit Last Date</TableHead>
                                    )}
                                    {visibleColumns.exitEffectiveDate && (
                                        <TableHead>Exit Effective Date</TableHead>
                                    )}
                                    {visibleColumns.effectiveDateAccepted && (
                                        <TableHead>Effective Date Accepted</TableHead>
                                    )}
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredInstances.map(instance => (
                                    <TableRow key={instance.id}>
                                        {visibleColumns.timestamp && (
                                            <TableCell>
                                                {formatTimestamp(instance.timestamp)}
                                            </TableCell>
                                        )}
                                        {visibleColumns.exitID && (
                                            <TableCell className="font-medium">
                                                {instance.exitID}
                                            </TableCell>
                                        )}
                                        {visibleColumns.exitEmployee && (
                                            <TableCell className="font-medium">
                                                {instance.exitEmployeeName}
                                            </TableCell>
                                        )}
                                        {visibleColumns.exitEmployeePosition && (
                                            <TableCell>
                                                {instance.exitEmployeePosition || "N/A"}
                                            </TableCell>
                                        )}
                                        {visibleColumns.exitType && (
                                            <TableCell>
                                                <Badge
                                                    className={
                                                        instance.exitType === "Voluntary"
                                                            ? "bg-blue-100 text-blue-800 border-blue-200"
                                                            : "bg-red-100 text-red-800 border-red-200"
                                                    }
                                                >
                                                    {instance.exitType}
                                                </Badge>
                                            </TableCell>
                                        )}
                                        {visibleColumns.exitChecklistStatus && (
                                            <TableCell>
                                                {instance.checklistStatus == "N/A"
                                                    ? instance.checklistStatus
                                                    : getChecklistStatusBadge(
                                                        instance.checklistStatus,
                                                    )}
                                            </TableCell>
                                        )}
                                        {visibleColumns.exitChecklist && (
                                            <TableCell>{instance.checklistName ?? "N/A"}</TableCell>
                                        )}
                                        {visibleColumns.exitInterview && (
                                            <TableCell>
                                                {exitInterviewQuestions.find(
                                                    e => e.id == instance.exitInterview,
                                                )?.name || "N/A"}
                                            </TableCell>
                                        )}
                                        {visibleColumns.exitDocument && (
                                            <TableCell>{instance.exitDocument || "N/A"}</TableCell>
                                        )}
                                        {visibleColumns.eligibleToRehire && (
                                            <TableCell>
                                                {instance.eligibleToRehire ? (
                                                    <Badge className="bg-green-100 text-green-800 border-green-200">
                                                        Yes
                                                    </Badge>
                                                ) : (
                                                    <Badge className="bg-red-100 text-red-800 border-red-200">
                                                        No
                                                    </Badge>
                                                )}
                                            </TableCell>
                                        )}
                                        {visibleColumns.exitLastDate && (
                                            <TableCell>
                                                {new Date(
                                                    instance.exitLastDate,
                                                ).toLocaleDateString()}
                                            </TableCell>
                                        )}
                                        {visibleColumns.exitEffectiveDate && (
                                            <TableCell>
                                                {new Date(
                                                    instance.exitEffectiveDate,
                                                ).toLocaleDateString()}
                                            </TableCell>
                                        )}
                                        {visibleColumns.effectiveDateAccepted && (
                                            <TableCell>
                                                {instance.effectiveDateAccepted ? (
                                                    <Badge className="bg-green-100 text-green-800 border-green-200">
                                                        Accepted
                                                    </Badge>
                                                ) : (
                                                    <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                                                        Pending
                                                    </Badge>
                                                )}
                                            </TableCell>
                                        )}
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="sm">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent
                                                    align="end"
                                                    className="w-48 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700"
                                                >
                                                    <DropdownMenuItem
                                                        onClick={() => handleView(instance)}
                                                        className="focus:outline-none hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
                                                    >
                                                        <Eye className="h-4 w-4 mr-2" />
                                                        View Details
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => handleEdit(instance)}
                                                        className="focus:outline-none hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
                                                    >
                                                        <Edit className="h-4 w-4 mr-2" />
                                                        Edit
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem
                                                        onClick={() =>
                                                            handleStartChecklist(instance)
                                                        }
                                                        className="focus:outline-none hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
                                                    >
                                                        <ClipboardList className="h-4 w-4 mr-2" />
                                                        Start Checklist
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() =>
                                                            handleCopyInterviewLink(instance)
                                                        }
                                                        className="focus:outline-none hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
                                                    >
                                                        <Copy className="h-4 w-4 mr-2" />
                                                        Copy Interview Link
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem
                                                        onClick={() => handleDelete(instance)}
                                                        className="text-red-600 focus:outline-none hover:bg-red-50 dark:hover:bg-red-900/20 cursor-pointer"
                                                    >
                                                        <Trash2 className="h-4 w-4 mr-2" />
                                                        Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* Filter Modal */}
            <Dialog open={showFilterModal} onOpenChange={setShowFilterModal}>
                <DialogContentComponent className="max-w-2xl bg-white dark:bg-gray-900 z-[200]">
                    <DialogHeaderComponent>
                        <DialogTitleComponent className="text-2xl font-semibold text-brand-800 dark:text-foreground">
                            Filter Exit Instances
                        </DialogTitleComponent>
                        <DialogDescriptionComponent className="text-gray-600 dark:text-muted-foreground">
                            Apply filters to narrow down your search results
                        </DialogDescriptionComponent>
                    </DialogHeaderComponent>

                    <div className="space-y-4 py-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Position Filter */}
                            <div>
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                                    Position
                                </label>
                                <Popover open={positionOpen} onOpenChange={setPositionOpen}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            aria-expanded={positionOpen}
                                            className="w-full justify-between border-gray-400 dark:border-gray-500 bg-transparent"
                                        >
                                            {filterPosition.length > 0
                                                ? `${filterPosition.length} selected`
                                                : "Select positions..."}
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent
                                        className="p-0 bg-white dark:bg-gray-900 z-[300]"
                                        align="start"
                                        style={{ width: "var(--radix-popover-trigger-width)" }}
                                    >
                                        <Command>
                                            <CommandInput placeholder="Search positions..." />
                                            <CommandList>
                                                <CommandEmpty>No position found.</CommandEmpty>
                                                <CommandGroup>
                                                    {positions.map(position => (
                                                        <CommandItem
                                                            key={position}
                                                            onSelect={() => {
                                                                toggleSelection(
                                                                    position,
                                                                    filterPosition,
                                                                    setFilterPosition,
                                                                );
                                                            }}
                                                            className="hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
                                                        >
                                                            <Check
                                                                className={cn(
                                                                    "mr-2 h-4 w-4",
                                                                    filterPosition.includes(
                                                                        position,
                                                                    )
                                                                        ? "opacity-100"
                                                                        : "opacity-0",
                                                                )}
                                                            />
                                                            {position}
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                            </div>

                            {/* Exit Type Filter */}
                            <div>
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                                    Exit Type
                                </label>
                                <Popover open={exitTypeOpen} onOpenChange={setExitTypeOpen}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            aria-expanded={exitTypeOpen}
                                            className="w-full justify-between border-gray-400 dark:border-gray-500 bg-transparent"
                                        >
                                            {filterExitType.length > 0
                                                ? `${filterExitType.length} selected`
                                                : "Select exit types..."}
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent
                                        className="p-0 bg-white dark:bg-gray-900 z-[300]"
                                        align="start"
                                        style={{ width: "var(--radix-popover-trigger-width)" }}
                                    >
                                        <Command>
                                            <CommandList>
                                                <CommandGroup>
                                                    {exitTypes.map(type => (
                                                        <CommandItem
                                                            key={type}
                                                            onSelect={() => {
                                                                toggleSelection(
                                                                    type,
                                                                    filterExitType,
                                                                    setFilterExitType,
                                                                );
                                                            }}
                                                            className="hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
                                                        >
                                                            <Check
                                                                className={cn(
                                                                    "mr-2 h-4 w-4",
                                                                    filterExitType.includes(type)
                                                                        ? "opacity-100"
                                                                        : "opacity-0",
                                                                )}
                                                            />
                                                            {type}
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                            </div>

                            {/* Exit Reason Filter */}
                            <div>
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                                    Exit Reason
                                </label>
                                <Popover open={exitReasonOpen} onOpenChange={setExitReasonOpen}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            aria-expanded={exitReasonOpen}
                                            className="w-full justify-between border-gray-400 dark:border-gray-500 bg-transparent"
                                        >
                                            {filterExitReason.length > 0
                                                ? `${filterExitReason.length} selected`
                                                : "Select exit reasons..."}
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent
                                        className="p-0 bg-white dark:bg-gray-900 z-[300]"
                                        align="start"
                                        style={{ width: "var(--radix-popover-trigger-width)" }}
                                    >
                                        <Command>
                                            <CommandList>
                                                <CommandGroup>
                                                    {exitReasons.map(reason => (
                                                        <CommandItem
                                                            key={reason}
                                                            onSelect={() => {
                                                                toggleSelection(
                                                                    reason,
                                                                    filterExitReason,
                                                                    setFilterExitReason,
                                                                );
                                                            }}
                                                            className="hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
                                                        >
                                                            <Check
                                                                className={cn(
                                                                    "mr-2 h-4 w-4",
                                                                    filterExitReason.includes(
                                                                        reason,
                                                                    )
                                                                        ? "opacity-100"
                                                                        : "opacity-0",
                                                                )}
                                                            />
                                                            {reason}
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                            </div>

                            {/* Rehire Eligibility Filter */}
                            <div>
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                                    Rehire Eligibility
                                </label>
                                <Popover open={rehireOpen} onOpenChange={setRehireOpen}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            aria-expanded={rehireOpen}
                                            className="w-full justify-between border-gray-400 dark:border-gray-500 bg-transparent"
                                        >
                                            {filterRehireEligibility.length > 0
                                                ? `${filterRehireEligibility.length} selected`
                                                : "Select eligibility..."}
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent
                                        className="p-0 bg-white dark:bg-gray-900 z-[300]"
                                        align="start"
                                        style={{ width: "var(--radix-popover-trigger-width)" }}
                                    >
                                        <Command>
                                            <CommandList>
                                                <CommandGroup>
                                                    {rehireOptions.map(option => (
                                                        <CommandItem
                                                            key={option.value}
                                                            onSelect={() => {
                                                                toggleSelection(
                                                                    option.value,
                                                                    filterRehireEligibility,
                                                                    setFilterRehireEligibility,
                                                                );
                                                            }}
                                                            className="hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
                                                        >
                                                            <Check
                                                                className={cn(
                                                                    "mr-2 h-4 w-4",
                                                                    filterRehireEligibility.includes(
                                                                        option.value,
                                                                    )
                                                                        ? "opacity-100"
                                                                        : "opacity-0",
                                                                )}
                                                            />
                                                            {option.label}
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </div>

                        {/* Date Range Filter */}
                        <div>
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                                Last Date Range
                            </label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">
                                        From
                                    </label>
                                    <Input
                                        type="date"
                                        value={filterDateFrom}
                                        onChange={e => setFilterDateFrom(e.target.value)}
                                        className="border-gray-400 dark:border-gray-500"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">
                                        To
                                    </label>
                                    <Input
                                        type="date"
                                        value={filterDateTo}
                                        onChange={e => setFilterDateTo(e.target.value)}
                                        className="border-gray-400 dark:border-gray-500"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <DialogFooterComponent className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={clearAllFilters}
                            className="border-gray-400 dark:border-gray-500 bg-transparent"
                        >
                            Clear All
                        </Button>
                        <Button
                            onClick={applyFilters}
                            className="bg-brand-600 hover:bg-brand-700 text-white"
                        >
                            Apply Filters
                        </Button>
                    </DialogFooterComponent>
                </DialogContentComponent>
            </Dialog>

            {/* Modals */}
            <ExitInstanceFormModal
                isOpen={isCreateModalOpen || editingInstance !== null}
                onClose={() => {
                    setIsCreateModalOpen(false);
                    setEditingInstance(null);
                }}
                onSave={handleSave}
                editingInstance={editingInstance}
            />

            <ExitInstanceViewModal
                isOpen={viewingInstance !== null}
                onClose={() => setViewingInstance(null)}
                instance={viewingInstance}
            />

            {ConfirmDialog}
        </div>
    );
}
