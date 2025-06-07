
import mlflow
import pandas as pd
from typing import Dict, Any
import os

class MLflowTracker:
    def __init__(self):
        mlflow.set_tracking_uri("sqlite:///mlflow.db")
        self.experiment_name = "real_estate_predictions"
        
    def start_run(self, run_name: str) -> None:
        mlflow.set_experiment(self.experiment_name)
        mlflow.start_run(run_name=run_name)
        
    def log_params(self, params: Dict[str, Any]) -> None:
        for key, value in params.items():
            mlflow.log_param(key, value)
            
    def log_metrics(self, metrics: Dict[str, float]) -> None:
        for key, value in metrics.items():
            mlflow.log_metric(key, value)
            
    def end_run(self) -> None:
        mlflow.end_run()
        
    def log_model(self, model, name: str) -> None:
        mlflow.sklearn.log_model(model, name)
