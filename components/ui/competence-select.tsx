"use client";

import { useFirestore } from "@/context/firestore-context";
import { useState, useEffect } from "react";
import { Check, ChevronDown, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface CompetenceSelectProps {
    value: string[];
    onChange: (value: string[]) => void;
    placeholder?: string;
    disabled?: boolean;
    className?: string;
    multiple?: boolean;
}

export function CompetenceSelect({
    value,
    onChange,
    placeholder = "Select competencies",
    disabled = false,
    className,
    multiple = false,
}: CompetenceSelectProps) {
    const { hrSettings } = useFirestore();
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    const competencies = hrSettings.competencies || [];
    const filteredCompetencies = competencies.filter(comp =>
        comp.competenceName?.toLowerCase().includes(searchTerm.toLowerCase()),
    );

    const selectedCompetencies = competencies.filter(c => value.includes(c.id));

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (!target.closest(".competence-select-container")) {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSelect = (competenceId: string) => {
        if (multiple) {
            if (value.includes(competenceId)) {
                onChange(value.filter(id => id !== competenceId));
            } else {
                onChange([...value, competenceId]);
            }
        } else {
            onChange([competenceId]);
            setIsOpen(false);
            setSearchTerm("");
        }
    };

    const handleRemove = (competenceId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        onChange(value.filter(id => id !== competenceId));
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
                    {selectedCompetencies.length > 0
                        ? multiple
                            ? `${selectedCompetencies.length} selected`
                            : selectedCompetencies[0]?.competenceName
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
            {multiple && selectedCompetencies.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                    {selectedCompetencies.map(comp => (
                        <span
                            key={comp.id}
                            className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 rounded"
                        >
                            {comp.competenceName}
                            <button
                                type="button"
                                onClick={e => handleRemove(comp.id, e)}
                                className="hover:text-amber-600"
                                disabled={disabled}
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </span>
                    ))}
                </div>
            )}

            {isOpen && (
                <div className="competence-select-container absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg">
                    {/* Search Input */}
                    <div className="p-2 border-b border-gray-200 dark:border-gray-700">
                        <div className="relative">
                            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search competencies..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                                autoFocus
                            />
                        </div>
                    </div>

                    {/* Options List */}
                    <div className="max-h-60 overflow-y-auto">
                        {filteredCompetencies.length > 0 ? (
                            filteredCompetencies.map(competence => (
                                <button
                                    key={competence.id}
                                    type="button"
                                    onClick={() => handleSelect(competence.id)}
                                    className={cn(
                                        "w-full flex items-center justify-between px-3 py-2 text-sm text-left",
                                        "hover:bg-gray-100 dark:hover:bg-gray-700",
                                        value.includes(competence.id) &&
                                            "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400",
                                    )}
                                >
                                    <span className="truncate">{competence.competenceName}</span>
                                    {value.includes(competence.id) && (
                                        <Check className="w-4 h-4 text-amber-600" />
                                    )}
                                </button>
                            ))
                        ) : (
                            <div className="px-3 py-4 text-sm text-gray-500 text-center">
                                No competencies found
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
