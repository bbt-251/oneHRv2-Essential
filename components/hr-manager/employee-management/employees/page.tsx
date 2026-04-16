"use client";

import { useTheme } from "@/components/theme-provider";
import { useAuth } from "@/context/authContext";
import { useFirestore } from "@/context/firestore-context";
import { useToast } from "@/context/toastContext";
import { getAuth } from "firebase/auth";
import { generateAttendanceForEmployee } from "@/lib/backend/api/attendance/attendance-service";
import {
    createEmployee,
    getEmployeeDocumentId,
    updateEmployee,
} from "@/lib/backend/api/employee-management/employee-management-service";
import calculateHourlyWage from "@/lib/backend/functions/payroll/calculateHourlyWage";
import { ATTENDANCE_LOG_MESSAGES } from "@/lib/log-descriptions/attendance";
import { EMPLOYEE_MANAGEMENT_LOG_MESSAGES } from "@/lib/log-descriptions/employee-management";
import { EmployeeModel } from "@/lib/models/employee";
import { useState } from "react";
import { EmployeeForm } from "./blocks/employee-form";
import { EmployeeTable } from "./blocks/employee-table";
import { ChangePasswordModal } from "./modals/change-password-modal";
import { CompensationModal } from "./modals/compensation-modal";
import { DependentsModal } from "./modals/dependents-modal";
import { EmployeeDetailsModal } from "./modals/employee-details-modal";
import { EmployeeProfileModal } from "./modals/employee-profile-modal";
import { EmployeeLogModal } from "./modals/employee-log-modal";
import { DeleteEmployeeModal } from "./modals/delete-employee-modal";

export default function EmployeeManagement() {
    const { showToast } = useToast();
    const { employees, hrSettings } = useFirestore();
    const { userData } = useAuth();
    const monthlyWorkingHours = hrSettings.payrollSettings?.at(0)?.monthlyWorkingHours ?? 173;
    const { theme } = useTheme();

    const [showForm, setShowForm] = useState<boolean>(false);
    const [showDetailsModal, setShowDetailsModal] = useState<boolean>(false);
    const [showProfileModal, setShowProfileModal] = useState<boolean>(false);
    const [showChangePasswordModal, setShowChangePasswordModal] = useState<boolean>(false);
    const [showEmployeeLogModal, setShowEmployeeLogModal] = useState<boolean>(false);
    const [showCompensationModal, setShowCompensationModal] = useState<boolean>(false);
    const [showDependentsModal, setShowDependentsModal] = useState<boolean>(false);
    const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
    const [editingEmployee, setEditingEmployee] = useState<EmployeeModel | undefined>();
    const [selectedEmployee, setSelectedEmployee] = useState<EmployeeModel | undefined>();

    const [isLoading, setIsLoading] = useState<boolean>(false);

    const handleAddEmployee = () => {
        setEditingEmployee(undefined);
        setShowForm(true);
        setIsLoading(false);
    };

    const handleEditEmployee = (employee: EmployeeModel) => {
        setEditingEmployee(employee);
        setShowForm(true);
        setShowDetailsModal(false);
    };

    const handleRowClick = (employee: EmployeeModel) => {
        setSelectedEmployee(employee);
        setShowDetailsModal(true);
    };

    const handleChangePassword = (employee: EmployeeModel) => {
        setSelectedEmployee(employee);
        setShowChangePasswordModal(true);
    };

    const handleViewProfile = (employee: EmployeeModel) => {
        setSelectedEmployee(employee);
        setShowProfileModal(true);
    };

    const handleViewEmployeeLog = (employee: EmployeeModel) => {
        setSelectedEmployee(employee);
        setShowEmployeeLogModal(true);
    };

    const handleViewCompensation = (employee: EmployeeModel) => {
        setSelectedEmployee(employee);
        setShowCompensationModal(true);
    };

    const handleManageDependents = (employee: EmployeeModel) => {
        setSelectedEmployee(employee);
        setShowDependentsModal(true);
    };

    const handleDeleteEmployee = (employee: EmployeeModel) => {
        setSelectedEmployee(employee);
        setShowDeleteModal(true);
    };

    const handleSaveEmployee = async (employee: EmployeeModel) => {
        employee.role = [...(employee?.role?.filter(r => r !== "Employee") ?? []), "Employee"];
        const salary: number = Number(employee.salary) ?? 0;
        const hourlyWage = await calculateHourlyWage(salary, monthlyWorkingHours);

        // Remove password from employee data for database operations
        const { password, ...employeeWithoutPassword } = employee;

        // Enable loading state for both edit and create operations
        setIsLoading(true);

        try {
            if (editingEmployee) {
                // For editing, exclude password from database save
                const updatedEmployee = {
                    ...employeeWithoutPassword,
                    id: editingEmployee.id,
                    hourlyWage,
                } as EmployeeModel;

                // Detect if companyEmail has changed to update Firebase Auth
                // Use optional chaining to handle cases where companyEmail might be undefined
                const currentEmail = (updatedEmployee.companyEmail ?? "").toLowerCase();
                const originalEmail = (editingEmployee.companyEmail ?? "").toLowerCase();
                const emailChanged = currentEmail !== originalEmail;

                // First update Firebase Auth if email changed
                if (emailChanged) {
                    // Ensure we have a valid email before proceeding
                    if (
                        !updatedEmployee.companyEmail ||
                        updatedEmployee.companyEmail.trim() === ""
                    ) {
                        showToast("Company email is required", "error", "error");
                        setIsLoading(false);
                        return;
                    }

                    interface PatchUserData {
                        uid: string;
                        role: string[];
                        email: string;
                    }

                    const patchData: PatchUserData = {
                        uid: updatedEmployee.uid,
                        role: updatedEmployee.role,
                        email: updatedEmployee.companyEmail,
                    };

                    const authRes = await fetch("/api/register-user", {
                        method: "PATCH",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify(patchData),
                    });

                    const authResult = await authRes.json();

                    if (!authResult.success) {
                        showToast(
                            `Failed to update login email: ${authResult.message}`,
                            "error",
                            "error",
                        );
                        return; // Stop execution if Firebase Auth update fails
                    }
                } else {
                    // Update only role if email hasn't changed
                    interface PatchUserData {
                        uid: string;
                        role: string[];
                    }

                    const patchData: PatchUserData = {
                        uid: updatedEmployee.uid,
                        role: updatedEmployee.role,
                    };

                    const authRes = await fetch("/api/register-user", {
                        method: "PATCH",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify(patchData),
                    });

                    const authResult = await authRes.json();

                    if (!authResult.success) {
                        showToast(
                            `Failed to update user role: ${authResult.message}`,
                            "error",
                            "error",
                        );
                        return; // Stop execution if role update fails
                    }
                }

                // Then update the database record
                const actualDocumentId = await getEmployeeDocumentId(updatedEmployee.uid);
                if (actualDocumentId) {
                    const employeeForUpdate = { ...updatedEmployee, id: actualDocumentId };
                    const updateResult = await updateEmployee(
                        employeeForUpdate,
                        userData?.uid ?? "",
                        EMPLOYEE_MANAGEMENT_LOG_MESSAGES.EMPLOYEE_UPDATED(
                            `${updatedEmployee.firstName} ${updatedEmployee.surname}`,
                        ),
                    );
                    if (updateResult) {
                        const successMessage = emailChanged
                            ? "Employee updated successfully. Login email has been updated."
                            : "Employee updated successfully.";
                        showToast(successMessage, "success", "success");
                    } else {
                        showToast("Failed to update employee record", "error", "error");
                    }
                } else {
                    // Fallback: try with original ID if UID lookup failed
                    const fallbackResult = await updateEmployee(
                        updatedEmployee,
                        userData?.uid ?? "",
                        EMPLOYEE_MANAGEMENT_LOG_MESSAGES.EMPLOYEE_UPDATED(
                            `${updatedEmployee.firstName} ${updatedEmployee.surname}`,
                        ),
                    );
                    if (fallbackResult) {
                        const successMessage = emailChanged
                            ? "Employee updated successfully. Login email has been updated."
                            : "Employee updated successfully.";
                        showToast(successMessage, "success", "success");
                    } else {
                        showToast("Failed to find and update employee record", "error", "error");
                    }
                }
            } else {
                // 1. Register the user in Firebase Auth (includes password)
                const res = await fetch("/api/register-user", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(employee),
                });

                const result = await res.json();
                if (result.success) {
                    // 2. Save to database without password
                    const newEmployee = {
                        ...employeeWithoutPassword,
                        uid: result.uid,
                        hourlyWage,
                        trainingDetail: employeeWithoutPassword.trainingDetail ?? [],
                        languageSkills: employeeWithoutPassword.languageSkills ?? [],
                    } as EmployeeModel; // Type assertion to satisfy EmployeeModel type

                    const res2 = await createEmployee(
                        newEmployee,
                        userData?.uid ?? "",
                        EMPLOYEE_MANAGEMENT_LOG_MESSAGES.EMPLOYEE_CREATED(
                            `${newEmployee.firstName} ${newEmployee.surname}`,
                        ),
                    );
                    if (res2) {
                        showToast("Employee saved successfully", "success", "success");
                        const res3 = await generateAttendanceForEmployee(
                            result.uid,
                            newEmployee.shiftType,
                            userData?.uid ?? "",
                            ATTENDANCE_LOG_MESSAGES.GENERATED(
                                `${newEmployee.firstName} ${newEmployee.surname}`,
                            ),
                        );
                        if (res3.success) {
                            showToast("Attendance generated successfully", "Success", "success");
                        } else {
                            showToast(
                                "Error generating attendance, please remove the created employee and try again",
                                "Error",
                                "error",
                                5000,
                            );
                        }
                    } else {
                        showToast("Error saving employee", "Error", "error");
                    }
                } else {
                    showToast(result.message, "error", "error");
                }
            }

            // Handle reportees array updates for reporting line manager changes
            const previousManagerUid = editingEmployee?.reportingLineManager;
            const newManagerUid = employee.reportingLineManager;

            // Case 1: Remove from previous manager if there was one and it's different from new manager
            if (previousManagerUid && previousManagerUid !== newManagerUid) {
                const previousManager = employees.find(e => e.uid === previousManagerUid);
                if (previousManager?.id) {
                    const updatedReportees = Array.isArray(previousManager.reportees)
                        ? previousManager.reportees.filter(r => r !== employee.uid)
                        : [];
                    await updateEmployee(
                        { id: previousManager.id, reportees: updatedReportees },
                        userData?.uid ?? "",
                        EMPLOYEE_MANAGEMENT_LOG_MESSAGES.EMPLOYEE_UPDATED(
                            `${previousManager.firstName} ${previousManager.surname}`,
                        ),
                    );
                }
            }

            // Case 2: Add to new manager if there is one and it's different from previous manager
            if (newManagerUid && newManagerUid !== previousManagerUid) {
                const newManager = employees.find(e => e.uid === newManagerUid);
                if (newManager?.id) {
                    const updatedReportees = Array.isArray(newManager.reportees)
                        ? [...newManager.reportees.filter(r => r !== employee.uid), employee.uid]
                        : [employee.uid];
                    await updateEmployee(
                        { id: newManager.id, reportees: updatedReportees },
                        userData?.uid ?? "",
                        EMPLOYEE_MANAGEMENT_LOG_MESSAGES.EMPLOYEE_UPDATED(
                            `${newManager.firstName} ${newManager.surname}`,
                        ),
                    );
                }
            }

            setShowForm(false);
            setEditingEmployee(undefined);
        } catch (error) {
            console.error("Error saving employee:", error);
            showToast("Failed to save employee", "error", "error");
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancel = () => {
        setShowForm(false);
        setEditingEmployee(undefined);
    };

    const handleCloseModals = () => {
        setShowDetailsModal(false);
        setShowProfileModal(false);
        setShowChangePasswordModal(false);
        setShowEmployeeLogModal(false);
        setShowCompensationModal(false);
        setShowDependentsModal(false);
        setSelectedEmployee(undefined);
    };

    return (
        <div className={`min-h-screen ${theme === "dark" ? "bg-black" : "bg-secondary-50"}`}>
            <div className="mx-auto">
                <EmployeeTable
                    employees={employees}
                    onAddEmployee={handleAddEmployee}
                    onEditEmployee={handleEditEmployee}
                    onRowClick={handleRowClick}
                    onViewProfile={handleViewProfile}
                    onChangePassword={handleChangePassword}
                    onViewEmployeeLog={handleViewEmployeeLog}
                    onViewCompensation={handleViewCompensation}
                    onManageDependents={handleManageDependents}
                    onDeleteEmployee={handleDeleteEmployee}
                />

                {showForm && (
                    <EmployeeForm
                        isLoading={isLoading}
                        setIsLoading={setIsLoading}
                        employee={editingEmployee}
                        onSave={handleSaveEmployee}
                        onCancel={handleCancel}
                    />
                )}

                {showDetailsModal && selectedEmployee && (
                    <EmployeeDetailsModal
                        employee={selectedEmployee}
                        onClose={handleCloseModals}
                        onEdit={handleEditEmployee}
                    />
                )}

                {showProfileModal && selectedEmployee && (
                    <EmployeeProfileModal
                        employee={selectedEmployee}
                        onClose={handleCloseModals}
                        onSaveSuccess={updated => setSelectedEmployee(updated)}
                    />
                )}

                {showChangePasswordModal && selectedEmployee && (
                    <ChangePasswordModal employee={selectedEmployee} onClose={handleCloseModals} />
                )}

                {showEmployeeLogModal && selectedEmployee && (
                    <EmployeeLogModal employee={selectedEmployee} onClose={handleCloseModals} />
                )}

                {showCompensationModal && selectedEmployee && (
                    <CompensationModal
                        isOpen={showCompensationModal}
                        employee={selectedEmployee}
                        onClose={handleCloseModals}
                    />
                )}

                {showDependentsModal && selectedEmployee && (
                    <DependentsModal employee={selectedEmployee} onClose={handleCloseModals} />
                )}

                {showDeleteModal && selectedEmployee && (
                    <DeleteEmployeeModal
                        open={showDeleteModal}
                        onOpenChange={handleCloseModals}
                        employee={selectedEmployee}
                    />
                )}
            </div>
        </div>
    );
}
