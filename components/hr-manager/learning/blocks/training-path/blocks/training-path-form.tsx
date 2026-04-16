"use client";
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
import { TrainingPathModel } from "@/lib/models/training-path";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { useFirestore } from "@/context/firestore-context";
import { CalendarIcon, Check, ChevronRight, ChevronsUpDown, Loader2, X } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import dayjs from "dayjs";
import { dateFormat } from "@/lib/util/dayjs_format";
import { AudienceTarget } from "../../quiz-management/blocks/audience-target";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { TMCategory } from "@/lib/models/hr-settings";
import CascaderDropdown from "@/components/custom-cascader";
import { useMemo } from "react";

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

interface TrainingPathFormProps {
    isEdit?: boolean;
    pathFormData: Partial<TrainingPathModel>;
    setPathFormData: (formData: Partial<TrainingPathModel>) => void;
    onSubmit: () => void;
    isSubmitting: boolean;
    resetPathForm: () => void;
    setIsModalOpen: (isOpen: boolean) => void;
    setCurrentPathStep: (step: number) => void;
    currentPathStep: number;
}
export function TrainingPathForm({
    currentPathStep,
    setCurrentPathStep,
    pathFormData,
    setPathFormData,
    resetPathForm,
    isSubmitting,
    isEdit,
    onSubmit,
    setIsModalOpen,
}: TrainingPathFormProps) {
    const { trainingMaterials, hrSettings } = useFirestore();
    const competencies = hrSettings.competencies;
    const category = hrSettings.tmCategories;

    const handleNext = () => {
        if (currentPathStep < 2) {
            setCurrentPathStep(currentPathStep + 1);
        }
    };

    const handlePrevious = () => {
        if (currentPathStep > 1) {
            setCurrentPathStep(currentPathStep - 1);
        }
    };

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
            setPathFormData({ ...pathFormData, category: [fullPath[0]] });
        }
    };

    const handleRemoveTarget = (targetToRemove: string) => {
        const targetDataMap: { [key: string]: keyof TrainingPathModel } = {
            employees: "employees",
            department: "departments",
            section: "sections",
            location: "locations",
            grade: "grades",
        };

        const updatedFormData = { ...pathFormData };

        updatedFormData.audienceTarget = updatedFormData.audienceTarget?.filter(
            t => t !== targetToRemove,
        );

        const dataKey = targetDataMap[targetToRemove];
        if (dataKey && updatedFormData[dataKey]) {
            delete updatedFormData[dataKey];
        }

        setPathFormData(updatedFormData);
    };
    const targetAudienceOptions = [
        { label: "All Employees", value: "all" },
        { label: "Employees", value: "employees" },
        { label: "Department", value: "department" },
        { label: "Section", value: "section" },
        { label: "Location", value: "location" },
        { label: "Grade", value: "grade" },
        { label: "Managers", value: "managers" },
        { label: "Not Managers", value: "not_managers" },
    ];

    return (
        <div className="space-y-6">
            {/* Step Indicator */}
            <div className="flex items-center justify-center space-x-4">
                {[1, 2].map(step => (
                    <div key={step} className="flex items-center">
                        <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                                step <= currentPathStep
                                    ? "bg-brand-600 text-white"
                                    : "bg-gray-200 text-gray-600"
                            }`}
                        >
                            {step}
                        </div>
                        {step < 2 && (
                            <div
                                className={`w-16 h-1 mx-2 ${step < currentPathStep ? "bg-brand-600" : "bg-gray-200"}`}
                            />
                        )}
                    </div>
                ))}
            </div>

            {/* Step Content */}
            {currentPathStep === 1 && (
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Basic Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="pathName">Name</Label>
                            <Input
                                id="pathName"
                                value={pathFormData.name || ""}
                                onChange={e =>
                                    setPathFormData({ ...pathFormData, name: e.target.value })
                                }
                                placeholder="Enter training path name"
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="category">Category</Label>
                            <CascaderDropdown
                                options={categoryOptions}
                                value={
                                    pathFormData.category?.[pathFormData.category.length - 1] || ""
                                }
                                setDynamicOptions={handleCategorySelect}
                            />
                            <p className={`text-xs mt-1`}>Select category from the list</p>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Audience Target</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    className="w-full justify-between min-h-10 h-auto"
                                >
                                    <div className="flex flex-wrap gap-1">
                                        {pathFormData.audienceTarget?.length
                                            ? pathFormData.audienceTarget.map(targetValue => {
                                                const target = targetAudienceOptions.find(
                                                    opt => opt.value === targetValue,
                                                );
                                                return (
                                                    <Badge
                                                        key={targetValue}
                                                        variant="secondary"
                                                        className="font-normal flex items-center gap-1"
                                                    >
                                                        {target?.label || targetValue}
                                                        <div
                                                            role="button"
                                                            tabIndex={0}
                                                            aria-label={`Remove ${target?.label}`}
                                                            onClick={e => {
                                                                e.stopPropagation();
                                                                handleRemoveTarget(targetValue);
                                                            }}
                                                            onKeyDown={e => {
                                                                if (
                                                                    e.key === "Enter" ||
                                                                      e.key === " "
                                                                ) {
                                                                    e.preventDefault();
                                                                    handleRemoveTarget(
                                                                        targetValue,
                                                                    );
                                                                }
                                                            }}
                                                            className="rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 p-0.5 focus:outline-none focus:ring-1 focus:ring-gray-400"
                                                        >
                                                            <X className="h-3 w-3" />
                                                        </div>
                                                    </Badge>
                                                );
                                            })
                                            : "Select..."}
                                    </div>
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                <Command>
                                    <CommandInput placeholder="Search..." />
                                    <CommandList>
                                        <CommandEmpty>No found.</CommandEmpty>
                                        <CommandGroup>
                                            {targetAudienceOptions?.map(item => {
                                                const isSelected =
                                                    pathFormData.audienceTarget?.includes(
                                                        item.value,
                                                    );
                                                return (
                                                    <CommandItem
                                                        key={item.value}
                                                        onSelect={() => {
                                                            if (isSelected) {
                                                                handleRemoveTarget(item.value);
                                                            } else {
                                                                const selectedTargets =
                                                                    pathFormData.audienceTarget ||
                                                                    [];
                                                                setPathFormData({
                                                                    ...pathFormData,
                                                                    audienceTarget: [
                                                                        ...selectedTargets,
                                                                        item.value,
                                                                    ],
                                                                });
                                                            }
                                                        }}
                                                    >
                                                        <Check
                                                            className={cn(
                                                                "mr-2 h-4 w-4",
                                                                isSelected
                                                                    ? "opacity-100"
                                                                    : "opacity-0",
                                                            )}
                                                        />
                                                        {item.label}
                                                    </CommandItem>
                                                );
                                            })}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                    </div>
                    <AudienceTarget formData={pathFormData} setFormData={setPathFormData} />

                    <div>
                        <Label htmlFor="pathDescription">Description</Label>
                        <Textarea
                            id="pathDescription"
                            value={pathFormData.description || ""}
                            onChange={e =>
                                setPathFormData({ ...pathFormData, description: e.target.value })
                            }
                            placeholder="Enter training path description"
                            rows={3}
                        />
                    </div>
                </div>
            )}

            {currentPathStep === 2 && (
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Training Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="pathMaterials">Associated Training Materials</Label>
                            <Select
                                value={pathFormData.trainingMaterials?.[0] || ""}
                                onValueChange={value =>
                                    setPathFormData({ ...pathFormData, trainingMaterials: [value] })
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select material" />
                                </SelectTrigger>
                                <SelectContent>
                                    {trainingMaterials.map(material => (
                                        <SelectItem key={material.id} value={material.id}>
                                            {material.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label htmlFor="pathDuration">Estimated Duration (weeks)</Label>
                            <Input
                                id="pathDuration"
                                type="number"
                                value={pathFormData.estimatedDuration || ""}
                                onChange={e =>
                                    setPathFormData({
                                        ...pathFormData,
                                        estimatedDuration: Number.parseInt(e.target.value),
                                    })
                                }
                                placeholder="Enter duration in weeks"
                            />
                        </div>
                        <div>
                            <Label htmlFor="pathStartDate">Start Date</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className={`w-full justify-start text-left font-normal`}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {pathFormData.dateRange?.[0]
                                            ? dayjs(pathFormData.dateRange?.[0]).format(dateFormat)
                                            : "Select date"}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <Calendar
                                        mode="single"
                                        selected={
                                            pathFormData.dateRange?.[0]
                                                ? new Date(pathFormData.dateRange?.[0])
                                                : undefined
                                        }
                                        onSelect={date =>
                                            setPathFormData({
                                                ...pathFormData,
                                                dateRange: [
                                                    date?.toISOString() || "",
                                                    pathFormData.dateRange?.[1] || "",
                                                ],
                                            })
                                        }
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                        <div>
                            <Label htmlFor="pathEndDate">End Date</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className={`w-full justify-start text-left font-normal`}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {pathFormData.dateRange?.[1]
                                            ? dayjs(pathFormData.dateRange?.[1]).format(dateFormat)
                                            : "Select date"}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <Calendar
                                        mode="single"
                                        selected={
                                            pathFormData.dateRange?.[1]
                                                ? new Date(pathFormData.dateRange?.[1])
                                                : undefined
                                        }
                                        onSelect={date =>
                                            setPathFormData({
                                                ...pathFormData,
                                                dateRange: [
                                                    pathFormData.dateRange?.[0] || "",
                                                    date?.toISOString() || "",
                                                ],
                                            })
                                        }
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="pathCompetencies">Competencies</Label>
                            <Select
                                value={pathFormData.competencies?.[0] || ""}
                                onValueChange={value =>
                                    setPathFormData({ ...pathFormData, competencies: [value] })
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select competency" />
                                </SelectTrigger>
                                <SelectContent>
                                    {competencies.map(competency => (
                                        <SelectItem key={competency.id} value={competency.id}>
                                            {competency.competenceName}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div>
                        <Label htmlFor="pathOutcome">Outcome</Label>
                        <Textarea
                            id="pathOutcome"
                            value={pathFormData.outcome || ""}
                            onChange={e =>
                                setPathFormData({ ...pathFormData, outcome: e.target.value })
                            }
                            placeholder="Enter expected outcome"
                            rows={2}
                        />
                    </div>
                    <div>
                        <Label htmlFor="pathJustification">Justification</Label>
                        <Textarea
                            id="pathJustification"
                            value={pathFormData.justification || ""}
                            onChange={e =>
                                setPathFormData({ ...pathFormData, justification: e.target.value })
                            }
                            placeholder="Enter justification for this training path"
                            rows={2}
                        />
                    </div>
                </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-4">
                <Button
                    type="button"
                    variant="outline"
                    onClick={handlePrevious}
                    disabled={currentPathStep === 1}
                >
                    Previous
                </Button>
                <div className="flex space-x-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                            setIsModalOpen(false);
                            resetPathForm();
                        }}
                    >
                        Cancel
                    </Button>
                    {currentPathStep === 1 ? (
                        <Button onClick={handleNext} className="flex items-center">
                            Next
                            <ChevronRight className="h-4 w-4 ml-2" />
                        </Button>
                    ) : (
                        <Button onClick={onSubmit} disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="h-4 w-4 mr-2" />}
                            {isSubmitting
                                ? "Submitting..."
                                : isEdit
                                    ? "Update Training Path"
                                    : "Create Training Path"}
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
