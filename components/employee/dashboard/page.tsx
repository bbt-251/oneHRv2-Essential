"use client";

import { CalendarWidget } from "@/components/employee/dashboard/blocks/calendar-widget";
import { MetricsCards } from "@/components/employee/dashboard/blocks/metrics-cards";
import { UsefulLinks } from "./blocks/useful-links";
// import { ThemeProvider } from "@/components/pages/dashboard/theme-provider"
import { useAuth } from "@/context/authContext";
import { useTheme } from "@/components/theme-provider";

export function Dashboard() {
    const { userData } = useAuth();
    const { theme } = useTheme();

    return (
        <main className={`min-h-screen ${theme === "dark" ? "bg-black " : ""}`}>
            <div className="p-8 space-y-8 max-w-7xl mx-auto">
                <div className="text-center py-8">
                    <h1
                        className={`text-4xl font-bold ${theme === "dark" ? "text-slate-300" : "text-slate-600"}`}
                    >
                        Welcome back, {userData?.firstName}! 👋
                    </h1>
                    <p
                        className={`text-lg font-medium ${theme === "dark" ? "text-slate-300" : "text-slate-600"}`}
                    >
                        Here&apos;s what&apos;s happening with your team today.
                    </p>
                </div>

                <div className="mb-12">
                    <MetricsCards />
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                    <div className="xl:col-span-2">
                        <CalendarWidget />
                    </div>
                    <div className="xl:col-span-1">
                        <UsefulLinks />
                    </div>
                </div>
            </div>
        </main>
    );
}
