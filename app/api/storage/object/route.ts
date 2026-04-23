import { promises as fs } from "fs";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import { manualEnv } from "@/lib/server/shared/env";
import { verifyStorageToken } from "@/lib/server/shared/storage/signing";

const DEFAULT_STORAGE_ROOT = path.resolve(".manual-storage");

const getStorageRoot = (): string => {
    const configuredRoot = manualEnv.storageRoot.trim();

    if (!configuredRoot || configuredRoot === ".manual-storage") {
        return DEFAULT_STORAGE_ROOT;
    }

    if (path.isAbsolute(configuredRoot)) {
        return configuredRoot;
    }

    const normalizedRoot = configuredRoot.replaceAll("\\", "/");
    if (normalizedRoot.startsWith(".manual-storage/")) {
        const relativeSuffix = normalizedRoot.slice(".manual-storage/".length);
        return path.join(DEFAULT_STORAGE_ROOT, relativeSuffix.split("/").join(path.sep));
    }

    throw new Error(
        "Relative MANUAL_STORAGE_ROOT must be inside .manual-storage or be an absolute path.",
    );
};

const resolveStoragePath = (relativePath: string): string =>
    path.join(getStorageRoot(), relativePath.split("/").join(path.sep));

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
        await fs.writeFile(filePath, new Uint8Array(bytes));

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
