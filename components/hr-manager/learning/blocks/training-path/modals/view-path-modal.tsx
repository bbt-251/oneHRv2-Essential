"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TrainingPathModel } from "@/lib/models/training-path";
import PathBasicInformation from "./path-basic-information";
import PathTrainingDetails from "./path-training-details";

export function ViewPathModal({
    isViewModalOpen,
    setIsViewModalOpen,
    selectedPath,
}: {
    isViewModalOpen: boolean;
    setIsViewModalOpen: (open: boolean) => void;
    selectedPath: TrainingPathModel | null;
}) {
    const [currentStep, setCurrentStep] = useState(1);

    const handleNext = () => {
        setCurrentStep(prev => (prev < 2 ? prev + 1 : prev));
    };

    const handleBack = () => {
        setCurrentStep(prev => (prev > 1 ? prev - 1 : prev));
    };

    // Reset to step 1 when the modal is closed
    const handleOpenChange = (isOpen: boolean) => {
        if (!isOpen) {
            setCurrentStep(1);
        }
        setIsViewModalOpen(isOpen);
    };

    return (
        <Dialog open={isViewModalOpen} onOpenChange={handleOpenChange}>
            <DialogContent className="max-w-4xl">
                <DialogHeader>
                    <DialogTitle>Training Path Details</DialogTitle>
                </DialogHeader>
                {selectedPath && (
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
                            </div>
                            <div className="text-sm font-medium">Step {currentStep} of 2</div>
                        </div>

                        <div>
                            {currentStep === 1 && (
                                <PathBasicInformation selectedPath={selectedPath} />
                            )}
                            {currentStep === 2 && (
                                <PathTrainingDetails selectedPath={selectedPath} />
                            )}
                        </div>

                        <div className="flex justify-between mt-6">
                            {currentStep > 1 ? (
                                <Button variant="outline" onClick={handleBack}>
                                    Back
                                </Button>
                            ) : (
                                // This empty div ensures the "Next" button stays on the right
                                <div />
                            )}

                            {currentStep < 2 ? (
                                <Button onClick={handleNext}>Next</Button>
                            ) : (
                                <Button variant="outline" onClick={() => handleOpenChange(false)}>
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
