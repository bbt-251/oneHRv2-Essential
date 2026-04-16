"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme-provider";
import { updateExternalDocument } from "@/lib/backend/api/hr-settings/external-document-service";
import { useToast } from "@/context/toastContext";
import { ExternalDocumentModel } from "@/lib/models/external-document";

interface EditExternalDocumentDialogProps {
    open: boolean;
    onOpenChange: (value: boolean) => void;
    document: ExternalDocumentModel | null;
    onSuccess?: () => void;
    userId?: string;
}

const EditExternalDocumentDialog: React.FC<EditExternalDocumentDialogProps> = ({
    open,
    onOpenChange,
    document,
    onSuccess,
    userId,
}) => {
    const { theme } = useTheme();
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        type: "",
        active: true,
    });

    React.useEffect(() => {
        if (document) {
            setFormData({
                name: document.name || "",
                type: document.type || "",
                active: document.active ?? true,
            });
        }
    }, [document]);

    const handleSubmit = async () => {
        if (!formData.name.trim() || !formData.type.trim()) {
            showToast("Please fill in all required fields", "Error", "error");
            return;
        }

        if (!document?.id) {
            showToast("Document ID is missing", "Error", "error");
            return;
        }

        setLoading(true);
        try {
            const result = await updateExternalDocument(
                {
                    id: document.id,
                    name: formData.name,
                    type: formData.type,
                    active: formData.active,
                },
                userId,
            );

            if (result) {
                showToast("External document updated successfully", "Success", "success");
                onOpenChange(false);
                onSuccess?.();
            } else {
                showToast("Error updating external document", "Error", "error");
            }
        } catch (error) {
            console.error("Error updating external document:", error);
            showToast("Error updating external document", "Error", "error");
        } finally {
            setLoading(false);
        }
    };

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
                        Edit External Document
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
                            placeholder="Enter document name"
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
                            placeholder="Enter document type"
                            className={
                                theme === "dark"
                                    ? "bg-gray-900 border-gray-700 text-white placeholder-gray-500"
                                    : "bg-white border-gray-300 text-black placeholder-gray-400"
                            }
                        />
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

export default EditExternalDocumentDialog;
