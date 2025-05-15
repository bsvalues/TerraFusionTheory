"""
Spatial indexing package for efficient spatial queries and analysis.

This module provides R-tree and Quad-tree implementations for spatial indexing
of properties, POIs, and other spatial data.
"""

from .rtree_index import SpatialIndexManager, QuadTreeGrid

__all__ = ['SpatialIndexManager', 'QuadTreeGrid']