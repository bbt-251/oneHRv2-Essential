"use client";
import { Button } from "@/components/ui/button";

import { useTheme } from "@/components/theme-provider";
import { useFirestore } from "@/context/firestore-context";
import { useToast } from "@/context/toastContext";
import { CustomField, CustomFieldSection, EmployeeModel } from "@/lib/models/employee";
import { FormStep } from "@/lib/models/type";
import { Loader2, X } from "lucide-react";
import { useState } from "react";
import AddEditWorkingArea from "./AddEditWorkingArea";
import {
    ContractInformationSection,
    EmergencyContactSection,
    EmployeeInformationSection,
    PositionInformationSection,
} from "./employee-form-sections";

interface EmployeeFormProps {
    employee?: EmployeeModel;
    onSave: (employee: EmployeeModel) => void;
    onCancel: () => void;
    setIsLoading: (isLoading: boolean) => void;
    isLoading: boolean;
}

export function EmployeeForm({ employee, onSave, onCancel, isLoading }: EmployeeFormProps) {
    const { activeEmployees } = useFirestore();

    const { showToast } = useToast();
    const { theme } = useTheme();

    const [currentStep, setCurrentStep] = useState<number>(1);
    const [openWorkArea, setOpenWorkArea] = useState(false);

    const [showPassword, setShowPassword] = useState<boolean>(false);
    const [formData, setFormData] = useState<EmployeeModel>(() => {
        if (employee) {
            // When editing, ensure all required fields have at least empty strings
            return {
                ...employee,
                companyEmail: employee.companyEmail ?? "",
                personalEmail: employee.personalEmail ?? "",
                personalPhoneNumber: employee.personalPhoneNumber ?? "",
            } as EmployeeModel;
        }
        return {
            id: "",
            firstName: "",
            middleName: "",
            surname: "",
            employeeID: "",
            personalPhoneNumber: "",
            personalEmail: "",
            companyEmail: "",
            password: "",
            probationPeriodEndDate: "",
            contractDuration: [],
            customFields: [],
        } as any;
    });
    const [errors, setErrors] = useState<Record<string, string>>({});

    const validateForm = (step?: number): boolean => {
        const newErrors: Record<string, string> = {};

        // Helper function to validate custom fields for a given step
        const validateCustomFields = (section: CustomFieldSection): void => {
            const fields = formData.customFields?.filter(f => f.section === section) || [];
            if (!fields || fields.length === 0) return;

            fields.forEach(field => {
                if (!field.label?.trim()) {
                    newErrors[`customFields-${field.id}-label`] = "Field label is required";
                }
                if (!field.value?.trim()) {
                    newErrors[`customFields-${field.id}-value`] = "Field value is required";
                }
            });
        };

        const validateStep1 = () => {
            if (!formData.firstName?.trim()) newErrors.firstName = "First name is required";
            if (!formData.surname?.trim()) newErrors.surname = "Surname is required";
            if (!formData.employeeID?.trim()) newErrors.employeeID = "Employee ID is required";
            else if (
                activeEmployees.some(
                    emp => emp.employeeID === formData.employeeID.trim() && emp.id !== formData.id,
                )
            ) {
                newErrors.employeeID = "Employee ID already exists";
                showToast("An employee with this ID already exists.", "Error", "error");
            }
            if (!formData.personalPhoneNumber?.trim?.())
                newErrors.personalPhoneNumber = "Phone number is required";
            else if (
                activeEmployees.some(
                    emp =>
                        emp.personalPhoneNumber?.trim() === formData.personalPhoneNumber.trim() &&
                        emp.id !== formData.id,
                )
            ) {
                newErrors.personalPhoneNumber = "Personal phone number already exists";
                showToast(
                    "An employee with this personal phone number already exists.",
                    "Error",
                    "error",
                );
            }
            if (!formData.companyEmail?.trim()) {
                newErrors.companyEmail = "Company email is required";
            } else if (!/\S+@\S+\.\S+/.test(formData.companyEmail)) {
                newErrors.companyEmail = "Please enter a valid email address";
            } else if (
                activeEmployees.some(
                    emp =>
                        emp.companyEmail?.trim().toLowerCase() ===
                            formData.companyEmail.trim().toLowerCase() && emp.id !== formData.id,
                )
            ) {
                newErrors.companyEmail = "Company email already exists";
                showToast("An employee with this company email already exists.", "Error", "error");
            }
            if (!formData.gender) newErrors.gender = "Gender is required";
            if (!formData.birthDate) newErrors.birthDate = "Birth date is required";
            // Only validate password when creating new employee (no existing employee)
            if (!employee && !formData.password?.trim())
                newErrors.password = "Password is required";
            // Validate custom fields for step 1
            validateCustomFields("employee");
        };

        const validateStep2 = () => {
            if (!formData.employmentPosition)
                newErrors.employmentPosition = "Employment Position is required";
            if (!formData.gradeLevel) newErrors.gradeLevel = "Grade Level is required";
            if (!formData.shiftType) newErrors.shiftType = "Shift Type is required";
            // Validate custom fields for step 2
            validateCustomFields("position");
        };

        const validateStep3 = () => {
            if (!formData.contractHour) newErrors.contractHour = "Contract Hour is required";
            if (!formData.contractStatus) newErrors.contractStatus = "Contract Status is required";
            if (!formData.contractStartingDate)
                newErrors.contractStartingDate = "Contract Starting Date is required";
            if (!formData.salary) newErrors.salary = "Salary is required";
            if (!formData.currency) newErrors.currency = "Currency is required";
            if (!formData.eligibleLeaveDays)
                newErrors.eligibleLeaveDays = "Eligible Leave Days is required";
            // Validate custom fields for step 3
            validateCustomFields("contract");
        };

        const validateStep4 = () => {
            if (!formData.emergencyContactName?.trim())
                newErrors.emergencyContactName = "Emergency Contact Name is required";
            if (!formData.relationshipToEmployee?.trim())
                newErrors.relationshipToEmployee = "Relationship to Employee is required";
            if (!formData.phoneNumber1?.trim?.())
                newErrors.phoneNumber1 = "Phone Number 1 is required";
            if (!formData.emailAddress1?.trim()) {
                newErrors.emailAddress1 = "Email Address 1 is required";
            } else if (!/\S+@\S+\.\S+/.test(formData.emailAddress1)) {
                newErrors.emailAddress1 = "Please enter a valid email address";
            }
            if (!formData.physicalAddress1?.trim())
                newErrors.physicalAddress1 = "Physical Address 1 is required";
            // Validate custom fields for step 4
            validateCustomFields("emergency");
        };

        if (step) {
            switch (step) {
                case 1:
                    validateStep1();
                    break;
                case 2:
                    validateStep2();
                    break;
                case 3:
                    validateStep3();
                    break;
                case 4:
                    validateStep4();
                    break;
                default:
                    break;
            }
        } else {
            validateStep1();
            validateStep2();
            validateStep3();
            validateStep4();
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = () => {
        if (validateForm()) {
            onSave(formData);
        }
    };

    const handleEdit = () => {
        if (validateForm()) {
            onSave(formData);
        }
    };

    const handleNext = () => {
        if (validateForm(currentStep) && currentStep < 4) {
            setCurrentStep(currentStep + 1);
            setErrors({});
        }
    };

    const handleInputChange = (
        field: keyof EmployeeModel,
        value: string | number | string[] | boolean,
    ) => {
        // Prevent changes during loading
        if (isLoading) return;

        if (errors[field]) {
            setErrors(prevErrors => {
                const newErrors = { ...prevErrors };
                delete newErrors[field];
                return newErrors;
            });
        }
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleCustomFieldsChange = (section: CustomFieldSection, fields: CustomField[]) => {
        if (isLoading) return;
        // Get all custom fields that are NOT in this section
        const otherFields = formData.customFields?.filter(f => f.section !== section) || [];
        // Combine with the new/changed fields for this section
        setFormData(prev => ({
            ...prev,
            customFields: [...otherFields, ...fields],
        }));
    };

    const handleStepClick = (stepId: number) => {
        setCurrentStep(stepId);
    };

    const handleBack = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

    const modalBgClasses = theme === "dark" ? "bg-black" : "bg-secondary-50";
    const textPrimaryClasses = theme === "dark" ? "text-gray-100" : "text-primary-900";
    const borderClasses = theme === "dark" ? "border-gray-700" : "border-gray-200";
    const buttonPrimaryClasses =
        theme === "dark"
            ? "bg-blue-600 hover:bg-blue-700 text-white"
            : "bg-green-600 hover:bg-green-700 text-white";
    const buttonSecondaryClasses =
        theme === "dark"
            ? "bg-black border-gray-600 hover:bg-gray-600 text-gray-200"
            : "bg-transparent border-gray-200 text-primary-700 hover:bg-gray-50";
    const closeButtonHover = theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-100";
    const textSecondaryClasses = theme === "dark" ? "text-gray-400" : "text-gray-500";
    const steps: FormStep[] = [
        { id: 1, title: "Employee Information", completed: currentStep > 1 },
        { id: 2, title: "Position Information", completed: currentStep > 2 },
        { id: 3, title: "Contract Information", completed: currentStep > 3 },
        { id: 4, title: "Emergency Contact Information", completed: false },
    ];
    const activeStepClasses =
        theme === "dark" ? "border-blue-500 text-blue-400" : "border-primary-600 text-primary-600";
    const inactiveStepClasses =
        theme === "dark"
            ? "border-transparent text-gray-500 hover:text-gray-300 hover:border-gray-600"
            : `border-transparent ${textSecondaryClasses} hover:text-gray-700 hover:border-gray-300`;

    const renderStepIndicator = () => (
        <div className={`border-b ${borderClasses} mb-8`}>
            <div className="flex space-x-8">
                {steps.map(step => (
                    <button
                        key={step.id}
                        onClick={() => handleStepClick(step.id)}
                        disabled={isLoading}
                        className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                            isLoading ? "opacity-50 cursor-not-allowed" : ""
                        } ${step.id === currentStep ? activeStepClasses : inactiveStepClasses}`}
                    >
                        {step.title}
                    </button>
                ))}
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div
                className={`${modalBgClasses} rounded-lg w-full max-w-5xl max-h-[90vh] overflow-hidden shadow-xl flex flex-col`}
            >
                <div
                    className={`flex-shrink-0 flex items-center justify-between p-6 border-b ${borderClasses}`}
                >
                    <h2 className={`text-xl font-semibold ${textPrimaryClasses}`}>
                        {employee ? "Edit Employee" : "Add New Employee"}
                    </h2>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onCancel}
                        disabled={isLoading}
                        className={closeButtonHover}
                    >
                        <X className="w-4 h-4" />
                    </Button>
                </div>

                <div className="p-6 overflow-y-auto">
                    {renderStepIndicator()}
                    {currentStep === 1 && (
                        <EmployeeInformationSection
                            formData={formData}
                            handleInputChange={handleInputChange}
                            handleCustomFieldsChange={handleCustomFieldsChange}
                            errors={errors}
                            handleEdit={handleEdit}
                            theme={theme}
                            showPassword={showPassword}
                            setShowPassword={setShowPassword}
                            employee={employee}
                        />
                    )}
                    {currentStep === 2 && (
                        <PositionInformationSection
                            formData={formData}
                            handleInputChange={handleInputChange}
                            handleCustomFieldsChange={handleCustomFieldsChange}
                            errors={errors}
                            setOpenWorkArea={setOpenWorkArea}
                            theme={theme}
                            employee={employee}
                        />
                    )}
                    {currentStep === 3 && (
                        <ContractInformationSection
                            formData={formData}
                            handleInputChange={handleInputChange}
                            handleCustomFieldsChange={handleCustomFieldsChange}
                            errors={errors}
                            theme={theme}
                        />
                    )}
                    {currentStep === 4 && (
                        <EmergencyContactSection
                            formData={formData}
                            handleInputChange={handleInputChange}
                            handleCustomFieldsChange={handleCustomFieldsChange}
                            errors={errors}
                            theme={theme}
                        />
                    )}
                </div>

                <div
                    className={`flex-shrink-0 flex justify-between items-center mt-auto p-6 border-t ${borderClasses}`}
                >
                    <Button
                        variant="outline"
                        onClick={handleBack}
                        disabled={currentStep === 1 || isLoading}
                        className={buttonSecondaryClasses}
                    >
                        Back
                    </Button>
                    <div className="flex gap-3">
                        {currentStep < 4 ? (
                            <Button
                                onClick={handleNext}
                                disabled={isLoading}
                                className={buttonSecondaryClasses}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    "Next"
                                )}
                            </Button>
                        ) : (
                            <Button
                                onClick={handleSubmit}
                                className={buttonPrimaryClasses}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    "Submit"
                                )}
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {openWorkArea && (
                <AddEditWorkingArea
                    open={openWorkArea}
                    setOpen={setOpenWorkArea}
                    edit={true}
                    data={employee?.workingArea ? JSON.parse(employee.workingArea) : []}
                    employee={employee || ({} as EmployeeModel)}
                    setCoordinates={coordinates => {
                        handleInputChange("workingArea", JSON.stringify(coordinates));
                    }}
                />
            )}
        </div>
    );
}
