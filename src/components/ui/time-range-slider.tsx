"use client";

import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { cn } from "@/lib/utils";

// Helper to convert minutes from midnight to HH:mm format
const formatMinutesToTime = (minutes: number) => {
  const hours = Math.floor(minutes / 60).toString().padStart(2, '0');
  const mins = (minutes % 60).toString().padStart(2, '0');
  return `${hours}:${mins}`;
};

const TimeRangeSlider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, value, onValueChange, ...props }, ref) => {
  const [localValue, setLocalValue] = React.useState(value || [0, 1425]);

  React.useEffect(() => {
    if (value) {
      setLocalValue(value);
    }
  }, [value]);

  const handleValueChange = (newValue: number[]) => {
    const sortedValue = [...newValue].sort((a, b) => a - b) as [number, number];
    setLocalValue(sortedValue);
    if (onValueChange) {
      onValueChange(sortedValue);
    }
  };
  
  const [startMinutes, endMinutes] = localValue;

  return (
    <div className="w-full">
        <div className="flex justify-between text-sm text-muted-foreground px-1 mb-2">
            <span>Từ: <strong>{formatMinutesToTime(startMinutes)}</strong></span>
            <span>Đến: <strong>{formatMinutesToTime(endMinutes === 1425 ? 1439 : endMinutes)}</strong></span>
        </div>
        <SliderPrimitive.Root
            ref={ref}
            value={localValue}
            onValueChange={handleValueChange}
            min={0}
            max={1425} // 23:45, to be a multiple of step
            step={15}
            className={cn(
                "relative flex w-full touch-none select-none items-center",
                className
            )}
            {...props}
        >
            <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-secondary">
                <SliderPrimitive.Range className="absolute h-full bg-primary" />
            </SliderPrimitive.Track>
            <SliderPrimitive.Thumb className="block h-5 w-5 rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50" />
            <SliderPrimitive.Thumb className="block h-5 w-5 rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50" />
        </SliderPrimitive.Root>
    </div>
  );
});

TimeRangeSlider.displayName = "TimeRangeSlider";

export { TimeRangeSlider };