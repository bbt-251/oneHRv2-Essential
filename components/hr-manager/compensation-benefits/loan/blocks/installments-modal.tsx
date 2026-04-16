import React from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { ExtendedEmployeeLoan } from "@/lib/models/employeeLoan";
import { ArrowLeft, Check, Edit, Loader2, MoreHorizontal } from "lucide-react";
import { useToast } from "@/context/toastContext";
import { updateLoan } from "@/lib/backend/api/compensation-benefit/loan-services";
import { COMPENSATION_LOG_MESSAGES } from "@/lib/log-descriptions/compensation";
import { useAuth } from "@/context/authContext";
import { useFirestore } from "@/context/firestore-context";

const calculateLoanProgress = (months: ExtendedEmployeeLoan["months"], loanTotalAmount: number) => {
    const paidAmount = months
        .filter(month => month.confirmed === true)
        .reduce((sum, month) => sum + Number(month.amount), 0);

    return {
        paidAmount,
        remainingAmount: Math.max(Number(loanTotalAmount.toFixed(2)) - paidAmount, 0),
    };
};

interface InstallmentsModalProps {
    isInstallmentsModalOpen: boolean;
    setIsInstallmentsModalOpen: (open: boolean) => void;
    selectedLoanForInstallments: ExtendedEmployeeLoan | null;
    setSelectedLoanForInstallments: (loan: ExtendedEmployeeLoan | null) => void;
    isEditingMode: boolean;
    setIsEditingMode: (editing: boolean) => void;
    editValues: { [key: string]: { amount: string; deductFromSalary: string; comment: string } };
    setEditValues: React.Dispatch<
        React.SetStateAction<{
            [key: string]: { amount: string; deductFromSalary: string; comment: string };
        }>
    >;
    handleSaveEdit: () => void;
    isSaving: boolean;
    pagedInstallments: any[];
    totalInstallments: number;
    installStartIndex: number;
    installEndIndex: number;
    clampedInstallPage: number;
    setInstallPage: React.Dispatch<React.SetStateAction<number>>;
    setLoans: React.Dispatch<React.SetStateAction<ExtendedEmployeeLoan[]>>;
}

export function InstallmentsModal({
    isInstallmentsModalOpen,
    setIsInstallmentsModalOpen,
    selectedLoanForInstallments,
    setSelectedLoanForInstallments,
    isEditingMode,
    setIsEditingMode,
    editValues,
    setEditValues,
    handleSaveEdit,
    isSaving,
    pagedInstallments,
    totalInstallments,
    installStartIndex,
    installEndIndex,
    clampedInstallPage,
    setInstallPage,
    setLoans,
}: InstallmentsModalProps) {
    const { showToast } = useToast();
    const { userData } = useAuth();
    const { hrSettings } = useFirestore();
    const loanTypes = hrSettings.loanTypes;

    return (
        <Dialog open={isInstallmentsModalOpen} onOpenChange={setIsInstallmentsModalOpen}>
            <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
                <DialogHeader className="border-b pb-4">
                    <DialogTitle className="text-xl font-semibold">
                        Employee Loan Monthly Installments
                    </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    {/* Toolbar */}
                    <div className="flex items-center justify-end gap-2 rounded-lg">
                        {isEditingMode ? (
                            <>
                                <Button
                                    size="sm"
                                    onClick={handleSaveEdit}
                                    disabled={isSaving}
                                    style={{
                                        backgroundColor: "#3f3d56ff",
                                        borderColor: "#3f3d56ff",
                                    }}
                                    className="text-white hover:opacity-90 border"
                                >
                                    {isSaving ? (
                                        <div className="flex items-center gap-2">
                                            <Loader2 className="animate-spin h-4 w-4" />
                                            Saving...
                                        </div>
                                    ) : (
                                        "Save Changes"
                                    )}
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                        setIsEditingMode(false);
                                        setEditValues({});
                                    }}
                                    className="text-black border-black hover:bg-white/10"
                                >
                                    Cancel
                                </Button>
                            </>
                        ) : (
                            <Button
                                size="sm"
                                onClick={() => {
                                    setIsEditingMode(true);
                                    const initialValues: {
                                        [key: string]: {
                                            amount: string;
                                            deductFromSalary: string;
                                            comment: string;
                                        };
                                    } = {};
                                    selectedLoanForInstallments?.months.forEach(installment => {
                                        initialValues[installment.id] = {
                                            amount: installment.amount.toString(),
                                            deductFromSalary: installment.amount.toString(),
                                            comment: installment.comment || "",
                                        };
                                    });
                                    setEditValues(initialValues);
                                }}
                                style={{ backgroundColor: "#3f3d56ff", borderColor: "#3f3d56ff" }}
                                className="text-white hover:opacity-90 border"
                            >
                                <Edit className="h-4 w-4 mr-2" />
                                Edit Installments
                            </Button>
                        )}
                    </div>

                    {/* Installments Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr style={{ backgroundColor: "#3f3d56ff" }}>
                                    <th className="text-white p-2 text-left">Date</th>
                                    <th className="text-white p-2 text-left">Amount</th>
                                    <th className="text-white p-2 text-left">Deduct From Salary</th>
                                    <th className="text-white p-2 text-left">Confirmed</th>
                                    <th className="text-white p-2 text-left">Comment</th>
                                    <th className="text-white p-2 text-left">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pagedInstallments.map(installment => (
                                    <tr key={installment.id}>
                                        <td className="p-2">{installment.date}</td>
                                        <td className="p-2">
                                            {isEditingMode ? (
                                                <Input
                                                    value={
                                                        editValues[installment.id]?.amount ||
                                                        installment.amount.toString()
                                                    }
                                                    onChange={e => {
                                                        const newValue = e.target.value;
                                                        setEditValues(prev => ({
                                                            ...prev,
                                                            [installment.id]: {
                                                                amount: newValue,
                                                                deductFromSalary: newValue,
                                                                comment:
                                                                    prev[installment.id]?.comment ||
                                                                    installment.comment ||
                                                                    "",
                                                            },
                                                        }));
                                                    }}
                                                    type="number"
                                                />
                                            ) : (
                                                installment.amount.toFixed(2)
                                            )}
                                        </td>
                                        <td className="p-2">
                                            {isEditingMode ? (
                                                <Input
                                                    value={
                                                        editValues[installment.id]?.amount ||
                                                        installment.amount.toString()
                                                    }
                                                    disabled
                                                    type="number"
                                                />
                                            ) : (
                                                installment.deductFromSalary.toFixed(2)
                                            )}
                                        </td>
                                        <td className="p-2">
                                            {installment.confirmed ? "true" : "false"}
                                        </td>
                                        <td className="p-2">
                                            {isEditingMode ? (
                                                <Input
                                                    value={
                                                        editValues[installment.id]?.comment ||
                                                        installment.comment ||
                                                        ""
                                                    }
                                                    onChange={e =>
                                                        setEditValues(prev => ({
                                                            ...prev,
                                                            [installment.id]: {
                                                                amount:
                                                                    prev[installment.id]?.amount ||
                                                                    installment.amount.toString(),
                                                                deductFromSalary:
                                                                    prev[installment.id]?.amount ||
                                                                    installment.amount.toString(),
                                                                comment: e.target.value,
                                                            },
                                                        }))
                                                    }
                                                />
                                            ) : (
                                                installment.comment
                                            )}
                                        </td>
                                        <td className="p-2">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 w-8 p-0"
                                                    >
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem
                                                        onClick={async () => {
                                                            if (!selectedLoanForInstallments)
                                                                return;
                                                            const update: ExtendedEmployeeLoan = {
                                                                ...selectedLoanForInstallments,
                                                            };
                                                            const idx = update.months.findIndex(
                                                                month =>
                                                                    month.id === installment.id,
                                                            );
                                                            if (idx !== -1) {
                                                                update.months[idx] = {
                                                                    ...update.months[idx],
                                                                    confirmed:
                                                                        !installment.confirmed,
                                                                };
                                                                const loanProgress =
                                                                    calculateLoanProgress(
                                                                        update.months,
                                                                        update.loanTotalAmount,
                                                                    );
                                                                const updatedLoan = {
                                                                    ...update,
                                                                    ...loanProgress,
                                                                };
                                                                setSelectedLoanForInstallments(
                                                                    updatedLoan,
                                                                );
                                                                const currentLoanId =
                                                                    selectedLoanForInstallments.id;
                                                                setLoans(prev =>
                                                                    prev.map(l =>
                                                                        l.id === currentLoanId
                                                                            ? updatedLoan
                                                                            : l,
                                                                    ),
                                                                );
                                                                await updateLoan(
                                                                    {
                                                                        id: updatedLoan.id,
                                                                        months: updatedLoan.months,
                                                                    },
                                                                    userData?.uid ?? "",
                                                                    installment.confirmed
                                                                        ? COMPENSATION_LOG_MESSAGES.PAYMENT_ROLLBACK(
                                                                            loanTypes.find(
                                                                                lt =>
                                                                                    lt.id ==
                                                                                      updatedLoan.loanType,
                                                                            )?.loanName ?? "",
                                                                            installment.date,
                                                                        )
                                                                        : COMPENSATION_LOG_MESSAGES.PAYMENT_CONFIRMED(
                                                                            loanTypes.find(
                                                                                lt =>
                                                                                    lt.id ==
                                                                                      updatedLoan.loanType,
                                                                            )?.loanName ?? "",
                                                                            installment.date,
                                                                        ),
                                                                )
                                                                    .then(() =>
                                                                        showToast(
                                                                            installment.confirmed
                                                                                ? "Rollback Success"
                                                                                : "Confirmed",
                                                                            "Success",
                                                                            "success",
                                                                        ),
                                                                    )
                                                                    .catch(err => {
                                                                        showToast(
                                                                            "Error. Please Try Again!",
                                                                            "Error",
                                                                            "error",
                                                                        );
                                                                        console.error(err);
                                                                    });
                                                            }
                                                        }}
                                                    >
                                                        <Check className="mr-2 h-4 w-4" />
                                                        {installment.confirmed
                                                            ? "Rollback Payment"
                                                            : "Confirm Payment"}
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="flex items-center justify-between pt-4">
                        <div className="text-sm text-gray-600">
                            {totalInstallments === 0
                                ? "0-0"
                                : `${installStartIndex + 1}-${installEndIndex}`}{" "}
                            of {totalInstallments}
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={clampedInstallPage === 0}
                                onClick={() => setInstallPage(p => Math.max(p - 1, 0))}
                            >
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={installEndIndex >= totalInstallments}
                                onClick={() => setInstallPage(p => p + 1)}
                            >
                                <ArrowLeft className="h-4 w-4 rotate-180" />
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
