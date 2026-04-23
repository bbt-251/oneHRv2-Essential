import { NextResponse } from "next/server";

export class ManualApiError extends Error {
    status: number;
    code: string;
    details?: unknown;

    constructor(status: number, code: string, message: string, details?: unknown) {
        super(message);
        this.name = "ManualApiError";
        this.status = status;
        this.code = code;
        this.details = details;
    }
}

export const toErrorResponse = (error: unknown): NextResponse => {
    if (error instanceof ManualApiError) {
        return NextResponse.json(
            {
                error: {
                    code: error.code,
                    message: error.message,
                    details: error.details ?? null,
                },
            },
            { status: error.status },
        );
    }

    return NextResponse.json(
        {
            error: {
                code: "INTERNAL_SERVER_ERROR",
                message: "Unexpected error while processing manual backend request.",
            },
        },
        { status: 500 },
    );
};
