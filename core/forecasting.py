"""
MicroPulse Forecasting Module
Baseline Prophet model for demand forecasting
"""

import pandas as pd
import numpy as np
from prophet import Prophet
import json
import os
from typing import Dict, Tuple
import warnings

warnings.filterwarnings('ignore')


class BaselineForecaster:
    """
    Baseline forecasting model using Prophet without external regressors.
    Used as comparison baseline for context-aware models.
    """
    
    def __init__(self):
        self.model = None
        self.train_data = None
        self.test_data = None
        
    def load_data(self, filepath: str, sku_id: str = None, pin_code: str = None) -> pd.DataFrame:
        """
        Load sales data from CSV and filter by SKU and PIN code if provided.
        
        Args:
            filepath: Path to CSV file
            sku_id: SKU identifier to filter (REQUIRED if sku_id column exists)
            pin_code: PIN code to filter (REQUIRED if pin_code column exists)
            
        Returns:
            Filtered DataFrame
        """
        df = pd.read_csv(filepath)
        
        print(f"Rows before filtering: {len(df)}")
        
        # Check if SKU and PIN columns exist
        has_sku = 'sku_id' in df.columns
        has_pin = 'pin_code' in df.columns
        
        # Enforce strict filtering - no "all" grouping allowed
        if has_sku and not sku_id:
            raise ValueError("Dataset contains 'sku_id' column. You must specify sku_id parameter. No 'all' grouping allowed.")
        
        if has_pin and not pin_code:
            raise ValueError("Dataset contains 'pin_code' column. You must specify pin_code parameter. No 'all' grouping allowed.")
        
        # Filter by SKU
        if sku_id and has_sku:
            df = df[df['sku_id'] == sku_id].copy()
            print(f"Filtered by SKU '{sku_id}': {len(df)} rows")
        
        # Filter by PIN (handle both string and numeric PIN codes)
        if pin_code and has_pin:
            # Convert pin_code to same type as dataframe column
            if df['pin_code'].dtype == 'int64' or df['pin_code'].dtype == 'int32':
                # DataFrame has numeric PIN, convert input to int
                pin_code_filter = int(pin_code)
            else:
                # DataFrame has string PIN, convert to string
                pin_code_filter = str(pin_code)
                df['pin_code'] = df['pin_code'].astype(str)
            
            df = df[df['pin_code'] == pin_code_filter].copy()
            print(f"Filtered by PIN '{pin_code}': {len(df)} rows")
        
        print(f"Rows after filtering: {len(df)}")
        
        if len(df) == 0:
            raise ValueError(f"No data found for SKU '{sku_id}' and PIN '{pin_code}'")
        
        # Ensure date column is datetime
        df['date'] = pd.to_datetime(df['date'])
        
        # Sort by date to ensure chronological order
        df = df.sort_values('date').reset_index(drop=True)
        
        return df
    
    def prepare_prophet_data(self, df: pd.DataFrame, target_col: str = 'sales') -> pd.DataFrame:
        """
        Prepare data for Prophet by renaming columns to 'ds' and 'y'.
        
        Args:
            df: Input DataFrame with date and target columns
            target_col: Name of target column (default: 'sales', can be 'units_sold')
            
        Returns:
            DataFrame with 'ds' and 'y' columns
        """
        # Determine target column name
        if 'units_sold' in df.columns:
            target_col = 'units_sold'
        elif 'sales' in df.columns:
            target_col = 'sales'
        else:
            raise ValueError("DataFrame must contain 'units_sold' or 'sales' column")
        
        prophet_df = pd.DataFrame({
            'ds': df['date'],
            'y': df[target_col]
        })
        
        return prophet_df
    
    def time_aware_split(self, df: pd.DataFrame, train_ratio: float = 0.8) -> Tuple[pd.DataFrame, pd.DataFrame]:
        """
        Perform time-aware train-test split.
        
        Args:
            df: Input DataFrame sorted by date
            train_ratio: Proportion of data for training (default: 0.8)
            
        Returns:
            Tuple of (train_df, test_df)
        """
        split_idx = int(len(df) * train_ratio)
        
        train_df = df.iloc[:split_idx].copy()
        test_df = df.iloc[split_idx:].copy()
        
        print(f"Train period: {train_df['ds'].min()} to {train_df['ds'].max()}")
        print(f"Test period: {test_df['ds'].min()} to {test_df['ds'].max()}")
        print(f"Train samples: {len(train_df)}, Test samples: {len(test_df)}")
        
        return train_df, test_df
    
    def train(self, train_df: pd.DataFrame) -> None:
        """
        Train Prophet model on training data.
        
        Args:
            train_df: Training DataFrame with 'ds' and 'y' columns
        """
        self.model = Prophet(
            yearly_seasonality=False,  # Disabled - dataset too short (180 days)
            weekly_seasonality=True,   # Enabled explicitly
            daily_seasonality=False,
            seasonality_mode='multiplicative',
            changepoint_prior_scale=0.1  # Tuned for better flexibility
        )
        
        print("Training Prophet model...")
        print("Configuration:")
        print("  - Seasonality mode: multiplicative")
        print("  - Weekly seasonality: enabled")
        print("  - Yearly seasonality: disabled (dataset too short)")
        print("  - Changepoint prior scale: 0.1")
        self.model.fit(train_df)
        print("Training completed.")
        
        self.train_data = train_df
    
    def predict(self, test_df: pd.DataFrame) -> pd.DataFrame:
        """
        Generate predictions for test period.
        
        Args:
            test_df: Test DataFrame with 'ds' column
            
        Returns:
            DataFrame with predictions
        """
        if self.model is None:
            raise ValueError("Model not trained. Call train() first.")
        
        # Create future dataframe for test period
        future = test_df[['ds']].copy()
        
        # Generate predictions
        forecast = self.model.predict(future)
        
        # Merge with actual values
        predictions = test_df.merge(
            forecast[['ds', 'yhat', 'yhat_lower', 'yhat_upper']], 
            on='ds', 
            how='left'
        )
        
        return predictions
    
    def calculate_metrics(self, predictions: pd.DataFrame) -> Dict[str, float]:
        """
        Calculate forecast accuracy metrics with enhanced diagnostics.
        
        Args:
            predictions: DataFrame with 'y' (actual) and 'yhat' (predicted) columns
            
        Returns:
            Dictionary with MAPE, MAE, RMSE, sigma_forecast, bias, and diagnostics
        """
        actual = predictions['y'].values
        predicted = predictions['yhat'].values
        
        # Calculate errors
        errors = predicted - actual
        abs_errors = np.abs(errors)
        squared_errors = errors ** 2
        percentage_errors = np.abs(errors / actual) * 100
        
        # MAPE (Mean Absolute Percentage Error)
        mape = np.mean(percentage_errors)
        
        # MAE (Mean Absolute Error)
        mae = np.mean(abs_errors)
        
        # RMSE (Root Mean Squared Error)
        rmse = np.sqrt(np.mean(squared_errors))
        
        # Forecast error standard deviation (σ_forecast)
        sigma_forecast = np.std(errors)
        
        # Bias (mean of prediction - actual)
        bias = np.mean(errors)
        
        # Additional diagnostics
        mean_actual = np.mean(actual)
        mean_predicted = np.mean(predicted)
        mean_residual = np.mean(errors)
        
        # Print diagnostics
        print("\n" + "="*50)
        print("FORECAST DIAGNOSTICS")
        print("="*50)
        print(f"Mean of actual values: {mean_actual:.2f}")
        print(f"Mean of predictions: {mean_predicted:.2f}")
        print(f"Mean residual (bias): {mean_residual:.2f}")
        print(f"Std of residuals (σ): {sigma_forecast:.2f}")
        
        if abs(bias) < 5:
            print(f"✓ Bias is close to zero ({bias:.2f})")
        else:
            print(f"⚠ Bias is significant ({bias:.2f}) - model may be systematically over/under-forecasting")
        print("="*50)
        
        metrics = {
            'mape': round(float(mape), 2),
            'mae': round(float(mae), 2),
            'rmse': round(float(rmse), 2),
            'sigma_forecast': round(float(sigma_forecast), 2),
            'bias': round(float(bias), 2),
            'mean_actual': round(float(mean_actual), 2),
            'mean_predicted': round(float(mean_predicted), 2),
            'mean_residual': round(float(mean_residual), 2)
        }
        
        return metrics
    
    def save_metrics(self, metrics: Dict, output_path: str = 'reports/baseline_metrics.json') -> None:
        """
        Save metrics to JSON file.
        
        Args:
            metrics: Dictionary of metrics
            output_path: Path to save JSON file
        """
        # Create directory if it doesn't exist
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        
        with open(output_path, 'w') as f:
            json.dump(metrics, f, indent=2)
        
        print(f"Metrics saved to {output_path}")


def run_baseline_forecast(
    data_path: str = 'data/daily_sales.csv',
    sku_id: str = None,
    pin_code: str = None,
    train_ratio: float = 0.8,
    output_path: str = 'reports/baseline_metrics.json'
) -> Dict:
    """
    Run complete baseline forecasting pipeline.
    
    Args:
        data_path: Path to sales data CSV
        sku_id: SKU identifier to filter (REQUIRED if dataset has sku_id column)
        pin_code: PIN code to filter (REQUIRED if dataset has pin_code column)
        train_ratio: Train-test split ratio (default: 0.8)
        output_path: Path to save metrics JSON
        
    Returns:
        Dictionary containing metrics and metadata
    """
    forecaster = BaselineForecaster()
    
    # Load and filter data
    print(f"Loading data from {data_path}...")
    df = forecaster.load_data(data_path, sku_id, pin_code)
    print(f"Final dataset: {len(df)} records")
    
    # Prepare data for Prophet
    prophet_df = forecaster.prepare_prophet_data(df)
    
    # Time-aware train-test split
    train_df, test_df = forecaster.time_aware_split(prophet_df, train_ratio)
    
    print(f"\nTrain samples: {len(train_df)} (~{len(train_df)/len(prophet_df)*100:.0f}%)")
    print(f"Test samples: {len(test_df)} (~{len(test_df)/len(prophet_df)*100:.0f}%)")
    
    # Train model
    forecaster.train(train_df)
    
    # Generate predictions
    print("Generating predictions...")
    predictions = forecaster.predict(test_df)
    
    # Calculate metrics
    print("Calculating metrics...")
    metrics = forecaster.calculate_metrics(predictions)
    
    # Add metadata
    result = {
        'sku_id': sku_id if sku_id else 'not_specified',
        'pin_code': pin_code if pin_code else 'not_specified',
        'mape': metrics['mape'],
        'mae': metrics['mae'],
        'rmse': metrics['rmse'],
        'sigma_forecast': metrics['sigma_forecast'],
        'bias': metrics['bias'],
        'mean_actual': metrics['mean_actual'],
        'mean_predicted': metrics['mean_predicted'],
        'mean_residual': metrics['mean_residual'],
        'train_samples': len(train_df),
        'test_samples': len(test_df),
        'train_period': f"{train_df['ds'].min()} to {train_df['ds'].max()}",
        'test_period': f"{test_df['ds'].min()} to {test_df['ds'].max()}"
    }
    
    # Save metrics
    forecaster.save_metrics(result, output_path)
    
    # Print summary
    print("\n" + "="*50)
    print("BASELINE FORECAST METRICS")
    print("="*50)
    print(f"SKU ID: {result['sku_id']}")
    print(f"PIN Code: {result['pin_code']}")
    print(f"MAPE: {result['mape']}%")
    print(f"MAE: {result['mae']}")
    print(f"RMSE: {result['rmse']}")
    print(f"Sigma Forecast (σ): {result['sigma_forecast']}")
    print(f"Bias: {result['bias']}")
    print("="*50)
    
    return result


if __name__ == "__main__":
    # Example usage
    result = run_baseline_forecast(
        data_path='data/daily_sales.csv',
        sku_id=None,  # Set to specific SKU if filtering needed
        pin_code=None,  # Set to specific PIN if filtering needed
        train_ratio=0.8,
        output_path='reports/baseline_metrics.json'
    )



class ContextAwareForecaster(BaselineForecaster):
    """
    Context-aware forecasting model using Prophet with external regressors.
    Includes weather, weekend, and event signals for improved accuracy.
    """
    
    def __init__(self):
        super().__init__()
        self.regressors = ['temperature', 'is_weekend', 'is_event']
    
    def add_context_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Add context features (temperature, is_weekend, is_event) to dataframe.
        
        Args:
            df: DataFrame with date column
            
        Returns:
            DataFrame with added context features
        """
        df = df.copy()
        
        # Add is_weekend feature
        df['is_weekend'] = df['date'].dt.dayofweek.isin([5, 6]).astype(int)
        
        # Add temperature feature (simulated if not present)
        if 'temperature' not in df.columns:
            # Simulate temperature with seasonal pattern
            day_of_year = df['date'].dt.dayofyear
            # Simple sinusoidal pattern: warmer in summer, cooler in winter
            df['temperature'] = 25 + 10 * np.sin(2 * np.pi * (day_of_year - 80) / 365)
            # Add some random variation
            df['temperature'] += np.random.normal(0, 2, len(df))
        
        # Add is_event feature (simulated if not present)
        if 'is_event' not in df.columns:
            # Simulate events (festivals, holidays) - roughly 10% of days
            np.random.seed(42)  # For reproducibility
            df['is_event'] = np.random.choice([0, 1], size=len(df), p=[0.9, 0.1])
        
        return df
    
    def prepare_prophet_data_with_regressors(
        self, 
        df: pd.DataFrame, 
        target_col: str = 'sales'
    ) -> pd.DataFrame:
        """
        Prepare data for Prophet with regressors.
        
        Args:
            df: Input DataFrame with date, target, and regressor columns
            target_col: Name of target column
            
        Returns:
            DataFrame with 'ds', 'y', and regressor columns
        """
        # First add context features
        df = self.add_context_features(df)
        
        # Determine target column name
        if 'units_sold' in df.columns:
            target_col = 'units_sold'
        elif 'sales' in df.columns:
            target_col = 'sales'
        else:
            raise ValueError("DataFrame must contain 'units_sold' or 'sales' column")
        
        # Create Prophet dataframe
        prophet_df = pd.DataFrame({
            'ds': df['date'],
            'y': df[target_col]
        })
        
        # Add regressors
        for regressor in self.regressors:
            if regressor in df.columns:
                prophet_df[regressor] = df[regressor]
            else:
                raise ValueError(f"Required regressor '{regressor}' not found in dataframe")
        
        return prophet_df
    
    def train(self, train_df: pd.DataFrame) -> None:
        """
        Train Prophet model with external regressors.
        
        Args:
            train_df: Training DataFrame with 'ds', 'y', and regressor columns
        """
        self.model = Prophet(
            yearly_seasonality=False,  # Disabled - dataset too short (180 days)
            weekly_seasonality=True,   # Enabled explicitly
            daily_seasonality=False,
            seasonality_mode='multiplicative',
            changepoint_prior_scale=0.1  # Tuned for better flexibility
        )
        
        # Add regressors as additive components
        for regressor in self.regressors:
            if regressor in train_df.columns:
                self.model.add_regressor(regressor, mode='additive')
                print(f"Added regressor: {regressor} (mode: additive)")
        
        print("Training context-aware Prophet model...")
        print("Configuration:")
        print("  - Seasonality mode: multiplicative")
        print("  - Weekly seasonality: enabled")
        print("  - Yearly seasonality: disabled (dataset too short)")
        print("  - Changepoint prior scale: 0.1")
        print("  - Regressors: additive components")
        self.model.fit(train_df)
        print("Training completed.")
        
        self.train_data = train_df
    
    def predict(self, test_df: pd.DataFrame) -> pd.DataFrame:
        """
        Generate predictions for test period with regressors.
        
        Args:
            test_df: Test DataFrame with 'ds' and regressor columns
            
        Returns:
            DataFrame with predictions
        """
        if self.model is None:
            raise ValueError("Model not trained. Call train() first.")
        
        # Ensure all regressors are present in test data
        for regressor in self.regressors:
            if regressor not in test_df.columns:
                raise ValueError(f"Regressor '{regressor}' missing from test data")
        
        # Create future dataframe with regressors
        future = test_df[['ds'] + self.regressors].copy()
        
        # Generate predictions
        forecast = self.model.predict(future)
        
        # Merge with actual values
        predictions = test_df.merge(
            forecast[['ds', 'yhat', 'yhat_lower', 'yhat_upper']], 
            on='ds', 
            how='left'
        )
        
        return predictions


def run_context_aware_forecast(
    data_path: str = 'data/daily_sales.csv',
    sku_id: str = None,
    pin_code: str = None,
    train_ratio: float = 0.8,
    output_path: str = 'reports/context_metrics.json'
) -> Dict:
    """
    Run complete context-aware forecasting pipeline with external regressors.
    
    Args:
        data_path: Path to sales data CSV
        sku_id: SKU identifier to filter (REQUIRED if dataset has sku_id column)
        pin_code: PIN code to filter (REQUIRED if dataset has pin_code column)
        train_ratio: Train-test split ratio (default: 0.8)
        output_path: Path to save metrics JSON
        
    Returns:
        Dictionary containing metrics and metadata
    """
    forecaster = ContextAwareForecaster()
    
    # Load and filter data
    print(f"Loading data from {data_path}...")
    df = forecaster.load_data(data_path, sku_id, pin_code)
    print(f"Final dataset: {len(df)} records")
    
    # Prepare data with regressors
    prophet_df = forecaster.prepare_prophet_data_with_regressors(df)
    
    # Time-aware train-test split
    train_df, test_df = forecaster.time_aware_split(prophet_df, train_ratio)
    
    print(f"\nTrain samples: {len(train_df)} (~{len(train_df)/len(prophet_df)*100:.0f}%)")
    print(f"Test samples: {len(test_df)} (~{len(test_df)/len(prophet_df)*100:.0f}%)")
    
    # Verify regressors are present in both train and test
    print("\nVerifying regressors in train and test data:")
    for regressor in forecaster.regressors:
        train_has = regressor in train_df.columns
        test_has = regressor in test_df.columns
        print(f"  {regressor}: train={train_has}, test={test_has}")
    
    # Train model
    forecaster.train(train_df)
    
    # Generate predictions
    print("Generating predictions...")
    predictions = forecaster.predict(test_df)
    
    # Calculate metrics
    print("Calculating metrics...")
    metrics = forecaster.calculate_metrics(predictions)
    
    # Add metadata
    result = {
        'model_type': 'context_aware',
        'sku_id': sku_id if sku_id else 'not_specified',
        'pin_code': pin_code if pin_code else 'not_specified',
        'regressors': forecaster.regressors,
        'mape': metrics['mape'],
        'mae': metrics['mae'],
        'rmse': metrics['rmse'],
        'sigma_forecast': metrics['sigma_forecast'],
        'bias': metrics['bias'],
        'mean_actual': metrics['mean_actual'],
        'mean_predicted': metrics['mean_predicted'],
        'mean_residual': metrics['mean_residual'],
        'train_samples': len(train_df),
        'test_samples': len(test_df),
        'train_period': f"{train_df['ds'].min()} to {train_df['ds'].max()}",
        'test_period': f"{test_df['ds'].min()} to {test_df['ds'].max()}"
    }
    
    # Save metrics
    forecaster.save_metrics(result, output_path)
    
    # Print summary
    print("\n" + "="*50)
    print("CONTEXT-AWARE FORECAST METRICS")
    print("="*50)
    print(f"Model Type: {result['model_type']}")
    print(f"SKU ID: {result['sku_id']}")
    print(f"PIN Code: {result['pin_code']}")
    print(f"Regressors: {', '.join(result['regressors'])}")
    print(f"MAPE: {result['mape']}%")
    print(f"MAE: {result['mae']}")
    print(f"RMSE: {result['rmse']}")
    print(f"Sigma Forecast (σ): {result['sigma_forecast']}")
    print(f"Bias: {result['bias']}")
    print("="*50)
    
    return result


def compare_models(
    baseline_metrics: Dict,
    context_metrics: Dict
) -> Dict:
    """
    Compare baseline and context-aware model performance.
    
    Args:
        baseline_metrics: Metrics from baseline model
        context_metrics: Metrics from context-aware model
        
    Returns:
        Dictionary with comparison metrics
    """
    comparison = {
        'mape_improvement': round(
            ((baseline_metrics['mape'] - context_metrics['mape']) / baseline_metrics['mape']) * 100, 2
        ),
        'mae_improvement': round(
            ((baseline_metrics['mae'] - context_metrics['mae']) / baseline_metrics['mae']) * 100, 2
        ),
        'rmse_improvement': round(
            ((baseline_metrics['rmse'] - context_metrics['rmse']) / baseline_metrics['rmse']) * 100, 2
        ),
        'sigma_reduction': round(
            ((baseline_metrics['sigma_forecast'] - context_metrics['sigma_forecast']) / 
             baseline_metrics['sigma_forecast']) * 100, 2
        ),
        'baseline_mape': baseline_metrics['mape'],
        'context_mape': context_metrics['mape'],
        'baseline_sigma': baseline_metrics['sigma_forecast'],
        'context_sigma': context_metrics['sigma_forecast']
    }
    
    print("\n" + "="*50)
    print("MODEL COMPARISON")
    print("="*50)
    print(f"MAPE Improvement: {comparison['mape_improvement']}%")
    print(f"MAE Improvement: {comparison['mae_improvement']}%")
    print(f"RMSE Improvement: {comparison['rmse_improvement']}%")
    print(f"Sigma Reduction: {comparison['sigma_reduction']}%")
    print("\nBaseline vs Context-Aware:")
    print(f"  MAPE: {comparison['baseline_mape']}% → {comparison['context_mape']}%")
    print(f"  Sigma: {comparison['baseline_sigma']} → {comparison['context_sigma']}")
    print("="*50)
    
    return comparison
