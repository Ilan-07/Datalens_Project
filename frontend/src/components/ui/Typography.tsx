import React from "react";
import { ChromaticText } from "./ChromaticText";
import { cn } from "@/lib/utils";

interface TypographyProps {
    children: string; // ChromaticText only supports string content for now
    className?: string;
    intensity?: number;
}

export const GradientH1: React.FC<TypographyProps> = ({ children, className }) => {
    return (
        <ChromaticText
            as="h1"
            text={children}
            intensity={20}
            className={cn("font-bold text-5xl md:text-7xl tracking-tighter text-white", className)}
        />
    );
};

export const GradientH2: React.FC<TypographyProps> = ({ children, className }) => {
    return (
        <ChromaticText
            as="h2"
            text={children}
            intensity={15}
            className={cn("font-bold text-3xl md:text-5xl tracking-tight text-white/90", className)}
        />
    );
};

export const GradientP: React.FC<TypographyProps> = ({ children, className }) => {
    return (
        <ChromaticText
            as="p"
            text={children}
            intensity={5}
            className={cn("text-base md:text-lg text-muted-foreground", className)}
        />
    );
};
