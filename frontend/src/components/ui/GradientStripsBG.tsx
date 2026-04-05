import React, { useMemo, useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

// ── Types ─────────────────────────────────────────────────────────────
interface StripConfig {
    x: number;        // horizontal position (%)
    width: number;    // strip width (px)
    height: number;   // strip height (%)
    color1: string;   // gradient start
    color2: string;   // gradient mid
    color3: string;   // gradient end
    opacity: number;
    delay: number;
    blur: number;
    borderRadius: string;
}

interface GradientStripsBGProps {
    /** Number of gradient strips */
    stripCount?: number;
    /** Base animation duration in seconds */
    duration?: number;
    /** Stagger delay between strips in ms */
    stagger?: number;
    /** Pulse scale max (1.0 = no pulse) */
    pulseIntensity?: number;
    /** Overall opacity multiplier */
    opacity?: number;
    className?: string;
}

// ── Color Palette (deep midnight → indigo → muted violet) ─────────
const PALETTE = [
    { c1: "#0B1120", c2: "#1a1a4e", c3: "#2d1b4e" },
    { c1: "#0d1530", c2: "#1e2060", c3: "#3a1f5e" },
    { c1: "#0f1835", c2: "#252878", c3: "#4a2268" },
    { c1: "#101a38", c2: "#2a2d80", c3: "#3d1a58" },
    { c1: "#0e1630", c2: "#1c1f55", c3: "#351848" },
    { c1: "#0c1328", c2: "#201e65", c3: "#42205a" },
    { c1: "#0b1222", c2: "#181850", c3: "#2e1845" },
    { c1: "#0d1530", c2: "#232470", c3: "#3f1e62" },
];

export const GradientStripsBG: React.FC<GradientStripsBGProps> = ({
    stripCount = 12,
    duration = 1.6,
    stagger = 60,
    pulseIntensity = 1.025,
    opacity = 0.6,
    className = "",
}) => {
    const prefersReducedMotion = useReducedMotion();
    const [mounted, setMounted] = useState(false);

    useEffect(() => setMounted(true), []);

    // Generate strip configurations deterministically
    const strips: StripConfig[] = useMemo(() => {
        const center = 50;
        return Array.from({ length: stripCount }, (_, i) => {
            // Distribute from center outward with slight randomization
            const progress = i / (stripCount - 1);                // 0 → 1
            const spread = 70;                                     // total spread %
            const offset = (progress - 0.5) * spread;
            const x = center + offset;

            // Width varies — thinner at edges, wider at center
            const distFromCenter = Math.abs(progress - 0.5) * 2;  // 0 at center, 1 at edge
            const width = 20 + (1 - distFromCenter) * 35;

            // Height variation
            const height = 60 + (1 - distFromCenter) * 40;

            // Pick palette colors
            const pal = PALETTE[i % PALETTE.length];

            // Opacity falloff at edges
            const edgeFalloff = 1 - distFromCenter * 0.6;

            return {
                x,
                width,
                height,
                color1: pal.c1,
                color2: pal.c2,
                color3: pal.c3,
                opacity: (0.3 + edgeFalloff * 0.5) * opacity,
                delay: i * (stagger / 1000),
                blur: 2 + distFromCenter * 3,
                borderRadius: `${40 + (1 - distFromCenter) * 30}% ${40 + (1 - distFromCenter) * 30}% 0 0`,
            };
        });
    }, [stripCount, stagger, opacity]);

    if (!mounted) return null;

    return (
        <div
            className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}
            aria-hidden="true"
        >
            {/* Layer 1: Base deep background */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#050810] via-[#0a0e1a] to-black" />

            {/* Layer 2: Gradient Strips */}
            <div className="absolute inset-0" style={{ filter: "blur(1.5px)" }}>
                {strips.map((strip, i) => (
                    <motion.div
                        key={i}
                        initial={{
                            opacity: 0,
                            y: 30,
                            scaleY: 0.85,
                        }}
                        animate={{
                            opacity: prefersReducedMotion ? strip.opacity : strip.opacity,
                            y: 0,
                            scaleY: 1,
                        }}
                        transition={{
                            duration: prefersReducedMotion ? 0 : duration,
                            delay: prefersReducedMotion ? 0 : strip.delay,
                            ease: [0.22, 1, 0.36, 1],
                        }}
                        className="absolute bottom-0"
                        style={{
                            left: `${strip.x}%`,
                            transform: `translateX(-50%)`,
                            width: `${strip.width}px`,
                            height: `${strip.height}%`,
                            background: `linear-gradient(to top, ${strip.color1}, ${strip.color2} 50%, ${strip.color3})`,
                            borderRadius: strip.borderRadius,
                            opacity: strip.opacity,
                            filter: `blur(${strip.blur}px)`,
                            mixBlendMode: "screen",
                        }}
                    >
                        {/* Gentle pulse animation */}
                        {!prefersReducedMotion && (
                            <motion.div
                                className="absolute inset-0"
                                style={{
                                    background: "inherit",
                                    borderRadius: "inherit",
                                }}
                                animate={{
                                    scaleY: [1, pulseIntensity, 1],
                                    opacity: [1, 0.85, 1],
                                }}
                                transition={{
                                    duration: 5 + i * 0.3,
                                    repeat: Infinity,
                                    ease: "easeInOut",
                                    delay: i * 0.4,
                                }}
                            />
                        )}
                    </motion.div>
                ))}
            </div>

            {/* Layer 3: Noise overlay (3-5% opacity) */}
            <div
                className="absolute inset-0 opacity-[0.035]"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.8' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
                }}
            />

            {/* Layer 4: Soft ambient glow (center) */}
            <div className="absolute inset-0">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[60%] bg-[#1a1a4e]/20 blur-[100px] rounded-full" />
            </div>

            {/* Layer 5: Dark radial overlay for text readability */}
            <div
                className="absolute inset-0"
                style={{
                    background:
                        "radial-gradient(ellipse 70% 60% at 50% 40%, transparent 0%, rgba(0,0,0,0.4) 60%, rgba(0,0,0,0.75) 100%)",
                }}
            />

            {/* Layer 6: Edge feather masks */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-transparent to-black/80" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/70" />
        </div>
    );
};
