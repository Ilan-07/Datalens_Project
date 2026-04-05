import React, { useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";

interface RefractionGlassProps {
    children?: React.ReactNode;
    className?: string;
    intensity?: number;
    hueShift?: boolean;
}

/**
 * ╔══════════════════════════════════════════════════════════╗
 * ║  RefractionGlass                                        ║
 * ║  Glassmorphism with true light refraction (SVG)         ║
 * ╚══════════════════════════════════════════════════════════╝
 * 
 * Creates a physical glass feel by bending the backdrop DOM
 * pixels using an SVG displacement map, and layering chromatic
 * rim lighting.
 */
export const RefractionGlass: React.FC<RefractionGlassProps> = ({
    children,
    className,
    intensity = 3,
    hueShift = true,
}) => {
    // Generate a unique ID so multiple instances don't share the same SVG filter state
    const idRef = useRef(`refraction-${Math.random().toString(36).substr(2, 9)}`);
    const filterId = idRef.current;

    // Optional: subtle scroll-driven motion for the refraction
    const { scrollYProgress } = useScroll();
    const springScroll = useSpring(scrollYProgress, { stiffness: 40, damping: 20 });
    const baseFrequency = useTransform(springScroll, [0, 1], [0.015, 0.025]);

    return (
        <div className={cn("relative overflow-hidden rounded-2xl", className)}>
            {/* 
        1) The SVG Filter definition.
           We use feTurbulence to create organic "imperfections",
           feColorMatrix to isolate/smooth it, and feDisplacementMap 
           to warp the DOM element it is applied to.
      */}
            <svg className="absolute w-0 h-0" aria-hidden="true">
                <defs>
                    <filter id={filterId} x="-10%" y="-10%" width="120%" height="120%">
                        {/* Create liquid/glass noise */}
                        <feTurbulence
                            type="fractalNoise"
                            baseFrequency="0.02" /* Use fixed for SSR, animate if needed later */
                            numOctaves="3"
                            result="NOISE"
                        />

                        {/* Smooth it heavily to act like thick glass */}
                        <feColorMatrix
                            type="matrix"
                            values="1 0 0 0 0
                      0 1 0 0 0
                      0 0 1 0 0
                      0 0 0 0.5 0"
                            in="NOISE"
                            result="SMOOTH_NOISE"
                        />

                        {/* Displace the element's background by the noise */}
                        <feDisplacementMap
                            in="SourceGraphic"
                            in2="SMOOTH_NOISE"
                            scale={intensity * 10}
                            xChannelSelector="R"
                            yChannelSelector="G"
                        />
                    </filter>
                </defs>
            </svg>

            {/* 
        2) The Distorting Backbone. 
           This element takes the backdrop content and passes it through 
           the SVG filter defined above. 
      */}
            <div
                className="absolute inset-0 pointer-events-none"
                style={{
                    backdropFilter: `blur(12px)`, // Base frosted styling
                    WebkitBackdropFilter: `blur(12px)`,
                    filter: `url(#${filterId})`, // Apply real refraction
                    zIndex: 0,
                }}
            />

            {/* 
        3) Chromatic Rim Light & Tint 
           Subtle iridescent edge and reflection map
      */}
            <div className="absolute inset-0 z-0 pointer-events-none rounded-2xl border border-white/20 bg-gradient-to-br from-white/10 via-white/5 to-transparent mix-blend-overlay shadow-[inset_0_1px_1px_rgba(255,255,255,0.3)]">
                {hueShift && (
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-cyan-400/5 via-violet-500/5 to-rose-400/5 mix-blend-color-dodge opacity-50 pointer-events-none" />
                )}
            </div>

            {/* 4) Content overlay */}
            <div className="relative z-10 w-full h-full">
                {children}
            </div>
        </div>
    );
};
