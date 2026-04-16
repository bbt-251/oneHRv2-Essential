"use client";

import { useState, useMemo } from "react";
import {
    Bell,
    Volume2,
    Search,
    Phone,
    Mail,
    Users,
    FileText,
    Building,
    AlertTriangle,
    BookOpen,
    LogOut,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AnnouncementsModal } from "./employee/dashboard/modals/announcements-modal";
import { NotificationsModal } from "./employee/dashboard/modals/notifications-modal";
import { OrganizationalChartModal } from "./employee/dashboard/modals/organizational-chart-modal";
import { EmployeeInfoModal } from "./employee/dashboard/modals/employee-info-modal";
import { DefectListModal } from "./employee/dashboard/modals/defect-list-modal";
import { useTheme } from "./theme-provider";
import { ClockInOut } from "./employee/dashboard/blocks/clock-in-out";
import { useAuth } from "@/context/authContext";
import { useFirestore } from "@/context/firestore-context";
import { AnnouncementModel } from "@/lib/models/announcement";
import { Badge } from "./ui/badge";
import { CompanyInformationModal } from "./header/company-information-modal";
import InAppNotificationModel from "@/lib/models/notification";

export interface ExtendedAnnouncementModel extends AnnouncementModel {
    isRead: boolean;
    isPinned: boolean;
}

export interface ExtendedNotificationModel extends InAppNotificationModel {
    isRead: boolean;
    isPinned: boolean;
}

export function Header() {
    const { userData, signout } = useAuth();
    const { announcements: allAnnouncements, hrSettings, notifications } = useFirestore();
    const [isAnnouncementsOpen, setIsAnnouncementsOpen] = useState(false);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const [isOrgChartOpen, setIsOrgChartOpen] = useState(false);
    const [isEmployeeInfoOpen, setIsEmployeeInfoOpen] = useState(false);
    const [isDefectListOpen, setIsDefectListOpen] = useState(false);
    const [isCompanyInfoOpen, setIsCompanyInfoOpen] = useState(false);
    const { theme, setTheme } = useTheme();

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
                const userData = userAnnouncementData.find(ua => ua.id === announcement.id);
                return {
                    ...announcement,
                    isPinned: userData?.isPinned || false,
                    isRead: userData?.isRead || false,
                };
            })
            .sort((a, b) => {
                // Sort by pinned status first, then by date
                if (a.isPinned && !b.isPinned) return -1;
                if (!a.isPinned && b.isPinned) return 1;
                return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
            });
    }, [allAnnouncements, userData, hrSettings]);

    const unreadAnnouncements = userAnnouncements.filter(ann => !ann.isRead).length;

    // Filter notifications for current user
    const userNotifications: ExtendedNotificationModel[] = useMemo(() => {
        if (!userData || !notifications.length) return [];
        return notifications
            .filter(not => not.uid === userData.uid)
            .map(n => ({
                ...n,
                isRead: userData?.notifications?.find(not => not.id == n.id)?.isRead ? true : false,
                isPinned: false,
            }));
    }, [notifications, userData]);
    const unreadNotifications = userNotifications.filter(not => !not?.isRead).length;

    const toggleDarkMode = () => {
        setTheme(theme === "dark" ? "light" : "dark");
    };

    return (
        <>
            <header
                className="flex h-16 items-center justify-between border-b backdrop-blur-sm px-6 sticky top-0 z-50"
                style={{
                    backgroundColor:
                        theme === "dark" ? "rgba(24, 24, 27, 0.95)" : "rgba(255, 255, 255, 0.95)",
                    borderColor:
                        theme === "dark" ? "rgba(144, 146, 159, 0.2)" : "rgba(229, 231, 235, 0.2)",
                }}
            >
                <div className="flex items-center gap-4">
                    <SidebarTrigger className="-ml-1 hover:bg-accent-100 text-brand-500 dark:hover:bg-accent dark:text-brand-300" />
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-brand-400 dark:text-brand-500" />
                        <Input
                            placeholder="Search..."
                            className="pl-10 w-80 border-accent-300 focus:border-brand-500 focus:ring-brand-500/20 bg-accent-50 dark:bg-input dark:border-border dark:text-foreground"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {/* Clock In/Out Component */}
                    <ClockInOut variant="header" />

                    {/* Announcements Button */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="relative hover:bg-accent-100 rounded-full dark:hover:bg-accent"
                        onClick={() => setIsAnnouncementsOpen(true)}
                    >
                        <Volume2 className="h-5 w-5 text-brand-600 dark:text-brand-300" />
                        {unreadAnnouncements > 0 && (
                            <span className="absolute -top-1 -right-1 h-5 w-5 bg-accent-500 text-brand-800 rounded-full text-xs font-bold flex items-center justify-center dark:bg-accent-600 dark:text-accent-foreground">
                                {unreadAnnouncements}
                            </span>
                        )}
                    </Button>

                    {/* Notifications Button */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="relative hover:bg-accent-100 rounded-full dark:hover:bg-accent"
                        onClick={() => setIsNotificationsOpen(true)}
                    >
                        <Bell className="h-5 w-5 text-brand-600 dark:text-brand-300" />
                        {unreadNotifications > 0 && (
                            <span className="absolute -top-1 -right-1 h-5 w-5 bg-danger-500 text-white rounded-full text-xs font-bold flex items-center justify-center">
                                {unreadNotifications}
                            </span>
                        )}
                    </Button>

                    {/* Profile Section */}
                    <div className="flex items-center gap-3 ml-2">
                        <div className="text-right">
                            <p className="text-sm font-semibold text-brand-700 dark:text-brand-200">{`${userData?.firstName} ${userData?.surname}`}</p>
                        </div>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="p-0 h-auto rounded-full">
                                    <Avatar className="h-9 w-9 ring-4 ring-white dark:ring-border">
                                        <AvatarImage
                                            src={userData?.profilePicture}
                                            alt="Profile Picture"
                                        />
                                        <AvatarFallback className="bg-brand-500 text-white text-l font-bold">{`${userData?.firstName?.at(0) ?? ""}${userData?.surname?.at(0) ?? ""}`}</AvatarFallback>
                                    </Avatar>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                align="end"
                                className="w-80 p-0 border-accent-300 shadow-xl dark:bg-card dark:border-border"
                            >
                                {/* Profile Header */}
                                <div className={`p-6`}>
                                    <div className="flex flex-col items-center space-y-4">
                                        <Avatar className="h-20 w-20 ring-4 ring-white dark:ring-border">
                                            <AvatarImage
                                                src={userData?.profilePicture}
                                                alt="Profile Picture"
                                            />
                                            <AvatarFallback className="bg-brand-500 text-white text-2xl font-bold">{`${userData?.firstName?.at(0) ?? ""}${userData?.surname?.at(0) ?? ""}`}</AvatarFallback>
                                        </Avatar>
                                        <div className="text-center">
                                            <h3 className="font-bold text-xl text-brand-700 dark:text-foreground">
                                                {userData?.firstName}
                                            </h3>
                                            {userData?.role?.map((role, index) => {
                                                return (
                                                    <span
                                                        key={index}
                                                        className="inline-flex items-center px-2 py-1 text-xs font-small rounded-full ring-1 ring-inset"
                                                    >
                                                        {role}
                                                    </span>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>

                                {/* Contact Information */}
                                <div className="p-4 space-y-3 border-b border-accent-200 dark:border-border">
                                    <div className="flex items-center gap-3 text-sm text-brand-600 font-medium dark:text-muted-foreground">
                                        <Phone className="h-4 w-4 text-accent-600 dark:text-accent-foreground" />
                                        <span>{userData?.personalPhoneNumber}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-brand-600 font-medium dark:text-muted-foreground">
                                        <Mail className="h-4 w-4 text-accent-600 dark:text-accent-foreground" />
                                        <span>{userData?.personalEmail}</span>
                                    </div>
                                </div>

                                {/* Dark Mode Toggle */}
                                <div className="p-4 border-b border-accent-200 dark:border-border">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-semibold text-brand-700 dark:text-foreground">
                                            Dark Mode
                                        </span>
                                        <Switch
                                            className={
                                                "" +
                                                (theme === "dark"
                                                    ? "bg-brand-200"
                                                    : "bg-accent-800")
                                            }
                                            checked={theme === "dark"}
                                            onCheckedChange={toggleDarkMode}
                                        />
                                    </div>
                                </div>

                                {/* Menu Items */}
                                <div className="p-2 space-y-1">
                                    <DropdownMenuItem
                                        className={`"rounded-lg cursor-pointer p-3 dark:hover:bg-accent" ${theme === "dark" ? "hover:bg-slate-800" : " hover:bg-accent-100 "}`}
                                        onClick={() => setIsOrgChartOpen(true)}
                                    >
                                        <Users className="h-4 w-4 mr-3 text-brand-600 dark:text-muted-foreground" />
                                        <span className="text-brand-700 font-medium dark:text-foreground">
                                            Organizational Chart
                                        </span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        className={`"rounded-lg cursor-pointer p-3 dark:hover:bg-accent" ${theme === "dark" ? "hover:bg-slate-800" : " hover:bg-accent-100 "}`}
                                        onClick={() => setIsEmployeeInfoOpen(true)}
                                    >
                                        <FileText className="h-4 w-4 mr-3 text-brand-600 dark:text-muted-foreground" />
                                        <span className="text-brand-700 font-medium dark:text-foreground">
                                            My Information
                                        </span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        className={`"rounded-lg cursor-pointer p-3 dark:hover:bg-accent" ${theme === "dark" ? "hover:bg-slate-800" : " hover:bg-accent-100 "}`}
                                        onClick={() => setIsCompanyInfoOpen(true)}
                                    >
                                        <Building className="h-4 w-4 mr-3 text-brand-600 dark:text-muted-foreground" />
                                        <span className="text-brand-700 font-medium dark:text-foreground">
                                            Company Information
                                        </span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        className={`"rounded-lg cursor-pointer p-3 dark:hover:bg-accent" ${theme === "dark" ? "hover:bg-slate-800" : " hover:bg-accent-100 "}`}
                                        onClick={() => setIsDefectListOpen(true)}
                                    >
                                        <AlertTriangle className="h-4 w-4 mr-3 text-brand-600 dark:text-muted-foreground" />
                                        <span className="text-brand-700 font-medium dark:text-foreground">
                                            Report A Defect
                                        </span>
                                    </DropdownMenuItem>
                                    {/* <DropdownMenuItem
                                        className={`"rounded-lg cursor-pointer p-3 dark:hover:bg-accent" ${theme === 'dark' ? 'hover:bg-slate-800' : ' hover:bg-accent-100 '}`}
                                        onClick={() => window.open('https://docs.onehr.com', '_blank')}
                                    >
                                        <BookOpen className="h-4 w-4 mr-3 text-brand-600 dark:text-muted-foreground" />
                                        <span className="text-brand-700 font-medium dark:text-foreground">Go to oneHR Docs</span>
                                    </DropdownMenuItem> */}
                                    <DropdownMenuSeparator className="dark:bg-border" />
                                    <DropdownMenuItem
                                        className="rounded-lg hover:bg-danger-50 cursor-pointer text-danger-600 p-3 dark:hover:bg-destructive/10"
                                        onClick={signout}
                                    >
                                        <LogOut className="h-4 w-4 mr-3" />
                                        <span className="font-medium">Logout</span>
                                    </DropdownMenuItem>
                                </div>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </header>

            {/* Modals */}
            <AnnouncementsModal
                isOpen={isAnnouncementsOpen}
                onClose={() => setIsAnnouncementsOpen(false)}
                userAnnouncements={userAnnouncements}
            />
            <NotificationsModal
                isOpen={isNotificationsOpen}
                onClose={() => setIsNotificationsOpen(false)}
                userNotifications={userNotifications}
            />
            <OrganizationalChartModal
                isOpen={isOrgChartOpen}
                onClose={() => setIsOrgChartOpen(false)}
            />
            <EmployeeInfoModal
                isOpen={isEmployeeInfoOpen}
                onClose={() => setIsEmployeeInfoOpen(false)}
            />
            <DefectListModal isOpen={isDefectListOpen} onClose={() => setIsDefectListOpen(false)} />
            <CompanyInformationModal
                isOpen={isCompanyInfoOpen}
                onClose={() => setIsCompanyInfoOpen(false)}
            />
        </>
    );
}
