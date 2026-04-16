import { deleteEmployeeCascade } from "@/lib/backend/api/employee-management/employee-delete-service";
import { getEmployeeByUid } from "@/lib/backend/api/employee-management/employee-management-service";
import { createLog } from "@/lib/backend/api/logCollection";
import { admin } from "@/lib/backend/firebase/admin";
import { LogInfo } from "@/lib/log-descriptions/employee-management";
import { getAuth } from "firebase/auth";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(request: NextRequest) {
    try {
        // Get the ID token from the Authorization header
        const authHeader = request.headers.get("Authorization");

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return NextResponse.json(
                { error: "Unauthorized - No authorization token provided" },
                { status: 401 },
            );
        }

        const idToken = authHeader.split("Bearer ")[1];

        // Verify the ID token using Firebase Admin SDK
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        const uid = decodedToken.uid;

        // Get the current user (who is performing the deletion)
        const currentUser = await getEmployeeByUid(uid, admin.firestore());

        if (!currentUser) {
            return NextResponse.json(
                { error: "Unauthorized - Employee record not found" },
                { status: 401 },
            );
        }

        // Check if user has HR Manager role or appropriate permissions
        const userRoles = currentUser.role || [];
        const hasHRRole =
            userRoles.includes("HR Manager") ||
            userRoles.includes("HR") ||
            userRoles.includes("Administrator") ||
            userRoles.includes("Admin") ||
            currentUser.managerPosition === true;

        if (!hasHRRole) {
            return NextResponse.json(
                { error: "Forbidden - Insufficient permissions to delete employees" },
                { status: 403 },
            );
        }

        // Get employee ID from request body
        const body = await request.json();
        const { employeeId } = body;

        if (!employeeId) {
            return NextResponse.json(
                { error: "Bad Request - Employee ID is required" },
                { status: 400 },
            );
        }

        // Get the employee to be deleted
        const employeeToDelete = await getEmployeeByUid(employeeId, admin.firestore());

        if (!employeeToDelete) {
            return NextResponse.json({ error: "Not Found - Employee not found" }, { status: 404 });
        }

        // Prevent self-deletion
        if (employeeToDelete.uid === currentUser.uid) {
            return NextResponse.json(
                { error: "Forbidden - Cannot delete your own account" },
                { status: 403 },
            );
        }

        // Create log entry for the deletion attempt
        const logInfo: LogInfo = {
            title: "Employee Deletion",
            description: `Deleting employee: ${employeeToDelete.firstName} ${employeeToDelete.surname} (${employeeToDelete.employeeID})`,
            module: "Employee Management",
        };

        // Perform cascade deletion
        const result = await deleteEmployeeCascade(employeeToDelete.id, currentUser.uid);

        if (result.success) {
            // Log successful deletion (Auth deletion handled in cascade)
            await createLog(logInfo, currentUser.uid, "Success");

            return NextResponse.json({
                success: true,
                message: "Employee and all associated data deleted successfully",
                deletedEmployee: {
                    id: employeeToDelete.id,
                    name: `${employeeToDelete.firstName} ${employeeToDelete.surname}`,
                    employeeId: employeeToDelete.employeeID,
                },
            });
        } else {
            // Log failed deletion
            await createLog(
                {
                    ...logInfo,
                    title: "Employee Deletion Failed",
                    description: `Failed to delete employee: ${employeeToDelete.firstName} ${employeeToDelete.surname} (${employeeToDelete.employeeID}). Errors: ${result.errors.join(", ")}`,
                },
                currentUser.uid,
                "Failure",
            );

            return NextResponse.json(
                {
                    success: false,
                    error: "Deletion failed",
                    message: "Failed to delete employee completely. Some data may remain.",
                    errors: result.errors,
                },
                { status: 500 },
            );
        }
    } catch (error) {
        console.error("Error in employee delete API:", error);

        return NextResponse.json(
            {
                success: false,
                error: "Internal Server Error",
                message: "An unexpected error occurred while deleting the employee",
            },
            { status: 500 },
        );
    }
}
