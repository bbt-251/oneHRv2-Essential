import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { JobApplicationModel } from "@/lib/models/job-application";
import { JobPostModel } from "@/lib/models/job-post";
import MultipleChoiceModel from "@/lib/models/multiple-choice";
import ScreeningQuestionModel from "@/lib/models/screening-questions";
import ShortAnswerModel from "@/lib/models/short-answer";
import { useScreeningExam } from "@/lib/util/talent-acquisition/use-screening-exam";
import { ChevronLeft, ChevronRight, Timer } from "lucide-react";
import { useRouter } from "next/navigation";

interface Exam {
    multipleChoices: MultipleChoiceModel[];
    shortAnswers: ShortAnswerModel[];
    totalQuestions: number;
    timerEnabled: boolean;
    timer: number;
    screeningQuestion: ScreeningQuestionModel | null;
}

interface Props {
    exam: Exam;
    jobPost: JobPostModel;
    jobApplication: JobApplicationModel;
}

export default function ScreeningExamForm({ exam, jobPost, jobApplication }: Props) {
    const {
        loading,
        examTimeRemaining,
        examAnswers,
        currentPage,
        totalPages,
        currentQuestions,
        showExitConfirmation,
        setShowExitConfirmation,
        formatTime,
        areAllQuestionsAnswered,
        handleAnswerChange,
        goToNextPage,
        goToPreviousPage,
        goToPage,
        submitExam,
    } = useScreeningExam({ exam, jobPost, jobApplication });
    const router = useRouter();
    return (
        <div className="">
            {exam.timerEnabled && (
                <div className="bg-[#0a3141] text-white px-4 py-2 rounded-md flex items-center gap-2 justify-end">
                    <Timer className="w-4 h-4" />
                    <span className="font-mono">{formatTime(examTimeRemaining)}</span>
                </div>
            )}

            <div className="flex items-center justify-center gap-2 py-4 border-b flex-shrink-0">
                <span className="text-sm text-gray-600">
                    Page {currentPage + 1} of {totalPages}
                </span>
                <div className="flex gap-1 ml-4">
                    {Array.from({ length: totalPages }, (_, i) => (
                        <button
                            key={i}
                            onClick={() => goToPage(i)}
                            className={`w-3 h-3 rounded-full transition-colors ${i === currentPage ? "bg-[#0a3141]" : "bg-gray-300 hover:bg-gray-400"}`}
                        />
                    ))}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto py-6">
                <div className="space-y-8 px-2">
                    {currentQuestions.map(question => (
                        <div key={question.id} className="p-6 border rounded-lg">
                            <h3 className="font-medium mb-4 text-lg">{question.question}</h3>
                            {question.type === "multiple-choice" ? (
                                <RadioGroup
                                    onValueChange={value =>
                                        handleAnswerChange(question.id, Number.parseInt(value))
                                    }
                                    value={examAnswers[question.id]?.toString()}
                                >
                                    <div className="space-y-3">
                                        {question.options.map((option, index) => (
                                            <div
                                                key={index}
                                                className="flex items-start space-x-3 p-3 rounded-md border"
                                            >
                                                <RadioGroupItem
                                                    value={index.toString()}
                                                    id={`q${question.id}-option${index}`}
                                                    className="mt-1"
                                                />
                                                <Label
                                                    htmlFor={`q${question.id}-option${index}`}
                                                    className="flex-1 cursor-pointer"
                                                >
                                                    {option}
                                                </Label>
                                            </div>
                                        ))}
                                    </div>
                                </RadioGroup>
                            ) : (
                                <div className="rounded-md border p-4">
                                    <Textarea
                                        placeholder="Type your answer here..."
                                        className="min-h-[200px] border-0 resize-none focus:ring-0 text-base"
                                        maxLength={question.maxLength}
                                        onChange={e =>
                                            handleAnswerChange(question.id, e.target.value)
                                        }
                                        value={examAnswers[question.id] || ""}
                                        onPaste={e => e.preventDefault()}
                                    />
                                    <div className="text-xs mt-2 text-right border-t pt-2">
                                        {String(examAnswers[question.id] || "").length}/
                                        {question.maxLength} characters
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex items-center justify-between w-full">
                <Button variant="outline" onClick={goToPreviousPage} disabled={currentPage === 0}>
                    <ChevronLeft className="w-4 h-4" /> Previous
                </Button>
                {currentPage === totalPages - 1 ? (
                    <Button
                        onClick={() => submitExam(false)}
                        className="bg-[#0a3141] hover:bg-[#1a4a5c] text-white"
                        disabled={!areAllQuestionsAnswered() || loading}
                    >
                        {loading ? "Processing ..." : "Submit Application"}
                    </Button>
                ) : (
                    <Button
                        onClick={goToNextPage}
                        className="bg-[#0a3141] hover:bg-[#1a4a5c] text-white"
                    >
                        Next <ChevronRight className="w-4 h-4" />
                    </Button>
                )}
            </div>

            <Dialog open={showExitConfirmation} onOpenChange={setShowExitConfirmation}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Are you sure you want to exit?</DialogTitle>
                    </DialogHeader>
                    <p>Your progress will not be saved.</p>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowExitConfirmation(false)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={() => router.back()}>
                            Exit
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
