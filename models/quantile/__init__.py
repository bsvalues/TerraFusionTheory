"""
Quantile regression module for uncertainty estimation.

This module provides quantile regression models for estimating
prediction intervals and uncertainty in property valuations.
"""

from .quantile_model import QuantileGradientBoostingModel

__all__ = ['QuantileGradientBoostingModel']