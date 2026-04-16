"use client";
import React from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import { Plus, Edit, Trash2, FileText } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { StrategicObjectiveModel } from "@/lib/backend/firebase/hrSettingsService";
import DeleteConfirm from "@/components/hr-manager/core-settings/blocks/delete-confirm";
interface ObjectivesTapProps {
    strategicObjectives: StrategicObjectiveModel[];
    handleAddObjective: () => void;
    handleEditObjective: (objective: StrategicObjectiveModel) => void;
    handleDeleteObjective: (id: string) => void;
    hideAddButton?: boolean;
    hideActions?: boolean;
}

export const ObjectivesTap = ({
    strategicObjectives,
    handleAddObjective,
    handleEditObjective,
    handleDeleteObjective,
    hideAddButton = false,
    hideActions = false,
}: ObjectivesTapProps) => {
    const { theme } = useTheme();
    return (
        <>
            <div className="flex items-center justify-between">
                <div>
                    <h2
                        className={`text-2xl font-semibold ${theme === "dark" ? "text-white" : "text-[#3f3d56]"}`}
                    >
                        Strategic Objectives
                    </h2>
                    <p className={`mt-1 ${theme === "dark" ? "text-white" : "text-[#3f3d56]"}`}>
                        Company-wide strategic goals that drive organizational success
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {!hideAddButton && (
                        <Button
                            variant="outline"
                            onClick={handleAddObjective}
                            className={`hover:opacity-80 bg-transparent ${theme === "dark" ? "text-white" : "text-[#3f3d56]"} ${theme === "dark" ? "border-white" : "border-[#3f3d56]"}`}
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Objective
                        </Button>
                    )}
                </div>
            </div>

            {strategicObjectives.length > 0 ? (
                <div className="grid gap-6">
                    {strategicObjectives.map(objective => (
                        <Card
                            key={objective.id}
                            className={`shadow-md hover:shadow-lg transition-all duration-200 ${theme === "dark" ? "bg-black/20 border-gray-800/20" : "bg-white border-gray-200"}`}
                        >
                            <CardHeader className="pb-4">
                                <div className="flex items-start justify-between">
                                    <div className="space-y-2">
                                        <CardTitle
                                            className={`text-xl ${theme === "dark" ? "text-white" : "text-[#3f3d56]"}`}
                                        >
                                            {objective.title}
                                        </CardTitle>
                                        <CardDescription
                                            className={`text-base leading-relaxed ${theme === "dark" ? "text-white" : "text-[#3f3d56]"}`}
                                        >
                                            {objective.description}
                                        </CardDescription>
                                    </div>
                                    {!hideActions && (
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleEditObjective(objective)}
                                                className={`hover:bg-black/5 ${theme === "dark" ? "text-white" : "text-[#3f3d56]"}`}
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <DeleteConfirm
                                                onConfirm={() =>
                                                    handleDeleteObjective(objective.id)
                                                }
                                                itemName={`Objective (${objective.title})`}
                                                description="This will delete the strategic objective. Any department KPIs linked to this objective will be automatically updated to remove the reference."
                                                warningText="Note: Linked KPIs will be cleaned up automatically."
                                            />
                                        </div>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <Badge
                                            variant="outline"
                                            style={{
                                                borderColor: "#3f3d56",
                                                color: "#ffe6a7",
                                                backgroundColor: "#3f3d56",
                                            }}
                                        >
                                            {objective.perspective}
                                        </Badge>
                                        <Badge
                                            variant="secondary"
                                            style={{
                                                backgroundColor: "#3f3d56",
                                                color: "#ffe6a7",
                                                border: "1px solid #3f3d56",
                                            }}
                                        >
                                            {objective.weight}% Weight
                                        </Badge>
                                        <Badge
                                            variant={
                                                objective.status === "Active"
                                                    ? "default"
                                                    : "secondary"
                                            }
                                            style={
                                                objective.status === "Active"
                                                    ? {
                                                        backgroundColor: "#22c55e",
                                                        color: "white",
                                                        borderColor: "#16a34a",
                                                    }
                                                    : {
                                                        backgroundColor: "rgba(63, 61, 86, 0.1)",
                                                        color: "#3f3d56",
                                                    }
                                            }
                                        >
                                            {objective.status}
                                        </Badge>
                                    </div>
                                    <div
                                        className={`text-sm ${theme === "dark" ? "text-white" : "text-[#3f3d56]"}`}
                                    >
                                        Owner:{" "}
                                        <span
                                            className={`font-medium ${theme === "dark" ? "text-white" : "text-[#3f3d56]"}`}
                                        >
                                            {objective.owner}
                                        </span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <Card
                    className={`border-dashed ${theme === "dark" ? "bg-black/20 border-gray-700" : "bg-gray-50"}`}
                >
                    <CardContent className="p-8 text-center">
                        <div className="flex justify-center mb-4">
                            <FileText
                                className={`h-12 w-12 ${theme === "dark" ? "text-gray-500" : "text-gray-400"}`}
                            />
                        </div>
                        <h3
                            className={`text-lg font-semibold ${theme === "dark" ? "text-white" : "text-[#3f3d56]"}`}
                        >
                            No Objectives Found
                        </h3>
                        <p
                            className={`mt-1 text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}
                        >
                            There are no strategic objectives for the selected cycle.
                        </p>
                        {!hideAddButton && (
                            <Button
                                variant="outline"
                                onClick={handleAddObjective}
                                className={`mt-4 hover:opacity-80 bg-transparent ${theme === "dark" ? "text-white" : "text-[#3f3d56]"} ${theme === "dark" ? "border-white" : "border-[#3f3d56]"}`}
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Add the First Objective
                            </Button>
                        )}
                    </CardContent>
                </Card>
            )}
        </>
    );
};
