"use client";

import { CycleProvider, useCycle } from "@/context/cycleContext";
import { useAuth } from "@/context/authContext";
import { CompanyPerformanceDashboard } from "./company-performance-dashboard";

function CompanyPerformancePageContent() {
    const { currentCycle } = useCycle();
    const { userData } = useAuth();

    if (!currentCycle || !currentCycle.id) {
        return (
            <div className="flex items-center justify-center h-64">
                No active performance cycle found.
            </div>
        );
    }

    // Determine user role - default to first role in array or 'employee'
    const userRole = userData?.role?.[0] || "employee";

    return <CompanyPerformanceDashboard cycleId={currentCycle.id} userRole={userRole} />;
}

export default function CompanyPerformancePage() {
    return (
        <CycleProvider>
            <CompanyPerformancePageContent />
        </CycleProvider>
    );
}
