"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/theme-provider";

export interface Option {
    value: string;
    label: string;
    children?: Option[];
}

export default function CascaderDropdown({
    options,
    setDynamicOptions,
    value = "",
    renderLabel,
    buttonClassName,
    contentClassName,
    placeholder = "Please select",
}: {
    options: Option[];
    setDynamicOptions: (val: string) => void;
    value?: string;
    renderLabel?: (value: string) => string | undefined;
    buttonClassName?: string;
    contentClassName?: string;
    placeholder?: string;
}) {
    const { theme } = useTheme();
    const [selectedValue, setSelectedValue] = React.useState<string>(value);
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
        setMounted(true);
    }, []);

    React.useEffect(() => {
        setSelectedValue(value);
    }, [value]);

    const handleSelect = (option: Option) => {
        if (!mounted) return;
        if (!option.children) {
            setSelectedValue(option.value);
            setDynamicOptions(option.value);
        }
    };

    const renderOptions = (opts: Option[]) => {
        return opts.map(option =>
            option.children ? (
                <DropdownMenuSub key={option.value}>
                    <DropdownMenuSubTrigger
                        className={cn(
                            "hover:bg-gray-200",
                            theme === "dark" ? "hover:bg-gray-700 text-white" : "text-black",
                        )}
                    >
                        {option.label}
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent
                        className={cn(
                            "max-h-64 overflow-y-auto",
                            theme === "dark" ? "bg-gray-800 text-white" : "bg-white text-black",
                        )}
                    >
                        {renderOptions(option.children)}
                    </DropdownMenuSubContent>
                </DropdownMenuSub>
            ) : (
                <DropdownMenuItem
                    key={option.value}
                    onSelect={() => handleSelect(option)}
                    className={cn(
                        "flex items-center",
                        theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-200",
                        selectedValue === option.value && "font-medium",
                    )}
                >
                    <Check
                        className={cn(
                            "mr-2 h-4 w-4",
                            selectedValue === option.value ? "opacity-100" : "opacity-0",
                        )}
                    />
                    {option.label}
                </DropdownMenuItem>
            ),
        );
    };

    const findLabel = (value: string, opts: Option[]): string | undefined => {
        for (const opt of opts) {
            if (opt.value === value) return opt.label;
            if (opt.children) {
                const label = findLabel(value, opt.children);
                if (label) return label;
            }
        }
        return undefined;
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    onMouseDown={e => e.stopPropagation()}
                    variant="outline"
                    className={cn(
                        buttonClassName ??
                            cn(
                                "w-[300px] justify-between",
                                theme === "dark"
                                    ? "bg-gray-900 border-gray-700 text-white hover:bg-gray-800"
                                    : "bg-white border-gray-300 text-black hover:bg-gray-100",
                            ),
                    )}
                >
                    <span className="truncate">
                        {selectedValue
                            ? (renderLabel?.(selectedValue) ?? findLabel(selectedValue, options))
                            : placeholder}
                    </span>
                    <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                className={cn(
                    contentClassName ??
                        cn(
                            "w-56",
                            theme === "dark"
                                ? "bg-gray-800 text-white border border-gray-700"
                                : "bg-white text-black border border-gray-200",
                        ),
                )}
            >
                {renderOptions(options)}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
