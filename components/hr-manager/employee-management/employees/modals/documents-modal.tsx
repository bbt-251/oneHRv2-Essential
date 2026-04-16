"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { X, FileText, Upload, Download, Eye, Trash2, Plus } from "lucide-react";
import { EmployeeModel } from "@/lib/models/employee";
import { EmployeeDocument } from "@/lib/models/type";
import { useToast } from "@/context/toastContext";
import { useAuth } from "@/context/authContext";
import {
    getEmployeeDocuments,
    uploadEmployeeDocument,
    deleteEmployeeDocument,
    getDocumentDownloadUrl,
} from "@/lib/backend/api/employee-management/employee-document-service";

interface DocumentsModalProps {
    employee: EmployeeModel;
    isOpen: boolean;
    onClose: () => void;
}

export function DocumentsModal({ employee, isOpen, onClose }: DocumentsModalProps) {
    const [documents, setDocuments] = useState<EmployeeDocument[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isUploading, setIsUploading] = useState<boolean>(false);
    const [isDeleting, setIsDeleting] = useState<boolean>(false);
    const [showUploadForm, setShowUploadForm] = useState(false);
    const [uploadForm, setUploadForm] = useState({
        name: "",
        type: "",
        file: null as File | null,
    });
    const { showToast } = useToast();
    const { userData } = useAuth();

    const documentTypes = [
        "Contract",
        "Identification",
        "Medical",
        "Educational",
        "Certification",
        "Performance Review",
        "Disciplinary",
        "Other",
    ];

    // Load documents when modal opens
    useEffect(() => {
        const loadDocuments = async () => {
            try {
                setIsLoading(true);
                const docs = await getEmployeeDocuments(employee.uid);
                setDocuments(docs);
            } catch (error) {
                console.error("Error loading documents:", error);
                showToast("Failed to load documents", "error", "error");
            } finally {
                setIsLoading(false);
            }
        };

        if (isOpen) {
            loadDocuments();
        }
    }, [employee.uid, isOpen]);

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!uploadForm.file) return;

        // Validate file type and size
        const allowedMimes = [
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "image/png",
            "image/jpeg",
        ];
        const allowedExts = [".pdf", ".doc", ".docx", ".png", ".jpg", ".jpeg"];
        const maxSizeBytes = 10 * 1024 * 1024; // 10 MB

        const ext = `.${uploadForm.file.name.split(".").pop()?.toLowerCase()}`;
        const isMimeOk = allowedMimes.includes(uploadForm.file.type);
        const isExtOk = allowedExts.includes(ext);
        if (!(isMimeOk && isExtOk)) {
            showToast(
                "Invalid file type. Allowed: PDF, DOC, DOCX, PNG, JPG (max 10MB)",
                "error",
                "error",
            );
            return;
        }
        if (uploadForm.file.size > maxSizeBytes) {
            showToast("File too large. Max 10MB.", "error", "error");
            return;
        }

        try {
            setIsUploading(true);

            const uploadedDocument = await uploadEmployeeDocument(
                employee.uid,
                {
                    uid: employee.uid,
                    name: uploadForm.name || uploadForm.file.name,
                    type: uploadForm.type,
                },
                uploadForm.file,
                `${userData?.firstName || ""} ${userData?.middleName ? userData.middleName + " " : ""}${userData?.surname || ""}`.trim() ||
                    "Unknown User",
            );

            if (uploadedDocument) {
                setDocuments([...documents, uploadedDocument]);
                showToast("Document uploaded successfully", "success", "success");
                setUploadForm({ name: "", type: "", file: null });
                setShowUploadForm(false);
            } else {
                showToast("Failed to upload document", "error", "error");
            }
        } catch (error) {
            console.error("Error uploading document:", error);
            showToast("Failed to upload document", "error", "error");
        } finally {
            setIsUploading(false);
        }
    };

    const handleDeleteDocument = async (docId: string) => {
        try {
            setIsDeleting(true);
            const success = await deleteEmployeeDocument(docId);

            if (success) {
                setDocuments(documents.filter(doc => doc.id !== docId));
                showToast("Document deleted successfully", "success", "success");
            } else {
                showToast("Failed to delete document", "error", "error");
            }
        } catch (error) {
            console.error("Error deleting document:", error);
            showToast("Failed to delete document", "error", "error");
        } finally {
            setIsDeleting(false);
        }
    };

    const handleViewDocument = async (documentId: string) => {
        try {
            setIsLoading(true);
            const downloadUrl = await getDocumentDownloadUrl(documentId);
            if (downloadUrl) {
                // Open in new tab to view the document
                window.open(downloadUrl, "_blank", "noopener,noreferrer");
            } else {
                showToast("Document not found", "error", "error");
            }
        } catch (error) {
            console.error("Error viewing document:", error);
            showToast("Failed to view document", "error", "error");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDownloadDocument = async (documentId: string) => {
        try {
            setIsLoading(true);
            const downloadUrl = await getDocumentDownloadUrl(documentId);
            if (downloadUrl) {
                // Fetch the file content
                const response = await fetch(downloadUrl);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const blob = await response.blob();
                const documentName =
                    documents.find(doc => doc.id === documentId)?.name || "document";

                // Create a temporary anchor element to trigger download
                const url = window.URL.createObjectURL(blob);
                const anchor = document.createElement("a");
                anchor.href = url;
                anchor.download = documentName;
                document.body.appendChild(anchor);
                anchor.click();
                document.body.removeChild(anchor);

                // Clean up the object URL
                window.URL.revokeObjectURL(url);

                showToast("Document downloaded successfully", "success", "success");
            } else {
                showToast("Document not found", "error", "error");
            }
        } catch (error) {
            console.error("Error downloading document:", error);
            showToast("Failed to download document", "error", "error");
        } finally {
            setIsLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-[95vw] max-h-[90vh] overflow-hidden flex flex-col">
                <DialogHeader className="flex-shrink-0">
                    <DialogTitle className="text-2xl font-bold text-brand-800 dark:text-white">
                        Document Management
                        <span className="block text-sm font-normal text-muted-foreground mt-1">
                            {employee.firstName} {employee.surname} ({employee.employeeID})
                        </span>
                    </DialogTitle>
                </DialogHeader>

                <div className="flex-1 flex flex-col overflow-hidden">
                    <div className="flex justify-between items-center p-4 border-b flex-shrink-0">
                        <h3 className="text-lg font-semibold text-primary-900">
                            Documents ({documents.length})
                        </h3>
                        <Button
                            onClick={() => setShowUploadForm(!showUploadForm)}
                            className="bg-primary-600 hover:bg-primary-700"
                            disabled={isUploading || isDeleting}
                        >
                            {showUploadForm ? (
                                <X className="w-4 h-4 mr-2" />
                            ) : (
                                <Plus className="w-4 h-4 mr-2" />
                            )}
                            {showUploadForm ? "Cancel" : "Upload Document"}
                        </Button>
                    </div>

                    {showUploadForm && (
                        <div className=" p-4 border-b flex-shrink-0">
                            <form onSubmit={handleUpload} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="docName">Document Name</Label>
                                        <Input
                                            id="docName"
                                            value={uploadForm.name}
                                            onChange={e =>
                                                setUploadForm({
                                                    ...uploadForm,
                                                    name: e.target.value,
                                                })
                                            }
                                            placeholder="Enter document name"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="docType">Document Type</Label>
                                        <Select
                                            value={uploadForm.type}
                                            onValueChange={value =>
                                                setUploadForm({ ...uploadForm, type: value })
                                            }
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {documentTypes.map(type => (
                                                    <SelectItem key={type} value={type}>
                                                        {type}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div>
                                    <Label htmlFor="docFile">Select File</Label>
                                    <Input
                                        id="docFile"
                                        type="file"
                                        onChange={e =>
                                            setUploadForm({
                                                ...uploadForm,
                                                file: e.target.files?.[0] || null,
                                            })
                                        }
                                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                        required
                                    />
                                </div>
                                <div className="flex justify-end gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setShowUploadForm(false)}
                                        disabled={isUploading}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={
                                            !uploadForm.file || !uploadForm.type || isUploading
                                        }
                                    >
                                        <Upload className="w-4 h-4 mr-2" />
                                        {isUploading ? "Uploading..." : "Upload"}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    )}

                    <div className="flex-1 overflow-auto border-t">
                        {isLoading && documents.length === 0 ? (
                            <div className="p-6 text-center">
                                <p className="text-gray-500">Loading documents...</p>
                            </div>
                        ) : documents.length === 0 ? (
                            <div className="p-6 text-center">
                                <p className="text-gray-500">
                                    No documents found for this employee.
                                </p>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader className="sticky top-0 bg-secondary-100 z-10">
                                    <TableRow>
                                        <TableHead className="text-black">Document Name</TableHead>
                                        <TableHead className="text-black">Type</TableHead>
                                        <TableHead className="text-black">Upload Date</TableHead>
                                        <TableHead className="text-black">Size</TableHead>
                                        <TableHead className="text-black">Uploaded By</TableHead>
                                        <TableHead className="text-black">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {documents.map(doc => (
                                        <TableRow key={doc.id + doc.name}>
                                            <TableCell className="font-medium">
                                                {doc.name}
                                            </TableCell>
                                            <TableCell>{doc.type}</TableCell>
                                            <TableCell>{formatDate(doc.uploadDate)}</TableCell>
                                            <TableCell>{doc.size}</TableCell>
                                            <TableCell>{doc.uploadedBy}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleViewDocument(doc.id)}
                                                        disabled={
                                                            isLoading || isUploading || isDeleting
                                                        }
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() =>
                                                            handleDownloadDocument(doc.id)
                                                        }
                                                        disabled={
                                                            isLoading || isUploading || isDeleting
                                                        }
                                                    >
                                                        <Download className="w-4 h-4" />
                                                    </Button>
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="text-red-600 hover:text-red-700"
                                                                disabled={
                                                                    isLoading ||
                                                                    isUploading ||
                                                                    isDeleting
                                                                }
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </Button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>
                                                                    Delete Document
                                                                </AlertDialogTitle>
                                                                <AlertDialogDescription>
                                                                    Are you sure you want to delete
                                                                    "{doc.name}"? This action cannot
                                                                    be undone.
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel
                                                                    disabled={isDeleting}
                                                                >
                                                                    Cancel
                                                                </AlertDialogCancel>
                                                                <AlertDialogAction
                                                                    onClick={() =>
                                                                        handleDeleteDocument(doc.id)
                                                                    }
                                                                    className="bg-red-600 hover:bg-red-700"
                                                                    disabled={isDeleting}
                                                                >
                                                                    {isDeleting
                                                                        ? "Deleting..."
                                                                        : "Delete"}
                                                                </AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
