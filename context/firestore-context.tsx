// contexts/FirestoreProvider.tsx

import { useStaggeredFirestore } from "@/hooks/use-staggered-firestore";
import { useEffect, useState } from "react";
import {
    AccrualConfigurationModel,
    AnnouncementTypeModel,
    BackdateCapabilitiesModel,
    CategoryModel,
    CommonAnswerTypesModel,
    CompetenceModel,
    CompetencePositionAssociationModel,
    ContractHourModel,
    ContractTypeModel,
    CriticityModel,
    DepartmentKPIModel,
    DepartmentSettingsModel,
    DisciplinaryTypeModel,
    EligibleLeaveDaysModel,
    GradeDefinitionModel,
    HiringNeedTypeModel,
    HolidayModel,
    ImpactTypeModel,
    IndustryModel,
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
    TransferReasonModel,
    TransferTypeModel,
    ViolationTypeModel,
    YearsOfExperienceModel,
} from "@/lib/backend/firebase/hrSettingsService";
import { AnnouncementModel } from "@/lib/models/announcement";
import ApplicantModel from "@/lib/models/applicant";
import { AttendanceModel, RequestModificationModel } from "@/lib/models/attendance";
import { AttendanceLogicModel } from "@/lib/models/attendance-logic";
import { CommonAnswerModel } from "@/lib/models/commonAnswer";
import { CompanyInfoModel } from "@/lib/models/companyInfo";
import { CompetenceAssessmentModel, CompetenceValueModel } from "@/lib/models/competenceAssessment";
import CustomCriteriaModel from "@/lib/models/custom-criteria";
import { DelegationModel } from "@/lib/models/delegation";
import { DependentModel } from "@/lib/models/dependent";
import { DisciplinaryActionModel } from "@/lib/models/disciplinary-action";
import { DocumentDefinitionModel } from "@/lib/models/document";
import { EmployeeModel } from "@/lib/models/employee";
import { EmployeeInfoChangeRequestModel } from "@/lib/models/employee-info-change-request";
import { EmployeeCompensationModel } from "@/lib/models/employeeCompensation";
import { EmployeeLoanModel } from "@/lib/models/employeeLoan";
import { EvaluationMetricModel } from "@/lib/models/evaluation-metric";
import { ExitChecklistModel } from "@/lib/models/exit-checklist";
import { ExitChecklistItemModel } from "@/lib/models/exit-checklist-item";
import { ExitInstanceModel } from "@/lib/models/exit-instance";
import ExitInterviewQuestionModel from "@/lib/models/exit-interview-questions";
import { FlexibilityParameterModel } from "@/lib/models/flexibilityParameter";
import { HiringNeedModel } from "@/lib/models/hiring-need";
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
import { ImportLogModel } from "@/lib/models/import-log";
import InAppNotificationModel from "@/lib/models/in-app-notification";
import { IssueModel } from "@/lib/models/Issue";
import { JobApplicationModel } from "@/lib/models/job-application";
import { JobPostModel } from "@/lib/models/job-post";
import { LeaveModel } from "@/lib/models/leave";
import { LogModel } from "@/lib/models/log";
import { ManagerSwapModel } from "@/lib/models/manager-swap";
import MatchingProfileModel from "@/lib/models/matching-profile";
import MultipleChoiceModel from "@/lib/models/multiple-choice";
import { ObjectiveModel } from "@/lib/models/objective-model";
import { ObjectiveWeightModel } from "@/lib/models/objective-weight";
import { OrderGuideModel, OrderItemModel } from "@/lib/models/order-guide-and-order-item";
import { OvertimeRequestModel } from "@/lib/models/overtime-request";
import {
    EvaluationCampaignModel,
    MonitoringPeriodModel,
    PeriodicOptionModel,
} from "@/lib/models/performance";
import { PerformanceEvaluationModel } from "@/lib/models/performance-evaluation";
import { ProjectModel } from "@/lib/models/project";
import { PromotionInstanceModel } from "@/lib/models/promotion-instance";
import { QuizModel } from "@/lib/models/quiz.ts";
import ScreeningQuestionModel from "@/lib/models/screening-questions";
import ShortAnswerModel from "@/lib/models/short-answer";
import { SubPoolModel } from "@/lib/models/subPool";
import { SurveyModel } from "@/lib/models/survey";
import { TalentPoolModel } from "@/lib/models/talentPool";
import { TrainingCertificationModel } from "@/lib/models/training-certificate";
import { TrainingMaterialModel } from "@/lib/models/training-material";
import { TrainingPathModel } from "@/lib/models/training-path";
import { TransferModel } from "@/lib/models/transfer";
import { ExternalDocumentModel } from "@/lib/models/external-document";
import { FileDocumentModel } from "@/lib/models/file-document";
import { TrackModel, RoleModel } from "@/lib/models/career-path";
import { SignatureWorkflowModel, DocumentRequestModel } from "@/lib/models/signature-workflow";
import React, { createContext, useContext } from "react";

export interface HrSettingsByType {
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

interface FirestoreData {
    employees: EmployeeModel[];
    leaveManagements: LeaveModel[];
    announcements: AnnouncementModel[];
    notifications: InAppNotificationModel[];
    overtimeRequests: OvertimeRequestModel[];
    attendances: AttendanceModel[];
    hrSettings: HrSettingsByType;
    requestModifications: RequestModificationModel[];
    documents: DocumentDefinitionModel[];
    attendanceLogic: AttendanceLogicModel[];
    flexibilityParameter: FlexibilityParameterModel[];
    objectives: ObjectiveModel[];
    competenceValues: CompetenceValueModel[];
    competenceAssessments: CompetenceAssessmentModel[];
    performanceEvaluations: PerformanceEvaluationModel[];
    objectiveWeights: ObjectiveWeightModel[];
    trainingMaterials: TrainingMaterialModel[];
    trainingPaths: TrainingPathModel[];
    trainingCertificates: TrainingCertificationModel[];
    multipleChoices: MultipleChoiceModel[];
    shortAnswers: ShortAnswerModel[];
    commonAnswers: CommonAnswerModel[];
    quizzes: QuizModel[];
    hiringNeeds: HiringNeedModel[];
    evaluationMetrics: EvaluationMetricModel[];
    matchingProfiles: MatchingProfileModel[];
    customCriteria: CustomCriteriaModel[];
    screeningQuestions: ScreeningQuestionModel[];
    jobPosts: JobPostModel[];
    projects: ProjectModel[];
    jobApplications: JobApplicationModel[];
    subPools: SubPoolModel[];
    applicants: ApplicantModel[];
    compensations: EmployeeCompensationModel[];
    employeeLoans: EmployeeLoanModel[];
    talentPools: TalentPoolModel[];
    disciplinaryActions: DisciplinaryActionModel[];
    surveys: SurveyModel[];
    issues: IssueModel[];
    logs: LogModel[];
    changeRequests: EmployeeInfoChangeRequestModel[];
    exitInstances: ExitInstanceModel[];
    exitChecklists: ExitChecklistModel[];
    exitChecklistItems: ExitChecklistItemModel[];
    exitInterviewQuestions: ExitInterviewQuestionModel[];
    managerSwaps: ManagerSwapModel[];
    delegations: DelegationModel[];
    orderGuides: OrderGuideModel[];
    orderItems: OrderItemModel[];
    dependents: DependentModel[];
    transfers: TransferModel[];
    promotionInstances: PromotionInstanceModel[];

    // Career Path
    tracks: TrackModel[];
    roles: RoleModel[];

    // Add active employees
    activeEmployees: EmployeeModel[];

    loading: boolean;
    error: string | null;

    // Group-specific loading states
    talentLoading: boolean;
}

const initialHrSettings: HrSettingsByType = {
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

const FirestoreContext = createContext<FirestoreData>({
    employees: [],
    leaveManagements: [],
    announcements: [],
    notifications: [],
    attendances: [],
    hrSettings: initialHrSettings,
    overtimeRequests: [],
    requestModifications: [],
    documents: [],
    attendanceLogic: [],
    flexibilityParameter: [],
    objectives: [],
    competenceValues: [],
    competenceAssessments: [],
    performanceEvaluations: [],
    objectiveWeights: [],
    trainingMaterials: [],
    trainingPaths: [],
    trainingCertificates: [],
    multipleChoices: [],
    shortAnswers: [],
    commonAnswers: [],
    quizzes: [],
    hiringNeeds: [],
    evaluationMetrics: [],
    matchingProfiles: [],
    customCriteria: [],
    screeningQuestions: [],
    jobPosts: [],
    projects: [],
    jobApplications: [],
    applicants: [],
    compensations: [],
    employeeLoans: [],
    talentPools: [],
    subPools: [],
    disciplinaryActions: [],
    surveys: [],
    issues: [],
    logs: [],
    changeRequests: [],
    exitInstances: [],
    exitChecklists: [],
    exitChecklistItems: [],
    exitInterviewQuestions: [],
    managerSwaps: [],
    delegations: [],
    orderGuides: [],
    orderItems: [],
    dependents: [],
    transfers: [],
    promotionInstances: [],

    // Career Path
    tracks: [],
    roles: [],

    // Add active employees
    activeEmployees: [],

    loading: true,
    error: null,
    talentLoading: true,
});

interface FirestoreProviderState {
    employees: EmployeeModel[];
    leaveManagements: LeaveModel[];
    announcements: AnnouncementModel[];
    notifications: InAppNotificationModel[];
    attendances: AttendanceModel[];
    hrSettings: HrSettingsByType;
    overtimeRequests: OvertimeRequestModel[];
    requestModifications: RequestModificationModel[];
    documents: DocumentDefinitionModel[];
    attendanceLogic: AttendanceLogicModel[];
    flexibilityParameter: FlexibilityParameterModel[];
    objectives: ObjectiveModel[];
    competenceValues: CompetenceValueModel[];
    competenceAssessments: CompetenceAssessmentModel[];
    performanceEvaluations: PerformanceEvaluationModel[];
    objectiveWeights: ObjectiveWeightModel[];
    trainingMaterials: TrainingMaterialModel[];
    trainingPaths: TrainingPathModel[];
    trainingCertificates: TrainingCertificationModel[];
    multipleChoices: MultipleChoiceModel[];
    shortAnswers: ShortAnswerModel[];
    commonAnswers: CommonAnswerModel[];
    quizzes: QuizModel[];
    hiringNeeds: HiringNeedModel[];
    evaluationMetrics: EvaluationMetricModel[];
    matchingProfiles: MatchingProfileModel[];
    customCriteria: CustomCriteriaModel[];
    screeningQuestions: ScreeningQuestionModel[];
    jobPosts: JobPostModel[];
    projects: ProjectModel[];
    jobApplications: JobApplicationModel[];
    subPools: SubPoolModel[];
    applicants: ApplicantModel[];
    compensations: EmployeeCompensationModel[];
    employeeLoans: EmployeeLoanModel[];
    talentPools: TalentPoolModel[];
    disciplinaryActions: DisciplinaryActionModel[];
    surveys: SurveyModel[];
    issues: IssueModel[];
    logs: LogModel[];
    changeRequests: EmployeeInfoChangeRequestModel[];
    exitInstances: ExitInstanceModel[];
    exitChecklists: ExitChecklistModel[];
    exitChecklistItems: ExitChecklistItemModel[];
    exitInterviewQuestions: ExitInterviewQuestionModel[];
    managerSwaps: ManagerSwapModel[];
    delegations: DelegationModel[];
    orderGuides: OrderGuideModel[];
    orderItems: OrderItemModel[];
    dependents: DependentModel[];
    transfers: TransferModel[];
    promotionInstances: PromotionInstanceModel[];

    // Career Path
    tracks: TrackModel[];
    roles: RoleModel[];

    // Add active employees
    activeEmployees: EmployeeModel[];
}

export const FirestoreProvider = ({ children }: { children: React.ReactNode }) => {
    // Use the new staggered loading approach
    const staggeredData = useStaggeredFirestore();

    // update reportees array to include latest reportee management (as a redundancy)
    const updatedListOfEmployees: EmployeeModel[] = staggeredData.employees.map(employee => {
        const reportees: EmployeeModel[] = staggeredData.employees.filter(
            e => e.reportingLineManager === employee.uid,
        );

        const reporteesUID = reportees.map(r => r.uid);
        return {
            ...employee,
            reportees: reporteesUID,
        };
    });

    // Map the staggered data to the expected interface for backward compatibility
    const data: FirestoreProviderState = {
        employees: updatedListOfEmployees,
        leaveManagements: staggeredData.leaveManagements,
        announcements: staggeredData.announcements,
        notifications: staggeredData.notifications,
        attendances: staggeredData.attendances,
        hrSettings: staggeredData.hrSettings, // Now properly loaded from hrSettings hook
        overtimeRequests: staggeredData.overtimeRequests,
        requestModifications: staggeredData.requestModifications,
        documents: staggeredData.documents,
        attendanceLogic: staggeredData.attendanceLogic,
        flexibilityParameter: staggeredData.flexibilityParameter,
        performanceEvaluations: staggeredData.performanceEvaluations,
        objectives: staggeredData.objectives,
        competenceValues: staggeredData.competenceValues,
        competenceAssessments: staggeredData.competenceAssessments,
        objectiveWeights: staggeredData.objectiveWeights,
        hiringNeeds: staggeredData.hiringNeeds,
        trainingMaterials: staggeredData.trainingMaterials,
        trainingPaths: staggeredData.trainingPaths,
        trainingCertificates: staggeredData.trainingCertificates,
        multipleChoices: staggeredData.multipleChoices,
        shortAnswers: staggeredData.shortAnswers,
        commonAnswers: staggeredData.commonAnswers,
        quizzes: staggeredData.quizzes,
        evaluationMetrics: staggeredData.evaluationMetrics,
        matchingProfiles: staggeredData.matchingProfiles,
        customCriteria: staggeredData.customCriteria,
        screeningQuestions: staggeredData.screeningQuestions,
        jobPosts: staggeredData.jobPosts,
        projects: staggeredData.projects,
        jobApplications: staggeredData.jobApplications,
        applicants: staggeredData.applicants,
        compensations: staggeredData.compensations,
        employeeLoans: staggeredData.employeeLoans,
        talentPools: staggeredData.talentPools,
        subPools: staggeredData.subPools,
        disciplinaryActions: staggeredData.disciplinaryActions,
        surveys: staggeredData.surveys,
        issues: staggeredData.issues,
        logs: staggeredData.logs,
        changeRequests: staggeredData.changeRequests,
        exitInstances: staggeredData.exitInstances,
        exitChecklists: staggeredData.exitChecklists,
        exitChecklistItems: staggeredData.exitChecklistItems,
        exitInterviewQuestions: staggeredData.exitInterviewQuestions,
        managerSwaps: staggeredData.managerSwaps,
        delegations: staggeredData.delegations,
        orderGuides: staggeredData.orderGuides,
        orderItems: staggeredData.orderItems,
        dependents: staggeredData.dependents || [],
        transfers: staggeredData.transfers || [],
        promotionInstances: staggeredData.promotionInstances || [],
        tracks: staggeredData.tracks || [],
        roles: staggeredData.roles || [],

        // Add active employees
        activeEmployees: updatedListOfEmployees.filter(
            emp => emp.contractStatus.toLowerCase() === "active",
        ),
    };

    return (
        <FirestoreContext.Provider
            value={{
                ...data,
                loading: staggeredData.loading,
                error: staggeredData.error,
                talentLoading: staggeredData.talentLoading,
            }}
        >
            {children}
        </FirestoreContext.Provider>
    );
};

export const useFirestore = () => useContext(FirestoreContext);
