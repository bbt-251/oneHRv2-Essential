"use client";

import { useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import { Button } from "./button";

interface RichTextEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    disabled?: boolean;
}

export interface RichTextEditorRef {
    insertText: (text: string) => void;
}

export const RichTextEditor = forwardRef<RichTextEditorRef, RichTextEditorProps>(
    (
        {
            value,
            onChange,
            placeholder = "Enter your content...",
            className = "",
            disabled = false,
        },
        ref,
    ) => {
        const editorRef = useRef<HTMLDivElement>(null);

        // Sync content when value prop changes
        useEffect(() => {
            if (editorRef.current && editorRef.current.innerHTML !== value) {
                editorRef.current.innerHTML = value || "";
            }
        }, [value]);

        const handleInput = (): void => {
            if (editorRef.current) {
                const content = editorRef.current.innerHTML;
                onChange(content);
            }
        };

        const handlePaste = (e: React.ClipboardEvent): void => {
            e.preventDefault();
            const text = e.clipboardData.getData("text/plain");
            document.execCommand("insertText", false, text);
        };

        const executeCommand = (command: string, value?: string): void => {
            document.execCommand(command, false, value);
            editorRef.current?.focus();
            handleInput();
        };

        const insertLink = (): void => {
            const url = prompt("Enter URL:");
            if (url) {
                executeCommand("createLink", url);
            }
        };

        const insertImage = (): void => {
            const url = prompt("Enter image URL:");
            if (url) {
                executeCommand("insertImage", url);
            }
        };

        const insertCustomText = (text: string): void => {
            executeCommand("insertText", text);
        };

        useImperativeHandle(ref, () => ({
            insertText: insertCustomText,
        }));

        return (
            <div className={`border rounded-md ${className}`}>
                {/* Toolbar */}
                <div className="border-b p-2 bg-gray-50 dark:bg-gray-800 flex flex-wrap gap-1">
                    {/* Format Dropdown */}
                    <select
                        className="px-2 py-1 text-xs border rounded hover:bg-gray-200 dark:hover:bg-gray-700 dark:bg-gray-800 dark:border-gray-600"
                        onChange={e => executeCommand("formatBlock", e.target.value)}
                        defaultValue=""
                        disabled={disabled}
                    >
                        <option value="">Format</option>
                        <option value="h1">Heading 1</option>
                        <option value="h2">Heading 2</option>
                        <option value="h3">Heading 3</option>
                        <option value="p">Paragraph</option>
                        <option value="blockquote">Quote</option>
                    </select>

                    {/* Font Size Dropdown */}
                    <select
                        className="px-2 py-1 text-xs border rounded hover:bg-gray-200 dark:hover:bg-gray-700 dark:bg-gray-800 dark:border-gray-600"
                        onChange={e => executeCommand("fontSize", e.target.value)}
                        defaultValue=""
                        disabled={disabled}
                    >
                        <option value="">Size</option>
                        <option value="1">Small</option>
                        <option value="3">Normal</option>
                        <option value="5">Large</option>
                        <option value="7">Extra Large</option>
                    </select>

                    {/* Text Formatting */}
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="px-2 py-1 text-xs font-bold h-auto"
                        onClick={() => executeCommand("bold")}
                        disabled={disabled}
                    >
                        B
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="px-2 py-1 text-xs italic h-auto"
                        onClick={() => executeCommand("italic")}
                        disabled={disabled}
                    >
                        I
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="px-2 py-1 text-xs underline h-auto"
                        onClick={() => executeCommand("underline")}
                        disabled={disabled}
                    >
                        U
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="px-2 py-1 text-xs h-auto"
                        onClick={() => executeCommand("strikeThrough")}
                        disabled={disabled}
                    >
                        S̶
                    </Button>

                    {/* Separator */}
                    <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1"></div>

                    {/* Text Color */}
                    <select
                        className="px-2 py-1 text-xs border rounded hover:bg-gray-200 dark:hover:bg-gray-700 dark:bg-gray-800 dark:border-gray-600"
                        onChange={e => executeCommand("foreColor", e.target.value)}
                        defaultValue=""
                        disabled={disabled}
                    >
                        <option value="">Text Color</option>
                        <option value="#000000">Black</option>
                        <option value="#333333">Dark Gray</option>
                        <option value="#666666">Gray</option>
                        <option value="#ffffff">White</option>
                        <option value="#dc2626">Red</option>
                        <option value="#059669">Green</option>
                        <option value="#2563eb">Blue</option>
                        <option value="#7c3aed">Purple</option>
                    </select>

                    {/* Highlight Color */}
                    <select
                        className="px-2 py-1 text-xs border rounded hover:bg-gray-200 dark:hover:bg-gray-700 dark:bg-gray-800 dark:border-gray-600"
                        onChange={e => executeCommand("hiliteColor", e.target.value)}
                        defaultValue=""
                        disabled={disabled}
                    >
                        <option value="">Highlight</option>
                        <option value="yellow">Yellow</option>
                        <option value="lightblue">Light Blue</option>
                        <option value="lightgreen">Light Green</option>
                        <option value="pink">Pink</option>
                        <option value="transparent">None</option>
                    </select>

                    {/* Separator */}
                    <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1"></div>

                    {/* Text Alignment */}
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="px-2 py-1 text-xs h-auto"
                        onClick={() => executeCommand("justifyLeft")}
                        disabled={disabled}
                    >
                        ⬅
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="px-2 py-1 text-xs h-auto"
                        onClick={() => executeCommand("justifyCenter")}
                        disabled={disabled}
                    >
                        ⬌
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="px-2 py-1 text-xs h-auto"
                        onClick={() => executeCommand("justifyRight")}
                        disabled={disabled}
                    >
                        ➡
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="px-2 py-1 text-xs h-auto"
                        onClick={() => executeCommand("justifyFull")}
                        disabled={disabled}
                    >
                        ⬌⬌
                    </Button>

                    {/* Separator */}
                    <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1"></div>

                    {/* Lists */}
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="px-2 py-1 text-xs h-auto"
                        onClick={() => executeCommand("insertUnorderedList")}
                        disabled={disabled}
                    >
                        • List
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="px-2 py-1 text-xs h-auto"
                        onClick={() => executeCommand("insertOrderedList")}
                        disabled={disabled}
                    >
                        1. List
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="px-2 py-1 text-xs h-auto"
                        onClick={() => executeCommand("indent")}
                        disabled={disabled}
                    >
                        →|
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="px-2 py-1 text-xs h-auto"
                        onClick={() => executeCommand("outdent")}
                        disabled={disabled}
                    >
                        |←
                    </Button>

                    {/* Separator */}
                    <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1"></div>

                    {/* Links and Images */}
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="px-2 py-1 text-xs h-auto"
                        onClick={insertLink}
                        disabled={disabled}
                    >
                        🔗 Link
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="px-2 py-1 text-xs h-auto"
                        onClick={() => executeCommand("unlink")}
                        disabled={disabled}
                    >
                        🔗❌
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="px-2 py-1 text-xs h-auto"
                        onClick={insertImage}
                        disabled={disabled}
                    >
                        🖼️ Image
                    </Button>

                    {/* Separator */}
                    <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1"></div>

                    {/* Utilities */}
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="px-2 py-1 text-xs h-auto"
                        onClick={() => executeCommand("insertHorizontalRule")}
                        disabled={disabled}
                    >
                        ―
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="px-2 py-1 text-xs h-auto"
                        onClick={() => executeCommand("removeFormat")}
                        disabled={disabled}
                    >
                        🧹 Clear
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="px-2 py-1 text-xs h-auto"
                        onClick={() => executeCommand("undo")}
                        disabled={disabled}
                    >
                        ↶ Undo
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="px-2 py-1 text-xs h-auto"
                        onClick={() => executeCommand("redo")}
                        disabled={disabled}
                    >
                        ↷ Redo
                    </Button>
                </div>

                {/* Editor Content */}
                <div
                    ref={editorRef}
                    contentEditable={!disabled}
                    className="min-h-[200px] p-4 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 prose prose-sm max-w-none dark:prose-invert"
                    style={{ minHeight: "200px", direction: "ltr" }}
                    onInput={handleInput}
                    onPaste={handlePaste}
                    suppressContentEditableWarning={true}
                    data-placeholder={placeholder}
                />

                {/* Help Text */}
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 px-4 pb-2">
                    Use the toolbar above to format your content. You can add headings, lists,
                    links, images, and more.
                </p>
            </div>
        );
    },
);

RichTextEditor.displayName = "RichTextEditor";
