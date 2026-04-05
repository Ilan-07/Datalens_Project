"""
Insight Generator Engine
=========================
Rule-based pattern detection — generates human-readable insights
from the analysis data. All insights dynamically derived.
"""

from typing import Dict, Any, List


class InsightEngine:
    @staticmethod
    def generate_insights(analysis_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Generate rule-based insights from analysis data."""
        insights: List[Dict[str, Any]] = []
        rows = analysis_data.get("rows", 0)

        # ── 1. Missing Value Insights ──────────────────────────────
        for col, count in analysis_data.get("missing_counts", {}).items():
            pct = (count / rows) * 100 if rows > 0 else 0
            if pct > 30:
                insights.append({
                    "type": "danger",
                    "column": col,
                    "icon": "AlertCircle",
                    "message": f"Critical: '{col}' has {pct:.1f}% missing values. Data quality severely compromised — consider dropping or heavy imputation.",
                    "tag": "DATA QUALITY",
                    "severity": 3,
                })
            elif pct > 10:
                insights.append({
                    "type": "danger",
                    "column": col,
                    "icon": "AlertCircle",
                    "message": f"'{col}' has {pct:.1f}% missing values. Significant data quality issue — imputation recommended.",
                    "tag": "MISSING DATA",
                    "severity": 2,
                })
            elif pct > 5:
                insights.append({
                    "type": "warning",
                    "column": col,
                    "icon": "AlertTriangle",
                    "message": f"'{col}' has {pct:.1f}% missing values. Consider mean/median imputation.",
                    "tag": "MISSING DATA",
                    "severity": 1,
                })

        # ── 2. Correlation Insights ────────────────────────────────
        corr_matrix = analysis_data.get("correlation_matrix", {})
        processed_pairs = set()
        for col1, targets in corr_matrix.items():
            for col2, val in targets.items():
                if col1 != col2 and val is not None and abs(val) > 0.8:
                    pair = tuple(sorted((col1, col2)))
                    if pair not in processed_pairs:
                        processed_pairs.add(pair)
                        strength = "very strong" if abs(val) > 0.9 else "strong"
                        direction = "positive" if val > 0 else "negative"
                        insights.append({
                            "type": "warning",
                            "columns": [col1, col2],
                            "icon": "Link",
                            "message": f"A {strength} {direction} correlation (r={val:.2f}) exists between '{col1}' and '{col2}'. Consider removing one to avoid multicollinearity.",
                            "tag": "CORRELATION",
                            "severity": 2,
                        })

        # ── 3. Skewness Insights ───────────────────────────────────
        stats_num = analysis_data.get("stats_numerical", {})
        for col, stats in stats_num.items():
            skew_val = stats.get("skewness", 0)
            if abs(skew_val) > 2:
                direction = "right" if skew_val > 0 else "left"
                insights.append({
                    "type": "warning",
                    "column": col,
                    "icon": "TrendingUp",
                    "message": f"'{col}' is heavily {direction}-skewed (skew={skew_val:.2f}). Log or Box-Cox transform recommended for better model performance.",
                    "tag": "DISTRIBUTION",
                    "severity": 1,
                })
            elif abs(skew_val) > 1:
                direction = "right" if skew_val > 0 else "left"
                insights.append({
                    "type": "info",
                    "column": col,
                    "icon": "TrendingUp",
                    "message": f"'{col}' shows moderate {direction}-skew (skew={skew_val:.2f}). May benefit from transformation.",
                    "tag": "DISTRIBUTION",
                    "severity": 0,
                })

        # ── 4. Outlier Insights ────────────────────────────────────
        for col, stats in stats_num.items():
            outliers = stats.get("outliers_iqr", 0)
            count = stats.get("count", 1)
            if count > 0:
                outlier_pct = (outliers / count) * 100
                if outlier_pct > 10:
                    insights.append({
                        "type": "danger",
                        "column": col,
                        "icon": "Zap",
                        "message": f"'{col}' has {outliers} outliers ({outlier_pct:.1f}% of data). Investigate for data errors or consider robust scaling.",
                        "tag": "OUTLIERS",
                        "severity": 2,
                    })
                elif outlier_pct > 3:
                    insights.append({
                        "type": "warning",
                        "column": col,
                        "icon": "Zap",
                        "message": f"'{col}' has {outliers} outliers ({outlier_pct:.1f}% of data). May impact model accuracy.",
                        "tag": "OUTLIERS",
                        "severity": 1,
                    })

        # ── 5. Target Detection ────────────────────────────────────
        potential_targets = []
        target_keywords = ["target", "label", "class", "churn", "price", "winner", "survived", "output"]
        for col in analysis_data.get("dtypes", {}).keys():
            if any(term in col.lower() for term in target_keywords):
                potential_targets.append(col)

        if potential_targets:
            insights.append({
                "type": "purple",
                "columns": potential_targets,
                "icon": "Target",
                "message": f"Heuristics suggest '{potential_targets[0]}' is likely the target variable for modeling.",
                "tag": "TARGET DETECTED",
                "severity": 0,
            })

        # ── 6. Dataset Size Insights ───────────────────────────────
        if rows < 100:
            insights.append({
                "type": "warning",
                "icon": "Database",
                "message": f"Dataset has only {rows} rows. Results may not be statistically significant. Consider collecting more data.",
                "tag": "DATASET SIZE",
                "severity": 1,
            })
        elif rows > 100000:
            insights.append({
                "type": "info",
                "icon": "Database",
                "message": f"Large dataset ({rows:,} rows). Consider sampling for EDA and using scalable ML models.",
                "tag": "DATASET SIZE",
                "severity": 0,
            })

        # ── 7. High Cardinality Warnings ───────────────────────────
        stats_cat = analysis_data.get("stats_categorical", {})
        for col, stats in stats_cat.items():
            cardinality = stats.get("cardinality", 0)
            if cardinality > rows * 0.5 and rows > 0:
                insights.append({
                    "type": "warning",
                    "column": col,
                    "icon": "Hash",
                    "message": f"'{col}' has very high cardinality ({cardinality} unique values). May be an ID column — consider excluding from features.",
                    "tag": "HIGH CARDINALITY",
                    "severity": 1,
                })

        # Sort by severity (highest first)
        insights.sort(key=lambda x: x.get("severity", 0), reverse=True)

        return insights
