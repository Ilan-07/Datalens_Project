import React, {
    createContext,
    useContext,
    useEffect,
    useRef,
    useState,
    useCallback,
} from "react";
import { MultiverseEngine } from "./MultiverseEngine";
import { TextGlitchController } from "./text/TextGlitchController";

import { AnalyticsVisualBridge, AnalyticsMetrics } from "./AnalyticsVisualBridge";
import {
    stateManager,
    MultiverseState,
    StateVisuals,
} from "./MultiverseStateManager";
import { useSettingsStore } from "@/store/settingsStore";

// ── Context Types ───────────────────────────────────────────────────────
interface MultiverseContextValue {
    state: MultiverseState;
    visuals: StateVisuals;
    cinematicMode: boolean;
    fps: number;
    glitchSupported: boolean;
    triggerEnergyBuild: (trigger?: string) => void;
    triggerStable: (trigger?: string) => void;
    triggerTear: (trigger?: string) => void;
    setCinematicMode: (enabled: boolean) => void;
    evaluateAnalytics: (metrics: AnalyticsMetrics) => void;
}

const MultiverseContext = createContext<MultiverseContextValue | null>(null);

// ── Hook ────────────────────────────────────────────────────────────────
export function useMultiverse(): MultiverseContextValue {
    const ctx = useContext(MultiverseContext);
    if (!ctx) {
        // Return safe no-ops for SSR / outside provider
        return {
            state: "STABLE",
            visuals: stateManager.getVisuals(),
            cinematicMode: false,
            fps: 60,
            glitchSupported: false,
            triggerEnergyBuild: () => { },
            triggerStable: () => { },
            triggerTear: () => { },
            setCinematicMode: () => { },
            evaluateAnalytics: () => { },
        };
    }
    return ctx;
}

// ── Provider ────────────────────────────────────────────────────────────
export const MultiverseProvider: React.FC<{ children: React.ReactNode }> = ({
    children,
}) => {
    const engineRef = useRef<MultiverseEngine | null>(null);
    const bridgeRef = useRef<AnalyticsVisualBridge>(new AnalyticsVisualBridge());
    const containerRef = useRef<HTMLDivElement>(null);

    const [state, setState] = useState<MultiverseState>("STABLE");
    const [visuals, setVisuals] = useState<StateVisuals>(stateManager.getVisuals());
    const [cinematicMode, setCinematicModeState] = useState(true);
    const [fps, setFps] = useState(60);
    const [glitchSupported, setGlitchSupported] = useState(true);

    // Settings Store Integration
    const { glow, contrast, simulation } = useSettingsStore();

    // Compute dynamic styles based on settings
    const containerStyle: React.CSSProperties = {
        filter: [
            contrast === "high" ? "contrast(1.2)" : contrast === "ultra" ? "contrast(1.4) saturate(1.2)" : "none",
            glow === "medium" ? "drop-shadow(0 0 20px rgba(177,18,38,0.15))" : glow === "cinematic" ? "drop-shadow(0 0 40px rgba(177,18,38,0.3))" : "none",
        ].filter(f => f !== "none").join(" ")
    };

    // ── Init engine on mount ──────────────────────────────────────────────
    useEffect(() => {
        if (!containerRef.current || typeof window === "undefined") return;

        const engine = new MultiverseEngine();
        engine.init(containerRef.current);
        engineRef.current = engine;

        // Init text glitch engine singleton
        TextGlitchController.getInstance();


        setCinematicModeState(engine.getCinematicMode());
        setGlitchSupported(engine.getGlitchSupported());

        // Subscribe to state changes
        const unsub = stateManager.on((newState) => {
            setState(newState);
        });

        // Poll visuals + FPS at 10Hz (not every frame — React can't keep up)
        const interval = setInterval(() => {
            setVisuals({ ...stateManager.getVisuals() });
            if (engineRef.current) {
                setFps(engineRef.current.getFps());
            }
        }, 100);

        return () => {
            unsub();
            clearInterval(interval);
            engine.destroy();
            engineRef.current = null;
        };
    }, []);

    // Effect for Simulation Mode (Settings)
    useEffect(() => {
        if (simulation === "live") {
            // Simulate "Live" activity by triggering energy builds occasionally
            const timer = setInterval(() => {
                if (Math.random() > 0.7) stateManager.triggerEnergyBuild("simulation");
                else stateManager.triggerStable("simulation");
            }, 5000);
            return () => clearInterval(timer);
        }
    }, [simulation]);

    // ── Actions ───────────────────────────────────────────────────────────
    const triggerEnergyBuild = useCallback((trigger = "interaction") => {
        stateManager.triggerEnergyBuild(trigger);
    }, []);

    const triggerStable = useCallback((trigger = "idle") => {
        stateManager.triggerStable(trigger);
    }, []);

    const triggerTear = useCallback((trigger = "manual") => {
        stateManager.triggerTear(trigger);
    }, []);

    const setCinematicMode = useCallback((enabled: boolean) => {
        engineRef.current?.setCinematicMode(enabled);
        setCinematicModeState(enabled);
    }, []);

    const evaluateAnalytics = useCallback((metrics: AnalyticsMetrics) => {
        bridgeRef.current.evaluate(metrics);
    }, []);

    // ── Context value ─────────────────────────────────────────────────────
    const value: MultiverseContextValue = {
        state,
        visuals,
        cinematicMode,
        fps,
        glitchSupported,
        triggerEnergyBuild,
        triggerStable,
        triggerTear,
        setCinematicMode,
        evaluateAnalytics,
    };

    return (
        <MultiverseContext.Provider value={value}>
            <div ref={containerRef} className="relative min-h-screen transition-all duration-700 ease-in-out" style={containerStyle}>
                {/* Noise overlay (CSS-based, always present) */}
                <div
                    className="fixed inset-0 pointer-events-none z-[3]"
                    style={{
                        backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")',
                        opacity: cinematicMode ? visuals.noiseOpacity : 0.03,
                        mixBlendMode: "overlay",
                    }}
                />
                {/* Content layer */}
                <div className="relative z-[5]">{children}</div>
            </div>
        </MultiverseContext.Provider>
    );
};
