import { EmployeeModel } from "@/lib/models/employee";
interface SettingsLookupState {
    positions?: Array<{ id: string; name: string }>;
    departmentSettings?: Array<{ id: string; name: string }>;
    sectionSettings?: Array<{ id: string; name: string }>;
    grades?: Array<{ id: string; grade: string }>;
    shiftTypes?: Array<{ id: string; name: string }>;
    locations?: Array<{ id: string; name: string }>;
    contractTypes?: Array<{ id: string; name: string }>;
    currencies?: Array<{ id: string; name: string }>;
    levelOfEducations?: Array<{ id: string; name: string }>;
    yearsOfExperiences?: Array<{ id: string; name: string }>;
    maritalStatuses?: Array<{ id: string; name: string }>;
}

/**
 * Replace dynamic placeholders in document content with actual employee data
 * @param content - The template content with placeholders (e.g., {employeeName}, {employeeID})
 * @param employee - The employee data to use for replacement
 * @param settingsLookup - settings data to look up IDs for names
 * @returns The content with all placeholders replaced
 */
export function replaceDynamicFields(
    content: string,
    employee: EmployeeModel | null,
    settingsLookup?: SettingsLookupState,
): string {
    if (!employee) return content;

    const fullName = [employee.firstName, employee.middleName, employee.surname]
        .filter(Boolean)
        .join(" ");

    // Helper function to get position name by ID
    const getPositionName = (id: string | undefined): string => {
        if (!id || !settingsLookup?.positions) return id || "";
        const position = settingsLookup.positions.find(p => p.id === id);
        return position?.name || id;
    };

    // Helper function to get department name by ID
    const getDepartmentName = (id: string | undefined): string => {
        if (!id || !settingsLookup?.departmentSettings) return id || "";
        const department = settingsLookup.departmentSettings.find(d => d.id === id);
        return department?.name || id;
    };

    // Helper function to get section name by ID
    const getSectionName = (id: string | undefined): string => {
        if (!id || !settingsLookup?.sectionSettings) return id || "";
        const section = settingsLookup.sectionSettings.find(s => s.id === id);
        return section?.name || id;
    };

    // Helper function to get grade name by ID
    const getGradeName = (id: string | undefined): string => {
        if (!id || !settingsLookup?.grades) return id || "";
        const grade = settingsLookup.grades.find(g => g.id === id);
        return grade?.grade || id;
    };

    // Helper function to get shift type name by ID
    const getShiftTypeName = (id: string | undefined): string => {
        if (!id || !settingsLookup?.shiftTypes) return id || "";
        const shiftType = settingsLookup.shiftTypes.find(s => s.id === id);
        return shiftType?.name || id;
    };

    // Helper function to get location name by ID
    const getLocationName = (id: string | undefined): string => {
        if (!id || !settingsLookup?.locations) return id || "";
        const location = settingsLookup.locations.find(l => l.id === id);
        return location?.name || id;
    };

    // Helper function to get contract type name by ID
    const getContractTypeName = (id: string | undefined): string => {
        if (!id || !settingsLookup?.contractTypes) return id || "";
        const contractType = settingsLookup.contractTypes.find(c => c.id === id);
        return contractType?.name || id;
    };

    // Helper function to get currency name by ID
    const getCurrencyName = (id: string | undefined): string => {
        if (!id || !settingsLookup?.currencies) return id || "";
        const currency = settingsLookup.currencies.find(c => c.id === id);
        return currency?.name || id;
    };

    // Helper function to get level of education name by ID
    const getLevelOfEducationName = (id: string | undefined): string => {
        if (!id || !settingsLookup?.levelOfEducations) return id || "";
        const level = settingsLookup.levelOfEducations.find(l => l.id === id);
        return level?.name || id;
    };

    // Helper function to get years of experience name by ID
    const getYearsOfExperienceName = (id: string | undefined): string => {
        if (!id || !settingsLookup?.yearsOfExperiences) return id || "";
        const years = settingsLookup.yearsOfExperiences.find(y => y.id === id);
        return years?.name || id;
    };

    // Helper function to get marital status name by ID
    const getMaritalStatusName = (id: string | undefined): string => {
        if (!id || !settingsLookup?.maritalStatuses) return id || "";
        const status = settingsLookup.maritalStatuses.find(s => s.id === id);
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
