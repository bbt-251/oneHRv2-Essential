"use client";

import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";

import { cn } from "@/lib/utils";

interface MinMaxSliderProps extends React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> {
    min?: number;
    max?: number;
    step?: number;
    value: [number, number];
    onValueChange: (value: [number, number]) => void;
    label?: string;
    showLabels?: boolean;
}

const MinMaxSlider = React.forwardRef<
    React.ElementRef<typeof SliderPrimitive.Root>,
    MinMaxSliderProps
>(
    (
        {
            className,
            min = 0,
            max = 5,
            step = 0.1,
            value,
            onValueChange,
            label,
            showLabels = true,
            ...props
        },
        ref,
    ) => {
        const [localValue, setLocalValue] = React.useState<[number, number]>(value);

        React.useEffect(() => {
            setLocalValue(value);
        }, [value]);

        const handleValueChange = (newValue: number[]) => {
            const [minVal, maxVal] = newValue as [number, number];

            // Ensure min doesn't exceed max and vice versa
            if (minVal > maxVal - step) {
                // If moving min thumb past max, push max forward
                if (localValue[0] !== minVal) {
                    setLocalValue([minVal, minVal + step]);
                    onValueChange([minVal, minVal + step]);
                } else {
                    // If moving max thumb past min, push min backward
                    setLocalValue([maxVal - step, maxVal]);
                    onValueChange([maxVal - step, maxVal]);
                }
            } else {
                setLocalValue([minVal, maxVal]);
                onValueChange([minVal, maxVal]);
            }
        };

        return (
            <div className={cn("w-full space-y-2", className)}>
                {label && (
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{label}</span>
                        {showLabels && (
                            <span className="text-sm text-muted-foreground">
                                {localValue[0].toFixed(1)} - {localValue[1].toFixed(1)}
                            </span>
                        )}
                    </div>
                )}
                <SliderPrimitive.Root
                    ref={ref}
                    min={min}
                    max={max}
                    step={step}
                    value={localValue}
                    onValueChange={handleValueChange}
                    className="relative flex w-full touch-none select-none items-center"
                    {...props}
                >
                    <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-secondary">
                        <SliderPrimitive.Range className="absolute h-full bg-primary" />
                    </SliderPrimitive.Track>
                    <SliderPrimitive.Thumb className="block h-5 w-5 rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer" />
                    <SliderPrimitive.Thumb className="block h-5 w-5 rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer" />
                </SliderPrimitive.Root>
                {showLabels && (
                    <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{min}</span>
                        <span>{max}</span>
                    </div>
                )}
            </div>
        );
    },
);
MinMaxSlider.displayName = "MinMaxSlider";

export { MinMaxSlider };
