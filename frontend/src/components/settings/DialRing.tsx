import React from "react";
import { useSettingsStore, SETTINGS_CONFIG } from "@/store/settingsStore";
import { SettingItem } from "./SettingItem";
import { motion } from "framer-motion";

interface DialRingProps {
    rotation: number;
}

export const DialRing: React.FC<DialRingProps> = ({ rotation }) => {
    const { activeSettingIndex } = useSettingsStore();
    // Use the imported config directly
    const items = SETTINGS_CONFIG;

    return (
        <div className="relative w-[600px] h-[600px] rounded-full" style={{ perspective: "1200px" }}>
            {/* The Rotating Ring Container */}
            <motion.div
                className="w-full h-full absolute inset-0"
                style={{
                    transformStyle: "preserve-3d",
                }}
                animate={{
                    rotateZ: rotation,
                    rotateX: 10 + (Math.sin(rotation * 0.05) * 5), // Dynamic tilt based on rotation
                }}
                transition={{
                    duration: 0.65,
                    ease: [0.2, 0.8, 0.2, 1], // Mechanical ease
                }}
            >
                {/* Inner Decorative Ring (Static relative to rotation) */}
                <div className="absolute inset-4 rounded-full border border-white/5 opacity-50 pointer-events-none" />
                <div className="absolute inset-4 rounded-full border border-dashed border-white/5 opacity-20 animate-[spin_60s_linear_infinite] pointer-events-none" />

                {/* Render Items */}
                {items.map((item, index) => {
                    const itemRotation = index * 30;

                    return (
                        <SettingItem
                            key={item.key}
                            label={item.label}
                            isActive={index === activeSettingIndex}
                            rotation={itemRotation}
                        />
                    );
                })}
            </motion.div>
        </div>
    );
};
