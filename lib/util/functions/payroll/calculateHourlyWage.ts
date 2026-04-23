export function computeHourlyWageSync(employeeSalary: number, monthlyWorkingHours: number): number {
    const salary: number = Number(employeeSalary ?? 0) ?? 0;
    const workingHours: number = Number(monthlyWorkingHours ?? 0);

    if (!Number.isFinite(workingHours) || workingHours <= 0) return 0;

    return Number((salary / workingHours).toFixed(2));
}

export default async function calculateHourlyWage(
    employeeSalary: number,
    monthlyWorkingHours: number,
) {
    return computeHourlyWageSync(employeeSalary, monthlyWorkingHours);
}
