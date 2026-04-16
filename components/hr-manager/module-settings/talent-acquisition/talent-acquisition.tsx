"use client";

import type React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import HiringNeedTypeTab from "./blocks/hiring-need-type-tab";
import LevelOfEducationTab from "./blocks/level-of-education-tab";
import YearsOfExperienceTab from "./blocks/years-of-experience-tab";
import CategoryTab from "./blocks/category-tab";
import IndustryTab from "./blocks/industry-tab";
import { useTheme } from "@/components/theme-provider";

export function TalentAcquisition() {
    const { theme } = useTheme();
    return (
        <section className="w-full p-4 md:p-6">
            <div className="mx-auto max-w-7xl space-y-6">
                <header>
                    <h1
                        className={`text-2xl md:text-3xl font-bold ${theme === "dark" ? "text-white" : "text-amber-900"}`}
                    >
                        Talent Acquisition
                    </h1>
                    <p className="">
                        Configure hiring needs, education requirements, and experience levels.
                    </p>
                </header>

                <Tabs defaultValue="hiring-need-type" className="w-full">
                    <div className="overflow-x-auto">
                        <TabsList className="inline-flex flex-nowrap gap-2 bg-amber-50/60 border border-amber-200 rounded-xl">
                            <TabsTrigger
                                value="hiring-need-type"
                                className={`px-3 md:px-4 py-2 rounded-lg text-sm font-medium transition ${theme === "dark" ? "text-white " : "text-slate-700 "}`}
                            >
                                Hiring Need Type
                            </TabsTrigger>
                            <TabsTrigger
                                value="level-of-education"
                                className={`px-3 md:px-4 py-2 rounded-lg text-sm font-medium transition ${theme === "dark" ? "text-white " : "text-slate-700 "}`}
                            >
                                Level of Education
                            </TabsTrigger>
                            <TabsTrigger
                                value="years-of-experience"
                                className={`px-3 md:px-4 py-2 rounded-lg text-sm font-medium transition ${theme === "dark" ? "text-white " : "text-slate-700 "}`}
                            >
                                Years of Experience
                            </TabsTrigger>
                            <TabsTrigger
                                value="category"
                                className={`px-3 md:px-4 py-2 rounded-lg text-sm font-medium transition ${theme === "dark" ? "text-white " : "text-slate-700 "}`}
                            >
                                Category
                            </TabsTrigger>
                            <TabsTrigger
                                value="industry"
                                className={`px-3 md:px-4 py-2 rounded-lg text-sm font-medium transition ${theme === "dark" ? "text-white " : "text-slate-700 "}`}
                            >
                                Industry
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <TabsContent value="hiring-need-type" className="mt-4">
                        <HiringNeedTypeTab />
                    </TabsContent>
                    <TabsContent value="level-of-education" className="mt-4">
                        <LevelOfEducationTab />
                    </TabsContent>
                    <TabsContent value="years-of-experience" className="mt-4">
                        <YearsOfExperienceTab />
                    </TabsContent>
                    <TabsContent value="category" className="mt-4">
                        <CategoryTab />
                    </TabsContent>
                    <TabsContent value="industry" className="mt-4">
                        <IndustryTab />
                    </TabsContent>
                </Tabs>
            </div>
        </section>
    );
}
