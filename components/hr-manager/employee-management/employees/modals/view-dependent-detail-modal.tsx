"use client";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { DependentModel } from "@/lib/models/dependent";
import { Users } from "lucide-react";

interface ViewDependentDetailModalProps {
    dependent: DependentModel | null;
    isOpen: boolean;
    onClose: () => void;
    onEdit: () => void;
    onDelete: () => void;
}

export function ViewDependentDetailModal({
    dependent,
    isOpen,
    onClose,
    onEdit,
    onDelete,
}: ViewDependentDetailModalProps) {
    if (!dependent) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Users className="w-5 h-5" />
                        Dependent Detail
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <h3 className="text-sm font-medium text-gray-500 uppercase">Name</h3>
                            <p className="mt-1 text-sm">
                                {dependent.firstName}{" "}
                                {dependent.middleName ? dependent.middleName + " " : ""}{" "}
                                {dependent.lastName}
                            </p>
                        </div>

                        <div>
                            <h3 className="text-sm font-medium text-gray-500 uppercase">
                                Dependent ID
                            </h3>
                            <p className="mt-1 text-sm">{dependent.dependentID}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <h3 className="text-sm font-medium text-gray-500 uppercase">
                                Date of Birth
                            </h3>
                            <p className="mt-1 text-sm">{dependent.dateOfBirth}</p>
                        </div>

                        <div>
                            <h3 className="text-sm font-medium text-gray-500 uppercase">Gender</h3>
                            <p className="mt-1 text-sm">{dependent.gender}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <h3 className="text-sm font-medium text-gray-500 uppercase">
                                Phone Number
                            </h3>
                            <p className="mt-1 text-sm">{dependent.phoneNumber}</p>
                        </div>

                        <div>
                            <h3 className="text-sm font-medium text-gray-500 uppercase">
                                Relationship
                            </h3>
                            <p className="mt-1 text-sm">
                                <Badge
                                    className={
                                        dependent.relationship === "Spouse"
                                            ? "bg-pink-100 text-pink-800"
                                            : "bg-blue-100 text-blue-800"
                                    }
                                >
                                    {dependent.relationship}
                                </Badge>
                            </p>
                        </div>
                    </div>
                </div>

                <DialogFooter className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={onClose}>
                        Close
                    </Button>
                    <Button type="button" variant="outline" onClick={onEdit}>
                        Edit
                    </Button>
                    <Button type="button" variant="destructive" onClick={onDelete}>
                        Delete
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
