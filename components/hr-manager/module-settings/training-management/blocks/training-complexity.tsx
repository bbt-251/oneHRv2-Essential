import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useFirestore } from "@/context/firestore-context";
import { useToast } from "@/context/toastContext";
import { useConfirm } from "@/hooks/use-confirm-dialog";
import { hrSettingsService } from "@/lib/backend/firebase/hrSettingsService";
import { TMComplexityModel } from "@/lib/models/hr-settings";
import { getTimestamp } from "@/lib/util/dayjs_format";
import { TRAINING_MANAGEMENT_LOG_MESSAGES } from "@/lib/log-descriptions/training-management";
import { useAuth } from "@/context/authContext";
import { Edit, Loader2, Plus, Target, Trash2 } from "lucide-react";
import { useState } from "react";

export const TrainingComplexity = () => {
    const { hrSettings } = useFirestore();
    const complexities = hrSettings.tmComplexity;
    const { showToast } = useToast();
    const { confirm, ConfirmDialog } = useConfirm();
    const { userData } = useAuth();
    const [isAddEditLoading, setIsAddEditLoading] = useState(false);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingComplexity, setEditingComplexity] = useState<TMComplexityModel | null>(null);
    const [formData, setFormData] = useState<Partial<TMComplexityModel>>({
        name: "",
        active: "Yes",
    });

    const handleAdd = () => {
        setEditingComplexity(null);
        setFormData({ name: "", active: "Yes" });
        setIsModalOpen(true);
    };

    const handleEdit = (complexity: TMComplexityModel) => {
        setEditingComplexity(complexity);
        setFormData(complexity);
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        // required fields
        if (!formData.name?.trim()) {
            showToast("Name is required", "Error", "error");
            return;
        }

        setIsAddEditLoading(true);
        const newCategory: Omit<TMComplexityModel, "id"> = {
            timestamp: getTimestamp(),
            name: formData.name || "",
            active: formData.active || "Yes",
        };

        if (editingComplexity) {
            const { id, ...data } = formData;
            const res = await hrSettingsService.update(
                "tmComplexity",
                editingComplexity.id,
                data,
                userData?.uid,
                TRAINING_MANAGEMENT_LOG_MESSAGES.TRAINING_COMPLEXITY_UPDATED({
                    id: editingComplexity.id,
                    name: formData.name,
                    active: formData.active === "Yes",
                }),
            );
            if (res) {
                showToast("Complexity updated successfully", "Success", "success");
                setIsModalOpen(false);
                setFormData({ name: "", active: "Yes" });
            } else {
                showToast("Error updating complexity", "Error", "error");
            }
        } else {
            const res = await hrSettingsService.create(
                "tmComplexity",
                newCategory,
                userData?.uid,
                TRAINING_MANAGEMENT_LOG_MESSAGES.TRAINING_COMPLEXITY_CREATED({
                    name: newCategory.name,
                    active: newCategory.active === "Yes",
                }),
            );
            if (res) {
                showToast("Complexity created successfully", "Success", "success");
                setIsModalOpen(false);
                setFormData({ name: "", active: "Yes" });
            } else {
                showToast("Error creating complexity", "Error", "error");
            }
        }
        setIsAddEditLoading(false);
    };

    const handleDelete = (id: string) => {
        confirm("Are you sure ?", async () => {
            const res = await hrSettingsService.remove(
                "tmComplexity",
                id,
                userData?.uid,
                TRAINING_MANAGEMENT_LOG_MESSAGES.TRAINING_COMPLEXITY_DELETED(id),
            );
            if (res) {
                showToast("Complexity deleted successfully", "Success", "success");
            } else {
                showToast("Error deleting complexity", "Error", "error");
            }
        });
    };

    return (
        <Card className="dark:bg-black">
            <CardHeader className="flex flex-row items-center justify-between dark:bg-black">
                <div className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-amber-600" />
                    <CardTitle className="dark:text-white">Training Complexities</CardTitle>
                </div>
                <Button onClick={handleAdd} className="bg-amber-600 hover:bg-amber-700 text-white">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Complexity
                </Button>
            </CardHeader>
            <CardContent className="dark:bg-black">
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="border-b border-gray-200 dark:border-gray-700">
                                <th className="text-left p-3 font-medium text-gray-700 dark:text-gray-300">
                                    Name
                                </th>
                                <th className="text-left p-3 font-medium text-gray-700 dark:text-gray-300">
                                    Created Date
                                </th>
                                <th className="text-left p-3 font-medium text-gray-700 dark:text-gray-300">
                                    Status
                                </th>
                                <th className="text-left p-3 font-medium text-gray-700 dark:text-gray-300">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {complexities.map(complexity => (
                                <tr
                                    key={complexity.id}
                                    className="border-b border-gray-100 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
                                >
                                    <td className="p-3 dark:text-white">{complexity.name}</td>
                                    <td className="p-3 text-gray-600 dark:text-gray-400">
                                        {complexity.timestamp}
                                    </td>
                                    <td className="p-3">
                                        <Badge
                                            variant={
                                                complexity.active === "Yes"
                                                    ? "default"
                                                    : "secondary"
                                            }
                                        >
                                            {complexity.active}
                                        </Badge>
                                    </td>
                                    <td className="p-3">
                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleEdit(complexity)}
                                                className="border-amber-600 text-amber-600 hover:bg-amber-50 dark:hover:bg-gray-800"
                                            >
                                                <Edit className="h-3 w-3" />
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleDelete(complexity.id!)}
                                                className="border-red-600 text-red-600 hover:bg-red-50 dark:hover:bg-gray-800"
                                            >
                                                <Trash2 className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                    <DialogContent className="dark:bg-black">
                        <DialogHeader>
                            <DialogTitle className="dark:text-white">
                                {editingComplexity
                                    ? "Edit Training Complexity"
                                    : "Add Training Complexity"}
                            </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="name" className="dark:text-gray-300">
                                    Complexity Name
                                </Label>
                                <Input
                                    id="name"
                                    value={formData.name || ""}
                                    onChange={e =>
                                        setFormData(prev => ({
                                            ...prev,
                                            name: e.target.value,
                                        }))
                                    }
                                    placeholder="Enter complexity level (e.g., Beginner, Intermediate, Advanced)"
                                    className="dark:bg-gray-900 dark:text-white"
                                />
                            </div>
                            <div>
                                <Label htmlFor="active" className="dark:text-gray-300">
                                    Status
                                </Label>
                                <Select
                                    value={formData.active || "Yes"}
                                    onValueChange={value =>
                                        setFormData(prev => ({
                                            ...prev,
                                            active: value as "Yes" | "No",
                                        }))
                                    }
                                >
                                    <SelectTrigger className="dark:bg-gray-900 dark:text-white">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="dark:bg-black dark:text-white">
                                        <SelectItem value="Yes">Active</SelectItem>
                                        <SelectItem value="No">Inactive</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex justify-end gap-2">
                                <Button
                                    variant="outline"
                                    onClick={() => setIsModalOpen(false)}
                                    className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleSave}
                                    className="bg-amber-600 hover:bg-amber-700 text-white"
                                >
                                    {isAddEditLoading ? (
                                        <div className="flex items-center justify-center gap-2">
                                            <Loader2 className="animate-spin h-4 w-4" />
                                            {editingComplexity ? "Updating..." : "Adding..."}
                                        </div>
                                    ) : (
                                        `${editingComplexity ? "Update" : "Add"}`
                                    )}
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </CardContent>
            {ConfirmDialog}
        </Card>
    );
};
