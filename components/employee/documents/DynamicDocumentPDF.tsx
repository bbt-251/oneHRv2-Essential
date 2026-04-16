import React from "react";
import { Document, Page, Text, View, StyleSheet, Font, Image } from "@react-pdf/renderer";
import { DocumentDefinitionModel } from "@/lib/models/document";
import { HrSettingsByType } from "@/context/firestore-context";
import { replaceDynamicFields } from "@/lib/util/document-field-replacer";
import { EmployeeModel } from "@/lib/models/employee";

// Register Montserrat font
Font.register({
    family: "Montserrat",
    fonts: [
        {
            src: "/fonts/Montserrat-Regular.ttf",
            fontWeight: 400,
        },
        {
            src: "/fonts/Montserrat-SemiBold.ttf",
            fontWeight: 600,
        },
        {
            src: "/fonts/Montserrat-Medium.ttf",
            fontWeight: 500,
        },
    ],
});

interface DynamicDocumentPDFProps {
    template: DocumentDefinitionModel;
    hrSettings: HrSettingsByType;
    documentData: any;
    documentCategory: string;
}

const styles = StyleSheet.create({
    page: {
        padding: 40,
        fontFamily: "Montserrat",
        fontSize: 12,
        lineHeight: 1.6,
        position: "relative",
    },
    header: {
        marginBottom: 20,
        textAlign: "center" as const,
    },
    headerImage: {
        maxHeight: 80,
        maxWidth: "100%",
    },
    content: {
        marginBottom: 40,
    },
    paragraph: {
        marginBottom: 12,
        fontSize: 12,
    },
    signatureSection: {
        marginTop: 60,
        flexDirection: "row" as const,
        justifyContent: "space-between" as const,
        alignItems: "flex-end" as const,
    },
    signature: {
        alignItems: "center" as const,
    },
    signatureImage: {
        maxHeight: 60,
        maxWidth: 200,
        marginBottom: 8,
    },
    signatureLabel: {
        fontSize: 10,
        color: "#666",
    },
    stampSection: {
        marginTop: 40,
        flexDirection: "row" as const,
        justifyContent: "space-between" as const,
    },
    stampImage: {
        maxHeight: 80,
        maxWidth: 150,
    },
    initialImage: {
        maxHeight: 60,
        maxWidth: 100,
    },
    footer: {
        position: "absolute" as const,
        bottom: 20,
        left: 40,
        right: 40,
        textAlign: "center" as const,
    },
    footerImage: {
        maxHeight: 40,
        maxWidth: "100%",
    },
});

const DynamicDocumentPDF = ({
    template,
    hrSettings,
    documentData,
    documentCategory,
}: DynamicDocumentPDFProps) => {
    // Get header, footer, signature, stamp, and initial documents
    const headerDocument = hrSettings.headerDocuments?.find(d => d.id === template.header);
    const footerDocument = hrSettings.footerDocuments?.find(d => d.id === template.footer);
    const signatureDocument = hrSettings.signatureDocuments?.find(d => d.id === template.signature);
    const stampDocument = hrSettings.stampDocuments?.find(d => d.id === template.stamp);
    const initialDocument = hrSettings.initialDocuments?.find(d => d.id === template.initial);

    // Replace dynamic fields in template content
    const renderTemplateContent = () => {
        if (!template.content || template.content.length === 0) {
            return null;
        }

        // Build replacement values based on document type
        let replacements: Record<string, string> = {};

        if (documentCategory === "promotion_letter" && documentData) {
            replacements = {
                "{promotionID}": documentData.promotionID || "",
                "{promotionName}": documentData.promotionName || "",
                "{employeeName}": documentData.employeeName || "",
                "{employeeID}": documentData.employeeID || "",
                "{currentPosition}": documentData.currentPosition || "",
                "{newPosition}": documentData.newPosition || "",
                "{currentGrade}": documentData.currentGrade || "",
                "{newGrade}": documentData.newGrade || "",
                "{currentStep}": documentData.currentStep?.toString() || "",
                "{newStep}": documentData.newStep?.toString() || "",
                "{currentSalary}": documentData.currentSalary
                    ? `$${documentData.currentSalary.toLocaleString()}`
                    : "",
                "{newSalary}": documentData.newSalary
                    ? `$${documentData.newSalary.toLocaleString()}`
                    : "",
                "{currentEntitlementDays}": documentData.currentEntitlementDays?.toString() || "",
                "{newEntitlementDays}": documentData.newEntitlementDays?.toString() || "",
                "{period}": documentData.period || "",
                "{evaluationCycle}": documentData.evaluationCycle || "",
                "{promotionReason}": documentData.promotionReason || "",
                "{department}":
                    hrSettings.departmentSettings.find(d => d.id === documentData.department)
                        ?.name || "",
                "{applicationDate}": documentData.applicationDate
                    ? new Date(documentData.applicationDate).toLocaleDateString("en-US", {
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
        } else if (documentCategory === "exit_letter" && documentData) {
            replacements = {
                "{exitID}": documentData.exitID || "",
                "{employeeName}": documentData.exitEmployeeName || "",
                "{employeeID}": documentData.exitEmployeeUID || "",
                "{exitType}": documentData.exitType || "",
                "{exitReason}": documentData.exitReason || "",
                "{exitReasonDescription}": documentData.exitReasonDescription || "",
                "{exitLastDate}": documentData.exitLastDate
                    ? new Date(documentData.exitLastDate).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                    })
                    : "",
                "{exitEffectiveDate}": documentData.exitEffectiveDate
                    ? new Date(documentData.exitEffectiveDate).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                    })
                    : "",
                "{eligibleToRehire}": documentData.eligibleToRehire ? "Yes" : "No",
                "{remarks}": documentData.remarks || "",
                "{department}":
                    hrSettings.departmentSettings.find(d => d.id === documentData.department)
                        ?.name || "",
                "{position}": documentData.exitEmployeePosition || "",
                "{companyName}": hrSettings?.companyInfo?.[0]?.companyName || "Company Name",
            };
        } else if (documentCategory === "offer_letter" && documentData) {
            replacements = {
                "{applicantName}": "", // Need to get applicant name from applicantId
                "{applicantID}": documentData.applicantId || "",
                "{jobTitle}": "", // Need to get job title from jobPostId
                "{department}": "", // Need to get department from jobPostId
                "{offeredSalary}": "", // Need to add salary information
                "{startDate}": "", // Need to add start date
                "{benefits}": "", // Need to add benefits information
                "{companyName}": hrSettings?.companyInfo?.[0]?.companyName || "Company Name",
                "{hrContactName}": "", // Need to add HR contact name
                "{hrContactEmail}": "", // Need to add HR contact email
                "{applicationDate}": documentData.appliedDate
                    ? new Date(documentData.appliedDate).toLocaleDateString("en-US", {
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
        } else if (documentCategory === "interview_notes" && documentData) {
            replacements = {
                "{applicantName}": "", // Need to get applicant name from applicantId
                "{applicantID}": documentData.applicantId || "",
                "{jobTitle}": "", // Need to get job title from jobPostId
                "{department}": "", // Need to get department from jobPostId
                "{interviewDate}": "", // Need to add interview date
                "{interviewTime}": "", // Need to add interview time
                "{interviewLocation}": "", // Need to add interview location
                "{interviewerName}": "", // Need to add interviewer name
                "{companyName}": hrSettings?.companyInfo?.[0]?.companyName || "Company Name",
                "{applicationDate}": documentData.appliedDate
                    ? new Date(documentData.appliedDate).toLocaleDateString("en-US", {
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
        if (documentCategory === "generic" && documentData) {
            return template.content.map((contentBlock, index) => {
                // Cast documentData to EmployeeModel for replaceDynamicFields
                const employeeData = documentData as unknown as EmployeeModel;
                const renderedContent = replaceDynamicFields(
                    contentBlock,
                    employeeData,
                    hrSettings,
                );

                // Remove HTML tags since react-pdf doesn't support HTML
                const plainText = renderedContent.replace(/<[^>]*>/g, "");

                return (
                    <Text key={index} style={styles.paragraph}>
                        {plainText}
                    </Text>
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

            // Remove HTML tags since react-pdf doesn't support HTML
            const plainText = renderedContent.replace(/<[^>]*>/g, "");

            return (
                <Text key={index} style={styles.paragraph}>
                    {plainText}
                </Text>
            );
        });
    };

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header */}
                {headerDocument && headerDocument.fileUrl && (
                    <View style={styles.header}>
                        <Image style={styles.headerImage} src={headerDocument.fileUrl} />
                    </View>
                )}

                {/* Content */}
                <View style={styles.content}>{renderTemplateContent()}</View>

                {/* Signature Section */}
                <View style={styles.signatureSection}>
                    {/* Employee Signature */}
                    {documentCategory === "promotion_letter" &&
                        template.employeeSignatureNeeded === "Yes" &&
                        documentData?.signature && (
                        <View style={styles.signature}>
                            <Image style={styles.signatureImage} src={documentData.signature} />
                            <Text style={styles.signatureLabel}>
                                {documentData.employeeName}
                            </Text>
                            <Text style={styles.signatureLabel}>Employee Signature</Text>
                        </View>
                    )}

                    {/* HR Signature */}
                    {signatureDocument && signatureDocument.fileUrl && (
                        <View style={styles.signature}>
                            <Image style={styles.signatureImage} src={signatureDocument.fileUrl} />
                            <Text style={styles.signatureLabel}>Human Resources Department</Text>
                            <Text style={styles.signatureLabel}>HR Signature</Text>
                        </View>
                    )}
                </View>

                {/* Stamp and Initial Section */}
                <View style={styles.stampSection}>
                    {/* Company Stamp */}
                    {stampDocument && stampDocument.fileUrl && (
                        <Image style={styles.stampImage} src={stampDocument.fileUrl} />
                    )}

                    {/* Initial */}
                    {initialDocument && initialDocument.fileUrl && (
                        <Image style={styles.initialImage} src={initialDocument.fileUrl} />
                    )}
                </View>

                {/* Footer */}
                {footerDocument && footerDocument.fileUrl && (
                    <View style={styles.footer}>
                        <Image style={styles.footerImage} src={footerDocument.fileUrl} />
                    </View>
                )}
            </Page>
        </Document>
    );
};

export default DynamicDocumentPDF;
