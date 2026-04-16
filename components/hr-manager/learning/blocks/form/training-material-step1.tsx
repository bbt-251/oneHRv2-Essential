"use client";
import type React from "react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { TrainingMaterialRequestModel } from "@/lib/models/training-material";
import { useFirestore } from "@/context/firestore-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { useMemo, useRef, useState } from "react";
import PdfViewer from "../../../../employee/training-management/blocks/pdf-viewer";
import { VideoPlayer } from "@/components/common/video-player";
import { TMCategory } from "@/lib/models/hr-settings";
import CascaderDropdown from "@/components/custom-cascader";

const findCategoryPath = (
    categories: TMCategory[],
    targetId: string,
    currentPath: string[] = [],
): string[] | null => {
    for (const category of categories) {
        const newPath = [...currentPath, category.id];
        if (category.id === targetId) {
            return newPath;
        }
        if (category.subcategory?.length) {
            const foundPath = findCategoryPath(category.subcategory, targetId, newPath);
            if (foundPath) {
                return foundPath;
            }
        }
    }
    return null;
};

interface TrainingMaterialStep1Props {
    formData: Partial<TrainingMaterialRequestModel>;
    setFormData: (formData: Partial<TrainingMaterialRequestModel>) => void;
}

export function TrainingMaterialStep1({ formData, setFormData }: TrainingMaterialStep1Props) {
    const { hrSettings } = useFirestore();
    const [newOutcome, setNewOutcome] = useState("");

    const trainingOutcomes: string[] = Array.isArray(formData.trainingOutcome)
        ? formData.trainingOutcome
        : formData.trainingOutcome
            ? [String(formData.trainingOutcome as any)]
            : [];

    const categoryOptions = useMemo(() => {
        const convertToOptions = (
            nodes: TMCategory[],
        ): { value: string; label: string; children?: any[] }[] => {
            return nodes
                .filter(node => node.active === "Yes")
                .map(node => ({
                    value: node.id,
                    label: node.name,
                    children:
                        node.subcategory && node.subcategory.length > 0
                            ? convertToOptions(node.subcategory)
                            : undefined,
                }));
        };
        return convertToOptions(hrSettings.tmCategories);
    }, [hrSettings.tmCategories]);

    const handleCategorySelect = (selectedId: string) => {
        const fullPath = findCategoryPath(hrSettings.tmCategories, selectedId);
        if (fullPath) {
            setFormData({ ...formData, category: [fullPath[0]] });
        }
    };

    const renderContent = () => {
        if (["Video", "Audio"].includes(formData.format ?? "")) {
            return (
                <div className="aspect-video w-full bg-black rounded-lg overflow-hidden">
                    <VideoPlayer url={formData.url ?? ""} format={formData.format ?? ""} />
                </div>
            );
        } else if (formData.format == "PDF") {
            return (
                <div className="aspect-[4/3] w-full bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
                    <PdfViewer url={formData.url ?? ""} isDownloadable={true} />
                </div>
            );
        } else {
            return (
                <div className="aspect-video w-full bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                    <p className="text-gray-500">Content not available</p>
                </div>
            );
        }
    };

    const addOutcome = () => {
        const value = newOutcome.trim();
        if (!value) return;
        const current = trainingOutcomes;
        if (current.includes(value)) {
            setNewOutcome("");
            return;
        }
        setFormData({ ...formData, trainingOutcome: [...current, value] });
        setNewOutcome("");
    };

    const removeOutcome = (index: number) => {
        const current = trainingOutcomes;
        const next = current.filter((_, i) => i !== index);
        setFormData({ ...formData, trainingOutcome: next });
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="timestamp">Timestamp</Label>
                    <Input
                        id="timestamp"
                        value={
                            formData.timestamp
                                ? new Date(formData.timestamp).toLocaleString()
                                : new Date().toLocaleString()
                        }
                        readOnly
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="name">Training Material Name *</Label>
                    <Input
                        id="name"
                        value={formData.name || ""}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Enter training material name"
                    />
                </div>
            </div>

            <div className="flex flex-col gap-2">
                <Label htmlFor="category">Category</Label>
                <CascaderDropdown
                    options={categoryOptions}
                    value={formData.category?.[formData.category.length - 1] || ""}
                    setDynamicOptions={handleCategorySelect}
                />
                <p className={`text-xs mt-1`}>Select category from the list</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="medium">Medium</Label>
                    <Select
                        value={formData.medium || "Virtual"}
                        onValueChange={(value: "Virtual" | "Physical") =>
                            setFormData({ ...formData, medium: value })
                        }
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Virtual">Virtual</SelectItem>
                            <SelectItem value="Physical">Physical</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="medium">Format</Label>
                    <Select
                        value={formData.format || "Video"}
                        onValueChange={(value: "Audio" | "Video" | "PDF") =>
                            setFormData({ ...formData, format: value })
                        }
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Video">Video</SelectItem>
                            <SelectItem value="Audio">Audio</SelectItem>
                            <SelectItem value="PDF">PDF</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="url">URL *</Label>
                    <div className="flex gap-2">
                        <Input
                            id="url"
                            value={formData.url || ""}
                            onChange={e => setFormData({ ...formData, url: e.target.value })}
                            placeholder="Enter material URL"
                        />
                        {formData.format && ["Video", "Audio"].includes(formData.format) && (
                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button variant="outline" size="sm">
                                        Verify
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-4xl">
                                    <DialogHeader>
                                        <DialogTitle>Check if the video plays</DialogTitle>
                                    </DialogHeader>
                                    <div className="mt-4">{renderContent()}</div>
                                </DialogContent>
                            </Dialog>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex items-center space-x-2">
                <Switch
                    id="isExternalLink"
                    checked={formData.isExternalLink || false}
                    onCheckedChange={checked =>
                        setFormData({ ...formData, isExternalLink: checked })
                    }
                />
                <Label htmlFor="isExternalLink">External Link</Label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="length">Length/Duration</Label>
                    <Select
                        value={formData.length || ""}
                        onValueChange={value => setFormData({ ...formData, length: value })}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select duration" />
                        </SelectTrigger>
                        <SelectContent>
                            {hrSettings.tmLengths
                                .filter(len => len.active === "Yes")
                                .map(len => (
                                    <SelectItem key={len.id} value={len.id}>
                                        {len.name}
                                    </SelectItem>
                                ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="complexity">Complexity</Label>
                    <Select
                        value={formData.complexity || ""}
                        onValueChange={value => setFormData({ ...formData, complexity: value })}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select complexity" />
                        </SelectTrigger>
                        <SelectContent>
                            {hrSettings.tmComplexity
                                .filter(com => com.active === "Yes")
                                .map(com => (
                                    <SelectItem key={com.id} value={com.id}>
                                        {com.name}
                                    </SelectItem>
                                ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="trainingCost">Training Cost</Label>
                <Select
                    value={formData.trainingCost || "Free"}
                    onValueChange={(value: "Free" | "Paid") =>
                        setFormData({ ...formData, trainingCost: value })
                    }
                >
                    <SelectTrigger>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Free">Free</SelectItem>
                        <SelectItem value="Paid">Paid</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-2">
                <Label htmlFor="trainingOutcome">Training Outcomes</Label>
                <div className="flex gap-2">
                    <Input
                        id="trainingOutcome"
                        value={newOutcome}
                        onChange={e => setNewOutcome(e.target.value)}
                        placeholder="Add an outcome and click Add"
                    />
                    <Button type="button" variant="outline" onClick={addOutcome}>
                        Add
                    </Button>
                </div>
                {trainingOutcomes.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                        {trainingOutcomes.map((outcome, index) => (
                            <Badge
                                key={index}
                                variant="secondary"
                                className="flex items-center gap-2"
                            >
                                <span>{outcome}</span>
                                <button
                                    type="button"
                                    className="text-xs opacity-70 hover:opacity-100"
                                    onClick={() => removeOutcome(index)}
                                    aria-label="Remove outcome"
                                >
                                    ×
                                </button>
                            </Badge>
                        ))}
                    </div>
                )}
            </div>

            <div className="space-y-2">
                <Label htmlFor="trainingJustification">Training Justification</Label>
                <Textarea
                    id="trainingJustification"
                    value={formData.trainingJustification || ""}
                    onChange={e =>
                        setFormData({ ...formData, trainingJustification: e.target.value })
                    }
                    placeholder="Justify the need for this training"
                    rows={3}
                />
            </div>
        </div>
    );
}
