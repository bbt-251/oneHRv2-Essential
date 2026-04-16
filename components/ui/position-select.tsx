"use client";

import { useFirestore } from "@/context/firestore-context";
import { useState, useEffect } from "react";
import { Check, ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface PositionSelectProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
    className?: string;
}

export function PositionSelect({
    value,
    onChange,
    placeholder = "Select position",
    disabled = false,
    className,
}: PositionSelectProps) {
    const { hrSettings } = useFirestore();
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    const positions = hrSettings.positions || [];
    const filteredPositions = positions.filter(pos =>
        pos.name?.toLowerCase().includes(searchTerm.toLowerCase()),
    );

    const selectedPosition = positions.find(p => p.id === value);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (!target.closest(".position-select-container")) {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className={cn("relative", className)}>
            <button
                type="button"
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
                className={cn(
                    "w-full flex items-center justify-between px-3 py-2 text-sm border rounded-md",
                    "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600",
                    "hover:border-gray-400 dark:hover:border-gray-500",
                    "focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent",
                    disabled && "opacity-50 cursor-not-allowed bg-gray-100 dark:bg-gray-900",
                )}
            >
                <span
                    className={
                        selectedPosition ? "text-gray-900 dark:text-gray-100" : "text-gray-500"
                    }
                >
                    {selectedPosition?.name || placeholder}
                </span>
                <ChevronDown
                    className={cn(
                        "w-4 h-4 text-gray-400 transition-transform",
                        isOpen && "rotate-180",
                    )}
                />
            </button>

            {isOpen && (
                <div className="position-select-container absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg">
                    {/* Search Input */}
                    <div className="p-2 border-b border-gray-200 dark:border-gray-700">
                        <div className="relative">
                            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search positions..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                                autoFocus
                            />
                        </div>
                    </div>

                    {/* Options List */}
                    <div className="max-h-60 overflow-y-auto">
                        {filteredPositions.length > 0 ? (
                            filteredPositions.map(position => (
                                <button
                                    key={position.id}
                                    type="button"
                                    onClick={() => {
                                        onChange(position.id);
                                        setIsOpen(false);
                                        setSearchTerm("");
                                    }}
                                    className={cn(
                                        "w-full flex items-center justify-between px-3 py-2 text-sm text-left",
                                        "hover:bg-gray-100 dark:hover:bg-gray-700",
                                        value === position.id &&
                                            "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400",
                                    )}
                                >
                                    <span className="truncate">{position.name}</span>
                                    {value === position.id && (
                                        <Check className="w-4 h-4 text-amber-600" />
                                    )}
                                </button>
                            ))
                        ) : (
                            <div className="px-3 py-4 text-sm text-gray-500 text-center">
                                No positions found
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
