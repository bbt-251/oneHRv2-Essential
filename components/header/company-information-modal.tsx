"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CompanyObjectives from "@/components/hr-manager/performance-management/blocks/company-objectives/company-objectives";
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
                <Tabs defaultValue="basic-info" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="basic-info">Basic Info</TabsTrigger>
                        <TabsTrigger value="objectives">Company Objectives</TabsTrigger>
                    </TabsList>
                    <TabsContent value="basic-info" className="mt-4">
                        <BasicInfo hideEditButton hideSaveButton disableInputs />
                    </TabsContent>
                    <TabsContent value="objectives" className="mt-4">
                        <CompanyObjectives hideAddButton />
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}
