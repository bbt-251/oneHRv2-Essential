"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { FileText } from "lucide-react";
import { Currency } from "./blocks/currency";
import { DeductionType } from "./blocks/deduction-type";
import { LoanType } from "./blocks/loan-type";
import { PaymentType } from "./blocks/payment-type";
import { Pension } from "./blocks/pension";
import { TaxConfiguration } from "./blocks/tax-config";
import { useData } from "@/context/app-data-context";
import {
    savePayrollPDFSettings,
    getPayrollPDFSettings,
} from "@/lib/backend/api/payroll-settings-service";
import { FileDocumentModel } from "@/lib/models/file-document";

interface PayslipSettingsData {
    headerID: string;
    footerID: string;
    stampID: string;
    signatureID: string;
}

function PayslipSettings() {
    const { ...hrSettings } = useData();
    const [settings, setSettings] = useState<PayslipSettingsData>({
        headerID: "",
        footerID: "",
        stampID: "",
        signatureID: "",
    });
    const [isSaving, setIsSaving] = useState<boolean>(false);
    const [showSuccess, setShowSuccess] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    // Get document options from the shared app data layer
    const headerOptions: FileDocumentModel[] = hrSettings.headerDocuments || [];
    const footerOptions: FileDocumentModel[] = hrSettings.footerDocuments || [];
    const signatureOptions: FileDocumentModel[] = hrSettings.signatureDocuments || [];
    const stampOptions: FileDocumentModel[] = hrSettings.stampDocuments || [];

    // Load existing settings on mount
    useEffect(() => {
        async function loadSettings() {
            try {
                const existingSettings = await getPayrollPDFSettings();
                if (existingSettings) {
                    setSettings({
                        headerID: existingSettings.header || "",
                        footerID: existingSettings.footer || "",
                        stampID: existingSettings.stamp || "",
                        signatureID: existingSettings.signature || "",
                    });
                }
            } catch (error) {
                console.error("Error loading payslip settings:", error);
            } finally {
                setIsLoading(false);
            }
        }
        loadSettings();
    }, []);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const result = await savePayrollPDFSettings(settings);
            if (result) {
                setShowSuccess(true);
                setTimeout(() => setShowSuccess(false), 3000);
            }
        } catch (error) {
            console.error("Error saving payslip settings:", error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleChange = (field: keyof PayslipSettingsData, value: string) => {
        setSettings(prev => ({ ...prev, [field]: value }));
    };

    const handleClear = (field: keyof PayslipSettingsData) => {
        setSettings(prev => ({ ...prev, [field]: "" }));
    };

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                        Payslip Settings Configuration
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-center py-8">
                        <div className="text-slate-500 dark:text-slate-400">
                            Loading settings...
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                    Payslip Settings Configuration
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <p className="text-sm text-slate-600 dark:text-slate-300">
                    Configure the document elements that will appear on generated payslips. Select
                    from available headers, footers, stamps, and signatures defined in Document
                    Management.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Header Selection */}
                    <div className="space-y-2">
                        <Label
                            htmlFor="header"
                            className="text-sm font-medium text-slate-700 dark:text-slate-300"
                        >
                            Payslip Header
                        </Label>
                        <div className="flex gap-2">
                            <Select
                                value={settings.headerID}
                                onValueChange={value => handleChange("headerID", value)}
                            >
                                <SelectTrigger id="header" className="w-full">
                                    <SelectValue placeholder="Select a header..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {headerOptions.map(header => (
                                        <SelectItem key={header.id} value={header.id}>
                                            {header.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {settings.headerID && (
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => handleClear("headerID")}
                                    className="shrink-0"
                                    title="Clear selection"
                                >
                                    <span className="text-xs">✕</span>
                                </Button>
                            )}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            Select the header template to display at the top of payslips
                        </p>
                    </div>

                    {/* Footer Selection */}
                    <div className="space-y-2">
                        <Label
                            htmlFor="footer"
                            className="text-sm font-medium text-slate-700 dark:text-slate-300"
                        >
                            Payslip Footer
                        </Label>
                        <div className="flex gap-2">
                            <Select
                                value={settings.footerID}
                                onValueChange={value => handleChange("footerID", value)}
                            >
                                <SelectTrigger id="footer" className="w-full">
                                    <SelectValue placeholder="Select a footer..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {footerOptions.map(footer => (
                                        <SelectItem key={footer.id} value={footer.id}>
                                            {footer.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {settings.footerID && (
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => handleClear("footerID")}
                                    className="shrink-0"
                                    title="Clear selection"
                                >
                                    <span className="text-xs">✕</span>
                                </Button>
                            )}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            Select the footer template to display at the bottom of payslips
                        </p>
                    </div>

                    {/* Company Stamp Selection */}
                    <div className="space-y-2">
                        <Label
                            htmlFor="stamp"
                            className="text-sm font-medium text-slate-700 dark:text-slate-300"
                        >
                            Company Stamp
                        </Label>
                        <div className="flex gap-2">
                            <Select
                                value={settings.stampID}
                                onValueChange={value => handleChange("stampID", value)}
                            >
                                <SelectTrigger id="stamp" className="w-full">
                                    <SelectValue placeholder="Select a company stamp..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {stampOptions.map(stamp => (
                                        <SelectItem key={stamp.id} value={stamp.id}>
                                            {stamp.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {settings.stampID && (
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => handleClear("stampID")}
                                    className="shrink-0"
                                    title="Clear selection"
                                >
                                    <span className="text-xs">✕</span>
                                </Button>
                            )}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            Select the company stamp to appear on payslips
                        </p>
                    </div>

                    {/* Signature Selection */}
                    <div className="space-y-2">
                        <Label
                            htmlFor="signature"
                            className="text-sm font-medium text-slate-700 dark:text-slate-300"
                        >
                            Authorized Signature
                        </Label>
                        <div className="flex gap-2">
                            <Select
                                value={settings.signatureID}
                                onValueChange={value => handleChange("signatureID", value)}
                            >
                                <SelectTrigger id="signature" className="w-full">
                                    <SelectValue placeholder="Select a signature..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {signatureOptions.map(sig => (
                                        <SelectItem key={sig.id} value={sig.id}>
                                            {sig.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {settings.signatureID && (
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => handleClear("signatureID")}
                                    className="shrink-0"
                                    title="Clear selection"
                                >
                                    <span className="text-xs">✕</span>
                                </Button>
                            )}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            Select the authorized signature for payslip approval
                        </p>
                    </div>
                </div>

                {/* Preview Section */}
                <div className="border rounded-lg p-4 bg-slate-50 dark:bg-gray-800">
                    <h4 className="font-medium text-sm text-slate-700 dark:text-slate-300 mb-3">
                        Current Selection Preview
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                            <span className="text-slate-500 dark:text-slate-400">Header:</span>
                            <p className="font-medium dark:text-slate-200">
                                {settings.headerID
                                    ? headerOptions.find(h => h.id === settings.headerID)?.name
                                    : "Not selected"}
                            </p>
                        </div>
                        <div>
                            <span className="text-slate-500 dark:text-slate-400">Footer:</span>
                            <p className="font-medium dark:text-slate-200">
                                {settings.footerID
                                    ? footerOptions.find(f => f.id === settings.footerID)?.name
                                    : "Not selected"}
                            </p>
                        </div>
                        <div>
                            <span className="text-slate-500 dark:text-slate-400">Stamp:</span>
                            <p className="font-medium dark:text-slate-200">
                                {settings.stampID
                                    ? stampOptions.find(s => s.id === settings.stampID)?.name
                                    : "Not selected"}
                            </p>
                        </div>
                        <div>
                            <span className="text-slate-500 dark:text-slate-400">Signature:</span>
                            <p className="font-medium dark:text-slate-200">
                                {settings.signatureID
                                    ? signatureOptions.find(s => s.id === settings.signatureID)
                                        ?.name
                                    : "Not selected"}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Save Button */}
                <div className="flex items-center justify-between pt-4 border-t dark:border-gray-700">
                    {showSuccess && (
                        <Badge className="bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800">
                            Settings saved successfully
                        </Badge>
                    )}
                    <div className="ml-auto">
                        <Button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="bg-amber-600 hover:bg-amber-700 text-white dark:bg-amber-600 dark:hover:bg-amber-500"
                        >
                            {isSaving ? "Saving..." : "Save Settings"}
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

export function PayrollConfiguration() {
    return (
        <section className="w-full p-4 md:p-6">
            <div className="mx-auto max-w-7xl space-y-6">
                <header>
                    <h1 className="text-2xl md:text-3xl font-bold text-amber-900 dark:text-amber-700">
                        Payroll Configuration
                    </h1>
                    <p className="text-slate-600 dark:text-slate-300">
                        Configure payroll settings, payment types, deductions, and tax settings.
                    </p>
                </header>

                <Tabs defaultValue="payment-type" className="w-full">
                    <div className="overflow-x-auto">
                        <TabsList className="inline-flex flex-nowrap gap-2 bg-amber-50/60 dark:bg-gray-900 border border-amber-200 rounded-xl">
                            <TabsTrigger value="payment-type">Payment Type</TabsTrigger>
                            <TabsTrigger value="deduction-type">Deduction Type</TabsTrigger>
                            <TabsTrigger value="loan-type">Loan Type</TabsTrigger>
                            <TabsTrigger value="payslip-settings">Payslip Settings</TabsTrigger>
                            <TabsTrigger value="tax-configuration">Tax Configuration</TabsTrigger>
                            <TabsTrigger value="pension">Pension</TabsTrigger>
                            <TabsTrigger value="currency">Currency</TabsTrigger>
                        </TabsList>
                    </div>

                    <TabsContent value="payment-type" className="mt-4">
                        <PaymentType />
                    </TabsContent>
                    <TabsContent value="deduction-type" className="mt-4">
                        <DeductionType />
                    </TabsContent>
                    <TabsContent value="loan-type" className="mt-4">
                        <LoanType />
                    </TabsContent>
                    <TabsContent value="payslip-settings" className="mt-4">
                        <PayslipSettings />
                    </TabsContent>
                    <TabsContent value="tax-configuration" className="mt-4">
                        <TaxConfiguration />
                    </TabsContent>
                    <TabsContent value="pension" className="mt-4">
                        <Pension />
                    </TabsContent>
                    <TabsContent value="currency" className="mt-4">
                        <Currency />
                    </TabsContent>
                </Tabs>
            </div>
        </section>
    );
}
