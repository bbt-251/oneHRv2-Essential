import { HrSavedReport } from "@/components/hr-manager/reporting/report-types";
import {
    collection,
    doc,
    addDoc,
    getDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    query,
    where,
    Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/backend/firebase/init";

const hrReportsCollection = collection(db, "hr_reports");

function hrReportToFirestore(report: HrSavedReport): Record<string, unknown> {
    return {
        name: report.name,
        description: report.description,
        charts: report.charts,
        globalFilters: report.globalFilters,
        createdAt:
            report.createdAt instanceof Date
                ? Timestamp.fromDate(report.createdAt)
                : report.createdAt,
        updatedAt:
            report.updatedAt instanceof Date
                ? Timestamp.fromDate(report.updatedAt)
                : report.updatedAt,
        createdBy: report.createdBy || "",
        sharing: report.sharing,
        isArchived: report.isArchived ?? false,
        shareLink: report.shareLink || null,
    };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function firestoreToHrReport(docId: string, data: any): HrSavedReport {
    return {
        id: docId,
        name: data.name || "",
        description: data.description || "",
        charts: data.charts || [],
        globalFilters: data.globalFilters || [],
        createdAt: data.createdAt?.toDate
            ? data.createdAt.toDate()
            : data.createdAt instanceof Date
                ? data.createdAt
                : new Date(),
        updatedAt: data.updatedAt?.toDate
            ? data.updatedAt.toDate()
            : data.updatedAt instanceof Date
                ? data.updatedAt
                : new Date(),
        isShared: data.sharing?.mode !== "private",
        shareLink: data.shareLink || undefined,
        sharing: data.sharing || { mode: "private", sharedWithRoles: [], sharedWithUsers: [] },
        createdBy: data.createdBy || "",
        isArchived: data.isArchived ?? false,
    };
}

export async function createHrReport(
    report: Omit<HrSavedReport, "id" | "createdAt" | "updatedAt">,
    userId: string,
): Promise<HrSavedReport> {
    const now = new Date();
    const reportData: HrSavedReport = {
        ...report,
        id: "",
        createdAt: now,
        updatedAt: now,
        createdBy: userId,
    };

    const docRef = await addDoc(hrReportsCollection, hrReportToFirestore(reportData));

    return {
        ...reportData,
        id: docRef.id,
    };
}

export async function getHrReportById(reportId: string): Promise<HrSavedReport | null> {
    const docRef = doc(hrReportsCollection, reportId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
        return null;
    }

    return firestoreToHrReport(docSnap.id, docSnap.data());
}

/**
 * Fetch reports by user without orderBy to avoid requiring a composite index
 * across multiple Firestore instances. Results are sorted by updatedAt desc in memory.
 */
export async function getHrReportsByUser(userId: string): Promise<HrSavedReport[]> {
    const q = query(
        hrReportsCollection,
        where("createdBy", "==", userId),
        where("isArchived", "==", false),
    );

    const querySnapshot = await getDocs(q);
    const reports = querySnapshot.docs.map(docSnap =>
        firestoreToHrReport(docSnap.id, docSnap.data()),
    );
    reports.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
    return reports;
}

export async function updateHrReport(
    reportId: string,
    updates: Partial<Omit<HrSavedReport, "id" | "createdAt" | "createdBy">>,
): Promise<void> {
    const docRef = doc(hrReportsCollection, reportId);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: { [key: string]: any } = {
        updatedAt: Timestamp.now(),
    };

    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.charts !== undefined) updateData.charts = updates.charts;
    if (updates.globalFilters !== undefined) updateData.globalFilters = updates.globalFilters;
    if (updates.sharing !== undefined) updateData.sharing = updates.sharing;
    if (updates.shareLink !== undefined) updateData.shareLink = updates.shareLink;
    if (updates.isArchived !== undefined) updateData.isArchived = updates.isArchived;

    await updateDoc(docRef, updateData);
}

export async function deleteHrReport(reportId: string): Promise<void> {
    const docRef = doc(hrReportsCollection, reportId);
    await deleteDoc(docRef);
}
