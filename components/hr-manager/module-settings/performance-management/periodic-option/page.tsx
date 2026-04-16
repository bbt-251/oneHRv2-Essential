"use client";

import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useFirestore } from "@/context/firestore-context";
import { PeriodicOptionModel } from "@/lib/models/performance";
import { Plus, Target } from "lucide-react";
import { useState } from "react";
import PeriodicOptionTable from "./blocks/periodic-option-table";
import DeletePeriodicOptionModal from "./modals/delete-periodic-option-modal";
import PeriodicOptionModal from "./modals/periodic-option-modal";

export default function PeriodicOptionPage() {
    const { theme } = useTheme();
    const { hrSettings } = useFirestore();
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
    const [selectedOption, setSelectedOption] = useState<PeriodicOptionModel | null>(null);

    const handleEdit = (option: PeriodicOptionModel) => {
        setSelectedOption(option);
        setIsModalOpen(true);
    };

    const handleDelete = (option: PeriodicOptionModel) => {
        setSelectedOption(option);
        setIsDeleteModalOpen(true);
    };

    const handleCloseModals = () => {
        setIsModalOpen(false);
        setIsDeleteModalOpen(false);
        setSelectedOption(null);
    };

    return (
        <>
            <Card
                className={
                    theme === "dark" ? "bg-black border-gray-700" : "bg-white border-gray-200"
                }
            >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                    <div className="flex items-center">
                        <Target className="h-5 w-5 text-amber-600 mr-2" />
                        <CardTitle
                            className={`text-lg font-semibold ${theme === "dark" ? "text-white" : "text-gray-900"}`}
                        >
                            Periodic Option Configuration
                        </CardTitle>
                    </div>
                    <Button
                        onClick={() => setIsModalOpen(true)}
                        className="bg-amber-600 hover:bg-amber-700 text-white"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Period Option
                    </Button>
                </CardHeader>

                <CardContent className="space-y-6">
                    <p className={theme === "dark" ? "text-gray-300" : "text-gray-600"}>
                        Configure periodic evaluation options and settings.
                    </p>

                    <PeriodicOptionTable
                        data={hrSettings.periodicOptions}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                    />
                </CardContent>
            </Card>

            <PeriodicOptionModal
                isOpen={isModalOpen}
                onClose={handleCloseModals}
                periodicOption={selectedOption}
            />

            <DeletePeriodicOptionModal
                isOpen={isDeleteModalOpen}
                onClose={handleCloseModals}
                periodicOption={selectedOption}
            />
        </>
    );
}
