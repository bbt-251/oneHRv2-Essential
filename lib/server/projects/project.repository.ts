import { Filter, ObjectId, WithId } from "mongodb";
import { ProjectAllocationModel, ProjectModel } from "@/lib/models/project";
import { ManualApiError } from "@/lib/server/shared/errors";
import { SessionClaims } from "@/lib/server/shared/types";
import { getMongoCollection } from "@/lib/server/shared/db/mongo";
import { publishRealtimeResource } from "@/lib/server/shared/realtime/publish";
import {
    filterDocumentsForSession,
    readString,
    requirePayload,
    toRecord,
} from "@/lib/server/shared/service-helpers";
import { UpdateProjectAllocationInput } from "@/lib/server/projects/project.types";

interface ProjectDocument extends Omit<ProjectModel, "id"> {
    _id: string;
}

const collectionName = "projects";

const normalizeAllocations = (value: unknown): ProjectAllocationModel[] =>
    Array.isArray(value)
        ? value
            .map(entry => {
                const record = toRecord(entry);
                const uid = readString(record.uid);
                const allocation = Number(record.allocation);

                if (!uid || !Number.isFinite(allocation)) {
                    return null;
                }

                return { uid, allocation };
            })
            .filter((entry): entry is ProjectAllocationModel => entry !== null)
        : [];

const toModel = (document: WithId<ProjectDocument>): ProjectModel => ({
    id: document._id,
    name: document.name,
    assignedMembers: Array.isArray(document.assignedMembers) ? document.assignedMembers : [],
    employeeAllocations: normalizeAllocations(document.employeeAllocations),
});

const listAllProjects = async (): Promise<ProjectModel[]> => {
    const collection = await getMongoCollection<ProjectDocument>(collectionName);
    return (await collection.find({}).toArray()).map(toModel);
};

export class ProjectServerRepository {
    static async list(
        filters: Record<string, unknown> | undefined,
        instanceKey: string,
        session: SessionClaims,
    ): Promise<Record<string, unknown>> {
        const uid = readString(filters?.uid);
        const collection = await getMongoCollection<ProjectDocument>(collectionName);
        const query: Filter<ProjectDocument> = uid ? { assignedMembers: uid } : {};
        const projects = (await collection.find(query).toArray()).map(toModel);

        return {
            projects: filterDocumentsForSession(projects, "projects", instanceKey, session),
        };
    }

    static async updateAllocations(
        input: UpdateProjectAllocationInput,
        instanceKey: string,
    ): Promise<Record<string, unknown>> {
        const collection = await getMongoCollection<ProjectDocument>(collectionName);
        const project = await collection.findOne({ _id: input.id });

        if (!project) {
            throw new ManualApiError(404, "PROJECT_NOT_FOUND", "Project not found.");
        }

        const payloadUid = readString(input.uid);
        if (!payloadUid) {
            throw new ManualApiError(
                400,
                "PROJECT_ALLOCATION_UID_REQUIRED",
                "Project allocation updates must include the current user uid.",
            );
        }

        const nextAllocations = normalizeAllocations(input.employeeAllocations);
        const touchedAllocation = nextAllocations.find(allocation => allocation.uid === payloadUid);

        if (!touchedAllocation) {
            throw new ManualApiError(
                400,
                "PROJECT_ALLOCATION_REQUIRED",
                "Updated project allocations must include the current user.",
            );
        }

        const existingAllocations = normalizeAllocations(project.employeeAllocations).filter(
            allocation => allocation.uid !== payloadUid,
        );
        const updatedAllocations = [...existingAllocations, touchedAllocation];

        await collection.updateOne(
            { _id: input.id },
            {
                $set: {
                    employeeAllocations: updatedAllocations,
                },
            },
        );

        const updated = await collection.findOne({ _id: input.id });
        const updatedProject = updated ? toModel(updated) : null;

        await publishRealtimeResource({
            resource: "projects",
            resourceId: input.id,
            payload: await listAllProjects(),
            resourceOwnerUid: payloadUid,
            instanceKey,
        });

        return {
            project: updatedProject,
            projects: await listAllProjects(),
        };
    }

    static resolveOwnerUid(payload?: Record<string, unknown>): string | undefined {
        return readString(payload?.uid);
    }

    static requireTargetId(id?: string): string {
        if (!id) {
            throw new ManualApiError(400, "TARGET_ID_REQUIRED", "targetId is required.");
        }

        return id;
    }

    static async deleteByEmployeeUid(employeeUid: string): Promise<void> {
        const collection = await getMongoCollection<ProjectDocument>(collectionName);
        const projects = await collection
            .find({
                $or: [{ assignedMembers: employeeUid }, { "employeeAllocations.uid": employeeUid }],
            })
            .toArray();

        await Promise.all(
            projects.map(async project => {
                const assignedMembers = Array.isArray(project.assignedMembers)
                    ? project.assignedMembers.filter(uid => uid !== employeeUid)
                    : [];
                const employeeAllocations = normalizeAllocations(
                    project.employeeAllocations,
                ).filter(allocation => allocation.uid !== employeeUid);

                await collection.updateOne(
                    { _id: project._id },
                    {
                        $set: {
                            assignedMembers,
                            employeeAllocations,
                        },
                    },
                );
            }),
        );
    }

    static async seed(payload: Omit<ProjectModel, "id">): Promise<ProjectModel> {
        const collection = await getMongoCollection<ProjectDocument>(collectionName);
        const document: ProjectDocument = {
            _id: new ObjectId().toHexString(),
            name: payload.name,
            assignedMembers: payload.assignedMembers ?? [],
            employeeAllocations: payload.employeeAllocations ?? [],
        };
        await collection.insertOne(document);
        return toModel(document as WithId<ProjectDocument>);
    }

    static parseUpdateInput(
        id: string,
        payload: Record<string, unknown>,
    ): UpdateProjectAllocationInput {
        const input = requirePayload(payload);
        return {
            id,
            uid: readString(input.uid) ?? "",
            employeeAllocations: normalizeAllocations(input.employeeAllocations),
        };
    }
}
