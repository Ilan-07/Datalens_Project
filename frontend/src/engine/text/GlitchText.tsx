import React, { useRef } from "react";
import { cn } from "@/lib/utils";
import { useGlitchHover } from "./useGlitchHover";

interface GlitchTextProps {
    children: React.ReactNode;
    className?: string;
    as?: React.ElementType;
    intensity?: "low" | "medium" | "high";
}

export const GlitchText: React.FC<GlitchTextProps> = ({
    children,
    className,
    as: Tag = "span",
    intensity = "medium",
}) => {
    const ref = useRef<HTMLElement>(null);

    // Register with engine
    useGlitchHover(ref, intensity);

    const Component = Tag as any;

    return (
        <Component
            ref={ref as any}
            className={cn("relative inline-block cursor-default select-none", className)}
            data-glitchable="true"
        >
            {children}
        </Component>
    );
};
