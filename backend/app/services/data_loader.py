"""
Data Profiling Engine
======================
Processes uploaded CSV files and generates comprehensive dataset profiles.
All metrics are dynamically computed — no hardcoded values.
"""

import pandas as pd
import io
from typing import Dict, Any, List


class DataProfiler:
    """Profiles a CSV dataset and returns structured metadata."""

    @staticmethod
    def process_csv(file_content: bytes) -> Dict[str, Any]:
        """
        Process CSV content and return comprehensive profiling data.
        """
        df = pd.read_csv(io.BytesIO(file_content))

        rows, cols = df.shape
        memory_total = df.memory_usage(deep=True).sum()

        # ── Column classification ──────────────────────────────────
        numeric_cols = df.select_dtypes(include=["number"]).columns.tolist()
        category_cols = df.select_dtypes(include=["object", "category"]).columns.tolist()

        # Detect datetime columns (including string-encoded dates)
        datetime_cols = df.select_dtypes(include=["datetime"]).columns.tolist()
        for col in category_cols[:]:
            try:
                pd.to_datetime(df[col], infer_datetime_format=True, errors="raise")
                datetime_cols.append(col)
                category_cols.remove(col)
            except (ValueError, TypeError):
                pass

        # ── Per-column metadata ────────────────────────────────────
        column_profiles: Dict[str, Dict[str, Any]] = {}
        for col in df.columns:
            series = df[col]
            col_type = "numeric" if col in numeric_cols else (
                "datetime" if col in datetime_cols else "categorical"
            )
            column_profiles[col] = {
                "dtype": str(series.dtype),
                "type": col_type,
                "missing_count": int(series.isnull().sum()),
                "missing_pct": round(float(series.isnull().mean() * 100), 2),
                "unique_count": int(series.nunique()),
                "memory_bytes": int(series.memory_usage(deep=True)),
            }

        # ── Data types summary ─────────────────────────────────────
        dtypes = {col: str(dtype) for col, dtype in df.dtypes.items()}

        # ── Missing values summary ─────────────────────────────────
        missing_counts = {col: int(v) for col, v in df.isnull().sum().items()}
        total_cells = rows * cols
        missing_pct = round((sum(missing_counts.values()) / total_cells) * 100, 2) if total_cells > 0 else 0

        # ── Health score ───────────────────────────────────────────
        # Penalize: missing data, low row count, extreme cardinality
        health = 100.0
        health -= min(missing_pct * 2, 40)  # Missing data penalty (max -40)
        if rows < 50:
            health -= 15  # Too few rows
        high_card_cols = sum(
            1 for col in category_cols
            if df[col].nunique() > rows * 0.5
        )
        health -= high_card_cols * 5  # High-cardinality penalty
        health_score = max(0, round(health))

        # ── Preview (first 10 rows) ───────────────────────────────
        preview = (
            df.head(10)
            .replace({pd.NA: None, float("nan"): None})
            .to_dict(orient="records")
        )

        return {
            "rows": rows,
            "columns": cols,
            "memory_usage_mb": round(memory_total / (1024 * 1024), 2),
            "missing_pct": missing_pct,
            "health_score": health_score,
            "dtypes": dtypes,
            "column_profiles": column_profiles,
            "missing_counts": missing_counts,
            "preview": preview,
            "numeric_columns": numeric_cols,
            "category_columns": category_cols,
            "datetime_columns": datetime_cols,
        }

    @staticmethod
    def get_dataframe(file_content: bytes) -> pd.DataFrame:
        """Return the DataFrame for use by other engines."""
        return pd.read_csv(io.BytesIO(file_content))
