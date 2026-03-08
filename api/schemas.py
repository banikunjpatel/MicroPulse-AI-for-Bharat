"""
MicroPulse API - Request/Response Schemas
Pydantic models for API validation
"""

from pydantic import BaseModel, Field
from typing import Optional


class ForecastRequest(BaseModel):
    """Request model for forecast endpoint."""
    sku: str = Field(..., description="SKU identifier")
    pin: str = Field(..., description="PIN code")


class ForecastResponse(BaseModel):
    """Response model for forecast endpoint."""
    sku: str
    pin: str
    baseline_mape: float
    context_mape: float
    mape_improvement_percent: float
    baseline_sigma: float
    context_sigma: float
    sigma_reduction_percent: float
    context_signals: Optional[dict] = None
    market_context: Optional[dict] = None
    forecast_confidence: Optional[float] = None
    recommendation: Optional[dict] = None
    scenario_effect: Optional[dict] = None
    status: str = "success"


class InventoryRequest(BaseModel):
    """Request model for inventory endpoint."""
    sku: str = Field(..., description="SKU identifier")
    pin: str = Field(..., description="PIN code")


class InventoryResponse(BaseModel):
    """Response model for inventory endpoint."""
    sku: str
    pin: str
    baseline_safety_stock: float
    context_safety_stock: float
    safety_stock_reduction_percent: float
    baseline_working_capital: float
    context_working_capital: float
    working_capital_saved: float
    working_capital_saved_percent: float
    baseline_stockout_rate: float
    context_stockout_rate: float
    baseline_inventory_turnover: float
    context_inventory_turnover: float
    inventory_turnover_improvement_percent: float
    status: str = "success"


class ChatRequest(BaseModel):
    """Request model for chat endpoint."""
    session_id: Optional[str] = Field(None, description="Session ID for conversation continuity")
    sku: str = Field(..., description="SKU identifier")
    pin: str = Field(..., description="PIN code")
    question: str = Field(..., description="User question")


class ChatResponse(BaseModel):
    """Response model for chat endpoint."""
    session_id: str
    sku: str
    pin: str
    question: str
    answer: str
    status: str
    is_new_session: Optional[bool] = None
    conversation_length: Optional[int] = None


class ErrorResponse(BaseModel):
    """Error response model."""
    error: str
    detail: Optional[str] = None
    status: str = "error"


class HealthResponse(BaseModel):
    """Health check response."""
    status: str
    message: str
    version: str = "1.0.0"


class ListCombinationsResponse(BaseModel):
    """Response for listing available SKU × PIN combinations."""
    total_combinations: int
    combinations: list
    status: str = "success"


class HeatmapResponse(BaseModel):
    """Response for heatmap data."""
    sku_id: str
    total_locations: int
    heatmap_data: list
    status: str = "success"

