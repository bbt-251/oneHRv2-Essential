import { buildMigrationMetadata } from "@/lib/backend/manual/migration/metadata";
import {
    coreEmployeeSchema,
    coreRoleAssignmentSchema,
    type CoreEmployee,
    type CoreRoleAssignment,
    type FirestoreExportDocument,
} from "@/lib/backend/manual/migration/types";

const asString = (value: unknown): string | undefined => (typeof value === "string" && value.trim() ? value : undefined);

const asStringArray = (value: unknown): string[] => {
    if (!Array.isArray(value)) {
        return [];
    }

    return value.map((entry) => asString(entry)).filter((entry): entry is string => Boolean(entry));
};

export const mapEmployeeDocument = (document: FirestoreExportDocument, tenantId: string): CoreEmployee => {
    const payload = {
        tenantId,
        uid: asString(document.fields.uid) ?? document.id,
        firstName: asString(document.fields.firstName) ?? "Unknown",
        surname: asString(document.fields.surname) ?? "Unknown",
        personalEmail: asString(document.fields.personalEmail),
        managerUid: asString(document.fields.managerUid),
        roles: asStringArray(document.fields.roles),
        migration: buildMigrationMetadata(document.id, document.fields),
    };

    return coreEmployeeSchema.parse(payload);
};

export const mapRoleAssignmentDocument = (document: FirestoreExportDocument, tenantId: string): CoreRoleAssignment => {
    const roles = asStringArray(document.fields.roles);
    const payload = {
        tenantId,
        uid: asString(document.fields.uid) ?? document.id,
        roles: roles.length ? roles : ["Employee"],
        migration: buildMigrationMetadata(document.id, document.fields),
    };

    return coreRoleAssignmentSchema.parse(payload);
};
