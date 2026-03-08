"""
Repository cleanup script for MicroPulse
Removes temporary, test, and documentation files
"""

import os
import shutil

# Files to remove
files_to_remove = [
    # Summary/Documentation files
    "IMPLEMENTATION_SUMMARY.md", "MODEL_COMPARISON_GUIDE.md",
    "PROJECT_STRUCTURE_FINAL.md", "PROJECT_STRUCTURE.md",
    "PROPHET_CONFIG_GUIDE.md", "PROPHET_IMPROVEMENT_SUMMARY.md",
    "QUICK_REFERENCE.md", "QUICKSTART.md",
    "README_BATCH_FORECASTING.md", "README_COMPARISON.md",
    "README_CONTEXT_AWARE.md", "README_CONVERSATIONAL_INSIGHTS.md",
    "README_FORECASTING.md", "README_GITHUB.md",
    "README_INVENTORY_SIMULATION.md", "README_SKU_CHAT_ENGINE.md",
    "REPOSITORY_CLEANUP_SUMMARY.md", "RUN_API_GUIDE.md",
    "S3_INTEGRATION_COMPLETE.md", "S3_INTEGRATION_VERIFICATION.md",
    "S3_LOADER_ENHANCEMENT_COMPLETE.md", "S3_LOADER_USAGE_EXAMPLES.md",
    "S3_SETUP_GUIDE.md", "SCENARIO_SIMULATION_VERIFICATION.md",
    "SERVICE_LEVEL_90_RESULTS.md", "SERVICE_LEVEL_WORDING_FIX.md",
    "SKU_CHAT_ENGINE_SUMMARY.md", "STATEFUL_CHAT_DEMO_GUIDE.md",
    "STATEFUL_CHAT_IMPROVEMENTS.md", "SUMMARY_ENHANCEMENT_GUIDE.md",
    "SYSTEM_STATUS.md", "TASK_COMPLETION_STATEFUL_CHAT.md",
    "UI_ENHANCEMENTS_COMPLETE.md", "CLEANUP_PLAN.md",
    
    # Test/verification scripts
    "compare_models.py", "compare_summary_versions.py",
    "diagnose_combinations.py", "example_context_aware.py",
    "example_usage.py", "quick_verify_s3.py",
    "service_level_comparison.py", "show_inventory_turnover.py",
    "test_api.py", "test_batch_forecasting.py",
    "test_context_aware.py", "test_conversational_insights.py",
    "test_forecasting.py", "test_inventory_simulation.py",
    "test_s3_loader_enhanced.py", "test_s3_loader.py",
    "test_service_level_90.py", "test_sku_pin_forecast.py",
    "update_summary.py", "verify_api_setup.py",
    "verify_complete_system.py", "verify_frontend_setup.py",
    "verify_inventory_results.py", "verify_results.py",
    "verify_s3_enhancement.py", "verify_s3_integration.py",
    "verify_service_level_wording.py", "verify_setup.py",
    "verify_stateful_improvements.py", "verify_summary_calculations.py",
    
    # Utility scripts
    "generate_data.py", "generate_multi_sku_pin.py",
    "main.py", "run_batch_forecast.py", "start_api.py",
    
    # Configuration files
    "design.md", "requirements_api.txt", "requirements.md",
]

# Reports to remove
reports_to_remove = [
    "reports/baseline_1L_Cola_395001.json",
    "reports/baseline_1L_Cola_395002.json",
    "reports/baseline_1L_Cola_395003.json",
    "reports/baseline_2L_Cola_395001.json",
    "reports/baseline_2L_Cola_395002.json",
    "reports/baseline_2L_Cola_395003.json",
    "reports/baseline_500ml_Cola_395001.json",
    "reports/baseline_500ml_Cola_395002.json",
    "reports/baseline_500ml_Cola_395003.json",
    "reports/baseline_metrics_sku_pin.json",
    "reports/baseline_metrics.json",
    "reports/context_1L_Cola_395001.json",
    "reports/context_1L_Cola_395002.json",
    "reports/context_1L_Cola_395003.json",
    "reports/context_2L_Cola_395001.json",
    "reports/context_2L_Cola_395002.json",
    "reports/context_2L_Cola_395003.json",
    "reports/context_500ml_Cola_395001.json",
    "reports/context_500ml_Cola_395002.json",
    "reports/context_500ml_Cola_395003.json",
    "reports/context_metrics_sku_pin.json",
    "reports/context_metrics.json",
    "reports/model_comparison_sku_pin.json",
    "reports/model_comparison.json",
    "reports/impact_projection.json",
    "reports/inventory_summary.json",
    "reports/model_summary.json",
]

def main():
    removed_count = 0
    kept_count = 0
    
    print("="*60)
    print("MicroPulse Repository Cleanup")
    print("="*60)
    
    # Remove root files
    print("\nRemoving unnecessary files...")
    for file in files_to_remove:
        if os.path.exists(file):
            try:
                os.remove(file)
                print(f"  ✓ Removed: {file}")
                removed_count += 1
            except Exception as e:
                print(f"  ✗ Failed to remove {file}: {e}")
        else:
            kept_count += 1
    
    # Remove reports
    print("\nCleaning reports folder...")
    for report in reports_to_remove:
        if os.path.exists(report):
            try:
                os.remove(report)
                print(f"  ✓ Removed: {report}")
                removed_count += 1
            except Exception as e:
                print(f"  ✗ Failed to remove {report}: {e}")
    
    # Remove Python cache
    print("\nRemoving Python cache...")
    for root, dirs, files in os.walk('.'):
        if '__pycache__' in dirs:
            cache_path = os.path.join(root, '__pycache__')
            try:
                shutil.rmtree(cache_path)
                print(f"  ✓ Removed: {cache_path}")
                removed_count += 1
            except Exception as e:
                print(f"  ✗ Failed to remove {cache_path}: {e}")
        
        # Remove .pyc files
        for file in files:
            if file.endswith('.pyc'):
                file_path = os.path.join(root, file)
                try:
                    os.remove(file_path)
                    print(f"  ✓ Removed: {file_path}")
                    removed_count += 1
                except Exception as e:
                    print(f"  ✗ Failed to remove {file_path}: {e}")
    
    print("\n" + "="*60)
    print(f"Cleanup Complete: {removed_count} files removed")
    print("="*60)
    
    # Verify essential files still exist
    print("\nVerifying essential files...")
    essential_files = [
        "core/batch_forecasting.py",
        "batch_inventory_simulation.py",
        "core/sku_chat_engine.py",
        "core/stateful_sku_chat.py",
        "api/server.py",
        "api/utils/s3_loader.py",
        "reports/all_model_results.json",
        "reports/inventory_results.json",
        "test_sku_chat_engine.py",
        "test_stateful_sku_chat.py",
        "requirements.txt",
        "config.py",
    ]
    
    all_exist = True
    for file in essential_files:
        if os.path.exists(file):
            print(f"  ✓ {file}")
        else:
            print(f"  ✗ MISSING: {file}")
            all_exist = False
    
    if all_exist:
        print("\n✓ All essential files present!")
    else:
        print("\n✗ Some essential files are missing!")
    
    return removed_count

if __name__ == "__main__":
    main()
