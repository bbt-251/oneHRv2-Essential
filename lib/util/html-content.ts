/**
 * Utilities for handling HTML content conversion for Firebase storage
 * Firebase doesn't handle HTML content well, so we convert it to JSON strings
 */

interface HtmlContentData {
    html: string;
    version: string;
    timestamp?: string;
}

/**
 * Convert HTML content to JSON string for Firebase storage
 * @param htmlContent - The HTML content to convert
 * @returns JSON string representation of the HTML content
 */
export const htmlToString = (htmlContent: string): string => {
    try {
        const data: HtmlContentData = {
            html: htmlContent || "",
            version: "1.0",
            timestamp: new Date().toISOString(),
        };
        return JSON.stringify(data);
    } catch (error) {
        console.error("Error converting HTML to string:", error);
        // Fallback: return the original content
        return htmlContent || "";
    }
};

/**
 * Convert JSON string from Firebase back to HTML content
 * @param jsonString - The JSON string from Firebase
 * @returns HTML content string
 */
export const stringToHtml = (jsonString: string): string => {
    // Handle empty or null values
    if (!jsonString || jsonString.trim() === "") {
        return "";
    }

    try {
        // Try to parse as JSON first
        const parsed: HtmlContentData = JSON.parse(jsonString);

        // Check if it's our expected format
        if (parsed && typeof parsed === "object" && "html" in parsed) {
            return parsed.html || "";
        }

        // If it's not our expected format, treat as legacy plain text
        return jsonString;
    } catch (error) {
        // If JSON parsing fails, it's likely legacy plain text content
        // Return as-is for backward compatibility
        return jsonString;
    }
};

/**
 * Basic HTML sanitization to prevent XSS attacks
 * Removes potentially dangerous tags and attributes
 * @param htmlContent - The HTML content to sanitize
 * @returns Sanitized HTML content
 */
export const sanitizeHtml = (htmlContent: string): string => {
    if (!htmlContent || htmlContent.trim() === "") {
        return "";
    }

    // Create a temporary div to parse HTML
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = htmlContent;

    // List of allowed tags
    const allowedTags = [
        "p",
        "br",
        "strong",
        "b",
        "em",
        "i",
        "u",
        "s",
        "strike",
        "h1",
        "h2",
        "h3",
        "h4",
        "h5",
        "h6",
        "ul",
        "ol",
        "li",
        "blockquote",
        "a",
        "img",
        "hr",
        "div",
        "span",
    ];

    // List of allowed attributes
    const allowedAttributes: { [key: string]: string[] } = {
        a: ["href", "title", "target"],
        img: ["src", "alt", "title", "width", "height"],
        div: ["style"],
        span: ["style"],
        p: ["style"],
        h1: ["style"],
        h2: ["style"],
        h3: ["style"],
        h4: ["style"],
        h5: ["style"],
        h6: ["style"],
    };

    // Function to clean an element recursively
    const cleanElement = (element: Element): void => {
        const tagName = element.tagName.toLowerCase();

        // Remove disallowed tags
        if (!allowedTags.includes(tagName)) {
            element.remove();
            return;
        }

        // Clean attributes
        const allowedAttrs = allowedAttributes[tagName] || [];
        const attributes = Array.from(element.attributes);

        attributes.forEach(attr => {
            if (!allowedAttrs.includes(attr.name.toLowerCase())) {
                element.removeAttribute(attr.name);
            }
        });

        // Recursively clean child elements
        Array.from(element.children).forEach(child => {
            cleanElement(child);
        });
    };

    // Clean all elements
    Array.from(tempDiv.children).forEach(child => {
        cleanElement(child);
    });

    return tempDiv.innerHTML;
};

/**
 * Check if content is HTML (contains HTML tags) or plain text
 * @param content - The content to check
 * @returns true if content appears to be HTML, false if plain text
 */
export const isHtmlContent = (content: string): boolean => {
    if (!content || content.trim() === "") {
        return false;
    }

    // Simple check for HTML tags
    const htmlTagRegex = /<[^>]*>/;
    return htmlTagRegex.test(content);
};

/**
 * Convert plain text to basic HTML with line breaks
 * @param plainText - The plain text to convert
 * @returns HTML content with proper line breaks
 */
export const plainTextToHtml = (plainText: string): string => {
    if (!plainText || plainText.trim() === "") {
        return "";
    }

    // Replace line breaks with <br> tags and wrap in paragraph
    const htmlContent = plainText
        .replace(/\n\n/g, "</p><p>") // Double line breaks = new paragraph
        .replace(/\n/g, "<br>") // Single line breaks = <br>
        .replace(/^/, "<p>") // Start with paragraph
        .replace(/$/, "</p>"); // End with paragraph

    return htmlContent;
};

/**
 * Convert HTML content back to plain text
 * @param htmlContent - The HTML content to convert
 * @returns Plain text content
 */
export const htmlToPlainText = (htmlContent: string): string => {
    if (!htmlContent || htmlContent.trim() === "") {
        return "";
    }

    // Create a temporary div to parse HTML
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = htmlContent;

    // Extract text content
    return tempDiv.textContent || tempDiv.innerText || "";
};

/**
 * Validate HTML content for basic structure and safety
 * @param htmlContent - The HTML content to validate
 * @returns Object with validation result and any error messages
 */
export const validateHtmlContent = (
    htmlContent: string,
): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
} => {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!htmlContent || htmlContent.trim() === "") {
        return { isValid: true, errors, warnings };
    }

    try {
        // Try to parse HTML
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = htmlContent;

        // Check for potentially dangerous content
        const scripts = tempDiv.querySelectorAll("script");
        if (scripts.length > 0) {
            errors.push("Script tags are not allowed");
        }

        const iframes = tempDiv.querySelectorAll("iframe");
        if (iframes.length > 0) {
            warnings.push("Iframe tags may not display properly");
        }

        // Check for broken links
        const links = tempDiv.querySelectorAll("a[href]");
        links.forEach((link, index) => {
            const href = link.getAttribute("href");
            if (
                href &&
                !href.startsWith("http") &&
                !href.startsWith("mailto:") &&
                !href.startsWith("#")
            ) {
                warnings.push(`Link ${index + 1} may have invalid URL: ${href}`);
            }
        });

        // Check for broken images
        const images = tempDiv.querySelectorAll("img[src]");
        images.forEach((img, index) => {
            const src = img.getAttribute("src");
            if (src && !src.startsWith("http") && !src.startsWith("data:")) {
                warnings.push(`Image ${index + 1} may have invalid URL: ${src}`);
            }
        });
    } catch (error) {
        errors.push("Invalid HTML structure");
    }

    return {
        isValid: errors.length === 0,
        errors,
        warnings,
    };
};
