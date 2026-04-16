"use client";

import { useState, useEffect } from "react";
import { useCycle } from "@/context/cycleContext";
import { ObjectiveDashboard } from "./blocks/objectives/objective-Dashboard";
import { PerformanceNavigation } from "./blocks/performance-navigation";
import { CompetencyModule } from "./blocks/competency/competency-module";
import { PerformanceAnalyticsDashboard } from "./blocks/analytics/performance-analytics-dashboard";
import { CycleManagement } from "./blocks/objectives/blocks/cycle-management";
import { CycleProvider } from "@/context/cycleContext";
import { CycleSelector } from "@/components/manager/team-performance/blocks/cycle-selector";
import { EvaluationStatus } from "./blocks/objectives/blocks/evaluation-status";
import { useFirestore } from "@/context/firestore-context";
import { useAuth } from "@/context/authContext";
type PerformanceView = "objectives" | "competencies" | "reports" | "admin";

function PerformanceModuleContent() {
    const [activeView, setActiveView] = useState<PerformanceView>("objectives");
    const { setContext } = useCycle();
    const { user } = useAuth();
    const { currentCycle } = useCycle();
    const { performanceEvaluations } = useFirestore();

    useEffect(() => {
        // Set context to employee for this page
        setContext("employee");
    }, [setContext]);

    // Get current employee's performance evaluation
    const getCurrentEmployeeEvaluation = () => {
        if (!user?.uid || !currentCycle?.id) return null;
        return performanceEvaluations.find(
            pe => pe.employeeUid === user.uid && pe.campaignID === currentCycle.id,
        );
    };

    const currentEvaluation = getCurrentEmployeeEvaluation();

    const renderContent = () => {
        switch (activeView) {
            case "objectives":
                return <ObjectiveDashboard />;
            case "competencies":
                return <CompetencyModule />;
            case "admin":
                return <CycleManagement />;
            case "reports":
                return (
                    <div className="text-center py-12">
                        <h2 className="text-xl font-semibold text-brand-700 dark:text-foreground">
                            Performance Reports
                        </h2>
                        <p className="text-brand-600 dark:text-muted-foreground">
                            Advanced reporting features coming soon...
                        </p>
                    </div>
                );
            default:
                return <ObjectiveDashboard />;
        }
    };

    return (
        <div>
            <div className="text-center py-4"></div>

            <CycleSelector />

            {/* Evaluation Status Section */}
            <EvaluationStatus
                currentEvaluation={currentEvaluation || null}
                currentCycle={currentCycle}
                userRole="employee"
            />

            <PerformanceNavigation activeView={activeView} onViewChange={setActiveView} />

            <div className="mt-8">{renderContent()}</div>
        </div>
    );
}

export function PerformanceModule() {
    return (
        <CycleProvider>
            <PerformanceModuleContent />
        </CycleProvider>
    );
}
