import { authorizeRequest } from "@/lib/server/shared/auth/authorization";
import { ManualApiError } from "@/lib/server/shared/errors";
import { SessionClaims } from "@/lib/server/shared/types";
import { getCurrentInstanceKey } from "@/lib/server/shared/config";
import { serviceSuccess } from "@/lib/server/shared/result";
import { ProjectServerRepository } from "@/lib/server/projects/project.repository";
import { ProjectListPayload, ProjectRecordPayload } from "@/lib/server/projects/project.types";

export class ProjectService {
    static async list(filters: Record<string, unknown>, session: SessionClaims | null) {
        const instanceKey = getCurrentInstanceKey();
        const authorizedSession = authorizeRequest({
            session,
            instanceKey,
            resource: "projects",
            action: "read",
        });

        const data = await ProjectServerRepository.list(filters, instanceKey, authorizedSession);
        return serviceSuccess<ProjectListPayload>(
            "Projects loaded successfully.",
            data as ProjectListPayload,
        );
    }

    static async updateAllocations(
        id: string,
        payload: Record<string, unknown>,
        session: SessionClaims | null,
    ) {
        const instanceKey = getCurrentInstanceKey();
        authorizeRequest({
            session,
            instanceKey,
            resource: "projects",
            action: "update",
        });

        const ownerUid = ProjectServerRepository.resolveOwnerUid(payload);
        if (session?.roles.includes("Employee") && ownerUid && ownerUid !== session.uid) {
            throw new ManualApiError(
                403,
                "PROJECT_ALLOCATION_FORBIDDEN",
                "Employees can only update their own project allocations.",
            );
        }

        const data = await ProjectServerRepository.updateAllocations(
            ProjectServerRepository.parseUpdateInput(id, payload),
            instanceKey,
        );

        return serviceSuccess<ProjectRecordPayload>(
            "Project allocations updated successfully.",
            data as ProjectRecordPayload,
        );
    }
}
