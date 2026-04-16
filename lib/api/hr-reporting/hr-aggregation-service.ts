import { getDocs, type QuerySnapshot } from "firebase/firestore";
import type {
    HrFilterConfig,
    HrMeasureConfig,
} from "@/components/hr-manager/reporting/report-types";
import {
    employeeCollection,
    objectiveCollection,
    leaveManagementCollection,
    overtimeRequestCollection,
} from "@/lib/backend/firebase/collections";
import { periodicOptionService } from "@/lib/backend/api/performance-management/periodic-option-service";
import {
    hrSettingsService,
    type DepartmentKPIModel,
    type DepartmentSettingsModel,
    type SectionSettingsModel,
    type LocationModel,
    type PositionDefinitionModel,
    type ShiftTypeModel,
    type LeaveTypeModel,
    type OvertimeConfigurationModel,
} from "@/lib/backend/firebase/hrSettingsService";
import type { EmployeeModel } from "@/lib/models/employee";
import type { ObjectiveModel } from "@/lib/models/objective-model";
import type { LeaveModel } from "@/lib/models/leave";
import type { OvertimeRequestModel } from "@/lib/models/overtime-request";

type HrAggregationRow = Record<string, string | number>;

type ReportingMode = "objective" | "leave" | "overtime" | "employee";

/** Aligns OT request `status` with chart/filter labels (Pending / Approved / Rejected). */
function formatOvertimeStatusForReport(raw: string | undefined): string {
    const s = String(raw ?? "")
        .trim()
        .toLowerCase();
    if (s === "pending") return "Pending";
    if (s === "approved") return "Approved";
    if (s === "rejected") return "Rejected";
    if (!s) return "";
    return String(raw).charAt(0).toUpperCase() + String(raw).slice(1).toLowerCase();
}

interface DimensionMaps {
    departmentKpiById: Map<string, string>;
    departmentNameById: Map<string, string>;
    sectionNameById: Map<string, string>;
    locationNameById: Map<string, string>;
    positionNameById: Map<string, string>;
    shiftTypeNameById: Map<string, string>;
    levelOfEducationById: Map<string, string>;
    yearsOfExperienceById: Map<string, string>;
    contractTypeById: Map<string, string>;
    contractHourById: Map<string, string>;
    gradeById: Map<string, string>;
    maritalStatusById: Map<string, string>;
    periodRoundDisplayCache: Map<string, { periodName: string | null; roundName: string | null }>;
    leaveTypeLabelByKey: Map<string, string>;
    overtimeTypeLabelResolver: (raw: string) => string;
}

/** Dataset grain when multiple measures are present: specialized sources win over objectives. */
function resolveReportingMode(measures: HrMeasureConfig[]): ReportingMode {
    const fields = new Set(measures.map(m => m.field));
    if (fields.has("countOfLeaveRequests")) return "leave";
    if (fields.has("countOfOvertimeRequests")) return "overtime";
    if (fields.has("countOfEmployees")) return "employee";
    return "objective";
}

const MEASURE_FIELDS_BY_MODE: Record<ReportingMode, ReadonlySet<string>> = {
    objective: new Set(["countOfObjective", "managerEvaluationRating"]),
    leave: new Set(["countOfLeaveRequests"]),
    overtime: new Set(["countOfOvertimeRequests"]),
    employee: new Set(["countOfEmployees"]),
};

function applyInMemoryFilters(row: HrAggregationRow, filters: HrFilterConfig[]): boolean {
    if (!filters.length) return true;

    for (const filter of filters) {
        const value = String(row[filter.field] ?? "");
        const target = String(filter.value);

        switch (filter.operator) {
            case "equals":
                if (filter.field === "gender") {
                    if (value.toLowerCase() !== target.toLowerCase()) return false;
                } else if (value !== target) return false;
                break;
            case "contains":
                if (!value.toLowerCase().includes(target.toLowerCase())) return false;
                break;
            default:
                break;
        }
    }

    return true;
}

async function buildDimensionMaps(mode: ReportingMode): Promise<DimensionMaps> {
    const loadPeriodic = mode === "objective";

    const [
        departmentKpis,
        departments,
        sections,
        locations,
        positions,
        shiftTypes,
        levelOfEducations,
        yearsOfExperiences,
        contractTypes,
        contractHours,
        grades,
        maritalStatuses,
        leaveTypes,
        overtimeTypeConfigs,
        periodicOptions,
    ] = await Promise.all([
        hrSettingsService.getAll("departmentKPIs"),
        hrSettingsService.getAll("departmentSettings"),
        hrSettingsService.getAll("sectionSettings"),
        hrSettingsService.getAll("locations"),
        hrSettingsService.getAll("positions"),
        hrSettingsService.getAll("shiftTypes"),
        hrSettingsService.getAll("levelOfEducations"),
        hrSettingsService.getAll("yearsOfExperiences"),
        hrSettingsService.getAll("contractTypes"),
        hrSettingsService.getAll("contractHours"),
        hrSettingsService.getAll("grades"),
        hrSettingsService.getAll("maritalStatuses"),
        hrSettingsService.getAll("leaveTypes"),
        hrSettingsService.getAll("overtimeTypes"),
        loadPeriodic ? periodicOptionService.getAll() : Promise.resolve([]),
    ]);

    const departmentKpiById = new Map<string, string>();
    (departmentKpis as (DepartmentKPIModel & { id: string })[]).forEach(kpi => {
        departmentKpiById.set(kpi.id, kpi.title);
    });

    const departmentNameById = new Map<string, string>();
    (departments as (DepartmentSettingsModel & { id: string })[]).forEach(dept => {
        departmentNameById.set(dept.id, dept.name);
    });

    const sectionNameById = new Map<string, string>();
    (sections as (SectionSettingsModel & { id: string })[]).forEach(section => {
        sectionNameById.set(section.id, section.name);
    });

    const locationNameById = new Map<string, string>();
    (locations as (LocationModel & { id: string })[]).forEach(loc => {
        locationNameById.set(loc.id, loc.name);
    });

    const positionNameById = new Map<string, string>();
    (positions as (PositionDefinitionModel & { id: string })[]).forEach(pos => {
        positionNameById.set(pos.id, pos.name);
    });

    const shiftTypeNameById = new Map<string, string>();
    (shiftTypes as (ShiftTypeModel & { id: string })[]).forEach(shift => {
        shiftTypeNameById.set(shift.id, shift.name);
    });

    const levelOfEducationById = new Map<string, string>();
    (levelOfEducations as { id: string; name: string }[]).forEach(item => {
        levelOfEducationById.set(item.id, item.name);
    });

    const yearsOfExperienceById = new Map<string, string>();
    (yearsOfExperiences as { id: string; name: string }[]).forEach(item => {
        yearsOfExperienceById.set(item.id, item.name);
    });

    const contractTypeById = new Map<string, string>();
    (contractTypes as { id: string; name: string }[]).forEach(item => {
        contractTypeById.set(item.id, item.name);
    });

    const contractHourById = new Map<string, string>();
    (contractHours as { id: string; hourPerWeek?: number }[]).forEach(item => {
        contractHourById.set(
            item.id,
            item.hourPerWeek != null ? `${item.hourPerWeek} hrs/week` : "",
        );
    });

    const gradeById = new Map<string, string>();
    (grades as { id: string; grade: string }[]).forEach(item => {
        gradeById.set(item.id, item.grade);
    });

    const maritalStatusById = new Map<string, string>();
    (maritalStatuses as { id: string; name: string }[]).forEach(item => {
        maritalStatusById.set(item.id, item.name);
    });

    const leaveTypeLabelByKey = new Map<string, string>();
    (leaveTypes as (LeaveTypeModel & { id: string })[]).forEach(t => {
        leaveTypeLabelByKey.set(t.id, t.name);
        leaveTypeLabelByKey.set(t.name, t.name);
    });

    const otConfigs = overtimeTypeConfigs as (OvertimeConfigurationModel & { id: string })[];
    const overtimeTypeLabelResolver = (raw: string): string => {
        if (!raw) return "";
        const byId = otConfigs.find(c => c.id === raw);
        if (byId) return byId.overtimeType;
        const byLabel = otConfigs.find(c => c.overtimeType === raw);
        if (byLabel) return byLabel.overtimeType;
        return raw;
    };

    const periodRoundDisplayCache = new Map<
        string,
        { periodName: string | null; roundName: string | null }
    >();
    if (loadPeriodic) {
        (
            periodicOptions as {
                id: string | null;
                periodName: string;
                year: number;
                evaluations: { id: string | null; round: string }[];
            }[]
        ).forEach(opt => {
            if (opt.id == null) return;
            const periodLabel = `${opt.periodName} (${opt.year})`;
            opt.evaluations?.forEach(ev => {
                const roundId = ev.id ?? "";
                const key = `${opt.id}::${roundId}`;
                periodRoundDisplayCache.set(key, {
                    periodName: periodLabel,
                    roundName: ev.round ?? null,
                });
            });
        });
    }

    return {
        departmentKpiById,
        departmentNameById,
        sectionNameById,
        locationNameById,
        positionNameById,
        shiftTypeNameById,
        levelOfEducationById,
        yearsOfExperienceById,
        contractTypeById,
        contractHourById,
        gradeById,
        maritalStatusById,
        periodRoundDisplayCache,
        leaveTypeLabelByKey,
        overtimeTypeLabelResolver,
    };
}

function assignEmployeeDimensions(
    row: HrAggregationRow,
    employee: EmployeeModel,
    maps: DimensionMaps,
): void {
    row.employeeName =
        `${employee.firstName} ${employee.middleName ?? ""} ${employee.surname}`.trim();
    row.employeeId = employee.employeeID;
    row.gender = employee.gender;
    row.section = employee.section
        ? (maps.sectionNameById.get(employee.section) ?? employee.section)
        : "";
    row.department = employee.department
        ? (maps.departmentNameById.get(employee.department) ?? employee.department)
        : "";
    row.workingLocation = employee.workingLocation
        ? (maps.locationNameById.get(employee.workingLocation) ?? employee.workingLocation)
        : "";
    row.employmentPosition = employee.employmentPosition
        ? (maps.positionNameById.get(employee.employmentPosition) ?? employee.employmentPosition)
        : "";
    row.managerPosition = employee.managerPosition ? "Yes" : "No";
    row.shiftType = employee.shiftType
        ? (maps.shiftTypeNameById.get(employee.shiftType) ?? employee.shiftType)
        : "";
    row.roles = Array.isArray(employee.role) ? employee.role.filter(Boolean).join(", ") : "";
    row.levelOfEducation = employee.levelOfEducation
        ? (maps.levelOfEducationById.get(employee.levelOfEducation) ?? employee.levelOfEducation)
        : "";
    row.yearsOfExperience = employee.yearsOfExperience
        ? (maps.yearsOfExperienceById.get(employee.yearsOfExperience) ?? employee.yearsOfExperience)
        : "";
    row.contractType = employee.contractType
        ? (maps.contractTypeById.get(employee.contractType as string) ?? employee.contractType)
        : "";
    row.contractStatus = employee.contractStatus
        ? employee.contractStatus.charAt(0).toUpperCase() + employee.contractStatus.slice(1)
        : "";
    if (typeof employee.contractHour === "number") {
        row.contractHour = `${employee.contractHour} hrs/week`;
    } else if (employee.contractHour) {
        row.contractHour =
            maps.contractHourById.get(employee.contractHour as string) ??
            String(employee.contractHour);
    } else {
        row.contractHour = "";
    }
    row.positionLevel = employee.positionLevel || "";
    row.gradeLevel = employee.gradeLevel
        ? (maps.gradeById.get(employee.gradeLevel) ?? employee.gradeLevel)
        : "";
    row.step = employee.step != null ? String(employee.step) : "";
    row.maritalStatus = employee.maritalStatus
        ? (maps.maritalStatusById.get(employee.maritalStatus) ?? employee.maritalStatus)
        : "";
    row.eligibleLeaveDays =
        employee.eligibleLeaveDays != null && !Number.isNaN(employee.eligibleLeaveDays)
            ? String(employee.eligibleLeaveDays)
            : "";
}

function measureValueKey(measure: HrMeasureConfig): string {
    return measure.aggregation === "average"
        ? `${measure.field}_average`
        : `${measure.field}_${measure.aggregation}`;
}

function padMissingMeasureValues(
    groups: Map<string, HrAggregationRow>,
    measures: HrMeasureConfig[],
): void {
    for (const aggRow of groups.values()) {
        for (const measure of measures) {
            const k = measureValueKey(measure);
            if (aggRow[k] === undefined) {
                aggRow[k] = 0;
            }
        }
    }
}

function aggregateRows(
    baseRows: HrAggregationRow[],
    dimensions: string[],
    measures: HrMeasureConfig[],
    mode: ReportingMode,
): HrAggregationRow[] {
    const groups = new Map<string, HrAggregationRow>();
    const allowedFields = MEASURE_FIELDS_BY_MODE[mode];

    for (const row of baseRows) {
        const keyParts = dimensions.map(dim => String(row[dim] ?? "N/A"));
        const key = keyParts.join("::");

        if (!groups.has(key)) {
            const base: HrAggregationRow = {};
            dimensions.forEach((dim, idx) => {
                base[dim] = keyParts[idx];
            });
            groups.set(key, base);
        }

        const aggRow = groups.get(key)!;

        for (const measure of measures) {
            if (!allowedFields.has(measure.field)) {
                continue;
            }

            const fieldValue = Number(row[measure.field] ?? 0);
            const sumKey = `${measure.field}_sum`;
            const countKey = `${measure.field}_count`;
            const minKey = `${measure.field}_min`;
            const maxKey = `${measure.field}_max`;

            switch (measure.aggregation) {
                case "sum":
                    aggRow[sumKey] = Number(aggRow[sumKey] ?? 0) + fieldValue;
                    break;
                case "count":
                    aggRow[countKey] = Number(aggRow[countKey] ?? 0) + 1;
                    break;
                case "min":
                    aggRow[minKey] =
                        aggRow[minKey] === undefined
                            ? fieldValue
                            : Math.min(Number(aggRow[minKey]), fieldValue);
                    break;
                case "max":
                    aggRow[maxKey] =
                        aggRow[maxKey] === undefined
                            ? fieldValue
                            : Math.max(Number(aggRow[maxKey]), fieldValue);
                    break;
                case "average": {
                    const prevSum = Number(aggRow[sumKey] ?? 0);
                    const prevCount = Number(aggRow[countKey] ?? 0);
                    const newSum = prevSum + fieldValue;
                    const newCount = prevCount + 1;
                    aggRow[sumKey] = newSum;
                    aggRow[countKey] = newCount;
                    aggRow[`${measure.field}_average`] = newCount === 0 ? 0 : newSum / newCount;
                    break;
                }
            }
        }
    }

    padMissingMeasureValues(groups, measures);

    return Array.from(groups.values());
}

export async function aggregateHrReportingData(
    dimensions: string[],
    measures: HrMeasureConfig[],
    filters: HrFilterConfig[],
): Promise<HrAggregationRow[]> {
    if (dimensions.length === 0 || measures.length === 0) {
        return [];
    }

    const mode = resolveReportingMode(measures);

    const maps = await buildDimensionMaps(mode);

    const employeesByUid = new Map<string, EmployeeModel>();
    const employeesByEmployeeId = new Map<string, EmployeeModel>();

    const pushEmployeeMaps = (snap: QuerySnapshot) => {
        snap.forEach(docSnap => {
            const data = docSnap.data() as EmployeeModel;
            employeesByUid.set(data.uid, data);
            employeesByEmployeeId.set(data.employeeID, data);
        });
    };

    let baseRows: HrAggregationRow[] = [];

    if (mode === "objective") {
        const [employeesSnap, objectivesSnap] = await Promise.all([
            getDocs(employeeCollection),
            getDocs(objectiveCollection),
        ]);
        pushEmployeeMaps(employeesSnap);

        const periodRoundKey = (periodId: string, roundId: string) => `${periodId}::${roundId}`;

        for (const docSnap of objectivesSnap.docs) {
            const objective = { id: docSnap.id, ...(docSnap.data() as ObjectiveModel) };
            const employee =
                employeesByUid.get(objective.employee) ||
                employeesByEmployeeId.get(objective.employee);

            const createdDate = new Date(objective.timestamp);
            const monthDate = createdDate.toLocaleString("en-US", { month: "long" });
            const yearDate = String(createdDate.getFullYear());

            let evaluationsReference = `${objective.period}-${objective.round}`;
            const key = periodRoundKey(objective.period, objective.round);
            const displayNames = maps.periodRoundDisplayCache.get(key);
            if (displayNames?.periodName && displayNames.roundName) {
                evaluationsReference = `${displayNames.periodName} - ${displayNames.roundName}`;
            }

            const periodDisplay = displayNames?.periodName ?? objective.period;

            const departmentKpiTitle = objective.deptKPI
                ? (maps.departmentKpiById.get(objective.deptKPI) ?? objective.deptKPI)
                : "";

            const row: HrAggregationRow = {
                period: periodDisplay,
                evaluationsReference,
                departmentKpi: departmentKpiTitle,
                strategicObjective: objective.SMARTObjective,
                // `status` kept for saved reports that still use the legacy dimension key
                status: objective.status,
                objectiveStatus: objective.status,
                monthDate,
                yearDate,
                countOfObjective: 1,
                managerEvaluationRating: objective.managerEvaluation?.value ?? 0,
            };

            if (employee) {
                assignEmployeeDimensions(row, employee, maps);
            }

            if (applyInMemoryFilters(row, filters)) {
                baseRows.push(row);
            }
        }
    } else if (mode === "leave") {
        const [employeesSnap, leavesSnap] = await Promise.all([
            getDocs(employeeCollection),
            getDocs(leaveManagementCollection),
        ]);
        pushEmployeeMaps(employeesSnap);

        for (const docSnap of leavesSnap.docs) {
            const leave = docSnap.data() as LeaveModel;
            const leaveEmpKey = (leave.employeeID ?? "").trim();
            // employeeID on leave records is the Firebase uid in this codebase (not HR employeeID).
            const employee =
                (leaveEmpKey && employeesByUid.get(leaveEmpKey)) ||
                (leaveEmpKey && employeesByEmployeeId.get(leaveEmpKey)) ||
                undefined;

            const leaveTypeRaw = leave.leaveType ?? "";
            const leaveTypeLabel =
                maps.leaveTypeLabelByKey.get(leaveTypeRaw) ?? (leaveTypeRaw || "Unknown");

            const row: HrAggregationRow = {
                leaveState: leave.leaveState ?? "",
                leaveStage: leave.leaveStage ?? "",
                leaveType: leaveTypeLabel,
                countOfLeaveRequests: 1,
            };

            if (employee) {
                assignEmployeeDimensions(row, employee, maps);
            }

            if (applyInMemoryFilters(row, filters)) {
                baseRows.push(row);
            }
        }
    } else if (mode === "overtime") {
        const [employeesSnap, otSnap] = await Promise.all([
            getDocs(employeeCollection),
            getDocs(overtimeRequestCollection),
        ]);
        pushEmployeeMaps(employeesSnap);

        for (const docSnap of otSnap.docs) {
            const ot = docSnap.data() as OvertimeRequestModel;
            const otTypeLabel = maps.overtimeTypeLabelResolver(ot.overtimeType ?? "");

            const row: HrAggregationRow = {
                overtimeType: otTypeLabel,
                overtimeStatus: formatOvertimeStatusForReport(ot.status),
                countOfOvertimeRequests: 1,
            };

            const firstUid = ot.employeeUids?.[0];
            if (firstUid) {
                const employee = employeesByUid.get(firstUid);
                if (employee) {
                    assignEmployeeDimensions(row, employee, maps);
                }
            }

            if (applyInMemoryFilters(row, filters)) {
                baseRows.push(row);
            }
        }
    } else {
        const employeesSnap = await getDocs(employeeCollection);
        pushEmployeeMaps(employeesSnap);

        for (const [, employee] of employeesByUid) {
            const row: HrAggregationRow = {
                countOfEmployees: 1,
            };
            assignEmployeeDimensions(row, employee, maps);

            if (applyInMemoryFilters(row, filters)) {
                baseRows.push(row);
            }
        }
    }

    return aggregateRows(baseRows, dimensions, measures, mode);
}
