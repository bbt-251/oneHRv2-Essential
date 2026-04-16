"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { useTheme } from "@/components/theme-provider";
import LeaveTypes from "./blocks/Leave-types";
import BackdateCapabilities from "./blocks/backdate-capabilities";
import EligibleLeaveDaysConfiguration from "./blocks/eligible-leave-days-configuration";
import AccrualConfiguration from "./blocks/accrual-configuration";

export default function HrLeaveManagement() {
    const [activeTab, setActiveTab] = useState<string>("leave-types");
    const { theme } = useTheme();
    return (
        <div className="space-y-6">
            <div>
                <h2
                    className={`text-2xl font-bold mb-2 ${theme === "dark" ? "text-white" : "text-black"}`}
                >
                    Leave Management
                </h2>
                <p className={` ${theme === "dark" ? "text-white" : "text-black"}`}>
                    Configure leave policies, types, and accrual settings for your organization.
                </p>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <div className="overflow-x-auto">
                    <TabsList
                        className={`inline-flex flex-nowrap gap-2 rounded-xl transition-colors ${theme === "dark" ? "bg-gray-800 border border-gray-700" : "bg-amber-50/60 border border-amber-200"}`}
                    >
                        <TabsTrigger
                            value="leave-types"
                            className={`transition-colors ${theme === "dark" ? "data-[state=active]:bg-black data-[state=active]:text-white hover:bg-black/50" : "data-[state=active]:bg-white data-[state=active]:text-amber-900 hover:bg-amber-100"}`}
                        >
                            Leave Types
                        </TabsTrigger>
                        <TabsTrigger
                            value="backdate-capabilities"
                            className={`transition-colors ${theme === "dark" ? "data-[state=active]:bg-black data-[state=active]:text-white hover:bg-black/50" : "data-[state=active]:bg-white data-[state=active]:text-amber-900 hover:bg-amber-100"}`}
                        >
                            Backdate Capabilities
                        </TabsTrigger>
                        <TabsTrigger
                            value="eligible-leave-days"
                            className={`transition-colors ${theme === "dark" ? "data-[state=active]:bg-black data-[state=active]:text-white hover:bg-black/50" : "data-[state=active]:bg-white data-[state=active]:text-amber-900 hover:bg-amber-100"}`}
                        >
                            Eligible Leave Days Configuration
                        </TabsTrigger>
                        <TabsTrigger
                            value="accrual-configuration"
                            className={`transition-colors ${theme === "dark" ? "data-[state=active]:bg-black data-[state=active]:text-white hover:bg-black/50" : "data-[state=active]:bg-white data-[state=active]:text-amber-900 hover:bg-amber-100"}`}
                        >
                            Accrual Configuration
                        </TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="leave-types" className="mt-4">
                    <LeaveTypes />
                </TabsContent>

                <TabsContent value="backdate-capabilities" className="mt-4">
                    <BackdateCapabilities />
                </TabsContent>

                <TabsContent value="eligible-leave-days" className="mt-4">
                    <EligibleLeaveDaysConfiguration />
                </TabsContent>

                <TabsContent value="accrual-configuration" className="mt-4">
                    <AccrualConfiguration />
                </TabsContent>
            </Tabs>
        </div>
    );
}
