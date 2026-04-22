"use client";

import type React from "react";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, User, Briefcase, FileText, Phone, ChevronDown, ChevronRight } from "lucide-react";
import type { EmployeeModel } from "@/lib/models/employee";
import { useTheme } from "@/components/theme-provider";
import { CustomFieldsSection } from "@/components/ui/custom-fields";
import { useData } from "@/context/app-data-context";
import getEmployeeFullName from "@/lib/util/getEmployeeFullName";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface EmployeeDetailsModalProps {
    employee: EmployeeModel;
    onClose: () => void;
    onEdit: (employee: EmployeeModel) => void;
}

export function EmployeeDetailsModal({ employee, onClose, onEdit }: EmployeeDetailsModalProps) {
    const { theme } = useTheme();
    const { employees, ...hrSettings } = useData();
    const [isReporteesOpen, setIsReporteesOpen] = useState<boolean>(false);
    const {
        sectionSettings,
        locations,
        contractTypes,
        contractHours,
        maritalStatuses,
        positions,
        departmentSettings,
        grades,
        shiftTypes,
        yearsOfExperiences,
        levelOfEducations,
        taxes,
    } = hrSettings;

    const getName = (items: { id: string; name: string }[], id: string) =>
        items.find(item => item.id === id)?.name || "Unknown";

    const getLocationName = (locationId: string) => getName(locations, locationId);
    const getSectionName = (sectionId: string) => getName(sectionSettings, sectionId);
    const getContractTypeName = (contractTypeId: string) => getName(contractTypes, contractTypeId);
    const getMaritalStatusName = (maritalStatusId: string) =>
        getName(maritalStatuses, maritalStatusId);
    const getEmploymentPositionName = (positionId: string) => getName(positions, positionId);
    const getDepartmentName = (departmentId: string) => getName(departmentSettings, departmentId);
    const getShiftTypeName = (shiftTypeId: string) => getName(shiftTypes, shiftTypeId);
    const getYearsOfExperienceName = (yearsOfExperienceId: string) =>
        getName(yearsOfExperiences, yearsOfExperienceId);
    const getLevelOfEducationName = (levelOfEducationId: string) =>
        getName(levelOfEducations, levelOfEducationId);
    const getContractHourName = (contractHourValue: string | number) => {
        if (
            contractHourValue === "Custom" ||
            contractHourValue === undefined ||
            contractHourValue === null
        ) {
            return contractHourValue === "Custom" ? "Custom" : "";
        }
        const contractHour = contractHours.find(
            contractHour => contractHour.id === contractHourValue.toString(),
        );
        return contractHour?.hourPerWeek?.toString() || "";
    };
    const getGradeName = (grade: string) => {
        const gradeName = grades.find(g => g.id === grade);
        return gradeName?.grade || grade;
    };
    const getTaxName = (taxId: string) => {
        const tax = taxes.find(t => t.id === taxId);
        return tax?.taxName || taxId;
    };
    const getCurrency = (id: string) => hrSettings.currencies.find(c => c.id === id)?.name ?? "";

    const getManagerFullName = (managerId: string) => {
        if (!managerId) return "Unknown";
        const manager = employees.find(emp => emp.uid === managerId);
        return manager ? getEmployeeFullName(manager) : "Unknown";
    };

    // Get reportees for the current employee
    const reportees = employee.reportees
        ?.map(reporteeId => employees.find(emp => emp.uid === reporteeId))
        .filter(Boolean) as EmployeeModel[] | undefined;

    const renderSection = (title: string, icon: React.ReactNode, children: React.ReactNode) => (
        <div
            className={`${theme === "dark" ? "bg-black border-gray-800" : "bg-white border-gray-200"} rounded-lg border p-6`}
        >
            <div className="flex items-center gap-2 mb-4">
                {icon}
                <h3
                    className={`text-lg font-semibold ${theme === "dark" ? "text-white" : "text-primary-900"}`}
                >
                    {title}
                </h3>
            </div>
            {children}
        </div>
    );

    const renderField = (label: string, value?: string | string[]) => {
        if (!value || (Array.isArray(value) && value.length === 0)) return null;

        if (label === "Role" && Array.isArray(value)) {
            return (
                <div className="grid grid-cols-3 gap-4 py-2 border-b last:border-b-0">
                    <dt
                        className={`text-sm font-medium ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}
                    >
                        {label}:
                    </dt>
                    <dd className="flex flex-wrap gap-2">
                        {value.map((role, index) => (
                            <Badge key={index} variant="destructive">
                                {role}
                            </Badge>
                        ))}
                    </dd>
                </div>
            );
        }

        return (
            <div
                className={`grid grid-cols-3 gap-4 py-2 border-b last:border-b-0 ${theme === "dark" ? "border-gray-800" : "border-gray-100"}`}
            >
                <dt
                    className={`text-sm font-medium ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}
                >
                    {label}:
                </dt>
                <dd className={`text-sm ${theme === "dark" ? "text-white" : "text-primary-900"}`}>
                    {value}
                </dd>
            </div>
        );
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div
                className={`${theme === "dark" ? "bg-black border border-gray-800" : "bg-secondary-50"} rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-xl`}
            >
                <div
                    className={`flex items-center justify-between p-6 border-b ${theme === "dark" ? "bg-black border-gray-800" : "bg-white border-gray-200"}`}
                >
                    <div className="flex items-center gap-4">
                        <div
                            className={`w-12 h-12 rounded-full flex items-center justify-center ${theme === "dark" ? "bg-gray-800" : "bg-primary-100"}`}
                        >
                            <User
                                className={`w-6 h-6 ${theme === "dark" ? "text-white" : "text-primary-700"}`}
                            />
                        </div>
                        <div>
                            <h2
                                className={`text-xl font-semibold ${theme === "dark" ? "text-white" : "text-primary-900"}`}
                            >
                                {employee.firstName} {employee.middleName} {employee.surname}
                            </h2>
                            <p
                                className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}
                            >
                                Employee ID: {employee.employeeID}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            onClick={() => onEdit(employee)}
                            className={`${theme === "dark" ? "bg-white text-black hover:bg-gray-300" : "bg-accent-600 hover:bg-accent-700 text-black"}`}
                        >
                            Edit Employee
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onClose}
                            className={`${theme === "dark" ? "text-white hover:bg-gray-800" : "hover:bg-gray-100"}`}
                        >
                            <X className="w-4 h-4" />
                        </Button>
                    </div>
                </div>

                <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)] space-y-6">
                    {/* Employee Information */}
                    {renderSection(
                        "Employee Information",
                        <User className="w-5 h-5 text-primary-600" />,
                        <dl className="space-y-0">
                            {renderField("First Name", employee.firstName)}
                            {renderField("Middle Name", employee.middleName ?? "")}
                            {renderField("Surname", employee.surname)}
                            {renderField("Birth Date", employee.birthDate)}
                            {renderField("Employee ID", employee.employeeID)}
                            {renderField(
                                "Level of Education",
                                getLevelOfEducationName(employee.levelOfEducation),
                            )}
                            {renderField(
                                "Years of Experience",
                                getYearsOfExperienceName(employee.yearsOfExperience),
                            )}
                            {renderField("Birth Place", employee.birthPlace)}
                            {renderField(
                                "Gender",
                                employee.gender
                                    ? employee.gender.charAt(0).toUpperCase() +
                                          employee.gender.slice(1)
                                    : "",
                            )}
                            {renderField(
                                "Marital Status",
                                getMaritalStatusName(employee.maritalStatus),
                            )}
                            {renderField("Personal Phone", employee.personalPhoneNumber)}
                            {renderField("Personal Email", employee.personalEmail)}
                            {renderField("Bank Account", employee.bankAccount)}
                            {renderField("Provident Fund Account", employee.providentFundAccount)}
                            {renderField("TIN Number", employee.tinNumber)}
                            {renderField("Passport Number", employee.passportNumber)}
                            {renderField("National ID Number", employee.nationalIDNumber)}
                        </dl>,
                    )}

                    {/* Position Information */}
                    {renderSection(
                        "Position Information",
                        <Briefcase className="w-5 h-5 text-primary-600" />,
                        <dl className="space-y-0">
                            {renderField(
                                "Employment Position",
                                getEmploymentPositionName(employee.employmentPosition),
                            )}
                            {renderField("Department", getDepartmentName(employee.department))}
                            {renderField("Section", getSectionName(employee.section))}
                            {renderField("Unit", employee.unit)}
                            {renderField(
                                "Working Location",
                                getLocationName(employee.workingLocation),
                            )}
                            {renderField("Home Location", getLocationName(employee.homeLocation))}
                            {renderField("Working Area", getLocationName(employee.workingArea))}
                            {renderField(
                                "Reporting Line Manager",
                                getManagerFullName(employee.reportingLineManager),
                            )}
                            {renderField(
                                "Reporting Line Manager Position",
                                getEmploymentPositionName(employee.reportingLineManagerPosition),
                            )}
                            {renderField("Grade Level", getGradeName(employee.gradeLevel))}
                            {renderField("Step", employee.step?.toString())}
                            {renderField("Shift Type", getShiftTypeName(employee.shiftType))}
                            {renderField("Role", employee.role)}

                            {/* Reportees Collapsible Section */}
                            {reportees && reportees.length > 0 && (
                                <Collapsible
                                    open={isReporteesOpen}
                                    onOpenChange={setIsReporteesOpen}
                                >
                                    <CollapsibleTrigger asChild>
                                        <div
                                            className={`grid grid-cols-3 gap-4 py-2 border-b last:border-b-0 cursor-pointer hover:bg-opacity-50 ${theme === "dark" ? "border-gray-800 hover:bg-gray-800" : "border-gray-100 hover:bg-gray-50"}`}
                                        >
                                            <dt
                                                className={`text-sm font-medium ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}
                                            >
                                                Reportees:
                                            </dt>
                                            <dd
                                                className={`text-sm flex items-center gap-2 ${theme === "dark" ? "text-white" : "text-primary-900"}`}
                                            >
                                                <span>
                                                    {reportees.length} employee
                                                    {reportees.length !== 1 ? "s" : ""}
                                                </span>
                                                {isReporteesOpen ? (
                                                    <ChevronDown className="w-4 h-4" />
                                                ) : (
                                                    <ChevronRight className="w-4 h-4" />
                                                )}
                                            </dd>
                                        </div>
                                    </CollapsibleTrigger>
                                    <CollapsibleContent>
                                        <div
                                            className={`mt-2 space-y-2 pl-4 border-l-2 ${theme === "dark" ? "border-gray-700" : "border-gray-200"}`}
                                        >
                                            {reportees.map(reportee => (
                                                <div
                                                    key={reportee.id}
                                                    className={`p-2 rounded ${theme === "dark" ? "bg-gray-800" : "bg-gray-50"}`}
                                                >
                                                    <div
                                                        className={`text-sm font-medium ${theme === "dark" ? "text-white" : "text-primary-900"}`}
                                                    >
                                                        {reportee.firstName} {reportee.middleName}{" "}
                                                        {reportee.surname}
                                                    </div>
                                                    <div
                                                        className={`text-xs ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}
                                                    >
                                                        {getEmploymentPositionName(
                                                            reportee.employmentPosition,
                                                        )}{" "}
                                                        - {getDepartmentName(reportee.department)}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </CollapsibleContent>
                                </Collapsible>
                            )}
                        </dl>,
                    )}

                    {/* Contract Information */}
                    {renderSection(
                        "Contract Information",
                        <FileText className="w-5 h-5 text-primary-600" />,
                        <dl className="space-y-0">
                            {renderField("Company", employee.company)}
                            {renderField(
                                "Contract Type",
                                getContractTypeName(employee.contractType),
                            )}
                            {renderField(
                                "Contract Hour",
                                getContractHourName(employee.contractHour),
                            )}
                            <div className="grid grid-cols-3 gap-4 py-2 border-b">
                                <dt className="text-sm font-medium text-gray-400">
                                    Contract Status:
                                </dt>
                                <dd className="col-span-2">
                                    {employee.contractStatus && (
                                        <Badge
                                            className={
                                                employee.contractStatus.toLowerCase() === "active"
                                                    ? "bg-green-100 text-green-800 border-green-200"
                                                    : employee.contractStatus.toLowerCase() ===
                                                        "inactive"
                                                        ? "bg-yellow-100 text-yellow-800 border-yellow-200"
                                                        : employee.contractStatus.toLowerCase() ===
                                                          "terminated"
                                                            ? "bg-red-100 text-red-800 border-red-200"
                                                            : "bg-gray-100 text-gray-800 border-gray-200"
                                            }
                                        >
                                            {employee.contractStatus.charAt(0).toUpperCase() +
                                                employee.contractStatus.slice(1)}
                                        </Badge>
                                    )}
                                </dd>
                            </div>
                            {renderField("Contract Starting Date", employee.contractStartingDate)}
                            {renderField(
                                "Contract Termination Date",
                                employee.contractTerminationDate,
                            )}
                            {renderField("Hire Date", employee.hireDate)}
                            {renderField("Contract Document", employee.contractDocument)}
                            {renderField(
                                "Probation Period End Date",
                                employee.probationPeriodEndDate,
                            )}
                            {renderField("Last Date of Probation", employee.lastDateOfProbation)}
                            {renderField("Reason of Leaving", employee.reasonOfLeaving)}
                            {renderField(
                                "Salary",
                                employee.salary
                                    ? `${employee.salary} ${getCurrency(employee.currency)}`
                                    : undefined,
                            )}
                            {renderField("Associated Tax", getTaxName(employee.associatedTax))}
                            {renderField(
                                "Eligible Leave Days",
                                employee.eligibleLeaveDays?.toString(),
                            )}
                            {renderField("Company Email", employee.companyEmail)}
                            {renderField("Company Phone Number", employee.companyPhoneNumber)}
                            {renderField("Hourly Wage", `${employee.hourlyWage} hour(s)`)}
                            {renderField("Pension Application", `${employee.pensionApplication}`)}
                        </dl>,
                    )}

                    {/* Emergency Contact */}
                    {renderSection(
                        "Emergency Contact Information",
                        <Phone className="w-5 h-5 text-primary-600" />,
                        <dl className="space-y-0">
                            {renderField("Emergency Contact Name", employee.emergencyContactName)}
                            {renderField(
                                "Relationship to Employee",
                                employee.relationshipToEmployee,
                            )}
                            {renderField("Phone Number 1", employee.phoneNumber1)}
                            {renderField("Phone Number 2", employee.phoneNumber2)}
                            {renderField("Email Address 1", employee.emailAddress1)}
                            {renderField("Email Address 2", employee.emailAddress2)}
                            {renderField("Physical Address 1", employee.physicalAddress1)}
                            {renderField("Physical Address 2", employee.physicalAddress2)}
                        </dl>,
                    )}

                    {/* Custom Fields Sections - Filtered by section */}
                    {employee.customFields &&
                        employee.customFields.filter(f => f.section === "employee").length > 0 && (
                        <CustomFieldsSection
                            fields={employee.customFields.filter(f => f.section === "employee")}
                            title="Custom Fields - Employee Information"
                            theme={theme}
                        />
                    )}

                    {employee.customFields &&
                        employee.customFields.filter(f => f.section === "position").length > 0 && (
                        <CustomFieldsSection
                            fields={employee.customFields.filter(f => f.section === "position")}
                            title="Custom Fields - Position Information"
                            theme={theme}
                        />
                    )}

                    {employee.customFields &&
                        employee.customFields.filter(f => f.section === "contract").length > 0 && (
                        <CustomFieldsSection
                            fields={employee.customFields.filter(f => f.section === "contract")}
                            title="Custom Fields - Contract Information"
                            theme={theme}
                        />
                    )}

                    {employee.customFields &&
                        employee.customFields.filter(f => f.section === "emergency").length > 0 && (
                        <CustomFieldsSection
                            fields={employee.customFields.filter(
                                f => f.section === "emergency",
                            )}
                            title="Custom Fields - Emergency Contact"
                            theme={theme}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
