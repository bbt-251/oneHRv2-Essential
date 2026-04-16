import { Card, CardContent } from "@/components/ui/card";
import { FileText, Calculator, PiggyBank } from "lucide-react";
import { PayrollData } from "../page";
import { numberCommaSeparator } from "@/lib/backend/functions/numberCommaSeparator";

interface PayrollMetricsProps {
    filteredData: PayrollData[];
}

export function PayrollMetrics({ filteredData }: PayrollMetricsProps) {
    const formatCurrency = (amount: number) => numberCommaSeparator(amount);

    const totalEmployeeCost = filteredData.reduce(
        (sum, emp) => sum + emp.totalGrossSalary + emp.employerPension,
        0,
    );
    const totalAllowancesCost = filteredData.reduce(
        (sum, emp) =>
            sum +
            (emp.payments?.reduce((paymentSum, payment) => paymentSum + payment.amount, 0) || 0),
        0,
    );
    const totalPensionCost = filteredData.reduce((sum, emp) => sum + emp.employerPension, 0);

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold text-brand-800 dark:text-foreground">
                Payroll Metrics
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-l-4" style={{ borderLeftColor: "#ffe6a7ff" }}>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-brand-600 dark:text-muted-foreground">
                                    Total Employee Cost
                                </p>
                                <p className="text-2xl font-bold text-brand-800 dark:text-foreground">
                                    {formatCurrency(totalEmployeeCost)}
                                </p>
                            </div>
                            <div
                                className="w-10 h-10 rounded-lg flex items-center justify-center"
                                style={{ backgroundColor: "#ffe6a7ff" }}
                            >
                                <FileText className="h-5 w-5" style={{ color: "#3f3d56ff" }} />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-l-4" style={{ borderLeftColor: "#3f3d56ff" }}>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-brand-600 dark:text-muted-foreground">
                                    Total Allowances Cost
                                </p>
                                <p className="text-2xl font-bold text-brand-800 dark:text-foreground">
                                    {formatCurrency(totalAllowancesCost)}
                                </p>
                            </div>
                            <div
                                className="w-10 h-10 rounded-lg flex items-center justify-center"
                                style={{ backgroundColor: "#3f3d5625" }}
                            >
                                <Calculator className="h-5 w-5" style={{ color: "#3f3d56ff" }} />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-l-4" style={{ borderLeftColor: "#3f3d5625" }}>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-brand-600 dark:text-muted-foreground">
                                    Total Pension Cost
                                </p>
                                <p className="text-2xl font-bold text-brand-800 dark:text-foreground">
                                    {formatCurrency(totalPensionCost)}
                                </p>
                            </div>
                            <div
                                className="w-10 h-10 rounded-lg flex items-center justify-center"
                                style={{ backgroundColor: "#ffe6a7ff" }}
                            >
                                <PiggyBank className="h-5 w-5" style={{ color: "#3f3d56ff" }} />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
