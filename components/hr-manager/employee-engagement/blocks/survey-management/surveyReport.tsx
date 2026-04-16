"use client";

import { useEffect, useState } from "react";
import { SurveyModel } from "@/lib/models/survey";
import { SurveyResponse } from "@/lib/models/survey";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3, PieChart, FileText, TrendingUp } from "lucide-react";
import { useFirestore } from "@/context/firestore-context";
import PollResultPieChart from "./index";

interface Props {
    survey: SurveyModel;
    surveyResponses: SurveyResponse[];
}

export interface QuestionsModel {
    id: string;
    type: "Multiple Choice" | "Short Answer" | "Common Answer";
    multipleChoiceID: string | null;
    commonAnswerID: string | null;
    questionID: string;
    questionTitle: string;
    choices: string[];
    wordCount: number | null;
}

export default function SurveyReport({ survey, surveyResponses }: Props) {
    const { hrSettings, commonAnswers, multipleChoices } = useFirestore();

    const [isPieChart, setIsPieChart] = useState(false);
    const [inTransition, setInTransition] = useState(false);

    const [filteredSurveyResponses, setFilteredSurveyResponses] = useState<SurveyResponse[]>([]);
    useEffect(() => {
        setFilteredSurveyResponses(surveyResponses);
    }, [surveyResponses]);

    const [allQuestions, setAllQuestions] = useState<QuestionsModel[]>([]);
    useEffect(() => {
        const questions: QuestionsModel[] = [];
        if (survey) {
            survey.listOfQuestions.forEach(question => {
                if (question.type === "Multiple Choice") {
                    const thisQuestion = multipleChoices.find(
                        doc => doc.id === question.questionID,
                    );
                    thisQuestion &&
                        thisQuestion.questions.forEach(q => {
                            questions.push({
                                id: q.id,
                                multipleChoiceID: thisQuestion.id,
                                commonAnswerID: null,
                                type: "Multiple Choice",
                                questionID: q.id,
                                questionTitle: q.question,
                                choices: q.choices,
                                wordCount: null,
                            });
                        });
                }

                if (question.type === "Common Answer") {
                    const thisQuestion = commonAnswers.find(doc => doc.id === question.questionID);
                    thisQuestion &&
                        thisQuestion.questions.forEach(q => {
                            const choices =
                                hrSettings.commonAnswerTypes.find(c => c.id == q.answerType)
                                    ?.answers || [];
                            questions.push({
                                id: q.qID,
                                multipleChoiceID: null,
                                commonAnswerID: thisQuestion.id,
                                type: "Common Answer",
                                questionID: q.qID,
                                questionTitle: q.qTitle,
                                choices: choices,
                                wordCount: null,
                            });
                        });
                }
            });
        }

        setAllQuestions(questions);
    }, [hrSettings, commonAnswers, survey, multipleChoices]);

    const [currentPage, setCurrentPage] = useState(1);
    const questionsPerPage = 2;

    const totalQuestionsCount = allQuestions.length;

    const currentQuestions = allQuestions.slice(
        (currentPage - 1) * questionsPerPage,
        currentPage * questionsPerPage,
    );

    const handleViewChange = (checked: boolean) => {
        setInTransition(true);
        setTimeout(() => {
            setIsPieChart(checked);
            setInTransition(false);
        }, 200);
    };

    const totalResponses = filteredSurveyResponses.length;
    const totalQuestions = allQuestions.length;

    return (
        <div className="space-y-6">
            {/* Header with View Toggle */}
            <Card className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950 dark:to-blue-950">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                                <BarChart3 className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                            </div>
                            <div>
                                <CardTitle className="text-xl text-gray-900 dark:text-foreground">
                                    Survey Analytics
                                </CardTitle>
                                <p className="text-sm text-gray-600 dark:text-muted-foreground">
                                    Detailed response breakdown and insights
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center space-x-2">
                                <FileText className="h-4 w-4 text-gray-500" />
                                <label htmlFor="view-toggle" className="text-sm font-medium">
                                    Form data
                                </label>
                                <Switch
                                    id="view-toggle"
                                    className="!bg-gray-600"
                                    onCheckedChange={handleViewChange}
                                />
                                <PieChart className="h-4 w-4 text-gray-500" />
                                <label htmlFor="view-toggle" className="text-sm font-medium">
                                    Pie chart
                                </label>
                            </div>
                        </div>
                    </div>
                </CardHeader>
            </Card>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600 dark:text-muted-foreground">
                                    Total Responses
                                </p>
                                <p className="text-2xl font-bold text-blue-600">{totalResponses}</p>
                            </div>
                            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                                <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600 dark:text-muted-foreground">
                                    Questions Analyzed
                                </p>
                                <p className="text-2xl font-bold text-green-600">
                                    {totalQuestionsCount}
                                </p>
                            </div>
                            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                                <FileText className="h-5 w-5 text-green-600 dark:text-green-400" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Questions Analysis */}
            <div className="space-y-6">
                {allQuestions.map((question, index) => {
                    if (question.type === "Multiple Choice") {
                        const answers: any = {};
                        filteredSurveyResponses.map(sr => {
                            sr.answers.map(a => {
                                if (
                                    a.type === "Multiple Choice" &&
                                    a?.questionId?.split(":")?.at(1) === question.questionID
                                ) {
                                    answers[a.answer] = (answers[a.answer] || 0) + 1;
                                }
                            });
                        });

                        const totalNumberOfAns = Object.keys(answers).reduce(
                            (acc, key) => acc + answers[key],
                            0,
                        );
                        const getResponsePercentage = (choiceID: string) => {
                            return (
                                (totalNumberOfAns > 0
                                    ? Math.round(
                                        ((answers[choiceID] ?? 0) * 100) / totalNumberOfAns,
                                    ) / 100
                                    : 0) * 100
                            );
                        };

                        return (
                            <Card
                                key={question.questionID}
                                style={{
                                    display: currentQuestions.some(
                                        q => q.questionID === question.questionID,
                                    )
                                        ? "block"
                                        : "none",
                                }}
                                className="overflow-hidden"
                            >
                                <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950">
                                    <CardTitle className="flex items-center gap-2">
                                        <Badge
                                            variant="outline"
                                            className="bg-blue-100 text-blue-700 border-blue-200"
                                        >
                                            Multiple Choice
                                        </Badge>
                                        <span className="text-lg">{question.questionTitle}</span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-6">
                                    {isPieChart ? (
                                        <PollResultPieChart
                                            question={question}
                                            questionType="Multiple Choice"
                                            getResponsePercentage={getResponsePercentage}
                                        />
                                    ) : (
                                        <div className="space-y-4">
                                            {question.choices.map((choice: string) => {
                                                const percentage = getResponsePercentage(choice);
                                                return (
                                                    <div key={choice} className="space-y-2">
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-sm font-medium">
                                                                {choice}
                                                            </span>
                                                            <span className="text-sm text-gray-600 dark:text-muted-foreground">
                                                                {percentage.toFixed(1)}% (
                                                                {answers[choice] || 0} responses)
                                                            </span>
                                                        </div>
                                                        <div className="relative">
                                                            <Progress
                                                                value={percentage}
                                                                className="w-full h-3"
                                                            />
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        );
                    } else if (question.type === "Common Answer") {
                        const answers: any = {};
                        filteredSurveyResponses.map(sr =>
                            sr.answers.map(a => {
                                if (
                                    a.type === "Common Answer" &&
                                    a?.questionId?.split(":")?.at(1) === question.questionID
                                ) {
                                    answers[a.answer] = (answers[a.answer] || 0) + 1;
                                }
                            }),
                        );

                        const totalNumberOfAns = Object.keys(answers).reduce(
                            (acc, key) => acc + answers[key],
                            0,
                        );
                        const getResponsePercentage = (choiceID: string) => {
                            return (
                                (totalNumberOfAns > 0
                                    ? Math.round(
                                        ((answers[choiceID] ?? 0) * 100) / totalNumberOfAns,
                                    ) / 100
                                    : 0) * 100
                            );
                        };

                        return (
                            <Card
                                key={index}
                                style={{
                                    display: currentQuestions.some(
                                        q => q.questionID === question.questionID,
                                    )
                                        ? "block"
                                        : "none",
                                }}
                                className="overflow-hidden"
                            >
                                <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950">
                                    <CardTitle className="flex items-center gap-2">
                                        <Badge
                                            variant="outline"
                                            className="bg-green-100 text-green-700 border-green-200"
                                        >
                                            Common Answer
                                        </Badge>
                                        <span className="text-lg">{question.questionTitle}</span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-6">
                                    {isPieChart ? (
                                        <PollResultPieChart
                                            question={question}
                                            questionType="Common Answer"
                                            getResponsePercentage={getResponsePercentage}
                                        />
                                    ) : (
                                        <div className="space-y-4">
                                            {question.choices.map(choice => {
                                                const percentage = getResponsePercentage(choice);
                                                return (
                                                    <div key={choice} className="space-y-2">
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-sm font-medium">
                                                                {choice}
                                                            </span>
                                                            <span className="text-sm text-gray-600 dark:text-muted-foreground">
                                                                {percentage.toFixed(1)}% (
                                                                {answers[choice] || 0} responses)
                                                            </span>
                                                        </div>
                                                        <div className="relative">
                                                            <Progress
                                                                value={percentage}
                                                                className="w-full h-3"
                                                            />
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        );
                    }
                    return null;
                })}
            </div>

            {/* Pagination */}
            {totalQuestionsCount > questionsPerPage && (
                <div className="flex justify-center items-center space-x-4 p-4">
                    <Button
                        variant="outline"
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="flex items-center gap-2"
                    >
                        Previous
                    </Button>
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">Page</span>
                        <Badge variant="secondary" className="px-3 py-1">
                            {currentPage} of {Math.ceil(totalQuestionsCount / questionsPerPage)}
                        </Badge>
                    </div>
                    <Button
                        variant="outline"
                        onClick={() =>
                            setCurrentPage(
                                Math.min(
                                    Math.ceil(totalQuestionsCount / questionsPerPage),
                                    currentPage + 1,
                                ),
                            )
                        }
                        disabled={currentPage === Math.ceil(totalQuestionsCount / questionsPerPage)}
                        className="flex items-center gap-2"
                    >
                        Next
                    </Button>
                </div>
            )}
        </div>
    );
}
