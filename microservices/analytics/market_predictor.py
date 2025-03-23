
from prophet import Prophet
import pandas as pd
from typing import Dict, List

class MarketPredictor:
    def __init__(self):
        self.model = Prophet(
            changepoint_prior_scale=0.05,
            seasonality_prior_scale=10.0
        )
        
    def train(self, historical_data: pd.DataFrame):
        df = pd.DataFrame({
            'ds': historical_data['date'],
            'y': historical_data['price']
        })
        self.model.fit(df)
        
    def predict(self, periods: int = 30) -> Dict[str, List]:
        future = self.model.make_future_dataframe(periods=periods)
        forecast = self.model.predict(future)
        
        return {
            'dates': forecast['ds'].tail(periods).tolist(),
            'predictions': forecast['yhat'].tail(periods).tolist(),
            'lower_bound': forecast['yhat_lower'].tail(periods).tolist(),
            'upper_bound': forecast['yhat_upper'].tail(periods).tolist()
        }
