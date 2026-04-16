"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Search,
    Plus,
    FileText,
    Edit,
    Trash2,
    Eye,
    Image,
    GitBranch,
    User,
    ChevronUp,
    ChevronDown,
    X,
} from "lucide-react";
import { DocumentDefinitionModel } from "@/lib/models/document";
import { ExternalDocumentModel } from "@/lib/models/external-document";
import { FileDocumentModel } from "@/lib/models/file-document";
import { SignatureWorkflowModel, ApproverModel } from "@/lib/models/signature-workflow";
import { EmployeeModel } from "@/lib/models/employee";
import { useFirestore } from "@/context/firestore-context";
import { useAuth } from "@/context/authContext";
import {
    createDocument,
    deleteDocument,
    updateDocument,
} from "@/lib/backend/api/hr-settings/document-service";
import {
    createSignatureWorkflow,
    updateSignatureWorkflow,
    deleteSignatureWorkflow,
} from "@/lib/backend/api/hr-settings/signature-workflow-service";
import { SignatureWorkflowTab } from "./blocks/signature-workflow-tab";
import { useToast } from "@/context/toastContext";
import { useConfirm } from "@/hooks/use-confirm-dialog";
import { useTheme } from "@/components/theme-provider";
import { Switch } from "@/components/ui/switch";
import TemplateModal from "./modals/template-modal";
import ViewTemplateDialog from "./modals/ViewTemplateDialog";

// External Documents Dialogs
import CreateExternalDocumentDialog from "./modals/external-documents/CreateExternalDocumentDialog";
import EditExternalDocumentDialog from "./modals/external-documents/EditExternalDocumentDialog";
import DeleteExternalDocumentDialog from "./modals/external-documents/DeleteExternalDocumentDialog";
import ViewExternalDocumentDialog from "./modals/external-documents/ViewExternalDocumentDialog";

// Generic File Document Dialogs
import {
    CreateFileDocumentDialog,
    EditFileDocumentDialog,
    DeleteFileDocumentDialog,
    ViewFileDocumentDialog,
} from "./modals/generic/FileDocumentDialogs";
import { FileDocumentType } from "@/lib/backend/api/hr-settings/file-document-service";

// Types for file document dialogs
type FileTabType = "header" | "footer" | "signature" | "stamp" | "initial";

export function DocumentManagement() {
    const { theme } = useTheme();
    const { showToast } = useToast();
    const { documents, hrSettings, employees } = useFirestore();
    const { userData } = useAuth();
    const { confirm, ConfirmDialog } = useConfirm();

    // Get current user ID for activity logging
    const currentUserId = userData?.uid;

    // Get documents from hrSettings
    const externalDocuments: ExternalDocumentModel[] = hrSettings.externalDocuments || [];
    const headerDocuments: FileDocumentModel[] = hrSettings.headerDocuments || [];
    const footerDocuments: FileDocumentModel[] = hrSettings.footerDocuments || [];
    const signatureDocuments: FileDocumentModel[] = hrSettings.signatureDocuments || [];
    const stampDocuments: FileDocumentModel[] = hrSettings.stampDocuments || [];
    const initialDocuments: FileDocumentModel[] = hrSettings.initialDocuments || [];
    const signatureWorkflows: SignatureWorkflowModel[] = hrSettings.signatureWorkflows || [];

    const [searchTerm, setSearchTerm] = useState<string>("");
    const [showFilterModal, setShowFilterModal] = useState<boolean>(false);
    const [filteredTemplates, setFilteredTemplates] = useState<DocumentDefinitionModel[]>([]);

    const [selectedFields, setSelectedFields] = useState<string[]>([
        "name",
        "subject",
        "status",
        "visibility",
        "active",
    ]);

    const [templateFields] = useState([
        { key: "name", label: "Name", type: "text" },
        { key: "subject", label: "Subject", type: "text" },
        { key: "header", label: "Header", type: "text" },
        { key: "footer", label: "Footer", type: "text" },
        { key: "signature", label: "Signature", type: "text" },
        { key: "startDate", label: "Start Date", type: "date" },
        { key: "endDate", label: "End Date", type: "date" },
        { key: "active", label: "Active", type: "select", options: ["Yes", "No"] },
        { key: "initial", label: "Initial", type: "text" },
        { key: "initialNeeded", label: "Initial Needed", type: "select", options: ["Yes", "No"] },
        {
            key: "employeeSignatureNeeded",
            label: "Employee Signature Needed",
            type: "select",
            options: ["Yes", "No"],
        },
        { key: "status", label: "Status", type: "select", options: ["Published", "Unpublished"] },
        { key: "visibility", label: "Visibility", type: "select", options: ["Open", "Restricted"] },
    ]);

    const [filters, setFilters] = useState<Record<string, string>>({});
    const [showTemplateModal, setShowTemplateModal] = useState<boolean>(false);
    const [editingTemplate, setEditingTemplate] = useState<DocumentDefinitionModel | null>(null);
    const [templateForm, setTemplateForm] = useState<DocumentDefinitionModel>({
        id: "",
        timestamp: "",
        name: "",
        subject: "",
        header: "",
        footer: "",
        signature: "",
        initial: "",
        stamp: "",
        startDate: "",
        endDate: "",
        initialNeeded: "Yes",
        employeeSignatureNeeded: "Yes",
        status: "Published",
        visibility: "Open",
        active: "Yes",
        content: [""],
        approvalWorkflowID: null,
        approvalState: {
            status: "none",
            currentApproverIndex: 0,
            approvedBy: [],
            approvedTimestamps: [],
            rejectedBy: null,
            rejectionReason: null,
            approverComments: [],
        },
    });
    const [openSection, setOpenSection] = useState<string | undefined>(undefined);

    // Active tab state - controlled to persist across refreshes
    const [activeTab, setActiveTab] = useState("external");

    // External Documents Dialog States
    const [showCreateExternal, setShowCreateExternal] = useState(false);
    const [showEditExternal, setShowEditExternal] = useState(false);
    const [showDeleteExternal, setShowDeleteExternal] = useState(false);
    const [showViewExternal, setShowViewExternal] = useState(false);
    const [selectedExternalDoc, setSelectedExternalDoc] = useState<ExternalDocumentModel | null>(
        null,
    );

    // Template View Dialog State
    const [showViewTemplate, setShowViewTemplate] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState<DocumentDefinitionModel | null>(null);

    // File Document Dialog States (for headers, footers, signatures, stamps, initials)
    const [showCreateFile, setShowCreateFile] = useState(false);
    const [showEditFile, setShowEditFile] = useState(false);
    const [showDeleteFile, setShowDeleteFile] = useState(false);
    const [showViewFile, setShowViewFile] = useState(false);
    const [selectedFileDoc, setSelectedFileDoc] = useState<FileDocumentModel | null>(null);
    const [currentFileTab, setCurrentFileTab] = useState<FileTabType>("header");

    // Search states for each tab
    const [externalSearch, setExternalSearch] = useState("");
    const [headerSearch, setHeaderSearch] = useState("");
    const [footerSearch, setFooterSearch] = useState("");
    const [signatureSearch, setSignatureSearch] = useState("");
    const [stampSearch, setStampSearch] = useState("");
    const [initialSearch, setInitialSearch] = useState("");
    const [workflowSearch, setWorkflowSearch] = useState("");

    useEffect(() => {
        setFilteredTemplates(documents);
    }, [documents]);

    const handleRefresh = () => {
        // No need to manually refresh - data comes from hrSettings which auto-updates via Firestore
        // This callback is kept for dialog onSuccess prop compatibility
    };

    // External Documents Handlers
    const handleAddExternal = () => {
        setSelectedExternalDoc(null);
        setShowCreateExternal(true);
    };

    const handleEditExternal = (doc: ExternalDocumentModel) => {
        setSelectedExternalDoc(doc);
        setShowEditExternal(true);
    };

    const handleDeleteExternal = (doc: ExternalDocumentModel) => {
        setSelectedExternalDoc(doc);
        setShowDeleteExternal(true);
    };

    const handleViewExternal = (doc: ExternalDocumentModel) => {
        setSelectedExternalDoc(doc);
        setShowViewExternal(true);
    };

    // Template View Handler
    const handleViewTemplate = (template: DocumentDefinitionModel) => {
        setSelectedTemplate(template);
        setShowViewTemplate(true);
    };

    // File Document Handlers
    const handleAddFile = (type: FileTabType) => {
        setCurrentFileTab(type);
        setSelectedFileDoc(null);
        setShowCreateFile(true);
    };

    const handleEditFile = (type: FileTabType, doc: FileDocumentModel) => {
        setCurrentFileTab(type);
        setSelectedFileDoc(doc);
        setShowEditFile(true);
    };

    const handleDeleteFile = (type: FileTabType, doc: FileDocumentModel) => {
        setCurrentFileTab(type);
        setSelectedFileDoc(doc);
        setShowDeleteFile(true);
    };

    const handleViewFile = (type: FileTabType, doc: FileDocumentModel) => {
        setCurrentFileTab(type);
        setSelectedFileDoc(doc);
        setShowViewFile(true);
    };

    const handleAddTemplate = () => {
        setEditingTemplate(null);
        setTemplateForm({
            id: "",
            timestamp: "",
            name: "",
            subject: "",
            header: "",
            footer: "",
            signature: "",
            initial: "",
            stamp: "",
            startDate: "",
            endDate: "",
            initialNeeded: "Yes",
            employeeSignatureNeeded: "Yes",
            status: "Published",
            visibility: "Open",
            active: "Yes",
            content: [""],
            approvalWorkflowID: null,
            approvalState: {
                status: "none",
                currentApproverIndex: 0,
                approvedBy: [],
                approvedTimestamps: [],
                rejectedBy: null,
                rejectionReason: null,
                approverComments: [],
            },
        });
        setShowTemplateModal(true);
    };

    const handleEditTemplate = (template: DocumentDefinitionModel) => {
        setEditingTemplate(template);
        const convertedContent = (template.content || []).map(content => {
            if (typeof content === "string") {
                try {
                    const parsed = JSON.parse(content);
                    return parsed.blocks?.map((block: any) => block.text).join("\n") || "";
                } catch {
                    return content;
                }
            }
            return content;
        });
        setTemplateForm({ ...template, content: convertedContent });
        setShowTemplateModal(true);
    };

    const handleDeleteTemplate = async (templateId: string) => {
        confirm("Are you sure ?", async () => {
            const res = await deleteDocument(templateId);
            if (res) {
                showToast("Document deleted successfully", "Success", "success");
            } else {
                showToast("Error deleting document", "Error", "error");
            }
        });
    };

    const handleFieldToggle = (fieldKey: string) => {
        setSelectedFields(prev =>
            prev.includes(fieldKey) ? prev.filter(f => f !== fieldKey) : [...prev, fieldKey],
        );
    };

    const handleClearFilters = () => {
        setFilters({});
        setShowFilterModal(false);
    };

    const handleApplyFilters = () => {
        setShowFilterModal(false);
    };

    const handleSaveTemplate = async () => {
        if (editingTemplate) {
            const res = await updateDocument(templateForm);
            if (res) {
                showToast("Document updated successfully", "Success", "success");
                setShowTemplateModal(false);
            } else {
                showToast("Error updating document", "Error", "error");
            }
        } else {
            const { id, ...data } = templateForm;
            const res = await createDocument(data);
            if (res) {
                showToast("Document created successfully", "Success", "success");
                setShowTemplateModal(false);
            } else {
                showToast("Error creating document", "Error", "error");
            }
        }
    };

    const addSection = () => {
        setTemplateForm(prev => ({
            ...prev,
            content: [...(prev.content || []), ""],
        }));
    };

    const removeSection = (index: number) => {
        setTemplateForm(prev => ({
            ...prev,
            content: prev.content.filter((_, i) => i !== index),
        }));
    };

    // Helper function to render status badge
    const renderStatusBadge = (active: boolean) => (
        <Badge
            className={`rounded-lg px-3 py-1 ${
                active
                    ? theme === "dark"
                        ? "bg-green-900 text-green-300 border-green-700"
                        : "bg-green-100 text-green-800 border-green-200"
                    : theme === "dark"
                        ? "bg-red-900 text-red-300 border-red-700"
                        : "bg-red-100 text-red-800 border-red-200"
            }`}
        >
            {active ? "Active" : "Inactive"}
        </Badge>
    );

    // Helper function to render action buttons
    const renderActionButtons = (onEdit: () => void, onDelete: () => void, onView: () => void) => (
        <div className="flex justify-end gap-2">
            <Button
                size="sm"
                variant="outline"
                onClick={onView}
                className={
                    theme === "dark"
                        ? "border-gray-600 text-white hover:bg-gray-800"
                        : "border-amber-200 text-amber-700 hover:bg-amber-50"
                }
            >
                <Eye className="h-4 w-4" />
            </Button>
            <Button
                size="sm"
                variant="outline"
                onClick={onEdit}
                className={
                    theme === "dark"
                        ? "border-gray-600 text-white hover:bg-gray-800"
                        : "border-amber-200 text-amber-700 hover:bg-amber-50"
                }
            >
                <Edit className="h-4 w-4" />
            </Button>
            <Button
                size="sm"
                variant="outline"
                onClick={onDelete}
                className={
                    theme === "dark"
                        ? "border-red-700 text-red-400 hover:bg-gray-800"
                        : "border-red-200 text-red-700 hover:bg-red-50"
                }
            >
                <Trash2 className="h-4 w-4" />
            </Button>
        </div>
    );

    // Tab render helper - for External Documents (has type field)
    const renderExternalDocumentTable = (
        documents: ExternalDocumentModel[],
        searchTerm: string,
        onSearchChange: (value: string) => void,
        onAdd: () => void,
        onEdit: (doc: ExternalDocumentModel) => void,
        onDelete: (doc: ExternalDocumentModel) => void,
        onView: (doc: ExternalDocumentModel) => void,
        title: string,
        emptyMessage: string = "No documents found",
    ) => (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div className="relative max-w-md">
                    <Search
                        className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${theme === "dark" ? "text-gray-400" : "text-slate-400"}`}
                    />
                    <Input
                        placeholder={`Search ${title.toLowerCase()}...`}
                        value={searchTerm}
                        onChange={e => onSearchChange(e.target.value)}
                        className={`pl-10 rounded-lg ${theme === "dark" ? "bg-black text-white border-gray-600 focus:border-amber-500 focus:ring-amber-500" : "border-slate-200 focus:border-amber-500 focus:ring-amber-500"}`}
                    />
                </div>
                <Button
                    onClick={onAdd}
                    className={
                        theme === "dark"
                            ? "bg:bg-gray-200"
                            : "bg-amber-600-white text-black hover hover:bg-amber-700 text-white"
                    }
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Add {title.slice(0, -1)}
                </Button>
            </div>

            <Card
                className={`${theme === "dark" ? "bg-black border-gray-700" : "bg-white/80 border-0"} shadow-xl rounded-2xl overflow-hidden`}
            >
                <CardHeader
                    className={`${theme === "dark" ? "bg-black text-white" : "bg-amber-800 text-white"} p-6`}
                >
                    <CardTitle className="flex items-center gap-4">
                        <Image className="h-8 w-8" />
                        <div>
                            <div className="text-2xl">{title}</div>
                            <div
                                className={`${theme === "dark" ? "text-gray-400" : "text-yellow-200"} text-sm font-normal`}
                            >
                                {
                                    documents.filter(d =>
                                        d.name.toLowerCase().includes(searchTerm.toLowerCase()),
                                    ).length
                                }{" "}
                                total
                            </div>
                        </div>
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
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
                                    Name
                                </TableHead>
                                <TableHead
                                    className={`${theme === "dark" ? "text-white" : "text-yellow-100"} font-semibold py-4 px-6`}
                                >
                                    Type
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
                            {documents.filter(d =>
                                d.name.toLowerCase().includes(searchTerm.toLowerCase()),
                            ).length === 0 ? (
                                    <TableRow>
                                        <TableCell
                                            colSpan={4}
                                            className={`text-center py-8 ${theme === "dark" ? "text-gray-400" : "text-slate-500"}`}
                                        >
                                            {emptyMessage}
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    documents
                                        .filter(d =>
                                            d.name.toLowerCase().includes(searchTerm.toLowerCase()),
                                        )
                                        .map((doc, index) => (
                                            <TableRow
                                                key={doc.id || index}
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
                                                    {doc.name}
                                                </TableCell>
                                                <TableCell
                                                    className={`${theme === "dark" ? "text-gray-300" : "text-slate-700"} px-6`}
                                                >
                                                    {doc.type}
                                                </TableCell>
                                                <TableCell className="px-6">
                                                    {renderStatusBadge(doc.active)}
                                                </TableCell>
                                                <TableCell className="px-6 text-right">
                                                    {renderActionButtons(
                                                        () => onEdit(doc),
                                                        () => onDelete(doc),
                                                        () => onView(doc),
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );

    // Tab render helper - for File Documents (no type field, has fileUrl)
    const renderFileDocumentTable = (
        documents: FileDocumentModel[],
        searchTerm: string,
        onSearchChange: (value: string) => void,
        onAdd: () => void,
        onEdit: (doc: FileDocumentModel) => void,
        onDelete: (doc: FileDocumentModel) => void,
        onView: (doc: FileDocumentModel) => void,
        title: string,
        emptyMessage: string = "No documents found",
    ) => (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div className="relative max-w-md">
                    <Search
                        className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${theme === "dark" ? "text-gray-400" : "text-slate-400"}`}
                    />
                    <Input
                        placeholder={`Search ${title.toLowerCase()}...`}
                        value={searchTerm}
                        onChange={e => onSearchChange(e.target.value)}
                        className={`pl-10 rounded-lg ${theme === "dark" ? "bg-black text-white border-gray-600 focus:border-amber-500 focus:ring-amber-500" : "border-slate-200 focus:border-amber-500 focus:ring-amber-500"}`}
                    />
                </div>
                <Button
                    onClick={onAdd}
                    className={
                        theme === "dark"
                            ? "bg-white text-black hover:bg-gray-200"
                            : "bg-amber-600 hover:bg-amber-700 text-white"
                    }
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Add {title.slice(0, -1)}
                </Button>
            </div>

            <Card
                className={`${theme === "dark" ? "bg-black border-gray-700" : "bg-white/80 border-0"} shadow-xl rounded-2xl overflow-hidden`}
            >
                <CardHeader
                    className={`${theme === "dark" ? "bg-black text-white" : "bg-amber-800 text-white"} p-6`}
                >
                    <CardTitle className="flex items-center gap-4">
                        <Image className="h-8 w-8" />
                        <div>
                            <div className="text-2xl">{title}</div>
                            <div
                                className={`${theme === "dark" ? "text-gray-400" : "text-yellow-200"} text-sm font-normal`}
                            >
                                {
                                    documents.filter(d =>
                                        d.name.toLowerCase().includes(searchTerm.toLowerCase()),
                                    ).length
                                }{" "}
                                total
                            </div>
                        </div>
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
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
                                    Name
                                </TableHead>
                                <TableHead
                                    className={`${theme === "dark" ? "text-white" : "text-yellow-100"} font-semibold py-4 px-6`}
                                >
                                    Image
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
                            {documents.filter(d =>
                                d.name.toLowerCase().includes(searchTerm.toLowerCase()),
                            ).length === 0 ? (
                                    <TableRow>
                                        <TableCell
                                            colSpan={4}
                                            className={`text-center py-8 ${theme === "dark" ? "text-gray-400" : "text-slate-500"}`}
                                        >
                                            {emptyMessage}
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    documents
                                        .filter(d =>
                                            d.name.toLowerCase().includes(searchTerm.toLowerCase()),
                                        )
                                        .map((doc, index) => (
                                            <TableRow
                                                key={doc.id || index}
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
                                                    {doc.name}
                                                </TableCell>
                                                <TableCell
                                                    className={`${theme === "dark" ? "text-gray-300" : "text-slate-700"} px-6`}
                                                >
                                                    {doc.fileUrl ? (
                                                        <img
                                                            src={doc.fileUrl}
                                                            alt={doc.name}
                                                            className="h-10 w-10 object-contain rounded"
                                                        />
                                                    ) : (
                                                        <span className="text-gray-400">-</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="px-6">
                                                    {renderStatusBadge(doc.active)}
                                                </TableCell>
                                                <TableCell className="px-6 text-right">
                                                    {renderActionButtons(
                                                        () => onEdit(doc),
                                                        () => onDelete(doc),
                                                        () => onView(doc),
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );

    return (
        <div className={`${theme === "dark" ? "bg-black" : "bg-amber-50/30"} min-h-screen p-6`}>
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header Section */}
                <div className="space-y-2">
                    <h1
                        className={`${theme === "dark" ? "text-white" : "text-amber-900"} text-4xl font-bold`}
                    >
                        Document Management
                    </h1>
                    <p
                        className={`${theme === "dark" ? "text-gray-400" : "text-slate-600"} text-lg`}
                    >
                        Manage external documents and internal document templates
                    </p>
                </div>

                {/* Document Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList
                        className={`grid w-full grid-cols-8 rounded-xl shadow-lg border ${theme === "dark" ? "bg-black border-gray-700" : "bg-white border-amber-200"}`}
                    >
                        {[
                            "external",
                            "headers",
                            "footers",
                            "signatures",
                            "stamps",
                            "initials",
                            "templates",
                            "workflows",
                        ].map(tab => (
                            <TabsTrigger
                                key={tab}
                                value={tab}
                                className={`data-[state=active]:bg-amber-600 data-[state=active]:text-white ${theme === "dark" ? "text-white" : "text-amber-900"}`}
                            >
                                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                            </TabsTrigger>
                        ))}
                    </TabsList>

                    {/* External Documents Tab */}
                    <TabsContent value="external" className="space-y-6">
                        {renderExternalDocumentTable(
                            externalDocuments,
                            externalSearch,
                            setExternalSearch,
                            handleAddExternal,
                            handleEditExternal,
                            handleDeleteExternal,
                            handleViewExternal,
                            "External Documents",
                        )}
                    </TabsContent>

                    {/* Headers Tab */}
                    <TabsContent value="headers" className="space-y-6">
                        {renderFileDocumentTable(
                            headerDocuments,
                            headerSearch,
                            setHeaderSearch,
                            () => handleAddFile("header"),
                            doc => handleEditFile("header", doc),
                            doc => handleDeleteFile("header", doc),
                            doc => handleViewFile("header", doc),
                            "Headers",
                        )}
                    </TabsContent>

                    {/* Footers Tab */}
                    <TabsContent value="footers" className="space-y-6">
                        {renderFileDocumentTable(
                            footerDocuments,
                            footerSearch,
                            setFooterSearch,
                            () => handleAddFile("footer"),
                            doc => handleEditFile("footer", doc),
                            doc => handleDeleteFile("footer", doc),
                            doc => handleViewFile("footer", doc),
                            "Footers",
                        )}
                    </TabsContent>

                    {/* Signatures Tab */}
                    <TabsContent value="signatures" className="space-y-6">
                        {renderFileDocumentTable(
                            signatureDocuments,
                            signatureSearch,
                            setSignatureSearch,
                            () => handleAddFile("signature"),
                            doc => handleEditFile("signature", doc),
                            doc => handleDeleteFile("signature", doc),
                            doc => handleViewFile("signature", doc),
                            "Signatures",
                        )}
                    </TabsContent>

                    {/* Stamps Tab */}
                    <TabsContent value="stamps" className="space-y-6">
                        {renderFileDocumentTable(
                            stampDocuments,
                            stampSearch,
                            setStampSearch,
                            () => handleAddFile("stamp"),
                            doc => handleEditFile("stamp", doc),
                            doc => handleDeleteFile("stamp", doc),
                            doc => handleViewFile("stamp", doc),
                            "Stamps",
                        )}
                    </TabsContent>

                    {/* Initials Tab */}
                    <TabsContent value="initials" className="space-y-6">
                        {renderFileDocumentTable(
                            initialDocuments,
                            initialSearch,
                            setInitialSearch,
                            () => handleAddFile("initial"),
                            doc => handleEditFile("initial", doc),
                            doc => handleDeleteFile("initial", doc),
                            doc => handleViewFile("initial", doc),
                            "Initials",
                        )}
                    </TabsContent>

                    {/* Templates Tab */}
                    <TabsContent value="templates" className="space-y-6">
                        <div className="flex justify-between items-center">
                            <div className="flex gap-4">
                                <div className="relative max-w-md">
                                    <Search
                                        className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${theme === "dark" ? "text-gray-400" : "text-slate-400"}`}
                                    />
                                    <Input
                                        placeholder="Search templates..."
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                        className={`pl-10 rounded-lg ${theme === "dark" ? "bg-black text-white border-gray-600 focus:border-amber-500 focus:ring-amber-500" : "border-slate-200 focus:border-amber-500 focus:ring-amber-500"}`}
                                    />
                                </div>
                                <Button
                                    onClick={() => setShowFilterModal(true)}
                                    variant="outline"
                                    className={
                                        theme === "dark"
                                            ? "border-gray-600 text-white hover:bg-gray-800"
                                            : "border-amber-200 text-amber-700 hover:bg-amber-50"
                                    }
                                >
                                    All Filters
                                </Button>
                            </div>
                            <Button
                                onClick={handleAddTemplate}
                                className={
                                    theme === "dark"
                                        ? "bg-white text-black hover:bg-gray-200"
                                        : "bg-amber-600 hover:bg-amber-700 text-white"
                                }
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Add Document Template
                            </Button>
                        </div>

                        <Card
                            className={`${theme === "dark" ? "bg-black border-gray-700" : "bg-white/80 border-0"} shadow-xl rounded-2xl overflow-hidden`}
                        >
                            <CardHeader
                                className={`${theme === "dark" ? "bg-black text-white" : "bg-amber-800 text-white"} p-6`}
                            >
                                <CardTitle className="flex items-center gap-4">
                                    <FileText className="h-8 w-8" />
                                    <div>
                                        <div className="text-2xl">Document Templates</div>
                                        <div
                                            className={`${theme === "dark" ? "text-gray-400" : "text-yellow-200"} text-sm font-normal`}
                                        >
                                            {filteredTemplates.length} total templates
                                        </div>
                                    </div>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <Table>
                                    <TableHeader>
                                        <TableRow
                                            className={
                                                theme === "dark"
                                                    ? "bg-black hover:bg-black"
                                                    : "bg-amber-800 hover:bg-amber-800"
                                            }
                                        >
                                            {selectedFields.includes("name") && (
                                                <TableHead
                                                    className={`${theme === "dark" ? "text-white" : "text-yellow-100"} font-semibold py-4 px-6`}
                                                >
                                                    Name
                                                </TableHead>
                                            )}
                                            {selectedFields.includes("subject") && (
                                                <TableHead
                                                    className={`${theme === "dark" ? "text-white" : "text-yellow-100"} font-semibold py-4 px-6`}
                                                >
                                                    Subject
                                                </TableHead>
                                            )}
                                            {selectedFields.includes("status") && (
                                                <TableHead
                                                    className={`${theme === "dark" ? "text-white" : "text-yellow-100"} font-semibold py-4 px-6`}
                                                >
                                                    Status
                                                </TableHead>
                                            )}
                                            {selectedFields.includes("visibility") && (
                                                <TableHead
                                                    className={`${theme === "dark" ? "text-white" : "text-yellow-100"} font-semibold py-4 px-6`}
                                                >
                                                    Visibility
                                                </TableHead>
                                            )}
                                            {selectedFields.includes("active") && (
                                                <TableHead
                                                    className={`${theme === "dark" ? "text-white" : "text-yellow-100"} font-semibold py-4 px-6`}
                                                >
                                                    Active
                                                </TableHead>
                                            )}
                                            <TableHead
                                                className={`${theme === "dark" ? "text-white" : "text-yellow-100"} font-semibold py-4 px-6 text-right`}
                                            >
                                                Actions
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredTemplates.map((template, index) => (
                                            <TableRow
                                                key={template.id}
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
                                                {selectedFields.includes("name") && (
                                                    <TableCell
                                                        className={`${theme === "dark" ? "text-white" : "text-slate-900"} px-6 font-medium`}
                                                    >
                                                        {template.name}
                                                    </TableCell>
                                                )}
                                                {selectedFields.includes("subject") && (
                                                    <TableCell
                                                        className={`${theme === "dark" ? "text-gray-300" : "text-slate-700"} px-6`}
                                                    >
                                                        {template.subject}
                                                    </TableCell>
                                                )}
                                                {selectedFields.includes("status") && (
                                                    <TableCell className="px-6">
                                                        <Badge
                                                            className={`rounded-lg px-3 py-1 ${template.status === "Published" ? (theme === "dark" ? "bg-green-900 text-green-300 border-green-700" : "bg-green-100 text-green-800 border-green-200") : theme === "dark" ? "bg-gray-700 text-gray-300 border-gray-600" : "bg-gray-100 text-gray-800 border-gray-200"}`}
                                                        >
                                                            {template.status}
                                                        </Badge>
                                                    </TableCell>
                                                )}
                                                {selectedFields.includes("visibility") && (
                                                    <TableCell className="px-6">
                                                        <Badge
                                                            className={`rounded-lg px-3 py-1 ${template.visibility === "Open" ? (theme === "dark" ? "bg-blue-900 text-blue-300 border-blue-700" : "bg-blue-100 text-blue-800 border-blue-200") : theme === "dark" ? "bg-orange-900 text-orange-300 border-orange-700" : "bg-orange-100 text-orange-800 border-orange-200"}`}
                                                        >
                                                            {template.visibility}
                                                        </Badge>
                                                    </TableCell>
                                                )}
                                                {selectedFields.includes("active") && (
                                                    <TableCell className="px-6">
                                                        <Badge
                                                            className={`rounded-lg px-3 py-1 ${template.active === "Yes" ? (theme === "dark" ? "bg-green-900 text-green-300 border-green-700" : "bg-green-100 text-green-800 border-green-200") : theme === "dark" ? "bg-red-900 text-red-300 border-red-700" : "bg-red-100 text-red-800 border-red-200"}`}
                                                        >
                                                            {template.active}
                                                        </Badge>
                                                    </TableCell>
                                                )}
                                                <TableCell className="px-6 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={e => {
                                                                e.stopPropagation();
                                                                handleViewTemplate(template);
                                                            }}
                                                            className={
                                                                theme === "dark"
                                                                    ? "border-gray-600 text-white hover:bg-gray-800"
                                                                    : "border-amber-200 text-amber-700 hover:bg-amber-50"
                                                            }
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={e => {
                                                                e.stopPropagation();
                                                                handleEditTemplate(template);
                                                            }}
                                                            className={
                                                                theme === "dark"
                                                                    ? "border-gray-600 text-white hover:bg-gray-800"
                                                                    : "border-amber-200 text-amber-700 hover:bg-amber-50"
                                                            }
                                                        >
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={e => {
                                                                e.stopPropagation();
                                                                handleDeleteTemplate(template.id!);
                                                            }}
                                                            className={
                                                                theme === "dark"
                                                                    ? "border-red-700 text-red-400 hover:bg-gray-800"
                                                                    : "border-red-200 text-red-700 hover:bg-red-50"
                                                            }
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Signature Workflows Tab */}
                    <TabsContent value="workflows" className="space-y-6">
                        <SignatureWorkflowTab
                            data={signatureWorkflows}
                            setData={async newData => {
                                // Handle Firestore operations for signature workflows
                                // Since the component manages its own state, we don't need to do anything here
                                // The component handles CRUD operations internally via API calls
                            }}
                        />
                    </TabsContent>
                </Tabs>

                {/* Filter Modal */}
                <Dialog open={showFilterModal} onOpenChange={setShowFilterModal}>
                    <DialogContent
                        className={`max-w-4xl max-h-[80vh] overflow-y-auto ${theme === "dark" ? "bg-gray-900 text-slate-200" : "bg-white text-slate-800"}`}
                    >
                        <DialogHeader>
                            <DialogTitle
                                className={`text-xl font-semibold ${theme === "dark" ? "text-amber-400" : "text-amber-900"}`}
                            >
                                Filter Document Templates
                            </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-6">
                            <div>
                                <Label
                                    className={`text-base font-medium mb-3 block ${theme === "dark" ? "text-slate-300" : "text-slate-700"}`}
                                >
                                    Select Fields to Display
                                </Label>
                                <div className="grid grid-cols-3 gap-3">
                                    {templateFields.map(field => (
                                        <div
                                            key={field.key}
                                            className="flex items-center space-x-2"
                                        >
                                            <Checkbox
                                                id={field.key}
                                                checked={selectedFields.includes(field.key)}
                                                onCheckedChange={() => handleFieldToggle(field.key)}
                                            />
                                            <Label
                                                htmlFor={field.key}
                                                className={`text-sm ${theme === "dark" ? "text-slate-300" : "text-slate-800"}`}
                                            >
                                                {field.label}
                                            </Label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <Label
                                    className={`text-base font-medium mb-3 block ${theme === "dark" ? "text-slate-300" : "text-slate-700"}`}
                                >
                                    Filter by Selected Fields
                                </Label>
                                <div className="grid grid-cols-2 gap-4">
                                    {templateFields
                                        .filter(field => selectedFields.includes(field.key))
                                        .map(field => (
                                            <div key={field.key}>
                                                <Label
                                                    className={`text-sm font-medium mb-1 block ${theme === "dark" ? "text-slate-400" : "text-slate-600"}`}
                                                >
                                                    {field.label}
                                                </Label>
                                                {field.type === "select" ? (
                                                    <Select
                                                        value={filters[field.key] || "all"}
                                                        onValueChange={value =>
                                                            setFilters(prev => ({
                                                                ...prev,
                                                                [field.key]:
                                                                    value === "all" ? "" : value,
                                                            }))
                                                        }
                                                    >
                                                        <SelectTrigger
                                                            className={
                                                                theme === "dark"
                                                                    ? "bg-gray-800 border-slate-700 text-slate-200"
                                                                    : "bg-white border-slate-300 text-slate-800"
                                                            }
                                                        >
                                                            <SelectValue
                                                                placeholder={`Filter by ${field.label}`}
                                                            />
                                                        </SelectTrigger>
                                                        <SelectContent
                                                            className={
                                                                theme === "dark"
                                                                    ? "bg-gray-800 text-slate-200"
                                                                    : "bg-white text-slate-800"
                                                            }
                                                        >
                                                            <SelectItem value="all">All</SelectItem>
                                                            {field.options?.map(option => (
                                                                <SelectItem
                                                                    key={option}
                                                                    value={option}
                                                                >
                                                                    {option}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                ) : (
                                                    <Input
                                                        type={field.type}
                                                        placeholder={`Filter by ${field.label}`}
                                                        value={filters[field.key] || ""}
                                                        onChange={e =>
                                                            setFilters(prev => ({
                                                                ...prev,
                                                                [field.key]: e.target.value,
                                                            }))
                                                        }
                                                        className={
                                                            theme === "dark"
                                                                ? "bg-gray-800 border-slate-700 text-slate-200 placeholder-slate-400"
                                                                : "bg-white border-slate-300 text-slate-800 placeholder-slate-500"
                                                        }
                                                    />
                                                )}
                                            </div>
                                        ))}
                                </div>
                            </div>
                            <div
                                className={`flex justify-end gap-3 pt-4 border-t ${theme === "dark" ? "border-slate-700" : "border-slate-200"}`}
                            >
                                <Button
                                    variant="outline"
                                    onClick={handleClearFilters}
                                    className={
                                        theme === "dark"
                                            ? "border-slate-700 text-slate-300 hover:bg-slate-800"
                                            : "border-slate-200 text-slate-600 hover:bg-slate-50"
                                    }
                                >
                                    Clear Filters
                                </Button>
                                <Button
                                    onClick={handleApplyFilters}
                                    className={
                                        theme === "dark"
                                            ? "bg-amber-500 hover:bg-amber-600 text-black"
                                            : "bg-amber-600 hover:bg-amber-700 text-white"
                                    }
                                >
                                    Apply Filters
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* Template Modal */}
                <TemplateModal
                    open={showTemplateModal}
                    onOpenChange={setShowTemplateModal}
                    editingTemplate={editingTemplate}
                    templateForm={templateForm}
                    setTemplateForm={setTemplateForm}
                    openSection={openSection}
                    setOpenSection={setOpenSection}
                    addSection={addSection}
                    removeSection={removeSection}
                    handleSaveTemplate={handleSaveTemplate}
                    headerDocuments={headerDocuments}
                    footerDocuments={footerDocuments}
                    signatureDocuments={signatureDocuments}
                    stampDocuments={stampDocuments}
                    initialDocuments={initialDocuments}
                    signatureWorkflows={signatureWorkflows}
                />

                {/* View Template Dialog */}
                <ViewTemplateDialog
                    open={showViewTemplate}
                    onOpenChange={setShowViewTemplate}
                    template={selectedTemplate}
                    headerDocuments={headerDocuments}
                    footerDocuments={footerDocuments}
                    signatureDocuments={signatureDocuments}
                    stampDocuments={stampDocuments}
                    initialDocuments={initialDocuments}
                />

                {/* External Documents Dialogs */}
                <CreateExternalDocumentDialog
                    open={showCreateExternal}
                    onOpenChange={setShowCreateExternal}
                    onSuccess={handleRefresh}
                    userId={currentUserId}
                />
                <EditExternalDocumentDialog
                    open={showEditExternal}
                    onOpenChange={setShowEditExternal}
                    document={selectedExternalDoc}
                    onSuccess={handleRefresh}
                    userId={currentUserId}
                />
                <DeleteExternalDocumentDialog
                    open={showDeleteExternal}
                    onOpenChange={setShowDeleteExternal}
                    document={selectedExternalDoc}
                    onSuccess={handleRefresh}
                    userId={currentUserId}
                />
                <ViewExternalDocumentDialog
                    open={showViewExternal}
                    onOpenChange={setShowViewExternal}
                    document={selectedExternalDoc}
                />

                {/* Generic File Document Dialogs */}
                <CreateFileDocumentDialog
                    open={showCreateFile}
                    onOpenChange={setShowCreateFile}
                    documentType={currentFileTab}
                    onSuccess={handleRefresh}
                    userId={currentUserId}
                />
                <EditFileDocumentDialog
                    open={showEditFile}
                    onOpenChange={setShowEditFile}
                    documentType={currentFileTab}
                    document={selectedFileDoc}
                    onSuccess={handleRefresh}
                    userId={currentUserId}
                />
                <DeleteFileDocumentDialog
                    open={showDeleteFile}
                    onOpenChange={setShowDeleteFile}
                    documentType={currentFileTab}
                    document={selectedFileDoc}
                    onSuccess={handleRefresh}
                    userId={currentUserId}
                />
                <ViewFileDocumentDialog
                    open={showViewFile}
                    onOpenChange={setShowViewFile}
                    documentType={currentFileTab}
                    document={selectedFileDoc}
                />
            </div>
            {ConfirmDialog}
        </div>
    );
}
