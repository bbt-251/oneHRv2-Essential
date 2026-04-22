"use client";

import { errorBotURL } from "@/lib/backend/error-reporting";
import { getTimestamp } from "@/lib/util/dayjs_format";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Component, ErrorInfo, ReactNode } from "react";

interface Props {
    children?: ReactNode;
}

interface State {
    hasError: boolean;
}

class ClassErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
    };

    public static getDerivedStateFromError(_: Error): State {
        return { hasError: true };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        const timestamp = getTimestamp();
        const environment = window.location.origin;
        const pathname = window.location.pathname;
        const componentStack = errorInfo.componentStack;

        // Don't send error to Discord if on localhost
        if (!environment.includes("localhost")) {
            fetch(errorBotURL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    content: `${timestamp}\n\nEnvironment: ${environment}\n\nPathName: ${pathname}\n\nTitle: Caught an error\n\nError: ${error}\n\nComponent Stack: ${componentStack}`,
                }),
            })
                .then(() => {
                    // Show toast notification (we'll handle this in the render method)
                    console.log("Error reported successfully");
                })
                .catch(error => {
                    console.error("Error logging the issue:", error);
                });

            // Redirect to home page after 5 seconds
            setTimeout(() => {
                window.location.href = "/";
            }, 5000);
        }
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-background flex items-center justify-center p-4">
                    <Card className="w-full max-w-md">
                        <CardHeader className="text-center">
                            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                                <AlertTriangle className="h-6 w-6 text-destructive" />
                            </div>
                            <CardTitle className="text-xl">Oops! Something went wrong</CardTitle>
                            <CardDescription>
                                We&apos;ve encountered an unexpected error. Don&apos;t worry, our
                                team has been notified.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="text-center text-sm text-muted-foreground">
                                <p>We&apos;re working to fix this issue as quickly as possible.</p>
                                <p className="mt-2">
                                    You&apos;ll be redirected to the home page shortly.
                                </p>
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

        return this.props.children;
    }
}

export default ClassErrorBoundary;
