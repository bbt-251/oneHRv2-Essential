"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/context/toastContext";
import { EmployeeModel } from "@/lib/models/employee";
import { getTimestamp } from "@/lib/util/dayjs_format";
import { Loader2 } from "lucide-react";

export default function SetupPage() {
    const { showToast } = useToast();
    const router = useRouter();

    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [employeesExist, setEmployeesExist] = useState<boolean>(false);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [formData, setFormData] = useState<{
        confirmationCode: string;
        firstName: string;
        surname: string;
        personalEmail: string;
        password: string;
        employeeID: string;
    }>({
        confirmationCode: "",
        firstName: "",
        surname: "",
        personalEmail: "",
        password: "",
        employeeID: "",
    });

    const checkEmployeesExist = useCallback(async (): Promise<void> => {
        try {
            const response = await fetch("/api/setup/bootstrap", {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
            });

            const result = await response.json();

            if (result.success && result.usersExist) {
                setEmployeesExist(true);
            }
        } catch {
            showToast("Error checking system status", "Error", "error");
        } finally {
            setIsLoading(false);
        }
    }, [showToast]);

    useEffect(() => {
        void checkEmployeesExist();
    }, [checkEmployeesExist]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value,
        }));
    };

    const validateForm = (): boolean => {
        if (formData.confirmationCode !== "851745") {
            showToast("Invalid confirmation code", "Error", "error");
            return false;
        }

        if (!formData.firstName.trim()) {
            showToast("First name is required", "Error", "error");
            return false;
        }

        if (!formData.surname.trim()) {
            showToast("Surname is required", "Error", "error");
            return false;
        }

        if (!formData.personalEmail.trim()) {
            showToast("Email is required", "Error", "error");
            return false;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.personalEmail)) {
            showToast("Please enter a valid email address", "Error", "error");
            return false;
        }

        if (!formData.password.trim()) {
            showToast("Password is required", "Error", "error");
            return false;
        }

        if (formData.password.length < 6) {
            showToast("Password must be at least 6 characters long", "Error", "error");
            return false;
        }

        if (!formData.employeeID.trim()) {
            showToast("Employee ID is required", "Error", "error");
            return false;
        }

        return true;
    };

    const createDefaultEmployee = (): Omit<EmployeeModel, "id"> => {
        const timestamp = getTimestamp();

        return {
            timestamp,
            uid: "", // Will be set after account creation

            // User provided fields
            firstName: formData.firstName.trim(),
            middleName: null,
            surname: formData.surname.trim(),
            personalEmail: formData.personalEmail.trim(),
            password: formData.password,
            employeeID: formData.employeeID.trim(),

            // Employee information defaults
            birthDate: "",
            birthPlace: "",
            // levelOfEducation: "",
            // educationDetail: [],
            // yearsOfExperience: "",
            // experienceDetail: [],
            // trainingDetail: [],
            // languageSkills: [],
            gender: "",
            maritalStatus: "",
            personalPhoneNumber: "",
            bankAccount: "",
            providentFundAccount: "",
            hourlyWage: 0,
            tinNumber: "",
            passportNumber: "",
            nationalIDNumber: "",
            lastChanged: timestamp,
            passwordRecovery: {
                timestamp: "",
                token: "",
            },
            signature: "",
            signedDocuments: [],
            profilePicture: "",

            // Contract information defaults
            company: "",
            contractType: "",
            contractHour: 0,
            hoursPerWeek: 0,
            contractStatus: "active",
            contractStartingDate: "",
            contractTerminationDate: "",
            contractDuration: [],
            hireDate: "",
            contractDocument: "",
            probationPeriodEndDate: "",
            lastDateOfProbation: "",
            reasonOfLeaving: "",
            salary: 0,
            currency: "",
            eligibleLeaveDays: 0,
            companyEmail: formData.personalEmail.trim(),
            companyPhoneNumber: "",
            associatedTax: "",
            pensionApplication: false,

            // Position information defaults
            employmentPosition: "",
            positionLevel: "",
            section: "",
            department: "",
            workingLocation: "",
            workingArea: "",
            homeLocation: "",
            managerPosition: true,
            reportees: [],
            reportingLineManagerPosition: "",
            reportingLineManager: "",
            gradeLevel: "",
            step: 0,
            shiftType: "Regular",
            role: ["Employee", "Manager", "HR Manager", "Payroll Officer"],
            // performanceScore: 0,
            // successorInformation: [],
            unit: "",

            // Emergency information defaults
            emergencyContactName: "",
            relationshipToEmployee: "",
            phoneNumber1: "",
            phoneNumber2: "",
            emailAddress1: "",
            emailAddress2: "",
            physicalAddress1: "",
            physicalAddress2: "",

            // Training and development defaults
            // starredTrainingMaterials: [],
            // trainingMaterialsProgress: [],
            // trainingMaterialStatus: [],
            // certificationsAcquired: [],
            // announcements: [],
            notifications: [],
            // checklistItems: [],
            timezone: null,
            // checklistItemRemark: [],
            // performance: [],
            claimedOvertimes: [],

            // Promotion interview defaults
            // promotionInterviews: [],
            // promotionInterviewResults: [],

            // Custom fields defaults
            customFields: [],

            // Balance leave days defaults
            balanceLeaveDays: 0,
            accrualLeaveDays: 0,
            lastELDUpdate: "",

            // Document defaults
            documentRequests: {},
            associatedRestrictedDocuments: [],

            telegramChatID: null,
            currentLocation: null,
        };
    };

    const handleSubmit = async (e: React.FormEvent): Promise<void> => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await fetch("/api/setup/bootstrap", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    confirmationCode: formData.confirmationCode,
                    ...createDefaultEmployee(),
                }),
            });

            const result = await response.json();

            if (result.success) {
                showToast(
                    "Setup completed successfully! Super admin created.",
                    "Success",
                    "success",
                );

                setTimeout(() => {
                    router.push("/");
                }, 2000);
            } else {
                showToast(result.message || "Error creating user account", "Error", "error");
            }
        } catch {
            showToast("Failed to complete setup", "Error", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="flex items-center space-x-2">
                    <Loader2 className="h-6 w-6 animate-spin text-foreground" />
                    <span className="text-foreground">Checking system status...</span>
                </div>
            </div>
        );
    }

    if (employeesExist) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-4">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle className="text-center">Setup Complete</CardTitle>
                        <CardDescription className="text-center">
                            The system has already been set up. Please use the login page to access
                            the application.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button onClick={() => router.push("/")} className="w-full">
                            Go to Login
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="text-center">System Setup</CardTitle>
                    <CardDescription className="text-center">
                        Create the super administrator account to get started
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="confirmationCode">Confirmation Code</Label>
                            <Input
                                id="confirmationCode"
                                name="confirmationCode"
                                type="text"
                                placeholder="Enter confirmation code"
                                value={formData.confirmationCode}
                                onChange={handleInputChange}
                                required
                                disabled={isSubmitting}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="firstName">First Name</Label>
                            <Input
                                id="firstName"
                                name="firstName"
                                type="text"
                                placeholder="Enter first name"
                                value={formData.firstName}
                                onChange={handleInputChange}
                                required
                                disabled={isSubmitting}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="surname">Surname</Label>
                            <Input
                                id="surname"
                                name="surname"
                                type="text"
                                placeholder="Enter surname"
                                value={formData.surname}
                                onChange={handleInputChange}
                                required
                                disabled={isSubmitting}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="personalEmail">Email Address</Label>
                            <Input
                                id="personalEmail"
                                name="personalEmail"
                                type="email"
                                placeholder="Enter email address"
                                value={formData.personalEmail}
                                onChange={handleInputChange}
                                required
                                disabled={isSubmitting}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                name="password"
                                type="password"
                                placeholder="Enter password"
                                value={formData.password}
                                onChange={handleInputChange}
                                required
                                disabled={isSubmitting}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="employeeID">Employee ID</Label>
                            <Input
                                id="employeeID"
                                name="employeeID"
                                type="text"
                                placeholder="Enter employee ID"
                                value={formData.employeeID}
                                onChange={handleInputChange}
                                required
                                disabled={isSubmitting}
                            />
                        </div>

                        <Button type="submit" className="w-full" disabled={isSubmitting}>
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Creating Super Admin...
                                </>
                            ) : (
                                "Complete Setup"
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
