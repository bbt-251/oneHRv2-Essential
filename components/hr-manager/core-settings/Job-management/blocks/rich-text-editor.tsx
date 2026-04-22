"use client";

import type React from "react";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
    Bold,
    Italic,
    Underline,
    List,
    ListOrdered,
    AlignLeft,
    AlignCenter,
    AlignRight,
    Link,
    Type,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/theme-provider";

interface RichTextEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
}

function ToolbarButton({
    onClick,
    active,
    children,
    title,
}: {
    onClick: () => void;
    active?: boolean;
    children: React.ReactNode;
    title: string;
}) {
    return (
        <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClick}
            onMouseDown={e => e.preventDefault()}
            title={title}
            className={cn(
                "h-8 w-8 p-0 hover:bg-amber-100",
                active && "bg-amber-100 text-amber-700",
            )}
        >
            {children}
        </Button>
    );
}

export default function RichTextEditor({
    value,
    onChange,
    placeholder = "Start typing...",
    className,
}: RichTextEditorProps) {
    const { theme } = useTheme();
    const editorRef = useRef<HTMLDivElement>(null);
    const [isFocused, setIsFocused] = useState<boolean>(false);

    useEffect(() => {
        if (editorRef.current && editorRef.current.innerHTML !== value) {
            editorRef.current.innerHTML = value;
        }
    }, [value]);

    const executeCommand = (command: string, value?: string) => {
        document.execCommand(command, false, value);
        if (editorRef.current) {
            onChange(editorRef.current.innerHTML);
        }
        editorRef.current?.focus();
    };

    const handleInput = () => {
        if (editorRef.current) {
            onChange(editorRef.current.innerHTML);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        // Handle common keyboard shortcuts
        if (e.ctrlKey || e.metaKey) {
            switch (e.key) {
                case "b":
                    e.preventDefault();
                    executeCommand("bold");
                    break;
                case "i":
                    e.preventDefault();
                    executeCommand("italic");
                    break;
                case "u":
                    e.preventDefault();
                    executeCommand("underline");
                    break;
            }
        }
    };

    const isCommandActive = (command: string): boolean => {
        return document.queryCommandState(command);
    };

    return (
        <Card className={cn("overflow-hidden", className)}>
            {/* Toolbar */}
            <div
                className={`flex items-center gap-1 p-2 border-b ${theme === "dark" ? "bg-black" : "bg-gray-50"}`}
            >
                <div className="flex items-center gap-1 border-r ">
                    <ToolbarButton
                        onClick={() => executeCommand("bold")}
                        active={isCommandActive("bold")}
                        title="Bold (Ctrl+B)"
                    >
                        <Bold className="h-4 w-4" />
                    </ToolbarButton>
                    <ToolbarButton
                        onClick={() => executeCommand("italic")}
                        active={isCommandActive("italic")}
                        title="Italic (Ctrl+I)"
                    >
                        <Italic className="h-4 w-4" />
                    </ToolbarButton>
                    <ToolbarButton
                        onClick={() => executeCommand("underline")}
                        active={isCommandActive("underline")}
                        title="Underline (Ctrl+U)"
                    >
                        <Underline className="h-4 w-4" />
                    </ToolbarButton>
                </div>

                <div className="flex items-center gap-1 border-r pr-2 mr-2">
                    <ToolbarButton
                        onClick={() => executeCommand("justifyLeft")}
                        active={isCommandActive("justifyLeft")}
                        title="Align Left"
                    >
                        <AlignLeft className="h-4 w-4" />
                    </ToolbarButton>
                    <ToolbarButton
                        onClick={() => executeCommand("justifyCenter")}
                        active={isCommandActive("justifyCenter")}
                        title="Align Center"
                    >
                        <AlignCenter className="h-4 w-4" />
                    </ToolbarButton>
                    <ToolbarButton
                        onClick={() => executeCommand("justifyRight")}
                        active={isCommandActive("justifyRight")}
                        title="Align Right"
                    >
                        <AlignRight className="h-4 w-4" />
                    </ToolbarButton>
                </div>

                <div className="flex items-center gap-1 border-r pr-2 mr-2">
                    <ToolbarButton
                        onClick={() => executeCommand("insertUnorderedList")}
                        active={isCommandActive("insertUnorderedList")}
                        title="Bullet List"
                    >
                        <List className="h-4 w-4" />
                    </ToolbarButton>
                    <ToolbarButton
                        onClick={() => executeCommand("insertOrderedList")}
                        active={isCommandActive("insertOrderedList")}
                        title="Numbered List"
                    >
                        <ListOrdered className="h-4 w-4" />
                    </ToolbarButton>
                </div>

                <div className="flex items-center gap-1">
                    <ToolbarButton
                        onClick={() => {
                            const url = prompt("Enter URL:");
                            if (url) executeCommand("createLink", url);
                        }}
                        title="Insert Link"
                    >
                        <Link className="h-4 w-4" />
                    </ToolbarButton>
                    <ToolbarButton
                        onClick={() => executeCommand("removeFormat")}
                        title="Clear Formatting"
                    >
                        <Type className="h-4 w-4" />
                    </ToolbarButton>
                </div>
            </div>

            {/* Editor */}
            <div
                ref={editorRef}
                contentEditable
                onInput={handleInput}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                onKeyDown={handleKeyDown}
                className={cn(
                    "min-h-[120px] p-3 outline-none prose prose-sm max-w-none",
                    "focus:ring-2 focus:ring-amber-500 focus:ring-inset",
                    !value && !isFocused && "text-gray-400",
                )}
                style={{
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                }}
                suppressContentEditableWarning
            >
                {!value && !isFocused && placeholder}
            </div>
        </Card>
    );
}
