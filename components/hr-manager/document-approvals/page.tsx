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
import { FileText, Eye, Search, Check, X, Clock, User, MessageSquare } from "lucide-react";
import { useAuth } from "@/context/authContext";
import { useToast } from "@/context/toastContext";
import { useTheme } from "@/components/theme-provider";
import { useFirestore } from "@/context/firestore-context";
import { DocumentRequestModel } from "@/lib/models/signature-workflow";
import {
    getDocumentRequestsByApprover,
    approveDocumentRequest,
    rejectDocumentRequest,
} from "@/lib/backend/api/hr-settings/document-request-service";
import { getCurrentApprover } from "@/lib/util/document-approval";

export function DocumentApprovalsPage() {
    const { theme } = useTheme();
    const { showToast } = useToast();
    const { userData } = useAuth();
    const { documents } = useFirestore();

    const [requests, setRequests] = useState<DocumentRequestModel[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    // Approval dialog state
    const [selectedRequest, setSelectedRequest] = useState<DocumentRequestModel | null>(null);
    const [showApprovalDialog, setShowApprovalDialog] = useState(false);
    const [approvalAction, setApprovalAction] = useState<"approve" | "reject">("approve");
    const [approvalComment, setApprovalComment] = useState("");

    useEffect(() => {
        if (userData?.uid) {
            fetchRequests();
        }
    }, [userData?.uid]);

    const fetchRequests = async () => {
        if (!userData?.uid) return;

        setLoading(true);
        try {
            const data = await getDocumentRequestsByApprover(userData.uid);
            setRequests(data);
        } catch (error) {
            console.error("Error fetching document requests:", error);
            showToast("Failed to load document requests", "Error", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleApproval = (request: DocumentRequestModel, action: "approve" | "reject") => {
        setSelectedRequest(request);
        setApprovalAction(action);
        setApprovalComment("");
        setShowApprovalDialog(true);
    };

    const submitApproval = async () => {
        if (!selectedRequest || !userData?.uid) return;

        try {
            const success =
                approvalAction === "approve"
                    ? await approveDocumentRequest(
                        selectedRequest.id,
                        userData.uid,
                        approvalComment,
                        userData.uid,
                    )
                    : await rejectDocumentRequest(
                        selectedRequest.id,
                        userData.uid,
                        approvalComment,
                        approvalComment,
                        userData.uid,
                    );

            if (success) {
                showToast(
                    `Document ${approvalAction === "approve" ? "approved" : "rejected"} successfully`,
                    "Success",
                    "success",
                );
                setShowApprovalDialog(false);
                fetchRequests(); // Refresh the list
            } else {
                showToast(`Failed to ${approvalAction} document`, "Error", "error");
            }
        } catch (error) {
            console.error("Error submitting approval:", error);
            showToast(`Failed to ${approvalAction} document`, "Error", "error");
        }
    };

    const filteredRequests = requests.filter(request => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        return (
            request.documentName.toLowerCase().includes(term) ||
            request.employeeName.toLowerCase().includes(term)
        );
    });

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "pending":
                return (
                    <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">
                        Pending
                    </Badge>
                );
            case "approved":
                return (
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                        Approved
                    </Badge>
                );
            case "rejected":
                return (
                    <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">
                        Rejected
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

                {/* Requests Table */}
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
                                    {filteredRequests.length} requests requiring your approval
                                </div>
                            </div>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {loading ? (
                            <div className="flex justify-center items-center py-12">
                                <Clock className="h-8 w-8 animate-spin text-amber-600 mr-2" />
                                <span
                                    className={`ml-2 ${theme === "dark" ? "text-gray-400" : "text-slate-600"}`}
                                >
                                    Loading requests...
                                </span>
                            </div>
                        ) : filteredRequests.length === 0 ? (
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
                                            Document
                                        </TableHead>
                                        <TableHead
                                            className={`${theme === "dark" ? "text-white" : "text-yellow-100"} font-semibold py-4 px-6`}
                                        >
                                            Employee
                                        </TableHead>
                                        <TableHead
                                            className={`${theme === "dark" ? "text-white" : "text-yellow-100"} font-semibold py-4 px-6`}
                                        >
                                            Requestor
                                        </TableHead>
                                        <TableHead
                                            className={`${theme === "dark" ? "text-white" : "text-yellow-100"} font-semibold py-4 px-6`}
                                        >
                                            Status
                                        </TableHead>
                                        <TableHead
                                            className={`${theme === "dark" ? "text-white" : "text-yellow-100"} font-semibold py-4 px-6`}
                                        >
                                            Requested
                                        </TableHead>
                                        <TableHead
                                            className={`${theme === "dark" ? "text-white" : "text-yellow-100"} font-semibold py-4 px-6 text-right`}
                                        >
                                            Actions
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredRequests.map((request, index) => (
                                        <TableRow
                                            key={request.id}
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
                                                            {request.documentName}
                                                        </div>
                                                        {request.workflowName && (
                                                            <div
                                                                className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-slate-500"}`}
                                                            >
                                                                Workflow: {request.workflowName}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell
                                                className={`${theme === "dark" ? "text-gray-300" : "text-slate-700"} px-6`}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <User className="h-4 w-4" />
                                                    {request.employeeName}
                                                </div>
                                            </TableCell>
                                            <TableCell
                                                className={`${theme === "dark" ? "text-gray-300" : "text-slate-700"} px-6`}
                                            >
                                                {request.requestorName}
                                            </TableCell>
                                            <TableCell className="px-6">
                                                {getStatusBadge(request.status)}
                                            </TableCell>
                                            <TableCell
                                                className={`${theme === "dark" ? "text-gray-400" : "text-slate-600"} px-6 text-sm`}
                                            >
                                                {new Date(request.timestamp).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell className="px-6 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() =>
                                                            handleApproval(request, "approve")
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
                                                            handleApproval(request, "reject")
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
                                Request
                            </DialogTitle>
                        </DialogHeader>

                        {selectedRequest && (
                            <div className="space-y-4">
                                <div className="p-4 bg-slate-50 dark:bg-gray-800 rounded-lg">
                                    <h4 className="font-medium mb-2">
                                        {selectedRequest.documentName}
                                    </h4>
                                    <p className="text-sm text-slate-600 dark:text-slate-400">
                                        Requested by: {selectedRequest.requestorName}
                                    </p>
                                    <p className="text-sm text-slate-600 dark:text-slate-400">
                                        For employee: {selectedRequest.employeeName}
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

export default DocumentApprovalsPage;
