"use client";

import type React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AnnouncementTypeTab from "./blocks/announcement-type-tab";
import CriticityTab from "./blocks/criticity-tab";
import { useTheme } from "@/components/theme-provider";

export function Announcement() {
    const { theme } = useTheme();
    return (
        <section className="w-full p-4 md:p-6">
            <div className="mx-auto max-w-7xl space-y-6">
                <header>
                    <h1
                        className={`text-2xl md:text-3xl font-bold ${theme === "dark" ? "text-white" : "text-amber-900"}`}
                    >
                        Announcement
                    </h1>
                    <p className="">Configure announcement types and criticity levels.</p>
                </header>

                <Tabs defaultValue="announcement-type" className="w-full">
                    <div className="overflow-x-auto">
                        <TabsList className="inline-flex flex-nowrap gap-2 bg-amber-50/60 border border-amber-200 rounded-xl">
                            <TabsTrigger
                                value="announcement-type"
                                className={`px-3 md:px-4 py-2 rounded-lg text-sm font-medium transition ${theme === "dark" ? "text-white " : "text-slate-700 "}`}
                            >
                                Announcement Type
                            </TabsTrigger>
                            <TabsTrigger
                                value="criticity"
                                className={`px-3 md:px-4 py-2 rounded-lg text-sm font-medium transition ${theme === "dark" ? "text-white " : "text-slate-700 "}`}
                            >
                                Criticity
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <TabsContent value="announcement-type" className="mt-4">
                        <AnnouncementTypeTab />
                    </TabsContent>
                    <TabsContent value="criticity" className="mt-4">
                        <CriticityTab />
                    </TabsContent>
                </Tabs>
            </div>
        </section>
    );
}
