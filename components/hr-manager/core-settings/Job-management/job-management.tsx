"use client";

import { useTheme } from "@/components/theme-provider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ContractHour from "./blocks/contract-hour";
import ContractType from "./blocks/contract-type";
import GradeDefinition from "./blocks/grade-definition";
import PositionDefinition from "./blocks/position-definition/position-definition";
import ProbationEndPeriod from "./blocks/probation-end-period";
import ReasonForLeaving from "./blocks/reason-for-leaving";
import SalaryScale from "./blocks/salary-scale";

function JobManagement() {
    const { theme } = useTheme();

    return (
        <section className="w-full p-4 md:p-6">
            <div className="mx-auto max-w-6xl space-y-6">
                <header>
                    <h1
                        className={`text-2xl md:text-3xl font-bold ${
                            theme === "dark" ? "text-white" : "text-amber-900"
                        }`}
                    >
                        Job Management
                    </h1>
                    <p
                        className={`text-slate-600 ${
                            theme === "dark" ? "text-white" : "text-slate-600"
                        }`}
                    >
                        Configure grades, positions, contracts, probation, and salary scales.
                    </p>
                </header>

                <Tabs defaultValue="grade" className="w-full">
                    <div className="overflow-x-auto">
                        <TabsList
                            className={`inline-flex flex-nowrap gap-2 rounded-xl transition-colors ${
                                theme === "dark"
                                    ? "bg-slate-800 border border-slate-700"
                                    : "bg-amber-50/60 border border-amber-200"
                            }`}
                        >
                            <TabsTrigger
                                value="grade"
                                className={`transition-colors ${
                                    theme === "dark"
                                        ? "data-[state=active]:bg-black data-[state=active]:text-white hover:bg-black/50"
                                        : "data-[state=active]:bg-white data-[state=active]:text-amber-900 hover:bg-amber-100"
                                }`}
                            >
                                Grade Definition
                            </TabsTrigger>
                            <TabsTrigger
                                value="position"
                                className={`transition-colors ${
                                    theme === "dark"
                                        ? "data-[state=active]:bg-black data-[state=active]:text-white hover:bg-black/50"
                                        : "data-[state=active]:bg-white data-[state=active]:text-amber-900 hover:bg-amber-100"
                                }`}
                            >
                                Position Definition
                            </TabsTrigger>
                            <TabsTrigger
                                value="contractType"
                                className={`transition-colors ${
                                    theme === "dark"
                                        ? "data-[state=active]:bg-black data-[state=active]:text-white hover:bg-black/50"
                                        : "data-[state=active]:bg-white data-[state=active]:text-amber-900 hover:bg-amber-100"
                                }`}
                            >
                                Contract Type
                            </TabsTrigger>
                            <TabsTrigger
                                value="contractHour"
                                className={`transition-colors ${
                                    theme === "dark"
                                        ? "data-[state=active]:bg-black data-[state=active]:text-white hover:bg-black/50"
                                        : "data-[state=active]:bg-white data-[state=active]:text-amber-900 hover:bg-amber-100"
                                }`}
                            >
                                Contract Hour
                            </TabsTrigger>
                            <TabsTrigger
                                value="reasonLeaving"
                                className={`transition-colors ${
                                    theme === "dark"
                                        ? "data-[state=active]:bg-black data-[state=active]:text-white hover:bg-black/50"
                                        : "data-[state=active]:bg-white data-[state=active]:text-amber-900 hover:bg-amber-100"
                                }`}
                            >
                                Reason for Leaving
                            </TabsTrigger>
                            <TabsTrigger
                                value="probation"
                                className={`transition-colors ${
                                    theme === "dark"
                                        ? "data-[state=active]:bg-black data-[state=active]:text-white hover:bg-black/50"
                                        : "data-[state=active]:bg-white data-[state=active]:text-amber-900 hover:bg-amber-100"
                                }`}
                            >
                                Probation End Period
                            </TabsTrigger>
                            <TabsTrigger
                                value="salary"
                                className={`transition-colors ${
                                    theme === "dark"
                                        ? "data-[state=active]:bg-black data-[state=active]:text-white hover:bg-black/50"
                                        : "data-[state=active]:bg-white data-[state=active]:text-amber-900 hover:bg-amber-100"
                                }`}
                            >
                                Salary Scale
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <TabsContent value="grade" className="mt-4">
                        <GradeDefinition />
                    </TabsContent>

                    <TabsContent value="position" className="mt-4">
                        <PositionDefinition />
                    </TabsContent>

                    <TabsContent value="contractType" className="mt-4">
                        <ContractType />
                    </TabsContent>
                    <TabsContent value="contractHour" className="mt-4">
                        <ContractHour />
                    </TabsContent>
                    <TabsContent value="reasonLeaving" className="mt-4">
                        <ReasonForLeaving />
                    </TabsContent>

                    <TabsContent value="probation" className="mt-4">
                        <ProbationEndPeriod />
                    </TabsContent>

                    <TabsContent value="salary" className="mt-4">
                        <SalaryScale />
                    </TabsContent>
                </Tabs>
            </div>
        </section>
    );
}

export { JobManagement };
export default JobManagement;
