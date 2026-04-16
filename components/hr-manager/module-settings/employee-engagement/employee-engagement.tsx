"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { IssueManagement } from "./blocks/issue-management";
import { DisciplinaryActionsManagement } from "./blocks/disciplinary-actions-management";
import { SurveyDynamicAnswers } from "./blocks/survey-dynamic-answers";
import { SuggestionsOptions } from "./blocks/suggestions-options";

export function EmployeeEngagement() {
    const [activeTab, setActiveTab] = useState("issue-management");

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Employee Engagement</h1>
                <p className=" mt-1">Configure employee engagement and feedback settings</p>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="bg-amber-50/60 border border-amber-200 rounded-xl inline-flex flex-nowrap gap-2 dark:bg-gray-900 dark:border-gray-700">
                    <TabsTrigger
                        value="issue-management"
                        className="data-[state=active]:bg-amber-600 data-[state=active]:text-white rounded-lg px-4 py-2 dark:text-gray-300 dark:data-[state=active]:text-white"
                    >
                        Issue Management
                    </TabsTrigger>
                    <TabsTrigger
                        value="disciplinary-actions"
                        className="data-[state=active]:bg-amber-600 data-[state=active]:text-white rounded-lg px-4 py-2 dark:text-gray-300 dark:data-[state=active]:text-white"
                    >
                        Disciplinary Actions Management
                    </TabsTrigger>
                    <TabsTrigger
                        value="survey-dynamic-answers"
                        className="data-[state=active]:bg-amber-600 data-[state=active]:text-white rounded-lg px-4 py-2 dark:text-gray-300 dark:data-[state=active]:text-white"
                    >
                        Survey Dynamic Answers
                    </TabsTrigger>
                    <TabsTrigger
                        value="suggestions-options"
                        className="data-[state=active]:bg-amber-600 data-[state=active]:text-white rounded-lg px-4 py-2 dark:text-gray-300 dark:data-[state=active]:text-white"
                    >
                        Suggestions Options
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="issue-management" className="mt-6">
                    <IssueManagement />
                </TabsContent>

                <TabsContent value="disciplinary-actions" className="mt-6">
                    <DisciplinaryActionsManagement />
                </TabsContent>

                <TabsContent value="survey-dynamic-answers" className="mt-6">
                    <SurveyDynamicAnswers />
                </TabsContent>

                <TabsContent value="suggestions-options" className="mt-6">
                    <SuggestionsOptions />
                </TabsContent>
            </Tabs>
        </div>
    );
}
