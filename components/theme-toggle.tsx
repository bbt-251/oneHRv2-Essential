"use client";

import { Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme-provider";
import { useEffect, useState } from "react";

export function ThemeToggle() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState<boolean>(false);

    // Only render after component mounts on client
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMounted(true);
    }, []);

    // Prevent hydration mismatch by not rendering until mounted
    if (!mounted) {
        return (
            <Button
                variant="outline"
                size="icon"
                className="fixed bottom-4 right-4 z-50 rounded-full w-12 h-12 shadow-lg hover:shadow-xl transition-all duration-200 bg-background/80 backdrop-blur-sm border-border"
                disabled
            >
                <div className="h-5 w-5" />
                <span className="sr-only">Loading theme toggle</span>
            </Button>
        );
    }

    return (
        <Button
            variant="outline"
            size="icon"
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            className="fixed bottom-4 right-4 z-50 rounded-full w-12 h-12 shadow-lg hover:shadow-xl transition-all duration-200 bg-background/80 backdrop-blur-sm border-border"
        >
            {theme === "light" ? (
                <Moon className="h-5 w-5" />
            ) : (
                <Sun className="h-5 w-5 text-white" />
            )}
            <span className="sr-only">Toggle theme</span>
        </Button>
    );
}
