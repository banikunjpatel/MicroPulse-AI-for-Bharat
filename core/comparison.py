"""
MicroPulse Model Comparison Module
Compare baseline and context-aware forecasting models
"""

import json
import os
from typing import Dict


class ModelComparator:
    """
    Compare baseline and context-aware model performance.
    """
    
    def __init__(self):
        self.baseline_metrics = None
        self.context_metrics = None
        self.comparison_results = None
    
    def load_metrics(
        self, 
        baseline_path: str = 'reports/baseline_metrics.json',
        context_path: str = 'reports/context_metrics.json'
    ) -> None:
        """
        Load baseline and context-aware metrics from JSON files.
        
        Args:
            baseline_path: Path to baseline metrics JSON
            context_path: Path to context-aware metrics JSON
        """
        # Load baseline metrics
        if not os.path.exists(baseline_path):
            raise FileNotFoundError(f"Baseline metrics not found: {baseline_path}")
        
        with open(baseline_path, 'r') as f:
            self.baseline_metrics = json.load(f)
        
        print(f"✓ Loaded baseline metrics from {baseline_path}")
        
        # Load context-aware metrics
        if not os.path.exists(context_path):
            raise FileNotFoundError(f"Context-aware metrics not found: {context_path}")
        
        with open(context_path, 'r') as f:
            self.context_metrics = json.load(f)
        
        print(f"✓ Loaded context-aware metrics from {context_path}")
    
    def compute_comparison(self) -> Dict:
        """
        Compute comparison metrics between baseline and context-aware models.
        
        Returns:
            Dictionary with comparison results
        """
        if self.baseline_metrics is None or self.context_metrics is None:
            raise ValueError("Metrics not loaded. Call load_metrics() first.")
        
        baseline = self.baseline_metrics
        context = self.context_metrics
        
        # Calculate improvement percentages
        # Improvement = (Baseline - Context) / Baseline * 100
        # Positive value means context-aware is better (lower error)
        
        mape_improvement_percent = round(
            ((baseline['mape'] - context['mape']) / baseline['mape']) * 100, 2
        )
        
        mae_improvement_percent = round(
            ((baseline['mae'] - context['mae']) / baseline['mae']) * 100, 2
        )
        
        rmse_improvement_percent = round(
            ((baseline['rmse'] - context['rmse']) / baseline['rmse']) * 100, 2
        )
        
        # Sigma reduction (positive means context-aware has lower uncertainty)
        sigma_reduction_percent = round(
            ((baseline['sigma_forecast'] - context['sigma_forecast']) / 
             baseline['sigma_forecast']) * 100, 2
        )
        
        # Bias difference (absolute difference)
        bias_difference = round(context['bias'] - baseline['bias'], 2)
        
        # Absolute bias improvement (closer to zero is better)
        baseline_abs_bias = abs(baseline['bias'])
        context_abs_bias = abs(context['bias'])
        bias_improvement_percent = round(
            ((baseline_abs_bias - context_abs_bias) / baseline_abs_bias) * 100, 2
        ) if baseline_abs_bias != 0 else 0
        
        self.comparison_results = {
            'baseline_metrics': {
                'mape': baseline['mape'],
                'mae': baseline['mae'],
                'rmse': baseline['rmse'],
                'sigma_forecast': baseline['sigma_forecast'],
                'bias': baseline['bias']
            },
            'context_aware_metrics': {
                'mape': context['mape'],
                'mae': context['mae'],
                'rmse': context['rmse'],
                'sigma_forecast': context['sigma_forecast'],
                'bias': context['bias']
            },
            'improvements': {
                'mape_improvement_percent': mape_improvement_percent,
                'mae_improvement_percent': mae_improvement_percent,
                'rmse_improvement_percent': rmse_improvement_percent,
                'sigma_reduction_percent': sigma_reduction_percent,
                'bias_difference': bias_difference,
                'bias_improvement_percent': bias_improvement_percent
            },
            'summary': {
                'better_model': self._determine_better_model(
                    mape_improvement_percent,
                    sigma_reduction_percent
                ),
                'mape_change': 'improved' if mape_improvement_percent > 0 else 'degraded',
                'sigma_change': 'reduced' if sigma_reduction_percent > 0 else 'increased'
            }
        }
        
        return self.comparison_results
    
    def _determine_better_model(
        self, 
        mape_improvement: float, 
        sigma_reduction: float
    ) -> str:
        """
        Determine which model performs better overall.
        
        Args:
            mape_improvement: MAPE improvement percentage
            sigma_reduction: Sigma reduction percentage
        
        Returns:
            'context_aware', 'baseline', or 'mixed'
        """
        if mape_improvement > 0 and sigma_reduction > 0:
            return 'context_aware'
        elif mape_improvement < 0 and sigma_reduction < 0:
            return 'baseline'
        else:
            return 'mixed'
    
    def save_comparison(self, output_path: str = 'reports/model_comparison.json') -> None:
        """
        Save comparison results to JSON file.
        
        Args:
            output_path: Path to save comparison JSON
        """
        if self.comparison_results is None:
            raise ValueError("No comparison results. Call compute_comparison() first.")
        
        # Create directory if it doesn't exist
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        
        with open(output_path, 'w') as f:
            json.dump(self.comparison_results, f, indent=2)
        
        print(f"✓ Comparison results saved to {output_path}")
    
    def print_comparison(self) -> None:
        """
        Print formatted comparison results.
        """
        if self.comparison_results is None:
            raise ValueError("No comparison results. Call compute_comparison() first.")
        
        baseline = self.comparison_results['baseline_metrics']
        context = self.comparison_results['context_aware_metrics']
        improvements = self.comparison_results['improvements']
        summary = self.comparison_results['summary']
        
        print("\n" + "="*70)
        print("MODEL COMPARISON REPORT")
        print("="*70)
        
        # MAPE Comparison
        print("\n📊 MAPE (Mean Absolute Percentage Error)")
        print("-" * 70)
        print(f"Baseline MAPE:        {baseline['mape']:>10.2f}%")
        print(f"Context-Aware MAPE:   {context['mape']:>10.2f}%")
        print(f"Improvement:          {improvements['mape_improvement_percent']:>10.2f}%", end="")
        if improvements['mape_improvement_percent'] > 0:
            print(" ✓ (Better)")
        elif improvements['mape_improvement_percent'] < 0:
            print(" ✗ (Worse)")
        else:
            print(" = (Same)")
        
        # MAE Comparison
        print("\n📊 MAE (Mean Absolute Error)")
        print("-" * 70)
        print(f"Baseline MAE:         {baseline['mae']:>10.2f}")
        print(f"Context-Aware MAE:    {context['mae']:>10.2f}")
        print(f"Improvement:          {improvements['mae_improvement_percent']:>10.2f}%", end="")
        if improvements['mae_improvement_percent'] > 0:
            print(" ✓ (Better)")
        elif improvements['mae_improvement_percent'] < 0:
            print(" ✗ (Worse)")
        else:
            print(" = (Same)")
        
        # RMSE Comparison
        print("\n📊 RMSE (Root Mean Squared Error)")
        print("-" * 70)
        print(f"Baseline RMSE:        {baseline['rmse']:>10.2f}")
        print(f"Context-Aware RMSE:   {context['rmse']:>10.2f}")
        print(f"Improvement:          {improvements['rmse_improvement_percent']:>10.2f}%", end="")
        if improvements['rmse_improvement_percent'] > 0:
            print(" ✓ (Better)")
        elif improvements['rmse_improvement_percent'] < 0:
            print(" ✗ (Worse)")
        else:
            print(" = (Same)")
        
        # Sigma Forecast Comparison
        print("\n📊 Sigma Forecast (Forecast Error Std Dev)")
        print("-" * 70)
        print(f"Baseline Sigma:       {baseline['sigma_forecast']:>10.2f}")
        print(f"Context-Aware Sigma:  {context['sigma_forecast']:>10.2f}")
        print(f"Reduction:            {improvements['sigma_reduction_percent']:>10.2f}%", end="")
        if improvements['sigma_reduction_percent'] > 0:
            print(" ✓ (Lower uncertainty)")
        elif improvements['sigma_reduction_percent'] < 0:
            print(" ✗ (Higher uncertainty)")
        else:
            print(" = (Same)")
        
        # Bias Comparison
        print("\n📊 Bias (Systematic Over/Under-forecasting)")
        print("-" * 70)
        print(f"Baseline Bias:        {baseline['bias']:>10.2f}")
        print(f"Context-Aware Bias:   {context['bias']:>10.2f}")
        print(f"Difference:           {improvements['bias_difference']:>10.2f}")
        print(f"Abs Bias Improvement: {improvements['bias_improvement_percent']:>10.2f}%", end="")
        if improvements['bias_improvement_percent'] > 0:
            print(" ✓ (Closer to zero)")
        elif improvements['bias_improvement_percent'] < 0:
            print(" ✗ (Further from zero)")
        else:
            print(" = (Same)")
        
        # Summary
        print("\n" + "="*70)
        print("SUMMARY")
        print("="*70)
        print(f"Better Model:         {summary['better_model'].upper()}")
        print(f"MAPE Status:          {summary['mape_change'].upper()}")
        print(f"Sigma Status:         {summary['sigma_change'].upper()}")
        
        # Interpretation
        print("\n💡 INTERPRETATION")
        print("-" * 70)
        if summary['better_model'] == 'context_aware':
            print("✓ Context-aware model outperforms baseline on key metrics.")
            print("  Recommendation: Use context-aware model for production.")
        elif summary['better_model'] == 'baseline':
            print("✗ Baseline model outperforms context-aware model.")
            print("  Recommendation: Review regressor quality or use baseline.")
        else:
            print("⚠ Mixed results - some metrics improved, others degraded.")
            print("  Recommendation: Analyze specific use case requirements.")
        
        print("="*70 + "\n")


def compare_models(
    baseline_path: str = 'reports/baseline_metrics.json',
    context_path: str = 'reports/context_metrics.json',
    output_path: str = 'reports/model_comparison.json',
    print_results: bool = True
) -> Dict:
    """
    Complete model comparison pipeline.
    
    Args:
        baseline_path: Path to baseline metrics JSON
        context_path: Path to context-aware metrics JSON
        output_path: Path to save comparison results
        print_results: Whether to print formatted results
    
    Returns:
        Dictionary with comparison results
    """
    print("\n" + "="*70)
    print("MicroPulse Model Comparison")
    print("="*70 + "\n")
    
    # Initialize comparator
    comparator = ModelComparator()
    
    # Load metrics
    print("Step 1: Loading metrics...")
    comparator.load_metrics(baseline_path, context_path)
    
    # Compute comparison
    print("\nStep 2: Computing comparison...")
    results = comparator.compute_comparison()
    print("✓ Comparison computed")
    
    # Save results
    print("\nStep 3: Saving results...")
    comparator.save_comparison(output_path)
    
    # Print formatted results
    if print_results:
        comparator.print_comparison()
    
    return results


if __name__ == "__main__":
    # Run comparison
    results = compare_models()
