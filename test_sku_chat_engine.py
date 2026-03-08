"""
Test SKU-Level Chat Engine
Demonstrates SKU × PIN specific Q&A capabilities
"""

from core.sku_chat_engine import (
    load_sku_pin_results,
    get_available_combinations,
    extract_structured_metrics,
    construct_context_block,
    ask_sku_question
)


def test_available_combinations():
    """Test listing available combinations."""
    print("="*70)
    print("TEST 1: AVAILABLE COMBINATIONS")
    print("="*70)
    
    combinations = get_available_combinations()
    
    if not combinations:
        print("\n❌ No combinations found!")
        print("\nPlease run:")
        print("  1. python core/batch_forecasting.py")
        print("  2. python batch_inventory_simulation.py")
        return None
    
    print(f"\nTotal Combinations: {len(combinations)}")
    print("\nFirst 5 combinations:")
    for i, combo in enumerate(combinations[:5], 1):
        print(f"  {i}. SKU: {combo['sku_id']:15s} PIN: {combo['pin_code']}")
    
    return combinations


def test_load_sku_pin_results(combinations):
    """Test loading results for a specific SKU × PIN."""
    print("\n" + "="*70)
    print("TEST 2: LOAD SKU × PIN RESULTS")
    print("="*70)
    
    if not combinations:
        print("\n⚠️  Skipped - no combinations available")
        return None
    
    # Test with first combination
    test_combo = combinations[0]
    sku_id = test_combo['sku_id']
    pin_code = test_combo['pin_code']
    
    print(f"\nTesting with: {sku_id} × {pin_code}")
    
    results = load_sku_pin_results(sku_id, pin_code)
    
    print(f"\nResults Found: {'✅ Yes' if results['found'] else '❌ No'}")
    print(f"Forecast Data: {'✅ Available' if results['forecast'] else '❌ Missing'}")
    print(f"Inventory Data: {'✅ Available' if results['inventory'] else '❌ Missing'}")
    
    if results['forecast']:
        print(f"\nForecast Metrics:")
        print(f"  Baseline MAPE: {results['forecast'].get('baseline_mape')}%")
        print(f"  Context MAPE: {results['forecast'].get('context_mape')}%")
        print(f"  Improvement: {results['forecast'].get('mape_improvement_percent')}%")
    
    if results['inventory']:
        print(f"\nInventory Metrics:")
        print(f"  Safety Stock Reduction: {results['inventory'].get('safety_stock_reduction_percent')}%")
        print(f"  Working Capital Saved: ₹{results['inventory'].get('working_capital_saved')}")
    
    return results


def test_extract_metrics(results):
    """Test extracting structured metrics."""
    print("\n" + "="*70)
    print("TEST 3: EXTRACT STRUCTURED METRICS")
    print("="*70)
    
    if not results or not results['found']:
        print("\n⚠️  Skipped - no results available")
        return None
    
    metrics = extract_structured_metrics(results)
    
    print(f"\nExtracted Metrics for {metrics['sku_id']} × {metrics['pin_code']}:")
    
    # Forecast metrics
    if metrics.get('baseline_mape') is not None:
        print("\nForecast Metrics:")
        print(f"  baseline_mape: {metrics['baseline_mape']}%")
        print(f"  context_mape: {metrics['context_mape']}%")
        print(f"  mape_improvement_percent: {metrics['mape_improvement_percent']}%")
        print(f"  sigma_reduction_percent: {metrics['sigma_reduction_percent']}%")
    
    # Inventory metrics
    if metrics.get('baseline_safety_stock') is not None:
        print("\nInventory Metrics:")
        print(f"  safety_stock_reduction_percent: {metrics['safety_stock_reduction_percent']}%")
        print(f"  working_capital_saved: ₹{metrics['working_capital_saved']}")
        print(f"  working_capital_saved_percent: {metrics['working_capital_saved_percent']}%")
        print(f"  inventory_turnover_improvement_percent: {metrics['inventory_turnover_improvement_percent']}%")
    
    return metrics


def test_construct_context(metrics):
    """Test constructing context block."""
    print("\n" + "="*70)
    print("TEST 4: CONSTRUCT CONTEXT BLOCK")
    print("="*70)
    
    if not metrics:
        print("\n⚠️  Skipped - no metrics available")
        return None
    
    context = construct_context_block(metrics)
    
    print("\nContext Block:")
    print("-"*70)
    print(context)
    print("-"*70)
    
    print(f"\nContext Length: {len(context)} characters")
    print(f"Context Lines: {len(context.split(chr(10)))} lines")
    
    return context


def test_sample_questions(combinations):
    """Test sample questions for SKU × PIN."""
    print("\n" + "="*70)
    print("TEST 5: SAMPLE QUESTIONS")
    print("="*70)
    
    if not combinations:
        print("\n⚠️  Skipped - no combinations available")
        return
    
    test_combo = combinations[0]
    sku_id = test_combo['sku_id']
    pin_code = test_combo['pin_code']
    
    print(f"\nSample Questions for {sku_id} × {pin_code}:")
    
    sample_questions = [
        "What is the forecast accuracy improvement for this SKU?",
        "How much working capital can we save?",
        "What is the safety stock reduction?",
        "How does inventory turnover improve?",
        "What is the stockout rate?",
        "Should we implement context-aware forecasting for this SKU?",
        "What is the business impact?",
        "How reliable is the forecast?"
    ]
    
    for i, question in enumerate(sample_questions, 1):
        print(f"  {i}. {question}")
    
    print("\n" + "="*70)
    print("NOTE: To actually ask questions, you need:")
    print("  1. AWS credentials configured")
    print("  2. Amazon Bedrock access enabled")
    print("  3. Titan Text model access granted")
    print("="*70)


def test_question_with_bedrock(combinations):
    """Test asking a question with Bedrock (requires AWS credentials)."""
    print("\n" + "="*70)
    print("TEST 6: BEDROCK Q&A (Optional)")
    print("="*70)
    
    if not combinations:
        print("\n⚠️  Skipped - no combinations available")
        return
    
    try:
        import boto3
        
        # Check if AWS credentials are available
        try:
            sts = boto3.client('sts')
            identity = sts.get_caller_identity()
            print(f"\n✅ AWS Credentials Found")
            print(f"   Account: {identity['Account']}")
            print(f"   User/Role: {identity['Arn'].split('/')[-1]}")
            
            # Try a simple question
            test_combo = combinations[0]
            sku_id = test_combo['sku_id']
            pin_code = test_combo['pin_code']
            
            print("\n" + "-"*70)
            print(f"Testing with {sku_id} × {pin_code}...")
            print("-"*70)
            
            question = "What is the forecast accuracy improvement?"
            print(f"\nQuestion: {question}")
            
            result = ask_sku_question(sku_id, pin_code, question, verbose=False)
            
            if result['status'] == 'success':
                print(f"\n✅ Answer Received:")
                print("-"*70)
                print(result['answer'])
                print("-"*70)
            else:
                print(f"\n⚠️  Status: {result['status']}")
                print(f"Error: {result.get('error', 'Unknown error')}")
                print("\nPossible reasons:")
                print("  - Bedrock not enabled in your AWS account")
                print("  - Titan Text model access not granted")
                print("  - Insufficient IAM permissions")
        
        except Exception as e:
            print(f"\n⚠️  AWS Credentials Not Found or Invalid")
            print(f"Error: {str(e)}")
            print("\nTo use Bedrock Q&A:")
            print("  1. Configure AWS credentials: aws configure")
            print("  2. Enable Amazon Bedrock in AWS Console")
            print("  3. Request access to Titan Text model")
    
    except ImportError:
        print("\n⚠️  boto3 not installed")
        print("Install with: pip install boto3")


def main():
    """Run all tests."""
    print("="*70)
    print("MICROPULSE SKU-LEVEL CHAT ENGINE - TEST SUITE")
    print("="*70)
    
    # Test 1: Available combinations
    combinations = test_available_combinations()
    
    if not combinations:
        print("\n" + "="*70)
        print("TEST SUITE ABORTED - NO DATA")
        print("="*70)
        return
    
    # Test 2: Load SKU × PIN results
    results = test_load_sku_pin_results(combinations)
    
    # Test 3: Extract metrics
    metrics = test_extract_metrics(results)
    
    # Test 4: Construct context
    context = test_construct_context(metrics)
    
    # Test 5: Sample questions
    test_sample_questions(combinations)
    
    # Test 6: Bedrock Q&A (optional)
    test_question_with_bedrock(combinations)
    
    print("\n" + "="*70)
    print("TEST SUITE COMPLETED")
    print("="*70)
    
    print("\n📚 USAGE EXAMPLES:")
    
    if combinations:
        example_sku = combinations[0]['sku_id']
        example_pin = combinations[0]['pin_code']
        
        print("\n1. List Available Combinations:")
        print("   python core/sku_chat_engine.py")
        print("   python core/sku_chat_engine.py list")
        
        print("\n2. Interactive Mode:")
        print(f"   python core/sku_chat_engine.py {example_sku} {example_pin}")
        
        print("\n3. Single Question Mode:")
        print(f"   python core/sku_chat_engine.py {example_sku} {example_pin} \"What is the forecast improvement?\"")
        
        print("\n4. Programmatic Usage:")
        print("   from core.sku_chat_engine import ask_sku_question")
        print(f"   result = ask_sku_question('{example_sku}', '{example_pin}', 'How much working capital saved?')")
        print("   print(result['answer'])")
    
    print("\n" + "="*70)


if __name__ == "__main__":
    main()
