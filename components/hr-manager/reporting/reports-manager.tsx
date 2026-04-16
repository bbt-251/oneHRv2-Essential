"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/authContext";
import { useToast } from "@/context/toastContext";
import {
    getHrReportsByUser,
    deleteHrReport,
    updateHrReport,
} from "@/lib/api/hr-reporting/hr-report-service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
    Plus,
    Search,
    MoreHorizontal,
    Pencil,
    Trash2,
    FileText,
    Share2,
    Globe,
    Lock,
} from "lucide-react";
import type { HrSavedReport } from "./report-types";
import { HrShareReportDialog } from "./share-report-dialog";

interface HrReportsManagerProps {
    onEditReport: (report: HrSavedReport) => void;
    onCreateReport: () => void;
    onViewReport?: (report: HrSavedReport) => void;
}

export function HrReportsManager({
    onEditReport,
    onCreateReport,
    onViewReport,
}: HrReportsManagerProps) {
    const [reports, setReports] = useState<HrSavedReport[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [loading, setLoading] = useState(true);
    const [reportToDelete, setReportToDelete] = useState<HrSavedReport | null>(null);
    const [sharingReport, setSharingReport] = useState<HrSavedReport | null>(null);
    const { user } = useAuth();
    const { showToast } = useToast();

    useEffect(() => {
        const loadReports = async () => {
            if (!user) {
                setLoading(false);
                return;
            }
            try {
                const result = await getHrReportsByUser(user.uid);
                setReports(result);
            } catch (error) {
                console.error("Error loading HR reports:", error);
                showToast(
                    `Failed to load reports: ${error instanceof Error ? error.message : "Unknown error"}`,
                    "❌",
                    "error",
                );
            } finally {
                setLoading(false);
            }
        };

        loadReports();
    }, [user, showToast]);

    const filteredReports = reports.filter(report => {
        const q = searchQuery.toLowerCase();
        return (
            report.name.toLowerCase().includes(q) || report.description.toLowerCase().includes(q)
        );
    });

    const handleDeleteConfirm = async () => {
        if (!reportToDelete) return;
        const id = reportToDelete.id;
        setReportToDelete(null);
        try {
            await deleteHrReport(id);
            setReports(prev => prev.filter(r => r.id !== id));
            showToast("Report deleted successfully", "✅", "success");
        } catch (error) {
            console.error("Error deleting HR report:", error);
            showToast(
                `Failed to delete report: ${error instanceof Error ? error.message : "Unknown error"}`,
                "❌",
                "error",
            );
        }
    };

    const handleSaveSharing = async (updated: HrSavedReport) => {
        try {
            await updateHrReport(updated.id, {
                sharing: updated.sharing,
                shareLink: updated.shareLink,
                isArchived: updated.isArchived,
            });
            setReports(prev => prev.map(r => (r.id === updated.id ? updated : r)));
            showToast("Sharing settings updated successfully", "✅", "success");
        } catch (error) {
            console.error("Error updating HR report sharing:", error);
            showToast(
                `Failed to update sharing: ${error instanceof Error ? error.message : "Unknown error"}`,
                "❌",
                "error",
            );
        }
    };

    const formatDate = (date: Date) =>
        date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

    const renderSharingStatus = (report: HrSavedReport) => {
        switch (report.sharing.mode) {
            case "public":
                return (
                    <div className="flex items-center gap-1.5 text-sm text-emerald-600">
                        <Globe className="w-3.5 h-3.5" />
                        <span>Public</span>
                    </div>
                );
            default:
                return (
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Lock className="w-3.5 h-3.5" />
                        <span>Private</span>
                    </div>
                );
        }
    };

    return (
        <div className="flex flex-col min-h-[400px]">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
                        <FileText className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <h2 className="text-xl font-semibold">HR Reports</h2>
                        <p className="text-sm text-muted-foreground">
                            Manage and organize your HR analytics reports.
                        </p>
                    </div>
                </div>
                <Button onClick={onCreateReport}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Report
                </Button>
            </div>

            <div className="mb-4">
                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Search reports..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="pl-9"
                    />
                </div>
            </div>

            <div className="flex-1 overflow-auto">
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-48 text-center">
                        <div className="w-10 h-10 border-4 border-muted border-t-primary rounded-full animate-spin mb-4" />
                        <p className="text-sm text-muted-foreground">Loading reports...</p>
                    </div>
                ) : filteredReports.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-48 text-center">
                        <FileText className="w-10 h-10 text-muted-foreground mb-3" />
                        <h3 className="text-lg font-medium mb-1">No reports found</h3>
                        <p className="text-sm text-muted-foreground mb-3">
                            {searchQuery
                                ? "Try adjusting your search query."
                                : "Create your first HR report to get started."}
                        </p>
                        {!searchQuery && (
                            <Button onClick={onCreateReport}>
                                <Plus className="w-4 h-4 mr-2" />
                                Create Report
                            </Button>
                        )}
                    </div>
                ) : (
                    <div className="rounded-lg border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[260px]">Name</TableHead>
                                    <TableHead>Charts</TableHead>
                                    <TableHead>Sharing</TableHead>
                                    <TableHead>Created</TableHead>
                                    <TableHead>Last Updated</TableHead>
                                    <TableHead className="w-[70px]" />
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredReports.map(report => (
                                    <TableRow key={report.id}>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-medium">{report.name}</span>
                                                <span className="text-xs text-muted-foreground line-clamp-1">
                                                    {report.description}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="secondary">
                                                {report.charts.length} chart
                                                {report.charts.length !== 1 ? "s" : ""}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{renderSharingStatus(report)}</TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {formatDate(report.createdAt)}
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {formatDate(report.updatedAt)}
                                        </TableCell>
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8"
                                                    >
                                                        <MoreHorizontal className="w-4 h-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    {onViewReport && (
                                                        <DropdownMenuItem
                                                            onClick={() => onViewReport(report)}
                                                        >
                                                            <FileText className="w-4 h-4 mr-2" />
                                                            View
                                                        </DropdownMenuItem>
                                                    )}
                                                    <DropdownMenuItem
                                                        onClick={() => onEditReport(report)}
                                                    >
                                                        <Pencil className="w-4 h-4 mr-2" />
                                                        Edit
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => setSharingReport(report)}
                                                    >
                                                        <Share2 className="w-4 h-4 mr-2" />
                                                        Share
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem
                                                        onClick={() => setReportToDelete(report)}
                                                        className="text-destructive"
                                                    >
                                                        <Trash2 className="w-4 h-4 mr-2" />
                                                        Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </div>

            <AlertDialog
                open={!!reportToDelete}
                onOpenChange={open => !open && setReportToDelete(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete report</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete &quot;{reportToDelete?.name}&quot;? This
                            action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteConfirm}
                            className="bg-destructive text-destructive-foreground"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {sharingReport && (
                <HrShareReportDialog
                    open={!!sharingReport}
                    onOpenChange={open => !open && setSharingReport(null)}
                    report={sharingReport}
                    onSave={handleSaveSharing}
                />
            )}
        </div>
    );
}
