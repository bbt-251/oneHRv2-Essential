"use client";

import { Header } from "@/components/header";
import { AppSidebar } from "@/components/sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { useAuth } from "@/context/authContext";
import { redirect } from "next/navigation";
import { useEffect } from "react";

export default function MainLayout({ children }: { children: React.ReactNode }) {
    const { user, authLoading } = useAuth();

    useEffect(() => {
        if (!authLoading && !user) {
            redirect("/");
        }
    }, [user, authLoading]);

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

    // Redirect if not authenticated
    if (!user) {
        return null; // Will redirect in useEffect
    }

    return (
        <SidebarProvider>
            <div className="flex h-screen w-full">
                <AppSidebar />
                <SidebarInset>
                    <Header />
                    <main className="flex-1 overflow-y-auto p-4">{children}</main>
                </SidebarInset>
            </div>
        </SidebarProvider>
    );
}
