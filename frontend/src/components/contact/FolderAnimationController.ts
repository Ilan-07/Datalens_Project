/**
 * FolderAnimationController
 * =========================
 * Spring-based state machine for 3D folder animation.
 * States: CLOSED → HOVER → OPEN → FORM_VISIBLE
 * Drives all visual parameters via RAF loop with spring physics.
 */

export type FolderState = 'CLOSED' | 'HOVER' | 'OPEN' | 'FORM_VISIBLE';

export interface FolderAnimValues {
    rotateX: number;           // deg, negative = tilt back
    translateZ: number;        // px
    paperOffsetY: number;      // px, papers peek upward
    paperSpreadX: number;      // px, papers spread on X
    glowIntensity: number;     // 0–1
    reflectionIntensity: number; // 0–1
    particleOpacity: number;   // 0–1
    beamOpacity: number;       // 0–1
    formOpacity: number;       // 0–1
    formTranslateY: number;    // px
    shadowDepth: number;       // 0–1
    chromaticPulse: number;    // 0–1
}

type AnimListener = (values: FolderAnimValues) => void;

const STATE_TARGETS: Record<FolderState, FolderAnimValues> = {
    CLOSED: {
        rotateX: -40,
        translateZ: 0,
        paperOffsetY: 0,
        paperSpreadX: 0,
        glowIntensity: 0.05,
        reflectionIntensity: 0.1,
        particleOpacity: 0,
        beamOpacity: 0,
        formOpacity: 0,
        formTranslateY: 20,
        shadowDepth: 0.3,
        chromaticPulse: 0,
    },
    HOVER: {
        rotateX: -50,
        translateZ: 12,
        paperOffsetY: -12,
        paperSpreadX: 0,
        glowIntensity: 0.3,
        reflectionIntensity: 0.35,
        particleOpacity: 0,
        beamOpacity: 0,
        formOpacity: 0,
        formTranslateY: 20,
        shadowDepth: 0.5,
        chromaticPulse: 0,
    },
    OPEN: {
        rotateX: -70,
        translateZ: 20,
        paperOffsetY: -20,
        paperSpreadX: 8,
        glowIntensity: 0.7,
        reflectionIntensity: 0.5,
        particleOpacity: 0.6,
        beamOpacity: 0.5,
        formOpacity: 0,
        formTranslateY: 20,
        shadowDepth: 0.8,
        chromaticPulse: 1,
    },
    FORM_VISIBLE: {
        rotateX: -70,
        translateZ: 20,
        paperOffsetY: -20,
        paperSpreadX: 8,
        glowIntensity: 0.5,
        reflectionIntensity: 0.4,
        particleOpacity: 0.4,
        beamOpacity: 0.3,
        formOpacity: 1,
        formTranslateY: 0,
        shadowDepth: 0.7,
        chromaticPulse: 0,
    },
};

// Spring physics constants
const SPRING_STIFFNESS = 120;
const SPRING_DAMPING = 14;

function springStep(
    current: number,
    target: number,
    velocity: number,
    dt: number,
): [number, number] {
    const displacement = current - target;
    const springForce = -SPRING_STIFFNESS * displacement;
    const dampingForce = -SPRING_DAMPING * velocity;
    const acceleration = springForce + dampingForce;
    const newVelocity = velocity + acceleration * dt;
    const newValue = current + newVelocity * dt;
    return [newValue, newVelocity];
}

export class FolderAnimationController {
    private state: FolderState = 'CLOSED';
    private current: FolderAnimValues = { ...STATE_TARGETS.CLOSED };
    private velocities: Record<keyof FolderAnimValues, number>;
    private target: FolderAnimValues = { ...STATE_TARGETS.CLOSED };
    private listeners = new Set<AnimListener>();
    private rafId: number | null = null;
    private lastTime = 0;
    private active = false;
    private morphTimeout: ReturnType<typeof setTimeout> | null = null;

    constructor() {
        const zeroVelocities = {} as Record<keyof FolderAnimValues, number>;
        for (const key of Object.keys(STATE_TARGETS.CLOSED) as (keyof FolderAnimValues)[]) {
            zeroVelocities[key] = 0;
        }
        this.velocities = zeroVelocities;
    }

    getState(): FolderState {
        return this.state;
    }

    getValues(): Readonly<FolderAnimValues> {
        return this.current;
    }

    subscribe(listener: AnimListener): () => void {
        this.listeners.add(listener);
        return () => { this.listeners.delete(listener); };
    }

    transitionTo(newState: FolderState) {
        if (this.state === newState) return;
        this.state = newState;
        this.target = { ...STATE_TARGETS[newState] };

        if (!this.active) {
            this.active = true;
            this.lastTime = performance.now();
            this.rafId = requestAnimationFrame(this.tick);
        }

        // Auto-transition OPEN → FORM_VISIBLE after morph delay
        if (newState === 'OPEN') {
            if (this.morphTimeout) clearTimeout(this.morphTimeout);
            this.morphTimeout = setTimeout(() => {
                this.transitionTo('FORM_VISIBLE');
            }, 800);
        }
    }

    private tick = (now: number) => {
        const dt = Math.min((now - this.lastTime) / 1000, 0.05); // cap at 50ms
        this.lastTime = now;

        let settled = true;
        const keys = Object.keys(this.target) as (keyof FolderAnimValues)[];

        for (const key of keys) {
            const [newVal, newVel] = springStep(
                this.current[key],
                this.target[key],
                this.velocities[key],
                dt,
            );
            this.current[key] = newVal;
            this.velocities[key] = newVel;

            // Check if settled
            if (Math.abs(newVal - this.target[key]) > 0.01 || Math.abs(newVel) > 0.01) {
                settled = false;
            }
        }

        this.notify();

        if (settled) {
            // Snap to target
            for (const key of keys) {
                this.current[key] = this.target[key];
                this.velocities[key] = 0;
            }
            this.notify();
            this.active = false;
        } else {
            this.rafId = requestAnimationFrame(this.tick);
        }
    };

    private notify() {
        this.listeners.forEach(fn => fn(this.current));
    }

    destroy() {
        if (this.rafId !== null) cancelAnimationFrame(this.rafId);
        if (this.morphTimeout) clearTimeout(this.morphTimeout);
        this.listeners.clear();
        this.active = false;
    }
}
