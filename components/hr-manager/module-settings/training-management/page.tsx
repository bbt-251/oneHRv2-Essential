"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrainingCategory } from "./blocks/training-category";
import { TrainingComplexity } from "./blocks/training-complexity";
import { TrainingLength } from "./blocks/training-length";

export function TrainingManagementSettings() {
    return (
        <div className="space-y-6 dark:bg-black">
            <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Training Management
                </h2>
                <p className="text-gray-600 mt-1 dark:text-gray-400">
                    Configure training categories, lengths, and complexity levels
                </p>
            </div>

            <Tabs defaultValue="training-category" className="space-y-6">
                <TabsList className="bg-amber-50/60 border border-amber-200 rounded-xl inline-flex flex-nowrap gap-2 dark:bg-gray-900 dark:border-gray-700">
                    <TabsTrigger
                        value="training-category"
                        className="data-[state=active]:bg-amber-600 data-[state=active]:text-white rounded-lg px-4 py-2 dark:text-gray-300 dark:data-[state=active]:text-white"
                    >
                        Training Category
                    </TabsTrigger>
                    <TabsTrigger
                        value="training-length"
                        className="data-[state=active]:bg-amber-600 data-[state=active]:text-white rounded-lg px-4 py-2 dark:text-gray-300 dark:data-[state=active]:text-white"
                    >
                        Training Length
                    </TabsTrigger>
                    <TabsTrigger
                        value="training-complexity"
                        className="data-[state=active]:bg-amber-600 data-[state=active]:text-white rounded-lg px-4 py-2 dark:text-gray-300 dark:data-[state=active]:text-white"
                    >
                        Training Complexity
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="training-category" className="dark:bg-black">
                    <TrainingCategory />
                </TabsContent>

                <TabsContent value="training-length" className="dark:bg-black">
                    <TrainingLength />
                </TabsContent>

                <TabsContent value="training-complexity" className="dark:bg-black">
                    <TrainingComplexity />
                </TabsContent>
            </Tabs>
        </div>
    );
}
