"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { SurveyModel, SurveyResponse } from "@/lib/models/survey";
import { useFirestore } from "@/context/firestore-context";
import getEmployeeFullName from "@/lib/util/getEmployeeFullName";
import { SurveyResponseModal } from "@/components/employee/employee-engagement/modals/survey-response-modal";
import {
    Survey,
    transformSurveyForModal,
} from "@/components/employee/employee-engagement/blocks/survey/survey";

interface AnsweredSurveysProps {
    data: SurveyModel | null;
    filteredSurveyResponses: SurveyResponse[];
}

export default function AnsweredSurveys({ data, filteredSurveyResponses }: AnsweredSurveysProps) {
    const { employees, multipleChoices, shortAnswers, commonAnswers, hrSettings } = useFirestore();

    const [dataSource, setDataSource] = useState<any[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [viewModalOpen, setViewModalOpen] = useState<boolean>(false);
    const [modalSurvey, setModalSurvey] = useState<Survey>({
        id: "",
        title: "",
        description: "",
        startDate: "",
        endDate: "",
        duration: 0,
        status: "Published",
        questions: [],
        hasResponded: true,
        responseDate: "",
        responses: [],
    });

    useEffect(() => {
        const data: any[] = [];
        filteredSurveyResponses.map(sr => {
            const emp = employees.find(e => e.uid == sr.uid);
            data.push({
                id: sr?.id ?? "",
                timestamp: sr.timestamp,
                uid: sr.uid,
                employeeID: emp?.employeeID ?? "",
                name: (() => {
                    const employee = employees.find(e => e.uid === sr.uid);
                    return employee ? getEmployeeFullName(employee) : "Unknown";
                })(),
            });
        });

        setDataSource(data);
        setLoading(false);
    }, [employees, filteredSurveyResponses]);

    const handleRowClick = (response: SurveyResponse) => {
        // Use the transform function
        const transformedSurvey = transformSurveyForModal(
            data ? data : ({} as SurveyModel),
            multipleChoices,
            shortAnswers,
            commonAnswers,
            hrSettings.commonAnswerTypes,
            response.uid,
        );

        setModalSurvey(transformedSurvey);
        setViewModalOpen(true);
    };

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle>Survey Responses</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <p>Loading...</p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Timestamp</TableHead>
                                    <TableHead>Employee ID</TableHead>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {dataSource.map(row => (
                                    <TableRow key={row.id}>
                                        <TableCell>
                                            {new Date(row.timestamp).toLocaleString()}
                                        </TableCell>
                                        <TableCell>{row.employeeID}</TableCell>
                                        <TableCell>{row.name}</TableCell>
                                        <TableCell>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() =>
                                                    handleRowClick(
                                                        filteredSurveyResponses.find(
                                                            sr => sr.id === row.id,
                                                        )!,
                                                    )
                                                }
                                            >
                                                View
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            <SurveyResponseModal
                isOpen={viewModalOpen}
                onClose={() => setViewModalOpen(false)}
                survey={modalSurvey}
                mode="view"
            />
        </>
    );
}
