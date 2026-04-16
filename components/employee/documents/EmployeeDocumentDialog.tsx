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
import { useFirestore } from "@/context/firestore-context";
import { useAuth } from "@/context/authContext";
import { DocumentDefinitionModel } from "@/lib/models/document";
import { PromotionInstanceModel } from "@/lib/models/promotion-instance";
import { ExitInstanceModel } from "@/lib/models/exit-instance";
import { JobApplicationModel } from "@/lib/models/job-application";
import { FileWarning, Printer, Download } from "lucide-react";
import { replaceDynamicFields } from "@/lib/util/document-field-replacer";
import { useEffect, useMemo, useState } from "react";
import { PDFDownloadLink } from "@react-pdf/renderer";
import DynamicDocumentPDF from "./DynamicDocumentPDF";

type DocumentCategory =
    | "promotion_letter"
    | "exit_letter"
    | "offer_letter"
    | "interview_notes"
    | "generic";

interface EmployeeDocumentDialogProps {
    isOpen: boolean;
    onClose: () => void;
    documentCategory: DocumentCategory;
    promotion?: (PromotionInstanceModel & { id: string }) | null;
    exit?: (ExitInstanceModel & { id: string }) | null;
    jobApplication?: (JobApplicationModel & { id: string }) | null;
    genericDocument?: DocumentDefinitionModel | null;
}

export function EmployeeDocumentDialog({
    isOpen,
    onClose,
    documentCategory,
    promotion,
    exit,
    jobApplication,
    genericDocument,
}: EmployeeDocumentDialogProps) {
    const { documents, hrSettings, activeEmployees } = useFirestore();
    const { userData } = useAuth();

    // Get the template ID based on document type
    const templateId = useMemo(() => {
        switch (documentCategory) {
            case "promotion_letter":
                return promotion?.documentTemplateId || null;
            case "exit_letter":
                return exit?.exitDocumentTemplateId || null;
            case "offer_letter":
                return jobApplication?.offerDocumentTemplateId || null;
            case "interview_notes":
                return jobApplication?.interviewDocumentTemplateId || null;
            case "generic":
                return genericDocument?.id || null;
            default:
                return null;
        }
    }, [documentCategory, promotion, exit, jobApplication, genericDocument]);

    // For generic documents, use the passed document directly
    const selectedTemplate = useMemo(() => {
        if (documentCategory === "generic" && genericDocument) {
            return genericDocument;
        }
        if (!templateId) return null;
        return documents.find(d => d.id === templateId) || null;
    }, [documentCategory, genericDocument, templateId, documents]);

    // Get employee data for promotion signature
    const employee = useMemo(() => {
        if (documentCategory === "generic") {
            // For generic documents, use current user data
            return userData || null;
        }
        if (!promotion) return null;
        return activeEmployees.find(e => e.uid === promotion.employeeUID);
    }, [documentCategory, promotion, activeEmployees, userData]);

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

    // Preload images as base64 data URLs to guarantee they're available for printing
    const [preloadedImages, setPreloadedImages] = useState<Record<string, string>>({});
    const [imagesLoaded, setImagesLoaded] = useState(false);

    // Function to load an image as base64 data URL
    const loadImageAsBase64 = async (url: string): Promise<string> => {
        if (!url) return "";

        try {
            const response = await fetch(url);
            const blob = await response.blob();
            return new Promise(resolve => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.onerror = () => resolve(url); // Fallback to original URL
                reader.readAsDataURL(blob);
            });
        } catch (error) {
            console.error("Error loading image:", url, error);
            return url; // Fallback to original URL
        }
    };

    // Preload all images when template or employee changes
    useEffect(() => {
        const preloadImages = async () => {
            if (!selectedTemplate) {
                setPreloadedImages({});
                setImagesLoaded(false);
                return;
            }

            setImagesLoaded(false);

            const imageUrls = [
                headerDocument?.fileUrl,
                footerDocument?.fileUrl,
                signatureDocument?.fileUrl,
                stampDocument?.fileUrl,
                initialDocument?.fileUrl,
                employee?.signature,
            ].filter(Boolean) as string[];

            try {
                const loaded: Record<string, string> = {};
                for (const url of imageUrls) {
                    loaded[url] = await loadImageAsBase64(url);
                }
                setPreloadedImages(loaded);
            } catch (error) {
                console.error("Error preloading images:", error);
            } finally {
                setImagesLoaded(true);
            }
        };

        preloadImages();
    }, [
        selectedTemplate,
        headerDocument,
        footerDocument,
        signatureDocument,
        stampDocument,
        initialDocument,
        employee,
    ]);

    // Get preloaded image URL or original
    const getImageSrc = (url: string | undefined): string => {
        if (!url) return "";
        return preloadedImages[url] || url;
    };

    const handlePrintLetter = async () => {
        // Open new window for printing
        const printWindow = window.open("", "_blank");

        if (!printWindow) {
            alert("Please allow popups to print the document");
            return;
        }

        // Wait for images to load by creating a promise-based loader
        const waitForImages = (container: HTMLElement): Promise<void> => {
            const images = container.querySelectorAll("img");
            const promises = Array.from(images).map(img => {
                if (img.complete) return Promise.resolve();
                return new Promise<void>(resolve => {
                    img.onload = () => resolve();
                    img.onerror = () => resolve(); // Resolve even on error to not block
                });
            });
            return Promise.all(promises).then(() => {});
        };

        // Get the document content element
        const content = document.getElementById("employee-document");

        if (content) {
            // Wait for all images to load
            await waitForImages(content);

            // Clone the content
            const contentClone = content.cloneNode(true) as HTMLElement;

            // Get all image URLs from the clone
            const images = contentClone.querySelectorAll("img");
            images.forEach(img => {
                // Ensure images have proper sizing
                const alt = img.alt.toLowerCase();
                if (alt.includes("header") || alt.includes("footer")) {
                    img.style.maxWidth = "400px";
                } else if (alt.includes("signature")) {
                    img.style.maxWidth = "200px";
                } else if (alt.includes("stamp")) {
                    img.style.maxWidth = "120px";
                } else if (alt.includes("initial")) {
                    img.style.maxWidth = "80px";
                }
            });

            // Write content to new window
            printWindow.document.write(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>${getDocumentTitle()}</title>
                    <style>
                        * { box-sizing: border-box; }
                        body {
                            font-family: Georgia, 'Times New Roman', serif;
                            padding: 40px;
                            max-width: 800px;
                            margin: 0 auto;
                            line-height: 1.6;
                        }
                        img { max-width: 100%; height: auto; }
                        .flex { display: flex; }
                        .justify-between { justify-content: space-between; }
                        .items-start { align-items: flex-start; }
                        .gap-8 { gap: 32px; }
                        .flex-1 { flex: 1; }
                        .text-right { text-align: right; }
                        .mx-auto { margin-left: auto; margin-right: auto; }
                        .ml-auto { margin-left: auto; }
                        .mb-6 { margin-bottom: 24px; }
                        .mt-2 { margin-top: 8px; }
                        .mt-8 { margin-top: 32px; }
                        .pt-4 { padding-top: 16px; }
                        .border-t { border-top: 1px solid #ccc; }
                        .text-center { text-align: center; }
                        .text-sm { font-size: 14px; }
                        .text-muted-foreground { color: #666; }
                        @media print {
                            body { padding: 0; }
                        }
                    </style>
                </head>
                <body>
                    ${contentClone.innerHTML}
                </body>
                </html>
            `);

            printWindow.document.close();
            printWindow.focus();

            // Print after a short delay
            setTimeout(() => {
                printWindow.print();
            }, 500);
        }
    };

    // Get document title based on type
    const getDocumentTitle = () => {
        switch (documentCategory) {
            case "promotion_letter":
                return `Promotion Letter - ${promotion?.promotionName || ""}`;
            case "exit_letter":
                return `Exit Letter - ${exit?.exitID || ""}`;
            case "offer_letter":
                return "Offer Letter";
            case "interview_notes":
                return "Interview Invitation";
            case "generic":
                return selectedTemplate?.name || "Document";
            default:
                return "Document";
        }
    };

    // Replace dynamic fields in template content
    const renderTemplateContent = (template: DocumentDefinitionModel | null) => {
        if (!template || !template.content || template.content.length === 0) {
            return null;
        }

        // Build replacement values based on document type
        let replacements: Record<string, string> = {};

        if (documentCategory === "promotion_letter" && promotion) {
            replacements = {
                "{promotionID}": promotion.promotionID || "",
                "{promotionName}": promotion.promotionName || "",
                "{employeeName}": promotion.employeeName || "",
                "{employeeID}": promotion.employeeID || "",
                "{currentPosition}": promotion.currentPosition || "",
                "{newPosition}": promotion.newPosition || "",
                "{currentGrade}": promotion.currentGrade || "",
                "{newGrade}": promotion.newGrade || "",
                "{currentStep}": promotion.currentStep?.toString() || "",
                "{newStep}": promotion.newStep?.toString() || "",
                "{currentSalary}": promotion.currentSalary
                    ? `$${promotion.currentSalary.toLocaleString()}`
                    : "",
                "{newSalary}": promotion.newSalary
                    ? `$${promotion.newSalary.toLocaleString()}`
                    : "",
                "{currentEntitlementDays}": promotion.currentEntitlementDays?.toString() || "",
                "{newEntitlementDays}": promotion.newEntitlementDays?.toString() || "",
                "{period}": promotion.period || "",
                "{evaluationCycle}": promotion.evaluationCycle || "",
                "{promotionReason}": promotion.promotionReason || "",
                "{department}":
                    hrSettings.departmentSettings.find(d => d.id === promotion.department)?.name ||
                    "",
                "{applicationDate}": promotion.applicationDate
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
                "{companyName}": hrSettings?.companyInfo?.[0]?.companyName || "Company Name",
            };
        } else if (documentCategory === "exit_letter" && exit) {
            replacements = {
                "{exitID}": exit.exitID || "",
                "{employeeName}": exit.exitEmployeeName || "",
                "{employeeID}": exit.exitEmployeeUID || "",
                "{exitType}": exit.exitType || "",
                "{exitReason}": exit.exitReason || "",
                "{exitReasonDescription}": exit.exitReasonDescription || "",
                "{exitLastDate}": exit.exitLastDate
                    ? new Date(exit.exitLastDate).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                    })
                    : "",
                "{exitEffectiveDate}": exit.exitEffectiveDate
                    ? new Date(exit.exitEffectiveDate).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                    })
                    : "",
                "{eligibleToRehire}": exit.eligibleToRehire ? "Yes" : "No",
                "{remarks}": exit.remarks || "",
                "{department}": "", // Exit instance doesn't have department field
                "{position}": exit.exitEmployeePosition || "",
                "{companyName}": hrSettings?.companyInfo?.[0]?.companyName || "Company Name",
            };
        } else if (documentCategory === "offer_letter" && jobApplication) {
            replacements = {
                "{applicantName}": "", // Need to get applicant name from applicantId
                "{applicantID}": jobApplication.applicantId || "",
                "{jobTitle}": "", // Need to get job title from jobPostId
                "{department}": "", // Need to get department from jobPostId
                "{offeredSalary}": "", // Need to add salary information
                "{startDate}": "", // Need to add start date
                "{benefits}": "", // Need to add benefits information
                "{companyName}": hrSettings?.companyInfo?.[0]?.companyName || "Company Name",
                "{hrContactName}": "", // Need to add HR contact name
                "{hrContactEmail}": "", // Need to add HR contact email
                "{applicationDate}": jobApplication.appliedDate
                    ? new Date(jobApplication.appliedDate).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                    })
                    : new Date().toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                    }),
            };
        } else if (documentCategory === "interview_notes" && jobApplication) {
            replacements = {
                "{applicantName}": "", // Need to get applicant name from applicantId
                "{applicantID}": jobApplication.applicantId || "",
                "{jobTitle}": "", // Need to get job title from jobPostId
                "{department}": "", // Need to get department from jobPostId
                "{interviewDate}": "", // Need to add interview date
                "{interviewTime}": "", // Need to add interview time
                "{interviewLocation}": "", // Need to add interview location
                "{interviewerName}": "", // Need to add interviewer name
                "{companyName}": hrSettings?.companyInfo?.[0]?.companyName || "Company Name",
                "{applicationDate}": jobApplication.appliedDate
                    ? new Date(jobApplication.appliedDate).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                    })
                    : new Date().toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                    }),
            };
        }

        // For generic documents, use replaceDynamicFields utility
        if (documentCategory === "generic" && template) {
            return template.content.map((contentBlock, index) => {
                const renderedContent = replaceDynamicFields(contentBlock, userData, hrSettings);
                return (
                    <div
                        key={index}
                        className="prose max-w-none whitespace-pre-wrap"
                        dangerouslySetInnerHTML={{ __html: renderedContent }}
                    />
                );
            });
        }

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

    // For offer letters and interview invitations without templates, show placeholder
    const showPlaceholder =
        (documentCategory === "offer_letter" || documentCategory === "interview_notes") &&
        !selectedTemplate;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-[900px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{getDocumentTitle()}</DialogTitle>
                    <DialogDescription>
                        {selectedTemplate
                            ? `Preview and print using template: ${selectedTemplate.name}`
                            : `View the ${getDocumentTitle().toLowerCase()}`}
                    </DialogDescription>
                </DialogHeader>

                {/* Letter Content */}
                <div className="py-4 print:py-0">
                    <div
                        className="border rounded-lg p-8 bg-white print:border-0 print:p-0"
                        id="employee-document"
                    >
                        {selectedTemplate ? (
                            // Render from template with document elements
                            <div className="space-y-6 font-serif">
                                {/* Header Image */}
                                {headerDocument && headerDocument.fileUrl && (
                                    <div className="text-center mb-6">
                                        <img
                                            src={getImageSrc(headerDocument.fileUrl)}
                                            alt={headerDocument.name}
                                            className="max-h-24 mx-auto"
                                        />
                                    </div>
                                )}

                                {/* Template Content */}
                                {renderTemplateContent(selectedTemplate)}

                                {/* First Row: Employee Signature & HR Signature */}
                                {(documentCategory === "promotion_letter" &&
                                    requiresEmployeeSignature &&
                                    hasEmployeeSignature) ||
                                (documentCategory === "generic" &&
                                    requiresEmployeeSignature &&
                                    hasEmployeeSignature) ||
                                (signatureDocument && signatureDocument.fileUrl) ? (
                                        <div className="mt-8 flex justify-between items-start gap-8">
                                            {/* Employee Signature */}
                                            <div className="flex-1">
                                                {(documentCategory === "promotion_letter" ||
                                                documentCategory === "generic") &&
                                                requiresEmployeeSignature &&
                                                hasEmployeeSignature && (
                                                    <>
                                                        <img
                                                            src={getImageSrc(employee?.signature)}
                                                            alt="Employee Signature"
                                                            className="max-h-20"
                                                        />
                                                        <p className="mt-2">
                                                            {documentCategory === "generic"
                                                                ? [
                                                                    userData?.firstName,
                                                                    userData?.middleName,
                                                                    userData?.surname,
                                                                ]
                                                                    .filter(Boolean)
                                                                    .join(" ")
                                                                : promotion?.employeeName}
                                                        </p>
                                                        <p className="text-sm text-muted-foreground">
                                                            Employee Signature
                                                        </p>
                                                    </>
                                                )}
                                            </div>

                                            {/* HR Signature */}
                                            <div className="flex-1 text-right">
                                                {signatureDocument && signatureDocument.fileUrl && (
                                                    <>
                                                        <img
                                                            src={getImageSrc(signatureDocument.fileUrl)}
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
                                {(stampDocument && stampDocument.fileUrl) ||
                                (initialDocument && initialDocument.fileUrl) ? (
                                        <div className="mt-8 flex justify-between items-start gap-8">
                                            {/* Company Stamp */}
                                            <div className="flex-1">
                                                {stampDocument && stampDocument.fileUrl && (
                                                    <img
                                                        src={getImageSrc(stampDocument.fileUrl)}
                                                        alt={stampDocument.name}
                                                        className="max-h-24"
                                                    />
                                                )}
                                            </div>

                                            {/* Initial */}
                                            <div className="flex-1 text-right">
                                                {initialDocument && initialDocument.fileUrl && (
                                                    <img
                                                        src={getImageSrc(initialDocument.fileUrl)}
                                                        alt={initialDocument.name}
                                                        className="max-h-16 ml-auto"
                                                    />
                                                )}
                                            </div>
                                        </div>
                                    ) : null}

                                {/* Footer Image */}
                                {footerDocument && footerDocument.fileUrl && (
                                    <div className="text-center mt-8 pt-4 border-t">
                                        <img
                                            src={getImageSrc(footerDocument.fileUrl)}
                                            alt={footerDocument.name}
                                            className="max-h-16 mx-auto"
                                        />
                                    </div>
                                )}
                            </div>
                        ) : showPlaceholder ? (
                            // Show placeholder for offer/interview without template
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <FileWarning className="h-16 w-16 text-gray-300 mb-4" />
                                <h3 className="text-lg font-medium text-gray-600 mb-2">
                                    Document Not Available
                                </h3>
                                <p className="text-sm text-gray-500 max-w-md">
                                    This document is not yet available or no template has been
                                    configured. Please contact HR for assistance.
                                </p>
                            </div>
                        ) : (
                            // For exit letters without template
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <FileWarning className="h-16 w-16 text-gray-300 mb-4" />
                                <h3 className="text-lg font-medium text-gray-600 mb-2">
                                    No Template Selected
                                </h3>
                                <p className="text-sm text-gray-500 max-w-md">
                                    No document template has been configured for this{" "}
                                    {documentCategory.replace("_", " ")}. Please contact HR for
                                    assistance.
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>
                        Close
                    </Button>
                    {selectedTemplate ? (
                        <PDFDownloadLink
                            document={
                                <DynamicDocumentPDF
                                    template={selectedTemplate}
                                    hrSettings={hrSettings}
                                    documentData={{
                                        ...promotion,
                                        ...exit,
                                        ...jobApplication,
                                        ...(documentCategory === "generic" ? userData : {}),
                                        signature: employee?.signature,
                                    }}
                                    documentCategory={documentCategory}
                                />
                            }
                            fileName={`${getDocumentTitle()}.pdf`}
                        >
                            {({ loading }) => (
                                <Button
                                    disabled={loading}
                                    className="bg-brand-600 hover:bg-brand-700 text-white disabled:opacity-50"
                                >
                                    <Download className="h-4 w-4 mr-2" />
                                    {loading ? "Generating..." : "Download PDF"}
                                </Button>
                            )}
                        </PDFDownloadLink>
                    ) : (
                        <Button
                            disabled
                            className="bg-brand-600 hover:bg-brand-700 text-white disabled:opacity-50"
                        >
                            <Download className="h-4 w-4 mr-2" />
                            Download PDF
                        </Button>
                    )}
                    {/* <Button
                        onClick={handlePrintLetter}
                        disabled={!selectedTemplate || !imagesLoaded}
                        className="bg-brand-600 hover:bg-brand-700 text-white disabled:opacity-50"
                    >
                        <Printer className="h-4 w-4 mr-2" />
                        Print Document
                    </Button> */}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
