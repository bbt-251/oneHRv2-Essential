"use client";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

import { useTheme } from "@/components/theme-provider";
import { StrategicObjectiveModel } from "@/lib/backend/firebase/hrSettingsService";

interface StrategicObjectiveModalProps {
    showObjectiveModal: boolean;
    setShowObjectiveModal: (show: boolean) => void;
    editingObjective: StrategicObjectiveModel | null;
    objectiveForm: Omit<StrategicObjectiveModel, "id" | "status">;
    setObjectiveForm: (
        form: React.SetStateAction<Omit<StrategicObjectiveModel, "id" | "status">>,
    ) => void;
    handleSaveObjective: () => void;
}

function StrategicObjectiveModal({
    showObjectiveModal,
    setShowObjectiveModal,
    editingObjective,
    objectiveForm,
    setObjectiveForm,
    handleSaveObjective,
}: StrategicObjectiveModalProps) {
    const { theme } = useTheme();
    return (
        <Dialog open={showObjectiveModal} onOpenChange={setShowObjectiveModal}>
            <DialogContent className={`max-w-2xl ${theme === "dark" ? "bg-black" : "bg-white"}`}>
                <DialogHeader>
                    <DialogTitle>
                        {editingObjective
                            ? "Edit Strategic Objective"
                            : "Create Strategic Objective"}
                    </DialogTitle>
                    <DialogDescription>
                        Define a strategic objective that aligns with company goals
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <div>
                        <Label htmlFor="title">Title *</Label>
                        <Input
                            id="title"
                            value={objectiveForm.title}
                            onChange={e =>
                                setObjectiveForm(prev => ({ ...prev, title: e.target.value }))
                            }
                            placeholder="Enter objective title"
                        />
                    </div>

                    <div>
                        <Label htmlFor="description">Description *</Label>
                        <Textarea
                            id="description"
                            value={objectiveForm.description}
                            onChange={e =>
                                setObjectiveForm(prev => ({ ...prev, description: e.target.value }))
                            }
                            placeholder="Describe the strategic objective"
                            rows={3}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="perspective">Perspective</Label>
                            <Select
                                value={objectiveForm.perspective}
                                onValueChange={(value: any) =>
                                    setObjectiveForm(prev => ({ ...prev, perspective: value }))
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Financial">Financial</SelectItem>
                                    <SelectItem value="Customer">Customer</SelectItem>
                                    <SelectItem value="Internal">Internal Process</SelectItem>
                                    <SelectItem value="Learning">Learning & Growth</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label htmlFor="weight">Weight (%)</Label>
                            <Input
                                id="weight"
                                type="number"
                                min="0"
                                max="100"
                                value={objectiveForm.weight}
                                onChange={e =>
                                    setObjectiveForm(prev => ({
                                        ...prev,
                                        weight: Number.parseInt(e.target.value) || 0,
                                    }))
                                }
                            />
                        </div>
                    </div>

                    <div>
                        <Label htmlFor="owner">Owner</Label>
                        <Input
                            id="owner"
                            value={objectiveForm.owner}
                            onChange={e =>
                                setObjectiveForm(prev => ({ ...prev, owner: e.target.value }))
                            }
                            placeholder="Objective owner"
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => setShowObjectiveModal(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleSaveObjective}>
                        {editingObjective ? "Update" : "Create"} Objective
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default StrategicObjectiveModal;
