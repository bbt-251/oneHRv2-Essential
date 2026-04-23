import {
    ContractHourModel,
    ContractTypeModel,
    DepartmentSettingsModel,
    GradeDefinitionModel,
    LevelOfEducationModel,
    LocationModel,
    MaritalStatusModel,
    NotificationTypeModel,
    PositionDefinitionModel,
    ProbationDayModel,
    ReasonOfLeavingModel,
    SalaryScaleModel,
    SectionSettingsModel,
    YearsOfExperienceModel,
} from "@/lib/models/hr-settings";
import { CompanyInfoModel } from "@/lib/models/companyInfo";

export const CORE_SETTINGS_RESOURCES = [
    "companyInfo",
    "departmentSettings",
    "sectionSettings",
    "notificationTypes",
    "locations",
    "maritalStatuses",
    "contractTypes",
    "contractHours",
    "reasonOfLeaving",
    "probationDays",
    "salaryScales",
    "grades",
    "positions",
    "levelOfEducations",
    "yearsOfExperiences",
] as const;

export type CoreSettingsResource = (typeof CORE_SETTINGS_RESOURCES)[number];

export type CoreSettingsRecordMap = {
    companyInfo: CompanyInfoModel;
    departmentSettings: DepartmentSettingsModel;
    sectionSettings: SectionSettingsModel;
    notificationTypes: NotificationTypeModel;
    locations: LocationModel;
    maritalStatuses: MaritalStatusModel;
    contractTypes: ContractTypeModel;
    contractHours: ContractHourModel;
    reasonOfLeaving: ReasonOfLeavingModel;
    probationDays: ProbationDayModel;
    salaryScales: SalaryScaleModel;
    grades: GradeDefinitionModel;
    positions: PositionDefinitionModel;
    levelOfEducations: LevelOfEducationModel;
    yearsOfExperiences: YearsOfExperienceModel;
};

export type CoreSettingsRecord = CoreSettingsRecordMap[CoreSettingsResource];

export const isCoreSettingsResource = (value: string): value is CoreSettingsResource =>
    CORE_SETTINGS_RESOURCES.includes(value as CoreSettingsResource);
