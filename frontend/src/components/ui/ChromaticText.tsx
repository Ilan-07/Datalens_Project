"use strict";

import React, { useRef, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform, useAnimationFrame } from "framer-motion";
import { useMultiverse } from "@/engine/MultiverseProvider";
import { cn } from "@/lib/utils";

interface ChromaticTextProps {
    text: string;
    className?: string; // Additional classes for the container
    as?: any; // h1, h2, p, span, etc. - using any to avoid strict type checks on dynamic components
    intensity?: number; // 0-50px offset
    active?: boolean; // Force active state
}

export const ChromaticText: React.FC<ChromaticTextProps> = ({
    text,
    className,
    as: Tag = "span",
    intensity = 15,
    active = true,
}) => {
    const containerRef = useRef<HTMLElement>(null);
    const { cinematicMode } = useMultiverse();
    const [isHovered, setIsHovered] = useState(false);

    // Motion Values for Mouse Position (Normalized -1 to 1)
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    // Smooth springs for trails
    const springConfig = { damping: 20, stiffness: 150, mass: 0.5 };
    const dx = useSpring(x, springConfig);
    const dy = useSpring(y, springConfig);

    useAnimationFrame((t) => {
        if (!isHovered && active && cinematicMode) {
            // Idle breathing: slight shift
            const idleX = Math.sin(t / 1000) * 0.2; // +/- 0.2 normalized
            const idleY = Math.cos(t / 1400) * 0.2;
            x.set(idleX);
            y.set(idleY);
        }
    });

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!containerRef.current || !active || !cinematicMode) return;
        const rect = containerRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        // Normalize -1 to 1
        const nX = (e.clientX - centerX) / (rect.width / 2);
        const nY = (e.clientY - centerY) / (rect.height / 2);

        x.set(nX);
        y.set(nY);
    };

    const handleMouseLeave = () => {
        setIsHovered(false);
    };

    const handleMouseEnter = () => {
        setIsHovered(true);
    };

    // Transforms for RGB layers
    const rX = useTransform(dx, (v) => v * -intensity);
    const rY = useTransform(dy, (v) => v * -intensity);
    const bX = useTransform(dx, (v) => v * intensity);
    const bY = useTransform(dy, (v) => v * intensity);
    const gX = useTransform(dx, (v) => v * (intensity * 0.2));
    const gY = useTransform(dy, (v) => v * (intensity * 0.2));

    const Component = Tag as any;

    if (!active || !cinematicMode) {
        return <Component className={cn("relative inline-block", className)}>{text}</Component>;
    }

    return (
        <Component
            ref={containerRef}
            onMouseMove={handleMouseMove}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            className={cn("relative inline-block group cursor-default select-none", className)}
            style={{ perspective: 1000 }}
        >
            {/* Base Layer */}
            <span className="opacity-0 select-none">{text}</span>

            {/* Red Channel */}
            <motion.span
                className="absolute inset-0 text-red-500 mix-blend-screen pointer-events-none"
                style={{ x: rX, y: rY, opacity: 0.8 }}
                aria-hidden="true"
            >
                {text}
            </motion.span>

            {/* Green Channel */}
            <motion.span
                className="absolute inset-0 text-green-500 mix-blend-screen pointer-events-none"
                style={{ x: gX, y: gY, opacity: 0.8 }}
                aria-hidden="true"
            >
                {text}
            </motion.span>

            {/* Blue Channel */}
            <motion.span
                className="absolute inset-0 text-blue-500 mix-blend-screen pointer-events-none"
                style={{ x: bX, y: bY, opacity: 0.8 }}
                aria-hidden="true"
            >
                {text}
            </motion.span>

            {/* Scanline Overlay */}
            <span className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-20 transition-opacity duration-300 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSIxIiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMSIvPjwvc3ZnPg==')]" />
        </Component>
    );
};
