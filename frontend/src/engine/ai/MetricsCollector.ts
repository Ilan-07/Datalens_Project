/**
 * MetricsCollector
 * ================
 * Singleton that passively collects user interaction data.
 * Uses passive event listeners for zero performance overhead.
 * Data is consumed by PatternAnalyzer.
 */

import { engineStateStore } from '../simulation/EngineStateStore';

interface InteractionMetrics {
    scrollSpeed: number;
    hoverFrequency: number;
    interactionDensity: number;
    avgFrameTime: number;
    peakFrameTime: number;
    totalScrollDistance: number;
    totalClicks: number;
    totalHovers: number;
    sessionDuration: number;
    paramChangeCount: number;
}

class MetricsCollectorImpl {
    private metrics: InteractionMetrics = {
        scrollSpeed: 0,
        hoverFrequency: 0,
        interactionDensity: 0,
        avgFrameTime: 16.67,
        peakFrameTime: 16.67,
        totalScrollDistance: 0,
        totalClicks: 0,
        totalHovers: 0,
        sessionDuration: 0,
        paramChangeCount: 0,
    };

    private lastScrollY = 0;
    private scrollSamples: number[] = [];
    private hoverTimestamps: number[] = [];
    private clickTimestamps: number[] = [];
    private frameTimes: number[] = [];
    private lastFrameTime = 0;
    private startTime = 0;
    private initialized = false;
    private rafId = 0;

    init() {
        if (this.initialized || typeof window === 'undefined') return;
        this.initialized = true;
        this.startTime = performance.now();

        // Passive scroll tracking
        window.addEventListener('scroll', this.onScroll, { passive: true });
        window.addEventListener('mouseover', this.onHover, { passive: true });
        window.addEventListener('click', this.onClick, { passive: true });

        // Frame timing
        this.lastFrameTime = performance.now();
        this.measureFrame();

        // Track param changes
        engineStateStore.subscribe(() => {
            this.metrics.paramChangeCount++;
        });
    }

    private onScroll = () => {
        const scrollY = window.scrollY;
        const delta = Math.abs(scrollY - this.lastScrollY);
        this.lastScrollY = scrollY;
        this.metrics.totalScrollDistance += delta;

        this.scrollSamples.push(delta);
        if (this.scrollSamples.length > 30) this.scrollSamples.shift();

        const avgSpeed = this.scrollSamples.reduce((a, b) => a + b, 0) / this.scrollSamples.length;
        this.metrics.scrollSpeed = Math.min(avgSpeed / 50, 1); // Normalize to 0–1
        engineStateStore.set({ scrollSpeed: this.metrics.scrollSpeed });
    };

    private onHover = () => {
        const now = performance.now();
        this.hoverTimestamps.push(now);
        this.metrics.totalHovers++;

        // Keep last 5 seconds of hovers
        const cutoff = now - 5000;
        this.hoverTimestamps = this.hoverTimestamps.filter(t => t > cutoff);
        this.metrics.hoverFrequency = Math.min(this.hoverTimestamps.length / 20, 1); // Normalize
        engineStateStore.set({ hoverFrequency: this.metrics.hoverFrequency });
    };

    private onClick = () => {
        const now = performance.now();
        this.clickTimestamps.push(now);
        this.metrics.totalClicks++;

        const cutoff = now - 10000;
        this.clickTimestamps = this.clickTimestamps.filter(t => t > cutoff);
        this.metrics.interactionDensity = Math.min(this.clickTimestamps.length / 10, 1);
        engineStateStore.set({ interactionDensity: this.metrics.interactionDensity });
    };

    private measureFrame = () => {
        const now = performance.now();
        const dt = now - this.lastFrameTime;
        this.lastFrameTime = now;

        this.frameTimes.push(dt);
        if (this.frameTimes.length > 60) this.frameTimes.shift();

        this.metrics.avgFrameTime = this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length;
        this.metrics.peakFrameTime = Math.max(...this.frameTimes);
        this.metrics.sessionDuration = (now - this.startTime) / 1000;

        const fps = Math.round(1000 / this.metrics.avgFrameTime);
        engineStateStore.set({ currentFps: fps });

        this.rafId = requestAnimationFrame(this.measureFrame);
    };

    getMetrics(): Readonly<InteractionMetrics> {
        return { ...this.metrics };
    }

    destroy() {
        if (typeof window === 'undefined') return;
        window.removeEventListener('scroll', this.onScroll);
        window.removeEventListener('mouseover', this.onHover);
        window.removeEventListener('click', this.onClick);
        cancelAnimationFrame(this.rafId);
        this.initialized = false;
    }
}

export const metricsCollector = new MetricsCollectorImpl();
