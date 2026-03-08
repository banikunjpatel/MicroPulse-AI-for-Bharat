# MicroPulse — AI-Powered Hyperlocal Demand Intelligence

> Transforming retail inventory management through hyperlocal demand forecasting and AI-driven insights

## Problem Statement

Traditional retail forecasting operates at city or regional levels, missing critical hyperlocal demand patterns. This leads to:
- **64% excess safety stock** due to forecast uncertainty
- **₹730+ working capital** locked per SKU per PIN code
- **Stockouts during demand spikes** (festivals, weather events)
- **Poor inventory turnover** and capital inefficiency

## Solution Overview

MicroPulse is an AI-powered demand intelligence engine that:

1. **Forecasts at SKU × PIN granularity** - Predicts demand for specific products in specific postal codes
2. **Incorporates contextual signals** - Weather, festivals, weekends, holidays
3. **Optimizes inventory** - Reduces safety stock while maintaining service levels
4. **Quantifies business impact** - Converts forecast improvements into financial metrics
5. **Provides AI insights** - Conversational interface powered by Amazon Bedrock

### Key Results

- **61.7% forecast improvement** (MAPE reduction)
- **64% safety stock reduction**
- **₹730 working capital saved** per SKU per PIN
- **3x revenue recovery potential** from freed capital

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    User Dashboard (Next.js)                  │
│  • Forecast Visualization  • Inventory Impact  • AI Chat    │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│                  FastAPI Backend (Python)                    │
│  • Forecast API  • Inventory API  • Chat API  • S3 Loader  │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│                    Core AI Engines                           │
│  • Prophet Forecasting  • Inventory Simulation              │
│  • Context-Aware Models  • Bedrock AI Assistant             │
└─────────────────────────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│                    Data Layer (AWS S3)                       │
│  • Sales Data  • Forecast Results  • Inventory Reports      │
└─────────────────────────────────────────────────────────────┘
```

## Tech Stack

### Backend
- **Python 3.9+** - Core language
- **FastAPI** - REST API framework
- **Prophet** - Time series forecasting
- **pandas/numpy** - Data processing
- **boto3** - AWS S3 integration

### Frontend
- **Next.js 14** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Chart.js** - Visualizations

### AI/ML
- **Amazon Bedrock** - Conversational AI (Nova Lite)
- **Prophet** - Demand forecasting
- **Context-aware models** - Signal integration

### Cloud (AWS)
- **S3** - Data lake
- **Lambda** - Serverless compute
- **API Gateway** - API management
- **Amplify** - Frontend hosting
- **Bedrock** - AI services

## Quick Start

### Prerequisites

```bash
# Python 3.9+
python --version

# Node.js 18+
node --version

# AWS CLI (optional, for S3)
aws --version
```

### 1. Clone Repository

```bash
git clone https://github.com/banikunjpatel/MicroPulse-AI-for-Bharat.git
cd MicroPulse-AI-for-Bharat
```

### 2. Setup Backend

```bash
# Install Python dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your AWS credentials

# Run forecasting
python core/batch_forecasting.py

# Run inventory simulation
python batch_inventory_simulation.py

# Start API server
python run_api.py
```

API will be available at: `http://localhost:8000`
API docs at: `http://localhost:8000/docs`

### 3. Setup Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Dashboard will be available at: `http://localhost:3000`

### 4. Test AI Chat

```bash
# Test SKU chat engine
python test_sku_chat_engine.py

# Test stateful chat
python test_stateful_sku_chat.py
```

## Project Structure

```
MicroPulse/
├── api/                      # FastAPI backend
│   ├── routes/              # API endpoints
│   ├── utils/               # S3 loader, helpers
│   ├── schemas.py           # Pydantic models
│   └── server.py            # FastAPI app
├── core/                     # Core AI engines
│   ├── batch_forecasting.py # Batch forecasting
│   ├── forecasting.py       # Prophet models
│   ├── inventory_simulation.py
│   ├── sku_chat_engine.py   # AI chat
│   └── stateful_sku_chat.py # Stateful chat
├── frontend/                 # Next.js dashboard
│   ├── components/          # React components
│   ├── pages/               # Next.js pages
│   ├── services/            # API client
│   └── styles/              # CSS
├── data/                     # Datasets
│   ├── daily_sales.csv
│   ├── sales_sku_pin.csv
│   └── sales_multi_sku_pin.csv
├── reports/                  # Generated reports
│   ├── all_model_results.json
│   └── inventory_results.json
├── deployment/               # AWS deployment
│   └── terraform/           # Infrastructure as code
├── batch_inventory_simulation.py
├── config.py                # Configuration
├── requirements.txt         # Python dependencies
├── run_api.py              # API startup script
└── README.md
```

## AWS Deployment

### Architecture

```
┌──────────────┐
│   Route 53   │  DNS
└──────┬───────┘
       │
┌──────▼───────┐
│  CloudFront  │  CDN
└──────┬───────┘
       │
┌──────▼───────┐     ┌──────────────┐
│   Amplify    │────▶│  Next.js App │
└──────────────┘     └──────────────┘
       │
┌──────▼───────┐     ┌──────────────┐
│ API Gateway  │────▶│    Lambda    │
└──────────────┘     └──────┬───────┘
                            │
                     ┌──────▼───────┐
                     │      S3      │
                     └──────┬───────┘
                            │
                     ┌──────▼───────┐
                     │   Bedrock    │
                     └──────────────┘
```

### Deployment Steps

1. **Create S3 Bucket**
```bash
aws s3 mb s3://micropulse-retail-ai-data --region ap-south-1
aws s3 sync reports/ s3://micropulse-retail-ai-data/reports/
aws s3 sync data/ s3://micropulse-retail-ai-data/datasets/
```

2. **Deploy Backend (Lambda)**
```bash
cd deployment/terraform
terraform init
terraform plan
terraform apply
```

3. **Deploy Frontend (Amplify)**
```bash
cd frontend
npm run build
# Connect GitHub repo to AWS Amplify
# Amplify will auto-deploy on push
```

4. **Configure Environment**
```bash
# Lambda environment variables
S3_BUCKET_NAME=micropulse-retail-ai-data
AWS_REGION=ap-south-1
BEDROCK_MODEL_ID=amazon.nova-lite-v1:0
```

## API Endpoints

### Forecast API

```bash
# Get forecast for SKU × PIN
GET /forecast?sku=500ml_Cola&pin=395001

# Get forecast with scenario
GET /forecast?sku=500ml_Cola&pin=395001&scenario=festival

# Get hyperlocal heatmap
GET /forecast/heatmap?sku=500ml_Cola

# List all combinations
GET /forecast/list
```

### Inventory API

```bash
# Get inventory optimization
GET /inventory?sku=500ml_Cola&pin=395001
```

### Chat API

```bash
# Ask AI assistant
POST /chat/ask
{
  "question": "What's the forecast improvement for 500ml Cola in Surat?",
  "session_id": "user123"
}
```

## Demo Instructions

### 1. Run Complete Pipeline

```bash
# Step 1: Generate forecasts
python core/batch_forecasting.py
# Output: reports/all_model_results.json

# Step 2: Run inventory simulation
python batch_inventory_simulation.py
# Output: reports/inventory_results.json

# Step 3: Start API
python run_api.py
# API: http://localhost:8000

# Step 4: Start dashboard
cd frontend && npm run dev
# Dashboard: http://localhost:3000
```

### 2. Test AI Chat

```bash
# Test chat engine
python test_sku_chat_engine.py

# Example questions:
# - "What's the forecast improvement for 500ml Cola?"
# - "How much working capital can we save?"
# - "Which PIN codes have high demand?"
```

### 3. Explore Dashboard

1. Open `http://localhost:3000`
2. View forecast improvements
3. Check inventory impact
4. Try scenario simulations (Heatwave, Festival, IPL Weekend)
5. Chat with AI assistant

## Key Features

### 1. Hyperlocal Forecasting
- SKU × PIN level predictions
- Context-aware signals (weather, events)
- 61.7% MAPE improvement

### 2. Inventory Optimization
- Safety stock reduction (64%)
- Service level maintenance (90%)
- Working capital savings (₹730/SKU/PIN)

### 3. Scenario Simulation
- Heatwave (+15% demand)
- Festival (+20% demand)
- IPL Weekend (+18% demand)
- Promotion (+25% demand)

### 4. AI-Powered Insights
- Conversational interface
- Context-aware responses
- Business impact quantification

### 5. Real-time Dashboard
- Forecast visualization
- Inventory impact charts
- Financial metrics
- Demand heatmaps

## Business Impact

### Per SKU × PIN
- **Forecast Improvement**: 61.7%
- **Safety Stock Reduction**: 64%
- **Working Capital Saved**: ₹730
- **Revenue Recovery Potential**: ₹2,190 (3x)

### Scaled Impact (100 SKUs × 10 PINs)
- **Total Working Capital Saved**: ₹7.3 Lakhs
- **Revenue Recovery Potential**: ₹21.9 Lakhs
- **Inventory Turnover**: 7.4% improvement

## Contributing

This project was developed for the AI for Bharat Hackathon. Contributions are welcome!

## License

MIT License - See LICENSE file for details

## Contact

**Banikunj Patel**
- GitHub: [@banikunjpatel](https://github.com/banikunjpatel)
- Project: [MicroPulse-AI-for-Bharat](https://github.com/banikunjpatel/MicroPulse-AI-for-Bharat)

## Acknowledgments

- **AI for Bharat Hackathon** - For the opportunity
- **Amazon Bedrock** - For AI capabilities
- **Prophet** - For time series forecasting
- **FastAPI & Next.js** - For excellent frameworks

---

**Built with ❤️ for Indian Retail**
