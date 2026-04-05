/**
 * GradientEngine
 * ===============
 * Canvas-based dynamic background with cursor-tracking radial gradients,
 * Perlin noise texture overlay, and state-responsive color shifts.
 */

import { stateManager } from './MultiverseStateManager';

// ── Simplex noise (compact implementation) ───────────────────────────────
function noise2D(x: number, y: number): number {
    const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
    return (n - Math.floor(n)) * 2 - 1;
}

function smoothNoise(x: number, y: number): number {
    const ix = Math.floor(x);
    const iy = Math.floor(y);
    const fx = x - ix;
    const fy = y - iy;
    const sx = fx * fx * (3 - 2 * fx);
    const sy = fy * fy * (3 - 2 * fy);

    const n00 = noise2D(ix, iy);
    const n10 = noise2D(ix + 1, iy);
    const n01 = noise2D(ix, iy + 1);
    const n11 = noise2D(ix + 1, iy + 1);

    const nx0 = n00 + sx * (n10 - n00);
    const nx1 = n01 + sx * (n11 - n01);

    return nx0 + sy * (nx1 - nx0);
}

// ── Lerp helper ──────────────────────────────────────────────────────────
function lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
}

export class GradientEngine {
    private canvas: HTMLCanvasElement | null = null;
    private ctx: CanvasRenderingContext2D | null = null;
    private mouseX = 0;
    private mouseY = 0;
    private smoothX = 0;
    private smoothY = 0;
    private width = 0;
    private height = 0;
    private dpr = 1;
    private destroyed = false;
    private boundMouseMove: ((e: MouseEvent) => void) | null = null;
    private boundResize: (() => void) | null = null;

    // ── Lifecycle ──────────────────────────────────────────────────────────
    init(container: HTMLElement) {
        this.canvas = document.createElement('canvas');
        this.canvas.style.cssText = `
      position: fixed;
      top: 0; left: 0;
      width: 100%; height: 100%;
      pointer-events: none;
      z-index: 0;
    `;
        container.prepend(this.canvas);

        this.ctx = this.canvas.getContext('2d', { alpha: false })!;
        this.dpr = Math.min(window.devicePixelRatio || 1, 2);

        this.resize();

        this.boundMouseMove = (e: MouseEvent) => {
            this.mouseX = e.clientX;
            this.mouseY = e.clientY;
        };
        this.boundResize = () => this.resize();

        window.addEventListener('mousemove', this.boundMouseMove);
        window.addEventListener('resize', this.boundResize);
    }

    private resize() {
        if (!this.canvas) return;
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.canvas.width = this.width * this.dpr;
        this.canvas.height = this.height * this.dpr;
        this.ctx?.scale(this.dpr, this.dpr);
    }

    // ── Called every frame ─────────────────────────────────────────────────
    render(time: number) {
        if (this.destroyed || !this.ctx || !this.canvas) return;

        const ctx = this.ctx;
        const w = this.width;
        const h = this.height;
        const visuals = stateManager.getVisuals();

        // Smooth cursor tracking (lerp)
        this.smoothX = lerp(this.smoothX, this.mouseX, 0.08);
        this.smoothY = lerp(this.smoothY, this.mouseY, 0.08);

        // Reset transform for fresh frame
        ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

        // ── 1. Black base ────────────────────────────────────────────────
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, w, h);

        // ── 2. Primary radial glow (follows cursor) ──────────────────────
        const radius = visuals.glowRadius;
        const intensity = visuals.gradientIntensity;

        const primaryGrad = ctx.createRadialGradient(
            this.smoothX, this.smoothY, 0,
            this.smoothX, this.smoothY, radius
        );
        primaryGrad.addColorStop(0, `rgba(139, 0, 0, ${0.25 * intensity})`);
        primaryGrad.addColorStop(0.4, `rgba(177, 18, 38, ${0.12 * intensity})`);
        primaryGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.fillStyle = primaryGrad;
        ctx.fillRect(0, 0, w, h);

        // ── 3. Secondary accent glow (state-dependent hue) ───────────────
        if (intensity > 0.35) {
            const accentHue = visuals.accentHue;
            const t = (time * 0.0003) % (Math.PI * 2);
            const ox = w * 0.5 + Math.sin(t) * 200;
            const oy = h * 0.5 + Math.cos(t * 0.7) * 150;

            const secondaryGrad = ctx.createRadialGradient(ox, oy, 0, ox, oy, radius * 0.8);
            secondaryGrad.addColorStop(0, `hsla(${accentHue}, 80%, 40%, ${0.08 * intensity})`);
            secondaryGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

            ctx.fillStyle = secondaryGrad;
            ctx.fillRect(0, 0, w, h);
        }

        // ── 4. Subtle noise overlay ──────────────────────────────────────
        const noiseOpacity = visuals.noiseOpacity;
        if (noiseOpacity > 0.01) {
            const scale = 0.015;
            const tOffset = time * 0.0001;
            // Low-res noise (render at 1/8 resolution for performance)
            const step = 8;
            ctx.globalAlpha = noiseOpacity;
            for (let y = 0; y < h; y += step) {
                for (let x = 0; x < w; x += step) {
                    const n = smoothNoise(x * scale + tOffset, y * scale + tOffset * 0.5);
                    const brightness = Math.floor((n * 0.5 + 0.5) * 40);
                    ctx.fillStyle = `rgb(${brightness}, ${brightness}, ${brightness})`;
                    ctx.fillRect(x, y, step, step);
                }
            }
            ctx.globalAlpha = 1;
        }

        // ── 5. Vignette ──────────────────────────────────────────────────
        const vignetteGrad = ctx.createRadialGradient(
            w / 2, h / 2, w * 0.2,
            w / 2, h / 2, w * 0.75
        );
        vignetteGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
        vignetteGrad.addColorStop(1, 'rgba(0, 0, 0, 0.6)');
        ctx.fillStyle = vignetteGrad;
        ctx.fillRect(0, 0, w, h);

        // ── 6. Tear flash (brief red pulse during MULTIVERSE_TEAR) ───────
        if (visuals.glitchIntensity > 0.5) {
            const flashAlpha = (visuals.glitchIntensity - 0.5) * 0.15;
            const flashPhase = Math.sin(time * 0.02);
            if (flashPhase > 0) {
                ctx.fillStyle = `rgba(177, 18, 38, ${flashAlpha * flashPhase})`;
                ctx.fillRect(0, 0, w, h);
            }
        }
    }

    destroy() {
        this.destroyed = true;
        if (this.boundMouseMove) window.removeEventListener('mousemove', this.boundMouseMove);
        if (this.boundResize) window.removeEventListener('resize', this.boundResize);
        this.canvas?.remove();
        this.canvas = null;
        this.ctx = null;
    }
}
