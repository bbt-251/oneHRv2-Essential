import type { LogInfo } from "./department-section";

const buildLog = (title: string, description: string): LogInfo => ({
    title,
    description,
    module: "Job Management",
});

export const JOB_MANAGEMENT_LOG_MESSAGES = {
    CONTRACT_HOUR_CREATED: (data: { hourPerWeek: number }) =>
        buildLog(
            "Contract Hour Created",
            `Created contract hour: '${data.hourPerWeek}' hours/week`,
        ),
    CONTRACT_HOUR_UPDATED: (data: { id: string; hourPerWeek: number }) =>
        buildLog(
            "Contract Hour Updated",
            `Updated contract hour '${data.id}' to '${data.hourPerWeek}' hours/week`,
        ),
    CONTRACT_HOUR_DELETED: (id: string) =>
        buildLog("Contract Hour Deleted", `Deleted contract hour '${id}'`),
    CONTRACT_TYPE_CREATED: (data: { type?: string; name?: string }) =>
        buildLog(
            "Contract Type Created",
            `Created contract type '${data.type ?? data.name ?? ""}'`,
        ),
    CONTRACT_TYPE_UPDATED: (data: { id: string; type?: string; name?: string }) =>
        buildLog(
            "Contract Type Updated",
            `Updated contract type '${data.id}' to '${data.type ?? data.name ?? ""}'`,
        ),
    CONTRACT_TYPE_DELETED: (id: string) =>
        buildLog("Contract Type Deleted", `Deleted contract type '${id}'`),
    GRADE_CREATED: (data: { grade?: string }) =>
        buildLog("Grade Created", `Created grade '${data.grade ?? ""}'`),
    GRADE_UPDATED: (data: { id: string; grade?: string }) =>
        buildLog("Grade Updated", `Updated grade '${data.id}' to '${data.grade ?? ""}'`),
    GRADE_DELETED: (id: string) => buildLog("Grade Deleted", `Deleted grade '${id}'`),
    POSITION_CREATED: (data: { name?: string; positionName?: string }) =>
        buildLog("Position Created", `Created position '${data.name ?? data.positionName ?? ""}'`),
    POSITION_UPDATED: (data: { id: string; name?: string; positionName?: string }) =>
        buildLog(
            "Position Updated",
            `Updated position '${data.id}' to '${data.name ?? data.positionName ?? ""}'`,
        ),
    POSITION_DELETED: (id: string) => buildLog("Position Deleted", `Deleted position '${id}'`),
    PROBATION_PERIOD_CREATED: (data: { value: string | number }) =>
        buildLog("Probation Period Created", `Created probation period '${data.value}'`),
    PROBATION_PERIOD_UPDATED: (data: { id: string; value: string | number }) =>
        buildLog(
            "Probation Period Updated",
            `Updated probation period '${data.id}' to '${data.value}'`,
        ),
    PROBATION_PERIOD_DELETED: (id: string) =>
        buildLog("Probation Period Deleted", `Deleted probation period '${id}'`),
    REASON_LEAVING_CREATED: (data: { name?: string; reason?: string }) =>
        buildLog(
            "Reason For Leaving Created",
            `Created reason '${data.name ?? data.reason ?? ""}'`,
        ),
    REASON_LEAVING_UPDATED: (data: { id: string; name?: string; reason?: string }) =>
        buildLog(
            "Reason For Leaving Updated",
            `Updated reason '${data.id}' to '${data.name ?? data.reason ?? ""}'`,
        ),
    REASON_LEAVING_DELETED: (id: string) =>
        buildLog("Reason For Leaving Deleted", `Deleted reason '${id}'`),
    SALARY_SCALE_CREATED: (data: { name?: string; scaleName?: string }) =>
        buildLog(
            "Salary Scale Created",
            `Created salary scale '${data.name ?? data.scaleName ?? ""}'`,
        ),
    SALARY_SCALE_UPDATED: (data: { id: string; name?: string; scaleName?: string }) =>
        buildLog(
            "Salary Scale Updated",
            `Updated salary scale '${data.id}' to '${data.name ?? data.scaleName ?? ""}'`,
        ),
};
