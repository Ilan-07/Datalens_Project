/**
 * MultiverseStateManager
 * =======================
 * Global 3-state machine for the Multiverse Interaction Engine.
 * 
 * States:
 *   STABLE        → Black base, deep red accents, minimal glow
 *   ENERGY_BUILD  → Hover/focus: gradient intensifies, purple+cyan undertone
 *   MULTIVERSE_TEAR → Analytics threshold / major action: glitch burst, ripple, flash
 */

export type MultiverseState = 'STABLE' | 'ENERGY_BUILD' | 'MULTIVERSE_TEAR';

export interface StateTransition {
    from: MultiverseState;
    to: MultiverseState;
    timestamp: number;
    trigger: string;
}

export type StateListener = (
    state: MultiverseState,
    transition: StateTransition
) => void;

// ── Visual parameters per state ──────────────────────────────────────────
export interface StateVisuals {
    glitchIntensity: number;      // 0.0–1.0
    gradientIntensity: number;    // 0.0–1.0
    chromaticOffset: number;      // px
    noiseOpacity: number;         // 0.0–1.0
    particleSpeed: number;        // multiplier
    glowRadius: number;           // px
    accentHue: number;            // 0–360
    pulseSpeed: number;           // seconds
}

const STATE_VISUALS: Record<MultiverseState, StateVisuals> = {
    STABLE: {
        glitchIntensity: 0.0,
        gradientIntensity: 0.3,
        chromaticOffset: 0,
        noiseOpacity: 0.04,
        particleSpeed: 1.0,
        glowRadius: 200,
        accentHue: 0,          // red
        pulseSpeed: 4.0,
    },
    ENERGY_BUILD: {
        glitchIntensity: 0.15,
        gradientIntensity: 0.6,
        chromaticOffset: 1.5,
        noiseOpacity: 0.06,
        particleSpeed: 1.8,
        glowRadius: 350,
        accentHue: 280,        // purple shift
        pulseSpeed: 2.0,
    },
    MULTIVERSE_TEAR: {
        glitchIntensity: 0.8,
        gradientIntensity: 1.0,
        chromaticOffset: 4,
        noiseOpacity: 0.12,
        particleSpeed: 3.0,
        glowRadius: 600,
        accentHue: 190,        // cyan flash
        pulseSpeed: 0.3,
    },
};

// ── Easing ───────────────────────────────────────────────────────────────
function lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
}

function lerpVisuals(a: StateVisuals, b: StateVisuals, t: number): StateVisuals {
    return {
        glitchIntensity: lerp(a.glitchIntensity, b.glitchIntensity, t),
        gradientIntensity: lerp(a.gradientIntensity, b.gradientIntensity, t),
        chromaticOffset: lerp(a.chromaticOffset, b.chromaticOffset, t),
        noiseOpacity: lerp(a.noiseOpacity, b.noiseOpacity, t),
        particleSpeed: lerp(a.particleSpeed, b.particleSpeed, t),
        glowRadius: lerp(a.glowRadius, b.glowRadius, t),
        accentHue: lerp(a.accentHue, b.accentHue, t),
        pulseSpeed: lerp(a.pulseSpeed, b.pulseSpeed, t),
    };
}

// ── Transition durations (ms) ────────────────────────────────────────────
const TRANSITION_DURATIONS: Record<string, number> = {
    'STABLE→ENERGY_BUILD': 400,
    'ENERGY_BUILD→STABLE': 600,
    'STABLE→MULTIVERSE_TEAR': 150,
    'ENERGY_BUILD→MULTIVERSE_TEAR': 100,
    'MULTIVERSE_TEAR→STABLE': 1200,
    'MULTIVERSE_TEAR→ENERGY_BUILD': 800,
};

class MultiverseStateManager {
    private state: MultiverseState = 'STABLE';
    private listeners: Set<StateListener> = new Set();
    private currentVisuals: StateVisuals = { ...STATE_VISUALS.STABLE };
    private targetVisuals: StateVisuals = { ...STATE_VISUALS.STABLE };
    private transitionStart = 0;
    private transitionDuration = 0;
    private startVisuals: StateVisuals = { ...STATE_VISUALS.STABLE };
    private tearTimeout: ReturnType<typeof setTimeout> | null = null;
    private _enabled = true;

    // ── Public API ────────────────────────────────────────────────────────
    getState(): MultiverseState {
        return this.state;
    }

    getVisuals(): StateVisuals {
        return this.currentVisuals;
    }

    isEnabled(): boolean {
        return this._enabled;
    }

    setEnabled(enabled: boolean) {
        this._enabled = enabled;
        if (!enabled) {
            this.state = 'STABLE';
            this.currentVisuals = { ...STATE_VISUALS.STABLE };
        }
    }

    on(listener: StateListener) {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    // ── State Transitions ─────────────────────────────────────────────────
    transitionTo(newState: MultiverseState, trigger = 'manual') {
        if (!this._enabled || this.state === newState) return;

        const transition: StateTransition = {
            from: this.state,
            to: newState,
            timestamp: performance.now(),
            trigger,
        };

        const key = `${this.state}→${newState}`;
        this.transitionDuration = TRANSITION_DURATIONS[key] || 500;
        this.transitionStart = performance.now();
        this.startVisuals = { ...this.currentVisuals };
        this.targetVisuals = { ...STATE_VISUALS[newState] };

        this.state = newState;

        // Notify listeners
        this.listeners.forEach((fn) => fn(newState, transition));

        // Auto-return from MULTIVERSE_TEAR
        if (newState === 'MULTIVERSE_TEAR') {
            if (this.tearTimeout) clearTimeout(this.tearTimeout);
            this.tearTimeout = setTimeout(() => {
                this.transitionTo('STABLE', 'tear_decay');
            }, 1500);
        }
    }

    // ── Called every frame by MultiverseEngine ─────────────────────────────
    tick(now: number) {
        if (!this._enabled) return;

        const elapsed = now - this.transitionStart;
        const t = Math.min(elapsed / (this.transitionDuration || 1), 1);
        // Ease-out cubic
        const eased = 1 - Math.pow(1 - t, 3);
        this.currentVisuals = lerpVisuals(this.startVisuals, this.targetVisuals, eased);
    }

    // ── Convenience triggers ──────────────────────────────────────────────
    triggerEnergyBuild(trigger = 'interaction') {
        if (this.state === 'MULTIVERSE_TEAR') return;
        this.transitionTo('ENERGY_BUILD', trigger);
    }

    triggerStable(trigger = 'idle') {
        if (this.state === 'MULTIVERSE_TEAR') return;
        this.transitionTo('STABLE', trigger);
    }

    triggerTear(trigger = 'analytics') {
        this.transitionTo('MULTIVERSE_TEAR', trigger);
    }

    destroy() {
        this.listeners.clear();
        if (this.tearTimeout) clearTimeout(this.tearTimeout);
    }
}

// ── Singleton ────────────────────────────────────────────────────────────
export const stateManager = new MultiverseStateManager();
export default MultiverseStateManager;
