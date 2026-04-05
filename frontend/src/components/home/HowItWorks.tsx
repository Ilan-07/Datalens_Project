import React from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { GlitchText } from "@/engine/text/GlitchText";

// Define the content driven steps
const workflowSteps = [
    {
        step: "01",
        label: "THE PROCESS",
        title: "Upload Dataset",
        description: "Drop your CSV dataset into DataLens to begin analysis.",
        action: "Upload CSV",
    },
    {
        step: "02",
        label: "AI ENGINE",
        title: "Run AI Analysis",
        description: "Automated statistical exploration powered by AI models.",
        action: "Run Analysis",
    },
    {
        step: "03",
        label: "RESULT",
        title: "Get Insights",
        description: "Clear, actionable intelligence from your dataset.",
        action: "View Insights",
    },
];

export const HowItWorks: React.FC = () => {
    // Staggered entry animations
    const cardVariants = {
        hidden: { opacity: 0, y: 40 },
        visible: (customDelay: number) => ({
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.9,
                ease: [0.22, 1, 0.36, 1] as const, // cubic-bezier
                delay: customDelay,
            },
        }),
    };

    return (
        <section className="relative w-full border-t border-white/[0.04] bg-black text-white overflow-hidden py-16 sm:py-24 md:py-32">
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">

                {/* Header Section */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                    className="text-center mb-24"
                >
                    <h2 className="font-[family-name:var(--font-dm-serif)] text-[clamp(40px,5vw,72px)] leading-tight mb-4 tracking-tight">
                        How It Works
                    </h2>
                    <p className="font-sans text-[14px] md:text-[16px] text-white/65 mx-auto max-w-xl font-light tracking-wide">
                        Three steps to data-driven clarity.
                    </p>
                </motion.div>

                {/* 3-Column Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                    {workflowSteps.map((item, index) => (
                        <motion.div
                            key={item.step}
                            custom={index * 0.120} // 120ms stagger (0ms, 120ms, 240ms)
                            variants={cardVariants}
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true, margin: "-50px" }}
                            className="group relative flex flex-col justify-between p-8 sm:p-[48px] lg:p-[64px] min-h-[360px] sm:min-h-[420px] bg-[#000000] border border-white/[0.08] transition-all overflow-hidden cursor-default"
                            // The shared transition property defined below handles all CSS states over the duration specified
                            style={{
                                transition: "background 0.6s cubic-bezier(.22,1,.36,1), transform 0.5s cubic-bezier(.22,1,.36,1), box-shadow 0.6s cubic-bezier(.22,1,.36,1), border-color 0.4s ease, color 0.4s ease",
                            }}
                        // Tailwind hover states mirror the requested values
                        >
                            <div className="absolute inset-0 z-0 bg-transparent transition-all duration-[600ms] group-hover:bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.06),rgba(0,0,0,0.95))]" />

                            <div className="absolute inset-0 pointer-events-none z-[-1] opacity-0 group-hover:opacity-100 transition-opacity duration-700 shadow-[0_40px_120px_rgba(0,0,0,0.35)]" />

                                                        <style>{`
                .group:hover {
                    transform: translateY(-8px);
                    border-color: rgba(255,255,255,0.25);
                    box-shadow: 0 40px 120px rgba(0,0,0,0.35);
                }
              `}</style>

                            {/* Card Content - Z10 to stay above background gradient */}
                            <div className="relative z-10 flex flex-col items-start text-left h-full">

                                {item.step === "03" ? (
                                    <span className="font-sans text-[12px] uppercase tracking-[0.2em] mb-8 font-semibold text-[#FF3B30] drop-shadow-[0_0_8px_rgba(255,59,48,0.5)]">
                                        <GlitchText>{item.label}</GlitchText>
                                    </span>
                                ) : (
                                    <span className="font-sans text-[12px] uppercase tracking-[0.2em] mb-8 font-semibold text-white/50">
                                        {item.label}
                                    </span>
                                )}


                                <h3 className="font-[family-name:var(--font-dm-serif)] text-[clamp(32px,4vw,48px)] leading-none mb-4 text-white">
                                    {item.title}
                                </h3>

                                <span className="font-sans text-[14px] text-white/65 mb-6">
                                    Step {item.step}
                                </span>

                                <p className="font-sans text-[16px] leading-relaxed text-white opacity-75 font-light mb-12">
                                    {item.description}
                                </p>

                                {/* Grow div to push footer action to the bottom if description is short */}
                                <div className="flex-grow"></div>

                                <div className="flex items-center gap-3 font-semibold text-sm uppercase tracking-widest mt-auto">
                                    {item.step === "03" ? (
                                        <span className="text-[#FF3B30]">{item.action}</span>
                                    ) : (
                                        <span className="text-white">{item.action}</span>
                                    )}

                                    {/* Arrow movement interaction on hover */}
                                    <div className="transition-transform duration-[600ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-[6px]">
                                        {item.step === "03" ? (
                                            <ArrowRight className="w-4 h-4 text-[#FF3B30]" />
                                        ) : (
                                            <ArrowRight className="w-4 h-4 text-white" />
                                        )}
                                    </div>
                                </div>

                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};
