"""
Test Stateful SKU Chat
Demonstrates session memory and multi-turn conversations
"""

from core.stateful_sku_chat import (
    create_session,
    get_session,
    update_session,
    clear_session,
    list_sessions,
    load_sku_pin_metrics,
    construct_context_block,
    format_conversation_history,
    ask_stateful_question
)


def test_session_management():
    """Test session creation and management."""
    print("="*70)
    print("TEST 1: SESSION MANAGEMENT")
    print("="*70)
    
    # Create session
    session_id = create_session('500ml_Cola', '395001')
    print(f"\n✅ Session Created: {session_id}")
    
    # Get session
    session = get_session(session_id)
    print(f"✅ Session Retrieved")
    print(f"   SKU: {session['sku_id']}")
    print(f"   PIN: {session['pin_code']}")
    print(f"   Messages: {len(session['conversation'])}")
    
    # Update session
    update_session(session_id, "What is the forecast improvement?", "The forecast improved by 68%.")
    session = get_session(session_id)
    print(f"\n✅ Session Updated")
    print(f"   Messages: {len(session['conversation'])}")
    
    # Add more messages
    update_session(session_id, "How much working capital saved?", "₹729.89 saved.")
    update_session(session_id, "What is the safety stock reduction?", "68.24% reduction.")
    session = get_session(session_id)
    print(f"✅ More Messages Added")
    print(f"   Messages: {len(session['conversation'])}")
    
    # Test memory limit (should keep only last 3 exchanges = 6 messages)
    update_session(session_id, "Question 4", "Answer 4")
    session = get_session(session_id)
    print(f"\n✅ Memory Limit Test")
    print(f"   Messages after 4 exchanges: {len(session['conversation'])} (should be 6)")
    
    # Clear session
    cleared = clear_session(session_id)
    print(f"\n✅ Session Cleared: {cleared}")
    
    return session_id


def test_load_metrics():
    """Test loading SKU × PIN metrics."""
    print("\n" + "="*70)
    print("TEST 2: LOAD SKU × PIN METRICS")
    print("="*70)
    
    # Test with valid combination
    metrics = load_sku_pin_metrics('500ml_Cola', '395001')
    
    if metrics:
        print(f"\n✅ Metrics Loaded for 500ml_Cola × 395001")
        print(f"   Found: {metrics['found']}")
        if metrics.get('baseline_mape'):
            print(f"   Baseline MAPE: {metrics['baseline_mape']}%")
            print(f"   Context MAPE: {metrics['context_mape']}%")
            print(f"   MAPE Improvement: {metrics['mape_improvement_percent']}%")
        if metrics.get('working_capital_saved'):
            print(f"   Working Capital Saved: ₹{metrics['working_capital_saved']}")
            print(f"   Safety Stock Reduction: {metrics['safety_stock_reduction_percent']}%")
    else:
        print("\n❌ Metrics not found")
    
    # Test with invalid combination
    metrics_invalid = load_sku_pin_metrics('Invalid_SKU', '999999')
    print(f"\n✅ Invalid Combination Test")
    print(f"   Result: {metrics_invalid}")
    
    return metrics


def test_context_construction(metrics):
    """Test context block construction."""
    print("\n" + "="*70)
    print("TEST 3: CONTEXT BLOCK CONSTRUCTION")
    print("="*70)
    
    if not metrics:
        print("\n⚠️  Skipped - no metrics available")
        return
    
    context = construct_context_block(metrics)
    
    print("\nContext Block:")
    print("-"*70)
    print(context)
    print("-"*70)
    
    print(f"\nContext Length: {len(context)} characters")


def test_conversation_history():
    """Test conversation history formatting."""
    print("\n" + "="*70)
    print("TEST 4: CONVERSATION HISTORY FORMATTING")
    print("="*70)
    
    # Create sample conversation
    conversation = [
        {'role': 'user', 'content': 'What is the forecast improvement?'},
        {'role': 'assistant', 'content': 'The forecast improved by 68.24%.'},
        {'role': 'user', 'content': 'How much working capital saved?'},
        {'role': 'assistant', 'content': 'Working capital saved is ₹729.89.'}
    ]
    
    history = format_conversation_history(conversation)
    
    print("\nFormatted History:")
    print("-"*70)
    print(history)
    print("-"*70)


def test_multi_turn_conversation():
    """Test multi-turn conversation with memory."""
    print("\n" + "="*70)
    print("TEST 5: MULTI-TURN CONVERSATION (Simulated)")
    print("="*70)
    
    print("\nSimulating a multi-turn conversation:")
    print("(Actual Bedrock calls require AWS credentials)")
    
    # Create session
    session_id = create_session('500ml_Cola', '395001')
    print(f"\n1. Session Created: {session_id}")
    
    # Simulate conversation turns
    turns = [
        "What is the forecast accuracy improvement?",
        "How does that compare to the baseline?",
        "What about working capital savings?",
        "Is the service level maintained?"
    ]
    
    print("\n2. Simulated Questions:")
    for i, question in enumerate(turns, 1):
        print(f"   Turn {i}: {question}")
    
    print("\n3. Session Memory:")
    print("   - Keeps last 3 exchanges (6 messages)")
    print("   - Earlier messages automatically pruned")
    print("   - Context maintained across turns")
    
    print("\n4. To test with actual Bedrock:")
    print("   - Configure AWS credentials")
    print("   - Enable Bedrock access")
    print("   - Run: python core/stateful_sku_chat.py 500ml_Cola 395001")
    
    # Clean up
    clear_session(session_id)


def test_session_listing():
    """Test listing active sessions."""
    print("\n" + "="*70)
    print("TEST 6: SESSION LISTING")
    print("="*70)
    
    # Create multiple sessions
    session1 = create_session('500ml_Cola', '395001')
    session2 = create_session('1L_Cola', '395002')
    session3 = create_session('2L_Cola', '395003')
    
    print(f"\n✅ Created 3 test sessions")
    
    # List sessions
    sessions = list_sessions()
    
    print(f"\nActive Sessions: {len(sessions)}")
    for i, session in enumerate(sessions, 1):
        print(f"\n{i}. Session ID: {session['session_id'][:8]}...")
        print(f"   SKU: {session['sku_id']} × PIN: {session['pin_code']}")
        print(f"   Messages: {session['message_count']}")
    
    # Clean up
    clear_session(session1)
    clear_session(session2)
    clear_session(session3)
    
    print(f"\n✅ Cleaned up test sessions")


def main():
    """Run all tests."""
    print("="*70)
    print("MICROPULSE STATEFUL SKU CHAT - TEST SUITE")
    print("="*70)
    
    # Test 1: Session management
    session_id = test_session_management()
    
    # Test 2: Load metrics
    metrics = test_load_metrics()
    
    # Test 3: Context construction
    test_context_construction(metrics)
    
    # Test 4: Conversation history
    test_conversation_history()
    
    # Test 5: Multi-turn conversation
    test_multi_turn_conversation()
    
    # Test 6: Session listing
    test_session_listing()
    
    print("\n" + "="*70)
    print("TEST SUITE COMPLETED")
    print("="*70)
    
    print("\n📚 USAGE EXAMPLES:")
    
    print("\n1. Start New Session:")
    print("   python core/stateful_sku_chat.py 500ml_Cola 395001")
    
    print("\n2. Resume Existing Session:")
    print("   python core/stateful_sku_chat.py 500ml_Cola 395001 <session_id>")
    
    print("\n3. List Active Sessions:")
    print("   python core/stateful_sku_chat.py sessions")
    
    print("\n4. Programmatic Usage:")
    print("   from core.stateful_sku_chat import ask_stateful_question, create_session")
    print("   ")
    print("   # Create session")
    print("   session_id = create_session('500ml_Cola', '395001')")
    print("   ")
    print("   # Ask questions")
    print("   result1 = ask_stateful_question(session_id, '500ml_Cola', '395001',")
    print("                                    'What is the forecast improvement?')")
    print("   result2 = ask_stateful_question(session_id, '500ml_Cola', '395001',")
    print("                                    'How does that compare to baseline?')")
    print("   ")
    print("   # Assistant remembers context from result1 when answering result2")
    
    print("\n5. Interactive Commands:")
    print("   - Type your questions naturally")
    print("   - 'history' - View conversation history")
    print("   - 'clear' - Clear conversation memory")
    print("   - 'quit' - End session (saves session ID for resume)")
    
    print("\n" + "="*70)
    
    print("\n💡 KEY FEATURES:")
    print("   ✅ Session memory (last 3 exchanges)")
    print("   ✅ Multi-turn conversations")
    print("   ✅ Context awareness")
    print("   ✅ Session resume capability")
    print("   ✅ Conversation history management")
    
    print("\n" + "="*70)


if __name__ == "__main__":
    main()
