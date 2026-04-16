"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Users, BookOpen, Star, Clock } from "lucide-react";
import { AllTrainingDataModel } from "./all-training";
import { ExtendedTrainingMaterialModel } from "../employee-learning";
import { TMCategory, TMComplexityModel, TMLengthModel } from "@/lib/models/hr-settings";
import { EmployeeModel } from "@/lib/models/employee";
import { getCategoryDisplayString } from "@/lib/utils";
import { convertToPlayableUrl } from "@/lib/util/learning/url-utils";
import { useFirestore } from "@/context/firestore-context";

interface TrainingCardsProps {
    userData: EmployeeModel | null;
    filteredTrainingData: AllTrainingDataModel[];
    complexity: TMComplexityModel[];
    lengths: TMLengthModel[];
    categories: TMCategory[];
    handleStartTraining: (
        item: ExtendedTrainingMaterialModel & { type: "Training Material" },
    ) => void;
    handleStartTrainingPath: (
        item: Extract<AllTrainingDataModel, { type: "Training Path" }>,
    ) => void;
    getMaterialTypeIcon: (format: string) => React.ReactNode;
    getComplexityIcon: (complexity: string) => React.ReactNode;
    getQuizIcon: (hasQuiz: boolean) => React.ReactNode;
}

const getBtnText = (item: AllTrainingDataModel, userData: EmployeeModel | null) => {
    if (item.type === "Training Material") {
        const status = userData?.trainingMaterialStatus?.find(
            i => i.trainingMaterialID == item.id,
        )?.status;
        return status == "In progress"
            ? "Continue Learning"
            : status == "Completed"
                ? "Review Material"
                : "Start Training";
    } else {
        return item.progress == 100
            ? "Review Path"
            : item.progress > 0
                ? "Continue Path"
                : "Start Path";
    }
};

const TrainingCards: React.FC<TrainingCardsProps> = ({
    userData,
    filteredTrainingData,
    complexity,
    lengths,
    categories,
    handleStartTraining,
    handleStartTrainingPath,
    getMaterialTypeIcon,
    getComplexityIcon,
    getQuizIcon,
}) => {
    const { hrSettings } = useFirestore();
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTrainingData.map(item => (
                <Card
                    key={item.id}
                    className={`hover:shadow-xl transition-all duration-300 border-l-4 border-brand-200 dark:border-brand-800 flex flex-col h-full ${
                        item.type === "Training Path"
                            ? "border-l-[#ffe6a7] bg-gradient-to-br from-[#ffe6a7]/30 to-white dark:from-[#facf64]/20 dark:to-card"
                            : "border-l-[#3f3d56] bg-gradient-to-br from-[#3f3d56]/10 to-white dark:from-[#3f3d56]/20 dark:to-card"
                    }`}
                >
                    <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                                <div
                                    className={`p-3 rounded-xl shadow-lg ${
                                        item.type === "Training Path"
                                            ? "bg-[#d4a574]"
                                            : "bg-[#3f3d56]"
                                    }`}
                                >
                                    {item.type === "Training Path" ? (
                                        <Users className="h-6 w-6 text-white" />
                                    ) : (
                                        <BookOpen className="h-6 w-6 text-white" />
                                    )}
                                </div>
                                <div className="flex flex-col">
                                    <Badge
                                        variant="secondary"
                                        className={`text-xs font-semibold mb-1 w-fit ${
                                            item.type === "Training Path"
                                                ? "bg-[#ffe6a7] text-[#8b6914] dark:bg-[#ffe6a7]/80 dark:text-[#8b6914]"
                                                : "bg-[#3f3d56]/10 text-[#3f3d56] dark:bg-[#3f3d56]/20 dark:text-[#3f3d56]"
                                        }`}
                                    >
                                        {item.type === "Training Path"
                                            ? "🛤️ LEARNING PATH"
                                            : "📚 TRAINING MATERIAL"}
                                    </Badge>

                                    {item.type === "Training Material" ? (
                                        <div className="flex items-center gap-2 mt-1">
                                            {getMaterialTypeIcon(item.format)}
                                            <span className="text-xs text-brand-600 dark:text-brand-300 font-medium">
                                                {item.format === "Video"
                                                    ? "Video Content"
                                                    : item.format === "Audio"
                                                        ? "Audio Content"
                                                        : item.format === "PDF"
                                                            ? "PDF Content"
                                                            : "Mixed Content"}
                                            </span>
                                        </div>
                                    ) : (
                                        <></>
                                    )}
                                </div>
                            </div>

                            {item.type === "Training Material" ? (
                                <div className="flex items-center gap-2">
                                    {item.starred ? (
                                        <Star className="h-4 w-4 text-yellow-500 fill-current" />
                                    ) : (
                                        <></>
                                    )}
                                    {getComplexityIcon(item.complexity)}
                                    {getQuizIcon(!!item.associatedQuiz.length)}
                                </div>
                            ) : (
                                <></>
                            )}
                        </div>

                        <CardTitle className="text-lg text-brand-800 dark:text-white">
                            {item.name}
                        </CardTitle>
                        <CardDescription className="text-brand-600 dark:text-brand-300">
                            {item.type === "Training Material"
                                ? item.outputValue
                                : item.description}
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-4 flex-grow flex flex-col">
                        <div className="flex-grow space-y-4">
                            <div className="flex flex-wrap gap-2 text-xs">
                                <Badge
                                    variant="outline"
                                    className="border-brand-300 text-brand-600 dark:text-brand-300"
                                >
                                    {getCategoryDisplayString(
                                        item.category,
                                        hrSettings.tmCategories,
                                    )}
                                </Badge>

                                {item.type === "Training Material" ? (
                                    <div className="flex flex-wrap gap-2">
                                        <Badge
                                            variant="outline"
                                            className="border-brand-300 text-brand-600 dark:text-brand-300"
                                        >
                                            {item.format}
                                        </Badge>
                                        <Badge
                                            variant="outline"
                                            className="border-brand-300 text-brand-600 dark:text-brand-300"
                                        >
                                            {complexity.find(l => l.id == item.complexity)?.name ??
                                                ""}
                                        </Badge>
                                        <Badge
                                            variant="outline"
                                            className={`border-brand-300 ${
                                                item.requirementLevel === "Mandatory"
                                                    ? "text-orange-600 border-orange-300"
                                                    : item.requirementLevel === "Optional"
                                                        ? "text-green-600 border-green-300"
                                                        : ""
                                            }`}
                                        >
                                            {item.requirementLevel}
                                        </Badge>
                                    </div>
                                ) : (
                                    <></>
                                )}
                            </div>

                            {item.type == "Training Path" ||
                            convertToPlayableUrl(item.url)?.type == "react-player" ? (
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-brand-600 dark:text-brand-300">
                                            Progress
                                            </span>
                                            <span className="font-medium text-brand-800 dark:text-white">
                                                {item.progress}%
                                            </span>
                                        </div>
                                        <Progress
                                            value={item.progress}
                                            className="h-2 bg-brand-100 dark:bg-brand-900/30"
                                        />
                                    </div>
                                ) : (
                                    <div className="p-6"></div>
                                )}

                            <div className="flex items-center justify-between text-sm">
                                <span className="text-brand-600 dark:text-brand-300 flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {item.type === "Training Material"
                                        ? (lengths.find(l => l.id == item.length)?.name ?? "")
                                        : `${item.estimatedDuration} week(s)`}
                                </span>
                            </div>
                        </div>

                        <div className="pt-4 mt-auto border-t border-brand-100 dark:border-brand-800">
                            <Button
                                className="w-full bg-brand-600 hover:bg-brand-700 text-white font-medium py-2"
                                onClick={() =>
                                    item.type === "Training Material"
                                        ? handleStartTraining(item)
                                        : handleStartTrainingPath(item)
                                }
                            >
                                {getBtnText(item, userData)}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
};

export default TrainingCards;
