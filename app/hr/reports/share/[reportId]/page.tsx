"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { HrReportViewer } from "@/components/hr-manager/reporting/report-viewer";
import { getHrReportById } from "@/lib/api/hr-reporting/hr-report-service";
import { useAuth } from "@/context/authContext";
import type { HrSavedReport, HrShareMode } from "@/components/hr-manager/reporting/report-types";
import LoadingComponent from "@/components/loading";
import { AlertCircle } from "lucide-react";

const STORAGE_KEY_PREFIX = "hr_report_share_links_";

interface GeneratedLink {
    link: string;
    token: string;
    mode: HrShareMode;
    expirationDate: Date;
    createdAt: Date;
}

export default function HrShareReportPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const router = useRouter();
    const { user, userData, authLoading } = useAuth();

    const reportId = params?.reportId as string;
    const token = searchParams?.get("token");
    const mode = searchParams?.get("mode") as HrShareMode | null;
    const userIdParam = searchParams?.get("userId");

    const [report, setReport] = useState<HrSavedReport | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!reportId || !token || !mode) {
            setError("Invalid share link. Missing required parameters.");
            setLoading(false);
            return;
        }
        validateAndLoadReport();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [reportId, token, mode, userIdParam, user, userData, authLoading]);

    const validateAndLoadReport = async () => {
        try {
            setLoading(true);
            setError(null);

            const storageKey = `${STORAGE_KEY_PREFIX}${reportId}`;
            let stored: string | null = null;
            let linkData: GeneratedLink | null = null;

            try {
                stored = localStorage.getItem(storageKey);
                if (stored) {
                    linkData = JSON.parse(stored);
                    const exp = new Date(linkData.expirationDate);
                    if (exp <= new Date()) {
                        setError("This share link has expired.");
                        setLoading(false);
                        return;
                    }
                    if (linkData.token !== token) {
                        setError("Invalid share link token.");
                        setLoading(false);
                        return;
                    }
                }
            } catch {
                // continue; link might be from another device
            }

            const loadedReport = await getHrReportById(reportId);
            if (!loadedReport) {
                setError("Report not found.");
                setLoading(false);
                return;
            }

            if (loadedReport.shareLink) {
                try {
                    const reportLink = new URL(loadedReport.shareLink);
                    const reportToken = reportLink.searchParams.get("token");
                    if (reportToken && reportToken !== token) {
                        setError("This share link is no longer valid.");
                        setLoading(false);
                        return;
                    }
                } catch {
                    // ignore parse issues
                }
            }

            let hasAccess = false;
            if (mode === "public") {
                hasAccess = true;
            } else {
                if (!user || !userData) {
                    setError("You must be logged in to access this report.");
                    setLoading(false);
                    return;
                }
                const expectedUserId =
                    userIdParam || (linkData ? (linkData as never).userId : null);
                const currentUserId = (userData as { id?: string } | null)?.id || user.uid;
                if (expectedUserId && currentUserId !== expectedUserId) {
                    setError("You do not have permission to access this report.");
                    setLoading(false);
                    return;
                }
                hasAccess = true;
            }

            if (!hasAccess) {
                setError("You do not have permission to access this report.");
                setLoading(false);
                return;
            }

            setReport(loadedReport);
        } catch (err) {
            console.error("Error loading HR shared report:", err);
            setError(
                `Failed to load report: ${err instanceof Error ? err.message : "Unknown error"}`,
            );
        } finally {
            setLoading(false);
        }
    };

    if (authLoading || loading) {
        return <LoadingComponent />;
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 bg-muted/40">
                <div className="max-w-md w-full bg-background border rounded-lg p-6 text-center shadow-lg">
                    <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
                        <AlertCircle className="w-8 h-8 text-destructive" />
                    </div>
                    <h1 className="text-2xl font-bold mb-2">Access denied</h1>
                    <p className="text-muted-foreground mb-4">{error}</p>
                </div>
            </div>
        );
    }

    if (!report) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 bg-muted/40">
                <div className="max-w-md w-full bg-background border rounded-lg p-6 text-center shadow-lg">
                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                        <AlertCircle className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h1 className="text-2xl font-bold mb-2">Report not found</h1>
                    <p className="text-muted-foreground mb-4">
                        The requested report could not be found.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-muted/40">
            <div className="w-full max-w-6xl mx-auto bg-background border rounded-lg shadow-lg">
                <HrReportViewer
                    report={report}
                    onBack={() => router.push("/")}
                    canEdit={false}
                    hideActions={true}
                />
            </div>
        </div>
    );
}
