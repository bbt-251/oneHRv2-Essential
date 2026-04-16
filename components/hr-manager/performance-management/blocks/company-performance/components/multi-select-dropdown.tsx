"use client";

import { useState, useRef, useEffect } from "react";
import { Check, ChevronDown, X, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Option {
    value: string;
    label: string;
}

interface MultiSelectDropdownProps {
    options: Option[];
    selected: string[];
    onChange: (selected: string[]) => void;
    placeholder?: string;
    label?: string;
}

export function MultiSelectDropdown({
    options,
    selected,
    onChange,
    placeholder = "Select options",
    label,
}: MultiSelectDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const filteredOptions = options.filter(option =>
        option.label.toLowerCase().includes(searchTerm.toLowerCase()),
    );

    const toggleOption = (value: string) => {
        if (selected.includes(value)) {
            onChange(selected.filter(v => v !== value));
        } else {
            onChange([...selected, value]);
        }
    };

    const removeOption = (value: string, e: React.MouseEvent) => {
        e.stopPropagation();
        onChange(selected.filter(v => v !== value));
    };

    const clearAll = (e: React.MouseEvent) => {
        e.stopPropagation();
        onChange([]);
    };

    const selectedLabels = options
        .filter(opt => selected.includes(opt.value))
        .map(opt => opt.label);

    return (
        <div className="space-y-2" ref={dropdownRef}>
            {label && <label className="text-sm font-medium">{label}</label>}
            <div className="relative w-full">
                <div
                    className={cn(
                        "w-full min-h-[38px] px-3 py-2 border rounded-md cursor-pointer flex items-center justify-between gap-2",
                        "bg-background border-input text-foreground",
                        "hover:border-ring focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
                    )}
                    onClick={() => setIsOpen(!isOpen)}
                >
                    <div className="flex flex-wrap gap-1 flex-1 overflow-hidden">
                        {selected.length === 0 ? (
                            <span className="text-muted-foreground text-sm">{placeholder}</span>
                        ) : selected.length <= 2 ? (
                            selectedLabels.map((label, i) => (
                                <Badge key={i} variant="secondary" className="text-xs gap-1 pr-1">
                                    {label}
                                    <X
                                        className="h-3 w-3 cursor-pointer hover:text-destructive"
                                        onClick={e => removeOption(selected[i], e)}
                                    />
                                </Badge>
                            ))
                        ) : (
                            <span className="text-sm">{selected.length} selected</span>
                        )}
                    </div>
                    <div className="flex items-center gap-1">
                        {selected.length > 0 && (
                            <X
                                className="h-4 w-4 text-muted-foreground hover:text-foreground"
                                onClick={clearAll}
                            />
                        )}
                        <ChevronDown
                            className={cn(
                                "h-4 w-4 text-muted-foreground transition-transform",
                                isOpen && "rotate-180",
                            )}
                        />
                    </div>
                </div>

                {isOpen && (
                    <div
                        className={cn(
                            "absolute z-50 w-full mt-1 border rounded-md shadow-lg max-h-60 overflow-hidden",
                            "bg-popover border-input",
                        )}
                    >
                        {/* Search input */}
                        <div className="p-2 border-b border-border">
                            <div className="relative">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <input
                                    type="text"
                                    placeholder="Search..."
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    className={cn(
                                        "w-full pl-8 pr-3 py-1.5 text-sm border rounded-md",
                                        "bg-background border-input text-foreground",
                                        "placeholder:text-muted-foreground",
                                        "focus:outline-none focus:ring-2 focus:ring-ring",
                                    )}
                                    onClick={e => e.stopPropagation()}
                                />
                            </div>
                        </div>

                        {/* Options list */}
                        <div className="overflow-y-auto max-h-48">
                            {filteredOptions.length === 0 ? (
                                <div className="px-3 py-2 text-sm text-muted-foreground">
                                    No options found
                                </div>
                            ) : (
                                filteredOptions.map(option => (
                                    <div
                                        key={option.value}
                                        className={cn(
                                            "px-3 py-2 cursor-pointer flex items-center gap-2",
                                            "hover:bg-accent hover:text-accent-foreground",
                                        )}
                                        onClick={() => toggleOption(option.value)}
                                    >
                                        <div
                                            className={cn(
                                                "w-4 h-4 border rounded flex items-center justify-center",
                                                selected.includes(option.value)
                                                    ? "bg-primary border-primary text-primary-foreground"
                                                    : "border-input",
                                            )}
                                        >
                                            {selected.includes(option.value) && (
                                                <Check className="h-3 w-3" />
                                            )}
                                        </div>
                                        <span className="text-sm truncate">{option.label}</span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
