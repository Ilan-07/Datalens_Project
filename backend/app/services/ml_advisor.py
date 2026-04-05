"""
ML Advisor Engine
==================
Analyzes the problem statement and dataset characteristics
to recommend the best ML model and problem type.
No deep learning — lightweight and explainable only.
"""

from typing import Dict, Any, List, Optional
import re


class MLAdvisor:
    """Recommends ML models based on dataset + problem statement analysis."""

    # ── Problem type detection keywords ────────────────────────────
    REGRESSION_KEYWORDS = [
        "predict", "forecast", "estimate", "price", "revenue",
        "salary", "cost", "amount", "value", "regression",
        "how much", "continuous",
    ]
    CLASSIFICATION_KEYWORDS = [
        "classify", "classification", "categorize", "detect",
        "spam", "fraud", "churn", "diagnosis", "positive", "negative",
        "yes or no", "true or false", "label", "class",
        "will it", "is it", "binary",
    ]
    CLUSTERING_KEYWORDS = [
        "cluster", "segment", "group", "similar", "pattern",
        "anomaly", "outlier", "unsupervised",
    ]

    @staticmethod
    def analyze(
        problem_statement: str,
        df_shape: tuple,
        numeric_cols: List[str],
        category_cols: List[str],
        target_column: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Analyze the problem and recommend a model.

        Returns:
            {
                "problem_type": "regression" | "classification" | "clustering",
                "recommended_model": str,
                "reason": str,
                "target_column": str | None,
                "alternatives": List[str],
                "dataset_summary": {...}
            }
        """
        rows, cols = df_shape
        problem_lower = problem_statement.lower().strip()

        # ── 1. Detect problem type from statement ──────────────────
        problem_type = MLAdvisor._detect_problem_type(problem_lower, target_column, numeric_cols)

        # ── 2. Detect target column if not provided ────────────────
        if not target_column:
            target_column = MLAdvisor._detect_target_column(
                problem_lower, numeric_cols + category_cols
            )

        # ── 3. Recommend model ─────────────────────────────────────
        model, reason, alternatives = MLAdvisor._recommend_model(
            problem_type, rows, cols,
            len(numeric_cols), len(category_cols),
        )

        return {
            "problem_type": problem_type,
            "recommended_model": model,
            "reason": reason,
            "target_column": target_column,
            "alternatives": alternatives,
            "dataset_summary": {
                "rows": rows,
                "columns": cols,
                "numeric_features": len(numeric_cols),
                "categorical_features": len(category_cols),
                "size_category": (
                    "small" if rows < 5000
                    else "medium" if rows < 50000
                    else "large"
                ),
            },
        }

    @staticmethod
    def _detect_problem_type(
        problem: str,
        target_col: Optional[str],
        numeric_cols: List[str],
    ) -> str:
        """Detect problem type from the problem statement text."""

        # Score each type
        regression_score = sum(
            1 for kw in MLAdvisor.REGRESSION_KEYWORDS if kw in problem
        )
        classification_score = sum(
            1 for kw in MLAdvisor.CLASSIFICATION_KEYWORDS if kw in problem
        )
        clustering_score = sum(
            1 for kw in MLAdvisor.CLUSTERING_KEYWORDS if kw in problem
        )

        scores = {
            "regression": regression_score,
            "classification": classification_score,
            "clustering": clustering_score,
        }

        best = max(scores, key=scores.get)  # type: ignore

        # If no keywords matched, infer from target column
        if scores[best] == 0:
            if target_col and target_col in numeric_cols:
                return "regression"
            elif target_col:
                return "classification"
            return "regression"  # Default

        return best

    @staticmethod
    def _detect_target_column(
        problem: str, all_columns: List[str]
    ) -> Optional[str]:
        """Try to detect target column from problem statement."""
        # Check if any column name is mentioned in the problem
        for col in all_columns:
            if col.lower() in problem:
                return col

        # Check common target names
        target_keywords = [
            "target", "label", "class", "churn", "price",
            "output", "result", "winner", "status", "survived",
        ]
        for col in all_columns:
            if any(kw in col.lower() for kw in target_keywords):
                return col

        return None

    @staticmethod
    def _recommend_model(
        problem_type: str,
        rows: int,
        cols: int,
        n_numeric: int,
        n_categorical: int,
    ) -> tuple:
        """Recommend model based on problem type and dataset characteristics."""

        if problem_type == "clustering":
            if rows < 10000:
                return (
                    "KMeans",
                    f"Dataset has {rows} rows — KMeans is efficient for small-medium clustering tasks",
                    ["DBSCAN", "AgglomerativeClustering"],
                )
            else:
                return (
                    "MiniBatchKMeans",
                    f"Dataset has {rows} rows — MiniBatchKMeans scales better for larger datasets",
                    ["DBSCAN", "KMeans"],
                )

        if problem_type == "classification":
            if n_categorical > n_numeric and n_categorical > 3:
                return (
                    "CatBoostClassifier",
                    f"Dataset has {n_categorical} categorical features — CatBoost handles categories natively without encoding",
                    ["RandomForestClassifier", "GradientBoostingClassifier"],
                )
            elif rows < 5000:
                return (
                    "RandomForestClassifier",
                    f"Dataset is small ({rows} rows) — Random Forest provides robust performance without overfitting",
                    ["LogisticRegression", "GradientBoostingClassifier"],
                )
            elif rows > 50000:
                return (
                    "XGBClassifier",
                    f"Large dataset ({rows} rows) — XGBoost is optimized for speed and accuracy at scale",
                    ["LGBMClassifier", "RandomForestClassifier"],
                )
            else:
                return (
                    "GradientBoostingClassifier",
                    f"Medium dataset ({rows} rows, {cols} features) — Gradient Boosting balances accuracy and speed",
                    ["RandomForestClassifier", "XGBClassifier"],
                )

        # Regression (default)
        if n_categorical > n_numeric and n_categorical > 3:
            return (
                "CatBoostRegressor",
                f"Dataset has {n_categorical} categorical features — CatBoost handles categories natively",
                ["RandomForestRegressor", "GradientBoostingRegressor"],
            )
        elif rows < 5000:
            return (
                "RandomForestRegressor",
                f"Dataset is small ({rows} rows) — Random Forest is robust and avoids overfitting",
                ["LinearRegression", "GradientBoostingRegressor"],
            )
        elif rows > 50000:
            return (
                "XGBRegressor",
                f"Large dataset ({rows} rows) — XGBoost is optimized for speed at scale",
                ["LGBMRegressor", "RandomForestRegressor"],
            )
        else:
            return (
                "GradientBoostingRegressor",
                f"Medium dataset ({rows} rows, {cols} features) — Gradient Boosting balances accuracy and generalization",
                ["RandomForestRegressor", "XGBRegressor"],
            )
