"""
MicroPulse SKU-Level Chat Engine
Enable grounded SKU × PIN conversational intelligence using Amazon Bedrock
"""

import json
import os
from typing import Dict, Optional, List

# Try to import boto3, but make it optional
try:
    import boto3
    from botocore.exceptions import ClientError
    BOTO3_AVAILABLE = True
except ImportError:
    BOTO3_AVAILABLE = False
    boto3 = None
    ClientError = Exception


def load_sku_pin_results(sku_id: str, pin_code: str) -> Dict:
    """
    Load results for a specific SKU × PIN combination.
    
    Args:
        sku_id: SKU identifier
        pin_code: PIN code (will be converted to string for comparison)
        
    Returns:
        Dictionary with forecast and inventory results
    """
    results = {
        'sku_id': sku_id,
        'pin_code': str(pin_code),
        'forecast': None,
        'inventory': None,
        'found': False
    }
    
    # Normalize pin_code to string for comparison
    pin_code_str = str(pin_code)
    
    # Load forecast results
    try:
        with open('reports/all_model_results.json', 'r') as f:
            all_forecasts = json.load(f)
        
        # Find matching forecast
        for forecast in all_forecasts:
            if (forecast.get('sku_id') == sku_id and 
                str(forecast.get('pin_code')) == pin_code_str):
                results['forecast'] = forecast
                break
    except FileNotFoundError:
        pass
    
    # Load inventory results
    try:
        with open('reports/inventory_results.json', 'r') as f:
            all_inventory = json.load(f)
        
        # Find matching inventory
        for inventory in all_inventory:
            if (inventory.get('sku_id') == sku_id and 
                str(inventory.get('pin_code')) == pin_code_str):
                results['inventory'] = inventory
                break
    except FileNotFoundError:
        pass
    
    # Check if we found the combination
    if results['forecast'] or results['inventory']:
        results['found'] = True
    
    return results


def get_available_combinations() -> List[Dict]:
    """
    Get list of all available SKU × PIN combinations.
    
    Returns:
        List of dictionaries with sku_id and pin_code
    """
    combinations = []
    
    try:
        with open('reports/all_model_results.json', 'r') as f:
            all_forecasts = json.load(f)
        
        for forecast in all_forecasts:
            combinations.append({
                'sku_id': forecast.get('sku_id'),
                'pin_code': str(forecast.get('pin_code'))
            })
    except FileNotFoundError:
        pass
    
    return combinations




def extract_structured_metrics(results: Dict) -> Dict:
    """
    Extract structured metrics from forecast and inventory results.
    
    Args:
        results: Dictionary with forecast and inventory data
        
    Returns:
        Dictionary with extracted metrics
    """
    metrics = {
        'sku_id': results['sku_id'],
        'pin_code': results['pin_code']
    }
    
    # Extract forecast metrics
    if results.get('forecast'):
        forecast = results['forecast']
        metrics['baseline_mape'] = forecast.get('baseline_mape')
        metrics['context_mape'] = forecast.get('context_mape')
        metrics['baseline_sigma'] = forecast.get('baseline_sigma')
        metrics['context_sigma'] = forecast.get('context_sigma')
        metrics['mape_improvement_percent'] = forecast.get('mape_improvement_percent')
        metrics['sigma_reduction_percent'] = forecast.get('sigma_reduction_percent')
    
    # Extract inventory metrics
    if results.get('inventory'):
        inventory = results['inventory']
        metrics['baseline_safety_stock'] = inventory.get('baseline_safety_stock')
        metrics['context_safety_stock'] = inventory.get('context_safety_stock')
        metrics['safety_stock_reduction_percent'] = inventory.get('safety_stock_reduction_percent')
        metrics['baseline_working_capital'] = inventory.get('baseline_working_capital')
        metrics['context_working_capital'] = inventory.get('context_working_capital')
        metrics['working_capital_saved'] = inventory.get('working_capital_saved')
        metrics['working_capital_saved_percent'] = inventory.get('working_capital_saved_percent')
        metrics['baseline_stockout_rate'] = inventory.get('baseline_stockout_rate')
        metrics['context_stockout_rate'] = inventory.get('context_stockout_rate')
        metrics['baseline_inventory_turnover'] = inventory.get('baseline_inventory_turnover')
        metrics['context_inventory_turnover'] = inventory.get('context_inventory_turnover')
        metrics['inventory_turnover_improvement_percent'] = inventory.get('inventory_turnover_improvement_percent')
    
    return metrics


def construct_context_block(metrics: Dict) -> str:
    """
    Construct structured context block for a specific SKU × PIN.
    
    Args:
        metrics: Dictionary with extracted metrics
        
    Returns:
        Formatted context string
    """
    context_parts = []
    
    # Header
    context_parts.append(f"SKU: {metrics['sku_id']}")
    context_parts.append(f"PIN: {metrics['pin_code']}")
    context_parts.append("")
    
    # Forecast performance
    if metrics.get('baseline_mape') is not None:
        context_parts.append("FORECAST PERFORMANCE:")
        context_parts.append(f"- Baseline MAPE: {metrics['baseline_mape']}%")
        context_parts.append(f"- Context-Aware MAPE: {metrics['context_mape']}%")
        context_parts.append(f"- MAPE Improvement: {metrics['mape_improvement_percent']}%")
        context_parts.append(f"- Baseline Sigma (Forecast Uncertainty): {metrics['baseline_sigma']}")
        context_parts.append(f"- Context-Aware Sigma: {metrics['context_sigma']}")
        context_parts.append(f"- Sigma Reduction: {metrics['sigma_reduction_percent']}%")
        context_parts.append("")
    
    # Inventory impact
    if metrics.get('baseline_safety_stock') is not None:
        context_parts.append("INVENTORY IMPACT:")
        context_parts.append(f"- Baseline Safety Stock: {metrics['baseline_safety_stock']} units")
        context_parts.append(f"- Context-Aware Safety Stock: {metrics['context_safety_stock']} units")
        context_parts.append(f"- Safety Stock Reduced by: {metrics['safety_stock_reduction_percent']}%")
        context_parts.append(f"- Baseline Working Capital: ₹{metrics['baseline_working_capital']}")
        context_parts.append(f"- Context-Aware Working Capital: ₹{metrics['context_working_capital']}")
        context_parts.append(f"- Working Capital Saved: ₹{metrics['working_capital_saved']}")
        context_parts.append(f"- Working Capital Saved Percent: {metrics['working_capital_saved_percent']}%")
        context_parts.append(f"- Baseline Stockout Rate: {metrics['baseline_stockout_rate']}%")
        context_parts.append(f"- Context-Aware Stockout Rate: {metrics['context_stockout_rate']}%")
        context_parts.append(f"- Service Level Maintained: {100 - metrics['context_stockout_rate']}%")
        context_parts.append(f"- Baseline Inventory Turnover: {metrics['baseline_inventory_turnover']}x")
        context_parts.append(f"- Context-Aware Inventory Turnover: {metrics['context_inventory_turnover']}x")
        context_parts.append(f"- Inventory Turnover Improved by: {metrics['inventory_turnover_improvement_percent']}%")
        context_parts.append("")
    
    return "\n".join(context_parts)


def construct_system_prompt() -> str:
    """
    Construct system prompt for SKU-level assistant.
    
    Returns:
        System prompt string
    """
    return """You are a retail supply chain decision intelligence assistant for MicroPulse, specialized in SKU-level analysis.

CRITICAL RULES:
1. Answer ONLY using the structured metrics provided for this specific SKU × PIN combination
2. Do NOT invent numbers or metrics
3. Do NOT perform calculations beyond what's provided
4. If the question requires unavailable information, respond: "That information is not available in the current simulation results."
5. Keep responses concise (under 150 words)
6. Provide clear answers with business interpretation
7. Use the exact numbers from the context data
8. Focus on actionable insights for this specific SKU × PIN

Your role is to help decision-makers understand the performance and impact for this specific product-location combination."""




def call_bedrock_titan(prompt: str, region: str = 'us-east-1') -> Optional[str]:
    """
    Call Amazon Bedrock Titan Text model.
    
    Args:
        prompt: Complete prompt including system instructions and user question
        region: AWS region for Bedrock (default: us-east-1)
        
    Returns:
        Response text from the model, or None if error
    """
    if not BOTO3_AVAILABLE:
        print("Error: boto3 is not installed. Install with: pip install boto3")
        return None
    
    try:
        # Initialize Bedrock client
        bedrock_runtime = boto3.client(
            service_name='bedrock-runtime',
            region_name=region
        )
        
        # Prepare request body for Nova Lite (uses messages format)
        request_body = {
            "messages": [
                {
                    "role": "user",
                    "content": [{"text": prompt}]
                }
            ],
            "inferenceConfig": {
                "max_new_tokens": 512,
                "temperature": 0.3,
                "top_p": 0.9
            }
        }
        
        # Call Bedrock
        response = bedrock_runtime.invoke_model(
            modelId='amazon.nova-lite-v1:0',
            contentType='application/json',
            accept='application/json',
            body=json.dumps(request_body)
        )
        
        # Parse response
        response_body = json.loads(response['body'].read())
        
        # Extract generated text from Nova format
        generated_text = response_body.get('output', {}).get('message', {}).get('content', [{}])[0].get('text', '')
        
        return generated_text.strip()
        
    except ClientError as e:
        error_code = e.response['Error']['Code']
        error_message = e.response['Error']['Message']
        print(f"AWS Bedrock Error ({error_code}): {error_message}")
        return None
    except Exception as e:
        print(f"Error calling Bedrock: {str(e)}")
        return None


def ask_sku_question(
    sku_id: str,
    pin_code: str,
    user_question: str,
    region: str = 'us-east-1',
    verbose: bool = False
) -> Dict:
    """
    Ask a question about a specific SKU × PIN combination.
    
    Args:
        sku_id: SKU identifier
        pin_code: PIN code
        user_question: User's question about this SKU × PIN
        region: AWS region for Bedrock (default: us-east-1)
        verbose: If True, print debug information
        
    Returns:
        Dictionary with question, answer, and metadata
    """
    # Load results for this SKU × PIN
    results = load_sku_pin_results(sku_id, pin_code)
    
    # Check if combination exists
    if not results['found']:
        available = get_available_combinations()
        return {
            'sku_id': sku_id,
            'pin_code': str(pin_code),
            'question': user_question,
            'answer': f'SKU "{sku_id}" × PIN "{pin_code}" not found in simulation results. Please check the SKU and PIN code.',
            'status': 'error',
            'error': 'Combination not found',
            'available_combinations': available
        }
    
    # Extract metrics
    metrics = extract_structured_metrics(results)
    
    # Construct context block
    context = construct_context_block(metrics)
    
    # Construct system prompt
    system_prompt = construct_system_prompt()
    
    # Construct final prompt
    final_prompt = f"""{system_prompt}

SIMULATION RESULTS FOR THIS SKU × PIN:
{context}

USER QUESTION: {user_question}

Provide a clear, concise answer based strictly on the data above. Include business interpretation where relevant."""
    
    if verbose:
        print("="*70)
        print("PROMPT SENT TO BEDROCK:")
        print("="*70)
        print(final_prompt)
        print("="*70)
    
    # Call Bedrock
    answer = call_bedrock_titan(final_prompt, region=region)
    
    if answer is None:
        return {
            'sku_id': sku_id,
            'pin_code': str(pin_code),
            'question': user_question,
            'answer': 'Error calling Amazon Bedrock. Please check your AWS credentials and permissions.',
            'status': 'error',
            'error': 'Bedrock API call failed'
        }
    
    return {
        'sku_id': sku_id,
        'pin_code': str(pin_code),
        'question': user_question,
        'answer': answer,
        'status': 'success',
        'metrics': metrics
    }


def interactive_sku_session(sku_id: str, pin_code: str, region: str = 'us-east-1'):
    """
    Run an interactive Q&A session for a specific SKU × PIN.
    
    Args:
        sku_id: SKU identifier
        pin_code: PIN code
        region: AWS region for Bedrock (default: us-east-1)
    """
    print("="*70)
    print(f"MICROPULSE SKU-LEVEL CHAT ENGINE")
    print("="*70)
    print(f"\nSKU: {sku_id}")
    print(f"PIN: {pin_code}")
    print("\nAsk questions about this specific SKU × PIN combination.")
    print("Type 'quit' or 'exit' to end the session.\n")
    
    # Verify combination exists
    results = load_sku_pin_results(sku_id, pin_code)
    if not results['found']:
        print(f"❌ SKU '{sku_id}' × PIN '{pin_code}' not found in simulation results.")
        print("\nAvailable combinations:")
        available = get_available_combinations()
        for combo in available[:10]:
            print(f"  - {combo['sku_id']} × {combo['pin_code']}")
        if len(available) > 10:
            print(f"  ... and {len(available) - 10} more")
        return
    
    # Show summary
    metrics = extract_structured_metrics(results)
    print("\n" + "-"*70)
    print("SUMMARY:")
    print("-"*70)
    if metrics.get('mape_improvement_percent'):
        print(f"Forecast Improvement: {metrics['mape_improvement_percent']}%")
    if metrics.get('working_capital_saved'):
        print(f"Working Capital Saved: ₹{metrics['working_capital_saved']}")
    if metrics.get('safety_stock_reduction_percent'):
        print(f"Safety Stock Reduction: {metrics['safety_stock_reduction_percent']}%")
    print("-"*70)
    
    while True:
        try:
            question = input("\nYour Question: ").strip()
            
            if question.lower() in ['quit', 'exit', 'q']:
                print("\nEnding Q&A session. Goodbye!")
                break
            
            if not question:
                continue
            
            print("\nThinking...")
            result = ask_sku_question(sku_id, pin_code, question, region=region)
            
            print("\n" + "-"*70)
            print("ANSWER:")
            print("-"*70)
            print(result['answer'])
            print("-"*70)
            
            if result['status'] == 'error':
                print(f"\n⚠️  Error: {result.get('error', 'Unknown error')}")
        
        except KeyboardInterrupt:
            print("\n\nSession interrupted. Goodbye!")
            break
        except Exception as e:
            print(f"\n❌ Error: {str(e)}")


def list_available_combinations():
    """List all available SKU × PIN combinations."""
    print("="*70)
    print("AVAILABLE SKU × PIN COMBINATIONS")
    print("="*70)
    
    combinations = get_available_combinations()
    
    if not combinations:
        print("\n❌ No simulation results found.")
        print("\nPlease run the following first:")
        print("  1. python core/batch_forecasting.py")
        print("  2. python batch_inventory_simulation.py")
        return
    
    print(f"\nTotal Combinations: {len(combinations)}\n")
    
    for i, combo in enumerate(combinations, 1):
        print(f"{i:2d}. SKU: {combo['sku_id']:15s} PIN: {combo['pin_code']}")
    
    print("\n" + "="*70)


def main():
    """Main execution function."""
    import sys
    
    if len(sys.argv) == 1:
        list_available_combinations()
        print("\nUsage:")
        print("  python core/sku_chat_engine.py <sku_id> <pin_code>")
        print("\nExample:")
        print("  python core/sku_chat_engine.py 500ml_Cola 395001")
    
    elif len(sys.argv) == 2 and sys.argv[1] in ['list', 'ls']:
        list_available_combinations()
    
    elif len(sys.argv) >= 3:
        sku_id = sys.argv[1]
        pin_code = sys.argv[2]
        
        if len(sys.argv) > 3:
            question = ' '.join(sys.argv[3:])
            print(f"\nSKU: {sku_id}")
            print(f"PIN: {pin_code}")
            print(f"Question: {question}\n")
            
            result = ask_sku_question(sku_id, pin_code, question, verbose=False)
            
            print("Answer:")
            print(result['answer'])
            print()
            
            if result['status'] == 'error':
                print(f"Error: {result.get('error', 'Unknown error')}")
                sys.exit(1)
        else:
            interactive_sku_session(sku_id, pin_code)
    
    else:
        print("Usage:")
        print("  python core/sku_chat_engine.py                    # List available combinations")
        print("  python core/sku_chat_engine.py list               # List available combinations")
        print("  python core/sku_chat_engine.py <sku> <pin>        # Interactive Q&A")
        print("  python core/sku_chat_engine.py <sku> <pin> <q>    # Single question")
        print("\nExample:")
        print("  python core/sku_chat_engine.py 500ml_Cola 395001")
        print("  python core/sku_chat_engine.py 500ml_Cola 395001 \"What is the forecast improvement?\"")


if __name__ == "__main__":
    main()
