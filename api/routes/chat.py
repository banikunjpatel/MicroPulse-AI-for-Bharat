"""
MicroPulse API - Chat Routes
Endpoints for conversational AI
"""

from fastapi import APIRouter, HTTPException

from api.schemas import ChatRequest, ChatResponse, ErrorResponse
from core.stateful_sku_chat import ask_stateful_question, create_session

router = APIRouter(prefix="/chat", tags=["Chat"])


@router.post("/ask", response_model=ChatResponse)
def ask_question(request: ChatRequest):
    """
    Ask a question about a specific SKU × PIN combination.
    
    Uses stateful conversational AI with session memory.
    If no session_id is provided, a new session will be created.
    
    The AI provides business-oriented insights about:
    - Forecast accuracy improvements
    - Inventory optimization
    - Financial impact
    - Working capital savings
    """
    try:
        # Call the stateful chat function
        result = ask_stateful_question(
            session_id=request.session_id,
            sku_id=request.sku,
            pin_code=request.pin,
            user_question=request.question,
            region='us-east-1',
            verbose=False
        )
        
        # Check if there was an error
        if result.get('status') == 'error':
            raise HTTPException(
                status_code=400,
                detail=result.get('error', 'Unknown error occurred')
            )
        
        # Return successful response
        return ChatResponse(
            session_id=result.get('session_id'),
            sku=result.get('sku_id'),
            pin=result.get('pin_code'),
            question=result.get('question'),
            answer=result.get('answer'),
            status=result.get('status'),
            is_new_session=result.get('is_new_session'),
            conversation_length=result.get('conversation_length')
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error processing chat request: {str(e)}"
        )


@router.post("/session/create")
def create_chat_session(sku: str, pin: str):
    """
    Create a new chat session for a specific SKU × PIN combination.
    
    Returns the session_id that can be used for subsequent questions.
    """
    try:
        session_id = create_session(sku, pin)
        
        return {
            "session_id": session_id,
            "sku": sku,
            "pin": pin,
            "status": "success",
            "message": "Session created successfully"
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error creating session: {str(e)}"
        )
