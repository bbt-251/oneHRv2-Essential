"use client";
import type React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TrainingMaterialRequestModel } from "@/lib/models/training-material";
import BasicInformation from "./basic-information";
import AudienceAndScheduling from "./audience-and-scheduling";
import Attachments from "./attachments";
import { useFirestore } from "@/context/firestore-context";

interface TrainingRequestMaterialDetailProps {
    isViewModalOpen: boolean;
    setIsViewModalOpen: (isOpen: boolean) => void;
    selectedRequest: TrainingMaterialRequestModel | null;
}

export default function TrainingRequestMaterialDetail({
    isViewModalOpen,
    setIsViewModalOpen,
    selectedRequest,
}: TrainingRequestMaterialDetailProps) {
    const { hrSettings } = useFirestore();
    // Helper functions to get display names for reference fields
    const getCategoryName = (catId: string) => {
        const category = hrSettings.tmCategories.find(dept => dept.id === catId);
        return category?.name || catId;
    };
    const getLengthName = (lenId: string) => {
        const length = hrSettings.tmLengths.find(dept => dept.id === lenId);
        return length?.name || lenId;
    };
    const getComplexityName = (comId: string) => {
        const Complexity = hrSettings.tmComplexity.find(dept => dept.id === comId);
        return Complexity?.name || comId;
    };

    const [currentStep, setCurrentStep] = useState(1);

    const handleNext = () => {
        setCurrentStep(prev => (prev < 3 ? prev + 1 : prev));
    };

    const handleBack = () => {
        setCurrentStep(prev => (prev > 1 ? prev - 1 : prev));
    };

    return (
        <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
            <DialogContent className="max-w-4xl">
                <DialogHeader>
                    <DialogTitle>Training Material Request Details</DialogTitle>
                </DialogHeader>
                {selectedRequest && (
                    <div className="space-y-6 max-h-[70vh] overflow-y-auto p-2">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div
                                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                        currentStep >= 1 ? "bg-blue-500 text-white" : "bg-gray-200"
                                    }`}
                                >
                                    1
                                </div>
                                <div
                                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                        currentStep >= 2 ? "bg-blue-500 text-white" : "bg-gray-200"
                                    }`}
                                >
                                    2
                                </div>
                                <div
                                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                        currentStep === 3 ? "bg-blue-500 text-white" : "bg-gray-200"
                                    }`}
                                >
                                    3
                                </div>
                            </div>
                            <div className="text-sm font-medium">Step {currentStep} of 3</div>
                        </div>

                        <div>
                            {currentStep === 1 && (
                                <BasicInformation
                                    selectedRequest={selectedRequest}
                                    categoryName={getCategoryName}
                                    lengthName={getLengthName}
                                    complexityName={getComplexityName}
                                />
                            )}
                            {currentStep === 2 && (
                                <AudienceAndScheduling selectedRequest={selectedRequest} />
                            )}
                            {currentStep === 3 && <Attachments selectedRequest={selectedRequest} />}
                        </div>

                        <div className="flex justify-between mt-6">
                            {currentStep > 1 && (
                                <Button variant="outline" onClick={handleBack}>
                                    Back
                                </Button>
                            )}
                            <div />
                            {currentStep < 3 && <Button onClick={handleNext}>Next</Button>}
                            {currentStep === 3 && (
                                <Button variant="outline" onClick={() => setIsViewModalOpen(false)}>
                                    Close
                                </Button>
                            )}
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
