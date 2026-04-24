import { ThemeToggle } from "@/components/theme-toggle";
import ClientProviders from "@/context/client-providers";
import { Toaster } from "@/components/ui/toaster";
import type { Metadata } from "next";
import React from "react";
import "./globals.css";
import "./scrollbar.css";
import dayjs from "dayjs";
import weekOfYear from "dayjs/plugin/weekOfYear";
import isoWeek from "dayjs/plugin/isoWeek";

dayjs.extend(weekOfYear);
dayjs.extend(isoWeek);

// Force dynamic rendering to ensure middleware runs
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
    title: "oneHR - Comprehensive Human Resources Management System",
    description:
        "A comprehensive HR solution covering the full employee lifecycle from onboarding to offboarding. Features include attendance management, leave management, performance evaluation, talent acquisition, training management, career development, employee engagement, compensation & benefits, and exit management.",
    keywords: [
        "HR Management System",
        "Human Resources",
        "Employee Lifecycle",
        "Attendance Management",
        "Leave Management",
        "Performance Evaluation",
        "Talent Acquisition",
        "Training Management",
        "Career Development",
        "Employee Engagement",
        "Compensation & Benefits",
        "Exit Management",
        "HR Software",
        "HR Platform",
        "Employee Onboarding",
        "Employee Offboarding",
    ],
    authors: [{ name: "oneHR Team" }],
    creator: "oneHR",
    publisher: "oneHR",
    formatDetection: {
        email: false,
        address: false,
        telephone: false,
    },
    metadataBase: new URL("https://onehr.solutions"),
    alternates: {
        canonical: "/",
    },
    openGraph: {
        title: "oneHR - Comprehensive Human Resources Management System",
        description:
            "A comprehensive HR solution covering the full employee lifecycle from onboarding to offboarding with advanced features for modern organizations.",
        url: "https://onehr.solutions",
        siteName: "oneHR",
        images: [
            {
                url: "/logo.png",
                width: 1200,
                height: 630,
                alt: "oneHR Logo",
            },
        ],
        locale: "en_US",
        type: "website",
    },
    twitter: {
        card: "summary_large_image",
        title: "oneHR - Comprehensive Human Resources Management System",
        description:
            "A comprehensive HR solution covering the full employee lifecycle from onboarding to offboarding.",
        images: ["/logo.png"],
    },
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            "max-video-preview": -1,
            "max-image-preview": "large",
            "max-snippet": -1,
        },
    },
    verification: {
        google: "your-google-verification-code",
    },
    category: "Human Resources Management",
    classification: "Business Software",
    other: {
        "application-name": "oneHR",
        "apple-mobile-web-app-title": "oneHR",
        "apple-mobile-web-app-capable": "yes",
        "apple-mobile-web-app-status-bar-style": "default",
        "mobile-web-app-capable": "yes",
        "msapplication-TileColor": "#000000",
        "msapplication-config": "/browserconfig.xml",
    },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en" suppressHydrationWarning={true}>
            <head>
                <script
                    dangerouslySetInnerHTML={{
                        __html: `
                            (function () {
                                var cryptoObject = typeof globalThis !== "undefined" ? globalThis.crypto : undefined;
                                if (!cryptoObject || typeof cryptoObject.randomUUID === "function") {
                                    return;
                                }

                                cryptoObject.randomUUID = function () {
                                    if (typeof cryptoObject.getRandomValues === "function") {
                                        var bytes = cryptoObject.getRandomValues(new Uint8Array(16));
                                        bytes[6] = (bytes[6] & 15) | 64;
                                        bytes[8] = (bytes[8] & 63) | 128;

                                        var hex = Array.from(bytes, function (byte) {
                                            return byte.toString(16).padStart(2, "0");
                                        }).join("");

                                        return (
                                            hex.slice(0, 8) +
                                            "-" +
                                            hex.slice(8, 12) +
                                            "-" +
                                            hex.slice(12, 16) +
                                            "-" +
                                            hex.slice(16, 20) +
                                            "-" +
                                            hex.slice(20)
                                        );
                                    }

                                    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (char) {
                                        var random = Math.floor(Math.random() * 16);
                                        var value = char === "x" ? random : (random & 3) | 8;
                                        return value.toString(16);
                                    });
                                };
                            })();
                        `,
                    }}
                />
                <link rel="icon" href="/favicon.ico" sizes="any" />
                <link rel="icon" href="/logo.png" type="image/png" />
                <link rel="apple-touch-icon" href="/logo.png" />
                <link rel="manifest" href="/manifest.json" />
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                {/* eslint-disable-next-line @next/next/no-page-custom-font */}
                <link
                    href="https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,100..900;1,100..900&display=swap"
                    rel="stylesheet"
                />
                {/* eslint-disable-next-line @next/next/no-page-custom-font */}
                <link
                    href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Poppins:wght@300;400;500;600;700&display=swap"
                    rel="stylesheet"
                />
            </head>
            <body className="font-montserrat" suppressHydrationWarning={true}>
                <React.StrictMode>
                    <ClientProviders>
                        {children}
                        <ThemeToggle />
                        <Toaster />
                    </ClientProviders>
                </React.StrictMode>
            </body>
        </html>
    );
}
