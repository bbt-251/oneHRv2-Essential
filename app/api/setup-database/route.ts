import { NextRequest, NextResponse } from "next/server";
import { admin } from "@/lib/backend/firebase/admin";
import { hrSettingsService } from "@/lib/backend/firebase/hrSettingsService";
import { collection, doc, writeBatch, getDocs, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/backend/firebase/init";
import dayjs from "dayjs";

// Use Admin SDK for seeding operations
const adminDb = admin.firestore();

// Helper functions using Admin SDK for hrSettings operations
async function adminHrSettingsCreate(type: string, data: any): Promise<string> {
    const dataWithTimestamp = {
        ...data,
        createdAt: dayjs().format("YYYY-MM-DD HH:mm:ss"),
        updatedAt: dayjs().format("YYYY-MM-DD HH:mm:ss"),
    };
    const docRef = await adminDb
        .collection("hrSettings")
        .doc("main")
        .collection(type)
        .add(dataWithTimestamp);
    return docRef.id;
}

async function adminHrSettingsBatchCreate(
    type: string,
    dataArray: any[],
): Promise<{ success: boolean; ids?: string[]; error?: string }> {
    if (!dataArray.length) {
        return { success: false, error: "No data provided" };
    }

    const batch = adminDb.batch();
    const ids: string[] = [];

    try {
        dataArray.forEach(data => {
            const docRef = adminDb.collection("hrSettings").doc("main").collection(type).doc();
            ids.push(docRef.id);

            batch.set(docRef, {
                ...data,
                createdAt: dayjs().format("YYYY-MM-DD HH:mm:ss"),
                updatedAt: dayjs().format("YYYY-MM-DD HH:mm:ss"),
            });
        });

        await batch.commit();
        return { success: true, ids };
    } catch (error: any) {
        console.error("Admin batch create failed:", error);
        return {
            success: false,
            error: error.message || "Batch write failed",
        };
    }
}

async function adminHrSettingsUpdate(type: string, id: string, data: any): Promise<boolean> {
    try {
        await adminDb.collection("hrSettings").doc("main").collection(type).doc(id).update(data);
        return true;
    } catch (e) {
        console.log("Admin update error", e);
        return false;
    }
}

interface SeedingResult {
    success: boolean;
    message: string;
    data?: {
        hrSettings: Record<string, string[]>;
        employees: string[];
        summary: {
            totalHrSettings: number;
            totalEmployees: number;
            duration: number;
        };
    };
    error?: string;
    rollback?: boolean;
}

interface CreatedEntities {
    hrSettings: Record<string, string[]>;
    employees: string[];
}

export async function POST(req: NextRequest) {
    const startTime = Date.now();

    // Validate request method
    if (req.method !== "POST") {
        return NextResponse.json(
            {
                success: false,
                message: "Method not allowed",
                error: "Only POST requests are allowed",
            },
            { status: 405 },
        );
    }

    try {
        let body;
        try {
            body = await req.json();
        } catch (jsonError) {
            // Handle empty or malformed JSON body
            console.log("ℹ️ Empty or malformed JSON body received, using defaults");
            body = {};
        }
        const { clearExisting = false } = body;

        console.log("🚀 Starting database seeding...", { clearExisting });

        // Initialize tracking
        const createdEntities: CreatedEntities = {
            hrSettings: {},
            employees: [],
        };

        // Phase 1: Clear existing data if requested
        if (clearExisting) {
            await clearExistingData();
        }

        // Phase 2: Create independent hrSettings
        console.log("📋 Phase 1: Creating independent hrSettings...");
        await createIndependentHrSettings(createdEntities);

        // Phase 3: Create location tree
        console.log("🌳 Phase 2: Creating location hierarchy...");
        const locationIds = await createLocationHierarchy(createdEntities);

        // Phase 4: Create shift hours (needed for shift types)
        console.log("⏰ Phase 3: Creating shift hours...");
        const shiftHourIds = await createShiftHours(createdEntities);

        // Phase 5: Create shift types (reference shift hours)
        console.log("📅 Phase 4: Creating shift types...");
        const shiftTypeIds = await createShiftTypes(createdEntities, shiftHourIds);

        // Phase 6: Create competencies and grades (needed for positions)
        console.log("🎯 Phase 5: Creating competencies and grades...");
        const { competenceIds, gradeIds } = await createCompetenciesAndGrades(createdEntities);

        // Phase 7: Create positions (reference grades and competencies)
        console.log("💼 Phase 6: Creating positions...");
        const positionIds = await createPositions(createdEntities, gradeIds, competenceIds);

        // Phase 8: Create contract types and hours
        console.log("📄 Phase 7: Creating contract settings...");
        const { contractTypeIds, contractHourIds } = await createContractSettings(createdEntities);

        // Phase 9: Create departments (with placeholder managers)
        console.log("🏢 Phase 8: Creating departments...");
        const departmentIds = await createDepartments(createdEntities, locationIds);

        // Phase 10: Create sections (with placeholder supervisors)
        console.log("📂 Phase 9: Creating sections...");
        const sectionIds = await createSections(createdEntities, departmentIds);

        // Phase 11: Create periodic options and monitoring periods
        console.log("📊 Phase 10: Creating evaluation settings...");
        const { periodicOptionIds, monitoringPeriodIds } =
            await createEvaluationSettings(createdEntities);

        // Phase 12: Create employees (with placeholder references)
        console.log("👥 Phase 11: Creating employees...");
        const employeeIds = await createEmployees(
            createdEntities,
            positionIds,
            departmentIds,
            sectionIds,
        );

        // Phase 13: Update all references with real IDs
        console.log("🔗 Phase 12: Resolving references...");
        await resolveAllReferences(createdEntities, {
            locationIds,
            shiftHourIds,
            shiftTypeIds,
            positionIds,
            departmentIds,
            sectionIds,
            employeeIds,
            periodicOptionIds,
            monitoringPeriodIds,
        });

        const duration = Date.now() - startTime;

        console.log("✅ Database seeding completed successfully!");

        return NextResponse.json(
            {
                success: true,
                message: "Database seeded successfully with dummy data",
                data: {
                    hrSettings: createdEntities.hrSettings,
                    employees: createdEntities.employees,
                    summary: {
                        totalHrSettings: Object.values(createdEntities.hrSettings).flat().length,
                        totalEmployees: createdEntities.employees.length,
                        totalAttendanceRecords: createdEntities.employees.length,
                        duration,
                    },
                },
            } as SeedingResult,
            { status: 200 },
        );
    } catch (error: any) {
        console.error("❌ Database seeding failed:", error);

        const duration = Date.now() - startTime;

        return NextResponse.json(
            {
                success: false,
                message: "Database seeding failed",
                error: error.message || "Unknown error occurred",
                data: {
                    hrSettings: {},
                    employees: [],
                    summary: {
                        totalHrSettings: 0,
                        totalEmployees: 0,
                        duration,
                        failedAt: new Date().toISOString(),
                        errorType: error.constructor?.name || "Unknown",
                    },
                },
            } as SeedingResult,
            { status: 500 },
        );
    }
}

// Phase 1: Clear existing data
async function clearExistingData() {
    console.log("🗑️ Clearing existing data...");

    // Step 1: Delete Firebase Auth users first
    try {
        const listUsersResult = await admin.auth().listUsers(1000);
        const uidsToDelete: string[] = [];

        listUsersResult.users.forEach(user => {
            // Only delete test users (based on our known UIDs)
            if (
                user.uid.startsWith("emp_user_") ||
                user.uid.startsWith("mgr_user_") ||
                user.uid.startsWith("hr_mgr_user_") ||
                user.uid.startsWith("cto_user_")
            ) {
                uidsToDelete.push(user.uid);
            }
        });

        if (uidsToDelete.length > 0) {
            await admin.auth().deleteUsers(uidsToDelete);
            console.log(`🔐 Deleted ${uidsToDelete.length} Firebase Auth users`);
        }
    } catch (authError) {
        console.warn("⚠️ Error deleting Firebase Auth users:", authError);
    }

    // Step 2: Clear all hrSettings subcollections
    const hrSettingsTypes = [
        "maritalStatuses",
        "levelOfEducations",
        "yearsOfExperiences",
        "contractTypes",
        "contractHours",
        "reasonOfLeaving",
        "probationDays",
        "holidays",
        "notificationTypes",
        "issueTypes",
        "issueStatus",
        "impactTypes",
        "priorities",
        "violationTypes",
        "disciplinaryTypes",
        "commonAnswers",
        "hiringNeedTypes",
        "tmCategories",
        "tmComplexity",
        "tmLengths",
        "paymentTypes",
        "deductionTypes",
        "loanTypes",
        "currencies",
        "taxes",
        "pension",
        "competencies",
        "grades",
        "accrualConfigurations",
        "backdateCapabilities",
        "eligibleLeaveDays",
        "leaveTypes",
        "overtimeTypes",
        "companyInfo",
        "leaveSettings",
        "payrollSettings",
        "locations",
        "shiftHours",
        "shiftTypes",
        "positions",
        "departments",
        "sections",
        "periodicOptions",
        "monitoringPeriods",
        "evaluationCampaigns",
        "strategicObjectives",
        "departmentKPIs",
        "competencePositionAssociations",
        "transferTypes",
        "transferReasons",
    ];

    const batch = adminDb.batch();

    for (const type of hrSettingsTypes) {
        const subcollectionRef = adminDb.collection("hrSettings").doc("main").collection(type);
        const snapshot = await subcollectionRef.get();

        snapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
        });
    }

    // Step 3: Clear main collections
    const mainCollections = [
        "employee",
        "notifications",
        "attendance",
        "leaveManagements",
        "overtimeRequests",
        "requestModifications",
        "documents",
        "performanceEvaluations",
        "objectives",
        "competenceValues",
        "competenceAssessments",
        "objectiveWeights",
        "hiringNeeds",
        "trainingMaterials",
        "trainingPaths",
        "trainingCertificates",
        "multipleChoices",
        "shortAnswers",
        "quizzes",
        "evaluationMetrics",
        "matchingProfiles",
        "customCriteria",
        "screeningQuestions",
        "jobPosts",
        "projects",
        "jobApplications",
        "applicants",
        "compensations",
        "employeeLoans",
        "talentPools",
        "disciplinaryActions",
        "surveys",
        "issues",
        "logs",
        "announcementManagement",
    ];

    for (const collectionName of mainCollections) {
        const collectionRef = adminDb.collection(collectionName);
        const snapshot = await collectionRef.get();

        snapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
        });
    }

    await batch.commit();
    console.log("✅ Existing data cleared from all collections");
}

// Phase 2: Independent hrSettings (no dependencies)
async function createIndependentHrSettings(createdEntities: CreatedEntities) {
    const independentData = {
        maritalStatuses: [
            { name: "Single", active: true },
            { name: "Married", active: true },
            { name: "Divorced", active: true },
            { name: "Widowed", active: true },
        ],
        levelOfEducations: [
            { name: "High School", active: true },
            { name: "Bachelor's Degree", active: true },
            { name: "Master's Degree", active: true },
            { name: "PhD", active: true },
        ],
        yearsOfExperiences: [
            { name: "0-1 years", active: true },
            { name: "1-3 years", active: true },
            { name: "3-5 years", active: true },
            { name: "5-10 years", active: true },
            { name: "10+ years", active: true },
        ],
        currencies: [
            { name: "USD", code: "USD", symbol: "$", active: true },
            { name: "EUR", code: "EUR", symbol: "€", active: true },
            { name: "GBP", code: "GBP", symbol: "£", active: true },
        ],
        competencies: [
            { competenceName: "Technical Skills", competenceType: "Technical", active: "Yes" },
            { competenceName: "Leadership", competenceType: "Behavioral", active: "Yes" },
            { competenceName: "Communication", competenceType: "Behavioral", active: "Yes" },
        ],
        grades: [
            { grade: "Junior", startDate: "2024-01-01", endDate: "2024-12-31", active: "Yes" },
            { grade: "Senior", startDate: "2024-01-01", endDate: "2024-12-31", active: "Yes" },
            { grade: "Lead", startDate: "2024-01-01", endDate: "2024-12-31", active: "Yes" },
        ],
        // Company Info
        companyInfo: {
            mission:
                "To provide innovative HR solutions that empower organizations and enhance employee experiences",
            vision: "To be the leading HR technology company transforming workplace management globally",
            values: {
                qualityExcellence:
                    "We are committed to delivering exceptional quality in everything we do",
                sustainability:
                    "We build sustainable solutions that benefit our clients, employees, and communities",
            },
            companyName: "OneHR Solutions Ltd",
            postalAddress: "123 Business District, Tech City, TC 12345",
            companyUrl: "https://onehr-solutions.com",
            telNo: "+1-555-ONEHR",
            contactPerson: "Admin User",
            emailAddress: "admin@onehr-solutions.com",
            managingDirector: "CEO Name",
            legalRepresentative: "Legal Rep Name",
            yearsInBusiness: "5",
            companySize: "50-100",
            companySector: "Technology",
            tinNumber: "TIN123456789",
            faxNumber: "+1-555-1234",
            houseNumber: "Bldg 123",
            capital: "1000000",
            totalAnnualRevenue: "5000000",
            companyProfile: "Leading HR management platform",
            companyLogoURL: "/logo.png",
        },
        // Attendance Logic
        attendanceLogic: {
            chosenLogic: 1,
            halfPresentThreshold: 4,
            presentThreshold: 8,
        },
        payrollSettings: {
            baseCurrency: "USD",
            taxRate: 0,
            monthlyWorkingHours: 173,
        },
        // Holidays
        holidays: [
            { name: "New Year's Day", date: "2024-01-01", active: "Yes" },
            { name: "Christmas Day", date: "2024-12-25", active: "Yes" },
            { name: "Company Foundation Day", date: "2024-06-15", active: "Yes" },
        ],
        // Leave Types
        leaveTypes: [
            { name: "Annual Leave", authorizedDays: 25, acronym: "AL", active: "Yes" },
            { name: "Sick Leave", authorizedDays: 10, acronym: "SL", active: "Yes" },
            { name: "Maternity Leave", authorizedDays: 90, acronym: "ML", active: "Yes" },
            { name: "Paternity Leave", authorizedDays: 10, acronym: "PL", active: "Yes" },
        ],
        // Training Categories
        tmCategories: [
            { name: "Technical Training", active: "Yes" },
            { name: "Soft Skills", active: "Yes" },
            { name: "Leadership Development", active: "Yes" },
            { name: "Compliance Training", active: "Yes" },
        ],
        // Training Length
        tmLengths: [
            { name: "Short (1-2 hours)", active: "Yes" },
            { name: "Medium (3-8 hours)", active: "Yes" },
            { name: "Long (1-2 days)", active: "Yes" },
            { name: "Extended (3+ days)", active: "Yes" },
        ],
        // Training Complexity
        tmComplexity: [
            { name: "Beginner", active: "Yes" },
            { name: "Intermediate", active: "Yes" },
            { name: "Advanced", active: "Yes" },
            { name: "Expert", active: "Yes" },
        ],
        // Payment Types
        paymentTypes: [
            {
                paymentName: "Salary",
                paymentType: "Monthly",
                taxabilityThresholdType: "Percentage",
                taxabilityThresholdAmount: 100,
                active: true,
            },
            {
                paymentName: "Bonus",
                paymentType: "Annual",
                taxabilityThresholdType: "Percentage",
                taxabilityThresholdAmount: 100,
                active: true,
            },
            {
                paymentName: "Commission",
                paymentType: "Variable",
                taxabilityThresholdType: "Percentage",
                taxabilityThresholdAmount: 50,
                active: true,
            },
        ],
        // Deduction Types
        deductionTypes: [
            { deductionName: "Health Insurance", active: true },
            { deductionName: "Retirement Contribution", active: true },
            { deductionName: "Union Dues", active: true },
        ],
        // Loan Types
        loanTypes: [
            {
                loanName: "Emergency Loan",
                loanInterestRate: 5,
                marketInterestRate: 8,
                active: true,
            },
            {
                loanName: "Education Loan",
                loanInterestRate: 3,
                marketInterestRate: 6,
                active: true,
            },
            { loanName: "Housing Loan", loanInterestRate: 4, marketInterestRate: 7, active: true },
        ],
        // Enhanced Tax Configuration
        taxes: [
            { taxName: "Income Tax", rate: 15, active: true },
            { taxName: "Social Security", rate: 7.5, active: true },
            { taxName: "Health Insurance", rate: 3, active: true },
        ],
        // Employee engagement
        issueTypes: [
            { name: "Workplace Environment", active: "Yes" },
            { name: "Management", active: "Yes" },
            { name: "Compensation", active: "Yes" },
            { name: "Work-life Balance", active: "Yes" },
        ],
        issueStatus: [
            { type: "escalation", name: "Open", active: "Yes" },
            { type: "escalation", name: "In Reviewed", active: "Yes" },
            { type: "escalation", name: "Reviewed", active: "Yes" },
            { type: "escalation", name: "Acknowledged", active: "Yes" },
        ],
        impactTypes: [
            { name: "Low", active: "Yes" },
            { name: "Medium", active: "Yes" },
            { name: "High", active: "Yes" },
            { name: "Critical", active: "Yes" },
        ],
        priorities: [
            { name: "Low", active: "Yes" },
            { name: "Medium", active: "Yes" },
            { name: "High", active: "Yes" },
            { name: "Urgent", active: "Yes" },
        ],
        // Transfer Types
        transferTypes: [
            {
                name: "Internal Transfer",
                active: true,
                type: "Transfer Type",
                timestamp: dayjs().format("YYYY-MM-DD HH:mm:ss"),
            },
            {
                name: "Location Transfer",
                active: true,
                type: "Transfer Type",
                timestamp: dayjs().format("YYYY-MM-DD HH:mm:ss"),
            },
            {
                name: "Department Transfer",
                active: true,
                type: "Transfer Type",
                timestamp: dayjs().format("YYYY-MM-DD HH:mm:ss"),
            },
            {
                name: "Promotion Transfer",
                active: true,
                type: "Transfer Type",
                timestamp: dayjs().format("YYYY-MM-DD HH:mm:ss"),
            },
        ],
        // Transfer Reasons
        transferReasons: [
            {
                name: "Career Growth",
                active: true,
                type: "Transfer Reason",
                timestamp: dayjs().format("YYYY-MM-DD HH:mm:ss"),
            },
            {
                name: "Personal Reasons",
                active: true,
                type: "Transfer Reason",
                timestamp: dayjs().format("YYYY-MM-DD HH:mm:ss"),
            },
            {
                name: "Organizational Restructuring",
                active: true,
                type: "Transfer Reason",
                timestamp: dayjs().format("YYYY-MM-DD HH:mm:ss"),
            },
            {
                name: "Skill Development",
                active: true,
                type: "Transfer Reason",
                timestamp: dayjs().format("YYYY-MM-DD HH:mm:ss"),
            },
            {
                name: "Performance Based",
                active: true,
                type: "Transfer Reason",
                timestamp: dayjs().format("YYYY-MM-DD HH:mm:ss"),
            },
        ],
    };

    for (const [type, data] of Object.entries(independentData)) {
        // Handle single objects vs arrays differently
        if (
            type === "companyInfo" ||
            type === "attendanceLogic" ||
            type === "pension" ||
            type === "payrollSettings"
        ) {
            // Single object - create directly
            const id = await adminHrSettingsCreate(type, data as any);
            createdEntities.hrSettings[type] = [id];
            console.log(`✅ Created ${type} with ID: ${id}`);
        } else {
            // Array of objects - batch create
            const result = await adminHrSettingsBatchCreate(type, data as any[]);
            if (result.success && result.ids) {
                createdEntities.hrSettings[type] = result.ids;
                console.log(`✅ Created ${result.ids.length} ${type}`);
            } else {
                throw new Error(`Failed to create ${type}: ${result.error}`);
            }
        }
    }
}

// Phase 3: Location hierarchy
async function createLocationHierarchy(createdEntities: CreatedEntities): Promise<string[]> {
    const locationData = [
        {
            name: "Headquarters",
            type: "building",
            parentId: null,
            startDate: "2024-01-01",
            endDate: "2024-12-31",
            active: "Yes",
            description: "Main headquarters building",
            address: "123 Main St, City, Country",
        },
        {
            name: "Main Office",
            type: "office",
            parentId: null, // Will be updated after creation
            startDate: "2024-01-01",
            endDate: "2024-12-31",
            active: "Yes",
            description: "Primary office space",
        },
        {
            name: "Branch Office",
            type: "office",
            parentId: null, // Will be updated after creation
            startDate: "2024-01-01",
            endDate: "2024-12-31",
            active: "Yes",
            description: "Secondary office location",
        },
    ];

    const result = await adminHrSettingsBatchCreate("locations", locationData);
    if (result.success && result.ids) {
        createdEntities.hrSettings.locations = result.ids;

        // Update parent-child relationships
        if (result.ids.length >= 2) {
            // Main Office and Branch Office are children of Headquarters
            await adminHrSettingsUpdate("locations", result.ids[1], { parentId: result.ids[0] });
            await adminHrSettingsUpdate("locations", result.ids[2], { parentId: result.ids[0] });
        }

        console.log(`✅ Created ${result.ids.length} locations with hierarchy`);
        return result.ids;
    } else {
        throw new Error(`Failed to create locations: ${result.error}`);
    }
}

// Phase 4: Shift hours
async function createShiftHours(createdEntities: CreatedEntities): Promise<string[]> {
    const shiftHourData = [
        {
            name: "Morning Shift",
            shiftHours: [{ startTime: "08:00", endTime: "16:00" }],
            active: "Yes" as const,
            timestamp: dayjs().format("YYYY-MM-DD HH:mm:ss"),
        },
        {
            name: "Afternoon Shift",
            shiftHours: [{ startTime: "14:00", endTime: "22:00" }],
            active: "Yes" as const,
            timestamp: dayjs().format("YYYY-MM-DD HH:mm:ss"),
        },
        {
            name: "Night Shift",
            shiftHours: [{ startTime: "22:00", endTime: "06:00" }],
            active: "Yes" as const,
            timestamp: dayjs().format("YYYY-MM-DD HH:mm:ss"),
        },
    ];

    const result = await adminHrSettingsBatchCreate("shiftHours", shiftHourData);
    if (result.success && result.ids) {
        createdEntities.hrSettings.shiftHours = result.ids;
        console.log(`✅ Created ${result.ids.length} shift hours`);
        return result.ids;
    } else {
        throw new Error(`Failed to create shift hours: ${result.error}`);
    }
}

// Phase 5: Shift types (reference shift hours)
async function createShiftTypes(
    createdEntities: CreatedEntities,
    shiftHourIds: string[],
): Promise<string[]> {
    const shiftTypeData = [
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
            endDate: "2024-12-31",
            active: "Yes" as const,
            timestamp: dayjs().format("YYYY-MM-DD HH:mm:ss"),
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
            endDate: "2024-12-31",
            active: "Yes" as const,
            timestamp: dayjs().format("YYYY-MM-DD HH:mm:ss"),
        },
    ];

    const result = await adminHrSettingsBatchCreate("shiftTypes", shiftTypeData);
    if (result.success && result.ids) {
        createdEntities.hrSettings.shiftTypes = result.ids;
        console.log(`✅ Created ${result.ids.length} shift types`);
        return result.ids;
    } else {
        throw new Error(`Failed to create shift types: ${result.error}`);
    }
}

// Phase 6: Competencies and grades (already created in independent phase)
async function createCompetenciesAndGrades(
    createdEntities: CreatedEntities,
): Promise<{ competenceIds: string[]; gradeIds: string[] }> {
    return {
        competenceIds: createdEntities.hrSettings.competencies || [],
        gradeIds: createdEntities.hrSettings.grades || [],
    };
}

// Phase 7: Positions (reference grades and competencies)
async function createPositions(
    createdEntities: CreatedEntities,
    gradeIds: string[],
    competenceIds: string[],
): Promise<string[]> {
    const positionData = [
        {
            name: "Software Engineer",
            startDate: "2024-01-01",
            endDate: "2024-12-31",
            positionDescription: "Develops and maintains software applications",
            additionalInformation: "Full-stack development",
            band: "Technical",
            grade: gradeIds[0], // Junior
            active: "Yes" as const,
            critical: "No" as const,
            keys: [],
            step: "1",
            companyProfile: null,
            companyProfileUsed: false,
            competencies: [competenceIds[0], competenceIds[1]], // Technical Skills, Leadership
            createdAt: dayjs().format("YYYY-MM-DD HH:mm:ss"),
            updatedAt: dayjs().format("YYYY-MM-DD HH:mm:ss"),
        },
        {
            name: "Senior Software Engineer",
            startDate: "2024-01-01",
            endDate: "2024-12-31",
            positionDescription: "Leads software development projects",
            additionalInformation: "Senior level technical leadership",
            band: "Technical",
            grade: gradeIds[1], // Senior
            active: "Yes" as const,
            critical: "Yes" as const,
            keys: [],
            step: "2",
            companyProfile: null,
            companyProfileUsed: false,
            competencies: [competenceIds[0], competenceIds[1], competenceIds[2]], // All competencies
            createdAt: dayjs().format("YYYY-MM-DD HH:mm:ss"),
            updatedAt: dayjs().format("YYYY-MM-DD HH:mm:ss"),
        },
        {
            name: "HR Manager",
            startDate: "2024-01-01",
            endDate: "2024-12-31",
            positionDescription: "Manages human resources operations",
            additionalInformation: "HR management and employee relations",
            band: "Management",
            grade: gradeIds[2], // Lead
            active: "Yes" as const,
            critical: "Yes" as const,
            keys: [],
            step: "3",
            companyProfile: null,
            companyProfileUsed: false,
            competencies: [competenceIds[1], competenceIds[2]], // Leadership, Communication
            createdAt: dayjs().format("YYYY-MM-DD HH:mm:ss"),
            updatedAt: dayjs().format("YYYY-MM-DD HH:mm:ss"),
        },
    ];

    const result = await adminHrSettingsBatchCreate("positions", positionData);
    if (result.success && result.ids) {
        createdEntities.hrSettings.positions = result.ids;
        console.log(`✅ Created ${result.ids.length} positions`);
        return result.ids;
    } else {
        throw new Error(`Failed to create positions: ${result.error}`);
    }
}

// Phase 8: Contract settings
async function createContractSettings(
    createdEntities: CreatedEntities,
): Promise<{ contractTypeIds: string[]; contractHourIds: string[] }> {
    const contractTypeData = [
        {
            name: "Full-time Permanent",
            startDate: "2024-01-01",
            endDate: "2024-12-31",
            active: "Yes" as const,
        },
        {
            name: "Part-time Permanent",
            startDate: "2024-01-01",
            endDate: "2024-12-31",
            active: "Yes" as const,
        },
        {
            name: "Contract",
            startDate: "2024-01-01",
            endDate: "2024-12-31",
            active: "Yes" as const,
        },
    ];

    const contractHourData = [
        {
            hourPerWeek: 40,
            startDate: "2024-01-01",
            endDate: "2024-12-31",
            active: "Yes",
        },
        {
            hourPerWeek: 20,
            startDate: "2024-01-01",
            endDate: "2024-12-31",
            active: "Yes",
        },
    ];

    const contractTypeResult = await adminHrSettingsBatchCreate("contractTypes", contractTypeData);
    const contractHourResult = await adminHrSettingsBatchCreate("contractHours", contractHourData);

    if (
        contractTypeResult.success &&
        contractTypeResult.ids &&
        contractHourResult.success &&
        contractHourResult.ids
    ) {
        createdEntities.hrSettings.contractTypes = contractTypeResult.ids;
        createdEntities.hrSettings.contractHours = contractHourResult.ids;

        console.log(
            `✅ Created ${contractTypeResult.ids.length} contract types and ${contractHourResult.ids.length} contract hours`,
        );
        return {
            contractTypeIds: contractTypeResult.ids,
            contractHourIds: contractHourResult.ids,
        };
    } else {
        throw new Error(
            `Failed to create contract settings: ${contractTypeResult.error || contractHourResult.error}`,
        );
    }
}

// Phase 9: Departments (with placeholder managers)
async function createDepartments(
    createdEntities: CreatedEntities,
    locationIds: string[],
): Promise<string[]> {
    const departmentData = [
        {
            name: "Engineering",
            code: "ENG",
            manager: "PLACEHOLDER_MANAGER_UID", // Will be updated later
            location: locationIds[0], // Headquarters
            active: true,
            createdAt: dayjs().format("YYYY-MM-DD HH:mm:ss"),
            updatedAt: dayjs().format("YYYY-MM-DD HH:mm:ss"),
        },
        {
            name: "Human Resources",
            code: "HR",
            manager: "PLACEHOLDER_HR_MANAGER_UID", // Will be updated later
            location: locationIds[0], // Headquarters
            active: true,
            createdAt: dayjs().format("YYYY-MM-DD HH:mm:ss"),
            updatedAt: dayjs().format("YYYY-MM-DD HH:mm:ss"),
        },
    ];

    const result = await adminHrSettingsBatchCreate("departmentSettings", departmentData);
    if (result.success && result.ids) {
        createdEntities.hrSettings.departments = result.ids;
        console.log(`✅ Created ${result.ids.length} departments`);
        return result.ids;
    } else {
        throw new Error(`Failed to create departments: ${result.error}`);
    }
}

// Phase 10: Sections (with placeholder supervisors)
async function createSections(
    createdEntities: CreatedEntities,
    departmentIds: string[],
): Promise<string[]> {
    const sectionData = [
        {
            name: "Backend Development",
            code: "BE",
            department: departmentIds[0], // Engineering
            supervisor: "PLACEHOLDER_SUPERVISOR_UID", // Will be updated later
            active: true,
            createdAt: dayjs().format("YYYY-MM-DD HH:mm:ss"),
            updatedAt: dayjs().format("YYYY-MM-DD HH:mm:ss"),
        },
        {
            name: "HR Administration",
            code: "HR_ADMIN",
            department: departmentIds[1], // Human Resources
            supervisor: "PLACEHOLDER_HR_SUPERVISOR_UID", // Will be updated later
            active: true,
            createdAt: dayjs().format("YYYY-MM-DD HH:mm:ss"),
            updatedAt: dayjs().format("YYYY-MM-DD HH:mm:ss"),
        },
    ];

    const result = await adminHrSettingsBatchCreate("sectionSettings", sectionData);
    if (result.success && result.ids) {
        createdEntities.hrSettings.sections = result.ids;
        console.log(`✅ Created ${result.ids.length} sections`);
        return result.ids;
    } else {
        throw new Error(`Failed to create sections: ${result.error}`);
    }
}

// Phase 11: Evaluation settings
async function createEvaluationSettings(
    createdEntities: CreatedEntities,
): Promise<{ periodicOptionIds: string[]; monitoringPeriodIds: string[] }> {
    const periodicOptionData = [
        {
            name: "Annual Review",
            period: "annual",
            startDate: "2024-01-01",
            endDate: "2024-12-31",
            timestamp: dayjs().format("YYYY-MM-DD HH:mm:ss"),
            periodName: "Annual",
            year: 2024,
            evaluations: [],
        },
        {
            name: "Mid-year Review",
            period: "semi-annual",
            startDate: "2024-01-01",
            endDate: "2024-06-30",
            timestamp: dayjs().format("YYYY-MM-DD HH:mm:ss"),
            periodName: "Semi-Annual",
            year: 2024,
            evaluations: [],
        },
    ];

    const periodicResult = await adminHrSettingsBatchCreate("periodicOptions", periodicOptionData);
    if (!periodicResult.success || !periodicResult.ids) {
        throw new Error(`Failed to create periodic options: ${periodicResult.error}`);
    }

    const monitoringPeriodData = [
        {
            name: "Q1 2024",
            periodicOption: periodicResult.ids[0], // Annual Review
            startDate: "2024-01-01",
            endDate: "2024-03-31",
            timestamp: dayjs().format("YYYY-MM-DD HH:mm:ss"),
            periodID: periodicResult.ids[0],
            roundID: "round_001",
            monitoringPeriodName: "First Quarter 2024",
        },
        {
            name: "Q2 2024",
            periodicOption: periodicResult.ids[1], // Mid-year Review
            startDate: "2024-04-01",
            endDate: "2024-06-30",
            timestamp: dayjs().format("YYYY-MM-DD HH:mm:ss"),
            periodID: periodicResult.ids[1],
            roundID: "round_002",
            monitoringPeriodName: "Second Quarter 2024",
        },
    ];

    const monitoringResult = await adminHrSettingsBatchCreate(
        "monitoringPeriods",
        monitoringPeriodData,
    );
    if (monitoringResult.success && monitoringResult.ids) {
        createdEntities.hrSettings.periodicOptions = periodicResult.ids;
        createdEntities.hrSettings.monitoringPeriods = monitoringResult.ids;

        console.log(
            `✅ Created ${periodicResult.ids.length} periodic options and ${monitoringResult.ids.length} monitoring periods`,
        );
        return {
            periodicOptionIds: periodicResult.ids,
            monitoringPeriodIds: monitoringResult.ids,
        };
    } else {
        throw new Error(`Failed to create monitoring periods: ${monitoringResult.error}`);
    }
}

// Phase 12: Create employees
async function createEmployees(
    createdEntities: CreatedEntities,
    positionIds: string[],
    departmentIds: string[],
    sectionIds: string[],
): Promise<string[]> {
    const employeeData = [
        {
            // Employee only
            uid: "emp_user_001",
            firstName: "John",
            middleName: "Michael",
            surname: "Doe",
            employeeID: "EMP001",
            personalPhoneNumber: "+1234567890",
            personalEmail: "john.doe@company.com",
            password: "1q2w3e4r%T",
            levelOfEducation: createdEntities.hrSettings.levelOfEducations?.[0] || "",
            yearsOfExperience: createdEntities.hrSettings.yearsOfExperiences?.[2] || "", // 3-5 years
            gender: "male",
            maritalStatus: createdEntities.hrSettings.maritalStatuses?.[0] || "",
            birthDate: "1990-05-15",
            birthPlace: "New York, USA",
            bankAccount: "123456789",
            providentFundAccount: "PF123456",
            tinNumber: "123456789",
            passportNumber: "P123456789",
            nationalIDNumber: "NID123456789",
            company: "company-a",
            contractType: createdEntities.hrSettings.contractTypes?.[0] || "",
            contractHour: createdEntities.hrSettings.contractHours?.[0] || "",
            hoursPerWeek: 40,
            contractStatus: "active",
            contractStartingDate: "2024-01-01",
            contractTerminationDate: "2024-12-31",
            contractDuration: [12],
            hireDate: "2024-01-01",
            probationPeriodEndDate: "2024-03-31",
            salary: 50000,
            currency: createdEntities.hrSettings.currencies?.[0] || "",
            eligibleLeaveDays: 25,
            companyEmail: "john.doe@internal.company.com",
            companyPhoneNumber: "+1234567891",
            associatedTax: createdEntities.hrSettings.taxes?.[0] || "",
            employmentPosition: positionIds[0], // Software Engineer
            positionLevel: "Junior",
            section: "PLACEHOLDER_SECTION_ID", // Will be updated
            department: "PLACEHOLDER_DEPARTMENT_ID", // Will be updated
            workingLocation: createdEntities.hrSettings.locations?.[0] || "",
            workingArea: "[]",
            homeLocation: createdEntities.hrSettings.locations?.[0] || "",
            managerPosition: false,
            reportees: [],
            reportingLineManager: "",
            reportingLineManagerPosition: "",
            gradeLevel: createdEntities.hrSettings.grades?.[0] || "",
            step: 1,
            shiftType: createdEntities.hrSettings.shiftTypes?.[0] || "",
            role: ["Employee"],
            emergencyContactName: "Jane Doe",
            relationshipToEmployee: "Spouse",
            phoneNumber1: "+1234567892",
            phoneNumber2: "+1234567893",
            emailAddress1: "jane.doe@email.com",
            emailAddress2: "",
            physicalAddress1: "456 Oak St, City, Country",
            physicalAddress2: "",
            balanceLeaveDays: 25,
            accrualLeaveDays: 2.08,
            lastELDUpdate: dayjs().format("YYYY-MM-DD"),
            timestamp: dayjs().format("YYYY-MM-DD HH:mm:ss"),
        },
        {
            // Employee + Manager
            uid: "mgr_user_002",
            firstName: "Sarah",
            middleName: "Elizabeth",
            surname: "Johnson",
            employeeID: "EMP002",
            personalPhoneNumber: "+1234567894",
            personalEmail: "sarah.johnson@company.com",
            password: "1q2w3e4r%T",
            levelOfEducation: createdEntities.hrSettings.levelOfEducations?.[2] || "",
            yearsOfExperience: createdEntities.hrSettings.yearsOfExperiences?.[3] || "", // 5-10 years
            gender: "female",
            maritalStatus: createdEntities.hrSettings.maritalStatuses?.[1] || "",
            birthDate: "1985-08-20",
            birthPlace: "Los Angeles, USA",
            bankAccount: "987654321",
            providentFundAccount: "PF987654",
            tinNumber: "987654321",
            passportNumber: "P987654321",
            nationalIDNumber: "NID987654321",
            company: "company-a",
            contractType: createdEntities.hrSettings.contractTypes?.[0] || "",
            contractHour: createdEntities.hrSettings.contractHours?.[0] || "",
            hoursPerWeek: 40,
            contractStatus: "active",
            contractStartingDate: "2023-06-01",
            contractTerminationDate: "2024-12-31",
            contractDuration: [18],
            hireDate: "2023-06-01",
            probationPeriodEndDate: "2023-09-01",
            salary: 75000,
            currency: createdEntities.hrSettings.currencies?.[0] || "",
            eligibleLeaveDays: 25,
            companyEmail: "sarah.johnson@internal.company.com",
            companyPhoneNumber: "+1234567895",
            associatedTax: createdEntities.hrSettings.taxes?.[0] || "",
            employmentPosition: positionIds[1], // Senior Software Engineer
            positionLevel: "Senior",
            section: "PLACEHOLDER_SECTION_ID", // Will be updated
            department: "PLACEHOLDER_DEPARTMENT_ID", // Will be updated
            workingLocation: createdEntities.hrSettings.locations?.[0] || "",
            workingArea: "[]",
            homeLocation: createdEntities.hrSettings.locations?.[0] || "",
            managerPosition: true,
            reportees: ["emp_user_001"],
            reportingLineManager: "",
            reportingLineManagerPosition: "",
            gradeLevel: createdEntities.hrSettings.grades?.[1] || "",
            step: 2,
            shiftType: createdEntities.hrSettings.shiftTypes?.[0] || "",
            role: ["Employee", "Manager"],
            emergencyContactName: "Mike Johnson",
            relationshipToEmployee: "Spouse",
            phoneNumber1: "+1234567896",
            phoneNumber2: "",
            emailAddress1: "mike.johnson@email.com",
            emailAddress2: "",
            physicalAddress1: "789 Pine St, City, Country",
            physicalAddress2: "",
            balanceLeaveDays: 25,
            accrualLeaveDays: 2.08,
            lastELDUpdate: dayjs().format("YYYY-MM-DD"),
            timestamp: dayjs().format("YYYY-MM-DD HH:mm:ss"),
        },
        {
            // Employee + HR Manager
            uid: "hr_mgr_user_003",
            firstName: "David",
            middleName: "Robert",
            surname: "Wilson",
            employeeID: "EMP003",
            personalPhoneNumber: "+1234567897",
            personalEmail: "david.wilson@company.com",
            password: "1q2w3e4r%T",
            levelOfEducation: createdEntities.hrSettings.levelOfEducations?.[3] || "",
            yearsOfExperience: createdEntities.hrSettings.yearsOfExperiences?.[4] || "", // 10+ years
            gender: "male",
            maritalStatus: createdEntities.hrSettings.maritalStatuses?.[1] || "",
            birthDate: "1980-12-10",
            birthPlace: "Chicago, USA",
            bankAccount: "456789123",
            providentFundAccount: "PF456789",
            tinNumber: "456789123",
            passportNumber: "P456789123",
            nationalIDNumber: "NID456789123",
            company: "company-a",
            contractType: createdEntities.hrSettings.contractTypes?.[0] || "",
            contractHour: createdEntities.hrSettings.contractHours?.[0] || "",
            hoursPerWeek: 40,
            contractStatus: "active",
            contractStartingDate: "2022-01-01",
            contractTerminationDate: "2024-12-31",
            contractDuration: [36],
            hireDate: "2022-01-01",
            probationPeriodEndDate: "2022-04-01",
            salary: 90000,
            currency: createdEntities.hrSettings.currencies?.[0] || "",
            eligibleLeaveDays: 30,
            companyEmail: "david.wilson@internal.company.com",
            companyPhoneNumber: "+1234567898",
            associatedTax: createdEntities.hrSettings.taxes?.[0] || "",
            employmentPosition: positionIds[2], // HR Manager
            positionLevel: "Lead",
            section: "PLACEHOLDER_SECTION_ID", // Will be updated
            department: "PLACEHOLDER_DEPARTMENT_ID", // Will be updated
            workingLocation: createdEntities.hrSettings.locations?.[0] || "",
            workingArea: "[]",
            homeLocation: createdEntities.hrSettings.locations?.[0] || "",
            managerPosition: true,
            reportees: [],
            reportingLineManager: "",
            reportingLineManagerPosition: "",
            gradeLevel: createdEntities.hrSettings.grades?.[2] || "",
            step: 3,
            shiftType: createdEntities.hrSettings.shiftTypes?.[0] || "",
            role: ["Employee", "HR Manager"],
            emergencyContactName: "Lisa Wilson",
            relationshipToEmployee: "Spouse",
            phoneNumber1: "+1234567899",
            phoneNumber2: "",
            emailAddress1: "lisa.wilson@email.com",
            emailAddress2: "",
            physicalAddress1: "321 Elm St, City, Country",
            physicalAddress2: "",
            balanceLeaveDays: 30,
            accrualLeaveDays: 2.5,
            lastELDUpdate: dayjs().format("YYYY-MM-DD"),
            timestamp: dayjs().format("YYYY-MM-DD HH:mm:ss"),
        },
        {
            // All roles - Employee + Manager + HR Manager + Payroll Officer
            uid: "cto_user_004",
            firstName: "Emily",
            middleName: "Grace",
            surname: "Chen",
            employeeID: "EMP004",
            personalPhoneNumber: "+1234567800",
            personalEmail: "emily.chen@company.com",
            password: "1q2w3e4r%T",
            levelOfEducation: createdEntities.hrSettings.levelOfEducations?.[3] || "",
            yearsOfExperience: createdEntities.hrSettings.yearsOfExperiences?.[4] || "", // 10+ years
            gender: "female",
            maritalStatus: createdEntities.hrSettings.maritalStatuses?.[0] || "",
            birthDate: "1978-03-25",
            birthPlace: "San Francisco, USA",
            bankAccount: "789123456",
            providentFundAccount: "PF789123",
            tinNumber: "789123456",
            passportNumber: "P789123456",
            nationalIDNumber: "NID789123456",
            company: "company-a",
            contractType: createdEntities.hrSettings.contractTypes?.[0] || "",
            contractHour: createdEntities.hrSettings.contractHours?.[0] || "",
            hoursPerWeek: 40,
            contractStatus: "active",
            contractStartingDate: "2020-01-01",
            contractTerminationDate: "2024-12-31",
            contractDuration: [60],
            hireDate: "2020-01-01",
            probationPeriodEndDate: "2020-04-01",
            salary: 120000,
            currency: createdEntities.hrSettings.currencies?.[0] || "",
            eligibleLeaveDays: 30,
            companyEmail: "emily.chen@internal.company.com",
            companyPhoneNumber: "+1234567801",
            associatedTax: createdEntities.hrSettings.taxes?.[0] || "",
            employmentPosition: positionIds[1], // Senior Software Engineer (CTO level)
            positionLevel: "Executive",
            section: "PLACEHOLDER_SECTION_ID", // Will be updated
            department: "PLACEHOLDER_DEPARTMENT_ID", // Will be updated
            workingLocation: createdEntities.hrSettings.locations?.[0] || "",
            workingArea: "[]",
            homeLocation: createdEntities.hrSettings.locations?.[0] || "",
            managerPosition: true,
            reportees: ["mgr_user_002"],
            reportingLineManager: "",
            reportingLineManagerPosition: "",
            gradeLevel: createdEntities.hrSettings.grades?.[2] || "",
            step: 4,
            shiftType: createdEntities.hrSettings.shiftTypes?.[0] || "",
            role: ["Employee", "Manager", "HR Manager", "Payroll Officer"],
            emergencyContactName: "Robert Chen",
            relationshipToEmployee: "Spouse",
            phoneNumber1: "+1234567802",
            phoneNumber2: "",
            emailAddress1: "robert.chen@email.com",
            emailAddress2: "",
            physicalAddress1: "654 Cedar St, City, Country",
            physicalAddress2: "",
            balanceLeaveDays: 30,
            accrualLeaveDays: 2.5,
            lastELDUpdate: dayjs().format("YYYY-MM-DD"),
            timestamp: dayjs().format("YYYY-MM-DD HH:mm:ss"),
        },
    ];

    const db = admin.firestore();
    const employeeIds: string[] = [];

    for (const employee of employeeData) {
        const docRef = db.collection("employee").doc();
        employeeIds.push(docRef.id);

        // Create Firebase Auth user for this employee
        try {
            const userRecord = await admin.auth().createUser({
                uid: employee.uid,
                email: employee.personalEmail,
                password: employee.password ?? "1q2w3e4r%T",
                displayName: `${employee.firstName} ${employee.middleName ? employee.middleName + " " : ""}${employee.surname}`,
                emailVerified: true, // For testing purposes
            });

            // Set custom claims for role-based access
            await admin.auth().setCustomUserClaims(userRecord.uid, {
                role: employee.role,
            });

            console.log(
                `🔐 Created Firebase Auth user: ${employee.personalEmail} with roles: ${employee.role.join(", ")}`,
            );
        } catch (authError: any) {
            // Handle existing users gracefully
            if (
                authError.code === "auth/uid-already-exists" ||
                authError.code === "auth/email-already-exists"
            ) {
                console.log(`ℹ️ Firebase Auth user already exists: ${employee.personalEmail}`);
                // Try to update custom claims for existing user
                try {
                    await admin.auth().setCustomUserClaims(employee.uid, {
                        role: employee.role,
                    });
                    console.log(`✅ Updated roles for existing user: ${employee.personalEmail}`);
                } catch (claimError) {
                    console.warn(
                        `⚠️ Failed to update roles for existing user ${employee.personalEmail}:`,
                        claimError,
                    );
                }
            } else {
                console.warn(
                    `⚠️ Failed to create Firebase Auth user for ${employee.personalEmail}:`,
                    authError.message,
                );
            }
        }

        // Create employee document with the generated ID (exclude password for security)
        const { password, ...employeeDataWithoutPassword } = employee;
        await docRef.set({
            ...employeeDataWithoutPassword,
            id: docRef.id,
        });
    }

    createdEntities.employees = employeeIds;
    console.log(`✅ Created ${employeeIds.length} employees`);

    // Generate attendance data for employees
    console.log("📊 Generating attendance data for employees...");
    await generateAttendanceData(employeeIds, createdEntities);

    return employeeIds;
}

// Generate attendance data for employees
async function generateAttendanceData(employeeIds: string[], createdEntities: CreatedEntities) {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const monthNames = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
    ];

    const attendancePromises: Promise<any>[] = [];

    for (const employeeId of employeeIds) {
        // Create attendance record for current month
        const attendanceData = {
            id: `attendance_${employeeId}_${currentYear}_${currentMonth}`,
            generatedAt: dayjs().format("YYYY-MM-DD HH:mm:ss"),
            uid: employeeId,
            month: monthNames[currentMonth] as any,
            year: currentYear,
            state: "Approved",
            stage: "Closed",
            associatedShiftType: createdEntities.hrSettings.shiftTypes?.[0] || "",

            // Generate sample daily attendance for the month
            values: generateDailyAttendance(),

            comments: [],
            monthlyWorkedHours: 160, // 8 hours * 20 working days
            dailyWorkingHour: 8,
            periodWorkingDays: 20,
            workedDays: 18,
            absentDays: 2,
            claimedOvertimes: [],
            lastClockInTimestamp: dayjs().subtract(1, "day").format("YYYY-MM-DD HH:mm:ss"),
        };

        const attendanceRef = adminDb.collection("attendance").doc(attendanceData.id);
        attendancePromises.push(attendanceRef.set(attendanceData));
    }

    await Promise.all(attendancePromises);
    console.log(`✅ Generated attendance data for ${employeeIds.length} employees`);
}

// Generate daily attendance for a month
function generateDailyAttendance(): any[] {
    const daysInMonth = new Date().getDate();
    const dailyAttendance = [];

    for (let day = 1; day <= Math.min(daysInMonth, 28); day++) {
        const isWeekend = new Date(2024, new Date().getMonth(), day).getDay();
        let value = "P"; // Present
        let status = "Verified";

        // Simulate some absences and half days
        if (day % 7 === 0) {
            // Sunday
            value = "A"; // Absent
            status = "Verified";
        } else if (day % 10 === 0) {
            // Every 10th day
            value = "H"; // Half day
            status = "Verified";
        } else if (day % 15 === 0) {
            // Every 15th day
            value = "A"; // Absent
            status = "Verified";
        }

        dailyAttendance.push({
            id: `day_${day}`,
            day: day,
            value: value,
            timestamp: dayjs(
                `2024-${String(new Date().getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
            ).format("YYYY-MM-DD HH:mm:ss"),
            from: value !== "A" ? "08:00" : null,
            to: value !== "A" ? (value === "H" ? "12:00" : "16:00") : null,
            status: status,
            dailyWorkedHours: value === "P" ? 8 : value === "H" ? 4 : 0,
            workedHours:
                value !== "A"
                    ? [
                        {
                            id: `clockin_${day}`,
                            timestamp: dayjs(
                                `2024-${String(new Date().getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")} 08:00`,
                            ).format("YYYY-MM-DD HH:mm:ss"),
                            type: "Clock In",
                            hour: "08:00",
                        },
                        {
                            id: `clockout_${day}`,
                            timestamp: dayjs(
                                `2024-${String(new Date().getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")} ${value === "H" ? "12:00" : "16:00"}`,
                            ).format("YYYY-MM-DD HH:mm:ss"),
                            type: "Clock Out",
                            hour: value === "H" ? "12:00" : "16:00",
                        },
                    ]
                    : [],
        });
    }

    return dailyAttendance;
}

// Phase 13: Resolve all references
async function resolveAllReferences(
    createdEntities: CreatedEntities,
    ids: {
        locationIds: string[];
        shiftHourIds: string[];
        shiftTypeIds: string[];
        positionIds: string[];
        departmentIds: string[];
        sectionIds: string[];
        employeeIds: string[];
        periodicOptionIds: string[];
        monitoringPeriodIds: string[];
    },
) {
    console.log("🔗 Resolving all references...");

    const updatePromises: Promise<any>[] = [];

    // Update departments with real manager UIDs
    updatePromises.push(
        adminHrSettingsUpdate("departmentSettings", ids.departmentIds[0], {
            manager: ids.employeeIds[1], // Sarah Johnson (Manager)
        }),
    );

    updatePromises.push(
        adminHrSettingsUpdate("departmentSettings", ids.departmentIds[1], {
            manager: ids.employeeIds[2], // David Wilson (HR Manager)
        }),
    );

    // Update sections with real supervisor UIDs and department IDs
    updatePromises.push(
        adminHrSettingsUpdate("sectionSettings", ids.sectionIds[0], {
            department: ids.departmentIds[0], // Engineering
            supervisor: ids.employeeIds[1], // Sarah Johnson (Manager)
        }),
    );

    updatePromises.push(
        adminHrSettingsUpdate("sectionSettings", ids.sectionIds[1], {
            department: ids.departmentIds[1], // Human Resources
            supervisor: ids.employeeIds[2], // David Wilson (HR Manager)
        }),
    );

    // Update employees with real department and section IDs
    for (let i = 0; i < ids.employeeIds.length; i++) {
        const employeeRef = admin.firestore().collection("employee").doc(ids.employeeIds[i]);

        if (i === 0) {
            // John Doe - Backend Development
            updatePromises.push(
                employeeRef.update({
                    department: ids.departmentIds[0], // Engineering
                    section: ids.sectionIds[0], // Backend Development
                    reportingLineManager: ids.employeeIds[1], // Sarah Johnson
                }),
            );
        } else if (i === 1) {
            // Sarah Johnson - Backend Development (Manager)
            updatePromises.push(
                employeeRef.update({
                    department: ids.departmentIds[0], // Engineering
                    section: ids.sectionIds[0], // Backend Development
                }),
            );
        } else if (i === 2) {
            // David Wilson - HR Administration
            updatePromises.push(
                employeeRef.update({
                    department: ids.departmentIds[1], // Human Resources
                    section: ids.sectionIds[1], // HR Administration
                }),
            );
        } else if (i === 3) {
            // Emily Chen - Backend Development (CTO)
            updatePromises.push(
                employeeRef.update({
                    department: ids.departmentIds[0], // Engineering
                    section: ids.sectionIds[0], // Backend Development
                }),
            );
        }
    }

    await Promise.all(updatePromises);
    console.log("✅ All references resolved successfully");
}
