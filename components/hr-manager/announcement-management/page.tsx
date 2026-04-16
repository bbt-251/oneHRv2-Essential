"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Eye, Pencil, Trash2, MoreVertical, CheckCircle, XCircle } from "lucide-react";
import { AnnouncementModal } from "./modals/announcement-modal";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useFirestore } from "@/context/firestore-context";
import {
    createAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
} from "@/lib/backend/api/announcement/announcement-service";
import { AnnouncementModel } from "@/lib/models/announcement";
import { useToast } from "@/context/toastContext";
import { sendNotification } from "@/lib/util/notification/send-notification";
import { ANNOUNCEMENT_LOG_MESSAGES } from "@/lib/log-descriptions/announcement";
import { useAuth } from "@/context/authContext";

const isAnnouncementTargetedToUser = (announcement: any, user: any, hrSettings: any) => {
    // If no audience target specified, show to all
    if (!announcement.audienceTarget || announcement.audienceTarget.length === 0) return true;

    // Check each audience target type
    for (const target of announcement.audienceTarget) {
        switch (target) {
            case "all":
                return true;
            case "employees":
                if (announcement.employees?.includes(user.uid)) return true;
                break;
            case "department":
                if (announcement.departments?.includes(user.department)) return true;
                break;
            case "section":
                if (announcement.sections?.includes(user.section)) return true;
                break;
            case "location":
                if (announcement.locations?.includes(user.workingLocation)) return true;
                break;
            case "grade":
                if (announcement.grades?.includes(user.gradeLevel)) return true;
                break;
            case "managers":
                if (user.managerPosition) return true;
                break;
            case "notManagers":
                if (!user.managerPosition) return true;
                break;
        }
    }
    return false;
};

export function AnnouncementManagement() {
    const { announcements, hrSettings, employees } = useFirestore();
    const { showToast } = useToast();
    const { userData } = useAuth();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedAnnouncement, setSelectedAnnouncement] = useState<AnnouncementModel | null>(
        null,
    );
    const [modalMode, setModalMode] = useState<"add" | "edit" | "view">("add");

    const handleAddNew = () => {
        setSelectedAnnouncement(null);
        setModalMode("add");
        setIsModalOpen(true);
    };

    const handleView = (announcement: AnnouncementModel) => {
        setSelectedAnnouncement(announcement);
        setModalMode("view");
        setIsModalOpen(true);
    };

    const handleEdit = (announcement: AnnouncementModel) => {
        setSelectedAnnouncement(announcement);
        setModalMode("edit");
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (confirm("Are you sure you want to delete this announcement?")) {
            const success = await deleteAnnouncement(
                id,
                userData?.uid ?? "",
                ANNOUNCEMENT_LOG_MESSAGES.DELETED(
                    announcements.find(a => a.id === id)?.announcementTitle ?? "",
                ),
            );
            if (success) {
                showToast("Announcement deleted successfully", "Success", "success");
            } else {
                showToast("Failed to delete announcement", "Error", "error");
            }
        }
    };

    const handleSave = async (announcement: AnnouncementModel) => {
        try {
            if (modalMode === "add") {
                const newAnnouncement = {
                    ...announcement,
                };
                const success = await createAnnouncement(
                    newAnnouncement,
                    userData?.uid ?? "",
                    ANNOUNCEMENT_LOG_MESSAGES.CREATED(newAnnouncement.announcementTitle),
                );
                if (success) {
                    showToast("Announcement created successfully", "Success", "success");
                } else {
                    showToast("Failed to create announcement", "Error", "error");
                }
            } else if (modalMode === "edit" && selectedAnnouncement) {
                const success = await updateAnnouncement(
                    { ...announcement, id: selectedAnnouncement.id },
                    userData?.uid ?? "",
                    ANNOUNCEMENT_LOG_MESSAGES.UPDATED(announcement.announcementTitle),
                );
                if (success) {
                    showToast("Announcement updated successfully", "Success", "success");
                } else {
                    showToast("Failed to update announcement", "Error", "error");
                }
            }
            setIsModalOpen(false);
        } catch (error) {
            showToast("An error occurred", "Error", "error");
        }
    };

    const togglePublishStatus = async (id: string) => {
        const announcement = announcements.find(a => a.id === id);
        if (announcement) {
            const newStatus =
                announcement.publishStatus === "Published" ? "Unpublished" : "Published";
            const logMessage =
                newStatus === "Published"
                    ? ANNOUNCEMENT_LOG_MESSAGES.PUBLISHED(announcement.announcementTitle)
                    : ANNOUNCEMENT_LOG_MESSAGES.UNPUBLISHED(announcement.announcementTitle);
            const success = await updateAnnouncement(
                { ...announcement, publishStatus: newStatus },
                userData?.uid ?? "",
                logMessage,
            );
            if (success) {
                showToast(
                    `Announcement ${newStatus.toLowerCase()} successfully`,
                    "Success",
                    "success",
                );

                // Send notifications when publishing
                if (newStatus === "Published") {
                    const targetedUsers = employees.filter(employee =>
                        isAnnouncementTargetedToUser(announcement, employee, hrSettings),
                    );

                    if (targetedUsers.length > 0) {
                        const notificationUsers = targetedUsers.map(user => ({
                            uid: user.uid,
                            email: user.companyEmail || user.personalEmail || "",
                            telegramChatID: user.telegramChatID || "",
                            recipientType: "employee" as const,
                        }));

                        await sendNotification({
                            users: notificationUsers,
                            channels: ["inapp", "telegram", "email"],
                            messageKey: "ANNOUNCEMENT_PUBLISHED",
                            payload: {
                                announcementTitle: announcement.announcementTitle,
                            },
                            title: "Announcement Published",
                            getCustomMessage: () => ({
                                inapp: `New announcement: ${announcement.announcementTitle}`,
                                telegram: `New announcement: ${announcement.announcementTitle}`,
                                email: {
                                    subject: `New Announcement: ${announcement.announcementTitle}`,
                                    body: `A new announcement titled "${announcement.announcementTitle}" has been published. Please check the company portal for more details.`,
                                },
                            }),
                        });
                    }
                }
            } else {
                showToast("Failed to update announcement status", "Error", "error");
            }
        }
    };

    return (
        <div className="p-8 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-brand-700 dark:text-foreground">
                        Announcement Management
                    </h1>
                    <p className="text-brand-500 mt-1 dark:text-muted-foreground">
                        Create and manage company announcements
                    </p>
                </div>
                <Button
                    onClick={handleAddNew}
                    className="bg-brand-600 hover:bg-brand-700 text-white shadow-sm"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Announcement
                </Button>
            </div>

            <Card className="shadow-sm border-accent-200 dark:border-border">
                <CardHeader className="border-b border-accent-200 bg-accent-50 dark:bg-card dark:border-border">
                    <CardTitle className="text-brand-700 dark:text-foreground">
                        All Announcements
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-accent-50 border-b border-accent-200 dark:bg-muted dark:border-border">
                                <tr>
                                    <th className="text-left py-4 px-6 text-sm font-semibold text-brand-700 dark:text-foreground">
                                        Timestamp
                                    </th>
                                    <th className="text-left py-4 px-6 text-sm font-semibold text-brand-700 dark:text-foreground">
                                        Title
                                    </th>
                                    <th className="text-left py-4 px-6 text-sm font-semibold text-brand-700 dark:text-foreground">
                                        Start Date
                                    </th>
                                    <th className="text-left py-4 px-6 text-sm font-semibold text-brand-700 dark:text-foreground">
                                        End Date
                                    </th>
                                    <th className="text-left py-4 px-6 text-sm font-semibold text-brand-700 dark:text-foreground">
                                        Status
                                    </th>
                                    <th className="text-left py-4 px-6 text-sm font-semibold text-brand-700 dark:text-foreground">
                                        Audience
                                    </th>
                                    <th className="text-left py-4 px-6 text-sm font-semibold text-brand-700 dark:text-foreground">
                                        Criticity
                                    </th>
                                    <th className="text-left py-4 px-6 text-sm font-semibold text-brand-700 dark:text-foreground">
                                        Type
                                    </th>
                                    <th className="text-center py-4 px-6 text-sm font-semibold text-brand-700 dark:text-foreground">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-accent-200 dark:divide-border">
                                {announcements.map(announcement => (
                                    <tr
                                        key={announcement.id}
                                        className="hover:bg-accent-50 transition-colors cursor-pointer dark:hover:bg-muted"
                                        onClick={() => handleView(announcement)}
                                    >
                                        <td className="py-4 px-6 text-sm text-brand-600 dark:text-muted-foreground">
                                            {announcement.timestamp}
                                        </td>
                                        <td className="py-4 px-6 text-sm text-brand-700 dark:text-foreground">
                                            {announcement.announcementTitle}
                                        </td>
                                        <td className="py-4 px-6 text-sm text-brand-600 dark:text-muted-foreground">
                                            {new Date(announcement.startDate).toLocaleDateString()}
                                        </td>
                                        <td className="py-4 px-6 text-sm text-brand-600 dark:text-muted-foreground">
                                            {new Date(announcement.endDate).toLocaleDateString()}
                                        </td>
                                        <td className="py-4 px-6">
                                            <Badge
                                                variant={
                                                    announcement.publishStatus === "Published"
                                                        ? "default"
                                                        : "secondary"
                                                }
                                                className={
                                                    announcement.publishStatus === "Published"
                                                        ? "bg-green-100 text-green-700 hover:bg-green-100"
                                                        : "bg-gray-100 text-gray-700 hover:bg-gray-100"
                                                }
                                            >
                                                {announcement.publishStatus}
                                            </Badge>
                                        </td>
                                        <td className="py-4 px-6 text-sm text-brand-600 dark:text-muted-foreground">
                                            {announcement.audienceTarget.join(", ")}
                                        </td>
                                        <td className="py-4 px-6 text-sm text-brand-600 dark:text-muted-foreground">
                                            {hrSettings.criticity?.find(
                                                c => c.id === announcement.criticity,
                                            )?.name || announcement.criticity}
                                        </td>
                                        <td className="py-4 px-6 text-sm text-brand-600 dark:text-muted-foreground">
                                            {hrSettings.announcementTypes?.find(
                                                t => t.id === announcement.announcementType,
                                            )?.name || announcement.announcementType}
                                        </td>
                                        <td
                                            className="py-4 px-6 text-center"
                                            onClick={e => e.stopPropagation()}
                                        >
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 w-8 p-0"
                                                    >
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-48">
                                                    <DropdownMenuItem
                                                        onClick={() => handleView(announcement)}
                                                    >
                                                        <Eye className="h-4 w-4 mr-2" />
                                                        View Details
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => handleEdit(announcement)}
                                                    >
                                                        <Pencil className="h-4 w-4 mr-2" />
                                                        Edit
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() =>
                                                            togglePublishStatus(announcement.id!)
                                                        }
                                                    >
                                                        {announcement.publishStatus ===
                                                        "Published" ? (
                                                                <XCircle className="h-4 w-4 mr-2" />
                                                            ) : (
                                                                <CheckCircle className="h-4 w-4 mr-2" />
                                                            )}
                                                        {announcement.publishStatus === "Published"
                                                            ? "Unpublish"
                                                            : "Publish"}
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() =>
                                                            handleDelete(announcement.id!)
                                                        }
                                                        className="text-red-600 focus:text-red-600"
                                                    >
                                                        <Trash2 className="h-4 w-4 mr-2" />
                                                        Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            <AnnouncementModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSave}
                announcement={selectedAnnouncement}
                mode={modalMode}
            />
        </div>
    );
}
