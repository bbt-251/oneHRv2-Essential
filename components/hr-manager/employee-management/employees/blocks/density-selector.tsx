"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { MoreHorizontal } from "lucide-react";
import { useTheme } from "@/components/theme-provider";

export type DensityType = "compact" | "standard" | "comfortable";

interface DensitySelectorProps {
    density: DensityType;
    onDensityChange: (density: DensityType) => void;
}

export function DensitySelector({ density, onDensityChange }: DensitySelectorProps) {
    const [open, setOpen] = useState<boolean>(false);
    const { theme } = useTheme();

    const densityOptions = [
        {
            value: "compact" as DensityType,
            label: "Compact",
            description: "Tight spacing, more rows visible",
        },
        { value: "standard" as DensityType, label: "Standard", description: "Default spacing" },
        {
            value: "comfortable" as DensityType,
            label: "Comfortable",
            description: "Loose spacing, easier to read",
        },
    ];

    // Define dynamic classes based on theme
    const triggerButtonClasses =
        theme === "dark"
            ? "bg-black border-gray-600 hover:bg-black text-gray-200"
            : "bg-white border-gray-200 text-primary-700 hover:bg-gray-50";

    const popoverContentClasses =
        theme === "dark"
            ? "bg-black border-gray-700 text-white"
            : "bg-white border-gray-200 text-gray-900";

    const getOptionClasses = (optionValue: DensityType) => {
        const isSelected = density === optionValue;
        if (theme === "dark") {
            return isSelected
                ? "border-blue-500 bg-blue-900/50 text-blue-200"
                : "border-gray-700 hover:bg-gray-800";
        }
        return isSelected
            ? "border-primary-600 bg-primary-50 text-primary-900"
            : "border-gray-200 hover:bg-gray-50";
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className={triggerButtonClasses}>
                    <MoreHorizontal className="w-4 h-4 mr-2" />
                    Density
                </Button>
            </PopoverTrigger>
            <PopoverContent className={`w-64 p-4 ${popoverContentClasses}`} align="start">
                <div className="space-y-4">
                    <h4
                        className={`font-medium ${theme === "dark" ? "text-gray-100" : "text-primary-900"}`}
                    >
                        Row Density
                    </h4>
                    <div className="space-y-2">
                        {densityOptions.map(option => (
                            <button
                                key={option.value}
                                onClick={() => {
                                    onDensityChange(option.value);
                                    setOpen(false);
                                }}
                                className={`w-full text-left p-3 rounded-lg border transition-colors ${getOptionClasses(option.value)}`}
                            >
                                <div className="font-medium text-sm">{option.label}</div>
                                <div
                                    className={`text-xs mt-1 ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}
                                >
                                    {option.description}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}
