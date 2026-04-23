"use client";

import { useState, useEffect } from "react";
import { X, Plus, GraduationCap, Award, Languages, Briefcase, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useTheme } from "@/components/theme-provider";
import { useData } from "@/context/app-data-context";
import { useToast } from "@/context/toastContext";
import { EmployeeRepository } from "@/lib/repository/employee";
import type {
    EmployeeModel,
    EducationDetailModel,
    ExperienceDetailModel,
    TrainingDetailModel,
    LanguageSkillModel,
} from "@/lib/models/employee";
import {
    LanguageSkillsSection,
    WorkExperienceSection,
} from "./employee-profile-language-experience-sections";

type ProfileTab = "education" | "training" | "languages" | "experience";

interface EmployeeProfileModalProps {
    employee: EmployeeModel;
    onClose: () => void;
    onSaveSuccess?: (updated: EmployeeModel) => void;
}

// Form types matching oneHR (UI layer); we map to/from onehrv2 models
interface EducationForm {
    institution?: string;
    degree?: string;
    fieldOfStudy?: string;
    startDate?: string;
    endDate?: string;
    grade?: string;
    status?: "completed" | "in-progress" | "incomplete";
}
interface ExperienceForm {
    companyName?: string;
    jobTitle?: string;
    employmentType?: string;
    startDate?: string;
    endDate?: string;
    isCurrent?: boolean;
    location?: string;
    responsibilities?: string;
    reasonForLeaving?: string;
    referenceName?: string;
    referenceContact?: string;
}

function toEducationForm(edu: EducationDetailModel): EducationForm {
    return {
        institution: edu.school,
        degree: edu.title || edu.educationalLevel,
        fieldOfStudy: edu.fieldOfStudy,
        startDate: edu.startDate,
        endDate: edu.endDate,
        grade: edu.grade,
        status: edu.status ?? "completed",
    };
}
function fromEducationForm(f: EducationForm, id: string): EducationDetailModel {
    return {
        id,
        school: f.institution ?? "",
        title: f.degree ?? "",
        educationalLevel: f.degree ?? "",
        startDate: f.startDate ?? "",
        endDate: f.endDate ?? "",
        fieldOfStudy: f.fieldOfStudy,
        grade: f.grade,
        status: f.status ?? "completed",
    };
}
function toExperienceForm(exp: ExperienceDetailModel): ExperienceForm {
    return {
        companyName: exp.company,
        jobTitle: exp.title,
        employmentType: exp.employmentType,
        startDate: exp.startDate,
        endDate: exp.endDate,
        isCurrent: exp.isCurrent,
        location: exp.location,
        responsibilities: exp.mainActivities,
        reasonForLeaving: exp.reasonForLeaving,
        referenceName: exp.referenceName,
        referenceContact: exp.referenceContact,
    };
}
function fromExperienceForm(f: ExperienceForm, id: string): ExperienceDetailModel {
    return {
        id,
        company: f.companyName ?? "",
        title: f.jobTitle ?? "",
        startDate: f.startDate ?? "",
        endDate: f.endDate ?? "",
        mainActivities: f.responsibilities ?? "",
        reference: [f.referenceName, f.referenceContact].filter(Boolean).join(" / ") || "",
        employmentType: f.employmentType,
        isCurrent: f.isCurrent,
        location: f.location,
        reasonForLeaving: f.reasonForLeaving,
        referenceName: f.referenceName,
        referenceContact: f.referenceContact,
    };
}

const tabs = [
    { id: "education" as ProfileTab, label: "Education", icon: GraduationCap },
    { id: "training" as ProfileTab, label: "Training", icon: Award },
    { id: "languages" as ProfileTab, label: "Language Skills", icon: Languages },
    { id: "experience" as ProfileTab, label: "Work Experience", icon: Briefcase },
];

const getLevelBadgeColor = (level: string) => {
    switch (level) {
        case "native":
            return "bg-green-100 text-green-800";
        case "advanced":
            return "bg-blue-100 text-blue-800";
        case "intermediate":
            return "bg-yellow-100 text-yellow-800";
        default:
            return "bg-gray-100 text-gray-800";
    }
};
const getStatusBadgeColor = (status: string) => {
    switch (status) {
        case "completed":
            return "bg-green-100 text-green-800";
        case "in-progress":
            return "bg-blue-100 text-blue-800";
        case "scheduled":
            return "bg-yellow-100 text-yellow-800";
        default:
            return "bg-gray-100 text-gray-800";
    }
};

export function EmployeeProfileModal({
    employee,
    onClose,
    onSaveSuccess,
}: EmployeeProfileModalProps) {
    const { theme } = useTheme();
    const { departmentSettings, positions } = useData();
    const { showToast } = useToast();
    const isDark = theme === "dark";

    // System theme–aligned (match offboarding and rest of app)
    const modalBg = isDark ? "bg-card border border-border" : "bg-card border border-border";
    const headerBg = isDark
        ? "bg-muted/80 border-b border-border"
        : "bg-gradient-to-r from-primary-50 to-secondary-50 border-b border-border";
    const avatarBg = isDark ? "bg-primary/20" : "bg-primary-100";
    const avatarText = isDark ? "text-primary-foreground" : "text-primary-700";
    const headingText = isDark ? "text-foreground" : "text-primary-900";
    const labelText = isDark ? "text-muted-foreground" : "text-primary-800";
    const formPanelBg = isDark
        ? "bg-muted/40 border border-border"
        : "bg-muted/50 border border-border";
    const inputFocus = isDark
        ? "border-border bg-background focus:border-primary focus:ring-primary"
        : "border-border bg-background focus:border-primary focus:ring-primary";
    const tabAreaBg = isDark
        ? "bg-muted/50 border-b border-border"
        : "bg-secondary-50 border-b border-border";
    const tabActive = isDark
        ? "border-primary text-foreground bg-card"
        : "border-primary text-primary-900 bg-card";
    const tabInactive = isDark
        ? "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50"
        : "border-transparent text-primary-700 hover:text-primary-900 hover:bg-secondary-100";
    const cardBg = isDark ? "bg-card border border-border" : "bg-card border border-border";
    const iconHover = isDark
        ? "text-muted-foreground hover:text-foreground"
        : "text-primary-600 hover:text-primary-900";
    const footerBg = isDark
        ? "bg-muted/50 border-t border-border"
        : "bg-secondary-50 border-t border-border";
    // Button styling aligned with rest of app (export, disciplinary, dependents, documents modals)
    const btnPrimary = isDark
        ? "bg-primary text-primary-foreground hover:bg-primary/90"
        : "bg-primary-600 hover:bg-primary-700 text-white";
    const btnDelete = "text-destructive hover:text-destructive hover:bg-destructive/10";
    const getName = (items: { id: string; name: string }[], id: string) =>
        items.find(item => item.id === id)?.name || "";
    const departmentName = getName(departmentSettings, employee.department);
    const positionName = getName(positions, employee.employmentPosition);

    const [activeTab, setActiveTab] = useState<ProfileTab>("education");
    const [education, setEducation] = useState<EducationDetailModel[]>([]);
    const [training, setTraining] = useState<TrainingDetailModel[]>([]);
    const [languages, setLanguages] = useState<LanguageSkillModel[]>([]);
    const [experience, setExperience] = useState<ExperienceDetailModel[]>([]);

    const [showEducationForm, setShowEducationForm] = useState<boolean>(false);
    const [showTrainingForm, setShowTrainingForm] = useState<boolean>(false);
    const [showLanguageForm, setShowLanguageForm] = useState<boolean>(false);
    const [showExperienceForm, setShowExperienceForm] = useState<boolean>(false);

    const [editingEducation, setEditingEducation] = useState<EducationDetailModel | null>(null);
    const [editingTraining, setEditingTraining] = useState<TrainingDetailModel | null>(null);
    const [editingLanguage, setEditingLanguage] = useState<LanguageSkillModel | null>(null);
    const [editingExperience, setEditingExperience] = useState<ExperienceDetailModel | null>(null);

    const [educationForm, setEducationForm] = useState<EducationForm>({});
    const [trainingForm, setTrainingForm] = useState<Partial<TrainingDetailModel>>({});
    const [languageForm, setLanguageForm] = useState<Partial<LanguageSkillModel>>({});
    const [experienceForm, setExperienceForm] = useState<ExperienceForm>({});

    const [saving, setSaving] = useState<boolean>(false);

    useEffect(() => {
        setEducation(employee.educationDetail ?? []);
        setTraining(employee.trainingDetail ?? []);
        setLanguages(employee.languageSkills ?? []);
        setExperience(employee.experienceDetail ?? []);
    }, [
        employee.id,
        employee.educationDetail,
        employee.trainingDetail,
        employee.languageSkills,
        employee.experienceDetail,
    ]);

    const persist = async (patch: Partial<EmployeeModel>) => {
        setSaving(true);
        try {
            const result = await EmployeeRepository.updateEmployee({ id: employee.id, ...patch });
            if (result.success) {
                showToast("Profile updated.", "Success", "success");
                const merged = { ...employee, ...patch };
                onSaveSuccess?.(merged);
            } else {
                showToast("Failed to save.", "Error", "error");
            }
        } catch {
            showToast("Failed to save.", "Error", "error");
        } finally {
            setSaving(false);
        }
    };

    const handleSaveEducation = async () => {
        let next: EducationDetailModel[];
        if (editingEducation) {
            next = education.map(e =>
                e.id === editingEducation.id ? fromEducationForm(educationForm, e.id) : e,
            );
        } else {
            next = [...education, fromEducationForm(educationForm, Date.now().toString())];
        }
        setEducation(next);
        setShowEducationForm(false);
        setEditingEducation(null);
        setEducationForm({});
        await persist({ educationDetail: next });
    };

    const handleDeleteEducation = async (id: string) => {
        const next = education.filter(e => e.id !== id);
        setEducation(next);
        await persist({ educationDetail: next });
    };

    const handleSaveTraining = async () => {
        let next: TrainingDetailModel[];
        if (editingTraining) {
            next = training.map(t =>
                t.id === editingTraining.id
                    ? {
                        ...t,
                        ...trainingForm,
                        status: (trainingForm.status ??
                              t.status) as TrainingDetailModel["status"],
                    }
                    : t,
            );
        } else {
            next = [
                ...training,
                {
                    id: Date.now().toString(),
                    trainingName: trainingForm.trainingName ?? "",
                    provider: trainingForm.provider ?? "",
                    trainingType: trainingForm.trainingType ?? "",
                    startDate: trainingForm.startDate ?? "",
                    endDate: trainingForm.endDate,
                    certificateNumber: trainingForm.certificateNumber,
                    expiryDate: trainingForm.expiryDate,
                    status: (trainingForm.status ?? "completed") as TrainingDetailModel["status"],
                    description: trainingForm.description,
                },
            ];
        }
        setTraining(next);
        setShowTrainingForm(false);
        setEditingTraining(null);
        setTrainingForm({});
        await persist({ trainingDetail: next });
    };

    const handleDeleteTraining = async (id: string) => {
        const next = training.filter(t => t.id !== id);
        setTraining(next);
        await persist({ trainingDetail: next });
    };

    const handleSaveLanguage = async () => {
        let next: LanguageSkillModel[];
        if (editingLanguage) {
            next = languages.map(l =>
                l.id === editingLanguage.id
                    ? {
                        ...l,
                        ...languageForm,
                        readingLevel: (languageForm.readingLevel ??
                              l.readingLevel) as LanguageSkillModel["readingLevel"],
                        writingLevel: (languageForm.writingLevel ??
                              l.writingLevel) as LanguageSkillModel["writingLevel"],
                        speakingLevel: (languageForm.speakingLevel ??
                              l.speakingLevel) as LanguageSkillModel["speakingLevel"],
                        listeningLevel: (languageForm.listeningLevel ??
                              l.listeningLevel) as LanguageSkillModel["listeningLevel"],
                    }
                    : l,
            );
        } else {
            next = [
                ...languages,
                {
                    id: Date.now().toString(),
                    language: languageForm.language ?? "",
                    readingLevel: (languageForm.readingLevel ??
                        "basic") as LanguageSkillModel["readingLevel"],
                    writingLevel: (languageForm.writingLevel ??
                        "basic") as LanguageSkillModel["writingLevel"],
                    speakingLevel: (languageForm.speakingLevel ??
                        "basic") as LanguageSkillModel["speakingLevel"],
                    listeningLevel: (languageForm.listeningLevel ??
                        "basic") as LanguageSkillModel["listeningLevel"],
                    certification: languageForm.certification,
                },
            ];
        }
        setLanguages(next);
        setShowLanguageForm(false);
        setEditingLanguage(null);
        setLanguageForm({});
        await persist({ languageSkills: next });
    };

    const handleDeleteLanguage = async (id: string) => {
        const next = languages.filter(l => l.id !== id);
        setLanguages(next);
        await persist({ languageSkills: next });
    };

    const handleSaveExperience = async () => {
        let next: ExperienceDetailModel[];
        if (editingExperience) {
            next = experience.map(e =>
                e.id === editingExperience.id ? fromExperienceForm(experienceForm, e.id) : e,
            );
        } else {
            next = [...experience, fromExperienceForm(experienceForm, Date.now().toString())];
        }
        setExperience(next);
        setShowExperienceForm(false);
        setEditingExperience(null);
        setExperienceForm({});
        await persist({ experienceDetail: next });
    };

    const handleDeleteExperience = async (id: string) => {
        const next = experience.filter(e => e.id !== id);
        setExperience(next);
        await persist({ experienceDetail: next });
    };

    return (
        <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
        >
            <div
                className={`${modalBg} rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col`}
                onClick={e => e.stopPropagation()}
            >
                {/* Header - system theme */}
                <div className={`flex-shrink-0 flex items-center justify-between p-6 ${headerBg}`}>
                    <div className="flex items-center gap-3">
                        <div
                            className={`w-12 h-12 ${avatarBg} rounded-full flex items-center justify-center`}
                        >
                            <span className={`${avatarText} font-semibold text-lg`}>
                                {employee.firstName?.[0]}
                                {employee.surname?.[0]}
                            </span>
                        </div>
                        <div>
                            <h2 className={`text-xl font-semibold ${headingText}`}>
                                {employee.firstName} {employee.middleName ?? ""} {employee.surname}{" "}
                                - Profile
                            </h2>
                            <p
                                className={`text-sm ${isDark ? "text-muted-foreground" : "text-primary-600"}`}
                            >
                                {positionName || employee.employmentPosition || "N/A"} |{" "}
                                {departmentName || employee.department || "N/A"}
                            </p>
                        </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose} className={iconHover}>
                        <X className="h-5 w-5" />
                    </Button>
                </div>

                {/* Tabs */}
                <div className={`flex-shrink-0 ${tabAreaBg}`}>
                    <div className="flex">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-6 py-4 font-medium text-sm transition-all border-b-2 ${
                                    activeTab === tab.id ? tabActive : tabInactive
                                }`}
                            >
                                <tab.icon className="h-4 w-4" />
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content - scrollable only this section */}
                <div className="flex-1 min-h-0 overflow-y-auto p-6">
                    {/* Education Tab */}
                    {activeTab === "education" && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className={`text-lg font-semibold ${headingText}`}>
                                    Education History
                                </h3>
                                <Button
                                    onClick={() => {
                                        setShowEducationForm(true);
                                        setEditingEducation(null);
                                        setEducationForm({});
                                    }}
                                    className={btnPrimary}
                                    disabled={saving}
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Create
                                </Button>
                            </div>

                            {showEducationForm && (
                                <div className={`${formPanelBg} rounded-lg p-6 space-y-4`}>
                                    <h4 className={`font-medium ${headingText}`}>
                                        {editingEducation ? "Edit Education" : "Add Education"}
                                    </h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Label className={labelText}>Institution *</Label>
                                            <Input
                                                value={educationForm.institution ?? ""}
                                                onChange={e =>
                                                    setEducationForm({
                                                        ...educationForm,
                                                        institution: e.target.value,
                                                    })
                                                }
                                                className={inputFocus}
                                            />
                                        </div>
                                        <div>
                                            <Label className={labelText}>Achievement</Label>
                                            <select
                                                value={educationForm.degree ?? ""}
                                                onChange={e =>
                                                    setEducationForm({
                                                        ...educationForm,
                                                        degree: e.target.value,
                                                    })
                                                }
                                                className={`w-full h-10 border rounded-md px-3 ${inputFocus}`}
                                            >
                                                <option value="">Select Degree</option>
                                                <option value="High School">High School</option>
                                                <option value="Diploma">Diploma</option>
                                                <option value="Bachelor's Degree">
                                                    Bachelor&apos;s Degree
                                                </option>
                                                <option value="Master's Degree">
                                                    Master&apos;s Degree
                                                </option>
                                                <option value="Doctorate">Doctorate</option>
                                                <option value="Certificate">Certificate</option>
                                            </select>
                                        </div>
                                        <div>
                                            <Label className={labelText}>Field of Study *</Label>
                                            <Input
                                                value={educationForm.fieldOfStudy ?? ""}
                                                onChange={e =>
                                                    setEducationForm({
                                                        ...educationForm,
                                                        fieldOfStudy: e.target.value,
                                                    })
                                                }
                                                className={inputFocus}
                                            />
                                        </div>
                                        <div>
                                            <Label className={labelText}>Grade/GPA</Label>
                                            <Input
                                                value={educationForm.grade ?? ""}
                                                onChange={e =>
                                                    setEducationForm({
                                                        ...educationForm,
                                                        grade: e.target.value,
                                                    })
                                                }
                                                className={inputFocus}
                                            />
                                        </div>
                                        <div>
                                            <Label className={labelText}>Start Date *</Label>
                                            <Input
                                                type="date"
                                                value={educationForm.startDate ?? ""}
                                                onChange={e =>
                                                    setEducationForm({
                                                        ...educationForm,
                                                        startDate: e.target.value,
                                                    })
                                                }
                                                className={inputFocus}
                                            />
                                        </div>
                                        <div>
                                            <Label className={labelText}>End Date</Label>
                                            <Input
                                                type="date"
                                                value={educationForm.endDate ?? ""}
                                                onChange={e =>
                                                    setEducationForm({
                                                        ...educationForm,
                                                        endDate: e.target.value,
                                                    })
                                                }
                                                className={inputFocus}
                                            />
                                        </div>
                                        <div>
                                            <Label className={labelText}>Status *</Label>
                                            <select
                                                value={educationForm.status ?? "completed"}
                                                onChange={e =>
                                                    setEducationForm({
                                                        ...educationForm,
                                                        status: e.target
                                                            .value as EducationForm["status"],
                                                    })
                                                }
                                                className={`w-full h-10 border rounded-md px-3 ${inputFocus}`}
                                            >
                                                <option value="completed">Completed</option>
                                                <option value="in-progress">In Progress</option>
                                                <option value="incomplete">Incomplete</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="flex justify-end gap-2">
                                        <Button
                                            variant="outline"
                                            onClick={() => {
                                                setShowEducationForm(false);
                                                setEditingEducation(null);
                                            }}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            onClick={handleSaveEducation}
                                            className={btnPrimary}
                                            disabled={saving}
                                        >
                                            {editingEducation ? "Update" : "Save"}
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {education.length === 0 && !showEducationForm ? (
                                <div
                                    className={`text-center py-12 text-muted-foreground ${isDark ? "bg-muted/30" : "bg-gray-50"} rounded-lg`}
                                >
                                    <GraduationCap className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                                    <p>No education records found</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {education.map(edu => (
                                        <div
                                            key={edu.id}
                                            className={`${cardBg} rounded-lg p-4 hover:shadow-md transition-shadow`}
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <h4
                                                            className={`font-semibold ${headingText}`}
                                                        >
                                                            {edu.title ||
                                                                edu.educationalLevel ||
                                                                "Education"}
                                                        </h4>
                                                        <span
                                                            className={`px-2 py-0.5 text-xs rounded-full ${getStatusBadgeColor(edu.status ?? "completed")}`}
                                                        >
                                                            {edu.status ?? "completed"}
                                                        </span>
                                                    </div>
                                                    <p className="text-gray-600">{edu.school}</p>
                                                    <p className="text-sm text-gray-500">
                                                        {edu.fieldOfStudy}
                                                    </p>
                                                    <p className="text-sm text-gray-400 mt-1">
                                                        {edu.startDate} - {edu.endDate || "Present"}
                                                        {edu.grade && ` | Grade: ${edu.grade}`}
                                                    </p>
                                                </div>
                                                <div className="flex gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => {
                                                            setEditingEducation(edu);
                                                            setEducationForm(toEducationForm(edu));
                                                            setShowEducationForm(true);
                                                        }}
                                                        className={iconHover}
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() =>
                                                            handleDeleteEducation(edu.id)
                                                        }
                                                        className={btnDelete}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Training Tab */}
                    {activeTab === "training" && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className={`text-lg font-semibold ${headingText}`}>
                                    Training Records
                                </h3>
                                <Button
                                    onClick={() => {
                                        setShowTrainingForm(true);
                                        setEditingTraining(null);
                                        setTrainingForm({});
                                    }}
                                    className={btnPrimary}
                                    disabled={saving}
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Create
                                </Button>
                            </div>

                            {showTrainingForm && (
                                <div className={`${formPanelBg} rounded-lg p-6 space-y-4`}>
                                    <h4 className={`font-medium ${headingText}`}>
                                        {editingTraining ? "Edit Training" : "Add Training"}
                                    </h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Label className={labelText}>Training Name *</Label>
                                            <Input
                                                value={trainingForm.trainingName ?? ""}
                                                onChange={e =>
                                                    setTrainingForm({
                                                        ...trainingForm,
                                                        trainingName: e.target.value,
                                                    })
                                                }
                                                className={inputFocus}
                                            />
                                        </div>
                                        <div>
                                            <Label className={labelText}>Provider *</Label>
                                            <Input
                                                value={trainingForm.provider ?? ""}
                                                onChange={e =>
                                                    setTrainingForm({
                                                        ...trainingForm,
                                                        provider: e.target.value,
                                                    })
                                                }
                                                className={inputFocus}
                                            />
                                        </div>
                                        <div>
                                            <Label className={labelText}>Training Type *</Label>
                                            <select
                                                value={trainingForm.trainingType ?? ""}
                                                onChange={e =>
                                                    setTrainingForm({
                                                        ...trainingForm,
                                                        trainingType: e.target.value,
                                                    })
                                                }
                                                className={`w-full h-10 border rounded-md px-3 ${inputFocus}`}
                                            >
                                                <option value="">Select Type</option>
                                                <option value="Professional Development">
                                                    Professional Development
                                                </option>
                                                <option value="Technical Skills">
                                                    Technical Skills
                                                </option>
                                                <option value="Safety Training">
                                                    Safety Training
                                                </option>
                                                <option value="Compliance">Compliance</option>
                                                <option value="Leadership">Leadership</option>
                                                <option value="Soft Skills">Soft Skills</option>
                                                <option value="Certification">Certification</option>
                                            </select>
                                        </div>
                                        <div>
                                            <Label className={labelText}>Certificate Number</Label>
                                            <Input
                                                value={trainingForm.certificateNumber ?? ""}
                                                onChange={e =>
                                                    setTrainingForm({
                                                        ...trainingForm,
                                                        certificateNumber: e.target.value,
                                                    })
                                                }
                                                className={inputFocus}
                                            />
                                        </div>
                                        <div>
                                            <Label className={labelText}>Start Date *</Label>
                                            <Input
                                                type="date"
                                                value={trainingForm.startDate ?? ""}
                                                onChange={e =>
                                                    setTrainingForm({
                                                        ...trainingForm,
                                                        startDate: e.target.value,
                                                    })
                                                }
                                                className={inputFocus}
                                            />
                                        </div>
                                        <div>
                                            <Label className={labelText}>End Date</Label>
                                            <Input
                                                type="date"
                                                value={trainingForm.endDate ?? ""}
                                                onChange={e =>
                                                    setTrainingForm({
                                                        ...trainingForm,
                                                        endDate: e.target.value,
                                                    })
                                                }
                                                className={inputFocus}
                                            />
                                        </div>
                                        <div>
                                            <Label className={labelText}>Expiry Date</Label>
                                            <Input
                                                type="date"
                                                value={trainingForm.expiryDate ?? ""}
                                                onChange={e =>
                                                    setTrainingForm({
                                                        ...trainingForm,
                                                        expiryDate: e.target.value,
                                                    })
                                                }
                                                className={inputFocus}
                                            />
                                        </div>
                                        <div>
                                            <Label className={labelText}>Status *</Label>
                                            <select
                                                value={trainingForm.status ?? "completed"}
                                                onChange={e =>
                                                    setTrainingForm({
                                                        ...trainingForm,
                                                        status: e.target
                                                            .value as TrainingDetailModel["status"],
                                                    })
                                                }
                                                className={`w-full h-10 border rounded-md px-3 ${inputFocus}`}
                                            >
                                                <option value="completed">Completed</option>
                                                <option value="in-progress">In Progress</option>
                                                <option value="scheduled">Scheduled</option>
                                            </select>
                                        </div>
                                        <div className="col-span-2">
                                            <Label className={labelText}>Description</Label>
                                            <Textarea
                                                value={trainingForm.description ?? ""}
                                                onChange={e =>
                                                    setTrainingForm({
                                                        ...trainingForm,
                                                        description: e.target.value,
                                                    })
                                                }
                                                className={inputFocus}
                                                rows={2}
                                            />
                                        </div>
                                    </div>
                                    <div className="flex justify-end gap-2">
                                        <Button
                                            variant="outline"
                                            onClick={() => {
                                                setShowTrainingForm(false);
                                                setEditingTraining(null);
                                            }}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            onClick={handleSaveTraining}
                                            className={btnPrimary}
                                            disabled={saving}
                                        >
                                            {editingTraining ? "Update" : "Save"}
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {training.length === 0 && !showTrainingForm ? (
                                <div
                                    className={`text-center py-12 text-muted-foreground ${isDark ? "bg-muted/30" : "bg-gray-50"} rounded-lg`}
                                >
                                    <Award className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                                    <p>No training records found</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {training.map(tr => (
                                        <div
                                            key={tr.id}
                                            className={`${cardBg} rounded-lg p-4 hover:shadow-md transition-shadow`}
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <h4
                                                            className={`font-semibold ${headingText}`}
                                                        >
                                                            {tr.trainingName}
                                                        </h4>
                                                        <span
                                                            className={`px-2 py-0.5 text-xs rounded-full ${getStatusBadgeColor(tr.status)}`}
                                                        >
                                                            {tr.status}
                                                        </span>
                                                    </div>
                                                    <p className="text-gray-600">{tr.provider}</p>
                                                    <p className="text-sm text-gray-500">
                                                        {tr.trainingType}
                                                    </p>
                                                    <p className="text-sm text-gray-400 mt-1">
                                                        {tr.startDate} - {tr.endDate || "Present"}
                                                        {tr.certificateNumber &&
                                                            ` | Cert: ${tr.certificateNumber}`}
                                                    </p>
                                                </div>
                                                <div className="flex gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => {
                                                            setEditingTraining(tr);
                                                            setTrainingForm(tr);
                                                            setShowTrainingForm(true);
                                                        }}
                                                        className={iconHover}
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleDeleteTraining(tr.id)}
                                                        className={btnDelete}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === "languages" && (
                        <LanguageSkillsSection
                            headingText={headingText}
                            labelText={labelText}
                            formPanelBg={formPanelBg}
                            inputFocus={inputFocus}
                            cardBg={cardBg}
                            iconHover={iconHover}
                            btnPrimary={btnPrimary}
                            btnDelete={btnDelete}
                            isDark={isDark}
                            saving={saving}
                            languages={languages}
                            showLanguageForm={showLanguageForm}
                            editingLanguage={editingLanguage}
                            languageForm={languageForm}
                            setShowLanguageForm={setShowLanguageForm}
                            setEditingLanguage={setEditingLanguage}
                            setLanguageForm={setLanguageForm}
                            handleSaveLanguage={handleSaveLanguage}
                            handleDeleteLanguage={handleDeleteLanguage}
                            getLevelBadgeColor={getLevelBadgeColor}
                        />
                    )}

                    {activeTab === "experience" && (
                        <WorkExperienceSection
                            headingText={headingText}
                            labelText={labelText}
                            formPanelBg={formPanelBg}
                            inputFocus={inputFocus}
                            cardBg={cardBg}
                            iconHover={iconHover}
                            btnPrimary={btnPrimary}
                            btnDelete={btnDelete}
                            isDark={isDark}
                            saving={saving}
                            experience={experience}
                            showExperienceForm={showExperienceForm}
                            editingExperience={editingExperience}
                            experienceForm={experienceForm}
                            setShowExperienceForm={setShowExperienceForm}
                            setEditingExperience={setEditingExperience}
                            setExperienceForm={setExperienceForm}
                            handleSaveExperience={handleSaveExperience}
                            handleDeleteExperience={handleDeleteExperience}
                            toExperienceForm={toExperienceForm}
                        />
                    )}
                </div>

                {/* Footer - always visible at bottom of modal */}
                <div className={`flex-shrink-0 flex justify-end gap-3 p-4 ${footerBg}`}>
                    <Button variant="outline" onClick={onClose}>
                        Close
                    </Button>
                </div>
            </div>
        </div>
    );
}
