"use client";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useFirestore } from "@/context/firestore-context";
import { promotionService } from "@/lib/backend/firebase/promotionService";
import { DocumentDefinitionModel } from "@/lib/models/document";
import { PromotionInstanceModel } from "@/lib/models/promotion-instance";
import { AlertTriangle, FileText, FileWarning } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

interface PromotionLetterDialogProps {
    isOpen: boolean;
    onClose: () => void;
    promotion: (PromotionInstanceModel & { id: string }) | null;
}

// Print component options
interface PrintComponents {
    header: boolean;
    content: boolean;
    initial: boolean;
    stamp: boolean;
    employeeSignature: boolean;
    hrSignature: boolean;
    footer: boolean;
}

export function PromotionLetterDialog({ isOpen, onClose, promotion }: PromotionLetterDialogProps) {
    const { documents, hrSettings, activeEmployees } = useFirestore();
    const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
    const [isSaving, setIsSaving] = useState(false);

    // Print component selection state
    const [printComponents, setPrintComponents] = useState<PrintComponents>({
        header: true,
        content: true,
        initial: true,
        stamp: true,
        employeeSignature: true,
        hrSignature: true,
        footer: true,
    });

    // Initialize selectedTemplateId from promotion
    useEffect(() => {
        if (promotion) {
            setSelectedTemplateId(promotion.documentTemplateId || "");
        }
    }, [promotion]);

    // Reset print components when template changes
    useEffect(() => {
        setPrintComponents({
            header: true,
            content: true,
            initial: true,
            stamp: true,
            employeeSignature: true,
            hrSignature: true,
            footer: true,
        });
    }, [selectedTemplateId]);

    // Get employee data for signature
    const employee = useMemo(() => {
        if (!promotion) return null;
        return activeEmployees.find(e => e.uid === promotion.employeeUID);
    }, [promotion, activeEmployees]);

    const handleSaveTemplate = async () => {
        if (!promotion || !selectedTemplateId) return;

        setIsSaving(true);
        try {
            // Update the promotion with the template ID
            await promotionService.update(promotion.id, {
                documentTemplateId: selectedTemplateId || null,
            });

            onClose();
        } catch (error) {
            console.error("Error saving template:", error);
        } finally {
            setIsSaving(false);
        }
    };

    const handlePrintLetter = () => {
        window.print();
    };

    // Get the selected template (either from current selection or from promotion)
    const selectedTemplate = useMemo(() => {
        const templateId = selectedTemplateId || promotion?.documentTemplateId;
        if (!templateId) return null;
        return documents.find(d => d.id === templateId) || null;
    }, [selectedTemplateId, promotion?.documentTemplateId, documents]);

    // Check if document requires employee signature
    const requiresEmployeeSignature = selectedTemplate?.employeeSignatureNeeded === "Yes";
    const hasEmployeeSignature = employee?.signature && employee.signature.length > 0;

    // Get header document from template
    const headerDocument = useMemo(() => {
        if (!selectedTemplate?.header) return null;
        return hrSettings?.headerDocuments?.find(d => d.id === selectedTemplate.header) || null;
    }, [selectedTemplate?.header, hrSettings?.headerDocuments]);

    // Get footer document from template
    const footerDocument = useMemo(() => {
        if (!selectedTemplate?.footer) return null;
        return hrSettings?.footerDocuments?.find(d => d.id === selectedTemplate.footer) || null;
    }, [selectedTemplate?.footer, hrSettings?.footerDocuments]);

    // Get signature document from template
    const signatureDocument = useMemo(() => {
        if (!selectedTemplate?.signature) return null;
        return (
            hrSettings?.signatureDocuments?.find(d => d.id === selectedTemplate.signature) || null
        );
    }, [selectedTemplate?.signature, hrSettings?.signatureDocuments]);

    // Get stamp document from template
    const stampDocument = useMemo(() => {
        if (!selectedTemplate?.stamp) return null;
        return hrSettings?.stampDocuments?.find(d => d.id === selectedTemplate.stamp) || null;
    }, [selectedTemplate?.stamp, hrSettings?.stampDocuments]);

    // Get initial document from template
    const initialDocument = useMemo(() => {
        if (!selectedTemplate?.initial) return null;
        return hrSettings?.initialDocuments?.find(d => d.id === selectedTemplate.initial) || null;
    }, [selectedTemplate?.initial, hrSettings?.initialDocuments]);

    // Replace dynamic fields in template content
    const renderTemplateContent = (template: DocumentDefinitionModel | null) => {
        if (!template || !template.content || template.content.length === 0) {
            return null;
        }

        // Build replacement values from promotion data
        const replacements: Record<string, string> = {
            "{promotionID}": promotion?.promotionID || "",
            "{promotionName}": promotion?.promotionName || "",
            "{employeeName}": promotion?.employeeName || "",
            "{employeeID}": promotion?.employeeID || "",
            "{currentPosition}": promotion?.currentPosition || "",
            "{newPosition}": promotion?.newPosition || "",
            "{currentGrade}": promotion?.currentGrade || "",
            "{newGrade}": promotion?.newGrade || "",
            "{currentStep}": promotion?.currentStep?.toString() || "",
            "{newStep}": promotion?.newStep?.toString() || "",
            "{currentSalary}": promotion?.currentSalary
                ? `$${promotion.currentSalary.toLocaleString()}`
                : "",
            "{newSalary}": promotion?.newSalary ? `$${promotion.newSalary.toLocaleString()}` : "",
            "{currentEntitlementDays}": promotion?.currentEntitlementDays?.toString() || "",
            "{newEntitlementDays}": promotion?.newEntitlementDays?.toString() || "",
            "{period}": promotion?.period || "",
            "{evaluationCycle}": promotion?.evaluationCycle || "",
            "{promotionReason}": promotion?.promotionReason || "",
            "{department}":
                hrSettings.departmentSettings.find(d => d.id === promotion?.department)?.name || "",
            "{applicationDate}": promotion?.applicationDate
                ? new Date(promotion.applicationDate).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                })
                : new Date().toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                }),
            // Company fields
            "{companyName}": hrSettings?.companyInfo?.[0]?.companyName || "Company Name",
        };

        // Render each content block
        return template.content.map((contentBlock, index) => {
            let renderedContent = contentBlock;

            // Replace all placeholders
            Object.entries(replacements).forEach(([key, value]) => {
                renderedContent = renderedContent.replace(new RegExp(key, "g"), value);
            });

            return (
                <div
                    key={index}
                    className="prose max-w-none"
                    dangerouslySetInnerHTML={{ __html: renderedContent }}
                />
            );
        });
    };

    if (!promotion) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-[900px] max-h-[90vh] overflow-y-auto print:max-w-full print:w-full print:h-full print:overflow-visible">
                <DialogHeader>
                    <DialogTitle>Promotion Letter</DialogTitle>
                    <DialogDescription>
                        {selectedTemplate
                            ? `Preview and print the promotion letter for ${promotion.employeeName} using template: ${selectedTemplate.name}`
                            : `Select a document template to preview the promotion letter for ${promotion.employeeName}`}
                    </DialogDescription>
                </DialogHeader>

                {/* Template Selection Section - Moved to top */}
                <div className="space-y-4 mb-4">
                    <div className="space-y-2">
                        <Label htmlFor="template-select">Document Template</Label>
                        <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                            <SelectTrigger id="template-select">
                                <SelectValue placeholder="Select a document template" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="-">None</SelectItem>
                                {documents
                                    .filter(doc => doc.status === "Published")
                                    .map(doc => (
                                        <SelectItem key={doc.id} value={doc.id}>
                                            {doc.name} - {doc.subject}
                                        </SelectItem>
                                    ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {selectedTemplateId && (
                        <Button
                            onClick={handleSaveTemplate}
                            disabled={isSaving}
                            variant="outline"
                            size="sm"
                            className="w-full"
                        >
                            {isSaving ? "Saving..." : "Save Template Selection"}
                        </Button>
                    )}
                </div>

                {/* Warning: Employee signature required but not available */}
                {requiresEmployeeSignature && !hasEmployeeSignature && (
                    <div className="flex items-center gap-2 text-amber-600 bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg mb-4">
                        <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                        <p className="text-sm">
                            This document requires employee signature but {promotion.employeeName}{" "}
                            has not uploaded their signature yet. The employee needs to upload their
                            signature in their profile before signing this document.
                        </p>
                    </div>
                )}

                {/* Letter Content */}
                <div className="py-4">
                    <div
                        className="border rounded-lg p-8 bg-white print:border-none print:p-0"
                        id="promotion-letter"
                    >
                        {selectedTemplate ? (
                            // Render from template with document elements (header, footer, signature, stamp, initial)
                            <div className="space-y-6 font-serif">
                                {/* Header Image */}
                                {headerDocument &&
                                    headerDocument.fileUrl &&
                                    printComponents.header && (
                                    <div className="text-center mb-6">
                                        <img
                                            src={headerDocument.fileUrl}
                                            alt={headerDocument.name}
                                            className="max-h-24 mx-auto"
                                        />
                                    </div>
                                )}

                                {/* Template Content */}
                                {printComponents.content && renderTemplateContent(selectedTemplate)}

                                {/* First Row: Employee Signature & HR Signature */}
                                {(requiresEmployeeSignature &&
                                    hasEmployeeSignature &&
                                    printComponents.employeeSignature) ||
                                (signatureDocument &&
                                    signatureDocument.fileUrl &&
                                    printComponents.hrSignature) ? (
                                        <div className="mt-8 flex justify-between items-start gap-8">
                                            {/* Employee Signature */}
                                            <div className="flex-1">
                                                {requiresEmployeeSignature &&
                                                hasEmployeeSignature &&
                                                printComponents.employeeSignature && (
                                                    <>
                                                        <img
                                                            src={employee?.signature}
                                                            alt="Employee Signature"
                                                            className="max-h-20"
                                                        />
                                                        <p className="mt-2">
                                                            {promotion.employeeName}
                                                        </p>
                                                        <p className="text-sm text-muted-foreground">
                                                            Employee Signature
                                                        </p>
                                                    </>
                                                )}
                                            </div>

                                            {/* HR Signature */}
                                            <div className="flex-1 text-right">
                                                {signatureDocument &&
                                                signatureDocument.fileUrl &&
                                                printComponents.hrSignature && (
                                                    <>
                                                        <img
                                                            src={signatureDocument.fileUrl}
                                                            alt={signatureDocument.name}
                                                            className="max-h-20 ml-auto"
                                                        />
                                                        <p className="mt-2">
                                                            Human Resources Department
                                                        </p>
                                                        <p className="text-sm text-muted-foreground">
                                                            HR Signature
                                                        </p>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    ) : null}

                                {/* Second Row: Company Stamp & Initial */}
                                {(stampDocument &&
                                    stampDocument.fileUrl &&
                                    printComponents.stamp) ||
                                (initialDocument &&
                                    initialDocument.fileUrl &&
                                    printComponents.initial) ? (
                                        <div className="mt-8 flex justify-between items-start gap-8">
                                            {/* Company Stamp */}
                                            <div className="flex-1">
                                                {stampDocument &&
                                                stampDocument.fileUrl &&
                                                printComponents.stamp && (
                                                    <img
                                                        src={stampDocument.fileUrl}
                                                        alt={stampDocument.name}
                                                        className="max-h-24"
                                                    />
                                                )}
                                            </div>

                                            {/* Initial */}
                                            <div className="flex-1 text-right">
                                                {initialDocument &&
                                                initialDocument.fileUrl &&
                                                printComponents.initial && (
                                                    <img
                                                        src={initialDocument.fileUrl}
                                                        alt={initialDocument.name}
                                                        className="max-h-16 ml-auto"
                                                    />
                                                )}
                                            </div>
                                        </div>
                                    ) : null}

                                {/* Footer Image */}
                                {footerDocument &&
                                    footerDocument.fileUrl &&
                                    printComponents.footer && (
                                    <div className="text-center mt-8 pt-4 border-t">
                                        <img
                                            src={footerDocument.fileUrl}
                                            alt={footerDocument.name}
                                            className="max-h-16 mx-auto"
                                        />
                                    </div>
                                )}
                            </div>
                        ) : (
                            // No template selected - show message instead of default letter
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <FileWarning className="h-16 w-16 text-gray-300 mb-4" />
                                <h3 className="text-lg font-medium text-gray-600 mb-2">
                                    No Template Selected
                                </h3>
                                <p className="text-sm text-gray-500 max-w-md">
                                    Please select a document template above to preview the promotion
                                    letter. The template will be used to generate the letter with
                                    all required elements such as headers, footers, signatures, and
                                    stamps.
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                <DialogFooter className="print:hidden">
                    <Button variant="outline" onClick={onClose}>
                        Close
                    </Button>
                    <Button
                        onClick={handlePrintLetter}
                        disabled={!selectedTemplate}
                        className="bg-brand-600 hover:bg-brand-700 text-white disabled:opacity-50"
                    >
                        <FileText className="h-4 w-4 mr-2" />
                        Print Letter
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
