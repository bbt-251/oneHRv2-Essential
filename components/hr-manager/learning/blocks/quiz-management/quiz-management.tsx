"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, BookOpen, HelpCircle, FileText } from "lucide-react";
import { useRouter } from "next/navigation";
import { MultipleChoiceManager } from "./blocks/multiple-choice-manager";
import ShortAnswerManager from "./blocks/short-answer-manager";
import { QuizDefinition } from "./blocks/quiz-definition";

export default function QuizManagement() {
    const [activeTab, setActiveTab] = useState<
        "quiz-definition" | "multiple-choice" | "short-answer"
    >("quiz-definition");
    const router = useRouter();

    return (
        <div className="space-y-6 p-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        onClick={() => router.back()}
                        className="text-brand-600 hover:text-brand-700"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Learning Management
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-brand-800 dark:text-white">
                            Quiz Management
                        </h1>
                        <p className="text-brand-600 dark:text-brand-300">
                            Create and manage quizzes for training materials
                        </p>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <Tabs
                value={activeTab}
                onValueChange={tab =>
                    setActiveTab(tab as "quiz-definition" | "multiple-choice" | "short-answer")
                }
                className="space-y-6"
            >
                <TabsList className="grid w-full grid-cols-3 bg-brand-50 dark:bg-brand-900">
                    <TabsTrigger value="quiz-definition" className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4" />
                        Quiz Definition
                    </TabsTrigger>
                    <TabsTrigger value="multiple-choice" className="flex items-center gap-2">
                        <HelpCircle className="h-4 w-4" />
                        Multiple Choice
                    </TabsTrigger>
                    <TabsTrigger value="short-answer" className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Short Answer
                    </TabsTrigger>
                </TabsList>

                {/* Quiz Definition Tab */}
                <TabsContent value="quiz-definition" className="space-y-6">
                    <QuizDefinition />
                </TabsContent>

                {/* Multiple Choice Tab */}
                <TabsContent value="multiple-choice" className="space-y-6">
                    <MultipleChoiceManager />
                </TabsContent>

                {/* Short Answer Tab */}
                <TabsContent value="short-answer" className="space-y-6">
                    <ShortAnswerManager />
                </TabsContent>
            </Tabs>
        </div>
    );
}
