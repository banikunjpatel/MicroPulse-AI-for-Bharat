"""
MicroPulse API Server
FastAPI server for exposing forecasting, inventory, and conversational AI capabilities
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.routes import forecast, inventory, chat
from api.schemas import HealthResponse
from api.utils.loaders import load_summary_data

# Initialize FastAPI app
app = FastAPI(
    title="MicroPulse API",
    description="AI-driven demand forecasting and inventory optimization API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Enable CORS for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(forecast.router)
app.include_router(inventory.router)
app.include_router(chat.router)


@app.get("/", response_model=HealthResponse)
def root():
    """
    Root endpoint - Health check.
    
    Returns API status and version information.
    """
    return HealthResponse(
        status="healthy",
        message="MicroPulse API is running",
        version="1.0.0"
    )


@app.get("/health", response_model=HealthResponse)
def health_check():
    """
    Health check endpoint.
    
    Verifies that the API is running and can access data files.
    """
    try:
        # Try to load summary data to verify file access
        summary = load_summary_data()
        
        has_model_data = summary.get('model_summary') is not None
        has_inventory_data = summary.get('inventory_summary') is not None
        
        if has_model_data and has_inventory_data:
            return HealthResponse(
                status="healthy",
                message="API is running and data files are accessible",
                version="1.0.0"
            )
        else:
            return HealthResponse(
                status="degraded",
                message="API is running but some data files are missing",
                version="1.0.0"
            )
            
    except Exception as e:
        return HealthResponse(
            status="unhealthy",
            message=f"API is running but encountered error: {str(e)}",
            version="1.0.0"
        )


@app.get("/summary")
def get_summary():
    """
    Get summary statistics across all SKU × PIN combinations.
    
    Returns aggregated metrics from model_summary.json, inventory_summary.json,
    and impact_projection.json.
    """
    summary = load_summary_data()
    
    return {
        "model_summary": summary.get('model_summary'),
        "inventory_summary": summary.get('inventory_summary'),
        "impact_projection": summary.get('impact_projection'),
        "status": "success"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
