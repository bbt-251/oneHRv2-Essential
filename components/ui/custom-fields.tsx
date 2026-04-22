"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2 } from "lucide-react";
import { CustomField, CustomFieldType, CustomFieldSection } from "@/lib/models/employee";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";

// ============================================================
// Custom Fields Editor Component (for Add/Edit mode)
// ============================================================

interface CustomFieldsEditorProps {
    fields: CustomField[];
    onChange: (fields: CustomField[]) => void;
    theme: string;
    disabled?: boolean;
    section: CustomFieldSection; // v2: required section identifier
    errors?: Record<string, string>; // validation errors
}

export function CustomFieldsEditor({
    fields,
    onChange,
    theme,
    disabled = false,
    section,
    errors = {},
}: CustomFieldsEditorProps) {
    const labelClasses = theme === "dark" ? "text-gray-200" : "text-primary-800";
    const inputClasses =
        theme === "dark"
            ? "bg-black border-gray-600 focus:border-blue-500 focus:ring-blue-500 text-white"
            : "border-gray-200 focus:border-primary-600 focus:ring-primary-600";

    const generateId = () => `cf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const addField = () => {
        const newField: CustomField = {
            id: generateId(),
            section: section,
            label: "",
            value: "",
            type: "text",
        };
        onChange([...fields, newField]);
    };

    const removeField = (id: string) => {
        onChange(fields.filter(f => f.id !== id));
    };

    const updateField = (id: string, key: keyof CustomField, value: string | boolean) => {
        onChange(fields.map(f => (f.id === id ? { ...f, [key]: value } : f)));
    };

    // Helper to get label
    const getFieldLabel = (field: CustomField): string => {
        return field.label || "";
    };

    // Get display title for accordion trigger
    const getFieldTitle = (field: CustomField, index: number): string => {
        if (field.label && field.value) {
            return `${field.label}: ${field.value}`;
        }
        if (field.label) {
            return field.label;
        }
        return `Custom Field ${index + 1}`;
    };

    return (
        <div className="space-y-4 mt-6">
            <div className="flex items-center justify-between">
                <h4
                    className={`text-md font-semibold ${theme === "dark" ? "text-gray-200" : "text-primary-900"}`}
                >
                    Custom Fields
                    {fields.length > 0 && (
                        <span
                            className={`ml-2 text-sm font-normal ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}
                        >
                            ({fields.length} field{fields.length !== 1 ? "s" : ""})
                        </span>
                    )}
                </h4>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addField}
                    disabled={disabled}
                    className={`${
                        theme === "dark"
                            ? "bg-gray-800 border-gray-700 hover:bg-gray-700 text-gray-200"
                            : "bg-white border-gray-200 hover:bg-gray-50 text-primary-700"
                    }`}
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Field
                </Button>
            </div>

            {fields.length === 0 && (
                <p
                    className={`text-sm italic ${theme === "dark" ? "text-gray-500" : "text-gray-400"}`}
                >
                    No custom fields added. Click &quot;Add Field&quot; to add one.
                </p>
            )}

            {/* Show general error if there are validation errors */}
            {Object.keys(errors).length > 0 && (
                <p className="text-sm text-red-500">
                    Please fill in all custom field labels and values.
                </p>
            )}

            {fields.length > 0 && (
                <Accordion type="multiple" className="w-full space-y-2">
                    {fields.map((field, index) => (
                        <AccordionItem
                            key={field.id}
                            value={field.id}
                            className={`border rounded-lg ${
                                theme === "dark"
                                    ? "bg-gray-900/50 border-gray-700"
                                    : "bg-gray-50 border-gray-200"
                            }`}
                        >
                            <AccordionTrigger className="px-4 py-3 hover:no-underline">
                                <div className="flex items-center justify-between w-full pr-4">
                                    <div className="flex items-center gap-2">
                                        <span
                                            className={`text-sm font-medium ${theme === "dark" ? "text-gray-200" : "text-primary-900"}`}
                                        >
                                            {getFieldTitle(field, index)}
                                        </span>
                                        {field.type !== "text" && (
                                            <span
                                                className={`text-xs px-2 py-0.5 rounded ${
                                                    theme === "dark"
                                                        ? "bg-gray-700 text-gray-300"
                                                        : "bg-gray-200 text-gray-600"
                                                }`}
                                            >
                                                {field.type}
                                            </span>
                                        )}
                                        {/* Show error indicator */}
                                        {(errors[`customFields-${field.id}-label`] ||
                                            errors[`customFields-${field.id}-value`]) && (
                                            <span className="text-red-500 text-xs">
                                                ⚠ Incomplete
                                            </span>
                                        )}
                                    </div>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={e => {
                                            e.stopPropagation();
                                            removeField(field.id);
                                        }}
                                        disabled={disabled}
                                        className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="px-4 pb-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Field Label (v2) */}
                                    <div>
                                        <Label
                                            htmlFor={`field-label-${field.id}`}
                                            className={labelClasses}
                                        >
                                            Field Label <span className="text-red-500">*</span>
                                        </Label>
                                        <Input
                                            id={`field-label-${field.id}`}
                                            type="text"
                                            value={getFieldLabel(field)}
                                            onChange={e =>
                                                updateField(field.id, "label", e.target.value)
                                            }
                                            placeholder="e.g., Secondary Bank Account"
                                            className={`mt-1 ${inputClasses} ${errors[`customFields-${field.id}-label`] ? "border-red-500" : ""}`}
                                            disabled={disabled}
                                        />
                                        {errors[`customFields-${field.id}-label`] && (
                                            <p className="mt-1 text-sm text-red-500">
                                                {errors[`customFields-${field.id}-label`]}
                                            </p>
                                        )}
                                    </div>

                                    {/* Field Type */}
                                    <div>
                                        <Label
                                            htmlFor={`field-type-${field.id}`}
                                            className={labelClasses}
                                        >
                                            Field Type
                                        </Label>
                                        <Select
                                            value={field.type || "text"}
                                            onValueChange={value =>
                                                updateField(
                                                    field.id,
                                                    "type",
                                                    value as CustomFieldType,
                                                )
                                            }
                                            disabled={disabled}
                                        >
                                            <SelectTrigger className={`mt-1 ${inputClasses}`}>
                                                <SelectValue placeholder="Select type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="text">Text</SelectItem>
                                                <SelectItem value="number">Number</SelectItem>
                                                <SelectItem value="date">Date</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                {/* Field Value */}
                                <div className="mt-4">
                                    <Label
                                        htmlFor={`field-value-${field.id}`}
                                        className={labelClasses}
                                    >
                                        Value <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id={`field-value-${field.id}`}
                                        type={
                                            field.type === "number"
                                                ? "number"
                                                : field.type === "date"
                                                    ? "date"
                                                    : "text"
                                        }
                                        value={field.value}
                                        onChange={e =>
                                            updateField(field.id, "value", e.target.value)
                                        }
                                        placeholder="Enter value"
                                        className={`mt-1 ${inputClasses} ${errors[`customFields-${field.id}-value`] ? "border-red-500" : ""}`}
                                        disabled={disabled}
                                    />
                                    {errors[`customFields-${field.id}-value`] && (
                                        <p className="mt-1 text-sm text-red-500">
                                            {errors[`customFields-${field.id}-value`]}
                                        </p>
                                    )}
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            )}
        </div>
    );
}

// ============================================================
// Custom Fields Display Component (for View mode)
// ============================================================

interface CustomFieldsDisplayProps {
    fields: CustomField[];
    theme: string;
}

// Helper to get label
const getFieldLabel = (field: CustomField): string => {
    return field.label || "Unnamed Field";
};

export function CustomFieldsDisplay({ fields, theme }: CustomFieldsDisplayProps) {
    if (!fields || fields.length === 0) {
        return null;
    }

    return (
        <div className="space-y-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <h4
                className={`text-sm font-semibold mb-3 ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}
            >
                Custom Fields
            </h4>
            {fields.map(field => (
                <div
                    key={field.id}
                    className={`grid grid-cols-3 gap-4 py-2 border-b last:border-b-0 ${
                        theme === "dark" ? "border-gray-800" : "border-gray-100"
                    }`}
                >
                    <dt
                        className={`text-sm font-medium ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}
                    >
                        {getFieldLabel(field)}:
                    </dt>
                    <dd
                        className={`text-sm ${theme === "dark" ? "text-white" : "text-primary-900"}`}
                    >
                        {field.value || "-"}
                    </dd>
                </div>
            ))}
        </div>
    );
}

// ============================================================
// Custom Fields Section Wrapper (for View Modal - renders as a collapsible section)
// ============================================================

interface CustomFieldsSectionProps {
    fields: CustomField[];
    title: string;
    theme: string;
}

export function CustomFieldsSection({ fields, title, theme }: CustomFieldsSectionProps) {
    if (!fields || fields.length === 0) {
        return null;
    }

    return (
        <Accordion type="single" collapsible className="w-full">
            <AccordionItem
                value="custom-fields"
                className={`border rounded-lg ${
                    theme === "dark" ? "bg-black border-gray-800" : "bg-white border-gray-200"
                }`}
            >
                <AccordionTrigger className="px-6 py-4 hover:no-underline">
                    <div className="flex items-center gap-2">
                        <h3
                            className={`text-lg font-semibold ${theme === "dark" ? "text-white" : "text-primary-900"}`}
                        >
                            {title}
                        </h3>
                        <span
                            className={`text-sm font-normal ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}
                        >
                            ({fields.length} field{fields.length !== 1 ? "s" : ""})
                        </span>
                    </div>
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-4">
                    <dl className="space-y-0">
                        {fields.map(field => (
                            <div
                                key={field.id}
                                className={`grid grid-cols-3 gap-4 py-2 border-b last:border-b-0 ${
                                    theme === "dark" ? "border-gray-800" : "border-gray-100"
                                }`}
                            >
                                <dt
                                    className={`text-sm font-medium ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}
                                >
                                    {getFieldLabel(field)}:
                                </dt>
                                <dd
                                    className={`text-sm ${theme === "dark" ? "text-white" : "text-primary-900"}`}
                                >
                                    {field.value || "-"}
                                </dd>
                            </div>
                        ))}
                    </dl>
                </AccordionContent>
            </AccordionItem>
        </Accordion>
    );
}
