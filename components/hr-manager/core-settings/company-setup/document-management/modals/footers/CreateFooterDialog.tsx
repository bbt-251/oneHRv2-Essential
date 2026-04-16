"use client";

import React, { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme-provider";
import {
    createFileDocument,
    validateFile,
} from "@/lib/backend/api/hr-settings/file-document-service";
import { useToast } from "@/context/toastContext";
import { Upload, X } from "lucide-react";
import { getUTCTimestamp } from "@/lib/util/dayjs_format";

interface CreateFooterDialogProps {
    open: boolean;
    onOpenChange: (value: boolean) => void;
    onSuccess?: () => void;
}

const CreateFooterDialog: React.FC<CreateFooterDialogProps> = ({
    open,
    onOpenChange,
    onSuccess,
}) => {
    const { theme } = useTheme();
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        type: "",
        active: true,
        timestamp: getUTCTimestamp(),
    });
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
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
    };

    const handleRemoveFile = () => {
        setSelectedFile(null);
        setPreviewUrl(null);
        setFileError(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleSubmit = async () => {
        if (!formData.name.trim() || !formData.type.trim()) {
            showToast("Please fill in all required fields", "Error", "error");
            return;
        }

        if (!selectedFile) {
            showToast("Please upload an image", "Error", "error");
            return;
        }

        setLoading(true);
        try {
            const result = await createFileDocument(
                "footer",
                {
                    name: formData.name,
                    active: formData.active,
                    timestamp: formData.timestamp,
                },
                selectedFile,
            );

            if (result) {
                showToast("Footer created successfully", "Success", "success");
                setFormData({
                    name: "",
                    type: "",
                    active: true,
                    timestamp: getUTCTimestamp(),
                });
                handleRemoveFile();
                onOpenChange(false);
                onSuccess?.();
            } else {
                showToast("Error creating footer", "Error", "error");
            }
        } catch (error) {
            console.error("Error creating footer:", error);
            showToast("Error creating footer", "Error", "error");
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        if (!open) {
            handleRemoveFile();
            setFormData({
                name: "",
                type: "",
                active: true,
                timestamp: getUTCTimestamp(),
            });
        }
    }, [open]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className={`max-w-md rounded-2xl border shadow-2xl ${
                    theme === "dark" ? "bg-black border-gray-800" : "bg-white border-gray-200"
                }`}
            >
                <DialogHeader>
                    <DialogTitle
                        className={`${theme === "dark" ? "text-white" : "text-slate-900"} text-xl font-semibold`}
                    >
                        Create Footer
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
                            placeholder="Enter footer name"
                            className={
                                theme === "dark"
                                    ? "bg-gray-900 border-gray-700 text-white placeholder-gray-500"
                                    : "bg-white border-gray-300 text-black placeholder-gray-400"
                            }
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className={theme === "dark" ? "text-gray-300" : "text-slate-700"}>
                            Type *
                        </Label>
                        <Input
                            value={formData.type}
                            onChange={e => setFormData({ ...formData, type: e.target.value })}
                            placeholder="Enter footer type"
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
                            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                                theme === "dark"
                                    ? "border-gray-700 hover:border-gray-600"
                                    : "border-gray-300 hover:border-amber-500"
                            }`}
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

export default CreateFooterDialog;
