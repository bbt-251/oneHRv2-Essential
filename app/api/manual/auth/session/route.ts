import { NextResponse } from "next/server";
import { readManualSession } from "@/lib/backend/manual/auth-session";

export async function GET() {
  const session = await readManualSession();

  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 200 });
  }

  return NextResponse.json({
    authenticated: true,
    user: {
      uid: session.uid,
      email: session.email,
      roles: session.roles,
      tenantId: session.tenantId,
    },
  });
}
