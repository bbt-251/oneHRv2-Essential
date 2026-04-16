import { NextRequest, NextResponse } from "next/server";
import { admin } from "@/lib/backend/firebase/admin";
import { employeeAdminCollection } from "@/lib/backend/firebase/admin-collections";
import { computeHourlyWageSync } from "@/lib/backend/functions/payroll/calculateHourlyWage";

const DEFAULT_MONTHLY_HOURS = 173;
const BATCH_MAX = 450;

async function resolveMonthlyWorkingHours(): Promise<number> {
    const adminDb = admin.firestore();
    const snap = await adminDb
        .collection("hrSettings")
        .doc("main")
        .collection("payrollSettings")
        .limit(1)
        .get();

    if (snap.empty) return DEFAULT_MONTHLY_HOURS;

    const raw = snap.docs[0].data()?.monthlyWorkingHours;
    const n = Number(raw);
    if (!Number.isFinite(n) || n <= 0) return DEFAULT_MONTHLY_HOURS;
    return n;
}

function authorize(bodySecret: string | undefined): NextResponse | null {
    const envSecret = process.env.MIGRATE_HOURLY_WAGES_SECRET;

    if (envSecret) {
        if (bodySecret !== envSecret) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        return null;
    }

    if (process.env.NODE_ENV === "production") {
        return NextResponse.json(
            {
                error: "Set MIGRATE_HOURLY_WAGES_SECRET in the server environment to run this migration in production.",
            },
            { status: 403 },
        );
    }

    return null;
}

export async function POST(request: NextRequest) {
    let body: { secret?: string; monthlyWorkingHours?: number } = {};
    try {
        body = await request.json();
    } catch {
        body = {};
    }

    const denied = authorize(body.secret);
    if (denied) return denied;

    let monthlyWorkingHours = await resolveMonthlyWorkingHours();
    const override = body.monthlyWorkingHours;
    if (override != null) {
        const n = Number(override);
        if (Number.isFinite(n) && n > 0) {
            monthlyWorkingHours = n;
        }
    }
    const snapshot = await employeeAdminCollection.get();

    const adminDb = admin.firestore();
    let batch = adminDb.batch();
    let opCount = 0;
    let batches = 0;
    let updated = 0;
    let skipped = 0;

    for (const doc of snapshot.docs) {
        const data = doc.data();
        const salary = Number(data.salary ?? 0) ?? 0;
        const nextWage = computeHourlyWageSync(salary, monthlyWorkingHours);
        const roundedCurrent = Number(Number(data.hourlyWage ?? 0).toFixed(2));

        if (roundedCurrent === nextWage) {
            skipped++;
            continue;
        }

        batch.update(doc.ref, { hourlyWage: nextWage });
        opCount++;
        updated++;

        if (opCount >= BATCH_MAX) {
            await batch.commit();
            batches++;
            batch = adminDb.batch();
            opCount = 0;
        }
    }

    if (opCount > 0) {
        await batch.commit();
        batches++;
    }

    return NextResponse.json({
        success: true,
        monthlyWorkingHours,
        totalEmployees: snapshot.size,
        updated,
        skipped,
        batches,
    });
}
