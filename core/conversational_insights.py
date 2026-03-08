"""
MicroPulse Conversational Insights Module
Enable grounded conversational Q&A over simulation results using Amazon Bedrock
"""

import json
import os
from typing import Dict, Optional

# Try to import boto3, but make it optional
try:
    import boto3
    from botocore.exceptions import ClientError
    BOTO3_AVAILABLE = True
except ImportError:
    BOTO3_AVAILABLE = False
    boto3 = None
    ClientError = Exception


def load_simulation_results() -> Dict:
    """
    Load all simulation results from JSON files.
    
    Returns:
        Dictionary containing all simulation data
    """
    results = {}
    
    # Load model summary
    try:
        with open('reports/model_summary.json', 'r') as f:
            results['model_summary'] = json.load(f)
    except FileNotFoundError:
        results['model_summary'] = None
    
    # Load inventory summary
    try:
        with open('reports/inventory_summary.json', 'r') as f:
            results['inventory_summary'] = json.load(f)
    except FileNotFoundError:
        results['inventory_summary'] = None
    
    # Load impact projection
    try:
        with open('reports/impact_projection.json', 'r') as f:
            results['impact_projection'] = json.load(f)
    except FileNotFoundError:
        results['impact_projection'] = None
    
    return results


def construct_context_block(results: Dict) -> str:
    """
    Construct structured context block from simulation results.
    
    Args:
        results: Dictionary containing simulation data
        
    Returns:
        Formatted context string
    """
    context_parts = []
    
    # Model summary metrics
    if results.get('model_summary'):
        model = results['model_summary']
        context_parts.append("FORECASTING PERFORMANCE:")
        context_parts.append(f"- Total Combinations Analyzed: {model.get('total_combinations', 'N/A')}")
        context_parts.append(f"- Average Baseline MAPE: {model.get('average_baseline_mape', 'N/A')}%")
        context_parts.append(f"- Average Context-Aware MAPE: {model.get('average_context_mape', 'N/A')}%")
        context_parts.append(f"- MAPE Improvement: {model.get('average_mape_improvement', 'N/A')}%")
        context_parts.append(f"- Average Baseline Sigma: {model.get('average_baseline_sigma', 'N/A')}")
        context_parts.append(f"- Average Context-Aware Sigma: {model.get('average_context_sigma', 'N/A')}")
        context_parts.append(f"- Sigma Reduction: {model.get('average_sigma_reduction', 'N/A')}%")
        context_parts.append("")
    
    # Inventory summary metrics
    if results.get('inventory_summary'):
        inventory = results['inventory_summary']
        context_parts.append("INVENTORY PERFORMANCE:")
        context_parts.append(f"- Total Combinations: {inventory.get('total_combinations', 'N/A')}")
        context_parts.append(f"- Simulation Period: {inventory.get('simulation_days', 'N/A')} days")
        context_parts.append(f"- Service Level Z-Score: {inventory.get('service_level_z', 'N/A')}")
        context_parts.append(f"- Average Safety Stock Reduction: {inventory.get('average_safety_stock_reduction', 'N/A')}%")
        context_parts.append(f"- Average Working Capital Saved per SKU-PIN: ₹{inventory.get('average_working_capital_saved', 'N/A')}")
        context_parts.append(f"- Total Working Capital Saved: ₹{inventory.get('total_working_capital_saved', 'N/A')}")
        context_parts.append(f"- Average Working Capital Saved Percent: {inventory.get('average_working_capital_saved_percent', 'N/A')}%")
        context_parts.append(f"- Average Baseline Inventory Turnover: {inventory.get('average_baseline_inventory_turnover', 'N/A')}x")
        context_parts.append(f"- Average Context-Aware Inventory Turnover: {inventory.get('average_context_inventory_turnover', 'N/A')}x")
        context_parts.append(f"- Inventory Turnover Improvement: {inventory.get('average_inventory_turnover_improvement', 'N/A')}x")
        context_parts.append(f"- Inventory Turnover Improvement Percent: {inventory.get('average_inventory_turnover_improvement_percent', 'N/A')}%")
        context_parts.append(f"- Average Baseline Stockout Rate: {inventory.get('average_baseline_stockout_rate', 'N/A')}%")
        context_parts.append(f"- Average Context-Aware Stockout Rate: {inventory.get('average_context_stockout_rate', 'N/A')}%")
        context_parts.append("")
    
    # Impact projection metrics
    if results.get('impact_projection'):
        projection = results['impact_projection']
        base = projection.get('base_results', {})
        scenarios = projection.get('projection_scenarios', {})
        
        context_parts.append("IMPACT PROJECTIONS:")
        context_parts.append(f"- Base Combinations: {base.get('total_combinations', 'N/A')}")
        context_parts.append(f"- Base Simulation Days: {base.get('simulation_days', 'N/A')}")
        context_parts.append(f"- Saving per Combination: ₹{base.get('saving_per_combination', 'N/A')}")
        context_parts.append("")
        
        if '100sku_20pin' in scenarios:
            scenario_a = scenarios['100sku_20pin']
            context_parts.append(f"SCENARIO A ({scenario_a.get('description', 'N/A')}):")
            context_parts.append(f"- Total Combinations: {scenario_a.get('total_combinations', 'N/A')}")
            context_parts.append(f"- Projected Capital Unlock (36 days): ₹{scenario_a.get('projected_capital_unlock_36days', 'N/A'):,.2f}")
            context_parts.append(f"- Annualized Capital Unlock: ₹{scenario_a.get('annualized_capital_unlock', 'N/A'):,.2f}")
            context_parts.append("")
        
        if '200sku_50pin' in scenarios:
            scenario_b = scenarios['200sku_50pin']
            context_parts.append(f"SCENARIO B ({scenario_b.get('description', 'N/A')}):")
            context_parts.append(f"- Total Combinations: {scenario_b.get('total_combinations', 'N/A')}")
            context_parts.append(f"- Projected Capital Unlock (36 days): ₹{scenario_b.get('projected_capital_unlock_36days', 'N/A'):,.2f}")
            context_parts.append(f"- Annualized Capital Unlock: ₹{scenario_b.get('annualized_capital_unlock', 'N/A'):,.2f}")
            context_parts.append("")
    
    return "\n".join(context_parts)


def construct_system_prompt() -> str:
    """
    Construct system prompt for the AI assistant.
    
    Returns:
        System prompt string
    """
    return """You are a retail supply chain intelligence assistant for MicroPulse, an AI-driven demand forecasting and inventory optimization system.

CRITICAL RULES:
1. Answer STRICTLY using the provided structured data
2. Do NOT invent numbers or metrics
3. Do NOT perform calculations beyond what's provided
4. If information is not available in provided data, say: "That information is not available in the current simulation results."
5. Keep responses under 150 words
6. Provide clear answers with business interpretation
7. Use the exact numbers from the context data
8. Do not expose raw datasets or technical implementation details

Your role is to help business stakeholders understand the simulation results and their business implications."""


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


def ask_question(
    user_question: str,
    region: str = 'us-east-1',
    verbose: bool = False
) -> Dict:
    """
    Ask a question about MicroPulse simulation results.
    
    Args:
        user_question: User's question about the simulation results
        region: AWS region for Bedrock (default: us-east-1)
        verbose: If True, print debug information
        
    Returns:
        Dictionary with question, answer, and metadata
    """
    # Load simulation results
    results = load_simulation_results()
    
    # Check if data is available
    if not any(results.values()):
        return {
            'question': user_question,
            'answer': 'No simulation results found. Please run the forecasting and inventory simulation first.',
            'status': 'error',
            'error': 'Missing simulation results'
        }
    
    # Construct context block
    context = construct_context_block(results)
    
    # Construct system prompt
    system_prompt = construct_system_prompt()
    
    # Construct final prompt
    final_prompt = f"""{system_prompt}

SIMULATION RESULTS DATA:
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
            'question': user_question,
            'answer': 'Error calling Amazon Bedrock. Please check your AWS credentials and permissions.',
            'status': 'error',
            'error': 'Bedrock API call failed'
        }
    
    return {
        'question': user_question,
        'answer': answer,
        'status': 'success',
        'context_used': {
            'model_summary_available': results.get('model_summary') is not None,
            'inventory_summary_available': results.get('inventory_summary') is not None,
            'impact_projection_available': results.get('impact_projection') is not None
        }
    }


def interactive_qa_session(region: str = 'us-east-1'):
    """
    Run an interactive Q&A session.
    
    Args:
        region: AWS region for Bedrock (default: us-east-1)
    """
    print("="*70)
    print("MICROPULSE CONVERSATIONAL INSIGHTS")
    print("="*70)
    print("\nAsk questions about the simulation results.")
    print("Type 'quit' or 'exit' to end the session.\n")
    
    while True:
        try:
            question = input("\nYour Question: ").strip()
            
            if question.lower() in ['quit', 'exit', 'q']:
                print("\nEnding Q&A session. Goodbye!")
                break
            
            if not question:
                continue
            
            print("\nThinking...")
            result = ask_question(question, region=region)
            
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


def main():
    """Main execution function."""
    import sys
    
    if len(sys.argv) > 1:
        # Single question mode
        question = ' '.join(sys.argv[1:])
        print(f"\nQuestion: {question}\n")
        
        result = ask_question(question, verbose=False)
        
        print("Answer:")
        print(result['answer'])
        print()
        
        if result['status'] == 'error':
            print(f"Error: {result.get('error', 'Unknown error')}")
            sys.exit(1)
    else:
        # Interactive mode
        interactive_qa_session()


if __name__ == "__main__":
    main()
