"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";
import { HrReportingDashboard } from "./reporting-dashboard";

export default function ReportsAnalyticsPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
                    <BarChart3 className="w-5 h-5 text-primary" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Reports &amp; Analytics</h1>
                    <p className="text-sm text-muted-foreground">
                        Objective-setting compliance and performance evaluation overview for HR.
                    </p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">Custom HR Reports</CardTitle>
                    <CardDescription>
                        Build and save multi-chart HR reports for objectives, performance, and
                        alignment.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <HrReportingDashboard />
                </CardContent>
            </Card>
        </div>
    );
}
