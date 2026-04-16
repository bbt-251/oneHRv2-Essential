"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, X, Check } from "lucide-react";

export interface SearchableSelectItem {
    id: string;
    label: string;
    [key: string]: any;
}

interface SearchableMultiSelectProps {
    items: SearchableSelectItem[];
    selectedIds: string[];
    onChange: (ids: string[]) => void;
    placeholder?: string;
    searchPlaceholder?: string;
    disabled?: boolean;
    className?: string;
}

export function SearchableMultiSelect({
    items,
    selectedIds,
    onChange,
    placeholder = "Select items...",
    searchPlaceholder = "Search...",
    disabled = false,
    className = "",
}: SearchableMultiSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const containerRef = useRef<HTMLDivElement>(null);

    const filteredItems = items.filter(item =>
        item.label.toLowerCase().includes(searchQuery.toLowerCase()),
    );

    const selectedItems = items.filter(item => selectedIds.includes(item.id));

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
        if (selectedIds.includes(id)) {
            onChange(selectedIds.filter(selectedId => selectedId !== id));
        } else {
            onChange([...selectedIds, id]);
        }
    };

    const handleRemove = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        onChange(selectedIds.filter(selectedId => selectedId !== id));
    };

    return (
        <div ref={containerRef} className={`relative ${className}`}>
            <div
                className={`min-h-10 px-3 py-2 border rounded-md bg-background flex flex-wrap gap-1 items-center cursor-pointer ${
                    disabled ? "opacity-50 cursor-not-allowed" : ""
                }`}
                onClick={() => !disabled && setIsOpen(!isOpen)}
            >
                {selectedItems.length > 0 ? (
                    selectedItems.map(item => (
                        <Badge key={item.id} variant="secondary" className="gap-1 pr-1">
                            {item.label}
                            <X
                                className="h-3 w-3 cursor-pointer"
                                onClick={e => handleRemove(item.id, e)}
                            />
                        </Badge>
                    ))
                ) : (
                    <span className="text-muted-foreground">{placeholder}</span>
                )}
                <ChevronDown className="h-4 w-4 ml-auto text-muted-foreground" />
            </div>

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
                                const isSelected = selectedIds.includes(item.id);
                                return (
                                    <div
                                        key={item.id}
                                        className={`px-2 py-1.5 cursor-pointer flex items-center gap-2 rounded-sm hover:bg-accent ${
                                            isSelected ? "bg-accent" : ""
                                        }`}
                                        onClick={() => handleSelect(item.id)}
                                    >
                                        <div
                                            className={`w-4 h-4 border rounded flex items-center justify-center ${
                                                isSelected
                                                    ? "bg-primary border-primary text-primary-foreground"
                                                    : "border-input"
                                            }`}
                                        >
                                            {isSelected && <Check className="h-3 w-3" />}
                                        </div>
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
