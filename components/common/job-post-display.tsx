"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { JobDescriptionDisplay } from "@/components/ui/html-content-display";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/context/authContext";
import { useFirestore } from "@/context/firestore-context";
import { useToast } from "@/context/toastContext";
import { numberCommaSeparator } from "@/lib/backend/functions/numberCommaSeparator";
import ApplicantModel from "@/lib/models/applicant";
import { JobApplicationModel } from "@/lib/models/job-application";
import { JobPostModel } from "@/lib/models/job-post";
import MultipleChoiceModel from "@/lib/models/multiple-choice";
import ScreeningQuestionModel from "@/lib/models/screening-questions";
import ShortAnswerModel from "@/lib/models/short-answer";
import {
    ArrowLeft,
    Briefcase,
    Building2,
    Calendar,
    Clock,
    Globe,
    GraduationCap,
    Mail,
    MapPin,
    Phone,
    SquareLibraryIcon,
    Users,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface Exam {
    multipleChoices: MultipleChoiceModel[];
    shortAnswers: ShortAnswerModel[];
    totalQuestions: number;
    timerEnabled: boolean;
    timer: number;
    screeningQuestion: ScreeningQuestionModel | null;
}

export default function JobPostDisplay({ jobPost }: { jobPost: JobPostModel }) {
    const router = useRouter();
    const { user, userData } = useAuth();
    const { showToast } = useToast();
    const { screeningQuestions, hrSettings, customCriteria } = useFirestore();

    // Helper functions to get display names for reference fields
    const getDepartmentName = (departmentId: string) => {
        const department = hrSettings.departmentSettings.find(dept => dept.id === departmentId);
        return department?.name || departmentId;
    };
    const getLevelOfEducationName = (levelOfEducationId: string) => {
        const levelOfEducation = hrSettings.levelOfEducations.find(
            yearsOfExperience => yearsOfExperience.id === levelOfEducationId,
        );
        return levelOfEducation?.name || levelOfEducationId;
    };
    const getYearsOfExperienceName = (yearsOfExperienceId: string) => {
        const yearsOfExperience = hrSettings.yearsOfExperiences.find(
            levelOfEducation => levelOfEducation.id === yearsOfExperienceId,
        );
        return yearsOfExperience?.name || yearsOfExperienceId;
    };

    const getCurrencyName = (currencyId: string | null) => {
        if (!currencyId) return "";
        const currency = hrSettings.currencies.find(c => c.id === currencyId);
        return currency ? currency.name : currencyId;
    };
    // const isApplicant = userData.applicant !== null;
    // const applied = jobApplications.filter(app => app.uid === userData.applicant?.uid && app.jobPost.id === jobPost.id).length > 0;

    const getStatusColor = (status: string) => {
        switch (status) {
            case "Announced":
                return "bg-green-100 text-green-800";
            case "Draft":
                return "bg-yellow-100 text-yellow-800";
            case "Withdrawn":
                return "bg-red-100 text-red-800";
            case "Terminated":
                return "bg-gray-100 text-gray-800";
            default:
                return "bg-gray-100 text-gray-800";
        }
    };

    const [applyLoading, setApplyLoading] = useState<boolean>(false);

    // --- State for each modal ---
    const [confirmModalOpen, setConfirmModalOpen] = useState(false);
    const [motivationModalOpen, setMotivationModalOpen] = useState(false);
    const [instructionsModalOpen, setInstructionsModalOpen] = useState(false);

    const [jobApplicationToBeSaved, setJobApplicationToBeSaved] = useState<Omit<
        JobApplicationModel,
        "id"
    > | null>(null);
    const [redirectTo, setRedirectTo] = useState<string | null>(null);

    // --- STEP 1: User clicks "Apply" on a job ---
    const handleApply = async (job: JobPostModel) => {
        if (job) {
            // setChosenJob(job);
            router.push(`/application-form/${jobPost.id}`);
            setConfirmModalOpen(true); // Open the ConfirmModal first
        }
    };

    // --- STEP 2: User clicks "Continue" in ConfirmModal ---
    const handleConfirm = () => {
        setConfirmModalOpen(false);
        setTimeout(() => {
            setMotivationModalOpen(true);
        }, 150); // Short delay for smoother transition
    };

    // --- STEP 3: User clicks "Next" in MotivationModal ---
    const handleMotivationAccept = async (motivation: string) => {
        if (!jobApplicationToBeSaved) return;

        if (redirectTo) {
            setJobApplicationToBeSaved(prev => ({
                ...prev!,
                motivation: motivation || null,
            }));
            setMotivationModalOpen(false);
            await new Promise(resolve => setTimeout(resolve, 150));
            setInstructionsModalOpen(true);
        } else {
            setMotivationModalOpen(false);
            await new Promise(resolve => setTimeout(resolve, 150));
            await onAccept(motivation); // Pass motivation directly
        }
    };

    // --- STEP 4: The FINAL action ---
    const onAccept = async (motivationOverride?: string) => {
        if (!jobApplicationToBeSaved) {
            showToast("An error occurred. Missing application data.", "Error", "error");
            return;
        }

        setApplyLoading(true);
        setInstructionsModalOpen(false); // Close instructions modal if open

        try {
            const applicationToSave =
                motivationOverride !== undefined
                    ? { ...jobApplicationToBeSaved, motivation: motivationOverride || null }
                    : jobApplicationToBeSaved;
            // await createJobApplication(applicationToSave);

            // If the code reaches here, the application was successful.
            if (redirectTo) {
                showToast("Redirecting to assessment...", "Success", "success");
                router.push(redirectTo);
            } else {
                showToast(
                    `You have successfully applied for the ${jobPost.jobTitle} position!`,
                    "Success",
                    "success",
                );
            }
        } catch (error) {
            console.error("Application submission failed:", error);
            showToast("Application failed. Please try again.", "Error", "error");
        } finally {
            setApplyLoading(false);
        }
    };

    // Loading state for the MotivationModal when it's the final step
    const finalSubmitLoading = !redirectTo && applyLoading;

    return (
        <div className="">
            <div className="min-h-screen py-8">
                <div className="container mx-auto px-4">
                    <div className="mx-auto max-w-8xl">
                        {/* Back Button */}
                        <Button variant="ghost" onClick={() => router.back()} className="mb-6">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Jobs
                        </Button>

                        {/* Header Section */}
                        <div className="mb-8 rounded-lg p-6 shadow-sm">
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                <div className="flex gap-4">
                                    <div className="relative h-16 w-16 overflow-hidden rounded-lg border">
                                        <Image
                                            src={
                                                hrSettings?.companyInfo?.at(0)?.companyLogoURL ||
                                                "/placeholder.svg?height=64&width=64&text=Logo"
                                            }
                                            alt={`${hrSettings.companyInfo?.at(0)?.companyLogoURL} logo`}
                                            fill
                                            className="object-cover"
                                        />
                                    </div>
                                    <div>
                                        <h1 className="text-2xl font-bold sm:text-3xl">
                                            {jobPost.jobTitle}
                                        </h1>
                                        <p className="text-lg">
                                            {hrSettings.companyInfo?.at(0)?.companyName}
                                        </p>
                                        <div className="mt-2 flex flex-wrap gap-2">
                                            <Badge
                                                variant="outline"
                                                className="flex items-center gap-1"
                                            >
                                                <MapPin className="h-3 w-3" />
                                                {jobPost.location}
                                            </Badge>
                                            <Badge
                                                variant="outline"
                                                className="flex items-center gap-1"
                                            >
                                                <Briefcase className="h-3 w-3" />
                                                {jobPost.employmentType}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2 sm:items-end">
                                    {
                                        <Button
                                            size="lg"
                                            className="bg-[#d2f277] text-black hover:bg-[#c2e267]"
                                            onClick={() => handleApply(jobPost)}
                                        >
                                            Apply Now
                                        </Button>
                                    }
                                    <p className="text-sm">{jobPost.applicants} applicants</p>
                                </div>
                            </div>
                        </div>

                        <div className="grid gap-8 lg:grid-cols-3">
                            {/* Main Content */}
                            <div className="lg:col-span-2">
                                <Card className="">
                                    <CardHeader>
                                        <CardTitle>Job Description</CardTitle>
                                    </CardHeader>
                                    <CardContent className="prose max-w-none">
                                        <JobDescriptionDisplay content={jobPost.jobDescription} />
                                    </CardContent>
                                </Card>

                                {jobPost.requirements.length > 0 && (
                                    <Card className="my-6">
                                        <CardHeader>
                                            <CardTitle>Requirements</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <ul className="list-disc pl-5 space-y-2">
                                                {jobPost.requirements.map((req, index) => (
                                                    <li key={index}>{req}</li>
                                                ))}
                                            </ul>
                                        </CardContent>
                                    </Card>
                                )}

                                {jobPost.responsibilities.length > 0 && (
                                    <Card className="my-6">
                                        <CardHeader>
                                            <CardTitle>Responsibilities</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <ul className="list-disc pl-5 space-y-2">
                                                {jobPost.responsibilities.map((resp, index) => (
                                                    <li key={index}>{resp}</li>
                                                ))}
                                            </ul>
                                        </CardContent>
                                    </Card>
                                )}

                                {jobPost.benefits.length > 0 && (
                                    <Card className="my-6">
                                        <CardHeader>
                                            <CardTitle>Benefits</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <ul className="list-disc pl-5 space-y-2">
                                                {jobPost.benefits.map((benefit, index) => (
                                                    <li key={index}>{benefit}</li>
                                                ))}
                                            </ul>
                                        </CardContent>
                                    </Card>
                                )}
                            </div>

                            {/* Sidebar */}
                            <div className="space-y-6">
                                {/* Job Details */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Job Details</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="flex items-center gap-3">
                                            <span className="text-sm mr-1">
                                                {getCurrencyName(jobPost.currency) || "ETB"}
                                            </span>
                                            <div>
                                                <p className="text-sm">Salary Range</p>
                                                <p className="font-medium">
                                                    {numberCommaSeparator(jobPost.minSalary)} -{" "}
                                                    {numberCommaSeparator(jobPost.maxSalary)}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <SquareLibraryIcon className="h-4 w-4" />
                                            <div>
                                                <p className="text-sm">Salary Type</p>
                                                <p className="font-medium">{jobPost.salaryType}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Calendar className="h-4 w-4" />
                                            <div>
                                                <p className="text-sm">Application Deadline</p>
                                                <p className="font-medium">
                                                    {jobPost.applicationDeadline}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <GraduationCap className="h-4 w-4" />
                                            <div>
                                                <p className="text-sm">Education Level</p>
                                                <p className="font-medium">
                                                    {getLevelOfEducationName(
                                                        jobPost.levelOfEducation,
                                                    )}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <Clock className="h-4 w-4" />
                                            <div>
                                                <p className="text-sm">Experience Required</p>
                                                <p className="font-medium">
                                                    {getYearsOfExperienceName(
                                                        jobPost.yearsOfExperience,
                                                    )}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <Building2 className="h-4 w-4" />
                                            <div>
                                                <p className="text-sm">Department</p>
                                                <p className="font-medium">
                                                    {getDepartmentName(jobPost.department)}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <Users className="h-4 w-4" />
                                            <div>
                                                <p className="text-sm">Posted</p>
                                                <p className="font-medium">{jobPost.timestamp}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <Building2 className="h-4 w-4" />
                                            <div>
                                                <p className="text-sm">Work Mode</p>
                                                <p className="font-medium">{jobPost.workMode}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <GraduationCap className="h-4 w-4" />
                                            <div>
                                                <p className="text-sm">Job Level</p>
                                                <p className="font-medium">{jobPost.jobLevel}</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Company Information */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle>
                                            About {hrSettings.companyInfo?.at(0)?.companyName}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="flex items-center gap-3">
                                            <Building2 className="h-4 w-4" />
                                            <div>
                                                <p className="text-sm">Sector</p>
                                                <p className="font-medium">
                                                    {hrSettings.companyInfo?.at(0)?.companySector}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <Users className="h-4 w-4" />
                                            <div>
                                                <p className="text-sm">Company Size</p>
                                                <p className="font-medium">
                                                    {hrSettings.companyInfo?.at(0)?.companySize}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <MapPin className="h-4 w-4" />
                                            <div>
                                                <p className="text-sm">Location</p>
                                                <p className="font-medium">
                                                    {hrSettings.companyInfo?.at(0)?.postalAddress}
                                                </p>
                                            </div>
                                        </div>

                                        {hrSettings.companyInfo?.at(0) &&
                                            hrSettings.companyInfo?.at(0)?.companyUrl && (
                                            <div className="flex items-center gap-3">
                                                <Globe className="h-4 w-4" />
                                                <div>
                                                    <p className="text-sm">Website</p>
                                                    <a
                                                        href={
                                                            hrSettings.companyInfo?.at(0)
                                                                ?.companyUrl
                                                        }
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="font-medium text-blue-600 hover:text-blue-800"
                                                    >
                                                            Visit Website
                                                    </a>
                                                </div>
                                            </div>
                                        )}

                                        <Separator />

                                        <div className="space-y-3">
                                            <h4 className="font-medium">Contact Information</h4>

                                            {jobPost.contactName && (
                                                <div className="flex items-center gap-3">
                                                    <Users className="h-4 w-4" />
                                                    <div>
                                                        <p className="text-sm font-medium">
                                                            Contact Person
                                                        </p>
                                                        <p className="">{jobPost.contactName}</p>
                                                    </div>
                                                </div>
                                            )}

                                            {jobPost.contactEmail && (
                                                <div className="flex items-center gap-3">
                                                    <Mail className="h-4 w-4" />
                                                    <div>
                                                        <p className="text-sm font-medium">
                                                            Contact Email
                                                        </p>
                                                        <a
                                                            href={`mailto:${jobPost.contactEmail}`}
                                                            className="text-blue-600 hover:text-blue-800"
                                                        >
                                                            {jobPost.contactEmail}
                                                        </a>
                                                    </div>
                                                </div>
                                            )}

                                            {jobPost.contactPhone && (
                                                <div className="flex items-center gap-3">
                                                    <Phone className="h-4 w-4" />
                                                    <div>
                                                        <p className="text-sm font-medium">
                                                            Contact Phone
                                                        </p>
                                                        <a
                                                            href={`tel:${jobPost.contactPhone}`}
                                                            className="text-blue-600 hover:text-blue-800"
                                                        >
                                                            {jobPost.contactPhone}
                                                        </a>
                                                    </div>
                                                </div>
                                            )}

                                            {!jobPost.contactEmail &&
                                                !jobPost.contactPhone &&
                                                hrSettings.companyInfo?.at(0)?.emailAddress && (
                                                <div className="flex items-center gap-3">
                                                    <Mail className="h-4 w-4" />
                                                    <a
                                                        href={`mailto:${hrSettings.companyInfo?.at(0)?.emailAddress}`}
                                                        className="text-blue-600 hover:text-blue-800"
                                                    >
                                                        {
                                                            hrSettings.companyInfo?.at(0)
                                                                ?.emailAddress
                                                        }
                                                    </a>
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Apply Button (Mobile) */}
                                <div className="lg:hidden">
                                    <Button
                                        size="lg"
                                        className="w-full bg-[#d2f277] text-black hover:bg-[#c2e267]"
                                    >
                                        Apply Now
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- RENDER ALL MODALS --- */}
            {jobApplicationToBeSaved !== null && (
                <>
                    {/* MODAL 1: Initial Confirmation */}
                    {/* <ConfirmModal
                        open={confirmModalOpen}
                        setOpen={setConfirmModalOpen}
                        message="You are about to start the application process."
                        dialogTitle={`Apply for: ${jobApplicationToBeSaved.jobPost.jobTitle}`}
                        okButtonText="Continue"
                        onOk={handleConfirm}
                        okButtonVariant="default"
                    /> */}

                    {/* MODAL 2: Optional Motivation */}
                    {/* <MotivationModal
                        open={motivationModalOpen}
                        setOpen={setMotivationModalOpen}
                        onAccept={handleMotivationAccept}
                        hasNextStep={!!redirectTo}
                        loading={finalSubmitLoading}
                    /> */}

                    {/* MODAL 3: Instructions (only for jobs with screening) */}
                    {/* <InstructionsModal
                        open={instructionsModalOpen}
                        setOpen={setInstructionsModalOpen}
                        onAccept={() => onAccept()}
                        loading={applyLoading}
                    /> */}
                </>
            )}
        </div>
    );
}
