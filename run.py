#!/usr/bin/env python
"""
MicroPulse - Command Line Interface
Quick access to common tasks
"""

import sys
import subprocess
import os

def print_menu():
    """Display main menu"""
    print("\n" + "="*60)
    print("MicroPulse Forecasting Module - Quick Commands")
    print("="*60)
    print("\n1. Verify Setup")
    print("2. Run Basic Test")
    print("3. Run Examples")
    print("4. Run Baseline Forecast (Simple Data)")
    print("5. Run Context-Aware Forecast (Simple Data)")
    print("6. Compare Baseline vs Context-Aware")
    print("7. Run Complete Analysis (with Financial Impact)")
    print("8. View Documentation")
    print("9. Clean Reports")
    print("10. Exit")
    print("\n" + "="*60)


def verify_setup():
    """Run setup verification"""
    print("\nRunning setup verification...\n")
    subprocess.run([sys.executable, "verify_setup.py"])


def run_test():
    """Run basic test"""
    print("\nRunning basic test...\n")
    subprocess.run([sys.executable, "test_forecasting.py"])


def run_examples():
    """Run examples"""
    print("\nRunning examples...\n")
    subprocess.run([sys.executable, "example_usage.py"])


def run_simple_forecast():
    """Run forecast on simple data"""
    print("\nRunning baseline forecast on simple data...\n")
    from core.forecasting import run_baseline_forecast
    
    result = run_baseline_forecast(
        data_path='data/daily_sales.csv',
        output_path='reports/baseline_metrics_simple.json'
    )
    
    print("\n✓ Forecast completed!")
    print(f"Results saved to: reports/baseline_metrics_simple.json")


def run_extended_forecast():
    """Run context-aware forecast"""
    print("\nRunning context-aware forecast...\n")
    from core.forecasting import run_context_aware_forecast
    
    result = run_context_aware_forecast(
        data_path='data/daily_sales.csv',
        output_path='reports/context_metrics.json'
    )
    
    print("\n✓ Context-aware forecast completed!")
    print(f"Results saved to: reports/context_metrics.json")


def compare_baseline_context():
    """Compare baseline and context-aware models"""
    print("\nComparing baseline vs context-aware models...\n")
    
    # Check if metrics files exist
    import os
    baseline_exists = os.path.exists('reports/baseline_metrics.json')
    context_exists = os.path.exists('reports/context_metrics.json')
    
    if not baseline_exists or not context_exists:
        print("⚠ Metrics files not found. Running forecasts first...\n")
        from core.forecasting import run_baseline_forecast, run_context_aware_forecast
        
        if not baseline_exists:
            print("Running baseline forecast...")
            run_baseline_forecast(
                data_path='data/daily_sales.csv',
                output_path='reports/baseline_metrics.json'
            )
        
        if not context_exists:
            print("\nRunning context-aware forecast...")
            run_context_aware_forecast(
                data_path='data/daily_sales.csv',
                output_path='reports/context_metrics.json'
            )
    
    # Run comparison
    print("\nRunning comparison...")
    from core.comparison import compare_models
    compare_models(
        baseline_path='reports/baseline_metrics.json',
        context_path='reports/context_metrics.json',
        output_path='reports/model_comparison.json',
        print_results=True
    )


def run_complete_analysis():
    """Run complete analysis with financial impact"""
    print("\nRunning complete analysis...\n")
    import subprocess
    subprocess.run([sys.executable, "example_context_aware.py"])


def view_docs():
    """Display documentation menu"""
    print("\n" + "="*60)
    print("Documentation Files")
    print("="*60)
    print("\n1. QUICKSTART.md - Quick start guide")
    print("2. README_FORECASTING.md - Detailed documentation")
    print("3. IMPLEMENTATION_SUMMARY.md - Technical details")
    print("4. PROJECT_STRUCTURE.md - Project organization")
    print("5. DELIVERY_SUMMARY.md - Delivery summary")
    print("6. Back to main menu")
    
    choice = input("\nSelect documentation (1-6): ").strip()
    
    docs = {
        '1': 'QUICKSTART.md',
        '2': 'README_FORECASTING.md',
        '3': 'IMPLEMENTATION_SUMMARY.md',
        '4': 'PROJECT_STRUCTURE.md',
        '5': 'DELIVERY_SUMMARY.md'
    }
    
    if choice in docs:
        filepath = docs[choice]
        if os.path.exists(filepath):
            with open(filepath, 'r') as f:
                print("\n" + "="*60)
                print(f"Contents of {filepath}")
                print("="*60 + "\n")
                print(f.read())
        else:
            print(f"\n✗ File not found: {filepath}")
    elif choice == '6':
        return
    else:
        print("\n✗ Invalid choice")


def clean_reports():
    """Clean generated reports"""
    print("\nCleaning reports directory...\n")
    
    reports_dir = 'reports'
    if os.path.exists(reports_dir):
        for file in os.listdir(reports_dir):
            if file.endswith('.json'):
                filepath = os.path.join(reports_dir, file)
                os.remove(filepath)
                print(f"  Removed: {filepath}")
        print("\n✓ Reports cleaned!")
    else:
        print("  No reports directory found.")


def main():
    """Main CLI loop"""
    while True:
        print_menu()
        choice = input("Select option (1-10): ").strip()
        
        if choice == '1':
            verify_setup()
        elif choice == '2':
            run_test()
        elif choice == '3':
            run_examples()
        elif choice == '4':
            run_simple_forecast()
        elif choice == '5':
            run_extended_forecast()
        elif choice == '6':
            compare_baseline_context()
        elif choice == '7':
            run_complete_analysis()
        elif choice == '8':
            view_docs()
        elif choice == '9':
            clean_reports()
        elif choice == '10':
            print("\nExiting MicroPulse CLI. Goodbye!")
            break
        else:
            print("\n✗ Invalid option. Please select 1-10.")
        
        input("\nPress Enter to continue...")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\nExiting MicroPulse CLI. Goodbye!")
        sys.exit(0)
