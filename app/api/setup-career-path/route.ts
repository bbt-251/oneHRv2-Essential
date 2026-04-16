import { NextRequest, NextResponse } from "next/server";
import { admin } from "@/lib/backend/firebase/admin";
import dayjs from "dayjs";

// Use Admin SDK for seeding operations
const adminDb = admin.firestore();

interface SeedingResult {
    success: boolean;
    message: string;
    data?: {
        tracks: string[];
        roles: string[];
        summary: {
            totalTracks: number;
            totalRoles: number;
            duration: number;
        };
    };
    error?: string;
}

// Helper to get existing competencies and positions from hrSettings
async function getExistingHrSettings(): Promise<{
    competenceIds: string[];
    positionIds: string[];
    gradeIds: string[];
}> {
    const competenceIds: string[] = [];
    const positionIds: string[] = [];
    const gradeIds: string[] = [];

    try {
        // Get competencies
        const competenciesSnapshot = await adminDb
            .collection("hrSettings")
            .doc("main")
            .collection("competencies")
            .get();

        competenciesSnapshot.docs.forEach(doc => {
            competenceIds.push(doc.id);
        });

        // Get positions
        const positionsSnapshot = await adminDb
            .collection("hrSettings")
            .doc("main")
            .collection("positions")
            .get();

        positionsSnapshot.docs.forEach(doc => {
            positionIds.push(doc.id);
        });

        // Get grades
        const gradesSnapshot = await adminDb
            .collection("hrSettings")
            .doc("main")
            .collection("grades")
            .get();

        gradesSnapshot.docs.forEach(doc => {
            gradeIds.push(doc.id);
        });

        console.log(
            `📊 Found existing hrSettings: ${competenceIds.length} competencies, ${positionIds.length} positions, ${gradeIds.length} grades`,
        );
    } catch (error) {
        console.warn("⚠️ Error fetching existing hrSettings:", error);
    }

    return { competenceIds, positionIds, gradeIds };
}

// Clear existing career path data
async function clearExistingCareerPathData() {
    console.log("🗑️ Clearing existing career path data...");

    const batch = adminDb.batch();

    // Clear tracks collection
    const tracksSnapshot = await adminDb.collection("track").get();
    tracksSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
    });

    // Clear roles collection
    const rolesSnapshot = await adminDb.collection("role").get();
    rolesSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
    });

    await batch.commit();
    console.log("✅ Existing career path data cleared");
}

// Create tracks
async function createTracks(
    competenceIds: string[],
    positionIds: string[],
): Promise<{ trackIds: string[]; trackData: any[] }> {
    const tracks = [
        {
            name: "Engineering",
            description: "Technical engineering career path for software developers and engineers",
            color: "#3B82F6", // Blue
            entryRoles: positionIds[0] ? [positionIds[0]] : [], // First position (Software Engineer)
            exitRoles: positionIds[1] ? [positionIds[1]] : [], // Second position (Senior)
            keySkills: competenceIds.slice(0, 2), // First 2 competencies
            careerLevels: ["Entry", "Junior", "Mid", "Senior", "Lead", "Manager", "Director"],
            timestamp: dayjs().format("YYYY-MM-DD HH:mm:ss"),
        },
        {
            name: "Product Management",
            description: "Career path for product managers and product owners",
            color: "#8B5CF6", // Purple
            entryRoles: positionIds[0] ? [positionIds[0]] : [],
            exitRoles: positionIds[1] ? [positionIds[1]] : [],
            keySkills: competenceIds.slice(1, 3), // Leadership, Communication
            careerLevels: ["Entry", "Junior", "Mid", "Senior", "Lead", "Manager", "Director"],
            timestamp: dayjs().format("YYYY-MM-DD HH:mm:ss"),
        },
        {
            name: "Design",
            description: "Career path for UX/UI designers and creative professionals",
            color: "#EC4899", // Pink
            entryRoles: positionIds[0] ? [positionIds[0]] : [],
            exitRoles: positionIds[1] ? [positionIds[1]] : [],
            keySkills: competenceIds.slice(0, 3), // All competencies
            careerLevels: ["Entry", "Junior", "Mid", "Senior", "Lead", "Manager", "Director"],
            timestamp: dayjs().format("YYYY-MM-DD HH:mm:ss"),
        },
        {
            name: "Data Science",
            description:
                "Career path for data analysts, scientists, and machine learning engineers",
            color: "#10B981", // Green
            entryRoles: positionIds[0] ? [positionIds[0]] : [],
            exitRoles: positionIds[1] ? [positionIds[1]] : [],
            keySkills: competenceIds.slice(0, 2),
            careerLevels: ["Entry", "Junior", "Mid", "Senior", "Lead", "Manager", "Director"],
            timestamp: dayjs().format("YYYY-MM-DD HH:mm:ss"),
        },
    ];

    const trackIds: string[] = [];
    const batch = adminDb.batch();

    tracks.forEach(track => {
        const docRef = adminDb.collection("track").doc();
        trackIds.push(docRef.id);
        batch.set(docRef, track);
    });

    await batch.commit();
    console.log(`✅ Created ${trackIds.length} tracks`);

    return { trackIds, trackData: tracks };
}

// Create roles for a track
async function createRoles(
    trackId: string,
    trackName: string,
    positionIds: string[],
    competenceIds: string[],
    gradeIds: string[],
): Promise<{ roleIds: string[]; roles: any[] }> {
    const roles: any[] = [];
    const careerLevels = ["Entry", "Junior", "Mid", "Senior", "Lead", "Manager", "Director"];

    // First pass: create roles without linking (we need their IDs first)
    careerLevels.forEach((level, index) => {
        roles.push({
            roleTitle: positionIds[index % positionIds.length] || null,
            track: trackId,
            level: level,
            requiredSkills: competenceIds.slice(0, Math.min(index + 1, competenceIds.length)),
            requiredCourses: [],
            prerequisiteRoles: null, // Will be updated after we have role IDs
            potentialSuccessorRoles: null, // Will be updated after we have role IDs
            estimatedTime: index < 2 ? "6-12 months" : index < 4 ? "1-2 years" : "2-3 years",
            timestamp: dayjs().format("YYYY-MM-DD HH:mm:ss"),
        });
    });

    // Create all roles first to get their IDs
    const roleIds: string[] = [];
    const batch = adminDb.batch();

    roles.forEach(role => {
        const docRef = adminDb.collection("role").doc();
        roleIds.push(docRef.id);
        batch.set(docRef, {
            ...role,
            id: docRef.id,
        });
    });

    await batch.commit();
    console.log(`✅ Created ${roleIds.length} roles for track: ${trackName}`);

    // Second pass: Update prerequisiteRoles and potentialSuccessorRoles with actual role IDs
    const updateBatch = adminDb.batch();
    for (let i = 0; i < roleIds.length; i++) {
        const roleRef = adminDb.collection("role").doc(roleIds[i]);

        const prerequisiteRoles = i > 0 ? [roleIds[i - 1]] : null; // Previous role
        const potentialSuccessorRoles = i < roleIds.length - 1 ? [roleIds[i + 1]] : null; // Next role

        updateBatch.update(roleRef, {
            prerequisiteRoles,
            potentialSuccessorRoles,
            timestamp: dayjs().format("YYYY-MM-DD HH:mm:ss"),
        });
    }

    await updateBatch.commit();
    console.log(`✅ Linked ${roleIds.length} roles together for track: ${trackName}`);

    return { roleIds, roles };
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
            console.log("ℹ️ Empty or malformed JSON body received, using defaults");
            body = {};
        }

        const { clearExisting = false } = body;

        console.log("🚀 Starting career path data seeding...", { clearExisting });

        // Phase 1: Clear existing data if requested
        if (clearExisting) {
            await clearExistingCareerPathData();
        }

        // Phase 2: Get existing hrSettings (competencies, positions, grades)
        console.log("📊 Phase 1: Fetching existing hrSettings...");
        const { competenceIds, positionIds, gradeIds } = await getExistingHrSettings();

        // If no competencies or positions exist, create some default ones
        let finalCompetenceIds = competenceIds;
        let finalPositionIds = positionIds;

        if (competenceIds.length === 0) {
            console.log("⚠️ No competencies found, creating defaults...");
            const compBatch = adminDb.batch();
            const defaultCompetencies = [
                { competenceName: "Technical Skills", competenceType: "Technical", active: "Yes" },
                { competenceName: "Leadership", competenceType: "Behavioral", active: "Yes" },
                { competenceName: "Communication", competenceType: "Behavioral", active: "Yes" },
            ];

            defaultCompetencies.forEach(comp => {
                const docRef = adminDb
                    .collection("hrSettings")
                    .doc("main")
                    .collection("competencies")
                    .doc();
                finalCompetenceIds.push(docRef.id);
                compBatch.set(docRef, {
                    ...comp,
                    createdAt: dayjs().format("YYYY-MM-DD HH:mm:ss"),
                    updatedAt: dayjs().format("YYYY-MM-DD HH:mm:ss"),
                });
            });

            await compBatch.commit();
            console.log(`✅ Created ${defaultCompetencies.length} default competencies`);
        }

        if (positionIds.length === 0) {
            console.log("⚠️ No positions found, creating defaults...");
            const posBatch = adminDb.batch();
            const defaultPositions = [
                {
                    name: "Junior Software Engineer",
                    startDate: "2024-01-01",
                    endDate: "2024-12-31",
                    positionDescription: "Entry level software developer",
                    additionalInformation: "Full-stack development",
                    band: "Technical",
                    grade: gradeIds[0] || null,
                    active: "Yes",
                    critical: "No",
                    keys: [],
                    step: "1",
                    companyProfile: null,
                    companyProfileUsed: false,
                    competencies: finalCompetenceIds.slice(0, 2),
                    createdAt: dayjs().format("YYYY-MM-DD HH:mm:ss"),
                    updatedAt: dayjs().format("YYYY-MM-DD HH:mm:ss"),
                },
                {
                    name: "Senior Software Engineer",
                    startDate: "2024-01-01",
                    endDate: "2024-12-31",
                    positionDescription: "Senior level software developer",
                    additionalInformation: "Technical leadership",
                    band: "Technical",
                    grade: gradeIds[1] || null,
                    active: "Yes",
                    critical: "Yes",
                    keys: [],
                    step: "2",
                    companyProfile: null,
                    companyProfileUsed: false,
                    competencies: finalCompetenceIds,
                    createdAt: dayjs().format("YYYY-MM-DD HH:mm:ss"),
                    updatedAt: dayjs().format("YYYY-MM-DD HH:mm:ss"),
                },
            ];

            defaultPositions.forEach(pos => {
                const docRef = adminDb
                    .collection("hrSettings")
                    .doc("main")
                    .collection("positions")
                    .doc();
                finalPositionIds.push(docRef.id);
                posBatch.set(docRef, pos);
            });

            await posBatch.commit();
            console.log(`✅ Created ${defaultPositions.length} default positions`);
        }

        // Phase 3: Create tracks
        console.log("📈 Phase 2: Creating tracks...");
        const { trackIds } = await createTracks(finalCompetenceIds, finalPositionIds);

        // Phase 4: Create roles for each track
        console.log("👥 Phase 3: Creating roles...");
        const allRoleIds: string[] = [];

        for (let i = 0; i < trackIds.length; i++) {
            const trackName =
                ["Engineering", "Product Management", "Design", "Data Science"][i] ||
                `Track ${i + 1}`;
            const { roleIds } = await createRoles(
                trackIds[i],
                trackName,
                finalPositionIds,
                finalCompetenceIds,
                gradeIds,
            );
            allRoleIds.push(...roleIds);
        }

        const duration = Date.now() - startTime;

        console.log("✅ Career path data seeding completed successfully!");

        return NextResponse.json(
            {
                success: true,
                message: "Career path data seeded successfully with dummy data",
                data: {
                    tracks: trackIds,
                    roles: allRoleIds,
                    summary: {
                        totalTracks: trackIds.length,
                        totalRoles: allRoleIds.length,
                        duration,
                    },
                },
            } as SeedingResult,
            { status: 200 },
        );
    } catch (error: any) {
        console.error("❌ Career path data seeding failed:", error);

        const duration = Date.now() - startTime;

        return NextResponse.json(
            {
                success: false,
                message: "Career path data seeding failed",
                error: error.message || "Unknown error occurred",
                data: {
                    tracks: [],
                    roles: [],
                    summary: {
                        totalTracks: 0,
                        totalRoles: 0,
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

// GET handler to fetch current career path data status
export async function GET(req: NextRequest) {
    try {
        // Get track count
        const tracksSnapshot = await adminDb.collection("track").get();
        const tracks = tracksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Get role count
        const rolesSnapshot = await adminDb.collection("role").get();
        const roles = rolesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Get hrSettings references
        const { competenceIds, positionIds, gradeIds } = await getExistingHrSettings();

        return NextResponse.json(
            {
                success: true,
                data: {
                    tracks: tracks,
                    roles: roles,
                    hrSettings: {
                        competencies: competenceIds.length,
                        positions: positionIds.length,
                        grades: gradeIds.length,
                    },
                    summary: {
                        totalTracks: tracks.length,
                        totalRoles: roles.length,
                    },
                },
            },
            { status: 200 },
        );
    } catch (error: any) {
        console.error("❌ Failed to fetch career path data:", error);
        return NextResponse.json(
            {
                success: false,
                error: error.message || "Failed to fetch career path data",
            },
            { status: 500 },
        );
    }
}
