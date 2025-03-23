
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
