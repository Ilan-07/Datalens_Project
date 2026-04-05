import React, { useEffect, useState, useCallback, useRef } from "react";
import { useSettingsStore, SETTINGS_CONFIG } from "@/store/settingsStore";
import { DialRing } from "./DialRing";
import { CenterDisplay } from "./CenterDisplay";
import { useMultiverse } from "@/engine/MultiverseProvider";

export const SettingsDial: React.FC = () => {
    const { activeSettingIndex, setActiveSettingIndex, setSetting, ...storeValues } = useSettingsStore();
    const { triggerEnergyBuild } = useMultiverse(); // For sound/haptics hook (if implemented)

    // Derived rotation state from active index
    // index 0 -> 0 deg
    // index 1 -> -30 deg
    const rotation = activeSettingIndex * -30;

    // Use a ref to throttle/debounce scroll
    const lastScrollTime = useRef(0);
    const scrollThreshold = 40; // Pixel delta threshold for a "tick"
    const accumulatedDelta = useRef(0);

    const handleWheel = useCallback((e: WheelEvent) => {
        // Prevent default page scroll
        e.preventDefault();
        e.stopPropagation();

        const now = Date.now();
        // Cooldown between ticks to feel "mechanical" (200ms)
        if (now - lastScrollTime.current < 150) return;

        accumulatedDelta.current += e.deltaY;

        if (Math.abs(accumulatedDelta.current) > scrollThreshold) {
            const direction = Math.sign(accumulatedDelta.current);

            // direction > 0 = scroll down = next item
            // direction < 0 = scroll up = prev item

            let nextIndex = activeSettingIndex + direction;

            // Loop around? Or clamp? 
            // Clamp is more "mechanical limit". Loop is more "infinite dial".
            // Let's Clamp for now to match SETTINGS_CONFIG limits.
            nextIndex = Math.max(0, Math.min(nextIndex, SETTINGS_CONFIG.length - 1));

            if (nextIndex !== activeSettingIndex) {
                setActiveSettingIndex(nextIndex);
                triggerEnergyBuild("dial_tick"); // Simulated haptic trigger
            }

            // Reset
            accumulatedDelta.current = 0;
            lastScrollTime.current = now;
        }
    }, [activeSettingIndex, setActiveSettingIndex, triggerEnergyBuild]);

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        const activeSetting = SETTINGS_CONFIG[activeSettingIndex];
        const options = activeSetting.options;
        // @ts-ignore
        const currentValue = storeValues[activeSetting.key];
        const currentIndex = options.indexOf(String(currentValue));

        if (e.key === "ArrowUp") {
            const nextIndex = Math.max(0, activeSettingIndex - 1);
            setActiveSettingIndex(nextIndex);
        } else if (e.key === "ArrowDown") {
            const nextIndex = Math.min(SETTINGS_CONFIG.length - 1, activeSettingIndex + 1);
            setActiveSettingIndex(nextIndex);
        } else if (e.key === "ArrowLeft") {
            // Cyclical Option Selection
            const nextOptionIndex = (currentIndex - 1 + options.length) % options.length;
            setSetting(activeSetting.key, options[nextOptionIndex]);
        } else if (e.key === "ArrowRight") {
            const nextOptionIndex = (currentIndex + 1) % options.length;
            setSetting(activeSetting.key, options[nextOptionIndex]);
        }
    }, [activeSettingIndex, setActiveSettingIndex, setSetting, storeValues]);


    useEffect(() => {
        // Attach global listeners since this component is in a full-screen overlay
        window.addEventListener("wheel", handleWheel, { passive: false });
        window.addEventListener("keydown", handleKeyDown);

        return () => {
            window.removeEventListener("wheel", handleWheel);
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [handleWheel, handleKeyDown]);


    return (
        <div className="relative flex items-center justify-center w-[600px] h-[600px] mx-auto">
            {/* The Ring */}
            <DialRing rotation={rotation} />

            {/* Center Display (Static Position, Dynamic Content) */}
            <CenterDisplay />

            {/* Helper Text */}
            <div className="absolute -bottom-12 text-dim/40 font-mono text-[9px] uppercase tracking-[0.3em] pointer-events-none animate-pulse">
                Scroll to Rotate // Arrow Keys to Adjust
            </div>
        </div>
    );
};
