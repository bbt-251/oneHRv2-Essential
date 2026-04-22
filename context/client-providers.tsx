"use client";

import { AuthProvider } from "@/context/authContext";
import { AppDataProvider } from "@/context/app-data-context";
import { ToastProviderWrapper } from "@/context/toastContext";
import type { ReactNode } from "react";
import { ThemeProvider } from "@/components/theme-provider";
import ClassErrorBoundary from "@/components/class-error-boundary";

interface ClientProvidersProps {
    children: ReactNode;
}

export default function ClientProviders({ children }: ClientProvidersProps) {
    return (
        <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
            <ToastProviderWrapper>
                <AuthProvider>
                    <AppDataProvider>
                        <ClassErrorBoundary>
                            {/* <ForcePointerEvents /> */}
                            {children}
                        </ClassErrorBoundary>
                    </AppDataProvider>
                </AuthProvider>
            </ToastProviderWrapper>
        </ThemeProvider>
    );
}
