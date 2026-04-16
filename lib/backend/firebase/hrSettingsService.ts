import {
    collection,
    doc,
    addDoc,
    getDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    DocumentData,
    writeBatch,
} from "firebase/firestore";
import { db } from "./init";
import { CompanyInfoModel } from "@/lib/models/companyInfo";
import {
    PeriodicOptionModel,
    EvaluationCampaignModel,
    MonitoringPeriodModel,
} from "@/lib/models/performance";
import dayjs from "dayjs";
import { timestampFormat } from "@/lib/util/dayjs_format";
import {
    CurrencyModel,
    DeductionTypeModel,
    LoanTypeModel,
    PaymentTypeModel,
    PensionModel,
    TaxModel,
    TMCategory,
    TMComplexityModel,
    TMLengthModel,
} from "@/lib/models/hr-settings";
import { createLog } from "../api/logCollection";
import { LogInfo } from "@/lib/log-descriptions/company-info";
import { TransferTypeModel, TransferReasonModel } from "@/lib/models/transfer";

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
    // Used to compute employee hourly wage: salary / monthlyWorkingHours
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

export interface OvertimeConfigurationModel {
    id: string;
    timestamp: string;
    overtimeType: string;
    overtimeRate: number;
    active: "Yes" | "No";
}

export type CompetenceModel = {
    id: string;
    competenceName: string;
    competenceType: string;
    active: "Yes" | "No";
    createdAt: string;
    updatedAt: string;
};

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
    keys: any[];
    companyProfile: string | null;
    companyProfileUsed: boolean | null;
    step: string | null;
    competencies: string[];
    createdAt: string;
    updatedAt: string;
}

export interface CompetencePositionAssociationModel {
    id: string;
    pid: string;
    cid: string;
    grade: string;
    threshold: number;
    active: "Yes" | "No";
    createdAt: string;
    updatedAt: string;
}

// TA
export interface HiringNeedTypeModel {
    id: string;
    name: string;
    active: boolean;
    timestamp: string;
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
export interface CriticityModel {
    id: string;
    name: string;
    active: boolean;
    timestamp: string;
}
export interface AnnouncementTypeModel {
    id: string;
    name: string;
    active: boolean;
    timestamp: string;
}
export interface CategoryModel {
    id: string;
    name: string;
    active: boolean;
    timestamp: string;
}
export interface IndustryModel {
    id: string;
    name: string;
    active: boolean;
    timestamp: string;
}
// HR performance
export interface StrategicObjectiveModel {
    id: string;
    title: string;
    description: string;
    perspective: "Financial" | "Customer" | "Internal" | "Learning";
    weight: number;
    status: "Draft" | "Active" | "Archived";
    owner: string;
}
export interface DepartmentKPIModel {
    id: string;
    title: string;
    description: string;
    department: string;
    section?: string; // optional - if set, KPI is specific to a section within the department
    target: string;
    linkedObjectiveId: string[];
    dataSource: "Manual" | "System" | "Employee Objectives";
    status: "Draft" | "Active" | "Archived";
    period: string; // this periodID (usually a year)
    createdAt?: string;
    updatedAt?: string;
}

//employee engagement
export interface IssueTypeModel {
    id: string;
    timestamp: string;
    name: string;
    active: "Yes" | "No";
}
export interface IssueStatusModel {
    id: string;
    type: string;
    name: string;
    timestamp: string;
    active: "Yes" | "No";
}
export interface ImpactTypeModel {
    id: string;
    timestamp: string;
    name: string;
    active: "Yes" | "No";
}

export interface PriorityModel {
    id: string;
    name: string;
    timestamp: string;
    active: "Yes" | "No";
}
export interface ViolationTypeModel {
    id: string;
    timestamp: string;
    name: string;
    active: "Yes" | "No";
}
export interface DisciplinaryTypeModel {
    id: string;
    timestamp: string;
    name: string;
    active: "Yes" | "No";
}
export interface CommonAnswerTypesModel {
    id: string;
    timestamp: string;
    name: string;
    active: "Yes" | "No";
    answers: string[];
}

// Transfer Types and Reasons for Employee Transfer feature
export type { TransferTypeModel, TransferReasonModel } from "@/lib/models/transfer";

export interface HrSettingsMap {
    companyInfo: CompanyInfoModel;
    leaveSettings: LeaveSettingsModel;
    payrollSettings: PayrollSettingsModel;
    departmentSettings: DepartmentSettingsModel;
    sectionSettings: SectionSettingsModel;
    periodicOptions: PeriodicOptionModel;
    evaluationCampaigns: EvaluationCampaignModel;
    monitoringPeriods: MonitoringPeriodModel;
    notificationTypes: NotificationTypeModel;
    locations: LocationModel;
    maritalStatuses: MaritalStatusModel;
    contractTypes: ContractTypeModel;
    contractHours: ContractHourModel;
    reasonOfLeaving: ReasonOfLeavingModel;
    probationDays: ProbationDayModel;
    salaryScales: SalaryScaleModel;
    leaveTypes: LeaveTypeModel;
    eligibleLeaveDays: EligibleLeaveDaysModel;
    backdateCapabilities: BackdateCapabilitiesModel;
    shiftTypes: ShiftTypeModel;
    accrualConfigurations: AccrualConfigurationModel;
    holidays: HolidayModel;
    shiftHours: ShiftHourModel;
    overtimeTypes: OvertimeConfigurationModel;
    competencies: CompetenceModel;
    grades: GradeDefinitionModel;
    positions: PositionDefinitionModel;
    competencePositionAssociations: CompetencePositionAssociationModel;
    hiringNeedTypes: HiringNeedTypeModel;
    levelOfEducations: LevelOfEducationModel;
    yearsOfExperiences: YearsOfExperienceModel;
    criticity: CriticityModel;
    announcementTypes: AnnouncementTypeModel;
    categories: CategoryModel;
    industries: IndustryModel;
    strategicObjectives: StrategicObjectiveModel;
    departmentKPIs: DepartmentKPIModel;
    tmCategories: TMCategory;
    tmLengths: TMLengthModel;
    tmComplexity: TMComplexityModel;
    paymentTypes: PaymentTypeModel;
    deductionTypes: DeductionTypeModel;
    loanTypes: LoanTypeModel;
    taxes: TaxModel;
    currencies: CurrencyModel;
    pension: PensionModel;
    issueTypes: IssueTypeModel;
    issueStatus: IssueStatusModel;
    impactTypes: ImpactTypeModel;
    priorities: PriorityModel;
    violationTypes: ViolationTypeModel;
    disciplinaryTypes: DisciplinaryTypeModel;
    commonAnswerTypes: CommonAnswerTypesModel;
    transferTypes: TransferTypeModel;
    transferReasons: TransferReasonModel;
}

export type HrSettingsType = keyof HrSettingsMap;

export const hrSettingsService = {
    /**
     * @param type
     * @param data
     * @param actionBy
     * @param logInfo
     * @returns
     */
    async create<T extends HrSettingsType>(
        type: T,
        data: Omit<HrSettingsMap[T], "id" | "createdAt" | "updatedAt">,
        actionBy?: string,
        logInfo?: LogInfo,
    ): Promise<string> {
        const subcollectionRef = collection(db, "hrSettings", "main", type);

        const dataWithTimestamp = {
            ...data,
            createdAt: dayjs().format(timestampFormat),
            updatedAt: dayjs().format(timestampFormat),
        };

        const docRef = await addDoc(subcollectionRef, dataWithTimestamp);

        // Log the creation if logInfo is provided
        if (logInfo && actionBy) {
            await createLog(logInfo, actionBy, "Success");
        }

        return docRef.id;
    },

    /**
     * @param type
     * @param id
     * @returns The document data including its ID, or null if not found.
     */
    async get<T extends HrSettingsType>(type: T, id: string) {
        const docRef = doc(db, "hrSettings", "main", type, id);
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) {
            return null;
        }
        return { id: docSnap.id, ...docSnap.data() } as HrSettingsMap[T] & {
            id: string;
        };
    },

    /**
     * @param type The type of setting.
     * @returns An array of setting documents.
     */
    async getAll<T extends HrSettingsType>(type: T) {
        const subcollectionRef = collection(db, "hrSettings", "main", type);
        const snapshot = await getDocs(subcollectionRef);
        return snapshot.docs.map(
            d => ({ id: d.id, ...d.data() }) as HrSettingsMap[T] & { id: string },
        );
    },

    /**
     * @param type The type of setting.
     * @param id The document ID to update.
     * @param data The partial data to update.
     * @param actionBy
     * @param logInfo
     */
    async update<T extends HrSettingsType>(
        type: T,
        id: string,
        data: Partial<HrSettingsMap[T]>,
        actionBy?: string,
        logInfo?: LogInfo,
    ) {
        try {
            const docRef = doc(db, "hrSettings", "main", type, id);
            await updateDoc(docRef, data as DocumentData);

            // Log the update if logInfo is provided
            if (logInfo && actionBy) {
                await createLog(logInfo, actionBy, "Success");
            }

            return true;
        } catch (e) {
            console.log("error", e);

            // Log the failure if logInfo is provided
            if (logInfo && actionBy) {
                await createLog(
                    {
                        ...logInfo,
                        title: `${logInfo.title} Failed`,
                        description: `Failed to ${logInfo.description.toLowerCase()}`,
                    },
                    actionBy,
                    "Failure",
                );
            }

            return false;
        }
    },

    /**
     * @param type The type of setting.
     * @param id The document ID to remove.
     * @param actionBy
     * @param logInfo
     */
    async remove<T extends HrSettingsType>(
        type: T,
        id: string,
        actionBy?: string,
        logInfo?: LogInfo,
    ) {
        try {
            const docRef = doc(db, "hrSettings", "main", type, id);
            await deleteDoc(docRef);

            // Log the deletion if logInfo is provided
            if (logInfo && actionBy) {
                await createLog(logInfo, actionBy, "Success");
            }

            return true;
        } catch (e) {
            console.log("error", e);

            // Log the failure if logInfo is provided
            if (logInfo && actionBy) {
                await createLog(
                    {
                        ...logInfo,
                        title: `${logInfo.title} Failed`,
                        description: `Failed to ${logInfo.description.toLowerCase()}`,
                    },
                    actionBy,
                    "Failure",
                );
            }

            return false;
        }
    },

    async batchCreate<T extends HrSettingsType>(
        type: T,
        dataArray: Array<Omit<HrSettingsMap[T], "id" | "createdAt" | "updatedAt">>,
        actionBy?: string,
        logInfo?: LogInfo,
    ): Promise<{ success: boolean; ids?: string[]; error?: string }> {
        if (!dataArray.length) {
            return { success: false, error: "No data provided" };
        }

        const batch = writeBatch(db);
        const subcollectionRef = collection(db, "hrSettings", "main", type);
        const ids: string[] = [];

        try {
            dataArray.forEach(data => {
                const docRef = doc(subcollectionRef);
                ids.push(docRef.id);

                batch.set(docRef, {
                    ...data,
                    createdAt: dayjs().format(timestampFormat),
                    updatedAt: dayjs().format(timestampFormat),
                });
            });

            await batch.commit();

            // Log the batch creation if logInfo is provided
            if (logInfo && actionBy) {
                await createLog(
                    {
                        ...logInfo,
                        description: `${logInfo.description} - Created ${dataArray.length} records`,
                    },
                    actionBy,
                    "Success",
                );
            }

            return { success: true, ids };
        } catch (error: any) {
            console.error("Batch create failed:", error);

            // Log the failure if logInfo is provided
            if (logInfo && actionBy) {
                await createLog(
                    {
                        ...logInfo,
                        title: `${logInfo.title} Failed`,
                        description: `Failed to ${logInfo.description.toLowerCase()}`,
                    },
                    actionBy,
                    "Failure",
                );
            }

            return {
                success: false,
                error: error.message || "Batch write failed",
            };
        }
    },

    async batchDelete<T extends HrSettingsType>(
        type: T,
        ids: string[],
    ): Promise<{ success: boolean; error?: string }> {
        if (!ids.length) {
            return { success: false, error: "No IDs provided" };
        }

        const batch = writeBatch(db);
        const subcollectionRef = collection(db, "hrSettings", "main", type);

        try {
            ids.forEach(id => {
                const docRef = doc(subcollectionRef, id);
                batch.delete(docRef);
            });

            await batch.commit();

            return { success: true };
        } catch (error: any) {
            console.error("Batch delete failed:", error);
            return {
                success: false,
                error: error.message || "Batch delete failed",
            };
        }
    },
};
