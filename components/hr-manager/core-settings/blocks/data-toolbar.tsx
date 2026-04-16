"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { LayoutGrid, FilterIcon, ChevronDown, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/theme-provider";

export type Density = "compact" | "normal" | "comfortable";
export type ColumnConfig = { key: string; label: string; visible: boolean };

export interface DataToolbarProps {
    columns: ColumnConfig[];
    onToggleColumn: (key: string) => void;
    density: Density;
    onDensityChange: (d: Density) => void;
    onExport: () => void;
    filtersContent: React.ReactNode;
    filtersActiveCount?: number;
    className?: string;
}

export function DataToolbar({
    columns,
    onToggleColumn,
    density,
    onDensityChange,
    onExport,
    filtersContent,
    filtersActiveCount = 0,
    className,
}: DataToolbarProps) {
    const { theme } = useTheme();
    const shownCount = React.useMemo(() => columns.filter(c => c.visible).length, [columns]);

    return (
        <div
            className={cn(
                theme === "dark"
                    ? "bg-black border-gray-600"
                    : "bg-white border-y border-amber-300",
                "px-3 py-3",
                className,
            )}
        >
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-3">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                className={
                                    theme === "dark"
                                        ? "rounded-xl border border-gray-600 bg-black text-white hover:bg-gray-800"
                                        : "rounded-xl border border-amber-300 bg-white text-slate-900 hover:bg-amber-50"
                                }
                            >
                                <LayoutGrid className="h-4 w-4 mr-2" />
                                Columns
                                <ChevronDown className="h-3 w-3 ml-2 text-slate-500" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                            align="start"
                            className={cn(
                                theme === "dark"
                                    ? "bg-black border-gray-600"
                                    : "bg-white border-y border-amber-300",
                                "w-56",
                            )}
                        >
                            <DropdownMenuLabel>Visible Columns ({shownCount})</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {columns.map(col => (
                                <DropdownMenuCheckboxItem
                                    key={col.key}
                                    checked={col.visible}
                                    onCheckedChange={() => onToggleColumn(col.key)}
                                >
                                    {col.label}
                                </DropdownMenuCheckboxItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant="ghost"
                                className={
                                    theme === "dark"
                                        ? "rounded-xl border border-gray-600 bg-black text-white hover:bg-gray-800 relative"
                                        : "rounded-xl border border-amber-300 bg-white text-slate-900 hover:bg-amber-50 relative"
                                }
                            >
                                <FilterIcon className="h-4 w-4 mr-2" />
                                Filters
                                {filtersActiveCount > 0 && (
                                    <span
                                        className={
                                            theme === "dark"
                                                ? "ml-2 inline-flex items-center justify-center rounded-full bg-white text-black text-xs px-1.5 h-5 min-w-5"
                                                : "ml-2 inline-flex items-center justify-center rounded-full bg-amber-600 text-white text-xs px-1.5 h-5 min-w-5"
                                        }
                                    >
                                        {filtersActiveCount}
                                    </span>
                                )}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent
                            align="start"
                            className={cn(
                                theme === "dark"
                                    ? "bg-black border-gray-600"
                                    : "bg-white border-y border-amber-300",
                                "w-[min(92vw,720px)]",
                            )}
                        >
                            {filtersContent}
                        </PopoverContent>
                    </Popover>

                    <Select value={density} onValueChange={v => onDensityChange(v as Density)}>
                        <SelectTrigger
                            className={
                                theme === "dark"
                                    ? "w-40 rounded-xl border-gray-600 bg-black text-white hover:bg-gray-800"
                                    : "w-40 rounded-xl border-amber-300 bg-white hover:bg-amber-50 text-black"
                            }
                        >
                            <SelectValue placeholder="Density" />
                        </SelectTrigger>
                        <SelectContent
                            className={cn(
                                theme === "dark"
                                    ? "bg-black border-gray-600"
                                    : "bg-white border-y border-amber-300",
                                "w-40",
                            )}
                        >
                            <SelectItem value="compact">Compact</SelectItem>
                            <SelectItem value="normal">Normal</SelectItem>
                            <SelectItem value="comfortable">Comfortable</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <Button
                    onClick={onExport}
                    className={
                        theme === "dark"
                            ? "rounded-xl border border-gray-600 bg-black text-white hover:bg-gray-800"
                            : "rounded-xl border border-amber-300 bg-white text-slate-900 hover:bg-amber-50"
                    }
                >
                    <Download className="h-4 w-4 mr-2" />
                    Export
                </Button>
            </div>
        </div>
    );
}

export function getDensityRowClasses(density: Density) {
    switch (density) {
        case "compact":
            return "py-2 text-sm";
        case "comfortable":
            return "py-6 text-base";
        default:
            return "py-4 text-sm";
    }
}
