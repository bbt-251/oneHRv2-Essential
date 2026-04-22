// HR Settings Models

export interface DepartmentSettingsModel {
    id: string;
    name: string;
    code: string;
    manager: string;
    location: string;
    active: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface AccrualConfigurationModel {
    id: string;
    limitUnusedDays: number;
    limitMonths: number;
    createdAt?: string;
    updatedAt?: string;
}

export interface BackdateCapabilitiesModel {
    id: string;
    allowBackdatedRequests: boolean;
    createdAt?: string;
    updatedAt?: string;
}

export interface EligibleLeaveDaysModel {
    id: string;
    numberOfYears: number;
    numberOfDays: number;
    createdAt?: string;
    updatedAt?: string;
}

export interface LeaveTypeModel {
    id: string;
    name: string;
    authorizedDays: number;
    acronym: string;
    active: "Yes" | "No";
    createdAt?: string;
    updatedAt?: string;
}

export interface SalaryScaleModel {
    id: string;
    numberOfSteps: number;
    scales: ScaleModel[];
    createdAt?: string;
    updatedAt?: string;
}

export interface ScaleModel {
    row: number;
    column: number;
    grade: string;
    salary?: number;
}

export interface ProbationDayModel {
    id: string;
    value: number;
    createdAt?: string;
    updatedAt?: string;
}

export interface ReasonOfLeavingModel {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
    active: "Yes" | "No";
    createdAt?: string;
    updatedAt?: string;
}

export interface ContractHourModel {
    id: string;
    hourPerWeek: number;
    startDate: string;
    endDate: string;
    active: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface ContractTypeModel {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
    active: "Yes" | "No";
    createdAt?: string;
    updatedAt?: string;
}

export interface MaritalStatusModel {
    id: string;
    name: string;
    active: boolean;
    createdAt?: string;
    updatedAt?: string;
}

export interface LocationModel {
    id: string;
    parentId?: string | null;
    type: string;
    name: string;
    startDate: string;
    endDate: string;
    active: string;
    description?: string;
    address?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface NotificationTypeModel {
    id: string;
    notificationType: string;
    text: string;
    active: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface AnnouncementTypeModel {
    id: string;
    title: string;
    description?: string;
    active?: boolean | string;
    createdAt?: string;
    updatedAt?: string;
}

export interface SectionSettingsModel {
    id: string;
    name: string;
    code: string;
    department: string;
    supervisor: string | null;
    active: boolean;
    createdAt?: string;
    updatedAt?: string;
}

export interface LeaveSettingsModel {
    maxAnnualLeaveDays: number;
    carryOverLimit: number;
}

export interface ShiftTypeModel {
    id: string;
    timestamp: string;
    name: string;
    workingDays: WorkingDayModel[];
    startDate: string | null;
    endDate: string | null;
    active: "Yes" | "No";
}

export interface WorkingDayModel {
    dayOfTheWeek: string;
    associatedShiftHour: string;
}

export interface PayrollSettingsModel {
    id: string;
    baseCurrency?: string;
    taxRate?: number;
    monthlyWorkingHours?: number;
}

export interface HolidayModel {
    id: string;
    timestamp: string;
    name: string;
    date: string;
    active: "Yes" | "No";
}

export interface ShiftHourModel {
    id: string;
    timestamp: string;
    name: string;
    shiftHours: ShiftHourDivision[];
    active: "Yes" | "No";
}

export interface ShiftHourDivision {
    startTime: string;
    endTime: string;
}

export interface OvertimeConfigurationModel {
    id: string;
    timestamp: string;
    overtimeType: string;
    overtimeRate: number;
    active: "Yes" | "No";
}

export interface GradeDefinitionModel {
    id: string;
    grade: string;
    startDate: string;
    endDate: string;
    active: "Yes" | "No";
    createdAt: string;
    updatedAt: string;
}

export interface PositionDefinitionModel {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
    positionDescription: string;
    additionalInformation: string | null;
    band: string | null;
    grade: string;
    active: "Yes" | "No";
    critical: "Yes" | "No";
    successionPlanningID?: string;
    keys: string[];
    companyProfile: string | null;
    companyProfileUsed: boolean | null;
    step: string | null;
    competencies: string[];
    createdAt: string;
    updatedAt: string;
}

export interface LevelOfEducationModel {
    id: string;
    name: string;
    active: boolean;
    timestamp: string;
}

export interface YearsOfExperienceModel {
    id: string;
    name: string;
    active: boolean;
    timestamp: string;
}

export interface TMCategory {
    id: string;
    name: string;
    active: boolean;
    timestamp: string;
    subcategory?: {
        id: string;
        name: string;
    }[];
}

export interface CurrencyModel {
    id: string;
    name: string;
    code: string;
    symbol: string;
    active: boolean;
}

export interface DeductionTypeModel {
    id: string;
    name: string;
    active: boolean;
    timestamp: string;
}

export interface LoanTypeModel {
    id: string;
    name: string;
    active: boolean;
    timestamp: string;
}

export interface PaymentTypeModel {
    id: string;
    name: string;
    active: boolean;
    timestamp: string;
}

export interface PensionModel {
    id: string;
    name: string;
    rate: number;
    active: boolean;
    timestamp: string;
}

export interface TaxModel {
    id: string;
    name: string;
    rate: number;
    active: boolean;
    timestamp: string;
}
