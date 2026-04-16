import type { TrainingMaterialModel } from "./training-material";
import type { TrainingPathModel } from "./training-path";

// Re-export the imported types
export type { TrainingMaterialModel, TrainingPathModel };

/**
 * ItemProgress - Tracks progress for each individual item in an order guide
 */
export interface ItemProgress {
    itemId: string;
    status: "To Do" | "In Progress" | "Done";
    startedAt: string | null; // Timestamp when item was started
    completedAt: string | null; // Timestamp when item was completed
    comment: string | null; // Optional comment for the item
}

/**
 * MaterialProgress - Tracks progress for each training material
 */
export interface MaterialProgress {
    materialId: string;
    status: "To Do" | "In Progress" | "Done";
    startedAt: string | null;
    completedAt: string | null;
}

/**
 * PathProgress - Tracks progress for each training path
 */
export interface PathProgress {
    pathId: string;
    status: "To Do" | "In Progress" | "Done";
    startedAt: string | null;
    completedAt: string | null;
}

export interface EmployeeOrderGuideAssignment {
    id: string;
    timestamp: string;
    orderGuideID: string;
    orderGuideName: string;
    status: "Not Started" | "In Progress" | "Done";
    associatedItems: string[]; // Store item IDs
    associatedTrainingMaterials: string[]; // Store material IDs
    associatedTrainingPaths: string[]; // Store path IDs
    rating: number | null; // 1-5 star rating given by employee
    comment: string | null; // Comment given by employee

    // Per-item progress tracking
    itemProgress?: ItemProgress[]; // Progress for each order item
    materialProgress?: MaterialProgress[]; // Progress for each training material
    pathProgress?: PathProgress[]; // Progress for each training path
}

export interface OrderGuideEmployees {
    uid: string;
    status: "Not Started" | "In Progress" | "Done" | null;
    rating: number | null;
    comment: string | null;

    // Per-item progress tracking
    itemProgress?: ItemProgress[];
    materialProgress?: MaterialProgress[];
    pathProgress?: PathProgress[];
}

export interface OrderGuideModel {
    id: string | null;
    timestamp: string;
    orderGuideID: string;
    orderGuideName: string;
    associatedEmployees: OrderGuideEmployees[];
    associatedItems: string[];
    associatedTrainingPaths: string[] | null;
    associatedTrainingMaterials: string[];
}

export interface OrderItemModel {
    id: string | null;
    timestamp: string;
    itemID: string;
    itemName: string;
    itemDescription: string;
    active: "Yes" | "No";
}
