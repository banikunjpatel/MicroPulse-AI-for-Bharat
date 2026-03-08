"""
MicroPulse API - AWS Lambda Handler
Wraps the FastAPI application for AWS Lambda deployment using Mangum
"""

import os
import sys

# Add parent directory to path to import api module
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from mangum import Mangum
from api.server import app

# Configure environment variables with defaults
os.environ.setdefault('BEDROCK_MODEL_ID', 'anthropic.claude-3-5-sonnet-20241022-v2:0')
os.environ.setdefault('AWS_REGION', 'us-east-1')

# Create Lambda handler
handler = Mangum(app, lifespan="off")

# For local testing
if __name__ == "__main__":
    import uvicorn
    print("Running FastAPI locally for testing...")
    print("API available at: http://localhost:8000")
    print("Docs available at: http://localhost:8000/docs")
    uvicorn.run(app, host="0.0.0.0", port=8000)
