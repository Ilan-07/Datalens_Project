/**
 * AnalyticsVisualBridge
 * =====================
 * Connects backend analytics data to the Multiverse visual engine.
 * Evaluates metrics and triggers appropriate visual state transitions.
 */

import { stateManager } from './MultiverseStateManager';

export interface AnalyticsMetrics {
    correlationMatrix?: Record<string, Record<string, number | null>>;
    mlRecommendation?: {
        problem_type: string;
        recommended_model: string;
        target_column: string | null;
    };
    insights?: Array<{
        type: string;
        tag: string;
        severity?: number;
        column?: string;
    }>;
    statsNumerical?: Record<string, {
        skewness?: number;
        outliers_iqr?: number;
        count?: number;
    }>;
    healthScore?: number;
}

export class AnalyticsVisualBridge {
    private tearCooldown = false;

    /**
     * Evaluate analysis data and fire visual triggers.
     * Call this after receiving analysis results from the backend.
     */
    evaluate(metrics: AnalyticsMetrics) {
        // ── 1. High Correlation → MULTIVERSE_TEAR ─────────────────────────
        if (metrics.correlationMatrix) {
            const hasHighCorr = this.findMaxCorrelation(metrics.correlationMatrix) > 0.9;
            if (hasHighCorr) {
                this.fireTear('high_correlation');
                return; // Tear takes priority
            }
        }

        // ── 2. Dangerous insights → MULTIVERSE_TEAR ──────────────────────
        if (metrics.insights) {
            const criticalCount = metrics.insights.filter(
                (i) => i.severity !== undefined && i.severity >= 3
            ).length;
            if (criticalCount > 0) {
                this.fireTear('critical_insight');
                return;
            }
        }

        // ── 3. High Skewness → ENERGY_BUILD ──────────────────────────────
        if (metrics.statsNumerical) {
            const hasHighSkew = Object.values(metrics.statsNumerical).some(
                (s) => Math.abs(s.skewness || 0) > 2
            );
            if (hasHighSkew) {
                stateManager.triggerEnergyBuild('high_skewness');
                return;
            }
        }

        // ── 4. Heavy outlier presence → ENERGY_BUILD ─────────────────────
        if (metrics.statsNumerical) {
            const hasHeavyOutliers = Object.values(metrics.statsNumerical).some((s) => {
                const count = s.count || 1;
                const outliers = s.outliers_iqr || 0;
                return (outliers / count) > 0.1;
            });
            if (hasHeavyOutliers) {
                stateManager.triggerEnergyBuild('heavy_outliers');
                return;
            }
        }

        // ── 5. Low health → Energy Build ─────────────────────────────────
        if (metrics.healthScore !== undefined && metrics.healthScore < 50) {
            stateManager.triggerEnergyBuild('low_health');
            return;
        }

        // ── 6. ML model recommendation → brief TEAR ─────────────────────
        if (metrics.mlRecommendation?.recommended_model) {
            this.fireTear('ml_recommendation');
            return;
        }
    }

    // ── Internal helpers ──────────────────────────────────────────────────
    private findMaxCorrelation(
        matrix: Record<string, Record<string, number | null>>
    ): number {
        let max = 0;
        const cols = Object.keys(matrix);
        for (const col1 of cols) {
            for (const col2 of cols) {
                if (col1 !== col2) {
                    const val = matrix[col1]?.[col2];
                    if (val !== null && val !== undefined) {
                        max = Math.max(max, Math.abs(val));
                    }
                }
            }
        }
        return max;
    }

    private fireTear(trigger: string) {
        if (this.tearCooldown) return;
        this.tearCooldown = true;
        stateManager.triggerTear(trigger);

        // Cooldown prevents rapid-fire tears
        setTimeout(() => {
            this.tearCooldown = false;
        }, 3000);
    }
}
