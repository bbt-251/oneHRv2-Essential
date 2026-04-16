"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Columns, Search } from "lucide-react";
import type { ColumnConfig } from "@/lib/models/type";
import { useTheme } from "@/components/theme-provider";
import { Input } from "@/components/ui/input";

interface ColumnSelectorProps {
    columns: ColumnConfig[];
    onColumnToggle: (key: string, visible: boolean) => void;
}

export function ColumnSelector({ columns, onColumnToggle }: ColumnSelectorProps) {
    const { theme } = useTheme();
    const [open, setOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    // Define base classes for reuse
    const buttonClasses =
        theme === "dark"
            ? "bg-black border-gray-600 hover:bg-black text-gray-200"
            : "bg-white border-gray-300 hover:bg-gray-200 text-primary-700";

    const popoverContentClasses =
        theme === "dark"
            ? "bg-black border-gray-700 text-white"
            : "bg-white border-gray-200 text-gray-900";

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className={buttonClasses}>
                    <Columns className="w-4 h-4 mr-2" />
                    Columns
                </Button>
            </PopoverTrigger>
            <PopoverContent className={`w-80 p-4 ${popoverContentClasses}`} align="start">
                <div className="space-y-4">
                    <h4
                        className={`font-medium ${theme === "dark" ? "text-gray-100" : "text-primary-900"}`}
                    >
                        Show/Hide Columns
                    </h4>
                    <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Search columns..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className={`pl-8 h-8 text-sm ${theme === "dark" ? "bg-gray-800 border-gray-600 focus:border-blue-500 focus:ring-blue-500" : "border-gray-300 focus:border-primary-500 focus:ring-primary-500"}`}
                        />
                    </div>
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                        {columns
                            .filter(column =>
                                column.label.toLowerCase().includes(searchTerm.toLowerCase()),
                            )
                            .map(column => (
                                <div key={column.key} className="flex items-center space-x-2">
                                    <Checkbox
                                        id={column.key}
                                        checked={column.visible}
                                        onCheckedChange={checked =>
                                            onColumnToggle(column.key, checked as boolean)
                                        }
                                        className={
                                            theme === "dark"
                                                ? "border-gray-600 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                                                : ""
                                        }
                                    />
                                    <label
                                        htmlFor={column.key}
                                        className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${theme === "dark" ? "text-gray-300" : "text-gray-800"}`}
                                    >
                                        {column.label}
                                    </label>
                                </div>
                            ))}
                    </div>
                    <div
                        className={`flex justify-between pt-2 ${theme === "dark" ? "border-t-gray-700" : "border-t"}`}
                    >
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => columns.forEach(col => onColumnToggle(col.key, true))}
                            className={buttonClasses}
                        >
                            Show All
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => columns.forEach(col => onColumnToggle(col.key, false))}
                            className={buttonClasses}
                        >
                            Hide All
                        </Button>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}
