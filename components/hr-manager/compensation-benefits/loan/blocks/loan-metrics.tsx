import { Card, CardContent } from "@/components/ui/card";
import { DollarSign, FileText, User, Calendar } from "lucide-react";

interface LoanMetricsProps {
    totalLoansAmount: number;
    totalOutstanding: number;
    activeLoans: number;
    avgTerm: number;
}

export function LoanMetrics({
    totalLoansAmount,
    totalOutstanding,
    activeLoans,
    avgTerm,
}: LoanMetricsProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
                <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                        <div
                            className="w-12 h-12 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: "#3f3d56ff" }}
                        >
                            <DollarSign className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-muted-foreground">
                                Total Loans
                            </p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-foreground">
                                {`ETB ${totalLoansAmount.toLocaleString()}`}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                        <div
                            className="w-12 h-12 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: "#ffe6a7ff" }}
                        >
                            <FileText className="h-6 w-6" style={{ color: "#3f3d56ff" }} />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-muted-foreground">
                                Outstanding
                            </p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-foreground">
                                {`ETB ${totalOutstanding.toLocaleString()}`}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                        <div
                            className="w-12 h-12 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: "#3f3d5625" }}
                        >
                            <User className="h-6 w-6" style={{ color: "#3f3d56ff" }} />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-muted-foreground">
                                Active Loans
                            </p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-foreground">
                                {activeLoans}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-green-100">
                            <Calendar className="h-6 w-6 text-green-600" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-muted-foreground">
                                Avg. Term
                            </p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-foreground">
                                {avgTerm} months
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
