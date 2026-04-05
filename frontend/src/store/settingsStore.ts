import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type SettingKey =
    | "theme"
    | "graphType"
    | "density"
    | "speed"
    | "grid"
    | "glow"
    | "axis"
    | "depth"
    | "tooltip"
    | "simulation"
    | "contrast"
    | "profile";

export interface SettingsState {
    isOpen: boolean;
    activeSettingIndex: number;

    // Settings Values
    theme: "monochrome" | "cyan" | "violet" | "amber" | "custom";
    graphType: "line" | "bar" | "area" | "scatter" | "radar" | "donut";
    density: "minimal" | "standard" | "detailed" | "raw";
    speed: "slow" | "balanced" | "fast";
    grid: "hidden" | "subtle" | "strong";
    glow: "none" | "soft" | "medium" | "cinematic";
    axis: "minimal" | "technical" | "bold";
    depth: "flat" | "soft_gradient" | "dimensional" | "ambient_particles";
    tooltip: "simple" | "analytical" | "full";
    simulation: "static" | "live" | "forecast";
    contrast: "standard" | "high" | "ultra";
    profile: "analyst" | "executive" | "developer" | "researcher";

    // Actions
    toggleSettings: (isOpen?: boolean) => void;
    setSetting: (key: SettingKey, value: any) => void;
    setActiveSettingIndex: (index: number) => void;
}

export const useSettingsStore = create<SettingsState>()(
    persist(
        (set) => ({
            isOpen: false,
            activeSettingIndex: 0,

            // Default Values
            theme: "monochrome",
            graphType: "line",
            density: "standard",
            speed: "balanced",
            grid: "subtle",
            glow: "medium",
            axis: "technical",
            depth: "dimensional",
            tooltip: "analytical",
            simulation: "static",
            contrast: "standard",
            profile: "analyst",

            toggleSettings: (isOpen) => set((state) => ({ isOpen: isOpen ?? !state.isOpen })),
            setSetting: (key, value) => set((state) => ({ ...state, [key]: value })),
            setActiveSettingIndex: (index) => set({ activeSettingIndex: index }),
        }),
        {
            name: "datalens-settings-storage",
            storage: createJSONStorage(() => localStorage),
            // Exclude transient UI state — only persist actual preference values
            partialize: (state) => ({
                theme: state.theme,
                graphType: state.graphType,
                density: state.density,
                speed: state.speed,
                grid: state.grid,
                glow: state.glow,
                axis: state.axis,
                depth: state.depth,
                tooltip: state.tooltip,
                simulation: state.simulation,
                contrast: state.contrast,
                profile: state.profile,
            }),
        }
    )
);

export const SETTINGS_CONFIG: { key: SettingKey; label: string; options: string[] }[] = [
    { key: "theme", label: "Graph Color Theme", options: ["monochrome", "cyan", "violet", "amber", "custom"] },
    { key: "graphType", label: "Graph Type Selector", options: ["line", "bar", "area", "scatter", "radar", "donut"] },
    { key: "density", label: "Data Density Level", options: ["minimal", "standard", "detailed", "raw"] },
    { key: "speed", label: "Animation Speed", options: ["slow", "balanced", "fast"] },
    { key: "grid", label: "Grid Visibility", options: ["hidden", "subtle", "strong"] },
    { key: "glow", label: "Chart Glow Intensity", options: ["none", "soft", "medium", "cinematic"] },
    { key: "axis", label: "Axis Style", options: ["minimal", "technical", "bold"] },
    { key: "depth", label: "Background Depth", options: ["flat", "soft_gradient", "dimensional", "ambient_particles"] },
    { key: "tooltip", label: "Tooltip Detail", options: ["simple", "analytical", "full"] },
    { key: "simulation", label: "Data Simulation", options: ["static", "live", "forecast"] },
    { key: "contrast", label: "Accessibility Contrast", options: ["standard", "high", "ultra"] },
    { key: "profile", label: "User Profile Mode", options: ["analyst", "executive", "developer", "researcher"] },
];
