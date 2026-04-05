import React, { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
    Zap, // Represents Lightning Bolt
    ShieldCheck, // Represents Shield Check
    Bot, // Represents Robot
    Rocket, // Represents Rocket
} from "lucide-react";

// Mapping of icon names to actual Lucide-React components
const iconMap = {
    LightningBolt: Zap,
    ShieldCheck: ShieldCheck,
    Robot: Bot,
    Rocket: Rocket,
};

export interface FlowCardProps {
    title: string;
    description: string;
    icon: keyof typeof iconMap;
    cta: string;
}

interface FlowStackProps {
    cards: FlowCardProps[];
    className?: string;
}

const transitionCurve = {
    type: "spring" as const,
    damping: 25,
    stiffness: 120,
    mass: 0.8,
    // Apple-like ease
    ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
};

export const FlowStack: React.FC<FlowStackProps> = ({ cards, className }) => {
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

    return (
        <div className={cn("w-full max-w-7xl mx-auto py-12", className)}>
            {/* Desktop & Tablet: Horizontal / Stacked Grid Layout */}
            <div className="hidden md:flex flex-row gap-4 h-[450px]">
                {cards.map((card, index) => {
                    const isHovered = hoveredIndex === index;
                    const isAnyHovered = hoveredIndex !== null;

                    const width = isHovered
                        ? "45%" // Expanded width
                        : isAnyHovered
                            ? "18.33%" // Compressed width (remaining 55% / 3)
                            : "25%"; // Default equal width

                    const IconComponent = iconMap[card.icon] || Zap;

                    return (
                        <motion.div
                            key={index}
                            className="relative group rounded-3xl overflow-hidden cursor-pointer bg-black/40 border border-white/10 backdrop-blur-xl flex flex-col justify-end"
                            animate={{
                                width,
                                opacity: isAnyHovered && !isHovered ? 0.6 : 1,
                                filter: isAnyHovered && !isHovered ? "blur(2px)" : "blur(0px)",
                            }}
                            transition={transitionCurve}
                            onMouseEnter={() => setHoveredIndex(index)}
                            onMouseLeave={() => setHoveredIndex(null)}
                            style={{
                                transformOrigin: "center left"
                            }}
                        >
                            {/* Glass background gradient on hover */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent z-10" />
                            <motion.div
                                className="absolute inset-0 bg-spider-red/5 z-0"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: isHovered ? 1 : 0 }}
                                transition={{ duration: 0.3 }}
                            />

                            {/* Content container */}
                            <div className="relative z-20 p-8 flex flex-col h-full justify-between">
                                {/* Icon top corner */}
                                <motion.div
                                    className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6"
                                    animate={{
                                        boxShadow: isHovered ? "0 0 20px rgba(255,255,255,0.15)" : "0 0 0px rgba(255,255,255,0)",
                                        borderColor: isHovered ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.1)",
                                    }}
                                >
                                    <IconComponent className={cn("w-6 h-6 text-white/70", isHovered && "text-white")} />
                                </motion.div>

                                {/* Text content */}
                                <div className="flex flex-col gap-2 relative">
                                    <h3 className="text-2xl font-semibold text-white tracking-tight whitespace-nowrap">
                                        {card.title}
                                    </h3>

                                    {/* Expandable Description & CTA */}
                                    <motion.div
                                        className="overflow-hidden"
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{
                                            height: isHovered ? "auto" : 0,
                                            opacity: isHovered ? 1 : 0,
                                        }}
                                        transition={transitionCurve}
                                    >
                                        <p className="text-white/60 text-sm leading-relaxed mt-2 mb-6 min-w-[280px]">
                                            {card.description}
                                        </p>
                                        <div className="inline-flex items-center text-sm font-medium text-white group-hover:text-spider-red transition-colors">
                                            {card.cta}
                                        </div>
                                    </motion.div>
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {/* Mobile: Vertical Accordion Layout */}
            <div className="flex md:hidden flex-col gap-4">
                {cards.map((card, index) => {
                    const isHovered = hoveredIndex === index;
                    const isAnyHovered = hoveredIndex !== null;
                    const IconComponent = iconMap[card.icon] || Zap;

                    return (
                        <motion.div
                            key={index}
                            className="relative rounded-3xl overflow-hidden cursor-pointer bg-black/40 border border-white/10 backdrop-blur-xl"
                            animate={{
                                opacity: isAnyHovered && !isHovered ? 0.7 : 1,
                            }}
                            onMouseEnter={() => setHoveredIndex(index)}
                            onMouseLeave={() => setHoveredIndex(null)}
                            onClick={() => setHoveredIndex(isHovered ? null : index)} // Toggle on tap
                        >
                            <div className="relative z-20 p-6">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                                        <IconComponent className="w-5 h-5 text-white/80" />
                                    </div>
                                    <h3 className="text-xl font-semibold text-white tracking-tight">
                                        {card.title}
                                    </h3>
                                </div>

                                <motion.div
                                    className="overflow-hidden"
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{
                                        height: isHovered ? "auto" : 0,
                                        opacity: isHovered ? 1 : 0,
                                    }}
                                    transition={transitionCurve}
                                >
                                    <p className="text-white/60 text-sm leading-relaxed mb-4">
                                        {card.description}
                                    </p>
                                    <div className="inline-flex items-center text-sm font-medium text-white">
                                        {card.cta}
                                    </div>
                                </motion.div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
};
