"use client";
import React from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
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
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useFirestore } from "@/context/firestore-context";

import CascaderDropdown from "@/components/custom-cascader";
import { LocationModel } from "@/lib/backend/firebase/hrSettingsService";
import { QuizModel } from "@/lib/models/quiz.ts";

interface AudienceTargetProps {
    formData: Partial<QuizModel>;
    setFormData: (data: Partial<QuizModel>) => void;
}

interface LocationNode extends LocationModel {
    children: LocationNode[];
}

export function AudienceTarget({ formData, setFormData }: AudienceTargetProps) {
    const { activeEmployees, hrSettings } = useFirestore();
    const sections = hrSettings?.sectionSettings || [];
    const departments = hrSettings?.departmentSettings || [];
    const locations = hrSettings?.locations || [];
    const grades = hrSettings?.grades || [];

    const activeLocations = React.useMemo(
        () => locations.filter(l => l.active === "Yes"),
        [locations],
    );
    const locationNameMap = React.useMemo(
        () => new Map(locations.map(l => [l.id, l.name])),
        [locations],
    );

    const locationOptions = React.useMemo(() => {
        const buildLocationTree = (parentId: string | null = null): LocationNode[] => {
            return activeLocations
                .filter(location => location.parentId === parentId)
                .map(location => ({
                    ...location,
                    children: buildLocationTree(location.id),
                }));
        };

        const convertToOptions = (
            nodes: LocationNode[],
        ): { value: string; label: string; children?: any[] }[] => {
            return nodes.map(node => ({
                value: node.id,
                label: node.name,
                children:
                    node.children && node.children.length > 0
                        ? convertToOptions(node.children)
                        : undefined,
            }));
        };

        return convertToOptions(buildLocationTree());
    }, [activeLocations]);

    const handleLocationSelect = (locationId: string) => {
        const currentLocations = formData.locations || [];

        if (!currentLocations.includes(locationId)) {
            setFormData({
                ...formData,
                locations: [...currentLocations, locationId],
            });
        }
    };

    const handleLocationRemove = (locationId: string) => {
        const updatedLocations = formData.locations?.filter(id => id !== locationId);
        setFormData({
            ...formData,
            locations: updatedLocations,
        });
    };

    const renderSelector = (
        items: any[],
        title: string,
        selectedIds: string[] | undefined,
        onSelect: (id: string) => void,
        displayField: string,
        isEmployeeField = false,
    ) => {
        return (
            <div className="space-y-2">
                <Label>{title}</Label>
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            role="combobox"
                            className="w-full justify-between"
                        >
                            {selectedIds?.length
                                ? `${selectedIds.length} selected`
                                : `Select ${title.toLowerCase()}...`}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                        <Command>
                            <CommandInput placeholder={`Search ${title.toLowerCase()}...`} />
                            <CommandList>
                                <CommandEmpty>No {title.toLowerCase()} found.</CommandEmpty>
                                <CommandGroup>
                                    {items?.map(item => {
                                        const isSelected = selectedIds?.includes(
                                            isEmployeeField ? item.uid : item.id,
                                        );
                                        return (
                                            <CommandItem
                                                key={item.id}
                                                onSelect={() =>
                                                    onSelect(isEmployeeField ? item.uid : item.id)
                                                }
                                            >
                                                <Check
                                                    className={cn(
                                                        "mr-2 h-4 w-4",
                                                        isSelected ? "opacity-100" : "opacity-0",
                                                    )}
                                                />
                                                {item[displayField]}
                                            </CommandItem>
                                        );
                                    })}
                                </CommandGroup>
                            </CommandList>
                        </Command>
                    </PopoverContent>
                </Popover>
                <div className="pt-1 flex flex-wrap gap-1">
                    {selectedIds?.map(id => {
                        const item = items.find(i => (isEmployeeField ? i.uid : i.id) === id);
                        return (
                            <Badge variant="secondary" key={id} className="font-normal">
                                {item ? item[displayField] : id}
                            </Badge>
                        );
                    })}
                </div>
            </div>
        );
    };

    const handleSelect = (field: keyof QuizModel, id: string) => {
        const selectedIds = (formData[field] as string[]) || [];

        // If the field is 'employees', we need to find the employee by id and use their uid
        if (field === "employees") {
            const employee = activeEmployees.find(emp => emp.uid === id);
            if (!employee) return;

            const employeeUid = employee.uid || id; // Fallback to id if uid is not available

            if (selectedIds.includes(employeeUid)) {
                setFormData({
                    ...formData,
                    [field]: selectedIds.filter(selectedId => selectedId !== employeeUid),
                });
            } else {
                setFormData({
                    ...formData,
                    [field]: [...selectedIds, employeeUid],
                });
            }
        } else {
            // Original logic for other fields
            if (selectedIds.includes(id)) {
                setFormData({
                    ...formData,
                    [field]: selectedIds.filter(selectedId => selectedId !== id),
                });
            } else {
                setFormData({
                    ...formData,
                    [field]: [...selectedIds, id],
                });
            }
        }
    };

    return (
        <div className="space-y-4">
            {formData.audienceTarget?.includes("employees") &&
                renderSelector(
                    activeEmployees,
                    "Employees",
                    formData.employees,
                    uid => handleSelect("employees", uid),
                    "firstName",
                    true,
                )}
            {formData.audienceTarget?.includes("department") &&
                renderSelector(
                    departments,
                    "Departments",
                    formData.departments,
                    id => handleSelect("departments", id),
                    "name",
                )}
            {formData.audienceTarget?.includes("section") &&
                renderSelector(
                    sections,
                    "Sections",
                    formData.sections,
                    id => handleSelect("sections", id),
                    "name",
                )}

            {formData.audienceTarget?.includes("location") && (
                <div className="space-y-2">
                    <Label>Locations</Label>
                    <div className="relative">
                        <CascaderDropdown
                            options={locationOptions}
                            setDynamicOptions={handleLocationSelect}
                            value=""
                        />
                    </div>
                    <div className="pt-1 flex flex-wrap gap-1">
                        {formData.locations?.map(id => (
                            <Badge
                                variant="secondary"
                                key={id}
                                className="font-normal flex items-center gap-1"
                            >
                                {locationNameMap.get(id) || id}
                                <button
                                    type="button"
                                    aria-label={`Remove ${locationNameMap.get(id)}`}
                                    onClick={() => handleLocationRemove(id)}
                                    className="rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 p-0.5"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </Badge>
                        ))}
                    </div>
                </div>
            )}

            {formData.audienceTarget?.includes("grade") &&
                renderSelector(
                    grades,
                    "Grades",
                    formData.grades,
                    id => handleSelect("grades", id),
                    "name",
                )}
        </div>
    );
}
