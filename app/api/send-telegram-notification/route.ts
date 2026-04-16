import { NextRequest, NextResponse } from "next/server";
import { sendMessage as sendTelegramMessage } from "@/lib/util/notification/telegram";

export async function POST(request: NextRequest) {
    try {
        const { chatId, text } = await request.json();

        if (!chatId || !text) {
            return NextResponse.json(
                { error: "Missing required parameters: chatId and text" },
                { status: 400 },
            );
        }

        // Use the existing sendMessage function from telegram.ts
        const result = await sendTelegramMessage(parseInt(chatId), text);

        return NextResponse.json({
            success: true,
            result,
            message: "Telegram notification sent successfully",
        });
    } catch (error) {
        console.error("Telegram API error:", {
            error: error instanceof Error ? error.message : error,
        });

        // Check if it's a configuration error
        if (
            error instanceof Error &&
            error.message.includes("Telegram bot token is not configured")
        ) {
            return NextResponse.json(
                { error: "Telegram bot token not configured" },
                { status: 500 },
            );
        }

        return NextResponse.json(
            {
                error: "Failed to send Telegram notification",
                details: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 },
        );
    }
}
