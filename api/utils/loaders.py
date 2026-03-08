"""
MicroPulse API - Data Loaders
Helper functions to load data from JSON files with S3 support
"""

import json
import os
from typing import Optional, Dict, List
from api.utils.s3_loader import load_json_with_fallback, get_s3_config


def load_forecast_data(sku: str, pin: str) -> Optional[Dict]:
    """
    Load forecast data for a specific SKU × PIN combination.
    Supports loading from S3 or local files.
    
    Args:
        sku: SKU identifier
        pin: PIN code
        
    Returns:
        Dictionary with forecast data or None if not found
    """
    try:
        # Get S3 configuration
        s3_config = get_s3_config()
        s3_bucket = s3_config['bucket']
        s3_key = 'reports/all_model_results.json' if s3_bucket else None
        
        # Load data with S3 fallback
        all_forecasts = load_json_with_fallback(
            local_path='reports/all_model_results.json',
            s3_bucket=s3_bucket,
            s3_key=s3_key
        )
        
        if not all_forecasts:
            return None
        
        # Normalize pin to string for comparison
        pin_str = str(pin)
        
        # Find matching forecast
        for forecast in all_forecasts:
            if (forecast.get('sku_id') == sku and 
                str(forecast.get('pin_code')) == pin_str):
                return forecast
        
        return None
        
    except Exception as e:
        print(f"Error loading forecast data: {str(e)}")
        return None


def load_inventory_data(sku: str, pin: str) -> Optional[Dict]:
    """
    Load inventory data for a specific SKU × PIN combination.
    Supports loading from S3 or local files.
    
    Args:
        sku: SKU identifier
        pin: PIN code
        
    Returns:
        Dictionary with inventory data or None if not found
    """
    try:
        # Get S3 configuration
        s3_config = get_s3_config()
        s3_bucket = s3_config['bucket']
        s3_key = 'reports/inventory_results.json' if s3_bucket else None
        
        # Load data with S3 fallback
        all_inventory = load_json_with_fallback(
            local_path='reports/inventory_results.json',
            s3_bucket=s3_bucket,
            s3_key=s3_key
        )
        
        if not all_inventory:
            return None
        
        # Normalize pin to string for comparison
        pin_str = str(pin)
        
        # Find matching inventory
        for inventory in all_inventory:
            if (inventory.get('sku_id') == sku and 
                str(inventory.get('pin_code')) == pin_str):
                return inventory
        
        return None
        
    except Exception as e:
        print(f"Error loading inventory data: {str(e)}")
        return None


def load_all_combinations() -> List[Dict]:
    """
    Load all available SKU × PIN combinations.
    Supports loading from S3 or local files.
    
    Returns:
        List of dictionaries with sku_id and pin_code
    """
    combinations = []
    
    try:
        # Get S3 configuration
        s3_config = get_s3_config()
        s3_bucket = s3_config['bucket']
        s3_key = 'reports/all_model_results.json' if s3_bucket else None
        
        # Load data with S3 fallback
        all_forecasts = load_json_with_fallback(
            local_path='reports/all_model_results.json',
            s3_bucket=s3_bucket,
            s3_key=s3_key
        )
        
        if not all_forecasts:
            return []
        
        for forecast in all_forecasts:
            combinations.append({
                'sku_id': forecast.get('sku_id'),
                'pin_code': str(forecast.get('pin_code'))
            })
        
        return combinations
        
    except Exception as e:
        print(f"Error loading combinations: {str(e)}")
        return []


def load_summary_data() -> Dict:
    """
    Load summary data from all reports.
    Supports loading from S3 or local files.
    
    Returns:
        Dictionary with summary data
    """
    summary = {}
    
    # Get S3 configuration
    s3_config = get_s3_config()
    s3_bucket = s3_config['bucket']
    
    # Load model summary
    model_summary = load_json_with_fallback(
        local_path='reports/model_summary.json',
        s3_bucket=s3_bucket,
        s3_key='reports/model_summary.json' if s3_bucket else None
    )
    summary['model_summary'] = model_summary
    
    # Load inventory summary
    inventory_summary = load_json_with_fallback(
        local_path='reports/inventory_summary.json',
        s3_bucket=s3_bucket,
        s3_key='reports/inventory_summary.json' if s3_bucket else None
    )
    summary['inventory_summary'] = inventory_summary
    
    # Load impact projection
    impact_projection = load_json_with_fallback(
        local_path='reports/impact_projection.json',
        s3_bucket=s3_bucket,
        s3_key='reports/impact_projection.json' if s3_bucket else None
    )
    summary['impact_projection'] = impact_projection
    
    return summary


def load_heatmap_data(sku: str) -> List[Dict]:
    """
    Load heatmap data for a specific SKU across all PIN codes.
    Supports loading from S3 or local files.
    
    Args:
        sku: SKU identifier
        
    Returns:
        List of heatmap data points with PIN code, improvement, and level
    """
    heatmap_data = []
    
    try:
        # Get S3 configuration
        s3_config = get_s3_config()
        s3_bucket = s3_config['bucket']
        s3_key = 'reports/all_model_results.json' if s3_bucket else None
        
        # Load data with S3 fallback
        all_forecasts = load_json_with_fallback(
            local_path='reports/all_model_results.json',
            s3_bucket=s3_bucket,
            s3_key=s3_key
        )
        
        if not all_forecasts:
            return []
        
        for forecast in all_forecasts:
            if forecast.get('sku_id') == sku:
                improvement = forecast.get('mape_improvement_percent', 0)
                
                # Classify improvement level
                if improvement > 68:
                    level = "high"
                    color = "red"
                elif improvement >= 60:
                    level = "medium"
                    color = "orange"
                else:
                    level = "low"
                    color = "green"
                
                heatmap_data.append({
                    'pin_code': str(forecast.get('pin_code')),
                    'forecast_improvement': round(improvement, 2),
                    'demand_level': level,
                    'color': color,
                    'baseline_mape': round(forecast.get('baseline_mape', 0), 2),
                    'context_mape': round(forecast.get('context_mape', 0), 2),
                    'city': _map_pin_to_city(str(forecast.get('pin_code')))
                })
        
        # Sort by PIN code
        heatmap_data.sort(key=lambda x: x['pin_code'])
        
        return heatmap_data
        
    except Exception as e:
        print(f"Error loading heatmap data: {str(e)}")
        return []


def _map_pin_to_city(pin_code: str) -> str:
    """Helper function to map PIN code to city."""
    mapping = {
        "395001": "Surat", "395002": "Surat", "395003": "Surat",
        "395004": "Surat", "395005": "Surat", "395006": "Surat",
        "395007": "Surat", "395008": "Surat", "395009": "Surat",
        "395010": "Surat"
    }
    return mapping.get(pin_code, "Unknown")
