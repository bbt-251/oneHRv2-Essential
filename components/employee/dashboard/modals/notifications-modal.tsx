"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Bell, Calendar } from "lucide-react";
import { useAuth } from "@/context/authContext";
import { useToast } from "@/context/toastContext";
import { updateEmployee } from "@/lib/backend/api/employee-management/employee-management-service";
import { useEffect, useMemo, useState } from "react";
import { ExtendedNotificationModel } from "@/components/header";
import { useRouter } from "next/navigation";

interface NotificationsModalProps {
    isOpen: boolean;
    onClose: () => void;
    userNotifications: ExtendedNotificationModel[];
}

export function NotificationsModal({
    isOpen,
    onClose,
    userNotifications,
}: NotificationsModalProps) {
    const { userData } = useAuth();
    const { showToast } = useToast();
    const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set());
    const router = useRouter();
    const [localNotifications, setLocalNotifications] =
        useState<ExtendedNotificationModel[]>(userNotifications);

    // Sync local state with props when they change
    useEffect(() => {
        setLocalNotifications(userNotifications);
    }, [userNotifications]);

    const markAsRead = async (notificationId: string) => {
        if (!userData) return;

        setUpdatingIds(prev => new Set(prev).add(notificationId));

        // Optimistically update local state
        setLocalNotifications(prev =>
            prev.map(notification =>
                notification.id === notificationId
                    ? { ...notification, isRead: true }
                    : notification,
            ),
        );

        try {
            const currentNotifications = userData.notifications || [];
            const existingIndex = currentNotifications.findIndex(n => n.id === notificationId);

            let updatedNotifications = [...currentNotifications];
            if (existingIndex >= 0) {
                // Update existing entry
                updatedNotifications[existingIndex] = {
                    ...updatedNotifications[existingIndex],
                    isRead: true,
                };
            } else {
                // Add new entry
                updatedNotifications = [
                    ...currentNotifications,
                    {
                        id: notificationId,
                        title: "",
                        message: "",
                        action: null,
                        timestamp: new Date().toISOString(),
                        isRead: true,
                    },
                ];
            }

            const success = await updateEmployee({
                id: userData.id,
                notifications: updatedNotifications,
            });

            if (success) {
                showToast("Notification marked as read", "success", "success");
            } else {
                // Revert optimistic update on failure
                setLocalNotifications(prev =>
                    prev.map(notification =>
                        notification.id === notificationId
                            ? { ...notification, isRead: false }
                            : notification,
                    ),
                );
                showToast("Failed to mark notification as read", "error", "error");
            }
        } catch {
            // Revert optimistic update on error
            setLocalNotifications(prev =>
                prev.map(notification =>
                    notification.id === notificationId
                        ? { ...notification, isRead: false }
                        : notification,
                ),
            );
            showToast("Failed to mark notification as read", "error", "error");
        } finally {
            setUpdatingIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(notificationId);
                return newSet;
            });
        }
    };

    const markAllAsRead = async () => {
        if (!userData) return;

        const unreadNotifications = localNotifications.filter(notification => !notification.isRead);
        if (unreadNotifications.length === 0) return;

        setUpdatingIds(prev => new Set([...prev, ...unreadNotifications.map(n => n.id ?? "")]));

        // Optimistically update local state
        setLocalNotifications(prev =>
            prev.map(notification => ({ ...notification, isRead: true })),
        );

        try {
            const currentNotifications = userData.notifications || [];
            const updatedNotifications = [...currentNotifications];

            unreadNotifications.forEach(notification => {
                const existingIndex = updatedNotifications.findIndex(n => n.id === notification.id);
                if (existingIndex >= 0) {
                    updatedNotifications[existingIndex] = {
                        ...updatedNotifications[existingIndex],
                        isRead: true,
                    };
                } else {
                    updatedNotifications.push({
                        id: notification.id,
                        title: notification.title,
                        message: notification.message,
                        action: notification.action || null,
                        timestamp: notification.timestamp,
                        isRead: true,
                    });
                }
            });

            const success = await updateEmployee({
                id: userData.id,
                notifications: updatedNotifications,
            });

            if (success) {
                showToast("All notifications marked as read", "success", "success");
            } else {
                // Revert optimistic update on failure
                setLocalNotifications(userNotifications);
                showToast("Failed to mark all notifications as read", "error", "error");
            }
        } catch {
            // Revert optimistic update on error
            setLocalNotifications(userNotifications);
            showToast("Failed to mark all notifications as read", "error", "error");
        } finally {
            setUpdatingIds(new Set());
        }
    };

    const getNotificationColor = (type: string) => {
        switch (type) {
            case "approval":
                return "bg-success-100 border-success-200";
            case "reminder":
                return "bg-warning-100 border-warning-200";
            case "info":
                return "bg-brand-100 border-brand-200";
            case "warning":
                return "bg-danger-100 border-danger-200";
            case "success":
                return "bg-success-100 border-success-200";
            default:
                return "bg-accent-100 border-accent-200";
        }
    };

    const unreadCount = localNotifications.filter(notification => !notification.isRead).length;
    const sortedNotifications = useMemo(
        () =>
            [...localNotifications].sort(
                (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
            ),
        [localNotifications],
    );

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader className="pb-6">
                    <DialogTitle className="text-2xl font-bold  flex items-center gap-3">
                        <div className="p-2 rounded-xl">
                            <Bell className="h-6 w-6 text-accent-600" />
                        </div>
                        Notifications
                        {unreadCount > 0 && (
                            <Badge className="bg-danger-500 text-white">{unreadCount} New</Badge>
                        )}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    {sortedNotifications.map(notification => (
                        <Card
                            key={notification.id}
                            className={`border transition-all duration-200 hover:shadow-md ${
                                notification.isRead
                                    ? "border-accent-200 bg-white"
                                    : "border-accent-300 bg-accent-50"
                            }`}
                        >
                            <CardContent className="p-6">
                                <div className="flex items-start gap-4">
                                    {/* <div className={`p-3 rounded-xl ${getNotificationColor(notification.type)}`}>
                                        {getNotificationIcon(notification.type)}
                                    </div> */}

                                    <div className="flex-1 space-y-3">
                                        <div className="flex items-start justify-between gap-4">
                                            <div>
                                                <h3 className="font-bold text-lg flex items-center gap-2">
                                                    {notification.title}
                                                    {!notification.isRead && (
                                                        <div className="w-2 h-2 bg-danger-500 rounded-full"></div>
                                                    )}
                                                </h3>
                                                <p className="text-brand-700 mt-1">
                                                    {notification.message}
                                                </p>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                {notification.action && (
                                                    <Badge className="bg-warning-100 text-warning-700 border-warning-200">
                                                        Action Required
                                                    </Badge>
                                                )}
                                                <Badge
                                                    className={`text-xs px-2 py-1 border ${getNotificationColor(notification.title)}`}
                                                >
                                                    {notification.title}
                                                </Badge>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-1 text-sm text-brand-500">
                                                <Calendar className="h-3 w-3" />
                                                <span>
                                                    {new Date(
                                                        notification.timestamp,
                                                    ).toLocaleString()}
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                {notification.action && (
                                                    <Button
                                                        size="sm"
                                                        className="bg-brand-600 hover:bg-brand-700 text-white"
                                                        onClick={e => {
                                                            if (notification.action) {
                                                                e.stopPropagation();
                                                                router.push(notification.action);
                                                                onClose();
                                                            }
                                                        }}
                                                    >
                                                        Take Action
                                                    </Button>
                                                )}
                                                {!notification.isRead && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => markAsRead(notification.id)}
                                                        disabled={updatingIds.has(notification.id)}
                                                        className="text-xs border-brand-300 text-brand-700 hover:bg-brand-50 bg-transparent"
                                                    >
                                                        {updatingIds.has(notification.id)
                                                            ? "Marking..."
                                                            : "Mark as Read"}
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <div className="flex justify-between items-center pt-6 border-t border-accent-200">
                    <div className="text-sm text-brand-500">
                        {localNotifications.length} total notifications • {unreadCount} unread
                    </div>
                    <div className="flex gap-3">
                        <Button
                            variant="outline"
                            onClick={onClose}
                            className="border-accent-300 bg-transparent"
                        >
                            Close
                        </Button>
                        <Button
                            onClick={markAllAsRead}
                            disabled={updatingIds.size > 0}
                            className="bg-brand-600 hover:bg-brand-700 text-white"
                        >
                            {updatingIds.size > 0 ? "Marking..." : "Mark All as Read"}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
