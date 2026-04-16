import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { useFirestore } from "@/context/firestore-context";
import { TrainingPathModel } from "@/lib/models/training-path";
import { getCategoryDisplayString } from "@/lib/utils";

interface PathBasicInformationProps {
    selectedPath: TrainingPathModel;
}

export default function PathBasicInformation({ selectedPath }: PathBasicInformationProps) {
    const { hrSettings } = useFirestore();
    const categories = hrSettings.tmCategories;
    return (
        <div className="space-y-6">
            <h3 className="text-lg font-semibold">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <Label className="font-semibold">Name</Label>
                    <p className="text-sm text-muted-foreground">{selectedPath.name}</p>
                </div>
                <div>
                    <Label className="font-semibold">Category</Label>
                    <div className="flex flex-wrap gap-2 mt-1">
                        <Badge variant="secondary">
                            {getCategoryDisplayString(
                                selectedPath.category,
                                hrSettings.tmCategories,
                            )}
                        </Badge>
                    </div>
                </div>
                <div>
                    <Label className="font-semibold">Audience Target</Label>
                    <div className="flex flex-wrap gap-2 mt-1">
                        {selectedPath.audienceTarget.map((target, index) => (
                            <Badge key={index} variant="outline">
                                {target}
                            </Badge>
                        ))}
                    </div>
                </div>
                <div className="md:col-span-2">
                    <Label className="font-semibold">Description</Label>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {selectedPath.description}
                    </p>
                </div>
            </div>
        </div>
    );
}
