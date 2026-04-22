"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronDown, Check } from "lucide-react";

export interface SearchableSelectItem {
    id: string;
    label: string;
    [key: string]: string | number | boolean | null | undefined;
}

interface SearchableSelectProps {
    items: SearchableSelectItem[];
    selectedId?: string;
    onChange: (id: string) => void;
    placeholder?: string;
    searchPlaceholder?: string;
    disabled?: boolean;
    className?: string;
}

export function SearchableSelect({
    items,
    selectedId,
    onChange,
    placeholder = "Select item...",
    searchPlaceholder = "Search...",
    disabled = false,
    className = "",
}: SearchableSelectProps) {
    const [isOpen, setIsOpen] = useState<boolean>(false);
    const [searchQuery, setSearchQuery] = useState<string>("");
    const containerRef = useRef<HTMLDivElement>(null);

    const filteredItems = items.filter(item =>
        item.label.toLowerCase().includes(searchQuery.toLowerCase()),
    );

    const selectedItem = items.find(item => item.id === selectedId);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSelect = (id: string) => {
        onChange(id);
        setIsOpen(false);
    };

    return (
        <div ref={containerRef} className={`relative ${className}`}>
            <Button
                variant="outline"
                role="combobox"
                aria-expanded={isOpen}
                className="w-full justify-between border-gray-400 dark:border-gray-500 bg-transparent"
                disabled={disabled}
                onClick={() => !disabled && setIsOpen(!isOpen)}
            >
                <span className="flex items-center gap-2">
                    {selectedItem ? (
                        <span className="font-medium">{selectedItem.label}</span>
                    ) : (
                        <span className="text-gray-500">{placeholder}</span>
                    )}
                </span>
                <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>

            {isOpen && (
                <div className="absolute z-50 w-full mt-1 border rounded-md bg-background shadow-lg">
                    <div className="p-2 border-b">
                        <Input
                            placeholder={searchPlaceholder}
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="h-8"
                            onClick={e => e.stopPropagation()}
                        />
                    </div>
                    <div className="max-h-60 overflow-y-auto p-1">
                        {filteredItems.length === 0 ? (
                            <div className="p-2 text-sm text-muted-foreground text-center">
                                No items found
                            </div>
                        ) : (
                            filteredItems.map(item => {
                                const isSelected = selectedId === item.id;
                                return (
                                    <div
                                        key={item.id}
                                        className={`px-2 py-1.5 cursor-pointer flex items-center gap-2 rounded-sm hover:bg-accent ${
                                            isSelected ? "bg-accent" : ""
                                        }`}
                                        onClick={() => handleSelect(item.id)}
                                    >
                                        <Check
                                            className={`h-4 w-4 ${
                                                isSelected ? "opacity-100" : "opacity-0"
                                            }`}
                                        />
                                        <span className="text-sm">{item.label}</span>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
