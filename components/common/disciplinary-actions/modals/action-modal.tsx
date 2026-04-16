"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { CalendarIcon, Check, ChevronsUpDown, Plus, Minus } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type {
    DisciplinaryActionModel,
    ViolationModel,
    DActionsModel,
} from "@/lib/models/disciplinary-action";
import { useFirestore } from "@/context/firestore-context";
import { useAuth } from "@/context/authContext";
import { sendNotification } from "@/lib/util/notification/send-notification";

interface DisciplinaryActionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (action: DisciplinaryActionModel) => void;
    editingAction?: DisciplinaryActionModel | null;
    viewOnly?: boolean;
    HRView?: boolean;
}

const mockLocations = [
    "Office Floor 1",
    "Office Floor 2",
    "Conference Room A",
    "Conference Room B",
    "Cafeteria",
    "Parking Lot",
    "Reception Area",
];

const mockViolationTypes = [
    "Attendance Policy Violation",
    "Code of Conduct Violation",
    "Safety Protocol Violation",
    "Harassment",
    "Insubordination",
    "Theft",
    "Misuse of Company Property",
    "Confidentiality Breach",
];

const mockDisciplinaryTypes = [
    "Verbal Warning",
    "Written Warning",
    "Final Written Warning",
    "Suspension without Pay",
    "Demotion",
    "Termination",
    "Performance Improvement Plan",
    "Training Required",
    "Counseling Session",
    "Probation Extension",
];

export function DisciplinaryActionModal({
    isOpen,
    onClose,
    onSave,
    editingAction,
    viewOnly = false,
    HRView = false,
}: DisciplinaryActionModalProps) {
    const { employees, hrSettings } = useFirestore();
    const { userData } = useAuth();

    // Filter employees to reportees for managers, all employees for HR
    const availableEmployees = HRView
        ? employees
        : employees.filter(emp => emp?.reportees?.includes(userData?.uid ?? ""));

    const [currentStep, setCurrentStep] = useState(1);
    const [formData, setFormData] = useState<DisciplinaryActionModel>({
        id: "",
        createdBy: "",
        actionID: "",
        timestamp: new Date().toISOString(),
        employeeUid: "",
        reportedDateAndTime: "",
        violationDateAndTime: "",
        violationLocationId: "",
        occurrenceLevel: "First Occurrence" as const,
        violations: [{ id: "1", violationTypeId: "", details: "" }],
        disciplinaryActions: [],
        employeeComments: [],
        stage: "Open" as const,
        status: "Raised" as const,
        approved: false,
    });

    const [employeeOpen, setEmployeeOpen] = useState(false);
    const [reportedDate, setReportedDate] = useState<Date>();
    const [violationDate, setViolationDate] = useState<Date>();
    const [reportedTime, setReportedTime] = useState("");
    const [violationTime, setViolationTime] = useState("");

    useEffect(() => {
        if (editingAction) {
            setFormData(editingAction);
            if (editingAction.reportedDateAndTime) {
                const reportedDateTime = new Date(editingAction.reportedDateAndTime);
                setReportedDate(reportedDateTime);
                setReportedTime(format(reportedDateTime, "HH:mm"));
            }
            if (editingAction.violationDateAndTime) {
                const violationDateTime = new Date(editingAction.violationDateAndTime);
                setViolationDate(violationDateTime);
                setViolationTime(format(violationDateTime, "HH:mm"));
            }
        } else {
            // Reset form for new action
            setFormData({
                id: "",
                timestamp: new Date().toISOString(),
                createdBy: "",
                actionID: "",
                employeeUid: "",
                reportedDateAndTime: "",
                violationDateAndTime: "",
                violationLocationId: "",
                occurrenceLevel: "First Occurrence" as const,
                violations: [{ id: "1", violationTypeId: "", details: "" }],
                disciplinaryActions: [],
                employeeComments: [],
                stage: "Open" as const,
                status: "Raised" as const,
                approved: false,
            });
            setReportedDate(undefined);
            setViolationDate(undefined);
            setReportedTime("");
            setViolationTime("");
        }
        setCurrentStep(1);
    }, [editingAction, isOpen]);

    const handleEmployeeSelect = (employeeUid: string) => {
        setFormData(prev => ({
            ...prev,
            employeeUid: employeeUid,
        }));
        setEmployeeOpen(false);
    };

    const handleReportedDateSelect = (date: Date | undefined) => {
        setReportedDate(date);
        if (date && reportedTime) {
            const [hours, minutes] = reportedTime.split(":");
            const dateTime = new Date(date);
            dateTime.setHours(Number.parseInt(hours), Number.parseInt(minutes));
            setFormData(prev => ({
                ...prev,
                reportedDateAndTime: dateTime.toISOString(),
            }));
        } else if (date) {
            setFormData(prev => ({
                ...prev,
                reportedDateAndTime: date.toISOString(),
            }));
        }
    };

    const handleViolationDateSelect = (date: Date | undefined) => {
        setViolationDate(date);
        if (date && violationTime) {
            const [hours, minutes] = violationTime.split(":");
            const dateTime = new Date(date);
            dateTime.setHours(Number.parseInt(hours), Number.parseInt(minutes));
            setFormData(prev => ({
                ...prev,
                violationDateAndTime: dateTime.toISOString(),
            }));
        } else if (date) {
            setFormData(prev => ({
                ...prev,
                violationDateAndTime: date.toISOString(),
            }));
        }
    };

    const handleReportedTimeChange = (time: string) => {
        setReportedTime(time);
        if (reportedDate && time) {
            const [hours, minutes] = time.split(":");
            const dateTime = new Date(reportedDate);
            dateTime.setHours(Number.parseInt(hours), Number.parseInt(minutes));
            setFormData(prev => ({
                ...prev,
                reportedDateAndTime: dateTime.toISOString(),
            }));
        }
    };

    const handleViolationTimeChange = (time: string) => {
        setViolationTime(time);
        if (violationDate && time) {
            const [hours, minutes] = time.split(":");
            const dateTime = new Date(violationDate);
            dateTime.setHours(Number.parseInt(hours), Number.parseInt(minutes));
            setFormData(prev => ({
                ...prev,
                violationDateAndTime: dateTime.toISOString(),
            }));
        }
    };

    const addViolation = () => {
        const newViolation: ViolationModel = {
            id: String(formData.violations.length + 1),
            violationTypeId: "",
            details: "",
        };
        setFormData(prev => ({
            ...prev,
            violations: [...prev.violations, newViolation],
        }));
    };

    const removeViolation = (index: number) => {
        if (formData.violations.length > 1) {
            setFormData(prev => ({
                ...prev,
                violations: prev.violations.filter((_, i) => i !== index),
            }));
        }
    };

    const updateViolation = (index: number, field: keyof ViolationModel, value: string) => {
        setFormData(prev => ({
            ...prev,
            violations: prev.violations.map((violation, i) =>
                i === index ? { ...violation, [field]: value } : violation,
            ),
        }));
    };

    const addDisciplinaryAction = () => {
        const newAction = {
            id: `DA${Date.now()}`,
            disciplinaryActionId: "",
            details: "",
        };
        setFormData(prev => ({
            ...prev,
            disciplinaryActions: [...(prev.disciplinaryActions || []), newAction],
        }));
    };

    const removeDisciplinaryAction = (index: number) => {
        setFormData(prev => ({
            ...prev,
            disciplinaryActions: prev.disciplinaryActions?.filter((_, i) => i !== index) || [],
        }));
    };

    const updateDisciplinaryAction = (index: number, field: keyof DActionsModel, value: string) => {
        setFormData(prev => ({
            ...prev,
            disciplinaryActions:
                prev.disciplinaryActions?.map((action, i) =>
                    i === index ? { ...action, [field]: value } : action,
                ) || [],
        }));
    };

    const handleNext = () => {
        if (currentStep === 1) {
            setCurrentStep(2);
        } else if (
            currentStep === 2 &&
            (!viewOnly ||
                (viewOnly &&
                    formData.disciplinaryActions &&
                    formData.disciplinaryActions.length > 0))
        ) {
            if (!viewOnly && HRView) {
                setCurrentStep(3);
            } else if (viewOnly) {
                setCurrentStep(3);
            }
        } else if (currentStep === 3) {
            // Handle submit for HR creating/editing
            if (!viewOnly && HRView) {
                handleSubmit();
            }
        }
    };

    const handleBack = () => {
        if (currentStep === 3) {
            setCurrentStep(2);
        } else if (currentStep === 2) {
            setCurrentStep(1);
        }
    };

    const handleSubmit = async () => {
        onSave(formData);

        // Send notification when manager submits DA (HRView is false)
        if (!HRView && !editingAction) {
            const hrManagers = employees.filter(emp => emp.role?.includes("HR Manager"));
            const employee = employees.find(emp => emp.uid === formData.employeeUid);

            if (hrManagers.length > 0 && employee) {
                await sendNotification({
                    users: hrManagers.map(hr => ({
                        uid: hr.uid,
                        email: hr.companyEmail || hr.personalEmail || "",
                        telegramChatID: hr.telegramChatID || "",
                        recipientType: "hr" as const,
                    })),
                    channels: ["inapp", "telegram"],
                    messageKey: "MANAGER_DA_SUBMITTED",
                    payload: {
                        managerName: userData?.firstName + " " + userData?.surname || "Manager",
                        employeeName: employee.firstName + " " + employee.surname,
                    },
                    getCustomMessage: () => ({
                        inapp: `${userData?.firstName + " " + userData?.surname || "Manager"} has initiated a disciplinary action procedure against ${employee.firstName + " " + employee.surname}.`,
                        telegram: `${userData?.firstName + " " + userData?.surname || "Manager"} has initiated a disciplinary action procedure against ${employee.firstName + " " + employee.surname}.`,
                    }),
                });
            }
        }
    };

    const renderStep1 = () => (
        <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="timestamp" className="text-sm font-medium">
                        <span className="text-red-500">*</span> Timestamp:
                    </Label>
                    {viewOnly ? (
                        <Input
                            value={format(new Date(formData.timestamp), "MMMM dd, yyyy hh:mm a")}
                            readOnly
                            className="bg-gray-50"
                        />
                    ) : (
                        <Input
                            value={format(new Date(formData.timestamp), "MMMM dd, yyyy hh:mm a")}
                            readOnly
                            className="bg-gray-50"
                        />
                    )}
                </div>

                <div className="space-y-2">
                    <Label className="text-sm font-medium">
                        <span className="text-red-500">*</span> Employee:
                    </Label>
                    {viewOnly ? (
                        <Input
                            value={(() => {
                                const employee = availableEmployees.find(
                                    emp => emp.uid === formData.employeeUid,
                                );
                                return employee
                                    ? `${employee.firstName} ${employee.surname}`
                                    : "Unknown Employee";
                            })()}
                            readOnly
                            className="bg-gray-50"
                        />
                    ) : (
                        <Popover open={employeeOpen} onOpenChange={setEmployeeOpen}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={employeeOpen}
                                    className="w-full justify-between bg-transparent"
                                >
                                    {(() => {
                                        const employee = availableEmployees.find(
                                            emp => emp.uid === formData.employeeUid,
                                        );
                                        return employee
                                            ? `${employee.firstName} ${employee.surname}`
                                            : "Select employee...";
                                    })()}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                                <Command>
                                    <CommandInput placeholder="Search employee..." />
                                    <CommandList>
                                        <CommandEmpty>No employee found.</CommandEmpty>
                                        <CommandGroup>
                                            {availableEmployees.map(employee => (
                                                <CommandItem
                                                    key={employee.uid}
                                                    value={employee.uid}
                                                    onSelect={() =>
                                                        handleEmployeeSelect(employee.uid)
                                                    }
                                                >
                                                    <Check
                                                        className={cn(
                                                            "mr-2 h-4 w-4",
                                                            formData.employeeUid === employee.uid
                                                                ? "opacity-100"
                                                                : "opacity-0",
                                                        )}
                                                    />
                                                    {employee.firstName} {employee.surname} (
                                                    {employee.employeeID})
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label className="text-sm font-medium">
                        <span className="text-red-500">*</span> Reported Date And Time:
                    </Label>
                    {viewOnly ? (
                        <Input
                            value={
                                reportedDate ? format(reportedDate, "MMMM dd, yyyy hh:mm a") : ""
                            }
                            readOnly
                            className="bg-gray-50"
                        />
                    ) : (
                        <div className="flex gap-2">
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className={cn(
                                            "flex-1 justify-start text-left font-normal",
                                            !reportedDate && "text-muted-foreground",
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {reportedDate
                                            ? format(reportedDate, "MMMM dd, yyyy")
                                            : "Select date"}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <Calendar
                                        mode="single"
                                        selected={reportedDate}
                                        onSelect={handleReportedDateSelect}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                            <Input
                                type="time"
                                value={reportedTime}
                                onChange={e => handleReportedTimeChange(e.target.value)}
                                className="w-32"
                            />
                        </div>
                    )}
                </div>

                <div className="space-y-2">
                    <Label className="text-sm font-medium">
                        <span className="text-red-500">*</span> Violation Date And Time:
                    </Label>
                    {viewOnly ? (
                        <Input
                            value={
                                violationDate ? format(violationDate, "MMMM dd, yyyy hh:mm a") : ""
                            }
                            readOnly
                            className="bg-gray-50"
                        />
                    ) : (
                        <div className="flex gap-2">
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className={cn(
                                            "flex-1 justify-start text-left font-normal",
                                            !violationDate && "text-muted-foreground",
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {violationDate
                                            ? format(violationDate, "MMMM dd, yyyy")
                                            : "Select date"}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <Calendar
                                        mode="single"
                                        selected={violationDate}
                                        onSelect={handleViolationDateSelect}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                            <Input
                                type="time"
                                value={violationTime}
                                onChange={e => handleViolationTimeChange(e.target.value)}
                                className="w-32"
                            />
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label className="text-sm font-medium">
                        <span className="text-red-500">*</span> Violation Location:
                    </Label>
                    {viewOnly ? (
                        <Input
                            value={(() => {
                                const location = hrSettings.locations.find(
                                    loc => loc.id === formData.violationLocationId,
                                );
                                return location ? location.name : formData.violationLocationId;
                            })()}
                            readOnly
                            className="bg-gray-50"
                        />
                    ) : (
                        <Select
                            value={formData.violationLocationId}
                            onValueChange={value =>
                                setFormData(prev => ({ ...prev, violationLocationId: value }))
                            }
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select location" />
                            </SelectTrigger>
                            <SelectContent>
                                {hrSettings.locations.map(location => (
                                    <SelectItem key={location.id} value={location.id}>
                                        {location.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
                </div>

                <div className="space-y-2">
                    <Label className="text-sm font-medium">
                        <span className="text-red-500">*</span> Occurrence Level:
                    </Label>
                    {viewOnly ? (
                        <Input value={formData.occurrenceLevel} readOnly className="bg-gray-50" />
                    ) : (
                        <Select
                            value={formData.occurrenceLevel}
                            onValueChange={(
                                value:
                                    | "First Occurrence"
                                    | "Second Occurrence"
                                    | "Third Occurrence",
                            ) => setFormData(prev => ({ ...prev, occurrenceLevel: value }))}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="First Occurrence">First Occurrence</SelectItem>
                                <SelectItem value="Second Occurrence">Second Occurrence</SelectItem>
                                <SelectItem value="Third Occurrence">Third Occurrence</SelectItem>
                            </SelectContent>
                        </Select>
                    )}
                </div>
            </div>

            <div className="flex justify-end">
                <Button onClick={handleNext}>Next</Button>
            </div>
        </div>
    );

    const renderStep2 = () => (
        <div className="space-y-6">
            {formData.violations.map((violation, index) => (
                <div key={violation.id} className="border rounded-lg p-4 space-y-4">
                    <div className="flex justify-between items-center">
                        <h4 className="font-medium">Violation {index + 1}</h4>
                        {!viewOnly && formData.violations.length > 1 && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeViolation(index)}
                            >
                                <Minus className="h-4 w-4" />
                            </Button>
                        )}
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-sm font-medium">
                                <span className="text-red-500">*</span> Violation Type:
                            </Label>
                            {viewOnly ? (
                                <Input
                                    value={(() => {
                                        const violationType = hrSettings.violationTypes.find(
                                            type => type.id === violation.violationTypeId,
                                        );
                                        return violationType
                                            ? violationType.name
                                            : violation.violationTypeId;
                                    })()}
                                    readOnly
                                    className="bg-gray-50"
                                />
                            ) : (
                                <Select
                                    value={violation.violationTypeId}
                                    onValueChange={value =>
                                        updateViolation(index, "violationTypeId", value)
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select violation type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {hrSettings.violationTypes.map(type => (
                                            <SelectItem key={type.id} value={type.id}>
                                                {type.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label className="text-sm font-medium">
                                <span className="text-red-500">*</span> Violation Details:
                            </Label>
                            <Textarea
                                value={violation.details}
                                onChange={e => updateViolation(index, "details", e.target.value)}
                                placeholder="Describe the violation in detail..."
                                rows={4}
                                readOnly={viewOnly}
                                className={viewOnly ? "bg-gray-50" : ""}
                            />
                        </div>
                    </div>
                </div>
            ))}

            {!viewOnly && (
                <Button
                    variant="outline"
                    onClick={addViolation}
                    className="w-full border-dashed bg-transparent"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Violation
                </Button>
            )}

            <div className="flex justify-between">
                <Button variant="outline" onClick={handleBack}>
                    Back
                </Button>
                {viewOnly ? (
                    formData.disciplinaryActions && formData.disciplinaryActions.length > 0 ? (
                        <Button onClick={handleNext}>Next</Button>
                    ) : (
                        <Button onClick={onClose}>Close</Button>
                    )
                ) : HRView ? (
                    <Button onClick={handleNext}>Next</Button>
                ) : (
                    <Button onClick={handleSubmit}>Submit</Button>
                )}
            </div>
        </div>
    );

    const renderStep3 = () => {
        const isHREditing = !viewOnly && HRView;

        return (
            <div className="space-y-6">
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Disciplinary Actions</h3>
                    {formData.disciplinaryActions && formData.disciplinaryActions.length > 0 ? (
                        formData.disciplinaryActions.map((action, index) => (
                            <div key={action.id} className="border rounded-lg p-4 space-y-4">
                                <div className="flex justify-between items-center">
                                    <h4 className="font-medium">Action {index + 1}</h4>
                                    {isHREditing && formData.disciplinaryActions!.length > 0 && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => removeDisciplinaryAction(index)}
                                        >
                                            <Minus className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium">
                                            <span className="text-red-500">*</span> Disciplinary
                                            Action Type:
                                        </Label>
                                        {isHREditing ? (
                                            <Select
                                                value={action.disciplinaryActionId}
                                                onValueChange={value =>
                                                    updateDisciplinaryAction(
                                                        index,
                                                        "disciplinaryActionId",
                                                        value,
                                                    )
                                                }
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select disciplinary action" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {hrSettings.disciplinaryTypes.map(type => (
                                                        <SelectItem key={type.id} value={type.id}>
                                                            {type.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        ) : (
                                            <Input
                                                value={(() => {
                                                    const disciplinaryType =
                                                        hrSettings.disciplinaryTypes.find(
                                                            type =>
                                                                type.id ===
                                                                action.disciplinaryActionId,
                                                        );
                                                    return disciplinaryType
                                                        ? disciplinaryType.name
                                                        : action.disciplinaryActionId;
                                                })()}
                                                readOnly
                                                className="bg-gray-50"
                                            />
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium">
                                            <span className="text-red-500">*</span> Details:
                                        </Label>
                                        <Textarea
                                            value={action.details}
                                            onChange={e =>
                                                isHREditing &&
                                                updateDisciplinaryAction(
                                                    index,
                                                    "details",
                                                    e.target.value,
                                                )
                                            }
                                            placeholder="Describe the disciplinary action in detail..."
                                            rows={3}
                                            readOnly={!isHREditing}
                                            className={!isHREditing ? "bg-gray-50" : ""}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-gray-500 dark:text-muted-foreground">
                            No disciplinary actions specified.
                        </p>
                    )}

                    {isHREditing && (
                        <Button
                            variant="outline"
                            onClick={addDisciplinaryAction}
                            className="w-full border-dashed bg-transparent"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Disciplinary Action
                        </Button>
                    )}
                </div>

                <div className="flex justify-between">
                    <Button variant="outline" onClick={handleBack}>
                        Back
                    </Button>
                    {viewOnly ? (
                        <Button variant="outline" onClick={onClose}>
                            Close
                        </Button>
                    ) : isHREditing ? (
                        <Button onClick={handleSubmit}>Submit</Button>
                    ) : (
                        <Button variant="outline" onClick={onClose}>
                            Close
                        </Button>
                    )}
                </div>
            </div>
        );
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center justify-between">
                        <span>
                            {viewOnly ? "View" : editingAction ? "Edit" : "Add"} Disciplinary Action
                        </span>
                        <div className="flex items-center gap-4">
                            <div
                                className={`flex items-center gap-2 ${currentStep === 1 ? "text-blue-600" : "text-gray-400"}`}
                            >
                                <div
                                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                                        currentStep === 1
                                            ? "bg-blue-600 text-white"
                                            : "bg-gray-200 text-gray-600"
                                    }`}
                                >
                                    1
                                </div>
                                <span className="font-medium">General Information</span>
                            </div>
                            <div className="w-16 h-px bg-gray-300"></div>
                            <div
                                className={`flex items-center gap-2 ${currentStep === 2 ? "text-blue-600" : "text-gray-400"}`}
                            >
                                <div
                                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                                        currentStep === 2
                                            ? "bg-blue-600 text-white"
                                            : "bg-gray-200 text-gray-600"
                                    }`}
                                >
                                    2
                                </div>
                                <span className="font-medium">Violation Details</span>
                            </div>
                            {((viewOnly &&
                                formData.disciplinaryActions &&
                                formData.disciplinaryActions.length > 0) ||
                                (!viewOnly && HRView)) && (
                                <>
                                    <div className="w-16 h-px bg-gray-300"></div>
                                    <div
                                        className={`flex items-center gap-2 ${currentStep === 3 ? "text-blue-600" : "text-gray-400"}`}
                                    >
                                        <div
                                            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                                                currentStep === 3
                                                    ? "bg-blue-600 text-white"
                                                    : "bg-gray-200 text-gray-600"
                                            }`}
                                        >
                                            3
                                        </div>
                                        <span className="font-medium">Disciplinary Actions</span>
                                    </div>
                                </>
                            )}
                        </div>
                    </DialogTitle>
                </DialogHeader>

                <div className="mt-6">
                    {currentStep === 1
                        ? renderStep1()
                        : currentStep === 2
                            ? renderStep2()
                            : renderStep3()}
                </div>
            </DialogContent>
        </Dialog>
    );
}
