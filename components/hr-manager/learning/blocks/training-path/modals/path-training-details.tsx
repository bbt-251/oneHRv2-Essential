"use client";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { useFirestore } from "@/context/firestore-context";
import { TrainingPathModel } from "@/lib/models/training-path";
import { dateFormat } from "@/lib/util/dayjs_format";
import dayjs from "dayjs";

interface PathTrainingDetailsProps {
    selectedPath: TrainingPathModel;
}

export default function PathTrainingDetails({ selectedPath }: PathTrainingDetailsProps) {
    const { trainingMaterials, hrSettings } = useFirestore();
    const competencies = hrSettings.competencies;
    return (
        <div className="space-y-6">
            <h3 className="text-lg font-semibold">Training Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                    <Label className="font-semibold">Associated Training Materials</Label>
                    <div className="flex flex-wrap gap-2 mt-1">
                        {selectedPath.trainingMaterials.map((materialId, index) => {
                            const material = trainingMaterials.find(m => m.id === materialId);
                            return (
                                <Badge key={index} variant="secondary">
                                    {material ? material.name : "Unknown Material"}
                                </Badge>
                            );
                        })}
                    </div>
                </div>
                <div>
                    <Label className="font-semibold">Estimated Duration (weeks)</Label>
                    <p className="text-sm text-muted-foreground">
                        {selectedPath.estimatedDuration}
                    </p>
                </div>
                <div>
                    <Label className="font-semibold">Targeted Competencies</Label>
                    <div className="flex flex-wrap gap-2 mt-1">
                        {selectedPath.competencies.map((competency, index) => (
                            <Badge key={index} variant="secondary">
                                {competencies.find(comp => comp.id === competency)?.competenceName}
                            </Badge>
                        ))}
                    </div>
                </div>
                <div>
                    <Label className="font-semibold">Start Date</Label>
                    <p className="text-sm text-muted-foreground">
                        {dayjs(selectedPath.dateRange[0]).format(dateFormat)}
                    </p>
                </div>
                <div>
                    <Label className="font-semibold">End Date</Label>
                    <p className="text-sm text-muted-foreground">
                        {dayjs(selectedPath.dateRange[1]).format(dateFormat)}
                    </p>
                </div>
                <div className="md:col-span-2">
                    <Label className="font-semibold">Outcome</Label>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {selectedPath.outcome}
                    </p>
                </div>
                <div className="md:col-span-2">
                    <Label className="font-semibold">Justification</Label>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {selectedPath.justification}
                    </p>
                </div>
            </div>
        </div>
    );
}
