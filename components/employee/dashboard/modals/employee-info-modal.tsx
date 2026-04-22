"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/context/authContext";

interface EmployeeInfoModalProps {
    isOpen: boolean;
    onClose: () => void;
}

function InfoRow({ label, value }: { label: string; value?: string | number | null }) {
    return (
        <div className="grid grid-cols-1 gap-1 rounded-lg border p-3 md:grid-cols-2">
            <span className="text-sm font-medium text-muted-foreground">{label}</span>
            <span className="text-sm">{value || "Not provided"}</span>
        </div>
    );
}

export function EmployeeInfoModal({ isOpen, onClose }: EmployeeInfoModalProps) {
    const { userData } = useAuth();

    if (!userData) return null;

    return (
        <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
            <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-3xl">
                <DialogHeader>
                    <DialogTitle>My Information</DialogTitle>
                </DialogHeader>

                <Tabs defaultValue="personal" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="personal">Personal</TabsTrigger>
                        <TabsTrigger value="contract">Contract</TabsTrigger>
                        <TabsTrigger value="emergency">Emergency</TabsTrigger>
                    </TabsList>

                    <TabsContent value="personal" className="space-y-3">
                        <InfoRow label="First Name" value={userData.firstName} />
                        <InfoRow label="Middle Name" value={userData.middleName} />
                        <InfoRow label="Surname" value={userData.surname} />
                        <InfoRow label="Employee ID" value={userData.employeeID} />
                        <InfoRow label="Birth Date" value={userData.birthDate} />
                        <InfoRow label="Birth Place" value={userData.birthPlace} />
                        <InfoRow label="Gender" value={userData.gender} />
                        <InfoRow label="Marital Status" value={userData.maritalStatus} />
                        <InfoRow label="Personal Phone" value={userData.personalPhoneNumber} />
                        <InfoRow label="Personal Email" value={userData.personalEmail} />
                        <InfoRow label="Company Email" value={userData.companyEmail} />
                        <InfoRow label="Department" value={userData.department} />
                        <InfoRow label="Section" value={userData.section} />
                        <InfoRow label="Position" value={userData.employmentPosition} />
                        <InfoRow label="Working Location" value={userData.workingLocation} />
                        <InfoRow label="Shift Type" value={userData.shiftType} />
                    </TabsContent>

                    <TabsContent value="contract" className="space-y-3">
                        <InfoRow label="Contract Type" value={userData.contractType} />
                        <InfoRow label="Contract Status" value={userData.contractStatus} />
                        <InfoRow
                            label="Contract Start Date"
                            value={userData.contractStartingDate}
                        />
                        <InfoRow
                            label="Contract Termination Date"
                            value={userData.contractTerminationDate}
                        />
                        <InfoRow label="Hire Date" value={userData.hireDate} />
                        <InfoRow
                            label="Probation Period End Date"
                            value={userData.probationPeriodEndDate}
                        />
                        <InfoRow label="Salary" value={userData.salary} />
                        <InfoRow label="Currency" value={userData.currency} />
                        <InfoRow label="Eligible Leave Days" value={userData.eligibleLeaveDays} />
                        <InfoRow label="Tax" value={userData.associatedTax} />
                        <InfoRow label="Grade Level" value={userData.gradeLevel} />
                        <InfoRow label="Step" value={userData.step} />
                        <InfoRow label="Roles" value={userData.role?.join(", ")} />
                    </TabsContent>

                    <TabsContent value="emergency" className="space-y-3">
                        <InfoRow
                            label="Emergency Contact Name"
                            value={userData.emergencyContactName}
                        />
                        <InfoRow
                            label="Relationship to Employee"
                            value={userData.relationshipToEmployee}
                        />
                        <InfoRow label="Phone Number 1" value={userData.phoneNumber1} />
                        <InfoRow label="Phone Number 2" value={userData.phoneNumber2} />
                        <InfoRow label="Email Address 1" value={userData.emailAddress1} />
                        <InfoRow label="Email Address 2" value={userData.emailAddress2} />
                        <InfoRow label="Physical Address 1" value={userData.physicalAddress1} />
                        <InfoRow label="Physical Address 2" value={userData.physicalAddress2} />
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}
