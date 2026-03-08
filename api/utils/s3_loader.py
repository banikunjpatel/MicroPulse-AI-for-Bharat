"""
MicroPulse API - S3 Data Loader
Utility functions to load data from Amazon S3 with local fallback
"""

import json
import os
import boto3
from botocore.exceptions import ClientError, NoCredentialsError
from typing import Optional, Dict, Any
import logging
import pandas as pd
from io import StringIO

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def get_s3_client():
    """
    Get boto3 S3 client with region support.
    
    Returns:
        boto3 S3 client or None if credentials not available
    """
    try:
        # Get AWS region from environment, default to ap-south-1
        region = os.getenv('AWS_REGION', 'ap-south-1')
        
        s3_client = boto3.client('s3', region_name=region)
        logger.info(f"S3 client created for region: {region}")
        return s3_client
    except NoCredentialsError:
        logger.warning("AWS credentials not found. Will use local files.")
        return None
    except Exception as e:
        logger.warning(f"Error creating S3 client: {str(e)}. Will use local files.")
        return None


def load_json_from_s3(bucket: str, key: str) -> Optional[Dict[str, Any]]:
    """
    Load JSON data from S3.
    
    Args:
        bucket: S3 bucket name
        key: S3 object key (file path)
        
    Returns:
        Dictionary with JSON data or None if error
    """
    try:
        s3_client = get_s3_client()
        
        if s3_client is None:
            return None
        
        logger.info(f"Loading data from S3: s3://{bucket}/{key}")
        
        # Get object from S3
        response = s3_client.get_object(Bucket=bucket, Key=key)
        
        # Read and parse JSON
        content = response['Body'].read().decode('utf-8')
        data = json.loads(content)
        
        logger.info(f"Successfully loaded {key} from S3 (size: {len(content)} bytes)")
        return data
        
    except ClientError as e:
        error_code = e.response['Error']['Code']
        if error_code == 'NoSuchKey':
            logger.warning(f"File not found in S3: s3://{bucket}/{key}")
        elif error_code == 'NoSuchBucket':
            logger.warning(f"Bucket not found: {bucket}")
        else:
            logger.warning(f"S3 ClientError: {str(e)}")
        return None
        
    except Exception as e:
        logger.warning(f"Error loading from S3: {str(e)}")
        return None


def load_csv_from_s3(bucket: str, key: str) -> Optional[pd.DataFrame]:
    """
    Load CSV data from S3 into pandas DataFrame.
    
    Args:
        bucket: S3 bucket name
        key: S3 object key (file path)
        
    Returns:
        pandas DataFrame or None if error
    """
    try:
        s3_client = get_s3_client()
        
        if s3_client is None:
            return None
        
        logger.info(f"Loading CSV from S3: s3://{bucket}/{key}")
        
        # Get object from S3
        response = s3_client.get_object(Bucket=bucket, Key=key)
        
        # Read and parse CSV
        csv_string = response['Body'].read().decode('utf-8')
        df = pd.read_csv(StringIO(csv_string))
        
        logger.info(f"Successfully loaded {key} from S3 ({len(df)} rows, {len(df.columns)} columns)")
        return df
        
    except ClientError as e:
        error_code = e.response['Error']['Code']
        if error_code == 'NoSuchKey':
            logger.warning(f"CSV file not found in S3: s3://{bucket}/{key}")
        elif error_code == 'NoSuchBucket':
            logger.warning(f"Bucket not found: {bucket}")
        else:
            logger.warning(f"S3 ClientError: {str(e)}")
        return None
        
    except Exception as e:
        logger.warning(f"Error loading CSV from S3: {str(e)}")
        return None


def load_json_from_local(file_path: str) -> Optional[Dict[str, Any]]:
    """
    Load JSON data from local file.
    
    Args:
        file_path: Local file path
        
    Returns:
        Dictionary with JSON data or None if error
    """
    try:
        logger.info(f"Falling back to local file: {file_path}")
        
        with open(file_path, 'r') as f:
            data = json.load(f)
        
        logger.info(f"Successfully loaded {file_path} from local filesystem")
        return data
        
    except FileNotFoundError:
        logger.error(f"Local file not found: {file_path}")
        return None
        
    except json.JSONDecodeError as e:
        logger.error(f"Invalid JSON in {file_path}: {str(e)}")
        return None
        
    except Exception as e:
        logger.error(f"Error loading local file: {str(e)}")
        return None


def load_csv_from_local(file_path: str) -> Optional[pd.DataFrame]:
    """
    Load CSV data from local file into pandas DataFrame.
    
    Args:
        file_path: Local file path
        
    Returns:
        pandas DataFrame or None if error
    """
    try:
        logger.info(f"Falling back to local CSV: {file_path}")
        
        df = pd.read_csv(file_path)
        
        logger.info(f"Successfully loaded {file_path} from local filesystem ({len(df)} rows)")
        return df
        
    except FileNotFoundError:
        logger.error(f"Local CSV file not found: {file_path}")
        return None
        
    except Exception as e:
        logger.error(f"Error loading local CSV: {str(e)}")
        return None


def load_json_with_fallback(
    local_path: str,
    s3_bucket: Optional[str] = None,
    s3_key: Optional[str] = None
) -> Optional[Dict[str, Any]]:
    """
    Load JSON data with S3-first approach and local fallback.
    
    Priority:
    1. Try S3 if bucket and key provided
    2. Fall back to local file
    
    Args:
        local_path: Local file path (fallback)
        s3_bucket: S3 bucket name (optional)
        s3_key: S3 object key (optional)
        
    Returns:
        Dictionary with JSON data or None if both fail
    """
    # Try S3 first if configured
    if s3_bucket and s3_key:
        data = load_json_from_s3(s3_bucket, s3_key)
        if data is not None:
            logger.info("Loaded data successfully from S3")
            return data
    
    # Fall back to local file
    return load_json_from_local(local_path)


def load_csv_with_fallback(
    local_path: str,
    s3_bucket: Optional[str] = None,
    s3_key: Optional[str] = None
) -> Optional[pd.DataFrame]:
    """
    Load CSV data with S3-first approach and local fallback.
    
    Priority:
    1. Try S3 if bucket and key provided
    2. Fall back to local file
    
    Args:
        local_path: Local file path (fallback)
        s3_bucket: S3 bucket name (optional)
        s3_key: S3 object key (optional)
        
    Returns:
        pandas DataFrame or None if both fail
    """
    # Try S3 first if configured
    if s3_bucket and s3_key:
        df = load_csv_from_s3(s3_bucket, s3_key)
        if df is not None:
            logger.info("Loaded dataset successfully from S3")
            return df
    
    # Fall back to local file
    return load_csv_from_local(local_path)


def get_s3_config() -> Dict[str, Optional[str]]:
    """
    Get S3 configuration from environment variables.
    
    Returns:
        Dictionary with S3 bucket name and enabled flag
    """
    return {
        'bucket': os.getenv('S3_BUCKET_NAME'),
        'enabled': os.getenv('S3_ENABLED', 'false').lower() == 'true'
    }


def is_s3_enabled() -> bool:
    """
    Check if S3 loading is enabled.
    
    Returns:
        True if S3 is enabled and configured
    """
    config = get_s3_config()
    return config['enabled'] and config['bucket'] is not None


def upload_json_to_s3(
    data: Dict[str, Any],
    bucket: str,
    key: str
) -> bool:
    """
    Upload JSON data to S3.
    
    Args:
        data: Dictionary to upload
        bucket: S3 bucket name
        key: S3 object key
        
    Returns:
        True if successful, False otherwise
    """
    try:
        s3_client = get_s3_client()
        
        if s3_client is None:
            logger.error("Cannot upload to S3: No S3 client available")
            return False
        
        # Convert to JSON string
        json_data = json.dumps(data, indent=2)
        
        # Upload to S3
        s3_client.put_object(
            Bucket=bucket,
            Key=key,
            Body=json_data.encode('utf-8'),
            ContentType='application/json'
        )
        
        logger.info(f"Successfully uploaded to S3: s3://{bucket}/{key}")
        return True
        
    except Exception as e:
        logger.error(f"Error uploading to S3: {str(e)}")
        return False


def list_s3_files(bucket: str, prefix: str = '') -> list:
    """
    List files in S3 bucket with given prefix.
    
    Args:
        bucket: S3 bucket name
        prefix: Key prefix to filter (optional)
        
    Returns:
        List of S3 object keys
    """
    try:
        s3_client = get_s3_client()
        
        if s3_client is None:
            return []
        
        response = s3_client.list_objects_v2(
            Bucket=bucket,
            Prefix=prefix
        )
        
        if 'Contents' not in response:
            return []
        
        return [obj['Key'] for obj in response['Contents']]
        
    except Exception as e:
        logger.error(f"Error listing S3 files: {str(e)}")
        return []


# ============================================================
# SIMPLIFIED HELPER FUNCTIONS FOR COMMON USE CASES
# ============================================================

def load_report(report_name: str) -> Optional[Dict[str, Any]]:
    """
    Simplified helper to load report JSON files.
    
    Automatically handles S3 and local paths for reports.
    
    Args:
        report_name: Name of the report file (e.g., "all_model_results.json")
        
    Returns:
        Dictionary with report data or None if not found
        
    Example:
        data = load_report("all_model_results.json")
    """
    config = get_s3_config()
    bucket = config['bucket'] if config['enabled'] else None
    local_path = f"reports/{report_name}"
    s3_key = f"reports/{report_name}" if bucket else None
    
    logger.info(f"Loading report: {report_name}")
    return load_json_with_fallback(local_path, bucket, s3_key)


def load_dataset(dataset_name: str) -> Optional[pd.DataFrame]:
    """
    Simplified helper to load dataset CSV files.
    
    Automatically handles S3 and local paths for datasets.
    
    Args:
        dataset_name: Name of the dataset file (e.g., "daily_sales.csv")
        
    Returns:
        pandas DataFrame or None if not found
        
    Example:
        df = load_dataset("daily_sales.csv")
    """
    config = get_s3_config()
    bucket = config['bucket'] if config['enabled'] else None
    local_path = f"data/{dataset_name}"
    s3_key = f"datasets/{dataset_name}" if bucket else None
    
    logger.info(f"Loading dataset: {dataset_name}")
    return load_csv_with_fallback(local_path, bucket, s3_key)
