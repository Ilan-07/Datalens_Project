/**
 * PatternAnalyzer
 * ===============
 * Lightweight heuristic analysis engine.
 * Runs on MetricsCollector snapshots and EngineStateStore params.
 * Generates human-readable insight summaries.
 * No real AI/API calls — fully simulated but believable.
 */

import { metricsCollector } from './MetricsCollector';
import { engineStateStore } from '../simulation/EngineStateStore';

export interface AnalysisResult {
    id: string;
    type: 'correlation' | 'warning' | 'observation' | 'recommendation';
    message: string;
    confidence: number; // 0–1
    timestamp: number;
}

const INSIGHT_TEMPLATES: Array<{
    check: () => boolean;
    type: AnalysisResult['type'];
    message: () => string;
    confidence: () => number;
}> = [
        {
            check: () => {
                const m = metricsCollector.getMetrics();
                const p = engineStateStore.getState();
                return p.energyIntensity > 0.6 && m.hoverFrequency > 0.4;
            },
            type: 'correlation',
            message: () => {
                const p = engineStateStore.getState();
                return `Energy intensity (${(p.energyIntensity * 100).toFixed(0)}%) increase correlates with higher hover dwell time.`;
            },
            confidence: () => 0.78 + Math.random() * 0.15,
        },
        {
            check: () => engineStateStore.getState().compressionDepth > 0.8,
            type: 'warning',
            message: () => `Depth compression beyond 0.8 reduces perceived smoothness. Current: ${(engineStateStore.getState().compressionDepth * 100).toFixed(0)}%.`,
            confidence: () => 0.85,
        },
        {
            check: () => metricsCollector.getMetrics().avgFrameTime > 20,
            type: 'warning',
            message: () => {
                const fps = Math.round(1000 / metricsCollector.getMetrics().avgFrameTime);
                return `Frame budget exceeded. Current: ${fps}fps. Consider reducing shader complexity.`;
            },
            confidence: () => 0.92,
        },
        {
            check: () => metricsCollector.getMetrics().scrollSpeed > 0.6,
            type: 'observation',
            message: () => `Rapid scroll detected (${(metricsCollector.getMetrics().scrollSpeed * 100).toFixed(0)}% velocity). User may be scanning, not reading.`,
            confidence: () => 0.65,
        },
        {
            check: () => {
                const m = metricsCollector.getMetrics();
                return m.interactionDensity > 0.5 && m.paramChangeCount > 5;
            },
            type: 'observation',
            message: () => `High interaction density with ${metricsCollector.getMetrics().paramChangeCount} parameter changes. User is actively experimenting.`,
            confidence: () => 0.72,
        },
        {
            check: () => engineStateStore.getState().glitchFrequency > 0.7,
            type: 'recommendation',
            message: () => `Glitch frequency at ${(engineStateStore.getState().glitchFrequency * 100).toFixed(0)}%. Consider limiting to <60% for production readability.`,
            confidence: () => 0.81,
        },
        {
            check: () => metricsCollector.getMetrics().sessionDuration > 30,
            type: 'observation',
            message: () => `Session duration: ${metricsCollector.getMetrics().sessionDuration.toFixed(0)}s. Engagement pattern indicates exploratory behavior.`,
            confidence: () => 0.6,
        },
        {
            check: () => {
                const p = engineStateStore.getState();
                return p.lightIntensity > 0.8 && p.ambientIntensity > 0.5;
            },
            type: 'recommendation',
            message: () => `High light + ambient intensity may wash out contrast. Reduce ambient to <0.4 for cinematic depth.`,
            confidence: () => 0.75,
        },
        {
            check: () => true, // Always available as fallback
            type: 'observation',
            message: () => {
                const m = metricsCollector.getMetrics();
                return `System nominal. Avg frame: ${m.avgFrameTime.toFixed(1)}ms. Peak: ${m.peakFrameTime.toFixed(1)}ms. ${m.totalClicks} interactions logged.`;
            },
            confidence: () => 0.95,
        },
    ];

class PatternAnalyzerImpl {
    analyze(): AnalysisResult[] {
        const results: AnalysisResult[] = [];
        const now = performance.now();

        for (const template of INSIGHT_TEMPLATES) {
            if (template.check()) {
                results.push({
                    id: `insight_${now}_${results.length}`,
                    type: template.type,
                    message: template.message(),
                    confidence: template.confidence(),
                    timestamp: now,
                });
            }
        }

        // Return top 4 most confident
        return results
            .sort((a, b) => b.confidence - a.confidence)
            .slice(0, 4);
    }
}

export const patternAnalyzer = new PatternAnalyzerImpl();
