"use client";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

interface Props {
    open: boolean;
    setOpen: (open: boolean) => void;
    url: string;
    title?: string;
}

export function FilePreviewDialog({ open, setOpen, url, title }: Props) {
    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="max-w-7xl overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-3xl font-bold text-center">
                        {title ?? "Preview"}
                    </DialogTitle>
                    <DialogDescription className="text-center text-base">-</DialogDescription>
                </DialogHeader>
                <div className="flex justify-center">
                    <div className="relative w-full max-w-7xl aspect-video bg-transparent rounded-lg overflow-scroll">
                        <iframe
                            src={url}
                            className="absolute top-0 left-0 w-full h-full"
                            allowFullScreen
                        />
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
