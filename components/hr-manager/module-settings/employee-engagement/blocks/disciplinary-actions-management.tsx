"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ViolationTypeTab } from "./violation-type-tab";
import { DisciplinaryTypeTab } from "./disciplinary-type-tab";

export const DisciplinaryActionsManagement = () => {
    const [activeSubTab, setActiveSubTab] = useState("violation-type");

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg font-semibold">
                    Disciplinary Actions Management
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <p className="">Manage disciplinary action types and procedures.</p>

                <Tabs value={activeSubTab} onValueChange={setActiveSubTab} className="w-full">
                    <TabsList className="bg-amber-50/60 border border-amber-200 rounded-xl inline-flex flex-nowrap gap-2 dark:bg-gray-900 dark:border-gray-700">
                        <TabsTrigger
                            value="violation-type"
                            className="data-[state=active]:bg-amber-600 data-[state=active]:text-white rounded-lg px-4 py-2 dark:text-gray-300 dark:data-[state=active]:text-white"
                        >
                            Violation Type
                        </TabsTrigger>
                        <TabsTrigger
                            value="disciplinary-type"
                            className="data-[state=active]:bg-amber-600 data-[state=active]:text-white rounded-lg px-4 py-2 dark:text-gray-300 dark:data-[state=active]:text-white"
                        >
                            Disciplinary Type
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="violation-type" className="mt-6">
                        <ViolationTypeTab />
                    </TabsContent>

                    <TabsContent value="disciplinary-type" className="mt-6">
                        <DisciplinaryTypeTab />
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
};
