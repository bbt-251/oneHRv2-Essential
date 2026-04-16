import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { useFirestore } from "@/context/firestore-context";
import { TrainingMaterialRequestModel } from "@/lib/models/training-material";
import { dateFormat } from "@/lib/util/dayjs_format";
import { getCategoryDisplayString } from "@/lib/utils";
import dayjs from "dayjs";

interface BasicInformationProps {
    selectedRequest: TrainingMaterialRequestModel;
    categoryName: (catId: string) => string;
    lengthName: (lenId: string) => string;
    complexityName: (comId: string) => string;
}

export default function BasicInformation({
    selectedRequest,
    categoryName,
    lengthName,
    complexityName,
}: BasicInformationProps) {
    const { hrSettings } = useFirestore();
    return (
        <div className="space-y-6">
            <h3 className="text-lg font-semibold">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <Label className="font-semibold">Training Material Name</Label>
                    <p className="text-sm text-muted-foreground">{selectedRequest.name}</p>
                </div>
                <div>
                    <Label className="font-semibold">Timestamp</Label>
                    <p className="text-sm text-muted-foreground">{selectedRequest.timestamp}</p>
                </div>
                <div>
                    <Label className="font-semibold">Category</Label>
                    <div className="flex flex-wrap gap-2 mt-1">
                        <Badge variant="secondary">
                            {getCategoryDisplayString(
                                selectedRequest.category,
                                hrSettings.tmCategories,
                            )}
                        </Badge>
                    </div>
                </div>
                <div>
                    <Label className="font-semibold">Medium</Label>
                    <p className="text-sm text-muted-foreground">{selectedRequest.medium}</p>
                </div>
                <div>
                    <Label className="font-semibold">URL</Label>
                    <p className="text-sm text-muted-foreground break-all">{selectedRequest.url}</p>
                </div>
                <div>
                    <Label className="font-semibold">External Link</Label>
                    <p className="text-sm text-muted-foreground">
                        {selectedRequest.isExternalLink ? "Yes" : "No"}
                    </p>
                </div>
                <div>
                    <Label className="font-semibold">Length/Duration</Label>
                    <p className="text-sm text-muted-foreground">
                        {lengthName(selectedRequest.length)}
                    </p>
                </div>
                <div>
                    <Label className="font-semibold">Complexity</Label>
                    <p className="text-sm text-muted-foreground">
                        {complexityName(selectedRequest.complexity)}
                    </p>
                </div>
                <div>
                    <Label className="font-semibold">Training Cost</Label>
                    <p className="text-sm text-muted-foreground">{selectedRequest.trainingCost}</p>
                </div>
                <div>
                    <Label className="font-semibold">Training Outcome</Label>
                    {selectedRequest.trainingOutcome &&
                    selectedRequest.trainingOutcome.length > 0 ? (
                            <div className="flex flex-wrap gap-2 mt-1">
                                {selectedRequest.trainingOutcome.map((outcome, index) => (
                                    <Badge key={index} variant="secondary">
                                        {outcome}
                                    </Badge>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground">-</p>
                        )}
                </div>
                {selectedRequest.trainingJustification && (
                    <div className="md:col-span-2">
                        <Label className="font-semibold">Training Justification</Label>
                        <p className="text-sm text-muted-foreground">
                            {selectedRequest.trainingJustification}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
