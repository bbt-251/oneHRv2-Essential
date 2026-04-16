"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { IssueTypeTab } from "./issue-type-tab";
import { IssueStatusTab } from "./issue-status-tab";
import { ImpactTypeTab } from "./impact-type-tab";
import { PriorityTab } from "./priority-tab";

export const IssueManagement = () => {
    const [activeSubTab, setActiveSubTab] = useState("issue-type");

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg font-semibold">Issue Management</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <p className="">Configure issue tracking and resolution settings.</p>

                <Tabs value={activeSubTab} onValueChange={setActiveSubTab} className="w-full">
                    <TabsList className="bg-amber-50/60 border border-amber-200 rounded-xl inline-flex flex-nowrap gap-2 dark:bg-gray-900 dark:border-gray-700">
                        <TabsTrigger
                            value="issue-type"
                            className="data-[state=active]:bg-amber-600 data-[state=active]:text-white rounded-lg px-4 py-2 dark:text-gray-300 dark:data-[state=active]:text-white"
                        >
                            Issue Type
                        </TabsTrigger>
                        <TabsTrigger
                            value="issue-status"
                            className="data-[state=active]:bg-amber-600 data-[state=active]:text-white rounded-lg px-4 py-2 dark:text-gray-300 dark:data-[state=active]:text-white"
                        >
                            Issue Status
                        </TabsTrigger>
                        <TabsTrigger
                            value="impact-type"
                            className="data-[state=active]:bg-amber-600 data-[state=active]:text-white rounded-lg px-4 py-2 dark:text-gray-300 dark:data-[state=active]:text-white"
                        >
                            Impact Type
                        </TabsTrigger>
                        <TabsTrigger
                            value="priority"
                            className="data-[state=active]:bg-amber-600 data-[state=active]:text-white rounded-lg px-4 py-2 dark:text-gray-300 dark:data-[state=active]:text-white"
                        >
                            Priority
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="issue-type" className="mt-6">
                        <IssueTypeTab />
                    </TabsContent>

                    <TabsContent value="issue-status" className="mt-6">
                        <IssueStatusTab />
                    </TabsContent>

                    <TabsContent value="impact-type" className="mt-6">
                        <ImpactTypeTab />
                    </TabsContent>

                    <TabsContent value="priority" className="mt-6">
                        <PriorityTab />
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
};
