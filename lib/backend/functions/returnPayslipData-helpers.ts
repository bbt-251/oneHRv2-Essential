import { AttendanceModel } from "@/lib/models/attendance";
import { DeductionTypeModel, LoanTypeModel, PaymentTypeModel } from "@/lib/models/hr-settings";
import { OvertimeRequestModel } from "@/lib/models/overtime-request";
import dayjs from "dayjs";
import { OvertimeConfigurationModel, ShiftTypeModel } from "../firebase/hrSettingsService";
import camelize from "./camelize";
import { dateFormat } from "@/lib/util/dayjs_format";
import { days } from "./calculateDailyWorkingHour";
import { months } from "./getListOfDays";

export interface ColValues {
    key: string;
    label: string;
    value: number;
    hours?: number;
}

export function getAttendanceForPayrollMonth(
    attendances: AttendanceModel[],
    month: string,
    uid: string,
    payrollYear: number,
): AttendanceModel | undefined {
    return attendances.find(
        doc =>
            doc.month === month &&
            doc.uid === uid &&
            (doc.year === payrollYear || doc.year === undefined),
    );
}

export function normalizeOvertimeTypeKey(value: string | null | undefined): string {
    return (value ?? "").trim().toLowerCase();
}

export function requestMatchesOvertimeConfig(
    request: OvertimeRequestModel,
    config: OvertimeConfigurationModel,
): boolean {
    const requestKey = normalizeOvertimeTypeKey(request.overtimeType);
    const configIdKey = normalizeOvertimeTypeKey(config.id);
    const configNameKey = normalizeOvertimeTypeKey(config.overtimeType);
    return requestKey === configIdKey || requestKey === configNameKey;
}

export function getOvertimeRateForRequest(
    request: OvertimeRequestModel,
    overtimeConfigs: OvertimeConfigurationModel[],
): number {
    return (
        overtimeConfigs.find(cfg => requestMatchesOvertimeConfig(request, cfg))?.overtimeRate ?? 0
    );
}

export function isOvertimeInSelectedMonth(
    request: OvertimeRequestModel,
    month: string,
    year: number,
) {
    const parsed = dayjs(request.overtimeDate, dateFormat);
    if (parsed.isValid()) {
        return parsed.month() === months.indexOf(month) && parsed.year() === year;
    }

    const parsedLoose = dayjs(request.overtimeDate);
    if (parsedLoose.isValid()) {
        return parsedLoose.month() === months.indexOf(month) && parsedLoose.year() === year;
    }

    return (
        request.overtimeDate.includes(year.toString()) &&
        (request.overtimeDate.includes(month) ||
            request.overtimeDate.includes(String(months.indexOf(month) + 1).padStart(2, "0")))
    );
}

export function calculateWorkingDays(
    month: string,
    year: number,
    shiftType: ShiftTypeModel,
    contractStartingDate: dayjs.Dayjs,
): number {
    const workingDays = shiftType ? shiftType.workingDays.map(day => day.dayOfTheWeek) : [];
    let workingDayCount = 0;
    const date = dayjs(`${month}, ${year}`, "MMMM, YYYY");

    for (let index = contractStartingDate.date(); index <= date.daysInMonth(); index++) {
        const current = dayjs(`${months[date.month()]} ${index}, ${date.year()}`);
        if (workingDays.includes(days[current.day()])) {
            workingDayCount++;
        }
    }

    return workingDayCount;
}

export function calculatePeriodWorkingDays(
    month: string,
    year: number,
    shiftType: ShiftTypeModel,
): number {
    const workingDays = shiftType ? shiftType.workingDays.map(day => day.dayOfTheWeek) : [];
    let total = 0;
    const date = dayjs(`${month}, ${year}`, "MMMM, YYYY");

    for (let index = 1; index <= date.daysInMonth(); index++) {
        const current = dayjs(`${months[date.month()]} ${index}, ${date.year()}`);
        if (workingDays.includes(days[current.day()])) {
            total++;
        }
    }

    return total;
}

export function getCols(
    deductionTypes: DeductionTypeModel[],
    paymentTypes: PaymentTypeModel[],
    loanTypes: LoanTypeModel[],
    deducts: { name: string; amount: number }[],
    payments: { name: string; amount: number }[],
    loans: { name: string; amount: number }[],
) {
    const deductionTypeCols: ColValues[] = deductionTypes.map(doc => ({
        key: camelize(doc?.deductionName ?? ""),
        label: doc?.deductionName ?? "",
        value: deducts.find(d => d.name === doc.deductionName)?.amount ?? 0,
    }));

    const paymentTypeCols: ColValues[] = paymentTypes.map(doc => ({
        key: camelize(doc?.paymentName ?? ""),
        label: doc?.paymentName ?? "",
        value: payments.find(p => p.name === doc.paymentName)?.amount ?? 0,
    }));

    const loanTypeCols: ColValues[] = loanTypes.map(doc => ({
        key: camelize(doc?.loanName ?? ""),
        label: doc?.loanName ?? "",
        value: loans
            .filter(loan => loan.name === doc.id)
            .reduce((sum, loan) => sum + (loan.amount ?? 0), 0),
    }));

    return { deductionTypeCols, paymentTypeCols, loanTypeCols };
}

export function calculatePWD(year: number, month: string, workingDays: string[]): number {
    const monthMap: Record<string, number> = {
        January: 1,
        February: 2,
        March: 3,
        April: 4,
        May: 5,
        June: 6,
        July: 7,
        August: 8,
        September: 9,
        October: 10,
        November: 11,
        December: 12,
    };
    const dayMap: Record<string, number> = {
        Sunday: 0,
        Monday: 1,
        Tuesday: 2,
        Wednesday: 3,
        Thursday: 4,
        Friday: 5,
        Saturday: 6,
    };

    if (!monthMap[month]) {
        throw new Error("Invalid month. Please provide a valid month name (e.g., 'January').");
    }

    const monthNumber = monthMap[month];
    const workingDaysNumbers = workingDays.map(day => {
        const dayNumber = dayMap[day];
        if (dayNumber === undefined) {
            throw new Error(
                `Invalid day name: '${day}'. Please provide valid day names (e.g., 'Monday').`,
            );
        }
        return dayNumber;
    });

    let totalWorkingDays = 0;
    for (let day = 1; day <= new Date(year, monthNumber, 0).getDate(); day++) {
        if (workingDaysNumbers.includes(new Date(year, monthNumber - 1, day).getDay())) {
            totalWorkingDays++;
        }
    }

    return totalWorkingDays;
}
