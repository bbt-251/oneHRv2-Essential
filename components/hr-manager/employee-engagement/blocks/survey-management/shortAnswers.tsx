"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, MessageSquare, Sparkles, Eye, User } from "lucide-react";
import { SurveyResponse } from "@/lib/models/survey";
import { DocumentData, onSnapshot, QuerySnapshot } from "firebase/firestore";
import { shortAnswerCollection } from "@/lib/backend/firebase/collections";
import ShortAnswerModel from "@/lib/models/short-answer";
import { useFirestore } from "@/context/firestore-context";
import getEmployeeFullName from "@/lib/util/getEmployeeFullName";
import { useToast } from "@/context/toastContext";
import GenerateUsingAISummarizedAnswer from "./generateUsingAISummarizedAnswer";

interface ShortAnswersProps {
    data: any;
    filteredSurveyResponses: SurveyResponse[];
}

interface ExtendedAnswer {
    questionId: string;
    answer: string;
    employeeID: string;
    fullName: string;
}

export default function ShortAnswers({ data, filteredSurveyResponses }: ShortAnswersProps) {
    const { showToast } = useToast();
    const { employees, shortAnswers } = useFirestore();

    const [dataSource, setDataSource] = useState<any[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [viewModalOpen, setViewModalOpen] = useState<boolean>(false);
    const [responses, setResponses] = useState<ExtendedAnswer[]>([]);
    const [selectedShortAnswer, setSelectedShortAnswer] = useState<ShortAnswerModel | null>(null);
    const [summaryModalOpen, setSummaryModalOpen] = useState<boolean>(false);

    useEffect(() => {
        const filteredSA = shortAnswers.filter(sa =>
            data?.listOfQuestions?.some(
                (q: any) => q.type === "Short Answer" && q.questionID === sa.id,
            ),
        );
        // For each short answer, we need to show individual questions
        const expandedQuestions: any[] = [];
        filteredSA.forEach(sa => {
            sa.questions.forEach(question => {
                expandedQuestions.push({
                    ...sa,
                    questionId: question.id,
                    questionTitle: question.question,
                    wordLimit: question.wordLimit,
                    shortAnswerId: sa.id,
                });
            });
        });
        setDataSource(expandedQuestions);
        setLoading(false);
    }, [data?.listOfQuestions, shortAnswers]);

    const handleViewAnswers = (questionData: any) => {
        const responses: ExtendedAnswer[] = [];
        filteredSurveyResponses.map(r => {
            r.answers.map(a => {
                if (
                    a.type === "Short Answer" &&
                    a.questionId.split(":")[1] === questionData.questionId
                ) {
                    const employee = employees.find(e => e.uid === r.uid);
                    const fullName = employee ? getEmployeeFullName(employee) : "Unknown";
                    responses.push({
                        questionId: a.questionId,
                        answer: a.answer,
                        employeeID: employee?.employeeID ?? "",
                        fullName,
                    });
                }
            });
        });
        if (responses.length) {
            setResponses(responses);
            setSelectedShortAnswer(questionData);
            setViewModalOpen(true);
        } else {
            showToast("No responses from employees", "Info", "warning");
        }
    };

    const handleGenerateSummary = (questionData: any) => {
        const responses: ExtendedAnswer[] = [];
        filteredSurveyResponses.map(r => {
            r.answers.map(a => {
                if (
                    a.type === "Short Answer" &&
                    a.questionId.split(":")[1] === questionData.questionId
                ) {
                    const employee = employees.find(e => e.uid === r.uid);
                    const fullName = employee ? getEmployeeFullName(employee) : "Unknown";
                    responses.push({
                        questionId: a.questionId,
                        answer: a.answer,
                        employeeID: r.uid,
                        fullName,
                    });
                }
            });
        });
        if (responses.length) {
            setResponses(responses);
            setSelectedShortAnswer(questionData);
            setSummaryModalOpen(true);
        } else {
            showToast("No responses from employees", "Info", "warning");
        }
    };

    return (
        <>
            <Card className="overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950 dark:to-purple-950">
                    <CardTitle className="flex items-center gap-2">
                        <div className="p-2 bg-indigo-100 dark:bg-indigo-900 rounded-lg">
                            <MessageSquare className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <span className="text-xl text-gray-900 dark:text-foreground">
                            Short Answers
                        </span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                    {loading ? (
                        <div className="flex justify-center items-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {dataSource.map(row => (
                                <Card
                                    key={`${row.shortAnswerId}-${row.questionId}`}
                                    className="border border-gray-200 dark:border-gray-700"
                                >
                                    <CardContent className="p-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <FileText className="h-4 w-4 text-gray-500" />
                                                    <h3 className="font-semibold text-gray-900 dark:text-foreground">
                                                        {row.questionTitle}
                                                    </h3>
                                                </div>
                                                <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-muted-foreground">
                                                    <span>From: {row.name}</span>
                                                    <span>
                                                        Word Limit: {row.wordLimit || "N/A"}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex-col gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleViewAnswers(row)}
                                                    className="mb-3 flex items-center gap-2"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                    View Answers
                                                </Button>
                                                <Button
                                                    variant="default"
                                                    size="sm"
                                                    onClick={() => handleGenerateSummary(row)}
                                                    className="flex items-center gap-2"
                                                    style={{
                                                        backgroundColor: "#363449",
                                                        color: "white",
                                                    }}
                                                >
                                                    <Sparkles className="h-4 w-4" />
                                                    Generate Summary
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
                <DialogContent className="max-w-4xl max-h-[85vh]">
                    <DialogHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 -m-6 mb-4 p-6 rounded-t-lg">
                        <DialogTitle className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                                <MessageSquare className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <span className="text-xl text-gray-900 dark:text-foreground">
                                    Short Answers: {selectedShortAnswer?.name}
                                </span>
                                <p className="text-sm text-gray-600 dark:text-muted-foreground mt-1">
                                    {responses.length} responses collected
                                </p>
                            </div>
                        </DialogTitle>
                    </DialogHeader>
                    <div className="max-h-[60vh] overflow-y-auto pr-4">
                        <div className="space-y-4">
                            {responses.map((response, index) => (
                                <Card
                                    key={index}
                                    className="border border-gray-200 dark:border-gray-700"
                                >
                                    <CardContent className="p-4">
                                        <div className="flex items-start gap-3">
                                            <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full">
                                                <User className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <h4 className="font-semibold text-gray-900 dark:text-foreground">
                                                        {response.fullName}
                                                    </h4>
                                                    <Badge variant="outline" className="text-xs">
                                                        {response.employeeID}
                                                    </Badge>
                                                </div>
                                                <div className="bg-gray-50 dark:bg-muted p-3 rounded-lg">
                                                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                                                        {response.answer}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <GenerateUsingAISummarizedAnswer
                open={summaryModalOpen}
                setOpen={setSummaryModalOpen}
                shortAnswers={responses.map(r => r.answer)}
            />
        </>
    );
}
