"use client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/authContext";
import { useFirestore } from "@/context/firestore-context";
import { useToast } from "@/context/toastContext";
import { updateEmployee } from "@/lib/backend/api/employee-management/employee-management-service";
import { updateTrainingMaterial } from "@/lib/backend/api/training/training-material-services";
import { LEARNING_LOG_MESSAGES } from "@/lib/log-descriptions/learning";
import { EmployeeModel } from "@/lib/models/employee";
import { TrainingMaterialModel } from "@/lib/models/training-material";
import { SurveyResponseModal } from "@/components/employee/employee-engagement/modals/survey-response-modal";
import { SurveyModel } from "@/lib/models/survey";
import { transformSurveyForModal } from "@/components/employee/employee-engagement/blocks/survey/survey";
import {
    ArrowLeft,
    BookOpen,
    CheckCircle,
    Clock,
    Download,
    Eye,
    FileText,
    Loader2,
    Play,
    Radio,
    Star,
    Video,
    XCircle,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ExtendedTrainingMaterialModel } from "../employee-learning";
import { VideoPlayer } from "@/components/common/video-player";
import PdfViewer from "./pdf-viewer";
import { createTrainingCertificate } from "@/lib/backend/api/training/training-certificate-service";
import { getTimestamp } from "@/lib/util/dayjs_format";
import { TrainingCertificationModel } from "@/lib/models/training-certificate";
import { convertToPlayableUrl } from "@/lib/util/learning/url-utils";
function CardContentWrapper({
    userData,
    trainingMaterialId,
    progress,
    children,
    isReactPlayer,
    onUnmount,
}: {
    userData: EmployeeModel | null;
    trainingMaterialId: string;
    progress: number;
    children: React.ReactNode;
    isReactPlayer: boolean;
    onUnmount?: () => void;
}) {
    const progressRef = useRef(progress);

    useEffect(() => {
        progressRef.current = progress;
    }, [progress]);

    useEffect(() => {
        return () => {
            // This runs when CardContentWrapper unmounts
            if (isReactPlayer) {
                const otherTM =
                    userData?.trainingMaterialsProgress?.filter(
                        t => t.trainingMaterial != trainingMaterialId,
                    ) ?? [];

                updateEmployee({
                    id: userData?.id ?? "",
                    trainingMaterialsProgress: [
                        ...otherTM,
                        {
                            trainingMaterial: trainingMaterialId,
                            progress: progressRef.current,
                        },
                    ],
                });
            }
        };
    }, [isReactPlayer]);

    return <CardContent className="p-6">{children}</CardContent>;
}

export function TrainingViewer() {
    const { userData } = useAuth();
    const router = useRouter();
    const { showToast } = useToast();
    const params = useSearchParams();
    const id = params.get("id");
    const origin = params.get("origin");
    const {
        trainingMaterials: trainingMaterialData,
        trainingPaths,
        hrSettings,
        quizzes,
        surveys,
        multipleChoices,
        shortAnswers,
    } = useFirestore();
    const competencies = hrSettings.competencies;
    const categories = hrSettings.tmCategories;
    const lengths = hrSettings.tmLengths;
    const complexity = hrSettings.tmComplexity;
    const commonAnswers = hrSettings.commonAnswerTypes;
    const [material, setMaterial] = useState<ExtendedTrainingMaterialModel | null>(null);
    const [relatedMaterials, setRelatedMaterials] = useState<TrainingMaterialModel[]>([]);
    const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState("");
    const [isRelatedMaterialsOpen, setIsRelatedMaterialsOpen] = useState(false);
    const [isCompleting, setIsCompleting] = useState(false);
    const [isAcquiring, setIsAcquiring] = useState(false);
    const [isRating, setIsRating] = useState(false);
    const [progress, setProgress] = useState(0);
    const [isSurveyModalOpen, setIsSurveyModalOpen] = useState(false);
    const [selectedSurvey, setSelectedSurvey] = useState<SurveyModel | null>(null);
    const [surveyMode, setSurveyMode] = useState<"respond" | "view">("respond");

    useEffect(() => {
        const trainingMaterial = trainingMaterialData.find(
            tm => tm.id == id && (tm.approvalStatus == "Approved" || true),
        );
        if (trainingMaterial) {
            setMaterial({
                ...trainingMaterial,
                progress:
                    userData?.trainingMaterialsProgress?.find(
                        p => p.trainingMaterial == trainingMaterial.id,
                    )?.progress ?? 0,
            });
            setRating(
                trainingMaterial.employeeFeedbacks.find(f => f.employeeUid == userData?.uid)
                    ?.rating ?? 0,
            );
            setComment(
                trainingMaterial.employeeFeedbacks.find(f => f.employeeUid == userData?.uid)
                    ?.comment ?? "",
            );
            setProgress(
                userData?.trainingMaterialsProgress?.find(
                    p => p.trainingMaterial == trainingMaterial.id,
                )?.progress ?? 0,
            );
        }
    }, [trainingMaterialData, userData, id]);

    useEffect(() => {
        const relatedMaterialIds = trainingPaths.flatMap(tp =>
            tp.trainingMaterials.includes(material?.id ?? "")
                ? tp.trainingMaterials.filter(id => id !== material?.id)
                : [],
        );

        const relatedMaterials = trainingMaterialData.filter(
            tm => relatedMaterialIds.includes(tm.id) && (tm.approvalStatus == "Approved" || true),
        );

        setRelatedMaterials(relatedMaterials);
    }, [trainingPaths, trainingMaterialData, material]);

    const handleRatingSubmit = async () => {
        if (material) {
            setIsRating(true);
            const otherFeedbacks = material.employeeFeedbacks.filter(
                f => f.employeeUid !== userData?.uid,
            );
            const res = await updateTrainingMaterial(
                {
                    id: material.id,
                    employeeFeedbacks: [
                        ...otherFeedbacks,
                        { employeeUid: userData?.uid ?? "", rating, comment },
                    ],
                },
                userData?.uid ?? "",
                LEARNING_LOG_MESSAGES.TRAINING_MATERIAL_RATED(
                    material.name,
                    userData?.firstName + " " + userData?.surname || "Employee",
                ),
            );
            if (res) {
                showToast("Rating successful", "Success", "success");
                setIsRatingModalOpen(false);
            } else {
                showToast("Error rating", "Error", "error");
            }
            setIsRating(false);
        }
    };

    const handleMarkComplete = async () => {
        if (material) {
            setIsCompleting(true);
            const res = await updateEmployee(
                {
                    id: userData?.id ?? "",
                    trainingMaterialStatus: [
                        ...(userData?.trainingMaterialStatus?.filter(
                            t => t.trainingMaterialID != material.id,
                        ) ?? []),
                        {
                            status: "Completed",
                            trainingMaterialID: material.id,
                        },
                    ],
                },
                userData?.uid ?? "",
                LEARNING_LOG_MESSAGES.TRAINING_MATERIAL_COMPLETED(
                    material.name,
                    userData?.firstName + " " + userData?.surname || "Employee",
                ),
            );
            if (res) {
                showToast("Marked as complete", "Success", "success");
            } else {
                showToast("Error marking as complete", "Error", "error");
            }
            setIsCompleting(false);
        }
    };

    const handleAcquireCertificate = async () => {
        if (material) {
            setIsAcquiring(true);
            const certificate: Omit<TrainingCertificationModel, "id"> = {
                timestamp: getTimestamp(),
                uid: userData?.uid ?? "",
                title: material.certificationTitle,
                trainingMaterialId: material.id,
                availability: material?.availability,
                trainingName: material?.name,
                trainingComplexity: material?.complexity,
                trainingLength: material?.length,
                trainingFormat: material?.format,
            };

            const res = await createTrainingCertificate(
                certificate,
                userData?.uid ?? "",
                LEARNING_LOG_MESSAGES.TRAINING_CERTIFICATE_ACQUIRED(
                    material.name,
                    userData?.firstName + " " + userData?.surname || "Employee",
                ),
            );
            if (res) {
                showToast("Certificate acquired successfully", "Success", "success");
            } else {
                showToast("Error acquiring certificate", "Error", "error");
            }
            setIsAcquiring(false);
        }
    };

    const handleUnmark = async () => {
        if (material) {
            setIsCompleting(true);
            const res = await updateEmployee(
                {
                    id: userData?.id ?? "",
                    trainingMaterialStatus: [
                        ...(userData?.trainingMaterialStatus?.filter(
                            t => t.trainingMaterialID != material.id,
                        ) ?? []),
                        {
                            status: "In progress",
                            trainingMaterialID: material.id,
                        },
                    ],
                },
                userData?.uid ?? "",
                LEARNING_LOG_MESSAGES.TRAINING_MATERIAL_INCOMPLETE(
                    material.name,
                    userData?.firstName + " " + userData?.surname || "Employee",
                ),
            );
            if (res) {
                showToast("Un-marked successfully", "Success", "success");
            } else {
                showToast("Error un-marking as complete", "Error", "error");
            }
            setIsCompleting(false);
        }
    };

    const handleTakeQuiz = (_id: string) => {
        router.push(`quiz-interface?id=${_id}&training=${id}`);
    };

    const handleTakeSurvey = (survey: SurveyModel) => {
        const hasResponded = survey.responses?.some(response => response.uid === userData?.uid);
        setSelectedSurvey(survey);
        setSurveyMode(hasResponded ? "view" : "respond");
        setIsSurveyModalOpen(true);
    };

    const getResourceIcon = (format: string) => {
        switch (format) {
            case "Video":
                return <Video className="h-5 w-5 text-white" />;
            case "Audio":
                return <Radio className="h-5 w-5 text-white" />;
            case "PDF":
                return <FileText className="h-5 w-5 text-white" />;
            case "document":
                return <BookOpen className="h-5 w-5 text-white" />;
            default:
                return <BookOpen className="h-5 w-5 text-white" />;
        }
    };

    const getComplexityColor = (complexity: string) => {
        switch (complexity?.toLowerCase()) {
            case "beginner":
                return "bg-green-500";
            case "intermediate":
                return "bg-yellow-500";
            case "advanced":
                return "bg-red-500";
            default:
                return "bg-gray-400";
        }
    };

    const renderContent = () => {
        if (["Video", "Audio"].includes(material?.format ?? "")) {
            return (
                <div className="aspect-video w-full bg-black rounded-lg overflow-hidden">
                    <VideoPlayer
                        url={material?.url ?? ""}
                        format={material?.format ?? ""}
                        initialProgress={progress}
                        setProgress={setProgress}
                    />
                </div>
            );
        } else if (material?.format == "PDF") {
            return (
                <div className="aspect-[4/3] w-full bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
                    <PdfViewer url={material.url} isDownloadable={true} />
                </div>
            );
        } else {
            return (
                <div className="aspect-video w-full bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                    <p className="text-gray-500">Content not available</p>
                </div>
            );
        }
    };

    return (
        <>
            {material ? (
                <div className="space-y-6 p-6 max-w-6xl mx-auto">
                    {/* Header */}
                    <div className="flex items-center gap-4 pb-4 border-b border-brand-200 dark:border-brand-800">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                router.push(origin ?? "/learning");
                            }}
                            className="flex items-center gap-2"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back to Learning
                        </Button>
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-[#3f3d56] rounded-lg">
                                {getResourceIcon(material.format)}
                                <span className="sr-only">Training Material</span>
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-brand-800 dark:text-white">
                                    {material.name}
                                </h1>
                                <p className="text-brand-600 dark:text-brand-300">
                                    {material.outputValue}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Main Content */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Video/Content Player */}
                            <Card className="border-brand-200 dark:border-brand-800">
                                {/* <CardContent className="p-6">
                                {renderContent()}
                            </CardContent> */}
                                <CardContentWrapper
                                    userData={userData}
                                    trainingMaterialId={material.id}
                                    isReactPlayer={
                                        convertToPlayableUrl(material.url)?.type === "react-player"
                                    }
                                    progress={progress}
                                >
                                    {renderContent()}
                                </CardContentWrapper>
                            </Card>

                            {/* Training Highlights */}
                            <Card className="border-brand-200 dark:border-brand-800 bg-gradient-to-r from-brand-50 to-brand-100 dark:from-black dark:to-black">
                                <CardHeader>
                                    <CardTitle className="text-lg text-brand-800 dark:text-white flex items-center gap-2">
                                        <BookOpen className="h-5 w-5" />
                                        Training Highlights
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="bg-white dark:bg-black dark:border dark:border-gray-800 rounded-lg p-4 space-y-3">
                                        <h4 className="font-semibold text-brand-800 dark:text-white text-sm">
                                            Key Learning Points:
                                        </h4>
                                        <ul className="space-y-2 text-sm text-brand-600 dark:text-brand-300">
                                            {material?.trainingOutcome?.map((outcome, index) => (
                                                <li key={index} className="flex items-start gap-2">
                                                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                                                    <span>{outcome}</span>
                                                </li>
                                            ))}

                                            {material.associatedQuiz.length ? (
                                                <li className="flex items-start gap-2">
                                                    <CheckCircle className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                                                    <span>
                                                        Validate understanding through comprehensive
                                                        assessment
                                                    </span>
                                                </li>
                                            ) : (
                                                <></>
                                            )}
                                        </ul>
                                    </div>

                                    {/* Download button for PDFs only */}
                                    {material.format === "PDF" ? (
                                        <div className="bg-white dark:bg-brand-900 rounded-lg p-4">
                                            <Button
                                                asChild
                                                variant="outline"
                                                className="w-full bg-transparent"
                                            >
                                                <a
                                                    href={material.url}
                                                    download
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                >
                                                    <Download className="h-4 w-4 mr-2" />
                                                    Download PDF
                                                </a>
                                            </Button>
                                        </div>
                                    ) : (
                                        <></>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Competencies Acquired */}
                            <Card className="border-brand-200 dark:border-brand-800 bg-gradient-to-r from-brand-50 to-brand-100 dark:from-black dark:to-black">
                                <CardHeader>
                                    <CardTitle className="text-lg text-brand-800 dark:text-white flex items-center gap-2">
                                        <CheckCircle className="h-5 w-5 text-green-600" />
                                        Competencies Acquired
                                    </CardTitle>
                                    <CardDescription className="text-brand-600 dark:text-brand-300">
                                        Skills and knowledge you'll gain from this training material
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="bg-white dark:bg-black dark:border dark:border-gray-700 rounded-lg p-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {material.targetedCompetencies.map((id, index) => {
                                                const competency = competencies.find(
                                                    c => c.id == id,
                                                );
                                                return (
                                                    <div
                                                        key={index}
                                                        className={`flex items-center gap-3 p-3 ${
                                                            index % 2 == 0
                                                                ? "bg-green-50 dark:bg-green-900/20"
                                                                : "bg-orange-50 dark:bg-orange-900/20"
                                                        } rounded-lg`}
                                                    >
                                                        <div
                                                            className={`w-8 h-8 ${
                                                                index % 2 == 0
                                                                    ? "bg-green-100 dark:bg-green-800"
                                                                    : "bg-orange-100 dark:bg-orange-800"
                                                            } rounded-full flex items-center justify-center`}
                                                        >
                                                            <CheckCircle
                                                                className={`h-4 w-4 ${
                                                                    index % 2 == 0
                                                                        ? "text-green-600"
                                                                        : "text-orange-600"
                                                                }`}
                                                            />
                                                        </div>
                                                        <div>
                                                            <h5 className="font-medium text-brand-800 dark:text-white text-sm">
                                                                {competency?.competenceName ?? ""}
                                                            </h5>
                                                            <p className="text-xs text-brand-600 dark:text-brand-300">
                                                                Type:{" "}
                                                                {competency?.competenceType ?? ""}
                                                            </p>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Attachments and Notes */}
                            {(material.attachments.length > 0 || material.notes) && (
                                <Card className="border-brand-200 dark:border-brand-800 bg-gradient-to-r from-brand-50 to-brand-100 dark:from-black dark:to-black">
                                    <CardHeader>
                                        <CardTitle className="text-lg text-brand-800 dark:text-white flex items-center gap-2">
                                            <FileText className="h-5 w-5" />
                                            Attachments & Notes
                                        </CardTitle>
                                        <CardDescription className="text-brand-600 dark:text-brand-300">
                                            Additional resources and notes for this training
                                            material
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="bg-white dark:bg-black dark:border dark:border-gray-700 rounded-lg p-4 space-y-4">
                                            {material.attachments.length > 0 && (
                                                <div>
                                                    <h4 className="font-semibold text-brand-800 dark:text-white text-sm mb-3">
                                                        Attachments:
                                                    </h4>
                                                    <div className="space-y-2">
                                                        {material.attachments.map((att, index) => (
                                                            <div
                                                                key={index}
                                                                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                                                            >
                                                                <div className="flex items-center space-x-3">
                                                                    <FileText className="h-5 w-5 text-gray-500" />
                                                                    <div>
                                                                        <a
                                                                            href={att.attachmentUrl}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            className="text-sm font-medium text-brand-600 hover:underline dark:text-brand-400 block truncate max-w-xs"
                                                                        >
                                                                            {att.attachmentTitle}
                                                                        </a>
                                                                        <p className="text-xs text-gray-500">
                                                                            {att.attachmentFormat}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    asChild
                                                                >
                                                                    <a
                                                                        href={att.attachmentUrl}
                                                                        download
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                    >
                                                                        <Eye className="h-4 w-4" />
                                                                    </a>
                                                                </Button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                            {material.notes && (
                                                <div>
                                                    <h4 className="font-semibold text-brand-800 dark:text-white text-sm mb-3">
                                                        Notes:
                                                    </h4>
                                                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                                                        <p className="text-sm text-brand-600 dark:text-brand-300 whitespace-pre-wrap">
                                                            {material.notes}
                                                        </p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </div>

                        {/* Sidebar */}
                        <div className="space-y-6">
                            {/* Course Info */}
                            <Card className="border-brand-200 dark:border-brand-800">
                                <CardHeader>
                                    <CardTitle className="text-lg text-brand-800 dark:text-white">
                                        Course Information
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-brand-600 dark:text-brand-300">
                                                Category
                                            </span>
                                            <Badge variant="outline" className="text-xs">
                                                {}

                                                {material.category
                                                    .map(
                                                        cat =>
                                                            categories.find(c => c.id == cat)
                                                                ?.name ?? "",
                                                    )
                                                    .join(", ")}
                                            </Badge>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-brand-600 dark:text-brand-300">
                                                Duration
                                            </span>
                                            <span className="text-sm font-medium text-brand-800 dark:text-white flex items-center gap-1">
                                                <Clock className="h-3 w-3" />
                                                {lengths.find(l => l.id == material.length)?.name ??
                                                    ""}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-brand-600 dark:text-brand-300">
                                                Complexity
                                            </span>
                                            <div className="flex items-center gap-2">
                                                <div
                                                    className={`w-3 h-3 rounded-full ${getComplexityColor(
                                                        material.complexity,
                                                    )}`}
                                                />
                                                <span className="text-sm font-medium text-brand-800 dark:text-white">
                                                    {complexity.find(
                                                        l => l.id == material.complexity,
                                                    )?.name ?? ""}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-brand-600 dark:text-brand-300">
                                                Format
                                            </span>
                                            <Badge variant="secondary" className="text-xs">
                                                {material.format === "Audio"
                                                    ? "🔊 Audio"
                                                    : material.format === "Video"
                                                        ? "📹 VIDEO"
                                                        : material.format === "PDF"
                                                            ? "📄 PDF"
                                                            : "📋 DOCUMENT"}
                                            </Badge>
                                        </div>
                                        {material.associatedQuiz.length ? (
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-brand-600 dark:text-brand-300">
                                                    Quiz Available
                                                </span>
                                                <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                                                    <span className="text-white text-xs font-bold">
                                                        ?
                                                    </span>
                                                </div>
                                            </div>
                                        ) : (
                                            <></>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Quiz Section */}
                            {material.associatedQuiz.length ? (
                                <Card className="border-brand-200 dark:border-brand-800">
                                    <CardHeader>
                                        <CardTitle className="text-lg text-brand-800 dark:text-white flex items-center gap-2">
                                            <CheckCircle className="h-5 w-5" />
                                            Knowledge Check
                                        </CardTitle>
                                        <CardDescription>
                                            Complete the quiz after finishing the material
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        {material.associatedQuiz.map(id => {
                                            const quiz = quizzes.find(q => q.id == id);
                                            return (
                                                <div
                                                    key={id}
                                                    className="flex justify-between items-center pb-2 border-b border-gray-100"
                                                >
                                                    <p>{quiz?.quizTitle ?? ""}</p>
                                                    <Button
                                                        className="bg-blue-600 hover:bg-blue-700 text-white"
                                                        onClick={() => handleTakeQuiz(id)}
                                                    >
                                                        {quiz?.quizTakenTimestamp?.find(
                                                            t => t.employeeUid == userData?.uid,
                                                        )
                                                            ? "Review Quiz"
                                                            : "Take Quiz"}
                                                    </Button>
                                                </div>
                                            );
                                        })}
                                    </CardContent>
                                </Card>
                            ) : (
                                <></>
                            )}

                            {/* Survey Section */}
                            {material.sentSurveyIDs && material.sentSurveyIDs.length > 0 ? (
                                <Card className="border-brand-200 dark:border-brand-800">
                                    <CardHeader>
                                        <CardTitle className="text-lg text-brand-800 dark:text-white flex items-center gap-2">
                                            <CheckCircle className="h-5 w-5" />
                                            Surveys
                                        </CardTitle>
                                        <CardDescription>
                                            Complete surveys related to this training material
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        {material.sentSurveyIDs.map(surveyId => {
                                            const now = new Date();
                                            const survey = surveys.find(
                                                s =>
                                                    s.id === surveyId &&
                                                    now >= new Date(s.startDate) &&
                                                    now <= new Date(s.endDate),
                                            );
                                            if (!survey) return null;

                                            const hasResponded = survey.responses?.some(
                                                response => response.uid === userData?.uid,
                                            );

                                            return (
                                                <div
                                                    key={surveyId}
                                                    className="flex justify-between items-center pb-2 border-b border-gray-100"
                                                >
                                                    <p>{survey.surveyTitle}</p>
                                                    <Button
                                                        className="bg-green-600 hover:bg-green-700 text-white"
                                                        onClick={() => handleTakeSurvey(survey)}
                                                    >
                                                        {hasResponded
                                                            ? "Review Survey"
                                                            : "Take Survey"}
                                                    </Button>
                                                </div>
                                            );
                                        })}
                                    </CardContent>
                                </Card>
                            ) : (
                                <></>
                            )}

                            {/* Completion Status Box */}
                            {userData?.trainingMaterialStatus?.find(
                                tm => tm.trainingMaterialID == material.id,
                            )?.status == "Completed" ? (
                                    <Card className="border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20">
                                        <CardContent className="p-4">
                                            <div className="flex items-center gap-3 mb-3">
                                                <CheckCircle className="h-5 w-5 text-green-600" />
                                                <div>
                                                    <h4 className="font-medium text-green-800 dark:text-green-200">
                                                    Training Complete!
                                                    </h4>
                                                    <p className="text-sm text-green-600 dark:text-green-300">
                                                    This material has been marked as complete.
                                                    </p>
                                                </div>
                                            </div>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={handleUnmark}
                                                disabled={isCompleting}
                                                className="w-full border-green-300 text-green-700 hover:bg-green-100 
                                          dark:border-green-600 dark:text-green-300 dark:hover:bg-green-800 
                                            bg-transparent justify-start"
                                            >
                                                {isCompleting ? (
                                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                ) : (
                                                    <XCircle className="h-4 w-4 mr-2" />
                                                )}
                                                {isCompleting ? "Unmarking..." : "Unmark as Complete"}
                                            </Button>
                                        </CardContent>
                                    </Card>
                                ) : (
                                    <></>
                                )}

                            {/* Next Steps */}
                            <Card className="border-brand-200 dark:border-brand-800">
                                <CardHeader>
                                    <CardTitle className="text-lg text-brand-800 dark:text-white">
                                        Next Steps
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {relatedMaterials.length ? (
                                        <Dialog
                                            open={isRelatedMaterialsOpen}
                                            onOpenChange={setIsRelatedMaterialsOpen}
                                        >
                                            <DialogTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    className="w-full justify-start bg-transparent"
                                                >
                                                    <BookOpen className="h-4 w-4 mr-2" />
                                                    Related Materials
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-y-auto">
                                                <DialogHeader>
                                                    <DialogTitle>
                                                        Related Training Materials
                                                    </DialogTitle>
                                                </DialogHeader>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                                    {relatedMaterials.map(relatedMaterial => (
                                                        <Card
                                                            key={relatedMaterial.id}
                                                            className="border-brand-200 dark:border-brand-800"
                                                        >
                                                            <CardContent className="p-4">
                                                                <div className="flex items-start gap-3 mb-3">
                                                                    <div className="p-2 bg-[#3f3d56] rounded-lg">
                                                                        {getResourceIcon(
                                                                            relatedMaterial.format,
                                                                        )}
                                                                    </div>
                                                                    <div className="flex-1">
                                                                        <h4 className="font-medium text-brand-800 dark:text-white text-sm mb-1">
                                                                            {relatedMaterial.name}
                                                                        </h4>
                                                                        <p className="text-xs text-brand-600 dark:text-brand-300 mb-2">
                                                                            {
                                                                                relatedMaterial.trainingJustification
                                                                            }
                                                                        </p>
                                                                        <div className="flex items-center gap-2 mb-3">
                                                                            <Badge
                                                                                variant="outline"
                                                                                className="text-xs"
                                                                            >
                                                                                {
                                                                                    relatedMaterial.category
                                                                                }
                                                                            </Badge>
                                                                            <span className="text-xs text-brand-600 dark:text-brand-300 flex items-center gap-1">
                                                                                <Clock className="h-3 w-3" />
                                                                                {
                                                                                    relatedMaterial.length
                                                                                }
                                                                            </span>
                                                                            <div className="flex items-center gap-1">
                                                                                <div
                                                                                    className={`w-2 h-2 rounded-full ${getComplexityColor(
                                                                                        relatedMaterial.complexity,
                                                                                    )}`}
                                                                                />
                                                                                <span className="text-xs text-brand-600 dark:text-brand-300">
                                                                                    {
                                                                                        relatedMaterial.complexity
                                                                                    }
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                        <Button
                                                                            size="sm"
                                                                            className="w-full bg-brand-600 hover:bg-brand-700 text-white"
                                                                            onClick={() => {
                                                                                if (
                                                                                    relatedMaterial.status ==
                                                                                    "N/A"
                                                                                ) {
                                                                                    updateTrainingMaterial(
                                                                                        {
                                                                                            id: relatedMaterial.id,
                                                                                            status: "In Progress",
                                                                                        },
                                                                                    );
                                                                                }
                                                                                router.push(
                                                                                    `/training-viewer?id=${relatedMaterial.id}`,
                                                                                );
                                                                                setIsRelatedMaterialsOpen(
                                                                                    false,
                                                                                );
                                                                            }}
                                                                        >
                                                                            <Play className="h-3 w-3 mr-1" />
                                                                            {relatedMaterial.status ==
                                                                            "Completed"
                                                                                ? "View Material"
                                                                                : relatedMaterial.status ==
                                                                                    "In Progress"
                                                                                    ? "Continue Learning"
                                                                                    : "Start Learning"}
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                            </CardContent>
                                                        </Card>
                                                    ))}
                                                </div>
                                            </DialogContent>
                                        </Dialog>
                                    ) : (
                                        <></>
                                    )}

                                    {userData?.trainingMaterialStatus?.find(
                                        tm => tm.trainingMaterialID == material.id,
                                    )?.status !== "Completed" ? (
                                            <Button
                                                variant="outline"
                                                className="w-full justify-start bg-transparent"
                                                onClick={() => handleMarkComplete()}
                                                disabled={isCompleting}
                                            >
                                                {isCompleting ? (
                                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                ) : (
                                                    <CheckCircle className="h-4 w-4 mr-2" />
                                                )}
                                                {isCompleting ? "Marking..." : "Mark as Complete"}
                                            </Button>
                                        ) : (
                                            <div className="space-y-3">
                                                <Button
                                                    variant="outline"
                                                    className="w-full justify-start bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-600 text-green-700 dark:text-green-300"
                                                    disabled
                                                >
                                                    <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                                                Completed
                                                </Button>

                                                <Button
                                                    variant="outline"
                                                    className="w-full justify-start bg-transparent"
                                                    onClick={handleAcquireCertificate}
                                                    disabled={isAcquiring}
                                                >
                                                    {isAcquiring ? (
                                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                    ) : (
                                                        <CheckCircle className="h-4 w-4 mr-2" />
                                                    )}
                                                    {isAcquiring
                                                        ? "Acquiring..."
                                                        : "Acquire Certificate"}
                                                </Button>
                                            </div>
                                        )}

                                    <Dialog
                                        open={isRatingModalOpen}
                                        onOpenChange={setIsRatingModalOpen}
                                    >
                                        <DialogTrigger asChild>
                                            <Button
                                                variant="outline"
                                                className="w-full justify-start bg-transparent"
                                            >
                                                <Star className="h-4 w-4 mr-2" />
                                                Rate & Comment
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="sm:max-w-md">
                                            <DialogHeader>
                                                <DialogTitle>
                                                    Rate & Comment on Training Material
                                                </DialogTitle>
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
                                                        onClick={() => setIsRatingModalOpen(false)}
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
                                                        {isRating
                                                            ? "Submitting..."
                                                            : "Submit Rating"}
                                                    </Button>
                                                </div>
                                            </div>
                                        </DialogContent>
                                    </Dialog>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex justify-center align-middle text-gray-400">
                    <p>No Training Material Found</p>
                </div>
            )}
            {selectedSurvey && (
                <SurveyResponseModal
                    isOpen={isSurveyModalOpen}
                    onClose={() => setIsSurveyModalOpen(false)}
                    survey={transformSurveyForModal(
                        selectedSurvey,
                        multipleChoices,
                        shortAnswers,
                        commonAnswers,
                        userData?.uid || "",
                    )}
                    mode={surveyMode}
                />
            )}
        </>
    );
}
