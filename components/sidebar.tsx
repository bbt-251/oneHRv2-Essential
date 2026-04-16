"use client";

import { Sidebar, SidebarContent, SidebarHeader } from "@/components/ui/sidebar";
import { useAuth } from "@/context/authContext";
import { useFirestore } from "@/context/firestore-context";
import { AttendanceLogicModel } from "@/lib/models/attendance-logic";
import { Calendar, Clock, DollarSign, LayoutGrid, LucideIcon, Settings, Users } from "lucide-react";
import Image from "next/image";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { SidebarSection } from "./sidebar-section";
import { useTheme } from "./theme-provider";

export interface Item {
    title: string;
    url?: string;
    icon?: LucideIcon;
    isActive?: boolean;
    items?: Item[];
}

export const employeeItems: Item[] = [
    {
        title: "Time & Attendance Management",
        icon: Clock,
        url: "/attendance-management",
        isActive: true,
    },
    {
        title: "Leave Management",
        icon: Calendar,
        url: "/leave-management",
    },
];

export const managerItems: Item[] = [
    {
        title: "Employee Management",
        icon: Users,
        items: [
            {
                title: "Team Directory",
                url: "/manager/reportees/directory",
            },
        ],
    },
    {
        title: "Time & Attendance Management",
        url: "#",
        icon: Clock,
        items: [
            {
                title: "Overtime Requests",
                url: "/overtime_requests",
            },
        ],
    },
];

export const hrMonitorItems: Item[] = [
    {
        title: "Employee Management",
        icon: Users,
        items: [
            {
                title: "Employees",
                url: "/hr/employees",
            },
        ],
    },
    {
        title: "Time & Attendance Management",
        url: "/hr/attendance-management",
        icon: Clock,
    },
    {
        title: "Leave Management",
        url: "/hr/leave-management",
        icon: Calendar,
    },
    {
        title: "Compensation & Benefits",
        url: "/hr/compensation-benefits",
        icon: DollarSign,
    },
];

export const hrSettingsItems: Item[] = [
    {
        title: "Core Settings",
        icon: Settings,
        url: "",
        items: [
            {
                title: "Company Setup",
                url: "/hr/core-settings/company-profile",
            },
            {
                title: "Job Management",
                url: "/hr/core-settings/job-management",
            },
            {
                title: "Department",
                url: "/hr/core-settings/department",
            },
            {
                title: "Section Management",
                url: "/hr/core-settings/section-management",
            },
            {
                title: "Location Management",
                url: "/hr/core-settings/location-management",
            },
            {
                title: "Marital Status",
                url: "/hr/core-settings/marital-status",
            },
        ],
    },
    {
        title: "Module Settings",
        icon: LayoutGrid,
        url: "/hr/module-settings",
        items: [
            {
                title: "Attendance Management",
                url: "/hr/module-settings/attendance-management",
            },
            {
                title: "Leave Management",
                url: "/hr/module-settings/leave-management",
            },
            {
                title: "Payroll Configuration",
                url: "/hr/module-settings/payroll-configuration",
            },
        ],
    },
];

export const payrollOfficerItems: Item[] = [
    {
        title: "Compensation & Benefits",
        url: "/hr/compensation-benefits",
        icon: DollarSign,
    },
];

export function AppSidebar() {
    const { theme } = useTheme();
    const params = useParams();
    const path = Array.isArray(params.route) ? `/${params.route.join("/")}` : "";
    const { attendanceLogic: logicData } = useFirestore();
    const { userData } = useAuth();
    const [attendanceLogic, setAttendanceLogic] = useState<AttendanceLogicModel>();

    useEffect(() => {
        if (logicData.length) {
            setAttendanceLogic(logicData[0]);
        }
    }, [logicData]);

    return (
        <Sidebar
            className={`border-r font-montserrat transition-colors duration-200
            bg-sidebar text-foreground
            ${theme === "dark" ? "border-border-800 bg-black" : "border-gray-200 bg-white"}
        `}
        >
            <SidebarHeader
                className={`p-6 border-b transition-colors duration-200 ${
                    theme === "dark" ? "border-border-800" : "border-gray-200"
                }`}
            >
                <div className="flex items-center gap-4">
                    <Image
                        src="/logo.png"
                        alt="oneHR Logo"
                        width={60}
                        height={60}
                        className="w- object-cover"
                    />
                </div>
            </SidebarHeader>

            <SidebarContent className="px-2 py-4 w-full">
                <SidebarSection
                    label="Employees"
                    role="Employee"
                    items={employeeItems}
                    activePath={path}
                    theme={theme}
                    attendanceLogic={attendanceLogic}
                />

                {userData && userData.role.includes("Manager") && (
                    <SidebarSection
                        label="Management"
                        role="Manager"
                        items={managerItems}
                        activePath={path}
                        theme={theme}
                        attendanceLogic={attendanceLogic}
                    />
                )}

                {userData && userData.role.includes("Payroll Officer") && (
                    <SidebarSection
                        label="Payroll"
                        role="Payroll Officer"
                        items={payrollOfficerItems}
                        activePath={path}
                        theme={theme}
                        attendanceLogic={attendanceLogic}
                    />
                )}

                {userData && userData.role.includes("HR Manager") && (
                    <>
                        <SidebarSection
                            label="HR Management"
                            role="HR Manager"
                            items={hrMonitorItems}
                            activePath={path}
                            theme={theme}
                            attendanceLogic={attendanceLogic}
                        />

                        <SidebarSection
                            label="HR Settings"
                            role="HR Manager"
                            items={hrSettingsItems}
                            activePath={path}
                            theme={theme}
                            attendanceLogic={attendanceLogic}
                        />
                    </>
                )}
            </SidebarContent>
        </Sidebar>
    );
}
