"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { EvaluationCycleOption, PeriodOption } from "@/lib/models/promotion-instance";
import { ChevronDown, X } from "lucide-react";
import { useState } from "react";

type MultiSelectOption = PeriodOption | EvaluationCycleOption;

interface MultiSelectDropdownProps {
    options: MultiSelectOption[];
    selected: string[];
    onSelectionChange: (selected: string[]) => void;
    placeholder: string;
    disabled?: boolean;
}

export function MultiSelectDropdown({
    options,
    selected,
    onSelectionChange,
    placeholder,
    disabled = false,
}: MultiSelectDropdownProps) {
    const [open, setOpen] = useState(false);

    const toggleOption = (id: string) => {
        if (selected.includes(id)) {
            onSelectionChange(selected.filter(s => s !== id));
        } else {
            onSelectionChange([...selected, id]);
        }
    };

    const selectedLabels = options.filter(o => selected.includes(o.id)).map(o => o.label);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between h-auto min-h-10 text-left font-normal disabled:opacity-50"
                    disabled={disabled}
                >
                    <div className="flex flex-wrap gap-1">
                        {selectedLabels.length > 0 ? (
                            selectedLabels.map(label => (
                                <Badge key={label} variant="secondary" className="mr-1 mb-1">
                                    {label}
                                    <button
                                        className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                                        onKeyDown={e => {
                                            if (e.key === "Enter") {
                                                const opt = options.find(o => o.label === label);
                                                if (opt) toggleOption(opt.id);
                                            }
                                        }}
                                        onMouseDown={e => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                        }}
                                        onClick={e => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            const opt = options.find(o => o.label === label);
                                            if (opt) toggleOption(opt.id);
                                        }}
                                    >
                                        <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                                    </button>
                                </Badge>
                            ))
                        ) : (
                            <span className="text-muted-foreground">{placeholder}</span>
                        )}
                    </div>
                    <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0" align="start">
                <ScrollArea className="h-[200px]">
                    <div className="p-2">
                        {options.map(option => (
                            <div
                                key={option.id}
                                className="flex items-center space-x-2 p-2 hover:bg-accent rounded-md cursor-pointer"
                                onClick={() => toggleOption(option.id)}
                            >
                                <Checkbox
                                    checked={selected.includes(option.id)}
                                    onCheckedChange={() => toggleOption(option.id)}
                                />
                                <span className="text-sm">{option.label}</span>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </PopoverContent>
        </Popover>
    );
}
