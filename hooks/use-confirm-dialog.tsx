"use client";

import { useState } from "react";
import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function useConfirm() {
    const [isOpen, setIsOpen] = useState<boolean>(false);
    const [callback, setCallback] = useState<(() => Promise<void> | void) | null>(null);
    const [message, setMessage] = useState<string>("Are you sure?");
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const confirm = (
        message: string,
        onConfirm: () => Promise<void> | void,
        showLoading?: boolean,
    ) => {
        setMessage(message);
        setCallback(() => onConfirm);
        setIsOpen(true);
        setIsLoading(!!showLoading && false); // reset before opening
    };

    const ConfirmDialog = (
        <div>
            <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
                <AlertDialogContent style={{ zIndex: 10000 }}>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirmation</AlertDialogTitle>
                        <AlertDialogDescription>{message}</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
                        <Button
                            className="bg-amber-600 hover:bg-amber-700 text-white"
                            disabled={isLoading}
                            onClick={async () => {
                                if (callback) {
                                    setIsLoading(true);
                                    try {
                                        await callback();
                                    } finally {
                                        setIsLoading(false);
                                        // explicitly close only when you want
                                        setIsOpen(false);
                                    }
                                }
                            }}
                        >
                            {isLoading ? (
                                <span className="flex items-center gap-2">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Loading...
                                </span>
                            ) : (
                                "Yes"
                            )}
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );

    return { confirm, ConfirmDialog };
}
