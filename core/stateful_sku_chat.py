"""
MicroPulse Stateful SKU Chat
Enable SKU-level conversational AI with session memory using Amazon Bedrock
"""

import json
import uuid
from typing import Dict, List, Optional
from datetime import datetime

# Try to import boto3, but make it optional
try:
    import boto3
    from botocore.exceptions import ClientError
    BOTO3_AVAILABLE = True
except ImportError:
    BOTO3_AVAILABLE = False
    boto3 = None
    ClientError = Exception


# Global session storage (in-memory)
# In production, use Redis, DynamoDB, or similar
sessions = {}


def create_session(sku_id: str, pin_code: str) -> str:
    """
    Create a new conversation session.
    
    Args:
        sku_id: SKU identifier
        pin_code: PIN code
        
    Returns:
        session_id: Unique session identifier
    """
    session_id = str(uuid.uuid4())
    sessions[session_id] = {
        'sku_id': sku_id,
        'pin_code': str(pin_code),
        'conversation': [],
        'created_at': datetime.now().isoformat(),
        'last_updated': datetime.now().isoformat()
    }
    return session_id


def get_session(session_id: str) -> Optional[Dict]:
    """
    Get session data.
    
    Args:
        session_id: Session identifier
        
    Returns:
        Session data or None if not found
    """
    return sessions.get(session_id)


def update_session(session_id: str, user_message: str, assistant_message: str):
    """
    Update session with new conversation turn.
    
    Args:
        session_id: Session identifier
        user_message: User's message
        assistant_message: Assistant's response
    """
    if session_id in sessions:
        session = sessions[session_id]
        
        # Add new messages
        session['conversation'].append({
            'role': 'user',
            'content': user_message
        })
        session['conversation'].append({
            'role': 'assistant',
            'content': assistant_message
        })
        
        # Keep only last 3 exchanges (6 messages)
        if len(session['conversation']) > 6:
            session['conversation'] = session['conversation'][-6:]
        
        # Update timestamp
        session['last_updated'] = datetime.now().isoformat()


def clear_session(session_id: str) -> bool:
    """
    Clear a session.
    
    Args:
        session_id: Session identifier
        
    Returns:
        True if session was cleared, False if not found
    """
    if session_id in sessions:
        del sessions[session_id]
        return True
    return False


def list_sessions() -> List[Dict]:
    """
    List all active sessions.
    
    Returns:
        List of session summaries
    """
    summaries = []
    for session_id, session in sessions.items():
        summaries.append({
            'session_id': session_id,
            'sku_id': session['sku_id'],
            'pin_code': session['pin_code'],
            'message_count': len(session['conversation']),
            'created_at': session['created_at'],
            'last_updated': session['last_updated']
        })
    return summaries


def load_sku_pin_metrics(sku_id: str, pin_code: str) -> Optional[Dict]:
    """
    Load metrics for a specific SKU × PIN combination.
    
    Args:
        sku_id: SKU identifier
        pin_code: PIN code
        
    Returns:
        Dictionary with metrics or None if not found
    """
    metrics = {
        'sku_id': sku_id,
        'pin_code': str(pin_code),
        'found': False
    }
    
    pin_code_str = str(pin_code)
    
    # Load forecast results
    try:
        with open('reports/all_model_results.json', 'r') as f:
            all_forecasts = json.load(f)
        
        for forecast in all_forecasts:
            if (forecast.get('sku_id') == sku_id and 
                str(forecast.get('pin_code')) == pin_code_str):
                metrics['baseline_mape'] = forecast.get('baseline_mape')
                metrics['context_mape'] = forecast.get('context_mape')
                metrics['mape_improvement_percent'] = forecast.get('mape_improvement_percent')
                metrics['sigma_reduction_percent'] = forecast.get('sigma_reduction_percent')
                metrics['found'] = True
                break
    except FileNotFoundError:
        pass
    
    # Load inventory results
    try:
        with open('reports/inventory_results.json', 'r') as f:
            all_inventory = json.load(f)
        
        for inventory in all_inventory:
            if (inventory.get('sku_id') == sku_id and 
                str(inventory.get('pin_code')) == pin_code_str):
                metrics['safety_stock_reduction_percent'] = inventory.get('safety_stock_reduction_percent')
                metrics['working_capital_saved'] = inventory.get('working_capital_saved')
                metrics['working_capital_saved_percent'] = inventory.get('working_capital_saved_percent')
                metrics['inventory_turnover_improvement_percent'] = inventory.get('inventory_turnover_improvement_percent')
                metrics['baseline_stockout_rate'] = inventory.get('baseline_stockout_rate')
                metrics['context_stockout_rate'] = inventory.get('context_stockout_rate')
                metrics['found'] = True
                break
    except FileNotFoundError:
        pass
    
    return metrics if metrics['found'] else None


def construct_context_block(metrics: Dict) -> str:
    """
    Construct structured context block for SKU × PIN.

    Args:
        metrics: Dictionary with metrics

    Returns:
        Formatted context string
    """
    context_parts = []

    context_parts.append(f"SKU: {metrics['sku_id']}")
    context_parts.append(f"PIN: {metrics['pin_code']}")
    context_parts.append("")

    # Forecast performance
    if metrics.get('baseline_mape') is not None:
        context_parts.append("FORECAST PERFORMANCE:")
        context_parts.append(f"- Baseline MAPE: {metrics['baseline_mape']}%")
        context_parts.append(f"- Context-Aware MAPE: {metrics['context_mape']}%")
        context_parts.append(f"- MAPE Improvement: {metrics['mape_improvement_percent']}%")
        context_parts.append(f"- Sigma Reduction: {metrics['sigma_reduction_percent']}%")
        context_parts.append("")

    # Inventory impact
    if metrics.get('safety_stock_reduction_percent') is not None:
        # Calculate revenue recovery potential (approximate for demo)
        revenue_recovery = metrics['working_capital_saved'] * 3

        context_parts.append("INVENTORY IMPACT:")
        context_parts.append(f"- Lead Time: 3 days")
        context_parts.append(f"- Target Service Level: 95%")
        context_parts.append(f"- Safety Stock Reduced: {metrics['safety_stock_reduction_percent']}%")
        context_parts.append(f"- Working Capital Saved: ₹{metrics['working_capital_saved']}")
        context_parts.append(f"- Revenue Recovery Potential (estimated): ₹{revenue_recovery:.2f}")
        context_parts.append(f"- Working Capital Saved Percent: {metrics['working_capital_saved_percent']}%")
        context_parts.append(f"- Baseline Stockout Rate: {metrics['baseline_stockout_rate']}%")
        context_parts.append(f"- Context-Aware Stockout Rate: {metrics['context_stockout_rate']}%")
        context_parts.append(f"- Service Level Achieved: {100 - metrics['context_stockout_rate']}%")
        context_parts.append(f"- Inventory Turnover Improvement: {metrics['inventory_turnover_improvement_percent']}%")
        context_parts.append("")

    return "\n".join(context_parts)




def construct_system_prompt() -> str:
    """
    Construct system prompt for stateful assistant.
    
    Returns:
        System prompt string
    """
    return """You are a retail supply chain AI copilot for MicroPulse, specialized in SKU-level analysis with conversation memory.

CRITICAL RULES:
1. Answer ONLY using the provided structured metrics for this specific SKU × PIN
2. Do NOT invent numbers or metrics
3. Do NOT perform calculations beyond what's provided
4. If information is unavailable, say: "That information is not available in the current simulation results."
5. Keep responses concise (under 150 words)
6. Provide clear answers with business interpretation
7. Use exact numbers from the context data
8. Reference previous conversation when relevant
9. When possible, explain how forecast improvements reduce inventory uncertainty
10. Highlight financial implications such as working capital savings
11. Interpret metrics in simple business language for supply chain managers
12. Maintain context across multiple questions
13. Focus on actionable insights

Your role is to help decision-makers understand performance through natural conversation."""


def format_conversation_history(conversation: List[Dict]) -> str:
    """
    Format conversation history for prompt.
    
    Args:
        conversation: List of conversation messages
        
    Returns:
        Formatted conversation string
    """
    if not conversation:
        return ""
    
    history_parts = ["PREVIOUS CONVERSATION:"]
    for msg in conversation:
        role = msg['role'].upper()
        content = msg['content']
        history_parts.append(f"{role}: {content}")
    history_parts.append("")
    
    return "\n".join(history_parts)


def call_bedrock_titan(prompt: str, region: str = 'us-east-1') -> Optional[str]:
    """
    Call Amazon Bedrock Titan Text model.
    
    Args:
        prompt: Complete prompt
        region: AWS region for Bedrock
        
    Returns:
        Response text or None if error
    """
    if not BOTO3_AVAILABLE:
        print("Error: boto3 is not installed. Install with: pip install boto3")
        return None
    
    try:
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
        
        response = bedrock_runtime.invoke_model(
            modelId='amazon.nova-lite-v1:0',
            contentType='application/json',
            accept='application/json',
            body=json.dumps(request_body)
        )
        
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


def ask_stateful_question(
    session_id: str,
    sku_id: str,
    pin_code: str,
    user_question: str,
    region: str = 'us-east-1',
    verbose: bool = False
) -> Dict:
    """
    Ask a question with session memory.
    
    Args:
        session_id: Session identifier (or None to create new)
        sku_id: SKU identifier
        pin_code: PIN code
        user_question: User's question
        region: AWS region for Bedrock
        verbose: Print debug information
        
    Returns:
        Dictionary with response and session info
    """
    # Create session if needed
    if session_id is None or session_id not in sessions:
        session_id = create_session(sku_id, pin_code)
        is_new_session = True
    else:
        is_new_session = False
        # Verify session matches SKU × PIN
        session = get_session(session_id)
        if session['sku_id'] != sku_id or session['pin_code'] != str(pin_code):
            return {
                'session_id': session_id,
                'sku_id': sku_id,
                'pin_code': str(pin_code),
                'question': user_question,
                'answer': f'Session {session_id} is for {session["sku_id"]} × {session["pin_code"]}, not {sku_id} × {pin_code}',
                'status': 'error',
                'error': 'Session SKU/PIN mismatch'
            }
    
    # Load metrics
    metrics = load_sku_pin_metrics(sku_id, pin_code)
    
    if metrics is None:
        return {
            'session_id': session_id,
            'sku_id': sku_id,
            'pin_code': str(pin_code),
            'question': user_question,
            'answer': f'SKU "{sku_id}" × PIN "{pin_code}" not found in simulation results.',
            'status': 'error',
            'error': 'Combination not found'
        }
    
    # Get session
    session = get_session(session_id)
    
    # Construct context block
    context = construct_context_block(metrics)
    
    # Construct system prompt
    system_prompt = construct_system_prompt()
    
    # Format conversation history
    conversation_history = format_conversation_history(session['conversation'])
    
    # Construct final prompt
    final_prompt = f"""{system_prompt}

SIMULATION RESULTS FOR THIS SKU × PIN:
{context}

{conversation_history}

CURRENT USER QUESTION: {user_question}

Provide a clear, concise answer based on the data and conversation history above."""
    
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
            'session_id': session_id,
            'sku_id': sku_id,
            'pin_code': str(pin_code),
            'question': user_question,
            'answer': 'Error calling Amazon Bedrock. Please check your AWS credentials and permissions.',
            'status': 'error',
            'error': 'Bedrock API call failed'
        }
    
    # Update session
    update_session(session_id, user_question, answer)
    
    return {
        'session_id': session_id,
        'sku_id': sku_id,
        'pin_code': str(pin_code),
        'question': user_question,
        'answer': answer,
        'status': 'success',
        'is_new_session': is_new_session,
        'conversation_length': len(session['conversation'])
    }


def interactive_stateful_session(
    sku_id: str,
    pin_code: str,
    session_id: Optional[str] = None,
    region: str = 'us-east-1'
):
    """
    Run an interactive stateful Q&A session.
    
    Args:
        sku_id: SKU identifier
        pin_code: PIN code
        session_id: Existing session ID (or None for new)
        region: AWS region for Bedrock
    """
    print("="*70)
    print("MICROPULSE STATEFUL SKU CHAT")
    print("="*70)
    
    # Create or resume session
    if session_id is None:
        session_id = create_session(sku_id, pin_code)
        print(f"\n✅ New session created: {session_id}")
    else:
        session = get_session(session_id)
        if session is None:
            print(f"\n❌ Session {session_id} not found. Creating new session.")
            session_id = create_session(sku_id, pin_code)
            print(f"✅ New session created: {session_id}")
        else:
            print(f"\n✅ Resuming session: {session_id}")
            print(f"   Previous messages: {len(session['conversation'])}")
    
    print(f"\nSKU: {sku_id}")
    print(f"PIN: {pin_code}")
    print("\nAsk questions about this SKU × PIN. The assistant remembers context.")
    print("Commands:")
    print("  'quit' or 'exit' - End session")
    print("  'clear' - Clear conversation history")
    print("  'history' - Show conversation history")
    print()
    
    while True:
        try:
            question = input("\nYour Question: ").strip()
            
            if question.lower() in ['quit', 'exit', 'q']:
                print(f"\nEnding session. Session ID: {session_id}")
                print("Use this ID to resume later.")
                break
            
            if question.lower() == 'clear':
                session = get_session(session_id)
                session['conversation'] = []
                print("✅ Conversation history cleared.")
                continue
            
            if question.lower() == 'history':
                session = get_session(session_id)
                if not session['conversation']:
                    print("No conversation history.")
                else:
                    print("\n" + "-"*70)
                    print("CONVERSATION HISTORY:")
                    print("-"*70)
                    for msg in session['conversation']:
                        role = msg['role'].upper()
                        print(f"\n{role}:")
                        print(msg['content'])
                    print("-"*70)
                continue
            
            if not question:
                continue
            
            print("\nThinking...")
            result = ask_stateful_question(
                session_id, sku_id, pin_code, question, region=region
            )
            
            print("\n" + "-"*70)
            print("ANSWER:")
            print("-"*70)
            print(result['answer'])
            print("-"*70)
            print(f"[Session: {session_id} | Messages: {result.get('conversation_length', 0)}]")
            
            if result['status'] == 'error':
                print(f"\n⚠️  Error: {result.get('error', 'Unknown error')}")
        
        except KeyboardInterrupt:
            print(f"\n\nSession interrupted. Session ID: {session_id}")
            print("Use this ID to resume later.")
            break
        except Exception as e:
            print(f"\n❌ Error: {str(e)}")


def main():
    """Main execution function."""
    import sys
    
    if len(sys.argv) == 1:
        print("Usage:")
        print("  python core/stateful_sku_chat.py <sku_id> <pin_code>              # New session")
        print("  python core/stateful_sku_chat.py <sku_id> <pin_code> <session_id> # Resume session")
        print("  python core/stateful_sku_chat.py sessions                         # List sessions")
        print("\nExample:")
        print("  python core/stateful_sku_chat.py 500ml_Cola 395001")
        print("  python core/stateful_sku_chat.py 500ml_Cola 395001 abc-123-def")
    
    elif len(sys.argv) == 2 and sys.argv[1] == 'sessions':
        # List sessions
        print("="*70)
        print("ACTIVE SESSIONS")
        print("="*70)
        
        session_list = list_sessions()
        
        if not session_list:
            print("\nNo active sessions.")
        else:
            print(f"\nTotal Sessions: {len(session_list)}\n")
            for i, session in enumerate(session_list, 1):
                print(f"{i}. Session ID: {session['session_id']}")
                print(f"   SKU: {session['sku_id']} × PIN: {session['pin_code']}")
                print(f"   Messages: {session['message_count']}")
                print(f"   Created: {session['created_at']}")
                print(f"   Updated: {session['last_updated']}")
                print()
    
    elif len(sys.argv) >= 3:
        # Interactive mode
        sku_id = sys.argv[1]
        pin_code = sys.argv[2]
        session_id = sys.argv[3] if len(sys.argv) > 3 else None
        
        interactive_stateful_session(sku_id, pin_code, session_id)
    
    else:
        print("Invalid arguments. Use --help for usage information.")


if __name__ == "__main__":
    main()
