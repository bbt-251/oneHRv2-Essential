"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Clock, CheckCircle, Eye, Play } from "lucide-react";
import { SurveyResponseModal } from "../../modals/survey-response-modal";
import { useFirestore } from "@/context/firestore-context";
import { SurveyModel } from "@/lib/models/survey";
import { useAuth } from "@/context/authContext";
import { EmployeeModel } from "@/lib/models/employee";
import { submitSurveyResponse } from "@/lib/backend/api/employee-engagement/survey/survey-service";
import MultipleChoiceModel from "@/lib/models/multiple-choice";
import ShortAnswerModel from "@/lib/models/short-answer";
import { EMPLOYEE_ENGAGEMENT_LOG_MESSAGES } from "@/lib/log-descriptions/employee-engagement";
import getFullName from "@/lib/util/getEmployeeFullName";
import { CommonAnswerModel } from "@/lib/models/commonAnswer";
import { CommonAnswerTypesModel } from "@/lib/backend/firebase/hrSettingsService";

// Survey assignment check function similar to isAssigned for training materials
export const isSurveyAssigned = (survey: SurveyModel, employee: EmployeeModel) => {
    if (employee && survey) {
        const employeeUid = employee?.uid ?? "";
        return (
            survey?.surveyTarget?.includes("all") ||
            (employeeUid &&
                survey.employees &&
                survey.employees?.length > 0 &&
                survey.employees?.includes(employeeUid)) ||
            (survey?.departments &&
                survey?.departments?.length > 0 &&
                survey?.departments?.includes(employee.department)) ||
            (survey?.sections &&
                survey?.sections?.length > 0 &&
                survey?.sections?.includes(employee.section)) ||
            (survey?.locations &&
                survey?.locations?.length > 0 &&
                survey?.locations?.includes(employee.workingLocation)) ||
            (survey?.grades &&
                survey?.grades?.length > 0 &&
                survey?.grades?.includes(employee.gradeLevel)) ||
            (employee &&
                survey?.surveyTarget?.includes("Managers") &&
                employee?.managerPosition === true) ||
            (employee &&
                survey?.surveyTarget?.includes("Not Managers") &&
                employee?.managerPosition === false) ||
            survey?.surveyTarget?.includes("all")
        );
    } else {
        return false;
    }
};

export interface Survey {
    id: string;
    title: string;
    description: string;
    startDate: string;
    endDate: string;
    duration: number;
    status: "Published" | "Unpublished";
    questions: Array<{
        id: string;
        question: string;
        type: "Multiple Choice" | "Short Answer" | "Common Answer";
        options?: string[];
    }>;
    hasResponded?: boolean;
    responseDate?: string;
    responses?: Array<{
        questionId: string;
        answer: string;
        id: string;
        type: "Multiple Choice" | "Short Answer" | "Common Answer";
    }>;
}

// Transform SurveyModel to the expected Survey interface for the modal
export const transformSurveyForModal = (
    survey: SurveyModel,
    multipleChoices: MultipleChoiceModel[],
    shortAnswers: ShortAnswerModel[],
    commonAnswers: CommonAnswerModel[],
    commonAnswerTypes: CommonAnswerTypesModel[],
    uid: string,
) => {
    // Expand each referenced multiple-choice/short-answer into ALL its questions
    const expandedQuestions: Survey["questions"] = [];

    survey.listOfQuestions.forEach(q => {
        if (q.type === "Multiple Choice") {
            const mc = multipleChoices.find(m => m.id === q.questionID);
            if (mc?.questions?.length) {
                mc.questions.forEach(mcQ => {
                    expandedQuestions.push({
                        // Composite id to keep uniqueness across sources
                        id: `${q.id}:${mcQ.id}`,
                        question: mcQ.question,
                        type: "Multiple Choice",
                        options: mcQ.choices,
                    });
                });
            }
        } else if (q.type === "Short Answer") {
            const sa = shortAnswers.find(s => s.id === q.questionID);
            if (sa?.questions?.length) {
                sa.questions.forEach(saQ => {
                    expandedQuestions.push({
                        id: `${q.id}:${saQ.id}`,
                        question: saQ.question,
                        type: "Short Answer",
                    });
                });
            }
        } else if (q.type === "Common Answer") {
            const commonAnswer = commonAnswers.find(ca => ca.id === q.questionID);
            if (commonAnswer?.questions?.length) {
                // For Common Answer type, we use the questions from the common answer set
                commonAnswer.questions.forEach(caQ => {
                    const commonAnswerType = commonAnswerTypes.find(
                        cat => cat.id == caQ.answerType,
                    );
                    expandedQuestions.push({
                        id: `${q.id}:${caQ.qID}`,
                        question: caQ.qTitle,
                        type: "Common Answer",
                        options: commonAnswerType?.answers ?? [],
                    });
                });
            }
        } else {
            // Unsupported type fallback (optional)
            if (q.questionID) {
                expandedQuestions.push({
                    id: `${q.id}:${q.questionID}`,
                    question: q.questionID,
                    type: "Common Answer",
                });
            }
        }
    });

    // Check if user has already responded
    const userResponse = survey.responses?.find(r => r.uid === uid);
    const hasResponded = !!userResponse;

    return {
        id: survey.id || "",
        title: survey.surveyTitle,
        description: survey.description || `Survey from ${survey.startDate} to ${survey.endDate}`,
        startDate: survey.startDate,
        endDate: survey.endDate,
        duration: survey.duration,
        status: survey.publishStatus,
        questions: expandedQuestions,
        hasResponded,
        responseDate: userResponse?.timestamp,
        responses: userResponse
            ? userResponse.answers.map(a => ({
                questionId: a.questionId,
                answer: a.answer,
                id: a.id,
                type: a.type,
            }))
            : undefined,
    };
};

export function Survey() {
    const { surveys, multipleChoices, shortAnswers, hrSettings, commonAnswers } = useFirestore();
    const commonAnswerTypes = hrSettings.commonAnswerTypes;
    const { userData } = useAuth();
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedSurvey, setSelectedSurvey] = useState<Survey | null>(null);
    const [isResponseModalOpen, setIsResponseModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<"respond" | "view">("respond");

    // Filter surveys that are published and within date range
    const publishedSurveys = surveys.filter(survey => {
        if (survey.publishStatus !== "Published") return false;

        const now = new Date();
        const startDate = new Date(survey.startDate);
        const endDate = new Date(survey.endDate);

        return now >= startDate && now <= endDate;
    });

    // Filter eligible surveys using the isSurveyAssigned function
    const eligibleSurveys = publishedSurveys.filter(survey =>
        isSurveyAssigned(survey, userData ?? ({} as EmployeeModel)),
    );

    // Add question details to surveys
    const surveysWithQuestions = eligibleSurveys.map(s =>
        transformSurveyForModal(
            s,
            multipleChoices,
            shortAnswers,
            commonAnswers,
            commonAnswerTypes,
            userData?.uid || "",
        ),
    );

    const filteredSurveys = surveysWithQuestions.filter(survey =>
        survey.title.toLowerCase().includes(searchTerm.toLowerCase()),
    );

    // Separate responded vs unresponded surveys
    const unrespondedSurveys = filteredSurveys.filter(survey => !survey.hasResponded);
    const respondedSurveys = filteredSurveys.filter(survey => survey.hasResponded);

    const handleTakeSurvey = (survey: Survey) => {
        setSelectedSurvey(survey);
        setModalMode("respond");
        setIsResponseModalOpen(true);
    };

    const handleViewResponse = (survey: Survey) => {
        setSelectedSurvey(survey);
        setModalMode("view");
        setIsResponseModalOpen(true);
    };

    const handleSurveySubmit = async (responses: Record<string, string>) => {
        if (!selectedSurvey || !userData?.uid) return;

        try {
            // Convert responses to the expected format with id and type
            const answers = Object.entries(responses).map(([questionId, answer]) => {
                // Find the question to get its type
                const question = selectedSurvey.questions.find(q => q.id === questionId);
                return {
                    questionId,
                    answer,
                    id: questionId, // The composite id
                    type: question?.type || "Common Answer",
                };
            });

            const success = await submitSurveyResponse(
                selectedSurvey.id,
                userData.uid,
                answers,
                userData?.uid ?? "",
                EMPLOYEE_ENGAGEMENT_LOG_MESSAGES.SURVEY_RESPONSE_SUBMITTED(
                    selectedSurvey.title,
                    getFullName(userData ?? ({} as EmployeeModel)),
                ),
            );

            if (success) {
                // Close modal and refresh data (useFirestore will update automatically)
                setIsResponseModalOpen(false);
                setSelectedSurvey(null);
                // The surveys will update automatically via the useFirestore hook
            } else {
                console.error("Failed to submit survey response");
            }
        } catch (error) {
            console.error("Error submitting survey:", error);
        }
    };

    const handleCloseModal = () => {
        setIsResponseModalOpen(false);
        setSelectedSurvey(null);
    };

    const SurveyCard = ({ survey, isResponded }: { survey: Survey; isResponded: boolean }) => (
        <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <CardTitle className="text-lg font-semibold text-gray-900 dark:text-foreground">
                            {survey.title}
                        </CardTitle>
                        <p className="text-sm text-gray-600 dark:text-muted-foreground mt-1">
                            {survey.description}
                        </p>
                    </div>
                    <Badge variant={isResponded ? "default" : "secondary"} className="ml-2">
                        {isResponded ? "Completed" : "Pending"}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-muted-foreground">
                        <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            <span>{survey.duration} min</span>
                        </div>
                        <div>
                            <span>Due: {new Date(survey.endDate).toLocaleDateString()}</span>
                        </div>
                        {isResponded && survey.responseDate && (
                            <div className="flex items-center gap-1 text-green-600">
                                <CheckCircle className="h-4 w-4" />
                                <span>
                                    Completed {new Date(survey.responseDate).toLocaleDateString()}
                                </span>
                            </div>
                        )}
                    </div>

                    <div className="flex gap-2">
                        {isResponded ? (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewResponse(survey)}
                                className="flex items-center gap-2"
                            >
                                <Eye className="h-4 w-4" />
                                View Response
                            </Button>
                        ) : (
                            <Button
                                size="sm"
                                onClick={() => handleTakeSurvey(survey)}
                                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                            >
                                <Play className="h-4 w-4" />
                                Take Survey
                            </Button>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );

    return (
        <div className="p-8 space-y-6 bg-gray-50 min-h-screen dark:bg-background">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-foreground">
                        My Surveys
                    </h1>
                    <p className="text-gray-600 mt-1 dark:text-muted-foreground">
                        Complete surveys and view your responses
                    </p>
                </div>
            </div>

            {/* Search */}
            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                    placeholder="Search surveys..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="pl-10"
                />
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600 dark:text-muted-foreground">
                                    Total Surveys
                                </p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-foreground">
                                    {filteredSurveys.length}
                                </p>
                            </div>
                            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                <Search className="h-6 w-6 text-blue-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600 dark:text-muted-foreground">
                                    Completed
                                </p>
                                <p className="text-2xl font-bold text-green-600">
                                    {respondedSurveys.length}
                                </p>
                            </div>
                            <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                                <CheckCircle className="h-6 w-6 text-green-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600 dark:text-muted-foreground">
                                    Pending
                                </p>
                                <p className="text-2xl font-bold text-orange-600">
                                    {unrespondedSurveys.length}
                                </p>
                            </div>
                            <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
                                <Clock className="h-6 w-6 text-orange-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Pending Surveys */}
            {unrespondedSurveys.length > 0 && (
                <div className="space-y-4">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-foreground">
                        Pending Surveys ({unrespondedSurveys.length})
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {unrespondedSurveys.map(survey => (
                            <SurveyCard key={survey.id} survey={survey} isResponded={false} />
                        ))}
                    </div>
                </div>
            )}

            {/* Completed Surveys */}
            {respondedSurveys.length > 0 && (
                <div className="space-y-4">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-foreground">
                        Completed Surveys ({respondedSurveys.length})
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {respondedSurveys.map(survey => (
                            <SurveyCard key={survey.id} survey={survey} isResponded={true} />
                        ))}
                    </div>
                </div>
            )}

            {filteredSurveys.length === 0 && (
                <div className="text-center py-12">
                    <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-foreground">
                        No surveys found
                    </h3>
                    <p className="text-gray-600 dark:text-muted-foreground">
                        {searchTerm
                            ? "Try adjusting your search terms"
                            : "No published surveys available at the moment"}
                    </p>
                </div>
            )}

            {/* Survey Response Modal */}
            {selectedSurvey && (
                <SurveyResponseModal
                    isOpen={isResponseModalOpen}
                    onClose={handleCloseModal}
                    survey={selectedSurvey}
                    mode={modalMode}
                    onSubmit={handleSurveySubmit}
                />
            )}
        </div>
    );
}
