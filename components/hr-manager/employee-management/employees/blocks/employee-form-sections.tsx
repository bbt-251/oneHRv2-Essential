import CascaderDropdown from "@/components/custom-cascader";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { CustomFieldsEditor } from "@/components/ui/custom-fields";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useFirestore } from "@/context/firestore-context";
import { LocationModel } from "@/lib/backend/firebase/hrSettingsService";
import { canBeReportee } from "@/lib/backend/functions/canBeReportee";
import { CustomField, CustomFieldSection, EmployeeModel } from "@/lib/models/employee";
import { calculateProbationEndDate } from "@/lib/util/calculate-probation-end-date";
import getFullName from "@/lib/util/getEmployeeFullName";
import { cn } from "@/lib/utils";
import dayjs from "dayjs";
import { Check, Edit, Ellipsis, Eye, EyeOff, X } from "lucide-react";
import * as React from "react";
import { useEffect, useState } from "react";

interface LocationNode extends LocationModel {
    parentId?: string | null;
    children: LocationNode[];
    isExpanded?: boolean;
    description?: string;
    address?: string;
}
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
                "Employee" role is by default associated
            </p>
        )}
        {errors[id] && <p className="mt-1 text-sm text-red-500">{errors[id]}</p>}
    </div>
);

// Employee Information Section
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
    const { hrSettings } = useFirestore();
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

            {/* ... other form fields are fine ... */}
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
                            ⚠️ Changing this email will also update the employee's login
                            credentials. The employee will need to use the new email to log in.
                        </p>
                    )}
                    {!errors.companyEmail && !employee && (
                        <p className="mt-1 text-sm text-gray-500">
                            This email will also be used for Firebase Auth login
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

            {/* Custom Fields for Employee Information (Step 1) */}
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

// Position Information Section
interface PositionInformationProps {
    formData: EmployeeModel;
    handleInputChange: (field: keyof EmployeeModel, value: any) => void;
    handleCustomFieldsChange: (section: CustomFieldSection, fields: CustomField[]) => void;
    errors: Record<string, string>;
    setOpenWorkArea: (open: boolean) => void;
    theme: string;
    employee?: EmployeeModel;
}

interface OptionModel {
    label: string;
    value: string;
}

export const PositionInformationSection: React.FC<PositionInformationProps> = ({
    formData,
    handleInputChange,
    handleCustomFieldsChange,
    errors,
    setOpenWorkArea,
    theme,
    employee,
}) => {
    const { hrSettings, activeEmployees: employees } = useFirestore();

    const sections = hrSettings.sectionSettings || [];
    const locations = hrSettings.locations || [];
    const positions = hrSettings.positions || [];
    const departments = hrSettings.departmentSettings || [];
    const GradeDefinition = hrSettings.grades || [];
    const shiftTypes = hrSettings.shiftTypes || [];
    const salaryScales = hrSettings.salaryScales || [];
    const [reportingLMOptions, setReportingLMOptions] = useState<OptionModel[]>([]);

    const filteredSections = sections.filter(section => section.active === true);
    const filteredLocations = locations.filter(location => location.active === "Yes");
    const filteredPositions = positions.filter(position => position.active === "Yes");
    const filteredShiftTypes = shiftTypes.filter(s => s.active === "Yes");

    const labelClasses = theme === "dark" ? "text-gray-200" : "text-primary-800";
    const inputClasses =
        theme === "dark"
            ? "bg-black border-gray-600 focus:border-blue-500 focus:ring-blue-500 text-white"
            : "border-gray-200 focus:border-primary-600 focus:ring-primary-600";

    // Helpers for Grade (row) + Step (column) salary mapping
    const salaryScale = salaryScales?.[0] || null;
    const numberOfSteps = salaryScale?.numberOfSteps || 0;
    const stepOptions = React.useMemo(
        () =>
            Array.from({ length: numberOfSteps }, (_, i) => ({
                value: String(i + 1),
                label: String(i + 1),
            })),
        [numberOfSteps],
    );

    useEffect(() => {
        // For new employees, show all active employees as potential managers
        if (!employee) {
            const options = employees.map(user => ({
                label: getFullName(user),
                value: user.uid,
            }));
            setReportingLMOptions(options);
            return;
        }

        // Get available managers (excluding current employee)
        const availableManagers = employees.filter(
            emp => emp.uid !== employee.uid && canBeReportee(emp.uid, employee.uid, employees),
        );

        // Always include the current manager if one exists, even if they wouldn't normally pass the check
        const currentManager = employees.find(emp => emp.uid === employee.reportingLineManager);
        const options: OptionModel[] = [
            ...availableManagers.map(user => ({
                label: getFullName(user),
                value: user.uid,
            })),
        ];

        // Add current manager if they exist and aren't already in the options
        if (
            currentManager &&
            currentManager.uid !== employee.uid &&
            !options.some(opt => opt.value === currentManager.uid)
        ) {
            options.unshift({
                label: getFullName(currentManager),
                value: currentManager.uid,
            });
        }

        setReportingLMOptions(options);
    }, [employees, employee?.uid, employee?.reportingLineManager]);

    // Prefer salary by Grade (ID) + Step (column). If not found, return undefined (skip update)
    const getSalaryForGradeAndStep = (gradeId: string, stepNum: number) => {
        if (!salaryScale || !gradeId || !stepNum) return undefined;
        const match = salaryScale.scales?.find(s => s.grade === gradeId && s.column === stepNum);
        return match?.salary;
    };

    const buildLocationTree = (
        locations: LocationModel[],
        parentId: string | null = null,
    ): LocationNode[] => {
        return locations
            .filter(location => location.parentId === parentId)
            .map(location => ({
                ...location,
                children: buildLocationTree(locations, location.id),
            }));
    };
    const locationTree = buildLocationTree(filteredLocations);

    const locationOptions = React.useMemo(() => {
        const convertToOptions = (
            nodes: LocationNode[],
        ): { value: string; label: string; children?: any[] }[] => {
            return nodes.map(node => ({
                value: node.id,
                label: node.name,
                children:
                    node.children && node.children.length > 0
                        ? convertToOptions(node.children)
                        : undefined,
            }));
        };
        return convertToOptions(locationTree);
    }, [locationTree]);

    const getDepartmentName = (departmentId: string) => {
        const department = departments.find(department => department.id === departmentId);
        return department?.name || "Unknown";
    };

    return (
        <div className="space-y-6">
            <h3 className="text-lg font-semibold text-primary-900 mb-6">Position Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {renderSelectField(
                    "employmentPosition",
                    "Employment Position",
                    formData.employmentPosition || "",
                    value => handleInputChange("employmentPosition", value),
                    filteredPositions.map(position => ({
                        value: position.id,
                        label: position.name,
                    })),
                    errors,
                    labelClasses,
                    inputClasses,
                    true,
                )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label htmlFor="workingLocation" className={labelClasses}>
                        Working Location
                    </label>
                    <div className="relative">
                        <CascaderDropdown
                            options={locationOptions}
                            setDynamicOptions={locationId =>
                                handleInputChange("workingLocation", locationId)
                            }
                            value={formData.workingLocation || ""}
                        />
                    </div>
                </div>
                <div className="space-y-2">
                    <label htmlFor="homeLocation" className={labelClasses}>
                        Home Location
                    </label>
                    <div className="relative">
                        <CascaderDropdown
                            options={locationOptions}
                            setDynamicOptions={locationId =>
                                handleInputChange("homeLocation", locationId)
                            }
                            value={formData.homeLocation || ""}
                        />
                    </div>
                </div>
            </div>
            <div className="space-y-2">
                <Button
                    className={`"" ${
                        theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-white"
                    }`}
                    onClick={() => setOpenWorkArea(true)}
                >
                    Working Area <Ellipsis className="ml-2 h-4 w-4" />
                </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {renderSelectField(
                    "section",
                    "Section",
                    formData.section || "",
                    value => {
                        handleInputChange("section", value);
                        const section = filteredSections.find(s => s.id == value);
                        const department = departments.find(d => d.id == section?.department);
                        handleInputChange("department", department?.id ?? "");
                    },
                    filteredSections.map(section => ({
                        value: section.id,
                        label: section.name,
                    })),
                    errors,
                    labelClasses,
                    inputClasses,
                )}
                <div className="space-y-2">
                    <Label htmlFor="department" className={labelClasses}>
                        Department
                    </Label>
                    <Input
                        id="department"
                        className={`${inputClasses} ${
                            errors["department"] ? "border-red-500" : ""
                        }`}
                        value={getDepartmentName(formData.department || "")}
                        readOnly
                    />
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Reporting Line Manager - Searchable Dropdown */}
                <div>
                    <Label htmlFor="reportingLineManager" className={labelClasses}>
                        Reporting Line Manager
                    </Label>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                role="combobox"
                                className={`mt-1 w-full justify-between ${inputClasses} ${errors["reportingLineManager"] ? "border-red-500" : ""}`}
                            >
                                {formData.reportingLineManager
                                    ? reportingLMOptions.find(
                                        opt => opt.value === formData.reportingLineManager,
                                    )?.label || "Select manager"
                                    : "Select manager"}
                                <svg
                                    className="ml-2 h-4 w-4 shrink-0 opacity-50"
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <path d="m6 9 6 6 6-6" />
                                </svg>
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent
                            className="w-[--radix-popover-trigger-width] p-0"
                            align="start"
                        >
                            <Command>
                                <CommandInput placeholder="Search manager..." />
                                <CommandList>
                                    <CommandEmpty>No managers found.</CommandEmpty>
                                    <CommandGroup>
                                        {formData.reportingLineManager && (
                                            <CommandItem
                                                onSelect={() => {
                                                    handleInputChange("reportingLineManager", "");
                                                    handleInputChange(
                                                        "reportingLineManagerPosition",
                                                        "",
                                                    );
                                                }}
                                                className="text-muted-foreground"
                                            >
                                                <X className="mr-2 h-4 w-4" />
                                                Clear Selection
                                            </CommandItem>
                                        )}
                                        {reportingLMOptions.map(option => (
                                            <CommandItem
                                                key={option.value}
                                                value={option.label}
                                                onSelect={() => {
                                                    const employee = employees.find(
                                                        e => e.uid === option.value,
                                                    );
                                                    handleInputChange(
                                                        "reportingLineManager",
                                                        option.value,
                                                    );
                                                    handleInputChange(
                                                        "reportingLineManagerPosition",
                                                        employee?.employmentPosition ?? "",
                                                    );
                                                }}
                                            >
                                                <Check
                                                    className={cn(
                                                        "mr-2 h-4 w-4",
                                                        formData.reportingLineManager ===
                                                            option.value
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
                    {errors["reportingLineManager"] && (
                        <p className="mt-1 text-sm text-red-500">
                            {errors["reportingLineManager"]}
                        </p>
                    )}
                </div>
                {renderSelectField(
                    "reportingLineManagerPosition",
                    "Reporting Line Manager Position",
                    formData.reportingLineManagerPosition || "",
                    value => handleInputChange("reportingLineManagerPosition", value),
                    filteredPositions.map(position => ({
                        value: position.id,
                        label: position.name,
                    })),
                    errors,
                    labelClasses,
                    inputClasses,
                    false,
                    "",
                    true,
                )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {renderSelectField(
                    "gradeLevel",
                    "Grade Level",
                    formData.gradeLevel || "",
                    value => {
                        handleInputChange("gradeLevel", value);
                        // If a step is already selected, recompute salary with grade+step
                        const stepNum = Number(formData.step || 0);
                        if (stepNum > 0) {
                            const sal = getSalaryForGradeAndStep(value, stepNum);
                            if (sal !== undefined) {
                                handleInputChange("salary", sal);
                            }
                        }
                    },
                    GradeDefinition.map(grade => ({
                        value: grade.id,
                        label: grade.grade,
                    })),
                    errors,
                    labelClasses,
                    inputClasses,
                    true,
                )}
                {renderSelectField(
                    "shiftType",
                    "Shift Type",
                    formData.shiftType || "",
                    value => handleInputChange("shiftType", value),
                    filteredShiftTypes.map(s => ({
                        label: s.name,
                        value: s.id,
                    })),
                    errors,
                    labelClasses,
                    inputClasses,
                    true,
                )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {renderSelectField(
                    "step",
                    "Step",
                    formData.step ? String(formData.step) : "",
                    val => {
                        // Store numeric step in form state
                        handleInputChange("step", Number(val));
                        const gradeId = formData.gradeLevel;
                        if (!gradeId) return; // Grade required first
                        const sal = getSalaryForGradeAndStep(gradeId, Number(val));
                        if (sal !== undefined) {
                            // Store numeric salary in form state
                            handleInputChange("salary", sal);
                        }
                    },
                    stepOptions,
                    errors,
                    labelClasses,
                    inputClasses,
                    false,
                    "Select step",
                    !formData.gradeLevel,
                )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {renderMultiSelectField(
                    "role",
                    "Role",
                    formData.role || [],
                    val => handleInputChange("role", val),
                    [
                        { value: "HR Manager", label: "HR Manager" },
                        { value: "Manager", label: "Manager" },
                        { value: "Payroll Officer", label: "Payroll Officer" },
                    ],
                    errors,
                    labelClasses,
                    inputClasses,
                    false,
                    "Select role(s)",
                )}
            </div>

            {/* Custom Fields for Position Information (Step 2) */}
            <CustomFieldsEditor
                fields={formData.customFields?.filter(f => f.section === "position") || []}
                onChange={fields => handleCustomFieldsChange("position", fields)}
                theme={theme}
                section="position"
                errors={errors}
            />
        </div>
    );
};

interface ContractInformationProps {
    formData: EmployeeModel;
    handleInputChange: (field: keyof EmployeeModel, value: string | number | boolean) => void;
    handleCustomFieldsChange: (section: CustomFieldSection, fields: CustomField[]) => void;
    errors: Record<string, string>;
    theme: string;
}

export const ContractInformationSection: React.FC<ContractInformationProps> = ({
    formData,
    handleInputChange,
    handleCustomFieldsChange,
    errors,
    theme,
}) => {
    const { hrSettings } = useFirestore();
    const currencies = hrSettings.currencies.filter(c => c.active);
    const taxes = hrSettings.taxes.filter(c => c.active);

    const contractTypes = hrSettings.contractTypes || [];
    const contractHours = hrSettings.contractHours || [];
    const ProbationDays = (hrSettings.probationDays && hrSettings.probationDays[0]) || null;
    const salaryScales = hrSettings.salaryScales || [];

    const filteredContractTypes = contractTypes.filter(
        contractType => contractType.active === "Yes",
    );
    const filteredContractHours = contractHours.filter(
        contractHour => contractHour.active === "Yes",
    );

    const labelClasses = theme === "dark" ? "text-gray-200" : "text-primary-800";
    const inputClasses =
        theme === "dark"
            ? "bg-black border-gray-600 focus:border-blue-500 focus:ring-blue-500 text-white"
            : "border-gray-200 focus:border-primary-600 focus:ring-primary-600";

    const getSalaryForGrade = (grade: string) => {
        for (const scale of salaryScales) {
            const scaleItem = scale.scales.find(s => s.grade === grade);
            if (scaleItem) return scaleItem.salary || 0;
        }
        return 0;
    };

    return (
        <div className="space-y-6">
            <h3 className="text-lg font-semibold text-primary-900 mb-6">Contract Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {renderSelectField(
                    "company",
                    "Company",
                    formData.company || "",
                    value => handleInputChange("company", value),
                    [
                        { value: "company-a", label: "Company A" },
                        { value: "company-b", label: "Company B" },
                    ],
                    errors,
                    labelClasses,
                    inputClasses,
                )}
                {renderSelectField(
                    "contractType",
                    "Contract Type",
                    formData.contractType || "",
                    value => handleInputChange("contractType", value),
                    filteredContractTypes.map(name => ({
                        value: name.id,
                        label: name.name,
                    })),
                    errors,
                    labelClasses,
                    inputClasses,
                )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {renderSelectField(
                    "contractHour",
                    "Contract Hour",
                    formData.contractHour?.toString() || "0",
                    value => handleInputChange("contractHour", value),
                    filteredContractHours.map(hour => ({
                        value: hour.id,
                        label: hour.hourPerWeek.toString(),
                    })),
                    errors,
                    labelClasses,
                    inputClasses,
                )}
                {renderSelectField(
                    "contractStatus",
                    "Contract Status",
                    formData.contractStatus || "",
                    value => handleInputChange("contractStatus", value),
                    [
                        { value: "active", label: "Active" },
                        { value: "inactive", label: "Inactive" },
                        { value: "terminated", label: "Terminated" },
                    ],
                    errors,
                    labelClasses,
                    inputClasses,
                    true,
                )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {renderFormField(
                    "probationPeriodEndDate",
                    "Probation Period End Date",
                    formData.probationPeriodEndDate || "",
                    value => handleInputChange("probationPeriodEndDate", value),
                    errors,
                    labelClasses,
                    inputClasses,
                    false,
                    "date",
                )}
                {renderFormField(
                    "lastDateOfProbation",
                    "Last Date of Probation",
                    formData.lastDateOfProbation || "",
                    value => handleInputChange("lastDateOfProbation", value),
                    errors,
                    labelClasses,
                    inputClasses,
                    false,
                    "date",
                )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {renderFormField(
                    "contractStartingDate",
                    "Contract Starting Date",
                    formData.contractStartingDate || "",
                    value => {
                        handleInputChange("contractStartingDate", value);
                        try {
                            if (value && formData.shiftType) {
                                const startDate = dayjs(value);
                                const selectedShiftType = (hrSettings.shiftTypes || []).find(
                                    shift => shift.id === formData.shiftType,
                                );
                                if (selectedShiftType && ProbationDays?.value) {
                                    const workingProbationDays = calculateProbationEndDate(
                                        startDate,
                                        selectedShiftType,
                                        ProbationDays.value,
                                    );
                                    const probationPeriodEndDate = startDate.add(
                                        workingProbationDays,
                                        "day",
                                    );
                                    handleInputChange(
                                        "probationPeriodEndDate",
                                        probationPeriodEndDate.format("YYYY-MM-DD"),
                                    );
                                }
                            } else {
                                handleInputChange("probationPeriodEndDate", "");
                            }
                        } catch (error) {
                            console.error("Error calculating probation end date:", error);
                        }
                    },
                    errors,
                    labelClasses,
                    inputClasses,
                    true,
                    "date",
                )}
                {renderFormField(
                    "contractTerminationDate",
                    "Contract Termination Date",
                    formData.contractTerminationDate || "",
                    value => {
                        handleInputChange("contractTerminationDate", value);
                    },
                    errors,
                    labelClasses,
                    inputClasses,
                    false,
                    "date",
                )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {renderFormField(
                    "salary",
                    "Salary",
                    formData.salary !== undefined && formData.salary !== null
                        ? String(formData.salary)
                        : getSalaryForGrade(formData.gradeLevel)?.toString() || "",
                    value => handleInputChange("salary", Number(value)),
                    errors,
                    labelClasses,
                    inputClasses,
                    false,
                    "number",
                    "",
                )}
                {renderSelectField(
                    "associatedTax",
                    "Associated Tax",
                    formData.associatedTax || "",
                    value => handleInputChange("associatedTax", value),
                    taxes.map(t => ({ label: t.taxName, value: t.id })),
                    errors,
                    labelClasses,
                    inputClasses,
                    true,
                )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {renderSelectField(
                    "currency",
                    "Currency",
                    formData.currency || "",
                    value => handleInputChange("currency", value),
                    currencies.map(c => ({ label: c.name, value: c.id })),
                    errors,
                    labelClasses,
                    inputClasses,
                    true,
                )}
                {renderFormField(
                    "eligibleLeaveDays",
                    "Eligible Leave Days",
                    formData.eligibleLeaveDays ? formData.eligibleLeaveDays.toString() : "0",
                    value => handleInputChange("eligibleLeaveDays", value),
                    errors,
                    labelClasses,
                    inputClasses,
                    true,
                    "number",
                )}
                <div className="flex gap-3 items-center">
                    <p className="text-sm font-medium">Pension Application</p>
                    <Checkbox
                        checked={formData.pensionApplication}
                        onCheckedChange={() =>
                            handleInputChange("pensionApplication", !formData.pensionApplication)
                        }
                    />
                </div>
            </div>

            {/* Custom Fields for Contract Information (Step 3) */}
            <CustomFieldsEditor
                fields={formData.customFields?.filter(f => f.section === "contract") || []}
                onChange={fields => handleCustomFieldsChange("contract", fields)}
                theme={theme}
                section="contract"
                errors={errors}
            />
        </div>
    );
};

// Emergency Contact Section
interface EmergencyContactProps {
    formData: EmployeeModel;
    handleInputChange: (field: keyof EmployeeModel, value: string) => void;
    handleCustomFieldsChange: (section: CustomFieldSection, fields: CustomField[]) => void;
    errors: Record<string, string>;
    theme: string;
}

export const EmergencyContactSection: React.FC<EmergencyContactProps> = ({
    formData,
    handleInputChange,
    handleCustomFieldsChange,
    errors,
    theme,
}) => {
    const labelClasses = theme === "dark" ? "text-gray-200" : "text-primary-800";
    const inputClasses =
        theme === "dark"
            ? "bg-black border-gray-600 focus:border-blue-500 focus:ring-blue-500 text-white"
            : "border-gray-200 focus:border-primary-600 focus:ring-primary-600";

    return (
        <div className="space-y-6">
            <h3 className="text-lg font-semibold text-primary-900 mb-6">
                Emergency Contact Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {renderFormField(
                    "emergencyContactName",
                    "Emergency Contact Name",
                    formData.emergencyContactName || "",
                    value => handleInputChange("emergencyContactName", value),
                    errors,
                    labelClasses,
                    inputClasses,
                    true,
                )}
                {renderFormField(
                    "relationshipToEmployee",
                    "Relationship to Employee",
                    formData.relationshipToEmployee || "",
                    value => handleInputChange("relationshipToEmployee", value),
                    errors,
                    labelClasses,
                    inputClasses,
                    true,
                )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {renderFormField(
                    "phoneNumber1",
                    "Phone Number 1",
                    formData.phoneNumber1,
                    value => handleInputChange("phoneNumber1", value),
                    errors,
                    labelClasses,
                    inputClasses,
                    true,
                )}
                {renderFormField(
                    "phoneNumber2",
                    "Phone Number 2",
                    formData.phoneNumber2 || "",
                    value => handleInputChange("phoneNumber2", value),
                    errors,
                    labelClasses,
                    inputClasses,
                )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {renderFormField(
                    "emailAddress1",
                    "Email Address 1",
                    formData.emailAddress1 || "",
                    value => handleInputChange("emailAddress1", value),
                    errors,
                    labelClasses,
                    inputClasses,
                    true,
                    "email",
                )}
                {renderFormField(
                    "emailAddress2",
                    "Email Address 2",
                    formData.emailAddress2 || "",
                    value => handleInputChange("emailAddress2", value),
                    errors,
                    labelClasses,
                    inputClasses,
                    false,
                    "email",
                )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {renderFormField(
                    "physicalAddress1",
                    "Physical Address 1",
                    formData.physicalAddress1 || "",
                    value => handleInputChange("physicalAddress1", value),
                    errors,
                    labelClasses,
                    inputClasses,
                    true,
                )}
                {renderFormField(
                    "physicalAddress2",
                    "Physical Address 2",
                    formData.physicalAddress2 || "",
                    value => handleInputChange("physicalAddress2", value),
                    errors,
                    labelClasses,
                    inputClasses,
                )}
            </div>

            {/* Custom Fields for Emergency Contact (Step 4) */}
            <CustomFieldsEditor
                fields={formData.customFields?.filter(f => f.section === "emergency") || []}
                onChange={fields => handleCustomFieldsChange("emergency", fields)}
                theme={theme}
                section="emergency"
                errors={errors}
            />
        </div>
    );
};
