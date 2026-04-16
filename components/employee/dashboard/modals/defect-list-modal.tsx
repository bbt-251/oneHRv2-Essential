"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
    Plus,
    AlertTriangle,
    Calendar,
    User,
    MessageSquare,
    Loader2,
    FileText,
    ImageIcon,
    Download,
    ExternalLink,
    Eye,
} from "lucide-react";
import { DefectModel } from "@/lib/models/defect";
import { DefectReportModal } from "./defect-report-modal";
import { useAuth } from "@/context/authContext";
import { getDefectsByEmployee } from "@/lib/backend/api/defect-service";

interface DefectListModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function DefectListModal({ isOpen, onClose }: DefectListModalProps) {
    const { userData } = useAuth();
    const [isDefectReportOpen, setIsDefectReportOpen] = useState(false);
    const [selectedDefect, setSelectedDefect] = useState<DefectModel | null>(null);
    const [defects, setDefects] = useState<DefectModel[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && userData?.employeeID) {
            fetchDefects();
        }
    }, [isOpen, userData]);

    const fetchDefects = async () => {
        if (!userData?.employeeID) return;

        setLoading(true);
        try {
            const userDefects = await getDefectsByEmployee(userData.employeeID);
            setDefects(userDefects);
        } catch (error) {
            console.error("Error fetching defects:", error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "Open":
                return "bg-danger-100 text-danger-800 border-danger-200";
            case "In Progress":
                return "bg-warning-100 text-warning-800 border-warning-200";
            case "Resolved":
                return "bg-success-100 text-success-800 border-success-200";
            case "Closed":
                return "bg-secondary-100 text-secondary-800 border-secondary-200";
            default:
                return "bg-secondary-100 text-secondary-800 border-secondary-200";
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case "Critical":
                return "bg-danger-100 text-danger-800 border-danger-200";
            case "High":
                return "bg-warning-100 text-warning-800 border-warning-200";
            case "Medium":
                return "bg-brand-100 text-brand-800 border-brand-200";
            case "Low":
                return "bg-secondary-100 text-secondary-800 border-secondary-200";
            default:
                return "bg-secondary-100 text-secondary-800 border-secondary-200";
        }
    };

    const handleRowClick = (defect: DefectModel) => {
        setSelectedDefect(defect);
    };

    return (
        <>
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
                    <DialogHeader className="pb-6">
                        <DialogTitle className="text-2xl font-bold text-brand-800 flex items-center gap-3">
                            <div className="p-2 bg-accent-100 rounded-xl">
                                <AlertTriangle className="h-6 w-6 text-accent-600" />
                            </div>
                            My Reported Defects
                        </DialogTitle>
                    </DialogHeader>

                    {/* Header with Add Button */}
                    <div className="flex justify-between items-center mb-6">
                        <div className="text-sm text-brand-600">
                            {defects.length} defect{defects.length !== 1 ? "s" : ""} reported
                        </div>
                        <Button
                            onClick={() => setIsDefectReportOpen(true)}
                            className="bg-brand-600 hover:bg-brand-700 text-white"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Report New Defect
                        </Button>
                    </div>

                    {/* Defects Table */}
                    <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                        {loading && (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
                                <span className="ml-2 text-brand-600">Loading defects...</span>
                            </div>
                        )}

                        {!loading &&
                            defects.map(defect => (
                                <Card
                                    key={defect.id}
                                    className="border-accent-200 hover:shadow-md transition-all duration-200 cursor-pointer"
                                    onClick={() => handleRowClick(defect)}
                                >
                                    <CardContent className="p-5">
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <h3 className="font-bold text-lg text-brand-800">
                                                        {defect.title}
                                                    </h3>
                                                    <Badge
                                                        className={`text-xs px-2 py-1 border ${getStatusColor(defect.status)}`}
                                                    >
                                                        {defect.status}
                                                    </Badge>
                                                    <Badge
                                                        className={`text-xs px-2 py-1 border ${getPriorityColor(defect.priority)}`}
                                                    >
                                                        {defect.priority}
                                                    </Badge>
                                                </div>

                                                <p className="text-brand-600 mb-3 line-clamp-2">
                                                    {defect.description}
                                                </p>

                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                                    <div className="flex items-center gap-2">
                                                        <AlertTriangle className="h-4 w-4 text-accent-600" />
                                                        <span className="text-brand-500 font-medium">
                                                            Category:
                                                        </span>
                                                        <span className="font-semibold text-brand-700">
                                                            {defect.category}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Calendar className="h-4 w-4 text-accent-600" />
                                                        <span className="text-brand-500 font-medium">
                                                            Reported:
                                                        </span>
                                                        <span className="font-semibold text-brand-700">
                                                            {new Date(
                                                                defect.reportedDate,
                                                            ).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                    {defect.assignedTo && (
                                                        <div className="flex items-center gap-2">
                                                            <User className="h-4 w-4 text-accent-600" />
                                                            <span className="text-brand-500 font-medium">
                                                                Assigned:
                                                            </span>
                                                            <span className="font-semibold text-brand-700">
                                                                {defect.assignedTo}
                                                            </span>
                                                        </div>
                                                    )}
                                                    {defect.comments &&
                                                        defect.comments.length > 0 && (
                                                        <div className="flex items-center gap-2">
                                                            <MessageSquare className="h-4 w-4 text-accent-600" />
                                                            <span className="text-brand-500 font-medium">
                                                                    Comments:
                                                            </span>
                                                            <span className="font-semibold text-brand-700">
                                                                {defect.comments.length}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                    </div>

                    {defects.length === 0 && !loading && (
                        <div className="text-center py-12">
                            <AlertTriangle className="h-12 w-12 text-brand-300 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-brand-600 mb-2">
                                No defects reported
                            </h3>
                            <p className="text-brand-500 mb-4">
                                You haven't reported any defects yet.
                            </p>
                            <Button
                                onClick={() => setIsDefectReportOpen(true)}
                                className="bg-brand-600 hover:bg-brand-700 text-white"
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Report Your First Defect
                            </Button>
                        </div>
                    )}

                    {/* Footer */}
                    <div className="flex justify-end pt-6 border-t border-accent-200">
                        <Button
                            variant="outline"
                            onClick={onClose}
                            className="border-accent-300 bg-transparent"
                        >
                            Close
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Defect Report Modal */}
            <DefectReportModal
                isOpen={isDefectReportOpen}
                onClose={() => {
                    setIsDefectReportOpen(false);
                    // Refresh defects list after reporting
                    fetchDefects();
                }}
            />

            {/* Defect Details Modal */}
            {selectedDefect && (
                <Dialog open={!!selectedDefect} onOpenChange={() => setSelectedDefect(null)}>
                    <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader className="pb-6">
                            <DialogTitle className="text-2xl font-bold text-brand-800 flex items-center gap-3">
                                <div className="p-2 bg-accent-100 rounded-xl">
                                    <AlertTriangle className="h-6 w-6 text-accent-600" />
                                </div>
                                Defect Details: {selectedDefect.defectID}
                            </DialogTitle>
                        </DialogHeader>

                        <div className="space-y-6">
                            {/* Basic Information */}
                            <Card className="border-accent-200">
                                <CardContent className="p-6">
                                    <div className="flex items-center gap-2 mb-4">
                                        <FileText className="h-5 w-5 text-brand-600" />
                                        <h3 className="text-lg font-semibold text-brand-800">
                                            Basic Information
                                        </h3>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <h4 className="font-semibold text-xl text-brand-800">
                                                {selectedDefect.title}
                                            </h4>
                                            <p className="text-brand-600 mt-2">
                                                {selectedDefect.description}
                                            </p>
                                        </div>

                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            <div className="space-y-1">
                                                <span className="text-sm text-brand-500 font-medium">
                                                    Category
                                                </span>
                                                <p className="font-semibold text-brand-700">
                                                    {selectedDefect.category}
                                                </p>
                                            </div>
                                            <div className="space-y-1">
                                                <span className="text-sm text-brand-500 font-medium">
                                                    Priority
                                                </span>
                                                <Badge
                                                    className={`${getPriorityColor(selectedDefect.priority)}`}
                                                >
                                                    {selectedDefect.priority}
                                                </Badge>
                                            </div>
                                            <div className="space-y-1">
                                                <span className="text-sm text-brand-500 font-medium">
                                                    Status
                                                </span>
                                                <Badge
                                                    className={`${getStatusColor(selectedDefect.status)}`}
                                                >
                                                    {selectedDefect.status}
                                                </Badge>
                                            </div>
                                            <div className="space-y-1">
                                                <span className="text-sm text-brand-500 font-medium">
                                                    Severity
                                                </span>
                                                <p className="font-semibold text-brand-700">
                                                    {selectedDefect.severity || "Not specified"}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <span className="text-sm text-brand-500 font-medium">
                                                    Reported By
                                                </span>
                                                <p className="font-semibold text-brand-700">
                                                    {selectedDefect.reportedBy}
                                                </p>
                                            </div>
                                            <div className="space-y-1">
                                                <span className="text-sm text-brand-500 font-medium">
                                                    Reported Date
                                                </span>
                                                <p className="font-semibold text-brand-700">
                                                    {new Date(
                                                        selectedDefect.reportedDate,
                                                    ).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>

                                        {selectedDefect.assignedTo && (
                                            <div className="space-y-1">
                                                <span className="text-sm text-brand-500 font-medium">
                                                    Assigned To
                                                </span>
                                                <p className="font-semibold text-brand-700">
                                                    {selectedDefect.assignedTo}
                                                </p>
                                            </div>
                                        )}

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <span className="text-sm text-brand-500 font-medium">
                                                    Environment
                                                </span>
                                                <p className="font-semibold text-brand-700">
                                                    {selectedDefect.environment}
                                                </p>
                                            </div>
                                            <div className="space-y-1">
                                                <span className="text-sm text-brand-500 font-medium">
                                                    Project
                                                </span>
                                                <p className="font-semibold text-brand-700">
                                                    {selectedDefect.project}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Steps to Reproduce */}
                            {selectedDefect.stepsToReproduce && (
                                <Card className="border-accent-200">
                                    <CardContent className="p-6">
                                        <div className="flex items-center gap-2 mb-4">
                                            <AlertTriangle className="h-5 w-5 text-brand-600" />
                                            <h3 className="text-lg font-semibold text-brand-800">
                                                Steps to Reproduce
                                            </h3>
                                        </div>
                                        <p className="text-brand-600 whitespace-pre-line">
                                            {selectedDefect.stepsToReproduce}
                                        </p>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Expected vs Actual Behavior */}
                            {(selectedDefect.expectedBehavior || selectedDefect.actualBehavior) && (
                                <Card className="border-accent-200">
                                    <CardContent className="p-6">
                                        <div className="flex items-center gap-2 mb-4">
                                            <MessageSquare className="h-5 w-5 text-brand-600" />
                                            <h3 className="text-lg font-semibold text-brand-800">
                                                Expected vs Actual Behavior
                                            </h3>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {selectedDefect.expectedBehavior && (
                                                <div>
                                                    <h4 className="font-medium text-brand-700 mb-2">
                                                        Expected Behavior
                                                    </h4>
                                                    <p className="text-brand-600">
                                                        {selectedDefect.expectedBehavior}
                                                    </p>
                                                </div>
                                            )}
                                            {selectedDefect.actualBehavior && (
                                                <div>
                                                    <h4 className="font-medium text-brand-700 mb-2">
                                                        Actual Behavior
                                                    </h4>
                                                    <p className="text-brand-600">
                                                        {selectedDefect.actualBehavior}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Screenshots */}
                            {selectedDefect.images && selectedDefect.images.length > 0 && (
                                <Card className="border-accent-200">
                                    <CardContent className="p-6">
                                        <div className="flex items-center gap-2 mb-4">
                                            <ImageIcon className="h-5 w-5 text-brand-600" />
                                            <h3 className="text-lg font-semibold text-brand-800">
                                                Screenshots ({selectedDefect.images.length})
                                            </h3>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {selectedDefect.images.map((imageUrl, index) => (
                                                <div key={index} className="relative group">
                                                    <div className="aspect-video bg-accent-50 rounded-lg overflow-hidden border border-accent-200">
                                                        <img
                                                            src={imageUrl}
                                                            alt={`Screenshot ${index + 1}`}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    </div>
                                                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Button
                                                            size="sm"
                                                            variant="secondary"
                                                            onClick={() =>
                                                                window.open(imageUrl, "_blank")
                                                            }
                                                            className="bg-white/90 hover:bg-white"
                                                        >
                                                            <ExternalLink className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Attachments */}
                            {selectedDefect.attachments &&
                                selectedDefect.attachments.length > 0 && (
                                <Card className="border-accent-200">
                                    <CardContent className="p-6">
                                        <div className="flex items-center gap-2 mb-4">
                                            <FileText className="h-5 w-5 text-brand-600" />
                                            <h3 className="text-lg font-semibold text-brand-800">
                                                    Attachments ({selectedDefect.attachments.length}
                                                    )
                                            </h3>
                                        </div>
                                        <div className="space-y-3">
                                            {selectedDefect.attachments.map(
                                                (attachmentUrl, index) => (
                                                    <div
                                                        key={index}
                                                        className="flex items-center justify-between p-4 bg-accent-50 rounded-lg border border-accent-200"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <FileText className="h-5 w-5 text-brand-600" />
                                                            <div>
                                                                <p className="font-medium text-brand-700">
                                                                        Attachment {index + 1}
                                                                </p>
                                                                <p className="text-sm text-brand-500">
                                                                        Click to download
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <Button
                                                            size="sm"
                                                            onClick={() =>
                                                                window.open(
                                                                    attachmentUrl,
                                                                    "_blank",
                                                                )
                                                            }
                                                            className="bg-brand-600 hover:bg-brand-700 text-white"
                                                        >
                                                            <Eye className="h-4 w-4 mr-2" />
                                                                View
                                                        </Button>
                                                    </div>
                                                ),
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Comments */}
                            {selectedDefect.comments && selectedDefect.comments.length > 0 && (
                                <Card className="border-accent-200">
                                    <CardContent className="p-6">
                                        <div className="flex items-center gap-2 mb-4">
                                            <MessageSquare className="h-5 w-5 text-brand-600" />
                                            <h3 className="text-lg font-semibold text-brand-800">
                                                Comments ({selectedDefect.comments.length})
                                            </h3>
                                        </div>
                                        <div className="space-y-4">
                                            {selectedDefect.comments.map(comment => (
                                                <div
                                                    key={comment.id}
                                                    className="bg-accent-50 p-4 rounded-lg border border-accent-200"
                                                >
                                                    <div className="flex justify-between items-start mb-2">
                                                        <span className="font-medium text-brand-700">
                                                            {comment.author}
                                                        </span>
                                                        <span className="text-xs text-brand-500">
                                                            {new Date(
                                                                comment.timestamp,
                                                            ).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                    <p className="text-brand-600">
                                                        {comment.message}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Resolution Info */}
                            {selectedDefect.resolvedDate && (
                                <Card className="border-accent-200">
                                    <CardContent className="p-6">
                                        <div className="flex items-center gap-2 mb-4">
                                            <Calendar className="h-5 w-5 text-brand-600" />
                                            <h3 className="text-lg font-semibold text-brand-800">
                                                Resolution Information
                                            </h3>
                                        </div>
                                        <div className="space-y-2">
                                            <div>
                                                <span className="text-brand-500 font-medium">
                                                    Resolved Date:
                                                </span>
                                                <span className="ml-2 font-semibold text-brand-700">
                                                    {new Date(
                                                        selectedDefect.resolvedDate,
                                                    ).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </div>

                        <div className="flex justify-end pt-6 border-t border-accent-200">
                            <Button
                                variant="outline"
                                onClick={() => setSelectedDefect(null)}
                                className="border-accent-300 bg-transparent"
                            >
                                Close
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            )}
        </>
    );
}
