"use client";

import type { Dispatch, SetStateAction } from "react";
import { Briefcase, Edit, Languages, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ExperienceDetailModel, LanguageSkillModel } from "@/lib/models/employee";

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

interface LanguageSkillsSectionProps {
    headingText: string;
    labelText: string;
    formPanelBg: string;
    inputFocus: string;
    cardBg: string;
    iconHover: string;
    btnPrimary: string;
    btnDelete: string;
    isDark: boolean;
    saving: boolean;
    languages: LanguageSkillModel[];
    showLanguageForm: boolean;
    editingLanguage: LanguageSkillModel | null;
    languageForm: Partial<LanguageSkillModel>;
    setShowLanguageForm: Dispatch<SetStateAction<boolean>>;
    setEditingLanguage: Dispatch<SetStateAction<LanguageSkillModel | null>>;
    setLanguageForm: Dispatch<SetStateAction<Partial<LanguageSkillModel>>>;
    handleSaveLanguage: () => Promise<void>;
    handleDeleteLanguage: (id: string) => Promise<void>;
    getLevelBadgeColor: (level: string) => string;
}

interface WorkExperienceSectionProps {
    headingText: string;
    labelText: string;
    formPanelBg: string;
    inputFocus: string;
    cardBg: string;
    iconHover: string;
    btnPrimary: string;
    btnDelete: string;
    isDark: boolean;
    saving: boolean;
    experience: ExperienceDetailModel[];
    showExperienceForm: boolean;
    editingExperience: ExperienceDetailModel | null;
    experienceForm: ExperienceForm;
    setShowExperienceForm: Dispatch<SetStateAction<boolean>>;
    setEditingExperience: Dispatch<SetStateAction<ExperienceDetailModel | null>>;
    setExperienceForm: Dispatch<SetStateAction<ExperienceForm>>;
    handleSaveExperience: () => Promise<void>;
    handleDeleteExperience: (id: string) => Promise<void>;
    toExperienceForm: (exp: ExperienceDetailModel) => ExperienceForm;
}

export function LanguageSkillsSection({
    headingText,
    labelText,
    formPanelBg,
    inputFocus,
    cardBg,
    iconHover,
    btnPrimary,
    btnDelete,
    isDark,
    saving,
    languages,
    showLanguageForm,
    editingLanguage,
    languageForm,
    setShowLanguageForm,
    setEditingLanguage,
    setLanguageForm,
    handleSaveLanguage,
    handleDeleteLanguage,
    getLevelBadgeColor,
}: LanguageSkillsSectionProps) {
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className={`text-lg font-semibold ${headingText}`}>Language Skills</h3>
                <Button
                    onClick={() => {
                        setShowLanguageForm(true);
                        setEditingLanguage(null);
                        setLanguageForm({});
                    }}
                    className={btnPrimary}
                    disabled={saving}
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Create
                </Button>
            </div>

            {showLanguageForm && (
                <div className={`${formPanelBg} rounded-lg p-6 space-y-4`}>
                    <h4 className={`font-medium ${headingText}`}>
                        {editingLanguage ? "Edit Language" : "Add Language"}
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label className={labelText}>Language *</Label>
                            <Input
                                value={languageForm.language ?? ""}
                                onChange={e =>
                                    setLanguageForm({
                                        ...languageForm,
                                        language: e.target.value,
                                    })
                                }
                                className={inputFocus}
                            />
                        </div>
                        <div>
                            <Label className={labelText}>Certification</Label>
                            <Input
                                value={languageForm.certification ?? ""}
                                onChange={e =>
                                    setLanguageForm({
                                        ...languageForm,
                                        certification: e.target.value,
                                    })
                                }
                                className={inputFocus}
                                placeholder="e.g., TOEFL, IELTS"
                            />
                        </div>
                        {(
                            [
                                "readingLevel",
                                "writingLevel",
                                "speakingLevel",
                                "listeningLevel",
                            ] as const
                        ).map(key => (
                            <div key={key}>
                                <Label className={labelText}>
                                    {key
                                        .replace(/([A-Z])/g, " $1")
                                        .replace(/^./, s => s.toUpperCase())}{" "}
                                    *
                                </Label>
                                <select
                                    value={languageForm[key] ?? "basic"}
                                    onChange={e =>
                                        setLanguageForm({
                                            ...languageForm,
                                            [key]: e.target.value as LanguageSkillModel[typeof key],
                                        })
                                    }
                                    className={`w-full h-10 border rounded-md px-3 ${inputFocus}`}
                                >
                                    <option value="basic">Basic</option>
                                    <option value="intermediate">Intermediate</option>
                                    <option value="advanced">Advanced</option>
                                    <option value="native">Native</option>
                                </select>
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setShowLanguageForm(false);
                                setEditingLanguage(null);
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSaveLanguage}
                            className={btnPrimary}
                            disabled={saving}
                        >
                            {editingLanguage ? "Update" : "Save"}
                        </Button>
                    </div>
                </div>
            )}

            {languages.length === 0 && !showLanguageForm ? (
                <div
                    className={`text-center py-12 text-muted-foreground ${isDark ? "bg-muted/30" : "bg-gray-50"} rounded-lg`}
                >
                    <Languages className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p>No language skills found</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {languages.map(lang => (
                        <div
                            key={lang.id}
                            className={`${cardBg} rounded-lg p-4 hover:shadow-md transition-shadow`}
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div>
                                    <h4 className={`font-semibold ${headingText}`}>
                                        {lang.language}
                                    </h4>
                                    {lang.certification && (
                                        <p className="text-sm text-gray-500">
                                            {lang.certification}
                                        </p>
                                    )}
                                </div>
                                <div className="flex gap-1">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                            setEditingLanguage(lang);
                                            setLanguageForm(lang);
                                            setShowLanguageForm(true);
                                        }}
                                        className={iconHover}
                                    >
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => void handleDeleteLanguage(lang.id)}
                                        className={btnDelete}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                                {(
                                    [
                                        "readingLevel",
                                        "writingLevel",
                                        "speakingLevel",
                                        "listeningLevel",
                                    ] as const
                                ).map(key => (
                                    <div key={key} className="flex items-center justify-between">
                                        <span className="text-gray-500">
                                            {key
                                                .replace(/([A-Z])/g, " $1")
                                                .replace(/^./, s => s.toUpperCase())}
                                            :
                                        </span>
                                        <span
                                            className={`px-2 py-0.5 rounded-full text-xs ${getLevelBadgeColor(lang[key])}`}
                                        >
                                            {lang[key]}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export function WorkExperienceSection({
    headingText,
    labelText,
    formPanelBg,
    inputFocus,
    cardBg,
    iconHover,
    btnPrimary,
    btnDelete,
    isDark,
    saving,
    experience,
    showExperienceForm,
    editingExperience,
    experienceForm,
    setShowExperienceForm,
    setEditingExperience,
    setExperienceForm,
    handleSaveExperience,
    handleDeleteExperience,
    toExperienceForm,
}: WorkExperienceSectionProps) {
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className={`text-lg font-semibold ${headingText}`}>Work Experience</h3>
                <Button
                    onClick={() => {
                        setShowExperienceForm(true);
                        setEditingExperience(null);
                        setExperienceForm({});
                    }}
                    className={btnPrimary}
                    disabled={saving}
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Create
                </Button>
            </div>

            {showExperienceForm && (
                <div className={`${formPanelBg} rounded-lg p-6 space-y-4`}>
                    <h4 className={`font-medium ${headingText}`}>
                        {editingExperience ? "Edit Work Experience" : "Add Work Experience"}
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label className={labelText}>Company Name *</Label>
                            <Input
                                value={experienceForm.companyName ?? ""}
                                onChange={e =>
                                    setExperienceForm({
                                        ...experienceForm,
                                        companyName: e.target.value,
                                    })
                                }
                                className={inputFocus}
                            />
                        </div>
                        <div>
                            <Label className={labelText}>Job Title *</Label>
                            <Input
                                value={experienceForm.jobTitle ?? ""}
                                onChange={e =>
                                    setExperienceForm({
                                        ...experienceForm,
                                        jobTitle: e.target.value,
                                    })
                                }
                                className={inputFocus}
                            />
                        </div>
                        <div>
                            <Label className={labelText}>Employment Type *</Label>
                            <select
                                value={experienceForm.employmentType ?? "full-time"}
                                onChange={e =>
                                    setExperienceForm({
                                        ...experienceForm,
                                        employmentType: e.target.value,
                                    })
                                }
                                className={`w-full h-10 border rounded-md px-3 ${inputFocus}`}
                            >
                                <option value="full-time">Full-time</option>
                                <option value="part-time">Part-time</option>
                                <option value="contract">Contract</option>
                                <option value="internship">Internship</option>
                                <option value="freelance">Freelance</option>
                            </select>
                        </div>
                        <div>
                            <Label className={labelText}>Location</Label>
                            <Input
                                value={experienceForm.location ?? ""}
                                onChange={e =>
                                    setExperienceForm({
                                        ...experienceForm,
                                        location: e.target.value,
                                    })
                                }
                                className={inputFocus}
                            />
                        </div>
                        <div>
                            <Label className={labelText}>Start Date *</Label>
                            <Input
                                type="date"
                                value={experienceForm.startDate ?? ""}
                                onChange={e =>
                                    setExperienceForm({
                                        ...experienceForm,
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
                                value={experienceForm.endDate ?? ""}
                                onChange={e =>
                                    setExperienceForm({
                                        ...experienceForm,
                                        endDate: e.target.value,
                                    })
                                }
                                disabled={experienceForm.isCurrent}
                                className={inputFocus}
                            />
                        </div>
                        <div className="col-span-2 flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="isCurrent"
                                checked={experienceForm.isCurrent ?? false}
                                onChange={e =>
                                    setExperienceForm({
                                        ...experienceForm,
                                        isCurrent: e.target.checked,
                                        endDate: e.target.checked
                                            ? undefined
                                            : experienceForm.endDate,
                                    })
                                }
                                className={`rounded border-border ${isDark ? "text-foreground focus:ring-primary" : "text-primary-foreground focus:ring-primary"}`}
                            />
                            <Label htmlFor="isCurrent" className={labelText}>
                                I currently work here
                            </Label>
                        </div>
                        <div className="col-span-2">
                            <Label className={labelText}>Responsibilities</Label>
                            <Textarea
                                value={experienceForm.responsibilities ?? ""}
                                onChange={e =>
                                    setExperienceForm({
                                        ...experienceForm,
                                        responsibilities: e.target.value,
                                    })
                                }
                                className={inputFocus}
                                rows={3}
                            />
                        </div>
                        <div>
                            <Label className={labelText}>Reason for Leaving</Label>
                            <Input
                                value={experienceForm.reasonForLeaving ?? ""}
                                onChange={e =>
                                    setExperienceForm({
                                        ...experienceForm,
                                        reasonForLeaving: e.target.value,
                                    })
                                }
                                className={inputFocus}
                            />
                        </div>
                        <div>
                            <Label className={labelText}>Reference Name</Label>
                            <Input
                                value={experienceForm.referenceName ?? ""}
                                onChange={e =>
                                    setExperienceForm({
                                        ...experienceForm,
                                        referenceName: e.target.value,
                                    })
                                }
                                className={inputFocus}
                            />
                        </div>
                        <div>
                            <Label className={labelText}>Reference Contact</Label>
                            <Input
                                value={experienceForm.referenceContact ?? ""}
                                onChange={e =>
                                    setExperienceForm({
                                        ...experienceForm,
                                        referenceContact: e.target.value,
                                    })
                                }
                                className={inputFocus}
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setShowExperienceForm(false);
                                setEditingExperience(null);
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSaveExperience}
                            className={btnPrimary}
                            disabled={saving}
                        >
                            {editingExperience ? "Update" : "Save"}
                        </Button>
                    </div>
                </div>
            )}

            {experience.length === 0 && !showExperienceForm ? (
                <div
                    className={`text-center py-12 text-muted-foreground ${isDark ? "bg-muted/30" : "bg-gray-50"} rounded-lg`}
                >
                    <Briefcase className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p>No work experience found</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {experience.map(exp => (
                        <div
                            key={exp.id}
                            className={`${cardBg} rounded-lg p-4 hover:shadow-md transition-shadow`}
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <h4 className={`font-semibold ${headingText}`}>
                                            {exp.title || "Experience"}
                                        </h4>
                                        {exp.isCurrent && (
                                            <span className="px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-800">
                                                Current
                                            </span>
                                        )}
                                        <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-700">
                                            {exp.employmentType ?? "full-time"}
                                        </span>
                                    </div>
                                    <p className="text-gray-600">{exp.company}</p>
                                    {exp.location && (
                                        <p className="text-sm text-gray-500">{exp.location}</p>
                                    )}
                                    <p className="text-sm text-gray-400 mt-1">
                                        {exp.startDate} -{" "}
                                        {exp.isCurrent ? "Present" : (exp.endDate ?? "Present")}
                                    </p>
                                    {exp.mainActivities && (
                                        <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                                            {exp.mainActivities}
                                        </p>
                                    )}
                                </div>
                                <div className="flex gap-1">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                            setEditingExperience(exp);
                                            setExperienceForm(toExperienceForm(exp));
                                            setShowExperienceForm(true);
                                        }}
                                        className={iconHover}
                                    >
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => void handleDeleteExperience(exp.id)}
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
    );
}
