import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { useFirestore } from "@/context/firestore-context";
import { TrainingMaterialRequestModel } from "@/lib/models/training-material";
import { dateFormat } from "@/lib/util/dayjs_format";
import dayjs from "dayjs";

interface AudienceAndSchedulingProps {
    selectedRequest: TrainingMaterialRequestModel;
}

export default function AudienceAndScheduling({ selectedRequest }: AudienceAndSchedulingProps) {
    const { activeEmployees: employees, quizzes, hrSettings } = useFirestore();
    const competencies = hrSettings.competencies;

    return (
        <div className="space-y-6">
            <h3 className="text-lg font-semibold">Audience and Scheduling</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <Label className="font-semibold">Start Date</Label>
                    <p className="text-sm text-muted-foreground">
                        {dayjs(selectedRequest.startDate).format(dateFormat)}
                    </p>
                </div>
                <div>
                    <Label className="font-semibold">End Date</Label>
                    <p className="text-sm text-muted-foreground">
                        {dayjs(selectedRequest.endDate).format(dateFormat)}
                    </p>
                </div>
                <div>
                    <Label className="font-semibold">Audience Target</Label>
                    <div className="flex flex-wrap gap-2 mt-1">
                        {selectedRequest.audienceTarget.map((target, index) => (
                            <Badge key={index} variant="secondary">
                                {target}
                            </Badge>
                        ))}
                    </div>
                </div>
                <div>
                    <Label className="font-semibold">Employees</Label>
                    <div className="flex flex-wrap gap-2 mt-1">
                        {selectedRequest.employees.map((employee, index) => (
                            <Badge key={index} variant="secondary">
                                {employees.find(emp => emp.uid === employee)?.firstName}
                            </Badge>
                        ))}
                    </div>
                </div>
                <div>
                    <Label className="font-semibold">Associated Quiz</Label>
                    <p className="text-sm text-muted-foreground">
                        {
                            quizzes.find(
                                quiz => quiz.id === selectedRequest.associatedQuiz.join(", "),
                            )?.quizTitle
                        }
                    </p>
                </div>
                <div>
                    <Label className="font-semibold">Requirement Level</Label>
                    <p className="text-sm text-muted-foreground">
                        {selectedRequest.requirementLevel}
                    </p>
                </div>
                <div>
                    <Label className="font-semibold">Targeted Competencies</Label>
                    <div className="flex flex-wrap gap-2 mt-1">
                        {selectedRequest.targetedCompetencies.map((competency, index) => (
                            <Badge key={index} variant="secondary">
                                {competencies.find(comp => comp.id === competency)?.competenceName}
                            </Badge>
                        ))}
                    </div>
                </div>
                <div>
                    <Label className="font-semibold">Certification Title</Label>
                    <p className="text-sm text-muted-foreground">
                        {selectedRequest.certificationTitle}
                    </p>
                </div>
                <div>
                    <Label className="font-semibold">Availability</Label>
                    <p className="text-sm text-muted-foreground">
                        {selectedRequest.availability} days
                    </p>
                </div>
                <div className="md:col-span-2">
                    <Label className="font-semibold">Output Value</Label>
                    <p className="text-sm text-muted-foreground">{selectedRequest.outputValue}</p>
                </div>
            </div>
        </div>
    );
}
