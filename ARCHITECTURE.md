# MicroPulse System Architecture

## Overview

MicroPulse is a full-stack AI-powered retail intelligence platform designed for hyperlocal demand forecasting and inventory optimization.

## System Components

### 1. Frontend Layer (Next.js + React)

**Technology**: Next.js 14, TypeScript, Tailwind CSS, Chart.js

**Components**:
- **Dashboard Page** (`pages/index.tsx`): Main interface
- **Visualization Components**: Charts, heatmaps, KPI cards
- **AI Chat Interface**: Conversational insights
- **API Service Layer**: HTTP client for backend communication

**Features**:
- Server-side rendering (SSR)
- Responsive design
- Real-time data updates
- Interactive visualizations
- Scenario simulation UI

**Data Flow**:
```
User Interaction → React State → API Service → Backend API
                                              ↓
Backend Response → State Update → Component Re-render → UI Update
```

### 2. API Layer (FastAPI)

**Technology**: FastAPI, Pydantic, Uvicorn

**Endpoints**:
- `/forecast`: Get forecast data for SKU × PIN
- `/forecast/list`: List available combinations
- `/forecast/heatmap`: Get hyperlocal heatmap data
- `/inventory`: Get inventory optimization results
- `/chat/ask`: AI conversational interface
- `/health`: Health check endpoint

**Features**:
- RESTful API design
- Automatic OpenAPI documentation
- Request/response validation
- CORS middleware for frontend access
- Error handling and logging

**Data Flow**:
```
HTTP Request → Route Handler → Data Loader → JSON Response
                    ↓
            Business Logic (if needed)
                    ↓
            Helper Functions
```

### 3. Forecast Engine (Prophet)

**Technology**: Facebook Prophet, Pandas, NumPy

**Core Logic** (`core/forecasting.py`):
- Time series decomposition
- Trend and seasonality modeling
- Context signal integration (temperature, weekends, events)
- Uncertainty quantification

**Process**:
1. Load historical sales data
2. Add contextual regressors (temperature, weekend, event)
3. Train Prophet model
4. Generate forecasts with confidence intervals
5. Calculate MAPE and sigma metrics
6. Compare baseline vs context-aware performance

**Key Metrics**:
- **MAPE** (Mean Absolute Percentage Error): Forecast accuracy
- **Sigma**: Forecast uncertainty/variability
- **Improvement %**: Context-aware vs baseline

### 4. Inventory Simulation Engine

**Technology**: Python, NumPy, Statistical Methods

**Core Logic** (`core/inventory_simulation.py`):
- Safety stock calculation using forecast uncertainty
- Service level optimization (95% target)
- Working capital analysis
- Inventory turnover calculation
- Stockout rate simulation

**Formula**:
```
Safety Stock = Z-score × Sigma × √Lead Time
Working Capital = Safety Stock × Unit Cost
Inventory Turnover = Demand / Average Inventory
```

**Process**:
1. Load forecast results (baseline and context-aware)
2. Calculate safety stock for both scenarios
3. Simulate inventory levels over time
4. Measure stockout rates
5. Calculate financial impact
6. Generate optimization recommendations

### 5. Financial Impact Engine

**Technology**: Python, Pandas

**Calculations**:
- **Working Capital Saved**: Difference in inventory investment
- **Capital Efficiency**: Percentage improvement
- **Revenue Recovery Potential**: 3x multiplier on saved capital
- **ROI**: Return on investment from optimization

**Metrics**:
```
Working Capital Saved = Baseline WC - Context WC
Capital Efficiency = (Saved / Baseline) × 100%
Revenue Recovery = Saved × 3
```

### 6. AI Insights Engine (Amazon Bedrock)

**Technology**: AWS Bedrock, Boto3, Claude Model

**Core Logic** (`core/stateful_sku_chat.py`):
- Session management for conversations
- Context construction from forecast/inventory data
- Natural language query processing
- Insight generation and explanation

**Process**:
1. Receive user question
2. Load relevant forecast and inventory data
3. Construct context block with metrics
4. Send to Bedrock with conversation history
5. Parse AI response
6. Return insights to user

**Context Includes**:
- Forecast improvement metrics
- Inventory optimization results
- Financial impact data
- Market context (location, lead time)
- Scenario effects (if applicable)

## Data Flow Architecture

### End-to-End Request Flow

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │ HTTP Request
       ▼
┌─────────────────┐
│  Next.js Page   │
└──────┬──────────┘
       │ API Call (Axios)
       ▼
┌─────────────────┐
│  FastAPI Route  │
└──────┬──────────┘
       │ Load Data
       ▼
┌─────────────────┐
│  Data Loader    │ ← Reads JSON files
└──────┬──────────┘
       │ Return Data
       ▼
┌─────────────────┐
│ Helper Functions│ ← Apply scenario, generate recommendations
└──────┬──────────┘
       │ Enhanced Data
       ▼
┌─────────────────┐
│  JSON Response  │
└──────┬──────────┘
       │ HTTP Response
       ▼
┌─────────────────┐
│  React State    │
└──────┬──────────┘
       │ Re-render
       ▼
┌─────────────────┐
│   UI Update     │
└─────────────────┘
```

### AI Chat Flow

```
User Question
     ↓
Frontend (AIChat.tsx)
     ↓
POST /chat/ask
     ↓
Chat Route Handler
     ↓
Load Forecast & Inventory Data
     ↓
Construct Context Block
     ↓
AWS Bedrock API (Claude)
     ↓
AI Generated Response
     ↓
Parse & Format
     ↓
JSON Response
     ↓
Frontend Display
```

## Data Storage

### JSON Reports

**Location**: `/reports` directory

**Files**:
- `all_model_results.json`: All forecast results
- `inventory_results.json`: All inventory simulations
- `model_summary.json`: Aggregate forecast metrics
- `inventory_summary.json`: Aggregate inventory metrics
- `impact_projection.json`: Financial projections

**Structure**:
```json
{
  "sku_id": "500ml_Cola",
  "pin_code": "395001",
  "baseline_mape": 15.2,
  "context_mape": 5.8,
  "mape_improvement_percent": 61.7,
  "baseline_sigma": 45.3,
  "context_sigma": 16.7,
  "sigma_reduction_percent": 63.2
}
```

### CSV Data Files

**Location**: `/data` directory

**Files**:
- `daily_sales.csv`: Historical sales data
- `sales_sku_pin.csv`: SKU × PIN sales data
- `sales_multi_sku_pin.csv`: Multi-product data

**Schema**:
```
date, sku_id, pin_code, sales, temperature, is_weekend, event
```

## Scalability Considerations

### Current Architecture
- **Single Server**: API and forecasting on one machine
- **File-Based Storage**: JSON reports for results
- **Synchronous Processing**: Real-time forecast generation

### Production Scaling

**Horizontal Scaling**:
- Load balancer for API servers
- Distributed forecast processing
- Caching layer (Redis)
- CDN for frontend assets

**Data Layer**:
- PostgreSQL for transactional data
- S3 for large datasets
- DynamoDB for session management
- ElastiCache for caching

**Compute**:
- AWS Lambda for serverless API
- ECS/EKS for containerized deployment
- SageMaker for model training
- Batch processing for forecasts

## Security

### Current Implementation
- CORS middleware for API access
- Environment variables for secrets
- Input validation with Pydantic
- Error handling without data leakage

### Production Security
- API authentication (JWT tokens)
- Rate limiting
- HTTPS/TLS encryption
- AWS IAM roles for Bedrock access
- Secrets Manager for credentials
- VPC for network isolation

## Monitoring & Observability

### Recommended Tools
- **Logging**: CloudWatch, ELK Stack
- **Metrics**: Prometheus, Grafana
- **Tracing**: AWS X-Ray, Jaeger
- **Alerts**: PagerDuty, SNS

### Key Metrics to Monitor
- API response times
- Forecast accuracy (MAPE)
- Error rates
- User engagement
- System resource usage

## Deployment Options

### Option 1: Traditional Server
- Deploy on EC2 or VPS
- Nginx reverse proxy
- PM2 for process management
- PostgreSQL database

### Option 2: Serverless (AWS)
- Lambda for API
- S3 for static frontend
- CloudFront CDN
- DynamoDB for data
- Bedrock for AI

### Option 3: Containerized (Docker)
- Docker Compose for local
- ECS/EKS for production
- RDS for database
- ElastiCache for caching

### Option 4: Platform-as-a-Service
- Vercel for frontend
- Railway/Render for backend
- Managed PostgreSQL
- Managed Redis

## Technology Choices

### Why FastAPI?
- High performance (async support)
- Automatic API documentation
- Type safety with Pydantic
- Easy to learn and use
- Great for ML/AI applications

### Why Next.js?
- Server-side rendering
- Excellent developer experience
- Built-in routing
- Optimized production builds
- Large ecosystem

### Why Prophet?
- Designed for business forecasting
- Handles seasonality well
- Robust to missing data
- Easy to add regressors
- Interpretable results

### Why Amazon Bedrock?
- Managed AI service
- No infrastructure management
- Multiple model options
- Pay-per-use pricing
- Enterprise-grade security

## Performance Optimization

### Backend
- Caching forecast results
- Async I/O for file operations
- Connection pooling
- Query optimization
- Batch processing

### Frontend
- Code splitting
- Image optimization
- Lazy loading
- Memoization
- Service workers

### Database
- Indexing
- Query optimization
- Connection pooling
- Read replicas
- Caching layer

## Future Architecture Evolution

### Phase 1: Current (MVP)
- Single server deployment
- File-based storage
- Manual data updates
- Basic monitoring

### Phase 2: Production Ready
- Load balanced API
- Database backend
- Automated data pipelines
- Comprehensive monitoring
- CI/CD deployment

### Phase 3: Enterprise Scale
- Microservices architecture
- Event-driven processing
- Real-time data streaming
- Multi-region deployment
- Advanced analytics

### Phase 4: AI-Native Platform
- AutoML for model selection
- Reinforcement learning for optimization
- Real-time demand sensing
- Predictive maintenance
- Autonomous decision-making

---

**Document Version**: 1.0
**Last Updated**: March 8, 2026
**Maintained By**: MicroPulse Development Team
