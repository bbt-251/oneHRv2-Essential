"use client";
import PayrollSlip from "@/components/hr-manager/compensation-benefits/payroll-management/blocks/payrollSlip";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/authContext";
import { useData } from "@/context/app-data-context";
import { useToast } from "@/context/toastContext";
import { generatePayrollSlip } from "@/lib/util/functions/payroll/generatePayrollSlip";
import returnPayrollData from "@/lib/util/functions/returnPayslipData";
import PayrollPDFSettingsModel from "@/lib/models/payrollPDFSettings";
import { PayrollRepository } from "@/lib/repository/payroll";
import { pdf } from "@react-pdf/renderer";
import dayjs from "dayjs";
import {
    AlertCircle,
    Calendar,
    CheckCircle2,
    Clock,
    DollarSign,
    Download,
    Eye,
    FileText,
    Search,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
interface PayslipModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface PayslipRecord {
    id: string;
    month: string;
    year: number;
    grossSalary: number;
    netSalary: number;
    status: "available" | "processing" | "pending";
}

function arePayrollPdfSettingsEqual(
    left: PayrollPDFSettingsModel | null,
    right: PayrollPDFSettingsModel | null,
) {
    if (left === right) {
        return true;
    }

    if (!left || !right) {
        return false;
    }

    return (
        left.id === right.id &&
        left.createdAt === right.createdAt &&
        left.updatedAt === right.updatedAt &&
        left.header === right.header &&
        left.footer === right.footer &&
        left.signature === right.signature &&
        left.stamp === right.stamp
    );
}

function arePayslipRecordsEqual(left: PayslipRecord[], right: PayslipRecord[]) {
    if (left === right) {
        return true;
    }

    if (left.length !== right.length) {
        return false;
    }

    return left.every((record, index) => {
        const otherRecord = right[index];

        return (
            record.id === otherRecord.id &&
            record.month === otherRecord.month &&
            record.year === otherRecord.year &&
            record.grossSalary === otherRecord.grossSalary &&
            record.netSalary === otherRecord.netSalary &&
            record.status === otherRecord.status
        );
    });
}

export function PayslipModal({ isOpen, onClose }: PayslipModalProps) {
    const { userData } = useAuth();
    const {
        employees,
        attendanceLogic,
        attendances,
        headerDocuments,
        footerDocuments,
        signatureDocuments,
        stampDocuments,
        overtimeRequests,
        leaveManagements,
        compensations,
        employeeLoans,
        loanTypes,
        taxes,
        overtimeTypes,
        pension,
        paymentTypes,
        deductionTypes,
        shiftTypes,
        holidays,
        currencies,
        positions,
        departmentSettings,
        sectionSettings,
        locations,
        contractTypes,
    } = useData();
    const settingsLookup = useMemo(
        () => ({
            positions,
            departmentSettings,
            sectionSettings,
            locations,
            contractTypes,
        }),
        [contractTypes, departmentSettings, locations, positions, sectionSettings],
    );
    const { showToast } = useToast();

    const [searchTerm, setSearchTerm] = useState<string>("");
    const [downloadingId, setDownloadingId] = useState<string | null>(null);
    const [previewingId, setPreviewingId] = useState<string | null>(null);
    const [previewPdfUrl, setPreviewPdfUrl] = useState<string | null>(null);
    const [isPreviewModalOpen, setIsPreviewModalOpen] = useState<boolean>(false);
    const [payslipRecords, setPayslipRecords] = useState<PayslipRecord[]>([]);
    const [pdfSettings, setPdfSettings] = useState<PayrollPDFSettingsModel | null>(null);
    const pdfDocumentLookupKey = useMemo(
        () =>
            [
                headerDocuments.map(document => `${document.id}:${document.fileUrl}`).join("|"),
                footerDocuments.map(document => `${document.id}:${document.fileUrl}`).join("|"),
                signatureDocuments.map(document => `${document.id}:${document.fileUrl}`).join("|"),
                stampDocuments.map(document => `${document.id}:${document.fileUrl}`).join("|"),
            ].join("::"),
        [headerDocuments, footerDocuments, signatureDocuments, stampDocuments],
    );

    // Load PDF settings from the shared app data layer
    useEffect(() => {
        let isCancelled = false;

        async function loadPdfSettings() {
            try {
                const result = await PayrollRepository.getPayrollPdfSettings();
                const settings = result.success ? result.data : null;
                if (settings) {
                    const resolvedSettings: PayrollPDFSettingsModel = {
                        ...settings,
                        header: settings.header
                            ? headerDocuments.find(d => d.id === settings.header)?.fileUrl || null
                            : null,
                        footer: settings.footer
                            ? footerDocuments.find(d => d.id === settings.footer)?.fileUrl || null
                            : null,
                        signature: settings.signature
                            ? signatureDocuments.find(d => d.id === settings.signature)?.fileUrl ||
                              null
                            : null,
                        stamp: settings.stamp
                            ? stampDocuments.find(d => d.id === settings.stamp)?.fileUrl || null
                            : null,
                    };

                    if (!isCancelled) {
                        setPdfSettings(previousSettings =>
                            arePayrollPdfSettingsEqual(previousSettings, resolvedSettings)
                                ? previousSettings
                                : resolvedSettings,
                        );
                    }
                }
            } catch (error) {
                console.error("Error loading PDF settings:", error);
            }
        }

        if (pdfDocumentLookupKey) {
            loadPdfSettings();
        }

        return () => {
            isCancelled = true;
        };
    }, [
        pdfDocumentLookupKey,
        headerDocuments,
        footerDocuments,
        signatureDocuments,
        stampDocuments,
    ]);

    // Use loaded settings or fall back to defaults
    const defaultPDFSettings = useMemo<PayrollPDFSettingsModel>(
        () =>
            pdfSettings || {
                id: "pdfsettings-001",
                createdAt: "",
                updatedAt: "",
                header: null,
                footer: null,
                signature: null,
                stamp: null,
            },
        [pdfSettings],
    );

    useEffect(() => {
        if (!userData || !employees.length) return;

        const months = [
            "January",
            "February",
            "March",
            "April",
            "May",
            "June",
            "July",
            "August",
            "September",
            "October",
            "November",
            "December",
        ];

        const currentYear = new Date().getFullYear();
        const records: PayslipRecord[] = [];

        months.forEach(month => {
            const payrollData = returnPayrollData({
                month,
                employees,
                attendances,
                attendanceLogic: attendanceLogic?.at(0)?.chosenLogic ?? 1,
                loans: employeeLoans,
                taxes,
                compensations,
                overtimeRequests,
                overtimeConfigs: overtimeTypes,
                pension: pension?.at(0) || null,
                paymentTypes,
                deductionTypes,
                loanTypes,
                shifts: shiftTypes,
                payrollPDFSettings: defaultPDFSettings,
                holidays,
                leaveDocs: leaveManagements,
                currencies,
                settingsLookup,
            });

            const userPayroll = payrollData.find(p => p.uid === userData.uid);
            if (userPayroll) {
                records.push({
                    id: `${userPayroll.uid}-${month}-${currentYear}`,
                    month,
                    year: currentYear,
                    grossSalary: userPayroll.totalGrossSalary,
                    netSalary: userPayroll.netPay,
                    status:
                        dayjs(userPayroll.month, "MMMM").month() < dayjs().month()
                            ? "available"
                            : "pending",
                });
            }
        });

        setPayslipRecords(previousRecords =>
            arePayslipRecordsEqual(previousRecords, records) ? previousRecords : records,
        );
    }, [
        userData,
        employees,
        attendances,
        attendanceLogic,
        employeeLoans,
        settingsLookup,
        compensations,
        overtimeRequests,
        leaveManagements,
        loanTypes,
        defaultPDFSettings,
    ]);

    const filteredRecords = payslipRecords.filter(record => {
        const matchesSearch = record.month.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesSearch;
    });

    const handleDownload = async (recordId: string, month: string) => {
        setDownloadingId(recordId);

        if (!userData) return;

        const payrollData = returnPayrollData({
            month,
            employees,
            attendances,
            attendanceLogic: attendanceLogic?.at(0)?.chosenLogic ?? 1,
            loans: employeeLoans,
            taxes,
            compensations,
            overtimeRequests,
            overtimeConfigs: overtimeTypes,
            pension: pension?.at(0) || null,
            paymentTypes,
            deductionTypes,
            loanTypes,
            shifts: shiftTypes,
            payrollPDFSettings: defaultPDFSettings,
            holidays,
            leaveDocs: leaveManagements,
            currencies,
            settingsLookup,
        });

        const userPayroll = payrollData.filter(p => p.uid === userData.uid);

        await generatePayrollSlip(
            [userData.uid],
            userPayroll,
            defaultPDFSettings,
            attendanceLogic?.at(0)?.chosenLogic ?? 1,
            (message, title, variant) =>
                showToast(message, title, variant === "info" ? "default" : variant),
        );

        setDownloadingId(null);
    };

    const handlePreview = async (recordId: string, month: string) => {
        if (!userData) return;

        setPreviewingId(recordId);

        try {
            const payrollData = returnPayrollData({
                month,
                employees,
                attendances,
                attendanceLogic: attendanceLogic?.at(0)?.chosenLogic ?? 1,
                loans: employeeLoans,
                taxes,
                compensations,
                overtimeRequests,
                overtimeConfigs: overtimeTypes,
                pension: pension?.at(0) || null,
                paymentTypes,
                deductionTypes,
                loanTypes,
                shifts: shiftTypes,
                payrollPDFSettings: defaultPDFSettings,
                holidays,
                leaveDocs: leaveManagements,
                currencies,
                settingsLookup,
            });

            const userPayroll = payrollData.find(p => p.uid === userData.uid);
            if (!userPayroll) {
                showToast("Payroll data not found for this month.", "Error", "error");
                return;
            }

            const pdfBlob = await pdf(
                <PayrollSlip
                    data={userPayroll}
                    header={defaultPDFSettings.header ?? ""}
                    footer={defaultPDFSettings.footer ?? ""}
                    signature={defaultPDFSettings.signature ?? ""}
                    stamp={defaultPDFSettings.stamp ?? ""}
                    attendanceLogic={attendanceLogic?.at(0)?.chosenLogic ?? 1}
                />,
            ).toBlob();

            // Create a blob URL and show in modal
            const blobUrl = URL.createObjectURL(pdfBlob);
            setPreviewPdfUrl(blobUrl);
            setIsPreviewModalOpen(true);
        } catch (error) {
            console.error("Error generating preview:", error);
            showToast("Failed to generate preview. Please try again.", "Error", "error");
        } finally {
            setPreviewingId(null);
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "available":
                return <CheckCircle2 className="h-4 w-4 text-success-600" />;
            case "processing":
                return <Clock className="h-4 w-4 text-warning-600" />;
            case "pending":
                return <AlertCircle className="h-4 w-4 text-danger-600" />;
            default:
                return null;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "available":
                return "bg-success-100 text-success-800 border-success-200";
            case "processing":
                return "bg-warning-100 text-warning-800 border-warning-200";
            case "pending":
                return "bg-danger-100 text-danger-800 border-danger-200";
            default:
                return "bg-secondary-100 text-secondary-800 border-secondary-200";
        }
    };

    const availableCount = payslipRecords.filter(r => r.status === "available").length;
    const latestSalary =
        payslipRecords
            .filter(r => r.status === "available")
            .sort((a, b) => {
                const months = [
                    "January",
                    "February",
                    "March",
                    "April",
                    "May",
                    "June",
                    "July",
                    "August",
                    "September",
                    "October",
                    "November",
                    "December",
                ];
                return months.indexOf(b.month) - months.indexOf(a.month);
            })[0]?.netSalary || 0;

    return (
        <>
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
                    <DialogHeader className="pb-6">
                        <DialogTitle className="text-2xl font-bold text-brand-800 flex items-center gap-3">
                            <div className="p-2 bg-accent-100 rounded-xl">
                                <FileText className="h-6 w-6 text-accent-600" />
                            </div>
                            Download Pay Slips
                        </DialogTitle>
                    </DialogHeader>

                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <Card className="border-accent-200 bg-gradient-to-br from-accent-50 to-accent-100">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-brand-600">
                                            Available Payslips
                                        </p>
                                        <p className="text-2xl font-bold text-brand-800">
                                            {availableCount}
                                        </p>
                                    </div>
                                    <div className="p-3 bg-accent-200 rounded-xl">
                                        <FileText className="h-5 w-5 text-accent-700" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-success-200 bg-gradient-to-br from-success-50 to-success-100">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-success-700">
                                            Latest Salary
                                        </p>
                                        <p className="text-2xl font-bold text-success-800">
                                            ${latestSalary.toLocaleString()}
                                        </p>
                                    </div>
                                    <div className="p-3 bg-success-200 rounded-xl">
                                        <DollarSign className="h-5 w-5 text-success-700" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Filters */}
                    <div className="flex flex-col sm:flex-row gap-4 mb-6">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-brand-400" />
                            <Input
                                placeholder="Search by month..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="pl-10 border-accent-300 focus:border-brand-500"
                            />
                        </div>
                    </div>

                    {/* Payslip Records */}
                    <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                        {filteredRecords.map(record => (
                            <Card
                                key={record.id}
                                className="border-accent-200 hover:shadow-md transition-all duration-200"
                            >
                                <CardContent className="p-5">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4 flex-1">
                                            <div className="p-3 bg-accent-100 rounded-xl">
                                                <Calendar className="h-5 w-5 text-accent-600" />
                                            </div>

                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <h3 className="font-bold text-lg text-brand-800">
                                                        {record.month} {record.year}
                                                    </h3>
                                                    <Badge
                                                        className={`text-xs px-2 py-1 border ${getStatusColor(record.status)}`}
                                                    >
                                                        <div className="flex items-center gap-1">
                                                            {getStatusIcon(record.status)}
                                                            <span className="capitalize">
                                                                {record.status}
                                                            </span>
                                                        </div>
                                                    </Badge>
                                                </div>

                                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                                                    <div>
                                                        <p className="text-brand-500 font-medium">
                                                            Gross Salary
                                                        </p>
                                                        <p className="font-semibold text-brand-700">
                                                            ${record.grossSalary.toLocaleString()}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-brand-500 font-medium">
                                                            Net Salary
                                                        </p>
                                                        <p className="font-semibold text-brand-700">
                                                            ${record.netSalary.toLocaleString()}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 ml-4">
                                            {record.status === "available" && (
                                                <>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() =>
                                                            handlePreview(record.id, record.month)
                                                        }
                                                        disabled={previewingId === record.id}
                                                        className="border-brand-300 text-brand-700 hover:bg-brand-50"
                                                    >
                                                        {previewingId === record.id ? (
                                                            <>
                                                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-brand-700 border-t-transparent mr-1" />
                                                                Loading...
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Eye className="h-4 w-4 mr-1" />
                                                                Preview
                                                            </>
                                                        )}
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        onClick={() =>
                                                            handleDownload(record.id, record.month)
                                                        }
                                                        disabled={downloadingId === record.id}
                                                        className="bg-brand-600 hover:bg-brand-700 text-white"
                                                    >
                                                        {downloadingId === record.id ? (
                                                            <>
                                                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-1" />
                                                                Downloading...
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Download className="h-4 w-4 mr-1" />
                                                                Download
                                                            </>
                                                        )}
                                                    </Button>
                                                </>
                                            )}
                                            {record.status === "processing" && (
                                                <Badge className="bg-warning-100 text-warning-800 border-warning-200">
                                                    <Clock className="h-3 w-3 mr-1" />
                                                    Processing
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {filteredRecords.length === 0 && (
                        <div className="text-center py-12">
                            <FileText className="h-12 w-12 text-brand-300 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-brand-600 mb-2">
                                No payslips found
                            </h3>
                            <p className="text-brand-500">
                                Try adjusting your search criteria or check back later.
                            </p>
                        </div>
                    )}

                    {/* Footer */}
                    <div className="flex justify-between items-center pt-6 border-t border-accent-200">
                        <div className="text-sm text-brand-500">
                            Showing {filteredRecords.length} of {payslipRecords.length} payslips
                        </div>
                        <div className="flex gap-3">
                            <Button
                                variant="outline"
                                onClick={onClose}
                                className="border-brand-300 text-brand-700 hover:bg-brand-50"
                            >
                                Close
                            </Button>
                            <Button className="bg-brand-600 hover:bg-brand-700 text-white">
                                <Download className="h-4 w-4 mr-2" />
                                Download All Available
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Preview Modal */}
            <Dialog
                open={isPreviewModalOpen}
                onOpenChange={open => {
                    if (!open) {
                        if (previewPdfUrl) {
                            URL.revokeObjectURL(previewPdfUrl);
                        }
                        setPreviewPdfUrl(null);
                    }
                    setIsPreviewModalOpen(open);
                }}
            >
                <DialogContent className="max-w-4xl max-h-[94vh] overflow-hidden">
                    <DialogHeader className="pb-4">
                        <DialogTitle className="text-xl font-bold text-brand-800">
                            Payslip Preview
                        </DialogTitle>
                    </DialogHeader>

                    {previewPdfUrl ? (
                        <div className="w-full h-[70vh]">
                            <iframe
                                src={previewPdfUrl}
                                className="w-full h-full border-0"
                                title="Payslip Preview"
                            />
                        </div>
                    ) : (
                        <div className="w-full h-[70vh] flex items-center justify-center">
                            <div className="text-center">
                                <FileText className="h-12 w-12 text-brand-300 mx-auto mb-4" />
                                <p className="text-brand-500">Loading preview...</p>
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end pt-4 border-t border-accent-200 pb-9">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setIsPreviewModalOpen(false);
                                if (previewPdfUrl) {
                                    URL.revokeObjectURL(previewPdfUrl);
                                }
                                setPreviewPdfUrl(null);
                            }}
                            className="border-brand-300 text-brand-700 hover:bg-brand-50"
                        >
                            Close
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
