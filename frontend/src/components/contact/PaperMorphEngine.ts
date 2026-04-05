/**
 * PaperMorphEngine
 * ================
 * Drives the animation of paper rectangles morphing into form fields.
 * Uses RAF with spring physics for smooth shape interpolation.
 * Each paper has: width, height, borderRadius, opacity, y-offset.
 */

export interface PaperMorphState {
    /** 0 = paper shape, 1 = form field shape */
    progress: number;
    papers: PaperFieldState[];
}

export interface PaperFieldState {
    width: number;      // percentage of container
    height: number;     // px
    borderRadius: number; // px
    opacity: number;
    translateY: number; // px
    label: string;
}

type MorphListener = (state: PaperMorphState) => void;

const PAPER_SHAPES: PaperFieldState[] = [
    { width: 85, height: 36, borderRadius: 1, opacity: 0.9, translateY: 0, label: 'Name' },
    { width: 85, height: 36, borderRadius: 1, opacity: 0.85, translateY: 0, label: 'Email' },
    { width: 85, height: 80, borderRadius: 1, opacity: 0.8, translateY: 0, label: 'Message' },
];

const FIELD_SHAPES: PaperFieldState[] = [
    { width: 100, height: 48, borderRadius: 6, opacity: 1, translateY: 0, label: 'Name' },
    { width: 100, height: 48, borderRadius: 6, opacity: 1, translateY: 0, label: 'Email' },
    { width: 100, height: 120, borderRadius: 6, opacity: 1, translateY: 0, label: 'Message' },
];

function lerpField(a: PaperFieldState, b: PaperFieldState, t: number): PaperFieldState {
    return {
        width: a.width + (b.width - a.width) * t,
        height: a.height + (b.height - a.height) * t,
        borderRadius: a.borderRadius + (b.borderRadius - a.borderRadius) * t,
        opacity: a.opacity + (b.opacity - a.opacity) * t,
        translateY: a.translateY + (b.translateY - a.translateY) * t,
        label: b.label,
    };
}

export class PaperMorphEngine {
    private progress = 0;
    private targetProgress = 0;
    private velocity = 0;
    private listeners = new Set<MorphListener>();
    private rafId: number | null = null;
    private lastTime = 0;
    private active = false;

    /** Trigger morph to form fields */
    morphToFields(): void {
        this.targetProgress = 1;
        if (!this.active) this.startLoop();
    }

    /** Reverse morph back to papers */
    morphToPapers(): void {
        this.targetProgress = 0;
        if (!this.active) this.startLoop();
    }

    getState(): PaperMorphState {
        const t = this.easeProgress(this.progress);
        return {
            progress: this.progress,
            papers: PAPER_SHAPES.map((paper, i) => lerpField(paper, FIELD_SHAPES[i], t)),
        };
    }

    subscribe(listener: MorphListener): () => void {
        this.listeners.add(listener);
        return () => { this.listeners.delete(listener); };
    }

    private easeProgress(p: number): number {
        // Ease-in-out cubic
        return p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
    }

    private startLoop(): void {
        this.active = true;
        this.lastTime = performance.now();
        this.rafId = requestAnimationFrame(this.tick);
    }

    private tick = (now: number): void => {
        const dt = Math.min((now - this.lastTime) / 1000, 0.05);
        this.lastTime = now;

        // Spring toward target
        const stiffness = 80;
        const damping = 12;
        const displacement = this.progress - this.targetProgress;
        const springForce = -stiffness * displacement;
        const dampingForce = -damping * this.velocity;
        this.velocity += (springForce + dampingForce) * dt;
        this.progress += this.velocity * dt;
        this.progress = Math.max(0, Math.min(1, this.progress));

        const settled = Math.abs(this.progress - this.targetProgress) < 0.001 && Math.abs(this.velocity) < 0.001;

        if (settled) {
            this.progress = this.targetProgress;
            this.velocity = 0;
            this.active = false;
        }

        this.notify();

        if (this.active) {
            this.rafId = requestAnimationFrame(this.tick);
        }
    };

    private notify(): void {
        const state = this.getState();
        this.listeners.forEach(fn => fn(state));
    }

    destroy(): void {
        if (this.rafId !== null) cancelAnimationFrame(this.rafId);
        this.listeners.clear();
        this.active = false;
    }
}
