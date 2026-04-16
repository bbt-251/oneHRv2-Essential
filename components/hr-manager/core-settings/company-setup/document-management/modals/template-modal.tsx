import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
    Accordion,
    AccordionItem,
    AccordionTrigger,
    AccordionContent,
} from "@/components/ui/accordion";
import { MinusCircle, Plus, Sparkles, Loader2 } from "lucide-react";
import { DocumentDefinitionModel } from "@/lib/models/document";
import { FileDocumentModel } from "@/lib/models/file-document";
import { SignatureWorkflowModel } from "@/lib/models/signature-workflow";
import { RichTextEditor, RichTextEditorRef } from "@/components/ui/rich-text-editor";
import CustomCascader from "@/components/custom-cascader";
import { documentDynamicOptions } from "@/lib/util/document";
import { useTheme } from "@/components/theme-provider";
import { useToast } from "@/context/toastContext";

type TemplateType =
    | "promotion"
    | "exit"
    | "talent_acquisition_interview"
    | "talent_acquisition_offer";

interface TemplateModalProps {
    open: boolean;
    onOpenChange: (value: boolean) => void;
    editingTemplate: DocumentDefinitionModel | null;
    templateForm: DocumentDefinitionModel;
    setTemplateForm: React.Dispatch<React.SetStateAction<DocumentDefinitionModel>>;
    openSection: string | undefined;
    setOpenSection: React.Dispatch<React.SetStateAction<string | undefined>>;
    addSection: () => void;
    removeSection: (index: number) => void;
    handleSaveTemplate: () => void;
    // File document arrays for dropdown selections
    headerDocuments?: FileDocumentModel[];
    footerDocuments?: FileDocumentModel[];
    signatureDocuments?: FileDocumentModel[];
    stampDocuments?: FileDocumentModel[];
    initialDocuments?: FileDocumentModel[];
    // Signature workflows for approval dropdown
    signatureWorkflows?: SignatureWorkflowModel[];
}

const templateTypeLabels: Record<TemplateType, string> = {
    promotion: "Promotion Letter",
    exit: "Exit/Termination Letter",
    talent_acquisition_interview: "Interview Invitation",
    talent_acquisition_offer: "Job Offer Letter",
};

const TemplateModal: React.FC<TemplateModalProps> = ({
    open,
    onOpenChange,
    editingTemplate,
    templateForm,
    setTemplateForm,
    openSection,
    setOpenSection,
    addSection,
    removeSection,
    handleSaveTemplate,
    headerDocuments = [],
    footerDocuments = [],
    signatureDocuments = [],
    stampDocuments = [],
    initialDocuments = [],
    signatureWorkflows = [],
}) => {
    const { theme } = useTheme();
    const { showToast } = useToast();
    const editorRefs = React.useRef<(RichTextEditorRef | null)[]>([]);

    // AI Generation state
    const [showAIGenerateDialog, setShowAIGenerateDialog] = useState(false);
    const [selectedTemplateType, setSelectedTemplateType] = useState<TemplateType | "">("");
    const [isGenerating, setIsGenerating] = useState(false);

    const labelClass = `${theme === "dark" ? "text-gray-300" : "text-slate-700"} text-sm font-semibold`;

    const inputClass = `${
        theme === "dark"
            ? "bg-gray-900 border-gray-700 text-white placeholder-gray-500"
            : "bg-white border-gray-300 text-black placeholder-gray-400"
    }`;

    const selectTriggerClass = `${
        theme === "dark"
            ? "bg-gray-900 border-gray-700 text-white"
            : "bg-white border-gray-300 text-black"
    }`;

    // AI Generation function
    const generateTemplate = async () => {
        if (!selectedTemplateType) {
            showToast("Please select a template type", "Warning", "warning");
            return;
        }

        setIsGenerating(true);
        try {
            const response = await fetch("/api/generate-document-template", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    templateType: selectedTemplateType,
                }),
            });

            const data = await response.json();

            if (data.success && data.templateContent) {
                // Update the template form with generated content
                const newContent = [data.templateContent];
                setTemplateForm(prev => ({
                    ...prev,
                    content: newContent,
                }));

                // Auto-open the first section
                setOpenSection("section-0");

                // Set default name based on type if empty
                if (!templateForm.name) {
                    const typeLabel = templateTypeLabels[selectedTemplateType as TemplateType];
                    setTemplateForm(prev => ({
                        ...prev,
                        name: `${typeLabel} Template`,
                    }));
                }

                // Set default subject if empty
                if (!templateForm.subject) {
                    setTemplateForm(prev => ({
                        ...prev,
                        subject: templateTypeLabels[selectedTemplateType as TemplateType],
                    }));
                }

                showToast("Template generated successfully!", "Success", "success");
                setShowAIGenerateDialog(false);
                setSelectedTemplateType("");
            } else {
                showToast(data.error || "Failed to generate template", "Error", "error");
            }
        } catch (error) {
            console.error("Error generating template:", error);
            showToast("Failed to generate template. Please try again.", "Error", "error");
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent
                    className={`max-w-6xl max-h-[90vh] overflow-y-auto rounded-2xl border shadow-2xl ${
                        theme === "dark" ? "bg-black border-gray-800" : "bg-white border-gray-200"
                    }`}
                >
                    <DialogHeader>
                        <DialogTitle
                            className={`${theme === "dark" ? "text-white" : "text-slate-900"} text-xl font-semibold`}
                        >
                            {editingTemplate ? "Edit Document Template" : "Add Document Template"}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="grid grid-cols-2 gap-6">
                        {/* Left Column */}
                        <div className="space-y-4">
                            {/* Name and Subject - always text input */}
                            {[
                                { key: "name", label: "Name", placeholder: "Enter template name" },
                                { key: "subject", label: "Subject", placeholder: "Enter subject" },
                            ].map(({ key, label, placeholder }) => (
                                <div key={key} className="space-y-2">
                                    <Label className={labelClass}>{label}</Label>
                                    <Input
                                        value={(templateForm as any)[key] || ""}
                                        onChange={e =>
                                            setTemplateForm(prev => ({
                                                ...prev,
                                                [key]: e.target.value,
                                            }))
                                        }
                                        placeholder={placeholder}
                                        className={inputClass}
                                    />
                                </div>
                            ))}

                            {/* Header - Select from header documents */}
                            <div className="space-y-2">
                                <Label className={labelClass}>Header</Label>
                                <Select
                                    value={templateForm.header || ""}
                                    onValueChange={value =>
                                        setTemplateForm(prev => ({ ...prev, header: value }))
                                    }
                                >
                                    <SelectTrigger className={selectTriggerClass}>
                                        <SelectValue placeholder="Select header..." />
                                    </SelectTrigger>
                                    <SelectContent
                                        className={`${theme === "dark" ? "bg-gray-900 text-white" : "bg-white text-black"}`}
                                    >
                                        <SelectItem value="-">None</SelectItem>
                                        {headerDocuments
                                            .filter(d => d.active)
                                            .map(doc => (
                                                <SelectItem key={doc.id} value={doc.id}>
                                                    {doc.name}
                                                </SelectItem>
                                            ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Footer - Select from footer documents */}
                            <div className="space-y-2">
                                <Label className={labelClass}>Footer</Label>
                                <Select
                                    value={templateForm.footer || ""}
                                    onValueChange={value =>
                                        setTemplateForm(prev => ({ ...prev, footer: value }))
                                    }
                                >
                                    <SelectTrigger className={selectTriggerClass}>
                                        <SelectValue placeholder="Select footer..." />
                                    </SelectTrigger>
                                    <SelectContent
                                        className={`${theme === "dark" ? "bg-gray-900 text-white" : "bg-white text-black"}`}
                                    >
                                        <SelectItem value="-">None</SelectItem>
                                        {footerDocuments
                                            .filter(d => d.active)
                                            .map(doc => (
                                                <SelectItem key={doc.id} value={doc.id}>
                                                    {doc.name}
                                                </SelectItem>
                                            ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Signature - Select from signature documents */}
                            <div className="space-y-2">
                                <Label className={labelClass}>Signature</Label>
                                <Select
                                    value={templateForm.signature || ""}
                                    onValueChange={value =>
                                        setTemplateForm(prev => ({ ...prev, signature: value }))
                                    }
                                >
                                    <SelectTrigger className={selectTriggerClass}>
                                        <SelectValue placeholder="Select signature..." />
                                    </SelectTrigger>
                                    <SelectContent
                                        className={`${theme === "dark" ? "bg-gray-900 text-white" : "bg-white text-black"}`}
                                    >
                                        <SelectItem value="-">None</SelectItem>
                                        {signatureDocuments
                                            .filter(d => d.active)
                                            .map(doc => (
                                                <SelectItem key={doc.id} value={doc.id}>
                                                    {doc.name}
                                                </SelectItem>
                                            ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Initial - Select from initial documents */}
                            <div className="space-y-2">
                                <Label className={labelClass}>Initial</Label>
                                <Select
                                    value={templateForm.initial || ""}
                                    onValueChange={value =>
                                        setTemplateForm(prev => ({ ...prev, initial: value }))
                                    }
                                >
                                    <SelectTrigger className={selectTriggerClass}>
                                        <SelectValue placeholder="Select initial..." />
                                    </SelectTrigger>
                                    <SelectContent
                                        className={`${theme === "dark" ? "bg-gray-900 text-white" : "bg-white text-black"}`}
                                    >
                                        <SelectItem value="-">None</SelectItem>
                                        {initialDocuments
                                            .filter(d => d.active)
                                            .map(doc => (
                                                <SelectItem key={doc.id} value={doc.id}>
                                                    {doc.name}
                                                </SelectItem>
                                            ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Stamps - Select from stamp documents */}
                            <div className="space-y-2">
                                <Label className={labelClass}>Stamp</Label>
                                <Select
                                    value={(templateForm as any).stamp || ""}
                                    onValueChange={value =>
                                        setTemplateForm(prev => ({ ...prev, stamp: value }))
                                    }
                                >
                                    <SelectTrigger className={selectTriggerClass}>
                                        <SelectValue placeholder="Select stamp..." />
                                    </SelectTrigger>
                                    <SelectContent
                                        className={`${theme === "dark" ? "bg-gray-900 text-white" : "bg-white text-black"}`}
                                    >
                                        <SelectItem value="-">None</SelectItem>
                                        {stampDocuments
                                            .filter(d => d.active)
                                            .map(doc => (
                                                <SelectItem key={doc.id} value={doc.id}>
                                                    {doc.name}
                                                </SelectItem>
                                            ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Right Column */}
                        <div className="space-y-4">
                            {/* Dates */}
                            <div className="grid grid-cols-2 gap-4">
                                {[
                                    { key: "startDate", label: "Start Date", type: "date" },
                                    { key: "endDate", label: "End Date", type: "date" },
                                ].map(({ key, label, type }) => (
                                    <div key={key} className="space-y-2">
                                        <Label className={labelClass}>{label}</Label>
                                        <Input
                                            type={type}
                                            value={(templateForm as any)[key] || ""}
                                            onChange={e =>
                                                setTemplateForm(prev => ({
                                                    ...prev,
                                                    [key]: e.target.value,
                                                }))
                                            }
                                            className={inputClass}
                                        />
                                    </div>
                                ))}
                            </div>

                            {/* Select fields */}
                            {[
                                {
                                    key: "initialNeeded",
                                    label: "Initial Needed",
                                    options: ["Yes", "No"],
                                },
                                {
                                    key: "employeeSignatureNeeded",
                                    label: "Employee Signature Needed",
                                    options: ["Yes", "No"],
                                },
                                {
                                    key: "status",
                                    label: "Status",
                                    options: ["Published", "Unpublished"],
                                },
                                {
                                    key: "visibility",
                                    label: "Visibility",
                                    options: ["Open", "Restricted"],
                                },
                                { key: "active", label: "Active", options: ["Yes", "No"] },
                            ].map(({ key, label, options }) => (
                                <div key={key} className="space-y-2">
                                    <Label className={labelClass}>{label}</Label>
                                    <Select
                                        value={(templateForm as any)[key] || ""}
                                        onValueChange={value =>
                                            setTemplateForm(prev => ({ ...prev, [key]: value }))
                                        }
                                    >
                                        <SelectTrigger className={selectTriggerClass}>
                                            <SelectValue placeholder="Select..." />
                                        </SelectTrigger>
                                        <SelectContent
                                            className={`${theme === "dark" ? "bg-gray-900 text-white" : "bg-white text-black"}`}
                                        >
                                            {options.map(opt => (
                                                <SelectItem key={opt} value={opt}>
                                                    {opt}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            ))}

                            {/* Approval Workflow - Simple dropdown like headers/footers */}
                            <div className="space-y-2">
                                <Label className={labelClass}>Approval Workflow</Label>
                                <Select
                                    value={templateForm.approvalWorkflowID || ""}
                                    onValueChange={value =>
                                        setTemplateForm(prev => ({
                                            ...prev,
                                            approvalWorkflowID: value === "none" ? null : value,
                                        }))
                                    }
                                >
                                    <SelectTrigger className={selectTriggerClass}>
                                        <SelectValue placeholder="Select approval workflow..." />
                                    </SelectTrigger>
                                    <SelectContent
                                        className={`${theme === "dark" ? "bg-gray-900 text-white" : "bg-white text-black"}`}
                                    >
                                        <SelectItem value="none">None</SelectItem>
                                        <SelectItem value="manager">Manager Approval</SelectItem>
                                        {signatureWorkflows
                                            .filter(w => w.active)
                                            .map(workflow => (
                                                <SelectItem key={workflow.id} value={workflow.id}>
                                                    {workflow.name}
                                                </SelectItem>
                                            ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    {/* Content Editor */}
                    <div className={`${theme === "dark" ? "" : "bg-white"} w-full p-0`}>
                        <Accordion
                            type="single"
                            collapsible
                            value={openSection}
                            onValueChange={setOpenSection}
                            className="space-y-4"
                        >
                            {(templateForm.content || []).map((section: any, index: number) => (
                                <AccordionItem
                                    key={index}
                                    value={`section-${index}`}
                                    className={`border rounded-lg overflow-hidden shadow-sm ${
                                        theme === "dark"
                                            ? "bg-gray-800 border-gray-700"
                                            : "bg-white border-gray-200"
                                    }`}
                                >
                                    <div
                                        className="flex items-center justify-between w-full px-4 py-3 cursor-pointer"
                                        onClick={() =>
                                            setOpenSection(
                                                openSection === `section-${index}`
                                                    ? undefined
                                                    : `section-${index}`,
                                            )
                                        }
                                    >
                                        <AccordionTrigger
                                            className={`flex-1 text-lg font-medium ${
                                                theme === "dark"
                                                    ? "text-amber-300"
                                                    : "text-amber-800"
                                            } p-0`}
                                        >
                                            Section {index + 1}
                                        </AccordionTrigger>
                                        <MinusCircle
                                            className="w-5 h-5 text-red-500"
                                            onClick={e => {
                                                e.stopPropagation();
                                                removeSection(index);
                                            }}
                                        />
                                    </div>

                                    <AccordionContent
                                        className={`${theme === "dark" ? "" : "bg-amber-50"} px-4 pb-4`}
                                    >
                                        <div
                                            className={`w-full h-[600px] flex justify-around items-start shadow-md rounded-lg border p-4
                      ${theme === "dark" ? "bg-gray-800" : "border-amber-200 bg-white"}`}
                                        >
                                            <div className="w-full">
                                                {openSection === `section-${index}` && (
                                                    <>
                                                        <div className="flex justify-center pb-3">
                                                            <CustomCascader
                                                                options={documentDynamicOptions}
                                                                setDynamicOptions={text => {
                                                                    editorRefs.current[
                                                                        index
                                                                    ]?.insertText(text);
                                                                }}
                                                            />
                                                        </div>
                                                        <RichTextEditor
                                                            ref={el => {
                                                                editorRefs.current[index] = el;
                                                            }}
                                                            value={
                                                                (templateForm.content || [])[
                                                                    index
                                                                ] || ""
                                                            }
                                                            onChange={html => {
                                                                const newContent = [
                                                                    ...(templateForm.content || []),
                                                                ];
                                                                newContent[index] = html;
                                                                setTemplateForm(prev => ({
                                                                    ...prev,
                                                                    content: newContent,
                                                                }));
                                                            }}
                                                            placeholder="Enter document content..."
                                                        />
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>

                        {/* Divider */}
                        <div
                            className={`my-6 border-t ${theme === "dark" ? "border-gray-700" : "border-gray-200"}`}
                        />

                        {/* Add Section */}
                        <div className="flex items-center justify-center">
                            <Button
                                variant="outline"
                                onClick={addSection}
                                className={`flex items-center gap-2 ${
                                    theme === "dark"
                                        ? "border-gray-600 text-gray-300 hover:bg-gray-800"
                                        : "border-gray-300 text-slate-700 hover:bg-gray-100"
                                }`}
                            >
                                <Plus className="w-4 h-4" />
                                Add Section
                            </Button>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div
                        className={`flex justify-between pt-6 border-t ${theme === "dark" ? "border-gray-700" : "border-gray-200"}`}
                    >
                        {/* AI Generate Button */}
                        <Button
                            variant="outline"
                            onClick={() => setShowAIGenerateDialog(true)}
                            disabled={editingTemplate !== null}
                            className={`flex items-center gap-2 ${
                                theme === "dark"
                                    ? "border-purple-600 text-purple-400 hover:bg-purple-900/20"
                                    : "border-purple-500 text-purple-600 hover:bg-purple-50"
                            }`}
                        >
                            <Sparkles className="w-4 h-4" />
                            Generate with AI
                        </Button>

                        <div className="flex gap-3">
                            <Button
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                className={`${
                                    theme === "dark"
                                        ? "border-gray-600 text-gray-300 hover:bg-gray-700"
                                        : "border-gray-300 text-slate-700 hover:bg-gray-100"
                                }`}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleSaveTemplate}
                                className={`${
                                    theme === "dark"
                                        ? "bg-amber-600 hover:bg-amber-700 text-white"
                                        : "bg-amber-600 hover:bg-amber-700 text-white"
                                }`}
                            >
                                {editingTemplate ? "Update Template" : "Create Template"}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
            {/* AI Generate Dialog */}
            <Dialog open={showAIGenerateDialog} onOpenChange={setShowAIGenerateDialog}>
                <DialogContent
                    className={`max-w-md ${theme === "dark" ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200"}`}
                >
                    <DialogHeader>
                        <DialogTitle
                            className={`flex items-center gap-2 ${theme === "dark" ? "text-white" : "text-slate-900"}`}
                        >
                            <Sparkles className="w-5 h-5 text-purple-500" />
                            Generate Template with AI
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label className={labelClass}>Select Template Type</Label>
                            <Select
                                value={selectedTemplateType}
                                onValueChange={value =>
                                    setSelectedTemplateType(value as TemplateType)
                                }
                            >
                                <SelectTrigger className={selectTriggerClass}>
                                    <SelectValue placeholder="Choose a template type..." />
                                </SelectTrigger>
                                <SelectContent
                                    className={`${theme === "dark" ? "bg-gray-900 text-white" : "bg-white text-black"}`}
                                >
                                    <SelectItem value="promotion">Promotion Letter</SelectItem>
                                    <SelectItem value="exit">Exit/Termination Letter</SelectItem>
                                    <SelectItem value="talent_acquisition_interview">
                                        Interview Invitation
                                    </SelectItem>
                                    <SelectItem value="talent_acquisition_offer">
                                        Job Offer Letter
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {selectedTemplateType && (
                            <div
                                className={`p-3 rounded-lg ${theme === "dark" ? "bg-gray-800" : "bg-purple-50"}`}
                            >
                                <p
                                    className={`text-sm ${theme === "dark" ? "text-gray-300" : "text-slate-600"}`}
                                >
                                    <strong
                                        className={
                                            theme === "dark" ? "text-purple-400" : "text-purple-700"
                                        }
                                    >
                                        {templateTypeLabels[selectedTemplateType as TemplateType]}
                                    </strong>{" "}
                                    template will include dynamic fields like employee name,
                                    position, salary, dates, and other relevant information that can
                                    be filled when generating documents.
                                </p>
                            </div>
                        )}

                        <div className="flex justify-end gap-3 pt-4">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setShowAIGenerateDialog(false);
                                    setSelectedTemplateType("");
                                }}
                                className={
                                    theme === "dark"
                                        ? "border-gray-600 text-gray-300"
                                        : "border-gray-300 text-slate-700"
                                }
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={generateTemplate}
                                disabled={!selectedTemplateType || isGenerating}
                                className={`flex items-center gap-2 ${
                                    theme === "dark"
                                        ? "bg-purple-600 hover:bg-purple-700 text-white"
                                        : "bg-purple-600 hover:bg-purple-700 text-white"
                                }`}
                            >
                                {isGenerating ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Generating...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="w-4 h-4" />
                                        Generate
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default TemplateModal;
