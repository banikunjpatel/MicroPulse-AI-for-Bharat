# Technical Design Document: MicroPulse

## Document Information

**Version**: 1.0  
**Last Updated**: February 12, 2026  
**Document Owner**: Engineering Team  
**Status**: Draft for Review

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Architecture Design](#2-architecture-design)
3. [Data Pipeline](#3-data-pipeline)
4. [AI/ML Model Design](#4-aiml-model-design)
5. [Signal Processing](#5-signal-processing)
6. [Recommendation Engine](#6-recommendation-engine)
7. [API Design](#7-api-design)
8. [Infrastructure & Deployment](#8-infrastructure--deployment)
9. [Security Architecture](#9-security-architecture)
10. [Scalability & Performance](#10-scalability--performance)
11. [Monitoring & Observability](#11-monitoring--observability)
12. [Future Extensibility](#12-future-extensibility)

---

## 1. System Overview

### 1.1 Purpose

MicroPulse is an AI-powered hyperlocal demand forecasting platform that predicts SKU-level demand at PIN-code granularity for Indian retail. The system integrates multiple signals (weather, festivals, historical sales) to generate accurate demand forecasts.

### 1.2 Key Technical Goals

- Process 10M+ transactions daily with <5 min forecast generation time
- Achieve 85%+ forecast accuracy (MAPE ≤15%)
- Support 100K+ SKUs across 10K+ PIN codes
- Maintain 99.5% uptime with <500ms API response time
- Scale horizontally to handle growing data volumes

### 1.3 Technology Stack

**Backend Services**
- Python 3.11+ (FastAPI for APIs, Pandas/Polars for data processing)
- Node.js 20+ (Real-time services, WebSocket connections)

**ML/AI Framework**
- PyTorch 2.0+ / TensorFlow 2.15+ (Deep learning models)
- scikit-learn 1.4+ (Classical ML algorithms)
- Prophet / NeuralProphet (Time series forecasting)
- XGBoost / LightGBM (Gradient boosting models)

**Data Storage**
- PostgreSQL 16+ with TimescaleDB (Time series data, transactional data)
- Redis 7+ (Caching, session management)
- Amazon S3 (Data lake, model artifacts, backups)
- Apache Parquet (Columnar storage format)

**Message Queue & Streaming**
- Apache Kafka / Amazon MSK (Event streaming)
- Amazon SQS (Task queuing)
- Celery (Distributed task processing)

**Frontend**
- React 18+ with TypeScript
- Next.js 14+ (SSR/SSG)
- TailwindCSS (Styling)
- Recharts / D3.js (Data visualization)

**Infrastructure**
- AWS Cloud (Primary hosting)
- Docker & Kubernetes (Containerization & orchestration)
- Terraform (Infrastructure as Code)
- GitHub Actions (CI/CD)

---

## 2. Architecture Design

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client Layer                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ Web Dashboard│  │  Mobile App  │  │  API Clients │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API Gateway Layer                           │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  AWS API Gateway / Application Load Balancer             │  │
│  │  (Authentication, Rate Limiting, Request Routing)        │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Application Services Layer                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  Forecast    │  │   Data       │  │    User      │          │
│  │  Service     │  │   Ingestion  │  │  Management  │          │
│  │  (FastAPI)   │  │   Service    │  │   Service    │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ Notification │  │  Analytics   │  │   Alert      │          │
│  │   Service    │  │   Service    │  │   Service    │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      ML/AI Processing Layer                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Feature    │  │   Model      │  │  Inference   │          │
│  │  Engineering │  │   Training   │  │   Engine     │          │
│  │   Pipeline   │  │   Pipeline   │  │              │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│  ┌──────────────┐  ┌──────────────┐                            │
│  │   Signal     │  │   Model      │                            │
│  │  Processor   │  │   Registry   │                            │
│  └──────────────┘  └──────────────┘                            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Data Layer                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  PostgreSQL  │  │    Redis     │  │   S3 Data    │          │
│  │ (TimescaleDB)│  │   (Cache)    │  │     Lake     │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│  ┌──────────────┐  ┌──────────────┐                            │
│  │    Kafka     │  │   Feature    │                            │
│  │   (Events)   │  │    Store     │                            │
│  └──────────────┘  └──────────────┘                            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    External Data Sources                         │
│  ┌────────────
──┐  ┌──────────────┐  ┌──────────────┐          │
│  │  Weather API │  │  Festival    │  │  Retailer    │          │
│  │  (IMD/Accuw.)│  │   Calendar   │  │  ERP/POS     │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Microservices Architecture

#### 2.2.1 Forecast Service
**Responsibility**: Generate and serve demand forecasts

**Key Components**:
- Forecast API endpoints (REST & GraphQL)
- Batch forecast generation
- Real-time forecast updates
- Confidence interval calculation

**Technology**: Python FastAPI, Celery workers

#### 2.2.2 Data Ingestion Service
**Responsibility**: Ingest, validate, and process external data

**Key Components**:
- Sales data ingestion (batch & streaming)
- Weather data fetcher
- Festival calendar manager
- Data validation & cleansing

**Technology**: Python, Apache Kafka, AWS Lambda

#### 2.2.3 ML Training Service
**Responsibility**: Train, evaluate, and deploy ML models

**Key Components**:
- Automated model training pipeline
- Hyperparameter optimization
- Model evaluation & validation
- Model versioning & registry

**Technology**: Python, MLflow, Kubeflow, SageMaker

#### 2.2.4 Signal Processing Service
**Responsibility**: Process and enrich signals for forecasting

**Key Components**:
- Weather signal processor
- Festival impact analyzer
- Seasonality detector
- Trend analyzer

**Technology**: Python, Pandas, NumPy

#### 2.2.5 Analytics Service
**Responsibility**: Generate insights and performance metrics

**Key Components**:
- Forecast accuracy calculator
- Demand pattern analyzer
- Anomaly detector
- Report generator

**Technology**: Python, Apache Spark (for large-scale analytics)

### 2.3 Communication Patterns

**Synchronous Communication**:
- REST APIs for client-service communication
- gRPC for inter-service communication (low latency)

**Asynchronous Communication**:
- Kafka for event streaming (sales events, forecast updates)
- SQS for task queuing (batch jobs, notifications)
- WebSocket for real-time dashboard updates

---

## 3. Data Pipeline

### 3.1 Data Ingestion Pipeline

```
External Sources → Ingestion Layer → Validation → Transformation → Storage
```

#### 3.1.1 Sales Data Ingestion

**Batch Ingestion**:
```python
# Pseudo-code for batch ingestion
def ingest_sales_batch(file_path):
    # 1. Read data (CSV/Excel/Parquet)
    df = read_data(file_path)
    
    # 2. Validate schema
    validate_schema(df, expected_columns=[
        'transaction_id', 'sku_id', 'quantity', 
        'timestamp', 'store_id', 'pin_code', 'price'
    ])
    
    # 3. Data quality checks
    check_missing_values(df)
    check_outliers(df, columns=['quantity', 'price'])
    check_date_range(df)
    
    # 4. Enrich data
    df = add_derived_features(df)  # day_of_week, month, etc.
    
    # 5. Write to data lake (S3) and database
    write_to_s3(df, partition_by=['date', 'pin_code'])
    write_to_timescaledb(df)
    
    # 6. Publish event
    publish_event('sales_data_ingested', metadata)
```

**Streaming Ingestion**:
```python
# Kafka consumer for real-time sales
def consume_sales_stream():
    consumer = KafkaConsumer('sales-events')
    
    for message in consumer:
        sales_record = parse_message(message)
        
        # Validate and enrich
        if validate_record(sales_record):
            enriched = enrich_record(sales_record)
            
            # Write to hot storage (Redis) and warm storage (TimescaleDB)
            cache_in_redis(enriched, ttl=3600)
            write_to_timescaledb(enriched)
            
            # Trigger real-time forecast update if needed
            if should_update_forecast(enriched):
                trigger_forecast_update(enriched['sku_id'], enriched['pin_code'])
```

#### 3.1.2 Weather Data Pipeline

**Data Flow**:
1. Scheduled job fetches weather data every 6 hours
2. Data normalized to standard format
3. Stored with PIN code mapping
4. Historical data archived to S3

**Schema**:
```json
{
  "pin_code": "560001",
  "timestamp": "2026-02-12T10:00:00Z",
  "temperature": 28.5,
  "humidity": 65,
  "rainfall": 0,
  "weather_condition": "partly_cloudy",
  "forecast_7day": [...]
}
```

#### 3.1.3 Festival Calendar Pipeline

**Data Structure**:
```python
festivals = {
    "diwali_2026": {
        "date": "2026-10-20",
        "type": "national",
        "regions": ["all"],
        "impact_window": {"pre": 14, "post": 3},
        "affected_categories": ["sweets", "gifts", "clothing"]
    },
    "pongal_2026": {
        "date": "2026-01-14",
        "type": "regional",
        "regions": ["TN", "AP", "KA"],
        "impact_window": {"pre": 7, "post": 2},
        "affected_categories": ["groceries", "traditional_wear"]
    }
}
```

### 3.2 Feature Engineering Pipeline

**Feature Categories**:

1. **Temporal Features**:
   - day_of_week, day_of_month, week_of_year
   - is_weekend, is_month_start, is_month_end
   - days_to_next_festival, days_since_last_festival

2. **Lag Features**:
   - sales_lag_1d, sales_lag_7d, sales_lag_14d, sales_lag_30d
   - rolling_mean_7d, rolling_mean_30d
   - rolling_std_7d, rolling_std_30d

3. **Weather Features**:
   - temperature_current, temperature_forecast_7d
   - rainfall_current, rainfall_forecast_7d
   - humidity_current
   - weather_condition_encoded

4. **Festival Features**:
   - is_festival_day, is_pre_festival_period, is_post_festival_period
   - festival_impact_score (0-1)
   - festival_type_encoded

5. **SKU Features**:
   - category, sub_category, brand
   - price_point, margin
   - shelf_life, perishability_score

6. **Location Features**:
   - pin_code, city, state, region
   - urban_rural_classification
   - population_density, income_level

**Feature Store Implementation**:
```python
# Using Feast or custom feature store
from feast import FeatureStore

store = FeatureStore(repo_path=".")

# Define feature views
@feature_view(
    entities=["sku", "pin_code"],
    ttl=timedelta(days=30),
)
def sales_features(df):
    return df[['sales_lag_7d', 'rolling_mean_30d', 'rolling_std_7d']]

# Retrieve features for training
features = store.get_historical_features(
    entity_df=entity_df,
    features=[
        "sales_features:sales_lag_7d",
        "sales_features:rolling_mean_30d",
        "weather_features:temperature_current"
    ]
)
```

### 3.3 Data Storage Strategy

**Hot Storage (Redis)**:
- Recent forecasts (last 7 days)
- Real-time sales data (last 24 hours)
- User sessions and cache
- TTL: 1-7 days

**Warm Storage (TimescaleDB)**:
- Historical sales data (2+ years)
- Generated forecasts (all horizons)
- Model performance metrics
- Retention: 3 years

**Cold Storage (S3)**:
- Raw data archives
- Model artifacts and checkpoints
- Backup data
- Retention: Indefinite with lifecycle policies

---

## 4. AI/ML Model Design

### 4.1 Model Selection Strategy

**Multi-Model Ensemble Approach**:

MicroPulse uses a hierarchical ensemble approach combining multiple models:

1. **Base Models** (Individual forecasters)
2. **Meta-Model** (Ensemble combiner)
3. **Model Router** (Selects best model per SKU-PIN combination)

#### 4.1.1 Base Models

**Model 1: Prophet/NeuralProphet**
- **Use Case**: Seasonal patterns, trend detection, holiday effects
- **Strengths**: Handles missing data, interpretable, good for business users
- **Best For**: High-volume SKUs with clear seasonality

**Model 2: LightGBM/XGBoost**
- **Use Case**: Complex feature interactions, non-linear relationships
- **Strengths**: Fast training, handles categorical features, feature importance
- **Best For**: Medium-volume SKUs with rich feature sets

**Model 3: LSTM/Temporal Fusion Transformer (TFT)**
- **Use Case**: Long-term dependencies, multi-horizon forecasting
- **Strengths**: Captures complex temporal patterns, attention mechanisms
- **Best For**: High-value SKUs requiring high accuracy

**Model 4: ARIMA/SARIMA**
- **Use Case**: Baseline model, simple time series
- **Strengths**: Fast, interpretable, good for stationary series
- **Best For**: Low-volume SKUs, fallback model

**Model 5: Exponential Smoothing (ETS)**
- **Use Case**: Simple trend and seasonality
- **Strengths**: Fast, robust, minimal data requirements
- **Best For**: New SKUs with limited history

#### 4.1.2 Ensemble Strategy

```python
class ForecastEnsemble:
    def __init__(self):
        self.models = {
            'prophet': ProphetModel(),
            'lightgbm': LightGBMModel(),
            'lstm': LSTMModel(),
            'arima': ARIMAModel(),
            'ets': ETSModel()
        }
        self.meta_model = StackingRegressor()
        self.model_router = ModelRouter()
    
    def predict(self, sku_id, pin_code, horizon):
        # 1. Get predictions from all base models
        predictions = {}
        for name, model in self.models.items():
            predictions[name] = model.predict(sku_id, pin_code, horizon)
        
        # 2. Route to best model or use ensemble
        routing_decision = self.model_router.route(sku_id, pin_code)
        
        if routing_decision['use_single_model']:
            return predictions[routing_decision['best_model']]
        else:
            # 3. Ensemble predictions using meta-model
            return self.meta_model.predict(predictions)
```

### 4.2 Model Training Pipeline

**Training Workflow**:
```
Data Preparation → Feature Engineering → Model Training → 
Validation → Hyperparameter Tuning → Model Registration → Deployment
```

**Training Schedule**:
- **Weekly**: Full retraining for all models
- **Daily**: Incremental updates for fast-adapting models (LightGBM, Prophet)
- **On-Demand**: Triggered by significant data drift or performance degradation

**Training Code Structure**:
```python
def train_forecast_models():
    # 1. Load training data
    train_data = load_training_data(
        start_date='2024-01-01',
        end_date='2026-02-01'
    )
    
    # 2. Feature engineering
    features = engineer_features(train_data)
    
    # 3. Split data (time-based split)
    train_set, val_set, test_set = time_series_split(
        features, 
        train_ratio=0.7, 
        val_ratio=0.15, 
        test_ratio=0.15
    )
    
    # 4. Train models in parallel
    trained_models = {}
    with ThreadPoolExecutor(max_workers=5) as executor:
        futures = {
            executor.submit(train_prophet, train_set): 'prophet',
            executor.submit(train_lightgbm, train_set): 'lightgbm',
            executor.submit(train_lstm, train_set): 'lstm',
            executor.submit(train_arima, train_set): 'arima',
            executor.submit(train_ets, train_set): 'ets'
        }
        
        for future in as_completed(futures):
            model_name = futures[future]
            trained_models[model_name] = future.result()
    
    # 5. Evaluate models
    evaluation_results = {}
    for name, model in trained_models.items():
        metrics = evaluate_model(model, val_set)
        evaluation_results[name] = metrics
        
        # Log to MLflow
        mlflow.log_metrics({
            f'{name}_mape': metrics['mape'],
            f'{name}_rmse': metrics['rmse'],
            f'{name}_mae': metrics['mae']
        })
    
    # 6. Train meta-model (ensemble)
    meta_model = train_meta_model(trained_models, val_set)
    
    # 7. Final evaluation on test set
    final_metrics = evaluate_ensemble(meta_model, test_set)
    
    # 8. Register models if performance meets threshold
    if final_metrics['mape'] <= 15:
        register_models(trained_models, meta_model)
        deploy_models(trained_models, meta_model)
    
    return trained_models, meta_model
```

### 4.3 Model-Specific Configurations

#### 4.3.1 Prophet Configuration
```python
prophet_config = {
    'seasonality_mode': 'multiplicative',
    'yearly_seasonality': True,
    'weekly_seasonality': True,
    'daily_seasonality': False,
    'holidays': festival_calendar,
    'changepoint_prior_scale': 0.05,
    'seasonality_prior_scale': 10.0,
    'holidays_prior_scale': 10.0
}
```

#### 4.3.2 LightGBM Configuration
```python
lightgbm_config = {
    'objective': 'regression',
    'metric': 'mape',
    'boosting_type': 'gbdt',
    'num_leaves': 31,
    'learning_rate': 0.05,
    'feature_fraction': 0.9,
    'bagging_fraction': 0.8,
    'bagging_freq': 5,
    'max_depth': -1,
    'min_data_in_leaf': 20
}
```

#### 4.3.3 LSTM/TFT Configuration
```python
lstm_config = {
    'hidden_size': 128,
    'num_layers': 3,
    'dropout': 0.2,
    'learning_rate': 0.001,
    'batch_size': 64,
    'max_epochs': 100,
    'early_stopping_patience': 10,
    'sequence_length': 30,  # Look back 30 days
    'prediction_length': 30  # Forecast 30 days
}
```

### 4.4 Model Evaluation Metrics

**Primary Metrics**:
- **MAPE** (Mean Absolute Percentage Error): Target ≤15%
- **RMSE** (Root Mean Squared Error): Penalizes large errors
- **MAE** (Mean Absolute Error): Average absolute deviation
- **Bias**: Measures systematic over/under-forecasting (target: ±5%)

**Secondary Metrics**:
- **Coverage**: % of forecasts within confidence intervals
- **Forecast Value Added (FVA)**: Improvement over naive baseline
- **Directional Accuracy**: % of correct trend predictions

**Evaluation Code**:
```python
def evaluate_model(model, test_data):
    predictions = model.predict(test_data)
    actuals = test_data['actual_sales']
    
    mape = np.mean(np.abs((actuals - predictions) / actuals)) * 100
    rmse = np.sqrt(np.mean((actuals - predictions) ** 2))
    mae = np.mean(np.abs(actuals - predictions))
    bias = np.mean((predictions - actuals) / actuals) * 100
    
    # Confidence interval coverage
    lower, upper = model.predict_interval(test_data, confidence=0.95)
    coverage = np.mean((actuals >= lower) & (actuals <= upper)) * 100
    
    return {
        'mape': mape,
        'rmse': rmse,
        'mae': mae,
        'bias': bias,
        'coverage': coverage
    }
```

---

## 5. Signal Processing

### 5.1 Weather Signal Processing

**Weather Impact Modeling**:
```python
class WeatherSignalProcessor:
    def __init__(self):
        self.temperature_thresholds = {
            'cold_beverages': {'min': 25, 'optimal': 35},
            'hot_beverages': {'max': 20, 'optimal': 10},
            'ice_cream': {'min': 28, 'optimal': 38}
        }
    
    def calculate_weather_impact(self, sku_category, weather_data):
        """Calculate weather impact score (0-1)"""
        temperature = weather_data['temperature']
        rainfall = weather_data['rainfall']
        
        # Temperature impact
        if sku_category in self.temperature_thresholds:
            thresholds = self.temperature_thresholds[sku_category]
            temp_impact = self._calculate_temperature_impact(
                temperature, thresholds
            )
        else:
            temp_impact = 0.5  # Neutral
        
        # Rainfall impact
        rain_impact = self._calculate_rainfall_impact(
            sku_category, rainfall
        )
        
        # Combined impact (weighted average)
        weather_impact = 0.7 * temp_impact + 0.3 * rain_impact
        
        return weather_impact
    
    def _calculate_temperature_impact(self, temp, thresholds):
        """Sigmoid function for temperature impact"""
        if 'min' in thresholds:
            # Higher temp = higher demand
            return 1 / (1 + np.exp(-0.2 * (temp - thresholds['optimal'])))
        else:
            # Lower temp = higher demand
            return 1 / (1 + np.exp(0.2 * (temp - thresholds['optimal'])))
```

### 5.2 Festival Signal Processing

**Festival Impact Calculation**:
```python
class FestivalSignalProcessor:
    def __init__(self, festival_calendar):
        self.calendar = festival_calendar
        self.category_multipliers = {
            'diwali': {'sweets': 3.5, 'gifts': 2.8, 'clothing': 2.2},
            'holi': {'colors': 5.0, 'sweets': 2.0, 'beverages': 1.8},
            'eid': {'meat': 3.0, 'sweets': 2.5, 'clothing': 2.0}
        }
    
    def calculate_festival_impact(self, date, sku_category, pin_code):
        """Calculate festival impact score"""
        upcoming_festivals = self._get_upcoming_festivals(date, pin_code)
        
        total_impact = 0
        for festival in upcoming_festivals:
            days_to_festival = (festival['date'] - date).days
            
            # Pre-festival ramp-up
            if 0 <= days_to_festival <= festival['impact_window']['pre']:
                base_multiplier = self.category_multipliers.get(
                    festival['name'], {}
                ).get(sku_category, 1.0)
                
                # Ramp-up curve (exponential growth as festival approaches)
                ramp_factor = 1 - (days_to_festival / festival['impact_window']['pre'])
                impact = base_multiplier * (ramp_factor ** 2)
                total_impact += impact
            
            # Post-festival decline
            elif -festival['impact_window']['post'] <= days_to_festival < 0:
                base_multiplier = self.category_multipliers.get(
                    festival['name'], {}
                ).get(sku_category, 1.0)
                
                # Decay curve
                decay_factor = 1 + (days_to_festival / festival['impact_window']['post'])
                impact = base_multiplier * decay_factor * 0.3  # 30% of peak
                total_impact += impact
        
        return min(total_impact, 5.0)  # Cap at 5x multiplier
```

### 5.3 Seasonality Detection

**Automatic Seasonality Detection**:
```python
from statsmodels.tsa.seasonal import seasonal_decompose

def detect_seasonality(time_series):
    """Detect and extract seasonal patterns"""
    # Decompose time series
    decomposition = seasonal_decompose(
        time_series, 
        model='multiplicative', 
        period=7  # Weekly seasonality
    )
    
    seasonal_component = decomposition.seasonal
    trend_component = decomposition.trend
    residual = decomposition.resid
    
    # Detect multiple seasonalities (weekly, monthly, yearly)
    seasonalities = {
        'weekly': extract_pattern(seasonal_component, period=7),
        'monthly': extract_pattern(seasonal_component, period=30),
        'yearly': extract_pattern(seasonal_component, period=365)
    }
    
    return seasonalities, trend_component
```

---

## 6. Recommendation Engine

### 6.1 Inventory Recommendations

**Recommendation Logic**:
```python
class InventoryRecommendationEngine:
    def __init__(self, safety_stock_multiplier=1.5):
        self.safety_stock_multiplier = safety_stock_multiplier
    
    def generate_recommendations(self, forecast, current_inventory, lead_time):
        """Generate inventory recommendations"""
        recommendations = []
        
        for sku_pin in forecast:
            sku_id = sku_pin['sku_id']
            pin_code = sku_pin['pin_code']
            forecasted_demand = sku_pin['forecast_7d']
            forecast_std = sku_pin['forecast_std']
            
            # Calculate safety stock
            safety_stock = self.safety_stock_multiplier * forecast_std * np.sqrt(lead_time)
            
            # Calculate reorder point
            reorder_point = (forecasted_demand / 7) * lead_time + safety_stock
            
            # Current inventory level
            current_stock = current_inventory.get((sku_id, pin_code), 0)
            
            # Generate recommendation
            if current_stock < reorder_point:
                order_quantity = forecasted_demand + safety_stock - current_stock
                
                recommendations.append({
                    'sku_id': sku_id,
                    'pin_code': pin_code,
                    'action': 'reorder',
                    'current_stock': current_stock,
                    'reorder_point': reorder_point,
                    'recommended_quantity': max(0, order_quantity),
                    'urgency': self._calculate_urgency(current_stock, reorder_point),
                    'reason': self._generate_reason(sku_pin)
                })
            elif current_stock > forecasted_demand * 2:
                recommendations.append({
                    'sku_id': sku_id,
                    'pin_code': pin_code,
                    'action': 'reduce',
                    'current_stock': current_stock,
                    'excess_quantity': current_stock - forecasted_demand,
                    'urgency': 'low',
                    'reason': 'Overstocked - consider redistribution or promotion'
                })
        
        return recommendations
```

### 6.2 Promotional Recommendations

**Promotion Timing Optimizer**:
```python
def recommend_promotions(forecast_data, inventory_data):
    """Recommend promotional strategies"""
    recommendations = []
    
    for item in forecast_data:
        # Identify slow-moving items with excess inventory
        if item['forecast_trend'] == 'declining' and item['inventory_days'] > 30:
            recommendations.append({
                'sku_id': item['sku_id'],
                'strategy': 'discount_promotion',
                'discount_range': '15-25%',
                'timing': 'immediate',
                'expected_impact': 'increase_demand_by_30%'
            })
        
        # Identify pre-festival opportunities
        elif item['festival_impact'] > 2.0 and item['days_to_festival'] <= 14:
            recommendations.append({
                'sku_id': item['sku_id'],
                'strategy': 'bundle_offer',
                'timing': f"{item['days_to_festival']} days before festival",
                'expected_impact': 'increase_demand_by_50%'
            })
    
    return recommendations
```

---

## 7. API Design

### 7.1 REST API Endpoints

**Base URL**: `https://api.micropulse.ai/v1`

#### 7.1.1 Forecast Endpoints

**GET /forecasts**
```http
GET /forecasts?sku_id=SKU123&pin_code=560001&horizon=7
Authorization: Bearer <token>

Response:
{
  "sku_id": "SKU123",
  "pin_code": "560001",
  "forecast_date": "2026-02-12",
  "horizon_days": 7,
  "forecasts": [
    {
      "date": "2026-02-13",
      "predicted_demand": 150,
      "confidence_interval": {"lower": 130, "upper": 170},
      "confidence_level": 0.95
    },
    ...
  ],
  "metadata": {
    "model_used": "ensemble",
    "accuracy_mape": 12.5,
    "last_updated": "2026-02-12T08:00:00Z"
  }
}
```

**POST /forecasts/batch**
```http
POST /forecasts/batch
Authorization: Bearer <token>
Content-Type: application/json

{
  "requests": [
    {"sku_id": "SKU123", "pin_code": "560001", "horizon": 7},
    {"sku_id": "SKU456", "pin_code": "560002", "horizon": 14}
  ]
}

Response:
{
  "forecasts": [...],
  "batch_id": "batch_123",
  "status": "completed"
}
```

#### 7.1.2 Analytics Endpoints

**GET /analytics/accuracy**
```http
GET /analytics/accuracy?start_date=2026-01-01&end_date=2026-02-01
Authorization: Bearer <token>

Response:
{
  "overall_mape": 13.2,
  "by_category": {
    "beverages": {"mape": 11.5, "rmse": 45.2},
    "groceries": {"mape": 14.8, "rmse": 52.1}
  },
  "by_region": {...},
  "trend": "improving"
}
```

#### 7.1.3 Recommendation Endpoints

**GET /recommendations/inventory**
```http
GET /recommendations/inventory?pin_code=560001&urgency=high
Authorization: Bearer <token>

Response:
{
  "recommendations": [
    {
      "sku_id": "SKU123",
      "action": "reorder",
      "quantity": 500,
      "urgency": "high",
      "reason": "Stock below reorder point, festival in 5 days"
    }
  ]
}
```

### 7.2 GraphQL API

**Schema**:
```graphql
type Forecast {
  skuId: ID!
  pinCode: String!
  date: Date!
  predictedDemand: Float!
  confidenceInterval: ConfidenceInterval!
  metadata: ForecastMetadata!
}

type ConfidenceInterval {
  lower: Float!
  upper: Float!
  level: Float!
}

type Query {
  forecast(
    skuId: ID!
    pinCode: String!
    horizon: Int!
  ): [Forecast!]!
  
  forecasts(
    filters: ForecastFilters!
    pagination: Pagination
  ): ForecastConnection!
  
  accuracy(
    dateRange: DateRange!
    groupBy: GroupBy
  ): AccuracyMetrics!
}

type Mutation {
  triggerForecastUpdate(
    skuId: ID!
    pinCode: String!
  ): ForecastJob!
}
```

### 7.3 WebSocket API

**Real-time Forecast Updates**:
```javascript
// Client connection
const ws = new WebSocket('wss://api.micropulse.ai/v1/ws');

// Subscribe to forecast updates
ws.send(JSON.stringify({
  action: 'subscribe',
  channel: 'forecasts',
  filters: {
    pin_codes: ['560001', '560002'],
    sku_ids: ['SKU123']
  }
}));

// Receive updates
ws.onmessage = (event) => {
  const update = JSON.parse(event.data);
  console.log('Forecast updated:', update);
};
```

---

## 8. Infrastructure & Deployment

### 8.1 AWS Architecture

**Core Services**:

1. **Compute**:
   - ECS Fargate (API services, microservices)
   - Lambda (Event-driven processing, data ingestion)
   - SageMaker (ML training and inference)
   - EC2 (Kafka brokers, custom workloads)

2. **Storage**:
   - RDS PostgreSQL with TimescaleDB (Time series data)
   - ElastiCache Redis (Caching)
   - S3 (Data lake, model artifacts)
   - EFS (Shared file storage)

3. **Networking**:
   - VPC with public/private subnets
   - Application Load Balancer
   - API Gateway
   - CloudFront (CDN)

4. **Data Processing**:
   - MSK (Managed Kafka)
   - SQS (Message queuing)
   - Glue (ETL jobs)
   - EMR (Spark for large-scale analytics)

5. **Monitoring & Logging**:
   - CloudWatch (Metrics, logs, alarms)
   - X-Ray (Distributed tracing)
   - Prometheus + Grafana (Custom metrics)

**Architecture Diagram**:
```
┌─────────────────────────────────────────────────────────────┐
│                        CloudFront (CDN)                      │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                     API Gateway / ALB                        │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
┌───────▼────────┐  ┌────────▼────────┐  ┌────────▼────────┐
│  ECS Fargate   │  │  ECS Fargate    │  │   Lambda        │
│  (API Services)│  │  (ML Services)  │  │  (Event Proc.)  │
└───────┬────────┘  └────────┬────────┘  └────────┬────────┘
        │                     │                     │
        └─────────────────────┼─────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
┌───────▼────────┐  ┌────────▼────────┐  ┌────────▼────────┐
│  RDS Postgres  │  │  ElastiCache    │  │      S3         │
│  (TimescaleDB) │  │    (Redis)      │  │  (Data Lake)    │
└────────────────┘  └─────────────────┘  └─────────────────┘
```

### 8.2 Kubernetes Deployment

**Deployment Strategy**:

**Forecast Service Deployment**:
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: forecast-service
  namespace: micropulse
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: forecast-service
  template:
    metadata:
      labels:
        app: forecast-service
    spec:
      containers:
      - name: forecast-api
        image: micropulse/forecast-service:v1.0.0
        ports:
        - containerPort: 8000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: db-credentials
              key: url
        - name: REDIS_URL
          valueFrom:
            configMapKeyRef:
              name: redis-config
              key: url
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
        livenessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 8000
          initialDelaySeconds: 10
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: forecast-service
  namespace: micropulse
spec:
  selector:
    app: forecast-service
  ports:
  - protocol: TCP
    port: 80
    targetPort: 8000
  type: LoadBalancer
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: forecast-service-hpa
  namespace: micropulse
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: forecast-service
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

### 8.3 CI/CD Pipeline

**GitHub Actions Workflow**:
```yaml
name: Deploy MicroPulse

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      - name: Install dependencies
        run: |
          pip install -r requirements.txt
          pip install pytest pytest-cov
      - name: Run tests
        run: pytest --cov=src tests/
      - name: Upload coverage
        uses: codecov/codecov-action@v3

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Build Docker image
        run: docker build -t micropulse/forecast-service:${{ github.sha }} .
      - name: Push to ECR
        run: |
          aws ecr get-login-password | docker login --username AWS --password-stdin $ECR_REGISTRY
          docker push micropulse/forecast-service:${{ github.sha }}

  deploy:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - name: Deploy to ECS
        run: |
          aws ecs update-service --cluster micropulse --service forecast-service --force-new-deployment
```

---

## 9. Security Architecture

### 9.1 Authentication & Authorization

**Authentication Flow**:
```
Client → API Gateway → JWT Validation → Service
```

**JWT Token Structure**:
```json
{
  "sub": "user_id_123",
  "email": "user@example.com",
  "role": "manager",
  "permissions": ["read:forecasts", "write:forecasts"],
  "pin_codes": ["560001", "560002"],
  "exp": 1707739200
}
```

**Authorization Middleware**:
```python
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer

security = HTTPBearer()

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

def require_permission(permission: str):
    def permission_checker(user = Depends(verify_token)):
        if permission not in user.get('permissions', []):
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        return user
    return permission_checker

# Usage
@app.get("/forecasts")
async def get_forecasts(user = Depends(require_permission("read:forecasts"))):
    # Only users with read:forecasts permission can access
    pass
```

### 9.2 Data Encryption

**Encryption at Rest**:
- RDS: AES-256 encryption enabled
- S3: Server-side encryption (SSE-S3 or SSE-KMS)
- EBS volumes: Encrypted with KMS

**Encryption in Transit**:
- TLS 1.3 for all API communications
- VPC peering for inter-service communication
- SSL/TLS for database connections

### 9.3 Network Security

**VPC Configuration**:
```
VPC (10.0.0.0/16)
├── Public Subnets (10.0.1.0/24, 10.0.2.0/24)
│   ├── NAT Gateway
│   └── Load Balancer
└── Private Subnets (10.0.10.0/24, 10.0.11.0/24)
    ├── ECS Tasks
    ├── RDS Instances
    └── ElastiCache
```

**Security Groups**:
```python
# API Service Security Group
api_sg = {
    'ingress': [
        {'port': 443, 'source': '0.0.0.0/0', 'protocol': 'tcp'},  # HTTPS
        {'port': 80, 'source': 'alb_sg', 'protocol': 'tcp'}  # From ALB
    ],
    'egress': [
        {'port': 5432, 'destination': 'db_sg', 'protocol': 'tcp'},  # To RDS
        {'port': 6379, 'destination': 'redis_sg', 'protocol': 'tcp'}  # To Redis
    ]
}

# Database Security Group
db_sg = {
    'ingress': [
        {'port': 5432, 'source': 'api_sg', 'protocol': 'tcp'}
    ],
    'egress': []
}
```

### 9.4 Secrets Management

**AWS Secrets Manager**:
```python
import boto3

def get_secret(secret_name):
    client = boto3.client('secretsmanager', region_name='ap-south-1')
    response = client.get_secret_value(SecretId=secret_name)
    return json.loads(response['SecretString'])

# Usage
db_credentials = get_secret('micropulse/db/credentials')
DATABASE_URL = f"postgresql://{db_credentials['username']}:{db_credentials['password']}@{db_credentials['host']}/micropulse"
```

### 9.5 API Rate Limiting

**Rate Limiting Strategy**:
```python
from fastapi_limiter import FastAPILimiter
from fastapi_limiter.depends import RateLimiter

# Initialize with Redis
await FastAPILimiter.init(redis_connection)

# Apply rate limits
@app.get("/forecasts", dependencies=[Depends(RateLimiter(times=100, seconds=60))])
async def get_forecasts():
    # 100 requests per minute per user
    pass

@app.post("/forecasts/batch", dependencies=[Depends(RateLimiter(times=10, seconds=60))])
async def batch_forecasts():
    # 10 batch requests per minute per user
    pass
```

---

## 10. Scalability & Performance

### 10.1 Horizontal Scaling Strategy

**Auto-scaling Configuration**:

**ECS Auto-scaling**:
```json
{
  "service": "forecast-service",
  "scalingPolicies": [
    {
      "type": "TargetTrackingScaling",
      "targetValue": 70,
      "metric": "CPUUtilization",
      "scaleOutCooldown": 60,
      "scaleInCooldown": 300
    },
    {
      "type": "TargetTrackingScaling",
      "targetValue": 80,
      "metric": "MemoryUtilization"
    },
    {
      "type": "StepScaling",
      "metric": "RequestCountPerTarget",
      "steps": [
        {"threshold": 1000, "adjustment": 2},
        {"threshold": 2000, "adjustment": 4}
      ]
    }
  ],
  "minCapacity": 3,
  "maxCapacity": 20
}
```

**Database Scaling**:
- Read replicas for read-heavy workloads
- Connection pooling (PgBouncer)
- Partitioning by date and PIN code
- Materialized views for aggregations

### 10.2 Caching Strategy

**Multi-Layer Caching**:

**L1 Cache (Application Memory)**:
```python
from functools import lru_cache

@lru_cache(maxsize=1000)
def get_sku_metadata(sku_id):
    # Cache SKU metadata in memory
    return fetch_from_db(sku_id)
```

**L2 Cache (Redis)**:
```python
import redis
import json

redis_client = redis.Redis(host='redis', port=6379, decode_responses=True)

def get_forecast_cached(sku_id, pin_code, horizon):
    cache_key = f"forecast:{sku_id}:{pin_code}:{horizon}"
    
    # Try cache first
    cached = redis_client.get(cache_key)
    if cached:
        return json.loads(cached)
    
    # Generate forecast
    forecast = generate_forecast(sku_id, pin_code, horizon)
    
    # Cache for 1 hour
    redis_client.setex(cache_key, 3600, json.dumps(forecast))
    
    return forecast
```

**Cache Invalidation**:
```python
def invalidate_forecast_cache(sku_id, pin_code):
    """Invalidate cache when new data arrives"""
    pattern = f"forecast:{sku_id}:{pin_code}:*"
    keys = redis_client.keys(pattern)
    if keys:
        redis_client.delete(*keys)
```

### 10.3 Database Optimization

**Indexing Strategy**:
```sql
-- Composite index for common queries
CREATE INDEX idx_sales_sku_pin_date ON sales(sku_id, pin_code, date DESC);

-- Partial index for recent data
CREATE INDEX idx_sales_recent ON sales(date DESC) 
WHERE date > NOW() - INTERVAL '90 days';

-- Index for aggregations
CREATE INDEX idx_sales_aggregation ON sales(sku_id, pin_code, date)
INCLUDE (quantity, price);

-- TimescaleDB hypertable
SELECT create_hypertable('sales', 'date', chunk_time_interval => INTERVAL '1 week');

-- Compression for old data
ALTER TABLE sales SET (
  timescaledb.compress,
  timescaledb.compress_segmentby = 'sku_id, pin_code'
);

SELECT add_compression_policy('sales', INTERVAL '30 days');
```

**Query Optimization**:
```sql
-- Materialized view for daily aggregations
CREATE MATERIALIZED VIEW daily_sales_summary AS
SELECT 
    sku_id,
    pin_code,
    DATE(date) as sale_date,
    SUM(quantity) as total_quantity,
    AVG(price) as avg_price,
    COUNT(*) as transaction_count
FROM sales
GROUP BY sku_id, pin_code, DATE(date);

-- Refresh policy
CREATE OR REPLACE FUNCTION refresh_daily_summary()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY daily_sales_summary;
END;
$$ LANGUAGE plpgsql;

-- Schedule refresh
SELECT cron.schedule('refresh-daily-summary', '0 1 * * *', 'SELECT refresh_daily_summary()');
```

### 10.4 Async Processing

**Celery Task Queue**:
```python
from celery import Celery

celery_app = Celery('micropulse', broker='redis://redis:6379/0')

@celery_app.task
def generate_forecast_async(sku_id, pin_code, horizon):
    """Async forecast generation"""
    forecast = generate_forecast(sku_id, pin_code, horizon)
    
    # Store result
    store_forecast(forecast)
    
    # Notify subscribers
    notify_forecast_ready(sku_id, pin_code)
    
    return forecast

# Usage
@app.post("/forecasts/async")
async def request_forecast(request: ForecastRequest):
    task = generate_forecast_async.delay(
        request.sku_id, 
        request.pin_code, 
        request.horizon
    )
    
    return {"task_id": task.id, "status": "processing"}
```

### 10.5 Performance Benchmarks

**Target Performance Metrics**:

| Operation | Target | Measurement |
|-----------|--------|-------------|
| Single forecast API | <500ms | p95 latency |
| Batch forecast (100 SKUs) | <5s | p95 latency |
| Dashboard load | <3s | Time to interactive |
| Model inference | <100ms | Per SKU |
| Data ingestion | 10K records/s | Throughput |
| Database query | <200ms | p95 latency |

---

## 11. Monitoring & Observability

### 11.1 Metrics Collection

**Application Metrics**:
```python
from prometheus_client import Counter, Histogram, Gauge

# Request metrics
request_count = Counter('api_requests_total', 'Total API requests', ['method', 'endpoint', 'status'])
request_duration = Histogram('api_request_duration_seconds', 'Request duration', ['method', 'endpoint'])

# Forecast metrics
forecast_accuracy = Gauge('forecast_accuracy_mape', 'Forecast MAPE', ['category', 'region'])
forecast_generation_time = Histogram('forecast_generation_seconds', 'Forecast generation time')

# Model metrics
model_inference_time = Histogram('model_inference_seconds', 'Model inference time', ['model_name'])
model_predictions = Counter('model_predictions_total', 'Total predictions', ['model_name'])

# Usage
@app.get("/forecasts")
async def get_forecasts():
    with request_duration.labels(method='GET', endpoint='/forecasts').time():
        request_count.labels(method='GET', endpoint='/forecasts', status=200).inc()
        # ... forecast logic
```

### 11.2 Logging Strategy

**Structured Logging**:
```python
import structlog

logger = structlog.get_logger()

def generate_forecast(sku_id, pin_code, horizon):
    logger.info(
        "forecast_generation_started",
        sku_id=sku_id,
        pin_code=pin_code,
        horizon=horizon
    )
    
    try:
        forecast = model.predict(sku_id, pin_code, horizon)
        
        logger.info(
            "forecast_generation_completed",
            sku_id=sku_id,
            pin_code=pin_code,
            forecast_value=forecast['value'],
            confidence=forecast['confidence']
        )
        
        return forecast
    except Exception as e:
        logger.error(
            "forecast_generation_failed",
            sku_id=sku_id,
            pin_code=pin_code,
            error=str(e),
            exc_info=True
        )
        raise
```

### 11.3 Distributed Tracing

**OpenTelemetry Integration**:
```python
from opentelemetry import trace
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor

tracer = trace.get_tracer(__name__)

FastAPIInstrumentor.instrument_app(app)

@app.get("/forecasts")
async def get_forecasts(sku_id: str, pin_code: str):
    with tracer.start_as_current_span("get_forecasts") as span:
        span.set_attribute("sku_id", sku_id)
        span.set_attribute("pin_code", pin_code)
        
        # Fetch from cache
        with tracer.start_as_current_span("cache_lookup"):
            cached = get_from_cache(sku_id, pin_code)
        
        if not cached:
            # Generate forecast
            with tracer.start_as_current_span("generate_forecast"):
                forecast = generate_forecast(sku_id, pin_code)
        
        return forecast
```

### 11.4 Alerting Rules

**CloudWatch Alarms**:
```yaml
alarms:
  - name: HighErrorRate
    metric: api_errors_total
    threshold: 100
    period: 300
    evaluation_periods: 2
    comparison: GreaterThanThreshold
    actions:
      - sns:micropulse-alerts
  
  - name: HighLatency
    metric: api_request_duration_p95
    threshold: 1.0
    period: 300
    evaluation_periods: 3
    comparison: GreaterThanThreshold
  
  - name: LowForecastAccuracy
    metric: forecast_accuracy_mape
    threshold: 20
    period: 3600
    evaluation_periods: 1
    comparison: GreaterThanThreshold
  
  - name: DatabaseConnectionPoolExhausted
    metric: db_connection_pool_usage
    threshold: 90
    period: 60
    evaluation_periods: 2
    comparison: GreaterThanThreshold
```

### 11.5 Dashboards

**Grafana Dashboard Configuration**:
```json
{
  "dashboard": {
    "title": "MicroPulse Operations",
    "panels": [
      {
        "title": "API Request Rate",
        "type": "graph",
        "targets": [
          {"expr": "rate(api_requests_total[5m])"}
        ]
      },
      {
        "title": "Forecast Accuracy (MAPE)",
        "type": "gauge",
        "targets": [
          {"expr": "avg(forecast_accuracy_mape)"}
        ],
        "thresholds": [
          {"value": 15, "color": "green"},
          {"value": 20, "color": "yellow"},
          {"value": 25, "color": "red"}
        ]
      },
      {
        "title": "Model Inference Time",
        "type": "heatmap",
        "targets": [
          {"expr": "histogram_quantile(0.95, model_inference_seconds)"}
        ]
      }
    ]
  }
}
```

---

## 12. Future Extensibility

### 12.1 Planned Enhancements

**Phase 2 (6-12 months)**:
- Multi-objective optimization (demand + profit + waste minimization)
- Causal inference for promotional impact
- Transfer learning for new SKUs/locations
- Explainable AI (SHAP values for forecast drivers)

**Phase 3 (12-18 months)**:
- Automated purchase order generation
- Supply chain optimization
- Dynamic pricing recommendations
- Competitor activity integration

### 12.2 Extensibility Points

**Plugin Architecture**:
```python
class SignalProcessor(ABC):
    @abstractmethod
    def process(self, data):
        pass

class WeatherSignalProcessor(SignalProcessor):
    def process(self, data):
        # Weather-specific processing
        pass

class CompetitorSignalProcessor(SignalProcessor):
    def process(self, data):
        # Competitor-specific processing (future)
        pass

# Registry pattern
signal_processors = {
    'weather': WeatherSignalProcessor(),
    'festival': FestivalSignalProcessor(),
    # Easy to add new processors
}
```

**Model Registry**:
```python
class ModelRegistry:
    def __init__(self):
        self.models = {}
    
    def register(self, name, model_class):
        self.models[name] = model_class
    
    def get(self, name):
        return self.models.get(name)

# Usage
registry = ModelRegistry()
registry.register('prophet', ProphetModel)
registry.register('lightgbm', LightGBMModel)
# Easy to add new models
registry.register('custom_transformer', CustomTransformerModel)
```

### 12.3 API Versioning Strategy

**Version Management**:
```python
# v1 API (current)
@app.get("/v1/forecasts")
async def get_forecasts_v1():
    pass

# v2 API (future - with breaking changes)
@app.get("/v2/forecasts")
async def get_forecasts_v2():
    # New response format, additional features
    pass

# Deprecation headers
@app.get("/v1/forecasts")
async def get_forecasts_v1(response: Response):
    response.headers["X-API-Deprecation"] = "v1 will be deprecated on 2027-01-01"
    response.headers["X-API-Sunset"] = "2027-06-01"
    pass
```

---

## Appendix

### A. Technology Alternatives Considered

| Component | Selected | Alternatives Considered | Rationale |
|-----------|----------|------------------------|-----------|
| Time Series DB | TimescaleDB | InfluxDB, QuestDB | PostgreSQL compatibility, SQL support |
| ML Framework | PyTorch + scikit-learn | TensorFlow only | Flexibility, ecosystem |
| Message Queue | Kafka | RabbitMQ, Pulsar | Scalability, durability |
| API Framework | FastAPI | Flask, Django | Performance, async support |
| Orchestration | Kubernetes | Docker Swarm, ECS | Industry standard, ecosystem |

### B. Glossary

- **MAPE**: Mean Absolute Percentage Error
- **SKU**: Stock Keeping Unit
- **PIN Code**: Postal Index Number (Indian postal code)
- **TFT**: Temporal Fusion Transformer
- **ETS**: Exponential Smoothing
- **SARIMA**: Seasonal AutoRegressive Integrated Moving Average

---

**Document Version**: 1.0  
**Last Updated**: February 12, 2026  
**Document Owner**: Engineering Team  
**Status**: Draft for Review  
**Next Review**: March 12, 2026
