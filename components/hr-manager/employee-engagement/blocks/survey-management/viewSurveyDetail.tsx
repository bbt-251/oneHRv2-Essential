import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Users, Target, FileText, BarChart3 } from "lucide-react";
import { SurveyModel } from "@/lib/models/survey";

interface ViewSurveyDetailProps {
    data: SurveyModel;
}

export default function ViewSurveyDetail({ data }: ViewSurveyDetailProps) {
    const totalResponses = data?.responses?.length || 0;

    return (
        <div className="space-y-6">
            {/* Survey Header */}
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950">
                <CardHeader>
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                                <Target className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <CardTitle className="text-xl text-gray-900 dark:text-foreground">
                                    {data?.surveyTitle || "Survey Title"}
                                </CardTitle>
                                <p className="text-sm text-gray-600 dark:text-muted-foreground mt-1">
                                    {data?.description || "No description available"}
                                </p>
                            </div>
                        </div>
                        <Badge
                            variant={data?.publishStatus === "Published" ? "default" : "secondary"}
                            className={
                                data?.publishStatus === "Published"
                                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                                    : "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300"
                            }
                        >
                            {data?.publishStatus || "Unpublished"}
                        </Badge>
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
                                <BarChart3 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600 dark:text-muted-foreground">
                                    Total Questions
                                </p>
                                <p className="text-2xl font-bold text-purple-600">
                                    {data?.listOfQuestions?.length || 0}
                                </p>
                            </div>
                            <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                                <FileText className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Survey Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Clock className="h-5 w-5 text-blue-600" />
                            Duration & Schedule
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-muted rounded-lg">
                            <span className="text-sm font-medium">Duration:</span>
                            <span className="text-sm font-semibold text-blue-600">
                                {data?.duration || 0} minutes
                            </span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-muted rounded-lg">
                            <span className="text-sm font-medium">Start Date:</span>
                            <span className="text-sm">{data?.startDate || "N/A"}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-muted rounded-lg">
                            <span className="text-sm font-medium">End Date:</span>
                            <span className="text-sm">{data?.endDate || "N/A"}</span>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5 text-green-600" />
                            Target Audience
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-2">
                            {data?.surveyTarget?.length > 0 ? (
                                data.surveyTarget.map((target: string, index: number) => (
                                    <Badge
                                        key={index}
                                        variant="outline"
                                        className="bg-green-50 text-green-700 border-green-200"
                                    >
                                        {target === "all"
                                            ? "All Employees"
                                            : target === "employees"
                                                ? "Employees"
                                                : target === "department"
                                                    ? "Department"
                                                    : target === "section"
                                                        ? "Section"
                                                        : target === "location"
                                                            ? "Location"
                                                            : target === "managers"
                                                                ? "Managers"
                                                                : target === "not_managers"
                                                                    ? "Not Managers"
                                                                    : target === "grade"
                                                                        ? "Grade"
                                                                        : target}
                                    </Badge>
                                ))
                            ) : (
                                <span className="text-sm text-gray-500">No target specified</span>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Questions Summary */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-purple-600" />
                        Questions Overview
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-3 bg-purple-50 dark:bg-purple-950 rounded-lg">
                                <p className="text-sm font-medium text-purple-700 dark:text-purple-300">
                                    Total Questions
                                </p>
                                <p className="text-xl font-bold text-purple-600">
                                    {data?.listOfQuestions?.length || 0}
                                </p>
                            </div>
                            <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                                <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
                                    Question Types
                                </p>
                                <p className="text-xl font-bold text-blue-600">
                                    {
                                        Array.from(
                                            new Set(
                                                data?.listOfQuestions?.map((q: any) => q.type) ||
                                                    [],
                                            ),
                                        ).length
                                    }
                                </p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
