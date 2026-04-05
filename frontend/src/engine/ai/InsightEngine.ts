/**
 * InsightEngine
 * =============
 * Produces structured insight blocks.
 * Updates every 5 seconds with smooth cycling.
 * Subscribable for UI components.
 */

import { patternAnalyzer, type AnalysisResult } from './PatternAnalyzer';
import { metricsCollector } from './MetricsCollector';

type InsightListener = (insights: AnalysisResult[]) => void;

class InsightEngineImpl {
    private insights: AnalysisResult[] = [];
    private listeners: Set<InsightListener> = new Set();
    private interval: ReturnType<typeof setInterval> | null = null;
    private initialized = false;

    init() {
        if (this.initialized) return;
        this.initialized = true;

        // Initialize metrics collector
        metricsCollector.init();

        // Initial analysis
        this.refresh();

        // Refresh every 5 seconds
        this.interval = setInterval(() => {
            this.refresh();
        }, 5000);
    }

    private refresh() {
        this.insights = patternAnalyzer.analyze();
        this.notify();
    }

    getInsights(): readonly AnalysisResult[] {
        return this.insights;
    }

    subscribe(listener: InsightListener): () => void {
        this.listeners.add(listener);
        return () => { this.listeners.delete(listener); };
    }

    private notify() {
        this.listeners.forEach(fn => fn(this.insights));
    }

    destroy() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
        metricsCollector.destroy();
        this.listeners.clear();
        this.initialized = false;
    }
}

export const insightEngine = new InsightEngineImpl();
