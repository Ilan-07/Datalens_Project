/**
 * InsightGenerator
 * =================
 * Transforms backend analysis response into structured insight blocks
 * for the Insights page. All content is dynamically derived.
 */

export interface InsightBlock {
    id: string;
    title: string;
    type: 'correlation' | 'distribution' | 'quality' | 'model' | 'bias' | 'importance';
    icon: string;
    severity: 'info' | 'warning' | 'danger' | 'success';
    score?: number; // 0–100
    summary: string;
    details: string[];
    chartType?: string; // which chart_config type to render
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function generateInsightBlocks(data: any): InsightBlock[] {
    if (!data) return [];

    const blocks: InsightBlock[] = [];
    const rows = data.rows ?? 0;

    // ── 1. Data Quality Score ──────────────────────────────────────
    const healthScore = data.health_score ?? 0;
    blocks.push({
        id: 'quality-score',
        title: 'Data Quality Score',
        type: 'quality',
        icon: 'Shield',
        severity: healthScore >= 80 ? 'success' : healthScore >= 60 ? 'warning' : 'danger',
        score: healthScore,
        summary: `Overall dataset health: ${healthScore}/100. ${healthScore >= 80 ? 'Dataset is well-structured and suitable for modeling.' : healthScore >= 60 ? 'Some quality concerns detected — preprocessing recommended.' : 'Significant quality issues — thorough data cleaning required before modeling.'}`,
        details: [
            `${(data.missing_pct ?? 0).toFixed(1)}% overall missing data`,
            `${rows.toLocaleString()} records, ${data.columns ?? 0} features`,
            `Memory footprint: ${data.memory_usage_mb ?? 0}MB`,
        ],
    });

    // ── 2. Correlation Analysis ────────────────────────────────────
    const corr = data.correlation_matrix ?? {};
    const pairs: { cols: string[]; val: number }[] = [];
    const seen = new Set<string>();
    for (const [c1, targets] of Object.entries(corr)) {
        for (const [c2, v] of Object.entries(targets as Record<string, number | null>)) {
            if (c1 !== c2 && v !== null) {
                const key = [c1, c2].sort().join('|');
                if (!seen.has(key)) {
                    seen.add(key);
                    pairs.push({ cols: [c1, c2], val: v });
                }
            }
        }
    }
    pairs.sort((a, b) => Math.abs(b.val) - Math.abs(a.val));
    const strong = pairs.filter(p => Math.abs(p.val) > 0.7);

    if (pairs.length > 0) {
        blocks.push({
            id: 'correlation',
            title: 'Correlation Analysis',
            type: 'correlation',
            icon: 'Link',
            severity: strong.length > 3 ? 'danger' : strong.length > 0 ? 'warning' : 'info',
            score: Math.max(0, 100 - strong.length * 15),
            summary: `${pairs.length} feature pairs analyzed. ${strong.length} show strong correlation (|r| > 0.7). ${strong.length > 0 ? `Top: ${strong[0].cols.join(' ↔ ')} (r=${strong[0].val.toFixed(2)}).` : 'No multicollinearity detected.'}`,
            details: strong.slice(0, 5).map(p =>
                `${p.cols[0]} ↔ ${p.cols[1]}: r=${p.val.toFixed(3)} (${p.val > 0 ? 'positive' : 'negative'})`
            ),
            chartType: 'heatmap',
        });
    }

    // ── 3. Distribution Analysis ───────────────────────────────────
    const statsNum = data.stats_numerical ?? {};
    const numCols = Object.keys(statsNum);
    const skewed = numCols.filter(c => Math.abs(statsNum[c]?.skewness ?? 0) > 1);
    const heavySkew = numCols.filter(c => Math.abs(statsNum[c]?.skewness ?? 0) > 2);

    if (numCols.length > 0) {
        blocks.push({
            id: 'distribution',
            title: 'Distribution Insights',
            type: 'distribution',
            icon: 'BarChart3',
            severity: heavySkew.length > 2 ? 'warning' : 'info',
            score: Math.max(0, 100 - skewed.length * 10),
            summary: `${numCols.length} numeric features profiled. ${skewed.length} show notable skewness. ${heavySkew.length > 0 ? `${heavySkew.length} require transformation (log/Box-Cox) for optimal model performance.` : 'All distributions are within acceptable ranges.'}`,
            details: numCols.slice(0, 6).map(c => {
                const s = statsNum[c];
                return `${c}: mean=${s.mean?.toFixed(2)}, std=${s.std?.toFixed(2)}, skew=${s.skewness?.toFixed(2)}`;
            }),
            chartType: 'histogram',
        });
    }

    // ── 4. Feature Importance (correlation-based proxy) ─────────────
    const mlRec = data.ml_recommendation;
    const target = mlRec?.target_column;
    if (target && corr[target]) {
        const importanceMap = Object.entries(corr[target] as Record<string, number | null>)
            .filter(([c, v]) => c !== target && v !== null)
            .map(([c, v]) => ({ feature: c, importance: Math.abs(v as number) }))
            .sort((a, b) => b.importance - a.importance);

        if (importanceMap.length > 0) {
            blocks.push({
                id: 'importance',
                title: 'Feature Importance',
                type: 'importance',
                icon: 'Target',
                severity: 'info',
                summary: `Correlation-based feature importance relative to target '${target}'. Top predictors: ${importanceMap.slice(0, 3).map(f => `'${f.feature}' (${(f.importance * 100).toFixed(0)}%)`).join(', ')}.`,
                details: importanceMap.slice(0, 8).map(f =>
                    `${f.feature}: ${(f.importance * 100).toFixed(1)}% relevance`
                ),
            });
        }
    }

    // ── 5. Model Feasibility ───────────────────────────────────────
    if (mlRec) {
        const feasibility = (healthScore >= 70 && rows >= 100) ? 'High' :
            (healthScore >= 50 && rows >= 50) ? 'Medium' : 'Low';
        const feasibilityScore = feasibility === 'High' ? 90 : feasibility === 'Medium' ? 60 : 30;

        blocks.push({
            id: 'feasibility',
            title: 'Model Feasibility',
            type: 'model',
            icon: 'Brain',
            severity: feasibility === 'High' ? 'success' : feasibility === 'Medium' ? 'warning' : 'danger',
            score: feasibilityScore,
            summary: `${feasibility} feasibility for ${mlRec.problem_type}. Recommended: ${mlRec.recommended_model}. ${mlRec.reason}.`,
            details: [
                `Problem type: ${mlRec.problem_type}`,
                `Primary model: ${mlRec.recommended_model}`,
                ...(mlRec.alternatives ?? []).map((a: string) => `Alternative: ${a}`),
                `Dataset size: ${mlRec.dataset_summary?.size_category ?? 'unknown'} (${rows.toLocaleString()} rows)`,
                ...(target ? [`Target column: '${target}'`] : []),
            ],
        });
    }

    // ── 6. Bias / Imbalance Detection ──────────────────────────────
    const statsCat = data.stats_categorical ?? {};
    const imbalanced: string[] = [];
    for (const [col, stats] of Object.entries(statsCat)) {
        const s = stats as any;
        if (s.most_frequent_freq && s.count) {
            const dominance = s.most_frequent_freq / s.count;
            if (dominance > 0.8) {
                imbalanced.push(`'${col}': '${s.most_frequent}' dominates at ${(dominance * 100).toFixed(0)}%`);
            }
        }
    }

    // Check target imbalance specifically
    if (target && statsCat[target]) {
        const ts = statsCat[target] as any;
        if (ts.most_frequent_freq && ts.count) {
            const targetDominance = ts.most_frequent_freq / ts.count;
            if (targetDominance > 0.7) {
                blocks.push({
                    id: 'bias',
                    title: 'Class Imbalance Alert',
                    type: 'bias',
                    icon: 'AlertTriangle',
                    severity: targetDominance > 0.9 ? 'danger' : 'warning',
                    score: Math.max(0, Math.round((1 - targetDominance) * 100)),
                    summary: `Target variable '${target}' shows class imbalance. Dominant class '${ts.most_frequent}' represents ${(targetDominance * 100).toFixed(0)}% of records. SMOTE or class weighting recommended for balanced model training.`,
                    details: [
                        `${ts.cardinality} classes detected`,
                        `Dominant: '${ts.most_frequent}' (${ts.most_frequent_freq} records)`,
                        `Imbalance ratio: ${(targetDominance * 100).toFixed(1)}%`,
                        ...(targetDominance > 0.9 ? ['Severe imbalance — stratified sampling essential'] : ['Moderate imbalance — consider resampling']),
                    ],
                });
            }
        }
    } else if (imbalanced.length > 0) {
        blocks.push({
            id: 'bias',
            title: 'Categorical Imbalance',
            type: 'bias',
            icon: 'AlertTriangle',
            severity: imbalanced.length > 2 ? 'warning' : 'info',
            summary: `${imbalanced.length} categorical feature${imbalanced.length > 1 ? 's' : ''} show dominant class imbalance (>80% single value).`,
            details: imbalanced.slice(0, 5),
        });
    }

    // ── 7. Backend Insights (from InsightEngine) ───────────────────
    const backendInsights = data.insights ?? [];
    if (backendInsights.length > 0) {
        const dangerCount = backendInsights.filter((i: any) => i.type === 'danger').length;
        const warningCount = backendInsights.filter((i: any) => i.type === 'warning').length;

        blocks.push({
            id: 'risk-assessment',
            title: 'Risk Assessment',
            type: 'quality',
            icon: 'ShieldAlert',
            severity: dangerCount > 0 ? 'danger' : warningCount > 2 ? 'warning' : 'info',
            score: Math.max(0, 100 - dangerCount * 20 - warningCount * 10),
            summary: `${backendInsights.length} AI-generated insight${backendInsights.length > 1 ? 's' : ''} detected. ${dangerCount} critical, ${warningCount} warnings. ${dangerCount === 0 && warningCount === 0 ? 'Dataset presents low risk for modeling.' : 'Review flagged items before proceeding.'}`,
            details: backendInsights.slice(0, 6).map((i: any) => i.message),
        });
    }

    return blocks;
}
