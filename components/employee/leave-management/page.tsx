"use client";
import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { Calendar, FileText, Plus, Users } from "lucide-react";
import { useState, useEffect } from "react";
import LeaveTable from "./blocks/leave-table";
import OutOfOffice from "./blocks/out-of-office";
import { useAuth } from "@/context/authContext";
import { LeaveModel } from "@/lib/models/leave";
import ManagerLeaveManagement from "@/components/manager/leave-management/page";
import { AddLeaveRequestModal } from "./modals/add-leave-request-modal";
import { EditLeaveRequestModal } from "./modals/edit-leave-request-modal";

export default function LeaveManagement() {
    const { userData } = useAuth();
    const userRole = userData?.role;
    const { theme } = useTheme();
    const [currentView, setCurrentView] = useState<string>("employee");

    // Add modal state
    const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);

    // Add state for editing leave
    const [editingLeave, setEditingLeave] = useState<LeaveModel | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    const navigationItems = [
        {
            role: "Employee",
            label: "My Requests",
            path: "employee",
            icon: FileText,
            active: currentView === "employee",
        },
        {
            role: "Manager",
            label: "Manager Dashboard",
            path: "manager",
            icon: Users,
            active: currentView === "manager",
        },
        {
            role: "Manager",
            label: "Out of Office",
            path: "out-of-office",
            icon: Calendar,
            active: currentView === "out-of-office",
        },
    ];

    return (
        <div
            className={`min-h-screen font-sans ${
                theme === "dark"
                    ? "bg-black"
                    : "bg-gradient-to-br from-slate-50 via-white to-slate-100"
            }`}
        >
            <div className="w-full mx-auto p-8 space-y-8">
                {/* Modern Header */}
                <div className="flex items-center justify-between mb-12">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <div
                                className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg"
                                style={{ backgroundColor: "#3f3d56" }}
                            >
                                {currentView === "employee" ? (
                                    <Calendar className="w-6 h-6 text-white" />
                                ) : (
                                    <Users className="w-6 h-6 text-white" />
                                )}
                            </div>
                            <div>
                                <h1
                                    className={`text-4xl font-bold tracking-tight ${
                                        theme === "dark" ? "text-white" : ""
                                    }`}
                                    style={{ color: theme === "dark" ? "#ffffff" : "#3f3d56" }}
                                >
                                    {currentView === "employee"
                                        ? "Leave Management"
                                        : currentView === "manager"
                                            ? "Manager Dashboard"
                                            : "Out of Office"}
                                </h1>
                                <p
                                    className={`font-medium ${
                                        theme === "dark" ? "text-slate-300" : "text-slate-500"
                                    }`}
                                >
                                    {currentView === "employee"
                                        ? "Track and manage your time off"
                                        : "Monitor all employee leave requests"}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {navigationItems
                            .filter(item => {
                                if (!userRole) return item.role === "Employee";
                                const userRoles = Array.isArray(userRole) ? userRole : [userRole];
                                return userRoles.includes(item.role);
                            })
                            .map(item => (
                                <Button
                                    key={item.path}
                                    variant={currentView === item.path ? "default" : "outline"}
                                    size="lg"
                                    onClick={() => setCurrentView(item.path)}
                                    className={`rounded-2xl border-2 backdrop-blur-sm transition-all duration-300 shadow-lg ${
                                        theme === "dark"
                                            ? "bg-slate-800/80 hover:bg-slate-700 border-slate-600 text-slate-200"
                                            : "bg-white/80 hover:bg-white border-slate-300"
                                    }`}
                                    style={{
                                        borderColor: theme === "dark" ? "#475569" : "#3f3d56",
                                        color: theme === "dark" ? "#e2e8f0" : "#3f3d56",
                                    }}
                                >
                                    {item.label}
                                </Button>
                            ))}
                        <Button
                            size="lg"
                            className={`rounded-2xl text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 ${
                                theme === "dark" ? "bg-slate-700 hover:bg-slate-600" : ""
                            }`}
                            style={{ backgroundColor: theme === "dark" ? "#334155" : "#3f3d56" }}
                            disabled={!userData?.balanceLeaveDays || userData.balanceLeaveDays < 0}
                            onClick={() => setIsAddModalOpen(true)}
                        >
                            <Plus className="w-5 h-5 mr-2" />
                            New Request
                        </Button>
                    </div>
                </div>

                {currentView === "employee" ? (
                    <LeaveTable />
                ) : currentView === "manager" ? (
                    <ManagerLeaveManagement />
                ) : currentView === "out-of-office" ? (
                    <OutOfOffice />
                ) : null}

                {/* Add Leave Request Modal */}
                <AddLeaveRequestModal
                    open={isAddModalOpen}
                    onOpenChange={open => {
                        setIsAddModalOpen(open);
                        if (!open) {
                            setEditingLeave(null);
                        }
                    }}
                    onSuccess={() => {
                        setIsAddModalOpen(false);
                        setEditingLeave(null);
                    }}
                />
                {/* Edit Leave Request Modal */}
                {editingLeave && (
                    <EditLeaveRequestModal
                        open={isEditModalOpen}
                        onOpenChange={open => {
                            setIsEditModalOpen(open);
                            if (!open) {
                                setEditingLeave(null);
                            }
                        }}
                        leaveRequest={editingLeave!}
                        onSuccess={() => {
                            setIsEditModalOpen(false);
                            setEditingLeave(null);
                        }}
                    />
                )}
            </div>
        </div>
    );
}
