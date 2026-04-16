"use client";

import { AuthProvider } from "@/context/authContext";
import { ToastProviderWrapper } from "@/context/toastContext";
import type { ReactNode } from "react";
import { FirestoreProvider } from "./firestore-context";
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
                    <FirestoreProvider>
                        <ClassErrorBoundary>
                            {/* <ForcePointerEvents /> */}
                            {children}
                        </ClassErrorBoundary>
                    </FirestoreProvider>
                </AuthProvider>
            </ToastProviderWrapper>
        </ThemeProvider>
    );
}
