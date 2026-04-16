"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface DetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    icon: React.ReactNode;
    items: string[];
}

export function DetailsModal({ isOpen, onClose, title, icon, items }: DetailsModalProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md z-[100]">
                <DialogHeader>
                    <DialogTitle className="text-xl font-semibold flex items-center gap-2">
                        {icon}
                        {title}
                    </DialogTitle>
                </DialogHeader>
                <div className="mt-4">
                    {items.length > 0 ? (
                        <ul className="space-y-2">
                            {items.map((item, index) => (
                                <li key={index} className="p-3 rounded-lg border">
                                    <span className="text-sm">{item}</span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-sm italic">No items available</p>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
