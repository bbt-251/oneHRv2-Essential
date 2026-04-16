"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Sparkles, Loader2, RefreshCw } from "lucide-react";

interface GenerateUsingAISummarizedAnswerProps {
    open: boolean;
    setOpen: (val: boolean) => void;
    shortAnswers: string[];
}

export default function GenerateUsingAISummarizedAnswer({
    open,
    setOpen,
    shortAnswers,
}: GenerateUsingAISummarizedAnswerProps) {
    const [loading, setLoading] = useState<boolean>(true);
    const [result, setResult] = useState<string>("");

    const apiCall = async (shortAnswers: string[]) => {
        try {
            const response = await fetch("/api/short-answer-summarize", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ shortAnswers }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            const { result } = data;
            return result;
        } catch (error) {
            console.error("Error:", error);
            return "Failed to generate summary. Please try again.";
        }
    };

    useEffect(() => {
        if (!open) {
            setLoading(true);
            setResult("");
        }
        if (shortAnswers && open === true) {
            (async () => {
                await apiCall(shortAnswers).then(res => {
                    try {
                        setLoading(false);
                        setResult(res);
                    } catch (err) {
                        console.error("Error:", err);
                        setLoading(false);
                        setResult("Please regenerate the summary.");
                    }
                });
            })();
        }
    }, [open, shortAnswers]);

    const handleRegenerate = async () => {
        setLoading(true);
        setResult("");

        await apiCall(shortAnswers).then(res => {
            try {
                setLoading(false);
                setResult(res);
            } catch (err) {
                console.error("Error:", err);
                setLoading(false);
                setResult("Please regenerate the summary.");
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="max-w-4xl max-h-[85vh]">
                <DialogHeader className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950 dark:to-indigo-950 -m-6 mb-4 p-6 rounded-t-lg">
                    <DialogTitle className="flex items-center gap-3">
                        <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                            <Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                            <span className="text-xl text-gray-900 dark:text-foreground">
                                AI-Generated Summary
                            </span>
                            <p className="text-sm text-gray-600 dark:text-muted-foreground mt-1">
                                Intelligent analysis of employee responses
                            </p>
                        </div>
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    <Separator />

                    <ScrollArea className="h-[50vh] w-full">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center h-full space-y-4">
                                <div className="relative">
                                    <Loader2 className="h-12 w-12 animate-spin text-purple-600" />
                                    <div className="absolute inset-0 rounded-full border-2 border-purple-200 animate-pulse"></div>
                                </div>
                                <p className="text-gray-600 dark:text-muted-foreground">
                                    Generating AI summary...
                                </p>
                            </div>
                        ) : (
                            <Card className="border border-gray-200 dark:border-gray-700">
                                <CardContent className="p-6">
                                    <div className="prose prose-gray dark:prose-invert max-w-none">
                                        <div className="whitespace-pre-wrap text-gray-700 dark:text-gray-300 leading-relaxed">
                                            {result}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </ScrollArea>

                    <Separator />

                    <div className="flex justify-end">
                        <Button
                            onClick={handleRegenerate}
                            disabled={loading}
                            className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                        >
                            {loading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <RefreshCw className="h-4 w-4" />
                            )}
                            {loading ? "Generating..." : "Regenerate Summary"}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
