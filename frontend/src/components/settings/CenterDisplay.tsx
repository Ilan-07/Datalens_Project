import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSettingsStore, SETTINGS_CONFIG, SettingKey } from "@/store/settingsStore";
import { GlitchText } from "@/engine/text/GlitchText";
import { cn } from "@/lib/utils";
import { ChevronRight, ChevronLeft } from "lucide-react";

export const CenterDisplay: React.FC = () => {
    const { activeSettingIndex, ...state } = useSettingsStore();

    // Guard: Ensure activeSettingIndex is within bounds (should rely on store consistency, but safe)
    const normalizedIndex = Math.max(0, Math.min(activeSettingIndex, SETTINGS_CONFIG.length - 1));
    const activeSetting = SETTINGS_CONFIG[normalizedIndex];

    // Get current value dynamically
    const currentValue = (state as any)[activeSetting.key];

    return (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 flex flex-col items-center justify-center text-center z-50 pointer-events-none">
            {/* Glass Background */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-xl rounded-full border border-white/10 shadow-[0_0_60px_rgba(0,0,0,0.9)]" />

            {/* Cyan Glow Pulse */}
            <div className="absolute inset-0 rounded-full border border-cyan/10 opacity-30 animate-pulse pointer-events-none" />

            {/* Content */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeSetting.key}
                    initial={{ opacity: 0, scale: 0.95, filter: "blur(4px)" }}
                    animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                    exit={{ opacity: 0, scale: 0.95, filter: "blur(4px)" }}
                    transition={{ duration: 0.35, ease: [0.2, 0.8, 0.2, 1] }}
                    className="relative z-10 flex flex-col items-center gap-6 w-full px-8"
                >
                    {/* Setting Label */}
                    <h2 className="text-2xl font-heading font-black text-white italic uppercase tracking-widest leading-tight drop-shadow-md">
                        {activeSetting.label}
                    </h2>

                    {/* Divider */}
                    <div className="h-[2px] w-12 bg-spider-red/50 shadow-[0_0_8px_#B11226]" />

                    {/* Value Selector UI (Visual only here, logic in parent interaction) */}
                    <div className="flex items-center gap-4 text-cyan font-mono text-xs uppercase tracking-[0.2em]">
                        <ChevronLeft size={14} className="opacity-40" />
                        <span className="bg-cyan/10 border border-cyan/20 px-3 py-1 rounded min-w-[100px] text-center shadow-[0_0_10px_rgba(0,240,255,0.2)]">
                            <GlitchText>{String(currentValue).toUpperCase()}</GlitchText>
                        </span>
                        <ChevronRight size={14} className="opacity-40" />
                    </div>
                </motion.div>
            </AnimatePresence>

            {/* Index Counter */}
            <div className="absolute bottom-12 text-[9px] text-dim/30 font-mono tracking-widest">
                {String(normalizedIndex + 1).padStart(2, '0')} / {SETTINGS_CONFIG.length}
            </div>
        </div>
    );
};
