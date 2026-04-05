import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

export interface FluidNavItemProps {
    id: string;
    label: string;
    href: string;
    icon: LucideIcon;
}

const transitionCurve = {
    type: "spring" as const,
    damping: 25,
    stiffness: 120,
    mass: 0.8,
    ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
};

export const FluidNavItem: React.FC<FluidNavItemProps> = ({ label, href, icon: Icon }) => {
    const [isHovered, setIsHovered] = useState(false);
    const pathname = usePathname();
    const isActive = pathname === href;

    return (
        <Link
            href={href}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onFocus={() => setIsHovered(true)}
            onBlur={() => setIsHovered(false)}
            className="group relative flex items-center justify-center outline-none"
        >
            {/* 
                We use an intrinsic-width container that expands its content.
                Framer motion animates the layout changes smoothly.
            */}
            <motion.div
                layout
                transition={transitionCurve}
                className={cn(
                    "relative flex items-center h-[40px] rounded-full overflow-hidden transition-colors duration-500",
                    (isHovered || isActive) ? "bg-white/10 shadow-xl" : "bg-white/5 shadow-md"
                )}
                style={{
                    // Glassmorphism base
                    backdropFilter: "blur(16px)",
                    WebkitBackdropFilter: "blur(16px)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    // Padding is animated to shrink around the icon or expand for text
                }}
                animate={{
                    paddingLeft: isHovered ? "16px" : "10px",
                    paddingRight: isHovered ? "20px" : "10px",
                }}
            >
                {/* 
                    Highlight Glow: 
                    A subtle radial gradient that appears on hover
                */}
                <motion.div
                    className="absolute inset-0 pointer-events-none opacity-0 mix-blend-screen"
                    animate={{ opacity: isHovered ? 1 : 0 }}
                    transition={{ duration: 0.4 }}
                    style={{
                        background: "radial-gradient(circle at center, rgba(255,255,255,0.15) 0%, transparent 60%)"
                    }}
                />

                {/* Icon Layout */}
                <motion.div
                    layout
                    transition={transitionCurve}
                    className="relative z-10 flex items-center justify-center flex-shrink-0"
                    animate={{
                        // Scale slightly up on hover or active
                        scale: (isHovered || isActive) ? 1.05 : 1,
                    }}
                >
                    <Icon
                        className={cn(
                            "w-[20px] h-[20px] transition-colors duration-300",
                            (isHovered || isActive) ? "text-white" : "text-dim"
                        )}
                        strokeWidth={1.5}
                    />
                </motion.div>

                {/* Text Label Expansion */}
                <AnimatePresence>
                    {(isHovered || isActive) && (
                        <motion.div
                            initial={{ opacity: 0, width: 0, x: -10 }}
                            animate={{ opacity: 1, width: "auto", x: 0 }}
                            exit={{ opacity: 0, width: 0, x: -10 }}
                            transition={transitionCurve}
                            className="relative z-10 overflow-hidden whitespace-nowrap"
                        >
                            <span className="pl-2.5 text-[11px] font-bold uppercase tracking-[0.2em] text-white">
                                {label}
                            </span>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </Link>
    );
};
