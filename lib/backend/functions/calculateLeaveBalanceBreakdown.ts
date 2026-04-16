import dayjs from "dayjs";

/**
 * Interface for the balance breakdown result
 */
export interface BalanceBreakdownItem {
    year: number;
    days: number;
    type: "carried" | "current";
    description: string;
}

export interface BalanceBreakdownResult {
    isConfigured: boolean; // Whether accrual is configured by HR
    totalBalance: number;
    accrualDays: number; // Days carried over from previous year
    currentYearDays: number; // Days from current year
    breakdown: BalanceBreakdownItem[];
    workAnniversary: string;
    nextAnniversary: string;
    yearsOfService: number;
    carryOverLimit: number;
    eligibleLeaveDays: number;
}

/**
 * Calculate leave balance breakdown
 *
 * IMPORTANT: Carry-over/accrual is only considered if HR has configured accrual settings.
 * If accrual configuration is not set, all balance is treated as current year.
 *
 * @param contractStartDate - Employee's contract start date (YYYY-MM-DD)
 * @param balanceLeaveDays - Total balance leave days (BLD)
 * @param accrualLeaveDays - Days carried over from previous year (from employee model)
 * @param eligibleLeaveDays - Annual eligible leave days (ELD)
 * @param carryOverLimit - Maximum days that can be carried over (from accrual configuration)
 * @returns BalanceBreakdownResult with the decomposition
 */
export function calculateLeaveBalanceBreakdown(
    contractStartDate: string,
    balanceLeaveDays: number,
    accrualLeaveDays: number,
    eligibleLeaveDays: number,
    carryOverLimit?: number,
): BalanceBreakdownResult {
    // Parse contract start date
    const contractStart = dayjs(contractStartDate);
    const now = dayjs();

    // Calculate work anniversary (month/day from contract start applied to current year)
    const currentYearAnniversary = dayjs().month(contractStart.month()).date(contractStart.date());
    const workAnniversary = currentYearAnniversary.format("MMMM D");

    // Calculate next anniversary
    const nextAnniversary = currentYearAnniversary.isAfter(now)
        ? currentYearAnniversary
        : currentYearAnniversary.add(1, "year");
    const nextAnniversaryStr = nextAnniversary.format("MMMM D, YYYY");

    // Calculate years of service
    const yearsOfService = now.diff(contractStart, "year");

    // Check if accrual configuration is set by HR
    const isConfigured = carryOverLimit !== undefined && carryOverLimit > 0;

    // Total BLD = balanceLeaveDays + (isConfigured ? accrualLeaveDays : 0)
    const totalBalance = isConfigured ? balanceLeaveDays + accrualLeaveDays : balanceLeaveDays;

    // If accrual is not configured, treat all balance as current year
    if (!isConfigured) {
        return {
            isConfigured: false,
            totalBalance,
            accrualDays: 0,
            currentYearDays: balanceLeaveDays,
            breakdown: [
                {
                    year: now.year(),
                    days: balanceLeaveDays,
                    type: "current",
                    description: `Current year (${now.year()})`,
                },
            ],
            workAnniversary,
            nextAnniversary: nextAnniversaryStr,
            yearsOfService,
            carryOverLimit: 0,
            eligibleLeaveDays,
        };
    }

    // Accrual is configured - calculate carry-over breakdown
    // accrualLeaveDays is already the actual carried over value (set by cloud function)
    const actualAccrualDays = Math.min(accrualLeaveDays, carryOverLimit);

    // Build the breakdown
    const breakdown: BalanceBreakdownItem[] = [];

    if (actualAccrualDays > 0) {
        breakdown.push({
            year: now.year() - 1,
            days: actualAccrualDays,
            type: "carried",
            description: `Carried over from ${now.year() - 1} (max ${carryOverLimit} days allowed)`,
        });
    }

    // Current year days come from balanceLeaveDays
    if (balanceLeaveDays > 0) {
        breakdown.push({
            year: now.year(),
            days: balanceLeaveDays,
            type: "current",
            description: `Current year (${now.year()}) entitlement`,
        });
    }

    return {
        isConfigured: true,
        totalBalance,
        accrualDays: actualAccrualDays,
        currentYearDays: balanceLeaveDays,
        breakdown,
        workAnniversary,
        nextAnniversary: nextAnniversaryStr,
        yearsOfService,
        carryOverLimit,
        eligibleLeaveDays,
    };
}

/**
 * Alias for calculateLeaveBalanceBreakdown for backwards compatibility
 */
export function calculateSimpleBalanceBreakdown(
    contractStartDate: string,
    currentBalance: number,
    eligibleLeaveDays: number,
    carryOverLimit?: number,
): BalanceBreakdownResult {
    return calculateLeaveBalanceBreakdown(
        contractStartDate,
        currentBalance,
        0, // accrualLeaveDays
        eligibleLeaveDays,
        carryOverLimit,
    );
}
