import crypto from "crypto";
import path from "path";

const STORAGE_TOKEN_TTL_SECONDS = 15 * 60;

interface StorageTokenPayload {
  path: string;
  operation: "upload" | "download";
  exp: number;
}

const getStorageSigningSecret = (): string =>
    process.env.MANUAL_AUTH_JWT_SECRET ||
  process.env.NEXTAUTH_SECRET ||
  "onehr-manual-storage-dev";

const base64UrlEncode = (input: Buffer | string): string =>
    Buffer.from(input)
        .toString("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/g, "");

const base64UrlDecode = (input: string): Buffer => {
    const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
    const padding =
    normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));
    return Buffer.from(`${normalized}${padding}`, "base64");
};

const normalizeStoragePath = (inputPath: string): string => {
    const normalized = inputPath.replace(/^\/+/, "");
    if (!normalized) {
        throw new Error("Storage path is required.");
    }

    const resolved = path.posix.normalize(normalized);
    if (resolved.startsWith("../") || resolved.includes("..")) {
        throw new Error("Invalid storage path.");
    }

    return resolved;
};

export const createStorageToken = (
    inputPath: string,
    operation: "upload" | "download",
): string => {
    const payload: StorageTokenPayload = {
        path: normalizeStoragePath(inputPath),
        operation,
        exp: Math.floor(Date.now() / 1000) + STORAGE_TOKEN_TTL_SECONDS,
    };

    const encodedPayload = base64UrlEncode(JSON.stringify(payload));
    const signature = crypto
        .createHmac("sha256", getStorageSigningSecret())
        .update(encodedPayload)
        .digest();

    return `${encodedPayload}.${base64UrlEncode(signature)}`;
};

export const verifyStorageToken = (
    token: string,
    expectedOperation: "upload" | "download",
): StorageTokenPayload => {
    const [encodedPayload, encodedSignature] = token.split(".");
    if (!encodedPayload || !encodedSignature) {
        throw new Error("Malformed storage token.");
    }

    const expectedSignature = crypto
        .createHmac("sha256", getStorageSigningSecret())
        .update(encodedPayload)
        .digest();
    const receivedSignature = base64UrlDecode(encodedSignature);

    if (!crypto.timingSafeEqual(expectedSignature, receivedSignature)) {
        throw new Error("Invalid storage token signature.");
    }

    const payload = JSON.parse(
        base64UrlDecode(encodedPayload).toString("utf8"),
    ) as StorageTokenPayload;
    if (payload.operation !== expectedOperation) {
        throw new Error("Unexpected storage token operation.");
    }

    if (payload.exp < Math.floor(Date.now() / 1000)) {
        throw new Error("Expired storage token.");
    }

    return {
        ...payload,
        path: normalizeStoragePath(payload.path),
    };
};
