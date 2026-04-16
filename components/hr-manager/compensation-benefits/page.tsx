"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard, DollarSign, FileText } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

const benefitCards = [
    {
        title: "Payroll",
        description: "View payslips, salary details, and payment history",
        icon: DollarSign,
        color: "bg-green-50 dark:bg-green-950",
        iconColor: "text-green-600 dark:text-green-400",
        hoverColor: "hover:bg-green-100 dark:hover:bg-green-900",
        content: "Access your payroll information, download payslips, and view salary breakdowns.",
        url: "/hr/payroll",
    },
    {
        title: "Employee Loan",
        description: "Apply for loans, check status, and manage repayments",
        icon: CreditCard,
        color: "bg-blue-50 dark:bg-blue-950",
        iconColor: "text-blue-600 dark:text-blue-400",
        hoverColor: "hover:bg-blue-100 dark:hover:bg-blue-900",
        content:
            "Apply for employee loans, track your application status, and manage loan repayments.",
        url: "/hr/employee-loan",
    },
    {
        title: "Payment & Deductions",
        description: "Track deductions, taxes, and other payment details",
        icon: FileText,
        color: "bg-orange-50 dark:bg-orange-950",
        iconColor: "text-orange-600 dark:text-orange-400",
        hoverColor: "hover:bg-orange-100 dark:hover:bg-orange-900",
        content:
            "View detailed breakdown of salary deductions, tax information, and payment history.",
        url: "/hr/payment-deduction",
    },
];

export function HRCompensationBenefits() {
    const router = useRouter();
    const handleCardClick = (card: (typeof benefitCards)[0]) => {
        router.push(card.url);
    };

    return (
        <div className="space-y-8 p-6">
            <div className="text-center py-12">
                <h1 className="text-5xl font-bold text-brand-800 mb-6 dark:text-foreground text-balance">
                    Compensation & Benefits
                </h1>
                <p className="text-xl text-brand-600 font-medium dark:text-muted-foreground max-w-2xl mx-auto text-pretty">
                    Manage your compensation, benefits, and financial information with ease
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
                {benefitCards.map(card => (
                    <Card
                        key={card.title}
                        onClick={() => handleCardClick(card)}
                        className={`cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-[1.02] border-2 hover:border-brand-400 dark:hover:border-brand-500 ${card.hoverColor} group`}
                    >
                        <CardHeader className="pb-6 pt-8">
                            <div
                                className={`w-20 h-20 rounded-2xl ${card.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}
                            >
                                <card.icon className={`h-10 w-10 ${card.iconColor}`} />
                            </div>
                            <CardTitle className="text-2xl font-bold text-brand-800 dark:text-foreground mb-3">
                                {card.title}
                            </CardTitle>
                            <CardDescription className="text-brand-600 dark:text-muted-foreground text-base leading-relaxed">
                                {card.description}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="pb-8">
                            <div className="flex items-center justify-between pt-4 border-t border-accent-200 dark:border-border">
                                <span className="text-base font-semibold text-brand-600 dark:text-muted-foreground group-hover:text-brand-800 dark:group-hover:text-foreground transition-colors">
                                    Click to access
                                </span>
                                <div className="w-8 h-8 rounded-full bg-brand-200 dark:bg-brand-800 flex items-center justify-center group-hover:bg-brand-300 dark:group-hover:bg-brand-700 transition-colors">
                                    <span className="text-brand-700 dark:text-brand-300 text-sm font-bold">
                                        →
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
