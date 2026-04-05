from pydantic import BaseModel, ConfigDict, Field
from typing import List, Dict, Any, Optional

class ReportSummary(BaseModel):
    id: str
    filename: Optional[str] = None
    rows: Optional[int] = None
    columns: Optional[int] = None
    health_score: Optional[float] = None
    created_at: Optional[str] = None
    status: Optional[str] = None

    model_config = ConfigDict(from_attributes=True, extra="ignore")

class ReportListResponse(BaseModel):
    reports: List[ReportSummary]
    
    model_config = ConfigDict(from_attributes=True, extra="ignore")

class HealthResponse(BaseModel):
    status: str
    version: str
