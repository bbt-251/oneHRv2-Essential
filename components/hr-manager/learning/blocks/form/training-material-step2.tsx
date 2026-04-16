"use client";
import type React from "react";
import { Check, ChevronsUpDown, CalendarIcon, X } from "lucide-react";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { TrainingMaterialRequestModel } from "@/lib/models/training-material";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import dayjs from "dayjs";
import { dateFormat } from "@/lib/util/dayjs_format";
import { Calendar } from "@/components/ui/calendar";
import { useFirestore } from "@/context/firestore-context";
import { AudienceTarget } from "../quiz-management/blocks/audience-target";

interface TrainingMaterialStep2Props {
    formData: Partial<TrainingMaterialRequestModel>;
    setFormData: (formData: Partial<TrainingMaterialRequestModel>) => void;
    employees: any[];
    competencies: any[];
}

export function TrainingMaterialStep2({
    formData,
    setFormData,
    employees,
    competencies,
}: TrainingMaterialStep2Props) {
    const { quizzes } = useFirestore();

    const handleRemoveTarget = (targetToRemove: string) => {
        const targetDataMap: { [key: string]: keyof TrainingMaterialRequestModel } = {
            employees: "employees",
            department: "departments",
            section: "sections",
            location: "locations",
            grade: "grades",
        };

        const updatedFormData = { ...formData };

        updatedFormData.audienceTarget = updatedFormData.audienceTarget?.filter(
            t => t !== targetToRemove,
        );

        const dataKey = targetDataMap[targetToRemove];
        if (dataKey && updatedFormData[dataKey]) {
            updatedFormData[dataKey] = [] as any;
        }

        setFormData(updatedFormData);
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="startDate">Start Date</Label>

                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                className={`w-full justify-start text-left font-normal`}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {formData.startDate
                                    ? dayjs(formData.startDate).format(dateFormat)
                                    : "Select date"}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                            <Calendar
                                mode="single"
                                selected={
                                    formData.startDate ? new Date(formData.startDate) : undefined
                                }
                                onSelect={date =>
                                    setFormData({ ...formData, startDate: date?.toISOString() })
                                }
                                initialFocus
                            />
                        </PopoverContent>
                    </Popover>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="endDate">End Date</Label>

                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                className={`w-full justify-start text-left font-normal`}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {formData.endDate
                                    ? dayjs(formData.endDate).format(dateFormat)
                                    : "Select date"}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                            <Calendar
                                mode="single"
                                selected={formData.endDate ? new Date(formData.endDate) : undefined}
                                onSelect={date =>
                                    setFormData({ ...formData, endDate: date?.toISOString() })
                                }
                                initialFocus
                            />
                        </PopoverContent>
                    </Popover>
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
                                {formData.audienceTarget?.length
                                    ? formData.audienceTarget.map(targetValue => {
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
                                                        if (e.key === "Enter" || e.key === " ") {
                                                            e.preventDefault();
                                                            handleRemoveTarget(targetValue);
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
                                        const isSelected = formData.audienceTarget?.includes(
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
                                                            formData.audienceTarget || [];
                                                        setFormData({
                                                            ...formData,
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
                                                        isSelected ? "opacity-100" : "opacity-0",
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
            <AudienceTarget formData={formData} setFormData={setFormData} />

            <div className="space-y-2">
                <Label htmlFor="associatedQuiz">Associated Quiz</Label>
                <Select
                    value={formData.associatedQuiz?.[0] || ""}
                    onValueChange={value => setFormData({ ...formData, associatedQuiz: [value] })}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Select associated quiz" />
                    </SelectTrigger>
                    <SelectContent>
                        {quizzes?.map(quiz => (
                            <SelectItem key={quiz.id} value={quiz.id}>
                                {quiz.quizTitle}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-2">
                <Label htmlFor="requirementLevel">Requirement Level</Label>
                <Select
                    value={formData.requirementLevel || "Optional"}
                    onValueChange={(value: "Mandatory" | "Optional") =>
                        setFormData({ ...formData, requirementLevel: value })
                    }
                >
                    <SelectTrigger>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Mandatory">Mandatory</SelectItem>
                        <SelectItem value="Optional">Optional</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-2">
                <Label>Targeted Competencies</Label>
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            role="combobox"
                            className="w-full justify-between min-h-10 h-auto"
                        >
                            <div className="flex flex-wrap gap-1">
                                {formData.targetedCompetencies?.length
                                    ? formData.targetedCompetencies.map(competencyId => {
                                        const competency = competencies.find(
                                            c => c.id === competencyId,
                                        );
                                        return (
                                            <Badge
                                                key={competencyId}
                                                variant="secondary"
                                                className="font-normal flex items-center gap-1"
                                            >
                                                {competency?.competenceName || competencyId}
                                                <div
                                                    role="button"
                                                    tabIndex={0}
                                                    aria-label={`Remove ${competency?.competenceName}`}
                                                    onClick={e => {
                                                        e.stopPropagation();
                                                        const updatedCompetencies =
                                                              formData.targetedCompetencies?.filter(
                                                                  id => id !== competencyId,
                                                              ) || [];
                                                        setFormData({
                                                            ...formData,
                                                            targetedCompetencies:
                                                                  updatedCompetencies,
                                                        });
                                                    }}
                                                    onKeyDown={e => {
                                                        if (e.key === "Enter" || e.key === " ") {
                                                            e.preventDefault();
                                                            const updatedCompetencies =
                                                                  formData.targetedCompetencies?.filter(
                                                                      id => id !== competencyId,
                                                                  ) || [];
                                                            setFormData({
                                                                ...formData,
                                                                targetedCompetencies:
                                                                      updatedCompetencies,
                                                            });
                                                        }
                                                    }}
                                                    className="rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 p-0.5 focus:outline-none focus:ring-1 focus:ring-gray-400"
                                                >
                                                    <X className="h-3 w-3" />
                                                </div>
                                            </Badge>
                                        );
                                    })
                                    : "Select competencies..."}
                            </div>
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                        <Command>
                            <CommandInput placeholder="Search competencies..." />
                            <CommandList>
                                <CommandEmpty>No competencies found.</CommandEmpty>
                                <CommandGroup>
                                    {competencies?.map(competency => {
                                        const isSelected = formData.targetedCompetencies?.includes(
                                            competency.id,
                                        );
                                        return (
                                            <CommandItem
                                                key={competency.id}
                                                onSelect={() => {
                                                    const selectedCompetencies =
                                                        formData.targetedCompetencies || [];
                                                    if (isSelected) {
                                                        setFormData({
                                                            ...formData,
                                                            targetedCompetencies:
                                                                selectedCompetencies.filter(
                                                                    id => id !== competency.id,
                                                                ),
                                                        });
                                                    } else {
                                                        setFormData({
                                                            ...formData,
                                                            targetedCompetencies: [
                                                                ...selectedCompetencies,
                                                                competency.id,
                                                            ],
                                                        });
                                                    }
                                                }}
                                            >
                                                <Check
                                                    className={cn(
                                                        "mr-2 h-4 w-4",
                                                        isSelected ? "opacity-100" : "opacity-0",
                                                    )}
                                                />
                                                {competency.competenceName}
                                            </CommandItem>
                                        );
                                    })}
                                </CommandGroup>
                            </CommandList>
                        </Command>
                    </PopoverContent>
                </Popover>
            </div>

            <div className="space-y-2">
                <Label htmlFor="certificationTitle">Certification Title</Label>
                <Input
                    id="certificationTitle"
                    value={formData.certificationTitle || ""}
                    onChange={e => setFormData({ ...formData, certificationTitle: e.target.value })}
                    placeholder="Enter certification title"
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="availability">Availability (in days)</Label>
                <Input
                    id="availability"
                    type="number"
                    value={formData.availability || 0}
                    onChange={e =>
                        setFormData({
                            ...formData,
                            availability: Number.parseInt(e.target.value) || 0,
                        })
                    }
                    placeholder="Number of days available"
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="outputValue">Output Value</Label>
                <Textarea
                    id="outputValue"
                    value={formData.outputValue || ""}
                    onChange={e => setFormData({ ...formData, outputValue: e.target.value })}
                    placeholder="Describe the expected output/value"
                    rows={3}
                />
            </div>
        </div>
    );
}
