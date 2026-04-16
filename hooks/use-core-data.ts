import {
    employeeCollection,
    notificationsCollection,
    attendanceCollection,
    projectCollection,
} from "@/lib/backend/firebase/collections";
import { EmployeeModel, notificationModel } from "@/lib/models/employee";
import { AttendanceModel } from "@/lib/models/attendance";
import { useFirestoreGroup, CollectionConfig } from "./use-firestore-group";
import { ProjectModel } from "@/lib/models/project";

export interface CoreDataState {
    employees: EmployeeModel[];
    notifications: notificationModel[];
    attendances: AttendanceModel[];
    projects: ProjectModel[];
}

export function useCoreData() {
    const collections: Record<keyof CoreDataState, CollectionConfig<any>> = {
        employees: {
            collectionRef: employeeCollection,
            key: "employees",
        },
        notifications: {
            collectionRef: notificationsCollection,
            key: "notifications",
        },
        attendances: {
            collectionRef: attendanceCollection,
            key: "attendances",
        },
        projects: {
            collectionRef: projectCollection,
            key: "projects",
        },
    };

    const groupState = useFirestoreGroup(collections, "core-data");
    return {
        employees: groupState.employees?.data || [],
        notifications: groupState.notifications?.data || [],
        attendances: groupState.attendances?.data || [],
        projects: groupState.projects?.data || [],
        loading:
            groupState.employees?.loading ||
            groupState.notifications?.loading ||
            groupState.attendances?.loading ||
            false,
        error:
            groupState.employees?.error ||
            groupState.notifications?.error ||
            groupState.attendances?.error ||
            null,
    };
}
