import { collection, onSnapshot, Unsubscribe } from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "@/lib/backend/firebase/init";
import {
    AccrualConfigurationModel,
    BackdateCapabilitiesModel,
    CompetenceModel,
    CompetencePositionAssociationModel,
    ContractHourModel,
    ContractTypeModel,
    DepartmentKPIModel,
    DepartmentSettingsModel,
    DisciplinaryTypeModel,
    EligibleLeaveDaysModel,
    GradeDefinitionModel,
    HiringNeedTypeModel,
    HolidayModel,
    ImpactTypeModel,
    IssueStatusModel,
    IssueTypeModel,
    LeaveSettingsModel,
    LeaveTypeModel,
    LevelOfEducationModel,
    LocationModel,
    MaritalStatusModel,
    NotificationTypeModel,
    OvertimeConfigurationModel,
    PayrollSettingsModel,
    PositionDefinitionModel,
    PriorityModel,
    ProbationDayModel,
    ReasonOfLeavingModel,
    SalaryScaleModel,
    SectionSettingsModel,
    ShiftHourModel,
    ShiftTypeModel,
    StrategicObjectiveModel,
    ViolationTypeModel,
    YearsOfExperienceModel,
    CriticityModel,
    AnnouncementTypeModel,
    CategoryModel,
    IndustryModel,
    CommonAnswerTypesModel,
    TransferTypeModel,
    TransferReasonModel,
} from "@/lib/backend/firebase/hrSettingsService";
import { CompanyInfoModel } from "@/lib/models/companyInfo";
import { CommonAnswerModel } from "@/lib/models/commonAnswer";
import {
    EvaluationCampaignModel,
    MonitoringPeriodModel,
    PeriodicOptionModel,
} from "@/lib/models/performance";
import { ImportLogModel } from "@/lib/models/import-log";
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
import { ExternalDocumentModel } from "@/lib/models/external-document";
import { FileDocumentModel } from "@/lib/models/file-document";
import { useAuth } from "@/context/authContext";
import { SignatureWorkflowModel, DocumentRequestModel } from "@/lib/models/signature-workflow";

export interface HrSettingsState {
    companyInfo: CompanyInfoModel[];
    leaveSettings: LeaveSettingsModel[];
    payrollSettings: PayrollSettingsModel[];
    departmentSettings: DepartmentSettingsModel[];
    sectionSettings: SectionSettingsModel[];
    periodicOptions: PeriodicOptionModel[];
    evaluationCampaigns: EvaluationCampaignModel[];
    monitoringPeriods: MonitoringPeriodModel[];
    notificationTypes: NotificationTypeModel[];
    locations: LocationModel[];
    maritalStatuses: MaritalStatusModel[];
    contractTypes: ContractTypeModel[];
    contractHours: ContractHourModel[];
    reasonOfLeaving: ReasonOfLeavingModel[];
    probationDays: ProbationDayModel[];
    salaryScales: SalaryScaleModel[];
    leaveTypes: LeaveTypeModel[];
    eligibleLeaveDays: EligibleLeaveDaysModel[];
    backdateCapabilities: BackdateCapabilitiesModel[];
    accrualConfigurations: AccrualConfigurationModel[];
    holidays: HolidayModel[];
    shiftHours: ShiftHourModel[];
    shiftTypes: ShiftTypeModel[];
    overtimeTypes: OvertimeConfigurationModel[];
    competencies: CompetenceModel[];
    grades: GradeDefinitionModel[];
    positions: PositionDefinitionModel[];
    competencePositionAssociations: CompetencePositionAssociationModel[];
    importLogs: ImportLogModel[];
    hiringNeedTypes: HiringNeedTypeModel[];
    levelOfEducations: LevelOfEducationModel[];
    yearsOfExperiences: YearsOfExperienceModel[];
    criticity: CriticityModel[];
    announcementTypes: AnnouncementTypeModel[];
    categories: CategoryModel[];
    industries: IndustryModel[];
    strategicObjectives: StrategicObjectiveModel[];
    departmentKPIs: DepartmentKPIModel[];
    tmCategories: TMCategory[];
    tmComplexity: TMComplexityModel[];
    tmLengths: TMLengthModel[];
    paymentTypes: PaymentTypeModel[];
    deductionTypes: DeductionTypeModel[];
    loanTypes: LoanTypeModel[];
    taxes: TaxModel[];
    currencies: CurrencyModel[];
    pension: PensionModel[];
    issueTypes: IssueTypeModel[];
    issueStatus: IssueStatusModel[];
    impactTypes: ImpactTypeModel[];
    priorities: PriorityModel[];
    violationTypes: ViolationTypeModel[];
    disciplinaryTypes: DisciplinaryTypeModel[];
    commonAnswers: CommonAnswerModel[];
    commonAnswerTypes: CommonAnswerTypesModel[];
    transferTypes: TransferTypeModel[];
    transferReasons: TransferReasonModel[];
    // Document management
    externalDocuments: ExternalDocumentModel[];
    headerDocuments: FileDocumentModel[];
    footerDocuments: FileDocumentModel[];
    signatureDocuments: FileDocumentModel[];
    stampDocuments: FileDocumentModel[];
    initialDocuments: FileDocumentModel[];
    // Signature Workflow
    signatureWorkflows: SignatureWorkflowModel[];
    // Document Requests
    documentRequests: DocumentRequestModel[];
}

const initialHrSettings: HrSettingsState = {
    companyInfo: [],
    leaveSettings: [],
    payrollSettings: [],
    departmentSettings: [],
    sectionSettings: [],
    periodicOptions: [],
    evaluationCampaigns: [],
    monitoringPeriods: [],
    notificationTypes: [],
    locations: [],
    maritalStatuses: [],
    contractTypes: [],
    contractHours: [],
    reasonOfLeaving: [],
    probationDays: [],
    salaryScales: [],
    leaveTypes: [],
    eligibleLeaveDays: [],
    backdateCapabilities: [],
    accrualConfigurations: [],
    holidays: [],
    shiftHours: [],
    shiftTypes: [],
    overtimeTypes: [],
    competencies: [],
    grades: [],
    positions: [],
    competencePositionAssociations: [],
    importLogs: [],
    hiringNeedTypes: [],
    levelOfEducations: [],
    yearsOfExperiences: [],
    criticity: [],
    announcementTypes: [],
    categories: [],
    industries: [],
    strategicObjectives: [],
    departmentKPIs: [],
    tmCategories: [],
    tmComplexity: [],
    tmLengths: [],
    paymentTypes: [],
    deductionTypes: [],
    loanTypes: [],
    taxes: [],
    currencies: [],
    pension: [],
    issueTypes: [],
    issueStatus: [],
    impactTypes: [],
    priorities: [],
    violationTypes: [],
    disciplinaryTypes: [],
    commonAnswers: [],
    commonAnswerTypes: [],
    transferTypes: [],
    transferReasons: [],
    // Document management
    externalDocuments: [],
    headerDocuments: [],
    footerDocuments: [],
    signatureDocuments: [],
    stampDocuments: [],
    initialDocuments: [],
    // Signature Workflow
    signatureWorkflows: [],
    // Document Requests
    documentRequests: [],
};

export function useHrSettings() {
    const [hrSettings, setHrSettings] = useState<HrSettingsState>(initialHrSettings);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const { user } = useAuth();

    useEffect(() => {
        const unsubscribes: Unsubscribe[] = [];
        let loadedCount = 0;

        const hrSettingsTypes: (keyof HrSettingsState)[] = [
            "companyInfo",
            "leaveSettings",
            "payrollSettings",
            "departmentSettings",
            "sectionSettings",
            "locations",
            "maritalStatuses",
            "contractTypes",
            "contractHours",
            "reasonOfLeaving",
            "probationDays",
            "salaryScales",
            "eligibleLeaveDays",
            "leaveTypes",
            "accrualConfigurations",
            "holidays",
            "shiftHours",
            "shiftTypes",
            "overtimeTypes",
            "competencies",
            "grades",
            "positions",
            "competencePositionAssociations",
            "levelOfEducations",
            "yearsOfExperiences",
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
        ];
        const totalTypes = hrSettingsTypes.length;

        try {
            hrSettingsTypes.forEach(type => {
                const subcollectionRef = collection(db, "hrSettings", "main", type);
                const unsubscribe = onSnapshot(
                    subcollectionRef,
                    snapshot => {
                        setHrSettings(prev => ({
                            ...prev,
                            [type]: snapshot.docs.map(doc => ({
                                id: doc.id,
                                ...(doc.data() as any),
                            })),
                        }));

                        loadedCount++;
                        if (loadedCount >= totalTypes) {
                            setLoading(false);
                        }
                    },
                    error => {
                        console.error(`Error fetching hrSettings ${type}:`, error);
                        if (error.code === "permission-denied") {
                            setHrSettings(prev => ({
                                ...prev,
                                [type]: [],
                            }));
                        } else {
                            setError(error.message);
                        }
                        loadedCount++;
                        if (loadedCount >= totalTypes) {
                            setLoading(false);
                        }
                    },
                );
                unsubscribes.push(unsubscribe);
            });
        } catch (err) {
            console.error("Error setting up hrSettings listeners:", err);
            setError("Failed to connect to hrSettings");
            setLoading(false);
        }

        return () => {
            unsubscribes.forEach(unsub => unsub());
        };
    }, [user?.uid]);

    return {
        hrSettings,
        loading,
        error,
    };
}
