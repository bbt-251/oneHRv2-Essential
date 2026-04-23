"use client";

import { AttendanceManagement } from "@/components/employee/attendance-management/page";
import { Dashboard } from "@/components/employee/dashboard/page";
import LeaveManagement from "@/components/employee/leave-management/page";
import { EmployeeLoanManagement } from "@/components/hr-manager/compensation-benefits/loan/page";
import { HRCompensationBenefits } from "@/components/hr-manager/compensation-benefits/page";
import { PaymentDeductions } from "@/components/hr-manager/compensation-benefits/payment-deduction/page";
import { PayrollManagement } from "@/components/hr-manager/compensation-benefits/payroll-management/page";
import { BasicInfo } from "@/components/hr-manager/core-settings/company-setup/basic-info/basic-info";
import { Department } from "@/components/hr-manager/core-settings/company-setup/department/department";
import JobManagement from "@/components/hr-manager/core-settings/Job-management/job-management";
import { LocationManagement } from "@/components/hr-manager/core-settings/location/location-management";
import { MaritalStatusManagement } from "@/components/hr-manager/core-settings/marital-status/marital-status-management";
import { SectionManagement } from "@/components/hr-manager/core-settings/section/section-management";
import EmployeeManagement from "@/components/hr-manager/employee-management/employees/page";
import { AttendanceManagementHR } from "@/components/hr-manager/attendance-management/page";
import HRLeaveManagement from "@/components/hr-manager/leave-management/page";
import AttendanceManagementSettings from "@/components/hr-manager/module-settings/attendance-management/attendance-management";
import HrLeaveManagementSettings from "@/components/hr-manager/module-settings/leave-management/leave-management";
import { PayrollConfiguration } from "@/components/hr-manager/module-settings/payroll-configuration/page";
import { OvertimeApprovals } from "@/components/manager/overtime-approvals/page";
import TeamDirectoryPage from "@/components/manager/team-directory/page";
import {
    employeeItems,
    hrMonitorItems,
    settingsItems,
    managerItems,
    payrollOfficerItems,
} from "@/components/sidebar";
import { useAuth } from "@/context/authContext";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo } from "react";

const routeMap: Record<string, () => React.ReactNode> = {
    dashboard: () => (
        <div className="space-y-6">
            <Dashboard />
        </div>
    ),
    "attendance-management": () => (
        <div className="space-y-6">
            <AttendanceManagement />
        </div>
    ),
    "leave-management": () => (
        <div className="space-y-6">
            <LeaveManagement />
        </div>
    ),
    "manager/reportees/directory": () => (
        <div className="space-y-6">
            <TeamDirectoryPage />
        </div>
    ),
    overtime_requests: () => (
        <div className="space-y-6">
            <OvertimeApprovals />
        </div>
    ),
    "hr/employees": () => (
        <div className="space-y-6">
            <EmployeeManagement />
        </div>
    ),
    "hr/attendance-management": () => (
        <div className="space-y-6">
            <AttendanceManagementHR />
        </div>
    ),
    "hr/leave-management": () => (
        <div className="space-y-6">
            <HRLeaveManagement />
        </div>
    ),
    "hr/compensation-benefits": () => (
        <div className="space-y-6">
            <HRCompensationBenefits />
        </div>
    ),
    "hr/payroll": () => (
        <div className="space-y-6">
            <PayrollManagement />
        </div>
    ),
    "hr/payment-deduction": () => (
        <div className="space-y-6">
            <PaymentDeductions />
        </div>
    ),
    "hr/employee-loan": () => (
        <div className="space-y-6">
            <EmployeeLoanManagement />
        </div>
    ),
    "hr/core-settings/company-profile": () => (
        <div className="space-y-6">
            <BasicInfo />
        </div>
    ),
    "hr/core-settings/job-management": () => (
        <div className="space-y-6">
            <JobManagement />
        </div>
    ),
    "hr/core-settings/department": () => (
        <div className="space-y-6">
            <Department />
        </div>
    ),
    "hr/core-settings/section-management": () => (
        <div className="space-y-6">
            <SectionManagement />
        </div>
    ),
    "hr/core-settings/location-management": () => (
        <div className="space-y-6">
            <LocationManagement />
        </div>
    ),
    "hr/core-settings/marital-status": () => (
        <div className="space-y-6">
            <MaritalStatusManagement />
        </div>
    ),
    "hr/module-settings/attendance-management": () => (
        <div className="space-y-6">
            <AttendanceManagementSettings />
        </div>
    ),
    "hr/module-settings/leave-management": () => (
        <div className="space-y-6">
            <HrLeaveManagementSettings />
        </div>
    ),
    "hr/module-settings/payroll-configuration": () => (
        <div className="space-y-6">
            <PayrollConfiguration />
        </div>
    ),
};

export default function DynamicPage() {
    const { userData, employeeNotFound, authLoading, user } = useAuth();
    const params = useParams();
    const router = useRouter();
    const path = Array.isArray(params.route) ? params.route.join("/") : "";

    const getRedirectReason = useCallback((): string => {
        if (!user) {
            return "no-user-data";
        }
        if (authLoading) {
            return "auth-loading";
        }
        if (!userData) {
            if (employeeNotFound) {
                return "no-employee-record";
            }
            return "no-user-data";
        }
        if (!userData.role || userData.role.length === 0) {
            return "no-role";
        }
        return "page-not-allowed";
    }, [authLoading, employeeNotFound, user, userData]);

    const allowedPaths = useMemo(() => {
        const employeeSidebarPaths = employeeItems.flatMap(i => [
            i.url,
            ...(i.items ? i.items.map(sub => sub.url) : []),
        ]);
        const managerSidebarPaths = managerItems.flatMap(i => [
            i.url,
            ...(i.items ? i.items.map(sub => sub.url) : []),
        ]);
        const hrManagerSidebarPaths = [
            ...hrMonitorItems.flatMap(i => [
                i.url,
                ...(i.items ? i.items.map(sub => sub.url) : []),
            ]),
            ...settingsItems.flatMap(i => [i.url, ...(i.items ? i.items.map(sub => sub.url) : [])]),
        ];
        const payrollOfficerSidebarPaths = payrollOfficerItems.flatMap(i => [
            i.url,
            ...(i.items ? i.items.map(sub => sub.url) : []),
        ]);
        const paths: string[] = [];

        userData?.role?.forEach(role => {
            if (role == "HR Manager") {
                paths.push(
                    ...([
                        ...employeeSidebarPaths,
                        ...managerSidebarPaths,
                        ...hrManagerSidebarPaths,
                        "/hr/payroll",
                        "/hr/payment-deduction",
                        "/hr/employee-loan",
                    ].filter(Boolean) as string[]),
                );
            } else if (role == "Manager") {
                paths.push(
                    ...([...employeeSidebarPaths, ...managerSidebarPaths].filter(
                        Boolean,
                    ) as string[]),
                );
            } else if (role == "Employee") {
                paths.push(...(employeeSidebarPaths.filter(Boolean) as string[]));
            } else if (role == "Payroll Officer") {
                paths.push(
                    ...([
                        ...payrollOfficerSidebarPaths,
                        "/hr/payroll",
                        "/hr/payment-deduction",
                        "/hr/employee-loan",
                        "/hr/module-settings/payroll-configuration",
                    ].filter(Boolean) as string[]),
                );
            }
        });

        return paths;
    }, [userData?.role]);

    const isAllowedPath = allowedPaths.includes(`/${path}`);
    const renderRoute = routeMap[path];

    useEffect(() => {
        if (authLoading) {
            return;
        }

        if (!user) {
            router.replace("/signin");
            return;
        }

        if (!isAllowedPath) {
            const reason = getRedirectReason();
            router.replace(`/unauthorized?reason=${reason}`);
        }
    }, [
        authLoading,
        employeeNotFound,
        getRedirectReason,
        isAllowedPath,
        path,
        router,
        user,
        userData,
    ]);

    if (authLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return null;
    }

    if (isAllowedPath && renderRoute) {
        return <div key={path}>{renderRoute()}</div>;
    }

    return null;
}
