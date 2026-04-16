"use client";

import { ExtendedAnnouncementModel } from "@/components/header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/context/authContext";
import { useFirestore } from "@/context/firestore-context";
import { useToast } from "@/context/toastContext";
import { updateEmployee } from "@/lib/backend/api/employee-management/employee-management-service";
import { Calendar, Clock, Pin, User, Volume2 } from "lucide-react";
import { useState } from "react";

interface AnnouncementsModalProps {
    isOpen: boolean;
    onClose: () => void;
    userAnnouncements: ExtendedAnnouncementModel[];
}

export function AnnouncementsModal({
    isOpen,
    onClose,
    userAnnouncements,
}: AnnouncementsModalProps) {
    const { userData } = useAuth();
    const { hrSettings } = useFirestore();
    const { showToast } = useToast();
    const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set());

    const markAsRead = async (announcementId: string) => {
        if (!userData) return;

        setUpdatingIds(prev => new Set(prev).add(announcementId));

        try {
            const currentAnnouncements = userData.announcements || [];
            const existingIndex = currentAnnouncements.findIndex(a => a.id === announcementId);

            let updatedAnnouncements;
            if (existingIndex >= 0) {
                // Update existing entry
                updatedAnnouncements = [...currentAnnouncements];
                updatedAnnouncements[existingIndex] = {
                    ...updatedAnnouncements[existingIndex],
                    isRead: true,
                };
            } else {
                // Add new entry
                updatedAnnouncements = [
                    ...currentAnnouncements,
                    {
                        id: announcementId,
                        isPinned: false,
                        isRead: true,
                    },
                ];
            }

            const success = await updateEmployee({
                id: userData.id,
                announcements: updatedAnnouncements,
            });

            if (success) {
                showToast("Announcement marked as read", "success", "success");
            } else {
                showToast("Failed to mark announcement as read", "error", "error");
            }
        } catch (error) {
            console.error("Error marking announcement as read:", error);
            showToast("Failed to mark announcement as read", "error", "error");
        } finally {
            setUpdatingIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(announcementId);
                return newSet;
            });
        }
    };

    const togglePin = async (announcementId: string, currentPinned: boolean) => {
        if (!userData) return;

        setUpdatingIds(prev => new Set(prev).add(announcementId));

        try {
            const currentAnnouncements = userData.announcements || [];
            const existingIndex = currentAnnouncements.findIndex(a => a.id === announcementId);

            let updatedAnnouncements;
            if (existingIndex >= 0) {
                // Update existing entry
                updatedAnnouncements = [...currentAnnouncements];
                updatedAnnouncements[existingIndex] = {
                    ...updatedAnnouncements[existingIndex],
                    isPinned: !currentPinned,
                };
            } else {
                // Add new entry
                updatedAnnouncements = [
                    ...currentAnnouncements,
                    {
                        id: announcementId,
                        isPinned: !currentPinned,
                        isRead: false,
                    },
                ];
            }

            const success = await updateEmployee({
                id: userData.id,
                announcements: updatedAnnouncements,
            });

            if (success) {
                showToast(
                    `Announcement ${!currentPinned ? "pinned" : "unpinned"}`,
                    "success",
                    "success",
                );
            } else {
                showToast(
                    `Failed to ${!currentPinned ? "pin" : "unpin"} announcement`,
                    "error",
                    "error",
                );
            }
        } catch (error) {
            console.error("Error toggling pin status:", error);
            showToast(
                `Failed to ${!currentPinned ? "pin" : "unpin"} announcement`,
                "error",
                "error",
            );
        } finally {
            setUpdatingIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(announcementId);
                return newSet;
            });
        }
    };

    const markAllAsRead = async () => {
        if (!userData) return;

        const unreadAnnouncements = userAnnouncements.filter((a: any) => !a.isRead);
        if (unreadAnnouncements.length === 0) return;

        setUpdatingIds(prev => new Set([...prev, ...unreadAnnouncements.map(a => a.id)]));

        try {
            const currentAnnouncements = userData.announcements || [];
            const updatedAnnouncements = [...currentAnnouncements];

            unreadAnnouncements.forEach(announcement => {
                const existingIndex = updatedAnnouncements.findIndex(a => a.id === announcement.id);
                if (existingIndex >= 0) {
                    updatedAnnouncements[existingIndex] = {
                        ...updatedAnnouncements[existingIndex],
                        isRead: true,
                    };
                } else {
                    updatedAnnouncements.push({
                        id: announcement.id,
                        isPinned: false,
                        isRead: true,
                    });
                }
            });

            const success = await updateEmployee({
                id: userData.id,
                announcements: updatedAnnouncements,
            });

            if (success) {
                showToast("All announcements marked as read", "success", "success");
            } else {
                showToast("Failed to mark all announcements as read", "error", "error");
            }
        } catch (error) {
            console.error("Error marking all announcements as read:", error);
            showToast("Failed to mark all announcements as read", "error", "error");
        } finally {
            setUpdatingIds(new Set());
        }
    };

    const getPriorityColor = (criticity: string) => {
        // Map criticity to priority colors
        const criticityData = hrSettings.criticity?.find(c => c.id === criticity);
        if (criticityData) {
            // You might want to add color mapping based on criticity name
            return "bg-blue-100 text-blue-700 border-blue-200";
        }
        return "bg-secondary-100 text-secondary-700 border-secondary-200";
    };

    const unreadCount = userAnnouncements.filter((ann: any) => !ann.isRead).length;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader className="pb-6">
                    <DialogTitle className="text-2xl font-bold text-brand-800 flex items-center gap-3">
                        <div className="p-2 bg-accent-100 rounded-xl">
                            <Volume2 className="h-6 w-6 text-accent-600" />
                        </div>
                        Announcements
                        {unreadCount > 0 && (
                            <Badge className="bg-danger-500 text-white">{unreadCount} New</Badge>
                        )}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    {userAnnouncements.map((announcement: any) => (
                        <Card
                            key={announcement.id}
                            className={`border transition-all duration-200 hover:shadow-md ${
                                announcement.isRead
                                    ? "border-accent-200 bg-white"
                                    : "border-accent-300 bg-accent-50"
                            }`}
                        >
                            <CardContent className="p-6">
                                <div className="space-y-4">
                                    {/* Header */}
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={() =>
                                                    togglePin(
                                                        announcement.id,
                                                        announcement.isPinned,
                                                    )
                                                }
                                                disabled={updatingIds.has(announcement.id)}
                                                className={`p-1 rounded-full hover:bg-accent-100 transition-colors ${announcement.isPinned ? "text-accent-600" : "text-gray-400 hover:text-accent-600"}`}
                                            >
                                                <Pin className="h-4 w-4" />
                                            </button>
                                            <h3 className="font-bold text-lg text-brand-800">
                                                {announcement.announcementTitle}
                                            </h3>
                                            {!announcement.isRead && (
                                                <div className="w-2 h-2 bg-danger-500 rounded-full"></div>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge
                                                className={`text-xs px-2 py-1 border ${getPriorityColor(announcement.criticity)}`}
                                            >
                                                {hrSettings.criticity?.find(
                                                    c => c.id === announcement.criticity,
                                                )?.name || announcement.criticity}
                                            </Badge>
                                            <Badge className="bg-brand-100 text-brand-700 border-brand-200">
                                                {hrSettings.announcementTypes?.find(
                                                    t => t.id === announcement.announcementType,
                                                )?.name || announcement.announcementType}
                                            </Badge>
                                        </div>
                                    </div>

                                    {/* Content - For now, we'll show a placeholder since the model doesn't have content field */}
                                    <p className="text-brand-700 leading-relaxed">
                                        Announcement details will be displayed here. This
                                        announcement is targeted to:{" "}
                                        {announcement.audienceTarget.join(", ")}
                                    </p>

                                    {/* Footer */}
                                    <div className="flex items-center justify-between pt-4 border-t border-accent-200">
                                        <div className="flex items-center gap-4 text-sm text-brand-500">
                                            <div className="flex items-center gap-1">
                                                <User className="h-3 w-3" />
                                                <span>HR Department</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Calendar className="h-3 w-3" />
                                                <span>
                                                    {new Date(
                                                        announcement.timestamp,
                                                    ).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Clock className="h-3 w-3" />
                                                <span>
                                                    {new Date(
                                                        announcement.timestamp,
                                                    ).toLocaleTimeString([], {
                                                        hour: "2-digit",
                                                        minute: "2-digit",
                                                    })}
                                                </span>
                                            </div>
                                        </div>
                                        {!announcement.isRead && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => markAsRead(announcement.id)}
                                                disabled={updatingIds.has(announcement.id)}
                                                className="text-xs border-brand-300 text-brand-700 hover:bg-brand-50 bg-transparent"
                                            >
                                                {updatingIds.has(announcement.id)
                                                    ? "Marking..."
                                                    : "Mark as Read"}
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <div className="flex justify-between items-center pt-6 border-t border-accent-200">
                    <div className="text-sm text-brand-500">
                        {userAnnouncements.length} total announcements • {unreadCount} unread
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
