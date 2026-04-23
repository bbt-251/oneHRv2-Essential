"use client";

import type React from "react";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Key, Eye, EyeOff, Loader2 } from "lucide-react";
import type { EmployeeModel } from "@/lib/models/employee";
import { useTheme } from "@/components/theme-provider";
import { useToast } from "@/context/toastContext";
import { EmployeeRepository } from "@/lib/repository/employee";

interface ChangePasswordModalProps {
    employee: EmployeeModel;
    onClose: () => void;
}

export function ChangePasswordModal({ employee, onClose }: ChangePasswordModalProps) {
    const { theme } = useTheme();
    const { showToast } = useToast();
    const [newPassword, setNewPassword] = useState<string>("");
    const [confirmPassword, setConfirmPassword] = useState<string>("");
    const [showPassword, setShowPassword] = useState<boolean>(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (newPassword !== confirmPassword) {
            showToast("Passwords do not match", "Error", "error");
            return;
        }

        if (newPassword.length < 8) {
            showToast("Password must be at least 8 characters long", "Error", "error");
            return;
        }

        if (!employee.id) {
            showToast("Employee record not found", "Error", "error");
            return;
        }

        setIsLoading(true);

        try {
            const response = await EmployeeRepository.updateEmployee({
                id: employee.id,
                password: newPassword,
                lastChanged: new Date().toISOString(),
                passwordRecovery: {
                    timestamp: "",
                    token: "",
                },
            });
            if (response.success) {
                showToast("Password changed successfully", "Success", "success");
                onClose();
            } else {
                showToast(response.message, "Error", "error");
            }
        } catch (error) {
            console.error("Error changing password:", error);
            showToast("Failed to change password", "Error", "error");
        } finally {
            setIsLoading(false);
        }
    };

    const generatePassword = () => {
        const upperChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        const lowerChars = "abcdefghijklmnopqrstuvwxyz";
        const numberChars = "0123456789";
        const allChars = upperChars + lowerChars + numberChars + "!@#$%^&*";

        // Ensure at least one of each required character type
        const upper = upperChars.charAt(Math.floor(Math.random() * upperChars.length));
        const lower = lowerChars.charAt(Math.floor(Math.random() * lowerChars.length));
        const number = numberChars.charAt(Math.floor(Math.random() * numberChars.length));

        // Generate remaining characters from full set
        let password = upper + lower + number;
        for (let i = 0; i < 9; i++) {
            password += allChars.charAt(Math.floor(Math.random() * allChars.length));
        }

        // Shuffle the password
        password = password
            .split("")
            .sort(() => Math.random() - 0.5)
            .join("");

        setNewPassword(password);
        setConfirmPassword(password);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div
                className={`${theme === "dark" ? "bg-black border border-gray-800" : "bg-white"} rounded-lg w-full max-w-md overflow-hidden shadow-xl`}
            >
                <div
                    className={`flex items-center justify-between p-6 border-b ${theme === "dark" ? "border-gray-800" : "border-gray-200"}`}
                >
                    <div className="flex items-center gap-2">
                        <Key
                            className={`w-5 h-5 ${theme === "dark" ? "text-white" : "text-primary-600"}`}
                        />
                        <h2
                            className={`text-xl font-semibold ${theme === "dark" ? "text-white" : "text-primary-900"}`}
                        >
                            Change Password
                        </h2>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onClose}
                        className={theme === "dark" ? "text-white hover:bg-gray-800" : ""}
                    >
                        <X className="w-4 h-4" />
                    </Button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div
                        className={`${theme === "dark" ? "bg-gray-900" : "bg-secondary-50"} p-4 rounded-lg`}
                    >
                        <p
                            className={`text-sm ${theme === "dark" ? "text-gray-200" : "text-primary-800"}`}
                        >
                            <strong>Employee:</strong> {employee.firstName} {employee.surname}
                        </p>
                        <p
                            className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-primary-700"}`}
                        >
                            ID: {employee.employeeID}
                        </p>
                    </div>

                    <div>
                        <Label
                            htmlFor="newPassword"
                            className={theme === "dark" ? "text-gray-300" : ""}
                        >
                            New Password
                        </Label>
                        <div className="relative mt-1">
                            <Input
                                id="newPassword"
                                type={showPassword ? "text" : "password"}
                                value={newPassword}
                                onChange={e => setNewPassword(e.target.value)}
                                required
                                minLength={8}
                                className={`pr-10 ${theme === "dark" ? "bg-black text-white border-gray-600 placeholder:text-gray-500" : ""}`}
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className={`absolute right-0 top-0 h-full px-3 ${theme === "dark" ? "text-white" : ""}`}
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? (
                                    <EyeOff className="h-4 w-4" />
                                ) : (
                                    <Eye className="h-4 w-4" />
                                )}
                            </Button>
                        </div>
                    </div>

                    <div>
                        <Label
                            htmlFor="confirmPassword"
                            className={theme === "dark" ? "text-gray-300" : ""}
                        >
                            Confirm Password
                        </Label>
                        <div className="relative mt-1">
                            <Input
                                id="confirmPassword"
                                type={showConfirmPassword ? "text" : "password"}
                                value={confirmPassword}
                                onChange={e => setConfirmPassword(e.target.value)}
                                required
                                minLength={8}
                                className={`pr-10 ${theme === "dark" ? "bg-black text-white border-gray-600 placeholder:text-gray-500" : ""}`}
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className={`absolute right-0 top-0 h-full px-3 ${theme === "dark" ? "text-white" : ""}`}
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            >
                                {showConfirmPassword ? (
                                    <EyeOff className="h-4 w-4" />
                                ) : (
                                    <Eye className="h-4 w-4" />
                                )}
                            </Button>
                        </div>
                    </div>

                    <Button
                        type="button"
                        variant="outline"
                        onClick={generatePassword}
                        className={`w-full ${theme === "dark" ? "border-gray-600 text-white hover:bg-gray-800 hover:text-white" : "bg-transparent"}`}
                    >
                        Generate Secure Password
                    </Button>

                    <div
                        className={`text-xs p-3 rounded ${theme === "dark" ? "bg-gray-900 text-gray-400" : "bg-gray-50 text-gray-600"}`}
                    >
                        <p>Password requirements:</p>
                        <ul className="list-disc list-inside mt-1 space-y-1">
                            <li>At least 6 characters long</li>
                            <li>At least one uppercase letter (A-Z)</li>
                            <li>At least one lowercase letter (a-z)</li>
                            <li>At least one number (0-9)</li>
                            <li>Special characters recommended for security</li>
                        </ul>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            className={
                                theme === "dark"
                                    ? "text-white border-gray-600 hover:bg-gray-800 hover:text-white"
                                    : ""
                            }
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isLoading}
                            className={
                                theme === "dark"
                                    ? "text-white hover:bg-gray-300"
                                    : "bg-primary-600 hover:bg-primary-700"
                            }
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Changing...
                                </>
                            ) : (
                                "Change Password"
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
