"use client";
import type React from "react";
import { FileText, Link as LinkIcon, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { attachmentModel, TrainingMaterialRequestModel } from "@/lib/models/training-material";

interface TrainingMaterialStep3Props {
    existingAttachments: attachmentModel[];
    newAttachments: File[];
    handleFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
    removeNewAttachment: (index: number) => void;
    removeExistingAttachment: (index: number) => void;
    formData: Partial<TrainingMaterialRequestModel>;
    setFormData: (formData: Partial<TrainingMaterialRequestModel>) => void;
}

export function TrainingMaterialStep3({
    existingAttachments,
    newAttachments,
    handleFileUpload,
    removeNewAttachment,
    removeExistingAttachment,
    formData,
    setFormData,
}: TrainingMaterialStep3Props) {
    return (
        <div className="space-y-6">
            <div className="space-y-4">
                <Label>Attachments Upload</Label>
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6">
                    <div className="text-center">
                        <Upload className="mx-auto h-12 w-12 text-gray-400" />
                        <div className="mt-4">
                            <label htmlFor="file-upload" className="cursor-pointer">
                                <span className="mt-2 block text-sm font-medium text-gray-900 dark:text-gray-100">
                                    Drop files here or click to upload
                                </span>
                                <input
                                    id="file-upload"
                                    name="file-upload"
                                    type="file"
                                    multiple
                                    className="sr-only"
                                    onChange={handleFileUpload}
                                />
                            </label>
                            <p className="mt-1 text-xs text-gray-500">
                                PNG, JPG, PDF up to 10MB each
                            </p>
                        </div>
                    </div>
                </div>

                {existingAttachments.length > 0 && (
                    <div className="space-y-2 pt-4">
                        <Label>Current Attachments</Label>
                        <div className="space-y-2">
                            {existingAttachments.map((att, index) => (
                                <div
                                    key={`existing-${index}`}
                                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                                >
                                    <div className="flex min-w-0 items-center space-x-3">
                                        <LinkIcon className="h-5 w-5 flex-shrink-0 text-gray-500" />
                                        <div className="min-w-0">
                                            <a
                                                href={att.attachmentUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-sm font-medium text-brand-600 hover:underline dark:text-brand-400 truncate"
                                                title={att.attachmentTitle}
                                            >
                                                {att.attachmentTitle}
                                            </a>
                                            <p className="text-xs text-gray-500">
                                                {att.attachmentFormat}
                                            </p>
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => removeExistingAttachment(index)}
                                        className="text-red-500 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900/50 h-8 w-8"
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Display Newly Added Attachments */}
                {newAttachments.length > 0 && (
                    <div className="space-y-2 pt-4">
                        <Label>New Attachments to Upload</Label>
                        <div className="space-y-2">
                            {newAttachments.map((file, index) => (
                                <div
                                    key={`new-${index}`}
                                    className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg"
                                >
                                    <div className="flex min-w-0 items-center space-x-3">
                                        <FileText className="h-5 w-5 flex-shrink-0 text-gray-500" />
                                        <div className="min-w-0">
                                            <p
                                                className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate"
                                                title={file.name}
                                            >
                                                {file.name}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {(file.size / 1024 / 1024).toFixed(2)} MB
                                            </p>
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => removeNewAttachment(index)}
                                        className="text-red-500 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900/50 h-8 w-8"
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <div className="space-y-4">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                    id="notes"
                    placeholder="Add any additional notes related to the training material..."
                    value={formData.notes || ""}
                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                    rows={4}
                />
            </div>
        </div>
    );
}
