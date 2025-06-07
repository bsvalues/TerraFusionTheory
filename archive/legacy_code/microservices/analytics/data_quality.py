
import pandas as pd
from typing import Dict, List, Tuple
import numpy as np

class DataQualityChecker:
    def __init__(self):
        self.required_columns = ['price', 'sqft', 'beds', 'baths', 'lot_size', 'year_built']
        self.numeric_columns = ['price', 'sqft', 'lot_size']
        
    def check_data_quality(self, data: pd.DataFrame) -> Tuple[bool, List[str]]:
        issues = []
        
        # Check required columns
        missing_cols = [col for col in self.required_columns if col not in data.columns]
        if missing_cols:
            issues.append(f"Missing required columns: {', '.join(missing_cols)}")
            
        # Check for nulls
        null_cols = data.columns[data.isnull().any()].tolist()
        if null_cols:
            issues.append(f"Null values found in columns: {', '.join(null_cols)}")
            
        # Check numeric values
        for col in self.numeric_columns:
            if col in data.columns:
                if (data[col] <= 0).any():
                    issues.append(f"Invalid values (<= 0) found in {col}")
                    
        # Check outliers
        for col in self.numeric_columns:
            if col in data.columns:
                q1 = data[col].quantile(0.25)
                q3 = data[col].quantile(0.75)
                iqr = q3 - q1
                outliers = data[(data[col] < (q1 - 1.5 * iqr)) | (data[col] > (q3 + 1.5 * iqr))][col]
                if len(outliers) > 0:
                    issues.append(f"Outliers detected in {col}: {len(outliers)} values")
                    
        return len(issues) == 0, issues
        
    def clean_data(self, data: pd.DataFrame) -> pd.DataFrame:
        clean_data = data.copy()
        
        # Handle missing values
        for col in self.required_columns:
            if col in clean_data.columns:
                if col in self.numeric_columns:
                    clean_data[col].fillna(clean_data[col].median(), inplace=True)
                else:
                    clean_data[col].fillna(clean_data[col].mode()[0], inplace=True)
                    
        # Remove outliers
        for col in self.numeric_columns:
            if col in clean_data.columns:
                q1 = clean_data[col].quantile(0.25)
                q3 = clean_data[col].quantile(0.75)
                iqr = q3 - q1
                clean_data = clean_data[
                    (clean_data[col] >= (q1 - 1.5 * iqr)) & 
                    (clean_data[col] <= (q3 + 1.5 * iqr))
                ]
                
        return clean_data
import pandas as pd
import numpy as np
from typing import Dict, List, Tuple

class DataQualityChecker:
    def __init__(self):
        self.anomaly_thresholds = {
            'price': {'min': 10000, 'max': 10000000},
            'square_feet': {'min': 200, 'max': 15000},
            'year_built': {'min': 1800, 'max': 2024}
        }
        
    def check_data_quality(self, data: pd.DataFrame) -> Dict[str, List[str]]:
        issues = {
            'missing_values': self._check_missing_values(data),
            'anomalies': self._check_anomalies(data),
            'consistency': self._check_data_consistency(data)
        }
        return issues
        
    def _check_missing_values(self, data: pd.DataFrame) -> List[str]:
        missing = data.isnull().sum()
        return [f"Column {col} has {count} missing values" 
                for col, count in missing.items() if count > 0]
                
    def _check_anomalies(self, data: pd.DataFrame) -> List[str]:
        issues = []
        for col, limits in self.anomaly_thresholds.items():
            if col in data.columns:
                outliers = data[
                    (data[col] < limits['min']) | 
                    (data[col] > limits['max'])
                ]
                if len(outliers) > 0:
                    issues.append(f"Found {len(outliers)} anomalies in {col}")
        return issues
        
    def _check_data_consistency(self, data: pd.DataFrame) -> List[str]:
        issues = []
        if 'price' in data.columns and 'square_feet' in data.columns:
            price_per_sqft = data['price'] / data['square_feet']
            if (price_per_sqft > 1000).any():
                issues.append("Unusually high price per square foot detected")
        return issues
