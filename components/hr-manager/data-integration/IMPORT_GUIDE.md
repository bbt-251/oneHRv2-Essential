# Technical Implementation Guide: Adding New Import Types

This guide provides detailed, step-by-step instructions for implementing new import types in the HR Management system. Use this guide whenever you need to add a new import feature (e.g., Department Import, Position Import, etc.).

## Overview

The import system uses a modular architecture where each import type is self-contained in its own directory under `import/blocks/`. Each import type consists of:

- **fields.ts**: Field definitions and validation rules
- **validator.ts**: Custom validation logic
- **import.ts**: Import execution logic
- **[entity]-import-service.ts**: Backend service for database operations
- Integration with the main import handler

## Prerequisites

Before starting, ensure you have:

- A clear understanding of the data structure for your new import type
- Access to the existing import system files
- Knowledge of the existing service patterns in `lib/backend/api/hr-settings/`

## Step 1: Define the Import Type

**File**: `components/hr-manager/data-integration/import/blocks/import-handler.ts`

Add the new import type to the `IMPORT_TYPES` array. Replace `your-import-type` and `Your Import Type Label` with your specific values:

```typescript
export const IMPORT_TYPES = [
    { value: "employee-upsert", label: "Employee" },
    { value: "balance-leave-days", label: "Balance Leave Days" },
    { value: "your-import-type", label: "Your Import Type Label" }, // Add this line
];
```

## Step 2: Create Field Definitions

**File**: `components/hr-manager/data-integration/import/blocks/your-import-type/fields.ts`

Create the directory structure and field definitions. Replace `YOUR_IMPORT_TYPE` with your uppercase import type name:

```typescript
import { ImportField } from "../shared/validation-engine";

/**
 * Your import type field definitions
 */
export const YOUR_IMPORT_TYPE_FIELDS: ImportField[] = [
    // Required fields for creation
    { key: "id", label: "ID", required: true, type: "text" },
    { key: "name", label: "Name", required: true, type: "text" },

    // Optional fields - customize based on your data structure
    { key: "description", label: "Description", required: false, type: "text" },
    { key: "status", label: "Status", required: false, type: "text" },
    // Add more fields as needed
];

/**
 * Gets field definitions for your import type
 */
export function getYourImportTypeFields(): ImportField[] {
    return YOUR_IMPORT_TYPE_FIELDS;
}
```

## Step 3: Create Backend Service

**File**: `lib/backend/api/hr-settings/your-import-type-import-service.ts`

Create a service for database operations. Follow the pattern from existing services like `balance-leave-import-service.ts`:

```typescript
import { collection, doc, writeBatch, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/backend/firebase/instance-config";

/**
 * Service for importing your import type data
 */
export class YourImportTypeImportService {
    /**
     * Batch import your import type data
     */
    static async batchImportYourImportType(
        importData: Array<{
            id: string;
            name: string;
            // Add other fields based on your data structure
            [key: string]: any;
        }>,
    ): Promise<{
        successful: number;
        failed: number;
        errors: string[];
    }> {
        const batch = writeBatch(db);
        const errors: string[] = [];
        let successful = 0;
        let failed = 0;

        try {
            // Check for duplicates and prepare batch operations
            for (const item of importData) {
                try {
                    // Validate uniqueness if needed
                    const existingQuery = query(
                        collection(db, "your-collection-name"),
                        where("id", "==", item.id),
                    );
                    const existingDocs = await getDocs(existingQuery);

                    if (!existingDocs.empty) {
                        failed++;
                        errors.push(`Item with ID '${item.id}' already exists`);
                        continue;
                    }

                    // Add to batch
                    const docRef = doc(collection(db, "your-collection-name"));
                    batch.set(docRef, {
                        ...item,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    });

                    successful++;
                } catch (error) {
                    failed++;
                    errors.push(
                        `Failed to process item ${item.id}: ${
                            error instanceof Error ? error.message : "Unknown error"
                        }`,
                    );
                }
            }

            // Commit batch
            await batch.commit();
        } catch (error) {
            console.error("Batch import error:", error);
            throw new Error(
                `Import failed: ${error instanceof Error ? error.message : "Unknown error"}`,
            );
        }

        return { successful, failed, errors };
    }
}
```

## Step 4: Implement Validation Logic

**File**: `components/hr-manager/data-integration/import/blocks/your-import-type/validator.ts`

Create custom validation logic:

```typescript
import {
    ValidationContext,
    ValidationResult,
    validateMandatoryFields,
    validateOptionalFields,
    validateFieldTypes,
    generateErrorMessage,
} from "../shared/validation-engine";

/**
 * Validates CSV data for department import
 */
export async function validateDepartmentData(
    csvData: Record<string, any>[],
    context: ValidationContext,
): Promise<ValidationResult> {
    const errors: ValidationResult["errors"] = [];
    const validRows: Record<string, any>[] = [];

    for (let i = 0; i < csvData.length; i++) {
        const row = csvData[i];
        const rowNumber = i + 1;
        const fieldErrors: Record<string, string> = {};
        let hasErrors = false;

        // Step 1: Check mandatory fields
        const mandatoryFieldErrors = validateMandatoryFields(row, context.fields);
        if (Object.keys(mandatoryFieldErrors).length > 0) {
            Object.assign(fieldErrors, mandatoryFieldErrors);
            hasErrors = true;
        }

        // Step 2: Check optional fields
        const optionalFieldErrors = validateOptionalFields(row, context.fields);
        if (Object.keys(optionalFieldErrors).length > 0) {
            Object.assign(fieldErrors, optionalFieldErrors);
            hasErrors = true;
        }

        // Step 3: Type validation
        const typeValidationErrors = validateFieldTypes(row, context.fields);
        if (Object.keys(typeValidationErrors).length > 0) {
            Object.assign(fieldErrors, typeValidationErrors);
            hasErrors = true;
        }

        // Step 4: Department-specific validation
        const departmentErrors = await validateDepartmentSpecificFields(row, context);
        if (Object.keys(departmentErrors).length > 0) {
            Object.assign(fieldErrors, departmentErrors);
            hasErrors = true;
        }

        if (hasErrors) {
            errors.push({
                rowNumber,
                rowData: row,
                errorMessage: generateErrorMessage(fieldErrors),
                fieldErrors,
            });
        } else {
            validRows.push(row);
        }
    }

    return {
        isValid: errors.length === 0,
        errors,
        validRows,
        totalRows: csvData.length,
    };
}

/**
 * Department-specific validation logic
 */
async function validateDepartmentSpecificFields(
    row: Record<string, any>,
    context: ValidationContext,
): Promise<Record<string, string>> {
    const errors: Record<string, string> = {};

    // Validate departmentID uniqueness
    const departmentID = row.departmentID;
    if (departmentID) {
        // Check if department already exists (you'll need to implement this check)
        // This would typically query your department collection
        const departmentExists = await checkDepartmentExists(departmentID);
        if (departmentExists) {
            errors.departmentID = `Department with ID '${departmentID}' already exists`;
        }
    }

    // Validate managerID exists if provided
    const managerID = row.managerID;
    if (managerID) {
        const managerExists = context.employees.some(emp => emp.employeeID === managerID);
        if (!managerExists) {
            errors.managerID = `Manager with employee ID '${managerID}' does not exist`;
        }
    }

    // Validate budget is positive number
    const budget = row.budget;
    if (budget !== undefined && budget !== null && String(budget).trim() !== "") {
        const budgetValue = Number(budget);
        if (isNaN(budgetValue) || budgetValue < 0) {
            errors.budget = "Budget must be a positive number";
        }
    }

    // Validate location exists in HR settings if provided
    const location = row.location;
    if (location && context.hrSettings?.locations) {
        const locationExists = context.hrSettings.locations.some(
            (loc: any) => loc.name === location,
        );
        if (!locationExists) {
            errors.location = `Location '${location}' does not exist in HR settings`;
        }
    }

    return errors;
}

/**
 * Helper function to check if department exists
 * You'll need to implement this based on your department data structure
 */
async function checkDepartmentExists(departmentID: string): Promise<boolean> {
    // Implement department existence check
    // This might query a departments collection or check against existing data
    return false; // Placeholder - implement actual check
}
```

## Step 5: Develop Import Logic

**File**: `components/hr-manager/data-integration/import/blocks/your-import-type/import.ts`

Create the import execution logic:

```typescript
import { ImportService } from "@/lib/backend/api/hr-settings/import-service";
import { ImportLogModel, ImportDataModel } from "@/lib/models/import-log";
import { getTimestamp } from "@/lib/util/dayjs_format";

/**
 * Department import functionality
 */
export interface DepartmentImportResult {
    success: boolean;
    importLog: ImportLogModel;
    message: string;
}

/**
 * Imports department data and creates import log
 */
export async function importDepartmentData(
    departmentData: Record<string, any>[],
    actorName: string,
    actorID: string
): Promise<DepartmentImportResult> {
    try {
        if (!departmentData.length) {
            throw new Error("No department data to import");
        }

        // Convert CSV data to department objects
        const departments = departmentData.map(data => convertDepartmentData(data));

        // Import departments using your department service
        const importResult = await importDepartmentsToDatabase(departments);

        // Create import log
        const importedData: ImportDataModel = {
            totalRows: departmentData.length,
            successfulRows: importResult.successful,
            failedRows: importResult.failed,
            summary: `Imported ${importResult.successful} of ${departmentData.length} departments successfully`
        };

        if (importResult.errors.length > 0) {
            importedData.failureDetails = importResult.errors.map((error, index) => ({
                rowNumber: index + 1,
                rowData: departmentData[index] || {},
                errorMessage: error,
                fieldErrors: {}
            }));
        }

        const importLog: ImportLogModel = {
            id: `import_department_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: getTimestamp(),
            type: "department",
            actorName,
            actorID,
            status: importResult.failed === 0 ? "success" : "failure",
            importedData
        };

        // Save the import log
        const logId = await ImportService.createImportLog(importLog);
        importLog.id = logId;

        return {
            success: importResult.failed === 0,
            importLog,
            message: importResult.failed === 0
                ? `Successfully imported ${importResult.successful} departments`
                : `Department import completed with ${importResult.failed} failures out of ${departmentData.length} records`
        };

    } catch (error) {
        console.error("Error in department import process:", error);

        const failureLog: ImportLogModel = {
            id: `import_department_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: getTimestamp(),
            type: "department",
            actorName,
            actorID,
            status: "failure",
            importedData: {
                totalRows: departmentData.length,
                successfulRows: 0,
                failedRows: departmentData.length,
                summary: `Department import failed: ${error instanceof Error ? error.message : "Unknown error"}`,
                failureDetails: [{
                    rowNumber: 1,
                    rowData: {},
                    errorMessage: error instanceof Error ? error.message : "Unknown error occurred",
                    fieldErrors: {}
                }]
            } as ImportDataModel
        };

        const logId = await ImportService.createImportLog(failureLog);
        failureLog.id = logId;

        return {
            success: false,
            importLog: failureLog,
            message: error instanceof Error ? error.message : "An unexpected error occurred during department import"
        };
    }
}

/**
 * Convert CSV row data to department object
 */
function convertDepartmentData(data: Record<string, any>): any {
    return {
        departmentID: data.departmentID,
        departmentName: data.departmentName,
        description: data.description || "",
        managerID: data.managerID || null,
        budget: data.budget ? Number(data.budget) : null,
        location: data.location || null,
        phoneNumber: data.phoneNumber || null,
        email: data.email || null,
        createdAt: getTimestamp() // dayjs_format.ts util,
        updatedAt: getTimestamp() // dayjs_format.ts util
    };
}

/**
 * Import departments to database
 * You'll need to implement this based on your department service
 */
async function importDepartmentsToDatabase(departments: any[]): Promise<{
    successful: number;
    failed: number;
    errors: string[];
}> {
    // Implement your department import logic here
    // This should interact with your department collection/service

    // Placeholder implementation
    const errors: string[] = [];
    let successful = 0;
    let failed = 0;

    for (const department of departments) {
        try {
            // Call your department creation service
            // await DepartmentService.createDepartment(department);
            successful++;
        } catch (error) {
            failed++;
            errors.push(`Failed to import department ${department.departmentID}: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
    }

    return { successful, failed, errors };
}
```

## Step 6: Update Import Handler

**File**: `components/hr-manager/data-integration/import/blocks/import-handler.ts`

Add imports and update all switch statements:

```typescript
// Add these imports at the top
import { getYourImportTypeFields } from "./your-import-type/fields";
import { validateYourImportTypeData } from "./your-import-type/validator";
import { importYourImportTypeData } from "./your-import-type/import";

// Update the validateImportData function
switch (context.importType) {
    case "employee-upsert":
    case "employee":
        return await validateEmployeeData(csvData, context);
    case "balance-leave-days":
        return await validateBalanceLeaveDaysData(csvData, context);
    case "your-import-type": // Add this case
        return await validateYourImportTypeData(csvData, context);
    default:
        throw new Error(`Unsupported import type: ${context.importType}`);
}

// Update the import switch statement
switch (importType) {
    case "employee-upsert":
    case "employee":
        importResult = await importEmployeeData(
            validationResult.validRows,
            actorName,
            actorID,
            hrSettings,
            employees,
        );
        break;
    case "balance-leave-days":
        importResult = await importBalanceLeaveDaysData(
            validationResult.validRows,
            actorName,
            actorID,
        );
        break;
    case "your-import-type": // Add this case
        importResult = await importYourImportTypeData(
            validationResult.validRows,
            actorName,
            actorID,
        );
        break;
    default:
        throw new Error(`Unsupported import type: ${importType}`);
}

// Update the getFieldsForImportType function
switch (importType) {
    case "employee-upsert":
    case "employee":
        return getEmployeeFields();
    case "balance-leave-days":
        return getBalanceLeaveDaysFields();
    case "your-import-type": // Add this case
        return getYourImportTypeFields();
    default:
        return [];
}
```

## Step 7: Update Import Page

**File**: `components/hr-manager/data-integration/import/page.tsx`

Add the import for your fields and update the getCurrentFields function:

```typescript
// Add this import
import { YOUR_IMPORT_TYPE_FIELDS } from "./blocks/your-import-type/fields";

// Update the getCurrentFields function
const getCurrentFields = (): ImportField[] => {
    switch (selectedImportType) {
        case "employee-upsert":
        case "employee":
            return EMPLOYEE_FIELDS;
        case "balance-leave-days":
            return BALANCE_LEAVE_DAYS_FIELDS;
        case "your-import-type": // Add this case
            return YOUR_IMPORT_TYPE_FIELDS;
        default:
            return [];
    }
};
```

## Step 8: Test the Implementation

1. **Unit Tests**: Create tests for your validator and import functions
2. **Integration Tests**: Test the full import flow with sample data
3. **UI Testing**: Verify the new import type appears in the dropdown and works correctly
4. **Error Handling**: Test with invalid data to ensure proper error reporting

## File Structure Summary

After implementation, your import type should have this structure:

```
components/hr-manager/data-integration/import/blocks/your-import-type/
├── fields.ts                    # Field definitions
├── validator.ts                 # Validation logic
└── import.ts                    # Import execution

lib/backend/api/hr-settings/
└── your-import-type-import-service.ts  # Backend service
```

## Key Points to Remember

1. **Follow the existing patterns**: Use the same structure as employee and balance-leave-days imports
2. **Error handling**: Always include proper error handling and logging
3. **Validation**: Implement both general validation (types, required fields) and specific business logic validation
4. **Data conversion**: Convert CSV data to the format expected by your database/service
5. **Logging**: Create detailed import logs for success and failure cases
6. **Testing**: Test thoroughly before deploying

## Common Implementation Issues

- **Missing imports**: Ensure all imports are correctly added to import-handler.ts
- **Field mapping**: Make sure field keys match between CSV headers and your data structure
- **Service integration**: Verify your import service correctly interfaces with your database
- **Validation logic**: Test edge cases like empty files, invalid data, duplicates
- **UI updates**: Ensure the new import type appears and functions in the UI

This guide provides the complete technical implementation for adding any new import type to the system.
