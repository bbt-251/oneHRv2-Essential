"use client";

import { Button } from "@/components/ui/button";
import { Target, Award, BarChart3, Settings, Users } from "lucide-react";

type PerformanceView = "objectives" | "competencies" | "reports" | "admin";

interface PerformanceNavigationProps {
    activeView: PerformanceView;
    onViewChange: (view: PerformanceView) => void;
}

export function PerformanceNavigation({ activeView, onViewChange }: PerformanceNavigationProps) {
    const navigationItems = [
        {
            id: "objectives" as const,
            label: "Objectives",
            icon: Target,
            roles: ["employee", "manager", "hr", "admin"],
        },
        {
            id: "competencies" as const,
            label: "Competencies",
            icon: Award,
            roles: ["employee", "manager", "hr", "admin"],
        },
        // {
        //     id: "reports" as const,
        //     label: "Reports",
        //     icon: Users,
        //     roles: ["manager", "hr", "admin"],
        // },
        // {
        //     id: "admin" as const,
        //     label: "Administration",
        //     icon: Settings,
        //     roles: ["hr", "admin"],
        // },
    ];

    return (
        <div className="bg-white rounded-xl border border-accent-200 p-2 shadow-sm dark:bg-card dark:border-border">
            <div className="flex gap-2 flex-wrap">
                {navigationItems.map(item => (
                    <Button
                        key={item.id}
                        variant={activeView === item.id ? "default" : "ghost"}
                        onClick={() => onViewChange(item.id)}
                        className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${
                            activeView === item.id
                                ? "bg-brand-600 text-white shadow-sm hover:bg-brand-700"
                                : "text-brand-600 hover:bg-accent-100 hover:text-brand-700 dark:text-muted-foreground dark:hover:bg-accent dark:hover:text-foreground"
                        }`}
                    >
                        <item.icon className="h-4 w-4" />
                        {item.label}
                    </Button>
                ))}
            </div>
        </div>
    );
}
