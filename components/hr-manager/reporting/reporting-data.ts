"use client";

import type { HrFilterConfig, HrMeasureConfig } from "./report-types";
import { aggregateHrReportingData } from "@/lib/api/hr-reporting/hr-aggregation-service";

export const HR_AVAILABLE_DIMENSIONS = [
    // Leave
    { value: "leaveState", label: "Leave State" },
    { value: "leaveStage", label: "Leave Stage" },
    { value: "leaveType", label: "Leave Type" },

    // Overtime
    { value: "overtimeType", label: "Overtime Type" },
    { value: "overtimeStatus", label: "Overtime Status" },

    // Performance / objective dimensions
    { value: "period", label: "Period" },
    { value: "evaluationsReference", label: "Evaluations Reference" },
    { value: "objectiveStatus", label: "Objective Status" },
    { value: "monthDate", label: "Month (Date)" },
    { value: "yearDate", label: "Year (Date)" },
    { value: "departmentKpi", label: "Department KPI" },
    { value: "strategicObjective", label: "Strategic Objective" },

    // Employee identity & org structure
    { value: "employeeName", label: "Employee Name" },
    { value: "employeeId", label: "Employee ID" },
    { value: "gender", label: "Gender" },
    { value: "section", label: "Section" },
    { value: "department", label: "Department" },
    { value: "workingLocation", label: "Working Location" },
    { value: "employmentPosition", label: "Employment Position" },
    { value: "managerPosition", label: "Manager Position" },
    { value: "shiftType", label: "Shift Type" },
    { value: "roles", label: "Role(s)" },
    { value: "levelOfEducation", label: "Level of Education" },
    { value: "yearsOfExperience", label: "Years of Experience" },
    { value: "contractType", label: "Contract Type" },
    { value: "contractStatus", label: "Contract Status" },
    { value: "contractHour", label: "Contract Hour" },
    { value: "eligibleLeaveDays", label: "Eligible Leave Days" },
    { value: "maritalStatus", label: "Marital Status" },
    { value: "positionLevel", label: "Position Level" },
    { value: "gradeLevel", label: "Grade Level" },
    { value: "step", label: "Step" },
];

export const HR_AVAILABLE_MEASURES = [
    { value: "countOfObjective", label: "Count of Objective" },
    { value: "managerEvaluationRating", label: "Manager Evaluation Rating" },
    { value: "countOfLeaveRequests", label: "Number of leave requests" },
    { value: "countOfOvertimeRequests", label: "Number of OT requests" },
    { value: "countOfEmployees", label: "Number of employees" },
];

/** Dimensions / measures / legacy keys (e.g. saved charts using `status`) for display only */
export function getHrReportingFieldLabel(fieldValue: string): string {
    const dim = HR_AVAILABLE_DIMENSIONS.find(d => d.value === fieldValue);
    if (dim) return dim.label;
    const meas = HR_AVAILABLE_MEASURES.find(m => m.value === fieldValue);
    if (meas) return meas.label;
    if (fieldValue === "status") return "Objective Status";
    return fieldValue;
}

export async function generateHrReportingData(
    dimensions: string[],
    measures: HrMeasureConfig[],
    filters: HrFilterConfig[],
): Promise<Record<string, number | string>[]> {
    return aggregateHrReportingData(dimensions, measures, filters);
}
