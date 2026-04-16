"use client";

import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme-provider";
import { ExternalDocumentModel } from "@/lib/models/external-document";
import { FileText, CheckCircle, XCircle } from "lucide-react";

interface ViewExternalDocumentDialogProps {
    open: boolean;
    onOpenChange: (value: boolean) => void;
    document: ExternalDocumentModel | null;
}

const ViewExternalDocumentDialog: React.FC<ViewExternalDocumentDialogProps> = ({
    open,
    onOpenChange,
    document,
}) => {
    const { theme } = useTheme();

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
                        View External Document
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="flex items-center justify-center p-6">
                        <div
                            className={`p-4 rounded-full ${theme === "dark" ? "bg-gray-800" : "bg-amber-100"}`}
                        >
                            <FileText
                                className={`h-12 w-12 ${theme === "dark" ? "text-amber-400" : "text-amber-600"}`}
                            />
                        </div>
                    </div>

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
                                Type
                            </Label>
                            <span
                                className={`font-medium ${theme === "dark" ? "text-white" : "text-slate-900"}`}
                            >
                                {document?.type || "-"}
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
                                        <CheckCircle className="h-4 w-4 text-green-500" />
                                        <span className="text-green-500 font-medium">Active</span>
                                    </>
                                ) : (
                                    <>
                                        <XCircle className="h-4 w-4 text-red-500" />
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

export default ViewExternalDocumentDialog;
