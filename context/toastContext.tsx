"use client";

import {
    Toast,
    ToastDescription,
    ToastProvider,
    ToastTitle,
    ToastViewport,
} from "@/components/ui/toast";
import React, { createContext, useContext, useRef, useState, useCallback } from "react";

type ToastVariant = "success" | "error" | "warning" | "default";
type ToastPriority = "low" | "normal" | "high" | "critical";

type ToastItem = {
    id: string;
    message: string;
    title: string;
    variant: ToastVariant;
    duration: number;
    priority: ToastPriority;
    closing?: boolean;
    timestamp: number;
};

type AnalyticsWindow = Window & {
    gtag?: (command: "event", eventName: string, params: Record<string, string | number>) => void;
};

const createToastId = (): string => crypto.randomUUID();
const getToastTimestamp = (): number => Date.now();

interface ToastContextType {
    showToast: (
        message: string,
        title?: string,
        variant?: ToastVariant,
        timeout?: number,
        priority?: ToastPriority,
    ) => void;
    hideToast: (id: string) => void;
    clearAllToasts: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

const MAX_TOASTS = 5;
const ANIMATION_DURATION = 800;

// Memoized Toast Item Component for performance optimization
const ToastItem = React.memo(
    ({ toast, onClose }: { toast: ToastItem; onClose: (id: string) => void }) => (
        <Toast
            key={toast.id}
            open={!toast.closing}
            onOpenChange={open => {
                if (!open) onClose(toast.id);
            }}
            className={`ToastRoot mb-4 transition-all duration-300 ease-in-out ${
                toast.closing
                    ? "animate-slide-out opacity-0 translate-x-full"
                    : "animate-slide-in opacity-100 translate-x-0"
            } hover:scale-105 active:scale-95`}
            variant={toast.variant}
            duration={toast.duration}
        >
            <ToastTitle className="ToastTitle">{toast.title}</ToastTitle>
            <ToastDescription className="ToastDescription">{toast.message}</ToastDescription>
        </Toast>
    ),
);

ToastItem.displayName = "ToastItem";

// Memoized Toast Container for rendering optimization
const ToastContainer = React.memo(
    ({ toasts, onClose }: { toasts: ToastItem[]; onClose: (id: string) => void }) => (
        <div className="fixed top-4 right-4 z-50 space-y-2 max-h-screen overflow-hidden">
            {toasts.slice(-MAX_TOASTS).map(toast => (
                <ToastItem key={toast.id} toast={toast} onClose={onClose} />
            ))}
        </div>
    ),
);

ToastContainer.displayName = "ToastContainer";

export const ToastProviderWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<ToastItem[]>([]);
    const queueRef = useRef<ToastItem[]>([]);
    const isProcessingRef = useRef<boolean>(false);

    // Process toast queue with optimized timing
    const processQueue = useCallback(() => {
        if (isProcessingRef.current) return;
        isProcessingRef.current = true;

        const processNext = () => {
            if (queueRef.current.length === 0) {
                isProcessingRef.current = false;
                return;
            }
            const nextToast = queueRef.current.shift();
            if (nextToast) {
                setToasts(prev => {
                    const newToasts = [...prev, nextToast];
                    return newToasts.slice(-MAX_TOASTS); // Keep only latest MAX_TOASTS
                });
            }
            setTimeout(processNext, 100);
        };

        processNext();
    }, []);

    const showToast = useCallback(
        (
            message: string,
            title: string = "Notification",
            variant: ToastVariant = "default",
            timeout: number = 3000,
            priority: ToastPriority = "normal",
        ) => {
            const id = createToastId();
            const timestamp = getToastTimestamp();

            const isDuplicate = toasts.some(
                toast =>
                    toast.message === message &&
                    toast.title === title &&
                    timestamp - toast.timestamp < 2000,
            );

            if (isDuplicate) {
                setToasts(prev =>
                    prev.map(t =>
                        t.message === message && t.title === title
                            ? { ...t, duration: Math.max(t.duration, timeout) }
                            : t,
                    ),
                );
                return;
            }

            const newToast: ToastItem = {
                id,
                message,
                title,
                variant,
                duration: timeout,
                priority,
                timestamp,
            };

            if (priority === "high" || priority === "critical") {
                setToasts(prev => {
                    const newToasts = [newToast, ...prev];
                    return newToasts.slice(-MAX_TOASTS);
                });
            } else {
                queueRef.current.push(newToast);
                processQueue();
            }

            const analyticsWindow =
                typeof window !== "undefined" ? (window as AnalyticsWindow) : undefined;
            if (analyticsWindow?.gtag) {
                analyticsWindow.gtag("event", "toast_shown", {
                    message: message.substring(0, 50),
                    variant,
                    priority,
                    timestamp,
                });
            }
        },
        [processQueue, toasts],
    );

    const hideToast = useCallback((id: string) => {
        setToasts(prev =>
            prev.map(toast => (toast.id === id ? { ...toast, closing: true } : toast)),
        );
        setTimeout(() => {
            setToasts(prev => prev.filter(toast => toast.id !== id));
        }, ANIMATION_DURATION);
    }, []);

    const clearAllToasts = useCallback(() => {
        setToasts(prev => prev.map(toast => ({ ...toast, closing: true })));
        setTimeout(() => {
            setToasts([]);
        }, ANIMATION_DURATION);
    }, []);

    // // Auto-cleanup old toasts every 10 seconds
    // React.useEffect(() => {
    //     const interval = setInterval(() => {
    //         const now = Date.now();
    //         setToasts(prev => prev.filter(toast =>
    //             !toast.closing && (now - toast.timestamp) < toast.duration + 5000
    //         ));
    //     }, 10000);

    //     return () => clearInterval(interval);
    // }, []);

    return (
        <ToastContext.Provider value={{ showToast, hideToast, clearAllToasts }}>
            {children}
            <ToastProvider swipeDirection="right">
                <ToastViewport className="ToastViewport">
                    <ToastContainer toasts={toasts} onClose={hideToast} />
                </ToastViewport>
            </ToastProvider>
        </ToastContext.Provider>
    );
};

export const useToast = (): ToastContextType => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error("useToast must be used within a ToastProviderWrapper");
    }
    return context;
};
