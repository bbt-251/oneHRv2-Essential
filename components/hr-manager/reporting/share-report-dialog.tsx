"use client";

import { useEffect, useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Globe, Lock, Copy, Check, Link as LinkIcon, Loader2 } from "lucide-react";
import type { HrSavedReport, HrShareMode } from "./report-types";
import { useAuth } from "@/context/authContext";
import { useToast } from "@/context/toastContext";

interface HrShareReportDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    report: HrSavedReport;
    onSave: (report: HrSavedReport) => void;
}

interface GeneratedLink {
    link: string;
    token: string;
    mode: HrShareMode;
    expirationDate: Date;
    createdAt: Date;
}

const STORAGE_KEY_PREFIX = "hr_report_share_links_";

export function HrShareReportDialog({
    open,
    onOpenChange,
    report,
    onSave,
}: HrShareReportDialogProps) {
    const { user, userData } = useAuth();
    const { showToast } = useToast();
    const [shareMode, setShareMode] = useState<HrShareMode>(report.sharing.mode || "private");
    const [generatedLink, setGeneratedLink] = useState<GeneratedLink | null>(null);
    const [linkCopied, setLinkCopied] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);

    useEffect(() => {
        if (open) {
            setShareMode(report.sharing.mode || "private");
            loadGeneratedLink();
        }
    }, [open, report.id, report.sharing.mode]);

    useEffect(() => {
        setGeneratedLink(current => {
            if (!current) return current;
            if (current.mode !== shareMode) {
                try {
                    const storageKey = `${STORAGE_KEY_PREFIX}${report.id}`;
                    localStorage.removeItem(storageKey);
                } catch {
                    // ignore
                }
                return null;
            }
            return current;
        });
    }, [shareMode, report.id]);

    const loadGeneratedLink = () => {
        try {
            const storageKey = `${STORAGE_KEY_PREFIX}${report.id}`;
            const stored = localStorage.getItem(storageKey);
            if (stored) {
                const linkData: GeneratedLink = JSON.parse(stored);
                const exp = new Date(linkData.expirationDate);
                if (exp > new Date()) {
                    setGeneratedLink({
                        ...linkData,
                        expirationDate: exp,
                        createdAt: new Date(linkData.createdAt),
                    });
                } else {
                    localStorage.removeItem(storageKey);
                    setGeneratedLink(null);
                }
            }
        } catch {
            // ignore
        }
    };

    const saveGeneratedLink = (link: GeneratedLink) => {
        try {
            const storageKey = `${STORAGE_KEY_PREFIX}${report.id}`;
            localStorage.setItem(storageKey, JSON.stringify(link));
        } catch {
            // ignore
        }
    };

    const removeGeneratedLink = () => {
        try {
            const storageKey = `${STORAGE_KEY_PREFIX}${report.id}`;
            localStorage.removeItem(storageKey);
        } catch {
            // ignore
        }
        setGeneratedLink(null);
    };

    const generateToken = () => crypto.randomUUID();

    const handleGenerateLink = async () => {
        if (!user) {
            showToast("You must be logged in to generate a share link", "❌", "error");
            return;
        }

        setIsGenerating(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 200));

            const token = generateToken();
            const expirationDate = new Date();
            expirationDate.setDate(expirationDate.getDate() + 30);

            const baseUrl = window.location.origin;
            let link: string;

            if (shareMode === "public") {
                link = `${baseUrl}/hr/reports/share/${report.id}?token=${token}&mode=public`;
            } else {
                const currentUserId = (userData as { id?: string } | null)?.id || user.uid;
                link = `${baseUrl}/hr/reports/share/${report.id}?token=${token}&mode=private&userId=${encodeURIComponent(
                    currentUserId,
                )}`;
            }

            const linkData: GeneratedLink = {
                link,
                token,
                mode: shareMode,
                expirationDate,
                createdAt: new Date(),
            };

            setGeneratedLink(linkData);
            saveGeneratedLink(linkData);

            const updatedReport: HrSavedReport = {
                ...report,
                sharing: {
                    mode: shareMode,
                    sharedWithRoles: [],
                    sharedWithUsers: [],
                },
                shareLink: link,
                isShared: shareMode === "public",
            };

            onSave(updatedReport);
            showToast("Share link generated successfully", "✅", "success");
        } catch (error) {
            console.error("Error generating HR report link:", error);
            showToast(
                `Failed to generate link: ${error instanceof Error ? error.message : "Unknown error"}`,
                "❌",
                "error",
            );
        } finally {
            setIsGenerating(false);
        }
    };

    const handleCopyLink = async () => {
        if (!generatedLink?.link) return;
        try {
            await navigator.clipboard.writeText(generatedLink.link);
            setLinkCopied(true);
            showToast("Link copied to clipboard", "📋", "success");
            setTimeout(() => setLinkCopied(false), 2000);
        } catch {
            showToast("Failed to copy link", "❌", "error");
        }
    };

    const handleRevokeLink = () => {
        removeGeneratedLink();
        const updatedReport: HrSavedReport = {
            ...report,
            shareLink: undefined,
            isShared: false,
            sharing: {
                mode: "private",
                sharedWithRoles: [],
                sharedWithUsers: [],
            },
        };
        onSave(updatedReport);
        showToast("Share link revoked", "🔒", "success");
    };

    const formatExpirationDate = (date: Date) =>
        date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>Share HR Report</DialogTitle>
                    <DialogDescription>
                        Generate a link to share &quot;{report.name}&quot;.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-2">
                    <div className="space-y-3">
                        <Label>Sharing mode</Label>
                        <RadioGroup
                            value={shareMode}
                            onValueChange={value => setShareMode(value as HrShareMode)}
                        >
                            <div className="flex items-center space-x-2 rounded-md border p-3">
                                <RadioGroupItem value="private" id="hr-private" />
                                <Label
                                    htmlFor="hr-private"
                                    className="flex-1 cursor-pointer flex items-center gap-2"
                                >
                                    <Lock className="w-4 h-4 text-muted-foreground" />
                                    <div>
                                        <div className="font-medium">Private</div>
                                        <div className="text-xs text-muted-foreground">
                                            Only you can open this link (requires login).
                                        </div>
                                    </div>
                                </Label>
                            </div>
                            <div className="flex items-center space-x-2 rounded-md border p-3">
                                <RadioGroupItem value="public" id="hr-public" />
                                <Label
                                    htmlFor="hr-public"
                                    className="flex-1 cursor-pointer flex items-center gap-2"
                                >
                                    <Globe className="w-4 h-4 text-primary" />
                                    <div>
                                        <div className="font-medium">Public</div>
                                        <div className="text-xs text-muted-foreground">
                                            Anyone with the link can view this report.
                                        </div>
                                    </div>
                                </Label>
                            </div>
                        </RadioGroup>
                    </div>

                    {generatedLink && (
                        <div className="space-y-3 rounded-md border bg-muted/40 p-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <LinkIcon className="w-4 h-4 text-primary" />
                                    <Label className="text-sm font-medium">
                                        Generated share link
                                    </Label>
                                </div>
                                <Badge variant="outline" className="text-[10px]">
                                    {generatedLink.mode === "public" ? "Public" : "Private"}
                                </Badge>
                            </div>
                            <div className="flex gap-2">
                                <Input
                                    value={generatedLink.link}
                                    readOnly
                                    className="text-xs font-mono"
                                />
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={handleCopyLink}
                                    aria-label="Copy link"
                                >
                                    {linkCopied ? (
                                        <Check className="w-4 h-4 text-green-600" />
                                    ) : (
                                        <Copy className="w-4 h-4" />
                                    )}
                                </Button>
                            </div>
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span>
                                    Expires: {formatExpirationDate(generatedLink.expirationDate)}
                                </span>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleRevokeLink}
                                    className="h-7 px-2 text-xs"
                                >
                                    Revoke link
                                </Button>
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleGenerateLink} disabled={isGenerating}>
                        {isGenerating ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Generating...
                            </>
                        ) : (
                            <>
                                <LinkIcon className="w-4 h-4 mr-2" />
                                Generate link
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
