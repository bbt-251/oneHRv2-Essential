"use client";

import * as React from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useTheme } from "@/components/theme-provider";
import { Edit, X, Upload, FileText, Loader2 } from "lucide-react";
import { CompanyInfoModel } from "@/lib/models/companyInfo";

interface EditInfoModalProps {
    showBasicInfoModal: boolean;
    setShowBasicInfoModal: (value: boolean) => void;
    basicInfo: Partial<CompanyInfoModel>;
    setBasicInfo: React.Dispatch<React.SetStateAction<Partial<CompanyInfoModel>>>;
    selectedFile: File | null;
    handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    removeFile: () => void;
    handleBasicInfoSubmit: () => void;
    infoSubmitLoading: boolean;
}

const EditInfoModal: React.FC<EditInfoModalProps> = ({
    showBasicInfoModal,
    setShowBasicInfoModal,
    basicInfo,
    setBasicInfo,
    selectedFile,
    handleFileChange,
    removeFile,
    handleBasicInfoSubmit,
    infoSubmitLoading,
}) => {
    const { theme } = useTheme();
    const labelClass = `${theme === "dark" ? "text-gray-300" : "text-slate-700"} text-sm font-medium`;

    const inputClass =
        theme === "dark"
            ? "bg-gray-900 border-gray-700 text-white placeholder-gray-500"
            : "bg-white border-gray-300 text-black placeholder-gray-400";

    return (
        <Dialog open={showBasicInfoModal} onOpenChange={setShowBasicInfoModal}>
            <DialogContent
                className={`max-w-2xl max-h-[90vh] overflow-y-auto ${
                    theme === "dark"
                        ? "bg-gray-900 border-gray-700 text-white"
                        : "bg-white border-gray-200 text-black"
                }`}
            >
                <DialogHeader>
                    <DialogTitle className="flex items-center justify-between">
                        Update Basic Info
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Grid inputs */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="companyName" className={labelClass}>
                                Company Name:
                            </Label>
                            <Input
                                id="companyName"
                                className={inputClass}
                                value={basicInfo.companyName}
                                onChange={e =>
                                    setBasicInfo({ ...basicInfo, companyName: e.target.value })
                                }
                            />
                        </div>
                        <div>
                            <Label htmlFor="telNo" className={labelClass}>
                                Phone Number:
                            </Label>
                            <Input
                                id="telNo"
                                type="tel"
                                className={inputClass}
                                value={basicInfo.telNo}
                                onChange={e =>
                                    setBasicInfo({ ...basicInfo, telNo: e.target.value })
                                }
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="contactPerson" className={labelClass}>
                                Contact Person:
                            </Label>
                            <Input
                                id="contactPerson"
                                className={inputClass}
                                value={basicInfo.contactPerson}
                                onChange={e =>
                                    setBasicInfo({ ...basicInfo, contactPerson: e.target.value })
                                }
                            />
                        </div>
                        <div>
                            <Label htmlFor="companySector" className={labelClass}>
                                Sector:
                            </Label>
                            <Input
                                id="companySector"
                                className={inputClass}
                                value={basicInfo.companySector}
                                onChange={e =>
                                    setBasicInfo({ ...basicInfo, companySector: e.target.value })
                                }
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="companySize" className={labelClass}>
                                Company Size:
                            </Label>
                            <Input
                                id="companySize"
                                className={inputClass}
                                value={basicInfo.companySize}
                                onChange={e =>
                                    setBasicInfo({ ...basicInfo, companySize: e.target.value })
                                }
                            />
                        </div>
                        <div>
                            <Label htmlFor="postalAddress" className={labelClass}>
                                Postal Address:
                            </Label>
                            <Input
                                id="postalAddress"
                                className={inputClass}
                                value={basicInfo.postalAddress}
                                onChange={e =>
                                    setBasicInfo({ ...basicInfo, postalAddress: e.target.value })
                                }
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="emailAddress" className={labelClass}>
                                Email Address:
                            </Label>
                            <Input
                                id="emailAddress"
                                type="email"
                                className={inputClass}
                                value={basicInfo.emailAddress}
                                onChange={e =>
                                    setBasicInfo({ ...basicInfo, emailAddress: e.target.value })
                                }
                            />
                        </div>
                        <div>
                            <Label htmlFor="managingDirector" className={labelClass}>
                                Managing Director:
                            </Label>
                            <Input
                                id="managingDirector"
                                className={inputClass}
                                value={basicInfo.managingDirector}
                                onChange={e =>
                                    setBasicInfo({ ...basicInfo, managingDirector: e.target.value })
                                }
                            />
                        </div>
                    </div>

                    {/* Company Profile */}
                    <div>
                        <Label htmlFor="companyProfile" className={labelClass}>
                            Company Profile:
                        </Label>
                        <Textarea
                            id="companyProfile"
                            rows={4}
                            className={inputClass}
                            value={basicInfo.companyProfile}
                            onChange={e =>
                                setBasicInfo({ ...basicInfo, companyProfile: e.target.value })
                            }
                        />
                    </div>

                    {/* File Upload */}
                    <div
                        className={`border-2 border-dashed rounded-lg p-8 text-center space-y-4 ${
                            theme === "dark" ? "border-gray-700" : "border-gray-300"
                        }`}
                    >
                        {!selectedFile ? (
                            <>
                                <Upload
                                    className={`h-12 w-12 mx-auto ${theme === "dark" ? "text-gray-400" : "text-gray-400"}`}
                                />
                                <p className={theme === "dark" ? "text-gray-300" : "text-gray-600"}>
                                    Add Company Logo
                                </p>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    className="hidden"
                                    id="company-logo-upload"
                                />
                                <label htmlFor="company-logo-upload">
                                    <Button variant="outline" size="sm" asChild>
                                        <span>Choose File</span>
                                    </Button>
                                </label>
                            </>
                        ) : (
                            <div
                                className={`flex items-center justify-between p-4 rounded-lg border ${
                                    theme === "dark"
                                        ? "bg-gray-800 border-gray-700"
                                        : "bg-slate-50 border-slate-200"
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <FileText className="h-5 w-5 text-blue-500" />
                                    <div>
                                        <span
                                            className={`text-sm font-medium ${theme === "dark" ? "text-gray-200" : "text-slate-600"}`}
                                        >
                                            {selectedFile.name}
                                        </span>
                                        <p
                                            className={`text-xs ${theme === "dark" ? "text-gray-400" : "text-slate-400"}`}
                                        >
                                            {(selectedFile.size / 1024).toFixed(1)} KB
                                        </p>
                                    </div>
                                </div>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={removeFile}
                                    className={`${theme === "dark" ? "text-red-500 hover:text-red-600 hover:bg-red-800/20" : "text-red-600 hover:text-red-700 hover:bg-red-50"}`}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        )}
                    </div>

                    {/* Submit */}
                    <div className="flex justify-end mt-4">
                        <Button
                            onClick={handleBasicInfoSubmit}
                            className={`text-white ${theme === "dark" ? "bg-amber-700 hover:bg-amber-800" : "bg-gray-700 hover:bg-gray-800"}`}
                            disabled={infoSubmitLoading}
                        >
                            {infoSubmitLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting
                                </>
                            ) : (
                                "Submit"
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default EditInfoModal;
