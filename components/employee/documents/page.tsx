"use client";

import { useTheme } from "@/components/theme-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/context/authContext";
import { useFirestore } from "@/context/firestore-context";
import { useToast } from "@/context/toastContext";
import { DocumentDefinitionModel } from "@/lib/models/document";
import {
    signDocument as signDocumentService,
    approveDocument as approveDocumentService,
} from "@/lib/backend/api/hr-settings/document-service";
import { replaceDynamicFields } from "@/lib/util/document-field-replacer";
import { AlertTriangle, CheckCircle, Download, Eye, FileText, Loader2, Search } from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { jsPDF } from "jspdf";
import { EmployeeDocumentDialog } from "./EmployeeDocumentDialog";

/**
 * Employee Documents Page
 * Shows document templates that are available for download based on approval status
 */
export function EmployeeDocumentsPage() {
    const { theme } = useTheme();
    const { showToast } = useToast();
    const { userData } = useAuth();
    const { documents: allDocuments, hrSettings, loading: firestoreLoading } = useFirestore();

    const [availableDocuments, setAvailableDocuments] = useState<DocumentDefinitionModel[]>([]);
    const [signableDocuments, setSignableDocuments] = useState<DocumentDefinitionModel[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [activeTab, setActiveTab] = useState<string>("documents");
    const [localDocuments, setLocalDocuments] = useState<DocumentDefinitionModel[]>([]);

    // Signature dialog state
    const [selectedDocument, setSelectedDocument] = useState<DocumentDefinitionModel | null>(null);
    const [showSignatureDialog, setShowSignatureDialog] = useState(false);
    const [isSigning, setIsSigning] = useState(false);

    // Preview dialog state
    const [showPreviewDialog, setShowPreviewDialog] = useState(false);

    // Approval dialog state
    const [showApprovalDialog, setShowApprovalDialog] = useState(false);
    const [documentToApprove, setDocumentToApprove] = useState<DocumentDefinitionModel | null>(
        null,
    );
    const [isApproving, setIsApproving] = useState(false);

    // Fetch visible documents for the current user
    useEffect(() => {
        if (userData?.uid && !firestoreLoading) {
            setLocalDocuments(allDocuments);
            fetchDocuments();
        }
    }, [userData?.uid, firestoreLoading, allDocuments]);

    const fetchDocuments = () => {
        if (!userData?.uid) return;

        setLoading(true);
        try {
            // Filter documents that are visible to this employee
            const visibleDocuments = allDocuments.filter(doc => {
                // Must be published and open visibility
                if (doc.status !== "Published" || doc.visibility !== "Open") {
                    return false;
                }

                // Check approval status
                if (!doc.approvalWorkflowID) {
                    // No approval required - document is available
                    return true;
                }

                // Check if approved OR if it's pending and user is current approver
                const isApproved = doc.approvalState?.status === "approved";
                const isPendingAndUserIsApprover =
                    (doc.approvalState?.status === "pending" || doc.approvalState === undefined) &&
                    isEmployeeApproverForDocument(doc, userData.uid);

                return isApproved || isPendingAndUserIsApprover;
            });

            // Separate into available (can download) and signable (need action)
            const available: DocumentDefinitionModel[] = [];
            const signable: DocumentDefinitionModel[] = [];

            visibleDocuments.forEach(doc => {
                const requiresSignature = doc.employeeSignatureNeeded === "Yes";
                const isSigned = userData?.signedDocuments?.includes(doc.id) || false;
                const approvalStatus = doc.approvalState?.status;
                const isPendingApproval =
                    approvalStatus === "pending" || approvalStatus === undefined;
                const isFullyApproved = approvalStatus === "approved";
                const needsApproval =
                    isPendingApproval && isEmployeeApproverForDocument(doc, userData.uid);
                const needsEmployeeSignature = isFullyApproved && requiresSignature && !isSigned;

                if (needsApproval || needsEmployeeSignature) {
                    signable.push(doc);
                } else {
                    available.push(doc);
                }
            });

            setAvailableDocuments(available);
            setSignableDocuments(signable);
        } catch (error) {
            console.error("Error fetching documents:", error);
            showToast("Failed to load documents", "Error", "error");
        } finally {
            setLoading(false);
        }
    };

    const isEmployeeApproverForDocument = (
        doc: DocumentDefinitionModel,
        employeeUID: string,
    ): boolean => {
        if (!doc.approvalWorkflowID) {
            return false;
        }

        // Find the signature workflow
        const workflow = hrSettings.signatureWorkflows.find(
            w => w.id === doc.approvalWorkflowID && w.active,
        );
        if (!workflow) {
            return false;
        }

        // Check if the current approver index matches this employee's position in the workflow
        // If approvalState is undefined, assume it's the first approver (index 1 for 1-based ordering)
        const currentApproverIndex = doc.approvalState?.currentApproverIndex ?? 1;
        const currentApprover = workflow.approvers.find(
            approver => approver.order === currentApproverIndex,
        );

        return currentApprover?.employeeUID === employeeUID;
    };

    const handleDownload = async (doc: DocumentDefinitionModel) => {
        // Check if signature is required and not signed
        if (doc.employeeSignatureNeeded === "Yes" && userData?.signedDocuments) {
            if (!userData.signedDocuments.includes(doc.id)) {
                // Show signature dialog
                setSelectedDocument(doc);
                setShowSignatureDialog(true);
                return;
            }
        }

        // Proceed with download
        performDownload(doc);
    };

    const performDownload = async (doc: DocumentDefinitionModel) => {
        // Generate document content with dynamic data replacement using reusable function
        const content = replaceDynamicFields(doc.content.join("\n\n"), userData, hrSettings);

        // Generate PDF using jsPDF
        const pdf = new jsPDF({
            orientation: "portrait",
            unit: "mm",
            format: "a4",
        });

        // Add content to PDF
        const pageWidth = pdf.internal.pageSize.getWidth();
        const margin = 20;
        const maxWidth = pageWidth - 2 * margin;

        // Split content by paragraphs and add to PDF
        const paragraphs = content.split("\n\n");
        let yPosition = margin;

        paragraphs.forEach(paragraph => {
            if (paragraph.trim()) {
                // Split long paragraphs to fit page width
                const lines = pdf.splitTextToSize(paragraph, maxWidth);

                lines.forEach((line: string) => {
                    if (yPosition > pdf.internal.pageSize.getHeight() - margin) {
                        pdf.addPage();
                        yPosition = margin;
                    }
                    pdf.text(line, margin, yPosition);
                    yPosition += 7;
                });

                yPosition += 5; // Add space between paragraphs
            }
        });

        // Save the PDF
        pdf.save(
            `${doc.name.replace(/[^a-z0-9]/gi, "_")}_${new Date().toISOString().split("T")[0]}.pdf`,
        );

        showToast(`Downloading ${doc.name}`, "Success", "success");
    };

    const handleApproveDocument = async (doc: DocumentDefinitionModel) => {
        if (!userData?.uid) return;

        // Show confirmation dialog
        setDocumentToApprove(doc);
        setShowApprovalDialog(true);
    };

    const confirmApproveDocument = async () => {
        if (!userData?.uid || !documentToApprove) return;

        setIsApproving(true);
        try {
            const success = await approveDocumentService(documentToApprove.id, userData.uid);
            if (success) {
                showToast("Document approved successfully", "Success", "success");

                // Update the document in local state to reflect the approval
                const updatedDocuments = localDocuments.map(doc => {
                    if (doc.id === documentToApprove.id) {
                        // Update the approval state
                        const updatedApprovalState = doc.approvalState
                            ? { ...doc.approvalState }
                            : {
                                status: "pending" as const,
                                currentApproverIndex: 1,
                                approvedBy: [],
                                approvedTimestamps: [],
                                rejectedBy: null,
                                rejectionReason: null,
                                approverComments: [],
                            };

                        // Find the workflow to determine if this is the final approval
                        const workflow = hrSettings.signatureWorkflows.find(
                            w => w.id === doc.approvalWorkflowID && w.active,
                        );
                        if (workflow) {
                            const currentApproverIndex =
                                updatedApprovalState.currentApproverIndex ?? 1;
                            const currentApprover = workflow.approvers.find(
                                approver => approver.order === currentApproverIndex,
                            );

                            if (currentApprover) {
                                updatedApprovalState.approvedBy = [
                                    ...(updatedApprovalState.approvedBy || []),
                                    userData.uid,
                                ];
                                updatedApprovalState.approvedTimestamps = [
                                    ...(updatedApprovalState.approvedTimestamps || []),
                                    new Date().toISOString(),
                                ];

                                // Check if this is the final approval
                                if (currentApproverIndex >= workflow.approvers.length) {
                                    updatedApprovalState.status = "approved";
                                } else {
                                    updatedApprovalState.currentApproverIndex =
                                        currentApproverIndex + 1;
                                }
                            }
                        }

                        return { ...doc, approvalState: updatedApprovalState };
                    }
                    return doc;
                });

                setLocalDocuments(updatedDocuments);
                // Refresh documents to update the list
                fetchDocuments();
            } else {
                showToast("Failed to approve document", "Error", "error");
            }
        } catch (error) {
            console.error("Error approving document:", error);
            showToast("Failed to approve document", "Error", "error");
        } finally {
            setIsApproving(false);
            setShowApprovalDialog(false);
            setDocumentToApprove(null);
        }
    };

    const handleSignAndDownload = async () => {
        if (!selectedDocument || !userData?.uid) return;

        setIsSigning(true);
        try {
            const success = await signDocumentService(selectedDocument.id, userData.uid);
            if (success) {
                showToast("Document signed successfully", "Success", "success");
                setShowSignatureDialog(false);
                // Refresh user data to include the signed document
                // The signedDocuments array will be updated in Firestore
                // and the component will re-render with the updated data
                performDownload(selectedDocument);
            } else {
                showToast("Failed to sign document", "Error", "error");
            }
        } catch (error) {
            console.error("Error signing document:", error);
            showToast("Failed to sign document", "Error", "error");
        } finally {
            setIsSigning(false);
        }
    };

    const handleViewDocument = (doc: DocumentDefinitionModel) => {
        // Set the selected document and open the dialog
        // EmployeeDocumentDialog handles content rendering internally
        setSelectedDocument(doc);
        setShowPreviewDialog(true);
    };

    const isDocumentSigned = (docId: string): boolean => {
        return userData?.signedDocuments?.includes(docId) || false;
    };

    // Filter documents by search term and active tab
    const getFilteredDocuments = () => {
        const docs = activeTab === "documents" ? availableDocuments : signableDocuments;
        if (!searchTerm) return docs;
        const term = searchTerm.toLowerCase();
        return docs.filter(
            doc =>
                doc.name.toLowerCase().includes(term) || doc.subject.toLowerCase().includes(term),
        );
    };

    // Document table component
    const DocumentTable = ({
        documents,
        loading,
        searchTerm,
        theme,
        onDownload,
        onApprove,
        isDocumentSigned,
        tabType,
        showApproveButton,
    }: {
        documents: DocumentDefinitionModel[];
        loading: boolean;
        searchTerm: string;
        theme: string;
        onDownload: (doc: DocumentDefinitionModel) => void;
        onApprove: (doc: DocumentDefinitionModel) => void;
        isDocumentSigned: (docId: string) => boolean;
        tabType: "documents" | "sign_documents";
        showApproveButton: boolean;
    }) => (
        <Card
            className={`${theme === "dark" ? "bg-gray-900 border-gray-700" : "bg-white border-0"} shadow-lg rounded-xl overflow-hidden`}
        >
            <CardHeader
                className={`${theme === "dark" ? "bg-gray-800" : "bg-amber-800"} text-white p-6`}
            >
                <CardTitle className="flex items-center gap-4">
                    <FileText className="h-8 w-8" />
                    <div>
                        <div className="text-2xl">
                            {tabType === "documents" ? "Available Documents" : "Documents to Sign"}
                        </div>
                        <div
                            className={`${theme === "dark" ? "text-gray-400" : "text-yellow-200"} text-sm font-normal`}
                        >
                            {documents.length}{" "}
                            {tabType === "documents"
                                ? "documents available for download"
                                : "documents requiring signature"}
                        </div>
                    </div>
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                {loading ? (
                    <div className="flex justify-center items-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
                        <span
                            className={`ml-2 ${theme === "dark" ? "text-gray-400" : "text-slate-600"}`}
                        >
                            Loading documents...
                        </span>
                    </div>
                ) : documents.length === 0 ? (
                    <div className="text-center py-12">
                        <FileText
                            className={`h-16 w-16 ${theme === "dark" ? "text-gray-600" : "text-slate-400"} mb-4 mx-auto`}
                        />
                        <h3
                            className={`text-xl font-semibold mb-2 ${theme === "dark" ? "text-white" : "text-slate-900"}`}
                        >
                            {tabType === "documents"
                                ? "No Documents Available"
                                : "No Documents to Sign"}
                        </h3>
                        <p className={`${theme === "dark" ? "text-gray-400" : "text-slate-600"}`}>
                            {searchTerm
                                ? "No documents match your search criteria. Try adjusting your search."
                                : tabType === "documents"
                                    ? "No documents are currently available for download."
                                    : "No documents require your signature at this time."}
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
                            {getFilteredDocuments().map((doc, index) => {
                                const requiresSignature = doc.employeeSignatureNeeded === "Yes";
                                const isSigned = isDocumentSigned(doc.id);

                                // Only check for approval needs when showApproveButton is true (sign_documents tab)
                                const needsApproval =
                                    showApproveButton &&
                                    isEmployeeApproverForDocument(doc, userData?.uid || "");
                                const needsEmployeeSignature =
                                    tabType === "sign_documents" && requiresSignature && !isSigned;

                                // Show sign/approve button if employee needs to approve (and allowed by prop) or sign
                                const canApprove = showApproveButton && needsApproval;
                                const canSign = needsEmployeeSignature;

                                // Show sign button if employee needs to approve (and allowed) or sign
                                const showSignButton = canApprove || canSign;

                                // Can download if: not in sign documents tab, or all requirements are met
                                const canDownload =
                                    tabType === "documents" ||
                                    (!needsApproval && !needsEmployeeSignature);

                                return (
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
                                                    <div className="font-medium">{doc.name}</div>
                                                    {doc.subject && (
                                                        <div
                                                            className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-slate-500"}`}
                                                        >
                                                            {doc.subject}
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
                                        <TableCell className="px-6">
                                            <div className="flex items-center gap-2">
                                                {showApproveButton && needsApproval && (
                                                    <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300">
                                                        <AlertTriangle className="h-3 w-3 mr-1" />
                                                        Approval Required
                                                    </Badge>
                                                )}
                                                {needsEmployeeSignature && (
                                                    <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">
                                                        <AlertTriangle className="h-3 w-3 mr-1" />
                                                        Signature Required
                                                    </Badge>
                                                )}
                                                {!needsApproval &&
                                                    !needsEmployeeSignature &&
                                                    tabType === "documents" && (
                                                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                                                        <CheckCircle className="h-3 w-3 mr-1" />
                                                            Ready
                                                    </Badge>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="px-6 text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleViewDocument(doc)}
                                                    className={
                                                        theme === "dark"
                                                            ? "border-gray-600 text-gray-400 hover:bg-gray-800"
                                                            : "border-gray-200 text-gray-600 hover:bg-gray-50"
                                                    }
                                                >
                                                    <Eye className="h-4 w-4 mr-2" />
                                                    View
                                                </Button>
                                                {showSignButton && (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() =>
                                                            canApprove
                                                                ? onApprove(doc)
                                                                : onDownload(doc)
                                                        }
                                                        className={
                                                            theme === "dark"
                                                                ? "border-purple-700 text-purple-400 hover:bg-purple-900"
                                                                : "border-purple-200 text-purple-700 hover:bg-purple-50"
                                                        }
                                                    >
                                                        <CheckCircle className="h-4 w-4 mr-2" />
                                                        {canApprove ? "Approve" : "Sign"}
                                                    </Button>
                                                )}
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => onDownload(doc)}
                                                    disabled={!canDownload}
                                                    className={
                                                        canDownload
                                                            ? theme === "dark"
                                                                ? "border-blue-700 text-blue-400 hover:bg-blue-900"
                                                                : "border-blue-200 text-blue-700 hover:bg-blue-50"
                                                            : theme === "dark"
                                                                ? "border-gray-600 text-gray-500 cursor-not-allowed"
                                                                : "border-gray-200 text-gray-400 cursor-not-allowed"
                                                    }
                                                >
                                                    <Download className="h-4 w-4 mr-2" />
                                                    Download
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
    );

    return (
        <div className={`${theme === "dark" ? "bg-black" : "bg-amber-50/30"} min-h-screen p-6`}>
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="space-y-2">
                    <h1
                        className={`${theme === "dark" ? "text-white" : "text-amber-900"} text-4xl font-bold`}
                    >
                        My Documents
                    </h1>
                    <p
                        className={`${theme === "dark" ? "text-gray-400" : "text-slate-600"} text-lg`}
                    >
                        View and download available documents
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

                {/* Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList
                        className={`grid w-full grid-cols-2 rounded-xl shadow-lg border ${
                            theme === "dark"
                                ? "bg-gray-900 border-gray-700"
                                : "bg-white border-amber-200"
                        }`}
                    >
                        <TabsTrigger
                            value="documents"
                            className={`data-[state=active]:bg-amber-600 data-[state=active]:text-white ${
                                theme === "dark" ? "text-gray-300" : "text-amber-900"
                            }`}
                        >
                            Documents ({availableDocuments.length})
                        </TabsTrigger>
                        <TabsTrigger
                            value="sign_documents"
                            className={`data-[state=active]:bg-amber-600 data-[state=active]:text-white ${
                                theme === "dark" ? "text-gray-300" : "text-amber-900"
                            }`}
                        >
                            Sign Documents ({signableDocuments.length})
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="documents" className="mt-6">
                        <DocumentTable
                            documents={getFilteredDocuments()}
                            loading={loading}
                            searchTerm={searchTerm}
                            theme={theme}
                            onDownload={handleDownload}
                            onApprove={handleApproveDocument}
                            isDocumentSigned={isDocumentSigned}
                            tabType="documents"
                            showApproveButton={false}
                        />
                    </TabsContent>

                    <TabsContent value="sign_documents" className="mt-6">
                        <DocumentTable
                            documents={getFilteredDocuments()}
                            loading={loading}
                            searchTerm={searchTerm}
                            theme={theme}
                            onDownload={handleDownload}
                            onApprove={handleApproveDocument}
                            isDocumentSigned={isDocumentSigned}
                            tabType="sign_documents"
                            showApproveButton={true}
                        />
                    </TabsContent>
                </Tabs>

                {/* Info Card */}
                <Card
                    className={`${theme === "dark" ? "bg-gray-900 border-gray-700" : "bg-amber-50 border-amber-200"}`}
                >
                    <CardHeader>
                        <CardTitle
                            className={`text-lg ${theme === "dark" ? "text-white" : "text-amber-900"}`}
                        >
                            About Document Downloads
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div
                            className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-slate-600"} space-y-2`}
                        >
                            <p>
                                • Documents become available once approved by the required
                                approvers.
                            </p>
                            <p>• Some documents require your digital signature before download.</p>
                            <p>• Make sure your signature is uploaded in your profile settings.</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Signature Dialog */}
            <Dialog open={showSignatureDialog} onOpenChange={setShowSignatureDialog}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-semibold text-amber-900 dark:text-amber-400">
                            Sign Document
                        </DialogTitle>
                    </DialogHeader>

                    {selectedDocument && (
                        <div className="space-y-4">
                            <div className="p-4 bg-slate-50 dark:bg-gray-800 rounded-lg">
                                <h4 className="font-medium mb-2">{selectedDocument.name}</h4>
                                <p className="text-sm text-slate-600 dark:text-slate-400">
                                    This document requires your signature before download. By
                                    signing, you confirm that you have read and agree to the
                                    document contents.
                                </p>
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <Button
                                    variant="outline"
                                    onClick={() => setShowSignatureDialog(false)}
                                    className="border-slate-200 dark:border-gray-700 text-slate-600 dark:text-slate-300"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleSignAndDownload}
                                    disabled={isSigning}
                                    className="bg-blue-600 hover:bg-blue-700 text-white"
                                >
                                    {isSigning ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Signing...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle className="h-4 w-4 mr-2" />
                                            Sign & Download
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Preview Dialog - Replaced with EmployeeDocumentDialog */}
            <EmployeeDocumentDialog
                isOpen={showPreviewDialog}
                onClose={() => setShowPreviewDialog(false)}
                documentCategory="generic"
                genericDocument={selectedDocument}
            />

            {/* Approval Confirmation Dialog */}
            <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-semibold text-amber-900 dark:text-amber-400">
                            Approve Document
                        </DialogTitle>
                        <DialogDescription>
                            Are you sure you want to approve this document? This action cannot be
                            undone.
                        </DialogDescription>
                    </DialogHeader>

                    {documentToApprove && (
                        <div className="space-y-4">
                            <div className="p-4 bg-slate-50 dark:bg-gray-800 rounded-lg">
                                <h4 className="font-medium mb-2">{documentToApprove.name}</h4>
                                <p className="text-sm text-slate-600 dark:text-slate-400">
                                    {documentToApprove.subject || "No subject"}
                                </p>
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setShowApprovalDialog(false);
                                        setDocumentToApprove(null);
                                    }}
                                    disabled={isApproving}
                                    className="border-slate-200 dark:border-gray-700 text-slate-600 dark:text-slate-300"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={confirmApproveDocument}
                                    disabled={isApproving}
                                    className="bg-green-600 hover:bg-green-700 text-white"
                                >
                                    {isApproving ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Approving...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle className="h-4 w-4 mr-2" />
                                            Approve
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}

export default EmployeeDocumentsPage;
