"""
Auto Visualization Engine
==========================
Dynamically generates chart configuration based on column types.
No hardcoded charts — all configs are derived from the data structure.
"""

from typing import Any
import pandas as pd  # type: ignore
import itertools


class VisualizationEngine:
    """Generates chart metadata for frontend rendering."""

    @staticmethod
    def generate_chart_configs(
        df: pd.DataFrame,
        numeric_cols: list[str],
        category_cols: list[str],
        datetime_cols: list[str],
        correlation_matrix: dict[str, Any],
    ) -> list[dict[str, Any]]:
        """
        Analyze column types and generate a list of chart configurations.
        Frontend renders charts dynamically based on these configs.
        """
        charts: list[dict[str, Any]] = []

        # ── 1. Histograms for numeric columns ─────────────────────
        for col in itertools.islice(numeric_cols, 6):  # Limit to first 6 to avoid overload
            series = df[col].dropna()
            if series.empty:
                continue

            # Compute histogram bins
            hist_counts, bin_edges = pd.cut(series, bins=20, retbins=True)
            value_counts = hist_counts.value_counts().sort_index()

            charts.append({
                "type": "histogram",
                "title": f"Distribution of {col}",
                "columns": [col],
                "data": [
                    {
                        "bin": f"{edge:.1f}",
                        "count": int(count),
                    }
                    for edge, count in zip(
                        bin_edges[:-1],
                        value_counts.values,
                    )
                ],
            })

        # ── 2. Bar charts for categorical columns ──────────────────
        for col in itertools.islice(category_cols, 4):
            series = df[col].dropna()
            if series.empty:
                continue

            top = series.value_counts().head(10)
            charts.append({
                "type": "bar",
                "title": f"Top Categories in {col}",
                "columns": [col],
                "data": [
                    {"name": str(name), "value": int(count)}
                    for name, count in top.items()
                ],
            })

        # ── 3. Line charts for datetime columns ────────────────────
        for col in itertools.islice(datetime_cols, 2):
            try:
                dt_series = pd.to_datetime(df[col], errors="coerce")
                dt_df = df.copy()
                dt_df["_dt"] = dt_series
                dt_df = dt_df.dropna(subset=["_dt"]).sort_values("_dt")

                # If there's a numeric column, plot it over time
                if numeric_cols:
                    target = numeric_cols[0]
                    # Resample or take first 100 points
                    sampled = dt_df[["_dt", target]].head(100)
                    charts.append({
                        "type": "line",
                        "title": f"{target} over {col}",
                        "columns": [col, target],
                        "data": [
                            {
                                "date": row["_dt"].strftime("%Y-%m-%d"),
                                "value": float(row[target]) if pd.notna(row[target]) else 0,
                            }
                            for _, row in sampled.iterrows()
                        ],
                    })
            except Exception:
                continue

        # ── 4. Scatter plots for top correlated numeric pairs ──────
        if len(numeric_cols) >= 2:
            pairs_added = set()
            sorted_pairs = []

            for col1, targets in correlation_matrix.items():
                for col2, val in targets.items():
                    if col1 != col2 and val is not None:
                        pair = tuple(sorted((col1, col2)))
                        if pair not in pairs_added:
                            pairs_added.add(pair)
                            sorted_pairs.append((pair, abs(val)))

            sorted_pairs.sort(key=lambda x: x[1], reverse=True)

            for (col1, col2), corr_val in itertools.islice(sorted_pairs, 3):
                sampled = df[[col1, col2]].dropna().head(200)
                charts.append({
                    "type": "scatter",
                    "title": f"{col1} vs {col2} (r={corr_val:.2f})",
                    "columns": [col1, col2],
                    "data": [
                        {"x": float(row[col1]), "y": float(row[col2])}
                        for _, row in sampled.iterrows()
                    ],
                })

        # ── 5. Correlation heatmap ─────────────────────────────────
        if len(numeric_cols) >= 2:
            cols_for_heatmap = list(itertools.islice(numeric_cols, 10))  # Limit for readability
            heatmap_data = []
            for col1 in cols_for_heatmap:
                for col2 in cols_for_heatmap:
                    val = correlation_matrix.get(col1, {}).get(col2, 0)
                    heatmap_data.append({
                        "x": col1,
                        "y": col2,
                        "value": float(f"{float(val):.3f}") if val is not None else 0.0,
                    })

            charts.append({
                "type": "heatmap",
                "title": "Correlation Matrix",
                "columns": cols_for_heatmap,
                "data": heatmap_data,
            })

        return charts
