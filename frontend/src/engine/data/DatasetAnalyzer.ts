/**
 * DatasetAnalyzer
 * ================
 * Transforms the backend /api/upload response into structured carousel cards.
 * All text is dynamically generated from actual dataset metrics.
 * Zero hardcoded descriptions.
 */

export interface DatasetCard {
    id: string;
    label: string;
    description: string;
    tag: string;
    metrics: { label: string; value: string; warn?: boolean }[];
    bullets: string[];
    confidence: number;
    severity: number; // 0–3
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function analyzeDataset(data: any): DatasetCard[] {
    if (!data) return [];

    const cards: DatasetCard[] = [];

    // ── 1. Dataset Overview ────────────────────────────────────────
    const numericCount = data.numeric_columns?.length ?? 0;
    const catCount = data.category_columns?.length ?? 0;
    const dtCount = data.datetime_columns?.length ?? 0;
    const memMb = data.memory_usage_mb ?? 0;

    cards.push({
        id: 'overview',
        label: 'Dataset Overview',
        tag: 'STRUCTURE',
        description: `${(data.rows ?? 0).toLocaleString()} records across ${data.columns ?? 0} features consuming ${memMb}MB. ${numericCount} numeric, ${catCount} categorical${dtCount > 0 ? `, ${dtCount} datetime` : ''} columns detected. Health score: ${data.health_score ?? 0}/100.`,
        metrics: [
            { label: 'Rows', value: (data.rows ?? 0).toLocaleString() },
            { label: 'Columns', value: String(data.columns ?? 0) },
            { label: 'Memory', value: `${memMb}MB` },
            { label: 'Health', value: `${data.health_score ?? 0}/100`, warn: (data.health_score ?? 100) < 70 },
        ],
        bullets: [
            `${numericCount} numeric feature${numericCount !== 1 ? 's' : ''}`,
            `${catCount} categorical feature${catCount !== 1 ? 's' : ''}`,
            ...(dtCount > 0 ? [`${dtCount} datetime column${dtCount !== 1 ? 's' : ''}`] : []),
            `Overall data completeness: ${(100 - (data.missing_pct ?? 0)).toFixed(1)}%`,
        ],
        confidence: Math.min((data.health_score ?? 50) / 100, 1),
        severity: (data.health_score ?? 100) < 50 ? 3 : (data.health_score ?? 100) < 70 ? 2 : 0,
    });

    // ── 2. Feature Summary ─────────────────────────────────────────
    const profiles = data.column_profiles ?? {};
    const featureNames = Object.keys(profiles);
    const highMissing = featureNames.filter(f => (profiles[f]?.missing_pct ?? 0) > 10);
    const highUnique = featureNames.filter(f => (profiles[f]?.unique_count ?? 0) > (data.rows ?? 1) * 0.5 && profiles[f]?.type === 'categorical');

    cards.push({
        id: 'features',
        label: 'Feature Summary',
        tag: 'PROFILING',
        description: `${featureNames.length} features profiled. ${numericCount} numeric, ${catCount} categorical. ${highMissing.length > 0 ? `${highMissing.length} feature${highMissing.length > 1 ? 's' : ''} with >10% missing data.` : 'No significant missing data detected.'} ${highUnique.length > 0 ? `${highUnique.length} high-cardinality column${highUnique.length > 1 ? 's' : ''} detected (possible ID fields).` : ''}`,
        metrics: [
            { label: 'Numeric', value: String(numericCount) },
            { label: 'Categorical', value: String(catCount) },
            { label: 'High Missing', value: String(highMissing.length), warn: highMissing.length > 0 },
            { label: 'High Cardinality', value: String(highUnique.length), warn: highUnique.length > 0 },
        ],
        bullets: featureNames.slice(0, 6).map(f => {
            const p = profiles[f];
            return `${f}: ${p?.type ?? 'unknown'}, ${p?.unique_count ?? 0} unique, ${p?.missing_pct ?? 0}% missing`;
        }),
        confidence: 0.95,
        severity: highMissing.length > 2 ? 2 : highMissing.length > 0 ? 1 : 0,
    });

    // ── 3. Missing Value Analysis ──────────────────────────────────
    const missingCounts = data.missing_counts ?? {};
    const missingEntries = Object.entries(missingCounts)
        .filter(([, v]) => (v as number) > 0)
        .sort((a, b) => (b[1] as number) - (a[1] as number));
    const totalMissingCells = Object.values(missingCounts).reduce((s: number, v) => s + (v as number), 0);
    const totalCells = (data.rows ?? 1) * (data.columns ?? 1);
    const missingPct = totalCells > 0 ? ((totalMissingCells / totalCells) * 100).toFixed(1) : '0';

    cards.push({
        id: 'missing',
        label: 'Missing Value Analysis',
        tag: 'DATA QUALITY',
        description: missingEntries.length > 0
            ? `${missingPct}% of total cells contain missing values, distributed across ${missingEntries.length} column${missingEntries.length > 1 ? 's' : ''}. ${missingEntries.length > 0 ? `Most affected: '${missingEntries[0][0]}' with ${((missingEntries[0][1] as number) / (data.rows ?? 1) * 100).toFixed(1)}% missing.` : ''} Imputation or feature engineering recommended for columns exceeding 10% threshold.`
            : `No missing values detected across ${data.columns ?? 0} features and ${(data.rows ?? 0).toLocaleString()} records. Dataset is fully complete.`,
        metrics: [
            { label: 'Total Missing', value: String(totalMissingCells) },
            { label: 'Affected Cols', value: String(missingEntries.length), warn: missingEntries.length > 0 },
            { label: 'Overall %', value: `${missingPct}%`, warn: parseFloat(missingPct) > 5 },
            { label: 'Completeness', value: `${(100 - parseFloat(missingPct)).toFixed(1)}%` },
        ],
        bullets: missingEntries.slice(0, 5).map(([col, count]) =>
            `'${col}': ${count} missing (${((count as number) / (data.rows ?? 1) * 100).toFixed(1)}%)`
        ),
        confidence: 0.98,
        severity: parseFloat(missingPct) > 15 ? 3 : parseFloat(missingPct) > 5 ? 2 : missingEntries.length > 0 ? 1 : 0,
    });

    // ── 4. Correlation Matrix Summary ──────────────────────────────
    const corr = data.correlation_matrix ?? {};
    const corrPairs: { pair: string; value: number }[] = [];
    const seenPairs = new Set<string>();
    for (const [col1, targets] of Object.entries(corr)) {
        for (const [col2, val] of Object.entries(targets as Record<string, number | null>)) {
            if (col1 !== col2 && val !== null) {
                const key = [col1, col2].sort().join('___');
                if (!seenPairs.has(key)) {
                    seenPairs.add(key);
                    corrPairs.push({ pair: `${col1} ↔ ${col2}`, value: val });
                }
            }
        }
    }
    corrPairs.sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
    const strongCorr = corrPairs.filter(p => Math.abs(p.value) > 0.8);

    cards.push({
        id: 'correlation',
        label: 'Correlation Matrix',
        tag: 'STATISTICS',
        description: corrPairs.length > 0
            ? `${corrPairs.length} feature pair${corrPairs.length > 1 ? 's' : ''} analyzed. ${strongCorr.length} strong correlation${strongCorr.length !== 1 ? 's' : ''} detected (|r| > 0.8). ${strongCorr.length > 0 ? `Strongest: ${strongCorr[0].pair} (r=${strongCorr[0].value.toFixed(2)}). Consider removing redundant features to reduce multicollinearity.` : 'No multicollinearity concerns detected.'}`
            : 'Insufficient numeric features for correlation analysis. At least 2 numeric columns required.',
        metrics: [
            { label: 'Pairs Analyzed', value: String(corrPairs.length) },
            { label: 'Strong (|r|>0.8)', value: String(strongCorr.length), warn: strongCorr.length > 0 },
            ...(corrPairs.length > 0 ? [{ label: 'Strongest', value: corrPairs[0]?.value.toFixed(2) ?? '—' }] : []),
            ...(corrPairs.length > 0 ? [{ label: 'Weakest', value: corrPairs[corrPairs.length - 1]?.value.toFixed(2) ?? '—' }] : []),
        ],
        bullets: strongCorr.slice(0, 4).map(p =>
            `${p.pair}: r=${p.value.toFixed(2)} (${p.value > 0 ? 'positive' : 'negative'})`
        ),
        confidence: corrPairs.length > 0 ? 0.92 : 0.5,
        severity: strongCorr.length > 2 ? 2 : strongCorr.length > 0 ? 1 : 0,
    });

    // ── 5. Distribution Insights ───────────────────────────────────
    const statsNum = data.stats_numerical ?? {};
    const skewedFeatures = Object.entries(statsNum)
        .filter(([, s]) => Math.abs((s as any).skewness ?? 0) > 1)
        .sort((a, b) => Math.abs((b[1] as any).skewness) - Math.abs((a[1] as any).skewness));
    const outlierFeatures = Object.entries(statsNum)
        .filter(([, s]) => ((s as any).outliers_iqr ?? 0) > 0)
        .sort((a, b) => (b[1] as any).outliers_iqr - (a[1] as any).outliers_iqr);
    const totalOutliers = outlierFeatures.reduce((s, [, st]) => s + ((st as any).outliers_iqr ?? 0), 0);

    cards.push({
        id: 'distribution',
        label: 'Distribution Insights',
        tag: 'ANALYSIS',
        description: `${Object.keys(statsNum).length} numeric features analyzed. ${skewedFeatures.length} show significant skewness (|skew| > 1)${skewedFeatures.length > 0 ? ` — most skewed: '${skewedFeatures[0][0]}' (skew=${(skewedFeatures[0][1] as any).skewness?.toFixed(2)})` : ''}. ${totalOutliers} total outliers detected across ${outlierFeatures.length} feature${outlierFeatures.length !== 1 ? 's' : ''} using IQR method.`,
        metrics: [
            { label: 'Numeric Features', value: String(Object.keys(statsNum).length) },
            { label: 'Skewed', value: String(skewedFeatures.length), warn: skewedFeatures.length > 0 },
            { label: 'Total Outliers', value: String(totalOutliers), warn: totalOutliers > 0 },
            { label: 'Features w/ Outliers', value: String(outlierFeatures.length) },
        ],
        bullets: [
            ...skewedFeatures.slice(0, 3).map(([f, s]) =>
                `'${f}': skewness=${(s as any).skewness?.toFixed(2)} — ${Math.abs((s as any).skewness) > 2 ? 'log/Box-Cox transform recommended' : 'moderate skew'}`
            ),
            ...outlierFeatures.slice(0, 2).map(([f, s]) =>
                `'${f}': ${(s as any).outliers_iqr} outliers (${(((s as any).outliers_iqr / ((s as any).count || 1)) * 100).toFixed(1)}%)`
            ),
        ],
        confidence: 0.88,
        severity: skewedFeatures.length > 3 || totalOutliers > (data.rows ?? 0) * 0.1 ? 2 : skewedFeatures.length > 0 ? 1 : 0,
    });

    // ── 6. Target Variable Analysis ────────────────────────────────
    const mlRec = data.ml_recommendation;
    const targetCol = mlRec?.target_column;

    if (targetCol && profiles[targetCol]) {
        const tp = profiles[targetCol];
        const isNumTarget = tp.type === 'numeric';
        const targetStats = isNumTarget ? statsNum[targetCol] : (data.stats_categorical ?? {})[targetCol];

        cards.push({
            id: 'target',
            label: 'Target Variable',
            tag: 'ML TARGET',
            description: `Detected target: '${targetCol}' (${tp.type}). ${isNumTarget
                ? `Range: ${targetStats?.min?.toFixed(2) ?? '?'} – ${targetStats?.max?.toFixed(2) ?? '?'}, mean=${targetStats?.mean?.toFixed(2) ?? '?'}, std=${targetStats?.std?.toFixed(2) ?? '?'}.`
                : `${targetStats?.cardinality ?? '?'} unique classes. Most frequent: '${targetStats?.most_frequent ?? '?'}' (${targetStats?.most_frequent_freq ?? '?'} occurrences).`
                } ${tp.missing_pct > 0 ? `Warning: ${tp.missing_pct}% missing in target column.` : 'No missing values in target.'}`,
            metrics: [
                { label: 'Column', value: targetCol },
                { label: 'Type', value: tp.type },
                ...(isNumTarget
                    ? [
                        { label: 'Mean', value: targetStats?.mean?.toFixed(2) ?? '—' },
                        { label: 'Std', value: targetStats?.std?.toFixed(2) ?? '—' },
                    ]
                    : [
                        { label: 'Classes', value: String(targetStats?.cardinality ?? '—') },
                        { label: 'Most Freq', value: String(targetStats?.most_frequent ?? '—') },
                    ]
                ),
            ],
            bullets: [
                `Problem detected as: ${mlRec?.problem_type ?? 'unknown'}`,
                ...(tp.missing_pct > 0 ? [`${tp.missing_pct}% missing — handle before modeling`] : ['No missing values — ready for modeling']),
                ...(isNumTarget && targetStats?.skewness !== undefined ? [`Target skewness: ${targetStats.skewness.toFixed(2)}`] : []),
            ],
            confidence: 0.85,
            severity: tp.missing_pct > 5 ? 2 : 0,
        });
    } else {
        cards.push({
            id: 'target',
            label: 'Target Variable',
            tag: 'ML TARGET',
            description: 'No target column detected from heuristics or problem statement. Provide a problem statement on the home page to enable target detection, or this may be an unsupervised learning task.',
            metrics: [
                { label: 'Status', value: 'Undetected' },
                { label: 'Suggestion', value: 'Add problem statement' },
            ],
            bullets: [
                'Upload with a problem statement for automatic target detection',
                'Common target indicators: "target", "label", "class", "price", "churn"',
            ],
            confidence: 0.4,
            severity: 1,
        });
    }

    // ── 7. Recommended Model ───────────────────────────────────────
    if (mlRec) {
        cards.push({
            id: 'model',
            label: 'Model Recommendation',
            tag: 'ML ADVISOR',
            description: `Problem type: ${mlRec.problem_type}. Recommended: ${mlRec.recommended_model}. ${mlRec.reason}. Dataset category: ${mlRec.dataset_summary?.size_category ?? 'unknown'} (${mlRec.dataset_summary?.rows?.toLocaleString() ?? '?'} rows, ${mlRec.dataset_summary?.numeric_features ?? 0} numeric + ${mlRec.dataset_summary?.categorical_features ?? 0} categorical features).`,
            metrics: [
                { label: 'Problem', value: mlRec.problem_type },
                { label: 'Model', value: mlRec.recommended_model },
                { label: 'Size', value: mlRec.dataset_summary?.size_category ?? '—' },
            ],
            bullets: [
                `Primary: ${mlRec.recommended_model}`,
                ...(mlRec.alternatives ?? []).map((alt: string) => `Alternative: ${alt}`),
                ...(mlRec.target_column ? [`Target: '${mlRec.target_column}'`] : []),
            ],
            confidence: 0.82,
            severity: 0,
        });
    }

    // ── 8. Data Quality Observations ───────────────────────────────
    const qualityIssues: string[] = [];
    if (parseFloat(missingPct) > 10) qualityIssues.push(`High missing data: ${missingPct}% of cells incomplete`);
    if (highUnique.length > 0) qualityIssues.push(`${highUnique.length} potential ID column${highUnique.length > 1 ? 's' : ''}: ${highUnique.slice(0, 3).join(', ')}`);
    if (strongCorr.length > 0) qualityIssues.push(`${strongCorr.length} highly correlated pair${strongCorr.length > 1 ? 's' : ''} — multicollinearity risk`);
    if (skewedFeatures.length > 0) qualityIssues.push(`${skewedFeatures.length} skewed feature${skewedFeatures.length > 1 ? 's' : ''} — transformation may improve model`);
    if (totalOutliers > (data.rows ?? 0) * 0.05) qualityIssues.push(`Outliers comprise >${((totalOutliers / (data.rows ?? 1)) * 100).toFixed(1)}% of data`);
    if ((data.rows ?? 0) < 100) qualityIssues.push(`Small dataset (${data.rows} rows) — results may not generalize`);

    const qualitySeverity = qualityIssues.length > 3 ? 3 : qualityIssues.length > 1 ? 2 : qualityIssues.length > 0 ? 1 : 0;

    cards.push({
        id: 'quality',
        label: 'Risk & Quality',
        tag: 'ASSESSMENT',
        description: qualityIssues.length > 0
            ? `${qualityIssues.length} data quality concern${qualityIssues.length > 1 ? 's' : ''} identified. Health score: ${data.health_score ?? 0}/100. ${qualityIssues.length > 2 ? 'Significant preprocessing recommended before modeling.' : 'Minor issues — address before production deployment.'}`
            : `No significant quality issues detected. Health score: ${data.health_score ?? 0}/100. Dataset is suitable for modeling with minimal preprocessing.`,
        metrics: [
            { label: 'Issues Found', value: String(qualityIssues.length), warn: qualityIssues.length > 0 },
            { label: 'Health Score', value: `${data.health_score ?? 0}/100`, warn: (data.health_score ?? 100) < 70 },
            { label: 'Risk Level', value: qualitySeverity === 0 ? 'Low' : qualitySeverity === 1 ? 'Medium' : 'High', warn: qualitySeverity > 1 },
        ],
        bullets: qualityIssues.length > 0 ? qualityIssues : ['All checks passed — dataset is production-ready'],
        confidence: 0.9,
        severity: qualitySeverity,
    });

    return cards;
}
