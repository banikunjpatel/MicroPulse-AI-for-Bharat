"""
MicroPulse API - Run Script
Simple script to start the API server
"""

import uvicorn
import sys


def print_startup_message():
    """Print startup message with useful information."""
    print("\n" + "="*70)
    print("MicroPulse API Server Started")
    print("="*70)
    print("\nServer running at: http://localhost:8000")
    print("Docs available at: http://localhost:8000/docs")
    print("ReDoc available at: http://localhost:8000/redoc")
    print("\nPress Ctrl+C to stop the server")
    print("="*70 + "\n")


if __name__ == "__main__":
    # Print startup message
    print_startup_message()
    
    # Run the server
    try:
        uvicorn.run(
            "api.server:app",
            host="0.0.0.0",
            port=8000,
            reload=True
        )
    except KeyboardInterrupt:
        print("\n\nServer stopped.")
        sys.exit(0)
    except Exception as e:
        print(f"\nError starting server: {str(e)}")
        print("\nMake sure all dependencies are installed:")
        print("  pip install -r requirements.txt")
        sys.exit(1)
