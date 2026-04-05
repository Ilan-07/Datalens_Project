/**
 * EngineStateStore
 * ================
 * Lightweight reactive store for all simulation/sandbox parameters.
 * No Redux, no Zustand — just direct mutation + subscriber pattern
 * matching existing stateManager conventions.
 * 
 * All subsystems read from and write to this singleton.
 */

export interface EngineParams {
    // Simulation
    energyIntensity: number;      // 0–1
    glitchFrequency: number;      // 0–1
    compressionDepth: number;     // 0–1
    scrollAcceleration: number;   // 0–1

    // Sandbox
    glowColor: [number, number, number]; // RGB 0–1
    lightIntensity: number;       // 0–1
    animationEasing: 'cubic' | 'spring' | 'linear' | 'elastic';
    compressionTiming: number;    // ms (200–1200)
    waveSpeed: number;            // 0–1
    glitchEnabled: boolean;

    // Lighting
    ambientIntensity: number;     // 0–1
    rimIntensity: number;         // 0–1
    fogDensity: number;           // 0–1
    hdrExposure: number;          // 0.5–2.0

    // Runtime (written by MetricsCollector, read by InsightEngine)
    currentFps: number;
    scrollSpeed: number;
    hoverFrequency: number;
    interactionDensity: number;
}

type ParamKey = keyof EngineParams;
type Listener = (params: EngineParams, changed: ParamKey[]) => void;

const DEFAULT_PARAMS: EngineParams = {
    energyIntensity: 0.5,
    glitchFrequency: 0.3,
    compressionDepth: 0.5,
    scrollAcceleration: 0.5,

    glowColor: [1.0, 0.0, 0.25],  // spider-red
    lightIntensity: 0.6,
    animationEasing: 'cubic',
    compressionTiming: 800,
    waveSpeed: 0.5,
    glitchEnabled: true,

    ambientIntensity: 0.3,
    rimIntensity: 0.4,
    fogDensity: 0.1,
    hdrExposure: 1.0,

    currentFps: 60,
    scrollSpeed: 0,
    hoverFrequency: 0,
    interactionDensity: 0,
};

class EngineStateStoreImpl {
    private params: EngineParams = { ...DEFAULT_PARAMS };
    private listeners: Set<Listener> = new Set();

    getState(): Readonly<EngineParams> {
        return this.params;
    }

    get<K extends ParamKey>(key: K): EngineParams[K] {
        return this.params[key];
    }

    set(updates: Partial<EngineParams>) {
        const changed: ParamKey[] = [];
        for (const key of Object.keys(updates) as ParamKey[]) {
            const newVal = updates[key];
            if (newVal !== undefined && this.params[key] !== newVal) {
                (this.params as unknown as Record<string, unknown>)[key] = newVal;
                changed.push(key);
            }
        }
        if (changed.length > 0) {
            this.notify(changed);
        }
    }

    subscribe(listener: Listener): () => void {
        this.listeners.add(listener);
        return () => { this.listeners.delete(listener); };
    }

    reset() {
        this.params = { ...DEFAULT_PARAMS };
        this.notify(Object.keys(DEFAULT_PARAMS) as ParamKey[]);
    }

    private notify(changed: ParamKey[]) {
        this.listeners.forEach(fn => fn(this.params, changed));
    }
}

export const engineStateStore = new EngineStateStoreImpl();
