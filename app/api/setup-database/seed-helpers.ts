import dayjs from "dayjs";
import { DailyAttendance, WorkedHoursModel } from "@/lib/models/attendance";

export type SeedRecord = Record<string, unknown>;

export interface SeedContext {
    hrSettings: Record<string, string[]>;
}

export const MONTH_NAMES = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
] as const;

export function getIndependentHrSettingsSeed(): Record<string, SeedRecord | SeedRecord[]> {
    return {
        maritalStatuses: [
            { name: "Single", active: true },
            { name: "Married", active: true },
            { name: "Divorced", active: true },
            { name: "Widowed", active: true },
        ],
        levelOfEducations: [
            { name: "High School", active: true },
            { name: "Bachelor's Degree", active: true },
            { name: "Master's Degree", active: true },
            { name: "PhD", active: true },
        ],
        yearsOfExperiences: [
            { name: "0-1 years", active: true },
            { name: "1-3 years", active: true },
            { name: "3-5 years", active: true },
            { name: "5-10 years", active: true },
            { name: "10+ years", active: true },
        ],
        currencies: [
            { name: "USD", code: "USD", symbol: "$", active: true },
            { name: "EUR", code: "EUR", symbol: "€", active: true },
            { name: "GBP", code: "GBP", symbol: "£", active: true },
        ],
        grades: [
            { grade: "Junior", startDate: "2024-01-01", endDate: "2024-12-31", active: "Yes" },
            { grade: "Senior", startDate: "2024-01-01", endDate: "2024-12-31", active: "Yes" },
            { grade: "Lead", startDate: "2024-01-01", endDate: "2024-12-31", active: "Yes" },
        ],
        companyInfo: {
            mission:
                "To provide innovative HR solutions that empower organizations and enhance employee experiences",
            vision: "To be the leading HR technology company transforming workplace management globally",
            values: {
                qualityExcellence:
                    "We are committed to delivering exceptional quality in everything we do",
                sustainability:
                    "We build sustainable solutions that benefit our clients, employees, and communities",
            },
            companyName: "OneHR Solutions Ltd",
            postalAddress: "123 Business District, Tech City, TC 12345",
            companyUrl: "https://onehr-solutions.com",
            telNo: "+1-555-ONEHR",
            contactPerson: "Admin User",
            emailAddress: "admin@onehr-solutions.com",
            managingDirector: "CEO Name",
            legalRepresentative: "Legal Rep Name",
            yearsInBusiness: "5",
            companySize: "50-100",
            companySector: "Technology",
            tinNumber: "TIN123456789",
            faxNumber: "+1-555-1234",
            houseNumber: "Bldg 123",
            capital: "1000000",
            totalAnnualRevenue: "5000000",
            companyProfile: "Leading HR management platform",
            companyLogoURL: "/logo.png",
        },
        attendanceLogic: {
            chosenLogic: 1,
            halfPresentThreshold: 4,
            presentThreshold: 8,
        },
        payrollSettings: {
            baseCurrency: "USD",
            taxRate: 0,
            monthlyWorkingHours: 173,
        },
        holidays: [
            { name: "New Year's Day", date: "2024-01-01", active: "Yes" },
            { name: "Christmas Day", date: "2024-12-25", active: "Yes" },
            { name: "Company Foundation Day", date: "2024-06-15", active: "Yes" },
        ],
        leaveTypes: [
            { name: "Annual Leave", authorizedDays: 25, acronym: "AL", active: "Yes" },
            { name: "Sick Leave", authorizedDays: 10, acronym: "SL", active: "Yes" },
            { name: "Maternity Leave", authorizedDays: 90, acronym: "ML", active: "Yes" },
            { name: "Paternity Leave", authorizedDays: 10, acronym: "PL", active: "Yes" },
        ],
        paymentTypes: [
            {
                paymentName: "Salary",
                paymentType: "Monthly",
                taxabilityThresholdType: "Percentage",
                taxabilityThresholdAmount: 100,
                active: true,
            },
            {
                paymentName: "Bonus",
                paymentType: "Annual",
                taxabilityThresholdType: "Percentage",
                taxabilityThresholdAmount: 100,
                active: true,
            },
            {
                paymentName: "Commission",
                paymentType: "Variable",
                taxabilityThresholdType: "Percentage",
                taxabilityThresholdAmount: 50,
                active: true,
            },
        ],
        deductionTypes: [
            { deductionName: "Health Insurance", active: true },
            { deductionName: "Retirement Contribution", active: true },
            { deductionName: "Union Dues", active: true },
        ],
        loanTypes: [
            {
                loanName: "Emergency Loan",
                loanInterestRate: 5,
                marketInterestRate: 8,
                active: true,
            },
            {
                loanName: "Education Loan",
                loanInterestRate: 3,
                marketInterestRate: 6,
                active: true,
            },
            { loanName: "Housing Loan", loanInterestRate: 4, marketInterestRate: 7, active: true },
        ],
        taxes: [
            { taxName: "Income Tax", rate: 15, active: true },
            { taxName: "Social Security", rate: 7.5, active: true },
            { taxName: "Health Insurance", rate: 3, active: true },
        ],
    };
}

export function generateDailyAttendance(): DailyAttendance[] {
    const daysInMonth = new Date().getDate();
    const dailyAttendance: DailyAttendance[] = [];

    for (let day = 1; day <= Math.min(daysInMonth, 28); day++) {
        let value = "P";

        if (day % 7 === 0) {
            value = "A";
        } else if (day % 10 === 0) {
            value = "H";
        } else if (day % 15 === 0) {
            value = "A";
        }

        dailyAttendance.push({
            id: `day_${day}`,
            day,
            value,
            timestamp: dayjs(
                `2024-${String(new Date().getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
            ).format("YYYY-MM-DD HH:mm:ss"),
            from: value !== "A" ? "08:00" : null,
            to: value !== "A" ? (value === "H" ? "12:00" : "16:00") : null,
            status: "Verified",
            dailyWorkedHours: value === "P" ? 8 : value === "H" ? 4 : 0,
            workedHours:
                value !== "A"
                    ? [
                          {
                              id: `clockin_${day}`,
                              timestamp: dayjs(
                                  `2024-${String(new Date().getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")} 08:00`,
                              ).format("YYYY-MM-DD HH:mm:ss"),
                              type: "Clock In",
                              hour: "08:00",
                          } satisfies WorkedHoursModel,
                          {
                              id: `clockout_${day}`,
                              timestamp: dayjs(
                                  `2024-${String(new Date().getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")} ${value === "H" ? "12:00" : "16:00"}`,
                              ).format("YYYY-MM-DD HH:mm:ss"),
                              type: "Clock Out",
                              hour: value === "H" ? "12:00" : "16:00",
                          } satisfies WorkedHoursModel,
                    ]
                    : [],
        });
    }

    return dailyAttendance;
}
