"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { EmployeeInfoChangeRequestModel } from "@/lib/models/employee-info-change-request";
import { useFirestore } from "@/context/firestore-context";
import { updateEmployee } from "@/lib/backend/api/employee-management/employee-management-service";
import { updateEmployeeInfoChangeRequest } from "@/lib/backend/api/employee-info-change-request-service";
import { useToast } from "@/context/toastContext";
import {
    CheckCircle,
    XCircle,
    User,
    Phone,
    Mail,
    MapPin,
    FileText,
    Calendar,
    GraduationCap,
} from "lucide-react";
import { useAuth } from "@/context/authContext";

interface ChangeRequestDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    request: EmployeeInfoChangeRequestModel | null;
    isEmployeeView?: boolean;
}

export function ChangeRequestDetailModal({
    isOpen,
    onClose,
    request,
    isEmployeeView = false,
}: ChangeRequestDetailModalProps) {
    const { userData } = useAuth();
    const { employees, hrSettings } = useFirestore();
    const { showToast } = useToast();
    const [isApproving, setIsApproving] = useState(false);
    const [isRejecting, setIsRejecting] = useState(false);

    if (!request) return null;

    const currentEmployee = employees.find(emp => emp.uid === request.uid);

    // Helper function to get employee name from UID
    const getEmployeeName = (uid: string) => {
        const employee = employees.find(emp => emp.uid === uid);
        return employee ? `${employee.firstName} ${employee.surname}` : "Unknown Employee";
    };

    // Format timestamp to MMMM DD, YYYY hh:mm A format
    const formatTimestamp = (timestamp: string) => {
        const date = new Date(timestamp);
        return date.toLocaleString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
            hour: "numeric",
            minute: "numeric",
            hour12: true,
        });
    };

    const getFieldDisplayValue = (field: string, value: string) => {
        if (!value) return "Not specified";

        // Handle dropdown fields that need to show labels instead of IDs
        switch (field) {
            case "levelOfEducation":
                const education = hrSettings.levelOfEducations?.find(e => e.id === value);
                return education?.name || value;
            case "yearsOfExperience":
                const experience = hrSettings.yearsOfExperiences?.find(e => e.id === value);
                return experience?.name || value;
            case "maritalStatus":
                const marital = hrSettings.maritalStatuses?.find(m => m.id === value);
                return marital?.name || value;
            default:
                return value;
        }
    };

    const renderFieldComparison = (
        label: string,
        field: string,
        currentValue: string,
        requestedValue: string,
        icon?: React.ReactNode,
    ) => {
        const isChanged = currentValue !== requestedValue;
        const displayCurrent = getFieldDisplayValue(field, currentValue);
        const displayRequested = getFieldDisplayValue(field, requestedValue);

        // If approved, show only the requested values
        if (request.requestStatus === "approved") {
            return (
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        {icon}
                        <span className="font-medium text-brand-700 dark:text-foreground">
                            {label}
                        </span>
                    </div>
                    <div className="p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded text-sm">
                        {displayRequested || "Not specified"}
                    </div>
                </div>
            );
        }

        // For pending/rejected, show comparison
        return (
            <div className="space-y-2">
                <div className="flex items-center gap-2">
                    {icon}
                    <span className="font-medium text-brand-700 dark:text-foreground">{label}</span>
                    {isChanged && (
                        <Badge variant="secondary" className="text-xs">
                            Changed
                        </Badge>
                    )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <div className="text-xs text-muted-foreground font-medium">Current</div>
                        <div className="p-2 bg-gray-50 dark:bg-muted rounded text-sm">
                            {displayCurrent || "Not specified"}
                        </div>
                    </div>
                    <div className="space-y-1">
                        <div className="text-xs text-muted-foreground font-medium">Requested</div>
                        <div
                            className={`p-2 rounded text-sm ${isChanged ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800" : "bg-gray-50 dark:bg-muted"}`}
                        >
                            {displayRequested || "Not specified"}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const handleApprove = async () => {
        if (!currentEmployee) {
            showToast("Employee not found", "Error", "error");
            return;
        }

        setIsApproving(true);
        try {
            // Prepare the employee update data
            const employeeUpdateData = {
                id: currentEmployee.id,
                // Employee Information fields
                firstName: request.firstName || currentEmployee.firstName,
                middleName: request.middleName || currentEmployee.middleName,
                surname: request.surname || currentEmployee.surname,
                birthDate: request.birthDate || currentEmployee.birthDate,
                birthPlace: request.birthPlace || currentEmployee.birthPlace,
                levelOfEducation: request.levelOfEducation || currentEmployee.levelOfEducation,
                yearsOfExperience: request.yearsOfExperience || currentEmployee.yearsOfExperience,
                maritalStatus: request.maritalStatus || currentEmployee.maritalStatus,
                personalPhoneNumber: request.personalPhone || currentEmployee.personalPhoneNumber,
                personalEmail: request.personalEmail || currentEmployee.personalEmail,
                bankAccount: request.bankAccount || currentEmployee.bankAccount,
                tinNumber: request.tinNumber || currentEmployee.tinNumber,

                // Emergency Contact fields
                emergencyContactName:
                    request.emergencyContactName || currentEmployee.emergencyContactName,
                relationshipToEmployee:
                    request.relationshipToEmployee || currentEmployee.relationshipToEmployee,
                phoneNumber1: request.phoneNumber1 || currentEmployee.phoneNumber1,
                phoneNumber2: request.phoneNumber2 || currentEmployee.phoneNumber2,
                emailAddress1: request.emailAddress1 || currentEmployee.emailAddress1,
                emailAddress2: request.emailAddress2 || currentEmployee.emailAddress2,
                physicalAddress1: request.physicalAddress1 || currentEmployee.physicalAddress1,
                physicalAddress2: request.physicalAddress2 || currentEmployee.physicalAddress2,
            };

            // Update the employee record
            const employeeUpdateSuccess = await updateEmployee(employeeUpdateData);

            if (employeeUpdateSuccess) {
                // Update the request status
                const requestUpdateSuccess = await updateEmployeeInfoChangeRequest({
                    id: request.id,
                    requestStatus: "approved",
                    reviewedDate: new Date().toISOString(),
                    reviewedBy: userData?.uid,
                });

                if (requestUpdateSuccess) {
                    showToast(
                        "Change request approved and employee information updated successfully",
                        "Success",
                        "success",
                    );
                    onClose();
                } else {
                    showToast(
                        "Employee updated but failed to update request status",
                        "Warning",
                        "error",
                    );
                }
            } else {
                showToast("Failed to update employee information", "Error", "error");
            }
        } catch (error) {
            console.error("Error approving change request:", error);
            showToast("An error occurred while approving the request", "Error", "error");
        } finally {
            setIsApproving(false);
        }
    };

    const handleReject = async () => {
        setIsRejecting(true);
        try {
            const success = await updateEmployeeInfoChangeRequest({
                id: request.id,
                requestStatus: "rejected",
                reviewedDate: new Date().toISOString(),
                // reviewedBy: currentUser?.uid // Would need to get current user
            });

            if (success) {
                showToast("Change request rejected", "Success", "success");
                onClose();
            } else {
                showToast("Failed to reject change request", "Error", "error");
            }
        } catch (error) {
            console.error("Error rejecting change request:", error);
            showToast("An error occurred while rejecting the request", "Error", "error");
        } finally {
            setIsRejecting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold text-brand-700 dark:text-foreground">
                        Change Request Details
                    </DialogTitle>
                    <div className="flex items-center gap-4 mt-2">
                        <Badge
                            variant={
                                request.requestStatus === "pending"
                                    ? "secondary"
                                    : request.requestStatus === "approved"
                                        ? "default"
                                        : "destructive"
                            }
                            className={
                                request.requestStatus === "approved"
                                    ? "bg-green-100 text-green-700"
                                    : request.requestStatus === "rejected"
                                        ? "bg-red-100 text-red-700"
                                        : ""
                            }
                        >
                            {request.requestStatus.charAt(0).toUpperCase() +
                                request.requestStatus.slice(1)}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                            Submitted on {new Date(request.timestamp).toLocaleDateString()}
                        </span>
                    </div>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Employee Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <User className="h-5 w-5" />
                                Employee Information Changes
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {renderFieldComparison(
                                    "First Name",
                                    "firstName",
                                    currentEmployee?.firstName || "",
                                    request.firstName,
                                )}
                                {renderFieldComparison(
                                    "Middle Name",
                                    "middleName",
                                    currentEmployee?.middleName || "",
                                    request.middleName,
                                )}
                                {renderFieldComparison(
                                    "Surname",
                                    "surname",
                                    currentEmployee?.surname || "",
                                    request.surname,
                                )}
                                {renderFieldComparison(
                                    "Birth Date",
                                    "birthDate",
                                    currentEmployee?.birthDate || "",
                                    request.birthDate,
                                    <Calendar className="h-4 w-4" />,
                                )}
                                {renderFieldComparison(
                                    "Birth Place",
                                    "birthPlace",
                                    currentEmployee?.birthPlace || "",
                                    request.birthPlace,
                                    <MapPin className="h-4 w-4" />,
                                )}
                                {renderFieldComparison(
                                    "Level of Education",
                                    "levelOfEducation",
                                    currentEmployee?.levelOfEducation || "",
                                    request.levelOfEducation,
                                    <GraduationCap className="h-4 w-4" />,
                                )}
                                {renderFieldComparison(
                                    "Years of Experience",
                                    "yearsOfExperience",
                                    currentEmployee?.yearsOfExperience || "",
                                    request.yearsOfExperience,
                                )}
                                {renderFieldComparison(
                                    "Marital Status",
                                    "maritalStatus",
                                    currentEmployee?.maritalStatus || "",
                                    request.maritalStatus,
                                )}
                                {renderFieldComparison(
                                    "Personal Phone",
                                    "personalPhone",
                                    currentEmployee?.personalPhoneNumber || "",
                                    request.personalPhone,
                                    <Phone className="h-4 w-4" />,
                                )}
                                {renderFieldComparison(
                                    "Personal Email",
                                    "personalEmail",
                                    currentEmployee?.personalEmail || "",
                                    request.personalEmail,
                                    <Mail className="h-4 w-4" />,
                                )}
                                {renderFieldComparison(
                                    "Bank Account",
                                    "bankAccount",
                                    currentEmployee?.bankAccount || "",
                                    request.bankAccount,
                                )}
                                {renderFieldComparison(
                                    "TIN Number",
                                    "tinNumber",
                                    currentEmployee?.tinNumber || "",
                                    request.tinNumber,
                                    <FileText className="h-4 w-4" />,
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Emergency Contact Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Phone className="h-5 w-5" />
                                Emergency Contact Changes
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {renderFieldComparison(
                                    "Emergency Contact Name",
                                    "emergencyContactName",
                                    currentEmployee?.emergencyContactName || "",
                                    request.emergencyContactName,
                                )}
                                {renderFieldComparison(
                                    "Relationship",
                                    "relationshipToEmployee",
                                    currentEmployee?.relationshipToEmployee || "",
                                    request.relationshipToEmployee,
                                )}
                                {renderFieldComparison(
                                    "Phone Number 1",
                                    "phoneNumber1",
                                    currentEmployee?.phoneNumber1 || "",
                                    request.phoneNumber1,
                                    <Phone className="h-4 w-4" />,
                                )}
                                {renderFieldComparison(
                                    "Phone Number 2",
                                    "phoneNumber2",
                                    currentEmployee?.phoneNumber2 || "",
                                    request.phoneNumber2,
                                    <Phone className="h-4 w-4" />,
                                )}
                                {renderFieldComparison(
                                    "Email Address 1",
                                    "emailAddress1",
                                    currentEmployee?.emailAddress1 || "",
                                    request.emailAddress1,
                                    <Mail className="h-4 w-4" />,
                                )}
                                {renderFieldComparison(
                                    "Email Address 2",
                                    "emailAddress2",
                                    currentEmployee?.emailAddress2 || "",
                                    request.emailAddress2,
                                    <Mail className="h-4 w-4" />,
                                )}
                            </div>
                            <div className="space-y-4">
                                {renderFieldComparison(
                                    "Physical Address 1",
                                    "physicalAddress1",
                                    currentEmployee?.physicalAddress1 || "",
                                    request.physicalAddress1,
                                    <MapPin className="h-4 w-4" />,
                                )}
                                {renderFieldComparison(
                                    "Physical Address 2",
                                    "physicalAddress2",
                                    currentEmployee?.physicalAddress2 || "",
                                    request.physicalAddress2,
                                    <MapPin className="h-4 w-4" />,
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Review Information */}
                    {request.reviewedDate && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Review Information</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <span className="font-medium">Reviewed By:</span>
                                        <span>
                                            {request.reviewedBy
                                                ? getEmployeeName(request.reviewedBy)
                                                : "System"}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="font-medium">Reviewed Date:</span>
                                        <span>{formatTimestamp(request.reviewedDate)}</span>
                                    </div>
                                    {request.hrComments && (
                                        <div className="space-y-1">
                                            <span className="font-medium">Comments:</span>
                                            <div className="p-2 bg-gray-50 dark:bg-muted rounded text-sm">
                                                {request.hrComments}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-accent-200 dark:border-border">
                    <Button variant="outline" onClick={onClose}>
                        Close
                    </Button>
                    {request.requestStatus === "pending" && !isEmployeeView && (
                        <>
                            <Button
                                variant="outline"
                                onClick={handleReject}
                                disabled={isRejecting || isApproving}
                                className="border-red-300 text-red-700 hover:bg-red-50 disabled:opacity-50"
                            >
                                {isRejecting ? (
                                    <>
                                        <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-red-300 border-t-red-700" />
                                        Rejecting...
                                    </>
                                ) : (
                                    <>
                                        <XCircle className="h-4 w-4 mr-2" />
                                        Reject
                                    </>
                                )}
                            </Button>
                            <Button
                                onClick={handleApprove}
                                disabled={isApproving || isRejecting}
                                className="bg-green-600 hover:bg-green-700 text-white disabled:opacity-50"
                            >
                                {isApproving ? (
                                    <>
                                        <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-white border-t-green-300" />
                                        Approving...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle className="h-4 w-4 mr-2" />
                                        Approve & Update
                                    </>
                                )}
                            </Button>
                        </>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
