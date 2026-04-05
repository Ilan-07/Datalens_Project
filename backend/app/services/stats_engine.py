"""
Statistics Engine
==================
Computes descriptive statistics for numerical and categorical columns.
All values dynamically computed from the dataset.
"""

import pandas as pd
import numpy as np
from scipy.stats import skew, kurtosis, entropy
from typing import Dict, Any, List


class StatsEngine:
    @staticmethod
    def get_numerical_stats(df: pd.DataFrame, columns: List[str]) -> Dict[str, Any]:
        """Compute comprehensive stats for numerical columns."""
        stats = {}
        for col in columns:
            series = df[col].dropna()
            if series.empty:
                continue

            q1 = float(series.quantile(0.25))
            q3 = float(series.quantile(0.75))
            iqr_val = q3 - q1

            stats[col] = {
                "mean": round(float(series.mean()), 4),
                "median": round(float(series.median()), 4),
                "std": round(float(series.std()), 4),
                "min": round(float(series.min()), 4),
                "max": round(float(series.max()), 4),
                "q1": round(q1, 4),
                "q3": round(q3, 4),
                "iqr": round(iqr_val, 4),
                "skewness": round(float(skew(series)), 4),
                "kurtosis": round(float(kurtosis(series)), 4),
                "coeff_variation": round(
                    float(series.std() / series.mean()), 4
                ) if series.mean() != 0 else 0,
                "outliers_iqr": int(StatsEngine._count_outliers_iqr(series)),
                "count": int(series.count()),
            }
        return stats

    @staticmethod
    def get_categorical_stats(df: pd.DataFrame, columns: List[str]) -> Dict[str, Any]:
        """Compute statistics for categorical columns."""
        stats = {}
        for col in columns:
            series = df[col].dropna()
            if series.empty:
                continue

            counts = series.value_counts()
            top_n = {str(k): int(v) for k, v in counts.head(10).items()}

            # Entropy for distribution balance
            prob = counts / counts.sum()
            ent = float(entropy(prob))

            stats[col] = {
                "cardinality": int(series.nunique()),
                "top_categories": top_n,
                "most_frequent": str(counts.idxmax()),
                "most_frequent_freq": int(counts.max()),
                "entropy": round(ent, 4),
                "missing_count": int(df[col].isnull().sum()),
                "count": int(series.count()),
            }
        return stats

    @staticmethod
    def _count_outliers_iqr(series: pd.Series) -> int:
        """Count outliers using IQR method."""
        q1 = series.quantile(0.25)
        q3 = series.quantile(0.75)
        iqr = q3 - q1
        lower = q1 - 1.5 * iqr
        upper = q3 + 1.5 * iqr
        return int(((series < lower) | (series > upper)).sum())

    @staticmethod
    def get_correlation_matrix(df: pd.DataFrame) -> Dict[str, Dict[str, Any]]:
        """Compute Pearson correlation for numerical columns."""
        numeric_df = df.select_dtypes(include=["number"])
        if numeric_df.empty or len(numeric_df.columns) < 2:
            return {}

        corr = numeric_df.corr()
        # Replace NaN with None for JSON serialization
        return {
            str(col): {
                str(k): round(float(v), 4) if pd.notna(v) else None
                for k, v in row.items()
            }
            for col, row in corr.items()
        }
