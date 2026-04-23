import {
    AccrualConfigurationModel,
    AnnouncementTypeModel,
    BackdateCapabilitiesModel,
    CurrencyModel,
    DeductionTypeModel,
    EligibleLeaveDaysModel,
    HolidayModel,
    LeaveSettingsModel,
    LeaveTypeModel,
    LoanTypeModel,
    OvertimeConfigurationModel,
    PaymentTypeModel,
    PayrollSettingsModel,
    PensionModel,
    ShiftHourModel,
    ShiftTypeModel,
    TaxModel,
} from "@/lib/models/hr-settings";
import { AttendanceLogicModel } from "@/lib/models/attendance-logic";
import { FileDocumentModel } from "@/lib/models/file-document";
import { FlexibilityParameterModel } from "@/lib/models/flexibilityParameter";

export const MODULE_SETTINGS_RESOURCES = [
    "attendanceLogic",
    "flexibilityParameter",
    "leaveSettings",
    "payrollSettings",
    "leaveTypes",
    "eligibleLeaveDays",
    "backdateCapabilities",
    "accrualConfigurations",
    "holidays",
    "shiftHours",
    "shiftTypes",
    "overtimeTypes",
    "announcementTypes",
    "paymentTypes",
    "deductionTypes",
    "loanTypes",
    "taxes",
    "currencies",
    "pension",
    "headerDocuments",
    "footerDocuments",
    "signatureDocuments",
    "stampDocuments",
    "initialDocuments",
] as const;

export type ModuleSettingsResource = (typeof MODULE_SETTINGS_RESOURCES)[number];

export type ModuleSettingsRecordMap = {
    attendanceLogic: AttendanceLogicModel;
    flexibilityParameter: FlexibilityParameterModel;
    leaveSettings: LeaveSettingsModel;
    payrollSettings: PayrollSettingsModel;
    leaveTypes: LeaveTypeModel;
    eligibleLeaveDays: EligibleLeaveDaysModel;
    backdateCapabilities: BackdateCapabilitiesModel;
    accrualConfigurations: AccrualConfigurationModel;
    holidays: HolidayModel;
    shiftHours: ShiftHourModel;
    shiftTypes: ShiftTypeModel;
    overtimeTypes: OvertimeConfigurationModel;
    announcementTypes: AnnouncementTypeModel;
    paymentTypes: PaymentTypeModel;
    deductionTypes: DeductionTypeModel;
    loanTypes: LoanTypeModel;
    taxes: TaxModel;
    currencies: CurrencyModel;
    pension: PensionModel;
    headerDocuments: FileDocumentModel;
    footerDocuments: FileDocumentModel;
    signatureDocuments: FileDocumentModel;
    stampDocuments: FileDocumentModel;
    initialDocuments: FileDocumentModel;
};

export type ModuleSettingsRecord = ModuleSettingsRecordMap[ModuleSettingsResource];

export const isModuleSettingsResource = (value: string): value is ModuleSettingsResource =>
    MODULE_SETTINGS_RESOURCES.includes(value as ModuleSettingsResource);
