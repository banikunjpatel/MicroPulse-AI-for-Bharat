"""
MicroPulse Batch Forecasting Module
Run forecasting for all SKU × PIN combinations
"""

import pandas as pd
import numpy as np
import json
import os
from typing import Dict, List
from core.forecasting import run_baseline_forecast, run_context_aware_forecast
import warnings

warnings.filterwarnings('ignore')


def extract_combinations(filepath: str) -> List[Dict[str, str]]:
    """
    Extract unique SKU × PIN combinations using Cartesian product.
    This ensures all possible combinations are considered, not just those present in data.
    
    Args:
        filepath: Path to CSV file
        
    Returns:
        List of dictionaries with sku_id and pin_code
    """
    df = pd.read_csv(filepath)
    
    # Check if required columns exist
    if 'sku_id' not in df.columns or 'pin_code' not in df.columns:
        raise ValueError("Dataset must contain 'sku_id' and 'pin_code' columns")
    
    # Get unique SKUs and PINs (convert to strings for consistency)
    unique_skus = sorted([str(x) for x in df['sku_id'].unique()])
    unique_pins = sorted([str(x) for x in df['pin_code'].unique()])
    
    print(f"\nUnique SKUs ({len(unique_skus)}): {unique_skus}")
    print(f"Unique PINs ({len(unique_pins)}): {unique_pins}")
    print(f"Expected combinations (Cartesian product): {len(unique_skus)} × {len(unique_pins)} = {len(unique_skus) * len(unique_pins)}")
    
    # Generate Cartesian product explicitly
    combo_list = []
    for sku in unique_skus:
        for pin in unique_pins:
            combo_list.append({
                'sku_id': str(sku),
                'pin_code': str(pin)
            })
    
    # Verify each combination has data
    print("\nVerifying data availability for each combination:")
    missing_combos = []
    insufficient_combos = []
    
    # Convert dataframe columns to strings for comparison
    df['sku_id'] = df['sku_id'].astype(str)
    df['pin_code'] = df['pin_code'].astype(str)
    
    for combo in combo_list:
        sku = combo['sku_id']
        pin = combo['pin_code']
        combo_df = df[(df['sku_id'] == sku) & (df['pin_code'] == pin)]
        row_count = len(combo_df)
        
        if row_count == 0:
            missing_combos.append(f"{sku} × {pin}")
            print(f"  ❌ {sku} × {pin}: 0 rows (MISSING)")
        elif row_count < 150:
            insufficient_combos.append(f"{sku} × {pin} ({row_count} rows)")
            print(f"  ⚠️  {sku} × {pin}: {row_count} rows (INSUFFICIENT)")
        else:
            print(f"  ✓ {sku} × {pin}: {row_count} rows")
    
    if missing_combos:
        raise ValueError(
            f"Missing {len(missing_combos)} combinations in dataset: {', '.join(missing_combos)}. "
            f"Please regenerate dataset with all {len(combo_list)} combinations."
        )
    
    if insufficient_combos:
        raise ValueError(
            f"Insufficient data for {len(insufficient_combos)} combinations: {', '.join(insufficient_combos)}. "
            f"Each combination needs at least 150 rows (preferably 180)."
        )
    
    return combo_list


def run_all_combinations(
    data_path: str = 'data/sales_sku_pin.csv',
    train_ratio: float = 0.8,
    output_path: str = 'reports/all_model_results.json',
    summary_path: str = 'reports/model_summary.json'
) -> Dict:
    """
    Run forecasting for all SKU × PIN combinations.
    
    Args:
        data_path: Path to sales data CSV
        train_ratio: Train-test split ratio (default: 0.8)
        output_path: Path to save detailed results JSON
        summary_path: Path to save summary statistics JSON
        
    Returns:
        Dictionary containing detailed results and summary
    """
    print("="*70)
    print("BATCH FORECASTING FOR ALL SKU × PIN COMBINATIONS")
    print("="*70)
    
    # Extract unique combinations
    print(f"\nExtracting unique combinations from {data_path}...")
    combinations = extract_combinations(data_path)
    
    print(f"Found {len(combinations)} unique SKU × PIN combinations:")
    for combo in combinations:
        print(f"  - SKU: {combo['sku_id']}, PIN: {combo['pin_code']}")
    
    # Store results for all combinations
    all_results = []
    
    # Process each combination
    for i, combo in enumerate(combinations, 1):
        sku_id = combo['sku_id']
        pin_code = combo['pin_code']
        
        print("\n" + "="*70)
        print(f"PROCESSING COMBINATION {i}/{len(combinations)}")
        print(f"SKU: {sku_id}, PIN: {pin_code}")
        print("="*70)
        
        try:
            # Run baseline forecast
            print(f"\n[{i}/{len(combinations)}] Running baseline forecast...")
            baseline_metrics = run_baseline_forecast(
                data_path=data_path,
                sku_id=sku_id,
                pin_code=pin_code,
                train_ratio=train_ratio,
                output_path=f'reports/baseline_{sku_id}_{pin_code}.json'
            )
            
            # Run context-aware forecast
            print(f"\n[{i}/{len(combinations)}] Running context-aware forecast...")
            context_metrics = run_context_aware_forecast(
                data_path=data_path,
                sku_id=sku_id,
                pin_code=pin_code,
                train_ratio=train_ratio,
                output_path=f'reports/context_{sku_id}_{pin_code}.json'
            )
            
            # Calculate improvements
            mape_improvement = round(
                ((baseline_metrics['mape'] - context_metrics['mape']) / 
                 baseline_metrics['mape']) * 100, 2
            )
            
            sigma_reduction = round(
                ((baseline_metrics['sigma_forecast'] - context_metrics['sigma_forecast']) / 
                 baseline_metrics['sigma_forecast']) * 100, 2
            )
            
            # Store result
            result = {
                'sku_id': sku_id,
                'pin_code': pin_code,
                'baseline_mape': baseline_metrics['mape'],
                'context_mape': context_metrics['mape'],
                'mape_improvement_percent': mape_improvement,
                'baseline_sigma': baseline_metrics['sigma_forecast'],
                'context_sigma': context_metrics['sigma_forecast'],
                'sigma_reduction_percent': sigma_reduction,
                'baseline_mae': baseline_metrics['mae'],
                'context_mae': context_metrics['mae'],
                'baseline_rmse': baseline_metrics['rmse'],
                'context_rmse': context_metrics['rmse'],
                'baseline_bias': baseline_metrics['bias'],
                'context_bias': context_metrics['bias'],
                'train_samples': baseline_metrics['train_samples'],
                'test_samples': baseline_metrics['test_samples']
            }
            
            all_results.append(result)
            
            print(f"\n[{i}/{len(combinations)}] Results:")
            print(f"  Baseline MAPE: {result['baseline_mape']}%")
            print(f"  Context MAPE: {result['context_mape']}%")
            print(f"  MAPE Improvement: {result['mape_improvement_percent']}%")
            print(f"  Baseline Sigma: {result['baseline_sigma']}")
            print(f"  Context Sigma: {result['context_sigma']}")
            print(f"  Sigma Reduction: {result['sigma_reduction_percent']}%")
            
        except Exception as e:
            print(f"\n[{i}/{len(combinations)}] ERROR processing {sku_id} × {pin_code}: {str(e)}")
            continue
    
    # Save detailed results
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, 'w') as f:
        json.dump(all_results, f, indent=2)
    
    print(f"\n\nDetailed results saved to {output_path}")
    
    # Assert total combinations
    expected_combinations = len(combinations)
    actual_combinations = len(all_results)
    
    print(f"\nCombination Count Verification:")
    print(f"  Expected: {expected_combinations}")
    print(f"  Processed: {actual_combinations}")
    
    if actual_combinations != expected_combinations:
        error_msg = (
            f"ERROR: Expected {expected_combinations} combinations but only processed {actual_combinations}. "
            f"Missing {expected_combinations - actual_combinations} combinations."
        )
        print(f"\n❌ {error_msg}")
        raise AssertionError(error_msg)
    
    print(f"  ✓ All {expected_combinations} combinations processed successfully")
    
    # Calculate summary statistics
    if len(all_results) > 0:
        summary = calculate_summary_statistics(all_results)
        
        # Save summary
        with open(summary_path, 'w') as f:
            json.dump(summary, f, indent=2)
        
        print(f"Summary statistics saved to {summary_path}")
        
        # Print summary
        print_summary(summary)
        
        return {
            'detailed_results': all_results,
            'summary': summary
        }
    else:
        print("\nNo results to summarize.")
        return {
            'detailed_results': [],
            'summary': {}
        }


def calculate_summary_statistics(results: List[Dict]) -> Dict:
    """
    Calculate summary statistics from all results.
    
    Args:
        results: List of result dictionaries
        
    Returns:
        Dictionary with summary statistics
    """
    if len(results) == 0:
        return {}
    
    # Extract improvement metrics
    mape_improvements = [r['mape_improvement_percent'] for r in results]
    sigma_reductions = [r['sigma_reduction_percent'] for r in results]
    
    # Extract baseline and context-aware metrics
    baseline_mapes = [r['baseline_mape'] for r in results]
    context_mapes = [r['context_mape'] for r in results]
    baseline_sigmas = [r['baseline_sigma'] for r in results]
    context_sigmas = [r['context_sigma'] for r in results]
    
    # Count where context outperformed baseline
    context_wins = sum(1 for r in results if r['mape_improvement_percent'] > 0)
    
    # Calculate statistics
    summary = {
        'total_combinations': len(results),
        
        # Average absolute metrics
        'average_baseline_mape': round(np.mean(baseline_mapes), 2),
        'average_context_mape': round(np.mean(context_mapes), 2),
        'average_baseline_sigma': round(np.mean(baseline_sigmas), 2),
        'average_context_sigma': round(np.mean(context_sigmas), 2),
        
        # Improvement metrics
        'average_mape_improvement': round(np.mean(mape_improvements), 2),
        'average_sigma_reduction': round(np.mean(sigma_reductions), 2),
        'min_mape_improvement': round(np.min(mape_improvements), 2),
        'max_mape_improvement': round(np.max(mape_improvements), 2),
        'min_sigma_reduction': round(np.min(sigma_reductions), 2),
        'max_sigma_reduction': round(np.max(sigma_reductions), 2),
        'std_mape_improvement': round(np.std(mape_improvements), 2),
        'std_sigma_reduction': round(np.std(sigma_reductions), 2),
        'median_mape_improvement': round(np.median(mape_improvements), 2),
        'median_sigma_reduction': round(np.median(sigma_reductions), 2),
        
        # Success metrics
        'context_outperformed_count': context_wins,
        'context_outperformed_percent': round((context_wins / len(results)) * 100, 2)
    }
    
    return summary


def print_summary(summary: Dict) -> None:
    """
    Print summary statistics in a formatted way.
    
    Args:
        summary: Dictionary with summary statistics
    """
    print("\n" + "="*70)
    print("SUMMARY STATISTICS - ALL SKU × PIN COMBINATIONS")
    print("="*70)
    
    print(f"\nTotal Combinations Processed: {summary['total_combinations']}")
    
    print("\nBaseline Model Performance:")
    print(f"  Average MAPE: {summary['average_baseline_mape']}%")
    print(f"  Average Sigma: {summary['average_baseline_sigma']}")
    
    print("\nContext-Aware Model Performance:")
    print(f"  Average MAPE: {summary['average_context_mape']}%")
    print(f"  Average Sigma: {summary['average_context_sigma']}")
    
    print("\nMAPE Improvement:")
    print(f"  Average: {summary['average_mape_improvement']}%")
    print(f"  Median: {summary['median_mape_improvement']}%")
    print(f"  Min: {summary['min_mape_improvement']}%")
    print(f"  Max: {summary['max_mape_improvement']}%")
    print(f"  Std Dev: {summary['std_mape_improvement']}%")
    
    print("\nSigma Reduction:")
    print(f"  Average: {summary['average_sigma_reduction']}%")
    print(f"  Median: {summary['median_sigma_reduction']}%")
    print(f"  Min: {summary['min_sigma_reduction']}%")
    print(f"  Max: {summary['max_sigma_reduction']}%")
    print(f"  Std Dev: {summary['std_sigma_reduction']}%")
    
    print("\nContext-Aware Performance:")
    print(f"  Outperformed Baseline: {summary['context_outperformed_count']} / {summary['total_combinations']}")
    print(f"  Success Rate: {summary['context_outperformed_percent']}%")
    
    print("="*70)


if __name__ == "__main__":
    # Run batch forecasting
    results = run_all_combinations(
        data_path='data/sales_sku_pin.csv',
        train_ratio=0.8,
        output_path='reports/all_model_results.json',
        summary_path='reports/model_summary.json'
    )
