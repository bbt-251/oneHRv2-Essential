"use client";

import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock, LogIn, Home, UserX, AlertCircle } from "lucide-react";

interface UnauthorizedPageProps {
    redirectToLogin?: boolean; // if true, show login button
    defaultReason?: string; // default reason if no query param provided
}

// Reason messages mapped to codes
const reasonMessages: Record<
    string,
    { title: string; description: string; icon: React.ReactNode }
> = {
    "no-user-data": {
        title: "User Data Not Loaded",
        description:
            "Your account information is still loading. Please refresh the page or try logging in again.",
        icon: <UserX className="h-6 w-6 text-warning" />,
    },
    "auth-loading": {
        title: "Loading...",
        description: "Please wait while we verify your account.",
        icon: <UserX className="h-6 w-6 text-warning" />,
    },
    "no-employee-record": {
        title: "Employee Record Not Found",
        description:
            "No employee record was found matching your account. Please contact your HR administrator to add you to the system.",
        icon: <UserX className="h-6 w-6 text-warning" />,
    },
    "no-role": {
        title: "No Role Assigned",
        description:
            "Your account does not have a role assigned. Please contact your HR administrator to assign you a role.",
        icon: <UserX className="h-6 w-6 text-warning" />,
    },
    "role-not-allowed": {
        title: "Role Not Permitted",
        description:
            "Your role does not have permission to access this page. Contact your administrator if you believe this is an error.",
        icon: <Lock className="h-6 w-6 text-warning" />,
    },
    "page-not-allowed": {
        title: "Access Denied",
        description:
            "You do not have permission to access this specific page with your current role.",
        icon: <Lock className="h-6 w-6 text-warning" />,
    },
    "auth-error": {
        title: "Authentication Error",
        description:
            "There was a problem verifying your account. Please sign out and sign in again.",
        icon: <AlertCircle className="h-6 w-6 text-warning" />,
    },
};

export default function UnauthorizedPage({
    redirectToLogin = true,
    defaultReason,
}: UnauthorizedPageProps) {
    const searchParams = useSearchParams();
    const reasonCode = searchParams.get("reason") || defaultReason || "";

    // Get the reason details from the code
    const reasonDetails =
        reasonCode && reasonMessages[reasonCode] ? reasonMessages[reasonCode] : null;

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-warning/10">
                        {reasonDetails?.icon || <Lock className="h-6 w-6 text-warning" />}
                    </div>
                    <CardTitle className="text-xl">
                        {reasonDetails?.title || "Unauthorized Access"}
                    </CardTitle>
                    <CardDescription className="text-left">
                        {reasonDetails?.description || (
                            <>
                                You don&apos;t have permission to view this page. <br />
                                {redirectToLogin
                                    ? "Please login with the correct account or return to the homepage."
                                    : "Return to the homepage to continue browsing."}
                            </>
                        )}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Debug info for developers - only show in development */}
                    {process.env.NODE_ENV === "development" && reasonCode && (
                        <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
                            <p className="font-mono">Reason code: {reasonCode}</p>
                        </div>
                    )}
                    <div className="text-center text-sm text-muted-foreground">
                        <p>If you believe this is a mistake, contact the system administrator.</p>
                    </div>
                    <div className="flex gap-2 justify-center">
                        {redirectToLogin && (
                            <Button
                                onClick={() => (window.location.href = "/")}
                                variant="outline"
                                size="sm"
                            >
                                <LogIn className="mr-2 h-4 w-4" />
                                Login
                            </Button>
                        )}
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
