"use client";

import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/authContext";
import { getResourcesForPath, type AppDataResource } from "@/context/app-data-routes";
import {
    RealtimeEventMessage,
    RealtimeSnapshotMessage,
    RealtimeSubscriptionTarget,
    ServerRealtimeMessage,
    uniqueRealtimeTargets,
} from "@/lib/realtime/protocol";
import { EmployeeModel } from "@/lib/models/employee";
import { LeaveModel } from "@/lib/models/leave";
import { AttendanceModel, RequestModificationModel } from "@/lib/models/attendance";
import { OvertimeRequestModel } from "@/lib/models/overtime-request";
import { AttendanceLogicModel } from "@/lib/models/attendance-logic";
import { FlexibilityParameterModel } from "@/lib/models/flexibilityParameter";
import { EmployeeCompensationModel } from "@/lib/models/employeeCompensation";
import { EmployeeLoanModel } from "@/lib/models/employeeLoan";
import { DependentModel } from "@/lib/models/dependent";
import {
    AccrualConfigurationModel,
    AnnouncementTypeModel,
    BackdateCapabilitiesModel,
    ContractHourModel,
    ContractTypeModel,
    DepartmentSettingsModel,
    EligibleLeaveDaysModel,
    GradeDefinitionModel,
    HolidayModel,
    LeaveSettingsModel,
    LeaveTypeModel,
    LevelOfEducationModel,
    LocationModel,
    MaritalStatusModel,
    NotificationTypeModel,
    OvertimeConfigurationModel,
    PayrollSettingsModel,
    PositionDefinitionModel,
    ProbationDayModel,
    ReasonOfLeavingModel,
    SalaryScaleModel,
    SectionSettingsModel,
    ShiftHourModel,
    ShiftTypeModel,
    YearsOfExperienceModel,
} from "@/lib/models/hr-settings";
import { CompanyInfoModel } from "@/lib/models/companyInfo";
import { FileDocumentModel } from "@/lib/models/file-document";
import { ProjectModel } from "@/lib/models/project";
import {
    CurrencyModel,
    DeductionTypeModel,
    LoanTypeModel,
    PaymentTypeModel,
    PensionModel,
    TaxModel,
} from "@/lib/models/hr-settings";

export interface InAppNotificationModel {
    id: string;
    uid: string;
    title?: string;
    message: string;
    action?: string | null;
    isRead?: boolean;
    timestamp?: string;
}

export interface AppDataContextValue {
    employees: EmployeeModel[];
    leaveManagements: LeaveModel[];
    attendances: AttendanceModel[];
    requestModifications: RequestModificationModel[];
    overtimeRequests: OvertimeRequestModel[];
    attendanceLogic: AttendanceLogicModel[];
    flexibilityParameter: FlexibilityParameterModel[];
    compensations: EmployeeCompensationModel[];
    employeeLoans: EmployeeLoanModel[];
    dependents: DependentModel[];
    notifications: InAppNotificationModel[];
    projects: ProjectModel[];
    activeEmployees: EmployeeModel[];
    companyInfo: CompanyInfoModel[];
    leaveSettings: LeaveSettingsModel[];
    payrollSettings: PayrollSettingsModel[];
    departmentSettings: DepartmentSettingsModel[];
    sectionSettings: SectionSettingsModel[];
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
    grades: GradeDefinitionModel[];
    positions: PositionDefinitionModel[];
    levelOfEducations: LevelOfEducationModel[];
    yearsOfExperiences: YearsOfExperienceModel[];
    announcementTypes: AnnouncementTypeModel[];
    paymentTypes: PaymentTypeModel[];
    deductionTypes: DeductionTypeModel[];
    loanTypes: LoanTypeModel[];
    taxes: TaxModel[];
    currencies: CurrencyModel[];
    pension: PensionModel[];
    headerDocuments: FileDocumentModel[];
    footerDocuments: FileDocumentModel[];
    signatureDocuments: FileDocumentModel[];
    stampDocuments: FileDocumentModel[];
    initialDocuments: FileDocumentModel[];
    loading: boolean;
    error: string | null;
    hydratedResources: AppDataResource[];
    isResourceHydrated: (resource: AppDataResource) => boolean;
    realtimeStatus: "idle" | "connecting" | "connected" | "reconnecting" | "error";
    realtimeEnabled: boolean;
    realtimeError: string | null;
}

interface AppDataState {
    employees: EmployeeModel[];
    leaveManagements: LeaveModel[];
    attendances: AttendanceModel[];
    requestModifications: RequestModificationModel[];
    overtimeRequests: OvertimeRequestModel[];
    attendanceLogic: AttendanceLogicModel[];
    flexibilityParameter: FlexibilityParameterModel[];
    compensations: EmployeeCompensationModel[];
    employeeLoans: EmployeeLoanModel[];
    dependents: DependentModel[];
    notifications: InAppNotificationModel[];
    projects: ProjectModel[];
    companyInfo: CompanyInfoModel[];
    leaveSettings: LeaveSettingsModel[];
    payrollSettings: PayrollSettingsModel[];
    departmentSettings: DepartmentSettingsModel[];
    sectionSettings: SectionSettingsModel[];
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
    grades: GradeDefinitionModel[];
    positions: PositionDefinitionModel[];
    levelOfEducations: LevelOfEducationModel[];
    yearsOfExperiences: YearsOfExperienceModel[];
    announcementTypes: AnnouncementTypeModel[];
    paymentTypes: PaymentTypeModel[];
    deductionTypes: DeductionTypeModel[];
    loanTypes: LoanTypeModel[];
    taxes: TaxModel[];
    currencies: CurrencyModel[];
    pension: PensionModel[];
    headerDocuments: FileDocumentModel[];
    footerDocuments: FileDocumentModel[];
    signatureDocuments: FileDocumentModel[];
    stampDocuments: FileDocumentModel[];
    initialDocuments: FileDocumentModel[];
}

const initialAppData: AppDataState = {
    employees: [],
    leaveManagements: [],
    attendances: [],
    requestModifications: [],
    overtimeRequests: [],
    attendanceLogic: [],
    flexibilityParameter: [],
    compensations: [],
    employeeLoans: [],
    dependents: [],
    notifications: [],
    projects: [],
    companyInfo: [],
    leaveSettings: [],
    payrollSettings: [],
    departmentSettings: [],
    sectionSettings: [],
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
    grades: [],
    positions: [],
    levelOfEducations: [],
    yearsOfExperiences: [],
    announcementTypes: [],
    paymentTypes: [],
    deductionTypes: [],
    loanTypes: [],
    taxes: [],
    currencies: [],
    pension: [],
    headerDocuments: [],
    footerDocuments: [],
    signatureDocuments: [],
    stampDocuments: [],
    initialDocuments: [],
};

const AppDataContext = createContext<AppDataContextValue>({
    ...initialAppData,
    activeEmployees: [],
    loading: true,
    error: null,
    hydratedResources: [],
    isResourceHydrated: () => false,
    realtimeStatus: "idle",
    realtimeEnabled: false,
    realtimeError: null,
});

const REALTIME_INITIAL_RECONNECT_DELAY_MS = 1_000;
const REALTIME_MAX_RECONNECT_DELAY_MS = 30_000;

const buildRealtimeUrl = (): string | null => {
    if (typeof window === "undefined") {
        return null;
    }

    return `${window.location.origin}/api/data/realtime`;
};

const getReconnectDelay = (attempt: number): number => {
    return Math.min(
        REALTIME_INITIAL_RECONNECT_DELAY_MS * Math.max(1, 2 ** Math.max(0, attempt - 1)),
        REALTIME_MAX_RECONNECT_DELAY_MS,
    );
};

const buildRealtimeStreamUrl = (targets: readonly RealtimeSubscriptionTarget[]): string | null => {
    const baseUrl = buildRealtimeUrl();
    if (!baseUrl) {
        return null;
    }

    const url = new URL(baseUrl);
    url.searchParams.set("targets", JSON.stringify(targets));
    return url.toString();
};

const applyRealtimeEvent = <T extends { id?: string }>(
    current: T[],
    event: RealtimeEventMessage<T>,
): T[] => {
    switch (event.operation) {
        case "added":
            return event.data
                ? [...current.filter(item => item.id !== event.documentId), event.data]
                : current;
        case "modified":
            if (!event.data) {
                return current;
            }

            return current.some(item => item.id === event.documentId)
                ? current.map(item => (item.id === event.documentId ? event.data! : item))
                : [...current, event.data];
        case "removed":
            return current.filter(item => item.id !== event.documentId);
        default:
            return current;
    }
};

export function AppDataProvider({ children }: { children: React.ReactNode }) {
    const { user, authLoading } = useAuth();
    const pathname = usePathname();
    const userUid = user?.uid ?? null;
    const userRoles = Array.isArray(user?.roles)
        ? user.roles
        : typeof user?.roles === "string"
            ? [user.roles]
            : [];
    const userRolesKey = userRoles.join("|");
    const resourcesForPath = useMemo(
        () => getResourcesForPath(pathname) as AppDataResource[],
        [pathname],
    );
    const employeeOnly = useMemo(() => userRolesKey === "Employee", [userRolesKey]);
    const [data, setData] = useState<AppDataState>(initialAppData);
    const [error, setError] = useState<string | null>(null);
    const [hydratedResources, setHydratedResources] = useState<AppDataResource[]>([]);
    const [pendingResourceCount, setPendingResourceCount] = useState<number>(
        Object.keys(initialAppData).length,
    );
    const [realtimeStatus, setRealtimeStatus] = useState<
        "idle" | "connecting" | "connected" | "reconnecting" | "error"
    >("idle");
    const [realtimeError, setRealtimeError] = useState<string | null>(null);
    const loading = pendingResourceCount > 0;
    const realtimeSourceRef = useRef<EventSource | null>(null);
    const reconnectTimerRef = useRef<number | null>(null);
    const reconnectAttemptRef = useRef(0);

    const selfScopedResources = useMemo(
        () =>
            new Set<AppDataResource>([
                "employees",
                "leaveManagements",
                "attendances",
                "overtimeRequests",
                "compensations",
                "employeeLoans",
                "dependents",
                "requestModifications",
                "notifications",
            ]),
        [],
    );
    const realtimeEnabled = Boolean(userUid) && !authLoading;
    const realtimeTargets = useMemo(
        () =>
            uniqueRealtimeTargets(
                resourcesForPath.map(resource => ({
                    resource,
                    filters:
                        employeeOnly && selfScopedResources.has(resource) && userUid
                            ? { uid: userUid }
                            : undefined,
                })),
            ),
        [employeeOnly, resourcesForPath, selfScopedResources, userUid],
    );

    const closeRealtimeSource = useCallback(() => {
        if (reconnectTimerRef.current !== null) {
            window.clearTimeout(reconnectTimerRef.current);
            reconnectTimerRef.current = null;
        }

        const source = realtimeSourceRef.current;
        realtimeSourceRef.current = null;

        if (!source) {
            return;
        }

        source.close();
    }, []);

    useEffect(() => {
        const bypassRealtimeRoutes = new Set(["/", "/setup", "/signin", "/unauthorized"]);

        if (bypassRealtimeRoutes.has(pathname)) {
            queueMicrotask(() => {
                closeRealtimeSource();
                setData(initialAppData);
                setError(null);
                setHydratedResources([]);
                setPendingResourceCount(0);
                setRealtimeStatus("idle");
                setRealtimeError(null);
            });
            return;
        }

        if (authLoading) {
            return;
        }

        if (!userUid) {
            queueMicrotask(() => {
                closeRealtimeSource();
                setData(initialAppData);
                setError(null);
                setHydratedResources([]);
                setPendingResourceCount(0);
                setRealtimeStatus("idle");
                setRealtimeError(null);
            });
            return;
        }

        const resources = resourcesForPath;
        const hydratedResources = new Set<keyof AppDataState>();
        let isCancelled = false;

        const markResourceHydrated = (resource: AppDataResource) => {
            if (hydratedResources.has(resource)) {
                return;
            }

            hydratedResources.add(resource);
            setHydratedResources(previous =>
                previous.includes(resource) ? previous : [...previous, resource],
            );
            setPendingResourceCount(previous => Math.max(previous - 1, 0));
        };

        queueMicrotask(() => {
            setError(null);
            setPendingResourceCount(resources.length);
            setRealtimeError(null);
            setRealtimeStatus(reconnectAttemptRef.current > 0 ? "reconnecting" : "connecting");
        });

        const realtimeUrl = buildRealtimeStreamUrl(realtimeTargets);
        if (!realtimeUrl) {
            queueMicrotask(() => {
                setRealtimeStatus("error");
                setRealtimeError("Unable to construct realtime stream URL");
            });
            return;
        }

        const connectStream = () => {
            if (isCancelled) {
                return;
            }

            closeRealtimeSource();
            const source = new EventSource(realtimeUrl, { withCredentials: true });
            realtimeSourceRef.current = source;

            source.addEventListener("open", () => {
                if (isCancelled) {
                    return;
                }

                reconnectAttemptRef.current = 0;
                setRealtimeStatus("connected");
                setRealtimeError(null);
            });

            const handleServerMessage = (event: MessageEvent<string>) => {
                if (isCancelled) {
                    return;
                }

                try {
                    const message = JSON.parse(event.data) as ServerRealtimeMessage;

                    if (message.type === "snapshot") {
                        const snapshotMessage = message as RealtimeSnapshotMessage<unknown>;
                        setData(previous => ({
                            ...previous,
                            [snapshotMessage.resource]: snapshotMessage.data,
                        }));
                        markResourceHydrated(snapshotMessage.resource);
                        return;
                    }

                    if (message.type === "event") {
                        const eventMessage = message as RealtimeEventMessage<{ id?: string }>;
                        setData(previous => ({
                            ...previous,
                            [eventMessage.resource]: applyRealtimeEvent(
                                previous[eventMessage.resource] as { id?: string }[],
                                eventMessage,
                            ),
                        }));
                        markResourceHydrated(eventMessage.resource);
                        return;
                    }

                    if (message.type === "error") {
                        setError(message.message);
                        setRealtimeError(message.message);
                    }
                } catch (parseError) {
                    console.error("[app-data] realtime stream parse failed", parseError);
                }
            };

            source.addEventListener("snapshot", handleServerMessage as EventListener);
            source.addEventListener("event", handleServerMessage as EventListener);
            source.addEventListener("pong", handleServerMessage as EventListener);
            source.addEventListener("error", () => {
                if (isCancelled) {
                    return;
                }

                setRealtimeStatus("error");
                setRealtimeError("Realtime stream disconnected");
                closeRealtimeSource();

                reconnectAttemptRef.current += 1;
                const delay = getReconnectDelay(reconnectAttemptRef.current);
                setRealtimeStatus("reconnecting");
                reconnectTimerRef.current = window.setTimeout(() => {
                    reconnectTimerRef.current = null;
                    connectStream();
                }, delay);
            });
        };

        connectStream();

        return () => {
            isCancelled = true;
            closeRealtimeSource();
        };
    }, [
        authLoading,
        closeRealtimeSource,
        employeeOnly,
        pathname,
        realtimeTargets,
        resourcesForPath,
        userUid,
    ]);

    const activeEmployees = data.employees.filter(
        employee => employee.contractStatus.toLowerCase() === "active",
    );
    const isResourceHydrated = useCallback(
        (resource: AppDataResource) => hydratedResources.includes(resource),
        [hydratedResources],
    );

    return (
        <AppDataContext.Provider
            value={{
                ...data,
                activeEmployees,
                loading,
                error,
                hydratedResources,
                isResourceHydrated,
                realtimeStatus,
                realtimeEnabled,
                realtimeError,
            }}
        >
            {children}
        </AppDataContext.Provider>
    );
}

export function useData() {
    return useContext(AppDataContext);
}
