import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useSettingsStore } from "@/store/settingsStore";
import { SettingsDial } from "./SettingsDial";
import { X, Settings2, ArrowLeft } from "lucide-react";
import { GlitchText } from "@/engine/text/GlitchText";

export const SettingsDialOverlay: React.FC = () => {
    const { isOpen, toggleSettings } = useSettingsStore();

    // Prevent body scroll when open & Handle Escape
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape" && isOpen) {
                toggleSettings(false);
            }
        };

        if (isOpen) {
            document.body.style.overflow = "hidden";
            window.addEventListener("keydown", handleKeyDown);
        } else {
            document.body.style.overflow = "auto";
        }
        return () => {
            document.body.style.overflow = "auto";
            window.removeEventListener("keydown", handleKeyDown);
        }

    }, [isOpen, toggleSettings]);

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5, ease: "easeInOut" }}
                    className="fixed inset-0 w-screen h-screen z-[9999] flex items-center justify-center bg-black/95 backdrop-blur-md overflow-hidden"
                >
                    {/* Vignette & Spotlight */}
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(50,50,50,0.1)_0%,rgba(0,0,0,0.8)_80%)] pointer-events-none" />

                    {/* Close Button or Esc Hint */}
                    <button
                        onClick={() => toggleSettings(false)}
                        className="absolute top-8 right-8 text-dim hover:text-white transition-colors z-50 flex items-center gap-2 group"
                    >
                        <span className="text-[9px] uppercase tracking-[0.3em] opacity-0 group-hover:opacity-100 transition-opacity">Close Interface [ESC]</span>
                        <X size={24} />
                    </button>

                    <div className="absolute top-8 left-8 flex items-center gap-3 opacity-50">
                        <Settings2 className="text-spider-red" size={20} />
                        <span className="text-[10px] uppercase tracking-[0.4em] font-black">
                            <GlitchText>System_Configuration</GlitchText>
                        </span>
                    </div>

                    {/* The Dial itself */}
                    <SettingsDial />

                    {/* Back to Dashboard Button (Requested by User) */}
                    <motion.button
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        onClick={() => toggleSettings(false)}
                        className="absolute bottom-12 flex items-center gap-4 px-8 py-3 bg-white/5 border border-white/10 hover:bg-spider-red/20 hover:border-spider-red/50 transition-all group rounded-sm backdrop-blur-sm"
                    >
                        <ArrowLeft size={16} className="text-dim group-hover:text-spider-red transition-colors group-hover:-translate-x-1" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Back to Dashboard</span>
                        <div className="w-1 h-1 bg-spider-red opacity-0 group-hover:opacity-100 transition-opacity" />
                    </motion.button>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
};
