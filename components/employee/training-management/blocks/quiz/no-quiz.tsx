import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { TrainingMaterialModel } from "@/lib/models/training-material";
import { ArrowLeft, FileQuestion, Info } from "lucide-react";

export default function NoQuiz({
    material,
    onBack,
}: {
    material: TrainingMaterialModel;
    onBack: () => void;
}) {
    return (
        <div className="space-y-6 p-6 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4 pb-4 border-b border-brand-200 dark:border-brand-800">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={onBack}
                    className="flex items-center gap-2"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Training
                </Button>
                <div>
                    <h1 className="text-2xl font-bold text-brand-800 dark:text-white">
                        Knowledge Check Quiz
                    </h1>
                    <p className="text-brand-600 dark:text-brand-300">
                        {material.name || "Untitled Material"}
                    </p>
                </div>
            </div>

            {/* No Quiz Card */}
            <Card className="border-brand-200 dark:border-brand-800 max-w-2xl mx-auto">
                <CardHeader className="text-center">
                    <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FileQuestion className="h-8 w-8 text-red-600" />
                    </div>
                    <CardTitle className="text-xl text-brand-800 dark:text-white">
                        No Quiz Available
                    </CardTitle>
                </CardHeader>

                <CardContent className="space-y-6">
                    <div className="bg-brand-50 dark:bg-brand-900 rounded-lg p-4 space-y-3 text-center">
                        <Info className="h-5 w-5 text-brand-600 mx-auto mb-2" />
                        <p className="text-brand-600 dark:text-brand-300">
                            This training does not include a quiz at the moment.
                        </p>
                        <p className="text-sm text-brand-500 dark:text-brand-400">
                            You can review the training material or check back later if a quiz gets
                            added.
                        </p>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <Button
                            onClick={onBack}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            Back to Training
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
