"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { DependentModel, DependentRelationship } from "@/lib/models/dependent";
import { format } from "date-fns";
import { updateDependent } from "@/lib/backend/api/employee-management/dependent-service";
import { EMPLOYEE_MANAGEMENT_LOG_MESSAGES } from "@/lib/log-descriptions/employee-management";
import { useAuth } from "@/context/authContext";
import { formatDate } from "@/lib/util/dayjs_format";
import { CalendarIcon } from "lucide-react";
import { useFirestore } from "@/context/firestore-context";

interface EditDependentModalProps {
    dependent: DependentModel | null;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function EditDependentModal({
    dependent,
    isOpen,
    onClose,
    onSuccess,
}: EditDependentModalProps) {
    const { userData } = useAuth();
    const { activeEmployees } = useFirestore();
    const [formData, setFormData] = useState({
        firstName: "",
        middleName: "",
        lastName: "",
        dateOfBirth: null as Date | null,
        phoneNumber: "",
        gender: "Male" as "Male" | "Female",
        relationship: DependentRelationship.SPOUSE,
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Load dependent data when modal opens
    useEffect(() => {
        if (dependent) {
            // Parse "MMMM dd, yyyy" format to Date object
            const dateParts = dependent.dateOfBirth.split(" ");
            if (dateParts.length === 3) {
                const month = dateParts[0];
                const day = dateParts[1].replace(",", "");
                const year = dateParts[2];

                const dateObj = new Date(`${month} ${day}, ${year}`);
                setFormData({
                    firstName: dependent.firstName,
                    middleName: dependent.middleName || "",
                    lastName: dependent.lastName,
                    dateOfBirth: dateObj,
                    phoneNumber: dependent.phoneNumber,
                    gender: dependent.gender,
                    relationship: dependent.relationship as DependentRelationship,
                });
            } else {
                setFormData({
                    firstName: dependent.firstName,
                    middleName: dependent.middleName || "",
                    lastName: dependent.lastName,
                    dateOfBirth: null,
                    phoneNumber: dependent.phoneNumber,
                    gender: dependent.gender,
                    relationship: dependent.relationship as DependentRelationship,
                });
            }
        }
    }, [dependent, isOpen]);

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.firstName.trim()) {
            newErrors.firstName = "First name is required";
        }

        if (!formData.lastName.trim()) {
            newErrors.lastName = "Last name is required";
        }

        if (!formData.dateOfBirth) {
            newErrors.dateOfBirth = "Date of birth is required";
        } else {
            const birthDate = new Date(formData.dateOfBirth);
            const today = new Date();
            if (birthDate > today) {
                newErrors.dateOfBirth = "Date of birth cannot be in the future";
            }
        }

        if (!formData.phoneNumber.trim()) {
            newErrors.phoneNumber = "Phone number is required";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm() || !dependent) {
            return;
        }

        setIsSubmitting(true);

        try {
            // Format date as "MMMM DD, YYYY"
            const formattedDate = formData.dateOfBirth ? formatDate(formData.dateOfBirth) : "";

            const updatedDependent: DependentModel = {
                ...dependent,
                firstName: formData.firstName.trim(),
                middleName: formData.middleName.trim() || null,
                lastName: formData.lastName.trim(),
                gender: formData.gender,
                dateOfBirth: formattedDate,
                phoneNumber: formData.phoneNumber.trim(),
                relationship: formData.relationship,
            };

            const dependentName = `${formData.firstName} ${formData.lastName}`;
            const employee = activeEmployees.find(e => e.uid === dependent.relatedTo);
            const employeeName = employee
                ? `${employee.firstName} ${employee.surname}`
                : "Unknown Employee";
            await updateDependent(
                updatedDependent,
                userData?.uid ?? "",
                EMPLOYEE_MANAGEMENT_LOG_MESSAGES.DEPENDENT_UPDATED(
                    dependentName,
                    formData.relationship,
                    employeeName,
                ),
            );

            onSuccess();
        } catch (error) {
            console.error("Error updating dependent:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!dependent) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Edit Dependent</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="firstName">First Name *</Label>
                            <Input
                                id="firstName"
                                value={formData.firstName}
                                onChange={e =>
                                    setFormData({ ...formData, firstName: e.target.value })
                                }
                                className={errors.firstName ? "border-destructive" : ""}
                                required
                            />
                            {errors.firstName && (
                                <p className="text-sm text-destructive mt-1">{errors.firstName}</p>
                            )}
                        </div>

                        <div>
                            <Label htmlFor="lastName">Last Name *</Label>
                            <Input
                                id="lastName"
                                value={formData.lastName}
                                onChange={e =>
                                    setFormData({ ...formData, lastName: e.target.value })
                                }
                                className={errors.lastName ? "border-destructive" : ""}
                                required
                            />
                            {errors.lastName && (
                                <p className="text-sm text-destructive mt-1">{errors.lastName}</p>
                            )}
                        </div>
                    </div>

                    <div>
                        <Label htmlFor="middleName">Middle Name</Label>
                        <Input
                            id="middleName"
                            value={formData.middleName}
                            onChange={e => setFormData({ ...formData, middleName: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant={"outline"}
                                        className={`w-full justify-start text-left font-normal ${errors.dateOfBirth ? "border-destructive" : ""}`}
                                    >
                                        {formData.dateOfBirth ? (
                                            format(formData.dateOfBirth, "PPP")
                                        ) : (
                                            <span>Pick a date</span>
                                        )}
                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <Calendar
                                        mode="single"
                                        selected={formData.dateOfBirth || undefined}
                                        onSelect={date =>
                                            setFormData({ ...formData, dateOfBirth: date || null })
                                        }
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                            {errors.dateOfBirth && (
                                <p className="text-sm text-destructive mt-1">
                                    {errors.dateOfBirth}
                                </p>
                            )}
                        </div>

                        <div>
                            <Label htmlFor="phoneNumber">Phone Number *</Label>
                            <Input
                                id="phoneNumber"
                                value={formData.phoneNumber}
                                onChange={e =>
                                    setFormData({ ...formData, phoneNumber: e.target.value })
                                }
                                className={errors.phoneNumber ? "border-destructive" : ""}
                                required
                            />
                            {errors.phoneNumber && (
                                <p className="text-sm text-destructive mt-1">
                                    {errors.phoneNumber}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="gender">Gender *</Label>
                            <Select
                                value={formData.gender}
                                onValueChange={(value: "Male" | "Female") =>
                                    setFormData({ ...formData, gender: value })
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Male">Male</SelectItem>
                                    <SelectItem value="Female">Female</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label htmlFor="relationship">Relationship *</Label>
                            <Select
                                value={formData.relationship}
                                onValueChange={(value: DependentRelationship) =>
                                    setFormData({ ...formData, relationship: value })
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value={DependentRelationship.SPOUSE}>
                                        Spouse
                                    </SelectItem>
                                    <SelectItem value={DependentRelationship.CHILD}>
                                        Child
                                    </SelectItem>
                                    <SelectItem value={DependentRelationship.PARENT}>
                                        Parent
                                    </SelectItem>
                                    <SelectItem value={DependentRelationship.SIBLING}>
                                        Sibling
                                    </SelectItem>
                                    <SelectItem value={DependentRelationship.OTHER}>
                                        Other
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <DialogFooter className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? "Updating..." : "Update Dependent"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
