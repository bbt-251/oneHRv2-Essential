"use client";

import { useTheme } from "@/components/theme-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/context/authContext";
import { ArrowRight, Download, FileText } from "lucide-react";
import { useState } from "react";
import { AddLeaveRequestModal } from "../../leave-management/modals/add-leave-request-modal";
import { PayslipModal } from "../modals/payslip-modal";

export function UsefulLinks() {
    const { theme } = useTheme();
    const { userData } = useAuth();

    const links = [
        {
            id: "leave-request",
            title: "Submit Leave Request",
            description: "Apply for time off quickly",
            icon: FileText,
            color: "bg-accent-100 hover:bg-accent-200 text-brand-700 border-accent-300",
            iconColor: "text-accent-600",
            disabled: !userData?.balanceLeaveDays || userData.balanceLeaveDays < 0,
        },
        {
            id: "download-payslip",
            title: "Download Pay Slip",
            description: "Get your latest pay statement",
            icon: Download,
            color: "bg-brand-50 hover:bg-brand-100 text-brand-800 border-brand-200",
            iconColor: "text-brand-600",
        },
    ];
    const [isLeaveModalOpen, setIsLeaveModalOpen] = useState<boolean>(false);
    const [isPayslipModalOpen, setIsPayslipModalOpen] = useState<boolean>(false);

    const handleLinkClick = (linkId: string) => {
        switch (linkId) {
            case "leave-request":
                setIsLeaveModalOpen(true);
                break;
            case "download-payslip":
                setIsPayslipModalOpen(true);
                break;
            default:
                break;
        }
    };

    return (
        <>
            <Card
                className={`shadow-sm h-fit ${theme === "dark" ? "bg-black" : "border-accent-200"}`}
            >
                <CardHeader className="pb-6 pt-6 px-6">
                    <CardTitle
                        className={`text-2xl font-bold ${theme === "dark" ? "text-white" : "text-brand-800"}`}
                    >
                        Quick Actions
                    </CardTitle>
                </CardHeader>
                <CardContent
                    className={`px-6 pb-6 space-y-4 ${theme === "dark" ? "bg-black" : "bg-white"}`}
                >
                    {links.map(link => (
                        <div
                            key={link.id}
                            className={`p-5 border rounded-xl cursor-pointer transition-all duration-300 group hover:shadow-md hover:scale-102 ${theme === "dark" ? "bg-black" : link.color}`}
                            onClick={() => (link.disabled ? null : handleLinkClick(link.id))}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4 flex-1">
                                    <div
                                        className={`p-3 rounded-xl shadow-sm ${theme === "dark" ? "bg-black" : "bg-white/60"}`}
                                    >
                                        <link.icon className={`h-5 w-5 ${link.iconColor}`} />
                                    </div>
                                    <div className="flex-1">
                                        <div
                                            className={`font-bold text-base mb-1 ${theme === "dark" ? "text-white" : "text-brand-800"}`}
                                        >
                                            {link.title}
                                        </div>
                                        <div
                                            className={`text-sm opacity-80 font-medium ${theme === "dark" ? "text-white" : "text-brand-800"}`}
                                        >
                                            {link.description}
                                        </div>
                                    </div>
                                </div>
                                <div className="ml-4">
                                    <ArrowRight
                                        className={`h-5 w-5 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all ${theme === "dark" ? "text-white" : "text-brand-800"}`}
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>

            <AddLeaveRequestModal
                open={isLeaveModalOpen}
                onOpenChange={() => setIsLeaveModalOpen(false)}
            />
            <PayslipModal
                isOpen={isPayslipModalOpen}
                onClose={() => setIsPayslipModalOpen(false)}
            />
        </>
    );
}
