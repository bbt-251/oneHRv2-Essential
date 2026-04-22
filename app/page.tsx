"use client";

// Force dynamic rendering to ensure middleware runs
export const dynamic = "force-dynamic";

import { EyeClosedIcon, EyeIcon, Mail, Lock, AlertCircle } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/context/toastContext";
import { useLogin } from "@/hooks/auth/useLogin";
import { usePasswordReset } from "@/hooks/auth/usePasswordReset";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useTheme } from "@/components/theme-provider";
import { useAuth } from "@/context/authContext";

interface LoginFormProps {
    onLogin?: (email: string, password: string) => Promise<boolean>;
    onForgotPassword?: (email: string) => Promise<boolean>;
    onError?: (error: string) => void;
    isLoading?: boolean;
    isPasswordResetLoading?: boolean;
}

function LoginForm({
    onLogin,
    onForgotPassword,
    onError,
    isLoading: externalLoading,
    isPasswordResetLoading,
}: LoginFormProps) {
    const [email, setEmail] = useState<string>("");
    const [password, setPassword] = useState<string>("");
    const [showPassword, setShowPassword] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>("");
    const [showForgotPassword, setShowForgotPassword] = useState<boolean>(false);
    const { theme } = useTheme();

    const validateEmail = (email: string): boolean => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const handleSubmit = async (e: React.FormEvent): Promise<void> => {
        e.preventDefault();
        setError("");

        // Validate form inputs
        if (!email || !password) {
            const errorMsg = "Please fill in all fields";
            setError(errorMsg);
            onError?.(errorMsg);
            return;
        }

        if (!validateEmail(email)) {
            const errorMsg = "Please enter a valid email address";
            setError(errorMsg);
            onError?.(errorMsg);
            return;
        }

        if (password.length < 6) {
            const errorMsg = "Password must be at least 6 characters long";
            setError(errorMsg);
            onError?.(errorMsg);
            return;
        }

        setIsLoading(true);

        try {
            if (onLogin) {
                await onLogin(email, password);
                // Parent component handles redirect after checking userData
            }
        } catch {
            const errorMsg = "Login failed. Please check your credentials.";
            setError(errorMsg);
            onError?.(errorMsg);
        } finally {
            setIsLoading(false);
        }
    };

    const handleForgotPassword = async (e: React.FormEvent): Promise<void> => {
        e.preventDefault();
        setError("");

        // Validate email for password reset
        if (!email) {
            const errorMsg = "Please enter your email address";
            setError(errorMsg);
            onError?.(errorMsg);
            return;
        }

        if (!validateEmail(email)) {
            const errorMsg = "Please enter a valid email address";
            setError(errorMsg);
            onError?.(errorMsg);
            return;
        }

        try {
            if (onForgotPassword) {
                const success = await onForgotPassword(email);
                if (success) {
                    setShowForgotPassword(false);
                    setError("");
                }
            }
        } catch {
            const errorMsg = "Failed to send reset email. Please try again.";
            setError(errorMsg);
            onError?.(errorMsg);
        }
    };

    const loading = externalLoading || isLoading;

    if (showForgotPassword) {
        return (
            <Card
                className={`w-full max-w-md mx-auto ${theme === "dark" ? "bg-black border-slate-700" : "bg-white"}`}
            >
                <CardHeader className="space-y-1">
                    <CardTitle
                        className={`text-2xl font-bold text-center ${theme === "dark" ? "text-white" : "text-gray-900"}`}
                    >
                        Reset Password
                    </CardTitle>
                    <CardDescription
                        className={`text-center ${theme === "dark" ? "text-slate-300" : "text-gray-600"}`}
                    >
                        Enter your email address and we&apos;ll send you a link to reset your
                        password
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleForgotPassword}>
                    <CardContent className="space-y-4">
                        {error && (
                            <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}
                        <div className="space-y-2">
                            <Label
                                htmlFor="reset-email"
                                className={theme === "dark" ? "text-slate-200" : "text-gray-700"}
                            >
                                Email
                            </Label>
                            <div className="relative">
                                <Mail
                                    className={`absolute left-3 top-3 h-4 w-4 ${theme === "dark" ? "text-slate-400" : "text-muted-foreground"}`}
                                />
                                <Input
                                    id="reset-email"
                                    type="email"
                                    placeholder="Enter your company email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    className={`pl-10 ${theme === "dark" ? "bg-slate-700 border-slate-600 text-white placeholder:text-slate-400" : ""}`}
                                    required
                                />
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="flex flex-col space-y-4">
                        <Button
                            type="submit"
                            variant="default"
                            className={`w-full ${theme === "dark" ? "bg-slate-600 hover:bg-slate-500 text-white" : ""}`}
                            disabled={isPasswordResetLoading}
                        >
                            {isPasswordResetLoading ? "Sending..." : "Send Reset Link"}
                        </Button>
                        <Button
                            type="button"
                            variant="link"
                            className={`w-full ${theme === "dark" ? "text-slate-300 hover:text-white" : ""}`}
                            onClick={() => setShowForgotPassword(false)}
                        >
                            Back to Login
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        );
    }

    return (
        <Card
            className={`w-full max-w-md mx-auto ${theme === "dark" ? "bg-black border-slate-700" : "bg-white"}`}
        >
            <CardHeader className="space-y-1">
                <CardTitle
                    className={`text-2xl font-bold text-center ${theme === "dark" ? "text-white" : "text-gray-900"}`}
                >
                    Welcome Back
                </CardTitle>
                <CardDescription
                    className={`text-center ${theme === "dark" ? "text-slate-300" : "text-gray-600"}`}
                >
                    Sign in to your oneHR account
                </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
                <CardContent className="space-y-4">
                    {error && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}
                    <div className="space-y-2">
                        <Label
                            htmlFor="email"
                            className={theme === "dark" ? "text-slate-200" : "text-gray-700"}
                        >
                            Email
                        </Label>
                        <div className="relative">
                            <Mail
                                className={`absolute left-3 top-3 h-4 w-4 ${theme === "dark" ? "text-slate-400" : "text-muted-foreground"}`}
                            />
                            <Input
                                id="email"
                                type="email"
                                placeholder="Enter your company email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                className={`pl-10 ${theme === "dark" ? "bg-slate-700 border-slate-600 text-white placeholder:text-slate-400" : ""}`}
                                required
                            />
                        </div>
                        <p
                            className={`text-sm ${theme === "dark" ? "text-slate-400" : "text-gray-500"}`}
                        >
                            Use your company email address to log in
                        </p>
                    </div>
                    <div className="space-y-2">
                        <Label
                            htmlFor="password"
                            className={theme === "dark" ? "text-slate-200" : "text-gray-700"}
                        >
                            Password
                        </Label>
                        <div className="relative">
                            <Lock
                                className={`absolute left-3 top-3 h-4 w-4 ${theme === "dark" ? "text-slate-400" : "text-muted-foreground"}`}
                            />
                            <Input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                placeholder="Enter your password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                className={`pl-10 pr-10 ${theme === "dark" ? "bg-slate-700 border-slate-600 text-white placeholder:text-slate-400" : ""}`}
                                required
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className={`absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent ${theme === "dark" ? "hover:bg-slate-600" : ""}`}
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? (
                                    <EyeClosedIcon
                                        className={`h-4 w-4 ${theme === "dark" ? "text-slate-400" : "text-muted-foreground"}`}
                                    />
                                ) : (
                                    <EyeIcon
                                        className={`h-4 w-4 ${theme === "dark" ? "text-slate-400" : "text-muted-foreground"}`}
                                    />
                                )}
                            </Button>
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="flex flex-col space-y-4">
                    <Button
                        type="submit"
                        variant="default"
                        className={`w-full ${theme === "dark" ? "bg-slate-600 hover:bg-slate-500 text-white" : ""}`}
                        disabled={loading}
                    >
                        {loading ? "Signing in..." : "Sign In"}
                    </Button>
                    <Button
                        type="button"
                        variant="link"
                        className={`text-sm ${theme === "dark" ? "text-slate-300 hover:text-white" : "text-muted-foreground hover:text-primary"}`}
                        onClick={() => setShowForgotPassword(true)}
                    >
                        Forgot your password?
                    </Button>
                </CardFooter>
            </form>
        </Card>
    );
}

export default function Home() {
    const { user, userData, authLoading, employeeNotFound, signout } = useAuth();
    const { login, isLoading: loginLoading } = useLogin();
    const { sendResetEmail, isLoading: resetLoading } = usePasswordReset();
    const { showToast } = useToast();
    const { theme } = useTheme();
    const router = useRouter();

    const getDefaultRoute = useCallback(() => {
        return "/dashboard";
    }, []);

    const handleLogin = async (email: string, password: string): Promise<boolean> => {
        try {
            const response = await login({ email, password });

            if (response.success && response.user) {
                // Show success toast for successful login
                showToast(`Welcome back!`, "Login Successful", "success", 4000, "high");
                return true;
            } else {
                // Show error toast for failed login
                showToast(
                    response.error || "Login failed",
                    "Login Failed",
                    "error",
                    5000,
                    "critical",
                );
                return false;
            }
        } catch {
            showToast(
                "An unexpected error occurred during login",
                "Login Error",
                "error",
                5000,
                "critical",
            );
            return false;
        }
    };

    // Effect to handle redirect after login - wait for userData or employeeNotFound
    const hasAttemptedLoginRef = useRef<boolean>(false);

    useEffect(() => {
        if (user && hasAttemptedLoginRef.current) {
            if (userData) {
                router.replace(getDefaultRoute());
                hasAttemptedLoginRef.current = false;
            }
            // If employee not found (explicitly set to true), show error and stay on login page
            else if (employeeNotFound === true) {
                showToast(
                    "Employee record not found. Please contact your HR administrator.",
                    "Account Not Found",
                    "error",
                    6000,
                    "critical",
                );
                hasAttemptedLoginRef.current = false;
            }
            // Don't show any error if employeeNotFound is still undefined or false
            // This means the employee lookup is still in progress or hasn't completed
        }
    }, [employeeNotFound, getDefaultRoute, router, showToast, user, userData]);

    useEffect(() => {
        if (authLoading) {
            return;
        }

        if (user && userData) {
            router.replace(getDefaultRoute());
        }
    }, [authLoading, getDefaultRoute, router, user, userData]);

    // Modify handleLogin to set the flag
    const handleLoginWithRedirect = async (email: string, password: string): Promise<boolean> => {
        const result = await handleLogin(email, password);
        if (result) {
            hasAttemptedLoginRef.current = true;
        }
        return result;
    };

    const handleForgotPassword = async (email: string): Promise<boolean> => {
        try {
            const response = await sendResetEmail({ email });

            if (response.success) {
                // Show success toast for password reset
                showToast(
                    `Password reset link has been sent to ${email}`,
                    "Reset Link Sent",
                    "success",
                    4000,
                    "high",
                );
                return true;
            } else {
                // Show error toast for failed password reset
                showToast(
                    response.error || "Failed to send reset email",
                    "Reset Failed",
                    "error",
                    5000,
                    "critical",
                );
                return false;
            }
        } catch {
            showToast(
                "An unexpected error occurred while sending reset email",
                "Reset Error",
                "error",
                5000,
                "critical",
            );
            return false;
        }
    };

    const handleLoginError = (error: string): void => {
        showToast(error, "Login Failed", "error", 5000, "critical");
    };

    // Show loading while checking authentication
    if (authLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-4 text-muted-foreground">Loading...</p>
                </div>
            </div>
        );
    }

    // If user exists but employee not found (explicitly true), show error instead of redirecting
    if (user && employeeNotFound === true) {
        return (
            <div
                className={`min-h-screen flex items-center justify-center p-4 ${
                    theme === "dark"
                        ? "bg-black"
                        : "bg-gradient-to-br from-slate-50 via-white to-slate-100"
                }`}
            >
                <div className="w-full max-w-md">
                    <div className="text-center mb-8">
                        <div
                            className={`mx-auto w-20 h-20 rounded-full flex items-center justify-center mb-4 shadow-lg ${theme === "dark" ? "bg-slate-700" : "bg-muted"}`}
                        >
                            <Image
                                src="/logo.png"
                                alt="oneHR Logo"
                                width={48}
                                height={48}
                                className="w-12 h-12 object-contain"
                                priority
                            />
                        </div>
                        <h1
                            className={`text-3xl font-bold ${theme === "dark" ? "text-white" : "text-gray-900"}`}
                        >
                            oneHR
                        </h1>
                        <p
                            className={`mt-2 ${theme === "dark" ? "text-slate-300" : "text-gray-600"}`}
                        >
                            Human Resources Management System
                        </p>
                    </div>
                    <Card className={theme === "dark" ? "bg-black border-slate-700" : "bg-white"}>
                        <CardHeader>
                            <CardTitle className="text-center text-destructive">
                                Account Not Found
                            </CardTitle>
                            <CardDescription className="text-center">
                                Your employee record was not found in the system. Please contact
                                your HR administrator to add you to the system.
                            </CardDescription>
                        </CardHeader>
                        <CardFooter className="flex justify-center">
                            <Button onClick={signout}>Sign Out</Button>
                        </CardFooter>
                    </Card>
                </div>
            </div>
        );
    }

    if (user && userData) {
        return null;
    }

    return (
        <div
            className={`min-h-screen flex items-center justify-center p-4 ${
                theme === "dark"
                    ? "bg-black"
                    : "bg-gradient-to-br from-slate-50 via-white to-slate-100"
            }`}
        >
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <div
                        className={`mx-auto w-20 h-20 rounded-full flex items-center justify-center mb-4 shadow-lg ${theme === "dark" ? "bg-slate-700" : "bg-muted"}`}
                    >
                        <Image
                            src="/logo.png"
                            alt="oneHR Logo"
                            width={48}
                            height={48}
                            className="w-12 h-12 object-contain"
                            priority
                        />
                    </div>
                    <h1
                        className={`text-3xl font-bold ${theme === "dark" ? "text-white" : "text-gray-900"}`}
                    >
                        oneHR
                    </h1>
                    <p className={`mt-2 ${theme === "dark" ? "text-slate-300" : "text-gray-600"}`}>
                        Human Resources Management System
                    </p>
                    <p
                        className={`text-sm mt-1 ${theme === "dark" ? "text-slate-400" : "text-gray-500"}`}
                    >
                        Comprehensive HR solution for modern organizations
                    </p>
                </div>
                <LoginForm
                    onLogin={handleLoginWithRedirect}
                    onForgotPassword={handleForgotPassword}
                    onError={handleLoginError}
                    isLoading={loginLoading}
                    isPasswordResetLoading={resetLoading}
                />
            </div>
        </div>
    );
}
