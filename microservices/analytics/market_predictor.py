
from prophet import Prophet
import pandas as pd
from typing import Dict, List

class MarketPredictor:
    def __init__(self):
        self.price_model = Prophet(changepoint_prior_scale=0.05, seasonality_prior_scale=10.0)
        self.inventory_model = Prophet(changepoint_prior_scale=0.05, seasonality_prior_scale=10.0)
        self.dom_model = Prophet(changepoint_prior_scale=0.05, seasonality_prior_scale=10.0)
        
    def train(self, historical_data: pd.DataFrame):
        price_df = pd.DataFrame({
            'ds': historical_data['date'],
            'y': historical_data['price']
        })
        inventory_df = pd.DataFrame({
            'ds': historical_data['date'],
            'y': historical_data['inventory']
        })
        dom_df = pd.DataFrame({
            'ds': historical_data['date'],
            'y': historical_data['days_on_market']
        })
        
        self.price_model.fit(price_df)
        self.inventory_model.fit(inventory_df)
        self.dom_model.fit(dom_df)
        
    def calculate_confidence(self, forecast_df: pd.DataFrame, periods: int) -> float:
        recent_volatility = forecast_df['yhat'].tail(periods).std()
        prediction_range = (forecast_df['yhat_upper'] - forecast_df['yhat_lower']).tail(periods).mean()
        base_confidence = 0.9
        volatility_impact = min(recent_volatility / prediction_range, 0.3)
        time_decay = periods / 365 * 0.2
        return max(0.1, base_confidence - volatility_impact - time_decay)
        
    def predict(self, periods: int = 30) -> Dict[str, any]:
        future = self.price_model.make_future_dataframe(periods=periods)
        price_forecast = self.price_model.predict(future)
        inventory_forecast = self.inventory_model.predict(future)
        dom_forecast = self.dom_model.predict(future)
        
        return {
            'dates': price_forecast['ds'].tail(periods).tolist(),
            'price': {
                'predictions': price_forecast['yhat'].tail(periods).tolist(),
                'lower_bound': price_forecast['yhat_lower'].tail(periods).tolist(),
                'upper_bound': price_forecast['yhat_upper'].tail(periods).tolist(),
                'confidence': self.calculate_confidence(price_forecast, periods)
            },
            'inventory': {
                'predictions': inventory_forecast['yhat'].tail(periods).tolist(),
                'lower_bound': inventory_forecast['yhat_lower'].tail(periods).tolist(),
                'upper_bound': inventory_forecast['yhat_upper'].tail(periods).tolist(),
                'confidence': self.calculate_confidence(inventory_forecast, periods)
            },
            'days_on_market': {
                'predictions': dom_forecast['yhat'].tail(periods).tolist(),
                'lower_bound': dom_forecast['yhat_lower'].tail(periods).tolist(),
                'upper_bound': dom_forecast['yhat_upper'].tail(periods).tolist(),
                'confidence': self.calculate_confidence(dom_forecast, periods)
            }
        }
