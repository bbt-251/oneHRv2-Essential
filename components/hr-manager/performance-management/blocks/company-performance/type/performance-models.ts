// Core Performance Management Data Models

// User and Role Models
export interface User {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    department: string;
    position: string;
    managerId?: string;
    directReports?: string[];
    avatar?: string;
}

export type UserRole = "employee" | "manager" | "hr" | "admin";

// Evaluation Cycle Model
export interface EvaluationCycle {
    id: string;
    name: string;
    description: string;
    startDate: Date;
    endDate: Date;
    status: CycleStatus;
    phases: CyclePhase[];
    participants: string[]; // User IDs
    settings: CycleSettings;
    createdAt: Date;
    updatedAt: Date;
}

export type CycleStatus = "draft" | "active" | "review" | "completed" | "archived";

export interface CyclePhase {
    id: string;
    name: string;
    description: string;
    startDate: Date;
    endDate: Date;
    type: PhaseType;
    status: PhaseStatus;
    requirements: string[];
}

export type PhaseType =
    | "objective-setting"
    | "self-assessment"
    | "manager-review"
    | "calibration"
    | "feedback";
export type PhaseStatus = "pending" | "active" | "completed" | "overdue";

export interface CycleSettings {
    allowSelfAssessment: boolean;
    requireManagerReview: boolean;
    enablePeerFeedback: boolean;
    autoProgressPhases: boolean;
    reminderSettings: ReminderSettings;
}

export interface ReminderSettings {
    enabled: boolean;
    daysBeforeDeadline: number[];
    emailNotifications: boolean;
    inAppNotifications: boolean;
}

// Objective Model
export interface Objective {
    id: string;
    cycleId: string;
    employeeId: string;
    managerId: string;
    title: string;
    description: string;
    smartCriteria: SMARTCriteria;
    category: ObjectiveCategory;
    priority: Priority;
    weight: number; // Percentage weight in overall evaluation
    targetDate: Date;
    status: ObjectiveStatus;
    progress: number; // 0-100 percentage
    kpis: KPI[];
    actionItems: ActionItem[];
    selfEvaluation?: SelfEvaluation;
    managerEvaluation?: ManagerEvaluation;
    feedback: Feedback[];
    attachments: Attachment[];
    createdAt: Date;
    updatedAt: Date;
}

export interface SMARTCriteria {
    specific: string;
    measurable: string;
    achievable: string;
    relevant: string;
    timeBound: string;
}

export type ObjectiveCategory =
    | "performance"
    | "development"
    | "behavioral"
    | "strategic"
    | "operational";
export type Priority = "low" | "medium" | "high" | "critical";
export type ObjectiveStatus = "draft" | "active" | "completed" | "cancelled" | "overdue";

export interface KPI {
    id: string;
    name: string;
    description: string;
    targetValue: number;
    currentValue: number;
    unit: string;
    measurementMethod: string;
}

export interface ActionItem {
    id: string;
    title: string;
    description: string;
    dueDate: Date;
    status: ActionItemStatus;
    priority: Priority;
    assignedTo: string;
    completedAt?: Date;
    notes?: string;
}

export type ActionItemStatus = "pending" | "in-progress" | "completed" | "blocked";

// Evaluation Models
export interface SelfEvaluation {
    id: string;
    objectiveId: string;
    employeeId: string;
    completionStatus: CompletionStatus;
    achievementLevel: number; // 1-5 scale
    progressDescription: string;
    challengesFaced: string;
    supportNeeded: string;
    evidenceProvided: string[];
    submittedAt: Date;
}

export interface ManagerEvaluation {
    id: string;
    objectiveId: string;
    managerId: string;
    employeeId: string;
    rating: number; // 1-5 scale
    achievementLevel: CompletionStatus;
    feedback: string;
    developmentAreas: string[];
    strengths: string[];
    recommendedActions: string[];
    calibrationNotes?: string;
    submittedAt: Date;
}

export type CompletionStatus = "exceeded" | "achieved" | "partially-achieved" | "not-achieved";

// Competency Model
export interface Competency {
    id: string;
    name: string;
    description: string;
    category: CompetencyCategory;
    level: CompetencyLevel;
    behaviors: Behavior[];
    requiredForRoles: string[];
}

export type CompetencyCategory =
    | "technical"
    | "leadership"
    | "communication"
    | "problem-solving"
    | "teamwork";
export type CompetencyLevel = "beginner" | "intermediate" | "advanced" | "expert";

export interface Behavior {
    id: string;
    description: string;
    level: CompetencyLevel;
    examples: string[];
}

export interface CompetencyAssessment {
    id: string;
    cycleId: string;
    employeeId: string;
    competencyId: string;
    selfRating: number; // 1-5 scale
    managerRating?: number; // 1-5 scale
    gap: number; // Difference between required and actual
    developmentPlan?: DevelopmentPlan;
    evidence: string[];
    comments: string;
    assessedAt: Date;
}

export interface DevelopmentPlan {
    id: string;
    competencyId: string;
    employeeId: string;
    currentLevel: number;
    targetLevel: number;
    actions: DevelopmentAction[];
    timeline: string;
    resources: string[];
    successMetrics: string[];
}

export interface DevelopmentAction {
    id: string;
    title: string;
    description: string;
    type: ActionType;
    dueDate: Date;
    status: ActionItemStatus;
    completionCriteria: string;
}

export type ActionType = "training" | "mentoring" | "project" | "reading" | "certification";

// Feedback Model
export interface Feedback {
    id: string;
    fromUserId: string;
    toUserId: string;
    objectiveId?: string;
    competencyId?: string;
    type: FeedbackType;
    content: string;
    rating?: number;
    isAnonymous: boolean;
    createdAt: Date;
}

export type FeedbackType = "objective" | "competency" | "general" | "peer" | "upward";

// Attachment Model
export interface Attachment {
    id: string;
    name: string;
    type: string;
    size: number;
    url: string;
    uploadedBy: string;
    uploadedAt: Date;
}

// Performance Summary Models
export interface PerformanceSummary {
    id: string;
    cycleId: string;
    employeeId: string;
    overallRating: number;
    objectiveScore: number;
    competencyScore: number;
    objectives: ObjectiveSummary[];
    competencies: CompetencySummary[];
    strengths: string[];
    developmentAreas: string[];
    careerDiscussion: string;
    nextCycleGoals: string[];
    managerComments: string;
    employeeComments: string;
    hrComments?: string;
    finalizedAt?: Date;
}

export interface ObjectiveSummary {
    objectiveId: string;
    title: string;
    weight: number;
    rating: number;
    status: ObjectiveStatus;
}

export interface CompetencySummary {
    competencyId: string;
    name: string;
    selfRating: number;
    managerRating: number;
    gap: number;
}

// Analytics and Reporting Models
export interface PerformanceMetrics {
    cycleId: string;
    departmentId?: string;
    totalParticipants: number;
    completionRate: number;
    averageRating: number;
    ratingDistribution: RatingDistribution;
    topPerformers: string[];
    improvementAreas: string[];
    generatedAt: Date;
}

export interface RatingDistribution {
    excellent: number; // 4.5-5.0
    good: number; // 3.5-4.4
    satisfactory: number; // 2.5-3.4
    needsImprovement: number; // 1.5-2.4
    unsatisfactory: number; // 1.0-1.4
}

// API Response Models
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

export interface PaginatedResponse<T> {
    items: T[];
    total: number;
    page: number;
    pageSize: number;
    hasNext: boolean;
    hasPrevious: boolean;
}

// Form and UI State Models
export interface FormState<T> {
    data: T;
    errors: Record<string, string>;
    isSubmitting: boolean;
    isDirty: boolean;
}

export interface FilterOptions {
    cycles: string[];
    departments: string[];
    statuses: string[];
    priorities: string[];
    dateRange: DateRange;
}

export interface DateRange {
    startDate: Date;
    endDate: Date;
}

export interface SortOption {
    field: string;
    direction: "asc" | "desc";
}

// Notification Models
export interface Notification {
    id: string;
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    actionUrl?: string;
    isRead: boolean;
    createdAt: Date;
}

export type NotificationType =
    | "deadline"
    | "review-request"
    | "feedback-received"
    | "cycle-update"
    | "reminder";

// Strategic Objective Models
export interface StrategicObjective {
    id: string;
    cycleId: string;
    title: string;
    description: string;
    perspective: StrategicPerspective;
    ownerUserId: string; // Executive/Department Head responsible
    weightPct: number; // 0-100, must sum to 100% across all SOs in cycle
    status: StrategicObjectiveStatus;
    targetValue?: number;
    currentValue?: number;
    unit?: string;
    departmentKPIs: string[]; // Array of Department KPI IDs linked to this SO
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
    lastModifiedBy: string;
}

export type StrategicPerspective =
    | "financial"
    | "customer"
    | "internal-process"
    | "learning-growth";
export type StrategicObjectiveStatus = "draft" | "active" | "completed" | "cancelled";

// Department KPI Models
export interface DepartmentKPI {
    id: string;
    strategicObjectiveId: string;
    name: string;
    description: string;
    department: string;
    dataSource: KPIDataSource;
    aggregationMethod: AggregationMethod;
    direction: KPIDirection;
    targetValue: number;
    unit: string;
    frequency: KPIFrequency;

    // Manual Entry fields
    manualEntryInstructions?: string;

    // System Integration fields
    systemSource?: string;
    systemQuery?: string;

    // Employee Objectives Aggregation fields
    includeObjectivesFilter?: ObjectiveFilter;

    status: KPIStatus;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
    lastModifiedBy: string;
}

export type KPIDataSource = "manual" | "system" | "aggregated-from-employee-objectives";
export type AggregationMethod =
    | "average-objective-score"
    | "weighted-objective-score"
    | "sum-achieved"
    | "percent-achieved-by-count";
export type KPIDirection = "up-is-good" | "down-is-good";
export type KPIFrequency = "daily" | "weekly" | "monthly" | "quarterly" | "annually";
export type KPIStatus = "draft" | "active" | "paused" | "archived";

export interface ObjectiveFilter {
    departments?: string[];
    positions?: string[];
    objectiveCategories?: ObjectiveCategory[];
    keywordInTitle?: string;
    createdAfter?: Date;
    createdBefore?: Date;
}

// KPI Actual Values Tracking
export interface KPIActual {
    id: string;
    departmentKPIId: string;
    value: number;
    period: string; // "2024-Q1", "2024-03", etc.
    entryDate: Date;
    enteredBy: string;
    entryMethod: KPIEntryMethod;
    notes?: string;
    isValidated: boolean;
    validatedBy?: string;
    validatedAt?: Date;
}

export type KPIEntryMethod = "manual" | "system-import" | "calculated";

// Performance Calculation Models
export interface KPIPerformance {
    kpiId: string;
    kpiName: string;
    targetValue: number;
    actualValue: number;
    attainmentPct: number; // Calculated based on direction
    status: PerformanceStatus;
    trend: TrendDirection;
    variance: number;
    lastUpdated: Date;
}

export type PerformanceStatus = "on-track" | "at-risk" | "off-track";
export type TrendDirection = "improving" | "stable" | "declining";

export interface StrategicObjectivePerformance {
    strategicObjectiveId: string;
    title: string;
    weightPct: number;
    kpiPerformances: KPIPerformance[];
    weightedScore: number; // Weighted average of KPI attainments
    status: PerformanceStatus;
    contributingEmployeeObjectives?: number; // Count when using aggregation
    departmentKPICount?: number; // Number of department KPIs associated
}

export interface CompanyPerformance {
    cycleId: string;
    cycleName: string;
    strategicObjectives: StrategicObjectivePerformance[];
    overallScore: number; // Weighted average of SO scores
    totalEmployeeObjectives: number;
    completedEmployeeObjectives: number;
    departmentBreakdown: DepartmentPerformance[];
    lastCalculated: Date;
}

export interface DepartmentPerformance {
    department: string;
    employeeCount: number;
    objectiveCount: number;
    completionRate: number;
    averageScore: number;
    kpiContributions: KPIContribution[];
}

export interface KPIContribution {
    kpiId: string;
    kpiName: string;
    employeeObjectiveCount: number;
    contributionValue: number;
    contributionPct: number;
}

// Audit and Change Tracking
export interface PerformanceAuditLog {
    id: string;
    entityType: "strategic-objective" | "department-kpi" | "kpi-actual";
    entityId: string;
    action: "created" | "updated" | "deleted" | "published" | "archived";
    changes: Record<string, { from: any; to: any }>;
    performedBy: string;
    performedAt: Date;
    reason?: string;
}

// Validation and Business Rules
export interface ValidationResult {
    isValid: boolean;
    errors: ValidationError[];
    warnings: ValidationWarning[];
}

export interface ValidationError {
    field: string;
    message: string;
    code: string;
}

export interface ValidationWarning {
    field: string;
    message: string;
    code: string;
}

// Publishing and Workflow
export interface PublishingWorkflow {
    cycleId: string;
    status: PublishingStatus;
    strategicObjectivesLocked: boolean;
    departmentKPIsLocked: boolean;
    publishedAt?: Date;
    publishedBy?: string;
    approvals: WorkflowApproval[];
}

export type PublishingStatus = "draft" | "pending-approval" | "approved" | "published" | "locked";

export interface WorkflowApproval {
    approverUserId: string;
    approverRole: "hr" | "executive" | "admin";
    status: "pending" | "approved" | "rejected";
    comments?: string;
    approvedAt?: Date;
}
