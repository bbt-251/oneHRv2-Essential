import { NextRequest, NextResponse } from "next/server";
import { admin } from "@/lib/backend/firebase/admin";
import { EmployeeModel } from "@/lib/models/employee";

export async function POST(req: NextRequest) {
    try {
        const data: Omit<EmployeeModel, "id"> = await req.json();

        // Get Firestore instance from admin SDK
        const db = admin.firestore();

        // Create a new document reference
        const docRef = db.collection("employee").doc();

        // Create employee document with the generated ID
        await docRef.set({
            ...data,
            id: docRef.id,
        });

        return NextResponse.json(
            {
                success: true,
                employeeId: docRef.id,
                message: "Employee created successfully",
            },
            { status: 201 },
        );
    } catch (err: any) {
        return NextResponse.json(
            { success: false, message: err.message || "Error creating employee" },
            { status: 500 },
        );
    }
}
