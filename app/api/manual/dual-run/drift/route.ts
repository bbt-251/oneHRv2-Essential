import { NextRequest, NextResponse } from "next/server";
import { readManualSession } from "@/lib/backend/manual/auth-session";
import { ManualApiError, toErrorResponse } from "@/lib/backend/manual/errors";
import { phase8DriftTracker } from "@/lib/backend/manual/phase-8-state";

const assertDualRunAccess = async (): Promise<void> => {
    const session = await readManualSession();

    if (!session) {
        throw new ManualApiError(401, "UNAUTHORIZED", "Authentication is required");
    }

    if (!session.roles.includes("HR Manager")) {
        throw new ManualApiError(
            403,
            "FORBIDDEN",
            "Only HR Manager can access dual-run drift reports",
        );
    }
};

export async function GET(request: NextRequest) {
    try {
        await assertDualRunAccess();

        const limitParam = request.nextUrl.searchParams.get("limit");
        const limit = Number(limitParam ?? "50");

        return NextResponse.json({
            summary: phase8DriftTracker.getSummary(),
            recent: phase8DriftTracker.getRecent(Number.isFinite(limit) ? limit : 50),
        });
    } catch (error) {
        return toErrorResponse(error);
    }
}

export async function POST(request: NextRequest) {
    try {
        await assertDualRunAccess();

        const body = (await request.json()) as {
      entity: "employee" | "attendance" | "leave" | "payroll" | "compensation";
      operation: "read" | "write";
      matched: boolean;
      mismatchCount: number;
      mismatchPaths?: string[];
    };

        if (!body.entity || !body.operation || typeof body.matched !== "boolean") {
            throw new ManualApiError(400, "INVALID_REQUEST", "Malformed drift observation payload");
        }

        phase8DriftTracker.record({
            entity: body.entity,
            operation: body.operation,
            matched: body.matched,
            mismatchCount: Number.isFinite(body.mismatchCount)
                ? Math.max(0, body.mismatchCount)
                : 0,
            mismatchPaths: body.mismatchPaths ?? [],
            timestamp: new Date().toISOString(),
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        return toErrorResponse(error);
    }
}
