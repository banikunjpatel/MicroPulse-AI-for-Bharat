"""
Impact Projection - Compute Projected Capital Unlock and ROI Scaling
Based on inventory_summary.json results
"""

import json
import os


def load_inventory_summary(summary_path: str = 'reports/inventory_summary.json') -> dict:
    """
    Load inventory summary results.
    
    Args:
        summary_path: Path to inventory summary JSON
        
    Returns:
        Dictionary with summary data
    """
    with open(summary_path, 'r') as f:
        summary = json.load(f)
    
    return summary


def compute_impact_projections(summary: dict) -> dict:
    """
    Compute projected capital unlock for different scale scenarios.
    
    Args:
        summary: Inventory summary dictionary
        
    Returns:
        Dictionary with projection results
    """
    # Extract base results
    total_combinations = summary['total_combinations']
    total_working_capital_saved = summary['total_working_capital_saved']
    average_working_capital_saved = summary['average_working_capital_saved']
    average_working_capital_saved_percent = summary['average_working_capital_saved_percent']
    
    # Compute average saving per SKU × PIN combination
    saving_per_combination = round(total_working_capital_saved / total_combinations, 2)
    
    # Simulation window
    simulation_days = 36
    annual_multiplier = 365 / simulation_days
    
    # Scenario A: 100 SKUs × 20 PIN codes
    combinations_A = 100 * 20  # 2000 combinations
    projected_capital_A = round(saving_per_combination * combinations_A, 2)
    annualized_capital_A = round(projected_capital_A * annual_multiplier, 2)
    
    # Scenario B: 200 SKUs × 50 PIN codes
    combinations_B = 200 * 50  # 10000 combinations
    projected_capital_B = round(saving_per_combination * combinations_B, 2)
    annualized_capital_B = round(projected_capital_B * annual_multiplier, 2)
    
    # Create structured output
    projections = {
        'base_results': {
            'total_combinations': total_combinations,
            'simulation_days': simulation_days,
            'total_working_capital_saved': round(total_working_capital_saved, 2),
            'average_working_capital_saved': round(average_working_capital_saved, 2),
            'average_working_capital_saved_percent': round(average_working_capital_saved_percent, 2),
            'saving_per_combination': saving_per_combination
        },
        'projection_scenarios': {
            '100sku_20pin': {
                'description': '100 SKUs × 20 PIN codes',
                'total_combinations': combinations_A,
                'projected_capital_unlock_36days': projected_capital_A,
                'annualized_capital_unlock': annualized_capital_A
            },
            '200sku_50pin': {
                'description': '200 SKUs × 50 PIN codes',
                'total_combinations': combinations_B,
                'projected_capital_unlock_36days': projected_capital_B,
                'annualized_capital_unlock': annualized_capital_B
            }
        },
        'calculation_notes': {
            'annual_multiplier': round(annual_multiplier, 2),
            'formula': 'Annualized = (36-day projection) × (365 / 36)',
            'assumption': 'Linear scaling based on average saving per combination'
        }
    }
    
    return projections


def save_projections(projections: dict, output_path: str = 'reports/impact_projection.json') -> None:
    """
    Save projections to JSON file.
    
    Args:
        projections: Projection results dictionary
        output_path: Path to save JSON file
    """
    # Create directory if it doesn't exist
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    with open(output_path, 'w') as f:
        json.dump(projections, f, indent=2)
    
    print(f"✓ Projections saved to {output_path}")


def print_projection_summary(projections: dict) -> None:
    """
    Print clean console summary of projections.
    
    Args:
        projections: Projection results dictionary
    """
    base = projections['base_results']
    scenarios = projections['projection_scenarios']
    
    print("\n" + "="*70)
    print("IMPACT PROJECTION SUMMARY")
    print("="*70)
    
    print("\nBase Results:")
    print(f"  Combinations Analyzed: {base['total_combinations']}")
    print(f"  Simulation Period: {base['simulation_days']} days")
    print(f"  Total Working Capital Saved: ₹{base['total_working_capital_saved']:,.2f}")
    print(f"  Average per Combination: ₹{base['saving_per_combination']:,.2f}")
    print(f"  Average Percentage Saved: {base['average_working_capital_saved_percent']}%")
    
    print("\n" + "-"*70)
    print("PROJECTION SCENARIOS")
    print("-"*70)
    
    # Scenario A
    scenario_a = scenarios['100sku_20pin']
    print(f"\nScenario A: {scenario_a['description']}")
    print(f"  Total Combinations: {scenario_a['total_combinations']:,}")
    print(f"  Projected Capital Unlock (36 Days): ₹{scenario_a['projected_capital_unlock_36days']:,.2f}")
    print(f"  Annualized Capital Unlock: ₹{scenario_a['annualized_capital_unlock']:,.2f}")
    
    # Scenario B
    scenario_b = scenarios['200sku_50pin']
    print(f"\nScenario B: {scenario_b['description']}")
    print(f"  Total Combinations: {scenario_b['total_combinations']:,}")
    print(f"  Projected Capital Unlock (36 Days): ₹{scenario_b['projected_capital_unlock_36days']:,.2f}")
    print(f"  Annualized Capital Unlock: ₹{scenario_b['annualized_capital_unlock']:,.2f}")
    
    print("\n" + "="*70)
    print("KEY INSIGHTS")
    print("="*70)
    
    print(f"\n💰 Capital Efficiency:")
    print(f"   Average saving per SKU × PIN: ₹{base['saving_per_combination']:,.2f}")
    print(f"   Percentage reduction: {base['average_working_capital_saved_percent']}%")
    
    print(f"\n📈 Scale Impact:")
    print(f"   100 SKUs × 20 PINs (2,000 combinations):")
    print(f"     → Annualized unlock: ₹{scenario_a['annualized_capital_unlock']:,.2f}")
    print(f"   200 SKUs × 50 PINs (10,000 combinations):")
    print(f"     → Annualized unlock: ₹{scenario_b['annualized_capital_unlock']:,.2f}")
    
    print(f"\n🎯 ROI Multiplier:")
    multiplier_a = scenario_a['annualized_capital_unlock'] / base['total_working_capital_saved']
    multiplier_b = scenario_b['annualized_capital_unlock'] / base['total_working_capital_saved']
    print(f"   Scenario A: {multiplier_a:.1f}x base results")
    print(f"   Scenario B: {multiplier_b:.1f}x base results")
    
    print("\n" + "="*70)


def main():
    """Main execution function."""
    print("="*70)
    print("IMPACT PROJECTION - CAPITAL UNLOCK CALCULATOR")
    print("="*70)
    
    # Load inventory summary
    print("\nLoading inventory summary...")
    summary = load_inventory_summary('reports/inventory_summary.json')
    print(f"✓ Loaded results for {summary['total_combinations']} combinations")
    
    # Compute projections
    print("\nComputing impact projections...")
    projections = compute_impact_projections(summary)
    print("✓ Projections computed")
    
    # Save projections
    print("\nSaving projections...")
    save_projections(projections, 'reports/impact_projection.json')
    
    # Print summary
    print_projection_summary(projections)
    
    print("\n" + "="*70)
    print("IMPACT PROJECTION COMPLETED")
    print("="*70)
    print("\nOutput saved to: reports/impact_projection.json")


if __name__ == "__main__":
    main()
