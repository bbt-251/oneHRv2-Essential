// Telegram Bot helper functions using telegram-bot-kit
import { TelegramBot } from "telegram-bot-kit";

let bot: TelegramBot | null = null;

function getBot(): TelegramBot {
    if (!bot) {
        const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

        if (!BOT_TOKEN) {
            throw new Error(
                "Telegram bot token is not configured. Please set TELEGRAM_BOT_TOKEN in your environment variables.",
            );
        }

        bot = new TelegramBot(BOT_TOKEN);
    }

    return bot;
}

export function createContactKeyboard() {
    return {
        keyboard: [[{ text: "📱 Share Phone Number", request_contact: true }]],
        resize_keyboard: true,
        one_time_keyboard: true,
    };
}

type TelegramReplyMarkup =
    | {
          keyboard?: Array<Array<{ text: string; request_contact?: boolean }>>;
          resize_keyboard?: boolean;
          one_time_keyboard?: boolean;
      }
    | {
          inline_keyboard?: Array<Array<{ text: string; web_app?: { url: string } }>>;
          remove_keyboard?: boolean;
      };

export async function sendMessage(chatId: number, text: string, keyboard?: TelegramReplyMarkup) {
    try {
        const botInstance = getBot();
        return await botInstance.sendMessage(chatId, text, {
            reply_markup: keyboard,
            parse_mode: "HTML",
        });
    } catch (error) {
        console.error("Telegram sendMessage failed:", {
            error: error instanceof Error ? error.message : error,
            chatId,
            textLength: text.length,
        });
        throw error;
    }
}

export async function removeKeyboard(chatId: number) {
    console.log("Removing keyboard for chat:", chatId);
    try {
        const botInstance = getBot();
        // Try using the library first
        const result = await botInstance.sendMessage(chatId, " ", {
            reply_markup: { remove_keyboard: true },
        });
        console.log("Keyboard removal result:", result);
        return result;
    } catch (error) {
        console.error("Library keyboard removal failed:", error);
    }
}

export async function sendContactRequest(chatId: number) {
    const keyboard = createContactKeyboard();
    return sendMessage(
        chatId,
        "👋 Welcome to oneHR!\n\nTo continue, please share your phone number so we can verify your employee account.",
        keyboard,
    );
}

export async function sendAppLink(chatId: number, appUrl: string) {
    sendMessage(chatId, `✅ Phone verified and linked to your employee account!`, {
        remove_keyboard: true,
    });
    return sendMessage(chatId, `⬇️ Click below to open your oneHR dashboard:`, {
        inline_keyboard: [[{ text: "🚀 Open oneHR App", web_app: { url: appUrl } }]],
    });
}
