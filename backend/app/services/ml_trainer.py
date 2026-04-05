"""
ML Trainer Engine
==================
Trains the recommended model on the dataset and returns
evaluation metrics, feature importances, and predictions.
Uses only scikit-learn models (no XGBoost/CatBoost — not installed).
"""

import io
import logging
from typing import Any, Dict, List, Optional, Tuple

import numpy as np
import pandas as pd
from sklearn.cluster import KMeans, MiniBatchKMeans
from sklearn.ensemble import (
    GradientBoostingClassifier,
    GradientBoostingRegressor,
    RandomForestClassifier,
    RandomForestRegressor,
)
from sklearn.linear_model import LinearRegression, LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    f1_score,
    mean_absolute_error,
    mean_squared_error,
    precision_score,
    r2_score,
    recall_score,
    silhouette_score,
)
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder

logger = logging.getLogger(__name__)

MAX_TRAINING_ROWS = 100_000

# Maps recommended model names to sklearn classes (or fallbacks)
MODEL_MAP: Dict[str, Any] = {
    # Classification
    "RandomForestClassifier": RandomForestClassifier,
    "GradientBoostingClassifier": GradientBoostingClassifier,
    "LogisticRegression": LogisticRegression,
    "CatBoostClassifier": GradientBoostingClassifier,  # fallback
    "XGBClassifier": GradientBoostingClassifier,  # fallback
    "LGBMClassifier": GradientBoostingClassifier,  # fallback
    # Regression
    "RandomForestRegressor": RandomForestRegressor,
    "GradientBoostingRegressor": GradientBoostingRegressor,
    "LinearRegression": LinearRegression,
    "CatBoostRegressor": GradientBoostingRegressor,  # fallback
    "XGBRegressor": GradientBoostingRegressor,  # fallback
    "LGBMRegressor": GradientBoostingRegressor,  # fallback
    # Clustering
    "KMeans": KMeans,
    "MiniBatchKMeans": MiniBatchKMeans,
}

FALLBACK_NAMES: Dict[str, str] = {
    "CatBoostClassifier": "GradientBoostingClassifier",
    "XGBClassifier": "GradientBoostingClassifier",
    "LGBMClassifier": "GradientBoostingClassifier",
    "CatBoostRegressor": "GradientBoostingRegressor",
    "XGBRegressor": "GradientBoostingRegressor",
    "LGBMRegressor": "GradientBoostingRegressor",
}


class MLTrainer:
    """Trains models and returns structured evaluation results."""

    @staticmethod
    def train(
        csv_content: bytes,
        problem_type: str,
        recommended_model: str,
        target_column: Optional[str],
        numeric_cols: List[str],
        category_cols: List[str],
    ) -> Dict[str, Any]:
        df = pd.read_csv(io.BytesIO(csv_content))

        if len(df) > MAX_TRAINING_ROWS:
            df = df.sample(n=MAX_TRAINING_ROWS, random_state=42)

        actual_model_name = FALLBACK_NAMES.get(recommended_model, recommended_model)
        model_cls = MODEL_MAP.get(recommended_model)
        if model_cls is None:
            raise ValueError(f"Unsupported model: {recommended_model}")

        if problem_type == "clustering":
            return MLTrainer._train_clustering(df, model_cls, actual_model_name, numeric_cols)

        if not target_column or target_column not in df.columns:
            raise ValueError(
                f"Target column '{target_column}' not found in dataset. "
                "Cannot train a supervised model without a valid target."
            )

        if problem_type == "classification":
            return MLTrainer._train_classification(
                df, model_cls, actual_model_name, target_column, numeric_cols, category_cols
            )

        return MLTrainer._train_regression(
            df, model_cls, actual_model_name, target_column, numeric_cols, category_cols
        )

    @staticmethod
    def _prepare_features(
        df: pd.DataFrame,
        target_column: str,
        numeric_cols: List[str],
        category_cols: List[str],
    ) -> Tuple[pd.DataFrame, pd.Series, List[str]]:
        """Encode categoricals, drop target, return X, y, feature_names."""
        y = df[target_column].copy()
        feature_cols = [c for c in numeric_cols + category_cols if c != target_column]
        X = df[feature_cols].copy()

        # Label-encode categoricals
        encoders: Dict[str, LabelEncoder] = {}
        for col in category_cols:
            if col == target_column or col not in X.columns:
                continue
            le = LabelEncoder()
            X[col] = le.fit_transform(X[col].astype(str))
            encoders[col] = le

        # Fill remaining NaNs
        X = X.fillna(0)

        return X, y, list(X.columns)

    @staticmethod
    def _train_classification(
        df: pd.DataFrame,
        model_cls: Any,
        model_name: str,
        target_column: str,
        numeric_cols: List[str],
        category_cols: List[str],
    ) -> Dict[str, Any]:
        X, y, feature_names = MLTrainer._prepare_features(
            df, target_column, numeric_cols, category_cols
        )

        # Encode target if it's not numeric
        target_le: Optional[LabelEncoder] = None
        if y.dtype == object:
            target_le = LabelEncoder()
            y = pd.Series(target_le.fit_transform(y.astype(str)), name=target_column)

        y = y.fillna(0)

        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y if len(y.unique()) > 1 else None
        )

        model = model_cls(random_state=42) if "random_state" in model_cls.__init__.__code__.co_varnames else model_cls()
        model.fit(X_train, y_train)
        y_pred = model.predict(X_test)

        is_binary = len(y.unique()) <= 2
        avg = "binary" if is_binary else "weighted"

        metrics = {
            "accuracy": round(float(accuracy_score(y_test, y_pred)), 4),
            "f1_score": round(float(f1_score(y_test, y_pred, average=avg, zero_division=0)), 4),
            "precision": round(float(precision_score(y_test, y_pred, average=avg, zero_division=0)), 4),
            "recall": round(float(recall_score(y_test, y_pred, average=avg, zero_division=0)), 4),
        }

        importances = MLTrainer._get_feature_importances(model, feature_names)

        class_labels = target_le.classes_.tolist() if target_le else sorted(y.unique().tolist())

        return {
            "status": "success",
            "problem_type": "classification",
            "model_trained": model_name,
            "test_size": len(X_test),
            "train_size": len(X_train),
            "metrics": metrics,
            "feature_importances": importances,
            "class_labels": [str(c) for c in class_labels],
            "target_column": target_column,
        }

    @staticmethod
    def _train_regression(
        df: pd.DataFrame,
        model_cls: Any,
        model_name: str,
        target_column: str,
        numeric_cols: List[str],
        category_cols: List[str],
    ) -> Dict[str, Any]:
        X, y, feature_names = MLTrainer._prepare_features(
            df, target_column, numeric_cols, category_cols
        )

        y = pd.to_numeric(y, errors="coerce").fillna(0)

        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42
        )

        model = model_cls(random_state=42) if "random_state" in model_cls.__init__.__code__.co_varnames else model_cls()
        model.fit(X_train, y_train)
        y_pred = model.predict(X_test)

        metrics = {
            "r2_score": round(float(r2_score(y_test, y_pred)), 4),
            "mae": round(float(mean_absolute_error(y_test, y_pred)), 4),
            "rmse": round(float(np.sqrt(mean_squared_error(y_test, y_pred))), 4),
        }

        importances = MLTrainer._get_feature_importances(model, feature_names)

        return {
            "status": "success",
            "problem_type": "regression",
            "model_trained": model_name,
            "test_size": len(X_test),
            "train_size": len(X_train),
            "metrics": metrics,
            "feature_importances": importances,
            "target_column": target_column,
        }

    @staticmethod
    def _train_clustering(
        df: pd.DataFrame,
        model_cls: Any,
        model_name: str,
        numeric_cols: List[str],
    ) -> Dict[str, Any]:
        use_cols = [c for c in numeric_cols if c in df.columns]
        if not use_cols:
            raise ValueError("No numeric columns available for clustering.")

        X = df[use_cols].fillna(0)

        n_clusters = min(5, len(X))
        model = model_cls(n_clusters=n_clusters, random_state=42, n_init=10)
        labels = model.fit_predict(X)

        sil = round(float(silhouette_score(X, labels)), 4) if len(set(labels)) > 1 else 0.0
        inertia = round(float(model.inertia_), 2)

        cluster_sizes = {}
        for label in sorted(set(labels)):
            cluster_sizes[str(label)] = int((labels == label).sum())

        return {
            "status": "success",
            "problem_type": "clustering",
            "model_trained": model_name,
            "test_size": 0,
            "train_size": len(X),
            "metrics": {
                "silhouette_score": sil,
                "inertia": inertia,
                "n_clusters": n_clusters,
            },
            "feature_importances": [],
            "cluster_sizes": cluster_sizes,
        }

    @staticmethod
    def _get_feature_importances(
        model: Any, feature_names: List[str]
    ) -> List[Dict[str, Any]]:
        importances: Optional[np.ndarray] = None

        if hasattr(model, "feature_importances_"):
            importances = model.feature_importances_
        elif hasattr(model, "coef_"):
            coef = model.coef_
            if coef.ndim > 1:
                importances = np.mean(np.abs(coef), axis=0)
            else:
                importances = np.abs(coef)

        if importances is None:
            return []

        pairs = sorted(
            zip(feature_names, importances.tolist()),
            key=lambda x: x[1],
            reverse=True,
        )

        return [{"feature": name, "importance": round(val, 4)} for name, val in pairs[:20]]
