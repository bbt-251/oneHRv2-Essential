"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { SurveyModel, SurveyResponse } from "@/lib/models/survey";
import ViewSurveyDetail from "./viewSurveyDetail";
import AnsweredSurveys from "./answeredSurveys";
import SurveyReport from "./surveyReport";
import ShortAnswers from "./shortAnswers";
import { useFirestore } from "@/context/firestore-context";

interface SurveyDetailTabsProps {
    open: boolean;
    setOpen: (open: boolean) => void;
    data: SurveyModel | null;
}

export function SurveyDetailTabs({ open, setOpen, data }: SurveyDetailTabsProps) {
    const [filteredSurveyResponses, setFilteredSurveyResponses] = useState<SurveyResponse[]>([]);
    const [activeTab, setActiveTab] = useState("1");

    useEffect(() => {
        setFilteredSurveyResponses(data?.responses || []);
    }, [data?.responses]);

    const tabOptions = [
        {
            key: "1",
            label: "Information",
            content: <ViewSurveyDetail data={data ?? ({} as SurveyModel)} />,
        },
        {
            key: "2",
            label: "Survey Answers",
            content: (
                <AnsweredSurveys data={data} filteredSurveyResponses={filteredSurveyResponses} />
            ),
        },
        {
            key: "3",
            label: "Survey Report",
            content: (
                <SurveyReport
                    survey={data ?? ({} as SurveyModel)}
                    surveyResponses={filteredSurveyResponses}
                />
            ),
        },
        {
            key: "4",
            label: "Short Answers",
            content: <ShortAnswers data={data} filteredSurveyResponses={filteredSurveyResponses} />,
        },
    ];

    const activeTabContent = tabOptions.find(tab => tab.key === activeTab)?.content;

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
                <DialogHeader>
                    <DialogTitle>Detail</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    <div className="flex space-x-1 border-b">
                        {tabOptions.map(tab => (
                            <Button
                                key={tab.key}
                                variant={activeTab === tab.key ? "default" : "ghost"}
                                className={`rounded-none border-b-2 border-transparent ${
                                    activeTab === tab.key ? "bg-[#FFFAEC] text-gray-900" : ""
                                }`}
                                onClick={() => setActiveTab(tab.key)}
                            >
                                {tab.label}
                            </Button>
                        ))}
                    </div>
                    <div className="max-h-[70vh] overflow-y-auto">{activeTabContent}</div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
