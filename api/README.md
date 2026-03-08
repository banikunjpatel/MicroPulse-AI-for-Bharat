# MicroPulse API

FastAPI server for exposing MicroPulse forecasting, inventory optimization, and conversational AI capabilities.

## Features

- **Forecast API**: Access forecast accuracy metrics for SKU × PIN combinations
- **Inventory API**: Get inventory optimization data and working capital savings
- **Chat API**: Conversational AI for business insights
- **Auto-generated Documentation**: Interactive API docs at `/docs`

## Installation

### Install Dependencies

```bash
pip install fastapi uvicorn pydantic
```

Or install from requirements:

```bash
pip install -r requirements.txt
```

## Running the Server

### Development Mode (with auto-reload)

```bash
uvicorn api.server:app --reload
```

### Production Mode

```bash
uvicorn api.server:app --host 0.0.0.0 --port 8000
```

The server will start at: `http://localhost:8000`

## API Documentation

Once the server is running, access the interactive documentation:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## API Endpoints

### Health Check

**GET /**
```bash
curl http://localhost:8000/
```

Response:
```json
{
  "status": "healthy",
  "message": "MicroPulse API is running",
  "version": "1.0.0"
}
```

### Forecast Endpoints

#### Get Forecast Data

**GET /forecast**

Query Parameters:
- `sku` (required): SKU identifier
- `pin` (required): PIN code

Example:
```bash
curl "http://localhost:8000/forecast?sku=500ml_Cola&pin=395001"
```

Response:
```json
{
  "sku": "500ml_Cola",
  "pin": "395001",
  "baseline_mape": 9.25,
  "context_mape": 3.54,
  "mape_improvement_percent": 61.73,
  "baseline_sigma": 14.81,
  "context_sigma": 5.33,
  "sigma_reduction_percent": 63.95,
  "status": "success"
}
```

#### List All Combinations

**GET /forecast/list**

Example:
```bash
curl http://localhost:8000/forecast/list
```

Response:
```json
{
  "total_combinations": 9,
  "combinations": [
    {"sku_id": "500ml_Cola", "pin_code": "395001"},
    {"sku_id": "1L_Cola", "pin_code": "395001"},
    ...
  ],
  "status": "success"
}
```

### Inventory Endpoints

#### Get Inventory Data

**GET /inventory**

Query Parameters:
- `sku` (required): SKU identifier
- `pin` (required): PIN code

Example:
```bash
curl "http://localhost:8000/inventory?sku=500ml_Cola&pin=395001"
```

Response:
```json
{
  "sku": "500ml_Cola",
  "pin": "395001",
  "baseline_safety_stock": 77.27,
  "context_safety_stock": 27.85,
  "safety_stock_reduction_percent": 63.96,
  "baseline_working_capital": 11350.89,
  "context_working_capital": 10620.99,
  "working_capital_saved": 729.89,
  "working_capital_saved_percent": 6.43,
  "baseline_stockout_rate": 0.0,
  "context_stockout_rate": 0.0,
  "baseline_inventory_turnover": 6.1,
  "context_inventory_turnover": 6.51,
  "inventory_turnover_improvement_percent": 6.75,
  "status": "success"
}
```

### Chat Endpoints

#### Ask a Question

**POST /chat/ask**

Request Body:
```json
{
  "session_id": "optional-session-id",
  "sku": "500ml_Cola",
  "pin": "395001",
  "question": "What is the forecast improvement?"
}
```

Example:
```bash
curl -X POST "http://localhost:8000/chat/ask" \
  -H "Content-Type: application/json" \
  -d '{
    "sku": "500ml_Cola",
    "pin": "395001",
    "question": "What is the forecast improvement?"
  }'
```

Response:
```json
{
  "session_id": "abc-123-def",
  "sku": "500ml_Cola",
  "pin": "395001",
  "question": "What is the forecast improvement?",
  "answer": "The forecast accuracy improved by 61.73%...",
  "status": "success",
  "is_new_session": true,
  "conversation_length": 2
}
```

#### Create a Session

**POST /chat/session/create**

Query Parameters:
- `sku` (required): SKU identifier
- `pin` (required): PIN code

Example:
```bash
curl -X POST "http://localhost:8000/chat/session/create?sku=500ml_Cola&pin=395001"
```

Response:
```json
{
  "session_id": "abc-123-def",
  "sku": "500ml_Cola",
  "pin": "395001",
  "status": "success",
  "message": "Session created successfully"
}
```

### Summary Endpoint

**GET /summary**

Get aggregated metrics across all SKU × PIN combinations.

Example:
```bash
curl http://localhost:8000/summary
```

Response:
```json
{
  "model_summary": {
    "total_combinations": 9,
    "average_baseline_mape": 11.37,
    "average_context_mape": 3.68,
    "average_mape_improvement": 66.39,
    ...
  },
  "inventory_summary": {
    "total_combinations": 9,
    "average_safety_stock_reduction": 64.1,
    "total_working_capital_saved": 4792.23,
    ...
  },
  "impact_projection": {
    ...
  },
  "status": "success"
}
```

## Testing the API

### Automated Test Suite

Run the test suite:
```bash
python test_api.py
```

This will test all endpoints and verify functionality.

### Manual Testing

1. Start the server:
   ```bash
   uvicorn api.server:app --reload
   ```

2. Open browser to http://localhost:8000/docs

3. Try the interactive API documentation

### Using curl

```bash
# Health check
curl http://localhost:8000/

# Get forecast
curl "http://localhost:8000/forecast?sku=500ml_Cola&pin=395001"

# Get inventory
curl "http://localhost:8000/inventory?sku=500ml_Cola&pin=395001"

# Ask a question
curl -X POST "http://localhost:8000/chat/ask" \
  -H "Content-Type: application/json" \
  -d '{"sku": "500ml_Cola", "pin": "395001", "question": "What is the financial impact?"}'
```

## Project Structure

```
api/
├── server.py           # FastAPI application
├── schemas.py          # Pydantic models for request/response
├── routes/
│   ├── forecast.py     # Forecast endpoints
│   ├── inventory.py    # Inventory endpoints
│   └── chat.py         # Chat endpoints
└── utils/
    └── loaders.py      # Data loading utilities
```

## Error Handling

The API returns standard HTTP status codes:

- `200 OK`: Successful request
- `400 Bad Request`: Invalid request parameters
- `404 Not Found`: Resource not found (e.g., SKU × PIN combination doesn't exist)
- `500 Internal Server Error`: Server error

Error Response Format:
```json
{
  "detail": "Error message here"
}
```

## CORS Configuration

CORS is enabled for all origins in development. For production, update the `allow_origins` in `server.py`:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://yourdomain.com"],  # Specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## Integration with Dashboard

The API is designed to be consumed by a frontend dashboard:

### Forecast Visualization
```javascript
fetch('http://localhost:8000/forecast?sku=500ml_Cola&pin=395001')
  .then(response => response.json())
  .then(data => {
    // Display forecast metrics
    console.log('MAPE Improvement:', data.mape_improvement_percent);
  });
```

### Inventory Charts
```javascript
fetch('http://localhost:8000/inventory?sku=500ml_Cola&pin=395001')
  .then(response => response.json())
  .then(data => {
    // Display inventory metrics
    console.log('Working Capital Saved:', data.working_capital_saved);
  });
```

### Conversational AI
```javascript
fetch('http://localhost:8000/chat/ask', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({
    sku: '500ml_Cola',
    pin: '395001',
    question: 'What is the forecast improvement?'
  })
})
  .then(response => response.json())
  .then(data => {
    // Display AI response
    console.log('Answer:', data.answer);
  });
```

## Production Deployment

### Using Gunicorn

```bash
pip install gunicorn
gunicorn api.server:app -w 4 -k uvicorn.workers.UvicornWorker
```

### Using Docker

Create `Dockerfile`:
```dockerfile
FROM python:3.9

WORKDIR /app

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

CMD ["uvicorn", "api.server:app", "--host", "0.0.0.0", "--port", "8000"]
```

Build and run:
```bash
docker build -t micropulse-api .
docker run -p 8000:8000 micropulse-api
```

## Troubleshooting

### Server won't start
- Check if port 8000 is already in use
- Verify all dependencies are installed: `pip install fastapi uvicorn pydantic`

### 404 errors for SKU × PIN
- Verify the combination exists: `GET /forecast/list`
- Check that forecast and inventory simulations have been run

### Chat endpoint errors
- Ensure AWS credentials are configured for Bedrock
- Check that `core/stateful_sku_chat.py` is working correctly

### Data not loading
- Verify that `reports/` directory exists with JSON files:
  - `all_model_results.json`
  - `inventory_results.json`
  - `model_summary.json`
  - `inventory_summary.json`
  - `impact_projection.json`

## Next Steps

1. **Frontend Dashboard**: Build a React/Vue dashboard to visualize the data
2. **Authentication**: Add API key or JWT authentication
3. **Rate Limiting**: Implement rate limiting for production
4. **Caching**: Add Redis caching for frequently accessed data
5. **Monitoring**: Add logging and monitoring (e.g., Prometheus, Grafana)

## Support

For issues or questions:
- Check the API documentation at `/docs`
- Run the test suite: `python test_api.py`
- Review the error messages in the API response

---

**Version**: 1.0.0  
**Status**: Production Ready  
**License**: MIT
