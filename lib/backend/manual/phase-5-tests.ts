import assert from "node:assert/strict";
import { evaluatePolicy } from "@/lib/backend/manual/policy-evaluator";
import {
    buildObjectKey,
    createSignedDownload,
    createSignedUpload,
    getStorageMetadata,
    migrateFirebaseStorageExport,
    parseFirebaseStorageExport,
} from "@/lib/backend/manual/storage";
import { ManualApiError } from "@/lib/backend/manual/errors";

const run = async (): Promise<void> => {
    const objectKey = buildObjectKey({
        tenantId: "tenant-alpha",
        module: "employee-documents",
        ownerUid: "employee-001",
        originalFilename: "Payslip March 2026.PDF",
    });

    assert.match(
        objectKey,
        /^tenant-alpha\/employee-documents\/employee-001\//,
        "Object key should follow tenant/module/owner prefix convention",
    );

    const uploadResult = createSignedUpload({
        tenantId: "tenant-alpha",
        ownerUid: "employee-001",
        originalFilename: "passport.png",
        mimeType: "image/png",
        sizeBytes: 2048,
        sha256: "a".repeat(64),
        linkage: {
            module: "employee-profile",
            entityId: "employee-001",
            field: "avatar",
        },
    });

    assert.equal(uploadResult.signedUpload.method, "PUT", "Upload endpoint should return PUT method");
    assert.ok(uploadResult.signedUpload.uploadUrl.includes("op=upload"), "Upload URL must be signed for upload operation");

    const persisted = getStorageMetadata(uploadResult.metadata.objectKey);
    assert.ok(persisted, "Upload metadata should be persisted for later access control checks");

    const download = createSignedDownload({ objectKey: uploadResult.metadata.objectKey });
    assert.equal(download.method, "GET", "Download descriptor should use GET method");
    assert.ok(download.downloadUrl.includes("op=download"), "Download URL must be signed for download operation");

    const employeeSession = {
        uid: "employee-002",
        email: "employee2@example.com",
        roles: ["Employee"] as const,
        tenantId: "tenant-alpha",
    };

    const canReadOtherEmployeeFile = evaluatePolicy({
        session: {
            ...employeeSession,
            roles: ["Employee"],
        },
        resource: "storage",
        action: "read",
        resourceOwnerUid: "employee-001",
        tenantId: "tenant-alpha",
    });
    assert.equal(canReadOtherEmployeeFile, false, "Employee should not read another employee storage object");

    const canReadOwnFile = evaluatePolicy({
        session: {
            ...employeeSession,
            uid: "employee-001",
            roles: ["Employee"],
        },
        resource: "storage",
        action: "read",
        resourceOwnerUid: "employee-001",
        tenantId: "tenant-alpha",
    });
    assert.equal(canReadOwnFile, true, "Employee should read own storage object");

    const parsedExport = parseFirebaseStorageExport({
        objects: [
            {
                path: "employee-docs/employee-001/passport.png",
                name: "passport.png",
                contentType: "image/png",
                size: 4096,
                md5Hash: "migrated-md5",
            },
        ],
    });

    const migrated = migrateFirebaseStorageExport({
        tenantId: "tenant-alpha",
        exportObjects: parsedExport,
        defaultOwnerUid: "employee-001",
    });

    assert.equal(migrated.length, 1, "Migration utility should produce metadata for each exported object");
    assert.equal(migrated[0].legacyPath, "employee-docs/employee-001/passport.png", "Migration utility should persist legacy path linkage");
    assert.ok(migrated[0].migration?.legacyId, "Migration utility should attach migration metadata");

    let mimeError: unknown;
    try {
        createSignedUpload({
            tenantId: "tenant-alpha",
            ownerUid: "employee-001",
            originalFilename: "payload.exe",
            mimeType: "application/x-msdownload",
            sizeBytes: 100,
            sha256: "b".repeat(64),
            linkage: {
                module: "employee-profile",
            },
        });
    } catch (error) {
        mimeError = error;
    }

    assert.ok(mimeError instanceof ManualApiError, "Unsupported MIME type should throw ManualApiError");
    assert.equal((mimeError as ManualApiError).status, 415, "Unsupported MIME type should map to 415 status");

    console.log("Manual backend Phase 5 tests passed.");
};

void run();
