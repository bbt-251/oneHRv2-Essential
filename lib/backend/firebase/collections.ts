import { collection } from "firebase/firestore";
import { db, dbBBT } from "./init";

// BBT
export const oneHRDefectsCollection = collection(dbBBT, "oneHRDefects");
export const oneHRIPsCollection = collection(dbBBT, "oneHRIPs");

export const basicInfoCollection = collection(db, "basicInfo");
export const hiringNeedApprovalProcessCollection = collection(db, "hiringNeedApprovalProcess");

export const employeeCollection = collection(db, "employee");
export const employeeDocumentCollection = collection(db, "employeeDocuments");
export const attendanceCollection = collection(db, "attendance");
export const transferCollection = collection(db, "transfer");
export const overtimeRequestCollection = collection(db, "overtimeRequest");
export const requestedAttendanceModificationCollection = collection(
    db,
    "requestedAttendanceModification",
);
export const leaveManagementCollection = collection(db, "leaveManagement");
export const performanceEvaluationCollection = collection(db, "performanceEvaluation");
export const employeeInfoChangeRequestCollection = collection(db, "employeeInfoChangeRequest");
export const objectiveCollection = collection(db, "objective");
export const competenceAssessmentCollection = collection(db, "competenceAssessment");
export const issueCollection = collection(db, "issue");
export const hiringNeedCollection = collection(db, "hiringNeed");
export const locationTreeCollection = collection(db, "locationTree");
export const talentAcquisitionCollection = collection(db, "talentAcquisition");
export const jobVacancyCollection = collection(db, "jobVacancy");
export const screeningQuestionCollection = collection(db, "screeningQuestions");
export const evaluationMetricsCollection = collection(db, "evaluationMetrics");
export const candidatePoolCollection = collection(db, "candidatePool");
export const internalCandidateCollection = collection(db, "internalCandidate");
export const externalCandidateCollection = collection(db, "externalCandidate");
export const evaluationFormCollection = collection(db, "evaluationForm");
export const interviewCollection = collection(db, "interview");
export const employeeLoanCollection = collection(db, "employeeLoan");
export const employeeCompensationCollection = collection(db, "employeeCompensation");
export const logCollection = collection(db, "log");
export const disciplinaryActionCollection = collection(db, "disciplinaryAction");
export const tmCategoryTreeCollection = collection(db, "tmCategoryTree");
export const trainingMaterialCollection = collection(db, "trainingMaterial");
export const surveyCollection = collection(db, "survey");
export const surveyResponseCollection = collection(db, "surveyResponse");
// export const answeredSurveyCollection = collection(db, "answeredSurvey");
export const trainingMaterialRequestCollection = collection(db, "trainingMaterialRequest");
export const trainingPathCollection = collection(db, "trainingPath");
export const suggestionBoxCollection = collection(db, "suggestionBox");
export const announcementManagementCollection = collection(db, "announcementManagement");
export const quizCollection = collection(db, "quiz");
export const exitInstanceCollection = collection(db, "exitInstance");
export const exitChecklistCollection = collection(db, "exitChecklist");
export const exitChecklistItemCollection = collection(db, "exitChecklistItem");
export const exitInterviewCollection = collection(db, "exitInterview");
export const documentManagementCollection = collection(db, "documentManagement");
export const specificDocumentCollection = collection(db, "specificDocument");
export const externalDocumentCollection = collection(db, "externalDocument");
export const headerDocumentCollection = collection(db, "headerDocument");
export const footerDocumentCollection = collection(db, "footerDocument");
export const signatureDocumentCollection = collection(db, "signatureDocument");
export const stampDocumentCollection = collection(db, "stampDocument");
export const initialDocumentCollection = collection(db, "initialDocument");
export const payrollPDFSettingsCollection = collection(db, "payrollPDFSettings");
export const orderGuidesCollection = collection(db, "orderGuide");
export const orderItemsCollection = collection(db, "orderItem");
export const promotionSuggestionCollection = collection(db, "promotionSuggestion");
export const successionPlanningCollection = collection(db, "successionPlanning");
export const TrainingMaterialCertificationCollection = collection(
    db,
    "trainingMaterialCertification",
);
export const delegationCollection = collection(db, "delegation");
export const promotionInstanceCollection = collection(db, "promotionInstance");
export const customReportsCollection = collection(db, "customReport");

export const unitCollection = collection(db, "unit");
export const unitKpiCollection = collection(db, "unitKpi");
export const TANotificationCollection = collection(db, "TANotification");
export const multipleChoiceCollection = collection(db, "multipleChoice");
export const commonAnswerCollection = collection(db, "commonAnswer");
export const apiKeyCollection = collection(db, "apiKey");
export const employeeLogCollection = collection(db, "employeeLog");
export const managerSwapCollection = collection(db, "managerSwap");
export const weightDefinitionCollection = collection(db, "weightDefinition");
export const signatureWorkflowCollection = collection(db, "signatureWorkflow");
export const matchingCriteriaCollection = collection(db, "matchingCriteria");
export const importLogCollection = collection(db, "importLogs");

// TA
export const matchingProfileCollection = collection(db, "matchingProfile");
export const customCriteriaCollection = collection(db, "customCriteria");
export const jobPostCollection = collection(db, "jobPost");
export const jobApplicationCollection = collection(db, "jobApplication");
export const applicantCollection = collection(db, "applicant");
export const talentPoolCollection = collection(db, "talentPool");
export const subPoolCollection = collection(db, "subPool");

export const eldConfigCollection = collection(db, "eldConfig");
export const taxCollection = collection(db, "tax");
export const activityLogCollection = collection(db, "activityLog");
export const attendanceLogicCollection = collection(db, "attendanceLogic");
export const pensionCollection = collection(db, "pension");
export const probationDayCollection = collection(db, "probationDay");
export const lateComersCollection = collection(db, "lateComers");
export const salaryScaleCollection = collection(db, "salaryScales");

// notification
export const notificationDefinitionsCollection = collection(db, "notificationDefinitions");
export const notificationsCollection = collection(db, "notifications");

// shift Hour
export const shiftHourCollection = collection(db, "shiftHour");
export const flexibilityParameterCollection = collection(db, "flexibilityParameter");

export const shortAnswerCollection = collection(db, "shortAnswer");
export const examTypeCollection = collection(db, "examType");
export const candidateExamCollection = collection(db, "candidateExam");
export const examResultCollection = collection(db, "examResult");

export const applicantEmailConfirmationCollection = collection(db, "applicantEmailConfirmation");
export const dependentsCollection = collection(db, "dependents");
export const coverageCollection = collection(db, "coverage");
export const reimbursementRequestsCollection = collection(db, "reimbursementRequests");
export const geofenceActivationCollection = collection(db, "geofenceActivation");
export const requisitionFormCollection = collection(db, "requisitionForm");
export const requisitionFormResponsesCollection = collection(db, "requisitionFormResponses");

// new
export const competenceValueCollection = collection(db, "competenceValue");
export const projectCollection = collection(db, "project");

// Career Path
export const trackCollection = collection(db, "track");
export const roleCollection = collection(db, "role");
