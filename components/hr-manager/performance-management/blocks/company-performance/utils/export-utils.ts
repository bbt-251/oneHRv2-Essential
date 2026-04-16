import { formatDate } from "@/lib/util/dayjs_format";
import getEmployeeFullName from "@/lib/util/getEmployeeFullName";
import type { EmployeeModel } from "@/lib/models/employee";
import type { ObjectiveModel } from "@/lib/models/objective-model";
import type { HrSettingsByType } from "@/context/firestore-context";

interface ExportObjectiveParams {
    objectives: ObjectiveModel[];
    employees: EmployeeModel[];
    hrSettings: HrSettingsByType;
    periodName: string;
    evaluationRound: string;
    getDepartmentName: (departmentId: string) => string;
}

interface ExportObjectiveRow {
    Period: string;
    "Evaluations Round": string;
    "Objective Title": string;
    "SMART Objective": string;
    "Employee Name": string;
    "Employee ID": string;
    Department: string;
    "Department KPI": string;
    "Strategic Objectives": string;
    "Target Date": string;
    Status: string;
    "Self Evaluation Rating": string | number;
    "Self Evaluation Result": string;
    "Self Evaluation Justification": string;
    "Manager Evaluation Rating": string | number;
    "Manager Evaluation Justification": string;
    "Manager Message": string;
    "Created At": string;
    "Created By": string;
}

/**
 * Transforms objectives data into export format
 */
export function prepareObjectivesExportData({
    objectives,
    employees,
    hrSettings,
    periodName,
    evaluationRound,
    getDepartmentName,
}: ExportObjectiveParams): ExportObjectiveRow[] {
    return objectives.map(obj => {
        const employee = employees.find(emp => emp.id === obj.employee);
        const department = employee ? getDepartmentName(employee.department) : "";
        const kpi = hrSettings.departmentKPIs.find(k => k.id === obj.deptKPI);
        const strategicObjectives = kpi
            ? hrSettings.strategicObjectives
                .filter(so => kpi.linkedObjectiveId.includes(so.id))
                .map(so => so.title)
                .join("; ")
            : "";
        const createdBy = employees.find(e => e.uid === obj.createdBy);

        return {
            Period: periodName,
            "Evaluations Round": evaluationRound,
            "Objective Title": obj.title,
            "SMART Objective": obj.SMARTObjective || "",
            "Employee Name": getEmployeeName(obj.employee, employees),
            "Employee ID": employee?.employeeID || "",
            Department: department,
            "Department KPI": kpi?.title || "",
            "Strategic Objectives": strategicObjectives,
            "Target Date": formatDate(obj.targetDate) || "",
            Status: obj.status || "",
            "Self Evaluation Rating": obj.selfEvaluation?.value || "",
            "Self Evaluation Result": obj.selfEvaluation?.actualResult || "",
            "Self Evaluation Justification": obj.selfEvaluation?.justification || "",
            "Manager Evaluation Rating": obj.managerEvaluation?.value || "",
            "Manager Evaluation Justification": obj.managerEvaluation?.justification || "",
            "Manager Message": obj.managerEvaluation?.managerMessage || "",
            "Created At": formatDate(obj.timestamp) || "",
            "Created By": createdBy ? getEmployeeFullName(createdBy) : "",
        };
    });
}

/**
 * Converts export data to CSV content
 */
export function convertToCSV(data: ExportObjectiveRow[]): string {
    if (data.length === 0) return "";

    const headers = Object.keys(data[0]);
    const csvContent = [
        headers.join(","),
        ...data.map(row =>
            headers
                .map(header => {
                    const value = row[header as keyof typeof row];
                    const stringValue = String(value || "");
                    if (
                        stringValue.includes(",") ||
                        stringValue.includes("\n") ||
                        stringValue.includes('"')
                    ) {
                        return `"${stringValue.replace(/"/g, '""')}"`;
                    }
                    return stringValue;
                })
                .join(","),
        ),
    ].join("\n");

    return csvContent;
}

/**
 * Downloads CSV file
 */
export function downloadCSV(csvContent: string, filename: string): void {
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

/**
 * Helper function to get employee name
 */
function getEmployeeName(employeeId: string, employees: EmployeeModel[]): string {
    const employee = employees.find(emp => emp.uid === employeeId);
    return employee ? getEmployeeFullName(employee) : employeeId;
}

/**
 * Main export function for objectives
 */
export function exportObjectives(
    objectives: ObjectiveModel[],
    employees: EmployeeModel[],
    hrSettings: HrSettingsByType,
    periodName: string,
    evaluationRound: string,
    filename: string,
    getDepartmentName: (departmentId: string) => string,
): void {
    if (objectives.length === 0) {
        alert("No data to export");
        return;
    }

    const exportData = prepareObjectivesExportData({
        objectives,
        employees,
        hrSettings,
        periodName,
        evaluationRound,
        getDepartmentName,
    });

    const csvContent = convertToCSV(exportData);
    downloadCSV(csvContent, filename);
}
