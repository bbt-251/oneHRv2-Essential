import { OvertimeConfigurationModel } from "../../firebase/hrSettingsService";
import camelize from "../camelize";
import { calculateOvertimeCost } from "../../../util/overtime-request-display";

interface Props {
    row: Record<string, number | string | null | undefined>;
    overtimeConfigs: OvertimeConfigurationModel[];
    attendanceLogic: 1 | 2 | 3 | 4;
    salary: number;
    dailyWage: number | null;
    workedDays: number | null;
}
export function calculateBaseSalaryUpdated({
    row,
    overtimeConfigs,
    attendanceLogic,
    salary,
    dailyWage,
    workedDays,
}: Props) {
    let baseSalary: number = 0;

    if (attendanceLogic === 1) {
        baseSalary = salary;
    }

    if (attendanceLogic === 2) {
        const hourlyWage: number = row.hourlyWage ?? 0;

        overtimeConfigs.forEach(overtimeConfig => {
            if (row[camelize(overtimeConfig.overtimeType)] !== 0) {
                const temp: number = calculateOvertimeCost(
                    row[camelize(overtimeConfig.overtimeType)] ?? 0,
                    overtimeConfig.overtimeRate ?? 0,
                    hourlyWage,
                );
                baseSalary += temp ?? 0;
            }
        });

        baseSalary += salary;
    }

    if (attendanceLogic === 3) {
        const hourlyWage: number = row.hourlyWage ?? 0;

        overtimeConfigs.forEach(overtimeConfig => {
            if (row[camelize(overtimeConfig.overtimeType)] !== 0) {
                const temp: number = calculateOvertimeCost(
                    row[camelize(overtimeConfig.overtimeType)] ?? 0,
                    overtimeConfig.overtimeRate ?? 0,
                    hourlyWage,
                );
                baseSalary += temp ?? 0;
            }
        });

        if (dailyWage && workedDays) baseSalary += dailyWage * workedDays;
    }

    if (attendanceLogic === 4) {
        const hourlyWage: number = row.hourlyWage ?? 0;
        const monthlyWorkedHours: number = row.monthlyWorkedHours ?? 0;

        /* This code snippet is iterating over each overtime configuration in the `overtimeConfigs` array and
        calculating the additional salary component based on the specific overtime type for the given `row`. */
        overtimeConfigs.forEach(overtimeConfig => {
            if (row[camelize(overtimeConfig.overtimeType)] !== 0) {
                const temp: number = calculateOvertimeCost(
                    row[camelize(overtimeConfig.overtimeType)] ?? 0,
                    overtimeConfig.overtimeRate ?? 0,
                    hourlyWage,
                );
                baseSalary += temp ?? 0;
            }
        });

        baseSalary += hourlyWage * monthlyWorkedHours;
    }

    return baseSalary;
}
