"use client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { useTheme } from "@/components/theme-provider";
import { TrainingMaterialRequest } from "./blocks/training-material-request/training-material-request";
import { TrainingPath } from "./blocks/training-path/training-path";
import { TrainingSchedule } from "./blocks/training-schedule/training-schedule";
import { TrainingMaterial } from "./blocks/training-material/training-material-request";

export function LearningHRManagement() {
    const { theme } = useTheme();
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-brand-800 dark:text-foreground">
                        Learning Management
                    </h1>
                    <p className="text-brand-600 dark:text-muted-foreground mt-1">
                        Manage training materials, paths, and schedules for your team
                    </p>
                </div>
            </div>

            <Tabs defaultValue="training-material-request" className="space-y-6">
                <TabsList className="grid w-full grid-cols-4 bg-white dark:bg-card border border-accent-200 dark:border-border">
                    <TabsTrigger
                        value="training-material-request"
                        className="data-[state=active]:bg-brand-50 data-[state=active]:text-brand-700 data-[state=active]:border-brand-200 font-semibold dark:data-[state=active]:bg-accent dark:data-[state=active]:text-accent-foreground"
                    >
                        Training Material Request
                    </TabsTrigger>
                    <TabsTrigger
                        value="training-material"
                        className="data-[state=active]:bg-brand-50 data-[state=active]:text-brand-700 data-[state=active]:border-brand-200 font-semibold dark:data-[state=active]:bg-accent dark:data-[state=active]:text-accent-foreground"
                    >
                        Training Material
                    </TabsTrigger>
                    <TabsTrigger
                        value="training-path"
                        className="data-[state=active]:bg-brand-50 data-[state=active]:text-brand-700 data-[state=active]:border-brand-200 font-semibold dark:data-[state=active]:bg-accent dark:data-[state=active]:text-accent-foreground"
                    >
                        Training Path
                    </TabsTrigger>
                    <TabsTrigger
                        value="training-schedule"
                        className="data-[state=active]:bg-brand-50 data-[state=active]:text-brand-700 data-[state=active]:border-brand-200 font-semibold dark:data-[state=active]:bg-accent dark:data-[state=active]:text-accent-foreground"
                    >
                        Training Schedule
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="training-material-request">
                    <TrainingMaterialRequest />
                </TabsContent>

                <TabsContent value="training-material">
                    <TrainingMaterial />
                </TabsContent>

                <TabsContent value="training-path">
                    <TrainingPath />
                </TabsContent>

                <TabsContent value="training-schedule">
                    <TrainingSchedule />
                </TabsContent>
            </Tabs>
        </div>
    );
}
