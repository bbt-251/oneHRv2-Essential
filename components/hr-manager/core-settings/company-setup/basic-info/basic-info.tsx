"use client";

import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/authContext";
import { useData } from "@/context/app-data-context";
import { useToast } from "@/context/toastContext";
import { hrSettingsService } from "@/lib/backend/hr-settings-service";
import uploadFile from "@/lib/backend/upload/upload-file";
import { COMPANY_INFO_LOG_MESSAGES } from "@/lib/log-descriptions/company-info";
import { CompanyInfoModel } from "@/lib/models/companyInfo";
import { Building2, Edit, Globe, Loader2, Mail, MapPin, Phone, User } from "lucide-react";
import Image from "next/image";
import { useMemo, useState } from "react";
import EditInfoModal from "./modals/edit-info";

export function BasicInfo({
    hideEditButton = false,
    hideSaveButton = false,
    disableInputs = false,
}: {
    hideEditButton?: boolean;
    hideSaveButton?: boolean;
    disableInputs?: boolean;
}) {
    const { showToast } = useToast();
    const { ...hrSettings } = useData();
    const { theme } = useTheme();
    const { userData } = useAuth();
    const companyInfo = hrSettings.companyInfo?.[0];

    const persistedCompanyData = useMemo<Partial<CompanyInfoModel>>(
        () => ({
            mission: companyInfo?.mission ?? "",
            vision: companyInfo?.vision ?? "",
            values: companyInfo?.values ?? {
                qualityExcellence: "",
                sustainability: "",
            },
        }),
        [companyInfo],
    );

    const persistedBasicInfo = useMemo<Partial<CompanyInfoModel>>(
        () => ({
            companyName: companyInfo?.companyName ?? "",
            postalAddress: companyInfo?.postalAddress ?? "",
            companyUrl: companyInfo?.companyUrl ?? "",
            telNo: companyInfo?.telNo ?? "",
            contactPerson: companyInfo?.contactPerson ?? "",
            emailAddress: companyInfo?.emailAddress ?? "",
            managingDirector: companyInfo?.managingDirector ?? "",
            legalRepresentative: companyInfo?.legalRepresentative ?? "",
            yearsInBusiness: companyInfo?.yearsInBusiness ?? "",
            companySize: companyInfo?.companySize ?? "",
            companySector: companyInfo?.companySector ?? "",
            tinNumber: companyInfo?.tinNumber ?? "",
            faxNumber: companyInfo?.faxNumber ?? "",
            houseNumber: companyInfo?.houseNumber ?? "",
            capital: companyInfo?.capital ?? "",
            totalAnnualRevenue: companyInfo?.totalAnnualRevenue ?? "",
            companyProfile: companyInfo?.companyProfile ?? "",
            companyLogoURL: companyInfo?.companyLogoURL ?? "",
        }),
        [companyInfo],
    );

    const [showBasicInfoModal, setShowBasicInfoModal] = useState<boolean>(false);
    const [companyData, setCompanyData] = useState<Partial<CompanyInfoModel>>({
        mission: "",
        vision: "",
        values: {
            qualityExcellence: "",
            sustainability: "",
        },
    });

    const [basicInfo, setBasicInfo] = useState<Partial<CompanyInfoModel>>({
        companyName: "",
        postalAddress: "",
        companyUrl: "",
        telNo: "",
        contactPerson: "",
        emailAddress: "",
        managingDirector: "",
        legalRepresentative: "",
        yearsInBusiness: "",
        companySize: "",
        companySector: "",
        tinNumber: "",
        faxNumber: "",
        houseNumber: "",
        capital: "",
        totalAnnualRevenue: "",
        companyProfile: "",
    });

    const currentCompanyData = useMemo<Partial<CompanyInfoModel>>(
        () => ({
            ...persistedCompanyData,
            ...companyData,
            values: {
                ...persistedCompanyData.values,
                ...companyData.values,
            },
        }),
        [companyData, persistedCompanyData],
    );

    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [infoSubmitLoading, setInfoSubmitLoading] = useState<boolean>(false);
    const [saveLoading, setSaveLoading] = useState<boolean>(false);

    const openBasicInfoModal = () => {
        setBasicInfo(persistedBasicInfo);
        setShowBasicInfoModal(true);
    };

    const handleSave = async () => {
        setSaveLoading(true);
        const companyInfo = await hrSettingsService.getAll("companyInfo");
        let res;
        if (companyInfo?.length) {
            res = await hrSettingsService.update(
                "companyInfo",
                companyInfo[0]?.id ?? "",
                currentCompanyData,
                userData?.uid ?? "",
                COMPANY_INFO_LOG_MESSAGES.MISSION_VISION_UPDATED({
                    id: companyInfo[0]?.id ?? "",
                    mission: currentCompanyData.mission,
                    vision: currentCompanyData.vision,
                }),
            );
        } else {
            res = await hrSettingsService.create(
                "companyInfo",
                { ...currentCompanyData, ...basicInfo } as CompanyInfoModel,
                userData?.uid ?? "",
                COMPANY_INFO_LOG_MESSAGES.CREATED({
                    companyName: basicInfo.companyName || "",
                    mission: currentCompanyData.mission,
                    vision: currentCompanyData.vision,
                }),
            );
        }
        if (res) showToast("Mission, Vision & Values updated successfully", "Success", "success");
        else showToast("Error updating Mission, Vision & Values", "Error", "error");
        setSaveLoading(false);
    };

    const handleBasicInfoSubmit = async () => {
        setInfoSubmitLoading(true);
        const companyInfo = await hrSettingsService.getAll("companyInfo");
        let res;
        let companyLogoURL = "";

        if (selectedFile) {
            const url = await uploadFile(selectedFile, "company-logos");
            if (typeof url === "string") companyLogoURL = url;
            else {
                showToast("Error uploading company logo", "Error", "error");
                setInfoSubmitLoading(false);
                return;
            }
        }

        const logo = selectedFile ? { companyLogoURL } : {};

        if (companyInfo?.length)
            res = await hrSettingsService.update(
                "companyInfo",
                companyInfo[0]?.id ?? "",
                { ...basicInfo, ...logo },
                userData?.uid ?? "",
                COMPANY_INFO_LOG_MESSAGES.BASIC_INFO_UPDATED({
                    id: companyInfo[0]?.id ?? "",
                    companyName: basicInfo.companyName,
                    postalAddress: basicInfo.postalAddress,
                    emailAddress: basicInfo.emailAddress,
                    telNo: basicInfo.telNo,
                }),
            );
        else
            res = await hrSettingsService.create(
                "companyInfo",
                { ...currentCompanyData, ...basicInfo, ...logo } as CompanyInfoModel,
                userData?.uid ?? "",
                COMPANY_INFO_LOG_MESSAGES.CREATED({
                    companyName: basicInfo.companyName || "",
                    mission: currentCompanyData.mission,
                    vision: currentCompanyData.vision,
                }),
            );

        if (res) showToast("Basic info updated successfully", "Success", "success");
        else showToast("Error updating basic info", "Error", "error");

        setInfoSubmitLoading(false);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) setSelectedFile(e.target.files[0]);
    };

    const removeFile = () => setSelectedFile(null);

    const textColor = theme === "dark" ? "text-gray-300" : "text-gray-900";
    const subTextColor = theme === "dark" ? "text-gray-400" : "text-gray-600";
    const cardBg = theme === "dark" ? "bg-black border-gray-700" : "bg-white border-gray-200";
    const inputClass =
        theme === "dark"
            ? "bg-black border-gray-600 text-white placeholder-gray-400"
            : "bg-white border-gray-300 text-black placeholder-gray-500";

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className={`text-2xl font-bold ${textColor}`}>Company Profile</h1>
                    <p className={`${subTextColor} mt-1`}>
                        Manage your company&apos;s profile information and branding
                    </p>
                </div>
            </div>

            {/* Company Information Section */}
            <Card className={cardBg}>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className={`flex items-center gap-2 ${subTextColor}`}>
                        <Building2 className={`h-5 w-5 ${subTextColor}`} />
                        Company Information
                    </CardTitle>
                    {!hideEditButton && (
                        <Button
                            variant="outline"
                            size="sm"
                            className={`flex items-center gap-2 bg-transparent ${theme == "dark" ? "text-white border-white" : ""}`}
                            onClick={openBasicInfoModal}
                        >
                            <Edit className="h-4 w-4" />
                            Edit Basic Info
                        </Button>
                    )}
                    <EditInfoModal
                        showBasicInfoModal={showBasicInfoModal}
                        setShowBasicInfoModal={setShowBasicInfoModal}
                        basicInfo={basicInfo}
                        setBasicInfo={setBasicInfo}
                        selectedFile={selectedFile}
                        handleFileChange={handleFileChange}
                        removeFile={removeFile}
                        handleBasicInfoSubmit={handleBasicInfoSubmit}
                        infoSubmitLoading={infoSubmitLoading}
                    />
                </CardHeader>

                <CardContent>
                    <div className="mb-4">
                        {persistedBasicInfo.companyLogoURL && (
                            <div className="flex items-center gap-3">
                                <Image
                                    src={persistedBasicInfo.companyLogoURL}
                                    alt="Company Logo"
                                    width={112}
                                    height={112}
                                    unoptimized
                                    className="h-28 w-auto object-cover rounded-md border"
                                />
                            </div>
                        )}
                    </div>

                    {/* Info grid */}
                    <div
                        className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${theme == "dark" ? "text-white" : ""}`}
                    >
                        {[
                            {
                                icon: Building2,
                                label: "Company Name",
                                value: persistedBasicInfo.companyName,
                            },
                            {
                                icon: MapPin,
                                label: "Address",
                                value: persistedBasicInfo.postalAddress,
                            },
                            { icon: Globe, label: "Website", value: persistedBasicInfo.companyUrl },
                            { icon: Phone, label: "Phone", value: persistedBasicInfo.telNo },
                            { icon: Mail, label: "Email", value: persistedBasicInfo.emailAddress },
                            {
                                icon: User,
                                label: "Contact Person",
                                value: persistedBasicInfo.contactPerson,
                            },
                            {
                                icon: User,
                                label: "Managing Director",
                                value: persistedBasicInfo.managingDirector,
                            },
                            {
                                icon: Building2,
                                label: "Company Size",
                                value: persistedBasicInfo.companySize,
                            },
                            {
                                icon: Building2,
                                label: "Sector",
                                value: persistedBasicInfo.companySector,
                            },
                        ].map((item, idx) => (
                            <div key={idx} className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <item.icon className={`h-5 w-5 ${subTextColor}`} />
                                    <div>
                                        <p className={`text-sm ${subTextColor}`}>{item.label}</p>
                                        <p className="font-medium">{item.value}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {persistedBasicInfo.companyProfile && (
                        <div
                            className={`mt-6 pt-6 border-t ${theme == "dark" ? "border-gray-700" : "border-gray-200"}`}
                        >
                            <h4 className={`font-medium ${textColor} mb-2`}>Company Profile</h4>
                            <p className={`${subTextColor} leading-relaxed`}>
                                {persistedBasicInfo.companyProfile}
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Mission, Vision & Values Section */}
            <Card className={cardBg}>
                <CardHeader>
                    <CardTitle className={textColor}>Mission, Vision & Values</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {[
                        { id: "mission", label: "Mission", value: currentCompanyData.mission },
                        { id: "vision", label: "Vision", value: currentCompanyData.vision },
                    ].map(item => (
                        <div key={item.id}>
                            <Label htmlFor={item.id} className={`text-sm font-medium ${textColor}`}>
                                {item.label}:
                            </Label>
                            <Textarea
                                id={item.id}
                                rows={4}
                                value={item.value}
                                onChange={e =>
                                    setCompanyData({ ...companyData, [item.id]: e.target.value })
                                }
                                className={`mt-2 ${inputClass}`}
                                disabled={disableInputs}
                            />
                        </div>
                    ))}

                    {/* Values */}
                    <div>
                        <Label className={`text-sm font-medium ${textColor}`}>Values:</Label>
                        <div className="mt-2 space-y-4">
                            {[
                                {
                                    id: "qualityExcellence",
                                    label: "Quality Excellence",
                                    value: currentCompanyData?.values?.qualityExcellence,
                                },
                                {
                                    id: "sustainability",
                                    label: "Sustainability",
                                    value: currentCompanyData?.values?.sustainability,
                                },
                            ].map(item => (
                                <div key={item.id}>
                                    <Label htmlFor={item.id} className={`text-sm ${subTextColor}`}>
                                        {item.label}
                                    </Label>
                                    <Textarea
                                        id={item.id}
                                        rows={2}
                                        value={item.value}
                                        onChange={e =>
                                            setCompanyData({
                                                ...companyData,
                                                values: {
                                                    ...companyData.values,
                                                    [item.id]: e.target.value,
                                                },
                                            })
                                        }
                                        className={`mt-1 ${inputClass}`}
                                        disabled={disableInputs}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    {!hideSaveButton && (
                        <div className="flex justify-end pr-5">
                            <Button
                                onClick={handleSave}
                                className={`text-white ${theme === "dark" ? "bg-amber-700 hover:bg-amber-800" : "bg-gray-700 hover:bg-gray-800"}`}
                                disabled={saveLoading}
                            >
                                {saveLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Saving
                                    </>
                                ) : (
                                    "Save"
                                )}
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
