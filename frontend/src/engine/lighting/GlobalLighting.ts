/**
 * GlobalLighting
 * ==============
 * Singleton managing shared lighting state across the entire app.
 * Subscribes to EngineStateStore to react to simulation/sandbox changes.
 * Brightens on energy burst, dims on depth compression.
 */

import { engineStateStore } from '../simulation/EngineStateStore';
import { simulationBus } from '../simulation/SimulationBus';

export interface LightingState {
    ambientColor: [number, number, number];
    ambientIntensity: number;
    rimColor: [number, number, number];
    rimIntensity: number;
    rimDirection: [number, number, number];
    pointGlowColor: [number, number, number];
    pointGlowIntensity: number;
    pointGlowPosition: [number, number, number];
    fogColor: [number, number, number];
    fogDensity: number;
    hdrExposure: number;
    toneMapping: 'ACESFilmic' | 'Reinhard' | 'Linear';
}

type LightingListener = (state: LightingState) => void;

const DEFAULT_LIGHTING: LightingState = {
    ambientColor: [0.08, 0.06, 0.1],        // Deep purple-black
    ambientIntensity: 0.3,
    rimColor: [0.9, 0.1, 0.2],              // Spider-red rim
    rimIntensity: 0.4,
    rimDirection: [1.0, 0.5, -0.5],
    pointGlowColor: [0.9, 0.1, 0.2],        // Behind nav glow
    pointGlowIntensity: 0.3,
    pointGlowPosition: [0.0, 3.0, -2.0],
    fogColor: [0.02, 0.01, 0.04],
    fogDensity: 0.1,
    hdrExposure: 1.0,
    toneMapping: 'ACESFilmic',
};

class GlobalLightingImpl {
    private state: LightingState = { ...DEFAULT_LIGHTING };
    private listeners: Set<LightingListener> = new Set();
    private unsubStore: (() => void) | null = null;
    private unsubBus: (() => void) | null = null;
    private initialized = false;

    init() {
        if (this.initialized) return;
        this.initialized = true;

        // React to EngineStateStore changes
        this.unsubStore = engineStateStore.subscribe((params, changed) => {
            let dirty = false;

            if (changed.includes('ambientIntensity')) {
                this.state.ambientIntensity = params.ambientIntensity;
                dirty = true;
            }
            if (changed.includes('rimIntensity')) {
                this.state.rimIntensity = params.rimIntensity;
                dirty = true;
            }
            if (changed.includes('fogDensity')) {
                this.state.fogDensity = params.fogDensity;
                dirty = true;
            }
            if (changed.includes('hdrExposure')) {
                this.state.hdrExposure = params.hdrExposure;
                dirty = true;
            }
            if (changed.includes('lightIntensity')) {
                // Light intensity from sandbox affects point glow
                this.state.pointGlowIntensity = params.lightIntensity * 0.5;
                dirty = true;
            }
            if (changed.includes('glowColor')) {
                this.state.pointGlowColor = [...params.glowColor];
                this.state.rimColor = [...params.glowColor];
                dirty = true;
            }

            if (dirty) this.notify();
        });

        // React to simulation events
        this.unsubBus = simulationBus.onAny((event) => {
            switch (event) {
                case 'ENERGY_PULSE':
                    // Brighten slightly
                    this.state.ambientIntensity = Math.min(this.state.ambientIntensity + 0.15, 1.0);
                    this.state.pointGlowIntensity = Math.min(this.state.pointGlowIntensity + 0.2, 1.0);
                    this.notify();
                    // Decay
                    setTimeout(() => {
                        this.state.ambientIntensity = engineStateStore.get('ambientIntensity');
                        this.state.pointGlowIntensity = engineStateStore.get('lightIntensity') * 0.5;
                        this.notify();
                    }, 600);
                    break;

                case 'DEPTH_PULSE':
                    // Dim slightly
                    this.state.ambientIntensity = Math.max(this.state.ambientIntensity - 0.1, 0.05);
                    this.state.fogDensity = Math.min(this.state.fogDensity + 0.05, 0.4);
                    this.notify();
                    setTimeout(() => {
                        this.state.ambientIntensity = engineStateStore.get('ambientIntensity');
                        this.state.fogDensity = engineStateStore.get('fogDensity');
                        this.notify();
                    }, 800);
                    break;

                case 'RESET':
                    this.state = { ...DEFAULT_LIGHTING };
                    this.notify();
                    break;
            }
        });
    }

    getState(): Readonly<LightingState> {
        return this.state;
    }

    subscribe(listener: LightingListener): () => void {
        this.listeners.add(listener);
        return () => { this.listeners.delete(listener); };
    }

    private notify() {
        this.listeners.forEach(fn => fn(this.state));
    }

    destroy() {
        this.unsubStore?.();
        this.unsubBus?.();
        this.listeners.clear();
        this.initialized = false;
    }
}

export const globalLighting = new GlobalLightingImpl();
