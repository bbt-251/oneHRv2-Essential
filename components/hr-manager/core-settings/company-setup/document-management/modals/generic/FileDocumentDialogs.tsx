"use client";

import React, { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme-provider";
import {
    createFileDocument,
    updateFileDocument,
    deleteFileDocument,
    validateFile,
    FileDocumentType,
} from "@/lib/backend/api/hr-settings/file-document-service";
import { useToast } from "@/context/toastContext";
import { FileDocumentModel } from "@/lib/models/file-document";
import { Upload, X, AlertTriangle } from "lucide-react";
import { getUTCTimestamp } from "@/lib/util/dayjs_format";

// Dialog mode type
export type DialogMode = "create" | "edit" | "delete" | "view";

// Common props for all dialogs
interface BaseDialogProps {
    open: boolean;
    onOpenChange: (value: boolean) => void;
    onSuccess?: () => void;
    userId?: string;
}

interface FileDocumentDialogsProps extends BaseDialogProps {
    mode: DialogMode;
    documentType: FileDocumentType;
    document: FileDocumentModel | null;
}

// Initial form state - only name and active (no type)
const getInitialFormState = () => ({
    name: "",
    active: true,
    timestamp: getUTCTimestamp(),
});

// Create Dialog Component
export const CreateFileDocumentDialog: React.FC<
    BaseDialogProps & { documentType: FileDocumentType }
> = ({ open, onOpenChange, onSuccess, documentType, userId }) => {
    const { theme } = useTheme();
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState(getInitialFormState());
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [fileError, setFileError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const validation = validateFile(file);
        if (!validation.valid) {
            setFileError(validation.error || "Invalid file");
            setSelectedFile(null);
            setPreviewUrl(null);
            return;
        }

        setFileError(null);
        setSelectedFile(file);
        setPreviewUrl(URL.createObjectURL(file));
    };

    const handleRemoveFile = () => {
        setSelectedFile(null);
        setPreviewUrl(null);
        setFileError(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleSubmit = async () => {
        if (!formData.name.trim()) {
            showToast("Please enter a name", "Error", "error");
            return;
        }

        if (!selectedFile) {
            showToast("Please upload an image", "Error", "error");
            return;
        }

        setLoading(true);
        try {
            const result = await createFileDocument(
                documentType,
                {
                    name: formData.name,
                    active: formData.active,
                    timestamp: formData.timestamp,
                },
                selectedFile,
                userId,
            );

            if (result) {
                showToast(
                    `${getTypeLabel(documentType)} created successfully`,
                    "Success",
                    "success",
                );
                setFormData(getInitialFormState());
                handleRemoveFile();
                onOpenChange(false);
                onSuccess?.();
            } else {
                showToast(
                    `Error creating ${getTypeLabel(documentType).toLowerCase()}`,
                    "Error",
                    "error",
                );
            }
        } catch (error) {
            console.error("Error creating document:", error);
            showToast(
                `Error creating ${getTypeLabel(documentType).toLowerCase()}`,
                "Error",
                "error",
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!open) {
            handleRemoveFile();
            setFormData(getInitialFormState());
        }
    }, [open]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className={`max-w-md rounded-2xl border shadow-2xl ${theme === "dark" ? "bg-black border-gray-800" : "bg-white border-gray-200"}`}
            >
                <DialogHeader>
                    <DialogTitle
                        className={`${theme === "dark" ? "text-white" : "text-slate-900"} text-xl font-semibold`}
                    >
                        Create {getTypeLabel(documentType)}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label className={theme === "dark" ? "text-gray-300" : "text-slate-700"}>
                            Name *
                        </Label>
                        <Input
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            placeholder={`Enter ${getTypeLabel(documentType).toLowerCase()} name`}
                            className={
                                theme === "dark"
                                    ? "bg-gray-900 border-gray-700 text-white placeholder-gray-500"
                                    : "bg-white border-gray-300 text-black placeholder-gray-400"
                            }
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className={theme === "dark" ? "text-gray-300" : "text-slate-700"}>
                            Image * (Max 5MB, image only)
                        </Label>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
                            className="hidden"
                        />
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${theme === "dark" ? "border-gray-700 hover:border-gray-600" : "border-gray-300 hover:border-amber-500"}`}
                        >
                            {previewUrl ? (
                                <div className="relative">
                                    <img
                                        src={previewUrl}
                                        alt="Preview"
                                        className="max-h-40 mx-auto rounded-lg"
                                    />
                                    <button
                                        onClick={e => {
                                            e.stopPropagation();
                                            handleRemoveFile();
                                        }}
                                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <Upload
                                        className={`h-8 w-8 mx-auto ${theme === "dark" ? "text-gray-400" : "text-slate-400"}`}
                                    />
                                    <p
                                        className={
                                            theme === "dark" ? "text-gray-400" : "text-slate-600"
                                        }
                                    >
                                        Click to upload an image
                                    </p>
                                    <p
                                        className={`text-xs ${theme === "dark" ? "text-gray-500" : "text-slate-400"}`}
                                    >
                                        JPEG, PNG, GIF, WebP, SVG (Max 5MB)
                                    </p>
                                </div>
                            )}
                        </div>
                        {fileError && <p className="text-red-500 text-sm">{fileError}</p>}
                    </div>

                    <div className="flex items-center justify-between">
                        <Label className={theme === "dark" ? "text-gray-300" : "text-slate-700"}>
                            Active
                        </Label>
                        <Switch
                            checked={formData.active}
                            onCheckedChange={checked =>
                                setFormData({ ...formData, active: checked })
                            }
                            className={`${
                                formData.active
                                    ? "bg-amber-600"
                                    : theme === "dark"
                                        ? "bg-gray-700"
                                        : "bg-gray-300"
                            } ${theme === "dark" ? "data-[unchecked]:bg-gray-700" : "data-[unchecked]:bg-gray-300"}`}
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        className={
                            theme === "dark"
                                ? "border-gray-600 text-gray-300 hover:bg-gray-800"
                                : "border-gray-300 text-slate-700 hover:bg-gray-100"
                        }
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={loading}
                        className={
                            theme === "dark"
                                ? "bg-amber-600 hover:bg-amber-700 text-white"
                                : "bg-amber-600 hover:bg-amber-700 text-white"
                        }
                    >
                        {loading ? "Creating..." : "Create"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};

// Edit Dialog Component
export const EditFileDocumentDialog: React.FC<
    BaseDialogProps & { document: FileDocumentModel | null; documentType: FileDocumentType }
> = ({ open, onOpenChange, onSuccess, document, documentType, userId }) => {
    const { theme } = useTheme();
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({ name: "", active: true });
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [fileError, setFileError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (document) {
            setFormData({ name: document.name || "", active: document.active ?? true });
            setPreviewUrl(document.fileUrl || null);
        }
    }, [document]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const validation = validateFile(file);
        if (!validation.valid) {
            setFileError(validation.error || "Invalid file");
            setSelectedFile(null);
            setPreviewUrl(null);
            return;
        }

        setFileError(null);
        setSelectedFile(file);
        setPreviewUrl(URL.createObjectURL(file));
    };

    const handleRemoveFile = () => {
        setSelectedFile(null);
        setPreviewUrl(document?.fileUrl || null);
        setFileError(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleSubmit = async () => {
        if (!formData.name.trim()) {
            showToast("Please enter a name", "Error", "error");
            return;
        }

        if (!document?.id) {
            showToast("Document ID is missing", "Error", "error");
            return;
        }

        setLoading(true);
        try {
            const result = await updateFileDocument(
                documentType,
                { id: document.id, ...formData },
                selectedFile || undefined,
                userId,
            );

            if (result) {
                showToast(
                    `${getTypeLabel(documentType)} updated successfully`,
                    "Success",
                    "success",
                );
                onOpenChange(false);
                onSuccess?.();
            } else {
                showToast(
                    `Error updating ${getTypeLabel(documentType).toLowerCase()}`,
                    "Error",
                    "error",
                );
            }
        } catch (error) {
            console.error("Error updating document:", error);
            showToast(
                `Error updating ${getTypeLabel(documentType).toLowerCase()}`,
                "Error",
                "error",
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className={`max-w-md rounded-2xl border shadow-2xl ${theme === "dark" ? "bg-black border-gray-800" : "bg-white border-gray-200"}`}
            >
                <DialogHeader>
                    <DialogTitle
                        className={`${theme === "dark" ? "text-white" : "text-slate-900"} text-xl font-semibold`}
                    >
                        Edit {getTypeLabel(documentType)}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label className={theme === "dark" ? "text-gray-300" : "text-slate-700"}>
                            Name *
                        </Label>
                        <Input
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            placeholder={`Enter ${getTypeLabel(documentType).toLowerCase()} name`}
                            className={
                                theme === "dark"
                                    ? "bg-gray-900 border-gray-700 text-white placeholder-gray-500"
                                    : "bg-white border-gray-300 text-black placeholder-gray-400"
                            }
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className={theme === "dark" ? "text-gray-300" : "text-slate-700"}>
                            Image {selectedFile ? "(New)" : ""} (Max 5MB)
                        </Label>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
                            className="hidden"
                        />
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${theme === "dark" ? "border-gray-700 hover:border-gray-600" : "border-gray-300 hover:border-amber-500"}`}
                        >
                            {previewUrl ? (
                                <div className="relative">
                                    <img
                                        src={previewUrl}
                                        alt="Preview"
                                        className="max-h-40 mx-auto rounded-lg"
                                    />
                                    <button
                                        onClick={e => {
                                            e.stopPropagation();
                                            handleRemoveFile();
                                        }}
                                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <Upload
                                        className={`h-8 w-8 mx-auto ${theme === "dark" ? "text-gray-400" : "text-slate-400"}`}
                                    />
                                    <p
                                        className={
                                            theme === "dark" ? "text-gray-400" : "text-slate-600"
                                        }
                                    >
                                        Click to upload a new image
                                    </p>
                                </div>
                            )}
                        </div>
                        {fileError && <p className="text-red-500 text-sm">{fileError}</p>}
                    </div>

                    <div className="flex items-center justify-between">
                        <Label className={theme === "dark" ? "text-gray-300" : "text-slate-700"}>
                            Active
                        </Label>
                        <Switch
                            checked={formData.active}
                            onCheckedChange={checked =>
                                setFormData({ ...formData, active: checked })
                            }
                            className={`${
                                formData.active
                                    ? "bg-amber-600"
                                    : theme === "dark"
                                        ? "bg-gray-700"
                                        : "bg-gray-300"
                            } ${theme === "dark" ? "data-[unchecked]:bg-gray-700" : "data-[unchecked]:bg-gray-300"}`}
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        className={
                            theme === "dark"
                                ? "border-gray-600 text-gray-300 hover:bg-gray-800"
                                : "border-gray-300 text-slate-700 hover:bg-gray-100"
                        }
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={loading}
                        className={
                            theme === "dark"
                                ? "bg-amber-600 hover:bg-amber-700 text-white"
                                : "bg-amber-600 hover:bg-amber-700 text-white"
                        }
                    >
                        {loading ? "Updating..." : "Update"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};

// Delete Dialog Component
export const DeleteFileDocumentDialog: React.FC<
    BaseDialogProps & { document: FileDocumentModel | null; documentType: FileDocumentType }
> = ({ open, onOpenChange, onSuccess, document, documentType, userId }) => {
    const { theme } = useTheme();
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);

    const handleDelete = async () => {
        if (!document?.id) {
            showToast("Document ID is missing", "Error", "error");
            return;
        }

        setLoading(true);
        try {
            const result = await deleteFileDocument(documentType, document.id, userId);

            if (result) {
                showToast(
                    `${getTypeLabel(documentType)} deleted successfully`,
                    "Success",
                    "success",
                );
                onOpenChange(false);
                onSuccess?.();
            } else {
                showToast(
                    `Error deleting ${getTypeLabel(documentType).toLowerCase()}`,
                    "Error",
                    "error",
                );
            }
        } catch (error) {
            console.error("Error deleting document:", error);
            showToast(
                `Error deleting ${getTypeLabel(documentType).toLowerCase()}`,
                "Error",
                "error",
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className={`max-w-md rounded-2xl border shadow-2xl ${theme === "dark" ? "bg-black border-gray-800" : "bg-white border-gray-200"}`}
            >
                <DialogHeader>
                    <DialogTitle
                        className={`${theme === "dark" ? "text-white" : "text-slate-900"} text-xl font-semibold`}
                    >
                        Delete {getTypeLabel(documentType)}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="flex items-center gap-3 p-4 rounded-lg bg-red-50 dark:bg-red-900/20">
                        <AlertTriangle className="h-6 w-6 text-red-500" />
                        <p className={theme === "dark" ? "text-gray-300" : "text-slate-700"}>
                            Are you sure you want to delete <strong>{document?.name}</strong>? This
                            action cannot be undone.
                        </p>
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        className={
                            theme === "dark"
                                ? "border-gray-600 text-gray-300 hover:bg-gray-800"
                                : "border-gray-300 text-slate-700 hover:bg-gray-100"
                        }
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleDelete}
                        disabled={loading}
                        className="bg-red-600 hover:bg-red-700 text-white"
                    >
                        {loading ? "Deleting..." : "Delete"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};

// View Dialog Component
export const ViewFileDocumentDialog: React.FC<
    BaseDialogProps & { document: FileDocumentModel | null; documentType: FileDocumentType }
> = ({ open, onOpenChange, document, documentType }) => {
    const { theme } = useTheme();

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className={`max-w-lg rounded-2xl border shadow-2xl ${theme === "dark" ? "bg-black border-gray-800" : "bg-white border-gray-200"}`}
            >
                <DialogHeader>
                    <DialogTitle
                        className={`${theme === "dark" ? "text-white" : "text-slate-900"} text-xl font-semibold`}
                    >
                        View {getTypeLabel(documentType)}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    {document?.fileUrl && (
                        <div className="flex justify-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <img
                                src={document.fileUrl}
                                alt={document.name || getTypeLabel(documentType)}
                                className="max-h-48 rounded-lg object-contain"
                            />
                        </div>
                    )}

                    <div className="space-y-3">
                        <div className="flex justify-between items-center p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                            <Label
                                className={theme === "dark" ? "text-gray-400" : "text-slate-600"}
                            >
                                Name
                            </Label>
                            <span
                                className={`font-medium ${theme === "dark" ? "text-white" : "text-slate-900"}`}
                            >
                                {document?.name || "-"}
                            </span>
                        </div>

                        <div className="flex justify-between items-center p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                            <Label
                                className={theme === "dark" ? "text-gray-400" : "text-slate-600"}
                            >
                                File Type
                            </Label>
                            <span
                                className={`font-medium ${theme === "dark" ? "text-white" : "text-slate-900"}`}
                            >
                                {document?.fileType || "-"}
                            </span>
                        </div>

                        <div className="flex justify-between items-center p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                            <Label
                                className={theme === "dark" ? "text-gray-400" : "text-slate-600"}
                            >
                                Status
                            </Label>
                            <div className="flex items-center gap-2">
                                {document?.active ? (
                                    <>
                                        <span className="text-green-500 font-medium">Active</span>
                                    </>
                                ) : (
                                    <>
                                        <span className="text-red-500 font-medium">Inactive</span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end pt-4">
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

// Helper function to get label based on document type
function getTypeLabel(type: FileDocumentType): string {
    const labels: Record<FileDocumentType, string> = {
        header: "Header",
        footer: "Footer",
        signature: "Signature",
        stamp: "Stamp",
        initial: "Initial",
    };
    return labels[type];
}

export default {
    CreateFileDocumentDialog,
    EditFileDocumentDialog,
    DeleteFileDocumentDialog,
    ViewFileDocumentDialog,
};
