"use client";

import { useTheme } from "@/components/theme-provider";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { useFirestore } from "@/context/firestore-context";
import { useToast } from "@/context/toastContext";
import { updateExitInterviewQuestion } from "@/lib/backend/api/exit-instance/exit-interview-questions-service";
import ExitInterviewQuestionModel from "@/lib/models/exit-interview-questions";
import { AlertCircle, Clock, Grid3X3, ListChecks, Target } from "lucide-react";
import { useEffect, useState } from "react";

interface EditExitInterviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    exitInterview: ExitInterviewQuestionModel | null;
}

interface QuestionItem {
    id: string;
    title: string;
    type: "multiple-choice" | "short-answer";
    weight: number;
    gradingSeverity?: number;
}

export default function EditExitInterviewModal({
    isOpen,
    onClose,
    exitInterview,
}: EditExitInterviewModalProps) {
    const { showToast } = useToast();
    const { multipleChoices, shortAnswers } = useFirestore();
    const { theme } = useTheme();
    const isDark = theme === "dark";

    const [name, setName] = useState<string>("");
    const [active, setActive] = useState<boolean>(true);
    const [passingScore, setPassingScore] = useState<number>(70);
    const [timerEnabled, setTimerEnabled] = useState<boolean>(false);
    const [timer, setTimer] = useState<number>(30);
    const [selectedQuestions, setSelectedQuestions] = useState<QuestionItem[]>([]);

    const [validationErrors, setValidationErrors] = useState<string[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [gradingSeverityValues, setGradingSeverityValues] = useState<{ [key: string]: number }>(
        {},
    );

    // Filter active question sets like the add modal
    const multipleChoiceSets = multipleChoices
        .filter(set => set.active)
        .map(set => ({
            id: set.id,
            name: set.name,
            description: set.description || "No description",
            questionCount: set.questions.length,
            active: set.active,
        }));

    const shortAnswerSets = shortAnswers
        .filter(set => set.active)
        .map(set => ({
            id: set.id,
            name: set.name,
            questionCount: set.questions.length,
            active: set.active,
        }));

    const handleSetToggle = (
        set: any,
        type: "multiple-choice" | "short-answer",
        checked: boolean,
    ) => {
        const isMultipleChoice = type === "multiple-choice";
        const selectedSetId = set.id;

        if (checked) {
            // Add set with default weight and grading severity
            const newSet: QuestionItem = {
                id: selectedSetId,
                title: set.name,
                type: type,
                weight: 20,
                gradingSeverity: isMultipleChoice
                    ? undefined
                    : gradingSeverityValues[selectedSetId] || 70,
            };
            setSelectedQuestions([...selectedQuestions, newSet]);
            // Initialize grading severity for short answer sets
            if (!isMultipleChoice) {
                setGradingSeverityValues(prev => ({ ...prev, [selectedSetId]: 70 }));
            }
        } else {
            setSelectedQuestions(selectedQuestions.filter(q => q.id !== selectedSetId));
        }
    };

    useEffect(() => {
        if (exitInterview && isOpen) {
            const selectedQuestions = [
                ...exitInterview.multipleChoiceQuestions.map(q => ({
                    id: q.id,
                    title: q.title,
                    type: "multiple-choice" as const,
                    weight: q.weight,
                })),
                ...exitInterview.shortAnswerQuestions.map(q => ({
                    id: q.id,
                    title: q.title,
                    type: "short-answer" as const,
                    weight: q.weight,
                    gradingSeverity: q.gradingSeverity,
                })),
            ];

            setName(exitInterview.name);
            setActive(exitInterview.active);
            setPassingScore(exitInterview.passingScore);
            setTimerEnabled(exitInterview.timerEnabled);
            setTimer(exitInterview.timer);
            setSelectedQuestions(selectedQuestions);

            // Initialize grading severity values
            const initialGradingValues: { [key: string]: number } = {};
            exitInterview.shortAnswerQuestions.forEach(q => {
                initialGradingValues[q.id] = q.gradingSeverity;
            });
            setGradingSeverityValues(initialGradingValues);
        }
    }, [exitInterview, isOpen]);

    const updateQuestionWeight = (questionId: string, weight: number) => {
        setSelectedQuestions(
            selectedQuestions.map(q => (q.id === questionId ? { ...q, weight } : q)),
        );
    };

    const updateGradingSeverity = (questionId: string, severity: number) => {
        setSelectedQuestions(
            selectedQuestions.map(q =>
                q.id === questionId ? { ...q, gradingSeverity: severity } : q,
            ),
        );
        setGradingSeverityValues(prev => ({ ...prev, [questionId]: severity }));
    };

    const handleSubmit = async () => {
        if (!exitInterview) return;

        const errors: string[] = [];
        setValidationErrors([]);

        if (!name.trim()) {
            errors.push("Exit interview name is required.");
        }

        if (selectedQuestions.length === 0) {
            errors.push("At least one question must be selected.");
        }

        if (passingScore < 0 || passingScore > 100) {
            errors.push("Passing score must be between 0 and 100.");
        }

        if (timerEnabled && (timer < 1 || timer > 480)) {
            errors.push("Timer must be between 1 and 480 minutes.");
        }

        const totalWeight = selectedQuestions.reduce((sum, q) => sum + q.weight, 0);
        if (totalWeight !== 100) {
            errors.push(`Total question weights must equal 100% (currently ${totalWeight}%).`);
        }

        if (errors.length > 0) {
            setValidationErrors(errors);
            return;
        }

        setLoading(true);

        try {
            const exitInterviewData = {
                name,
                active,
                passingScore,
                timerEnabled,
                timer,
                multipleChoiceQuestions: selectedQuestions
                    .filter(q => q.type === "multiple-choice")
                    .map(q => ({
                        id: q.id.split("-")[0], // Original set ID
                        title: q.title,
                        weight: q.weight,
                    })),
                shortAnswerQuestions: selectedQuestions
                    .filter(q => q.type === "short-answer")
                    .map(q => ({
                        id: q.id.split("-")[0], // Original set ID
                        title: q.title,
                        weight: q.weight,
                        gradingSeverity: q.gradingSeverity || 70,
                    })),
            };

            const result = await updateExitInterviewQuestion({
                id: exitInterview.id,
                ...exitInterviewData,
            });

            if (result) {
                showToast("Exit interview question updated successfully!", "Success", "success");
                handleClose();
            } else {
                showToast(
                    "Error updating exit interview question. Please try again.",
                    "Error",
                    "error",
                );
            }
        } catch (error) {
            console.error("Error updating exit interview question:", error);
            showToast("An unexpected error occurred. Please try again.", "Error", "error");
        }

        setLoading(false);
    };

    const handleClose = () => {
        setName("");
        setActive(true);
        setPassingScore(70);
        setTimerEnabled(false);
        setTimer(30);
        setSelectedQuestions([]);
        setValidationErrors([]);
        setGradingSeverityValues({});
        onClose();
    };

    const totalWeight = selectedQuestions.reduce((sum, q) => sum + q.weight, 0);

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="max-w-6xl max-h-[90vh] overflow-scroll">
                <DialogHeader>
                    <DialogTitle>Edit Exit Interview Questions</DialogTitle>
                    <DialogDescription>
                        Edit the exit interview question set configuration.
                    </DialogDescription>
                </DialogHeader>

                {/* Validation Errors */}
                {validationErrors.length > 0 && (
                    <div
                        className={`mb-4 p-4 border rounded-lg ${isDark ? "bg-red-900/20 border-red-800" : "bg-red-50 border-red-200"}`}
                    >
                        <h4
                            className={`text-sm font-medium mb-2 flex items-center gap-2 ${isDark ? "text-red-300" : "text-red-800"}`}
                        >
                            <AlertCircle className="w-4 h-4" />
                            Please fix the following errors:
                        </h4>
                        <ul
                            className={`text-sm space-y-1 ${isDark ? "text-red-400" : "text-red-700"}`}
                        >
                            {validationErrors.map((error, index) => (
                                <li key={index} className="flex items-center gap-2">
                                    <div className="w-1 h-1 bg-red-500 rounded-full flex-shrink-0" />
                                    {error}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                <div className="space-y-6">
                    {/* Basic Configuration */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Basic Configuration</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Exit Interview Name *</Label>
                                    <Input
                                        id="name"
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                        placeholder="e.g., Exit Interview Round 1"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="active">Active</Label>
                                    <div className="flex items-center space-x-2">
                                        <Switch
                                            id="active"
                                            checked={active}
                                            onCheckedChange={setActive}
                                            className={
                                                active ? "data-[state=checked]:bg-green-400" : ""
                                            }
                                        />
                                        <span
                                            className={`text-sm ${active ? "text-green-600" : "text-red-600"}`}
                                        >
                                            {active ? "Active" : "Inactive"}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="passingScore">Passing Score: {passingScore}%</Label>
                                <Slider
                                    value={[passingScore]}
                                    onValueChange={value => setPassingScore(value[0])}
                                    max={100}
                                    min={0}
                                    step={1}
                                    className={`w-full rounded-full h-2.5 ${isDark ? "bg-gray-700" : "bg-amber-100"}`}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Timer Options</Label>
                                <div className="flex items-center space-x-2">
                                    <Switch
                                        checked={timerEnabled}
                                        onCheckedChange={setTimerEnabled}
                                        className={
                                            timerEnabled ? "data-[state=checked]:bg-green-400" : ""
                                        }
                                    />
                                    <span className="text-sm">Enable Time Limit</span>
                                </div>
                                {timerEnabled && (
                                    <div className="flex items-center gap-2 mt-2">
                                        <Clock className="w-4 h-4" />
                                        <Input
                                            type="number"
                                            value={timer}
                                            onChange={e => setTimer(parseInt(e.target.value) || 0)}
                                            className="w-24"
                                            min={1}
                                            max={480}
                                        />
                                        <span
                                            className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}
                                        >
                                            minutes
                                        </span>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Question Weights Configuration */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Select Questions</CardTitle>
                            <div
                                className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}
                            >
                                Configure weights for selected questions{" "}
                                {selectedQuestions.length > 0 &&
                                    `(${selectedQuestions.length} selected)`}
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Accordion type="single" className="w-full" collapsible>
                                {/* Multiple Choice Questions */}
                                <AccordionItem value="multiple-choice">
                                    <AccordionTrigger className="text-base">
                                        <div className="flex items-center gap-2">
                                            <Grid3X3 className="w-4 h-4" />
                                            Multiple Choice Question Sets
                                            <Badge variant="secondary" className="ml-2">
                                                {multipleChoiceSets.length}
                                            </Badge>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent>
                                        <ScrollArea className="max-h-96">
                                            <div className="space-y-2 pr-4">
                                                {multipleChoiceSets.map(set => (
                                                    <div key={set.id}>
                                                        <div
                                                            className={`flex items-center space-x-2 p-3 border rounded-lg ${isDark ? "border-gray-700" : "border-gray-200"}`}
                                                        >
                                                            <Checkbox
                                                                checked={selectedQuestions.some(
                                                                    q => q.id === set.id,
                                                                )}
                                                                onCheckedChange={(
                                                                    checked: boolean,
                                                                ) =>
                                                                    handleSetToggle(
                                                                        set,
                                                                        "multiple-choice",
                                                                        checked,
                                                                    )
                                                                }
                                                            />
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-sm font-medium break-words">
                                                                        {set.name}
                                                                    </span>
                                                                    {!set.active && (
                                                                        <Badge
                                                                            variant="secondary"
                                                                            className="text-xs"
                                                                        >
                                                                            Inactive
                                                                        </Badge>
                                                                    )}
                                                                    <Badge
                                                                        variant="outline"
                                                                        className="text-xs"
                                                                    >
                                                                        {set.questionCount}{" "}
                                                                        questions
                                                                    </Badge>
                                                                </div>
                                                                <div
                                                                    className={`text-xs truncate ${isDark ? "text-gray-400" : "text-gray-500"}`}
                                                                >
                                                                    {set.description}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        {/* Show configuration for this set if selected */}
                                                        {selectedQuestions.some(
                                                            q => q.id === set.id,
                                                        ) && (
                                                            <div
                                                                className={`mt-2 ml-8 p-3 border rounded-lg ${isDark ? "border-blue-700 bg-blue-900/20" : "border-blue-200 bg-blue-50"}`}
                                                            >
                                                                <div className="flex items-center justify-between">
                                                                    <div className="flex items-center gap-2">
                                                                        <Target className="w-4 h-4" />
                                                                        <span className="text-sm font-medium">
                                                                            Weight
                                                                        </span>
                                                                    </div>
                                                                    <Input
                                                                        type="number"
                                                                        value={
                                                                            selectedQuestions.find(
                                                                                q =>
                                                                                    q.id === set.id,
                                                                            )?.weight || 20
                                                                        }
                                                                        onChange={e =>
                                                                            updateQuestionWeight(
                                                                                set.id,
                                                                                parseInt(
                                                                                    e.target.value,
                                                                                ) || 0,
                                                                            )
                                                                        }
                                                                        className="w-20"
                                                                        min={1}
                                                                    />
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                                {multipleChoiceSets.length === 0 && (
                                                    <div
                                                        className={`text-center py-8 ${isDark ? "text-gray-400" : "text-gray-500"}`}
                                                    >
                                                        No multiple choice question sets available.
                                                    </div>
                                                )}
                                            </div>
                                        </ScrollArea>
                                    </AccordionContent>
                                </AccordionItem>

                                {/* Short Answer Questions */}
                                <AccordionItem value="short-answer">
                                    <AccordionTrigger className="text-base">
                                        <div className="flex items-center gap-2">
                                            <ListChecks className="w-4 h-4" />
                                            Short Answer Question Sets
                                            <Badge variant="secondary" className="ml-2">
                                                {shortAnswerSets.length}
                                            </Badge>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent>
                                        <ScrollArea className="max-h-96">
                                            <div className="space-y-2 pr-4">
                                                {shortAnswerSets.map(set => (
                                                    <div key={set.id}>
                                                        <div
                                                            className={`flex items-center space-x-2 p-3 border rounded-lg ${isDark ? "border-gray-700" : "border-gray-200"}`}
                                                        >
                                                            <Checkbox
                                                                checked={selectedQuestions.some(
                                                                    q => q.id === set.id,
                                                                )}
                                                                onCheckedChange={(
                                                                    checked: boolean,
                                                                ) =>
                                                                    handleSetToggle(
                                                                        set,
                                                                        "short-answer",
                                                                        checked,
                                                                    )
                                                                }
                                                            />
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-sm font-medium break-words">
                                                                        {set.name}
                                                                    </span>
                                                                    {!set.active && (
                                                                        <Badge
                                                                            variant="secondary"
                                                                            className="text-xs"
                                                                        >
                                                                            Inactive
                                                                        </Badge>
                                                                    )}
                                                                    <Badge
                                                                        variant="outline"
                                                                        className="text-xs"
                                                                    >
                                                                        {set.questionCount}{" "}
                                                                        questions
                                                                    </Badge>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        {/* Show configuration for this set if selected */}
                                                        {selectedQuestions.some(
                                                            q => q.id === set.id,
                                                        ) && (
                                                            <div
                                                                className={`mt-2 ml-8 p-3 border rounded-lg space-y-3 ${isDark ? "border-green-700 bg-green-900/20" : "border-green-200 bg-green-50"}`}
                                                            >
                                                                <div className="flex items-center justify-between">
                                                                    <div className="flex items-center gap-2">
                                                                        <Target className="w-4 h-4" />
                                                                        <span className="text-sm font-medium">
                                                                            Weight
                                                                        </span>
                                                                    </div>
                                                                    <Input
                                                                        type="number"
                                                                        value={
                                                                            selectedQuestions.find(
                                                                                q =>
                                                                                    q.id === set.id,
                                                                            )?.weight || 20
                                                                        }
                                                                        onChange={e =>
                                                                            updateQuestionWeight(
                                                                                set.id,
                                                                                parseInt(
                                                                                    e.target.value,
                                                                                ) || 0,
                                                                            )
                                                                        }
                                                                        className="w-20"
                                                                        min={1}
                                                                    />
                                                                </div>

                                                                <div
                                                                    className={`border-l-4 p-4 rounded-lg ${isDark ? "border-amber-500 bg-black" : "border-amber-400 bg-amber-50"}`}
                                                                >
                                                                    <Label
                                                                        className={`text-sm font-semibold flex items-center justify-between mb-4 ${isDark ? "text-amber-300" : "text-amber-800"}`}
                                                                    >
                                                                        <span>
                                                                            Grading Severity
                                                                        </span>
                                                                        <span
                                                                            className={`px-3 py-1 rounded-full text-sm font-bold ${isDark ? "bg-amber-900/50 text-amber-200" : "bg-amber-100 text-amber-700"}`}
                                                                        >
                                                                            {gradingSeverityValues[
                                                                                set.id
                                                                            ] ||
                                                                                selectedQuestions.find(
                                                                                    q =>
                                                                                        q.id ===
                                                                                        set.id,
                                                                                )
                                                                                    ?.gradingSeverity ||
                                                                                70}
                                                                            %
                                                                        </span>
                                                                    </Label>
                                                                    <div className="space-y-4">
                                                                        <Slider
                                                                            value={[
                                                                                gradingSeverityValues[
                                                                                    set.id
                                                                                ] ||
                                                                                    selectedQuestions.find(
                                                                                        q =>
                                                                                            q.id ===
                                                                                            set.id,
                                                                                    )
                                                                                        ?.gradingSeverity ||
                                                                                    70,
                                                                            ]}
                                                                            onValueChange={value =>
                                                                                updateGradingSeverity(
                                                                                    set.id,
                                                                                    value[0],
                                                                                )
                                                                            }
                                                                            max={100}
                                                                            min={1}
                                                                            step={1}
                                                                            className={`w-full rounded-full h-2.5 ${isDark ? "bg-gray-800" : "bg-amber-100"}`}
                                                                        />
                                                                        <div
                                                                            className={`flex justify-between text-xs font-medium ${isDark ? "text-gray-400" : "text-amber-700"}`}
                                                                        >
                                                                            <span>
                                                                                Lenient (1%)
                                                                            </span>
                                                                            <span>
                                                                                Balanced (50%)
                                                                            </span>
                                                                            <span>
                                                                                Strict (100%)
                                                                            </span>
                                                                        </div>
                                                                        <div
                                                                            className={`text-center text-xs border-t pt-2 ${isDark ? "text-gray-300 border-gray-600" : "text-amber-600 border-amber-200"}`}
                                                                        >
                                                                            More lenient → More
                                                                            strict
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                                {shortAnswerSets.length === 0 && (
                                                    <div
                                                        className={`text-center py-8 ${isDark ? "text-gray-400" : "text-gray-500"}`}
                                                    >
                                                        No short answer question sets available.
                                                    </div>
                                                )}
                                            </div>
                                        </ScrollArea>
                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>
                        </CardContent>
                    </Card>

                    {/* Total Weight Display */}
                    {selectedQuestions.length > 0 && (
                        <div className="flex justify-center">
                            <Card className="max-w-sm">
                                <CardContent className="p-4">
                                    <div className="text-center">
                                        <div
                                            className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}
                                        >
                                            Total Weight:
                                        </div>
                                        <div
                                            className={`text-2xl font-bold ${
                                                selectedQuestions.reduce(
                                                    (sum, q) => sum + q.weight,
                                                    0,
                                                ) === 100
                                                    ? "text-green-600"
                                                    : "text-red-600"
                                            }`}
                                        >
                                            {selectedQuestions.reduce(
                                                (sum, q) => sum + q.weight,
                                                0,
                                            )}
                                            %
                                        </div>
                                        {selectedQuestions.reduce((sum, q) => sum + q.weight, 0) !==
                                            100 && (
                                            <div className="text-xs text-red-500 mt-1">
                                                Weight must equal 100% to proceed
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={handleClose}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={
                            !(name.trim() && selectedQuestions.length > 0 && totalWeight === 100) ||
                            loading
                        }
                        style={{ backgroundColor: "#16A34A" }}
                        className="hover:bg-green-700"
                    >
                        {loading ? "Updating..." : "Update"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
