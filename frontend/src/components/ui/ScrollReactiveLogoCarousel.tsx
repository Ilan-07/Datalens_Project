import React, { useRef, useState, useEffect } from "react";
import { useAnimationFrame, useMotionValue, motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

// ── Dummy Logos (Matching site aesthetic) ────────────────────────────────
const PARTNERS = [
    "TechVentures",
    "DataFlow Inc.",
    "Quantum Labs",
    "Insight Corp",
    "NeuraByte",
    "Ascend AI",
    "CloudScale",
    "Visionary Systems",
];

// ── Types ────────────────────────────────────────────────────────────────
export interface ScrollReactiveLogoCarouselProps {
    className?: string;
    baseSpeed?: number;
    direction?: 1 | -1; // 1 = left, -1 = right
    gap?: number;
    logoHeight?: number;
    mobileScale?: number;
    reducedMotionBehavior?: "disable" | "slow" | "system";
}

export const ScrollReactiveLogoCarousel: React.FC<ScrollReactiveLogoCarouselProps> = ({
    className,
    baseSpeed = 0.5,
    direction = 1,
    gap = 80,
    logoHeight = 48,
    mobileScale = 0.8,
    reducedMotionBehavior = "system",
}) => {
    // Motion State
    const baseX = useMotionValue(0);

    const containerRef = useRef<HTMLDivElement>(null);
    const rowRef = useRef<HTMLDivElement>(null);

    const [rowWidth, setRowWidth] = useState(0);

    // Accessibility: Reduced Motion
    const prefersReducedMotion = useReducedMotion();
    const shouldReduceMotion = reducedMotionBehavior === "disable" || (reducedMotionBehavior === "system" && prefersReducedMotion);

    // Base velocity scaled by direction. (Negative moves left in our modulo math setup)
    const effectiveBaseSpeed = (shouldReduceMotion ? (baseSpeed * 0.5) : baseSpeed) * direction * -1;

    // ── 1. Spatial Measurement ───────────────────────────────────────────────
    useEffect(() => {
        const measure = () => {
            if (rowRef.current) {
                setRowWidth(rowRef.current.offsetWidth);
            }
        };

        // Initial measure with slight delay to ensure fonts/layout have painted
        setTimeout(measure, 100);
        window.addEventListener("resize", measure);
        return () => window.removeEventListener("resize", measure);
    }, []);

    // Safe modulo for infinite loop bounds
    const wrap = (min: number, max: number, v: number) => {
        const rangeSize = max - min;
        return ((((v - min) % rangeSize) + rangeSize) % rangeSize) + min;
    };

    // ── 2. Physics Calculation Layer (Continuous Autonomous Loop) ────────────
    useAnimationFrame((t, delta) => {
        if (rowWidth === 0) return;

        // Delta normalization (~16.666ms per frame at 60fps)
        const timeScale = delta / 16.666;
        const moveBy = effectiveBaseSpeed * timeScale;

        // Apply primary layer movement
        let newX = baseX.get() + moveBy;
        newX = wrap(-rowWidth, 0, newX);
        baseX.set(newX);
    });

    return (
        <div className={cn("relative w-full overflow-hidden flex items-center justify-center", className)}>

            <div
                ref={containerRef}
                className="w-full relative z-10 flex flex-col items-center"
                style={{
                    maskImage: "linear-gradient(to right, transparent, black 15%, black 85%, transparent)",
                    WebkitMaskImage: "linear-gradient(to right, transparent, black 15%, black 85%, transparent)"
                }}
            >
                <motion.div
                    className="flex w-max relative z-10"
                    style={{
                        x: baseX,
                        willChange: "transform",
                    }}
                >
                    {/* Render 2 identical sets side by side for seamless wrap. */}
                    {[0, 1].map((setIndex) => (
                        <div
                            key={setIndex}
                            ref={setIndex === 0 ? rowRef : null}
                            className="flex items-center"
                            style={{ gap: `${gap}px`, paddingRight: `${gap}px` }}
                        >
                            {PARTNERS.map((name, i) => (
                                <div
                                    key={`${setIndex}-${i}`}
                                    className="flex-shrink-0 flex items-center justify-center cursor-default transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] grayscale opacity-70 hover:grayscale-0 hover:opacity-100"
                                    style={{ height: logoHeight }}
                                >
                                    <span
                                        className="font-heading font-black tracking-[0.05em] text-dim select-none transition-all duration-300 ease-out"
                                        style={{
                                            fontSize: "clamp(16px, 2vw, 24px)" // Automatically scales down on mobile without media queries
                                        }}
                                    >
                                        {name}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ))}
                </motion.div>
            </div>
        </div>
    );
};
