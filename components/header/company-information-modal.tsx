"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BasicInfo } from "@/components/hr-manager/core-settings/company-setup/basic-info/basic-info";

interface CompanyInformationModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function CompanyInformationModal({ isOpen, onClose }: CompanyInformationModalProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Company Information</DialogTitle>
                </DialogHeader>
                <div className="mt-4">
                    <BasicInfo hideEditButton hideSaveButton disableInputs />
                </div>
            </DialogContent>
        </Dialog>
    );
}
