"use client";

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { ChevronRight, LucideIcon } from "lucide-react";
import Link from "next/link";
import React from "react";

export interface Item {
    title: string;
    url?: string;
    icon?: LucideIcon;
    customIcon?: string;
    isActive?: boolean;
    items?: Item[];
}

interface SidebarSectionProps {
    role: "HR Manager" | "Manager" | "Employee" | "Payroll Officer";
    label: string;
    items: Item[];
    activePath: string;
    theme: "light" | "dark" | "system";
    attendanceLogic?: { chosenLogic: number };
}

export function SidebarSection({
    role,
    label,
    items,
    activePath,
    theme,
    attendanceLogic,
}: SidebarSectionProps) {
    const showAttendance = (url: string) => {
        if (role == "HR Manager") {
            return (
                url == "/hr/attendance-management" &&
                !(attendanceLogic?.chosenLogic === 3 || attendanceLogic?.chosenLogic === 4)
            );
        } else if (role == "Manager") {
            return url == "/overtime_requests" && attendanceLogic?.chosenLogic === 1;
        } else if (role == "Employee") {
            return (
                // here claimed overtime logic remains to be shown when:
                // attendanceLogic === 2
                url == "/attendance-management" &&
                !(attendanceLogic?.chosenLogic === 3 || attendanceLogic?.chosenLogic === 4)
            );
        }
        return false;
    };

    return (
        <SidebarGroup className="mt-2">
            <SidebarGroupLabel className="text-xs font-bold text-brand-600 uppercase tracking-wider mb-4 px-4 dark:text-muted-foreground">
                {label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
                <SidebarMenu className="space-y-2">
                    {items.map((item, index) =>
                        showAttendance(item.url ?? "") ? (
                            <React.Fragment key={`fragment-${index}`}></React.Fragment>
                        ) : item.items ? (
                            <Collapsible key={`collapsible-${item.title}`}>
                                <SidebarMenuItem>
                                    <CollapsibleTrigger asChild>
                                        <SidebarMenuButton
                                            className={`w-full justify-between hover:bg-accent-200 rounded-lg group py-3 px-4 hover:dark:bg-gray-600 ${
                                                activePath == item.url
                                                    ? `bg-accent-200 ${theme == "dark" ? "bg-gray-600" : ""}`
                                                    : ""
                                            } ${
                                                theme === "dark"
                                                    ? "hover:bg-gray-600"
                                                    : "hover:bg-accent-200"
                                            }`}
                                        >
                                            <div className={`flex items-center gap-3`}>
                                                {item.icon ? (
                                                    <item.icon className="h-5 w-5 text-brand-500 group-hover:text-brand-700 dark:text-muted-foreground dark:group-hover:text-foreground flex-shrink-0" />
                                                ) : item.customIcon ? (
                                                    <img
                                                        src={item.customIcon}
                                                        className="h-5 w-5 text-brand-500 group-hover:text-brand-700 dark:invert flex-shrink-0"
                                                        alt={item.title}
                                                    />
                                                ) : null}
                                                <span
                                                    className={`font-semibold truncate text-left} ${
                                                        theme === "dark"
                                                            ? "text-white"
                                                            : "text-black"
                                                    }`}
                                                >
                                                    {item.title}
                                                </span>
                                            </div>
                                            <ChevronRight className="h-4 w-4 text-brand-400 group-data-[state=open]:rotate-90 transition-transform dark:text-muted-foreground flex-shrink-0" />
                                        </SidebarMenuButton>
                                    </CollapsibleTrigger>
                                    <CollapsibleContent>
                                        <SidebarMenuSub className="ml-8 mt-2 space-y-1">
                                            {item.items?.map(subItem =>
                                                showAttendance(subItem.url ?? "") ? (
                                                    <React.Fragment
                                                        key={`fragment-${subItem.title}`}
                                                    />
                                                ) : (
                                                    <SidebarMenuSubItem
                                                        key={`subitem-${subItem.title}`}
                                                    >
                                                        <SidebarMenuSubButton
                                                            asChild
                                                            className={`rounded-md py-2 px-3 ${
                                                                theme === "dark"
                                                                    ? "hover:bg-gray-600"
                                                                    : "hover:bg-accent-200"
                                                            }`}
                                                        >
                                                            <Link
                                                                href={subItem.url ?? ""}
                                                                className={`text-sm font-medium truncate text-left flex-shrink-0 ${
                                                                    subItem.url === activePath
                                                                        ? `bg-accent-200 text-accent-foreground ${theme == "dark" ? "bg-gray-600" : ""}`
                                                                        : "text-foreground hover:bg-accent hover:text-accent-foreground"
                                                                } ${
                                                                    theme === "dark"
                                                                        ? "text-white"
                                                                        : "text-black"
                                                                }`}
                                                            >
                                                                {subItem.title}
                                                            </Link>
                                                        </SidebarMenuSubButton>
                                                    </SidebarMenuSubItem>
                                                ),
                                            )}
                                        </SidebarMenuSub>
                                    </CollapsibleContent>
                                </SidebarMenuItem>
                            </Collapsible>
                        ) : (
                            <SidebarMenuItem key={`item-${item.title}`}>
                                <SidebarMenuButton
                                    className="hover:dark:bg-gray-600 hover:bg-accent-200"
                                    asChild
                                >
                                    {item.url?.startsWith("http") ? (
                                        <a
                                            href={item.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className={`flex items-center gap-3 py-3 px-4 rounded-lg transition-colors duration-200 ${
                                                item.url === activePath
                                                    ? `bg-accent-200 text-accent-foreground ${theme == "dark" ? "bg-gray-600" : ""}`
                                                    : "text-foreground hover:bg-accent hover:text-accent-foreground"
                                            }`}
                                        >
                                            {item.icon ? (
                                                <item.icon
                                                    className={`h-5 w-5 flex-shrink-0 ${
                                                        theme === "dark"
                                                            ? "text-white"
                                                            : "text-black"
                                                    }`}
                                                />
                                            ) : item.customIcon ? (
                                                <img
                                                    src={item.customIcon}
                                                    className="h-5 w-5 flex-shrink-0 dark:invert"
                                                    alt={item.title}
                                                />
                                            ) : null}
                                            <span
                                                className={`font-semibold truncate text-left ${
                                                    theme === "dark" ? "text-white" : "text-black"
                                                }`}
                                            >
                                                {item.title}
                                            </span>
                                        </a>
                                    ) : (
                                        <Link
                                            href={item.url ?? ""}
                                            className={`flex items-center gap-3 py-3 px-4 rounded-lg transition-colors duration-200 ${
                                                item.url === activePath
                                                    ? `bg-accent-200 text-accent-foreground ${theme == "dark" ? "bg-gray-600" : ""}`
                                                    : "text-foreground hover:bg-accent hover:text-accent-foreground"
                                            }`}
                                        >
                                            {item.icon ? (
                                                <item.icon
                                                    className={`h-5 w-5 flex-shrink-0 ${
                                                        theme === "dark"
                                                            ? "text-white"
                                                            : "text-black"
                                                    }`}
                                                />
                                            ) : item.customIcon ? (
                                                <img
                                                    src={item.customIcon}
                                                    className="h-5 w-5 flex-shrink-0 dark:invert"
                                                    alt={item.title}
                                                />
                                            ) : null}
                                            <span
                                                className={`font-semibold truncate text-left ${
                                                    theme === "dark" ? "text-white" : "text-black"
                                                }`}
                                            >
                                                {item.title}
                                            </span>
                                        </Link>
                                    )}
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        ),
                    )}
                </SidebarMenu>
            </SidebarGroupContent>
        </SidebarGroup>
    );
}
