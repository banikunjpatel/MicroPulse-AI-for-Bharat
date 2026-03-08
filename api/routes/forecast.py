"""
MicroPulse API - Forecast Routes
Endpoints for accessing forecast data
"""

from fastapi import APIRouter, HTTPException, Query
from typing import Optional

from api.schemas import ForecastResponse, ErrorResponse, ListCombinationsResponse, HeatmapResponse
from api.utils.loaders import load_forecast_data, load_all_combinations, load_inventory_data, load_heatmap_data
from api.utils.helpers import (
    get_context_signals,
    get_market_context,
    calculate_forecast_confidence,
    generate_recommendation,
    apply_scenario_effect
)

router = APIRouter(prefix="/forecast", tags=["Forecast"])


@router.get("", response_model=ForecastResponse)
def get_forecast(
    sku: str = Query(..., description="SKU identifier"),
    pin: str = Query(..., description="PIN code"),
    scenario: Optional[str] = Query(None, description="Scenario simulation (heatwave, festival, holiday, promotion)")
):
    """
    Get forecast data for a specific SKU × PIN combination.
    
    Returns forecast accuracy metrics including:
    - Baseline MAPE
    - Context-aware MAPE
    - MAPE improvement percentage
    - Sigma reduction percentage
    - Context signals
    - Market context
    - AI recommendation
    - Scenario effects (if scenario parameter provided)
    """
    # Load forecast data
    forecast = load_forecast_data(sku, pin)
    
    if not forecast:
        raise HTTPException(
            status_code=404,
            detail=f"Forecast data not found for SKU '{sku}' × PIN '{pin}'"
        )
    
    # Load inventory data for better recommendations
    inventory = load_inventory_data(sku, pin)
    
    # Apply scenario effect if requested
    forecast, scenario_effect = apply_scenario_effect(forecast, scenario)
    
    # Get context signals
    context_signals = get_context_signals(sku, pin)
    
    # Get market context
    market_context = get_market_context(pin)
    
    # Calculate forecast confidence
    forecast_confidence = calculate_forecast_confidence(
        forecast.get('baseline_sigma'),
        forecast.get('context_sigma')
    )
    
    # Generate AI recommendation
    recommendation = generate_recommendation(forecast, inventory)
    
    # Return enhanced forecast response
    return ForecastResponse(
        sku=forecast.get('sku_id'),
        pin=str(forecast.get('pin_code')),
        baseline_mape=forecast.get('baseline_mape'),
        context_mape=forecast.get('context_mape'),
        mape_improvement_percent=forecast.get('mape_improvement_percent'),
        baseline_sigma=forecast.get('baseline_sigma'),
        context_sigma=forecast.get('context_sigma'),
        sigma_reduction_percent=forecast.get('sigma_reduction_percent'),
        context_signals=context_signals,
        market_context=market_context,
        forecast_confidence=forecast_confidence,
        recommendation=recommendation,
        scenario_effect=scenario_effect,
        status="success"
    )


@router.get("/list", response_model=ListCombinationsResponse)
def list_forecast_combinations():
    """
    List all available SKU × PIN combinations with forecast data.
    
    Returns a list of all combinations that have been forecasted.
    """
    combinations = load_all_combinations()
    
    return ListCombinationsResponse(
        total_combinations=len(combinations),
        combinations=combinations,
        status="success"
    )



@router.get("/heatmap", response_model=HeatmapResponse)
def get_heatmap(
    sku: str = Query(..., description="SKU identifier")
):
    """
    Get hyperlocal demand heatmap for a specific SKU across all PIN codes.
    
    Returns forecast improvement data for visualization:
    - PIN code
    - Forecast improvement percentage
    - Demand level classification (high/medium/low)
    - Color coding for visualization
    - City information
    """
    # Load heatmap data
    heatmap_data = load_heatmap_data(sku)
    
    if not heatmap_data:
        raise HTTPException(
            status_code=404,
            detail=f"No heatmap data found for SKU '{sku}'"
        )
    
    return HeatmapResponse(
        sku_id=sku,
        total_locations=len(heatmap_data),
        heatmap_data=heatmap_data,
        status="success"
    )
