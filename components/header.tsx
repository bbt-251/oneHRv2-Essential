"use client";

import { useMemo, useState } from "react";
import { Bell, Building, LogOut, Mail, Search, Users } from "lucide-react";
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
import { NotificationsModal } from "./employee/dashboard/modals/notifications-modal";
import { OrganizationalChartModal } from "./employee/dashboard/modals/organizational-chart-modal";
import { EmployeeInfoModal } from "./employee/dashboard/modals/employee-info-modal";
import { useTheme } from "./theme-provider";
import { ClockInOut } from "./employee/dashboard/blocks/clock-in-out";
import { useAuth } from "@/context/authContext";
import { useData } from "@/context/data-provider";
import { CompanyInformationModal } from "./header/company-information-modal";
import InAppNotificationModel from "@/lib/models/notification";

export interface ExtendedNotificationModel extends InAppNotificationModel {
    isRead: boolean;
    isPinned: boolean;
}

export function Header() {
    const { userData, signout } = useAuth();
    const { notifications } = useData();
    const [isNotificationsOpen, setIsNotificationsOpen] = useState<boolean>(false);
    const [isOrgChartOpen, setIsOrgChartOpen] = useState<boolean>(false);
    const [isEmployeeInfoOpen, setIsEmployeeInfoOpen] = useState<boolean>(false);
    const [isCompanyInfoOpen, setIsCompanyInfoOpen] = useState<boolean>(false);
    const { theme, setTheme } = useTheme();

    const userNotifications: ExtendedNotificationModel[] = useMemo(() => {
        if (!userData || !notifications.length) return [];

        return notifications
            .filter(notification => notification.uid === userData.uid)
            .map(notification => ({
                ...notification,
                isRead: userData.notifications?.some(
                    item => item.id === notification.id && item.isRead,
                )
                    ? true
                    : false,
                isPinned: false,
            }));
    }, [notifications, userData]);

    const unreadNotifications = userNotifications.filter(
        notification => !notification.isRead,
    ).length;

    return (
        <>
            <header
                className="sticky top-0 z-50 flex h-16 items-center justify-between border-b px-6 backdrop-blur-sm"
                style={{
                    backgroundColor:
                        theme === "dark" ? "rgba(24, 24, 27, 0.95)" : "rgba(255, 255, 255, 0.95)",
                    borderColor:
                        theme === "dark" ? "rgba(144, 146, 159, 0.2)" : "rgba(229, 231, 235, 0.2)",
                }}
            >
                <div className="flex items-center gap-4">
                    <SidebarTrigger className="-ml-1 text-brand-500 dark:text-brand-300 dark:hover:bg-accent hover:bg-accent-100" />
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-brand-400 dark:text-brand-500" />
                        <Input
                            placeholder="Search..."
                            className="w-80 border-accent-300 bg-accent-50 pl-10 focus:border-brand-500 focus:ring-brand-500/20 dark:border-border dark:bg-input dark:text-foreground"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <ClockInOut variant="header" />

                    <Button
                        variant="ghost"
                        size="icon"
                        className="relative rounded-full hover:bg-accent-100 dark:hover:bg-accent"
                        onClick={() => setIsNotificationsOpen(true)}
                    >
                        <Bell className="h-5 w-5 text-brand-600 dark:text-brand-300" />
                        {unreadNotifications > 0 && (
                            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-danger-500 text-xs font-bold text-white">
                                {unreadNotifications}
                            </span>
                        )}
                    </Button>

                    <div className="ml-2 flex items-center gap-3">
                        <div className="text-right">
                            <p className="text-sm font-semibold text-brand-700 dark:text-brand-200">
                                {`${userData?.firstName} ${userData?.surname}`}
                            </p>
                        </div>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-auto rounded-full p-0">
                                    <Avatar className="h-9 w-9 ring-4 ring-white dark:ring-border">
                                        <AvatarImage
                                            src={userData?.profilePicture}
                                            alt="Profile Picture"
                                        />
                                        <AvatarFallback className="bg-brand-500 text-l font-bold text-white">
                                            {`${userData?.firstName?.at(0) ?? ""}${userData?.surname?.at(0) ?? ""}`}
                                        </AvatarFallback>
                                    </Avatar>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                align="end"
                                className="w-80 border-accent-300 p-0 shadow-xl dark:border-border dark:bg-card"
                            >
                                <div className="p-6">
                                    <div className="flex flex-col items-center space-y-4">
                                        <Avatar className="h-20 w-20 ring-4 ring-white dark:ring-border">
                                            <AvatarImage
                                                src={userData?.profilePicture}
                                                alt="Profile Picture"
                                            />
                                            <AvatarFallback className="bg-brand-500 text-2xl font-bold text-white">
                                                {`${userData?.firstName?.at(0) ?? ""}${userData?.surname?.at(0) ?? ""}`}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="text-center">
                                            <h3 className="text-xl font-bold text-brand-700 dark:text-foreground">
                                                {userData?.firstName}
                                            </h3>
                                            {userData?.role?.map(role => (
                                                <span
                                                    key={role}
                                                    className="inline-flex items-center rounded-full px-2 py-1 text-xs ring-1 ring-inset"
                                                >
                                                    {role}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3 border-b border-accent-200 p-4 dark:border-border">
                                    <div className="flex items-center gap-3 text-sm font-medium text-brand-600 dark:text-muted-foreground">
                                        <Mail className="h-4 w-4 text-accent-600 dark:text-accent-foreground" />
                                        <span>{userData?.personalEmail}</span>
                                    </div>
                                </div>

                                <div className="border-b border-accent-200 p-4 dark:border-border">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-semibold text-brand-700 dark:text-foreground">
                                            Dark Mode
                                        </span>
                                        <Switch
                                            className={
                                                theme === "dark" ? "bg-brand-200" : "bg-accent-800"
                                            }
                                            checked={theme === "dark"}
                                            onCheckedChange={() =>
                                                setTheme(theme === "dark" ? "light" : "dark")
                                            }
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1 p-2">
                                    <DropdownMenuItem
                                        className={`cursor-pointer rounded-lg p-3 ${theme === "dark" ? "hover:bg-slate-800" : "hover:bg-accent-100"}`}
                                        onClick={() => setIsOrgChartOpen(true)}
                                    >
                                        <Users className="mr-3 h-4 w-4 text-brand-600 dark:text-muted-foreground" />
                                        <span className="font-medium text-brand-700 dark:text-foreground">
                                            Organizational Chart
                                        </span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        className={`cursor-pointer rounded-lg p-3 ${theme === "dark" ? "hover:bg-slate-800" : "hover:bg-accent-100"}`}
                                        onClick={() => setIsEmployeeInfoOpen(true)}
                                    >
                                        <Mail className="mr-3 h-4 w-4 text-brand-600 dark:text-muted-foreground" />
                                        <span className="font-medium text-brand-700 dark:text-foreground">
                                            My Information
                                        </span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        className={`cursor-pointer rounded-lg p-3 ${theme === "dark" ? "hover:bg-slate-800" : "hover:bg-accent-100"}`}
                                        onClick={() => setIsCompanyInfoOpen(true)}
                                    >
                                        <Building className="mr-3 h-4 w-4 text-brand-600 dark:text-muted-foreground" />
                                        <span className="font-medium text-brand-700 dark:text-foreground">
                                            Company Information
                                        </span>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator className="dark:bg-border" />
                                    <DropdownMenuItem
                                        className="cursor-pointer rounded-lg p-3 text-danger-600 hover:bg-danger-50 dark:hover:bg-destructive/10"
                                        onClick={signout}
                                    >
                                        <LogOut className="mr-3 h-4 w-4" />
                                        <span className="font-medium">Logout</span>
                                    </DropdownMenuItem>
                                </div>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </header>

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
            <CompanyInformationModal
                isOpen={isCompanyInfoOpen}
                onClose={() => setIsCompanyInfoOpen(false)}
            />
        </>
    );
}
