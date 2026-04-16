"use client";

import React, { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import { motion, AnimatePresence } from "framer-motion";
import { getAuth } from "firebase/auth";
import { Bot, Send, User, Copy, Check, Minimize2, Maximize2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Dialog,
    DialogContent,
    DialogTrigger,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";

interface AssistantResponse {
    response: string;
}

interface Message {
    role: "user" | "assistant";
    content: string;
    timestamp: Date;
}

// Quick reply suggestions
const QUICK_REPLIES = [
    "Show me top candidates",
    "What are the key skills needed?",
    "Summarize applicant pool",
    "Compare candidates",
];

// Typing Indicator with enhanced animation
const TypingIndicator = () => (
    <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        className="flex items-center gap-2 text-sm text-muted-foreground"
    >
        <div className="flex space-x-1.5">
            {[0, 1, 2].map(i => (
                <motion.div
                    key={i}
                    className="w-2 h-2 bg-primary rounded-full"
                    animate={{
                        y: [0, -6, 0],
                        scale: [1, 1.2, 1],
                    }}
                    transition={{
                        duration: 0.6,
                        repeat: Infinity,
                        delay: i * 0.15,
                        ease: "easeInOut",
                    }}
                />
            ))}
        </div>
        <span className="font-medium">AI is thinking...</span>
    </motion.div>
);

// Avatar Component
const Avatar = ({ isUser, className }: { isUser: boolean; className?: string }) => {
    return (
        <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
            className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-md",
                isUser
                    ? "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground"
                    : "bg-gradient-to-br from-accent-500 to-accent-600 text-white",
                className,
            )}
        >
            {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
        </motion.div>
    );
};

// Copy Button Component
const CopyButton = ({ content, className }: { content: string; className?: string }) => {
    const [copied, setCopied] = useState(false);
    const { toast } = useToast();

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(content);
            setCopied(true);
            toast({
                title: "Copied!",
                description: "Message copied to clipboard",
            });
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            toast({
                title: "Failed to copy",
                description: "Please try again",
                variant: "destructive",
            });
        }
    };

    return (
        <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleCopy}
            className={cn(
                "p-1.5 rounded-md hover:bg-background/80 transition-colors",
                "text-muted-foreground hover:text-foreground",
                className,
            )}
            aria-label="Copy message"
        >
            {copied ? (
                <Check className="w-3.5 h-3.5 text-green-500" />
            ) : (
                <Copy className="w-3.5 h-3.5" />
            )}
        </motion.button>
    );
};

// Timestamp Component
const Timestamp = ({ date }: { date: Date }) => {
    const formatTime = (date: Date) => {
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const minutes = Math.floor(diff / 60000);

        if (minutes < 1) return "Just now";
        if (minutes < 60) return `${minutes}m ago`;

        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;

        return date.toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
        });
    };

    return <span className="text-xs text-muted-foreground/70 font-medium">{formatTime(date)}</span>;
};

// Message Bubble Component with enhanced styling
const ChatMessage = ({
    content,
    isUser,
    timestamp,
}: {
    content: string;
    isUser: boolean;
    timestamp: Date;
}) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{
                duration: 0.3,
                ease: [0.4, 0, 0.2, 1],
            }}
            className={cn("flex gap-3 group", isUser ? "justify-end" : "justify-start")}
        >
            {!isUser && <Avatar isUser={false} />}

            <div className="flex flex-col gap-1.5 max-w-[85%] sm:max-w-[75%]">
                <motion.div
                    whileHover={{ scale: 1.01 }}
                    className={cn(
                        "relative rounded-2xl px-4 py-3 shadow-lg border backdrop-blur-md",
                        "transition-all duration-200",
                        isUser
                            ? "bg-gradient-to-br from-primary to-primary/90 text-primary-foreground border-primary/30 shadow-primary/20"
                            : "bg-white/80 dark:bg-gray-800/80 text-foreground border-border/50 shadow-gray-200/50 dark:shadow-gray-900/50",
                    )}
                >
                    {/* Glassmorphism effect */}
                    <div
                        className={cn(
                            "absolute inset-0 rounded-2xl opacity-50",
                            isUser
                                ? "bg-gradient-to-br from-white/10 to-transparent"
                                : "bg-gradient-to-br from-white/20 to-transparent dark:from-white/5",
                        )}
                    />

                    <div className="relative prose prose-sm max-w-none dark:prose-invert prose-headings:font-semibold prose-p:my-2 prose-ul:my-2 prose-ol:my-2">
                        <ReactMarkdown
                            rehypePlugins={[rehypeHighlight]}
                            components={{
                                code({ node, className, children, ...props }) {
                                    const isInline =
                                        node &&
                                        node.type === "element" &&
                                        node.tagName === "code" &&
                                        node.children &&
                                        node.position?.start?.line === node.position?.end?.line;
                                    const match = /language-(\w+)/.exec(className || "");
                                    return !isInline ? (
                                        <pre className="rounded-lg bg-background/95 dark:bg-gray-900/95 p-3 overflow-x-auto border text-xs font-mono my-2 shadow-inner">
                                            <code
                                                className={cn("text-foreground", className)}
                                                {...props}
                                            >
                                                {children}
                                            </code>
                                        </pre>
                                    ) : (
                                        <code
                                            className="px-1.5 py-0.5 rounded bg-muted/80 text-foreground font-mono text-xs border"
                                            {...props}
                                        >
                                            {children}
                                        </code>
                                    );
                                },
                                a: ({ children, href }) => (
                                    <a
                                        href={href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={cn(
                                            "underline font-medium transition-colors",
                                            isUser
                                                ? "text-primary-foreground/90 hover:text-primary-foreground"
                                                : "text-primary hover:text-primary/80",
                                        )}
                                    >
                                        {children}
                                    </a>
                                ),
                            }}
                        >
                            {content}
                        </ReactMarkdown>
                    </div>

                    {/* Copy button - appears on hover */}
                    <div className="absolute -right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <CopyButton content={content} />
                    </div>
                </motion.div>

                <div
                    className={cn(
                        "flex items-center gap-2 px-1",
                        isUser ? "justify-end" : "justify-start",
                    )}
                >
                    <Timestamp date={timestamp} />
                </div>
            </div>

            {isUser && <Avatar isUser={true} />}
        </motion.div>
    );
};

function RecruiterAssistantChat({ jobTitle }: { jobTitle: string }) {
    const [query, setQuery] = useState("");
    const [loading, setLoading] = useState(false);
    const [conversation, setConversation] = useState<Message[]>([]);
    const [isMinimized, setIsMinimized] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();

    // Auto-focus input on mount
    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        scrollToBottom();
    }, [conversation, loading]);

    const scrollToBottom = () => {
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
    };

    async function sendMessage(messageText?: string) {
        const messageToSend = messageText || query.trim();
        if (!messageToSend) return;

        const userMessage = messageToSend.trim();
        setQuery("");
        setConversation(prev => [
            ...prev,
            {
                role: "user",
                content: userMessage,
                timestamp: new Date(),
            },
        ]);
        setLoading(true);

        try {
            const auth = getAuth();
            const idToken = await auth.currentUser?.getIdToken();
            if (!idToken) throw new Error("Authentication required.");

            const resp = await fetch("/api/recruiter-assistant", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${idToken}`,
                },
                body: JSON.stringify({ jobTitle, query: userMessage }),
            });

            if (!resp.ok) {
                const error = await resp.json();
                throw new Error(error.error || "Failed to get response.");
            }

            const data: AssistantResponse = await resp.json();
            setConversation(prev => [
                ...prev,
                {
                    role: "assistant",
                    content: data.response,
                    timestamp: new Date(),
                },
            ]);
        } catch (error: any) {
            setConversation(prev => [
                ...prev,
                {
                    role: "assistant",
                    content: `*Error:* ${error.message}`,
                    timestamp: new Date(),
                },
            ]);
            toast({
                title: "Error",
                description: error.message || "Failed to get response",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
            // Refocus input after sending
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    return (
        <div className="flex flex-col h-full bg-gradient-to-br from-background via-background to-muted/20 dark:from-background dark:via-background dark:to-muted/10 relative overflow-hidden font-inter">
            {/* Glassmorphism background overlay */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.1),transparent_50%)] dark:bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.05),transparent_50%)] pointer-events-none" />

            <div className="relative flex flex-col h-full">
                {/* Messages Area with enhanced styling */}
                <ScrollArea className="flex-1 p-4 sm:p-6">
                    <div className="space-y-4 max-w-4xl mx-auto">
                        {conversation.length === 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-center py-12 sm:py-16"
                            >
                                <motion.div
                                    animate={{
                                        rotate: [0, 10, -10, 0],
                                        scale: [1, 1.1, 1],
                                    }}
                                    transition={{
                                        duration: 2,
                                        repeat: Infinity,
                                        repeatDelay: 3,
                                    }}
                                    className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 mb-4 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 backdrop-blur-sm border border-primary/20"
                                >
                                    <Sparkles className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
                                </motion.div>
                                <h3 className="text-lg sm:text-xl font-semibold mb-2 text-foreground">
                                    Recruiter AI Assistant
                                </h3>
                                <p className="text-sm sm:text-base text-muted-foreground max-w-md mx-auto">
                                    Ask me anything about candidates, metrics, or insights for this
                                    position.
                                </p>

                                {/* Quick reply buttons */}
                                <div className="mt-6 flex flex-wrap gap-2 justify-center max-w-2xl mx-auto">
                                    {QUICK_REPLIES.map((reply, idx) => (
                                        <motion.button
                                            key={idx}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.1 }}
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => sendMessage(reply)}
                                            className="px-4 py-2 text-sm rounded-xl bg-muted/80 hover:bg-muted border border-border/50 backdrop-blur-sm transition-all shadow-sm hover:shadow-md text-foreground font-medium"
                                        >
                                            {reply}
                                        </motion.button>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        <AnimatePresence mode="popLayout">
                            {conversation.map((msg, i) => (
                                <ChatMessage
                                    key={i}
                                    content={msg.content}
                                    isUser={msg.role === "user"}
                                    timestamp={msg.timestamp}
                                />
                            ))}
                            {loading && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    className="flex justify-start gap-3"
                                >
                                    <Avatar isUser={false} />
                                    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-2xl px-4 py-3 border border-border/50 shadow-lg">
                                        <TypingIndicator />
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div ref={messagesEndRef} />
                    </div>
                </ScrollArea>

                {/* Input Area with glassmorphism */}
                <div className="relative border-t border-border/50 bg-background/80 dark:bg-background/90 backdrop-blur-xl supports-[backdrop-filter]:bg-background/70 p-4 sm:p-6">
                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-background/95 to-transparent pointer-events-none" />

                    <div className="relative flex flex-col gap-3 max-w-4xl mx-auto">
                        <div className="flex gap-2 sm:gap-3">
                            <div className="relative flex-1">
                                <Input
                                    ref={inputRef}
                                    placeholder="Type your message... (Enter to send, Shift+Enter for newline)"
                                    value={query}
                                    onChange={e => setQuery(e.target.value)}
                                    onKeyDown={handleKeyPress}
                                    disabled={loading}
                                    className={cn(
                                        "rounded-xl bg-muted/50 dark:bg-muted/30 border-border/50",
                                        "focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:border-primary",
                                        "placeholder:text-muted-foreground/60",
                                        "text-sm sm:text-base",
                                        "backdrop-blur-sm",
                                        "font-medium",
                                        "pr-12",
                                    )}
                                />
                                {query && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground/60"
                                    >
                                        {query.length}
                                    </motion.div>
                                )}
                            </div>
                            <Button
                                onClick={() => sendMessage()}
                                disabled={loading || !query.trim()}
                                size="icon"
                                className={cn(
                                    "rounded-xl shrink-0 w-10 h-10 sm:w-12 sm:h-12",
                                    "bg-primary hover:bg-primary/90 text-primary-foreground",
                                    "shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30",
                                    "transition-all duration-200",
                                    "disabled:opacity-50 disabled:cursor-not-allowed",
                                )}
                            >
                                <motion.div
                                    animate={loading ? { rotate: 360 } : {}}
                                    transition={
                                        loading
                                            ? { duration: 1, repeat: Infinity, ease: "linear" }
                                            : {}
                                    }
                                >
                                    <Send className="w-4 h-4 sm:w-5 sm:h-5" />
                                </motion.div>
                            </Button>
                        </div>

                        {/* Quick replies when conversation exists */}
                        {conversation.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                className="flex flex-wrap gap-2 overflow-x-auto pb-1"
                            >
                                {QUICK_REPLIES.slice(0, 2).map((reply, idx) => (
                                    <motion.button
                                        key={idx}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => sendMessage(reply)}
                                        disabled={loading}
                                        className="px-3 py-1.5 text-xs sm:text-sm rounded-lg bg-muted/60 hover:bg-muted border border-border/30 backdrop-blur-sm transition-all text-foreground/80 hover:text-foreground font-medium whitespace-nowrap disabled:opacity-50"
                                    >
                                        {reply}
                                    </motion.button>
                                ))}
                            </motion.div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

// Enhanced Modal Component with minimize/maximize
export function RecruiterAssistantModal({ jobTitle }: { jobTitle: string }) {
    const [open, setOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 font-medium shadow-sm hover:shadow-md transition-shadow"
                >
                    <Bot className="w-4 h-4" />
                    <span className="hidden sm:inline">AI Assistant</span>
                    <span className="sm:hidden">AI</span>
                </Button>
            </DialogTrigger>

            <DialogContent
                className={cn(
                    "sm:max-w-5xl max-h-[90vh] h-full p-0 flex flex-col",
                    "backdrop-blur-xl bg-background/95 dark:bg-background/98",
                    "border-border/50 shadow-2xl",
                )}
            >
                <DialogHeader className="border-b border-border/50 px-6 py-4 bg-gradient-to-r from-background to-muted/20 backdrop-blur-sm">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center border border-primary/20">
                                <Bot className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
                                    Recruiter Assistant
                                </DialogTitle>
                                <DialogDescription className="text-sm text-muted-foreground mt-0.5">
                                    Ask questions about candidates and metrics in natural language.
                                </DialogDescription>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setIsMinimized(!isMinimized)}
                                className="h-8 w-8 rounded-lg"
                            >
                                {isMinimized ? (
                                    <Maximize2 className="w-4 h-4" />
                                ) : (
                                    <Minimize2 className="w-4 h-4" />
                                )}
                            </Button>
                        </div>
                    </div>
                </DialogHeader>

                <motion.div
                    animate={{
                        height: isMinimized ? 0 : "auto",
                        opacity: isMinimized ? 0 : 1,
                    }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="flex-1 overflow-hidden"
                >
                    <RecruiterAssistantChat jobTitle={jobTitle} />
                </motion.div>
            </DialogContent>
        </Dialog>
    );
}
