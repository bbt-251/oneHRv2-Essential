"use client";

import type React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { IssueModel } from "@/lib/models/Issue";
import { useFirestore } from "@/context/firestore-context";
import dayjs from "dayjs";

interface IssueViewModalProps {
    isOpen: boolean;
    onClose: () => void;
    issue?: IssueModel | null;
    isHRMode?: boolean;
}

export function IssueViewModal({ isOpen, onClose, issue, isHRMode = false }: IssueViewModalProps) {
    const { hrSettings, employees } = useFirestore();

    if (!issue) return null;

    const getCreatorName = (createdBy: string, protectAnonymity: boolean) => {
        if (protectAnonymity) {
            return "Anonymous";
        }
        const employee = employees.find(emp => emp.uid === createdBy);
        return employee ? `${employee.firstName} ${employee.surname}` : "Unknown";
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "Open":
                return "bg-red-100 text-red-800";
            case "In Review":
                return "bg-blue-100 text-blue-800";
            case "Reviewed":
                return "bg-orange-100 text-orange-800";
            case "Acknowledged":
                return "bg-green-100 text-green-800";
            default:
                return "bg-gray-100 text-gray-800";
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case "Urgent":
                return "bg-red-100 text-red-800";
            case "High":
                return "bg-orange-100 text-orange-800";
            case "Medium":
                return "bg-yellow-100 text-yellow-800";
            case "Low":
                return "bg-green-100 text-green-800";
            default:
                return "bg-gray-100 text-gray-800";
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader className="flex flex-row items-center justify-between pb-4 border-b">
                    <DialogTitle className="text-xl font-semibold">Issue Details</DialogTitle>
                </DialogHeader>

                <div className="space-y-6 pt-6">
                    {/* Issue ID and Creation Date */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-500">Issue ID</label>
                            <div className="p-3 rounded-md border">
                                <p className="text-sm font-mono">{issue.issueID}</p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-500">
                                Issue Creation Date
                            </label>
                            <div className="p-3 rounded-md border">
                                <p className="text-sm">
                                    {dayjs(issue.issueCreationDate).format("MMMM DD, YYYY")}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Created By - Only show if not anonymous or if HR */}
                    {(isHRMode || !issue.protectAnonymity) && (
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-500">Created By</label>
                            <div className="p-3 rounded-md border">
                                <p className="text-sm">
                                    {getCreatorName(issue.createdBy, issue.protectAnonymity)}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Issue Title */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-500">Issue Title</label>
                        <div className="p-3 rounded-md border">
                            <p className="text-sm font-medium">{issue.issueTitle}</p>
                        </div>
                    </div>

                    {/* Issue Description */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-500">
                            Issue Description
                        </label>
                        <div className="p-3 rounded-md border min-h-[100px]">
                            <p className="text-sm whitespace-pre-wrap">{issue.issueDescription}</p>
                        </div>
                    </div>

                    {/* Issue Type and Status */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-500">Issue Type</label>
                            <div className="p-3 rounded-md border">
                                <p className="text-sm">
                                    {hrSettings.issueTypes.find(type => type.id === issue.issueType)
                                        ?.name || issue.issueType}
                                </p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-500">
                                Issue Status
                            </label>
                            <div className="p-3 rounded-md border">
                                <Badge className={getStatusColor(issue.issueStatus)}>
                                    {hrSettings.issueStatus.find(
                                        type => type.id === issue.issueStatus,
                                    )?.name || issue.issueStatus}
                                </Badge>
                            </div>
                        </div>
                    </div>

                    {/* Impact Type and Priority */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-500">Impact Type</label>
                            <div className="p-3 rounded-md border">
                                <p className="text-sm">
                                    {hrSettings.impactTypes.find(
                                        impact => impact.id === issue.impactType,
                                    )?.name || issue.impactType}
                                </p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-500">Priority</label>
                            <div className="p-3 rounded-md border">
                                <Badge className={getPriorityColor(issue.priority)}>
                                    {hrSettings.priorities.find(
                                        priority => priority.id === issue.priority,
                                    )?.name || issue.priority}
                                </Badge>
                            </div>
                        </div>
                    </div>

                    {/* Date Identified */}
                    {issue.dateIdentified && (
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-500">
                                Date Identified
                            </label>
                            <div className="p-3 rounded-md border">
                                <p className="text-sm">
                                    {dayjs(issue.dateIdentified).format("MMMM DD, YYYY")}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Protect Anonymity - Only show for HR */}
                    {isHRMode && (
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-500">
                                Protect Anonymity
                            </label>
                            <div className="p-3 rounded-md border">
                                <p className="text-sm">{issue.protectAnonymity ? "Yes" : "No"}</p>
                            </div>
                        </div>
                    )}

                    {/* Resolution Steps - If any */}
                    {issue.resolutionSteps && issue.resolutionSteps.length > 0 && (
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-500">
                                Resolution Steps
                            </label>
                            <div className="p-3 rounded-md border">
                                <ul className="text-sm list-disc list-inside space-y-1">
                                    {issue.resolutionSteps.map((step, index) => (
                                        <li key={index}>{step}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    )}

                    {/* Resolution Date - If any */}
                    {issue.resolutionDate && (
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-500">
                                Resolution Date
                            </label>
                            <div className="p-3 rounded-md border">
                                <p className="text-sm">
                                    {dayjs(issue.resolutionDate).format("MMMM DD, YYYY")}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Close Button */}
                    <div className="flex justify-end pt-6">
                        <Button onClick={onClose}>Close</Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
