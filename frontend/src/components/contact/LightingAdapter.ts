/**
 * LightingAdapter
 * ===============
 * Read-only bridge between GlobalLighting and the folder component.
 * Derives folder-specific values from the global light state.
 * Never mutates global lighting — only reads and adapts.
 */

import { globalLighting, type LightingState } from '@/engine/lighting/GlobalLighting';

export interface FolderLighting {
    shadowAngle: number;       // degrees, derived from rimDirection
    shadowIntensity: number;   // 0–1
    interiorWarmth: number;    // 0–1, warm glow inside folder
    rimHighlightX: number;     // -1 to 1
    rimHighlightY: number;     // -1 to 1
    ambientBrightness: number; // 0–1
    exposure: number;          // HDR multiplier
}

type FolderLightingListener = (lighting: FolderLighting) => void;

function deriveFolderLighting(ls: LightingState, foldRotation: number): FolderLighting {
    const [rx, ry] = ls.rimDirection;
    const angle = Math.atan2(ry, rx) * (180 / Math.PI);

    // Interior warmth increases as folder opens (rotation more negative)
    const openness = Math.max(0, Math.min(1, (Math.abs(foldRotation) - 40) / 30));

    return {
        shadowAngle: angle,
        shadowIntensity: ls.rimIntensity * 0.8,
        interiorWarmth: openness * ls.hdrExposure * 0.6,
        rimHighlightX: rx,
        rimHighlightY: ry,
        ambientBrightness: ls.ambientIntensity,
        exposure: ls.hdrExposure,
    };
}

export class LightingAdapter {
    private listeners = new Set<FolderLightingListener>();
    private currentRotation = -40;
    private unsubGlobal: (() => void) | null = null;
    private current: FolderLighting;

    constructor() {
        globalLighting.init();
        this.current = deriveFolderLighting(globalLighting.getState(), this.currentRotation);
    }

    start(): void {
        this.unsubGlobal = globalLighting.subscribe((ls) => {
            this.current = deriveFolderLighting(ls, this.currentRotation);
            this.notify();
        });
    }

    /** Call when folder rotation changes to recompute interior warmth */
    updateRotation(rotateX: number): void {
        this.currentRotation = rotateX;
        this.current = deriveFolderLighting(globalLighting.getState(), rotateX);
        this.notify();
    }

    getState(): Readonly<FolderLighting> {
        return this.current;
    }

    subscribe(listener: FolderLightingListener): () => void {
        this.listeners.add(listener);
        return () => { this.listeners.delete(listener); };
    }

    private notify(): void {
        this.listeners.forEach(fn => fn(this.current));
    }

    destroy(): void {
        this.unsubGlobal?.();
        this.listeners.clear();
    }
}
