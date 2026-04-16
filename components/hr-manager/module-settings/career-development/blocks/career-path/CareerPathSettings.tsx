"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TrackManagement from "./TrackManagement";
import RoleManagement from "./RoleManagement";
import { Network } from "lucide-react";
import CareerGraphBuilder from "./CareerGraphBuilder";

export default function CareerPathSettings() {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Career Path</h2>
                <p className="text-gray-600 mt-1 dark:text-gray-400">
                    Manage career tracks, roles, and visualize career progression paths
                </p>
            </div>

            <Tabs defaultValue="tracks" className="space-y-6">
                <TabsList className="bg-amber-50/60 border border-amber-200 rounded-xl inline-flex flex-nowrap gap-2 dark:bg-gray-900 dark:border-gray-700">
                    <TabsTrigger
                        value="tracks"
                        className="data-[state=active]:bg-amber-600 data-[state=active]:text-white rounded-lg px-4 py-2 dark:text-gray-300 dark:data-[state=active]:text-white"
                    >
                        Tracks
                    </TabsTrigger>
                    <TabsTrigger
                        value="roles"
                        className="data-[state=active]:bg-amber-600 data-[state=active]:text-white rounded-lg px-4 py-2 dark:text-gray-300 dark:data-[state=active]:text-white"
                    >
                        Roles
                    </TabsTrigger>
                    <TabsTrigger
                        value="graph"
                        className="data-[state=active]:bg-amber-600 data-[state=active]:text-white rounded-lg px-4 py-2 dark:text-gray-300 dark:data-[state=active]:text-white"
                    >
                        Graph Builder
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="tracks" className="space-y-4">
                    <TrackManagement />
                </TabsContent>

                <TabsContent value="roles" className="space-y-4">
                    <RoleManagement />
                </TabsContent>

                <TabsContent value="graph" className="space-y-4">
                    <CareerGraphBuilder />
                </TabsContent>
            </Tabs>
        </div>
    );
}
