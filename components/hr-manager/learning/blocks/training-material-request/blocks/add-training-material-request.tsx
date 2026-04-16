"use client";
import { useEffect, useState } from "react";
import type React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TrainingMaterialRequestModel, attachmentModel } from "@/lib/models/training-material";
import { useAuth } from "@/context/authContext";
import { useToast } from "@/context/toastContext";
import uploadFile from "@/lib/backend/firebase/upload/uploadFile";
import { TrainingMaterialRequestForm } from "../../form/training-material-request-form";

interface AddTrainingMaterialRequestProps {
    isModalOpen: boolean;
    setIsModalOpen: (isOpen: boolean) => void;
    selectedRequest: TrainingMaterialRequestModel | null;
    handleCreate: (newRequest: Omit<TrainingMaterialRequestModel, "id">) => Promise<boolean>;
    handleUpdate: (updatedRequest: TrainingMaterialRequestModel) => void;
}

export function AddTrainingMaterialRequest({
    isModalOpen,
    setIsModalOpen,
    selectedRequest,
    handleCreate,
    handleUpdate,
}: AddTrainingMaterialRequestProps) {
    const { user } = useAuth();
    const { showToast } = useToast();
    const [formData, setFormData] = useState<Partial<TrainingMaterialRequestModel>>({});
    const [currentStep, setCurrentStep] = useState<number>(1);
    const [attachments, setAttachments] = useState<File[]>([]);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

    const isEditMode = !!selectedRequest;

    const resetForm = () => {
        setFormData({
            createdBy: "",
            name: "",
            category: [],
            format: "Audio",
            isDownloadable: false,
            url: "",
            isExternalLink: false,
            length: "",
            complexity: "",
            startDate: "",
            endDate: "",
            publishState: false,
            audienceTarget: [],
            employees: [],
            departments: [],
            sections: [],
            locations: [],
            grades: [],
            requirementLevel: "Optional",
            targetedCompetencies: [],
            relatedPositions: [],
            outputValue: "",
            attachments: [],
            certificationTitle: "",
            availability: 0,
            medium: "Virtual",
            trainingCost: "Free",
            status: "N/A",
            approvalStatus: "Awaiting Manager Approval",
            assignedEmployees: [],
            notes: "",
        });
        setCurrentStep(1);
        setAttachments([]);
    };

    useEffect(() => {
        if (selectedRequest) {
            setFormData(selectedRequest);
        } else {
            resetForm(); // Reset if opening for creation
        }
    }, [selectedRequest, isModalOpen]);

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            const newUploadedAttachments: attachmentModel[] = await Promise.all(
                attachments.map(async file => {
                    const downloadUrl = await uploadFile(file, "training-attachments");
                    if (!downloadUrl) {
                        throw new Error(`Failed to upload ${file.name}`);
                    }
                    return {
                        attachmentTitle: file.name,
                        attachmentFormat: file.type,
                        attachmentUrl: downloadUrl,
                    };
                }),
            );

            const existingAttachments = formData.attachments || [];
            const allAttachments = [...existingAttachments, ...newUploadedAttachments];

            if (isEditMode && selectedRequest) {
                // Update Logic
                const updatedRequest = {
                    ...formData,
                    id: selectedRequest.id,
                    attachments: allAttachments,
                } as TrainingMaterialRequestModel;
                await handleUpdate(updatedRequest);
                showToast("Request updated successfully", "success", "success");
            } else {
                // Create Logic
                const newRequest: Omit<TrainingMaterialRequestModel, "id"> = {
                    createdBy: user?.uid || "",
                    timestamp: new Date().toISOString(),
                    name: formData.name || "",
                    category: formData.category || [],
                    format: formData.format || "Audio",
                    isDownloadable: formData.isDownloadable || false,
                    url: formData.url || "",
                    isExternalLink: formData.isExternalLink || false,
                    length: formData.length || "",
                    complexity: formData.complexity || "Medium",
                    startDate: formData.startDate || new Date().toISOString(),
                    endDate: formData.endDate || new Date().toISOString(),
                    publishState: formData.publishState || false,
                    audienceTarget: formData.audienceTarget || [],
                    employees: formData.employees || [],
                    departments: formData.departments || [],
                    sections: formData.sections || [],
                    locations: formData.locations || [],
                    grades: formData.grades || [],
                    requirementLevel: formData.requirementLevel || "Optional",
                    targetedCompetencies: formData.targetedCompetencies || [],
                    relatedPositions: formData.relatedPositions || [],
                    outputValue: formData.outputValue || "",
                    associatedQuiz: formData.associatedQuiz || [],
                    attachments: allAttachments,
                    relatedTrainingMaterialRequest: null,
                    certificationTitle: formData.certificationTitle || "",
                    availability: formData.availability || 0,
                    employeeFeedbacks: [],
                    medium: formData.medium || "Virtual",
                    trainingCost: formData.trainingCost || "Free",
                    trainingOutcome: formData.trainingOutcome || [],
                    trainingJustification: formData.trainingJustification || "",
                    status: "N/A",
                    approvalStatus: "Awaiting Manager Approval",
                    assignedEmployees: [],
                    sentSurveyIDs: [],
                    notes: formData.notes || "",
                };
                const success = await handleCreate(newRequest);
                if (!success) {
                    throw new Error("Failed to create request");
                }
                showToast("Request created successfully", "success", "success");
            }
            setIsModalOpen(false);
        } catch (error) {
            const errorMessage =
                error instanceof Error ? error.message : "An unexpected error occurred";
            showToast(errorMessage, "error", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="max-w-4xl">
                    <DialogHeader>
                        <DialogTitle>
                            {isEditMode ? "Edit" : "Create"} Training Material Request
                        </DialogTitle>
                    </DialogHeader>
                    <TrainingMaterialRequestForm
                        isEdit={isEditMode}
                        currentStep={currentStep}
                        setCurrentStep={setCurrentStep}
                        formData={formData}
                        setFormData={setFormData}
                        attachments={attachments}
                        setAttachments={setAttachments}
                        onSubmit={handleSubmit}
                        isSubmitting={isSubmitting}
                        resetForm={resetForm}
                        setIsModalOpen={setIsModalOpen}
                    />
                </DialogContent>
            </Dialog>
        </>
    );
}
