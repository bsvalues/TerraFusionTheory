
import pytest
import pandas as pd
import numpy as np
from microservices.analytics.market_predictor import MarketPredictor

@pytest.fixture
def sample_data():
    return pd.DataFrame({
        'price': np.random.uniform(100000, 1000000, 100),
        'square_feet': np.random.uniform(1000, 5000, 100),
        'year_built': np.random.randint(1950, 2024, 100),
        'last_renovation': np.random.randint(1990, 2024, 100),
        'walkability_score': np.random.uniform(0, 100, 100),
        'school_rating': np.random.uniform(0, 10, 100),
        'crime_safety_score': np.random.uniform(0, 100, 100)
    })

def test_market_predictor_training(sample_data):
    predictor = MarketPredictor()
    predictor.train(sample_data)
    
    # Test predictions
    predictions = predictor.predict(sample_data)
    assert len(predictions) == len(sample_data)
    assert all(isinstance(x, (int, float)) for x in predictions)
    
def test_feature_engineering(sample_data):
    predictor = MarketPredictor()
    predictor._engineer_features(sample_data)
    
    assert predictor.features is not None
    assert not predictor.features.isnull().any().any()

def test_location_score_calculation(sample_data):
    predictor = MarketPredictor()
    scores = predictor._calculate_location_score(sample_data)
    
    assert len(scores) == len(sample_data)
    assert all((0 <= score <= 100) for score in scores)
