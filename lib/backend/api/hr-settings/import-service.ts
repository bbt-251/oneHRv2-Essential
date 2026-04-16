import { ImportLogModel } from "@/lib/models/import-log";
import { EmployeeModel } from "@/lib/models/employee";
import { HrSettingsByType } from "@/context/firestore-context";
import { ImportLogService } from "./import-log-service";
import { ImportOrchestrator } from "./import-orchestrator";

/**
 * Import Service - Main entry point for all import operations
 * Now uses modular architecture with separate services for different concerns
 */
export class ImportService {
    // ==================== IMPORT LOG CRUD OPERATIONS ====================
    // Delegate to ImportLogService

    static async createImportLog(importLog: ImportLogModel): Promise<string> {
        return ImportLogService.createImportLog(importLog);
    }

    static async getAllImportLogs(limitCount: number = 50): Promise<ImportLogModel[]> {
        return ImportLogService.getAllImportLogs(limitCount);
    }

    static async getImportLogsByType(
        type: string,
        limitCount: number = 20,
    ): Promise<ImportLogModel[]> {
        return ImportLogService.getImportLogsByType(type, limitCount);
    }

    static async getImportLogById(id: string): Promise<ImportLogModel | null> {
        return ImportLogService.getImportLogById(id);
    }

    static async updateImportLog(id: string, updates: Partial<ImportLogModel>): Promise<void> {
        return ImportLogService.updateImportLog(id, updates);
    }

    static async deleteImportLog(id: string): Promise<void> {
        return ImportLogService.deleteImportLog(id);
    }

    // ==================== BATCH IMPORT OPERATIONS ====================
    // Delegate to ImportOrchestrator

    static async batchImport(
        importType: string,
        data: Record<string, any>[],
        actorName: string,
        actorID: string,
        hrSettings?: HrSettingsByType,
    ): Promise<ImportLogModel> {
        return ImportOrchestrator.batchImport(importType, data, actorName, actorID, hrSettings);
    }
}
