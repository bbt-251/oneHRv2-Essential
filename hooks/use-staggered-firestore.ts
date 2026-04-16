"use client";

import { HrSettingsByType } from "@/context/firestore-context";
import { useEffect, useMemo, useState } from "react";
import { DependentModel } from "./../lib/models/dependent";
import { TalentPoolModel } from "./../lib/models/talentPool";
import { useCoreData } from "./use-core-data";
import { useDependentsData } from "./use-dependents-data";
import { useHRManagement } from "./use-hr-management";
import { useHrSettings } from "./use-hr-settings";
import { usePerformanceData } from "./use-performance-data";
import { useTalentAcquisition } from "./use-talent-acquisition";
import { useTrainingData } from "./use-training-data";
import { useTransfersData } from "./use-transfers-data";

// Import model types
import { IssueModel } from "@/lib/models/Issue";
import { AnnouncementModel } from "@/lib/models/announcement";
import ApplicantModel from "@/lib/models/applicant";
import { AttendanceModel, RequestModificationModel } from "@/lib/models/attendance";
import { AttendanceLogicModel } from "@/lib/models/attendance-logic";
import { CommonAnswerModel } from "@/lib/models/commonAnswer";
import { CompetenceAssessmentModel, CompetenceValueModel } from "@/lib/models/competenceAssessment";
import CustomCriteriaModel from "@/lib/models/custom-criteria";
import { DelegationModel } from "@/lib/models/delegation";
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
import { JobApplicationModel } from "@/lib/models/job-application";
import { JobPostModel } from "@/lib/models/job-post";
import { LeaveModel } from "@/lib/models/leave";
import { LogModel } from "@/lib/models/log";
import { ManagerSwapModel } from "@/lib/models/manager-swap";
import MatchingProfileModel from "@/lib/models/matching-profile";
import MultipleChoiceModel from "@/lib/models/multiple-choice";
import InAppNotificationModel from "@/lib/models/notification";
import { ObjectiveModel } from "@/lib/models/objective-model";
import { ObjectiveWeightModel } from "@/lib/models/objective-weight";
import { OrderGuideModel, OrderItemModel } from "@/lib/models/order-guide-and-order-item";
import { OvertimeRequestModel } from "@/lib/models/overtime-request";
import { PerformanceEvaluationModel } from "@/lib/models/performance-evaluation";
import { ProjectModel } from "@/lib/models/project";
import { PromotionInstanceModel } from "@/lib/models/promotion-instance";
import { QuizModel } from "@/lib/models/quiz.ts";
import ScreeningQuestionModel from "@/lib/models/screening-questions";
import ShortAnswerModel from "@/lib/models/short-answer";
import { SubPoolModel } from "@/lib/models/subPool";
import { SurveyModel } from "@/lib/models/survey";
import { TrainingCertificationModel } from "@/lib/models/training-certificate";
import { TrainingMaterialModel } from "@/lib/models/training-material";
import { TrainingPathModel } from "@/lib/models/training-path";
import { TransferModel } from "@/lib/models/transfer";
import { TrackModel, RoleModel } from "@/lib/models/career-path";
import { useAdditionalData } from "./use-additional-data";
import { useEngagementData } from "./use-engagement-data";
import { usePromotionData } from "./use-promotion-data";

export interface StaggeredFirestoreState {
    // Core data (loaded first - critical for app initialization)
    employees: EmployeeModel[];
    notifications: InAppNotificationModel[];
    attendances: AttendanceModel[];
    projects: ProjectModel[];

    // HR Management (loaded second - important for daily operations)
    leaveManagements: LeaveModel[];
    overtimeRequests: OvertimeRequestModel[];
    requestModifications: RequestModificationModel[];
    documents: DocumentDefinitionModel[];
    attendanceLogic: AttendanceLogicModel[];
    flexibilityParameter: FlexibilityParameterModel[];
    exitInstances: ExitInstanceModel[];
    exitChecklists: ExitChecklistModel[];
    exitChecklistItems: ExitChecklistItemModel[];
    exitInterviewQuestions: ExitInterviewQuestionModel[];
    managerSwaps: ManagerSwapModel[];
    delegations: DelegationModel[];

    // Performance Data (loaded third - analytical data)
    performanceEvaluations: PerformanceEvaluationModel[];
    objectives: ObjectiveModel[];
    competenceValues: CompetenceValueModel[];
    competenceAssessments: CompetenceAssessmentModel[];
    objectiveWeights: ObjectiveWeightModel[];
    evaluationMetrics: EvaluationMetricModel[];

    // Training Data (loaded fourth - learning content)
    trainingMaterials: TrainingMaterialModel[];
    trainingPaths: TrainingPathModel[];
    trainingCertificates: TrainingCertificationModel[];
    multipleChoices: MultipleChoiceModel[];
    shortAnswers: ShortAnswerModel[];
    commonAnswers: CommonAnswerModel[];
    quizzes: QuizModel[];

    // Talent Acquisition (loaded fifth - recruitment data)
    hiringNeeds: HiringNeedModel[];
    matchingProfiles: MatchingProfileModel[];
    customCriteria: CustomCriteriaModel[];
    screeningQuestions: ScreeningQuestionModel[];
    jobPosts: JobPostModel[];
    jobApplications: JobApplicationModel[];
    applicants: ApplicantModel[];
    subPools: SubPoolModel[];

    // Engagement Data
    surveys: SurveyModel[];
    issues: IssueModel[];
    changeRequests: EmployeeInfoChangeRequestModel[];

    // Additional Data (loaded seventh - supplementary data)
    compensations: EmployeeCompensationModel[];
    employeeLoans: EmployeeLoanModel[];
    disciplinaryActions: DisciplinaryActionModel[];
    logs: LogModel[];
    orderGuides: OrderGuideModel[];
    orderItems: OrderItemModel[];
    tracks: TrackModel[];
    roles: RoleModel[];

    // Announcements (loaded sixth - announcement data)
    announcements: AnnouncementModel[];
    talentPools: TalentPoolModel[];
    // HR Settings (loaded sixth - configuration data)
    hrSettings: HrSettingsByType;

    // Dependents Data (loaded seventh - dependents data)
    dependents: DependentModel[];

    // Transfers Data (loaded eighth - employee transfers)
    transfers: TransferModel[];

    // Promotion Data (loaded ninth - promotion instances)
    promotionInstances: PromotionInstanceModel[];

    // Loading states
    loading: boolean;
    error: string | null;

    // Group-specific loading states
    coreLoading: boolean;
    hrLoading: boolean;
    performanceLoading: boolean;
    trainingLoading: boolean;
    talentLoading: boolean;
    hrSettingsLoading: boolean;
    dependentsLoading: boolean;
    promotionLoading: boolean;
}

export function useStaggeredFirestore(): StaggeredFirestoreState {
    const [overallLoading, setOverallLoading] = useState<boolean>(true);
    const [overallError, setOverallError] = useState<string | null>(null);

    // Load groups in staggered fashion
    const coreData = useCoreData();
    const hrData = useHRManagement();
    const performanceData = usePerformanceData();
    const trainingData = useTrainingData();
    const talentData = useTalentAcquisition();
    const engagementData = useEngagementData();
    const additionalData = useAdditionalData();
    const hrSettingsData = useHrSettings();
    const dependentsData = useDependentsData();
    const transfersData = useTransfersData();
    const promotionData = usePromotionData();

    useEffect(() => {
        // Staggered loading logic
        let loadedGroups = 0;
        const totalGroups = 11;

        // Check if each group is loaded (not loading and no error)
        const checkGroupLoaded = (loading: boolean, error: string | null) => {
            return !loading && !error;
        };

        if (checkGroupLoaded(coreData.loading, coreData.error)) loadedGroups++;
        if (checkGroupLoaded(hrData.loading, hrData.error)) loadedGroups++;
        if (checkGroupLoaded(performanceData.loading, performanceData.error)) loadedGroups++;
        if (checkGroupLoaded(trainingData.loading, trainingData.error)) loadedGroups++;
        if (checkGroupLoaded(talentData.loading, talentData.error)) loadedGroups++;
        if (checkGroupLoaded(engagementData.loading, engagementData.error)) loadedGroups++;
        if (checkGroupLoaded(additionalData.loading, additionalData.error)) loadedGroups++;
        if (checkGroupLoaded(hrSettingsData.loading, hrSettingsData.error)) loadedGroups++;
        if (checkGroupLoaded(dependentsData.loading, dependentsData.error)) loadedGroups++;
        if (checkGroupLoaded(transfersData.loading, transfersData.error)) loadedGroups++;
        if (checkGroupLoaded(promotionData.loading, promotionData.error)) loadedGroups++;

        // If all groups are loaded, set overall loading to false
        if (loadedGroups === totalGroups) {
            setOverallLoading(false);
        }

        // Collect any errors from groups
        const errors = [
            coreData.error,
            hrData.error,
            performanceData.error,
            trainingData.error,
            talentData.error,
            engagementData.error,
            additionalData.error,
            hrSettingsData.error,
            dependentsData.error,
            transfersData.error,
            promotionData.error,
        ].filter(Boolean);
        if (errors.length > 0) {
            setOverallError(errors[0]); // Show first error encountered
        } else {
            setOverallError(null);
        }
    }, [
        coreData.loading,
        coreData.error,
        hrData.loading,
        hrData.error,
        performanceData.loading,
        performanceData.error,
        trainingData.loading,
        trainingData.error,
        talentData.loading,
        talentData.error,
        engagementData.loading,
        engagementData.error,
        additionalData.loading,
        additionalData.error,
        hrSettingsData.loading,
        hrSettingsData.error,
        dependentsData.loading,
        dependentsData.error,
        transfersData.loading,
        transfersData.error,
        promotionData.loading,
        promotionData.error,
    ]);

    return useMemo(
        () => ({
            // Core data
            employees: coreData.employees,
            notifications: coreData.notifications,
            attendances: coreData.attendances,
            projects: coreData.projects,

            // HR Management
            leaveManagements: hrData.leaveManagements,
            overtimeRequests: hrData.overtimeRequests,
            requestModifications: hrData.requestModifications,
            documents: [],
            attendanceLogic: hrData.attendanceLogic,
            flexibilityParameter: hrData.flexibilityParameter,
            announcements: [],
            exitInstances: [],
            exitChecklists: [],
            exitChecklistItems: [],
            exitInterviewQuestions: [],
            managerSwaps: [],
            delegations: [],

            // Performance Data
            performanceEvaluations: performanceData.performanceEvaluations,
            objectives: performanceData.objectives,
            competenceValues: performanceData.competenceValues,
            competenceAssessments: performanceData.competenceAssessments,
            objectiveWeights: performanceData.objectiveWeights,
            evaluationMetrics: performanceData.evaluationMetrics,

            // Training Data
            trainingMaterials: trainingData.trainingMaterials,
            trainingPaths: trainingData.trainingPaths,
            trainingCertificates: trainingData.trainingCertificates,
            multipleChoices: trainingData.multipleChoices,
            shortAnswers: trainingData.shortAnswers,
            commonAnswers: trainingData.commonAnswers,
            quizzes: trainingData.quizzes,

            // Talent Acquisition
            hiringNeeds: talentData.hiringNeeds,
            matchingProfiles: talentData.matchingProfiles,
            customCriteria: talentData.customCriteria,
            screeningQuestions: talentData.screeningQuestions,
            jobPosts: talentData.jobPosts,
            jobApplications: talentData.jobApplications,
            applicants: talentData.applicants,
            talentPools: talentData.talentPools,
            subPools: talentData.subPools,

            // Engagement Data
            surveys: engagementData.surveys,
            issues: engagementData.issues,
            changeRequests: engagementData.changeRequests,

            // Additional Data
            compensations: additionalData.compensations,
            employeeLoans: additionalData.employeeLoans,
            disciplinaryActions: [],
            logs: additionalData.logs,
            orderGuides: [],
            orderItems: [],
            tracks: [],
            roles: [],

            // HR Settings
            hrSettings: hrSettingsData.hrSettings,

            // Dependents
            dependents: dependentsData.dependents,

            // Transfers
            transfers: transfersData.transfers,

            // Promotion Data
            promotionInstances: promotionData.promotionInstances,

            // Overall state
            loading: overallLoading,
            error: overallError,

            // Group-specific loading states
            coreLoading: coreData.loading,
            hrLoading: hrData.loading,
            performanceLoading: performanceData.loading,
            trainingLoading: trainingData.loading,
            talentLoading: talentData.loading,
            hrSettingsLoading: hrSettingsData.loading,
            dependentsLoading: dependentsData.loading,
            promotionLoading: promotionData.loading,
        }),
        [
            coreData.employees,
            coreData.notifications,
            coreData.attendances,
            coreData.projects,
            coreData.loading,
            hrData.leaveManagements,
            hrData.overtimeRequests,
            hrData.requestModifications,
            hrData.attendanceLogic,
            hrData.flexibilityParameter,
            hrData.loading,
            performanceData.performanceEvaluations,
            performanceData.objectives,
            performanceData.competenceValues,
            performanceData.competenceAssessments,
            performanceData.objectiveWeights,
            performanceData.evaluationMetrics,
            performanceData.loading,
            trainingData.trainingMaterials,
            trainingData.trainingPaths,
            trainingData.trainingCertificates,
            trainingData.multipleChoices,
            trainingData.shortAnswers,
            trainingData.commonAnswers,
            trainingData.quizzes,
            trainingData.loading,
            talentData.hiringNeeds,
            talentData.matchingProfiles,
            talentData.customCriteria,
            talentData.screeningQuestions,
            talentData.jobPosts,
            talentData.jobApplications,
            talentData.applicants,
            talentData.talentPools,
            talentData.subPools,
            talentData.loading,
            engagementData.surveys,
            engagementData.issues,
            engagementData.changeRequests,
            additionalData.compensations,
            additionalData.employeeLoans,
            additionalData.logs,
            additionalData.loading,
            hrSettingsData.hrSettings,
            hrSettingsData.loading,
            dependentsData.dependents,
            dependentsData.loading,
            transfersData.transfers,
            transfersData.loading,
            promotionData.promotionInstances,
            promotionData.loading,
            overallLoading,
            overallError,
        ],
    );
}
