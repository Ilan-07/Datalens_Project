import React from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

/**
 * DepthTypography
 * ================
 * Multi-layer 3D extrusion text component. Comic-inspired dimensional feel.
 * 
 * Layers: base white → red offset → blue offset → shadow → optional blur
 * Hover: increased extrusion + chromatic offset + subtle tilt
 */

interface DepthTypographyProps {
    children: React.ReactNode;
    className?: string;
    as?: "h1" | "h2" | "h3" | "span";
    depth?: "sm" | "md" | "lg" | "xl";
    animate?: boolean;
}

const depthConfig = {
    sm: {
        redOffset: { x: -1, y: 1 },
        blueOffset: { x: 1, y: -1 },
        shadowBlur: 10,
        hoverScale: 1.02,
        hoverRedX: -2,
        hoverBlueX: 2,
    },
    md: {
        redOffset: { x: -2, y: 2 },
        blueOffset: { x: 2, y: -1 },
        shadowBlur: 20,
        hoverScale: 1.03,
        hoverRedX: -4,
        hoverBlueX: 4,
    },
    lg: {
        redOffset: { x: -3, y: 3 },
        blueOffset: { x: 3, y: -2 },
        shadowBlur: 30,
        hoverScale: 1.04,
        hoverRedX: -6,
        hoverBlueX: 6,
    },
    xl: {
        redOffset: { x: -4, y: 4 },
        blueOffset: { x: 4, y: -3 },
        shadowBlur: 40,
        hoverScale: 1.05,
        hoverRedX: -8,
        hoverBlueX: 8,
    },
};

export const DepthTypography: React.FC<DepthTypographyProps> = ({
    children,
    className,
    as: Tag = "h1",
    depth = "lg",
    animate = true,
}) => {
    const config = depthConfig[depth];

    const baseClass = cn(
        "font-heading font-black italic uppercase tracking-tighter leading-[0.85] select-none",
        className
    );

    const layers = (
        <>
            {/* Layer 5: Deep shadow */}
            <span
                className="absolute inset-0 text-transparent pointer-events-none"
                style={{
                    WebkitTextStroke: "0px",
                    textShadow: `0 ${config.shadowBlur / 2}px ${config.shadowBlur}px rgba(139, 0, 0, 0.3)`,
                    transform: `translate(${config.redOffset.x * 2}px, ${config.redOffset.y * 2}px)`,
                }}
                aria-hidden
            >
                {children}
            </span>

            {/* Layer 4: Red offset (back) */}
            <span
                className="absolute inset-0 text-[#8B0000] opacity-60 pointer-events-none mix-blend-screen"
                style={{
                    transform: `translate(${config.redOffset.x}px, ${config.redOffset.y}px)`,
                    filter: "blur(0.5px)",
                }}
                aria-hidden
            >
                {children}
            </span>

            {/* Layer 3: Blue/Cyan offset (back) */}
            <span
                className="absolute inset-0 text-[#00F0FF] opacity-30 pointer-events-none mix-blend-screen"
                style={{
                    transform: `translate(${config.blueOffset.x}px, ${config.blueOffset.y}px)`,
                    filter: "blur(0.5px)",
                }}
                aria-hidden
            >
                {children}
            </span>

            {/* Layer 2: Magenta accent (subtle) */}
            <span
                className="absolute inset-0 text-[#FF00FF] opacity-15 pointer-events-none mix-blend-screen"
                style={{
                    transform: `translate(${config.blueOffset.x * 0.5}px, ${config.redOffset.y * 0.5}px)`,
                    filter: "blur(1px)",
                }}
                aria-hidden
            >
                {children}
            </span>

            {/* Layer 1: Base white text */}
            <span className="relative z-10 text-white">
                {children}
            </span>
        </>
    );

    if (animate) {
        return (
            <motion.div
                className={cn("relative inline-block cursor-default group", baseClass)}
                whileHover={{
                    scale: config.hoverScale,
                    rotateX: 2,
                    rotateY: -1,
                }}
                animate={{
                    // Subtle breathing in stable state
                    scale: [1, 1.003, 1],
                }}
                transition={{
                    scale: {
                        duration: 4,
                        repeat: Infinity,
                        ease: "easeInOut",
                    },
                }}
                style={{ perspective: "1000px" }}
            >
                {layers}

                {/* Hover chromatic intensification */}
                                <style>{`
          .group:hover span:nth-child(2) {
            transform: translate(${config.hoverRedX}px, ${config.redOffset.y * 1.5}px) !important;
            opacity: 0.8;
            transition: all 0.3s cubic-bezier(0.22, 1, 0.36, 1);
          }
          .group:hover span:nth-child(3) {
            transform: translate(${config.hoverBlueX}px, ${config.blueOffset.y * 1.5}px) !important;
            opacity: 0.5;
            transition: all 0.3s cubic-bezier(0.22, 1, 0.36, 1);
          }
        `}</style>
            </motion.div>
        );
    }

    return (
        <Tag className={cn("relative inline-block", baseClass)}>
            {layers}
        </Tag>
    );
};
