// lib/notifications/channels.ts
import { mutateCompactData } from "@/lib/backend/client/data-client";
import { getTimestamp } from "../dayjs_format";

export async function sendEmail(to: string, subject: string, htmlBody: string) {
    if (!to || !subject || !htmlBody) {
        throw new Error("Missing required parameters for email");
    }

    try {
        const response = await fetch("/api/send-email", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: to, subject, html: htmlBody }),
        });

        if (!response.ok) {
            const errorResult = await response.json().catch(() => ({ message: "Unknown error" }));
            throw new Error(errorResult.message || "Failed to send email");
        }

        return await response.json();
    } catch (error) {
        console.error("Failed to send email:", {
            error: error instanceof Error ? error.message : error,
            recipient: to,
        });
        throw error;
    }
}

export async function sendTelegram(chatId: string, text: string) {
    if (!chatId || !text) {
        throw new Error("Missing required parameters for Telegram message");
    }

    try {
        // Call our API route for server-side Telegram sending
        const response = await fetch(`/api/send-telegram-notification`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                chatId: chatId,
                text: text,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
            throw new Error(`Telegram API error: ${response.status} - ${errorData.error}`);
        }

        return await response.json();
    } catch (error) {
        console.error("Failed to send Telegram message:", {
            error: error instanceof Error ? error.message : error,
            chatId,
        });
        throw error;
    }
}

export async function sendInApp(
    uid: string,
    message: string,
    title?: string,
    action?: string | null,
) {
    if (!uid || !message) {
        throw new Error("Missing required parameters for in-app notification");
    }

    try {
        const response = await mutateCompactData<{ notification?: { id?: string } }>({
            resource: "notifications",
            action: "create",
            payload: {
                uid: uid,
                ...(title ? { title: title } : {}),
                message: message,
                action: action || null,
                isRead: false,
                timestamp: getTimestamp(),
            },
        });
        return { success: true, docId: response.notification?.id };
    } catch (error) {
        console.error("Failed to send in-app notification:", {
            error: error instanceof Error ? error.message : error,
            uid,
        });
        throw error;
    }
}
