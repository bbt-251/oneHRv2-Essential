import { promises as fs } from "fs";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import { manualEnv } from "@/lib/backend/core/env";
import { verifyStorageToken } from "@/lib/backend/storage/signing";

const STORAGE_ROOT = path.resolve(process.cwd(), manualEnv.storageRoot);

const resolveStoragePath = (relativePath: string): string =>
    path.join(STORAGE_ROOT, relativePath.split("/").join(path.sep));

export async function PUT(request: NextRequest) {
    try {
        const token = request.nextUrl.searchParams.get("token");
        if (!token) {
            return new NextResponse("Missing storage token.", { status: 400 });
        }

        const payload = verifyStorageToken(token, "upload");
        const filePath = resolveStoragePath(payload.path);

        await fs.mkdir(path.dirname(filePath), { recursive: true });
        const bytes = await request.arrayBuffer();
        await fs.writeFile(filePath, Buffer.from(bytes));

        return new NextResponse(null, { status: 204 });
    } catch (error) {
        return NextResponse.json(
            { message: error instanceof Error ? error.message : "Upload failed." },
            { status: 401 },
        );
    }
}

export async function GET(request: NextRequest) {
    try {
        const token = request.nextUrl.searchParams.get("token");
        if (!token) {
            return new NextResponse("Missing storage token.", { status: 400 });
        }

        const payload = verifyStorageToken(token, "download");
        const filePath = resolveStoragePath(payload.path);
        const fileBuffer = await fs.readFile(filePath);

        return new NextResponse(fileBuffer, {
            status: 200,
            headers: {
                "Content-Type": "application/octet-stream",
                "Cache-Control": "private, max-age=60",
            },
        });
    } catch (error) {
        return NextResponse.json(
            { message: error instanceof Error ? error.message : "Download failed." },
            { status: 404 },
        );
    }
}
