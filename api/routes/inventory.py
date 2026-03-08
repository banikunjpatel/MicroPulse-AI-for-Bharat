"""
MicroPulse API - Inventory Routes
Endpoints for accessing inventory simulation data
"""

from fastapi import APIRouter, HTTPException, Query

from api.schemas import InventoryResponse, ErrorResponse
from api.utils.loaders import load_inventory_data

router = APIRouter(prefix="/inventory", tags=["Inventory"])


@router.get("", response_model=InventoryResponse)
def get_inventory(
    sku: str = Query(..., description="SKU identifier"),
    pin: str = Query(..., description="PIN code")
):
    """
    Get inventory simulation data for a specific SKU × PIN combination.
    
    Returns inventory optimization metrics including:
    - Safety stock reduction
    - Working capital saved
    - Inventory turnover improvement
    - Stockout rates
    """
    # Load inventory data
    inventory = load_inventory_data(sku, pin)
    
    if not inventory:
        raise HTTPException(
            status_code=404,
            detail=f"Inventory data not found for SKU '{sku}' × PIN '{pin}'"
        )
    
    # Return inventory response
    return InventoryResponse(
        sku=inventory.get('sku_id'),
        pin=str(inventory.get('pin_code')),
        baseline_safety_stock=inventory.get('baseline_safety_stock'),
        context_safety_stock=inventory.get('context_safety_stock'),
        safety_stock_reduction_percent=inventory.get('safety_stock_reduction_percent'),
        baseline_working_capital=inventory.get('baseline_working_capital'),
        context_working_capital=inventory.get('context_working_capital'),
        working_capital_saved=inventory.get('working_capital_saved'),
        working_capital_saved_percent=inventory.get('working_capital_saved_percent'),
        baseline_stockout_rate=inventory.get('baseline_stockout_rate'),
        context_stockout_rate=inventory.get('context_stockout_rate'),
        baseline_inventory_turnover=inventory.get('baseline_inventory_turnover'),
        context_inventory_turnover=inventory.get('context_inventory_turnover'),
        inventory_turnover_improvement_percent=inventory.get('inventory_turnover_improvement_percent'),
        status="success"
    )
