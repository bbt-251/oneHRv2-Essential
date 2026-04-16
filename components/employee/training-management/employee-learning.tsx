"use client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
    BookOpen,
    Clock,
    Award,
    Play,
    Calendar,
    Users,
    Star,
    TrendingUp,
    CheckCircle,
    Grid3X3,
    Download,
    Loader2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import dayjs from "dayjs";
import { dateFormat, timestampFormat } from "@/lib/util/dayjs_format";
import { TrainingMaterialModel } from "@/lib/models/training-material";
import { useFirestore } from "@/context/firestore-context";
import { EmployeeModel } from "@/lib/models/employee";
import { TrainingPathModel } from "@/lib/models/training-path";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/authContext";
import { updateTrainingMaterial } from "@/lib/backend/api/training/training-material-services";
import { pdf } from "@react-pdf/renderer";
import CertificationComponent from "./blocks/certificateComponent";
import getFullName from "@/lib/util/getEmployeeFullName";
import { TrainingCertificationModel } from "@/lib/models/training-certificate";
import { updateEmployee } from "@/lib/backend/api/employee-management/employee-management-service";
import { LEARNING_LOG_MESSAGES } from "@/lib/log-descriptions/learning";
import { getCategoryDisplayString } from "@/lib/utils";
import { convertToPlayableUrl } from "@/lib/util/learning/url-utils";

export interface ExtendedTrainingMaterialModel extends TrainingMaterialModel {
    progress: number;
}

export interface ExtendedTrainingPathModel extends TrainingPathModel {
    progress: number;
    completedModules: number;
}

export const isAssigned = (
    material: TrainingMaterialModel | TrainingPathModel,
    employee: EmployeeModel,
) => {
    if (employee && material) {
        const employeeUid = employee?.uid ?? "";
        return (
            material.audienceTarget.includes("all") ||
            (employeeUid &&
                material.employees &&
                material.employees?.length > 0 &&
                material.employees?.includes(employeeUid)) ||
            (material?.departments &&
                material?.departments?.length > 0 &&
                material?.departments?.includes(employee.department)) ||
            (material?.sections &&
                material?.sections?.length > 0 &&
                material?.sections?.includes(employee.section)) ||
            (material?.locations &&
                material?.locations?.length > 0 &&
                material?.locations?.includes(employee.workingLocation)) ||
            (material?.grades &&
                material?.grades?.length > 0 &&
                material?.grades?.includes(employee.gradeLevel)) ||
            (employee &&
                material?.audienceTarget?.includes("Managers") &&
                employee?.managerPosition === true) ||
            (employee &&
                material?.audienceTarget?.includes("Not Managers") &&
                employee?.managerPosition === false)
        );
    } else {
        return false;
    }
};

export function EmployeeLearning() {
    const { userData } = useAuth();
    const router = useRouter();
    const {
        trainingMaterials: trainingMaterialData,
        trainingPaths: trainingPathData,
        hrSettings,
        quizzes,
        trainingCertificates,
    } = useFirestore();
    const companyInfo = hrSettings.companyInfo?.at(0) || null;
    const lengths = hrSettings.tmLengths;
    const [averageProgress, setAverageProgress] = useState<number>(0);
    const [trainingMaterials, setTrainingMaterials] = useState<ExtendedTrainingMaterialModel[]>([]);
    const [trainingPaths, setTrainingPaths] = useState<ExtendedTrainingPathModel[]>([]);
    const [ongoingMaterials, setOngoingMaterials] = useState<ExtendedTrainingMaterialModel[]>([]);
    const [ongoingPaths, setOngoingPaths] = useState<ExtendedTrainingPathModel[]>([]);
    const [downloadLoading, setDownloadLoading] = useState<{
        [key: string]: boolean;
    }>({});

    useEffect(() => {
        // training materials
        const materials = trainingMaterialData.filter(
            tm =>
                tm.approvalStatus == "Approved" &&
                tm.publishState &&
                isAssigned(tm, userData ?? ({} as EmployeeModel)),
        );

        const ongoingMaterials = materials.filter(
            tm =>
                userData?.trainingMaterialStatus?.find(p => p.trainingMaterialID == tm.id)
                    ?.status == "In progress",
        );

        setTrainingMaterials(
            materials.map(tm => ({
                ...tm,
                progress:
                    userData?.trainingMaterialsProgress?.find(p => p.trainingMaterial == tm.id)
                        ?.progress ?? 0,
            })),
        );
        setOngoingMaterials(
            ongoingMaterials.map(tm => ({
                ...tm,
                progress:
                    userData?.trainingMaterialsProgress?.find(p => p.trainingMaterial == tm.id)
                        ?.progress ?? 0,
            })),
        );

        // training paths
        const paths = trainingPathData.filter(
            tp => tp.status == "Approved" && isAssigned(tp, userData ?? ({} as EmployeeModel)),
        );

        const paths1: ExtendedTrainingPathModel[] = [];
        paths.map(tp => {
            const completed = tp.trainingMaterials.filter(
                id =>
                    userData?.trainingMaterialStatus?.find(i => i.trainingMaterialID == id)
                        ?.status == "Completed",
            );

            paths1.push({
                ...tp,
                progress:
                    tp.trainingMaterials.length > 0
                        ? (completed.length * 100) / tp.trainingMaterials.length
                        : 0,
                completedModules: completed.length,
            });
        });

        setTrainingPaths(paths1);
        setOngoingPaths(paths1.filter(p => p.progress > 0 && p.progress < 100));
    }, [trainingPathData, trainingMaterialData, userData]);

    // Average progress calculation
    useEffect(() => {
        const totalProgress =
            trainingMaterials.reduce(
                (acc, tm) =>
                    acc +
                    (userData?.trainingMaterialStatus?.find(p => p.trainingMaterialID == tm.id)
                        ?.status == "Completed"
                        ? 100
                        : 0),
                0,
            ) + trainingPaths.reduce((acc, tp) => acc + tp.progress, 0);
        const length = trainingMaterials.length + trainingPaths.length;
        setAverageProgress(length > 0 ? totalProgress / length : 0);
    }, [trainingMaterials, trainingPaths, userData?.trainingMaterialStatus]);

    const recentlyAdded = [
        ...trainingMaterials
            .filter(
                tm =>
                    !userData?.trainingMaterialStatus?.find(p => p.trainingMaterialID == tm.id)
                        ?.status,
            )
            .map(m => ({ ...m, type: "Training Material" })),
        ...trainingPaths.filter(tm => tm.progress == 0).map(p => ({ ...p, type: "Training Path" })),
    ]
        .sort(
            (a, b) =>
                dayjs(b.timestamp, timestampFormat).valueOf() -
                dayjs(a.timestamp, timestampFormat).valueOf(),
        )
        .slice(0, 5);

    const handleDownload = async (cert: TrainingCertificationModel, data: any) => {
        setDownloadLoading(prev => ({ ...prev, [cert.id]: true }));
        try {
            const blob = await pdf(
                <CertificationComponent
                    data={data}
                    logo={companyInfo?.companyLogoURL ?? ""}
                    stamp={""}
                    trainingMaterials={trainingMaterials}
                    quizzes={quizzes}
                />,
            ).toBlob();

            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `${cert.title}.pdf`;
            link.click();
            URL.revokeObjectURL(url);
        } finally {
            setDownloadLoading(prev => ({ ...prev, [cert.id]: false }));
        }
    };

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

    const handleStartTraining = async (id: string, status?: string) => {
        if (status != "In progress" && status != "Completed") {
            const material = trainingMaterials.find(tm => tm.id === id);
            await updateEmployee(
                {
                    id: userData?.id ?? "",
                    trainingMaterialStatus: [
                        ...(userData?.trainingMaterialStatus ?? []).filter(
                            t => t.trainingMaterialID != id,
                        ),
                        { status: "In progress", trainingMaterialID: id },
                    ],
                },
                userData?.uid ?? "",
                LEARNING_LOG_MESSAGES.TRAINING_MATERIAL_STARTED(
                    material?.name || "Unknown Material",
                    userData?.firstName + " " + userData?.surname || "Employee",
                ),
            );
        }
        router.push(`/training-viewer?id=${id}`);
    };

    const handleStartTrainingPath = async (id: string) => {
        const path = trainingPaths.find(tp => tp.id === id);
        await updateEmployee(
            {
                id: userData?.id ?? "",
                trainingMaterialStatus: [
                    ...(userData?.trainingMaterialStatus ?? []),
                    { status: "In progress", trainingMaterialID: id },
                ],
            },
            userData?.uid ?? "",
            LEARNING_LOG_MESSAGES.TRAINING_PATH_STARTED(
                path?.name || "Unknown Path",
                userData?.firstName + " " + userData?.surname || "Employee",
            ),
        );
        router.push(`/training-path-viewer?id=${id}`);
    };

    return (
        <div className="space-y-8 p-6">
            <div className="text-center py-12 bg-gradient-to-br from-brand-50 to-brand-100 dark:from-brand-950 dark:from-black dark:to-black rounded-2xl border border-brand-200 dark:border-brand-800">
                <div className="flex justify-center mb-4">
                    <div className="p-4 bg-brand-600 rounded-full shadow-lg">
                        <BookOpen className="h-8 w-8 text-white" />
                    </div>
                </div>
                <h1 className="text-4xl font-bold text-brand-800 mb-4 dark:text-white">
                    Your Learning Journey
                </h1>
                <p className="text-lg text-brand-600 font-medium dark:text-brand-300 max-w-2xl mx-auto">
                    Continue your professional development and track your progress with our
                    comprehensive learning platform
                </p>
                <div className="flex justify-center gap-4 mt-6">
                    <div className="text-center">
                        <div className="text-2xl font-bold text-brand-800 dark:text-white">
                            {trainingMaterials.length +
                                trainingPaths.reduce(
                                    (acc, tp) =>
                                        (trainingMaterials.some(t =>
                                            tp.trainingMaterials.includes(t.id),
                                        )
                                            ? 1
                                            : 0) + acc,
                                    0,
                                )}
                        </div>
                        <div className="text-sm text-brand-600 dark:text-brand-300">
                            Active Courses
                        </div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-brand-800 dark:text-white">
                            {averageProgress.toFixed(2)}%
                        </div>
                        <div className="text-sm text-brand-600 dark:text-brand-300">
                            Avg Progress
                        </div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-brand-800 dark:text-white">
                            {trainingCertificates.length}
                        </div>
                        <div className="text-sm text-brand-600 dark:text-brand-300">
                            Certifications
                        </div>
                    </div>
                </div>
            </div>

            {/* Continue Learning Section */}
            <section className="space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-brand-200 dark:border-brand-800">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-brand-600 rounded-lg shadow-sm">
                            <Play className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-brand-800 dark:text-white">
                                Continue Learning
                            </h2>
                            <p className="text-sm text-brand-600 dark:text-brand-300">
                                Pick up where you left off
                            </p>
                        </div>
                    </div>
                    <Button
                        onClick={() => {
                            router.push("/all-training");
                        }}
                        className="bg-brand-600 hover:bg-brand-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2"
                    >
                        <Grid3X3 className="h-4 w-4" />
                        See All
                    </Button>
                </div>
                {ongoingMaterials.length || ongoingPaths.length ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {ongoingMaterials.map(material => (
                            <Card
                                key={material.id}
                                className="flex flex-col justify-between hover:shadow-xl transition-all duration-300 border-l-4 border-l-[#3f3d56] border-brand-200 dark:border-brand-800 bg-gradient-to-br from-[#3f3d56]/10 to-white dark:from-[#3f3d56]/20 dark:to-card"
                            >
                                <CardHeader className="pb-3">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="p-3 bg-[#3f3d56] rounded-xl shadow-lg">
                                                <BookOpen className="h-6 w-6 text-white" />
                                            </div>
                                            <div className="flex flex-col">
                                                <Badge
                                                    variant="secondary"
                                                    className="text-xs bg-[#3f3d56]/10 text-[#3f3d56] dark:bg-[#3f3d56]/20 dark:text-[#3f3d56] font-semibold mb-1 w-fit"
                                                >
                                                    {material.format === "Audio"
                                                        ? "🔊 Audio"
                                                        : material.format === "Video"
                                                            ? "📹 VIDEO"
                                                            : material.format === "PDF"
                                                                ? "📄 PDF"
                                                                : "📋 DOCUMENT"}
                                                </Badge>
                                                <Badge
                                                    variant="outline"
                                                    className="text-xs border-[#3f3d56]/30 text-[#3f3d56] dark:border-[#3f3d56]/50 dark:text-[#3f3d56] w-fit"
                                                >
                                                    {getCategoryDisplayString(
                                                        material.category,
                                                        hrSettings.tmCategories,
                                                    )}
                                                </Badge>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {getComplexityIcon(material.complexity)}
                                            {getQuizIcon(
                                                material.associatedQuiz.length ? true : false,
                                            )}
                                        </div>
                                    </div>
                                    <CardTitle className="text-lg text-brand-800 dark:text-white mt-2">
                                        {material.name}
                                    </CardTitle>
                                    <CardDescription className="flex items-center gap-2 text-brand-600 dark:text-brand-300">
                                        <Clock className="h-4 w-4" />
                                        {lengths.find(l => l.id == material.length)?.name ?? ""}
                                    </CardDescription>
                                </CardHeader>
                                {/* ... existing CardContent ... */}
                                <CardContent className="space-y-9">
                                    {material.format === "PDF" ||
                                    convertToPlayableUrl(material.url)?.type == "iframe" ? (
                                            <div className="rounded-lg p-4"></div>
                                        ) : (
                                            <div className="space-y-2">
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-brand-600 dark:text-brand-300">
                                                    Progress
                                                    </span>
                                                    <span className="font-medium text-brand-800 dark:text-white">
                                                        {material.progress.toFixed(2)}%
                                                    </span>
                                                </div>
                                                <Progress
                                                    value={material.progress}
                                                    className="h-2 bg-brand-100 dark:bg-brand-900/30"
                                                />
                                            </div>
                                        )}
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-brand-600 dark:text-brand-300 flex items-center gap-1">
                                            <Calendar className="h-3 w-3" />
                                            Due: {dayjs(material.endDate).format(dateFormat)}
                                        </span>
                                        <Button
                                            size="sm"
                                            className="bg-brand-600 hover:bg-brand-700 text-white shadow-md"
                                            onClick={() => handleStartTraining(material.id)}
                                        >
                                            Continue
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}

                        {ongoingPaths.map(path => (
                            <Card
                                key={path.id}
                                className="hover:shadow-xl transition-all duration-300 border-l-4 border-l-[#ffe6a7] border-brand-200 dark:border-brand-800 bg-gradient-to-br from-[#ffe6a7]/30 to-white dark:from-[#ffe6a7]/20 dark:to-card"
                            >
                                <CardHeader className="pb-3">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="p-3 bg-[#d4a574] rounded-xl shadow-lg">
                                                <Users className="h-6 w-6 text-white" />
                                            </div>
                                            <div className="flex flex-col">
                                                <Badge
                                                    variant="secondary"
                                                    className="text-xs bg-[#ffe6a7] text-[#8b6914] dark:bg-[#ffe6a7]/80 dark:text-[#8b6914] font-semibold mb-1 w-fit"
                                                >
                                                    🛤️ LEARNING PATH
                                                </Badge>
                                            </div>
                                        </div>
                                        {/* <div className="flex items-center gap-2">
                                            {getComplexityIcon("Advanced")}
                                            {getQuizIcon(false)}
                                        </div> */}
                                    </div>
                                    <CardTitle className="text-lg text-brand-800 dark:text-white mt-2">
                                        {path.name}
                                    </CardTitle>
                                    <CardDescription className="text-brand-600 dark:text-brand-300">
                                        {path.description}
                                    </CardDescription>
                                </CardHeader>
                                {/* ... existing CardContent ... */}
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-brand-600 dark:text-brand-300">
                                                Progress
                                            </span>
                                            <span className="font-medium text-brand-800 dark:text-white">
                                                {path.progress.toFixed(2)}%
                                            </span>
                                        </div>
                                        <Progress
                                            value={path.progress}
                                            className="h-3 bg-brand-100 dark:bg-brand-900/30"
                                        />
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-brand-600 dark:text-brand-300 flex items-center gap-1">
                                            <CheckCircle className="h-3 w-3" />
                                            {path.completedModules}/
                                            {path.trainingMaterials?.length ?? 0} modules
                                        </span>
                                        <span className="text-brand-600 dark:text-brand-300">
                                            {path.estimatedDuration} Weeks
                                        </span>
                                    </div>
                                    <Button
                                        size="sm"
                                        className="w-full bg-brand-600 hover:bg-brand-700 text-white shadow-md"
                                        onClick={() => handleStartTrainingPath(path.id)}
                                    >
                                        Continue Path
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className="flex justify-center text-sm text-gray-400">
                        <p>No ongoing material</p>
                    </div>
                )}
            </section>

            {/* Recently Added Section */}
            <section className="space-y-6">
                <div className="flex items-center gap-3 pb-4 border-b border-brand-200 dark:border-brand-800">
                    <div className="p-2 bg-brand-600 rounded-lg shadow-sm">
                        <Calendar className="h-5 w-5 text-white" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-brand-800 dark:text-white">
                            Recently Added
                        </h2>
                        <p className="text-sm text-brand-600 dark:text-brand-300">
                            Discover new learning opportunities
                        </p>
                    </div>
                </div>
                {recentlyAdded.length ? (
                    <Card className="border-brand-200 dark:border-brand-800 shadow-lg">
                        <CardContent className="p-0">
                            <div className="divide-y divide-brand-200 dark:divide-brand-800">
                                {recentlyAdded.map((item, index) => (
                                    <div
                                        key={item.id}
                                        className={`p-6 hover:bg-brand-50 dark:hover:bg-brand-700 transition-colors border-l-4 ${
                                            item.type === "Training Path"
                                                ? "border-l-[#ffe6a7] bg-gradient-to-r from-[#ffe6a7]/20 to-transparent dark:from-[#ffe6a7]/10"
                                                : "border-l-[#3f3d56] bg-gradient-to-r from-[#3f3d56]/10 to-transparent dark:from-[#3f3d56]/10"
                                        } ${
                                            index === 0
                                                ? "bg-gradient-to-r from-brand-50/50 to-transparent dark:from-brand-950/20"
                                                : ""
                                        }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div
                                                    className={`p-4 rounded-xl shadow-lg ${
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
                                                <div className="space-y-2">
                                                    <h3 className="font-semibold text-brand-800 dark:text-white flex items-center gap-2">
                                                        {item.name}
                                                        {index === 0 && (
                                                            <Star className="h-4 w-4 text-yellow-500 fill-current" />
                                                        )}
                                                        <div className="flex items-center gap-2 ml-2">
                                                            {item.type == "Training Management" ? (
                                                                getComplexityIcon(
                                                                    (item as any).complexity,
                                                                )
                                                            ) : (
                                                                <></>
                                                            )}
                                                            {item.type == "Training Management" ? (
                                                                getQuizIcon(
                                                                    (item as any).associatedQuiz,
                                                                )
                                                            ) : (
                                                                <></>
                                                            )}
                                                        </div>
                                                    </h3>
                                                    <div className="flex items-center gap-4 text-sm">
                                                        <Badge
                                                            variant="secondary"
                                                            className={`text-xs font-semibold ${
                                                                item.type === "Training Path"
                                                                    ? "bg-[#ffe6a7] text-[#8b6914] dark:bg-[#ffe6a7]/80 dark:text-[#8b6914]"
                                                                    : "bg-[#3f3d56]/10 text-[#3f3d56] dark:bg-[#3f3d56]/20 dark:text-[#3f3d56]"
                                                            }`}
                                                        >
                                                            {item.type === "Training Path"
                                                                ? "🛤️ LEARNING PATH"
                                                                : (item as any).format === "Audio"
                                                                    ? "🔊 Audio"
                                                                    : (item as any).format === "Video"
                                                                        ? "📹 VIDEO"
                                                                        : (item as any).format === "PDF"
                                                                            ? "📄 PDF"
                                                                            : "📋 DOCUMENT"}
                                                        </Badge>
                                                        <span className="flex items-center gap-1 text-brand-600 dark:text-brand-300">
                                                            <TrendingUp className="h-3 w-3" />
                                                            {getCategoryDisplayString(
                                                                item.category,
                                                                hrSettings.tmCategories,
                                                            )}
                                                        </span>
                                                        <span className="flex items-center gap-1 text-brand-600 dark:text-brand-300">
                                                            <Clock className="h-3 w-3" />
                                                            {item.type == "Training Path"
                                                                ? `${
                                                                    (item as any)
                                                                        .estimatedDuration
                                                                } Weeks`
                                                                : `${
                                                                    lengths.find(
                                                                        l =>
                                                                            l.id ==
                                                                              (item as any).length,
                                                                    )?.name ?? ""
                                                                }`}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <span className="text-sm text-brand-600 dark:text-brand-300">
                                                    Added{" "}
                                                    {dayjs(item.timestamp).format(timestampFormat)}
                                                </span>
                                                <Button
                                                    size="sm"
                                                    className="bg-brand-600 hover:bg-brand-700 text-white shadow-md"
                                                    onClick={() =>
                                                        item.type === "Training Material"
                                                            ? handleStartTraining(item.id)
                                                            : handleStartTrainingPath(item.id)
                                                    }
                                                >
                                                    Start Learning
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="flex justify-center text-sm text-gray-400">
                        <p>No recently added material</p>
                    </div>
                )}
            </section>

            {/* ... Acquired Certifications Section ... */}
            {trainingCertificates.length ? (
                <section className="space-y-6">
                    <div className="flex items-center gap-3 pb-4 border-b border-brand-200 dark:border-brand-800">
                        <div className="p-2 bg-yellow-600 rounded-lg shadow-sm">
                            <Award className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-brand-800 dark:text-white">
                                Acquired Certifications
                            </h2>
                            <p className="text-sm text-brand-600 dark:text-brand-300">
                                Your professional achievements
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {trainingCertificates.map(cert => {
                            const material = trainingMaterials.find(tm => tm.id == cert.id);
                            const status = userData?.trainingMaterialStatus?.find(
                                tm => tm.trainingMaterialID == cert.trainingMaterialId,
                            );
                            const data = {
                                ...cert,
                                fullName: userData ? getFullName(userData) : "",
                                completionDate: status?.completionDate ?? "",
                                associatedQuiz: material?.associatedQuiz ?? [],
                            };
                            return (
                                <Card
                                    key={cert.id}
                                    className="hover:shadow-xl transition-all duration-300 border-l-4 border-l-yellow-500 border-brand-200 dark:border-brand-800 bg-gradient-to-br from-yellow-50/50 to-white dark:from-yellow-950/20 dark:to-card"
                                >
                                    <CardHeader className="pb-3">
                                        <div className="flex items-start justify-between">
                                            <div className="p-3 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl shadow-lg">
                                                <Award className="h-6 w-6 text-white" />
                                            </div>
                                        </div>
                                        <CardTitle className="text-lg text-brand-800 dark:text-white">
                                            {cert.title}
                                        </CardTitle>
                                        <CardDescription className="text-brand-600 dark:text-brand-300 font-medium">
                                            {companyInfo?.companyName ?? ""}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="space-y-3 text-sm bg-brand-50 dark:bg-yellow-900 p-4 rounded-lg">
                                            <div className="flex justify-between">
                                                <span className="text-brand-600 dark:text-brand-300">
                                                    Earned:
                                                </span>
                                                <span className="font-medium text-brand-800 dark:text-white">
                                                    {cert.timestamp}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-brand-600 dark:text-brand-300">
                                                    Title:
                                                </span>
                                                <span className="font-mono text-xs text-brand-800 dark:text-white bg-white dark:bg-brand-900 px-2 py-1 rounded">
                                                    {material?.name ?? ""}
                                                </span>
                                            </div>
                                        </div>
                                        <Button
                                            size="sm"
                                            disabled={downloadLoading[cert.id]}
                                            onClick={() => handleDownload(cert, data)}
                                            className="w-full bg-brand-600 hover:bg-brand-700 text-white shadow-md"
                                        >
                                            {downloadLoading[cert.id] ? (
                                                <>
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    Preparing...
                                                </>
                                            ) : (
                                                <>
                                                    <Download className="mr-2 h-4 w-4" />
                                                    Get Certificate
                                                </>
                                            )}
                                        </Button>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                </section>
            ) : (
                <></>
            )}
        </div>
    );
}
