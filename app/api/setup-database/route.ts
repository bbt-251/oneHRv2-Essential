import crypto from "node:crypto";
import dayjs from "dayjs";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentConfig, getCurrentInstance, getCurrentInstanceKey } from "@/lib/shared/config";
import { createEmployeeRecord, listEmployees } from "@/lib/server/employee/employee.repository";
import { getMongoDb } from "@/lib/server/shared/db/mongo";
import { AttendanceModel } from "@/lib/models/attendance";
import { EmployeeModel } from "@/lib/models/employee";
import { AttendanceServerRepository } from "@/lib/server/attendance/attendance.repository";
import { CoreSettingsServerRepository } from "@/lib/server/hr-settings/core-settings/core-settings.repository";
import {
    CORE_SETTINGS_RESOURCES,
    isCoreSettingsResource,
} from "@/lib/server/hr-settings/core-settings/core-settings.types";
import { ModuleSettingsServerRepository } from "@/lib/server/hr-settings/module-settings/module-settings.repository";
import {
    isModuleSettingsResource,
    MODULE_SETTINGS_RESOURCES,
} from "@/lib/server/hr-settings/module-settings/module-settings.types";
import {
    generateDailyAttendance,
    getIndependentSettingsSeed,
    MONTH_NAMES,
    type SeedRecord,
} from "./seed-helpers";

interface SeedingResult {
    success: boolean;
    message: string;
    data?: {
        instance: string;
        settingsCollections: Record<string, string[]>;
        employees: string[];
        summary: {
            totalSettingsCollections: number;
            totalEmployees: number;
            totalAttendanceRecords: number;
            duration: number;
        };
    };
    error?: string;
}

interface CreatedEntities {
    settingsCollections: Record<string, string[]>;
    employees: string[];
}

interface SeedEmployeeProfile {
    uid: string;
    firstName: string;
    middleName: string;
    surname: string;
    personalEmail: string;
    companyEmail: string;
    role: EmployeeModel["role"];
    salary: number;
    positionId: string;
    positionLevel: string;
    gradeLevel: string;
    departmentId: string;
    sectionId: string;
    shiftTypeId: string;
    locationId: string;
    reportingLineManager: string;
    reportingLineManagerPosition: string;
    managerPosition: boolean;
    reportees: string[];
    employeeNumber: string;
}

const TIMESTAMP_FORMAT = "YYYY-MM-DD HH:mm:ss";
const DEV_ONLY_MESSAGE = "Database seeding is only available in development.";

const getTimestamp = (): string => dayjs().format(TIMESTAMP_FORMAT);

const getErrorMessage = (error: unknown): string =>
    error instanceof Error ? error.message : "Unknown error occurred";

const createSeedDocument = async (
    collectionPath: string,
    data: SeedRecord,
    id: string = crypto.randomUUID(),
): Promise<string> => {
    if (isCoreSettingsResource(collectionPath)) {
        const created = await CoreSettingsServerRepository.create(collectionPath, {
            ...(data as Record<string, unknown>),
            id,
        } as never);
        return created.id;
    }

    if (isModuleSettingsResource(collectionPath)) {
        const created = await ModuleSettingsServerRepository.create(collectionPath, {
            ...(data as Record<string, unknown>),
            id,
        } as never);
        return created.id;
    }

    const db = await getMongoDb();
    await db.collection(collectionPath).insertOne({
        _id: id,
        ...(data as Record<string, unknown>),
    });

    return id;
};

const createSeedDocuments = async (collectionPath: string, data: SeedRecord[]): Promise<string[]> =>
    Promise.all(data.map(entry => createSeedDocument(collectionPath, entry)));

const clearExistingData = async (): Promise<void> => {
    const db = await getMongoDb();
    const mongoCollections = [
        "employee",
        "attendance",
        "authUsers",
        "authAccounts",
        "authSessions",
        "authVerifications",
        "leaveManagements",
        "requestModifications",
        "overtimeRequests",
        "employeeCompensation",
        "employeeLoan",
        "notifications",
        "projects",
        "documents",
        "logs",
        "dependents",
        "headerDocuments",
        "footerDocuments",
        "signatureDocuments",
        "stampDocuments",
        "initialDocuments",
        ...CORE_SETTINGS_RESOURCES,
        ...MODULE_SETTINGS_RESOURCES,
    ];

    await Promise.all(mongoCollections.map(name => db.collection(name).deleteMany({})));
};

const createIndependentSettings = async (createdEntities: CreatedEntities): Promise<void> => {
    const independentData = getIndependentSettingsSeed();

    for (const [resource, data] of Object.entries(independentData)) {
        const ids = Array.isArray(data)
            ? await createSeedDocuments(resource, data)
            : [await createSeedDocument(resource, data)];
        createdEntities.settingsCollections[resource] = ids;
    }
};

const createContractSettings = async (
    createdEntities: CreatedEntities,
): Promise<{
    contractTypeIds: string[];
    contractHourIds: string[];
}> => {
    const contractTypeIds = await createSeedDocuments("contractTypes", [
        {
            name: "Full-time Permanent",
            startDate: "2024-01-01",
            endDate: "2027-12-31",
            active: "Yes",
        },
        {
            name: "Part-time Permanent",
            startDate: "2024-01-01",
            endDate: "2027-12-31",
            active: "Yes",
        },
        {
            name: "Contract",
            startDate: "2024-01-01",
            endDate: "2027-12-31",
            active: "Yes",
        },
    ]);

    const contractHourIds = await createSeedDocuments("contractHours", [
        {
            name: "40 Hours",
            hourPerWeek: 40,
            startDate: "2024-01-01",
            endDate: "2027-12-31",
            active: "Yes",
        },
        {
            name: "20 Hours",
            hourPerWeek: 20,
            startDate: "2024-01-01",
            endDate: "2027-12-31",
            active: "Yes",
        },
    ]);

    createdEntities.settingsCollections.contractTypes = contractTypeIds;
    createdEntities.settingsCollections.contractHours = contractHourIds;

    return { contractTypeIds, contractHourIds };
};

const createLocationHierarchy = async (createdEntities: CreatedEntities): Promise<string[]> => {
    const headquartersId = await createSeedDocument("locations", {
        name: "Headquarters",
        type: "building",
        parentId: null,
        startDate: "2024-01-01",
        endDate: "2027-12-31",
        active: "Yes",
        description: "Main headquarters building",
        address: "123 Main St, City, Country",
    });

    const mainOfficeId = await createSeedDocument("locations", {
        name: "Main Office",
        type: "office",
        parentId: headquartersId,
        startDate: "2024-01-01",
        endDate: "2027-12-31",
        active: "Yes",
        description: "Primary office space",
    });

    const branchOfficeId = await createSeedDocument("locations", {
        name: "Branch Office",
        type: "office",
        parentId: headquartersId,
        startDate: "2024-01-01",
        endDate: "2027-12-31",
        active: "Yes",
        description: "Secondary office location",
    });

    const locationIds = [headquartersId, mainOfficeId, branchOfficeId];
    createdEntities.settingsCollections.locations = locationIds;
    return locationIds;
};

const createShiftHours = async (createdEntities: CreatedEntities): Promise<string[]> => {
    const shiftHourIds = await createSeedDocuments("shiftHours", [
        {
            name: "Morning Shift",
            shiftHours: [{ startTime: "08:00", endTime: "16:00" }],
            active: "Yes",
            timestamp: getTimestamp(),
        },
        {
            name: "Afternoon Shift",
            shiftHours: [{ startTime: "14:00", endTime: "22:00" }],
            active: "Yes",
            timestamp: getTimestamp(),
        },
        {
            name: "Night Shift",
            shiftHours: [{ startTime: "22:00", endTime: "06:00" }],
            active: "Yes",
            timestamp: getTimestamp(),
        },
    ]);

    createdEntities.settingsCollections.shiftHours = shiftHourIds;
    return shiftHourIds;
};

const createShiftTypes = async (
    createdEntities: CreatedEntities,
    shiftHourIds: string[],
): Promise<string[]> => {
    const shiftTypeIds = await createSeedDocuments("shiftTypes", [
        {
            name: "Standard Day Shift",
            workingDays: [
                { dayOfTheWeek: "Monday", associatedShiftHour: shiftHourIds[0] },
                { dayOfTheWeek: "Tuesday", associatedShiftHour: shiftHourIds[0] },
                { dayOfTheWeek: "Wednesday", associatedShiftHour: shiftHourIds[0] },
                { dayOfTheWeek: "Thursday", associatedShiftHour: shiftHourIds[0] },
                { dayOfTheWeek: "Friday", associatedShiftHour: shiftHourIds[0] },
            ],
            startDate: "2024-01-01",
            endDate: "2027-12-31",
            active: "Yes",
            timestamp: getTimestamp(),
        },
        {
            name: "Rotating Shift",
            workingDays: [
                { dayOfTheWeek: "Monday", associatedShiftHour: shiftHourIds[1] },
                { dayOfTheWeek: "Tuesday", associatedShiftHour: shiftHourIds[1] },
                { dayOfTheWeek: "Wednesday", associatedShiftHour: shiftHourIds[2] },
                { dayOfTheWeek: "Thursday", associatedShiftHour: shiftHourIds[2] },
                { dayOfTheWeek: "Friday", associatedShiftHour: shiftHourIds[1] },
            ],
            startDate: "2024-01-01",
            endDate: "2027-12-31",
            active: "Yes",
            timestamp: getTimestamp(),
        },
    ]);

    createdEntities.settingsCollections.shiftTypes = shiftTypeIds;
    return shiftTypeIds;
};

const createPositions = async (
    createdEntities: CreatedEntities,
    gradeIds: string[],
): Promise<string[]> => {
    const positionIds = await createSeedDocuments("positions", [
        {
            name: "Software Engineer",
            startDate: "2024-01-01",
            endDate: "2027-12-31",
            positionDescription: "Develops and maintains software applications",
            additionalInformation: "Full-stack development",
            band: "Technical",
            grade: gradeIds[0],
            active: "Yes",
            critical: "No",
            keys: [],
            step: "1",
            companyProfile: null,
            companyProfileUsed: false,
            competencies: [],
            createdAt: getTimestamp(),
            updatedAt: getTimestamp(),
        },
        {
            name: "Senior Software Engineer",
            startDate: "2024-01-01",
            endDate: "2027-12-31",
            positionDescription: "Leads software development projects",
            additionalInformation: "Senior level technical leadership",
            band: "Technical",
            grade: gradeIds[1],
            active: "Yes",
            critical: "Yes",
            keys: [],
            step: "2",
            companyProfile: null,
            companyProfileUsed: false,
            competencies: [],
            createdAt: getTimestamp(),
            updatedAt: getTimestamp(),
        },
        {
            name: "HR Manager",
            startDate: "2024-01-01",
            endDate: "2027-12-31",
            positionDescription: "Manages human resources operations",
            additionalInformation: "HR management and employee relations",
            band: "Management",
            grade: gradeIds[2],
            active: "Yes",
            critical: "Yes",
            keys: [],
            step: "3",
            companyProfile: null,
            companyProfileUsed: false,
            competencies: [],
            createdAt: getTimestamp(),
            updatedAt: getTimestamp(),
        },
    ]);

    createdEntities.settingsCollections.positions = positionIds;
    return positionIds;
};

const createDepartments = async (
    createdEntities: CreatedEntities,
    locationIds: string[],
): Promise<string[]> => {
    const departmentIds = await createSeedDocuments("departmentSettings", [
        {
            name: "Engineering",
            code: "ENG",
            manager: "",
            location: locationIds[0],
            active: true,
            createdAt: getTimestamp(),
            updatedAt: getTimestamp(),
        },
        {
            name: "Human Resources",
            code: "HR",
            manager: "",
            location: locationIds[0],
            active: true,
            createdAt: getTimestamp(),
            updatedAt: getTimestamp(),
        },
    ]);

    createdEntities.settingsCollections.departmentSettings = departmentIds;
    return departmentIds;
};

const createSections = async (
    createdEntities: CreatedEntities,
    departmentIds: string[],
): Promise<string[]> => {
    const sectionIds = await createSeedDocuments("sectionSettings", [
        {
            name: "Backend Development",
            code: "BE",
            department: departmentIds[0],
            supervisor: "",
            active: true,
            createdAt: getTimestamp(),
            updatedAt: getTimestamp(),
        },
        {
            name: "HR Administration",
            code: "HR_ADMIN",
            department: departmentIds[1],
            supervisor: "",
            active: true,
            createdAt: getTimestamp(),
            updatedAt: getTimestamp(),
        },
    ]);

    createdEntities.settingsCollections.sectionSettings = sectionIds;
    return sectionIds;
};

const buildSeedEmployee = ({
    uid,
    firstName,
    middleName,
    surname,
    personalEmail,
    companyEmail,
    role,
    salary,
    positionId,
    positionLevel,
    gradeLevel,
    departmentId,
    sectionId,
    shiftTypeId,
    locationId,
    reportingLineManager,
    reportingLineManagerPosition,
    managerPosition,
    reportees,
    employeeNumber,
}: SeedEmployeeProfile): Omit<EmployeeModel, "id"> => ({
    timestamp: getTimestamp(),
    uid,
    firstName,
    middleName,
    surname,
    birthDate: "1990-01-01",
    birthPlace: "Addis Ababa, Ethiopia",
    gender: "male",
    maritalStatus: "Single",
    personalPhoneNumber: "+251900000000",
    personalEmail,
    telegramChatID: null,
    currentLocation: null,
    bankAccount: `${employeeNumber}001`,
    providentFundAccount: `${employeeNumber}PF`,
    hourlyWage: Math.round((salary / 173) * 100) / 100,
    tinNumber: `${employeeNumber}TIN`,
    passportNumber: `${employeeNumber}PASS`,
    nationalIDNumber: `${employeeNumber}NID`,
    employeeID: employeeNumber,
    password: "1q2w3e4r%T",
    lastChanged: getTimestamp(),
    passwordRecovery: {
        timestamp: "",
        token: "",
    },
    signature: "",
    signedDocuments: [],
    profilePicture: "",
    company: "onehr-dev",
    contractType: "Full-time Permanent",
    contractHour: 40,
    hoursPerWeek: 40,
    contractStatus: "active",
    contractStartingDate: "2024-01-01",
    contractTerminationDate: "2027-12-31",
    contractDuration: [36],
    hireDate: "2024-01-01",
    contractDocument: "",
    probationPeriodEndDate: "2024-03-31",
    lastDateOfProbation: "2024-03-31",
    reasonOfLeaving: "",
    salary,
    currency: "USD",
    eligibleLeaveDays: 25,
    companyEmail,
    companyPhoneNumber: "+251911111111",
    associatedTax: "Income Tax",
    pensionApplication: true,
    employmentPosition: positionId,
    positionLevel,
    section: sectionId,
    department: departmentId,
    workingLocation: locationId,
    workingArea: "[]",
    homeLocation: locationId,
    managerPosition,
    reportees,
    reportingLineManagerPosition,
    reportingLineManager,
    gradeLevel,
    step: 1,
    shiftType: shiftTypeId,
    role,
    unit: "",
    emergencyContactName: "Emergency Contact",
    relationshipToEmployee: "Sibling",
    phoneNumber1: "+251922222222",
    phoneNumber2: "",
    emailAddress1: "emergency@onehr.local",
    emailAddress2: "",
    physicalAddress1: "Bole, Addis Ababa",
    physicalAddress2: "",
    notifications: [],
    claimedOvertimes: [],
    timezone: "Africa/Nairobi",
    customFields: [],
    balanceLeaveDays: 25,
    accrualLeaveDays: 2.08,
    lastELDUpdate: dayjs().format("YYYY-MM-DD"),
    documentRequests: {},
    associatedRestrictedDocuments: [],
});

const seedEmployees = async ({
    createdEntities,
    positionIds,
    departmentIds,
    sectionIds,
    shiftTypeIds,
    locationIds,
}: {
    createdEntities: CreatedEntities;
    positionIds: string[];
    departmentIds: string[];
    sectionIds: string[];
    shiftTypeIds: string[];
    locationIds: string[];
}): Promise<Array<EmployeeModel>> => {
    const seedEmployeesData: SeedEmployeeProfile[] = [
        {
            uid: "emp_user_001",
            firstName: "John",
            middleName: "Michael",
            surname: "Doe",
            personalEmail: "john.doe@company.com",
            companyEmail: "john.doe@internal.company.com",
            role: ["Employee"],
            salary: 50000,
            positionId: positionIds[0],
            positionLevel: "Junior",
            gradeLevel: "Junior",
            departmentId: departmentIds[0],
            sectionId: sectionIds[0],
            shiftTypeId: shiftTypeIds[0],
            locationId: locationIds[0],
            reportingLineManager: "mgr_user_002",
            reportingLineManagerPosition: "Senior Software Engineer",
            managerPosition: false,
            reportees: [],
            employeeNumber: "EMP001",
        },
        {
            uid: "mgr_user_002",
            firstName: "Sarah",
            middleName: "Elizabeth",
            surname: "Johnson",
            personalEmail: "sarah.johnson@company.com",
            companyEmail: "sarah.johnson@internal.company.com",
            role: ["Employee", "Manager"],
            salary: 75000,
            positionId: positionIds[1],
            positionLevel: "Senior",
            gradeLevel: "Senior",
            departmentId: departmentIds[0],
            sectionId: sectionIds[0],
            shiftTypeId: shiftTypeIds[0],
            locationId: locationIds[0],
            reportingLineManager: "cto_user_004",
            reportingLineManagerPosition: "HR Manager",
            managerPosition: true,
            reportees: ["emp_user_001"],
            employeeNumber: "EMP002",
        },
        {
            uid: "hr_mgr_user_003",
            firstName: "David",
            middleName: "Robert",
            surname: "Wilson",
            personalEmail: "david.wilson@company.com",
            companyEmail: "david.wilson@internal.company.com",
            role: ["Employee", "HR Manager"],
            salary: 90000,
            positionId: positionIds[2],
            positionLevel: "Lead",
            gradeLevel: "Lead",
            departmentId: departmentIds[1],
            sectionId: sectionIds[1],
            shiftTypeId: shiftTypeIds[0],
            locationId: locationIds[0],
            reportingLineManager: "cto_user_004",
            reportingLineManagerPosition: "CTO",
            managerPosition: true,
            reportees: [],
            employeeNumber: "EMP003",
        },
        {
            uid: "cto_user_004",
            firstName: "Emily",
            middleName: "Grace",
            surname: "Chen",
            personalEmail: "emily.chen@company.com",
            companyEmail: "emily.chen@internal.company.com",
            role: ["Employee", "Manager", "HR Manager", "Payroll Officer"],
            salary: 120000,
            positionId: positionIds[2],
            positionLevel: "Executive",
            gradeLevel: "Lead",
            departmentId: departmentIds[0],
            sectionId: sectionIds[0],
            shiftTypeId: shiftTypeIds[0],
            locationId: locationIds[0],
            reportingLineManager: "",
            reportingLineManagerPosition: "",
            managerPosition: true,
            reportees: ["mgr_user_002", "hr_mgr_user_003"],
            employeeNumber: "EMP004",
        },
    ];

    const employees: EmployeeModel[] = [];
    for (const seedEmployeeData of seedEmployeesData) {
        const createdEmployee = await createEmployeeRecord(buildSeedEmployee(seedEmployeeData));
        createdEntities.employees.push(createdEmployee.id);
        employees.push(createdEmployee);
    }

    await CoreSettingsServerRepository.update("departmentSettings", departmentIds[0], {
        manager: "mgr_user_002",
        updatedAt: getTimestamp(),
    });
    await CoreSettingsServerRepository.update("departmentSettings", departmentIds[1], {
        manager: "hr_mgr_user_003",
        updatedAt: getTimestamp(),
    });
    await CoreSettingsServerRepository.update("sectionSettings", sectionIds[0], {
        supervisor: "mgr_user_002",
        updatedAt: getTimestamp(),
    });
    await CoreSettingsServerRepository.update("sectionSettings", sectionIds[1], {
        supervisor: "hr_mgr_user_003",
        updatedAt: getTimestamp(),
    });

    return employees;
};

const seedAttendance = async (
    employees: EmployeeModel[],
    shiftTypeId: string,
    instanceKey: string,
): Promise<number> => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    await Promise.all(
        employees.map(employee =>
            AttendanceServerRepository.create(
                {
                    generatedAt: getTimestamp(),
                    uid: employee.uid,
                    month: MONTH_NAMES[currentMonth] ?? MONTH_NAMES[0],
                    year: currentYear,
                    state: "Approved",
                    stage: "Closed",
                    associatedShiftType: shiftTypeId,
                    values: generateDailyAttendance(),
                    comments: [],
                    monthlyWorkedHours: 160,
                    dailyWorkingHour: 8,
                    periodWorkingDays: 20,
                    workedDays: 18,
                    absentDays: 2,
                    claimedOvertimes: [],
                    lastClockInTimestamp: dayjs().subtract(1, "day").format(TIMESTAMP_FORMAT),
                } satisfies Omit<AttendanceModel, "id">,
                instanceKey,
            ),
        ),
    );

    return employees.length;
};

export async function POST(request: NextRequest) {
    const startTime = Date.now();

    try {
        getCurrentConfig();

        if (process.env.NODE_ENV === "production") {
            return NextResponse.json(
                {
                    success: false,
                    message: DEV_ONLY_MESSAGE,
                } satisfies SeedingResult,
                { status: 403 },
            );
        }

        const body = (await request.json().catch(() => ({}))) as {
            clearExisting?: boolean;
        };
        const clearExisting = body.clearExisting ?? false;

        if (!clearExisting && (await listEmployees()).length > 0) {
            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Employees already exist. Re-run with clearExisting=true to reseed dev data.",
                } satisfies SeedingResult,
                { status: 409 },
            );
        }

        if (clearExisting) {
            await clearExistingData();
        }

        const createdEntities: CreatedEntities = {
            settingsCollections: {},
            employees: [],
        };

        await createIndependentSettings(createdEntities);
        await createContractSettings(createdEntities);
        const locationIds = await createLocationHierarchy(createdEntities);
        const shiftHourIds = await createShiftHours(createdEntities);
        const shiftTypeIds = await createShiftTypes(createdEntities, shiftHourIds);
        const positionIds = await createPositions(
            createdEntities,
            createdEntities.settingsCollections.grades ?? [],
        );
        const departmentIds = await createDepartments(createdEntities, locationIds);
        const sectionIds = await createSections(createdEntities, departmentIds);

        const employees = await seedEmployees({
            createdEntities,
            positionIds,
            departmentIds,
            sectionIds,
            shiftTypeIds,
            locationIds,
        });

        const totalAttendanceRecords = await seedAttendance(
            employees,
            shiftTypeIds[0] ?? "",
            getCurrentInstanceKey(),
        );

        return NextResponse.json(
            {
                success: true,
                message: "Development database seeded successfully.",
                data: {
                    instance: getCurrentInstance(),
                    settingsCollections: createdEntities.settingsCollections,
                    employees: createdEntities.employees,
                    summary: {
                        totalSettingsCollections: Object.values(
                            createdEntities.settingsCollections,
                        ).flat().length,
                        totalEmployees: employees.length,
                        totalAttendanceRecords,
                        duration: Date.now() - startTime,
                    },
                },
            } satisfies SeedingResult,
            { status: 200 },
        );
    } catch (error) {
        return NextResponse.json(
            {
                success: false,
                message: "Database seeding failed.",
                error: getErrorMessage(error),
            } satisfies SeedingResult,
            { status: 500 },
        );
    }
}
