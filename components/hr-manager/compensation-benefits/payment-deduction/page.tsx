"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useData } from "@/context/app-data-context";
import { getTimestamp } from "@/lib/util/dayjs_format";
import {
    createCompensation,
    deleteCompensation,
    updateCompensation,
} from "@/lib/backend/api/compensation-benefit/compensation-service";
import dayjs from "dayjs";
import { EmployeeCompensationModel } from "@/lib/models/employeeCompensation";
import { useToast } from "@/context/toastContext";
import { EmployeeModel } from "@/lib/models/employee";
import { useConfirm } from "@/hooks/use-confirm-dialog";
import { COMPENSATION_LOG_MESSAGES } from "@/lib/log-descriptions/compensation";
import { useAuth } from "@/context/authContext";
import { usePaymentDeductionData } from "./hooks/usePaymentDeductionData";
import { TabButtons } from "./blocks/tab-buttons";
import { PaymentTable } from "./blocks/payment-table";
import { DeductionTable } from "./blocks/deduction-table";
import { AddEditPaymentDialog } from "./blocks/add-edit-payment-dialog";
import { AddEditDeductionDialog } from "./blocks/add-edit-deduction-dialog";
import { EmployeeModal } from "./blocks/employee-modal";
import { AmountModal } from "./blocks/amount-modal";
import { validateMultipleSeverancePayEligibility } from "@/lib/backend/functions/calculateSeverancePay";

interface PaymentEntry {
    id: string;
    timestamp: string;
    employees: EmployeeModel[]; // Changed from string to Employee array
    paymentTypeName: string;
    paymentAmount: number;
    monthlyAmounts: { [month: string]: number }; // Added monthly amounts tracking
    severanceMonth?: string;
    annualLeaveMonth?: string;
    annualLeaveDays?: number;
}

interface DeductionEntry {
    timestamp: string;
    id: string;
    employees: EmployeeModel[]; // Changed from simple fields to match payment structure
    deductionTypeName: string;
    deductionAmount: number;
    monthlyAmounts: { [month: string]: number }; // Added monthly deduction amounts tracking
}

function monthObjectToArray<T>(obj: Record<string, T | number>): (T | number)[] {
    const result: (T | number)[] = [];

    for (let i = 0; i < 12; i++) {
        const monthName = dayjs().month(i).format("MMMM");
        result.push(obj[monthName] ?? 0);
    }

    return result;
}

export function PaymentDeductions() {
    const { confirm, ConfirmDialog } = useConfirm();
    const { showToast } = useToast();
    const { activeEmployees: employees, ...hrSettings } = useData();
    const { userData } = useAuth();
    const positions = hrSettings.positions;
    const paymentTypes = hrSettings.paymentTypes.filter(p => p.active);
    const deductionTypes = hrSettings.deductionTypes.filter(p => p.active);
    const taxes = hrSettings.taxes || [];
    const router = useRouter();
    const [isAddEditLoading, setIsAddEditLoading] = useState<boolean>(false);
    const [activeTab, setActiveTab] = useState<"payments" | "deductions">("payments");
    const [isAddDialogOpen, setIsAddDialogOpen] = useState<boolean>(false);
    const [newPayment, setNewPayment] = useState<Partial<PaymentEntry>>({});
    const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState<boolean>(false);
    const [isAmountModalOpen, setIsAmountModalOpen] = useState<boolean>(false);
    const [selectedEmployees, setSelectedEmployees] = useState<EmployeeModel[]>([]);
    const [selectedMonthlyAmounts, setSelectedMonthlyAmounts] = useState<{
        [month: string]: number;
    }>({});
    const [selectedEmployeesForForm, setSelectedEmployeesForForm] = useState<EmployeeModel[]>([]);
    const [employeeSearchTerm, setEmployeeSearchTerm] = useState<string>("");
    const [isEmployeePopoverOpen, setIsEmployeePopoverOpen] = useState<boolean>(false);
    const [isEditMode, setIsEditMode] = useState<boolean>(false);
    const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null);
    const [isAddDeductionDialogOpen, setIsAddDeductionDialogOpen] = useState<boolean>(false);
    const [newDeduction, setNewDeduction] = useState<Partial<DeductionEntry>>({});
    const [selectedEmployeesForDeductionForm, setSelectedEmployeesForDeductionForm] = useState<
        EmployeeModel[]
    >([]);
    const [deductionEmployeeSearchTerm, setDeductionEmployeeSearchTerm] = useState<string>("");
    const [isDeductionEmployeePopoverOpen, setIsDeductionEmployeePopoverOpen] =
        useState<boolean>(false);
    const [isDeductionEditMode, setIsDeductionEditMode] = useState<boolean>(false);
    const [editingDeductionId, setEditingDeductionId] = useState<string | null>(null);

    const { paymentsData, deductionsData } = usePaymentDeductionData();

    const filteredEmployees = employees.filter(
        employee =>
            employee.firstName.toLowerCase().includes(employeeSearchTerm.toLowerCase()) ||
            employee.surname.toLowerCase().includes(employeeSearchTerm.toLowerCase()) ||
            employee.employmentPosition.toLowerCase().includes(employeeSearchTerm.toLowerCase()),
    );

    const filteredDeductionEmployees = employees.filter(
        employee =>
            employee.firstName.toLowerCase().includes(deductionEmployeeSearchTerm.toLowerCase()) ||
            employee.surname.toLowerCase().includes(deductionEmployeeSearchTerm.toLowerCase()) ||
            employee.employmentPosition
                .toLowerCase()
                .includes(deductionEmployeeSearchTerm.toLowerCase()),
    );

    const handleEmployeeToggle = (employee: EmployeeModel) => {
        const isSelected = selectedEmployeesForForm.some(emp => emp.id === employee.id);
        if (isSelected) {
            setSelectedEmployeesForForm(
                selectedEmployeesForForm.filter(emp => emp.id !== employee.id),
            );
        } else {
            setSelectedEmployeesForForm([...selectedEmployeesForForm, employee]);
        }
    };

    const handleDeductionEmployeeToggle = (employee: EmployeeModel) => {
        // Added deduction employee toggle handler
        const isSelected = selectedEmployeesForDeductionForm.some(emp => emp.id === employee.id);
        if (isSelected) {
            setSelectedEmployeesForDeductionForm(
                selectedEmployeesForDeductionForm.filter(emp => emp.id !== employee.id),
            );
        } else {
            setSelectedEmployeesForDeductionForm([...selectedEmployeesForDeductionForm, employee]);
        }
    };

    const removeEmployee = (employeeId: string) => {
        setSelectedEmployeesForForm(selectedEmployeesForForm.filter(emp => emp.id !== employeeId));
    };

    const removeDeductionEmployee = (employeeId: string) => {
        // Added remove deduction employee handler
        setSelectedEmployeesForDeductionForm(
            selectedEmployeesForDeductionForm.filter(emp => emp.id !== employeeId),
        );
    };

    const openEmployeeModal = (employees: EmployeeModel[]) => {
        setSelectedEmployees(employees);
        setIsEmployeeModalOpen(true);
    };

    const openAmountModal = (monthlyAmounts: { [month: string]: number }) => {
        setSelectedMonthlyAmounts(monthlyAmounts);
        setIsAmountModalOpen(true);
    };

    const handleAddPayment = async () => {
        setIsAddEditLoading(true);
        if (
            selectedEmployeesForForm.length > 0 &&
            newPayment.paymentTypeName &&
            newPayment.paymentAmount
        ) {
            // Check if this is a Severance Pay payment type
            const selectedPaymentType = paymentTypes.find(
                pt => pt.id === newPayment.paymentTypeName,
            );
            const isSeverancePay = selectedPaymentType?.paymentType === "Severance Pay";

            // If it's Severance Pay, validate employee eligibility
            if (isSeverancePay) {
                const validation =
                    validateMultipleSeverancePayEligibility(selectedEmployeesForForm);

                if (!validation.isValid) {
                    showToast(validation.errors.join("\n"), "Validation Error", "error");
                    setIsAddEditLoading(false);
                    return;
                }
            }

            if (isEditMode && editingPaymentId) {
                const updatePay: Omit<EmployeeCompensationModel, "timestamp"> = {
                    id: editingPaymentId,
                    employees: selectedEmployeesForForm.map(e => e.uid),
                    type: "Payment",
                    paymentType: newPayment.paymentTypeName,
                    paymentAmount: monthObjectToArray(newPayment.monthlyAmounts ?? {}),
                    deduction: null,
                    deductionType: null,
                    deductionAmount: null,
                };

                const res = await updateCompensation(
                    updatePay,
                    userData?.uid ?? "",
                    COMPENSATION_LOG_MESSAGES.UPDATED(
                        `payment: ${paymentTypes.find(pt => pt.id == updatePay.paymentType)?.paymentName ?? ""}`,
                    ),
                );
                if (res) {
                    showToast("Payment updated successfully", "Success", "success");
                    handleResetPay();
                } else {
                    showToast("Error updating payment", "Error", "error");
                }
            } else {
                const newPay: Omit<EmployeeCompensationModel, "id"> = {
                    timestamp: getTimestamp(),
                    employees: selectedEmployeesForForm.map(e => e.uid),
                    type: "Payment",
                    paymentType: newPayment.paymentTypeName,
                    paymentAmount: monthObjectToArray(newPayment.monthlyAmounts ?? {}),
                    deduction: null,
                    deductionType: null,
                    deductionAmount: null,
                };

                const res = await createCompensation(
                    newPay,
                    userData?.uid ?? "",
                    COMPENSATION_LOG_MESSAGES.CREATED(
                        `payment: ${paymentTypes.find(pt => pt.id == newPay.paymentType)?.paymentName ?? ""}`,
                    ),
                );
                if (res) {
                    showToast("Payment created successfully", "Success", "success");
                    handleResetPay();
                } else {
                    showToast("Error creating payment", "Error", "error");
                }
            }
        }
        setIsAddEditLoading(false);
    };

    const handleResetPay = () => {
        setNewPayment({});
        setSelectedEmployeesForForm([]);
        setEmployeeSearchTerm("");
        setIsEditMode(false);
        setEditingPaymentId(null);
        setIsAddDialogOpen(false);
    };

    const handleAddDeduction = async () => {
        // Added deduction add/edit handler
        setIsAddEditLoading(true);
        if (
            selectedEmployeesForDeductionForm.length > 0 &&
            newDeduction.deductionTypeName &&
            newDeduction.deductionAmount
        ) {
            if (isDeductionEditMode && editingDeductionId) {
                const updatedDeduction: Omit<EmployeeCompensationModel, "timestamp"> = {
                    id: editingDeductionId,
                    employees: selectedEmployeesForDeductionForm.map(e => e.uid),
                    type: "Deduction",
                    deduction: newDeduction.deductionTypeName,
                    deductionType: "Value",
                    deductionAmount: monthObjectToArray(newDeduction.monthlyAmounts ?? {}),
                    paymentAmount: null,
                    paymentType: null,
                };

                const res = await updateCompensation(
                    updatedDeduction,
                    userData?.uid ?? "",
                    COMPENSATION_LOG_MESSAGES.UPDATED(
                        `deduction: ${deductionTypes.find(dt => dt.id == updatedDeduction.deduction)?.deductionName ?? ""}`,
                    ),
                );
                if (res) {
                    showToast("Deduction updated successfully", "Success", "success");
                    handleResetDeduction();
                } else {
                    showToast("Error updating deduction", "Error", "error");
                }
            } else {
                const newDeduct: Omit<EmployeeCompensationModel, "id"> = {
                    timestamp: getTimestamp(),
                    employees: selectedEmployeesForDeductionForm.map(e => e.uid),
                    type: "Deduction",
                    deduction: newDeduction.deductionTypeName,
                    deductionType: "Value",
                    deductionAmount: monthObjectToArray(newDeduction.monthlyAmounts ?? {}),
                    paymentAmount: null,
                    paymentType: null,
                };

                const res = await createCompensation(
                    newDeduct,
                    userData?.uid ?? "",
                    COMPENSATION_LOG_MESSAGES.CREATED(
                        `deduction: ${deductionTypes.find(dt => dt.id == newDeduct.deduction)?.deductionName ?? ""}`,
                    ),
                );
                if (res) {
                    showToast("Deduction created successfully", "Success", "success");
                    handleResetDeduction();
                } else {
                    showToast("Error creating deduction", "Error", "error");
                }
            }
        }
        setIsAddEditLoading(false);
    };

    const handleResetDeduction = () => {
        setNewDeduction({});
        setSelectedEmployeesForDeductionForm([]);
        setDeductionEmployeeSearchTerm("");
        setIsDeductionEditMode(false);
        setEditingDeductionId(null);
        setIsAddDeductionDialogOpen(false);
    };

    const handleDelete = (id: string) => {
        confirm("Are you sure ?", async () => {
            const res = await deleteCompensation(
                id,
                userData?.uid ?? "",
                COMPENSATION_LOG_MESSAGES.DELETED(
                    paymentTypes.find(
                        pt => pt.id == paymentsData.find(p => p.id === id)?.paymentTypeName,
                    )?.paymentName ||
                        deductionTypes.find(
                            dt => dt.id == deductionsData.find(d => d.id === id)?.deductionTypeName,
                        )?.deductionName ||
                        "",
                ),
            );
            if (res) {
                showToast("Item Deleted successfully", "Success", "success");
            } else {
                showToast("Error deleting an item", "Error", "error");
            }
        });
    };

    const openEditDialog = (payment: PaymentEntry) => {
        setIsEditMode(true);
        setEditingPaymentId(payment.id);
        setNewPayment({
            timestamp: payment.timestamp,
            paymentTypeName: payment.paymentTypeName,
            paymentAmount: payment.paymentAmount,
            monthlyAmounts: payment.monthlyAmounts,
            severanceMonth: payment.severanceMonth,
            annualLeaveMonth: payment.annualLeaveMonth,
            annualLeaveDays: payment.annualLeaveDays,
        });
        setSelectedEmployeesForForm(payment.employees);
        setIsAddDialogOpen(true);
    };

    const openEditDeductionDialog = (deduction: DeductionEntry) => {
        // Added deduction edit dialog handler
        setIsDeductionEditMode(true);
        setEditingDeductionId(deduction.id);
        setNewDeduction({
            timestamp: deduction.timestamp,
            deductionTypeName: deduction.deductionTypeName,
            deductionAmount: deduction.deductionAmount,
            monthlyAmounts: deduction.monthlyAmounts,
        });
        setSelectedEmployeesForDeductionForm(deduction.employees);
        setIsAddDeductionDialogOpen(true);
    };

    return (
        <div className="space-y-6 p-6">
            <div className="flex items-center gap-4 mb-8">
                <Button
                    variant="outline"
                    onClick={() => router.push("/hr/compensation-benefits")}
                    className="flex items-center gap-2 bg-transparent"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Compensation & Benefits
                </Button>
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-foreground">
                        Payment & Deductions
                    </h1>
                    <p className="text-gray-600 dark:text-muted-foreground">
                        Manage employee payments and deductions
                    </p>
                </div>
            </div>

            <TabButtons activeTab={activeTab} setActiveTab={setActiveTab} />

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-xl font-semibold">
                            {activeTab === "payments" ? "Employee Payments" : "Employee Deductions"}
                        </CardTitle>
                        {activeTab === "payments" && (
                            <AddEditPaymentDialog
                                isAddDialogOpen={isAddDialogOpen}
                                setIsAddDialogOpen={setIsAddDialogOpen}
                                isEditMode={isEditMode}
                                editingPaymentId={editingPaymentId}
                                newPayment={newPayment}
                                setNewPayment={setNewPayment}
                                selectedEmployeesForForm={selectedEmployeesForForm}
                                setSelectedEmployeesForForm={setSelectedEmployeesForForm}
                                employeeSearchTerm={employeeSearchTerm}
                                setEmployeeSearchTerm={setEmployeeSearchTerm}
                                isEmployeePopoverOpen={isEmployeePopoverOpen}
                                setIsEmployeePopoverOpen={setIsEmployeePopoverOpen}
                                filteredEmployees={filteredEmployees}
                                handleEmployeeToggle={handleEmployeeToggle}
                                removeEmployee={removeEmployee}
                                paymentTypes={paymentTypes}
                                handleAddPayment={handleAddPayment}
                                isAddEditLoading={isAddEditLoading}
                                paymentsData={paymentsData}
                                taxes={taxes}
                                hrSettings={hrSettings}
                            />
                        )}
                        {activeTab === "deductions" && (
                            <AddEditDeductionDialog
                                isAddDeductionDialogOpen={isAddDeductionDialogOpen}
                                setIsAddDeductionDialogOpen={setIsAddDeductionDialogOpen}
                                isDeductionEditMode={isDeductionEditMode}
                                editingDeductionId={editingDeductionId}
                                newDeduction={newDeduction}
                                setNewDeduction={setNewDeduction}
                                selectedEmployeesForDeductionForm={
                                    selectedEmployeesForDeductionForm
                                }
                                setSelectedEmployeesForDeductionForm={
                                    setSelectedEmployeesForDeductionForm
                                }
                                deductionEmployeeSearchTerm={deductionEmployeeSearchTerm}
                                setDeductionEmployeeSearchTerm={setDeductionEmployeeSearchTerm}
                                isDeductionEmployeePopoverOpen={isDeductionEmployeePopoverOpen}
                                setIsDeductionEmployeePopoverOpen={
                                    setIsDeductionEmployeePopoverOpen
                                }
                                filteredDeductionEmployees={filteredDeductionEmployees}
                                handleDeductionEmployeeToggle={handleDeductionEmployeeToggle}
                                removeDeductionEmployee={removeDeductionEmployee}
                                deductionTypes={deductionTypes}
                                handleAddDeduction={handleAddDeduction}
                                isAddEditLoading={isAddEditLoading}
                                deductionsData={deductionsData}
                            />
                        )}
                    </div>
                </CardHeader>
                <CardContent>
                    {activeTab === "payments" ? (
                        <PaymentTable
                            paymentsData={paymentsData}
                            paymentTypes={paymentTypes}
                            openEmployeeModal={openEmployeeModal}
                            openAmountModal={openAmountModal}
                            openEditDialog={openEditDialog}
                            handleDelete={handleDelete}
                        />
                    ) : (
                        <DeductionTable
                            deductionsData={deductionsData}
                            deductionTypes={deductionTypes}
                            openEmployeeModal={openEmployeeModal}
                            openAmountModal={openAmountModal}
                            openEditDeductionDialog={openEditDeductionDialog}
                            handleDelete={handleDelete}
                        />
                    )}
                </CardContent>
            </Card>

            <EmployeeModal
                isEmployeeModalOpen={isEmployeeModalOpen}
                setIsEmployeeModalOpen={setIsEmployeeModalOpen}
                selectedEmployees={selectedEmployees}
                positions={positions}
            />

            <AmountModal
                isAmountModalOpen={isAmountModalOpen}
                setIsAmountModalOpen={setIsAmountModalOpen}
                selectedMonthlyAmounts={selectedMonthlyAmounts}
            />
            {ConfirmDialog}
        </div>
    );
}
