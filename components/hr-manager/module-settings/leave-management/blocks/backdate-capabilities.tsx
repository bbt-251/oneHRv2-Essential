"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import { useTheme } from "@/components/theme-provider";
import { cn } from "@/lib/utils";
import { useData } from "@/context/app-data-context";
import { hrSettingsService } from "@/lib/backend/hr-settings-service";
import { useToast } from "@/context/toastContext";
import { LEAVE_MANAGEMENT_LOG_MESSAGES } from "@/lib/log-descriptions/leave-management";
import { useAuth } from "@/context/authContext";

// Leave Types Component

// Backdate Capabi
export default function BackdateCapabilities() {
    const { ...hrSettings } = useData();
    const backdateCapabilities = hrSettings?.backdateCapabilities || [];

    const { theme } = useTheme();
    const { showToast } = useToast();
    const { userData } = useAuth();
    const [allowBackdatedRequests, setAllowBackdatedRequests] = useState<boolean>(
        backdateCapabilities[0]?.allowBackdatedRequests ?? false,
    );

    const handleUpdate = () => {
        const updateData = {
            allowBackdatedRequests: allowBackdatedRequests,
            updatedAt: new Date().toISOString(),
        };

        if (backdateCapabilities.length > 0) {
            hrSettingsService.update(
                "backdateCapabilities",
                backdateCapabilities[0].id,
                updateData,
                userData?.uid,
                LEAVE_MANAGEMENT_LOG_MESSAGES.BACKDATE_CAPABILITIES_UPDATED({
                    allowBackdatedRequests: allowBackdatedRequests,
                }),
            );
            showToast("Backdate capabilities updated successfully", "success", "success");
        } else {
            hrSettingsService.create(
                "backdateCapabilities",
                {
                    ...updateData,
                },
                userData?.uid,
                LEAVE_MANAGEMENT_LOG_MESSAGES.BACKDATE_CAPABILITIES_UPDATED({
                    allowBackdatedRequests: allowBackdatedRequests,
                }),
            );
            showToast("Backdate capabilities created successfully", "success", "success");
        }
    };

    return (
        <Card
            className={`${theme === "dark" ? "bg-black " : "bg-white/80 backdrop-blur-sm"} shadow-2xl rounded-2xl overflow-hidden`}
        >
            <CardHeader
                className={`${theme === "dark" ? "bg-black text-white" : "bg-amber-800 border-gray-200"} rounded-t-2xl`}
            >
                <CardTitle className={`text-xl font-bold text-white`}>
                    Backdate Capabilities
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex items-center space-x-3 mt-4">
                    <div className="relative">
                        <input
                            className={cn(
                                theme === "dark"
                                    ? "bg-black border-white"
                                    : "bg-white/80 backdrop-blur-sm border-0",
                                "sr-only",
                            )}
                            type="checkbox"
                            id="backdate-toggle"
                            checked={allowBackdatedRequests}
                            onChange={e => setAllowBackdatedRequests(e.target.checked)}
                        />
                        <label
                            htmlFor="backdate-toggle"
                            className={cn(
                                theme === "dark"
                                    ? "bg-black border-white"
                                    : "bg-white/80 backdrop-blur-sm border-0",
                                "flex items-center justify-center w-6 h-6 rounded border-2 cursor-pointer transition-colors",
                                allowBackdatedRequests
                                    ? "bg-blue-600 border-blue-600"
                                    : "bg-white border-gray-300 hover:border-gray-400",
                            )}
                        >
                            {allowBackdatedRequests && (
                                <svg
                                    className="w-4 h-4 text-white"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                >
                                    <path
                                        fillRule="evenodd"
                                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                            )}
                        </label>
                    </div>
                    <span
                        className={` font-medium ${theme === "dark" ? "text-white" : "text-black"}`}
                    >
                        Allow for backdated leave request to be submitted
                    </span>
                </div>

                <div
                    className={` p-4 rounded-lg ${theme === "dark" ? "bg-white/10 backdrop-blur-sm border-0" : "bg-gray-200 backdrop-blur-sm border-0"}`}
                >
                    <p
                        className={`text-gray-700 text-sm ${theme === "dark" ? "text-white" : "text-black"}`}
                    >
                        <strong>Note:</strong> A backdated leave request allows employees to submit
                        leave requests for past dates, typically when they couldn&apos;t apply in
                        advance due to unforeseen circumstances.
                    </p>
                </div>

                <div className="flex justify-center">
                    <Button
                        onClick={handleUpdate}
                        className="bg-gray-700 hover:bg-gray-800 text-white px-8 py-2"
                    >
                        Update
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
