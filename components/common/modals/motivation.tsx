import React, { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react"; // Import a loading icon

interface MotivationModalProps {
    open: boolean;
    setOpen: (open: boolean) => void;
    onAccept: (motivation: string) => void;
    btnText: string;
    loading: boolean; // Add loading prop
}

export default function MotivationModal({
    open,
    setOpen,
    onAccept,
    btnText,
    loading, // Destructure loading prop
}: MotivationModalProps) {
    const [motivation, setMotivation] = useState<string>("");

    const handleAccept = () => {
        onAccept(motivation);
    };

    const handleOpenChange = (isOpen: boolean) => {
        if (!isOpen) {
            setMotivation(""); // Reset on close
        }
        setOpen(isOpen);
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="max-w-4xl">
                <DialogHeader>
                    <DialogTitle>Apply for this Job</DialogTitle>
                    <DialogDescription>
                        You can add an optional note to the hiring team below.
                    </DialogDescription>
                </DialogHeader>
                <Textarea
                    value={motivation}
                    onChange={e => setMotivation(e.target.value)}
                    placeholder="Explain your motivations, skills, and why you're a great fit for this role (optional)..."
                    rows={5}
                    disabled={loading} // Disable textarea while loading
                />
                <DialogFooter className="mt-2">
                    <Button
                        variant="outline"
                        onClick={() => handleOpenChange(false)}
                        disabled={loading}
                    >
                        Cancel
                    </Button>
                    <Button onClick={handleAccept} disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {loading ? "Saving data..." : btnText}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
