"use client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/authContext";
import { useFirestore } from "@/context/firestore-context";
import { useToast } from "@/context/toastContext";
import { updateQuiz } from "@/lib/backend/api/training/quiz.ts";
import { QuizAnswerModel, QuizModel } from "@/lib/models/quiz.ts";
import { TrainingMaterialModel } from "@/lib/models/training-material";
import { timestampFormat } from "@/lib/util/dayjs_format";
import dayjs from "dayjs";
import { AlertCircle, ArrowLeft, CheckCircle, Clock, Loader2, Trophy } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import NoQuiz from "./no-quiz";

export type QuizType = "multiple-choice" | "true-false" | "short-answer";

export interface QuestionsModel {
    id: string;
    type: "multiple-choice" | "short-answer";
    question: string;
    options: string[] | null;
    correctAnswer: number | null;
    wordLimit: number | null;
}

// Sample quiz questions
export const quizQuestions = [
    {
        id: "qz-001",
        quizTitle: "Quiz one",
        type: "multiple-choice",
        question: "What is the primary benefit of using React components?",
        options: [
            "Better performance",
            "Code reusability and maintainability",
            "Smaller bundle size",
            "Faster development time",
        ],
        correctAnswer: "Code reusability and maintainability",
    },
    {
        id: "qz-002",
        quizTitle: "Quiz two",
        type: "multiple-choice",
        question: "Which hook is used for managing state in functional components?",
        options: ["useEffect", "useState", "useContext", "useReducer"],
        correctAnswer: "useState",
    },
    {
        id: "qz-003",
        quizTitle: "Quiz three",
        type: "short-answer",
        question:
            "Explain the concept of 'props' in React and provide a brief example of how they are used.",
        correctAnswer: "Props are properties passed from parent to child components",
    },
    {
        id: "qz-004",
        quizTitle: "Quiz four",
        type: "multiple-choice",
        question: "What is the purpose of the useEffect hook?",
        options: [
            "To manage component state",
            "To handle side effects and lifecycle events",
            "To create custom hooks",
            "To optimize performance",
        ],
        correctAnswer: "To handle side effects and lifecycle events",
    },
    {
        id: "qz-005",
        quizTitle: "Quiz five",
        type: "short-answer",
        question:
            "Describe a scenario where you would use the useContext hook instead of prop drilling.",
        correctAnswer: "When passing data through multiple component levels",
    },
];

export function QuizInterface() {
    const router = useRouter();
    const { showToast } = useToast();
    const { userData } = useAuth();
    const { quizzes, multipleChoices, shortAnswers, trainingMaterials } = useFirestore();
    const params = useSearchParams();
    const id = params.get("id");
    const trainingId = params.get("training");

    const [quiz, setQuiz] = useState<QuizModel | null>(null);
    const [material, setMaterial] = useState<TrainingMaterialModel | null>(null);
    const [quizQuestions, setQuizQuestions] = useState<QuestionsModel[]>([]);
    const [quizStarted, setQuizStarted] = useState(false);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [answers, setAnswers] = useState<{ [key: string]: string | number }>({});
    const [timeRemaining, setTimeRemaining] = useState<number | null>(null); // in seconds
    const [quizCompleted, setQuizCompleted] = useState(false);
    const [quizTakenBefore, setQuizTakenBefore] = useState(false);
    const [quizRetaking, setQuizRetaking] = useState(false);
    const [quizSubmitting, setQuizSubmitting] = useState(false);
    const [score, setScore] = useState(0);

    useEffect(() => {
        const questions: QuestionsModel[] = [];
        const quiz = quizzes.find(quiz => quiz.id == id);
        if (quiz) {
            const takenQuiz = quiz.quizTakenTimestamp?.find(q => q.employeeUid == userData?.uid);
            setQuiz(quiz);
            setQuizTakenBefore(takenQuiz ? true : false);
            setScore(takenQuiz?.score ?? 0);
            if (quiz.questionTimerEnabled && takenQuiz) {
                setTimeRemaining(takenQuiz.timeRemaining);
            } else if (quiz.questionTimerEnabled) {
                setTimeRemaining(quiz.timer * 60);
            }
        }

        // populating multiple questions
        quiz?.multipleChoice?.map(mcId => {
            const multipleChoice = multipleChoices.find(mc => mc.id == mcId);
            multipleChoice?.questions?.map(question => {
                questions.push({
                    id: question.id,
                    type: "multiple-choice",
                    question: question.question,
                    options: question.choices,
                    correctAnswer: question.correctAnswerIndex,
                    wordLimit: null,
                });
            });
        });

        // populating short answers
        quiz?.shortAnswer?.map(sh => {
            const shortAnswer = shortAnswers.find(s => s.id == sh.id);
            shortAnswer?.questions?.map(question => {
                questions.push({
                    id: question.id,
                    type: "short-answer",
                    question: question.question,
                    wordLimit: question.wordLimit ?? null,
                    options: null,
                    correctAnswer: null,
                });
            });
        });

        setQuizQuestions(questions);
    }, [id, multipleChoices, quizzes, shortAnswers]);

    useEffect(() => {
        setMaterial(trainingMaterials.find(tm => tm.id == trainingId) ?? null);
    }, [trainingMaterials]);

    // Timer effect
    useEffect(() => {
        if (timeRemaining !== null && quiz?.questionTimerEnabled) {
            if (quizStarted && !quizCompleted && timeRemaining > 0) {
                const timer = setInterval(() => {
                    setTimeRemaining(prev => (prev ?? 0) - 1);
                }, 1000);
                return () => clearInterval(timer);
            } else if (timeRemaining === 0 && !quizCompleted) {
                handleSubmitQuiz();
            }
        }
    }, [quizStarted, quizCompleted, timeRemaining, quiz?.questionTimerEnabled, quizRetaking]);

    const formatTime = (seconds: number) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
    };

    const handleStartQuiz = () => {
        setQuizStarted(true);
        if (quiz?.questionTimerEnabled && quiz?.timer) {
            setTimeRemaining(quiz.timer * 60);
        }
    };

    const handleAnswerChange = (questionId: string, answer: string | number) => {
        setAnswers({ ...answers, [questionId]: answer });
    };

    const handleNextQuestion = () => {
        if (currentQuestion < quizQuestions.length - 1) {
            setCurrentQuestion(currentQuestion + 1);
        }
    };

    const handlePreviousQuestion = () => {
        if (currentQuestion > 0) {
            setCurrentQuestion(currentQuestion - 1);
        }
    };

    const handleSubmitQuiz = async () => {
        setQuizSubmitting(true);
        const answer: QuizAnswerModel[] = [];

        quizQuestions.forEach(question => {
            const userAnswer = answers[question.id];
            if (question.type == "short-answer") {
                answer.push({
                    questionId: question.id,
                    employeeUid: userData?.uid ?? "",
                    questionType: question.type,
                    answer: userAnswer,
                    answerScore: 0,
                });
            } else if (question.type == "multiple-choice") {
                answer.push({
                    questionId: question.id,
                    employeeUid: userData?.uid ?? "",
                    questionType: question.type,
                    answer: userAnswer,
                    answerScore: question.correctAnswer == userAnswer ? 100 : 0,
                });
            }
        });

        // call gpt api to mark the short answers
        const shortAnswersToEvaluate = answer
            .filter(a => a.questionType === "short-answer")
            .map(a => {
                const question = quizQuestions.find(q => q.id === a.questionId);
                return {
                    id: a.questionId,
                    question: question?.question || "",
                    answer: a.answer as string,
                };
            });

        if (shortAnswersToEvaluate.length > 0) {
            try {
                const res = await fetch("/api/evaluate-quiz", {
                    method: "POST",
                    body: JSON.stringify(shortAnswersToEvaluate),
                    headers: { "Content-Type": "application/json" },
                });
                const scores = await res.json();
                console.log(scores, "scores");
                scores.forEach((score: { id: string; score: number }) => {
                    const ans = answer.find(a => a.questionId === score.id);
                    if (ans) {
                        ans.answerScore = score.score;
                    }
                });
            } catch (error) {
                console.error("Error evaluating short answers:", error);
                // Optionally show toast or handle error
            }
        }

        const total = answer.reduce((acc, ans) => acc + ans.answerScore, 0);
        const finalScore = answer.length > 0 ? total / answer.length : 0;

        if (quizTakenBefore == false) {
            const othersAns = quiz?.quizAnswers?.filter(a => a.employeeUid != userData?.uid) ?? [];
            const othersTimestamp =
                quiz?.quizTakenTimestamp?.filter(a => a.employeeUid != userData?.uid) ?? [];
            const res = await updateQuiz({
                id: quiz?.id ?? "",
                quizAnswers: [...othersAns, ...answer],
                quizTakenTimestamp: [
                    ...othersTimestamp,
                    {
                        employeeUid: userData?.uid ?? "",
                        timestamp: dayjs().format(timestampFormat),
                        timeRemaining: timeRemaining ?? 0,
                        score: finalScore,
                    },
                ],
            });
            if (res) {
                showToast("Quiz submitted successfully", "Success", "success");
            } else {
                showToast("Error submitting quiz", "Error", "error");
            }
        }

        setScore(finalScore);
        setQuizCompleted(true);
        setQuizSubmitting(false);
    };

    const currentQuestionData = quizQuestions[currentQuestion];

    //No quiz screen
    if (quizQuestions.length == 0 && material) {
        return (
            <NoQuiz
                onBack={() => {
                    router.push(`training-viewer?id=${trainingId}`);
                }}
                material={material}
            />
        );
    }

    // Confirmation screen
    if (!quizStarted && !quizTakenBefore) {
        return (
            <div className="space-y-6 p-6 max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex items-center gap-4 pb-4 border-b border-brand-200 dark:border-brand-800">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                            router.push(`training-viewer?id=${trainingId}`);
                        }}
                        className="flex items-center gap-2"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Training
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-brand-800 dark:text-white">
                            Knowledge Check Quiz
                        </h1>
                        <p className="text-brand-600 dark:text-brand-300">{material?.name}</p>
                    </div>
                </div>

                {/* Confirmation Card */}
                <Card className="border-brand-200 dark:border-brand-800 max-w-2xl mx-auto">
                    <CardHeader className="text-center">
                        <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle className="h-8 w-8 text-blue-600" />
                        </div>
                        <CardTitle className="text-xl text-brand-800 dark:text-white">
                            Ready to Start Your Quiz?
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="bg-brand-50 dark:bg-brand-900 rounded-lg p-4 space-y-3">
                            <h3 className="font-semibold text-brand-800 dark:text-white">
                                Quiz Information:
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                {quiz?.questionTimerEnabled ? (
                                    <div className="flex items-center gap-2">
                                        <Clock className="h-4 w-4 text-brand-600" />
                                        <span className="text-brand-600 dark:text-brand-300">
                                            Duration: {`${quiz.timer} minute(s)`}
                                        </span>
                                    </div>
                                ) : (
                                    <></>
                                )}
                                <div className="flex items-center gap-2">
                                    <CheckCircle className="h-4 w-4 text-brand-600" />
                                    <span className="text-brand-600 dark:text-brand-300">
                                        Questions: {quizQuestions.length}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <AlertCircle className="h-4 w-4 text-brand-600" />
                                    <span className="text-brand-600 dark:text-brand-300">
                                        {["multiple-choice", "short-answer"].every(t =>
                                            quizQuestions.some(q => q.type === t),
                                        )
                                            ? "Mixed question types"
                                            : "Single question type"}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Trophy className="h-4 w-4 text-brand-600" />
                                    <span className="text-brand-600 dark:text-brand-300">
                                        Passing score: {quiz?.passingRate}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                                <div>
                                    <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-1">
                                        Important Instructions:
                                    </h4>
                                    <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                                        <li>• Once started, the timer cannot be paused</li>
                                        <li>• You can navigate between questions freely</li>
                                        <li>• Make sure you have a stable internet connection</li>
                                        <li>• Review your answers before final submission</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 pt-4">
                            <Button
                                variant="outline"
                                // onClick={() =>
                                //     // onNavigate("training-viewer", material)
                                // }
                                className="flex-1"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleStartQuiz}
                                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                            >
                                Start Quiz
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Quiz completed screen
    if (quizCompleted || (quizTakenBefore && !quizRetaking)) {
        return (
            <div className="space-y-6 p-6 max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex items-center gap-4 pb-4 border-b border-brand-200 dark:border-brand-800">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`training-viewer?id=${trainingId}`)}
                        className="flex items-center gap-2"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Training
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-brand-800 dark:text-white">
                            Quiz Results
                        </h1>
                        <p className="text-brand-600 dark:text-brand-300">{material?.name}</p>
                    </div>
                </div>

                {/* Results Card */}
                <Card className="border-brand-200 dark:border-brand-800 max-w-2xl mx-auto">
                    <CardHeader className="text-center">
                        <div
                            className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${
                                score >= (quiz?.passingRate ?? 0)
                                    ? "bg-green-100 dark:bg-green-900"
                                    : "bg-red-100 dark:bg-red-900"
                            }`}
                        >
                            {score >= (quiz?.passingRate ?? 0) ? (
                                <Trophy className="h-10 w-10 text-green-600" />
                            ) : (
                                <AlertCircle className="h-10 w-10 text-red-600" />
                            )}
                        </div>
                        <CardTitle className="text-2xl text-brand-800 dark:text-white">
                            {score >= (quiz?.passingRate ?? 0)
                                ? "Congratulations!"
                                : "Quiz Complete"}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="text-center">
                            <div className="text-4xl font-bold text-brand-800 dark:text-white mb-2">
                                {score.toFixed(2)}%
                            </div>
                            <Badge
                                variant={
                                    score >= (quiz?.passingRate ?? 0) ? "default" : "destructive"
                                }
                                className="text-sm"
                            >
                                {score >= (quiz?.passingRate ?? 0) ? "PASSED" : "NEEDS IMPROVEMENT"}
                            </Badge>
                        </div>

                        <div className="bg-brand-50 dark:bg-black dark:border dark:border-gray-700 rounded-lg p-4 space-y-3">
                            <h3 className="font-semibold text-brand-800 dark:text-white">
                                Quiz Summary:
                            </h3>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="text-brand-600 dark:text-brand-300">
                                        Total Questions:
                                    </span>
                                    <div className="font-medium text-brand-800 dark:text-white">
                                        {quizQuestions.length}
                                    </div>
                                </div>
                                <div>
                                    <span className="text-brand-600 dark:text-brand-300">
                                        Correct Answers:
                                    </span>
                                    <div className="font-medium text-brand-800 dark:text-white">
                                        {((score / 100) * quizQuestions.length).toFixed(2)}
                                    </div>
                                </div>
                                {quiz?.questionTimerEnabled && timeRemaining != null ? (
                                    <div>
                                        <span className="text-brand-600 dark:text-brand-300">
                                            Time Taken:
                                        </span>
                                        <div className="font-medium text-brand-800 dark:text-white">
                                            {formatTime(quiz.timer * 60 - timeRemaining)}
                                        </div>
                                    </div>
                                ) : (
                                    <></>
                                )}
                                <div>
                                    <span className="text-brand-600 dark:text-brand-300">
                                        Passing Score:
                                    </span>
                                    <div className="font-medium text-brand-800 dark:text-white">
                                        70%
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 pt-4">
                            <Button
                                variant="outline"
                                onClick={() => router.push(`training-viewer?id=${trainingId}`)}
                                className="flex-1"
                            >
                                Back to Training
                            </Button>

                            <Button
                                onClick={() => {
                                    setQuizStarted(true);
                                    setQuizCompleted(false);
                                    setCurrentQuestion(0);
                                    setAnswers({});
                                    setScore(0);
                                    setQuizRetaking(true);
                                    if (quiz?.questionTimerEnabled) {
                                        setTimeRemaining(quiz.timer * 60);
                                    }
                                }}
                                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                            >
                                Retake Quiz
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Quiz interface
    return (
        <div className="space-y-6 p-6 max-w-4xl mx-auto">
            {/* Header with Timer */}
            <div className="flex items-center justify-between pb-4 border-b border-brand-200 dark:border-brand-800">
                <div className="flex items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-brand-800 dark:text-white">
                            Knowledge Check Quiz
                        </h1>
                        <p className="text-brand-600 dark:text-brand-300">{material?.name}</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    {quiz?.questionTimerEnabled && timeRemaining != null ? (
                        <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">
                            <Clock className="h-4 w-4 text-red-600" />
                            <span className="font-mono text-red-600 font-medium">
                                {formatTime(timeRemaining)}
                            </span>
                        </div>
                    ) : (
                        <></>
                    )}
                    <Badge variant="outline">
                        {currentQuestion + 1} of {quizQuestions.length}
                    </Badge>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-brand-100 dark:bg-brand-800 rounded-full h-2">
                <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{
                        width: `${((currentQuestion + 1) / quizQuestions.length) * 100}%`,
                    }}
                />
            </div>

            {/* Question Card */}
            <Card className="border-brand-200 dark:border-brand-800">
                <CardHeader>
                    <CardTitle className="text-lg text-brand-800 dark:text-white">
                        Question {currentQuestion + 1}
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="text-brand-800 dark:text-white text-base leading-relaxed">
                        {currentQuestionData.question}
                    </div>

                    {currentQuestionData.type === "multiple-choice" ? (
                        <div className="space-y-3">
                            {currentQuestionData.options?.map((option, index) => (
                                <label
                                    key={index}
                                    className="flex items-center gap-3 p-3 border border-brand-200 dark:border-brand-700 rounded-lg cursor-pointer hover:bg-brand-50 dark:hover:bg-brand-900 transition-colors"
                                >
                                    <input
                                        type="radio"
                                        name={`question-${currentQuestionData.id}`}
                                        value={option}
                                        checked={answers[currentQuestionData.id] === index}
                                        onChange={e =>
                                            handleAnswerChange(currentQuestionData.id, index)
                                        }
                                        className="w-4 h-4 text-blue-600"
                                    />
                                    <span className="text-brand-800 dark:text-white">{option}</span>
                                </label>
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-brand-800 dark:text-white">
                                Your Answer:
                            </label>
                            <Textarea
                                placeholder="Type your answer here..."
                                value={answers[currentQuestionData.id] || ""}
                                onChange={e =>
                                    handleAnswerChange(currentQuestionData.id, e.target.value)
                                }
                                className="min-h-[120px]"
                            />
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Navigation */}
            <div className="flex items-center justify-between">
                <Button
                    variant="outline"
                    onClick={handlePreviousQuestion}
                    disabled={currentQuestion === 0}
                >
                    Previous
                </Button>

                <div className="flex gap-2">
                    {quizQuestions.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => setCurrentQuestion(index)}
                            className={`w-8 h-8 rounded-full text-sm font-medium transition-colors ${
                                index === currentQuestion
                                    ? "bg-blue-600 text-white"
                                    : answers[quizQuestions[index].id]
                                        ? "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300"
                                        : "bg-brand-100 dark:bg-brand-800 text-brand-600 dark:text-brand-300 hover:bg-brand-200 dark:hover:bg-brand-700"
                            }`}
                        >
                            {index + 1}
                        </button>
                    ))}
                </div>

                {currentQuestion === quizQuestions.length - 1 ? (
                    <Button
                        onClick={handleSubmitQuiz}
                        disabled={quizSubmitting}
                        className="bg-green-600 hover:bg-green-700 text-white"
                    >
                        {quizSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        {quizSubmitting ? "Submitting..." : "Submit Quiz"}
                    </Button>
                ) : (
                    <Button
                        onClick={handleNextQuestion}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                        Next
                    </Button>
                )}
            </div>
        </div>
    );
}
