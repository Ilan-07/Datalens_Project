import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface SettingItemProps {
    label: string;
    isActive: boolean;
    rotation: number;
}

export const SettingItem: React.FC<SettingItemProps> = ({ label, isActive, rotation }) => {
    return (
        <div
            className="absolute top-1/2 left-1/2 w-full h-12 -translate-x-1/2 -translate-y-1/2 flex items-center justify-end pr-8 origin-center pointer-events-none"
            style={{
                transform: `rotate(${rotation}deg) translateX(${isActive ? "300px" : "260px"})`,
                transformStyle: "preserve-3d",
                transition: "transform 0.6s cubic-bezier(0.2, 0.8, 0.2, 1)",
                zIndex: isActive ? 10 : 1,
            }}
        >
            <motion.div
                className={cn(
                    "flex items-center gap-4 transition-all duration-500",
                    isActive ? "opacity-100 scale-110" : "opacity-50 scale-90"
                )}
            >
                {/* Text Label */}
                <span
                    className={cn(
                        "font-heading font-black uppercase tracking-[0.2em] text-sm whitespace-nowrap",
                        isActive ? "text-white text-shadow-glow" : "text-dim"
                    )}
                >
                    {label}
                </span>

                {/* Mechanical Arm / Indicator */}
                <div
                    className={cn(
                        "h-[1px] bg-white transition-all duration-500",
                        isActive ? "w-12 bg-cyan shadow-[0_0_10px_#00F0FF]" : "w-4 opacity-20"
                    )}
                />

                {/* Dot Endpoint */}
                <div
                    className={cn(
                        "w-1.5 h-1.5 rounded-full transition-all duration-500",
                        isActive ? "bg-cyan shadow-[0_0_15px_#00F0FF]" : "bg-dim opacity-20"
                    )}
                />
            </motion.div>
        </div>
    );
};
