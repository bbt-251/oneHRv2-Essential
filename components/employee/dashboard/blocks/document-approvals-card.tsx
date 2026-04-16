"use client";

import { useEffect, useState } from "react";
import { useTheme } from "@/components/theme-provider";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/context/authContext";
import { useFirestore } from "@/context/firestore-context";
import { DocumentDefinitionModel } from "@/lib/models/document";
import { FileText, UserCheck } from "lucide-react";
import { useRouter } from "next/navigation";

export function DocumentApprovalsCard() {
    const { theme } = useTheme();
    const { userData } = useAuth();
    const router = useRouter();
    const { documents: allDocuments } = useFirestore();

    const [pendingApprovals, setPendingApprovals] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const countPendingApprovals = () => {
            if (!userData?.uid || !allDocuments.length) return;

            // Count documents that need approval from this user
            const pendingCount = allDocuments.filter((doc: DocumentDefinitionModel) => {
                // Must be published and open visibility
                if (doc.status !== "Published" || doc.visibility !== "Open") {
                    return false;
                }

                // Must be in pending state
                if (doc.approvalState?.status !== "pending") {
                    return false;
                }

                // Check if user is the next approver
                return isUserNextApprover(doc, userData.uid);
            }).length;

            setPendingApprovals(pendingCount);
            setLoading(false);
        };

        countPendingApprovals();
    }, [userData?.uid, allDocuments]);

    const isUserNextApprover = (doc: DocumentDefinitionModel, userUID: string): boolean => {
        if (doc.approvalWorkflowID === "manager") {
            // For manager approval, check if user is a manager
            return userData?.role?.includes("Manager") || false;
        } else if (doc.approvalWorkflowID) {
            // For signature workflow, check if user is the current approver
            // This would need to be implemented based on the workflow logic
            // For now, return false
            return false;
        }

        return false;
    };

    const handleClick = () => {
        // Determine the correct route based on user role
        if (userData?.role?.includes("Manager")) {
            router.push("/manager/document-approvals");
        } else {
            router.push("/employee/document-approvals");
        }
    };

    return (
        <Card
            className={`shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer hover:scale-105 ${
                theme === "dark" ? "bg-black border-gray-800" : ""
            }`}
            onClick={handleClick}
        >
            <CardHeader className="pb-4 pt-6 px-6">
                <div className="flex items-center justify-between">
                    <CardTitle
                        className={`text-sm font-semibold ${
                            theme === "dark" ? "text-slate-300" : "text-slate-600"
                        }`}
                    >
                        Document Approvals
                    </CardTitle>
                    <div
                        className={`p-3 rounded-xl ${
                            theme === "dark" ? "bg-gray-800" : "bg-amber-50"
                        }`}
                    >
                        <UserCheck
                            className={`h-5 w-5 ${
                                theme === "dark" ? "text-amber-400" : "text-amber-600"
                            }`}
                        />
                    </div>
                </div>
            </CardHeader>
            <CardContent className="px-6 pb-6">
                <div className="space-y-4">
                    <div
                        className={`text-3xl font-bold ${
                            theme === "dark" ? "text-slate-300" : "text-slate-600"
                        }`}
                    >
                        {loading ? "..." : pendingApprovals}
                    </div>
                    <div className="space-y-3">
                        <div
                            className={`text-sm font-medium ${
                                theme === "dark" ? "text-slate-300" : "text-slate-600"
                            }`}
                        >
                            {pendingApprovals === 1 ? "Pending approval" : "Pending approvals"}
                        </div>
                        {pendingApprovals > 0 && (
                            <Badge
                                className={`text-xs px-3 py-1 font-medium ${
                                    theme === "dark"
                                        ? "bg-amber-900 text-amber-200 border-amber-700"
                                        : "bg-amber-100 text-amber-800 border-amber-200"
                                }`}
                            >
                                Action Required
                            </Badge>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
