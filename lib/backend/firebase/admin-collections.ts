import { admin } from "./admin";

// Get the Firestore instance from Admin SDK
const db = admin.firestore();

// Main collections for HR operations - using admin SDK for server-side access
export const employeeAdminCollection = db.collection("employee");
export const attendanceAdminCollection = db.collection("attendance");
export const transferAdminCollection = db.collection("transfer");
export const overtimeRequestAdminCollection = db.collection("overtimeRequest");
export const requestedAttendanceModificationAdminCollection = db.collection(
    "requestedAttendanceModification",
);
export const leaveManagementAdminCollection = db.collection("leaveManagement");
export const performanceEvaluationAdminCollection = db.collection("performanceEvaluation");
export const employeeInfoChangeRequestAdminCollection = db.collection("employeeInfoChangeRequest");
export const objectiveAdminCollection = db.collection("objective");
export const competenceAssessmentAdminCollection = db.collection("competenceAssessment");
export const issueAdminCollection = db.collection("issue");
export const hiringNeedAdminCollection = db.collection("hiringNeed");
export const locationTreeAdminCollection = db.collection("locationTree");
export const talentAcquisitionAdminCollection = db.collection("talentAcquisition");
export const jobVacancyAdminCollection = db.collection("jobVacancy");
export const screeningQuestionAdminCollection = db.collection("screeningQuestions");
export const evaluationMetricsAdminCollection = db.collection("evaluationMetrics");
export const candidatePoolAdminCollection = db.collection("candidatePool");
export const internalCandidateAdminCollection = db.collection("internalCandidate");
export const externalCandidateAdminCollection = db.collection("externalCandidate");
export const evaluationFormAdminCollection = db.collection("evaluationForm");
export const interviewAdminCollection = db.collection("interview");
export const employeeLoanAdminCollection = db.collection("employeeLoan");
export const employeeCompensationAdminCollection = db.collection("employeeCompensation");
export const logAdminCollection = db.collection("log");
export const disciplinaryActionAdminCollection = db.collection("disciplinaryAction");
export const tmCategoryTreeAdminCollection = db.collection("tmCategoryTree");
export const trainingMaterialAdminCollection = db.collection("trainingMaterial");
export const surveyAdminCollection = db.collection("survey");
export const surveyResponseAdminCollection = db.collection("surveyResponse");
export const trainingMaterialRequestAdminCollection = db.collection("trainingMaterialRequest");
export const trainingPathAdminCollection = db.collection("trainingPath");
export const suggestionBoxAdminCollection = db.collection("suggestionBox");
export const announcementManagementAdminCollection = db.collection("announcementManagement");
export const quizAdminCollection = db.collection("quiz");
export const exitInstanceAdminCollection = db.collection("exitInstance");
export const exitChecklistAdminCollection = db.collection("exitChecklist");
export const exitChecklistItemAdminCollection = db.collection("exitChecklistItem");
export const exitInterviewAdminCollection = db.collection("exitInterview");
export const documentManagementAdminCollection = db.collection("documentManagement");
export const specificDocumentAdminCollection = db.collection("specificDocument");
export const externalDocumentAdminCollection = db.collection("externalDocument");
export const payrollPDFSettingsAdminCollection = db.collection("payrollPDFSettings");
export const orderGuidesAdminCollection = db.collection("orderGuide");
export const orderItemsAdminCollection = db.collection("orderItem");
export const promotionSuggestionAdminCollection = db.collection("promotionSuggestion");
export const successionPlanningAdminCollection = db.collection("successionPlanning");
export const TrainingMaterialCertificationAdminCollection = db.collection(
    "trainingMaterialCertification",
);
export const delegationAdminCollection = db.collection("delegation");
export const promotionInstanceAdminCollection = db.collection("promotionInstance");
export const promotionOfferAdminCollection = db.collection("promotionOffer");
export const customReportsAdminCollection = db.collection("customReport");
export const unitAdminCollection = db.collection("unit");
export const unitKpiAdminCollection = db.collection("unitKpi");
export const TANotificationAdminCollection = db.collection("TANotification");
export const multipleChoiceAdminCollection = db.collection("multipleChoice");
export const commonAnswerAdminCollection = db.collection("commonAnswer");
export const apiKeyAdminCollection = db.collection("apiKey");
export const employeeLogAdminCollection = db.collection("employeeLog");
export const managerSwapAdminCollection = db.collection("managerSwap");
export const weightDefinitionAdminCollection = db.collection("weightDefinition");
export const signatureWorkflowAdminCollection = db.collection("signatureWorkflow");
export const matchingCriteriaAdminCollection = db.collection("matchingCriteria");
export const importLogAdminCollection = db.collection("importLogs");

// TA collections
export const matchingProfileAdminCollection = db.collection("matchingProfile");
export const customCriteriaAdminCollection = db.collection("customCriteria");
export const jobPostAdminCollection = db.collection("jobPost");
export const jobApplicationAdminCollection = db.collection("jobApplication");
export const applicantAdminCollection = db.collection("applicant");
export const talentPoolAdminCollection = db.collection("talentPool");

// Additional collections
export const eldConfigAdminCollection = db.collection("eldConfig");
export const taxAdminCollection = db.collection("tax");
export const activityLogAdminCollection = db.collection("activityLog");
export const attendanceLogicAdminCollection = db.collection("attendanceLogic");
export const pensionAdminCollection = db.collection("pension");
export const probationDayAdminCollection = db.collection("probationDay");
export const lateComersAdminCollection = db.collection("lateComers");
export const salaryScaleAdminCollection = db.collection("salaryScales");

// Notification collections
export const notificationDefinitionsAdminCollection = db.collection("notificationDefinitions");
export const notificationsAdminCollection = db.collection("notifications");

// Shift and time collections
export const shiftHourAdminCollection = db.collection("shiftHour");
export const flexibilityParameterAdminCollection = db.collection("flexibilityParameter");

// Exam collections
export const shortAnswerAdminCollection = db.collection("shortAnswer");
export const examTypeAdminCollection = db.collection("examType");
export const candidateExamAdminCollection = db.collection("candidateExam");
export const examResultAdminCollection = db.collection("examResult");

// Additional collections
export const applicantEmailConfirmationAdminCollection = db.collection(
    "applicantEmailConfirmation",
);
export const dependentsAdminCollection = db.collection("dependents");
export const coverageAdminCollection = db.collection("coverage");
export const reimbursementRequestsAdminCollection = db.collection("reimbursementRequests");
export const geofenceActivationAdminCollection = db.collection("geofenceActivation");
export const requisitionFormAdminCollection = db.collection("requisitionForm");
export const requisitionFormResponsesAdminCollection = db.collection("requisitionFormResponses");

// Latest additions
export const competenceValueAdminCollection = db.collection("competenceValue");
export const projectAdminCollection = db.collection("project");

// Career Path collections
export const trackCollection = db.collection("track");
export const roleCollection = db.collection("role");

// Export the admin Firestore instance for direct use
export { db as adminDb };

// Collection name to collection reference mapping for dynamic access
export const ADMIN_COLLECTION_MAP: Record<string, FirebaseFirestore.CollectionReference> = {
    employee: employeeAdminCollection,
    attendance: attendanceAdminCollection,
    transfer: transferAdminCollection,
    overtimeRequest: overtimeRequestAdminCollection,
    requestedAttendanceModification: requestedAttendanceModificationAdminCollection,
    leaveManagement: leaveManagementAdminCollection,
    performanceEvaluation: performanceEvaluationAdminCollection,
    employeeInfoChangeRequest: employeeInfoChangeRequestAdminCollection,
    objective: objectiveAdminCollection,
    competenceAssessment: competenceAssessmentAdminCollection,
    issue: issueAdminCollection,
    hiringNeed: hiringNeedAdminCollection,
    locationTree: locationTreeAdminCollection,
    talentAcquisition: talentAcquisitionAdminCollection,
    jobVacancy: jobVacancyAdminCollection,
    screeningQuestions: screeningQuestionAdminCollection,
    evaluationMetrics: evaluationMetricsAdminCollection,
    candidatePool: candidatePoolAdminCollection,
    internalCandidate: internalCandidateAdminCollection,
    externalCandidate: externalCandidateAdminCollection,
    evaluationForm: evaluationFormAdminCollection,
    interview: interviewAdminCollection,
    employeeLoan: employeeLoanAdminCollection,
    employeeCompensation: employeeCompensationAdminCollection,
    log: logAdminCollection,
    disciplinaryAction: disciplinaryActionAdminCollection,
    tmCategoryTree: tmCategoryTreeAdminCollection,
    trainingMaterial: trainingMaterialAdminCollection,
    survey: surveyAdminCollection,
    surveyResponse: surveyResponseAdminCollection,
    trainingMaterialRequest: trainingMaterialRequestAdminCollection,
    trainingPath: trainingPathAdminCollection,
    suggestionBox: suggestionBoxAdminCollection,
    announcementManagement: announcementManagementAdminCollection,
    quiz: quizAdminCollection,
    exitInstance: exitInstanceAdminCollection,
    exitChecklist: exitChecklistAdminCollection,
    exitChecklistItem: exitChecklistItemAdminCollection,
    exitInterview: exitInterviewAdminCollection,
    documentManagement: documentManagementAdminCollection,
    specificDocument: specificDocumentAdminCollection,
    externalDocument: externalDocumentAdminCollection,
    payrollPDFSettings: payrollPDFSettingsAdminCollection,
    orderGuide: orderGuidesAdminCollection,
    orderItem: orderItemsAdminCollection,
    promotionSuggestion: promotionSuggestionAdminCollection,
    successionPlanning: successionPlanningAdminCollection,
    trainingMaterialCertification: TrainingMaterialCertificationAdminCollection,
    delegation: delegationAdminCollection,
    promotionInstance: promotionInstanceAdminCollection,
    promotionOffer: promotionOfferAdminCollection,
    customReport: customReportsAdminCollection,
    unit: unitAdminCollection,
    unitKpi: unitKpiAdminCollection,
    TANotification: TANotificationAdminCollection,
    multipleChoice: multipleChoiceAdminCollection,
    commonAnswer: commonAnswerAdminCollection,
    apiKey: apiKeyAdminCollection,
    employeeLog: employeeLogAdminCollection,
    managerSwap: managerSwapAdminCollection,
    weightDefinition: weightDefinitionAdminCollection,
    signatureWorkflow: signatureWorkflowAdminCollection,
    matchingCriteria: matchingCriteriaAdminCollection,
    importLogs: importLogAdminCollection,
    matchingProfile: matchingProfileAdminCollection,
    customCriteria: customCriteriaAdminCollection,
    jobPost: jobPostAdminCollection,
    jobApplication: jobApplicationAdminCollection,
    applicant: applicantAdminCollection,
    talentPool: talentPoolAdminCollection,
    eldConfig: eldConfigAdminCollection,
    tax: taxAdminCollection,
    activityLog: activityLogAdminCollection,
    attendanceLogic: attendanceLogicAdminCollection,
    pension: pensionAdminCollection,
    probationDay: probationDayAdminCollection,
    lateComers: lateComersAdminCollection,
    salaryScales: salaryScaleAdminCollection,
    notificationDefinitions: notificationDefinitionsAdminCollection,
    notifications: notificationsAdminCollection,
    shiftHour: shiftHourAdminCollection,
    flexibilityParameter: flexibilityParameterAdminCollection,
    shortAnswer: shortAnswerAdminCollection,
    examType: examTypeAdminCollection,
    candidateExam: candidateExamAdminCollection,
    examResult: examResultAdminCollection,
    applicantEmailConfirmation: applicantEmailConfirmationAdminCollection,
    dependents: dependentsAdminCollection,
    coverage: coverageAdminCollection,
    reimbursementRequests: reimbursementRequestsAdminCollection,
    geofenceActivation: geofenceActivationAdminCollection,
    requisitionForm: requisitionFormAdminCollection,
    requisitionFormResponses: requisitionFormResponsesAdminCollection,
    competenceValue: competenceValueAdminCollection,
    project: projectAdminCollection,
    track: trackCollection,
    role: roleCollection,
};
