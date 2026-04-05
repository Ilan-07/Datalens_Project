/**
 * MultiverseEngine
 * =================
 * Central orchestrator for all visual sub-engines.
 * Manages the requestAnimationFrame loop, performance monitoring,
 * and coordinates state transitions across GradientEngine and GlitchEngine.
 */

import { stateManager } from './MultiverseStateManager';
import { GradientEngine } from './GradientEngine';
import { GlitchEngine } from './GlitchEngine';

export class MultiverseEngine {
    private gradient: GradientEngine;
    private glitch: GlitchEngine;
    private rafId = 0;
    private running = false;
    private destroyed = false;
    private cinematicMode = true;

    // Performance monitoring
    private frameCount = 0;
    private lastFpsCheck = 0;
    private currentFps = 60;
    private lowFpsFrames = 0;

    constructor() {
        this.gradient = new GradientEngine();
        this.glitch = new GlitchEngine();
    }

    // ── Lifecycle ─────────────────────────────────────────────────────────
    init(container: HTMLElement) {
        if (this.destroyed) return;

        // Detect if we should start in cinematic mode
        this.cinematicMode = this.detectGPUCapability();

        if (this.cinematicMode) {
            this.gradient.init(container);
            this.glitch.init(container);

            // If WebGL failed, note it but gradient still works
            if (!this.glitch.isSupported()) {
                console.info('[MIE] WebGL unavailable — glitch uses CSS fallback');
            }
        }

        stateManager.setEnabled(this.cinematicMode);
        this.start();
    }

    // ── Animation loop ────────────────────────────────────────────────────
    private start() {
        if (this.running) return;
        this.running = true;
        this.lastFpsCheck = performance.now();
        this.loop(performance.now());
    }

    private loop = (now: number) => {
        if (this.destroyed || !this.running) return;

        // Tick state manager (interpolates visual parameters)
        stateManager.tick(now);

        if (this.cinematicMode) {
            // Render sub-engines
            this.gradient.render(now);
            this.glitch.render(now);
        }

        // Performance monitoring
        this.monitorPerformance(now);

        this.rafId = requestAnimationFrame(this.loop);
    };

    private stop() {
        this.running = false;
        if (this.rafId) {
            cancelAnimationFrame(this.rafId);
            this.rafId = 0;
        }
    }

    // ── Performance ───────────────────────────────────────────────────────
    private monitorPerformance(now: number) {
        this.frameCount++;
        const elapsed = now - this.lastFpsCheck;

        if (elapsed >= 1000) {
            this.currentFps = Math.round((this.frameCount * 1000) / elapsed);
            this.frameCount = 0;
            this.lastFpsCheck = now;

            // Auto-degrade if FPS drops below 30 for 3+ seconds
            if (this.currentFps < 30) {
                this.lowFpsFrames++;
                if (this.lowFpsFrames >= 3 && this.cinematicMode) {
                    console.warn('[MIE] Low FPS detected — disabling cinematic mode');
                    this.setCinematicMode(false);
                }
            } else {
                this.lowFpsFrames = 0;
            }
        }
    }

    private detectGPUCapability(): boolean {
        // Check for WebGL support as proxy for GPU capability
        try {
            const testCanvas = document.createElement('canvas');
            const gl = testCanvas.getContext('webgl');
            if (!gl) return false;

            // Check for reasonable GPU
            const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
            if (debugInfo) {
                const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
                // Blocklist known software renderers
                if (/SwiftShader|llvmpipe|Software/i.test(renderer)) {
                    return false;
                }
            }
            return true;
        } catch {
            return false;
        }
    }

    // ── Public API ────────────────────────────────────────────────────────
    getCinematicMode(): boolean {
        return this.cinematicMode;
    }

    setCinematicMode(enabled: boolean) {
        this.cinematicMode = enabled;
        stateManager.setEnabled(enabled);

        if (!enabled) {
            // Destroy canvas layers but keep loop for state management
            this.gradient.destroy();
            this.glitch.destroy();
        }
        // Re-init would require passing container reference again,
        // so toggling ON mid-session requires a page reload
    }

    getFps(): number {
        return this.currentFps;
    }

    getGlitchSupported(): boolean {
        return this.glitch.isSupported();
    }

    destroy() {
        this.destroyed = true;
        this.stop();
        this.gradient.destroy();
        this.glitch.destroy();
        stateManager.destroy();
    }
}
