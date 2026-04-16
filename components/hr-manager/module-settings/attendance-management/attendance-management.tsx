"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AttendanceLogic } from "./blocks/attendance-logic";
import { HolidaySetup } from "./blocks/holiday-setup";
import { OvertimeConfiguration } from "./blocks/overtime-configuration";
import { ShiftHours } from "./blocks/shift-hours";
import { ShiftType } from "./blocks/shift-type";
import { useTheme } from "@/components/theme-provider";

function AttendanceManagementSettings() {
    const { theme } = useTheme();

    const titleColor = theme === "dark" ? "text-amber-200" : "text-amber-900";
    const subtitleColor = theme === "dark" ? "text-gray-300" : "text-slate-600";
    const listClass =
        theme === "dark"
            ? "bg-black border-gray-800 shadow-sm"
            : "bg-amber-50/60 border-amber-200 shadow-sm";

    const triggerClass = `
    px-3 md:px-4 py-2 rounded-lg text-sm font-medium transition
    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500
    disabled:opacity-50 disabled:cursor-not-allowed
    ${
    theme === "dark"
        ? `
        text-gray-300 hover:bg-gray-800
        data-[state=active]:bg-amber-700 data-[state=active]:text-white
      `
        : `
        text-slate-700 hover:bg-amber-100
        data-[state=active]:bg-amber-600 data-[state=active]:text-white
      `
}
  `;

    return (
        <section className="w-full p-4 md:p-6">
            <div className="mx-auto max-w-7xl space-y-6">
                <header>
                    <h1 className={`text-2xl md:text-3xl font-bold ${titleColor}`}>
                        Attendance Management
                    </h1>
                    <p className={`${subtitleColor}`}>
                        Configure attendance logic, holidays, shifts, and overtime settings.
                    </p>
                </header>

                <Tabs defaultValue="logic" className="w-full">
                    <div className="overflow-x-auto">
                        <TabsList
                            className={`inline-flex flex-nowrap gap-2 rounded-xl border p-1 ${listClass}`}
                        >
                            <TabsTrigger className={triggerClass} value="logic">
                                Attendance Logic
                            </TabsTrigger>
                            <TabsTrigger className={triggerClass} value="holidays">
                                Holiday Setup
                            </TabsTrigger>
                            <TabsTrigger className={triggerClass} value="shift-hours">
                                Shift Hours
                            </TabsTrigger>
                            <TabsTrigger className={triggerClass} value="shift-type">
                                Shift Type
                            </TabsTrigger>
                            <TabsTrigger className={triggerClass} value="overtime">
                                Overtime Configuration
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <TabsContent value="logic" className="mt-4">
                        <AttendanceLogic />
                    </TabsContent>
                    <TabsContent value="holidays" className="mt-4">
                        <HolidaySetup />
                    </TabsContent>
                    <TabsContent value="shift-hours" className="mt-4">
                        <ShiftHours />
                    </TabsContent>
                    <TabsContent value="shift-type" className="mt-4">
                        <ShiftType />
                    </TabsContent>
                    <TabsContent value="overtime" className="mt-4">
                        <OvertimeConfiguration />
                    </TabsContent>
                </Tabs>
            </div>
        </section>
    );
}

export default AttendanceManagementSettings;
