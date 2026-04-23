import { ZodType } from "zod";
import { ManualApiError } from "@/lib/server/shared/errors";

export const validatePayload = <T>(schema: ZodType<T>, payload: unknown): T => {
    const parsed = schema.safeParse(payload);

    if (!parsed.success) {
        throw new ManualApiError(400, "VALIDATION_ERROR", "Request validation failed.", {
            issues: parsed.error.issues.map(issue => ({
                path: issue.path.join("."),
                message: issue.message,
            })),
        });
    }

    return parsed.data;
};
