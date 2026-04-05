import uuid
import pandas as pd
from typing import Dict, Any, Optional

from app.services.data_loader import DataProfiler
from app.services.stats_engine import StatsEngine
from app.services.insight_engine import InsightEngine
from app.services.visualization_engine import VisualizationEngine
from app.services.ml_advisor import MLAdvisor

class AnalysisOrchestrator:
    @staticmethod
    def process_upload(content: bytes, filename: str, problem_statement: str) -> Dict[str, Any]:
        """
        Orchestrates the 5 engines to process uploaded CSV data.
        Returns a rich dictionary ready to be saved and returned.
        Raises pandas errors if data is malformed.
        """
        try:
            session_id = str(uuid.uuid4())

            # ── 1. Data Profiling ──────────────────────────────────
            profile = DataProfiler.process_csv(content)
            df = DataProfiler.get_dataframe(content)

            # ── 2. Statistics Engine ───────────────────────────────
            stats_numerical = StatsEngine.get_numerical_stats(df, profile["numeric_columns"])
            stats_categorical = StatsEngine.get_categorical_stats(df, profile["category_columns"])
            correlation_matrix = StatsEngine.get_correlation_matrix(df)

            # ── 3. Visualization Engine ────────────────────────────
            chart_configs = VisualizationEngine.generate_chart_configs(
                df=df,
                numeric_cols=profile["numeric_columns"],
                category_cols=profile["category_columns"],
                datetime_cols=profile["datetime_columns"],
                correlation_matrix=correlation_matrix,
            )

            # ── 4. ML Advisor ──────────────────────────────────────
            ml_recommendation = MLAdvisor.analyze(
                problem_statement=problem_statement or "Analyze this dataset",
                df_shape=df.shape,
                numeric_cols=profile["numeric_columns"],
                category_cols=profile["category_columns"],
            )

            # ── 5. Insight Engine ──────────────────────────────────
            analysis_data = {
                **profile,
                "stats_numerical": stats_numerical,
                "stats_categorical": stats_categorical,
                "correlation_matrix": correlation_matrix,
            }
            insights = InsightEngine.generate_insights(analysis_data)

            # ── Build full report ──────────────────────────────────
            report = {
                "session_id": session_id,
                "filename": filename,
                "problem_statement": problem_statement,
                "rows": profile["rows"],
                "columns": profile["columns"],
                "memory_usage_mb": profile["memory_usage_mb"],
                "missing_pct": profile["missing_pct"],
                "health_score": profile["health_score"],
                "dtypes": profile["dtypes"],
                "column_profiles": profile["column_profiles"],
                "missing_counts": profile["missing_counts"],
                "preview": profile["preview"],
                "numeric_columns": profile["numeric_columns"],
                "category_columns": profile["category_columns"],
                "datetime_columns": profile["datetime_columns"],
                "stats_numerical": stats_numerical,
                "stats_categorical": stats_categorical,
                "correlation_matrix": correlation_matrix,
                "chart_configs": chart_configs,
                "ml_recommendation": ml_recommendation,
                "insights": insights,
            }

            return report

        except pd.errors.EmptyDataError:
            raise ValueError("CSV file is empty or malformed")
        except pd.errors.ParserError as e:
            raise ValueError(f"CSV parse error: {str(e)}")
        except Exception as e:
            raise RuntimeError(f"Analysis failed: {str(e)}")
