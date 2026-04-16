"use client";

import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useFirestore } from "@/context/firestore-context";
import { MonitoringPeriodModel } from "@/lib/models/performance";
import { BarChart3, Plus } from "lucide-react";
import { useState } from "react";
import MonitoringTable from "./blocks/monitoring-table";
import DeleteMonitoringModal from "./modals/delete-monitoring-modal";
import MonitoringModal from "./modals/monitoring-modal";

export default function MonitoringPeriodsPage() {
    const { theme } = useTheme();
    const { hrSettings } = useFirestore();
    const [isMonitoringModalOpen, setIsMonitoringModalOpen] = useState<boolean>(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
    const [selectedPeriod, setSelectedPeriod] = useState<MonitoringPeriodModel | null>(null);

    const handleEdit = (period: MonitoringPeriodModel) => {
        setSelectedPeriod(period);
        setIsMonitoringModalOpen(true);
    };

    const handleDelete = (period: MonitoringPeriodModel) => {
        setSelectedPeriod(period);
        setIsDeleteModalOpen(true);
    };

    const handleCloseModals = () => {
        setIsMonitoringModalOpen(false);
        setIsDeleteModalOpen(false);
        setSelectedPeriod(null);
    };

    const handleOpenCreateModal = () => {
        setSelectedPeriod(null);
        setIsMonitoringModalOpen(true);
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
                        <BarChart3 className="h-5 w-5 text-amber-600 mr-2" />
                        <CardTitle
                            className={`text-lg font-semibold ${theme === "dark" ? "text-white" : "text-gray-900"}`}
                        >
                            Monitoring Periods
                        </CardTitle>
                    </div>
                    <Button
                        onClick={handleOpenCreateModal}
                        className="bg-amber-600 hover:bg-amber-700 text-white"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Monitoring Period
                    </Button>
                </CardHeader>

                <CardContent className="space-y-6">
                    <p className={theme === "dark" ? "text-gray-300" : "text-gray-600"}>
                        Configure monitoring periods and tracking intervals.
                    </p>

                    <MonitoringTable
                        data={hrSettings.monitoringPeriods}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                    />
                </CardContent>
            </Card>

            <MonitoringModal
                isOpen={isMonitoringModalOpen}
                onClose={handleCloseModals}
                monitoringPeriod={selectedPeriod}
            />

            <DeleteMonitoringModal
                isOpen={isDeleteModalOpen}
                onClose={handleCloseModals}
                monitoringPeriod={selectedPeriod}
            />
        </>
    );
}
