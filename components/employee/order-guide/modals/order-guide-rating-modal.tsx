"use client";

import type React from "react";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star } from "lucide-react";
import { useToast } from "@/context/toastContext";

interface EmployeeOrderGuideRatingModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (rating: number, comment: string) => void;
    orderGuideName: string;
}

export function EmployeeOrderGuideRatingModal({
    isOpen,
    onClose,
    onSubmit,
    orderGuideName,
}: EmployeeOrderGuideRatingModalProps) {
    const { showToast } = useToast();
    const [rating, setRating] = useState<number>(0);
    const [comment, setComment] = useState<string>("");
    const [hoveredRating, setHoveredRating] = useState<number>(0);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const handleSubmit = async () => {
        if (rating > 0) {
            setIsLoading(true);
            try {
                await onSubmit(rating, comment);
                showToast("Rating submitted successfully", "Success", "success");
                // Reset form
                setRating(0);
                setComment("");
                setHoveredRating(0);
                onClose();
            } catch (error) {
                console.error("Error submitting rating:", error);
                showToast("Failed to submit rating", "Error", "error");
            } finally {
                setIsLoading(false);
            }
        }
    };

    const handleClose = () => {
        setRating(0);
        setComment("");
        setHoveredRating(0);
        onClose();
    };

    const renderStars = () => {
        return [1, 2, 3, 4, 5].map(star => (
            <button
                key={star}
                type="button"
                className="p-1 hover:scale-110 transition-transform"
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                onClick={() => setRating(star)}
            >
                <Star
                    className={`h-8 w-8 ${
                        star <= (hoveredRating || rating)
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-300"
                    }`}
                />
            </button>
        ));
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-xl font-semibold">Rate Order Guide</DialogTitle>
                </DialogHeader>

                <div className="space-y-6 mt-4">
                    <div>
                        <h3 className="text-lg font-medium mb-2">{orderGuideName}</h3>
                        <p className="text-sm">
                            Please rate your experience with this order guide and provide feedback
                            to help us improve.
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-3">Rating *</label>
                        <div className="flex items-center gap-1">
                            {renderStars()}
                            <span className="ml-3 text-sm">
                                {rating > 0
                                    ? `${rating} star${rating !== 1 ? "s" : ""}`
                                    : "Select a rating"}
                            </span>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-3">
                            Comments (Optional)
                        </label>
                        <Textarea
                            placeholder="Share your thoughts about this order guide..."
                            value={comment}
                            onChange={e => setComment(e.target.value)}
                            className="min-h-[100px] resize-none"
                        />
                    </div>

                    <div className="flex justify-end gap-3">
                        <Button variant="outline" onClick={handleClose}>
                            Cancel
                        </Button>
                        <Button onClick={handleSubmit} disabled={rating === 0 || isLoading}>
                            {isLoading ? "Submitting..." : "Submit Rating"}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
