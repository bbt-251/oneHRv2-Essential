"use client";

import { useTheme } from "@/components/theme-provider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import EvaluationCampaignsPage from "./evaluation-campaigns/page";
import MonitoringPeriodsPage from "./monitoring-periods/page";
import PeriodicOptionPage from "./periodic-option/page";

export default function PerformanceManagement() {
    const [activeTab, setActiveTab] = useState<string>("periodic-option");
    const { theme } = useTheme();

    return (
        <div className="space-y-6">
            <div>
                <h1
                    className={`text-2xl font-bold ${theme === "dark" ? "text-white" : "text-gray-900"}`}
                >
                    Performance Management
                </h1>
                <p className={`mt-1 ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>
                    Configure performance evaluation settings and monitoring
                </p>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList
                    className={`${
                        theme === "dark"
                            ? "bg-black border border-gray-700"
                            : "bg-amber-50/60 border border-amber-200"
                    } rounded-xl p-1 inline-flex flex-nowrap gap-2`}
                >
                    <TabsTrigger
                        value="periodic-option"
                        className={`${
                            theme === "dark"
                                ? "data-[state=active]:bg-black data-[state=active]:text-amber-400 text-gray-300"
                                : "data-[state=active]:bg-white data-[state=active]:text-amber-700"
                        } data-[state=active]:shadow-sm rounded-lg px-4 py-2 text-sm font-medium transition-all`}
                    >
                        Periodic Option
                    </TabsTrigger>
                    <TabsTrigger
                        value="evaluation-campaigns"
                        className={`${
                            theme === "dark"
                                ? "data-[state=active]:bg-black data-[state=active]:text-amber-400 text-gray-300"
                                : "data-[state=active]:bg-white data-[state=active]:text-amber-700"
                        } data-[state=active]:shadow-sm rounded-lg px-4 py-2 text-sm font-medium transition-all`}
                    >
                        Evaluation Campaigns
                    </TabsTrigger>
                    <TabsTrigger
                        value="monitoring-periods"
                        className={`${
                            theme === "dark"
                                ? "data-[state=active]:bg-black data-[state=active]:text-amber-400 text-gray-300"
                                : "data-[state=active]:bg-white data-[state=active]:text-amber-700"
                        } data-[state=active]:shadow-sm rounded-lg px-4 py-2 text-sm font-medium transition-all`}
                    >
                        Monitoring Periods
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="periodic-option" className="mt-6">
                    <PeriodicOptionPage />
                </TabsContent>

                <TabsContent value="evaluation-campaigns" className="mt-6">
                    <EvaluationCampaignsPage />
                </TabsContent>

                <TabsContent value="monitoring-periods" className="mt-6">
                    <MonitoringPeriodsPage />
                </TabsContent>
            </Tabs>
        </div>
    );
}
