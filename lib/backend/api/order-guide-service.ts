import {
    collection,
    doc,
    getDocs,
    getDoc,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    limit,
    Timestamp,
    setDoc,
} from "firebase/firestore";
import { db } from "../firebase/init";
import {
    orderGuidesCollection,
    orderItemsCollection,
    trainingMaterialCollection,
    trainingPathCollection,
} from "../firebase/collections";
import type {
    OrderGuideModel,
    OrderItemModel,
    EmployeeOrderGuideAssignment,
    TrainingMaterialModel,
    TrainingPathModel,
    OrderGuideEmployees,
    ItemProgress,
    MaterialProgress,
    PathProgress,
} from "@/lib/models/order-guide-and-order-item";
import { getTimestamp } from "@/lib/util/dayjs_format";
import { ORDER_GUIDE_LOG_MESSAGES } from "@/lib/log-descriptions/order-guide";
import { createLog } from "./logCollection";
import { LogInfo } from "@/lib/log-descriptions/order-guide";

// Order Guide Service
export class OrderGuideService {
    // Get all order guides
    static async getAllOrderGuides(): Promise<OrderGuideModel[]> {
        try {
            const q = query(orderGuidesCollection, orderBy("timestamp", "desc"));
            const querySnapshot = await getDocs(q);

            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            })) as OrderGuideModel[];
        } catch (error) {
            console.error("Error fetching order guides:", error);
            throw error;
        }
    }

    // Get order guide by ID
    static async getOrderGuideById(id: string): Promise<OrderGuideModel | null> {
        try {
            const docRef = doc(orderGuidesCollection, id);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                return {
                    id: docSnap.id,
                    ...docSnap.data(),
                } as OrderGuideModel;
            }
            return null;
        } catch (error) {
            console.error("Error fetching order guide:", error);
            throw error;
        }
    }

    // Create new order guide
    static async createOrderGuide(
        orderGuide: Omit<OrderGuideModel, "id">,
        actionBy: string,
        logInfo?: LogInfo,
    ): Promise<OrderGuideModel> {
        try {
            const docRef = doc(orderGuidesCollection);
            await setDoc(docRef, {
                ...orderGuide,
                id: docRef.id,
            });

            // Log the creation if logInfo is provided
            if (logInfo) {
                await createLog(logInfo, actionBy, "Success");
            }

            return {
                ...orderGuide,
                id: docRef.id,
            } as OrderGuideModel;
        } catch (error) {
            console.error("Error creating order guide:", error);
            // Log the failure if logInfo is provided
            if (logInfo) {
                await createLog(
                    {
                        ...logInfo,
                        title: `${logInfo.title} Failed`,
                        description: `Failed to ${logInfo.description.toLowerCase()}`,
                    },
                    actionBy,
                    "Failure",
                );
            }
            throw error;
        }
    }

    // Update order guide
    static async updateOrderGuide(
        id: string,
        updates: Partial<OrderGuideModel>,
        actionBy: string,
        logInfo?: LogInfo,
    ): Promise<void> {
        try {
            const docRef = doc(orderGuidesCollection, id);
            await updateDoc(docRef, updates);

            // Log the update if logInfo is provided
            if (logInfo) {
                await createLog(logInfo, actionBy, "Success");
            }
        } catch (error) {
            console.error("Error updating order guide:", error);
            // Log the failure if logInfo is provided
            if (logInfo) {
                await createLog(
                    {
                        ...logInfo,
                        title: `${logInfo.title} Failed`,
                        description: `Failed to ${logInfo.description.toLowerCase()}`,
                    },
                    actionBy,
                    "Failure",
                );
            }
            throw error;
        }
    }

    // Delete order guide
    static async deleteOrderGuide(id: string, actionBy: string, logInfo?: LogInfo): Promise<void> {
        try {
            const docRef = doc(orderGuidesCollection, id);
            await deleteDoc(docRef);

            // Log the deletion if logInfo is provided
            if (logInfo) {
                await createLog(logInfo, actionBy, "Success");
            }
        } catch (error) {
            console.error("Error deleting order guide:", error);
            // Log the failure if logInfo is provided
            if (logInfo) {
                await createLog(
                    {
                        ...logInfo,
                        title: `${logInfo.title} Failed`,
                        description: `Failed to ${logInfo.description.toLowerCase()}`,
                    },
                    actionBy,
                    "Failure",
                );
            }
            throw error;
        }
    }

    // Get order guides by employee
    static async getOrderGuidesByEmployee(
        employeeId: string,
    ): Promise<EmployeeOrderGuideAssignment[]> {
        try {
            if (!employeeId) {
                console.error("No employee ID provided for fetching order guides");
                return [];
            }

            const q = query(
                orderGuidesCollection,
                where("associatedEmployees", "array-contains", employeeId),
                orderBy("timestamp", "desc"),
            );
            const querySnapshot = await getDocs(q);

            const orderGuides = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            })) as OrderGuideModel[];

            // Transform to EmployeeOrderGuideAssignment format with IDs
            return orderGuides.map(guide => ({
                id: guide.id || "",
                timestamp: guide.timestamp,
                orderGuideID: guide.orderGuideID,
                orderGuideName: guide.orderGuideName,
                status: "Not Started" as const,
                associatedItems: guide.associatedItems || [],
                associatedTrainingMaterials: guide.associatedTrainingMaterials || [],
                associatedTrainingPaths: guide.associatedTrainingPaths || [],
                rating: null,
                comment: null,
            }));
        } catch (error) {
            console.error("Error fetching order guides by employee:", error);
            throw error;
        }
    }

    // Get full order guide with resolved relationships
    static async getOrderGuideWithRelationships(orderGuideId: string): Promise<{
        orderGuide: OrderGuideModel;
        items: OrderItemModel[];
        trainingMaterials: TrainingMaterialModel[];
        trainingPaths: TrainingPathModel[];
    } | null> {
        try {
            const orderGuide = await this.getOrderGuideById(orderGuideId);
            if (!orderGuide) return null;

            // Fetch related items
            const items = await this.getOrderItemsByIds(orderGuide.associatedItems || []);

            // Fetch related training materials
            const trainingMaterials = await this.getTrainingMaterialsByIds(
                orderGuide.associatedTrainingMaterials || [],
            );

            // Fetch related training paths with their materials
            const trainingPaths = await this.getTrainingPathsByIds(
                orderGuide.associatedTrainingPaths || [],
            );

            return {
                orderGuide,
                items,
                trainingMaterials,
                trainingPaths,
            };
        } catch (error) {
            console.error("Error fetching order guide with relationships:", error);
            throw error;
        }
    }

    // Helper function to get order items by IDs
    static async getOrderItemsByIds(itemIds: string[]): Promise<OrderItemModel[]> {
        if (itemIds.length === 0) return [];

        try {
            const items: OrderItemModel[] = [];
            for (const id of itemIds) {
                const itemDoc = await getDoc(doc(orderItemsCollection, id));
                if (itemDoc.exists()) {
                    items.push({ id: itemDoc.id, ...itemDoc.data() } as OrderItemModel);
                }
            }
            return items;
        } catch (error) {
            console.error("Error fetching order items by IDs:", error);
            return [];
        }
    }

    // Helper function to get training materials by IDs
    static async getTrainingMaterialsByIds(
        materialIds: string[],
    ): Promise<TrainingMaterialModel[]> {
        if (materialIds.length === 0) return [];

        try {
            const materials: TrainingMaterialModel[] = [];
            for (const id of materialIds) {
                const materialDoc = await getDoc(doc(trainingMaterialCollection, id));
                if (materialDoc.exists()) {
                    materials.push({
                        id: materialDoc.id,
                        ...materialDoc.data(),
                    } as TrainingMaterialModel);
                }
            }
            return materials;
        } catch (error) {
            console.error("Error fetching training materials by IDs:", error);
            return [];
        }
    }

    // Helper function to get training paths by IDs
    static async getTrainingPathsByIds(pathIds: string[]): Promise<TrainingPathModel[]> {
        if (pathIds.length === 0) return [];

        try {
            const paths: TrainingPathModel[] = [];
            for (const id of pathIds) {
                const pathDoc = await getDoc(doc(trainingPathCollection, id));
                if (pathDoc.exists()) {
                    paths.push({ id: pathDoc.id, ...pathDoc.data() } as TrainingPathModel);
                }
            }
            return paths;
        } catch (error) {
            console.error("Error fetching training paths by IDs:", error);
            return [];
        }
    }

    // Add employee to order guide
    static async addEmployeeToOrderGuide(
        orderGuideId: string,
        employeeUid: string,
        actionBy: string,
        logInfo?: LogInfo,
    ): Promise<void> {
        try {
            const orderGuide = await this.getOrderGuideById(orderGuideId);
            if (!orderGuide) {
                throw new Error("Order guide not found");
            }

            // Check if employee already exists
            const existingEmployees = orderGuide.associatedEmployees || [];
            const employeeExists = existingEmployees.some(emp => emp.uid === employeeUid);

            if (employeeExists) {
                console.log("Employee already associated with this order guide");
                return;
            }

            // Add new employee
            const newEmployee = {
                uid: employeeUid,
                status: "Not Started" as const,
                rating: null,
                comment: null,
            };

            const updatedEmployees = [...existingEmployees, newEmployee];

            await this.updateOrderGuide(
                orderGuideId,
                { associatedEmployees: updatedEmployees },
                actionBy,
                logInfo,
            );
        } catch (error) {
            console.error("Error adding employee to order guide:", error);
            throw error;
        }
    }

    // Remove employee from order guide
    static async removeEmployeeFromOrderGuide(
        orderGuideId: string,
        employeeUid: string,
        actionBy: string,
        logInfo?: LogInfo,
    ): Promise<void> {
        try {
            const orderGuide = await this.getOrderGuideById(orderGuideId);
            if (!orderGuide) {
                throw new Error("Order guide not found");
            }

            const existingEmployees = orderGuide.associatedEmployees || [];
            const updatedEmployees = existingEmployees.filter(emp => emp.uid !== employeeUid);

            await this.updateOrderGuide(
                orderGuideId,
                { associatedEmployees: updatedEmployees },
                actionBy,
                logInfo,
            );
        } catch (error) {
            console.error("Error removing employee from order guide:", error);
            throw error;
        }
    }

    // Update employee status in order guide
    static async updateEmployeeStatusInOrderGuide(
        orderGuideId: string,
        employeeUid: string,
        status: "Not Started" | "In Progress" | "Done",
        actionBy: string,
        logInfo?: LogInfo,
    ): Promise<void> {
        try {
            const orderGuide = await this.getOrderGuideById(orderGuideId);
            if (!orderGuide) {
                throw new Error("Order guide not found");
            }

            const existingEmployees = orderGuide.associatedEmployees || [];
            const updatedEmployees = existingEmployees.map(emp => {
                if (emp.uid === employeeUid) {
                    return { ...emp, status };
                }
                return emp;
            });

            await this.updateOrderGuide(
                orderGuideId,
                { associatedEmployees: updatedEmployees },
                actionBy,
                logInfo,
            );
        } catch (error) {
            console.error("Error updating employee status in order guide:", error);
            throw error;
        }
    }

    // Update progress for a specific item
    static async updateItemProgress(
        orderGuideId: string,
        employeeUid: string,
        itemId: string,
        status: "To Do" | "In Progress" | "Done",
        comment: string | null = null,
        actionBy?: string,
        employeeName?: string,
    ): Promise<void> {
        try {
            const orderGuide = await this.getOrderGuideById(orderGuideId);
            if (!orderGuide) {
                throw new Error("Order guide not found");
            }

            const existingEmployees = orderGuide.associatedEmployees || [];
            const timestamp = getTimestamp();

            const updatedEmployees = existingEmployees.map(emp => {
                if (emp.uid === employeeUid) {
                    // Get existing item progress or initialize
                    const existingProgress = emp.itemProgress || [];
                    const itemIndex = existingProgress.findIndex(p => p.itemId === itemId);

                    let newProgress: ItemProgress;
                    if (status === "In Progress") {
                        newProgress = {
                            itemId,
                            status,
                            startedAt: timestamp,
                            completedAt: null,
                            comment: comment,
                        };
                    } else if (status === "Done") {
                        newProgress = {
                            itemId,
                            status,
                            startedAt: existingProgress[itemIndex]?.startedAt || timestamp,
                            completedAt: timestamp,
                            comment: comment,
                        };
                    } else {
                        newProgress = {
                            itemId,
                            status,
                            startedAt: null,
                            completedAt: null,
                            comment: comment,
                        };
                    }

                    // Update or add the item progress
                    let updatedProgress: ItemProgress[];
                    if (itemIndex >= 0) {
                        updatedProgress = [...existingProgress];
                        updatedProgress[itemIndex] = newProgress;
                    } else {
                        updatedProgress = [...existingProgress, newProgress];
                    }

                    // Do NOT auto-update order guide status - employee must explicitly click "Finish"
                    // The status should only be updated when employee starts (to "In Progress")
                    // or when they explicitly complete the guide
                    return {
                        ...emp,
                        itemProgress: updatedProgress,
                    };
                }
                return emp;
            });

            // Log the progress update
            if (actionBy) {
                const logInfo = ORDER_GUIDE_LOG_MESSAGES.ORDER_GUIDE_ITEM_PROGRESS(
                    orderGuide.orderGuideName,
                    itemId,
                    status,
                    employeeName || "Employee",
                );
                await createLog(logInfo, actionBy, "Success");
            }

            await this.updateOrderGuide(
                orderGuideId,
                { associatedEmployees: updatedEmployees },
                actionBy || employeeUid,
            );
        } catch (error) {
            console.error("Error updating item progress in order guide:", error);
            throw error;
        }
    }

    // Update progress for a specific training material
    static async updateMaterialProgress(
        orderGuideId: string,
        employeeUid: string,
        materialId: string,
        status: "To Do" | "In Progress" | "Done",
        actionBy?: string,
        employeeName?: string,
    ): Promise<void> {
        try {
            const orderGuide = await this.getOrderGuideById(orderGuideId);
            if (!orderGuide) {
                throw new Error("Order guide not found");
            }

            const existingEmployees = orderGuide.associatedEmployees || [];
            const timestamp = getTimestamp();

            const updatedEmployees = existingEmployees.map(emp => {
                if (emp.uid === employeeUid) {
                    const existingProgress = emp.materialProgress || [];
                    const materialIndex = existingProgress.findIndex(
                        p => p.materialId === materialId,
                    );

                    let newProgress: MaterialProgress;
                    if (status === "In Progress") {
                        newProgress = {
                            materialId,
                            status,
                            startedAt: timestamp,
                            completedAt: null,
                        };
                    } else if (status === "Done") {
                        newProgress = {
                            materialId,
                            status,
                            startedAt: existingProgress[materialIndex]?.startedAt || timestamp,
                            completedAt: timestamp,
                        };
                    } else {
                        newProgress = {
                            materialId,
                            status,
                            startedAt: null,
                            completedAt: null,
                        };
                    }

                    let updatedProgress: MaterialProgress[];
                    if (materialIndex >= 0) {
                        updatedProgress = [...existingProgress];
                        updatedProgress[materialIndex] = newProgress;
                    } else {
                        updatedProgress = [...existingProgress, newProgress];
                    }

                    return { ...emp, materialProgress: updatedProgress };
                }
                return emp;
            });

            await this.updateOrderGuide(
                orderGuideId,
                { associatedEmployees: updatedEmployees },
                actionBy || employeeUid,
            );
        } catch (error) {
            console.error("Error updating material progress in order guide:", error);
            throw error;
        }
    }

    // Update progress for a specific training path
    static async updatePathProgress(
        orderGuideId: string,
        employeeUid: string,
        pathId: string,
        status: "To Do" | "In Progress" | "Done",
        actionBy?: string,
        employeeName?: string,
    ): Promise<void> {
        try {
            const orderGuide = await this.getOrderGuideById(orderGuideId);
            if (!orderGuide) {
                throw new Error("Order guide not found");
            }

            const existingEmployees = orderGuide.associatedEmployees || [];
            const timestamp = getTimestamp();

            const updatedEmployees = existingEmployees.map(emp => {
                if (emp.uid === employeeUid) {
                    const existingProgress = emp.pathProgress || [];
                    const pathIndex = existingProgress.findIndex(p => p.pathId === pathId);

                    let newProgress: PathProgress;
                    if (status === "In Progress") {
                        newProgress = {
                            pathId,
                            status,
                            startedAt: timestamp,
                            completedAt: null,
                        };
                    } else if (status === "Done") {
                        newProgress = {
                            pathId,
                            status,
                            startedAt: existingProgress[pathIndex]?.startedAt || timestamp,
                            completedAt: timestamp,
                        };
                    } else {
                        newProgress = {
                            pathId,
                            status,
                            startedAt: null,
                            completedAt: null,
                        };
                    }

                    let updatedProgress: PathProgress[];
                    if (pathIndex >= 0) {
                        updatedProgress = [...existingProgress];
                        updatedProgress[pathIndex] = newProgress;
                    } else {
                        updatedProgress = [...existingProgress, newProgress];
                    }

                    return { ...emp, pathProgress: updatedProgress };
                }
                return emp;
            });

            await this.updateOrderGuide(
                orderGuideId,
                { associatedEmployees: updatedEmployees },
                actionBy || employeeUid,
            );
        } catch (error) {
            console.error("Error updating path progress in order guide:", error);
            throw error;
        }
    }

    // Get progress summary for an employee
    static async getEmployeeProgressSummary(
        orderGuideId: string,
        employeeUid: string,
    ): Promise<{
        itemsTotal: number;
        itemsCompleted: number;
        materialsTotal: number;
        materialsCompleted: number;
        pathsTotal: number;
        pathsCompleted: number;
        overallPercentage: number;
    }> {
        try {
            const orderGuide = await this.getOrderGuideById(orderGuideId);
            if (!orderGuide) {
                throw new Error("Order guide not found");
            }

            const employee = orderGuide.associatedEmployees?.find(emp => emp.uid === employeeUid);
            if (!employee) {
                throw new Error("Employee not found in order guide");
            }

            const itemsTotal = orderGuide.associatedItems?.length || 0;
            const materialsTotal = orderGuide.associatedTrainingMaterials?.length || 0;
            const pathsTotal = orderGuide.associatedTrainingPaths?.length || 0;

            const itemProgress = employee.itemProgress || [];
            const materialProgress = employee.materialProgress || [];
            const pathProgress = employee.pathProgress || [];

            const itemsCompleted = itemProgress.filter(p => p.status === "Done").length;
            const materialsCompleted = materialProgress.filter(p => p.status === "Done").length;
            const pathsCompleted = pathProgress.filter(p => p.status === "Done").length;

            const totalItems = itemsTotal + materialsTotal + pathsTotal;
            const completedItems = itemsCompleted + materialsCompleted + pathsCompleted;
            const overallPercentage =
                totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

            return {
                itemsTotal,
                itemsCompleted,
                materialsTotal,
                materialsCompleted,
                pathsTotal,
                pathsCompleted,
                overallPercentage,
            };
        } catch (error) {
            console.error("Error getting employee progress summary:", error);
            throw error;
        }
    }
}

// Order Item Service
export class OrderItemService {
    // Get all order items
    static async getAllOrderItems(): Promise<OrderItemModel[]> {
        try {
            const q = query(orderItemsCollection, orderBy("timestamp", "desc"));
            const querySnapshot = await getDocs(q);

            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            })) as OrderItemModel[];
        } catch (error) {
            console.error("Error fetching order items:", error);
            throw error;
        }
    }

    // Get order item by ID
    static async getOrderItemById(id: string): Promise<OrderItemModel | null> {
        try {
            const docRef = doc(orderItemsCollection, id);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                return {
                    id: docSnap.id,
                    ...docSnap.data(),
                } as OrderItemModel;
            }
            return null;
        } catch (error) {
            console.error("Error fetching order item:", error);
            throw error;
        }
    }

    // Create new order item
    static async createOrderItem(
        orderItem: Omit<OrderItemModel, "id" | "timestamp">,
        actionBy: string,
        logInfo?: LogInfo,
    ): Promise<OrderItemModel> {
        try {
            const timestamp = getTimestamp();

            const newOrderItem = {
                ...orderItem,
                timestamp,
            };

            const docRef = await addDoc(orderItemsCollection, newOrderItem);

            // Log the creation if logInfo is provided
            if (logInfo) {
                await createLog(logInfo, actionBy, "Success");
            }

            return {
                id: docRef.id,
                ...newOrderItem,
            } as OrderItemModel;
        } catch (error) {
            console.error("Error creating order item:", error);
            // Log the failure if logInfo is provided
            if (logInfo) {
                await createLog(
                    {
                        ...logInfo,
                        title: `${logInfo.title} Failed`,
                        description: `Failed to ${logInfo.description.toLowerCase()}`,
                    },
                    actionBy,
                    "Failure",
                );
            }
            throw error;
        }
    }

    // Update order item
    static async updateOrderItem(
        id: string,
        updates: Partial<OrderItemModel>,
        actionBy: string,
        logInfo?: LogInfo,
    ): Promise<void> {
        try {
            const docRef = doc(orderItemsCollection, id);
            await updateDoc(docRef, updates);

            // Log the update if logInfo is provided
            if (logInfo) {
                await createLog(logInfo, actionBy, "Success");
            }
        } catch (error) {
            console.error("Error updating order item:", error);
            // Log the failure if logInfo is provided
            if (logInfo) {
                await createLog(
                    {
                        ...logInfo,
                        title: `${logInfo.title} Failed`,
                        description: `Failed to ${logInfo.description.toLowerCase()}`,
                    },
                    actionBy,
                    "Failure",
                );
            }
            throw error;
        }
    }

    // Delete order item
    static async deleteOrderItem(id: string, actionBy: string, logInfo?: LogInfo): Promise<void> {
        try {
            const docRef = doc(orderItemsCollection, id);
            await deleteDoc(docRef);

            // Log the deletion if logInfo is provided
            if (logInfo) {
                await createLog(logInfo, actionBy, "Success");
            }
        } catch (error) {
            console.error("Error deleting order item:", error);
            // Log the failure if logInfo is provided
            if (logInfo) {
                await createLog(
                    {
                        ...logInfo,
                        title: `${logInfo.title} Failed`,
                        description: `Failed to ${logInfo.description.toLowerCase()}`,
                    },
                    actionBy,
                    "Failure",
                );
            }
            throw error;
        }
    }
}
