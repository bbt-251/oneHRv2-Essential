"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { IssueModel } from "@/lib/models/Issue";
import { useFirestore } from "@/context/firestore-context";
import { useAuth } from "@/context/authContext";
import { getTimestamp, dateFormat } from "@/lib/util/dayjs_format";
import dayjs from "dayjs";

interface IssueFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (issue: IssueModel | Omit<IssueModel, "id">) => void;
    editingIssue?: IssueModel | null;
    isSubmitting?: boolean;
    isHRMode?: boolean;
}

export function IssueFormModal({
    isOpen,
    onClose,
    onSubmit,
    editingIssue,
    isSubmitting,
}: IssueFormModalProps) {
    const { hrSettings } = useFirestore();
    const { userData } = useAuth();
    const [formData, setFormData] = useState<Partial<IssueModel>>({
        issueID: "",
        issueTitle: "",
        issueDescription: "",
        issueType: "",
        issueStatus: "Open",
        impactType: "",
        priority: "",
        dateIdentified: "",
        protectAnonymity: false,
    });

    const [dateIdentified, setDateIdentified] = useState<Date | undefined>(undefined);

    useEffect(() => {
        if (isOpen) {
            if (editingIssue) {
                // We are editing an existing issue
                setFormData(editingIssue);
                if (editingIssue.dateIdentified) {
                    setDateIdentified(new Date(editingIssue.dateIdentified));
                }
            } else {
                // We are creating a new issue, generate ID once and reset the form
                const newIssueID = Math.random().toString(36).substr(2, 8).toUpperCase();
                setFormData({
                    issueID: newIssueID,
                    issueTitle: "",
                    issueDescription: "",
                    issueType: "",
                    issueStatus: "Open",
                    impactType: "",
                    priority: "",
                    dateIdentified: "",
                    protectAnonymity: false,
                });
                setDateIdentified(undefined);
            }
        }
    }, [editingIssue, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const issueData: Omit<IssueModel, "id"> = {
            issueID: formData.issueID || "",
            issueCreationDate: editingIssue?.issueCreationDate || getTimestamp(),
            issueTitle: formData.issueTitle || "",
            issueDescription: formData.issueDescription || "",
            issueType: formData.issueType || "",
            issueStatus: formData.issueStatus || "Open",
            impactType: formData.impactType || "",
            priority: formData.priority || "",
            dateIdentified: dateIdentified ? dayjs(dateIdentified).format(dateFormat) : "",
            resolutionSteps: [],
            resolutionDate: "",
            protectAnonymity: formData.protectAnonymity || false,
            employeeID: null,
            createdBy: userData?.uid || "",
        };

        await onSubmit(issueData);
        onClose();
    };

    const currentDate = new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto ">
                <DialogHeader className="flex flex-row items-center justify-between pb-4 border-b">
                    <DialogTitle className="text-xl font-semibold ">Add Issue</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6 pt-6">
                    {/* Issue ID and Creation Date */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label className="text-sm font-medium">
                                <span className="text-red-500">*</span> Issue ID :
                            </Label>
                            <div className="p-3 rounded-md border">
                                <p className="text-sm font-mono ">{formData.issueID}</p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-sm font-medium ">
                                <span className="text-red-500">*</span> Issue Creation Date :
                            </Label>
                            <div className="p-3 rounded-md border">
                                <p className="text-sm ">{currentDate}</p>
                            </div>
                        </div>
                    </div>

                    {/* Issue Title */}
                    <div className="space-y-2">
                        <Label htmlFor="issueTitle" className="text-sm font-medium ">
                            <span className="text-red-500">*</span> Issue Title :
                        </Label>
                        <Input
                            id="issueTitle"
                            placeholder=""
                            value={formData.issueTitle}
                            onChange={e =>
                                setFormData(prev => ({ ...prev, issueTitle: e.target.value }))
                            }
                            className="border-gray-300 focus:border-gray-500"
                            required
                        />
                    </div>

                    {/* Issue Description */}
                    <div className="space-y-2">
                        <Label htmlFor="issueDescription" className="text-sm font-medium ">
                            Issue Description :
                        </Label>
                        <Textarea
                            id="issueDescription"
                            placeholder=""
                            value={formData.issueDescription}
                            onChange={e =>
                                setFormData(prev => ({ ...prev, issueDescription: e.target.value }))
                            }
                            className="border-gray-300 focus:border-gray-500 min-h-[100px] resize-none"
                        />
                    </div>

                    {/* Issue Type and Status */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label className="text-sm font-medium ">Issue Type :</Label>
                            <Select
                                value={formData.issueType}
                                onValueChange={value =>
                                    setFormData(prev => ({ ...prev, issueType: value }))
                                }
                            >
                                <SelectTrigger className="border-gray-300 focus:border-gray-500">
                                    <SelectValue placeholder="select a type" />
                                </SelectTrigger>
                                <SelectContent>
                                    {hrSettings.issueTypes
                                        .filter(type => type.active === "Yes")
                                        .map(type => (
                                            <SelectItem key={type.id} value={type.id}>
                                                {type.name}
                                            </SelectItem>
                                        ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-sm font-medium ">Issue Status :</Label>
                            <Input
                                id="issueStatus"
                                placeholder=""
                                value={formData.issueStatus}
                                className="border-gray-300 focus:border-gray-500"
                                required
                                disabled
                            />
                        </div>
                    </div>

                    {/* Date Identified */}
                    <div className="space-y-2">
                        <Label className="text-sm font-medium ">Date Identified :</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    className="w-full justify-start text-left font-normal border-gray-300 focus:border-gray-500 text-gray-500 bg-transparent"
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {dateIdentified ? format(dateIdentified, "PPP") : "Select date"}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    mode="single"
                                    selected={dateIdentified}
                                    onSelect={setDateIdentified}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                    </div>

                    {/* Impact Type and Priority */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label className="text-sm font-medium ">Impact Type :</Label>
                            <Select
                                value={formData.impactType}
                                onValueChange={value =>
                                    setFormData(prev => ({ ...prev, impactType: value }))
                                }
                            >
                                <SelectTrigger className="border-gray-300 focus:border-gray-500">
                                    <SelectValue placeholder="select impact type" />
                                </SelectTrigger>
                                <SelectContent>
                                    {hrSettings.impactTypes
                                        .filter(impact => impact.active === "Yes")
                                        .map(impact => (
                                            <SelectItem key={impact.id} value={impact.id}>
                                                {impact.name}
                                            </SelectItem>
                                        ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-sm font-medium ">Priority :</Label>
                            <Select
                                value={formData.priority}
                                onValueChange={value =>
                                    setFormData(prev => ({ ...prev, priority: value }))
                                }
                            >
                                <SelectTrigger className="border-gray-300 focus:border-gray-500">
                                    <SelectValue placeholder="select priority" />
                                </SelectTrigger>
                                <SelectContent>
                                    {hrSettings.priorities
                                        .filter(priority => priority.active === "Yes")
                                        .map(priority => (
                                            <SelectItem key={priority.id} value={priority.id}>
                                                {priority.name}
                                            </SelectItem>
                                        ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Protect Anonymity */}
                    <div className="flex items-center space-x-3">
                        <Checkbox
                            id="protectAnonymity"
                            checked={formData.protectAnonymity}
                            onCheckedChange={checked =>
                                setFormData(prev => ({
                                    ...prev,
                                    protectAnonymity: checked as boolean,
                                }))
                            }
                        />
                        <Label htmlFor="protectAnonymity" className="text-sm font-medium ">
                            Protect Anonymity :
                        </Label>
                    </div>
                    <p className="text-md text-navy-500">
                        Check this box if you want to submit this issue anonymously. Your identity
                        will be protected.
                    </p>

                    {/* Submit Button */}
                    <div className="flex justify-center pt-6">
                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="bg-gray-700 hover:bg-gray-800 text-white px-12 py-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Saving...
                                </>
                            ) : editingIssue ? (
                                "Update"
                            ) : (
                                "Submit"
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
