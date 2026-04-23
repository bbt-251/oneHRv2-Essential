import { buildBackendUrl } from "@/lib/shared/config";
import { ProjectAllocationModel, ProjectModel } from "@/lib/models/project";
import {
    RepositoryResult,
    repositoryFailure,
    repositorySuccess,
} from "@/lib/repository/shared/result";

type BackendErrorShape = {
    error?:
        | string
        | {
              code?: string;
              message?: string;
              details?: unknown;
          };
};

export interface ProjectAllocationUpdate {
    id: string;
    uid: string;
    employeeAllocations: ProjectAllocationModel[];
}

const parseError = (payload: BackendErrorShape, fallback: string) => {
    if (typeof payload.error === "string" && payload.error.trim()) {
        return { message: payload.error, code: undefined, details: undefined };
    }

    if (payload.error && typeof payload.error === "object") {
        return {
            message: payload.error.message || fallback,
            code: payload.error.code,
            details: payload.error.details,
        };
    }

    return { message: fallback, code: undefined, details: undefined };
};

export class ProjectRepository {
    static async updateProjectAllocation(
        update: ProjectAllocationUpdate,
    ): Promise<RepositoryResult<ProjectModel | null>> {
        try {
            const response = await fetch(buildBackendUrl("/api/projects"), {
                method: "PATCH",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    id: update.id,
                    payload: {
                        uid: update.uid,
                        employeeAllocations: update.employeeAllocations,
                    },
                }),
            });

            const data = (await response.json().catch(() => ({}))) as Record<string, unknown> &
                BackendErrorShape;

            if (!response.ok) {
                const error = parseError(data, "Failed to update project allocations.");
                return repositoryFailure(error.message, {
                    code: error.code,
                    details: error.details,
                });
            }

            return repositorySuccess(
                typeof data.message === "string"
                    ? data.message
                    : "Project allocations updated successfully.",
                (data.project as ProjectModel | null | undefined) ?? null,
            );
        } catch (error) {
            return repositoryFailure(
                error instanceof Error ? error.message : "Project request failed unexpectedly.",
            );
        }
    }

    static async updateProjectAllocations(
        updates: ProjectAllocationUpdate[],
    ): Promise<RepositoryResult<ProjectModel[]>> {
        const results = await Promise.all(
            updates.map(update => this.updateProjectAllocation(update)),
        );
        const failure = results.find(result => !result.success);

        if (failure && !failure.success) {
            return failure;
        }

        return repositorySuccess(
            "Project allocations updated successfully.",
            results
                .filter(
                    (result): result is Extract<typeof result, { success: true }> => result.success,
                )
                .map(result => result.data)
                .filter((project): project is ProjectModel => project !== null),
        );
    }
}
