"use client";

import { ExtendedAnnouncementModel } from "@/components/header";
import { useTheme } from "@/components/theme-provider";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/context/authContext";
import { useFirestore } from "@/context/firestore-context";
import { HolidayModel } from "@/lib/backend/firebase/hrSettingsService";
import { AnnouncementModel } from "@/lib/models/announcement";
import { Bell, Calendar, Sun, UserCheck, Volume2 } from "lucide-react";
import { useMemo, useState } from "react";
import { AnnouncementsModal } from "../modals/announcements-modal";
import { MetricDetailModal } from "../modals/metric-detail-modal";
import BalanceDetailsModal from "../../leave-management/modals/balance-details-modal";
import { DocumentApprovalsCard } from "./document-approvals-card";

export function MetricsCards() {
    const { notifications, announcements: allAnnouncements, hrSettings } = useFirestore();
    const upcomingHolidays = hrSettings.holidays
        .filter(
            (holiday: HolidayModel) =>
                new Date(holiday.date) >= new Date() && holiday.active === "Yes",
        )
        .sort(
            (a: HolidayModel, b: HolidayModel) =>
                new Date(a.date).getTime() - new Date(b.date).getTime(),
        );
    const { userData } = useAuth();
    const myNotifications = notifications.filter(not => not.uid === userData?.uid).slice(0, 10);

    const { theme } = useTheme();
    const [activeModal, setActiveModal] = useState<string | null>(null);
    const [announcementsModalOpen, setAnnouncementsModalOpen] = useState(false);
    const [isBalanceDetailsOpen, setIsBalanceDetailsOpen] = useState(false);

    // Helper function to check if announcement is targeted to user
    const isAnnouncementTargetedToUser = (
        announcement: AnnouncementModel,
        user: any,
        hrSettings: any,
    ) => {
        // If no audience target specified, show to all
        if (!announcement.audienceTarget || announcement.audienceTarget.length === 0) return true;

        // Check each audience target type
        for (const target of announcement.audienceTarget) {
            switch (target) {
                case "all":
                    return true;
                case "employees":
                    if (announcement.employees?.includes(user.uid)) return true;
                    break;
                case "department":
                    if (announcement.departments?.includes(user.department)) return true;
                    break;
                case "section":
                    if (announcement.sections?.includes(user.section)) return true;
                    break;
                case "location":
                    if (announcement.locations?.includes(user.workingLocation)) return true;
                    break;
                case "grade":
                    if (announcement.grades?.includes(user.gradeLevel)) return true;
                    break;
                case "managers":
                    if (user?.role?.includes("Manager")) return true;
                    break;
                case "notManagers":
                    if (!user?.role?.includes("Manager")) return true;
                    break;
            }
        }
        return false;
    };

    // Filter announcements based on audience targeting and merge with user-specific data
    const userAnnouncements: ExtendedAnnouncementModel[] = useMemo(() => {
        if (!userData || !allAnnouncements.length) return [];

        // Get user's saved announcement data
        const userAnnouncementData = userData.announcements || [];

        // Filter announcements that are targeted to this user
        const targetedAnnouncements = allAnnouncements.filter(announcement => {
            // Check if announcement is published
            if (announcement.publishStatus !== "Published") return false;

            // Check if current date is within announcement period
            const now = new Date();
            const startDate = new Date(announcement.startDate);
            const endDate = new Date(announcement.endDate);
            if (now < startDate || now > endDate) return false;

            // Check audience targeting
            return isAnnouncementTargetedToUser(announcement, userData, hrSettings);
        });

        // Merge with user-specific data
        return targetedAnnouncements
            .map(announcement => {
                const userSpecificData = userAnnouncementData.find(ua => ua.id === announcement.id);
                return {
                    ...announcement,
                    isPinned: userSpecificData?.isPinned || false,
                    isRead: userSpecificData?.isRead || false,
                };
            })
            .sort((a, b) => {
                // Sort by pinned status first, then by date
                if (a.isPinned && !b.isPinned) return -1;
                if (!a.isPinned && b.isPinned) return 1;
                return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
            });
    }, [allAnnouncements, userData, hrSettings]);

    // Calculate user announcements count
    const userAnnouncementsCount = useMemo(() => {
        return userAnnouncements.length;
    }, [userAnnouncements]);

    const upcomingHolidayCount = useMemo(() => {
        if (!upcomingHolidays.length) return 0;

        return upcomingHolidays.length;
    }, [upcomingHolidays]);

    const upcomingHoliday = useMemo(() => {
        if (!upcomingHolidays.length) return null;

        return upcomingHolidays[0];
    }, [upcomingHolidays]);

    const metrics = [
        {
            id: "announcements",
            title: "Announcements",
            value: userAnnouncements.length,
            subtitle: "Company updates",
            badge: "View All",
            icon: Volume2,
            bgColor: theme === "dark" ? "bg-black border-gray-800" : "",
            textColor: theme === "dark" ? "text-slate-300" : "text-slate-600",
            iconColor: theme === "dark" ? "text-slate-400" : "text-slate-600",
            badgeColor:
                theme === "dark" ? "bg-slate-800 text-slate-200" : "bg-slate-200 text-slate-800",
        },
        {
            id: "holidays",
            title: "Upcoming Holidays",
            value: upcomingHolidayCount,
            subtitle: upcomingHoliday ? `Next: ${upcomingHoliday.name}` : null,
            badge: upcomingHoliday ? upcomingHoliday.date : null,
            icon: Sun,
            bgColor: theme === "dark" ? "bg-black border-gray-800" : "",
            textColor: theme === "dark" ? "text-slate-300" : "text-slate-600",
            iconColor: theme === "dark" ? "text-slate-400" : "text-slate-600",
            badgeColor:
                theme === "dark" ? "bg-slate-800 text-slate-200" : "bg-slate-200 text-slate-800",
        },
        {
            id: "leave",
            title: "Leave Balance",
            // Total BLD = balanceLeaveDays + (isConfigured ? accrualLeaveDays : 0)
            value: hrSettings.accrualConfigurations?.[0]?.limitUnusedDays
                ? (userData?.balanceLeaveDays || 0) + (userData?.accrualLeaveDays || 0)
                : userData?.balanceLeaveDays || 0,
            subtitle: "Days remaining",
            badge: `${(((userData?.balanceLeaveDays ?? 0) * 100) / (userData?.eligibleLeaveDays ?? 1)).toFixed(2)} Available`,
            icon: Calendar,
            bgColor: theme === "dark" ? "bg-black border-gray-800" : "",
            textColor: theme === "dark" ? "text-slate-300" : "text-slate-600",
            iconColor: theme === "dark" ? "text-slate-400" : "text-slate-600",
            badgeColor:
                theme === "dark" ? "bg-slate-800 text-slate-200" : "bg-slate-200 text-slate-800",
        },
        {
            id: "notifications",
            title: "Notifications",
            value: myNotifications?.length || 0,
            subtitle: "Recent messages",
            badge: null,
            icon: Bell,
            bgColor: theme === "dark" ? "bg-black border-gray-800" : "",
            textColor: theme === "dark" ? "text-slate-300" : "text-slate-600",
            iconColor: theme === "dark" ? "text-slate-400" : "text-slate-600",
            badgeColor:
                theme === "dark" ? "bg-slate-800 text-slate-200" : "bg-slate-200 text-slate-800",
        },
        {
            id: "document-approvals",
            title: "Document Approvals",
            value: 0, // Will be set by the component
            subtitle: "Pending approvals",
            badge: "View All",
            icon: UserCheck,
            bgColor: theme === "dark" ? "bg-black border-gray-800" : "",
            textColor: theme === "dark" ? "text-slate-300" : "text-slate-600",
            iconColor: theme === "dark" ? "text-amber-400" : "text-amber-600",
            badgeColor:
                theme === "dark" ? "bg-amber-900 text-amber-200" : "bg-amber-100 text-amber-800",
        },
    ];

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                {metrics.map(metric => {
                    if (metric.id === "document-approvals") {
                        return <DocumentApprovalsCard key={metric.id} />;
                    }

                    return (
                        <Card
                            key={metric.id}
                            className={`shadow-sm hover:shadow-lg transition-all duration-300 ${metric.id == "leave" ? "" : "cursor-pointer"} hover:scale-105 ${metric.bgColor}`}
                        >
                            <CardHeader className="pb-4 pt-6 px-6">
                                <div className="flex items-center justify-between">
                                    <CardTitle
                                        className={`text-sm font-semibold ${metric.textColor}`}
                                    >
                                        {metric.title}
                                    </CardTitle>
                                    <div className={`p-3 ${metric.bgColor} rounded-xl`}>
                                        <metric.icon className={`h-5 w-5 ${metric.iconColor}`} />
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent
                                className="px-6 pb-6"
                                onClick={() => {
                                    if (metric.id === "announcements") {
                                        setAnnouncementsModalOpen(true);
                                    } else if (metric.id === "leave") {
                                        // Only open balance details if accrual is configured
                                        if (
                                            hrSettings.accrualConfigurations?.[0]?.limitUnusedDays
                                        ) {
                                            setIsBalanceDetailsOpen(true);
                                        }
                                    } else {
                                        setActiveModal(metric.id);
                                    }
                                }}
                            >
                                <div className="space-y-4">
                                    <div className={`text-3xl font-bold ${metric.textColor}`}>
                                        {metric.value}
                                    </div>
                                    <div className="space-y-3">
                                        <div className={`text-sm font-medium ${metric.textColor}`}>
                                            {metric.subtitle}
                                        </div>
                                        {metric.id === "leave" ? (
                                            <div className="space-y-3">
                                                <div
                                                    className={`w-full bg-${metric.bgColor} rounded-full h-2.5`}
                                                >
                                                    <div
                                                        className={`bg-${metric.bgColor} h-2.5 rounded-full`}
                                                        style={{ width: "75%" }}
                                                    ></div>
                                                </div>
                                                <Badge
                                                    className={`text-xs px-3 py-1 font-medium ${metric.badgeColor}`}
                                                >
                                                    {metric.badge}
                                                </Badge>
                                            </div>
                                        ) : metric.badge ? (
                                            <Badge
                                                className={`text-xs px-3 py-1 font-medium ${metric.badgeColor}`}
                                            >
                                                {metric.badge}
                                            </Badge>
                                        ) : (
                                            <></>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Modals */}
            <AnnouncementsModal
                isOpen={announcementsModalOpen}
                onClose={() => setAnnouncementsModalOpen(false)}
                userAnnouncements={userAnnouncements}
            />
            <MetricDetailModal
                isOpen={activeModal === "holidays"}
                onClose={() => setActiveModal(null)}
                type="holidays"
            />
            <MetricDetailModal
                isOpen={activeModal === "leave"}
                onClose={() => setActiveModal(null)}
                type="leave"
            />
            <MetricDetailModal
                isOpen={activeModal === "notifications"}
                onClose={() => setActiveModal(null)}
                type="notifications"
            />
            <BalanceDetailsModal
                isOpen={isBalanceDetailsOpen}
                onClose={() => setIsBalanceDetailsOpen(false)}
                theme={theme}
                contractStartDate={userData?.contractStartingDate || ""}
                balanceLeaveDays={userData?.balanceLeaveDays || 0}
                accrualLeaveDays={userData?.accrualLeaveDays || 0}
                eligibleLeaveDays={userData?.eligibleLeaveDays || 0}
                carryOverLimit={hrSettings.accrualConfigurations?.[0]?.limitUnusedDays}
            />
        </>
    );
}
