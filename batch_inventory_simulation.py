"""
Batch Inventory Simulation for All SKU × PIN Combinations
Run inventory simulation for baseline and context-aware models
"""

import json
import numpy as np
from typing import Dict, List
from core.inventory_simulation import run_inventory_simulation


def load_forecast_results(results_path: str = 'reports/all_model_results.json') -> List[Dict]:
    """
    Load forecast results for all SKU × PIN combinations.
    
    Args:
        results_path: Path to all_model_results.json
        
    Returns:
        List of result dictionaries
    """
    with open(results_path, 'r') as f:
        results = json.load(f)
    
    return results


def generate_test_data(mean_actual: float, sigma: float, num_days: int = 36, seed: int = 42) -> tuple:
    """
    Generate synthetic test data for simulation.
    
    Args:
        mean_actual: Mean actual demand
        sigma: Forecast error standard deviation
        num_days: Number of days to simulate
        seed: Random seed for reproducibility
        
    Returns:
        Tuple of (actual_test, forecast_test)
    """
    np.random.seed(seed)
    
    # Generate actual demand
    actual_test = np.random.normal(mean_actual, 10, num_days)
    actual_test = np.maximum(actual_test, mean_actual * 0.5)  # Floor at 50% of mean
    
    # Generate forecast with error
    forecast_test = actual_test + np.random.normal(0, sigma, num_days)
    
    return actual_test, forecast_test


def run_batch_inventory_simulation(
    results_path: str = 'reports/all_model_results.json',
    output_path: str = 'reports/inventory_results.json',
    summary_path: str = 'reports/inventory_summary.json',
    unit_cost: float = 10.5,
    unit_margin: float = 4.2,
    holding_cost_per_unit: float = 0.05,
    lead_time: int = 3,
    review_period: int = 7,
    service_level_z: float = 1.65
) -> Dict:
    """
    Run inventory simulation for all SKU × PIN combinations.
    
    Args:
        results_path: Path to forecast results JSON
        output_path: Path to save inventory results
        summary_path: Path to save inventory summary
        unit_cost: Cost per unit
        unit_margin: Profit margin per unit
        holding_cost_per_unit: Holding cost per unit per day
        lead_time: Lead time in days
        review_period: Review period in days
        service_level_z: Z-score for service level
        
    Returns:
        Dictionary with detailed results and summary
    """
    print("="*70)
    print("BATCH INVENTORY SIMULATION")
    print("="*70)
    
    # Load forecast results
    print(f"\nLoading forecast results from {results_path}...")
    forecast_results = load_forecast_results(results_path)
    print(f"Found {len(forecast_results)} SKU × PIN combinations")
    
    # Store inventory results
    inventory_results = []
    
    # Process each combination
    for i, result in enumerate(forecast_results, 1):
        sku_id = result['sku_id']
        pin_code = result['pin_code']
        
        print(f"\n[{i}/{len(forecast_results)}] Processing {sku_id} × {pin_code}...")
        
        try:
            # Load individual forecast files for detailed data
            baseline_file = f'reports/baseline_{sku_id}_{pin_code}.json'
            context_file = f'reports/context_{sku_id}_{pin_code}.json'
            
            with open(baseline_file, 'r') as f:
                baseline_data = json.load(f)
            
            with open(context_file, 'r') as f:
                context_data = json.load(f)
            
            # Generate test data (same actual demand for both models)
            mean_actual = baseline_data['mean_actual']
            actual_test, _ = generate_test_data(mean_actual, 0, seed=42)
            
            # Generate baseline forecast
            _, baseline_forecast = generate_test_data(
                mean_actual, 
                baseline_data['sigma_forecast'], 
                seed=42
            )
            
            # Generate context-aware forecast
            _, context_forecast = generate_test_data(
                mean_actual, 
                context_data['sigma_forecast'], 
                seed=42
            )
            
            # Run baseline simulation
            baseline_sim = run_inventory_simulation(
                forecast_test=baseline_forecast,
                actual_test=actual_test,
                sigma_forecast=baseline_data['sigma_forecast'],
                unit_cost=unit_cost,
                unit_margin=unit_margin,
                holding_cost_per_unit=holding_cost_per_unit,
                lead_time=lead_time,
                review_period=review_period,
                service_level_z=service_level_z
            )
            
            # Run context-aware simulation
            context_sim = run_inventory_simulation(
                forecast_test=context_forecast,
                actual_test=actual_test,
                sigma_forecast=context_data['sigma_forecast'],
                unit_cost=unit_cost,
                unit_margin=unit_margin,
                holding_cost_per_unit=holding_cost_per_unit,
                lead_time=lead_time,
                review_period=review_period,
                service_level_z=service_level_z
            )
            
            # Calculate impact metrics
            safety_stock_reduction = baseline_sim['safety_stock'] - context_sim['safety_stock']
            safety_stock_reduction_percent = round(
                (safety_stock_reduction / baseline_sim['safety_stock']) * 100, 2
            ) if baseline_sim['safety_stock'] > 0 else 0
            
            working_capital_saved = baseline_sim['working_capital'] - context_sim['working_capital']
            working_capital_saved_percent = round(
                (working_capital_saved / baseline_sim['working_capital']) * 100, 2
            ) if baseline_sim['working_capital'] > 0 else 0
            
            holding_cost_reduction = baseline_sim['holding_cost'] - context_sim['holding_cost']
            
            # Store results
            inventory_result = {
                'sku_id': sku_id,
                'pin_code': pin_code,
                
                # Baseline metrics
                'baseline_safety_stock': baseline_sim['safety_stock'],
                'baseline_order_up_to': baseline_sim['order_up_to'],
                'baseline_stockout_rate': baseline_sim['stockout_rate'],
                'baseline_lost_sales': baseline_sim['lost_sales_units'],
                'baseline_working_capital': baseline_sim['working_capital'],
                'baseline_holding_cost': baseline_sim['holding_cost'],
                'baseline_average_inventory': baseline_sim['average_inventory'],
                'baseline_inventory_turnover': baseline_sim['inventory_turnover'],
                
                # Context-aware metrics
                'context_safety_stock': context_sim['safety_stock'],
                'context_order_up_to': context_sim['order_up_to'],
                'context_stockout_rate': context_sim['stockout_rate'],
                'context_lost_sales': context_sim['lost_sales_units'],
                'context_working_capital': context_sim['working_capital'],
                'context_holding_cost': context_sim['holding_cost'],
                'context_average_inventory': context_sim['average_inventory'],
                'context_inventory_turnover': context_sim['inventory_turnover'],
                
                # Impact metrics
                'safety_stock_reduction': round(safety_stock_reduction, 2),
                'safety_stock_reduction_percent': safety_stock_reduction_percent,
                'working_capital_saved': round(working_capital_saved, 2),
                'working_capital_saved_percent': working_capital_saved_percent,
                'holding_cost_reduction': round(holding_cost_reduction, 2),
                'stockout_rate_reduction': round(
                    baseline_sim['stockout_rate'] - context_sim['stockout_rate'], 2
                ),
                'lost_sales_reduction': round(
                    baseline_sim['lost_sales_units'] - context_sim['lost_sales_units'], 2
                ),
                'inventory_turnover_improvement': round(
                    context_sim['inventory_turnover'] - baseline_sim['inventory_turnover'], 2
                ),
                'inventory_turnover_improvement_percent': round(
                    ((context_sim['inventory_turnover'] - baseline_sim['inventory_turnover']) / 
                     baseline_sim['inventory_turnover']) * 100, 2
                ) if baseline_sim['inventory_turnover'] > 0 else 0
            }
            
            inventory_results.append(inventory_result)
            
            print(f"  ✓ Safety Stock: {baseline_sim['safety_stock']:.1f} → {context_sim['safety_stock']:.1f} ({safety_stock_reduction_percent:.1f}% reduction)")
            print(f"  ✓ Working Capital: ₹{baseline_sim['working_capital']:.2f} → ₹{context_sim['working_capital']:.2f} (₹{working_capital_saved:.2f} saved)")
            
        except Exception as e:
            print(f"  ❌ Error: {str(e)}")
            continue
    
    # Save detailed results
    print(f"\n\nSaving detailed results to {output_path}...")
    with open(output_path, 'w') as f:
        json.dump(inventory_results, f, indent=2)
    
    print(f"✓ Saved {len(inventory_results)} inventory simulation results")
    
    # Calculate summary statistics
    if len(inventory_results) > 0:
        summary = calculate_inventory_summary(inventory_results)
        
        # Save summary
        print(f"\nSaving summary to {summary_path}...")
        with open(summary_path, 'w') as f:
            json.dump(summary, f, indent=2)
        
        print(f"✓ Summary saved")
        
        # Print summary
        print_inventory_summary(summary)
        
        return {
            'detailed_results': inventory_results,
            'summary': summary
        }
    else:
        print("\n❌ No results to summarize")
        return {
            'detailed_results': [],
            'summary': {}
        }


def calculate_inventory_summary(results: List[Dict]) -> Dict:
    """
    Calculate summary statistics from inventory results.
    
    Args:
        results: List of inventory result dictionaries
        
    Returns:
        Dictionary with summary statistics
    """
    if len(results) == 0:
        return {}
    
    # Extract metrics
    safety_stock_reductions = [r['safety_stock_reduction_percent'] for r in results]
    working_capital_saved_list = [r['working_capital_saved'] for r in results]
    working_capital_saved_percent_list = [r['working_capital_saved_percent'] for r in results]
    holding_cost_reductions = [r['holding_cost_reduction'] for r in results]
    
    # Calculate summary
    summary = {
        'total_combinations': len(results),
        
        # Safety stock metrics
        'average_safety_stock_reduction': round(np.mean(safety_stock_reductions), 2),
        'median_safety_stock_reduction': round(np.median(safety_stock_reductions), 2),
        'min_safety_stock_reduction': round(np.min(safety_stock_reductions), 2),
        'max_safety_stock_reduction': round(np.max(safety_stock_reductions), 2),
        
        # Working capital metrics
        'average_working_capital_saved': round(np.mean(working_capital_saved_list), 2),
        'average_working_capital_saved_percent': round(np.mean(working_capital_saved_percent_list), 2),
        'total_working_capital_saved': round(np.sum(working_capital_saved_list), 2),
        'median_working_capital_saved': round(np.median(working_capital_saved_list), 2),
        'min_working_capital_saved': round(np.min(working_capital_saved_list), 2),
        'max_working_capital_saved': round(np.max(working_capital_saved_list), 2),
        
        # Holding cost metrics
        'average_holding_cost_reduction': round(np.mean(holding_cost_reductions), 2),
        'total_holding_cost_reduction': round(np.sum(holding_cost_reductions), 2),
        
        # Stockout metrics
        'average_baseline_stockout_rate': round(np.mean([r['baseline_stockout_rate'] for r in results]), 2),
        'average_context_stockout_rate': round(np.mean([r['context_stockout_rate'] for r in results]), 2),
        
        # Inventory turnover metrics
        'average_baseline_inventory_turnover': round(np.mean([r['baseline_inventory_turnover'] for r in results]), 2),
        'average_context_inventory_turnover': round(np.mean([r['context_inventory_turnover'] for r in results]), 2),
        'average_inventory_turnover_improvement': round(np.mean([r['inventory_turnover_improvement'] for r in results]), 2),
        'average_inventory_turnover_improvement_percent': round(np.mean([r['inventory_turnover_improvement_percent'] for r in results]), 2),
        
        # Configuration
        'service_level_z': results[0].get('service_level_z', 1.65) if len(results) > 0 else 1.65,
        'simulation_days': 36
    }
    
    return summary


def print_inventory_summary(summary: Dict) -> None:
    """
    Print inventory summary in a formatted way.
    
    Args:
        summary: Summary statistics dictionary
    """
    print("\n" + "="*70)
    print("INVENTORY SIMULATION SUMMARY")
    print("="*70)
    
    print(f"\nTotal Combinations: {summary['total_combinations']}")
    
    print("\nSafety Stock Reduction:")
    print(f"  Average: {summary['average_safety_stock_reduction']}%")
    print(f"  Median: {summary['median_safety_stock_reduction']}%")
    print(f"  Range: {summary['min_safety_stock_reduction']}% to {summary['max_safety_stock_reduction']}%")
    
    print("\nWorking Capital Savings:")
    print(f"  Average per SKU-PIN: ₹{summary['average_working_capital_saved']:.2f}")
    print(f"  Average Percentage: {summary['average_working_capital_saved_percent']}%")
    print(f"  Total Saved: ₹{summary['total_working_capital_saved']:.2f}")
    print(f"  Median: ₹{summary['median_working_capital_saved']:.2f}")
    print(f"  Range: ₹{summary['min_working_capital_saved']:.2f} to ₹{summary['max_working_capital_saved']:.2f}")
    
    print("\nHolding Cost Reduction:")
    print(f"  Average per SKU-PIN: ₹{summary['average_holding_cost_reduction']:.2f}")
    print(f"  Total Saved: ₹{summary['total_holding_cost_reduction']:.2f}")
    
    print("\nStockout Performance:")
    print(f"  Average Baseline Rate: {summary['average_baseline_stockout_rate']}%")
    print(f"  Average Context-Aware Rate: {summary['average_context_stockout_rate']}%")
    
    print("\nInventory Turnover:")
    print(f"  Average Baseline: {summary['average_baseline_inventory_turnover']:.2f}x")
    print(f"  Average Context-Aware: {summary['average_context_inventory_turnover']:.2f}x")
    print(f"  Average Improvement: {summary['average_inventory_turnover_improvement']:.2f}x ({summary['average_inventory_turnover_improvement_percent']:.2f}%)")
    
    print("="*70)


if __name__ == "__main__":
    print("="*70)
    print("MICROPULSE BATCH INVENTORY SIMULATION")
    print("="*70)
    
    # Run batch inventory simulation
    results = run_batch_inventory_simulation(
        results_path='reports/all_model_results.json',
        output_path='reports/inventory_results.json',
        summary_path='reports/inventory_summary.json',
        unit_cost=10.5,
        unit_margin=4.2,
        holding_cost_per_unit=0.05,
        lead_time=3,
        review_period=7,
        service_level_z=1.65
    )
    
    print("\n" + "="*70)
    print("BATCH INVENTORY SIMULATION COMPLETED")
    print("="*70)
    print("\nResults saved to:")
    print("  - reports/inventory_results.json (detailed results)")
    print("  - reports/inventory_summary.json (summary statistics)")
