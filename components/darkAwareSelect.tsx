"use client";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useTheme } from "./theme-provider";

interface DarkAwareSelectProps {
    items: string[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
}

export function DarkAwareSelect({
    items,
    value,
    onChange,
    placeholder = "Select an option",
    className = "",
}: DarkAwareSelectProps) {
    const { theme } = useTheme();
    const isDark = theme === "dark";

    const baseStyle = isDark
        ? "bg-slate-800 border-slate-600 text-slate-200"
        : "bg-white border-gray-300 text-gray-900";

    const itemStyle = isDark
        ? "hover:bg-slate-700 text-slate-200"
        : "hover:bg-gray-100 text-gray-900";

    return (
        <Select value={value} onValueChange={onChange}>
            <SelectTrigger className={`w-48 ${baseStyle} ${className}`}>
                <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent className={baseStyle}>
                {items.map(item => (
                    <SelectItem key={item} value={item} className={itemStyle}>
                        {item}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}
