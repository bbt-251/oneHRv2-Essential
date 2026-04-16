import { overtimeRequestCollection } from "@/lib/backend/firebase/collections";
import { OvertimeRequestModel } from "@/lib/models/overtime-request";
import { getTimestamp } from "@/lib/util/dayjs_format";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { ImportUtils } from "./import-utils";
import generateID from "@/lib/util/generateID";
import dayjs from "dayjs";
import { OvertimeConfigurationModel } from "@/lib/backend/firebase/hrSettingsService";

/**
 * Overtime Request Import Service - Handles overtime request-specific import operations
 */
export class OvertimeRequestImportService {
    /**
     * Batch import overtime requests
     */
    static async batchImportOvertimeRequests(
        requests: Record<string, any>[],
        hrUid: string,
        hrSettings?: any,
    ): Promise<{
        successful: number;
        failed: number;
        errors: string[];
        importedRecords: any[];
    }> {
        const errors: string[] = [];
        const successfulRecords: any[] = [];
        let successful = 0;
        let failed = 0;

        try {
            for (let i = 0; i < requests.length; i++) {
                const request = requests[i];

                try {
                    await this.createOvertimeRequest(request, hrUid, hrSettings);
                    successful++;
                    successfulRecords.push({
                        rowData: request,
                        rowNumber: i + 2,
                    });
                } catch (error) {
                    failed++;
                    errors.push(`Row ${i + 2}: ${error}`);
                }
            }

            return { successful, failed, errors, importedRecords: successfulRecords };
        } catch (error) {
            console.error("Error in batch import overtime requests:", error);
            throw new Error("Failed to batch import overtime requests");
        }
    }

    /**
     * Creates an overtime request with auto-generated fields
     */
    private static async createOvertimeRequest(
        requestData: Record<string, any>,
        hrUid: string,
        hrSettings?: any,
    ): Promise<void> {
        // Convert employeeID to UID
        const employeeUid = await ImportUtils.findEmployeeUidByEmployeeID(requestData.employeeID);
        if (!employeeUid) {
            throw new Error(`Employee with ID ${requestData.employeeID} not found`);
        }

        // Convert overtime type name to ID
        let overtimeTypeId = requestData.overtimeType; // Default to name if conversion fails
        if (hrSettings?.overtimeTypes) {
            const overtimeType = hrSettings.overtimeTypes.find(
                (ot: OvertimeConfigurationModel) => ot.overtimeType === requestData.overtimeType,
            );
            if (overtimeType) {
                overtimeTypeId = overtimeType.id;
            }
        }

        // Calculate duration from start and end times
        const start = dayjs(requestData.overtimeStartTime, "hh:mm A");
        const end = dayjs(requestData.overtimeEndTime, "hh:mm A");
        let durationHours = end.diff(start, "hour", true);
        if (durationHours < 0) {
            durationHours += 24; // Handle overnight shifts
        }

        const overtimeRequest: OvertimeRequestModel = {
            id: `ot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: getTimestamp(),
            overtimeId: generateID(), // Auto-generate unique ID
            overtimeDate: requestData.overtimeDate,
            overtimeStartTime: requestData.overtimeStartTime,
            overtimeEndTime: requestData.overtimeEndTime,
            duration: durationHours, // Auto-calculated
            overtimeType: overtimeTypeId, // Store ID instead of name
            employeeUids: [employeeUid], // Single employee per request
            overtimeGoal: requestData.overtimeGoal,
            overtimeJustification: requestData.overtimeJustification,
            status: "pending",
            requestedBy: hrUid, // HR performing the import
            approvalStage: "hr", // Go directly to HR approval
            reviewedDate: null,
            reviewedBy: null,
            hrComments: null,
        };

        // Save to Firestore
        const docRef = doc(overtimeRequestCollection);
        await setDoc(docRef, {
            ...overtimeRequest,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });
    }
}
