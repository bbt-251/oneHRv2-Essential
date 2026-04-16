/**
 * HTML Content Display Component
 *
 * A reusable component for safely displaying HTML content converted from Firebase JSON strings.
 * Handles the conversion from JSON string to HTML and provides consistent styling.
 */

import { stringToHtml } from "@/lib/util/html-content";
import { cn } from "@/lib/utils";

interface HtmlContentDisplayProps {
    /**
     * The JSON string content from Firebase (or plain text for backward compatibility)
     */
    content: string;
    /**
     * Additional CSS classes to apply to the container
     */
    className?: string;
    /**
     * Whether to apply prose styling (recommended for rich content)
     * @default true
     */
    prose?: boolean;
    /**
     * Maximum number of lines to display (for preview/summary views)
     * Uses line-clamp utility classes
     */
    maxLines?: number;
}

export function HtmlContentDisplay({
    content,
    className,
    prose = true,
    maxLines,
}: HtmlContentDisplayProps) {
    // Convert JSON string to HTML
    const htmlContent = stringToHtml(content);

    // Build CSS classes
    const baseClasses = "text-sm text-brand-600 dark:text-gray-300";
    const proseClasses = prose
        ? "prose prose-sm max-w-none dark:prose-invert prose-headings:text-brand-800 dark:prose-headings:text-white prose-p:text-brand-600 dark:prose-p:text-gray-300 prose-li:text-brand-600 dark:prose-li:text-gray-300 prose-strong:text-brand-800 dark:prose-strong:text-white"
        : "";

    // Handle line clamping with explicit classes
    let lineClampClasses = "";
    if (maxLines) {
        switch (maxLines) {
            case 1:
                lineClampClasses = "line-clamp-1";
                break;
            case 2:
                lineClampClasses = "line-clamp-2";
                break;
            case 3:
                lineClampClasses = "line-clamp-3";
                break;
            case 4:
                lineClampClasses = "line-clamp-4";
                break;
            case 5:
                lineClampClasses = "line-clamp-5";
                break;
            case 6:
                lineClampClasses = "line-clamp-6";
                break;
            default:
                lineClampClasses = "line-clamp-2";
        }
    }

    const combinedClasses = cn(baseClasses, proseClasses, lineClampClasses, className);

    // If content is empty, show placeholder
    if (!htmlContent || htmlContent.trim() === "") {
        return (
            <div className={cn(baseClasses, "italic opacity-60", className)}>
                No content available
            </div>
        );
    }

    return (
        <div
            className={combinedClasses}
            dangerouslySetInnerHTML={{
                __html: htmlContent,
            }}
        />
    );
}

/**
 * Specialized component for displaying job descriptions
 * Pre-configured with appropriate styling for job post content
 */
export function JobDescriptionDisplay({
    content,
    className,
    maxLines,
}: Omit<HtmlContentDisplayProps, "prose">) {
    return (
        <HtmlContentDisplay
            content={content}
            className={className}
            prose={true}
            maxLines={maxLines}
        />
    );
}

/**
 * Specialized component for job description previews in cards/lists
 * Pre-configured for summary display with line clamping
 */
export function JobDescriptionPreview({
    content,
    className,
}: Omit<HtmlContentDisplayProps, "prose" | "maxLines">) {
    return (
        <HtmlContentDisplay
            content={content}
            className={className}
            prose={false} // Disable prose for compact preview
            maxLines={2} // Limit to 2 lines for preview
        />
    );
}
