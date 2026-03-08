"""
MicroPulse API - Helper Functions
Utility functions for context signals, recommendations, and scenario simulation
"""

import random
from typing import Dict, Any, Optional


def map_pin_to_city(pin_code: str) -> str:
    """
    Map PIN code to city name.
    
    Args:
        pin_code: PIN code string
        
    Returns:
        City name
    """
    mapping = {
        "395001": "Surat",
        "395002": "Surat",
        "395003": "Surat",
        "395004": "Surat",
        "395005": "Surat",
        "395006": "Surat",
        "395007": "Surat",
        "395008": "Surat",
        "395009": "Surat",
        "395010": "Surat",
    }
    return mapping.get(pin_code, "Unknown")


def get_context_signals(sku: str, pin: str) -> Dict[str, Any]:
    """
    Generate context signals for a SKU × PIN combination.
    In production, this would come from real-time data sources.
    
    Args:
        sku: SKU identifier
        pin: PIN code
        
    Returns:
        Dictionary with context signals
    """
    # Simulate context signals (in production, fetch from real sources)
    # For demo purposes, generate realistic values
    
    # Temperature varies by location
    base_temp = 32 if pin.startswith("395") else 28
    temperature = base_temp + random.randint(-3, 5)
    
    # Weekend detection (simplified)
    is_weekend = random.choice([True, False])
    
    # Event detection
    events = ["None", "IPL Match", "Festival", "Holiday", "None", "None"]
    event = random.choice(events)
    
    return {
        "temperature": temperature,
        "weekend": is_weekend,
        "event": event,
        "humidity": random.randint(60, 85),
        "is_holiday": event in ["Festival", "Holiday"]
    }


def get_market_context(pin: str) -> Dict[str, Any]:
    """
    Get market context for a PIN code.
    
    Args:
        pin: PIN code
        
    Returns:
        Dictionary with market context
    """
    city = map_pin_to_city(pin)
    
    return {
        "city": city,
        "lead_time_days": 3,
        "forecast_horizon_days": 14,
        "service_level_target": 95,
        "region": "Gujarat" if city == "Surat" else "Unknown"
    }


def calculate_forecast_confidence(baseline_sigma: float, context_sigma: float) -> float:
    """
    Calculate forecast confidence based on sigma reduction.
    
    Args:
        baseline_sigma: Baseline forecast error (sigma)
        context_sigma: Context-aware forecast error (sigma)
        
    Returns:
        Confidence score (0-1)
    """
    if baseline_sigma == 0:
        return 0.5
    
    # Confidence increases as context sigma decreases relative to baseline
    confidence = 1 - (context_sigma / baseline_sigma)
    
    # Clamp between 0 and 1
    return max(0.0, min(1.0, confidence))


def generate_recommendation(
    forecast_data: Dict[str, Any],
    inventory_data: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Generate AI recommendation based on metrics.
    
    Args:
        forecast_data: Forecast metrics
        inventory_data: Inventory metrics (optional)
        
    Returns:
        Dictionary with recommendation
    """
    sigma_reduction = forecast_data.get('sigma_reduction_percent', 0)
    mape_improvement = forecast_data.get('mape_improvement_percent', 0)
    
    # If inventory data is available, use it
    if inventory_data:
        safety_stock_reduction = inventory_data.get('safety_stock_reduction_percent', 0)
        inventory_turnover_improvement = inventory_data.get('inventory_turnover_improvement_percent', 0)
        
        if safety_stock_reduction > 50:
            return {
                "action": "Reduce safety stock levels",
                "reason": f"Context-aware forecasting reduced demand uncertainty by {sigma_reduction:.1f}%, enabling significant safety stock optimization",
                "confidence": 0.90,
                "impact": f"Potential to reduce safety stock by {safety_stock_reduction:.1f}%"
            }
        elif inventory_turnover_improvement > 50:
            return {
                "action": "Increase replenishment frequency",
                "reason": f"Inventory turnover improved by {inventory_turnover_improvement:.1f}% with better forecast accuracy",
                "confidence": 0.85,
                "impact": "Faster inventory movement and reduced holding costs"
            }
    
    # Fallback to forecast-only recommendations
    if mape_improvement > 50:
        return {
            "action": "Optimize inventory policies",
            "reason": f"Forecast accuracy improved by {mape_improvement:.1f}%, enabling better inventory decisions",
            "confidence": 0.88,
            "impact": "Reduced stockouts and excess inventory"
        }
    elif mape_improvement > 20:
        return {
            "action": "Review stocking policies",
            "reason": f"Moderate forecast improvement of {mape_improvement:.1f}% detected",
            "confidence": 0.75,
            "impact": "Potential for inventory optimization"
        }
    else:
        return {
            "action": "Maintain current stocking policy",
            "reason": "No significant forecast improvement detected",
            "confidence": 0.70,
            "impact": "Continue monitoring performance"
        }


def apply_scenario_effect(
    forecast_data: Dict[str, Any],
    scenario: Optional[str] = None
) -> tuple[Dict[str, Any], Optional[Dict[str, Any]]]:
    """
    Apply scenario effect to forecast data.
    This simulates demand changes without retraining the model.
    
    Args:
        forecast_data: Original forecast data
        scenario: Scenario name ('heatwave', 'festival', or None)
        
    Returns:
        Tuple of (adjusted_forecast_data, scenario_effect_info)
    """
    if not scenario or scenario.lower() == "normal":
        return forecast_data, None
    
    # Define scenario multipliers
    scenario_multipliers = {
        "heatwave": 1.15,  # 15% demand increase
        "festival": 1.20,   # 20% demand increase
        "holiday": 1.18,    # 18% demand increase
        "promotion": 1.25   # 25% demand increase
    }
    
    multiplier = scenario_multipliers.get(scenario.lower(), 1.0)
    
    if multiplier == 1.0:
        return forecast_data, None
    
    # Create adjusted forecast data
    adjusted_data = forecast_data.copy()
    
    # Note: We don't adjust MAPE or sigma as these are accuracy metrics
    # In a real scenario, you might adjust the forecast values themselves
    # For this demo, we'll just return the scenario effect information
    
    scenario_effect = {
        "scenario": scenario.lower(),
        "demand_uplift": f"+{int((multiplier - 1) * 100)}%",
        "multiplier": multiplier,
        "description": get_scenario_description(scenario.lower())
    }
    
    return adjusted_data, scenario_effect


def get_scenario_description(scenario: str) -> str:
    """
    Get description for a scenario.
    
    Args:
        scenario: Scenario name
        
    Returns:
        Description string
    """
    descriptions = {
        "heatwave": "High temperature driving increased beverage demand",
        "festival": "Festival season with elevated consumption patterns",
        "holiday": "Holiday period with increased retail activity",
        "promotion": "Promotional campaign driving higher sales"
    }
    return descriptions.get(scenario, "Custom scenario")


def classify_improvement_level(improvement_percent: float) -> str:
    """
    Classify forecast improvement into demand levels.
    
    Args:
        improvement_percent: Forecast improvement percentage
        
    Returns:
        Demand level classification (high/medium/low)
    """
    if improvement_percent > 70:
        return "high"
    elif improvement_percent >= 60:
        return "medium"
    else:
        return "low"


def get_level_color(level: str) -> str:
    """
    Get color code for demand level.
    
    Args:
        level: Demand level (high/medium/low)
        
    Returns:
        Color name
    """
    colors = {
        "high": "red",
        "medium": "yellow",
        "low": "green"
    }
    return colors.get(level, "gray")
