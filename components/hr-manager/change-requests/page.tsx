"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye, MoreVertical, CheckCircle, XCircle } from "lucide-react";
import { ChangeRequestDetailModal } from "./modals/change-request-detail-modal";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useFirestore } from "@/context/firestore-context";
import { updateEmployeeInfoChangeRequest } from "@/lib/backend/api/employee-info-change-request-service";
import { EmployeeInfoChangeRequestModel } from "@/lib/models/employee-info-change-request";
import { useToast } from "@/context/toastContext";

export function ChangeRequestsManagement() {
    const { employees, changeRequests } = useFirestore();
    const { showToast } = useToast();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState<EmployeeInfoChangeRequestModel | null>(
        null,
    );

    const handleView = (request: EmployeeInfoChangeRequestModel) => {
        setSelectedRequest(request);
        setIsModalOpen(true);
    };

    const getEmployeeName = (uid: string) => {
        const employee = employees.find(emp => emp.uid === uid);
        return employee ? `${employee.firstName} ${employee.surname}` : "Unknown Employee";
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "pending":
                return (
                    <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">
                        Pending
                    </Badge>
                );
            case "approved":
                return (
                    <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                        Approved
                    </Badge>
                );
            case "rejected":
                return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Rejected</Badge>;
            default:
                return <Badge variant="secondary">{status}</Badge>;
        }
    };

    // Format timestamp to MMMM DD, YYYY hh:mm A format
    const formatTimestamp = (timestamp: string) => {
        const date = new Date(timestamp);
        return date.toLocaleString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
            hour: "numeric",
            minute: "numeric",
            hour12: true,
        });
    };

    // Sort change requests by date (latest first)
    const sortedChangeRequests = [...changeRequests].sort((a, b) => {
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });

    return (
        <div className="p-8 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-brand-700 dark:text-foreground">
                        Change Requests
                    </h1>
                    <p className="text-brand-500 mt-1 dark:text-muted-foreground">
                        Review and manage employee information change requests
                    </p>
                </div>
            </div>

            <Card className="shadow-sm border-accent-200 dark:border-border">
                <CardHeader className="border-b border-accent-200 bg-accent-50 dark:bg-card dark:border-border">
                    <CardTitle className="text-brand-700 dark:text-foreground">
                        All Change Requests
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
                                        Employee
                                    </th>
                                    <th className="text-left py-4 px-6 text-sm font-semibold text-brand-700 dark:text-foreground">
                                        Employee ID
                                    </th>
                                    <th className="text-left py-4 px-6 text-sm font-semibold text-brand-700 dark:text-foreground">
                                        Status
                                    </th>
                                    <th className="text-left py-4 px-6 text-sm font-semibold text-brand-700 dark:text-foreground">
                                        Changes Requested
                                    </th>
                                    <th className="text-center py-4 px-6 text-sm font-semibold text-brand-700 dark:text-foreground">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-accent-200 dark:divide-border">
                                {sortedChangeRequests.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={6}
                                            className="py-8 px-6 text-center text-brand-500 dark:text-muted-foreground"
                                        >
                                            No change requests found
                                        </td>
                                    </tr>
                                ) : (
                                    sortedChangeRequests.map(request => (
                                        <tr
                                            key={request.id}
                                            className="hover:bg-accent-50 transition-colors cursor-pointer dark:hover:bg-muted"
                                            onClick={() => handleView(request)}
                                        >
                                            <td className="py-4 px-6 text-sm text-brand-600 dark:text-muted-foreground">
                                                {formatTimestamp(request.timestamp)}
                                            </td>
                                            <td className="py-4 px-6 text-sm text-brand-700 dark:text-foreground">
                                                {getEmployeeName(request.uid)}
                                            </td>
                                            <td className="py-4 px-6 text-sm text-brand-600 dark:text-muted-foreground">
                                                {request.employeeId}
                                            </td>
                                            <td className="py-4 px-6">
                                                {getStatusBadge(request.requestStatus)}
                                            </td>
                                            <td className="py-4 px-6 text-sm text-brand-600 dark:text-muted-foreground">
                                                Employee & Emergency Info
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
                                                    <DropdownMenuContent
                                                        align="end"
                                                        className="w-48"
                                                    >
                                                        <DropdownMenuItem
                                                            onClick={() => handleView(request)}
                                                        >
                                                            <Eye className="h-4 w-4 mr-2" />
                                                            View Details
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            <ChangeRequestDetailModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                request={selectedRequest}
            />
        </div>
    );
}
