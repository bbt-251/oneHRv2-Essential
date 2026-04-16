"use client";
import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TrainingPathModel } from "@/lib/models/training-path";
import { useAuth } from "@/context/authContext";
import { useToast } from "@/context/toastContext";
import { TrainingPathForm } from "../blocks/training-path-form";

interface AddTrainingPathProps {
    isModalOpen: boolean;
    setIsModalOpen: (isOpen: boolean) => void;
    selectedPath: TrainingPathModel | null;
    handleCreate: (newPath: Omit<TrainingPathModel, "id">) => Promise<boolean>;
    handleUpdate: (updatedPath: TrainingPathModel) => void;
}

export function AddTrainingPath({
    isModalOpen,
    setIsModalOpen,
    selectedPath,
    handleCreate,
    handleUpdate,
}: AddTrainingPathProps) {
    const { user } = useAuth();
    const { showToast } = useToast();
    const [pathFormData, setPathFormData] = useState<Partial<TrainingPathModel>>({});
    const [currentPathStep, setCurrentPathStep] = useState<number>(1);

    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const isEditMode = !!selectedPath;

    const resetPathForm = () => {
        setPathFormData({
            name: "",
            trainingMaterials: [],
            category: [],
            description: "",
            audienceTarget: [],
            employees: [],
            departments: [],
            sections: [],
            locations: [],
            grades: [],
            assignedBy: "",
            status: "Created",
            dateRange: ["", ""],
            estimatedDuration: 0,
            outcome: "",
            justification: "",
            competencies: [],
        });
        setCurrentPathStep(1);
    };
    useEffect(() => {
        if (selectedPath) {
            setPathFormData(selectedPath);
        } else {
            resetPathForm();
        }
    }, [selectedPath, isModalOpen]);

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            if (isEditMode) {
                // Update Logic
                const updatedPath = {
                    ...(pathFormData as TrainingPathModel),
                    id: selectedPath?.id || "",
                };
                await handleUpdate(updatedPath);
            } else {
                const newPath: Omit<TrainingPathModel, "id"> = {
                    timestamp: new Date().toISOString(),
                    name: pathFormData.name || "",
                    trainingMaterials: pathFormData.trainingMaterials || [],
                    category: pathFormData.category || [],
                    description: pathFormData.description || "",
                    audienceTarget: pathFormData.audienceTarget || [],
                    employees: pathFormData.employees || [],
                    departments: pathFormData.departments || [],
                    sections: pathFormData.sections || [],
                    locations: pathFormData.locations || [],
                    grades: pathFormData.grades || [],
                    assignedBy: user?.uid || "",
                    status: "Created",
                    dateRange: pathFormData.dateRange || ["", ""],
                    estimatedDuration: pathFormData.estimatedDuration || 0,
                    outcome: pathFormData.outcome || "",
                    justification: pathFormData.justification || "",
                    competencies: pathFormData.competencies || [],
                    employeeFeedbacks: [],
                };
                const success = await handleCreate(newPath);
                if (success) {
                    showToast("Request created successfully", "success", "success");
                    setIsModalOpen(false); // Close modal on success
                } else {
                    showToast("Failed to create request", "error", "error");
                }
            }
        } catch (error) {
            showToast("An unexpected error occurred", "error", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            {/* Edit Path Modal */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="max-w-4xl">
                    <DialogHeader>
                        <DialogTitle>{isEditMode ? "Edit" : "Create"} Training Path</DialogTitle>
                    </DialogHeader>
                    <TrainingPathForm
                        isEdit={isEditMode}
                        pathFormData={pathFormData}
                        setPathFormData={setPathFormData}
                        currentPathStep={currentPathStep}
                        setCurrentPathStep={setCurrentPathStep}
                        resetPathForm={resetPathForm}
                        onSubmit={handleSubmit}
                        isSubmitting={isSubmitting}
                        setIsModalOpen={setIsModalOpen}
                    />
                </DialogContent>
            </Dialog>
        </>
    );
}
