"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { FileText, Search, Check, X, Clock, MessageSquare } from "lucide-react";
import { useAuth } from "@/context/authContext";
import { useToast } from "@/context/toastContext";
import { useTheme } from "@/components/theme-provider";
import { useFirestore } from "@/context/firestore-context";
import { DocumentDefinitionModel } from "@/lib/models/document";
import { approveDocument, rejectDocument } from "@/lib/backend/api/hr-settings/document-service";

/**
 * Shared Document Approvals Page for Employees and Managers
 */
export function DocumentApprovalsPage() {
    const { theme } = useTheme();
    const { showToast } = useToast();
    const { userData } = useAuth();
    const { documents: allDocuments, employees } = useFirestore();

    const [documents, setDocuments] = useState<DocumentDefinitionModel[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    // Approval dialog state
    const [selectedDocument, setSelectedDocument] = useState<DocumentDefinitionModel | null>(null);
    const [showApprovalDialog, setShowApprovalDialog] = useState(false);
    const [approvalAction, setApprovalAction] = useState<"approve" | "reject">("approve");
    const [approvalComment, setApprovalComment] = useState("");

    useEffect(() => {
        if (userData?.uid && allDocuments.length > 0) {
            fetchPendingApprovals();
        }
    }, [userData?.uid, allDocuments]);

    const fetchPendingApprovals = () => {
        if (!userData?.uid) return;

        setLoading(true);
        try {
            // Filter documents that need approval from this user
            const pendingApprovals = allDocuments.filter(doc => {
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
            });

            setDocuments(pendingApprovals);
        } catch (error) {
            console.error("Error fetching pending approvals:", error);
            showToast("Failed to load pending approvals", "Error", "error");
        } finally {
            setLoading(false);
        }
    };

    const isUserNextApprover = (doc: DocumentDefinitionModel, userUID: string): boolean => {
        if (doc.approvalWorkflowID === "manager") {
            // For manager approval, check if user is a manager with reportees
            // This is a simplified check - in reality, you'd check if user is line manager
            return userData?.role?.includes("Manager") || false;
        } else if (doc.approvalWorkflowID) {
            // For signature workflow, check if user is the current approver
            // This would need to be implemented based on the workflow logic
            // For now, return false
            return false;
        }

        return false;
    };

    const handleApproval = (doc: DocumentDefinitionModel, action: "approve" | "reject") => {
        setSelectedDocument(doc);
        setApprovalAction(action);
        setApprovalComment("");
        setShowApprovalDialog(true);
    };

    const submitApproval = async () => {
        if (!selectedDocument || !userData?.uid) return;

        try {
            const success =
                approvalAction === "approve"
                    ? await approveDocument(selectedDocument.id, userData.uid, approvalComment)
                    : await rejectDocument(
                        selectedDocument.id,
                        userData.uid,
                        approvalComment,
                        approvalComment,
                    );

            if (success) {
                showToast(
                    `Document ${approvalAction === "approve" ? "approved" : "rejected"} successfully`,
                    "Success",
                    "success",
                );
                setShowApprovalDialog(false);
                fetchPendingApprovals(); // Refresh the list
            } else {
                showToast(`Failed to ${approvalAction} document`, "Error", "error");
            }
        } catch (error) {
            console.error("Error submitting approval:", error);
            showToast(`Failed to ${approvalAction} document`, "Error", "error");
        }
    };

    const filteredDocuments = documents.filter(doc => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        return doc.name.toLowerCase().includes(term) || doc.subject.toLowerCase().includes(term);
    });

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "pending":
                return (
                    <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">
                        Pending Approval
                    </Badge>
                );
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    return (
        <div className={`${theme === "dark" ? "bg-black" : "bg-amber-50/30"} min-h-screen p-6`}>
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="space-y-2">
                    <h1
                        className={`${theme === "dark" ? "text-white" : "text-amber-900"} text-4xl font-bold`}
                    >
                        Document Approvals
                    </h1>
                    <p
                        className={`${theme === "dark" ? "text-gray-400" : "text-slate-600"} text-lg`}
                    >
                        Review and approve pending document requests
                    </p>
                </div>

                {/* Search */}
                <Card
                    className={`${theme === "dark" ? "bg-gray-900 border-gray-700" : "bg-white border-0"} shadow-lg rounded-xl`}
                >
                    <CardContent className="p-4">
                        <div className="relative max-w-md">
                            <Search
                                className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${theme === "dark" ? "text-gray-400" : "text-slate-400"}`}
                            />
                            <Input
                                placeholder="Search documents..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className={`pl-10 rounded-lg ${
                                    theme === "dark"
                                        ? "bg-gray-800 text-white border-gray-600 focus:border-amber-500"
                                        : "border-slate-200 focus:border-amber-500"
                                }`}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Documents Table */}
                <Card
                    className={`${theme === "dark" ? "bg-gray-900 border-gray-700" : "bg-white border-0"} shadow-lg rounded-xl overflow-hidden`}
                >
                    <CardHeader
                        className={`${theme === "dark" ? "bg-gray-800" : "bg-amber-800"} text-white p-6`}
                    >
                        <CardTitle className="flex items-center gap-4">
                            <FileText className="h-8 w-8" />
                            <div>
                                <div className="text-2xl">Pending Approvals</div>
                                <div
                                    className={`${theme === "dark" ? "text-gray-400" : "text-yellow-200"} text-sm font-normal`}
                                >
                                    {filteredDocuments.length} documents requiring your approval
                                </div>
                            </div>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {loading ? (
                            <div className="flex justify-center items-center py-12">
                                <Clock className="h-8 w-8 animate-spin text-amber-600" />
                                <span
                                    className={`ml-2 ${theme === "dark" ? "text-gray-400" : "text-slate-600"}`}
                                >
                                    Loading approvals...
                                </span>
                            </div>
                        ) : filteredDocuments.length === 0 ? (
                            <div className="text-center py-12">
                                <FileText
                                    className={`h-16 w-16 ${theme === "dark" ? "text-gray-600" : "text-slate-400"} mb-4 mx-auto`}
                                />
                                <h3
                                    className={`text-xl font-semibold mb-2 ${theme === "dark" ? "text-white" : "text-slate-900"}`}
                                >
                                    No Pending Approvals
                                </h3>
                                <p
                                    className={`${theme === "dark" ? "text-gray-400" : "text-slate-600"}`}
                                >
                                    You have no documents waiting for your approval.
                                </p>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow
                                        className={
                                            theme === "dark"
                                                ? "bg-black hover:bg-black"
                                                : "bg-amber-800 hover:bg-amber-800"
                                        }
                                    >
                                        <TableHead
                                            className={`${theme === "dark" ? "text-white" : "text-yellow-100"} font-semibold py-4 px-6`}
                                        >
                                            Document Name
                                        </TableHead>
                                        <TableHead
                                            className={`${theme === "dark" ? "text-white" : "text-yellow-100"} font-semibold py-4 px-6`}
                                        >
                                            Subject
                                        </TableHead>
                                        <TableHead
                                            className={`${theme === "dark" ? "text-white" : "text-yellow-100"} font-semibold py-4 px-6`}
                                        >
                                            Workflow Type
                                        </TableHead>
                                        <TableHead
                                            className={`${theme === "dark" ? "text-white" : "text-yellow-100"} font-semibold py-4 px-6`}
                                        >
                                            Status
                                        </TableHead>
                                        <TableHead
                                            className={`${theme === "dark" ? "text-white" : "text-yellow-100"} font-semibold py-4 px-6 text-right`}
                                        >
                                            Actions
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredDocuments.map((doc, index) => (
                                        <TableRow
                                            key={doc.id}
                                            className={
                                                theme === "dark"
                                                    ? index % 2 === 0
                                                        ? "bg-black hover:bg-gray-800"
                                                        : "bg-gray-900 hover:bg-gray-800"
                                                    : index % 2 === 0
                                                        ? "bg-white hover:bg-amber-50/50"
                                                        : "bg-slate-50/50 hover:bg-amber-50/50"
                                            }
                                        >
                                            <TableCell
                                                className={`${theme === "dark" ? "text-white" : "text-slate-900"} px-6 font-medium`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <FileText className="h-5 w-5 text-amber-600" />
                                                    <div>
                                                        <div className="font-medium">
                                                            {doc.name}
                                                        </div>
                                                        {doc.approvalWorkflowID && (
                                                            <div
                                                                className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-slate-500"}`}
                                                            >
                                                                Workflow: {doc.approvalWorkflowID}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell
                                                className={`${theme === "dark" ? "text-gray-300" : "text-slate-700"} px-6`}
                                            >
                                                {doc.subject}
                                            </TableCell>
                                            <TableCell
                                                className={`${theme === "dark" ? "text-gray-300" : "text-slate-700"} px-6`}
                                            >
                                                {doc.approvalWorkflowID === "manager"
                                                    ? "Manager Approval"
                                                    : doc.approvalWorkflowID
                                                        ? "Signature Workflow"
                                                        : "None"}
                                            </TableCell>
                                            <TableCell className="px-6">
                                                {getStatusBadge(
                                                    doc.approvalState?.status || "pending",
                                                )}
                                            </TableCell>
                                            <TableCell className="px-6 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() =>
                                                            handleApproval(doc, "approve")
                                                        }
                                                        className={
                                                            theme === "dark"
                                                                ? "border-green-700 text-green-400 hover:bg-green-900"
                                                                : "border-green-200 text-green-700 hover:bg-green-50"
                                                        }
                                                    >
                                                        <Check className="h-4 w-4 mr-1" />
                                                        Approve
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() =>
                                                            handleApproval(doc, "reject")
                                                        }
                                                        className={
                                                            theme === "dark"
                                                                ? "border-red-700 text-red-400 hover:bg-red-900"
                                                                : "border-red-200 text-red-700 hover:bg-red-50"
                                                        }
                                                    >
                                                        <X className="h-4 w-4 mr-1" />
                                                        Reject
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>

                {/* Approval Dialog */}
                <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-semibold text-amber-900 dark:text-amber-400">
                                {approvalAction === "approve" ? "Approve" : "Reject"} Document
                            </DialogTitle>
                        </DialogHeader>

                        {selectedDocument && (
                            <div className="space-y-4">
                                <div className="p-4 bg-slate-50 dark:bg-gray-800 rounded-lg">
                                    <h4 className="font-medium mb-2">{selectedDocument.name}</h4>
                                    <p className="text-sm text-slate-600 dark:text-slate-400">
                                        {selectedDocument.subject}
                                    </p>
                                </div>

                                <div>
                                    <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                        {approvalAction === "approve" ? "Approval" : "Rejection"}{" "}
                                        Comment (Optional)
                                    </Label>
                                    <Textarea
                                        value={approvalComment}
                                        onChange={e => setApprovalComment(e.target.value)}
                                        placeholder={
                                            approvalAction === "approve"
                                                ? "Add approval comments..."
                                                : "Add rejection reason..."
                                        }
                                        className="mt-1"
                                        rows={3}
                                    />
                                </div>

                                <DialogFooter>
                                    <Button
                                        variant="outline"
                                        onClick={() => setShowApprovalDialog(false)}
                                        className="border-slate-200 dark:border-gray-700 text-slate-600 dark:text-slate-300"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={submitApproval}
                                        className={
                                            approvalAction === "approve"
                                                ? "bg-green-600 hover:bg-green-700 text-white"
                                                : "bg-red-600 hover:bg-red-700 text-white"
                                        }
                                    >
                                        {approvalAction === "approve" ? (
                                            <>
                                                <Check className="h-4 w-4 mr-2" />
                                                Approve
                                            </>
                                        ) : (
                                            <>
                                                <X className="h-4 w-4 mr-2" />
                                                Reject
                                            </>
                                        )}
                                    </Button>
                                </DialogFooter>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}
