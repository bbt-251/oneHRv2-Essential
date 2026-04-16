"use client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/authContext";
import { useFirestore } from "@/context/firestore-context";
import { useToast } from "@/context/toastContext";
import { updateTrainingPath } from "@/lib/backend/api/training/training-path.services";
import { TrainingMaterialModel } from "@/lib/models/training-material";
import {
    ArrowLeft,
    BookOpen,
    CheckCircle,
    Clock,
    Loader2,
    Star,
    Target,
    Trophy,
    Users,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ExtendedTrainingPathModel } from "../employee-learning";
import { EmployeeModel } from "@/lib/models/employee";
import { updateEmployee } from "@/lib/backend/api/employee-management/employee-management-service";
import dayjs from "dayjs";
import { dateFormat } from "@/lib/util/dayjs_format";

export interface PathDetailsModel extends ExtendedTrainingPathModel {
    associatedMaterials: TrainingMaterialModel[];
}

const getBtnText = (item: TrainingMaterialModel, userData: EmployeeModel | null) => {
    const status = userData?.trainingMaterialStatus?.find(
        i => i.trainingMaterialID == item.id,
    )?.status;
    return status == "In progress"
        ? "Continue Learning"
        : status == "Completed"
            ? "Review Material"
            : "Start Training";
};

export function TrainingPathViewer() {
    const { userData } = useAuth();
    const { trainingPaths, trainingMaterials, hrSettings } = useFirestore();
    const categories = hrSettings.tmCategories;
    const lengths = hrSettings.tmLengths;
    const complexity = hrSettings.tmComplexity;
    const { showToast } = useToast();
    const router = useRouter();
    const params = useSearchParams();
    const id = params.get("id");
    const origin = params.get("origin");
    const [pathDetails, setPathDetails] = useState<PathDetailsModel | null>(null);
    const [showRatingModal, setShowRatingModal] = useState(false);
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState("");
    const [isRating, setIsRating] = useState(false);

    useEffect(() => {
        const path = trainingPaths.find(p => p.id == id);
        if (path) {
            const approvedMaterials = trainingMaterials.filter(
                tm => tm.approvalStatus == "Approved" || true,
            );

            const completed = path.trainingMaterials.filter(
                id =>
                    userData?.trainingMaterialStatus?.find(i => i.trainingMaterialID == id)
                        ?.status == "Completed",
            );

            const path1: ExtendedTrainingPathModel = {
                ...path,
                progress:
                    path.trainingMaterials.length > 0
                        ? (completed.length * 100) / path.trainingMaterials.length
                        : 0,
                completedModules: completed.length,
            };

            const pathDetails: PathDetailsModel = {
                ...(path1 ?? {}),
                associatedMaterials: approvedMaterials.filter(m =>
                    path?.trainingMaterials?.includes(m.id),
                ),
            };

            setPathDetails(pathDetails);
            setRating(
                pathDetails?.employeeFeedbacks?.find(f => f.employeeUid == userData?.uid)?.rating ??
                    0,
            );
            setComment(
                pathDetails?.employeeFeedbacks?.find(f => f.employeeUid == userData?.uid)
                    ?.comment ?? "",
            );
        }
    }, [trainingPaths, trainingMaterials, userData?.trainingMaterialStatus]);

    const getComplexityIcon = (complexity: string) => {
        switch (complexity.toLowerCase()) {
            case "beginner":
                return <div className="w-2 h-2 bg-green-500 rounded-full" title="Beginner" />;
            case "intermediate":
                return <div className="w-2 h-2 bg-yellow-500 rounded-full" title="Intermediate" />;
            case "advanced":
                return <div className="w-2 h-2 bg-red-500 rounded-full" title="Advanced" />;
            default:
                return <div className="w-2 h-2 bg-gray-400 rounded-full" title="Unknown" />;
        }
    };

    const getQuizIcon = (hasQuiz: boolean) => {
        return hasQuiz ? (
            <div
                className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center"
                title="Has Quiz"
            >
                <span className="text-white text-xs font-bold">?</span>
            </div>
        ) : null;
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case "Video":
                return "📹";
            case "PDF":
                return "📄";
            case "Audio":
                return "🔊";
            default:
                return "📄";
        }
    };

    const handleStartMaterial = (_id: string, status?: string) => {
        if (status != "In progress" && status != "Completed") {
            updateEmployee({
                id: userData?.id ?? "",
                trainingMaterialStatus: [
                    ...(userData?.trainingMaterialStatus?.filter(
                        t => t.trainingMaterialID != _id,
                    ) ?? []),
                    { status: "In progress", trainingMaterialID: _id },
                ],
            });
        }
        router.push(`/training-viewer?id=${_id}&origin=${`/training-path-viewer?id=${id}`}`);
    };

    const handleRatingSubmit = async () => {
        if (pathDetails) {
            setIsRating(true);
            const otherFeedbacks =
                pathDetails?.employeeFeedbacks?.filter(f => f.employeeUid !== userData?.uid) ?? [];
            const res = await updateTrainingPath({
                id: pathDetails.id,
                employeeFeedbacks: [
                    ...otherFeedbacks,
                    { employeeUid: userData?.uid ?? "", rating, comment },
                ],
            });
            if (res) {
                showToast("Rating successful", "Success", "success");
                setShowRatingModal(false);
            } else {
                showToast("Error rating", "Error", "error");
            }
            setIsRating(false);
        }
    };

    if (!pathDetails) {
        return (
            <div className="flex justify-center align-middle text-gray-400">
                <p>No Training Path Found</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 p-6">
            {/* Header with Back Button */}
            <div className="flex items-center gap-4 pb-6 border-b border-brand-200 dark:border-brand-800">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(origin ?? "/learning")}
                    className="flex items-center gap-2"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Learning
                </Button>
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-[#d4a574] rounded-xl shadow-lg">
                        <Users className="h-8 w-8 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-brand-800 dark:text-white">
                            {pathDetails.name}
                        </h1>
                        <p className="text-brand-600 dark:text-brand-300">
                            {pathDetails.description}
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Path Overview */}
                    <Card className="border-l-4 border-l-[#ffe6a7] border-brand-200 dark:border-brand-800 bg-gradient-to-br from-[#ffe6a7]/20 to-white dark:from-[#ffe6a7]/10 dark:to-card">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-xl text-brand-800 dark:text-white">
                                    Learning Path Overview
                                </CardTitle>
                                <Badge
                                    variant="secondary"
                                    className="bg-[#ffe6a7] text-[#8b6914] dark:bg-[#ffe6a7]/80 dark:text-[#8b6914] font-semibold"
                                >
                                    🛤️ LEARNING PATH
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Progress Section */}
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-brand-600 dark:text-brand-300">
                                        Overall Progress
                                    </span>
                                    <span className="font-bold text-brand-800 dark:text-white">
                                        {pathDetails?.progress}%
                                    </span>
                                </div>
                                <Progress
                                    value={pathDetails?.progress}
                                    className="h-4 bg-brand-100 dark:bg-brand-900/30"
                                />
                                <div className="flex justify-between text-sm text-brand-600 dark:text-brand-300">
                                    <span>
                                        {pathDetails.completedModules} of{" "}
                                        {pathDetails.associatedMaterials?.filter(
                                            tm => tm.status == "Completed",
                                        )?.length ?? 0}{" "}
                                        modules completed
                                    </span>
                                    <span>{pathDetails.estimatedDuration} total</span>
                                </div>
                            </div>

                            {/* Learning Objectives */}
                            <div className="space-y-3">
                                <h3 className="font-semibold text-brand-800 dark:text-white flex items-center gap-2">
                                    <Target className="h-5 w-5" />
                                    Learning Objectives
                                </h3>
                                <ul className="space-y-2">{pathDetails.justification ?? ""}</ul>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Associated Training Materials */}
                    <Card className="border-brand-200 dark:border-brand-800">
                        <CardHeader>
                            <CardTitle className="text-xl text-brand-800 dark:text-white flex items-center gap-2">
                                <BookOpen className="h-5 w-5" />
                                Training Materials ({pathDetails.associatedMaterials.length})
                            </CardTitle>
                            <CardDescription>
                                Complete these materials in order to finish the learning path
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {pathDetails.associatedMaterials.map((material, index) => (
                                    <Card
                                        key={material.id}
                                        className={`border-l-4 transition-all duration-300 ${
                                            material.status == "Completed"
                                                ? "border-l-green-500 bg-green-50/50 dark:bg-green-950/20"
                                                : "border-l-[#3f3d56] bg-gradient-to-r from-[#3f3d56]/10 to-transparent dark:from-[#3f3d56]/10 hover:shadow-md"
                                        }`}
                                    >
                                        <CardContent className="p-4">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-lg font-bold text-brand-600 dark:text-brand-300">
                                                            {index + 1}
                                                        </span>
                                                        <div
                                                            className={`p-3 rounded-lg shadow-sm ${
                                                                material.status == "Completed"
                                                                    ? "bg-green-500"
                                                                    : "bg-[#3f3d56]"
                                                            }`}
                                                        >
                                                            {material.status == "Completed" ? (
                                                                <CheckCircle className="h-5 w-5 text-white" />
                                                            ) : (
                                                                <BookOpen className="h-5 w-5 text-white" />
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-2">
                                                            <h4 className="font-semibold text-brand-800 dark:text-white">
                                                                {material.name}
                                                            </h4>
                                                            <Badge
                                                                variant="secondary"
                                                                className="text-xs bg-[#3f3d56]/10 text-[#3f3d56] dark:bg-[#3f3d56]/20 dark:text-[#3f3d56] font-semibold"
                                                            >
                                                                {getTypeIcon(material.format)}{" "}
                                                                {material.format.toUpperCase()}
                                                            </Badge>
                                                            <div className="flex items-center gap-1">
                                                                {getComplexityIcon(
                                                                    material.complexity,
                                                                )}
                                                                {getQuizIcon(
                                                                    material.associatedQuiz.length
                                                                        ? true
                                                                        : false,
                                                                )}
                                                            </div>
                                                        </div>
                                                        <p className="text-sm text-brand-600 dark:text-brand-300">
                                                            {material.outputValue}
                                                        </p>
                                                        <div className="flex items-center gap-4 text-xs text-brand-500 dark:text-brand-400">
                                                            <span className="flex items-center gap-1">
                                                                <Clock className="h-3 w-3" />
                                                                {lengths.find(
                                                                    l => l.id == material.length,
                                                                )?.name ?? ""}
                                                            </span>
                                                            <span>
                                                                {complexity.find(
                                                                    l =>
                                                                        l.id == material.complexity,
                                                                )?.name ?? ""}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {material.status == "Completed" && (
                                                        <Badge
                                                            variant="default"
                                                            className="bg-green-500 text-white"
                                                        >
                                                            Completed
                                                        </Badge>
                                                    )}
                                                    <Button
                                                        size="sm"
                                                        className="bg-brand-600 hover:bg-brand-700 text-white"
                                                        onClick={() =>
                                                            handleStartMaterial(
                                                                material.id,
                                                                userData?.trainingMaterialStatus?.find(
                                                                    i =>
                                                                        i.trainingMaterialID ==
                                                                        material.id,
                                                                )?.status,
                                                            )
                                                        }
                                                    >
                                                        {getBtnText(material, userData)}
                                                    </Button>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Path Details */}
                    <Card className="border-brand-200 dark:border-brand-800">
                        <CardHeader>
                            <CardTitle className="text-lg text-brand-800 dark:text-white">
                                Path Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-brand-600 dark:text-brand-300">
                                        Category:
                                    </span>
                                    <Badge variant="outline">
                                        {categories
                                            .filter(c => pathDetails.category.includes(c.id))
                                            .map(c => c.name)
                                            .join(", ") ?? ""}
                                    </Badge>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-brand-600 dark:text-brand-300">
                                        Created:
                                    </span>
                                    <span className="text-brand-800 dark:text-white">
                                        {dayjs(pathDetails.timestamp).format(dateFormat)}
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Quick Actions */}
                    <Card className="border-brand-200 dark:border-brand-800">
                        <CardHeader>
                            <CardTitle className="text-lg text-brand-800 dark:text-white">
                                Quick Actions
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {/* <Button
                                variant="outline"
                                className="w-full bg-transparent"
                            >
                                Download Certificate
                            </Button> */}
                            <Button
                                variant="outline"
                                className="w-full bg-transparent"
                                onClick={() => setShowRatingModal(true)}
                            >
                                Rate & Comment
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Achievement */}
                    {/* <Card className="border-brand-200 dark:border-brand-800 bg-gradient-to-br from-yellow-50/50 to-white dark:from-yellow-950/20 dark:to-card">
                        <CardHeader>
                            <CardTitle className="text-lg text-brand-800 dark:text-white flex items-center gap-2">
                                <Trophy className="h-5 w-5 text-yellow-500" />
                                Achievement
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-center space-y-2">
                                <div className="text-2xl">🏆</div>
                                <p className="text-sm text-brand-600 dark:text-brand-300">
                                    Complete this path to earn the{" "}
                                    <strong>Full Stack Developer</strong>{" "}
                                    certification
                                </p>
                            </div>
                        </CardContent>
                    </Card> */}
                </div>
            </div>

            {/* Rating Modal */}
            <Dialog open={showRatingModal} onOpenChange={setShowRatingModal}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Rate & Comment on Training Material</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium text-brand-800 dark:text-white mb-2 block">
                                Your Rating
                            </label>
                            <div className="flex gap-1">
                                {[1, 2, 3, 4, 5].map(star => (
                                    <button
                                        key={star}
                                        onClick={() => setRating(star)}
                                        className="p-1 hover:scale-110 transition-transform"
                                    >
                                        <Star
                                            className={`h-6 w-6 ${
                                                star <= rating
                                                    ? "fill-yellow-400 text-yellow-400"
                                                    : "text-gray-300 hover:text-yellow-400"
                                            }`}
                                        />
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-brand-800 dark:text-white mb-2 block">
                                Comments (Optional)
                            </label>
                            <Textarea
                                placeholder="Share your thoughts about this training material..."
                                value={comment}
                                onChange={e => setComment(e.target.value)}
                                className="min-h-[100px]"
                            />
                        </div>
                        <div className="flex gap-2 pt-4">
                            <Button
                                variant="outline"
                                onClick={() => setShowRatingModal(false)}
                                className="flex-1"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleRatingSubmit}
                                disabled={rating === 0 || isRating}
                                className="flex-1 bg-brand-600 hover:bg-brand-700 text-white"
                            >
                                {isRating ? (
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : null}
                                {isRating ? "Submitting..." : "Submit Rating"}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
