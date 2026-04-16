"use client";

import { useTheme } from "@/components/theme-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function AttendanceLegend() {
    const { theme } = useTheme();

    const legendItems = [
        {
            status: "present",
            color:
                theme == "dark"
                    ? "bg-green-900 text-green-200 border-green-700 hover:bg-green-800"
                    : "bg-green-300 text-[#3f3d56] border-green-200 hover:bg-green-100",
            label: "Present",
        },
        {
            status: "half-present",
            color:
                theme == "dark"
                    ? "bg-yellow-900 text-yellow-200 border-yellow-700 hover:bg-yellow-800"
                    : "bg-yellow-300 text-[#3f3d56] border-yellow-200 hover:bg-yellow-400",
            label: "Half Present",
        },
        {
            status: "absent",
            color:
                theme == "dark"
                    ? "bg-red-900 text-red-200 border-red-700 hover:bg-red-800"
                    : "bg-red-50 text-[#3f3d56] border-red-200 hover:bg-red-100",
            label: "Absent",
        },
        {
            status: "leave",
            color:
                theme == "dark"
                    ? "bg-[#ed4ca2] text-white border-[#b93481] hover:bg-[#d0338f]"
                    : "bg-[#f4a3cc] text-[#7a0f5a] border-[#e066b3] hover:bg-[#e066b3]",
            label: "Leave",
        },
        {
            status: "holiday",
            color:
                theme == "dark"
                    ? "bg-yellow-900 text-yellow-100 border-yellow-700 hover:bg-yellow-800"
                    : "bg-[#ffe6a7] text-[#3f3d56] border-yellow-200 hover:bg-yellow-200",
            label: "Holiday",
        },
        {
            status: "weekend",
            color:
                theme == "dark"
                    ? "bg-blue-900 text-blue-200 border-blue-700 hover:bg-blue-800"
                    : "bg-blue-50 text-[#3f3d56] border-blue-200 hover:bg-blue-100",
            label: "Weekend",
        },
        {
            status: "future",
            color:
                theme == "dark"
                    ? "bg-gray-800 text-gray-500 border-gray-600 hover:bg-gray-700"
                    : "bg-gray-50 text-gray-400 border-gray-200 hover:bg-gray-100",
            label: "Future",
        },
    ];

    return (
        <Card
            className={`w-full border border-gray-200 shadow-sm ${theme === "dark" ? "border bg-black border-gray-800" : "bg-white"}`}
        >
            <CardHeader className="pb-4">
                <CardTitle
                    className={`text-lg font-semibold ${theme === "dark" ? "text-slate-300" : "text-[#3f3d56]"}`}
                    style={{ fontFamily: "Montserrat, sans-serif" }}
                >
                    Legend
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex flex-wrap gap-6">
                    {legendItems.map(item => (
                        <div key={item.status} className="flex items-center gap-3">
                            <div className={`w-6 h-6 rounded-full border ${item.color}`} />
                            <span
                                className={`text-sm font-medium ${theme === "dark" ? "text-slate-300" : "text-[#3f3d56]"}`}
                                style={{ fontFamily: "Montserrat, sans-serif" }}
                            >
                                {item.label}
                            </span>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
