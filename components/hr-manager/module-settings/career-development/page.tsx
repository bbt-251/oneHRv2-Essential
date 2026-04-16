"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TransferTypeTab from "./blocks/transfer-type-tab";
import TransferReasonTab from "./blocks/transfer-reason-tab";

export function CareerDevelopmentSettings() {
    return (
        <div className="space-y-6 dark:bg-black">
            <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Career Development
                </h2>
                <p className="text-gray-600 mt-1 dark:text-gray-400">
                    Configure transfer types and reasons for employee career development
                </p>
            </div>

            <Tabs defaultValue="transfer-type" className="space-y-6">
                <TabsList className="bg-amber-50/60 border border-amber-200 rounded-xl inline-flex flex-nowrap gap-2 dark:bg-gray-900 dark:border-gray-700">
                    <TabsTrigger
                        value="transfer-type"
                        className="data-[state=active]:bg-amber-600 data-[state=active]:text-white rounded-lg px-4 py-2 dark:text-gray-300 dark:data-[state=active]:text-white"
                    >
                        Transfer Type
                    </TabsTrigger>
                    <TabsTrigger
                        value="transfer-reason"
                        className="data-[state=active]:bg-amber-600 data-[state=active]:text-white rounded-lg px-4 py-2 dark:text-gray-300 dark:data-[state=active]:text-white"
                    >
                        Transfer Reason
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="transfer-type" className="dark:bg-black">
                    <TransferTypeTab />
                </TabsContent>

                <TabsContent value="transfer-reason" className="dark:bg-black">
                    <TransferReasonTab />
                </TabsContent>
            </Tabs>
        </div>
    );
}
