import React from "react";
import { cn } from "@/lib/utils";
import { useMultiverse } from "@/engine/MultiverseProvider";
import { motion } from "framer-motion";

/**
 * GlitchWrapper (v2 — Engine-Integrated)
 * ========================================
 * When Cinematic Mode is on:  reacts to MultiverseStateManager for real-time glitch
 * When Cinematic Mode is off: falls back to CSS-only chromatic aberration
 */

interface GlitchWrapperProps {
    children: React.ReactNode;
    className?: string;
    trigger?: "hover" | "click" | "always";
    intensity?: "low" | "medium" | "high";
}

export const GlitchWrapper: React.FC<GlitchWrapperProps> = ({
    children,
    className,
    trigger = "hover",
    intensity = "medium",
}) => {
    const { state, visuals, cinematicMode, triggerEnergyBuild, triggerStable } =
        useMultiverse();

    const intensityMultiplier =
        intensity === "low" ? 0.5 : intensity === "high" ? 1.5 : 1.0;

    const isActive =
        state === "MULTIVERSE_TEAR" ||
        (state === "ENERGY_BUILD" && trigger !== "click");

    const chromaticPx = visuals.chromaticOffset * intensityMultiplier;

    const handleMouseEnter = () => {
        if (trigger === "hover" || trigger === "always") {
            triggerEnergyBuild("glitch_hover");
        }
    };

    const handleMouseLeave = () => {
        if (trigger === "hover") {
            triggerStable("glitch_leave");
        }
    };

    const handleClick = () => {
        if (trigger === "click") {
            triggerEnergyBuild("glitch_click");
            setTimeout(() => triggerStable("glitch_click_decay"), 600);
        }
    };

    if (!cinematicMode) {
        // ── CSS Fallback ────────────────────────────────────────────────────
        return (
            <div
                className={cn("glitch-target group relative inline-block", className)}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                onClick={handleClick}
            >
                <div
                    className={cn(
                        "transition-transform duration-200",
                        isActive && "chromatic-aberration scale-[1.02]"
                    )}
                >
                    {children}
                </div>
                {isActive && (
                    <>
                        <div className="glitch-layer glitch-layer-cyan">{children}</div>
                        <div className="glitch-layer glitch-layer-magenta">{children}</div>
                    </>
                )}
            </div>
        );
    }

    // ── Cinematic Mode ──────────────────────────────────────────────────
    return (
        <motion.div
            className={cn("relative inline-block", className)}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onClick={handleClick}
            animate={{
                scale: isActive ? 1.01 + visuals.glitchIntensity * 0.02 : 1,
            }}
            transition={{ duration: 0.3 }}
        >
            {/* Chromatic red layer */}
            <span
                className="absolute inset-0 pointer-events-none mix-blend-screen"
                style={{
                    transform: `translate(${-chromaticPx}px, 0)`,
                    filter: `blur(${chromaticPx * 0.3}px)`,
                    opacity: chromaticPx > 0.3 ? 0.4 : 0,
                    color: "#ff0040",
                    transition: "all 0.15s ease-out",
                }}
                aria-hidden
            >
                {children}
            </span>

            {/* Chromatic cyan layer */}
            <span
                className="absolute inset-0 pointer-events-none mix-blend-screen"
                style={{
                    transform: `translate(${chromaticPx}px, 0)`,
                    filter: `blur(${chromaticPx * 0.3}px)`,
                    opacity: chromaticPx > 0.3 ? 0.3 : 0,
                    color: "#00f0ff",
                    transition: "all 0.15s ease-out",
                }}
                aria-hidden
            >
                {children}
            </span>

            {/* Base content */}
            <div className="relative z-10">{children}</div>
        </motion.div>
    );
};
