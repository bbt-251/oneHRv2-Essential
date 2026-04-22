"use client";

import { Button } from "@/components/ui/button";
import { useState } from "react";

export const TestError: React.FC = () => {
    const [shouldError, setShouldError] = useState<boolean>(false);

    if (shouldError) {
        throw new Error("This is a test error to verify the error boundary works!");
    }

    return (
        <div className="p-4">
            <h2 className="text-lg font-semibold mb-4">Error Boundary Test</h2>
            <Button onClick={() => setShouldError(true)} variant="destructive">
                Trigger Test Error
            </Button>
        </div>
    );
};
