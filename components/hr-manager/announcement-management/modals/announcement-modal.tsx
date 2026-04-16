"use client";

import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AnnouncementModel } from "@/lib/models/announcement";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { getTimestamp } from "@/lib/util/dayjs_format";
import { AudienceTarget } from "@/components/common/audience-target";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useFirestore } from "@/context/firestore-context";
import { useToast } from "@/context/toastContext";

interface AnnouncementModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (announcement: AnnouncementModel) => void;
    announcement: AnnouncementModel | null;
    mode: "add" | "edit" | "view";
}

const audienceOptions = [
    { value: "all", label: "All" },
    { value: "employees", label: "Employees" },
    { value: "department", label: "Department" },
    { value: "section", label: "Section" },
    { value: "location", label: "Location" },
    { value: "grade", label: "Grade" },
    { value: "managers", label: "Managers" },
    { value: "notManagers", label: "Not Managers" },
];

export function AnnouncementModal({
    isOpen,
    onClose,
    onSave,
    announcement,
    mode,
}: AnnouncementModalProps) {
    const { hrSettings } = useFirestore();
    const { showToast } = useToast();
    const [formData, setFormData] = useState<AnnouncementModel>({
        id: "",
        timestamp: "",
        announcementTitle: "",
        startDate: "",
        endDate: "",
        publishStatus: "Unpublished",
        audienceTarget: [],
        employees: [],
        departments: [],
        sections: [],
        locations: [],
        grades: [],
        criticity: "",
        announcementType: "",
    });

    const [showAudienceDropdown, setShowAudienceDropdown] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (announcement) {
            setFormData(announcement);
        } else {
            setFormData({
                id: "",
                timestamp: getTimestamp(),
                announcementTitle: "",
                startDate: "",
                endDate: "",
                publishStatus: "Unpublished",
                audienceTarget: [],
                employees: [],
                departments: [],
                sections: [],
                locations: [],
                grades: [],
                criticity: "",
                announcementType: "",
            });
        }
    }, [announcement, isOpen]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowAudienceDropdown(false);
            }
        };

        if (showAudienceDropdown) {
            document.addEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [showAudienceDropdown]);

    const handleClose = () => {
        setShowAudienceDropdown(false);
        onClose();
    };

    const handleSave = () => {
        if (
            !formData.announcementTitle ||
            !formData.startDate ||
            !formData.endDate ||
            formData.audienceTarget.length === 0 ||
            !formData.criticity ||
            !formData.announcementType
        ) {
            showToast("Please fill in all required fields", "Error", "error");
            return;
        }
        onSave(formData);
        handleClose();
    };

    const toggleAudienceTarget = (value: string) => {
        setFormData(prev => ({
            ...prev,
            audienceTarget: prev.audienceTarget.includes(value)
                ? prev.audienceTarget.filter(t => t !== value)
                : [...prev.audienceTarget, value],
        }));
    };

    const isViewMode = mode === "view";

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold text-brand-700 dark:text-foreground">
                        {mode === "add"
                            ? "Add New Announcement"
                            : mode === "edit"
                                ? "Edit Announcement"
                                : "Announcement Details"}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label
                                htmlFor="timestamp"
                                className="text-brand-700 font-semibold dark:text-foreground"
                            >
                                Timestamp <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="timestamp"
                                value={formData.timestamp}
                                disabled
                                className="bg-accent-50 dark:bg-muted"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label
                            htmlFor="announcementTitle"
                            className="text-brand-700 font-semibold dark:text-foreground"
                        >
                            Announcement Title <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="announcementTitle"
                            value={formData.announcementTitle}
                            onChange={e =>
                                setFormData({ ...formData, announcementTitle: e.target.value })
                            }
                            placeholder="Enter announcement title"
                            disabled={isViewMode}
                            className="dark:bg-background"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label
                                htmlFor="startDate"
                                className="text-brand-700 font-semibold dark:text-foreground"
                            >
                                Start Date <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="startDate"
                                type="date"
                                value={formData.startDate}
                                onChange={e =>
                                    setFormData({ ...formData, startDate: e.target.value })
                                }
                                disabled={isViewMode}
                                className="dark:bg-background"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label
                                htmlFor="endDate"
                                className="text-brand-700 font-semibold dark:text-foreground"
                            >
                                End Date <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="endDate"
                                type="date"
                                value={formData.endDate}
                                onChange={e =>
                                    setFormData({ ...formData, endDate: e.target.value })
                                }
                                disabled={isViewMode}
                                className="dark:bg-background"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-brand-700 font-semibold dark:text-foreground">
                            Audience Target <span className="text-red-500">*</span>
                        </Label>
                        <div className="relative" ref={dropdownRef}>
                            <div
                                className="border border-input rounded-md p-3 min-h-[42px] cursor-pointer hover:bg-accent-50 dark:hover:bg-muted dark:bg-background transition-colors"
                                onClick={() =>
                                    !isViewMode && setShowAudienceDropdown(!showAudienceDropdown)
                                }
                            >
                                {formData.audienceTarget.length > 0 ? (
                                    <div className="flex flex-wrap gap-2">
                                        {formData.audienceTarget.map(target => (
                                            <Badge
                                                key={target}
                                                variant="secondary"
                                                className="bg-brand-100 text-brand-700"
                                            >
                                                {target}
                                            </Badge>
                                        ))}
                                    </div>
                                ) : (
                                    <span className="text-muted-foreground">
                                        Select audience targets
                                    </span>
                                )}
                            </div>
                            {showAudienceDropdown && !isViewMode && (
                                <div className="absolute z-50 w-full mt-1 bg-white dark:bg-card border border-input rounded-md shadow-xl max-h-60 overflow-auto">
                                    {audienceOptions.map(option => (
                                        <div
                                            key={option.value}
                                            className="flex items-center space-x-3 p-3 hover:bg-accent-100 dark:hover:bg-accent cursor-pointer transition-colors border-b border-accent-100 dark:border-border last:border-b-0"
                                            onClick={e => {
                                                e.stopPropagation();
                                                toggleAudienceTarget(option.value);
                                            }}
                                        >
                                            <Checkbox
                                                checked={formData.audienceTarget.includes(
                                                    option.value,
                                                )}
                                                onCheckedChange={() =>
                                                    toggleAudienceTarget(option.value)
                                                }
                                                onClick={e => e.stopPropagation()}
                                            />
                                            <span className="text-sm font-medium text-brand-700 dark:text-foreground">
                                                {option.label}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <AudienceTarget
                        formData={formData}
                        setFormData={data => setFormData({ ...formData, ...data })}
                    />

                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label
                                htmlFor="criticity"
                                className="text-brand-700 font-semibold dark:text-foreground"
                            >
                                Criticity <span className="text-red-500">*</span>
                            </Label>
                            <Select
                                value={formData.criticity}
                                onValueChange={value =>
                                    setFormData({ ...formData, criticity: value })
                                }
                                disabled={isViewMode}
                            >
                                <SelectTrigger className="dark:bg-background">
                                    <SelectValue placeholder="Select criticity" />
                                </SelectTrigger>
                                <SelectContent>
                                    {hrSettings.criticity?.map(crit => (
                                        <SelectItem key={crit.id} value={crit.id}>
                                            {crit.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label
                                htmlFor="announcementType"
                                className="text-brand-700 font-semibold dark:text-foreground"
                            >
                                Announcement Type <span className="text-red-500">*</span>
                            </Label>
                            <Select
                                value={formData.announcementType}
                                onValueChange={value =>
                                    setFormData({ ...formData, announcementType: value })
                                }
                                disabled={isViewMode}
                            >
                                <SelectTrigger className="dark:bg-background">
                                    <SelectValue placeholder="Select announcement type" />
                                </SelectTrigger>
                                <SelectContent>
                                    {hrSettings.announcementTypes?.map(type => (
                                        <SelectItem key={type.id} value={type.id}>
                                            {type.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-accent-200 dark:border-border">
                    <Button variant="outline" onClick={handleClose}>
                        {isViewMode ? "Close" : "Cancel"}
                    </Button>
                    {!isViewMode && (
                        <Button
                            onClick={handleSave}
                            className="bg-brand-600 hover:bg-brand-700 text-white"
                        >
                            {mode === "add" ? "Create Announcement" : "Save Changes"}
                        </Button>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
