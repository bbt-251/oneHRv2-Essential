"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmployeeDocumentDialog } from "@/components/employee/documents/EmployeeDocumentDialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserX, Calendar, FileText, CheckCircle, XCircle, Paperclip } from "lucide-react";
import { ExtendedExitInstance } from "../exit-instance";
import { useFirestore } from "@/context/firestore-context";

interface ExitInstanceViewModalProps {
    isOpen: boolean;
    onClose: () => void;
    instance: ExtendedExitInstance | null;
}

export function ExitInstanceViewModal({ isOpen, onClose, instance }: ExitInstanceViewModalProps) {
    const { exitChecklists, employees, exitInterviewQuestions, documents } = useFirestore();
    const [activeTab, setActiveTab] = useState("details");
    const [showDocumentDialog, setShowDocumentDialog] = useState(false);

    if (!instance) return null;

    const employee = employees.find(e => e.uid === instance.exitEmployeeUID);

    return (
        <>
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 z-[100]">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-semibold text-brand-800 dark:text-foreground flex items-center gap-2">
                            <UserX className="h-6 w-6 text-brand-600" />
                            Exit Instance Details
                        </DialogTitle>
                    </DialogHeader>

                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="details" className="flex items-center gap-2">
                                <FileText className="h-4 w-4" />
                                Exit Details
                            </TabsTrigger>
                            <TabsTrigger value="documents" className="flex items-center gap-2">
                                <Paperclip className="h-4 w-4" />
                                Attachments
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="details" className="space-y-6 mt-6">
                            {/* Header Info */}
                            <div className="bg-brand-50 p-6 rounded-lg border border-brand-200 dark:bg-brand-900/20 dark:border-brand-800">
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <h3 className="text-xl font-bold text-brand-800 dark:text-foreground">
                                            {instance.exitID}
                                        </h3>
                                        <p className="text-sm text-brand-600 dark:text-muted-foreground mt-1">
                                            Created: {new Date(instance.timestamp).toLocaleString()}
                                        </p>
                                    </div>
                                    <Badge
                                        className={
                                            instance.exitType === "Voluntary"
                                                ? "bg-blue-100 text-blue-800 border-blue-200"
                                                : "bg-red-100 text-red-800 border-red-200"
                                        }
                                    >
                                        {instance.exitType}
                                    </Badge>
                                </div>
                            </div>

                            {/* Employee Information */}
                            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
                                <h3 className="text-lg font-semibold text-brand-800 mb-4 dark:text-foreground">
                                    Employee Information
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            Employee ID
                                        </p>
                                        <p className="font-medium text-gray-900 dark:text-foreground">
                                            {employee?.employeeID ?? ""}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            Position
                                        </p>
                                        <p className="font-medium text-gray-900 dark:text-foreground">
                                            {instance.exitEmployeePosition || "N/A"}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Exit Details */}
                            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
                                <h3 className="text-lg font-semibold text-brand-800 mb-4 dark:text-foreground">
                                    Exit Details
                                </h3>
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            Exit Reason
                                        </p>
                                        <p className="font-medium text-gray-900 dark:text-foreground">
                                            {instance.exitReason}
                                        </p>
                                    </div>
                                    {instance.exitReasonDescription && (
                                        <div>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                Description
                                            </p>
                                            <p className="text-gray-900 dark:text-foreground">
                                                {instance.exitReasonDescription}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Important Dates */}
                            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
                                <h3 className="text-lg font-semibold text-brand-800 mb-4 flex items-center gap-2 dark:text-foreground">
                                    <Calendar className="h-5 w-5 text-brand-600" />
                                    Important Dates
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            Exit Last Date
                                        </p>
                                        <p className="font-medium text-gray-900 dark:text-foreground">
                                            {new Date(instance.exitLastDate).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            Exit Effective Date
                                        </p>
                                        <p className="font-medium text-gray-900 dark:text-foreground">
                                            {new Date(
                                                instance.exitEffectiveDate,
                                            ).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                                <div className="mt-4">
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        Effective Date Accepted
                                    </p>
                                    <Badge
                                        className={
                                            instance.effectiveDateAccepted
                                                ? "bg-green-100 text-green-800 border-green-200"
                                                : "bg-red-100 text-red-800 border-red-200"
                                        }
                                    >
                                        {instance.effectiveDateAccepted ? "Yes" : "No"}
                                    </Badge>
                                </div>
                            </div>

                            {/* Exit Process */}
                            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
                                <h3 className="text-lg font-semibold text-brand-800 mb-4 flex items-center gap-2 dark:text-foreground">
                                    <FileText className="h-5 w-5 text-brand-600" />
                                    Exit Process
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            Exit Checklist
                                        </p>
                                        <p className="font-medium text-gray-900 dark:text-foreground">
                                            {exitChecklists.find(
                                                c => c.id == instance.exitChecklist.checklistId,
                                            )?.checklistName || "N/A"}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            Exit Interview
                                        </p>
                                        <p className="font-medium text-gray-900 dark:text-foreground">
                                            {exitInterviewQuestions.find(
                                                e => e.id == instance.exitInterview,
                                            )?.name || "N/A"}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            Exit Document Status
                                        </p>
                                        <p className="font-medium text-gray-900 dark:text-foreground">
                                            {instance.exitDocument || "N/A"}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            Exit Document Template
                                        </p>
                                        <p className="font-medium text-gray-900 dark:text-foreground">
                                            {instance.exitDocumentTemplateId
                                                ? documents.find(
                                                    d => d.id === instance.exitDocumentTemplateId,
                                                )?.name || "Unknown"
                                                : "None"}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Additional Information */}
                            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
                                <h3 className="text-lg font-semibold text-brand-800 mb-4 dark:text-foreground">
                                    Additional Information
                                </h3>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2">
                                        {instance.eligibleToRehire ? (
                                            <CheckCircle className="h-5 w-5 text-green-600" />
                                        ) : (
                                            <XCircle className="h-5 w-5 text-red-600" />
                                        )}
                                        <span className="font-medium text-gray-900 dark:text-foreground">
                                            {instance.eligibleToRehire
                                                ? "Eligible"
                                                : "Not Eligible"}{" "}
                                            to Rehire
                                        </span>
                                    </div>
                                    {instance.remarks && (
                                        <div>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                Remarks
                                            </p>
                                            <p className="text-gray-900 dark:text-foreground">
                                                {instance.remarks}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="documents" className="mt-6">
                            <div className="space-y-4">
                                {/* Document Template */}
                                {instance.exitDocumentTemplateId ? (
                                    <div className="p-4 rounded-lg bg-muted/50 border">
                                        <h4 className="font-semibold text-brand-800 dark:text-foreground mb-2">
                                            Exit Letter Template
                                        </h4>
                                        <p className="text-sm text-muted-foreground mb-2">
                                            {documents.find(
                                                d => d.id === instance.exitDocumentTemplateId,
                                            )?.name || "Unknown Template"}
                                        </p>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setShowDocumentDialog(true)}
                                        >
                                            View Exit Letter
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="p-4 rounded-lg bg-muted/50 border">
                                        <h4 className="font-semibold text-brand-800 dark:text-foreground mb-2">
                                            Exit Letter Template
                                        </h4>
                                        <p className="text-sm text-muted-foreground">
                                            No document template selected for this exit instance.
                                        </p>
                                    </div>
                                )}

                                {/* Additional Documents */}
                                <div className="p-4 rounded-lg bg-muted/50 border">
                                    <div className="flex items-center justify-between mb-2">
                                        <h4 className="font-semibold text-brand-800 dark:text-foreground">
                                            Additional Documents
                                        </h4>
                                        <Button variant="outline" size="sm" disabled>
                                            Upload Document
                                        </Button>
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        No additional documents attached to this exit instance.
                                    </p>
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>
                </DialogContent>
            </Dialog>

            {/* Document Dialog */}
            {instance && (
                <EmployeeDocumentDialog
                    isOpen={showDocumentDialog}
                    onClose={() => setShowDocumentDialog(false)}
                    documentCategory="exit_letter"
                    exit={instance}
                />
            )}
        </>
    );
}
