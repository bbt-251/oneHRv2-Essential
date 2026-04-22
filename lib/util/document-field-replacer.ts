import { EmployeeModel } from "@/lib/models/employee";
import type { HrSettingsState } from "@/hooks/use-hr-settings";

/**
 * Replace dynamic placeholders in document content with actual employee data
 * @param content - The template content with placeholders (e.g., {employeeName}, {employeeID})
 * @param employee - The employee data to use for replacement
 * @param hrSettings - HR settings data to look up IDs for names
 * @returns The content with all placeholders replaced
 */
export function replaceDynamicFields(
    content: string,
    employee: EmployeeModel | null,
    hrSettings?: HrSettingsState,
): string {
    if (!employee) return content;

    const fullName = [employee.firstName, employee.middleName, employee.surname]
        .filter(Boolean)
        .join(" ");

    // Helper function to get position name by ID
    const getPositionName = (id: string | undefined): string => {
        if (!id || !hrSettings?.positions) return id || "";
        const position = hrSettings.positions.find(p => p.id === id);
        return position?.name || id;
    };

    // Helper function to get department name by ID
    const getDepartmentName = (id: string | undefined): string => {
        if (!id || !hrSettings?.departmentSettings) return id || "";
        const department = hrSettings.departmentSettings.find(d => d.id === id);
        return department?.name || id;
    };

    // Helper function to get section name by ID
    const getSectionName = (id: string | undefined): string => {
        if (!id || !hrSettings?.sectionSettings) return id || "";
        const section = hrSettings.sectionSettings.find(s => s.id === id);
        return section?.name || id;
    };

    // Helper function to get grade name by ID
    const getGradeName = (id: string | undefined): string => {
        if (!id || !hrSettings?.grades) return id || "";
        const grade = hrSettings.grades.find(g => g.id === id);
        return grade?.grade || id;
    };

    // Helper function to get shift type name by ID
    const getShiftTypeName = (id: string | undefined): string => {
        if (!id || !hrSettings?.shiftTypes) return id || "";
        const shiftType = hrSettings.shiftTypes.find(s => s.id === id);
        return shiftType?.name || id;
    };

    // Helper function to get location name by ID
    const getLocationName = (id: string | undefined): string => {
        if (!id || !hrSettings?.locations) return id || "";
        const location = hrSettings.locations.find(l => l.id === id);
        return location?.name || id;
    };

    // Helper function to get contract type name by ID
    const getContractTypeName = (id: string | undefined): string => {
        if (!id || !hrSettings?.contractTypes) return id || "";
        const contractType = hrSettings.contractTypes.find(c => c.id === id);
        return contractType?.name || id;
    };

    // Helper function to get currency name by ID
    const getCurrencyName = (id: string | undefined): string => {
        if (!id || !hrSettings?.currencies) return id || "";
        const currency = hrSettings.currencies.find(c => c.id === id);
        return currency?.name || id;
    };

    // Helper function to get level of education name by ID
    const getLevelOfEducationName = (id: string | undefined): string => {
        if (!id || !hrSettings?.levelOfEducations) return id || "";
        const level = hrSettings.levelOfEducations.find(l => l.id === id);
        return level?.name || id;
    };

    // Helper function to get years of experience name by ID
    const getYearsOfExperienceName = (id: string | undefined): string => {
        if (!id || !hrSettings?.yearsOfExperiences) return id || "";
        const years = hrSettings.yearsOfExperiences.find(y => y.id === id);
        return years?.name || id;
    };

    // Helper function to get marital status name by ID
    const getMaritalStatusName = (id: string | undefined): string => {
        if (!id || !hrSettings?.maritalStatuses) return id || "";
        const status = hrSettings.maritalStatuses.find(s => s.id === id);
        return status?.name || id;
    };

    // Build replacement values - using single curly braces to match database format
    const replacements: Record<string, string> = {
        // Employee basic information
        "{employeeName}": fullName,
        "{firstName}": employee.firstName || "",
        "{middleName}": employee.middleName || "",
        "{surname}": employee.surname || "",
        "{employeeID}": employee.employeeID || "",
        "{department}": getDepartmentName(employee.department),
        "{position}": getPositionName(employee.employmentPosition),
        "{employmentPosition}": getPositionName(employee.employmentPosition),
        "{section}": getSectionName(employee.section),
        "{unit}": employee.unit || "",
        "{gradeLevel}": getGradeName(employee.gradeLevel),
        "{step}": employee.step?.toString() || "",
        "{shiftType}": getShiftTypeName(employee.shiftType),
        "{workingLocation}": getLocationName(employee.workingLocation),
        "{workingArea}": employee.workingArea || "",

        // Contract information
        "{company}": employee.company || "",
        "{contractType}": getContractTypeName(employee.contractType),
        "{contractStatus}": employee.contractStatus || "",
        "{hireDate}": employee.hireDate || "",
        "{contractStartingDate}": employee.contractStartingDate || "",
        "{contractTerminationDate}": employee.contractTerminationDate || "",
        "{probationPeriodEndDate}": employee.probationPeriodEndDate || "",
        "{salary}": employee.salary?.toLocaleString() || "",
        "{currency}": getCurrencyName(employee.currency),
        "{hourlyWage}": employee.hourlyWage?.toLocaleString() || "",
        "{hoursPerWeek}": employee.hoursPerWeek?.toString() || "",
        "{eligibleLeaveDays}": employee.eligibleLeaveDays?.toString() || "",

        // Personal information
        "{birthDate}": employee.birthDate || "",
        "{birthPlace}": employee.birthPlace || "",
        "{gender}": employee.gender || "",
        "{maritalStatus}": getMaritalStatusName(employee.maritalStatus),
        "{personalEmail}": employee.personalEmail || "",
        "{personalPhoneNumber}": employee.personalPhoneNumber || "",
        "{companyEmail}": employee.companyEmail || "",
        "{companyPhoneNumber}": employee.companyPhoneNumber || "",

        // Identification
        "{nationalIDNumber}": employee.nationalIDNumber || "",
        "{passportNumber}": employee.passportNumber || "",
        "{tinNumber}": employee.tinNumber || "",
        "{bankAccount}": employee.bankAccount || "",
        "{providentFundAccount}": employee.providentFundAccount || "",

        // Emergency contact
        "{emergencyContactName}": employee.emergencyContactName || "",
        "{relationshipToEmployee}": employee.relationshipToEmployee || "",
        "{emergencyPhoneNumber1}": employee.phoneNumber1 || "",
        "{emergencyPhoneNumber2}": employee.phoneNumber2 || "",
        "{emergencyEmailAddress1}": employee.emailAddress1 || "",
        "{emergencyEmailAddress2}": employee.emailAddress2 || "",
        "{emergencyPhysicalAddress1}": employee.physicalAddress1 || "",
        "{emergencyPhysicalAddress2}": employee.physicalAddress2 || "",

        // Education
        "{levelOfEducation}": getLevelOfEducationName(employee.levelOfEducation),
        "{yearsOfExperience}": getYearsOfExperienceName(employee.yearsOfExperience),

        // Manager information
        "{reportingLineManager}": employee.reportingLineManager || "",
        "{reportingLineManagerPosition}": getPositionName(employee.reportingLineManagerPosition),

        // Date placeholders
        "{currentDate}": new Date().toLocaleDateString(),
        "{currentYear}": new Date().getFullYear().toString(),
        "{currentMonth}": new Date().toLocaleString("default", { month: "long" }),
        "{currentDay}": new Date().getDate().toString(),
    };

    // Replace all placeholders
    let result = content;
    Object.entries(replacements).forEach(([key, value]) => {
        result = result.replace(new RegExp(key.replace(/[{}]/g, "\\$&"), "g"), value);
    });

    return result;
}
