"use client";

import type React from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/authContext";
import { useToast } from "@/context/toastContext";
import { addDefect } from "@/lib/backend/api/defect-service";
import { createLog } from "@/lib/backend/api/logCollection";
import { storageBBT } from "@/lib/backend/firebase/init";
import uploadFile from "@/lib/backend/firebase/upload/uploadFile";
import generateID from "@/lib/util/generateID";
import getFullName from "@/lib/util/getEmployeeFullName";
import dayjs from "dayjs";
import {
    AlertCircle,
    AlertTriangle,
    Bug,
    CheckCircle2,
    FileText,
    ImageIcon,
    Paperclip,
    Send,
    Star,
    Upload,
    Video,
    X,
    Zap,
} from "lucide-react";
import { useState } from "react";

interface DefectReportModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface AttachedFile {
    id: string;
    name: string;
    size: number;
    type: string;
    url?: string;
    file?: File;
}

export function DefectReportModal({ isOpen, onClose }: DefectReportModalProps) {
    const { userData } = useAuth();
    const { showToast } = useToast();
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        stepsToReproduce: "",
        expectedBehavior: "",
        actualBehavior: "",
        priority: "",
        category: "",
        severity: "",
    });

    const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
    const [screenshots, setScreenshots] = useState<AttachedFile[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [currentStep, setCurrentStep] = useState(1);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadStatus, setUploadStatus] = useState("");

    const priorities = [
        { value: "critical", label: "Critical", color: "bg-red-500", icon: AlertTriangle },
        { value: "high", label: "High", color: "bg-orange-500", icon: Zap },
        { value: "medium", label: "Medium", color: "bg-yellow-500", icon: AlertCircle },
        { value: "low", label: "Low", color: "bg-green-500", icon: CheckCircle2 },
    ];

    const categories = [
        { value: "ui-ux", label: "UI/UX Issue", icon: "🎨" },
        { value: "functionality", label: "Functionality", icon: "⚙️" },
        { value: "performance", label: "Performance", icon: "⚡" },
        { value: "security", label: "Security", icon: "🔒" },
        { value: "data", label: "Data Issue", icon: "📊" },
        { value: "integration", label: "Integration", icon: "🔗" },
        { value: "mobile", label: "Mobile", icon: "📱" },
        { value: "other", label: "Other", icon: "🔧" },
    ];

    const severityLevels = [
        { value: "blocker", label: "Blocker", description: "Prevents testing/usage" },
        { value: "major", label: "Major", description: "Major functionality affected" },
        { value: "minor", label: "Minor", description: "Minor functionality affected" },
        { value: "trivial", label: "Trivial", description: "Cosmetic issues" },
    ];

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: "" }));
        }
    };

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(event.target.files || []);
        const newFiles: AttachedFile[] = files.map(file => ({
            id: Math.random().toString(36).substr(2, 9),
            name: file.name,
            size: file.size,
            type: file.type,
            file: file,
        }));
        setAttachedFiles(prev => [...prev, ...newFiles]);
    };

    const removeFile = (fileId: string) => {
        setAttachedFiles(prev => prev.filter(file => file.id !== fileId));
    };

    const getFileIcon = (type: string) => {
        if (type.startsWith("image/")) return <ImageIcon className="h-4 w-4 text-blue-500" />;
        if (type.startsWith("video/")) return <Video className="h-4 w-4 text-purple-500" />;
        return <FileText className="h-4 w-4 text-gray-500" />;
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return "0 Bytes";
        const k = 1024;
        const sizes = ["Bytes", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    };

    const validateStep = (step: number) => {
        const newErrors: Record<string, string> = {};

        if (step === 1) {
            if (!formData.title.trim()) newErrors.title = "Title is required";
            if (!formData.description.trim()) newErrors.description = "Description is required";
            if (!formData.stepsToReproduce.trim())
                newErrors.stepsToReproduce = "Steps to reproduce are required";
        }

        if (step === 2) {
            if (!formData.priority) newErrors.priority = "Priority is required";
            if (!formData.category) newErrors.category = "Category is required";
            if (!formData.severity) newErrors.severity = "Severity is required";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleNext = () => {
        if (validateStep(currentStep)) {
            setCurrentStep(prev => Math.min(prev + 1, 3));
        }
    };

    const handlePrevious = () => {
        setCurrentStep(prev => Math.max(prev - 1, 1));
    };

    const handleScreenshotUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(event.target.files || []);
        const newScreenshots: AttachedFile[] = files.map(file => ({
            id: Math.random().toString(36).substr(2, 9),
            name: file.name,
            size: file.size,
            type: file.type,
            file: file,
        }));
        setScreenshots(prev => [...prev, ...newScreenshots]);
    };

    const removeScreenshot = (screenshotId: string) => {
        setScreenshots(prev => prev.filter(screenshot => screenshot.id !== screenshotId));
    };

    const handleSubmit = async () => {
        if (!validateStep(2)) return;

        if (!userData) return;

        setIsSubmitting(true);
        setUploadProgress(0);
        setUploadStatus("Preparing files...");

        try {
            const totalFiles = screenshots.length + attachedFiles.length;
            let uploadedCount = 0;

            // Upload screenshots
            setUploadStatus("Uploading screenshots...");
            const uploadedScreenshotUrls: string[] = await Promise.all(
                screenshots.map(async screenshot => {
                    if (screenshot.file) {
                        const downloadUrl = await uploadFile(
                            screenshot.file,
                            "defect-screenshots",
                            storageBBT,
                        );
                        if (!downloadUrl) {
                            throw new Error(`Failed to upload screenshot ${screenshot.name}`);
                        }
                        uploadedCount++;
                        setUploadProgress((uploadedCount / totalFiles) * 100);
                        return downloadUrl;
                    }
                    return "";
                }),
            ).then(urls => urls.filter(url => url !== ""));

            // Upload attachments
            setUploadStatus("Uploading attachments...");
            const uploadedAttachmentUrls: string[] = await Promise.all(
                attachedFiles.map(async attachment => {
                    if (attachment.file) {
                        const downloadUrl = await uploadFile(attachment.file, "defect-attachments");
                        if (!downloadUrl) {
                            throw new Error(`Failed to upload attachment ${attachment.name}`);
                        }
                        uploadedCount++;
                        setUploadProgress((uploadedCount / totalFiles) * 100);
                        return downloadUrl;
                    }
                    return "";
                }),
            ).then(urls => urls.filter(url => url !== ""));

            setUploadStatus("Saving defect report...");
            setUploadProgress(90);

            const values = {
                ...formData,
                defectID: generateID(),
                timestamp: dayjs().format("MMMM DD, YYYY hh:mm:ss A"),
                employeeID: userData.employeeID,
                environment: window.location.origin,
                project: "oneHR",
                status: "Open" as const,
                reportedBy: getFullName(userData),
                reportedDate: dayjs().format("YYYY-MM-DD"),
                priority: (formData.priority.charAt(0).toUpperCase() +
                    formData.priority.slice(1)) as "Critical" | "High" | "Medium" | "Low",
                images: uploadedScreenshotUrls,
                attachments: uploadedAttachmentUrls,
            };

            // Log data
            const actor = userData.employeeID ?? "";
            const moduleName = "General HR Settings Functions";
            const actionType = "Edit";
            const action = `Reported a defect`;

            const res = await addDefect(values);

            if (res === true) {
                setUploadProgress(100);
                setUploadStatus("Defect reported successfully!");
                showToast("Defect reported successfully!", "Success", "success");

                // Small delay to show completion
                setTimeout(() => {
                    setIsSubmitting(false);
                    setUploadProgress(0);
                    setUploadStatus("");
                    onClose();

                    // Reset form
                    setFormData({
                        title: "",
                        description: "",
                        stepsToReproduce: "",
                        expectedBehavior: "",
                        actualBehavior: "",
                        priority: "",
                        category: "",
                        severity: "",
                    });
                    setAttachedFiles([]);
                    setScreenshots([]);
                    setCurrentStep(1);
                }, 1000);

                // Add activity log
                await createLog(
                    {
                        module: moduleName,
                        title: action,
                        description: `Defect "${values.title}" reported by ${values.reportedBy}`,
                    },
                    actor,
                    "Success",
                );

                // Discord webhook notification
                if (
                    values.environment.includes("vercel.app") === false &&
                    values.environment.includes("localhost") === false
                ) {
                    try {
                        const response = await fetch(
                            "https://discord.com/api/webhooks/1299321234567890123/abcdefghijklmnopqrstuvwxyz1234567890",
                            {
                                method: "POST",
                                headers: {
                                    "Content-Type": "application/json",
                                },
                                body: JSON.stringify({
                                    content: `${values.timestamp}\n\nEnvironment: ${values.environment}\n\nBy: ${values.reportedBy}\n\nTitle: ${values.title}\n\nDescription: ${values.description}\n\nImages: ${values.images.length} screenshots\n\nAttachments: ${values.attachments.length} files`,
                                }),
                            },
                        );

                        if (response.ok) {
                            console.log("Successfully sent to Discord");
                        } else {
                            console.error("Failed to send to Discord:", response.status);
                        }
                    } catch (error) {
                        console.error("Error sending to Discord:", error);
                    }
                }
            } else {
                showToast("Failed to report defect. Please try again.", "Error", "error");
                setIsSubmitting(false);
                setUploadProgress(0);
                setUploadStatus("");
            }
        } catch (error) {
            console.log("Error submitting defect:", error);
            const errorMessage =
                error instanceof Error ? error.message : "An error occurred. Please try again.";
            showToast(errorMessage, "Error", "error");
            setIsSubmitting(false);
            setUploadProgress(0);
            setUploadStatus("");
        }
    };

    const defectId = "DEF-" + Math.random().toString(36).substr(2, 9).toUpperCase();

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[95vh] overflow-auto">
                <DialogHeader className="pb-6">
                    <DialogTitle className="text-2xl font-bold text-brand-800 dark:text-brand-200 flex items-center gap-3">
                        <div className="p-2 bg-red-100 rounded-xl dark:bg-red-900/30">
                            <Bug className="h-6 w-6 text-red-600 dark:text-red-400" />
                        </div>
                        Report a Defect
                        {/* <Badge className="bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400">
                            {defectId}
                        </Badge> */}
                    </DialogTitle>
                </DialogHeader>

                {/* Progress Indicator */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                            {[1, 2, 3].map(step => (
                                <div key={step} className="flex items-center gap-2">
                                    <div
                                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                                            step <= currentStep
                                                ? "bg-brand-600 text-white"
                                                : "bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400"
                                        }`}
                                    >
                                        {step < currentStep ? (
                                            <CheckCircle2 className="h-4 w-4" />
                                        ) : (
                                            step
                                        )}
                                    </div>
                                    <span
                                        className={`text-sm font-medium ${
                                            step <= currentStep
                                                ? "text-brand-700 dark:text-brand-300"
                                                : "text-gray-500"
                                        }`}
                                    >
                                        {step === 1
                                            ? "Details"
                                            : step === 2
                                                ? "Classification"
                                                : "Review"}
                                    </span>
                                    {step < 3 && (
                                        <div
                                            className={`w-12 h-0.5 mx-2 ${
                                                step < currentStep
                                                    ? "bg-brand-600"
                                                    : "bg-gray-200 dark:bg-gray-700"
                                            }`}
                                        />
                                    )}
                                </div>
                            ))}
                        </div>
                        <div className="text-sm text-gray-500">Step {currentStep} of 3</div>
                    </div>
                    <Progress value={(currentStep / 3) * 100} className="h-2" />
                </div>

                <div>
                    {/* Step 1: Defect Details */}
                    {currentStep === 1 && (
                        <div className="space-y-6">
                            <Card className="border-accent-200 dark:border-accent-700">
                                <CardContent className="p-6 space-y-6">
                                    <div className="flex items-center gap-2 mb-4">
                                        <FileText className="h-5 w-5 text-brand-600" />
                                        <h3 className="text-lg font-semibold text-brand-800 dark:text-brand-200">
                                            Defect Information
                                        </h3>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium text-brand-700 dark:text-brand-300">
                                            Defect Title *
                                        </Label>
                                        <Input
                                            placeholder="Brief, descriptive title of the defect"
                                            value={formData.title}
                                            onChange={e =>
                                                handleInputChange("title", e.target.value)
                                            }
                                            className={`border-2 ${
                                                errors.title
                                                    ? "border-red-400"
                                                    : "border-accent-400"
                                            } focus:border-brand-500 bg-white dark:bg-input`}
                                        />
                                        {errors.title && (
                                            <p className="text-xs text-red-600 flex items-center gap-1">
                                                <AlertCircle className="h-3 w-3" />
                                                {errors.title}
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium text-brand-700 dark:text-brand-300">
                                            Detailed Description *
                                        </Label>
                                        <Textarea
                                            placeholder="Provide a detailed description of the defect..."
                                            value={formData.description}
                                            onChange={e =>
                                                handleInputChange("description", e.target.value)
                                            }
                                            className={`border-2 ${
                                                errors.description
                                                    ? "border-red-400"
                                                    : "border-accent-400"
                                            } focus:border-brand-500 min-h-[120px] bg-white dark:bg-input`}
                                        />
                                        {errors.description && (
                                            <p className="text-xs text-red-600 flex items-center gap-1">
                                                <AlertCircle className="h-3 w-3" />
                                                {errors.description}
                                            </p>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label className="text-sm font-medium text-brand-700 dark:text-brand-300">
                                                Steps to Reproduce *
                                            </Label>
                                            <Textarea
                                                placeholder="1. Navigate to...&#10;2. Click on...&#10;3. Enter..."
                                                value={formData.stepsToReproduce}
                                                onChange={e =>
                                                    handleInputChange(
                                                        "stepsToReproduce",
                                                        e.target.value,
                                                    )
                                                }
                                                className={`border-2 ${
                                                    errors.stepsToReproduce
                                                        ? "border-red-400"
                                                        : "border-accent-400"
                                                } focus:border-brand-500 min-h-[100px] bg-white dark:bg-input`}
                                            />
                                            {errors.stepsToReproduce && (
                                                <p className="text-xs text-red-600 flex items-center gap-1">
                                                    <AlertCircle className="h-3 w-3" />
                                                    {errors.stepsToReproduce}
                                                </p>
                                            )}
                                        </div>

                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <Label className="text-sm font-medium text-brand-700 dark:text-brand-300">
                                                    Expected Behavior
                                                </Label>
                                                <Textarea
                                                    placeholder="What should happen..."
                                                    value={formData.expectedBehavior}
                                                    onChange={e =>
                                                        handleInputChange(
                                                            "expectedBehavior",
                                                            e.target.value,
                                                        )
                                                    }
                                                    className="border-2 border-accent-400 focus:border-brand-500 min-h-[100px] bg-white dark:bg-input"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium text-brand-700 dark:text-brand-300">
                                            Actual Behavior
                                        </Label>
                                        <Textarea
                                            placeholder="What actually happens..."
                                            value={formData.actualBehavior}
                                            onChange={e =>
                                                handleInputChange("actualBehavior", e.target.value)
                                            }
                                            className="border-2 border-accent-400 focus:border-brand-500 min-h-[100px] bg-white dark:bg-input"
                                        />
                                    </div>

                                    {/* Screenshots Section */}
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2">
                                            <ImageIcon className="h-5 w-5 text-brand-600" />
                                            <Label className="text-sm font-medium text-brand-700 dark:text-brand-300">
                                                Screenshots
                                            </Label>
                                        </div>

                                        <div className="border-2 border-dashed border-accent-300 rounded-xl p-6 text-center hover:border-brand-400 transition-colors bg-accent-50/50 dark:bg-accent-900/10">
                                            <input
                                                type="file"
                                                multiple
                                                accept="image/*"
                                                onChange={handleScreenshotUpload}
                                                className="hidden"
                                                id="screenshot-upload"
                                            />
                                            <label
                                                htmlFor="screenshot-upload"
                                                className="cursor-pointer"
                                            >
                                                <ImageIcon className="h-10 w-10 text-brand-400 mx-auto mb-3" />
                                                <p className="text-base font-medium text-brand-700 dark:text-brand-300 mb-1">
                                                    Upload Screenshots
                                                </p>
                                                <p className="text-sm text-brand-500">
                                                    Click to select multiple images or drag and drop
                                                </p>
                                                <p className="text-xs text-gray-400 mt-1">
                                                    PNG, JPG, GIF up to 5MB each
                                                </p>
                                            </label>
                                        </div>

                                        {screenshots.length > 0 && (
                                            <div className="space-y-3">
                                                <h4 className="font-medium text-brand-700 dark:text-brand-300">
                                                    Screenshots ({screenshots.length})
                                                </h4>
                                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                                    {screenshots.map(screenshot => (
                                                        <div
                                                            key={screenshot.id}
                                                            className="relative group bg-white dark:bg-card rounded-lg border border-accent-200 dark:border-accent-700 overflow-hidden hover:shadow-md transition-all"
                                                        >
                                                            <div className="aspect-video bg-accent-50 dark:bg-accent-900/20 flex items-center justify-center">
                                                                <ImageIcon className="h-8 w-8 text-brand-400" />
                                                            </div>
                                                            <div className="p-3">
                                                                <p className="text-xs font-medium text-brand-800 dark:text-brand-200 truncate">
                                                                    {screenshot.name}
                                                                </p>
                                                                <p className="text-xs text-brand-500">
                                                                    {formatFileSize(
                                                                        screenshot.size,
                                                                    )}
                                                                </p>
                                                            </div>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() =>
                                                                    removeScreenshot(screenshot.id)
                                                                }
                                                                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-red-500 hover:bg-red-600 text-white rounded-full p-1 h-6 w-6"
                                                            >
                                                                <X className="h-3 w-3" />
                                                            </Button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* Step 2: Classification */}
                    {currentStep === 2 && (
                        <div className="space-y-6">
                            <Card className="border-accent-200 dark:border-accent-700">
                                <CardContent className="p-6 space-y-6">
                                    <div className="flex items-center gap-2 mb-4">
                                        <Star className="h-5 w-5 text-brand-600" />
                                        <h3 className="text-lg font-semibold text-brand-800 dark:text-brand-200">
                                            Defect Classification
                                        </h3>
                                    </div>

                                    {/* Priority Selection */}
                                    <div className="space-y-3">
                                        <Label className="text-sm font-medium text-brand-700 dark:text-brand-300">
                                            Priority Level *
                                        </Label>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                            {priorities.map(priority => (
                                                <div
                                                    key={priority.value}
                                                    onClick={() =>
                                                        handleInputChange(
                                                            "priority",
                                                            priority.value,
                                                        )
                                                    }
                                                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all hover:shadow-md ${
                                                        formData.priority === priority.value
                                                            ? "border-brand-500 bg-brand-50 dark:bg-brand-900/20"
                                                            : "border-accent-300 hover:border-accent-400"
                                                    }`}
                                                >
                                                    <div className="flex flex-col items-center gap-2">
                                                        <div
                                                            className={`p-2 rounded-lg ${priority.color}`}
                                                        >
                                                            <priority.icon className="h-4 w-4 text-white" />
                                                        </div>
                                                        <span className="text-sm font-medium text-brand-800 dark:text-brand-200">
                                                            {priority.label}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        {errors.priority && (
                                            <p className="text-xs text-red-600 flex items-center gap-1">
                                                <AlertCircle className="h-3 w-3" />
                                                {errors.priority}
                                            </p>
                                        )}
                                    </div>

                                    {/* Category Selection */}
                                    <div className="space-y-3">
                                        <Label className="text-sm font-medium text-brand-700 dark:text-brand-300">
                                            Category *
                                        </Label>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                            {categories.map(category => (
                                                <div
                                                    key={category.value}
                                                    onClick={() =>
                                                        handleInputChange(
                                                            "category",
                                                            category.value,
                                                        )
                                                    }
                                                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all hover:shadow-md ${
                                                        formData.category === category.value
                                                            ? "border-brand-500 bg-brand-50 dark:bg-brand-900/20"
                                                            : "border-accent-300 hover:border-accent-400"
                                                    }`}
                                                >
                                                    <div className="flex flex-col items-center gap-2">
                                                        <span className="text-2xl">
                                                            {category.icon}
                                                        </span>
                                                        <span className="text-xs font-medium text-brand-800 dark:text-brand-200 text-center">
                                                            {category.label}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        {errors.category && (
                                            <p className="text-xs text-red-600 flex items-center gap-1">
                                                <AlertCircle className="h-3 w-3" />
                                                {errors.category}
                                            </p>
                                        )}
                                    </div>

                                    {/* Severity Level */}
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium text-brand-700 dark:text-brand-300">
                                            Severity Level *
                                        </Label>
                                        <Select
                                            value={formData.severity}
                                            onValueChange={value =>
                                                handleInputChange("severity", value)
                                            }
                                        >
                                            <SelectTrigger
                                                className={`border-2 ${
                                                    errors.severity
                                                        ? "border-red-400"
                                                        : "border-accent-400"
                                                } focus:border-brand-500 bg-white dark:bg-input`}
                                            >
                                                <SelectValue placeholder="Select severity level" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {severityLevels.map(level => (
                                                    <SelectItem
                                                        key={level.value}
                                                        value={level.value}
                                                    >
                                                        <div className="flex flex-col">
                                                            <span className="font-medium">
                                                                {level.label}
                                                            </span>
                                                            <span className="text-xs text-gray-500">
                                                                {level.description}
                                                            </span>
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {errors.severity && (
                                            <p className="text-xs text-red-600 flex items-center gap-1">
                                                <AlertCircle className="h-3 w-3" />
                                                {errors.severity}
                                            </p>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* Step 3: Attachments & Review */}
                    {currentStep === 3 && (
                        <div className="space-y-6">
                            {/* File Attachments */}
                            <Card className="border-accent-200 dark:border-accent-700">
                                <CardContent className="p-6 space-y-6">
                                    <div className="flex items-center gap-2 mb-4">
                                        <Paperclip className="h-5 w-5 text-brand-600" />
                                        <h3 className="text-lg font-semibold text-brand-800 dark:text-brand-200">
                                            Attachments
                                        </h3>
                                    </div>

                                    <div className="border-2 border-dashed border-accent-300 rounded-xl p-8 text-center hover:border-brand-400 transition-colors">
                                        <input
                                            type="file"
                                            multiple
                                            onChange={handleFileUpload}
                                            className="hidden"
                                            id="file-upload"
                                            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.mp4,.mov,.zip"
                                        />
                                        <label htmlFor="file-upload" className="cursor-pointer">
                                            <Upload className="h-12 w-12 text-brand-400 mx-auto mb-4" />
                                            <p className="text-lg font-medium text-brand-700 dark:text-brand-300 mb-2">
                                                Drop files here or click to upload
                                            </p>
                                            <p className="text-sm text-brand-500">
                                                Screenshots, videos, logs, or any relevant files
                                            </p>
                                            <p className="text-xs text-gray-400 mt-2">
                                                Supported: PDF, DOC, Images, Videos, ZIP (Max 10MB
                                                each)
                                            </p>
                                        </label>
                                    </div>

                                    {attachedFiles.length > 0 && (
                                        <div className="space-y-3">
                                            <h4 className="font-medium text-brand-700 dark:text-brand-300">
                                                Attached Files ({attachedFiles.length})
                                            </h4>
                                            {attachedFiles.map(file => (
                                                <div
                                                    key={file.id}
                                                    className="flex items-center justify-between p-4 bg-accent-50 dark:bg-accent-900/20 rounded-lg border border-accent-200 dark:border-accent-700"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        {getFileIcon(file.type)}
                                                        <div>
                                                            <span className="text-sm font-medium text-brand-800 dark:text-brand-200">
                                                                {file.name}
                                                            </span>
                                                            <p className="text-xs text-brand-500">
                                                                {formatFileSize(file.size)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => removeFile(file.id)}
                                                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Summary Review */}
                            <Card className="border-accent-200 dark:border-accent-700">
                                <CardContent className="p-6 space-y-4">
                                    <div className="flex items-center gap-2 mb-4">
                                        <CheckCircle2 className="h-5 w-5 text-brand-600" />
                                        <h3 className="text-lg font-semibold text-brand-800 dark:text-brand-200">
                                            Review Summary
                                        </h3>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-3">
                                            <div>
                                                <span className="text-sm font-medium text-brand-600">
                                                    Title:
                                                </span>
                                                <p className="text-brand-800 dark:text-brand-200">
                                                    {formData.title || "Not specified"}
                                                </p>
                                            </div>
                                            <div>
                                                <span className="text-sm font-medium text-brand-600">
                                                    Priority:
                                                </span>
                                                <p className="text-brand-800 dark:text-brand-200">
                                                    {priorities.find(
                                                        p => p.value === formData.priority,
                                                    )?.label || "Not specified"}
                                                </p>
                                            </div>
                                            <div>
                                                <span className="text-sm font-medium text-brand-600">
                                                    Category:
                                                </span>
                                                <p className="text-brand-800 dark:text-brand-200">
                                                    {categories.find(
                                                        c => c.value === formData.category,
                                                    )?.label || "Not specified"}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            <div>
                                                <span className="text-sm font-medium text-brand-600">
                                                    Severity:
                                                </span>
                                                <p className="text-brand-800 dark:text-brand-200">
                                                    {severityLevels.find(
                                                        s => s.value === formData.severity,
                                                    )?.label || "Not specified"}
                                                </p>
                                            </div>
                                            <div>
                                                <span className="text-sm font-medium text-brand-600">
                                                    Screenshots:
                                                </span>
                                                <p className="text-brand-800 dark:text-brand-200">
                                                    {screenshots.length} images
                                                </p>
                                            </div>
                                            <div>
                                                <span className="text-sm font-medium text-brand-600">
                                                    Attachments:
                                                </span>
                                                <p className="text-brand-800 dark:text-brand-200">
                                                    {attachedFiles.length} files
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </div>

                {/* Navigation Footer */}
                <div className="flex justify-between items-center pt-6 border-t border-accent-200 dark:border-border">
                    <div className="flex gap-3">
                        {currentStep > 1 && (
                            <Button
                                variant="outline"
                                onClick={handlePrevious}
                                className="border-accent-300 bg-transparent"
                            >
                                Previous
                            </Button>
                        )}
                    </div>
                    <div>
                        {isSubmitting && currentStep == 3 && (
                            <div className="flex flex-col gap-2 p-3 bg-accent-50 rounded-lg border border-accent-200">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-brand-700">
                                        {uploadStatus}
                                    </span>
                                    <span className="text-sm text-brand-600">
                                        {Math.round(uploadProgress)}%
                                    </span>
                                </div>
                                <Progress value={uploadProgress} className="h-2" />
                            </div>
                        )}
                        <div className="flex gap-3">
                            <Button
                                variant="outline"
                                onClick={onClose}
                                className="border-accent-300 bg-transparent"
                            >
                                Cancel
                            </Button>
                            {currentStep < 3 ? (
                                <Button
                                    onClick={handleNext}
                                    className="bg-brand-600 hover:bg-brand-700 text-white"
                                >
                                    Next Step
                                </Button>
                            ) : (
                                <div className="flex flex-col gap-2">
                                    <Button
                                        onClick={handleSubmit}
                                        disabled={isSubmitting}
                                        className="bg-red-600 hover:bg-red-700 text-white"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                                                Submitting...
                                            </>
                                        ) : (
                                            <>
                                                <Send className="h-4 w-4 mr-2" />
                                                Submit Defect Report
                                            </>
                                        )}
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
