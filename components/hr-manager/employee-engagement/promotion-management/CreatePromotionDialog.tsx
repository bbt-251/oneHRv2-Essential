"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { useFirestore } from "@/context/firestore-context";
import { useToast } from "@/context/toastContext";
import { promotionService } from "@/lib/backend/firebase/promotionService";
import {
    EvaluationCycleOption,
    PeriodOption,
    PromotionInstanceModel,
    PromotionPayment,
} from "@/lib/models/promotion-instance";
import { EmployeeModel } from "@/lib/models/employee";
import { formatDate, getTimestamp } from "@/lib/util/dayjs_format";
import getFullName from "@/lib/util/getEmployeeFullName";
import { cn } from "@/lib/utils";
import {
    CalendarIcon,
    ChevronDown,
    ChevronRight,
    Loader2,
    Pencil,
    Plus,
    Search,
    Trash2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { MultiSelectDropdown } from "./MultiSelectDropdown";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

// Position option type
interface PositionOption {
    id: string;
    name: string;
    grade: string;
}

// Grade option type
interface GradeOption {
    id: string;
    grade: string;
}

// Per-employee benefits type (defined outside component)
interface EmployeeBenefits {
    newPosition: string;
    newGrade: string;
    newStep: string;
    newSalary: string;
    newEntitlementDays: string;
    newWorkingLocation: string;
    salaryManuallyEntered: boolean; // Track if user manually entered salary
    allowances: PromotionPayment[]; // Associated allowances/payments
}

// Promotion reason options
const PROMOTION_REASONS = [
    { value: "Outstanding Performance", label: "Outstanding Performance" },
    { value: "Tenure/Years of Service", label: "Tenure/Years of Service" },
    { value: "Skills Development", label: "Skills Development" },
    { value: "Leadership Qualities", label: "Leadership Qualities" },
    { value: "Position Vacancy", label: "Position Vacancy" },
    { value: "Organizational Restructuring", label: "Organizational Restructuring" },
    { value: "Merit-Based Advancement", label: "Merit-Based Advancement" },
    { value: "Other", label: "Other" },
];

interface CreatePromotionDialogProps {
    isOpen: boolean;
    onClose: () => void;
}

export function CreatePromotionDialog({ isOpen, onClose }: CreatePromotionDialogProps) {
    // Get data directly from Firestore context
    const { activeEmployees, hrSettings, documents } = useFirestore();
    const { showToast } = useToast();

    // Convert periodicOptions to PeriodOption format
    const periodOptions: PeriodOption[] = useMemo(() => {
        return hrSettings.periodicOptions.map(option => ({
            id: option.id || "",
            label: `${option.periodName} ${option.year}`,
        }));
    }, [hrSettings.periodicOptions]);

    // Get active positions for dropdown
    const positionOptions: PositionOption[] = useMemo(() => {
        return hrSettings.positions
            .filter(p => p.active === "Yes")
            .map(p => ({
                id: p.id,
                name: p.name,
                grade: p.grade,
            }));
    }, [hrSettings.positions]);

    // Get active grades for dropdown
    const gradeOptions: GradeOption[] = useMemo(() => {
        return hrSettings.grades
            .filter(g => g.active === "Yes")
            .map(g => ({
                id: g.id,
                grade: g.grade,
            }));
    }, [hrSettings.grades]);

    // Get salary scales for step/salary calculations
    const salaryScales = hrSettings.salaryScales || [];

    // Get salary from scale matrix based on grade and step
    const getSalaryFromScale = (gradeId: string, step: number): number => {
        // Find the salary scale that contains the selected grade
        const scaleObj = salaryScales.find(s => s.scales.some(sc => sc.grade === gradeId));
        if (!scaleObj) return 0;

        // Look up salary in the scales array (row is found from grade, column = step)
        const gradeIndex = gradeOptions.findIndex(g => g.id === gradeId);
        if (gradeIndex === -1) return 0;

        const scale = scaleObj.scales.find(s => s.row === gradeIndex + 1 && s.column === step);
        return scale?.salary || 0;
    };

    // Get departments for filter
    const departmentOptions = useMemo(() => {
        return hrSettings.departmentSettings
            .filter(d => d.active)
            .map(d => ({
                id: d.id,
                name: d.name,
            }));
    }, [hrSettings.departmentSettings]);

    // Get locations for working location dropdown
    const locationOptions = useMemo(() => {
        return (
            hrSettings.locations?.map(loc => ({
                id: loc.id,
                name: loc.name,
            })) || []
        );
    }, [hrSettings.locations]);

    // Use employees from Firestore
    const employees = activeEmployees;

    // Load existing promotions count
    const [existingPromotionsCount, setExistingPromotionsCount] = useState(0);
    const [isLoadingCount, setIsLoadingCount] = useState(false);

    useEffect(() => {
        const loadCount = async () => {
            if (isOpen) {
                try {
                    setIsLoadingCount(true);
                    const promotions = await promotionService.getAll();
                    setExistingPromotionsCount(promotions.length);
                } catch (error) {
                    console.error("Error loading promotions count:", error);
                } finally {
                    setIsLoadingCount(false);
                }
            }
        };
        loadCount();
    }, [isOpen]);

    // Form state - must be declared before any useMemo that depends on these values
    const [promotionName, setPromotionName] = useState<string>("");
    const [selectedPeriods, setSelectedPeriods] = useState<string[]>([]);
    const [selectedCycles, setSelectedCycles] = useState<string[]>([]);
    const [minPerformanceScore, setMinPerformanceScore] = useState<number>(3);
    const [applicationDate, setApplicationDate] = useState<Date | undefined>(undefined);
    const [promotionReason, setPromotionReason] = useState<string>("");
    const [otherReasonDescription, setOtherReasonDescription] = useState<string>("");

    // Document template selection state - for generating promotion letter
    const [selectedDocumentTemplateId, setSelectedDocumentTemplateId] = useState<string>("");

    // Clear selected cycles when period changes
    useEffect(() => {
        setSelectedCycles([]);
    }, [selectedPeriods]);

    // Convert evaluationCampaigns to EvaluationCycleOption format
    // Filtered based on selected periods - MUST be after selectedPeriods state declaration
    const evaluationCycleOptions: EvaluationCycleOption[] = useMemo(() => {
        const campaigns = hrSettings.evaluationCampaigns || [];

        // If no periods selected, show all campaigns
        if (selectedPeriods.length === 0) {
            return campaigns.map(campaign => ({
                id: campaign.id || "",
                label: campaign.campaignName,
            }));
        }

        // Filter campaigns that belong to selected periods
        return campaigns
            .filter(campaign => selectedPeriods.includes(campaign.periodID))
            .map(campaign => ({
                id: campaign.id || "",
                label: campaign.campaignName,
            }));
    }, [hrSettings.evaluationCampaigns, selectedPeriods]);
    const [employeeSearch, setEmployeeSearch] = useState("");
    const [departmentFilter, setDepartmentFilter] = useState<string>("all");
    const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
    const [openEmployeeId, setOpenEmployeeId] = useState<string | null>(null);

    // Per-employee benefits state (type defined outside component)
    const [employeeBenefits, setEmployeeBenefits] = useState<Record<string, EmployeeBenefits>>({});

    // Allowance modal state
    const [isAllowanceModalOpen, setIsAllowanceModalOpen] = useState(false);
    const [allowanceEmployeeId, setAllowanceEmployeeId] = useState<string | null>(null);
    const [editingAllowanceId, setEditingAllowanceId] = useState<string | null>(null);
    const [newAllowance, setNewAllowance] = useState<Partial<PromotionPayment>>({
        paymentTypeName: "",
        paymentTypeLabel: "",
        paymentAmount: 0,
        monthlyAmounts: {},
    });

    // Track which performance score is being used for each employee
    const [employeeScores, setEmployeeScores] = useState<
        Record<string, { score: number; source: string }>
    >({});

    // Initialize benefits for an employee when they are selected
    const initializeEmployeeBenefits = (employeeId: string, employee?: EmployeeModel) => {
        if (!employeeBenefits[employeeId]) {
            setEmployeeBenefits(prev => ({
                ...prev,
                [employeeId]: {
                    newPosition: "",
                    newGrade: "",
                    newStep: "",
                    newSalary: "",
                    newEntitlementDays: "",
                    newWorkingLocation: employee?.workingLocation ?? "",
                    salaryManuallyEntered: false,
                    allowances: [],
                },
            }));
        }
    };

    // Update benefits for a specific employee
    const updateEmployeeBenefits = (
        employeeId: string,
        field: keyof EmployeeBenefits,
        value: string | boolean,
    ) => {
        setEmployeeBenefits(prev => ({
            ...prev,
            [employeeId]: {
                ...prev[employeeId],
                [field]: value,
            },
        }));

        // Auto-populate salary when grade and step are both set ONLY if user hasn't manually entered salary
        if (field === "newStep") {
            const currentBenefits = employeeBenefits[employeeId] || {};
            const gradeId = currentBenefits.newGrade;
            const step = value as string;

            // Only auto-populate if salary hasn't been manually entered
            if (gradeId && step && !currentBenefits.salaryManuallyEntered) {
                const salary = getSalaryFromScale(gradeId, parseInt(step));
                if (salary > 0) {
                    setEmployeeBenefits(prev => ({
                        ...prev,
                        [employeeId]: {
                            ...prev[employeeId],
                            newSalary: String(salary),
                        },
                    }));
                }
            }
        }
    };

    // Reset benefits when employee is deselected
    const toggleEmployeeSelection = (employeeId: string) => {
        if (selectedEmployees.includes(employeeId)) {
            setSelectedEmployees(selectedEmployees.filter(id => id !== employeeId));
            // Remove benefits for deselected employee
            const newBenefits = { ...employeeBenefits };
            delete newBenefits[employeeId];
            setEmployeeBenefits(newBenefits);
        } else {
            const employee = employees.find(e => e.uid === employeeId);
            setSelectedEmployees([...selectedEmployees, employeeId]);
            initializeEmployeeBenefits(employeeId, employee);
        }
    };

    // Open allowance modal for a specific employee (for adding new)
    const openAllowanceModal = (employeeId: string) => {
        setAllowanceEmployeeId(employeeId);
        setEditingAllowanceId(null);
        setNewAllowance({
            paymentTypeName: "",
            paymentTypeLabel: "",
            paymentAmount: 0,
            monthlyAmounts: {},
        });
        setIsAllowanceModalOpen(true);
    };

    // Open allowance modal for editing existing allowance
    const openEditAllowanceModal = (employeeId: string, allowance: PromotionPayment) => {
        setAllowanceEmployeeId(employeeId);
        setEditingAllowanceId(allowance.id);
        setNewAllowance({
            paymentTypeName: allowance.paymentTypeName,
            paymentTypeLabel: allowance.paymentTypeLabel,
            paymentAmount: allowance.paymentAmount,
            monthlyAmounts: allowance.monthlyAmounts || {},
        });
        setIsAllowanceModalOpen(true);
    };

    // Add or update allowance to employee benefits
    const saveAllowance = () => {
        if (!allowanceEmployeeId || !newAllowance.paymentTypeName) return;

        const paymentType = hrSettings.paymentTypes?.find(
            pt => pt.id === newAllowance.paymentTypeName,
        );

        const allowance: PromotionPayment = {
            id: editingAllowanceId || Date.now().toString(),
            paymentTypeName: newAllowance.paymentTypeName,
            paymentTypeLabel: paymentType?.paymentName || newAllowance.paymentTypeName,
            paymentAmount: newAllowance.paymentAmount || 0,
            monthlyAmounts: newAllowance.monthlyAmounts || {},
        };

        const existingAllowances = employeeBenefits[allowanceEmployeeId]?.allowances || [];

        if (editingAllowanceId) {
            // Update existing allowance
            const updatedAllowances = existingAllowances.map(a =>
                a.id === editingAllowanceId ? allowance : a,
            );
            setEmployeeBenefits(prev => ({
                ...prev,
                [allowanceEmployeeId]: {
                    ...prev[allowanceEmployeeId],
                    allowances: updatedAllowances,
                },
            }));
            showToast("Allowance updated successfully", "Success", "success");
        } else {
            // Add new allowance
            setEmployeeBenefits(prev => ({
                ...prev,
                [allowanceEmployeeId]: {
                    ...prev[allowanceEmployeeId],
                    allowances: [...existingAllowances, allowance],
                },
            }));
            showToast("Allowance added successfully", "Success", "success");
        }

        setIsAllowanceModalOpen(false);
        setEditingAllowanceId(null);
    };

    // Remove allowance from employee benefits
    const removeAllowance = (employeeId: string, allowanceId: string) => {
        setEmployeeBenefits(prev => ({
            ...prev,
            [employeeId]: {
                ...prev[employeeId],
                allowances: prev[employeeId]?.allowances?.filter(a => a.id !== allowanceId) || [],
            },
        }));
    };

    // Update monthly amount for new allowance
    const updateAllowanceMonthlyAmount = (month: string, value: number) => {
        setNewAllowance(prev => ({
            ...prev,
            monthlyAmounts: {
                ...prev.monthlyAmounts,
                [month]: value,
            },
        }));
    };

    // Set base amount and auto-fill all months
    const setAllowanceBaseAmount = (amount: number) => {
        const monthlyAmounts: { [month: string]: number } = {};
        [
            "January",
            "February",
            "March",
            "April",
            "May",
            "June",
            "July",
            "August",
            "September",
            "October",
            "November",
            "December",
        ].forEach(month => {
            monthlyAmounts[month] = amount;
        });

        setNewAllowance(prev => ({
            ...prev,
            paymentAmount: amount,
            monthlyAmounts,
        }));
    };
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Filter eligible employees based on criteria
    // Period is mandatory, evaluation cycle is optional
    const eligibleEmployees = useMemo(() => {
        // Only show employees when at least one period is selected
        if (selectedPeriods.length === 0) {
            return [];
        }

        return employees.filter(emp => {
            // First check search and department filters
            const matchesSearch =
                getFullName(emp).toLowerCase().includes(employeeSearch.toLowerCase()) ||
                emp.employeeID.toLowerCase().includes(employeeSearch.toLowerCase());
            const matchesDepartment =
                departmentFilter === "all" || emp.department === departmentFilter;

            if (!matchesSearch || !matchesDepartment) return false;

            // Get employee performance records
            const employeePerformance = emp.performance || [];

            // Use Array.find to get the matching performance record
            // Must match selected period AND (optional) selected campaign
            const matchingPerformance = employeePerformance.find(perf => {
                const matchesPeriod = selectedPeriods.includes(perf.period);
                // If no cycles selected, only check period. If cycles selected, must match both
                const matchesCampaign =
                    selectedCycles.length === 0 || selectedCycles.includes(perf.campaignId);
                return matchesPeriod && matchesCampaign;
            });

            // If no matching performance record found, exclude employee
            if (!matchingPerformance) {
                return false;
            }

            // Check if performance score meets minimum requirement
            const performanceScore = matchingPerformance.performanceScore || 0;
            return performanceScore >= minPerformanceScore;
        });
    }, [
        employees,
        minPerformanceScore,
        employeeSearch,
        departmentFilter,
        selectedPeriods,
        selectedCycles,
    ]);

    // Update employee scores display when eligible employees change or filters change
    useEffect(() => {
        const newScores: Record<string, { score: number; source: string }> = {};

        eligibleEmployees.forEach(emp => {
            const perf = emp.performance || [];

            // Use Array.find to get the matching performance record
            // Period is mandatory, campaign is optional
            const matchingPerformance = perf.find(p => {
                const matchesPeriod = selectedPeriods.includes(p.period);
                // If no cycles selected, only check period. If cycles selected, must match both
                const matchesCampaign =
                    selectedCycles.length === 0 || selectedCycles.includes(p.campaignId);
                return matchesPeriod && matchesCampaign;
            });

            const score = matchingPerformance?.performanceScore || 0;
            const source = matchingPerformance ? "Evaluation Score" : "General Score";

            newScores[emp.uid] = { score, source };
        });

        setEmployeeScores(newScores);
    }, [eligibleEmployees, selectedPeriods, selectedCycles]);

    const selectAllEmployees = () => {
        if (selectedEmployees.length === eligibleEmployees.length) {
            setSelectedEmployees([]);
        } else {
            setSelectedEmployees(eligibleEmployees.map(e => e.id));
        }
    };

    const resetForm = () => {
        setPromotionName("");
        setSelectedPeriods([]);
        setSelectedCycles([]);
        setMinPerformanceScore(3);
        setApplicationDate(undefined);
        setPromotionReason("");
        setOtherReasonDescription("");
        setEmployeeSearch("");
        setSelectedDocumentTemplateId("");
        setDepartmentFilter("all");
        setSelectedEmployees([]);
        setEmployeeBenefits({});
        setOpenEmployeeId(null);
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    const handleSubmit = async () => {
        if (
            selectedEmployees.length === 0 ||
            selectedPeriods.length === 0 ||
            !promotionName ||
            !applicationDate ||
            !promotionReason
        ) {
            showToast(
                "Please fill in all required fields (promotion name, application date, reason for promotion, at least one period, and select at least one employee)",
                "Validation Error",
                "error",
            );
            return;
        }

        if (promotionReason === "Other" && !otherReasonDescription.trim()) {
            showToast(
                "Please provide a description for the 'Other' reason",
                "Validation Error",
                "error",
            );
            return;
        }

        setIsSubmitting(true);

        try {
            const periodLabels = periodOptions
                .filter(p => selectedPeriods.includes(p.id))
                .map(p => p.label)
                .join(", ");
            const periodIDs = selectedPeriods.join(", ");
            const cycleLabels = evaluationCycleOptions
                .filter(c => selectedCycles.includes(c.id))
                .map(c => c.label)
                .join(", ");
            const cycleIDs = selectedCycles.join(", ");

            // Auto-generate timestamp
            const timestamp = getTimestamp();

            const newPromotions: Omit<PromotionInstanceModel, "id">[] = selectedEmployees.map(
                (empId, index) => {
                    const employee = employees.find(e => e.uid === empId)!;
                    const fullName = getFullName(employee);
                    const benefits = employeeBenefits[empId] || {};

                    // Get current position details
                    const currentPos = positionOptions.find(
                        p => p.id === employee.employmentPosition,
                    );
                    const currentPositionID = employee.employmentPosition || "";
                    const currentPositionName =
                        currentPos?.name || employee.employmentPosition || "";

                    // Get current grade details
                    const currentGradeObj = gradeOptions.find(g => g.id === employee.gradeLevel);
                    const currentGradeID = employee.gradeLevel || "";
                    const currentGradeName = currentGradeObj?.grade || employee.gradeLevel || "";

                    // Get new position details
                    const newPos = positionOptions.find(p => p.id === benefits.newPosition);
                    const newPositionID = benefits.newPosition || "";
                    const newPositionName =
                        newPos?.name || benefits.newPosition || `Senior ${currentPositionName}`;

                    // Get new grade details
                    const newGradeObj = gradeOptions.find(g => g.id === benefits.newGrade);
                    const newGradeID = benefits.newGrade || "";
                    const newGradeName =
                        newGradeObj?.grade || benefits.newGrade || currentGradeName;

                    return {
                        promotionID: `PROMO-${String(existingPromotionsCount + index + 1).padStart(3, "0")}`,
                        promotionName: promotionName,
                        timestamp: timestamp,
                        period: periodLabels,
                        periodID: periodIDs,
                        evaluationCycle: cycleLabels,
                        evaluationCycleID: cycleIDs,
                        employeeUID: employee.uid,
                        employeeID: employee.employeeID,
                        employeeName: fullName,
                        // Current position details
                        currentPositionID: currentPositionID,
                        currentPosition: currentPositionName,
                        // New position details
                        newPositionID: newPositionID,
                        newPosition: newPositionName,
                        // Current grade details
                        currentGradeID: currentGradeID,
                        currentGrade: currentGradeName,
                        // New grade details
                        newGradeID: newGradeID,
                        newGrade: newGradeName,
                        currentStep: employee.step ?? null,
                        newStep: benefits.newStep
                            ? parseInt(benefits.newStep)
                            : (employee.step ?? null),
                        currentSalary: employee.salary,
                        newSalary: benefits.newSalary
                            ? parseInt(benefits.newSalary)
                            : employee.salary,
                        currentEntitlementDays: employee.eligibleLeaveDays || 0,
                        newEntitlementDays: benefits.newEntitlementDays
                            ? parseInt(benefits.newEntitlementDays)
                            : employee.eligibleLeaveDays || 0,
                        currentWorkingLocation: employee.workingLocation || null,
                        newWorkingLocation: benefits.newWorkingLocation || null,
                        department: employee.department,
                        status: "pending",
                        comments: [],
                        statusChangedAt: null,
                        statusChangedBy: null,
                        finalizedAt: null,
                        employeeDataUpdated: null,
                        applicationDate: applicationDate ? formatDate(applicationDate) : null,
                        promotionReason: promotionReason,
                        otherReasonDescription:
                            promotionReason === "Other" ? otherReasonDescription : null,
                        // Document template for promotion letter
                        documentTemplateId: selectedDocumentTemplateId || null,
                        associatedPayments: benefits.allowances || [],
                    };
                },
            );

            // Save each promotion to Firestore
            for (const promo of newPromotions) {
                await promotionService.create(promo);
            }

            handleClose();
            showToast(
                `Successfully created promotion for ${selectedEmployees.length} employee(s)`,
                "Success",
                "success",
            );
        } catch (error) {
            console.error("Error creating promotion:", error);
            showToast("Failed to create promotion. Please try again.", "Error", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const isFormValid =
        selectedEmployees.length > 0 &&
        selectedPeriods.length > 0 &&
        promotionName &&
        applicationDate &&
        promotionReason &&
        !isLoadingCount;

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-brand-800 dark:text-foreground">
                        Create Promotion Instance
                    </DialogTitle>
                    <DialogDescription className="text-brand-600 dark:text-muted-foreground">
                        Configure the promotion parameters and select eligible employees.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Section: Promotion Name and Timestamp */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <div className="h-6 w-1 bg-brand-600 rounded-full" />
                            <h3 className="font-semibold text-brand-800 dark:text-foreground">
                                Promotion Details
                            </h3>
                        </div>
                        <div className="grid grid-cols-2 gap-4 pl-3">
                            <div className="space-y-2">
                                <Label>
                                    Promotion Name <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    placeholder="Enter promotion name..."
                                    value={promotionName}
                                    onChange={e => setPromotionName(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>
                                    Application Date <span className="text-red-500">*</span>
                                </Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className={cn(
                                                "w-full justify-start text-left font-normal",
                                                !applicationDate && "text-muted-foreground",
                                            )}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {applicationDate
                                                ? formatDate(applicationDate)
                                                : "Select date..."}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={applicationDate}
                                            onSelect={setApplicationDate}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 pl-3 mt-4">
                            <div className="space-y-2">
                                <Label>
                                    Reason for Promotion <span className="text-red-500">*</span>
                                </Label>
                                <Select value={promotionReason} onValueChange={setPromotionReason}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select reason..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {PROMOTION_REASONS.map(reason => (
                                            <SelectItem key={reason.value} value={reason.value}>
                                                {reason.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            {promotionReason === "Other" && (
                                <div className="space-y-2">
                                    <Label>
                                        Other Reason Description{" "}
                                        <span className="text-red-500">*</span>
                                    </Label>
                                    <Textarea
                                        placeholder="Please describe the reason..."
                                        value={otherReasonDescription}
                                        onChange={e => setOtherReasonDescription(e.target.value)}
                                        className="min-h-[80px]"
                                    />
                                </div>
                            )}
                        </div>

                        {/* Document Template Selection - for generating promotion letter */}
                        <div className="space-y-2 mt-4">
                            <Label>Promotion Letter Template</Label>
                            <Select
                                value={selectedDocumentTemplateId}
                                onValueChange={setSelectedDocumentTemplateId}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select promotion letter template..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="-">None</SelectItem>
                                    {documents
                                        .filter(d => d.status === "Published")
                                        .map(doc => (
                                            <SelectItem key={doc.id} value={doc.id!}>
                                                {doc.name}
                                            </SelectItem>
                                        ))}
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">
                                Select a template to generate the promotion letter. You can also
                                attach additional documents later.
                            </p>
                        </div>
                    </div>

                    <Separator />

                    {/* Section 1: Period and Evaluation Cycle */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <div className="h-6 w-1 bg-brand-600 rounded-full" />
                            <h3 className="font-semibold text-brand-800 dark:text-foreground">
                                Period & Evaluation Cycle
                            </h3>
                        </div>
                        <div className="grid grid-cols-2 gap-4 pl-3">
                            <div className="space-y-2">
                                <Label>Period</Label>
                                <MultiSelectDropdown
                                    options={periodOptions}
                                    selected={selectedPeriods}
                                    onSelectionChange={setSelectedPeriods}
                                    placeholder="Select periods..."
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Evaluation Cycle</Label>
                                <MultiSelectDropdown
                                    options={evaluationCycleOptions}
                                    selected={selectedCycles}
                                    onSelectionChange={setSelectedCycles}
                                    placeholder="Select evaluation cycles..."
                                />
                            </div>
                        </div>
                    </div>

                    <Separator />

                    {/* Section 2: Eligibility Criteria */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <div className="h-6 w-1 bg-brand-600 rounded-full" />
                            <h3 className="font-semibold text-brand-800 dark:text-foreground">
                                Eligibility Criteria
                            </h3>
                        </div>
                        <div className="pl-3 space-y-4">
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <Label>Minimum Performance Score</Label>
                                    <span className="text-sm font-medium text-brand-700 dark:text-foreground bg-brand-100 dark:bg-muted px-2 py-1 rounded">
                                        {minPerformanceScore.toFixed(2)} / 5
                                    </span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="text-sm text-muted-foreground">1</span>
                                    <Slider
                                        value={[minPerformanceScore]}
                                        onValueChange={value => setMinPerformanceScore(value[0])}
                                        min={1}
                                        max={5}
                                        step={0.25}
                                        className="flex-1"
                                    />
                                    <span className="text-sm text-muted-foreground">5</span>
                                </div>
                                <div className="flex justify-between text-xs text-muted-foreground px-2">
                                    <span>Needs Improvement</span>
                                    <span>Meets Expectations</span>
                                    <span>Exceptional</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <Separator />

                    {/* Section 3: Eligible Employees */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="h-6 w-1 bg-brand-600 rounded-full" />
                                <h3 className="font-semibold text-brand-800 dark:text-foreground">
                                    Eligible Employees
                                </h3>
                            </div>
                            <Badge variant="secondary">{eligibleEmployees.length} eligible</Badge>
                        </div>
                        <div className="pl-3 space-y-3">
                            <div className="flex gap-3">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search by name or ID..."
                                        value={employeeSearch}
                                        onChange={e => setEmployeeSearch(e.target.value)}
                                        className="pl-9"
                                    />
                                </div>
                                <Select
                                    value={departmentFilter}
                                    onValueChange={setDepartmentFilter}
                                >
                                    <SelectTrigger className="w-[180px]">
                                        <SelectValue placeholder="Filter by department" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Departments</SelectItem>
                                        {departmentOptions.map(dept => (
                                            <SelectItem key={dept.id} value={dept.name}>
                                                {dept.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="border rounded-lg overflow-hidden">
                                <div className="bg-muted/50 px-4 py-2 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Checkbox
                                            checked={
                                                selectedEmployees.length ===
                                                    eligibleEmployees.length &&
                                                eligibleEmployees.length > 0
                                            }
                                            onCheckedChange={selectAllEmployees}
                                        />
                                        <span className="text-sm font-medium">
                                            {selectedEmployees.length} selected
                                        </span>
                                    </div>
                                </div>
                                <ScrollArea className="h-[200px]">
                                    <div className="divide-y">
                                        {eligibleEmployees.length > 0 ? (
                                            eligibleEmployees.map(employee => (
                                                <div
                                                    key={employee.uid}
                                                    className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 cursor-pointer"
                                                    onClick={() =>
                                                        toggleEmployeeSelection(employee.uid)
                                                    }
                                                >
                                                    <Checkbox
                                                        checked={selectedEmployees.includes(
                                                            employee.uid,
                                                        )}
                                                        onCheckedChange={() =>
                                                            toggleEmployeeSelection(employee.uid)
                                                        }
                                                    />
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-medium text-sm">
                                                                {getFullName(employee)}
                                                            </span>
                                                            <Badge
                                                                variant="outline"
                                                                className="text-xs"
                                                            >
                                                                {employee.employeeID}
                                                            </Badge>
                                                        </div>
                                                        <div className="text-xs text-muted-foreground">
                                                            {positionOptions.find(
                                                                p =>
                                                                    p.id ===
                                                                    employee.employmentPosition,
                                                            )?.name ||
                                                                employee.employmentPosition ||
                                                                "—"}{" "}
                                                            -{" "}
                                                            {departmentOptions.find(
                                                                d => d.id === employee.department,
                                                            )?.name ||
                                                                employee.department ||
                                                                "—"}
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="flex items-center gap-1">
                                                            <span className="text-xs text-muted-foreground">
                                                                Score:
                                                            </span>
                                                            <Badge
                                                                variant={
                                                                    (employeeScores[employee.uid]
                                                                        ?.score ||
                                                                        employee.performanceScore ||
                                                                        0) >= 4
                                                                        ? "default"
                                                                        : "secondary"
                                                                }
                                                                className="text-xs"
                                                            >
                                                                {employeeScores[employee.uid]
                                                                    ?.score ||
                                                                    employee.performanceScore ||
                                                                    0}
                                                                /5
                                                            </Badge>
                                                        </div>
                                                        {employeeScores[employee.uid]?.source &&
                                                            employeeScores[employee.uid].source !==
                                                                "General Score" && (
                                                            <div className="text-xs text-brand-600">
                                                                {
                                                                    employeeScores[employee.uid]
                                                                        .source
                                                                }
                                                            </div>
                                                        )}
                                                        <div className="text-xs text-muted-foreground">
                                                            Grade:{" "}
                                                            {gradeOptions.find(
                                                                g => g.id === employee.gradeLevel,
                                                            )?.grade ||
                                                                employee.gradeLevel ||
                                                                "N/A"}{" "}
                                                            / Step: {employee.step}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="px-4 py-8 text-center text-muted-foreground">
                                                {selectedPeriods.length === 0 ? (
                                                    <div className="space-y-2">
                                                        <p className="font-medium">Select Period</p>
                                                        <p className="text-sm">
                                                            Please select at least one period to
                                                            view eligible employees. Evaluation
                                                            cycle is optional.
                                                        </p>
                                                    </div>
                                                ) : (
                                                    "No employees match the current criteria"
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </ScrollArea>
                            </div>
                        </div>
                    </div>

                    <Separator />

                    {/* Section 4: Benefits Association */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <div className="h-6 w-1 bg-brand-600 rounded-full" />
                            <h3 className="font-semibold text-brand-800 dark:text-foreground">
                                Benefits Association
                            </h3>
                        </div>
                        <div className="pl-3 space-y-4">
                            {selectedEmployees.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    Select employees from the Eligible Employees section to
                                    configure their promotion benefits
                                </div>
                            ) : (
                                selectedEmployees.map(empId => {
                                    const employee = employees.find(e => e.uid === empId);
                                    const benefits = employeeBenefits[empId] || {};
                                    const isOpen = openEmployeeId === empId;

                                    if (!employee) return null;

                                    // Get current values
                                    const currentPos = positionOptions.find(
                                        p => p.id === employee.employmentPosition,
                                    );
                                    const currentPositionName =
                                        currentPos?.name || employee.employmentPosition || "";
                                    const currentGradeObj = gradeOptions.find(
                                        g => g.id === employee.gradeLevel,
                                    );
                                    const currentGradeName =
                                        currentGradeObj?.grade || employee.gradeLevel || "";

                                    return (
                                        <Collapsible
                                            key={empId}
                                            open={isOpen}
                                            onOpenChange={open =>
                                                setOpenEmployeeId(open ? empId : null)
                                            }
                                        >
                                            <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg border bg-muted/30 p-4 hover:bg-muted/50 transition-colors">
                                                <div className="flex items-center gap-3">
                                                    {isOpen ? (
                                                        <ChevronDown className="h-5 w-5" />
                                                    ) : (
                                                        <ChevronRight className="h-5 w-5" />
                                                    )}
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-medium">
                                                            {getFullName(employee)}
                                                        </span>
                                                        <Badge
                                                            variant="outline"
                                                            className="text-xs"
                                                        >
                                                            {employee.employeeID}
                                                        </Badge>
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {currentPositionName} →{" "}
                                                        {benefits.newPosition
                                                            ? positionOptions.find(
                                                                p =>
                                                                    p.id === benefits.newPosition,
                                                            )?.name || benefits.newPosition
                                                            : "—"}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Badge
                                                        variant={
                                                            benefits.newGrade
                                                                ? "default"
                                                                : "secondary"
                                                        }
                                                        className="text-xs"
                                                    >
                                                        {benefits.newGrade
                                                            ? gradeOptions.find(
                                                                g => g.id === benefits.newGrade,
                                                            )?.grade || benefits.newGrade
                                                            : "Grade: —"}
                                                    </Badge>
                                                    {benefits.newSalary && (
                                                        <Badge
                                                            variant="default"
                                                            className="text-xs bg-green-600"
                                                        >
                                                            $
                                                            {parseInt(
                                                                benefits.newSalary,
                                                            ).toLocaleString()}
                                                        </Badge>
                                                    )}
                                                </div>
                                            </CollapsibleTrigger>
                                            <CollapsibleContent className="space-y-4 pt-4">
                                                {/* Position Change */}
                                                <div className="grid grid-cols-[1fr,auto,1fr] gap-4 items-end">
                                                    <div className="space-y-2">
                                                        <Label className="text-muted-foreground">
                                                            Current Position
                                                        </Label>
                                                        <div className="h-10 px-3 py-2 rounded-md border bg-muted/50 flex items-center text-sm text-muted-foreground">
                                                            {currentPositionName}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center justify-center h-10 text-muted-foreground">
                                                        <span className="text-lg">→</span>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>New Position</Label>
                                                        <Select
                                                            value={benefits.newPosition}
                                                            onValueChange={value =>
                                                                updateEmployeeBenefits(
                                                                    empId,
                                                                    "newPosition",
                                                                    value,
                                                                )
                                                            }
                                                        >
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Select new position" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {positionOptions.map(pos => (
                                                                    <SelectItem
                                                                        key={pos.id}
                                                                        value={pos.id}
                                                                    >
                                                                        {pos.name}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                </div>

                                                {/* Grade Change */}
                                                <div className="grid grid-cols-[1fr,auto,1fr] gap-4 items-end">
                                                    <div className="space-y-2">
                                                        <Label className="text-muted-foreground">
                                                            Current Grade
                                                        </Label>
                                                        <div className="h-10 px-3 py-2 rounded-md border bg-muted/50 flex items-center text-sm text-muted-foreground">
                                                            {currentGradeName}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center justify-center h-10 text-muted-foreground">
                                                        <span className="text-lg">→</span>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>New Grade</Label>
                                                        <Select
                                                            value={benefits.newGrade}
                                                            onValueChange={value => {
                                                                updateEmployeeBenefits(
                                                                    empId,
                                                                    "newGrade",
                                                                    value,
                                                                );
                                                                updateEmployeeBenefits(
                                                                    empId,
                                                                    "newStep",
                                                                    "",
                                                                );
                                                                // Don't clear salary when grade changes - preserve user's entered value
                                                            }}
                                                        >
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Select new grade" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {gradeOptions.map(grade => (
                                                                    <SelectItem
                                                                        key={grade.id}
                                                                        value={grade.id}
                                                                    >
                                                                        {grade.grade}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                </div>

                                                {/* Step Change */}
                                                <div className="grid grid-cols-[1fr,auto,1fr] gap-4 items-end">
                                                    <div className="space-y-2">
                                                        <Label className="text-muted-foreground">
                                                            Current Step
                                                        </Label>
                                                        <div className="h-10 px-3 py-2 rounded-md border bg-muted/50 flex items-center text-sm text-muted-foreground">
                                                            Step {employee.step}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center justify-center h-10 text-muted-foreground">
                                                        <span className="text-lg">→</span>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>New Step</Label>
                                                        <Select
                                                            value={benefits.newStep}
                                                            onValueChange={value =>
                                                                updateEmployeeBenefits(
                                                                    empId,
                                                                    "newStep",
                                                                    value,
                                                                )
                                                            }
                                                            disabled={!benefits.newGrade}
                                                        >
                                                            <SelectTrigger>
                                                                <SelectValue
                                                                    placeholder={
                                                                        benefits.newGrade
                                                                            ? "Select new step"
                                                                            : "Select grade first"
                                                                    }
                                                                />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {(() => {
                                                                    const scaleWithGrade =
                                                                        salaryScales.find(s =>
                                                                            s.scales.some(
                                                                                sc =>
                                                                                    sc.grade ===
                                                                                    benefits.newGrade,
                                                                            ),
                                                                        );
                                                                    const maxSteps =
                                                                        scaleWithGrade?.numberOfSteps ||
                                                                        5;
                                                                    return Array.from(
                                                                        { length: maxSteps },
                                                                        (_, i) => i + 1,
                                                                    ).map(step => (
                                                                        <SelectItem
                                                                            key={step}
                                                                            value={String(step)}
                                                                        >
                                                                            Step {step}
                                                                        </SelectItem>
                                                                    ));
                                                                })()}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                </div>

                                                {/* Salary Change */}
                                                <div className="grid grid-cols-[1fr,auto,1fr] gap-4 items-end">
                                                    <div className="space-y-2">
                                                        <Label className="text-muted-foreground">
                                                            Current Salary ($)
                                                        </Label>
                                                        <div className="h-10 px-3 py-2 rounded-md border bg-muted/50 flex items-center text-sm text-muted-foreground">
                                                            ${employee.salary.toLocaleString()}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center justify-center h-10 text-muted-foreground">
                                                        <span className="text-lg">→</span>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>New Salary ($)</Label>
                                                        <div className="relative">
                                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                                                                $
                                                            </span>
                                                            <Input
                                                                type="number"
                                                                placeholder="Enter new salary"
                                                                value={benefits.newSalary}
                                                                onChange={e => {
                                                                    updateEmployeeBenefits(
                                                                        empId,
                                                                        "newSalary",
                                                                        e.target.value,
                                                                    );
                                                                    updateEmployeeBenefits(
                                                                        empId,
                                                                        "salaryManuallyEntered",
                                                                        true,
                                                                    );
                                                                }}
                                                                className="pl-12"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Entitlement Days Change (Eligible) */}
                                                <div className="grid grid-cols-[1fr,auto,1fr] gap-4 items-end">
                                                    <div className="space-y-2">
                                                        <Label className="text-muted-foreground">
                                                            Current Eligible Leave Days
                                                        </Label>
                                                        <div className="h-10 px-3 py-2 rounded-md border bg-muted/50 flex items-center text-sm text-muted-foreground">
                                                            {employee.eligibleLeaveDays || 0} days
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center justify-center h-10 text-muted-foreground">
                                                        <span className="text-lg">→</span>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>New Entitlement Days</Label>
                                                        <Input
                                                            type="number"
                                                            placeholder="Enter new days"
                                                            value={benefits.newEntitlementDays}
                                                            onChange={e =>
                                                                updateEmployeeBenefits(
                                                                    empId,
                                                                    "newEntitlementDays",
                                                                    e.target.value,
                                                                )
                                                            }
                                                        />
                                                    </div>
                                                </div>

                                                {/* Working Location Change */}
                                                <div className="grid grid-cols-[1fr,auto,1fr] gap-4 items-end">
                                                    <div className="space-y-2">
                                                        <Label className="text-muted-foreground">
                                                            Current Working Location
                                                        </Label>
                                                        <div className="h-10 px-3 py-2 rounded-md border bg-muted/50 flex items-center text-sm text-muted-foreground">
                                                            {hrSettings.locations?.find(
                                                                l =>
                                                                    l.id ===
                                                                    employee.workingLocation,
                                                            )?.name ||
                                                                employee.workingLocation ||
                                                                "—"}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center justify-center h-10 text-muted-foreground">
                                                        <span className="text-lg">→</span>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>New Working Location</Label>
                                                        <Select
                                                            value={benefits.newWorkingLocation}
                                                            onValueChange={value =>
                                                                updateEmployeeBenefits(
                                                                    empId,
                                                                    "newWorkingLocation",
                                                                    value,
                                                                )
                                                            }
                                                        >
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Select new location" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {locationOptions.map(loc => (
                                                                    <SelectItem
                                                                        key={loc.id}
                                                                        value={loc.id}
                                                                    >
                                                                        {loc.name}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                </div>

                                                {/* Allowances Section */}
                                                <div className="space-y-3 pt-4 border-t">
                                                    <div className="flex items-center justify-between">
                                                        <Label className="text-brand-700 dark:text-foreground font-medium">
                                                            Associated Allowances/Payments
                                                        </Label>
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() =>
                                                                openAllowanceModal(empId)
                                                            }
                                                            className="flex items-center gap-1"
                                                        >
                                                            <Plus className="h-4 w-4" />
                                                            Add Allowance
                                                        </Button>
                                                    </div>

                                                    {benefits.allowances &&
                                                    benefits.allowances.length > 0 ? (
                                                            <div className="border rounded-lg overflow-hidden">
                                                                <Table>
                                                                    <TableHeader>
                                                                        <TableRow className="bg-muted/50">
                                                                            <TableHead className="text-xs">
                                                                            Payment Type
                                                                            </TableHead>
                                                                            <TableHead className="text-xs text-right">
                                                                            Base Amount
                                                                            </TableHead>
                                                                            <TableHead className="text-xs text-center w-24">
                                                                            Actions
                                                                            </TableHead>
                                                                        </TableRow>
                                                                    </TableHeader>
                                                                    <TableBody>
                                                                        {benefits.allowances.map(
                                                                            allowance => (
                                                                                <TableRow
                                                                                    key={allowance.id}
                                                                                >
                                                                                    <TableCell className="text-sm py-2">
                                                                                        {
                                                                                            allowance.paymentTypeLabel
                                                                                        }
                                                                                    </TableCell>
                                                                                    <TableCell className="text-sm text-right py-2">
                                                                                    $
                                                                                        {allowance.paymentAmount.toLocaleString()}
                                                                                    </TableCell>
                                                                                    <TableCell className="text-center py-2">
                                                                                        <div className="flex items-center justify-center gap-1">
                                                                                            <Button
                                                                                                type="button"
                                                                                                variant="ghost"
                                                                                                size="sm"
                                                                                                onClick={() =>
                                                                                                    openEditAllowanceModal(
                                                                                                        empId,
                                                                                                        allowance,
                                                                                                    )
                                                                                                }
                                                                                                className="h-8 w-8 p-0 text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                                                                                            >
                                                                                                <Pencil className="h-4 w-4" />
                                                                                            </Button>
                                                                                            <Button
                                                                                                type="button"
                                                                                                variant="ghost"
                                                                                                size="sm"
                                                                                                onClick={() =>
                                                                                                    removeAllowance(
                                                                                                        empId,
                                                                                                        allowance.id,
                                                                                                    )
                                                                                                }
                                                                                                className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                                                                            >
                                                                                                <Trash2 className="h-4 w-4" />
                                                                                            </Button>
                                                                                        </div>
                                                                                    </TableCell>
                                                                                </TableRow>
                                                                            ),
                                                                        )}
                                                                    </TableBody>
                                                                </Table>
                                                            </div>
                                                        ) : (
                                                            <div className="text-sm text-muted-foreground py-4 text-center bg-muted/20 rounded-lg">
                                                            No allowances added yet. Click "Add
                                                            Allowance" to add payments.
                                                            </div>
                                                        )}
                                                </div>
                                            </CollapsibleContent>
                                        </Collapsible>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button
                        variant="outline"
                        onClick={handleClose}
                        className="border-brand-300 text-brand-700 hover:bg-brand-50 dark:border-border dark:text-foreground dark:hover:bg-accent"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={!isFormValid || isSubmitting}
                        className="bg-brand-600 hover:bg-brand-700 text-white disabled:opacity-50"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Creating...
                            </>
                        ) : (
                            `Create Promotion (${selectedEmployees.length} employee${
                                selectedEmployees.length !== 1 ? "s" : ""
                            })`
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>

            {/* Add/Edit Allowance Modal */}
            <Dialog open={isAllowanceModalOpen} onOpenChange={setIsAllowanceModalOpen}>
                <DialogContent className="max-w-[900px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-brand-800 dark:text-foreground">
                            {editingAllowanceId ? "Edit Allowance" : "Add Allowance"}
                        </DialogTitle>
                        <DialogDescription className="text-brand-600 dark:text-muted-foreground">
                            {editingAllowanceId
                                ? "Edit the payment/allowance for the employee."
                                : "Add a payment/allowance for the employee as part of this promotion."}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6 py-4">
                        {/* Payment Type Selection */}
                        <div className="space-y-2">
                            <Label>
                                Payment Type <span className="text-red-500">*</span>
                            </Label>
                            <Select
                                value={newAllowance.paymentTypeName}
                                onValueChange={value => {
                                    const paymentType = hrSettings.paymentTypes?.find(
                                        pt => pt.id === value,
                                    );
                                    setNewAllowance(prev => ({
                                        ...prev,
                                        paymentTypeName: value,
                                        paymentTypeLabel: paymentType?.paymentName || value,
                                    }));
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select payment type" />
                                </SelectTrigger>
                                <SelectContent>
                                    {hrSettings.paymentTypes?.map(pt => (
                                        <SelectItem key={pt.id} value={pt.id}>
                                            {pt.paymentName}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Base Amount */}
                        <div className="space-y-2">
                            <Label>Base Payment Amount ($)</Label>
                            <Input
                                type="number"
                                placeholder="Enter base amount"
                                value={newAllowance.paymentAmount || ""}
                                onChange={e =>
                                    setAllowanceBaseAmount(Number.parseFloat(e.target.value) || 0)
                                }
                                className="h-12"
                            />
                        </div>

                        {/* Monthly Amounts Table */}
                        <div className="space-y-3">
                            <div className="text-center">
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                    Enter amount for each month.
                                </p>
                                <h3 className="text-lg font-medium text-gray-900 dark:text-foreground">
                                    Monthly Breakdown:
                                </h3>
                            </div>

                            <div className="overflow-x-auto rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-brand-600 hover:bg-brand-600">
                                            <TableHead className="text-white text-center py-3 font-medium">
                                                Jan
                                            </TableHead>
                                            <TableHead className="text-white text-center py-3 font-medium">
                                                Feb
                                            </TableHead>
                                            <TableHead className="text-white text-center py-3 font-medium">
                                                Mar
                                            </TableHead>
                                            <TableHead className="text-white text-center py-3 font-medium">
                                                Apr
                                            </TableHead>
                                            <TableHead className="text-white text-center py-3 font-medium">
                                                May
                                            </TableHead>
                                            <TableHead className="text-white text-center py-3 font-medium">
                                                Jun
                                            </TableHead>
                                            <TableHead className="text-white text-center py-3 font-medium">
                                                Jul
                                            </TableHead>
                                            <TableHead className="text-white text-center py-3 font-medium">
                                                Aug
                                            </TableHead>
                                            <TableHead className="text-white text-center py-3 font-medium">
                                                Sep
                                            </TableHead>
                                            <TableHead className="text-white text-center py-3 font-medium">
                                                Oct
                                            </TableHead>
                                            <TableHead className="text-white text-center py-3 font-medium">
                                                Nov
                                            </TableHead>
                                            <TableHead className="text-white text-center py-3 font-medium">
                                                Dec
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        <TableRow className="hover:bg-gray-50 dark:hover:bg-gray-800">
                                            {[
                                                "January",
                                                "February",
                                                "March",
                                                "April",
                                                "May",
                                                "June",
                                                "July",
                                                "August",
                                                "September",
                                                "October",
                                                "November",
                                                "December",
                                            ].map(month => (
                                                <TableCell key={month} className="text-center p-2">
                                                    <Input
                                                        type="number"
                                                        placeholder="0"
                                                        value={
                                                            newAllowance.monthlyAmounts?.[month] ||
                                                            ""
                                                        }
                                                        onChange={e =>
                                                            updateAllowanceMonthlyAmount(
                                                                month,
                                                                Number.parseFloat(e.target.value) ||
                                                                    0,
                                                            )
                                                        }
                                                        className="w-full text-center border-0 bg-transparent focus:bg-white dark:focus:bg-gray-800 rounded-md h-10 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors px-1"
                                                    />
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="gap-2">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setIsAllowanceModalOpen(false);
                                setEditingAllowanceId(null);
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={saveAllowance}
                            disabled={!newAllowance.paymentTypeName}
                            className="bg-brand-600 hover:bg-brand-700 text-white"
                        >
                            {editingAllowanceId ? "Update Allowance" : "Add Allowance"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Dialog>
    );
}
