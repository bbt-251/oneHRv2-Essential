"use client";

import { useFirestore } from "@/context/firestore-context";
import { useState, useEffect } from "react";
import { Check, ChevronDown, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface TrainingSelectProps {
    value: string[];
    onChange: (value: string[]) => void;
    placeholder?: string;
    disabled?: boolean;
    className?: string;
    multiple?: boolean;
}

interface TrainingItem {
    id: string;
    name: string;
    type: "material" | "path";
}

export function TrainingSelect({
    value,
    onChange,
    placeholder = "Select training",
    disabled = false,
    className,
    multiple = false,
}: TrainingSelectProps) {
    const { trainingMaterials, trainingPaths } = useFirestore();
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    // Combine training materials and paths into a single list
    const allTraining: TrainingItem[] = [
        ...(trainingMaterials || []).map(m => ({
            id: m.id,
            name: m.name,
            type: "material" as const,
        })),
        ...(trainingPaths || []).map(p => ({ id: p.id, name: p.name, type: "path" as const })),
    ];

    const filteredTraining = allTraining.filter(item =>
        item.name?.toLowerCase().includes(searchTerm.toLowerCase()),
    );

    const selectedItems = allTraining.filter(item => value.includes(item.id));

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (!target.closest(".training-select-container")) {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSelect = (trainingId: string) => {
        if (multiple) {
            if (value.includes(trainingId)) {
                onChange(value.filter(id => id !== trainingId));
            } else {
                onChange([...value, trainingId]);
            }
        } else {
            onChange([trainingId]);
            setIsOpen(false);
            setSearchTerm("");
        }
    };

    const handleRemove = (trainingId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        onChange(value.filter(id => id !== trainingId));
    };

    const getTrainingIcon = (type: "material" | "path") => {
        return type === "path" ? "📚" : "📄";
    };

    return (
        <div className={cn("relative", className)}>
            <button
                type="button"
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
                className={cn(
                    "w-full flex items-center justify-between px-3 py-2 text-sm border rounded-md min-h-[42px]",
                    "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600",
                    "hover:border-gray-400 dark:hover:border-gray-500",
                    "focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent",
                    disabled && "opacity-50 cursor-not-allowed bg-gray-100 dark:bg-gray-900",
                )}
            >
                <span
                    className={
                        value.length > 0 ? "text-gray-900 dark:text-gray-100" : "text-gray-500"
                    }
                >
                    {selectedItems.length > 0
                        ? multiple
                            ? `${selectedItems.length} selected`
                            : selectedItems[0]?.name
                        : placeholder}
                </span>
                <ChevronDown
                    className={cn(
                        "w-4 h-4 text-gray-400 transition-transform",
                        isOpen && "rotate-180",
                    )}
                />
            </button>

            {/* Selected items as tags */}
            {multiple && selectedItems.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                    {selectedItems.map(item => (
                        <span
                            key={item.id}
                            className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300 rounded"
                        >
                            {getTrainingIcon(item.type)} {item.name}
                            <button
                                type="button"
                                onClick={e => handleRemove(item.id, e)}
                                className="hover:text-green-600"
                                disabled={disabled}
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </span>
                    ))}
                </div>
            )}

            {isOpen && (
                <div className="training-select-container absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg">
                    {/* Search Input */}
                    <div className="p-2 border-b border-gray-200 dark:border-gray-700">
                        <div className="relative">
                            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search training..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                                autoFocus
                            />
                        </div>
                    </div>

                    {/* Options List */}
                    <div className="max-h-60 overflow-y-auto">
                        {filteredTraining.length > 0 ? (
                            filteredTraining.map(item => (
                                <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => handleSelect(item.id)}
                                    className={cn(
                                        "w-full flex items-center justify-between px-3 py-2 text-sm text-left",
                                        "hover:bg-gray-100 dark:hover:bg-gray-700",
                                        value.includes(item.id) &&
                                            "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400",
                                    )}
                                >
                                    <span className="truncate">
                                        {getTrainingIcon(item.type)} {item.name}
                                    </span>
                                    {value.includes(item.id) && (
                                        <Check className="w-4 h-4 text-green-600" />
                                    )}
                                </button>
                            ))
                        ) : (
                            <div className="px-3 py-4 text-sm text-gray-500 text-center">
                                No training found
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
