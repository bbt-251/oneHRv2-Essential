"use client";

import { errorBotURL } from "@/lib/backend/firebase/config";
import { useToast } from "@/context/toastContext";
import { getTimestamp } from "@/lib/util/dayjs_format";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from "react";

interface ErrorBoundaryProps {
    children: React.ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error?: Error;
    errorInfo?: React.ErrorInfo;
}

export const ErrorBoundary: React.FC<ErrorBoundaryProps> = ({ children }) => {
    const [state, setState] = useState<ErrorBoundaryState>({ hasError: false });
    const { showToast } = useToast();

    useEffect(() => {
        const handleError = (error: Error, errorInfo: React.ErrorInfo) => {
            const timestamp = getTimestamp();
            const environment = window.location.origin;
            const pathname = window.location.pathname;
            const componentStack = errorInfo.componentStack;

            // Don't send error to Discord if on localhost
            if (environment.includes("localhost") || environment.includes("127.0.0.1")) {
                console.log("Error caught in localhost/development environment:", {
                    timestamp,
                    pathname,
                    error: {
                        name: error.name,
                        message: error.message,
                        cause: error.cause,
                        stack: error.stack?.slice(0, 100),
                    },
                    componentStack: componentStack?.slice(0, 100),
                });
                return;
            }

            // Check if errorBotURL is configured
            if (!errorBotURL) {
                console.warn("No errorBotURL configured for this environment. Error details:", {
                    timestamp,
                    environment,
                    pathname,
                    error: {
                        name: error.name,
                        message: error.message,
                        cause: error.cause,
                        stack: error.stack?.slice(0, 100),
                    },
                    componentStack: componentStack?.slice(0, 100),
                });
                return;
            }

            // Prepare error message content, respecting Discord's 2000 character limit
            const maxStackLength = 300;
            const maxComponentStackLength = 300;
            const maxCauseLength = 100;

            let content = `${timestamp}\n\nEnvironment: ${environment}\n\nPathname: ${pathname}\n\nTitle: Caught an error\n\nError: ${error.name}\n${error.message}`;

            // Add cause if present and within limits
            if (error.cause) {
                const causeStr = `\n${String(error.cause).slice(0, maxCauseLength)}`;
                if (content.length + causeStr.length <= 1950) {
                    content += causeStr;
                }
            }

            // Add stack trace if within limits
            if (error.stack) {
                const stackStr = `\n\nStack: ${error.stack.slice(0, maxStackLength)}`;
                if (content.length + stackStr.length <= 1900) {
                    content += stackStr;
                }
            }

            // Add component stack if within limits
            if (componentStack) {
                const componentStr = `\n\nComponent Stack: ${componentStack.slice(0, maxComponentStackLength)}`;
                if (content.length + componentStr.length <= 1800) {
                    content += componentStr;
                }
            }

            // Add truncation notice if needed
            if (content.length > 1800) {
                content = content.slice(0, 1800) + "\n\n[Message truncated due to length limit]";
            }

            fetch(errorBotURL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    content: content,
                }),
            })
                .then(() => {
                    console.log("Error successfully reported to Discord");
                    showToast(
                        "This error has been logged and reported to our team.",
                        "Error Reported",
                        "success",
                        5000,
                        "high",
                    );
                    showToast(
                        "You will be redirected to the home page in 5 seconds.",
                        "Redirecting",
                        "default",
                        5000,
                        "normal",
                    );
                })
                .catch(fetchError => {
                    console.error("Error logging the issue to Discord:", fetchError);
                    showToast(
                        "Failed to report error to our team.",
                        "Reporting Failed",
                        "error",
                        3000,
                        "normal",
                    );
                });

            // Redirect to home page after 5 seconds
            // setTimeout(() => {
            //     window.location.href = "/";
            // }, 5000);

            setState({ hasError: true, error, errorInfo });
        };

        // Global error handler
        const handleGlobalError = (event: ErrorEvent) => {
            handleError(event.error, {
                componentStack: event.filename || "Unknown component",
            } as React.ErrorInfo);
        };

        // Unhandled promise rejection handler
        const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
            handleError(new Error(event.reason), {
                componentStack: "Unhandled Promise Rejection",
            } as React.ErrorInfo);
        };

        window.addEventListener("error", handleGlobalError);
        window.addEventListener("unhandledrejection", handleUnhandledRejection);

        return () => {
            window.removeEventListener("error", handleGlobalError);
            window.removeEventListener("unhandledrejection", handleUnhandledRejection);
        };
    }, [showToast]);

    if (state.hasError) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-4">
                <Card className="w-full max-w-md">
                    <CardHeader className="text-center">
                        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                            <AlertTriangle className="h-6 w-6 text-destructive" />
                        </div>
                        <CardTitle className="text-xl">Oops! Something went wrong</CardTitle>
                        <CardDescription>
                            We've encountered an unexpected error. Don't worry, our team has been
                            notified.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="text-center text-sm text-muted-foreground">
                            <p>We're working to fix this issue as quickly as possible.</p>
                            <p className="mt-2">You'll be redirected to the home page shortly.</p>
                        </div>
                        <div className="flex gap-2 justify-center">
                            <Button
                                onClick={() => window.location.reload()}
                                variant="outline"
                                size="sm"
                            >
                                <RefreshCw className="mr-2 h-4 w-4" />
                                Try Again
                            </Button>
                            <Button onClick={() => (window.location.href = "/")} size="sm">
                                <Home className="mr-2 h-4 w-4" />
                                Go Home
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return <>{children}</>;
};
