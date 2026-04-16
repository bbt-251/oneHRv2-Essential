"use client";

import type React from "react";

import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    User,
    Upload,
    Edit,
    Save,
    Lock,
    FileText,
    Camera,
    PenTool,
    Eye,
    EyeOff,
    UserCheck,
    Trash2,
} from "lucide-react";
import {
    createEmployeeInfoChangeRequest,
    deleteEmployeeInfoChangeRequest,
} from "@/lib/backend/api/employee-info-change-request-service";
import { EmployeeInfoChangeRequestModel } from "@/lib/models/employee-info-change-request";
import { useAuth } from "@/context/authContext";
import { useFirestore } from "@/context/firestore-context";
import { toast } from "sonner";
import { ChangeRequestDetailModal } from "@/components/hr-manager/change-requests/modals/change-request-detail-modal";
import { usePasswordReset } from "@/hooks/auth/usePasswordReset";
import uploadFile from "@/lib/backend/firebase/upload/uploadFile";
import { updateEmployee } from "@/lib/backend/api/employee-management/employee-management-service";
import getFullName from "@/lib/util/getEmployeeFullName";
import { EmployeeModel } from "@/lib/models/employee";
import { useToast } from "@/context/toastContext";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

interface EmployeeInfoModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface InputFieldProps {
    label: string;
    field: string;
    value: string;
    type?: string;
    section: string;
    placeholder?: string;
    options?: { value: string; label: string }[] | null;
    onChange?: (field: string, value: string) => void;
    showPassword?: boolean;
}

const InputField = ({
    label,
    field,
    value,
    type = "text",
    section,
    placeholder = "",
    options = null,
    onChange,
    showPassword = false,
}: InputFieldProps) => (
    <div className="space-y-2">
        <Label className="text-sm font-medium text-brand-700 dark:text-brand-300">{label}</Label>
        {onChange ? (
            options ? (
                <Select value={value} onValueChange={val => onChange(field, val)}>
                    <SelectTrigger className="border-accent-300 focus:border-brand-500 bg-white dark:bg-input">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {options.map(option => (
                            <SelectItem key={option.value} value={option.value}>
                                {option.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            ) : (
                <Input
                    type={type}
                    value={value}
                    onChange={e => onChange(field, e.target.value)}
                    placeholder={placeholder}
                    className="border-2 border-accent-400 focus:border-brand-500 bg-white dark:bg-input dark:border-accent-600"
                />
            )
        ) : (
            <div className="p-3 bg-white dark:bg-card rounded-lg border-2 border-accent-400 dark:border-accent-600 min-h-[42px] flex items-center">
                <span className="text-brand-800 dark:text-brand-200 font-medium">
                    {type === "password" && !showPassword ? "••••••••" : value || "Not specified"}
                </span>
            </div>
        )}
    </div>
);

export function EmployeeInfoModal({ isOpen, onClose }: EmployeeInfoModalProps) {
    const { user, userData } = useAuth();
    const { employees, hrSettings, changeRequests: allChangeRequests } = useFirestore();
    const { sendResetEmail, isLoading: resetLoading } = usePasswordReset();
    const { showToast } = useToast();
    const levelOfEducationsData = hrSettings.levelOfEducations;
    const departments = hrSettings.departmentSettings;
    const positions = hrSettings.positions;
    const [activeTab, setActiveTab] = useState("account");
    const [isEditing, setIsEditing] = useState<Record<string, boolean>>({});
    const [showPassword, setShowPassword] = useState(false);
    const [isChangeRequestModalOpen, setIsChangeRequestModalOpen] = useState(false);
    const [changeRequestStep, setChangeRequestStep] = useState(1);
    const [isUploadingSignature, setIsUploadingSignature] = useState(false);
    const [isUploadingProfilePicture, setIsUploadingProfilePicture] = useState(false);
    const [selectedChangeRequest, setSelectedChangeRequest] =
        useState<EmployeeInfoChangeRequestModel | null>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [changeRequestData, setChangeRequestData] = useState({
        // Employee Information
        firstName: "",
        middleName: "",
        surname: "",
        birthDate: "",
        birthPlace: "",
        levelOfEducation: "",
        yearsOfExperience: "",
        maritalStatus: "",
        personalPhone: "",
        personalEmail: "",
        bankAccount: "",
        tinNumber: "",

        // Emergency Contact Information
        emergencyContactName: "",
        relationshipToEmployee: "",
        phoneNumber1: "",
        phoneNumber2: "",
        emailAddress1: "",
        emailAddress2: "",
        physicalAddress1: "",
        physicalAddress2: "",
    });

    // Filter change requests for current user
    const changeRequests = useMemo(() => {
        if (!user?.uid) return [];
        return allChangeRequests.filter(req => req.uid === user.uid);
    }, [allChangeRequests, user?.uid]);

    // Get current employee data
    const currentEmployee = useMemo(() => {
        if (!user?.uid || !employees.length) return null;
        return employees.find(emp => emp.uid === user.uid) || null;
    }, [user?.uid, employees]);

    // Create formData from employee data
    const formData = useMemo(() => {
        if (!currentEmployee) {
            return {
                // Account Information
                fullname: "",
                employeeId: "",
                password: "••••••••",

                // Employee Information
                firstName: "",
                middleName: "",
                surname: "",
                birthDate: "",
                birthPlace: "",
                levelOfEducation: "",
                yearsOfExperience: "",
                maritalStatus: "",
                personalPhone: "",
                personalEmail: "",
                bankAccount: "",
                tinNumber: "",

                // Contract Information
                contractType: "",
                contractStatus: "",
                contractStartDate: "",
                contractTerminationDate: "",
                probationEndDate: "",
                lastDateOfProbation: "",
                reasonOfLeaving: "",
                salary: "",
                eligibleLeaveDays: "",
                companyEmail: "",
                companyPhone: "",

                // Position Information
                employmentPosition: "",
                positionLevel: "",
                sectionDivision: "",
                department: "",
                workingLocation: "",
                homeLocation: "",
                role: "",
                reportees: "",
                reportingLineManager: "",
                reportingLineManagerPosition: "",
                gradeLevel: "",
                step: "",
                shiftType: "",

                // Emergency Contact Information
                emergencyContactName: "",
                relationshipToEmployee: "",
                phoneNumber1: "",
                phoneNumber2: "",
                emailAddress1: "",
                emailAddress2: "",
                physicalAddress1: "",
                physicalAddress2: "",
            };
        }

        return {
            // Account Information
            fullname:
                `${currentEmployee.firstName} ${currentEmployee.middleName || ""} ${currentEmployee.surname}`.trim(),
            employeeId: currentEmployee.employeeID,
            password: "••••••••",

            // Employee Information
            firstName: currentEmployee.firstName,
            middleName: currentEmployee.middleName || "",
            surname: currentEmployee.surname,
            birthDate: currentEmployee.birthDate,
            birthPlace: currentEmployee.birthPlace,
            levelOfEducation: currentEmployee.levelOfEducation,
            yearsOfExperience: currentEmployee.yearsOfExperience,
            maritalStatus: currentEmployee.maritalStatus,
            personalPhone: currentEmployee.personalPhoneNumber,
            personalEmail: currentEmployee.personalEmail,
            bankAccount: currentEmployee.bankAccount,
            tinNumber: currentEmployee.tinNumber,

            // Contract Information
            contractType: currentEmployee.contractType,
            contractStatus: currentEmployee.contractStatus,
            contractStartDate: currentEmployee.contractStartingDate,
            contractTerminationDate: currentEmployee.contractTerminationDate || "",
            probationEndDate: currentEmployee.probationPeriodEndDate,
            lastDateOfProbation: currentEmployee.lastDateOfProbation || "",
            reasonOfLeaving: currentEmployee.reasonOfLeaving || "",
            salary: currentEmployee.salary?.toString() || "",
            eligibleLeaveDays: currentEmployee.eligibleLeaveDays?.toString() || "",
            companyEmail: currentEmployee.companyEmail,
            companyPhone: currentEmployee.companyPhoneNumber,

            // Position Information
            employmentPosition: currentEmployee.employmentPosition,
            positionLevel: currentEmployee.positionLevel,
            sectionDivision: currentEmployee.section,
            department: currentEmployee.department,
            workingLocation: currentEmployee.workingLocation,
            homeLocation: currentEmployee.homeLocation,
            role: currentEmployee?.role?.join(", ") ?? "",
            reportees: currentEmployee.reportees?.join(", ") || "",
            reportingLineManager: currentEmployee.reportingLineManager,
            reportingLineManagerPosition: currentEmployee.reportingLineManagerPosition,
            gradeLevel: currentEmployee.gradeLevel,
            step: currentEmployee.step?.toString() || "",
            shiftType: currentEmployee.shiftType,

            // Emergency Contact Information
            emergencyContactName: currentEmployee.emergencyContactName,
            relationshipToEmployee: currentEmployee.relationshipToEmployee,
            phoneNumber1: currentEmployee.phoneNumber1,
            phoneNumber2: currentEmployee.phoneNumber2 || "",
            emailAddress1: currentEmployee.emailAddress1,
            emailAddress2: currentEmployee.emailAddress2 || "",
            physicalAddress1: currentEmployee.physicalAddress1,
            physicalAddress2: currentEmployee.physicalAddress2 || "",
        };
    }, [currentEmployee]);

    const profileImage = useMemo(() => {
        return currentEmployee?.profilePicture || "";
    }, [currentEmployee?.profilePicture]);

    // Dropdown options from hrSettings
    const levelOfEducationOptions = useMemo(() => {
        return hrSettings.levelOfEducations
            .filter(item => item.active)
            .map(item => ({ value: item.id, label: item.name }));
    }, [hrSettings.levelOfEducations]);

    const yearsOfExperienceOptions = useMemo(() => {
        return hrSettings.yearsOfExperiences
            .filter(item => item.active)
            .map(item => ({ value: item.id, label: item.name }));
    }, [hrSettings.yearsOfExperiences]);

    const maritalStatusOptions = useMemo(() => {
        return hrSettings.maritalStatuses
            .filter(item => item.active)
            .map(item => ({ value: item.id, label: item.name }));
    }, [hrSettings.maritalStatuses]);

    const contractTypeOptions = useMemo(() => {
        return hrSettings.contractTypes
            .filter(item => item.active === "Yes")
            .map(item => ({ value: item.id, label: item.name }));
    }, [hrSettings.contractTypes]);

    const employmentPositionOptions = useMemo(() => {
        return hrSettings.positions
            .filter(item => item.active === "Yes")
            .map(item => ({ value: item.id, label: item.name }));
    }, [hrSettings.positions]);

    const departmentOptions = useMemo(() => {
        return hrSettings.departmentSettings
            .filter(item => item.active)
            .map(item => ({ value: item.id, label: item.name }));
    }, [hrSettings.departmentSettings]);

    const sectionOptions = useMemo(() => {
        return hrSettings.sectionSettings
            .filter(item => item.active)
            .map(item => ({ value: item.id, label: item.name }));
    }, [hrSettings.sectionSettings]);

    const workingLocationOptions = useMemo(() => {
        return hrSettings.locations
            .filter(item => item.active === "Yes")
            .map(item => ({ value: item.id, label: item.name }));
    }, [hrSettings.locations]);

    const gradeLevelOptions = useMemo(() => {
        return hrSettings.grades
            .filter(item => item.active === "Yes")
            .map(item => ({ value: item.id, label: item.grade }));
    }, [hrSettings.grades]);

    const shiftTypeOptions = useMemo(() => {
        return hrSettings.shiftTypes
            .filter(item => item.active === "Yes")
            .map(item => ({ value: item.id, label: item.name }));
    }, [hrSettings.shiftTypes]);

    const handleOpenChangeRequestModal = () => {
        // Pre-populate with current data, ensuring all fields have default values
        setChangeRequestData({
            firstName: formData.firstName || "",
            middleName: formData.middleName || "",
            surname: formData.surname || "",
            birthDate: formData.birthDate || "",
            birthPlace: formData.birthPlace || "",
            levelOfEducation: formData.levelOfEducation || "",
            yearsOfExperience: formData.yearsOfExperience || "",
            maritalStatus: formData.maritalStatus || "",
            personalPhone: formData.personalPhone || "",
            personalEmail: formData.personalEmail || "",
            bankAccount: formData.bankAccount || "",
            tinNumber: formData.tinNumber || "",
            emergencyContactName: formData.emergencyContactName || "",
            relationshipToEmployee: formData.relationshipToEmployee || "",
            phoneNumber1: formData.phoneNumber1 || "",
            phoneNumber2: formData.phoneNumber2 || "",
            emailAddress1: formData.emailAddress1 || "",
            emailAddress2: formData.emailAddress2 || "",
            physicalAddress1: formData.physicalAddress1 || "",
            physicalAddress2: formData.physicalAddress2 || "",
        });
        setIsChangeRequestModalOpen(true);
    };

    const handleChangeRequestSubmit = async () => {
        if (!user) return;

        const requestData = {
            ...changeRequestData,
            employeeId: formData.employeeId,
            uid: user.uid,
            timestamp: new Date().toISOString(),
            requestStatus: "pending" as const,
        };

        const success = await createEmployeeInfoChangeRequest(requestData);
        if (success) {
            toast.success("Change request submitted successfully");
            setIsChangeRequestModalOpen(false);
            setChangeRequestStep(1);
            // Reset form data
            setChangeRequestData({
                firstName: "",
                middleName: "",
                surname: "",
                birthDate: "",
                birthPlace: "",
                levelOfEducation: "",
                yearsOfExperience: "",
                maritalStatus: "",
                personalPhone: "",
                personalEmail: "",
                bankAccount: "",
                tinNumber: "",
                emergencyContactName: "",
                relationshipToEmployee: "",
                phoneNumber1: "",
                phoneNumber2: "",
                emailAddress1: "",
                emailAddress2: "",
                physicalAddress1: "",
                physicalAddress2: "",
            });
        } else {
            toast.error("Failed to submit change request");
        }
    };

    const handleNextStep = () => {
        setChangeRequestStep(2);
    };

    const handlePreviousStep = () => {
        setChangeRequestStep(1);
    };

    const hasPendingRequest = changeRequests.some(req => req.requestStatus === "pending");

    const handleViewChangeRequest = (request: EmployeeInfoChangeRequestModel) => {
        setSelectedChangeRequest(request);
        setIsDetailModalOpen(true);
    };

    const handleDeleteChangeRequest = async (requestId: string) => {
        const success = await deleteEmployeeInfoChangeRequest(requestId);
        if (success) {
            toast.success("Change request deleted successfully");
        } else {
            toast.error("Failed to delete change request");
        }
    };

    const handleExportInformation = async () => {
        const workbook = new ExcelJS.Workbook();
        workbook.creator = "OneHR System";
        workbook.created = new Date();

        // Employee Information Sheet
        const employeeSheet = workbook.addWorksheet("Employee Information");
        employeeSheet.columns = [
            { header: "Field", key: "field", width: 30 },
            { header: "Value", key: "value", width: 40 },
        ];

        employeeSheet.addRows([
            { field: "Full Name", value: formData.fullname },
            { field: "Employee ID", value: formData.employeeId },
            { field: "First Name", value: formData.firstName },
            { field: "Middle Name", value: formData.middleName },
            { field: "Surname", value: formData.surname },
            { field: "Birth Date", value: formData.birthDate },
            { field: "Birth Place", value: formData.birthPlace },
            {
                field: "Level of Education",
                value:
                    levelOfEducationOptions.find(l => l.value === formData.levelOfEducation)
                        ?.label || formData.levelOfEducation,
            },
            {
                field: "Years of Experience",
                value:
                    yearsOfExperienceOptions.find(l => l.value === formData.yearsOfExperience)
                        ?.label || formData.yearsOfExperience,
            },
            {
                field: "Marital Status",
                value:
                    maritalStatusOptions.find(l => l.value === formData.maritalStatus)?.label ||
                    formData.maritalStatus,
            },
            { field: "Personal Phone", value: formData.personalPhone },
            { field: "Personal Email", value: formData.personalEmail },
            { field: "Bank Account", value: formData.bankAccount },
            { field: "TIN Number", value: formData.tinNumber },
        ]);

        // Contract Information Sheet
        const contractSheet = workbook.addWorksheet("Contract Information");
        contractSheet.columns = [
            { header: "Field", key: "field", width: 30 },
            { header: "Value", key: "value", width: 40 },
        ];

        contractSheet.addRows([
            {
                field: "Contract Type",
                value:
                    contractTypeOptions.find(l => l.value === formData.contractType)?.label ||
                    formData.contractType,
            },
            { field: "Contract Status", value: formData.contractStatus },
            { field: "Contract Start Date", value: formData.contractStartDate },
            { field: "Contract Termination Date", value: formData.contractTerminationDate },
            { field: "Probation End Date", value: formData.probationEndDate },
            { field: "Last Date of Probation", value: formData.lastDateOfProbation },
            { field: "Reason of Leaving", value: formData.reasonOfLeaving },
            { field: "Salary", value: formData.salary },
            { field: "Eligible Leave Days", value: formData.eligibleLeaveDays },
            { field: "Company Email", value: formData.companyEmail },
            { field: "Company Phone", value: formData.companyPhone },
        ]);

        // Position Information Sheet
        const positionSheet = workbook.addWorksheet("Position Information");
        positionSheet.columns = [
            { header: "Field", key: "field", width: 30 },
            { header: "Value", key: "value", width: 40 },
        ];

        positionSheet.addRows([
            {
                field: "Employment Position",
                value:
                    employmentPositionOptions.find(l => l.value === formData.employmentPosition)
                        ?.label || formData.employmentPosition,
            },
            { field: "Position Level", value: formData.positionLevel },
            {
                field: "Section/Division",
                value:
                    sectionOptions.find(l => l.value === formData.sectionDivision)?.label ||
                    formData.sectionDivision,
            },
            {
                field: "Department",
                value:
                    departmentOptions.find(l => l.value === formData.department)?.label ||
                    formData.department,
            },
            {
                field: "Working Location",
                value:
                    workingLocationOptions.find(l => l.value === formData.workingLocation)?.label ||
                    formData.workingLocation,
            },
            { field: "Home Location", value: formData.homeLocation },
            {
                field: "Reporting Line Manager",
                value: getFullName(
                    employees.find(e => e.uid == formData.reportingLineManager) ??
                        ({} as EmployeeModel),
                ),
            },
            {
                field: "Reporting Line Manager Position",
                value:
                    positions.find(p => p.id === formData.reportingLineManagerPosition)?.name ||
                    formData.reportingLineManagerPosition,
            },
            {
                field: "Grade Level",
                value:
                    gradeLevelOptions.find(l => l.value === formData.gradeLevel)?.label ||
                    formData.gradeLevel,
            },
            { field: "Step", value: formData.step },
            {
                field: "Shift Type",
                value:
                    shiftTypeOptions.find(l => l.value === formData.shiftType)?.label ||
                    formData.shiftType,
            },
        ]);

        // Emergency Contact Information Sheet
        const emergencySheet = workbook.addWorksheet("Emergency Contact");
        emergencySheet.columns = [
            { header: "Field", key: "field", width: 30 },
            { header: "Value", key: "value", width: 40 },
        ];

        emergencySheet.addRows([
            { field: "Emergency Contact Name", value: formData.emergencyContactName },
            { field: "Relationship to Employee", value: formData.relationshipToEmployee },
            { field: "Phone Number 1", value: formData.phoneNumber1 },
            { field: "Phone Number 2", value: formData.phoneNumber2 },
            { field: "Email Address 1", value: formData.emailAddress1 },
            { field: "Email Address 2", value: formData.emailAddress2 },
            { field: "Physical Address 1", value: formData.physicalAddress1 },
            { field: "Physical Address 2", value: formData.physicalAddress2 },
        ]);

        // Style headers
        workbook.eachSheet(sheet => {
            const headerRow = sheet.getRow(1);
            headerRow.font = { bold: true };
            headerRow.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "FFE6E6FA" },
            };
        });

        // Generate and download file
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], {
            type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });
        saveAs(
            blob,
            `Employee_Information_${formData.fullname}_${new Date().toISOString().split("T")[0]}.xlsx`,
        );

        toast.success("Employee information exported successfully");
    };

    const handleSignatureUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !user?.uid || !currentEmployee) return;

        setIsUploadingSignature(true);
        try {
            const uploadUrl = await uploadFile(file, "signatures");
            if (uploadUrl) {
                const success = await updateEmployee({
                    id: currentEmployee.id,
                    signature: uploadUrl,
                });
                if (success) {
                    showToast("Signature updated successfully", "Success", "success");
                } else {
                    showToast("Error uploading", "Error", "error");
                }
            } else {
                showToast("Error uploading", "Error", "error");
            }
        } catch (error) {
            console.error("Signature upload error:", error);
            showToast("Error uploading", "Error", "error");
        } finally {
            setIsUploadingSignature(false);
        }
    };

    const handleProfilePictureUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !user?.uid || !currentEmployee) return;

        // Check if file is an image
        if (!file.type.startsWith("image/")) {
            showToast("Please select an image file", "Error", "error");
            return;
        }

        setIsUploadingProfilePicture(true);
        try {
            const uploadUrl = await uploadFile(file, "profile-pictures");
            if (uploadUrl) {
                const success = await updateEmployee({
                    id: currentEmployee.id,
                    profilePicture: uploadUrl,
                });
                if (success) {
                    showToast("Profile picture updated successfully", "Success", "success");
                } else {
                    showToast("Error uploading profile picture", "Error", "error");
                }
            } else {
                showToast("Error uploading profile picture", "Error", "error");
            }
        } catch (error) {
            console.error("Profile picture upload error:", error);
            showToast("Error uploading profile picture", "Error", "error");
        } finally {
            setIsUploadingProfilePicture(false);
        }
    };

    const handleForgotPassword = async () => {
        if (!userData?.personalEmail && !userData?.companyEmail) {
            toast.error("No email address found");
            return;
        }

        const email = userData.personalEmail || userData.companyEmail;
        const response = await sendResetEmail({ email });

        if (response.success) {
            showToast("Password reset email sent", "Success", "success");
        } else {
            showToast("Error sending reset email", "Error", "error");
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-6xl h-[95vh] flex flex-col overflow-y-auto">
                <DialogHeader className="pb-6 flex-shrink-0">
                    <DialogTitle className="text-2xl font-bold text-brand-800 dark:text-brand-200 flex items-center gap-3">
                        <div className="p-2 bg-accent-100 rounded-xl dark:bg-accent-900/30">
                            <User className="h-6 w-6 text-accent-600 dark:text-accent-400" />
                        </div>
                        My Information
                    </DialogTitle>
                    {changeRequests.length > 0 && (
                        <div className="mt-4 p-4 max-h-[7rem] overflow-auto bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                            <h3 className="text-sm font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
                                Requested Changes
                            </h3>
                            {changeRequests.map(request => (
                                <div
                                    key={request.id}
                                    className="flex items-center justify-between text-sm text-yellow-700 dark:text-yellow-300 cursor-pointer hover:bg-yellow-100 dark:hover:bg-yellow-800/30 p-2 rounded transition-colors"
                                    onClick={() => handleViewChangeRequest(request)}
                                >
                                    <div>
                                        <span className="font-medium">Status:</span>{" "}
                                        {request.requestStatus}
                                        <span className="ml-4 font-medium">Submitted:</span>{" "}
                                        {new Date(request.timestamp).toLocaleDateString()}
                                    </div>
                                    {request.requestStatus === "pending" && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={e => {
                                                e.stopPropagation();
                                                handleDeleteChangeRequest(request.id);
                                            }}
                                            className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </DialogHeader>

                <Tabs
                    value={activeTab}
                    onValueChange={setActiveTab}
                    className="flex flex-col flex-1"
                >
                    <TabsList className="grid w-full grid-cols-5 bg-accent-100 dark:bg-accent-900/30 p-1 rounded-lg flex-shrink-0 mb-6">
                        <TabsTrigger
                            value="account"
                            className="text-sm data-[state=active]:bg-white data-[state=active]:text-brand-800 data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-accent-300 rounded-md transition-all"
                        >
                            Account
                        </TabsTrigger>
                        <TabsTrigger
                            value="employee"
                            className="text-sm data-[state=active]:bg-white data-[state=active]:text-brand-800 data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-accent-300 rounded-md transition-all"
                        >
                            Employee
                        </TabsTrigger>
                        <TabsTrigger
                            value="contract"
                            className="text-sm data-[state=active]:bg-white data-[state=active]:text-brand-800 data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-accent-300 rounded-md transition-all"
                        >
                            Contract
                        </TabsTrigger>
                        <TabsTrigger
                            value="position"
                            className="text-sm data-[state=active]:bg-white data-[state=active]:text-brand-800 data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-accent-300 rounded-md transition-all"
                        >
                            Position
                        </TabsTrigger>
                        <TabsTrigger
                            value="emergency"
                            className="text-sm data-[state=active]:bg-white data-[state=active]:text-brand-800 data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-accent-300 rounded-md transition-all"
                        >
                            Emergency
                        </TabsTrigger>
                    </TabsList>

                    <div className="flex-1 pr-2">
                        {/* Account Information */}
                        <TabsContent value="account" className="space-y-6">
                            <Card className="border-accent-200 dark:border-accent-700">
                                <CardHeader className="pb-4">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-lg font-semibold text-brand-800 dark:text-brand-200">
                                            Account Information
                                        </CardTitle>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={handleOpenChangeRequestModal}
                                            disabled={hasPendingRequest}
                                            className="border-brand-300 text-brand-700 hover:bg-brand-50 disabled:opacity-50"
                                        >
                                            <UserCheck className="h-4 w-4 mr-1" />
                                            Change Request
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    {/* Profile Photo Section */}
                                    <div className="flex flex-col items-center space-y-4">
                                        <div className="relative">
                                            <Avatar className="h-32 w-32 ring-4 ring-accent-300 dark:ring-accent-700">
                                                <AvatarImage
                                                    src={profileImage || "/placeholder.svg"}
                                                    alt="Profile"
                                                />
                                                <AvatarFallback className="bg-brand-500 text-white text-3xl font-bold">
                                                    {formData.fullname
                                                        .split(" ")
                                                        .map(n => n[0])
                                                        .join("")}
                                                </AvatarFallback>
                                            </Avatar>
                                            <label className="absolute bottom-0 right-0 p-2 bg-brand-600 text-white rounded-full cursor-pointer hover:bg-brand-700 transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed">
                                                {isUploadingProfilePicture ? (
                                                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                                                ) : (
                                                    <Camera className="h-4 w-4" />
                                                )}
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={handleProfilePictureUpload}
                                                    className="hidden"
                                                    disabled={isUploadingProfilePicture}
                                                />
                                            </label>
                                        </div>
                                        <Badge className="bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-400">
                                            Active Employee
                                        </Badge>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <InputField
                                            label="Full Name"
                                            field="fullname"
                                            value={formData.fullname}
                                            section="account"
                                        />
                                        <InputField
                                            label="Employee ID"
                                            field="employeeId"
                                            value={formData.employeeId}
                                            section="account"
                                        />
                                    </div>

                                    {/* Password Section */}
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <Label className="text-sm font-medium text-brand-700 dark:text-brand-300">
                                                Password
                                            </Label>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={handleForgotPassword}
                                                    disabled={resetLoading}
                                                    className="border-brand-300 text-brand-700 hover:bg-brand-50 bg-transparent"
                                                >
                                                    <Lock className="h-4 w-4 mr-1" />
                                                    {resetLoading
                                                        ? "Sending..."
                                                        : "Forgot Password"}
                                                </Button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Signature Section */}
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <Label className="text-sm font-medium text-brand-700 dark:text-brand-300">
                                                Digital Signature
                                            </Label>
                                            <label className="cursor-pointer">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    asChild
                                                    disabled={isUploadingSignature}
                                                >
                                                    <span>
                                                        <Upload className="h-4 w-4 mr-1" />
                                                        {isUploadingSignature
                                                            ? "Uploading..."
                                                            : "Upload/Change"}
                                                    </span>
                                                </Button>
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={handleSignatureUpload}
                                                    className="hidden"
                                                    disabled={isUploadingSignature}
                                                />
                                            </label>
                                        </div>
                                        <div className="p-6 bg-accent-50 dark:bg-accent-900/20 rounded-lg border border-accent-200 dark:border-accent-700 min-h-[120px] flex items-center justify-center">
                                            {userData?.signature ? (
                                                <img
                                                    src={userData.signature || "/placeholder.svg"}
                                                    alt="Signature"
                                                    className="max-h-20 max-w-full"
                                                />
                                            ) : (
                                                <div className="text-center text-brand-500 dark:text-brand-400">
                                                    <PenTool className="h-8 w-8 mx-auto mb-2" />
                                                    <span className="text-sm">
                                                        No signature uploaded
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Employee Information */}
                        <TabsContent value="employee" className="space-y-6">
                            <Card className="border-accent-200 dark:border-accent-700">
                                <CardHeader className="pb-4">
                                    <CardTitle className="text-lg font-semibold text-brand-800 dark:text-brand-200">
                                        Employee Information
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <InputField
                                            label="First Name"
                                            field="firstName"
                                            value={formData.firstName}
                                            section="employee"
                                        />
                                        <InputField
                                            label="Middle Name"
                                            field="middleName"
                                            value={formData.middleName}
                                            section="employee"
                                        />
                                        <InputField
                                            label="Surname"
                                            field="surname"
                                            value={formData.surname}
                                            section="employee"
                                        />
                                        <InputField
                                            label="Birth Date"
                                            field="birthDate"
                                            value={formData.birthDate}
                                            section="employee"
                                            type="date"
                                        />
                                        <InputField
                                            label="Birth Place"
                                            field="birthPlace"
                                            value={formData.birthPlace}
                                            section="employee"
                                        />
                                        <InputField
                                            label="Level of Education"
                                            field="levelOfEducation"
                                            value={
                                                levelOfEducationOptions.find(
                                                    l => l.value == formData.levelOfEducation,
                                                )?.label ?? ""
                                            }
                                            section="employee"
                                            options={levelOfEducationOptions}
                                        />
                                        <InputField
                                            label="Years of Experience"
                                            field="yearsOfExperience"
                                            value={
                                                yearsOfExperienceOptions.find(
                                                    l => l.value === formData.yearsOfExperience,
                                                )?.label ?? ""
                                            }
                                            section="employee"
                                            options={yearsOfExperienceOptions}
                                        />
                                        <InputField
                                            label="Marital Status"
                                            field="maritalStatus"
                                            value={
                                                maritalStatusOptions.find(
                                                    l => l.value === formData.maritalStatus,
                                                )?.label ?? ""
                                            }
                                            section="employee"
                                            options={maritalStatusOptions}
                                        />
                                        <InputField
                                            label="Personal Phone Number"
                                            field="personalPhone"
                                            value={formData.personalPhone}
                                            section="employee"
                                        />
                                        <InputField
                                            label="Personal Email"
                                            field="personalEmail"
                                            value={formData.personalEmail}
                                            section="employee"
                                            type="email"
                                        />
                                        <InputField
                                            label="Bank Account"
                                            field="bankAccount"
                                            value={formData.bankAccount}
                                            section="employee"
                                        />
                                        <InputField
                                            label="TIN Number"
                                            field="tinNumber"
                                            value={formData.tinNumber}
                                            section="employee"
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Contract Information */}
                        <TabsContent value="contract" className="space-y-6">
                            <Card className="border-accent-200 dark:border-accent-700">
                                <CardHeader className="pb-4">
                                    <CardTitle className="text-lg font-semibold text-brand-800 dark:text-brand-200">
                                        Contract Information
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <InputField
                                            label="Contract Type"
                                            field="contractType"
                                            value={
                                                contractTypeOptions.find(
                                                    l => l.value === formData.contractType,
                                                )?.label ?? ""
                                            }
                                            section="contract"
                                            options={contractTypeOptions}
                                        />
                                        <InputField
                                            label="Contract Status"
                                            field="contractStatus"
                                            value={formData.contractStatus}
                                            section="contract"
                                            options={[
                                                { value: "Active", label: "Active" },
                                                { value: "Inactive", label: "Inactive" },
                                                { value: "Terminated", label: "Terminated" },
                                                { value: "Suspended", label: "Suspended" },
                                            ]}
                                        />
                                        <InputField
                                            label="Contract Starting Date"
                                            field="contractStartDate"
                                            value={formData.contractStartDate}
                                            section="contract"
                                            type="date"
                                        />
                                        <InputField
                                            label="Contract Termination Date"
                                            field="contractTerminationDate"
                                            value={formData.contractTerminationDate}
                                            section="contract"
                                            type="date"
                                        />
                                        <InputField
                                            label="Probation Period End Date"
                                            field="probationEndDate"
                                            value={formData.probationEndDate}
                                            section="contract"
                                            type="date"
                                        />
                                        <InputField
                                            label="Last Date of Probation"
                                            field="lastDateOfProbation"
                                            value={formData.lastDateOfProbation}
                                            section="contract"
                                            type="date"
                                        />
                                        <InputField
                                            label="Reason of Leaving"
                                            field="reasonOfLeaving"
                                            value={formData.reasonOfLeaving}
                                            section="contract"
                                        />
                                        <InputField
                                            label="Salary"
                                            field="salary"
                                            value={formData.salary}
                                            section="contract"
                                            type="number"
                                        />
                                        <InputField
                                            label="Eligible Leave Days"
                                            field="eligibleLeaveDays"
                                            value={formData.eligibleLeaveDays}
                                            section="contract"
                                            type="number"
                                        />
                                        <InputField
                                            label="Company Email"
                                            field="companyEmail"
                                            value={formData.companyEmail}
                                            section="contract"
                                            type="email"
                                        />
                                        <InputField
                                            label="Company Phone Number"
                                            field="companyPhone"
                                            value={formData.companyPhone}
                                            section="contract"
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Position Information */}
                        <TabsContent value="position" className="space-y-6">
                            <Card className="border-accent-200 dark:border-accent-700">
                                <CardHeader className="pb-4">
                                    <CardTitle className="text-lg font-semibold text-brand-800 dark:text-brand-200">
                                        Position Information
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <InputField
                                            label="Employment Position"
                                            field="employmentPosition"
                                            value={
                                                employmentPositionOptions.find(
                                                    l => l.value === formData.employmentPosition,
                                                )?.label ?? ""
                                            }
                                            section="position"
                                            options={employmentPositionOptions}
                                        />
                                        <InputField
                                            label="Position Level"
                                            field="positionLevel"
                                            value={formData.positionLevel}
                                            section="position"
                                        />
                                        <InputField
                                            label="Section/Division"
                                            field="sectionDivision"
                                            value={
                                                sectionOptions.find(
                                                    s => s.value == formData.sectionDivision,
                                                )?.label ?? ""
                                            }
                                            section="position"
                                        />
                                        <InputField
                                            label="Department"
                                            field="department"
                                            value={
                                                departmentOptions.find(
                                                    l => l.value === formData.department,
                                                )?.label ?? ""
                                            }
                                            section="position"
                                            options={departmentOptions}
                                        />
                                        <InputField
                                            label="Working Location"
                                            field="workingLocation"
                                            value={
                                                workingLocationOptions.find(
                                                    l => l.value === formData.workingLocation,
                                                )?.label ?? ""
                                            }
                                            section="position"
                                            options={workingLocationOptions}
                                        />
                                        <InputField
                                            label="Role"
                                            field="role"
                                            value={formData.role}
                                            section="position"
                                        />
                                        <InputField
                                            label="Reporting Line Manager"
                                            field="reportingLineManager"
                                            value={getFullName(
                                                employees.find(
                                                    e => e.uid == formData.reportingLineManager,
                                                ) ?? ({} as EmployeeModel),
                                            )}
                                            section="position"
                                        />
                                        <InputField
                                            label="Reporting Line Manager Position"
                                            field="reportingLineManagerPosition"
                                            value={
                                                positions.find(
                                                    p =>
                                                        p.id ==
                                                        formData.reportingLineManagerPosition,
                                                )?.name ?? ""
                                            }
                                            section="position"
                                        />
                                        <InputField
                                            label="Grade Level"
                                            field="gradeLevel"
                                            value={
                                                gradeLevelOptions.find(
                                                    l => l.value === formData.gradeLevel,
                                                )?.label ?? ""
                                            }
                                            section="position"
                                            options={gradeLevelOptions}
                                        />
                                        <InputField
                                            label="Step"
                                            field="step"
                                            value={formData.step}
                                            section="position"
                                        />
                                        <InputField
                                            label="Shift Type"
                                            field="shiftType"
                                            value={
                                                shiftTypeOptions.find(
                                                    l => l.value === formData.shiftType,
                                                )?.label ?? ""
                                            }
                                            section="position"
                                            options={shiftTypeOptions}
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Emergency Contact Information */}
                        <TabsContent value="emergency" className="space-y-6">
                            <Card className="border-accent-200 dark:border-accent-700">
                                <CardHeader className="pb-4">
                                    <CardTitle className="text-lg font-semibold text-brand-800 dark:text-brand-200">
                                        Emergency Contact Information
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <InputField
                                            label="Emergency Contact Name"
                                            field="emergencyContactName"
                                            value={formData.emergencyContactName}
                                            section="emergency"
                                        />
                                        <InputField
                                            label="Relationship to Employee"
                                            field="relationshipToEmployee"
                                            value={formData.relationshipToEmployee}
                                            section="emergency"
                                            options={[
                                                { value: "Spouse", label: "Spouse" },
                                                { value: "Parent", label: "Parent" },
                                                { value: "Sibling", label: "Sibling" },
                                                { value: "Child", label: "Child" },
                                                { value: "Friend", label: "Friend" },
                                                { value: "Other", label: "Other" },
                                            ]}
                                        />
                                        <InputField
                                            label="Phone Number 1"
                                            field="phoneNumber1"
                                            value={formData.phoneNumber1}
                                            section="emergency"
                                        />
                                        <InputField
                                            label="Phone Number 2"
                                            field="phoneNumber2"
                                            value={formData.phoneNumber2}
                                            section="emergency"
                                        />
                                        <InputField
                                            label="Email Address 1"
                                            field="emailAddress1"
                                            value={formData.emailAddress1}
                                            section="emergency"
                                            type="email"
                                        />
                                        <InputField
                                            label="Email Address 2"
                                            field="emailAddress2"
                                            value={formData.emailAddress2}
                                            section="emergency"
                                            type="email"
                                        />
                                    </div>
                                    <div className="space-y-4">
                                        <InputField
                                            label="Physical Address 1"
                                            field="physicalAddress1"
                                            value={formData.physicalAddress1}
                                            section="emergency"
                                        />
                                        <InputField
                                            label="Physical Address 2"
                                            field="physicalAddress2"
                                            value={formData.physicalAddress2}
                                            section="emergency"
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </div>
                </Tabs>

                <div className="flex justify-end gap-3 pt-6 border-t border-accent-200 dark:border-border flex-shrink-0 bg-white dark:bg-card">
                    <Button
                        variant="outline"
                        onClick={onClose}
                        className="border-accent-300 bg-transparent"
                    >
                        Close
                    </Button>
                    <Button
                        onClick={handleExportInformation}
                        className="bg-brand-600 hover:bg-brand-700 text-white"
                    >
                        <FileText className="h-4 w-4 mr-2" />
                        Export Information
                    </Button>
                </div>
            </DialogContent>

            {/* Change Request Modal */}
            <Dialog open={isChangeRequestModalOpen} onOpenChange={setIsChangeRequestModalOpen}>
                <DialogContent className="max-w-4xl h-[90vh] flex flex-col overflow-hidden">
                    <DialogHeader className="pb-6 flex-shrink-0">
                        <DialogTitle className="text-2xl font-bold text-brand-800 dark:text-brand-200">
                            Request Information Change
                        </DialogTitle>
                        <div className="mt-4">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-brand-700 dark:text-brand-300">
                                    Step {changeRequestStep} of 2
                                </span>
                                <span className="text-sm text-brand-500 dark:text-brand-400">
                                    {changeRequestStep === 1
                                        ? "Employee Information"
                                        : "Emergency Contact"}
                                </span>
                            </div>
                            <div className="w-full bg-accent-200 dark:bg-accent-700 rounded-full h-2">
                                <div
                                    className="bg-brand-600 h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${(changeRequestStep / 2) * 100}%` }}
                                ></div>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto pr-2">
                        {changeRequestStep === 1 && (
                            <Card className="border-accent-200 dark:border-accent-700">
                                <CardHeader>
                                    <CardTitle>Employee Information</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <InputField
                                            label="First Name"
                                            field="firstName"
                                            value={changeRequestData.firstName}
                                            section="changeRequest"
                                            onChange={(field, value) =>
                                                setChangeRequestData(prev => ({
                                                    ...prev,
                                                    [field]: value,
                                                }))
                                            }
                                        />
                                        <InputField
                                            label="Middle Name"
                                            field="middleName"
                                            value={changeRequestData.middleName}
                                            section="changeRequest"
                                            onChange={(field, value) =>
                                                setChangeRequestData(prev => ({
                                                    ...prev,
                                                    [field]: value,
                                                }))
                                            }
                                        />
                                        <InputField
                                            label="Surname"
                                            field="surname"
                                            value={changeRequestData.surname}
                                            section="changeRequest"
                                            onChange={(field, value) =>
                                                setChangeRequestData(prev => ({
                                                    ...prev,
                                                    [field]: value,
                                                }))
                                            }
                                        />
                                        <InputField
                                            label="Birth Date"
                                            field="birthDate"
                                            value={changeRequestData.birthDate}
                                            section="changeRequest"
                                            type="date"
                                            onChange={(field, value) =>
                                                setChangeRequestData(prev => ({
                                                    ...prev,
                                                    [field]: value,
                                                }))
                                            }
                                        />
                                        <InputField
                                            label="Birth Place"
                                            field="birthPlace"
                                            value={changeRequestData.birthPlace}
                                            section="changeRequest"
                                            onChange={(field, value) =>
                                                setChangeRequestData(prev => ({
                                                    ...prev,
                                                    [field]: value,
                                                }))
                                            }
                                        />
                                        <InputField
                                            label="Level of Education"
                                            field="levelOfEducation"
                                            value={changeRequestData.levelOfEducation}
                                            section="changeRequest"
                                            options={levelOfEducationOptions}
                                            onChange={(field, value) =>
                                                setChangeRequestData(prev => ({
                                                    ...prev,
                                                    [field]: value,
                                                }))
                                            }
                                        />
                                        <InputField
                                            label="Years of Experience"
                                            field="yearsOfExperience"
                                            value={changeRequestData.yearsOfExperience}
                                            section="changeRequest"
                                            options={yearsOfExperienceOptions}
                                            onChange={(field, value) =>
                                                setChangeRequestData(prev => ({
                                                    ...prev,
                                                    [field]: value,
                                                }))
                                            }
                                        />
                                        <InputField
                                            label="Marital Status"
                                            field="maritalStatus"
                                            value={changeRequestData.maritalStatus}
                                            section="changeRequest"
                                            options={maritalStatusOptions}
                                            onChange={(field, value) =>
                                                setChangeRequestData(prev => ({
                                                    ...prev,
                                                    [field]: value,
                                                }))
                                            }
                                        />
                                        <InputField
                                            label="Personal Phone Number"
                                            field="personalPhone"
                                            value={changeRequestData.personalPhone}
                                            section="changeRequest"
                                            onChange={(field, value) =>
                                                setChangeRequestData(prev => ({
                                                    ...prev,
                                                    [field]: value,
                                                }))
                                            }
                                        />
                                        <InputField
                                            label="Personal Email"
                                            field="personalEmail"
                                            value={changeRequestData.personalEmail}
                                            section="changeRequest"
                                            type="email"
                                            onChange={(field, value) =>
                                                setChangeRequestData(prev => ({
                                                    ...prev,
                                                    [field]: value,
                                                }))
                                            }
                                        />
                                        <InputField
                                            label="Bank Account"
                                            field="bankAccount"
                                            value={changeRequestData.bankAccount}
                                            section="changeRequest"
                                            onChange={(field, value) =>
                                                setChangeRequestData(prev => ({
                                                    ...prev,
                                                    [field]: value,
                                                }))
                                            }
                                        />
                                        <InputField
                                            label="TIN Number"
                                            field="tinNumber"
                                            value={changeRequestData.tinNumber}
                                            section="changeRequest"
                                            onChange={(field, value) =>
                                                setChangeRequestData(prev => ({
                                                    ...prev,
                                                    [field]: value,
                                                }))
                                            }
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {changeRequestStep === 2 && (
                            <Card className="border-accent-200 dark:border-accent-700">
                                <CardHeader>
                                    <CardTitle>Emergency Contact Information</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <InputField
                                            label="Emergency Contact Name"
                                            field="emergencyContactName"
                                            value={changeRequestData.emergencyContactName}
                                            section="changeRequest"
                                            onChange={(field, value) =>
                                                setChangeRequestData(prev => ({
                                                    ...prev,
                                                    [field]: value,
                                                }))
                                            }
                                        />
                                        <InputField
                                            label="Relationship to Employee"
                                            field="relationshipToEmployee"
                                            value={changeRequestData.relationshipToEmployee}
                                            section="changeRequest"
                                            options={[
                                                { value: "Spouse", label: "Spouse" },
                                                { value: "Parent", label: "Parent" },
                                                { value: "Sibling", label: "Sibling" },
                                                { value: "Child", label: "Child" },
                                                { value: "Friend", label: "Friend" },
                                                { value: "Other", label: "Other" },
                                            ]}
                                            onChange={(field, value) =>
                                                setChangeRequestData(prev => ({
                                                    ...prev,
                                                    [field]: value,
                                                }))
                                            }
                                        />
                                        <InputField
                                            label="Phone Number 1"
                                            field="phoneNumber1"
                                            value={changeRequestData.phoneNumber1}
                                            section="changeRequest"
                                            onChange={(field, value) =>
                                                setChangeRequestData(prev => ({
                                                    ...prev,
                                                    [field]: value,
                                                }))
                                            }
                                        />
                                        <InputField
                                            label="Phone Number 2"
                                            field="phoneNumber2"
                                            value={changeRequestData.phoneNumber2}
                                            section="changeRequest"
                                            onChange={(field, value) =>
                                                setChangeRequestData(prev => ({
                                                    ...prev,
                                                    [field]: value,
                                                }))
                                            }
                                        />
                                        <InputField
                                            label="Email Address 1"
                                            field="emailAddress1"
                                            value={changeRequestData.emailAddress1}
                                            section="changeRequest"
                                            type="email"
                                            onChange={(field, value) =>
                                                setChangeRequestData(prev => ({
                                                    ...prev,
                                                    [field]: value,
                                                }))
                                            }
                                        />
                                        <InputField
                                            label="Email Address 2"
                                            field="emailAddress2"
                                            value={changeRequestData.emailAddress2}
                                            section="changeRequest"
                                            type="email"
                                            onChange={(field, value) =>
                                                setChangeRequestData(prev => ({
                                                    ...prev,
                                                    [field]: value,
                                                }))
                                            }
                                        />
                                    </div>
                                    <div className="space-y-4">
                                        <InputField
                                            label="Physical Address 1"
                                            field="physicalAddress1"
                                            value={changeRequestData.physicalAddress1}
                                            section="changeRequest"
                                            onChange={(field, value) =>
                                                setChangeRequestData(prev => ({
                                                    ...prev,
                                                    [field]: value,
                                                }))
                                            }
                                        />
                                        <InputField
                                            label="Physical Address 2"
                                            field="physicalAddress2"
                                            value={changeRequestData.physicalAddress2}
                                            section="changeRequest"
                                            onChange={(field, value) =>
                                                setChangeRequestData(prev => ({
                                                    ...prev,
                                                    [field]: value,
                                                }))
                                            }
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    <div className="flex justify-between gap-3 pt-6 border-t border-accent-200 dark:border-border flex-shrink-0 bg-white dark:bg-card">
                        <Button
                            variant="outline"
                            onClick={() => setIsChangeRequestModalOpen(false)}
                        >
                            Cancel
                        </Button>
                        <div className="flex gap-3">
                            {changeRequestStep === 2 && (
                                <Button variant="outline" onClick={handlePreviousStep}>
                                    Previous
                                </Button>
                            )}
                            {changeRequestStep === 1 ? (
                                <Button
                                    onClick={handleNextStep}
                                    className="bg-brand-600 hover:bg-brand-700 text-white"
                                >
                                    Next
                                </Button>
                            ) : (
                                <Button
                                    onClick={handleChangeRequestSubmit}
                                    className="bg-brand-600 hover:bg-brand-700 text-white"
                                >
                                    Submit Change Request
                                </Button>
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Change Request Detail Modal */}
            <ChangeRequestDetailModal
                isOpen={isDetailModalOpen}
                onClose={() => setIsDetailModalOpen(false)}
                request={selectedChangeRequest}
                isEmployeeView={true} // Hide approve/reject buttons
            />
        </Dialog>
    );
}
