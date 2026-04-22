"use client";

import * as React from "react";
import { Edit, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { CustomFieldsEditor } from "@/components/ui/custom-fields";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandGroup, CommandItem } from "@/components/ui/command";
import { useData } from "@/context/app-data-context";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { CustomField, CustomFieldSection, EmployeeModel } from "@/lib/models/employee";

const renderFormField = (
    id: string,
    label: string,
    value: string,
    onChange: (value: string) => void,
    errors: Record<string, string>,
    labelClasses: string,
    inputClasses: string,
    required = false,
    type = "text",
    placeholder = "",
    inputProps: React.InputHTMLAttributes<HTMLInputElement> = {},
) => (
    <div>
        <Label htmlFor={id} className={labelClasses}>
            {label} {required && <span className="text-red-500">*</span>}
        </Label>
        <Input
            id={id}
            type={type}
            value={value}
            onChange={e => onChange(e.target.value)}
            required={required}
            placeholder={placeholder}
            className={`mt-1 ${inputClasses} ${errors[id] ? "border-red-500" : ""}`}
            {...inputProps}
        />
        {errors[id] && <p className="mt-1 text-sm text-red-500">{errors[id]}</p>}
    </div>
);

const renderSelectField = (
    id: string,
    label: string,
    value: string,
    onChange: (value: string) => void,
    options: { value: string; label: string }[],
    errors: Record<string, string>,
    labelClasses: string,
    inputClasses: string,
    required = false,
    placeholder = "Select option",
    disabled?: boolean,
) => (
    <div>
        <Label htmlFor={id} className={labelClasses}>
            {label} {required && <span className="text-red-500">*</span>}
        </Label>
        <Select
            disabled={disabled}
            value={value}
            onValueChange={newValue => {
                if (newValue === "clear") {
                    onChange("");
                } else {
                    onChange(newValue);
                }
            }}
        >
            <SelectTrigger className={`mt-1 ${inputClasses} ${errors[id] ? "border-red-500" : ""}`}>
                <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
                {value && <SelectItem value="clear">Clear Selection</SelectItem>}
                {options.map((option, index) => (
                    <SelectItem key={index} value={option.value}>
                        {option.label}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
        {errors[id] && <p className="mt-1 text-sm text-red-500">{errors[id]}</p>}
    </div>
);

const renderMultiSelectField = (
    id: string,
    label: string,
    value: string[],
    onChange: (value: string[]) => void,
    options: { value: string; label: string }[],
    errors: Record<string, string>,
    labelClasses: string,
    inputClasses: string,
    required = false,
    placeholder = "Select options",
) => (
    <div>
        <Label htmlFor={id} className={labelClasses}>
            {label} {required && <span className="text-red-500">*</span>}
        </Label>
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    id={id}
                    variant="outline"
                    className={`mt-1 w-full justify-between ${inputClasses} ${
                        errors[id] ? "border-red-500" : ""
                    }`}
                >
                    {value && value.length > 0
                        ? options
                            .filter(o => value.includes(o.value))
                            .map(o => o.label)
                            .join(", ")
                        : placeholder}
                </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-[320px] max-w-[90vw] p-0">
                <Command>
                    <CommandGroup>
                        {options.map(option => (
                            <CommandItem
                                key={option.value}
                                onSelect={() => {
                                    const next = value.includes(option.value)
                                        ? value.filter(v => v !== option.value)
                                        : [...value, option.value];
                                    onChange(next);
                                }}
                            >
                                <Check
                                    className={cn(
                                        "mr-2 h-4 w-4",
                                        value.includes(option.value) ? "opacity-100" : "opacity-0",
                                    )}
                                />
                                {option.label}
                            </CommandItem>
                        ))}
                    </CommandGroup>
                </Command>
            </PopoverContent>
        </Popover>
        {!errors[id] && (
            <p className="font-light text-sm text-gray-500">
                &quot;Employee&quot; role is by default associated
            </p>
        )}
        {errors[id] && <p className="mt-1 text-sm text-red-500">{errors[id]}</p>}
    </div>
);

interface EmployeeInformationProps {
    formData: EmployeeModel;
    handleInputChange: (field: keyof EmployeeModel, value: string | string[]) => void;
    handleCustomFieldsChange: (section: CustomFieldSection, fields: CustomField[]) => void;
    errors: Record<string, string>;
    handleEdit: () => void;
    theme: string;
    showPassword: boolean;
    setShowPassword: (show: boolean) => void;
    employee?: EmployeeModel;
}

export const EmployeeInformationSection: React.FC<EmployeeInformationProps> = ({
    formData,
    handleInputChange,
    handleCustomFieldsChange,
    errors,
    handleEdit,
    theme,
    showPassword,
    setShowPassword,
    employee,
}) => {
    const { ...hrSettings } = useData();
    const maritalStatus = hrSettings.maritalStatuses || [];
    const filteredMaritalStatus = maritalStatus.filter(status => status.active === true);
    const labelClasses = theme === "dark" ? "text-gray-200" : "text-primary-800";
    const inputClasses =
        theme === "dark"
            ? "bg-black border-gray-600 focus:border-blue-500 focus:ring-blue-500 text-white"
            : "border-gray-200 focus:border-primary-600 focus:ring-primary-600";

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-primary-900">Employee Information</h3>
                <Button
                    onClick={handleEdit}
                    variant="outline"
                    size="sm"
                    className="text-primary-700 border-gray-200 hover:bg-gray-50 bg-transparent"
                >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {renderFormField(
                    "firstName",
                    "First Name",
                    formData.firstName,
                    value => handleInputChange("firstName", value),
                    errors,
                    labelClasses,
                    inputClasses,
                    true,
                )}
                {renderFormField(
                    "middleName",
                    "Middle Name",
                    formData.middleName || "",
                    value => handleInputChange("middleName", value),
                    errors,
                    labelClasses,
                    inputClasses,
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {renderFormField(
                    "surname",
                    "Surname",
                    formData.surname,
                    value => handleInputChange("surname", value),
                    errors,
                    labelClasses,
                    inputClasses,
                    true,
                )}
                {renderFormField(
                    "birthDate",
                    "Birth Date",
                    formData.birthDate || "",
                    value => handleInputChange("birthDate", value),
                    errors,
                    labelClasses,
                    inputClasses,
                    true,
                    "date",
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {renderFormField(
                    "employeeID",
                    "Employee ID",
                    formData.employeeID,
                    value => handleInputChange("employeeID", value),
                    errors,
                    labelClasses,
                    inputClasses,
                    true,
                )}
                {renderSelectField(
                    "levelOfEducation",
                    "Level Of Education",
                    formData.levelOfEducation || "",
                    value => handleInputChange("levelOfEducation", value),
                    hrSettings.levelOfEducations
                        .filter(levelOfEducation => levelOfEducation.active)
                        .map(levelOfEducation => ({
                            value: levelOfEducation.id,
                            label: levelOfEducation.name,
                        })),
                    errors,
                    labelClasses,
                    inputClasses,
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {renderSelectField(
                    "yearsOfExperience",
                    "Years of Experience",
                    formData.yearsOfExperience || "",
                    value => handleInputChange("yearsOfExperience", value),
                    hrSettings.yearsOfExperiences
                        .filter(yearsOfExperience => yearsOfExperience.active)
                        .map(yearsOfExperience => ({
                            value: yearsOfExperience.id,
                            label: yearsOfExperience.name,
                        })),
                    errors,
                    labelClasses,
                    inputClasses,
                )}
                {renderFormField(
                    "birthPlace",
                    "Birth Place",
                    formData.birthPlace || "",
                    value => handleInputChange("birthPlace", value),
                    errors,
                    labelClasses,
                    inputClasses,
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {renderSelectField(
                    "gender",
                    "Gender",
                    formData.gender || "",
                    value => handleInputChange("gender", value),
                    [
                        { value: "male", label: "Male" },
                        { value: "female", label: "Female" },
                    ],
                    errors,
                    labelClasses,
                    inputClasses,
                    true,
                )}
                {renderSelectField(
                    "maritalStatus",
                    "Marital Status",
                    formData.maritalStatus || "",
                    value => handleInputChange("maritalStatus", value),
                    filteredMaritalStatus.map(maritalStatus => ({
                        value: maritalStatus.id,
                        label: maritalStatus.name,
                    })),
                    errors,
                    labelClasses,
                    inputClasses,
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {renderFormField(
                    "personalPhoneNumber",
                    "Personal Phone Number",
                    formData.personalPhoneNumber,
                    value => handleInputChange("personalPhoneNumber", value),
                    errors,
                    labelClasses,
                    inputClasses,
                    true,
                )}
                {renderFormField(
                    "personalEmail",
                    "Personal Email",
                    formData.personalEmail || "",
                    value => handleInputChange("personalEmail", value),
                    errors,
                    labelClasses,
                    inputClasses,
                    false,
                    "email",
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <Label htmlFor="companyEmail" className={labelClasses}>
                        Company Email <span className="text-red-500">*</span>
                    </Label>
                    <Input
                        id="companyEmail"
                        type="email"
                        value={formData.companyEmail}
                        onChange={e => handleInputChange("companyEmail", e.target.value)}
                        required
                        placeholder="employee@company.com"
                        className={`mt-1 ${inputClasses} ${
                            errors.companyEmail ? "border-red-500" : ""
                        }`}
                    />
                    {employee && (
                        <p className="mt-1 text-sm text-amber-600 bg-amber-50 dark:bg-amber-900/30 dark:text-amber-400 px-3 py-2 rounded-md border border-amber-200 dark:border-amber-700">
                            Changing this email will also update the employee&apos;s login
                            credentials. The employee will need to use the new email to log in.
                        </p>
                    )}
                    {!errors.companyEmail && !employee && (
                        <p className="mt-1 text-sm text-gray-500">
                            This email will also be used for account sign-in
                        </p>
                    )}
                    {errors.companyEmail && (
                        <p className="mt-1 text-sm text-red-500">{errors.companyEmail}</p>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {renderFormField(
                    "bankAccount",
                    "Bank Account",
                    formData.bankAccount || "",
                    value => handleInputChange("bankAccount", value),
                    errors,
                    labelClasses,
                    inputClasses,
                )}
                {renderFormField(
                    "providentFundAccount",
                    "Provident Fund Account",
                    formData.providentFundAccount || "",
                    value => handleInputChange("providentFundAccount", value),
                    errors,
                    labelClasses,
                    inputClasses,
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {renderFormField(
                    "tinNumber",
                    "TIN Number",
                    formData.tinNumber || "",
                    value => handleInputChange("tinNumber", value),
                    errors,
                    labelClasses,
                    inputClasses,
                )}
                {renderFormField(
                    "passportNumber",
                    "Passport Number",
                    formData.passportNumber || "",
                    value => handleInputChange("passportNumber", value),
                    errors,
                    labelClasses,
                    inputClasses,
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {renderFormField(
                    "nationalIDNumber",
                    "National ID Number",
                    formData.nationalIDNumber || "",
                    value => handleInputChange("nationalIDNumber", value),
                    errors,
                    labelClasses,
                    inputClasses,
                )}
                {!employee && (
                    <div>
                        <Label htmlFor="password" className={labelClasses}>
                            User Account Password <span className="text-red-500">*</span>
                        </Label>
                        <div className="relative mt-1">
                            <Input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                value={formData.password || ""}
                                onChange={e => handleInputChange("password", e.target.value)}
                                required
                                className={`${inputClasses} ${
                                    errors.password ? "border-red-500 focus:ring-red-500" : ""
                                } pr-10`}
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? (
                                    <EyeOff className="h-4 w-4 text-gray-400" />
                                ) : (
                                    <Eye className="h-4 w-4 text-gray-400" />
                                )}
                            </Button>
                        </div>
                        {errors.password && (
                            <p className="mt-1 text-sm text-red-500">{errors.password}</p>
                        )}
                    </div>
                )}
            </div>

            {renderMultiSelectField(
                "role",
                "Role",
                formData.role || [],
                value => handleInputChange("role", value),
                [
                    { value: "HR Manager", label: "HR Manager" },
                    { value: "Manager", label: "Manager" },
                ],
                errors,
                labelClasses,
                inputClasses,
            )}

            <CustomFieldsEditor
                fields={formData.customFields?.filter(f => f.section === "employee") || []}
                onChange={fields => handleCustomFieldsChange("employee", fields)}
                theme={theme}
                section="employee"
                errors={errors}
            />
        </div>
    );
};
