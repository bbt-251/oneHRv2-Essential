"use client";

import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DocumentDefinitionModel } from "@/lib/models/document";
import { FileDocumentModel } from "@/lib/models/file-document";
import { useTheme } from "@/components/theme-provider";

interface ViewTemplateDialogProps {
    open: boolean;
    onOpenChange: (value: boolean) => void;
    template: DocumentDefinitionModel | null;
    // File document arrays for resolving IDs to names
    headerDocuments?: FileDocumentModel[];
    footerDocuments?: FileDocumentModel[];
    signatureDocuments?: FileDocumentModel[];
    stampDocuments?: FileDocumentModel[];
    initialDocuments?: FileDocumentModel[];
}

// Helper to get document name by ID
const getDocumentName = (id: string, documents: FileDocumentModel[]): string => {
    if (!id || id === "-") return "None";
    const doc = documents.find(d => d.id === id);
    return doc?.name || "Unknown";
};

const ViewTemplateDialog: React.FC<ViewTemplateDialogProps> = ({
    open,
    onOpenChange,
    template,
    headerDocuments = [],
    footerDocuments = [],
    signatureDocuments = [],
    stampDocuments = [],
    initialDocuments = [],
}) => {
    const { theme } = useTheme();

    if (!template) return null;

    // Get names for selected document IDs
    const headerName = getDocumentName(template.header || "", headerDocuments);
    const footerName = getDocumentName(template.footer || "", footerDocuments);
    const signatureName = getDocumentName(template.signature || "", signatureDocuments);
    const stampName = getDocumentName((template as any).stamp || "", stampDocuments);
    const initialName = getDocumentName(template.initial || "", initialDocuments);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className={`max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl border shadow-2xl ${
                    theme === "dark" ? "bg-black border-gray-800" : "bg-white border-gray-200"
                }`}
            >
                <DialogHeader>
                    <DialogTitle
                        className={`${
                            theme === "dark" ? "text-white" : "text-slate-900"
                        } text-xl font-semibold`}
                    >
                        View Document Template
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Basic Info Section */}
                    <div
                        className={`p-4 rounded-lg ${theme === "dark" ? "bg-gray-800" : "bg-gray-50"}`}
                    >
                        <h3
                            className={`text-lg font-semibold mb-4 ${
                                theme === "dark" ? "text-amber-400" : "text-amber-700"
                            }`}
                        >
                            Basic Information
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <Label
                                    className={
                                        theme === "dark" ? "text-gray-400" : "text-slate-600"
                                    }
                                >
                                    Name
                                </Label>
                                <p className={theme === "dark" ? "text-white" : "text-slate-900"}>
                                    {template.name || "-"}
                                </p>
                            </div>
                            <div className="space-y-1">
                                <Label
                                    className={
                                        theme === "dark" ? "text-gray-400" : "text-slate-600"
                                    }
                                >
                                    Subject
                                </Label>
                                <p className={theme === "dark" ? "text-white" : "text-slate-900"}>
                                    {template.subject || "-"}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Document Elements Section */}
                    <div
                        className={`p-4 rounded-lg ${theme === "dark" ? "bg-gray-800" : "bg-gray-50"}`}
                    >
                        <h3
                            className={`text-lg font-semibold mb-4 ${
                                theme === "dark" ? "text-amber-400" : "text-amber-700"
                            }`}
                        >
                            Document Elements
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <Label
                                    className={
                                        theme === "dark" ? "text-gray-400" : "text-slate-600"
                                    }
                                >
                                    Header
                                </Label>
                                <p className={theme === "dark" ? "text-white" : "text-slate-900"}>
                                    {headerName}
                                </p>
                            </div>
                            <div className="space-y-1">
                                <Label
                                    className={
                                        theme === "dark" ? "text-gray-400" : "text-slate-600"
                                    }
                                >
                                    Footer
                                </Label>
                                <p className={theme === "dark" ? "text-white" : "text-slate-900"}>
                                    {footerName}
                                </p>
                            </div>
                            <div className="space-y-1">
                                <Label
                                    className={
                                        theme === "dark" ? "text-gray-400" : "text-slate-600"
                                    }
                                >
                                    Signature
                                </Label>
                                <p className={theme === "dark" ? "text-white" : "text-slate-900"}>
                                    {signatureName}
                                </p>
                            </div>
                            <div className="space-y-1">
                                <Label
                                    className={
                                        theme === "dark" ? "text-gray-400" : "text-slate-600"
                                    }
                                >
                                    Stamp
                                </Label>
                                <p className={theme === "dark" ? "text-white" : "text-slate-900"}>
                                    {stampName}
                                </p>
                            </div>
                            <div className="space-y-1">
                                <Label
                                    className={
                                        theme === "dark" ? "text-gray-400" : "text-slate-600"
                                    }
                                >
                                    Initial
                                </Label>
                                <p className={theme === "dark" ? "text-white" : "text-slate-900"}>
                                    {initialName}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Dates Section */}
                    <div
                        className={`p-4 rounded-lg ${theme === "dark" ? "bg-gray-800" : "bg-gray-50"}`}
                    >
                        <h3
                            className={`text-lg font-semibold mb-4 ${
                                theme === "dark" ? "text-amber-400" : "text-amber-700"
                            }`}
                        >
                            Validity Period
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <Label
                                    className={
                                        theme === "dark" ? "text-gray-400" : "text-slate-600"
                                    }
                                >
                                    Start Date
                                </Label>
                                <p className={theme === "dark" ? "text-white" : "text-slate-900"}>
                                    {template.startDate || "-"}
                                </p>
                            </div>
                            <div className="space-y-1">
                                <Label
                                    className={
                                        theme === "dark" ? "text-gray-400" : "text-slate-600"
                                    }
                                >
                                    End Date
                                </Label>
                                <p className={theme === "dark" ? "text-white" : "text-slate-900"}>
                                    {template.endDate || "-"}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Status Section */}
                    <div
                        className={`p-4 rounded-lg ${theme === "dark" ? "bg-gray-800" : "bg-gray-50"}`}
                    >
                        <h3
                            className={`text-lg font-semibold mb-4 ${
                                theme === "dark" ? "text-amber-400" : "text-amber-700"
                            }`}
                        >
                            Status & Settings
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <Label
                                    className={
                                        theme === "dark" ? "text-gray-400" : "text-slate-600"
                                    }
                                >
                                    Initial Needed
                                </Label>
                                <p className={theme === "dark" ? "text-white" : "text-slate-900"}>
                                    {template.initialNeeded || "-"}
                                </p>
                            </div>
                            <div className="space-y-1">
                                <Label
                                    className={
                                        theme === "dark" ? "text-gray-400" : "text-slate-600"
                                    }
                                >
                                    Employee Signature Needed
                                </Label>
                                <p className={theme === "dark" ? "text-white" : "text-slate-900"}>
                                    {template.employeeSignatureNeeded || "-"}
                                </p>
                            </div>
                            <div className="space-y-1">
                                <Label
                                    className={
                                        theme === "dark" ? "text-gray-400" : "text-slate-600"
                                    }
                                >
                                    Status
                                </Label>
                                <Badge
                                    className={`rounded-lg px-3 py-1 ${
                                        template.status === "Published"
                                            ? theme === "dark"
                                                ? "bg-green-900 text-green-300 border-green-700"
                                                : "bg-green-100 text-green-800 border-green-200"
                                            : theme === "dark"
                                                ? "bg-gray-700 text-gray-300 border-gray-600"
                                                : "bg-gray-100 text-gray-800 border-gray-200"
                                    }`}
                                >
                                    {template.status || "-"}
                                </Badge>
                            </div>
                            <div className="space-y-1">
                                <Label
                                    className={
                                        theme === "dark" ? "text-gray-400" : "text-slate-600"
                                    }
                                >
                                    Visibility
                                </Label>
                                <Badge
                                    className={`rounded-lg px-3 py-1 ${
                                        template.visibility === "Open"
                                            ? theme === "dark"
                                                ? "bg-blue-900 text-blue-300 border-blue-700"
                                                : "bg-blue-100 text-blue-800 border-blue-200"
                                            : theme === "dark"
                                                ? "bg-orange-900 text-orange-300 border-orange-700"
                                                : "bg-orange-100 text-orange-800 border-orange-200"
                                    }`}
                                >
                                    {template.visibility || "-"}
                                </Badge>
                            </div>
                            <div className="space-y-1">
                                <Label
                                    className={
                                        theme === "dark" ? "text-gray-400" : "text-slate-600"
                                    }
                                >
                                    Active
                                </Label>
                                <Badge
                                    className={`rounded-lg px-3 py-1 ${
                                        template.active === "Yes"
                                            ? theme === "dark"
                                                ? "bg-green-900 text-green-300 border-green-700"
                                                : "bg-green-100 text-green-800 border-green-200"
                                            : theme === "dark"
                                                ? "bg-red-900 text-red-300 border-red-700"
                                                : "bg-red-100 text-red-800 border-red-200"
                                    }`}
                                >
                                    {template.active || "-"}
                                </Badge>
                            </div>
                        </div>
                    </div>

                    {/* Content Sections Preview */}
                    {(template.content || []).length > 0 && (
                        <div
                            className={`p-4 rounded-lg ${theme === "dark" ? "bg-gray-800" : "bg-gray-50"}`}
                        >
                            <h3
                                className={`text-lg font-semibold mb-4 ${
                                    theme === "dark" ? "text-amber-400" : "text-amber-700"
                                }`}
                            >
                                Content Sections ({template.content.length})
                            </h3>
                            <div className="space-y-3">
                                {(template.content || []).map((section: any, index: number) => (
                                    <div
                                        key={index}
                                        className={`p-3 rounded-lg border ${
                                            theme === "dark"
                                                ? "bg-gray-900 border-gray-700"
                                                : "bg-white border-gray-200"
                                        }`}
                                    >
                                        <Label
                                            className={`text-sm font-medium ${
                                                theme === "dark"
                                                    ? "text-amber-400"
                                                    : "text-amber-700"
                                            }`}
                                        >
                                            Section {index + 1}
                                        </Label>
                                        <div
                                            className={`mt-2 text-sm ${
                                                theme === "dark"
                                                    ? "text-gray-300"
                                                    : "text-slate-700"
                                            }`}
                                            dangerouslySetInnerHTML={{
                                                __html: section || "<em>No content</em>",
                                            }}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Close Button */}
                <div className="flex justify-end pt-4 border-t border-gray-700">
                    <Button
                        onClick={() => onOpenChange(false)}
                        className={
                            theme === "dark"
                                ? "bg-amber-600 hover:bg-amber-700 text-white"
                                : "bg-amber-600 hover:bg-amber-700 text-white"
                        }
                    >
                        Close
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default ViewTemplateDialog;
