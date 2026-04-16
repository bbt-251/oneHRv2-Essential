"use client";
import type React from "react";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { TrainingMaterialRequestModel } from "@/lib/models/training-material";

import { useFirestore } from "@/context/firestore-context";
import { useEffect } from "react";
import uploadFile from "@/lib/backend/firebase/upload/uploadFile";

import { TrainingMaterialStep1 } from "./training-material-step1";
import { TrainingMaterialStep2 } from "./training-material-step2";
import { TrainingMaterialStep3 } from "./training-material-step3";

// Define the props interface for the component
interface TrainingMaterialRequestFormProps {
    isEdit?: boolean;
    currentStep: number;
    setCurrentStep: (step: number) => void;
    formData: Partial<TrainingMaterialRequestModel>;
    setFormData: (formData: Partial<TrainingMaterialRequestModel>) => void;
    attachments: File[];
    setAttachments: React.Dispatch<React.SetStateAction<File[]>>;
    onSubmit: () => void;
    isSubmitting: boolean;
    resetForm: () => void;
    setIsModalOpen: (isOpen: boolean) => void;
}

export function TrainingMaterialRequestForm({
    isEdit = false,
    currentStep,
    setCurrentStep,
    formData,
    setFormData,
    attachments,
    setAttachments,
    onSubmit,
    isSubmitting,
    resetForm,
    setIsModalOpen,
}: TrainingMaterialRequestFormProps) {
    const { activeEmployees, hrSettings } = useFirestore();
    const competencies = hrSettings.competencies;

    const handleNext = () => {
        if (currentStep < 3) setCurrentStep(currentStep + 1);
    };

    const handlePrevious = () => {
        if (currentStep > 1) setCurrentStep(currentStep - 1);
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(event.target.files || []);
        if (files.length === 0) return;

        // Add all selected files to the attachments state for UI display
        setAttachments(prevAttachments => [...prevAttachments, ...files]);

        // Use the first selected file for the main URL
        const fileToUpload = files[0];

        try {
            const downloadUrl = await uploadFile(fileToUpload, "training-attachments");
            if (downloadUrl) {
                setFormData({
                    ...formData,
                    url: downloadUrl,
                    isExternalLink: false, // Since this is an uploaded file, it's not an external link
                });
            }
        } catch (error) {
            console.error("Failed to upload file:", error);
            // Optionally, handle the error (e.g., show a notification to the user)
        }
    };

    const removeNewAttachment = (index: number) => {
        setAttachments(attachments.filter((_, i) => i !== index));
    };

    const removeExistingAttachment = (index: number) => {
        const updatedAttachments = formData.attachments?.filter((_, i) => i !== index);
        setFormData({
            ...formData,
            attachments: updatedAttachments,
        });
    };

    useEffect(() => {
        if (!isEdit) {
            setFormData({
                ...formData,
                timestamp: new Date().toISOString(),
            });
        }
    }, [isEdit, setFormData]);

    const renderStepContent = () => {
        switch (currentStep) {
            case 1:
                return <TrainingMaterialStep1 formData={formData} setFormData={setFormData} />;
            case 2:
                return (
                    <TrainingMaterialStep2
                        formData={formData}
                        setFormData={setFormData}
                        employees={activeEmployees}
                        competencies={competencies}
                    />
                );
            case 3:
                return (
                    <TrainingMaterialStep3
                        existingAttachments={formData.attachments || []}
                        newAttachments={attachments}
                        handleFileUpload={handleFileUpload}
                        removeNewAttachment={removeNewAttachment}
                        removeExistingAttachment={removeExistingAttachment}
                        formData={formData}
                        setFormData={setFormData}
                    />
                );
            default:
                return null;
        }
    };

    return (
        <div className="space-y-6 max-h-[70vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                    {[1, 2, 3].map(step => (
                        <div key={step} className="flex items-center">
                            <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                                    step === currentStep
                                        ? "bg-brand-600 text-white"
                                        : step < currentStep
                                            ? "bg-green-500 text-white"
                                            : "bg-gray-200 text-gray-600"
                                }`}
                            >
                                {step}
                            </div>
                            {step < 3 && <div className="w-12 h-0.5 bg-gray-200 mx-2" />}
                        </div>
                    ))}
                </div>
                <div className="text-sm text-gray-500">Step {currentStep} of 3</div>
            </div>

            <div className="mb-6">
                <h3 className="text-lg font-semibold text-brand-800 dark:text-foreground">
                    {currentStep === 1 && "Basic Information"}
                    {currentStep === 2 && "Schedule & Requirements"}
                    {currentStep === 3 && "Attachments"}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                    {currentStep === 1 && "Enter the basic details of the training material"}
                    {currentStep === 2 && "Set schedule, audience, and requirements"}
                    {currentStep === 3 && "Upload any supporting documents or files"}
                </p>
            </div>

            {renderStepContent()}

            <div className="flex justify-between pt-6 border-t">
                <Button
                    variant="outline"
                    onClick={handlePrevious}
                    disabled={currentStep === 1}
                    className="flex items-center bg-transparent"
                >
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Previous
                </Button>

                <div className="flex space-x-2">
                    <Button
                        variant="outline"
                        onClick={() => {
                            setIsModalOpen(false);
                            resetForm();
                        }}
                    >
                        Cancel
                    </Button>

                    {currentStep < 3 ? (
                        <Button onClick={handleNext} className="flex items-center">
                            Next
                            <ChevronRight className="h-4 w-4 ml-2" />
                        </Button>
                    ) : (
                        <Button onClick={onSubmit} disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="h-4 w-4 mr-2" />}
                            {isSubmitting
                                ? "Submitting..."
                                : isEdit
                                    ? "Update Request"
                                    : "Create Request"}
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
