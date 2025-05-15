"""
Spatial feature engineering module for GAMA valuations.

This module provides functions to generate advanced spatial features
for property valuation models, including network centrality, viewshed
analysis, and spatial lag variables.
"""

import numpy as np
import pandas as pd
import geopandas as gpd
from shapely.geometry import Point, LineString
from typing import List, Dict, Optional, Union, Tuple, Any
import networkx as nx
from scipy.spatial import cKDTree
import rasterio
from rasterio.mask import mask
import os

from spatial.indexing.rtree_index import SpatialIndexManager, QuadTreeGrid


class SpatialFeatureEngineer:
    """Class for engineering spatial features for property valuations."""
    
    def __init__(self, 
                data_dir: str = './data',
                dem_path: Optional[str] = None,
                road_network_path: Optional[str] = None):
        """
        Initialize the spatial feature engineer.
        
        Args:
            data_dir: Directory for data storage
            dem_path: Path to Digital Elevation Model (DEM) raster
            road_network_path: Path to road network data
        """
        self.data_dir = data_dir
        self.dem_path = dem_path
        self.road_network_path = road_network_path
        self.spatial_index = SpatialIndexManager(data_dir)
        self._dem = None
        self._road_network = None
        self._road_graph = None
    
    def load_dem(self):
        """Load Digital Elevation Model (DEM) raster if available."""
        if self.dem_path and os.path.exists(self.dem_path):
            self._dem = rasterio.open(self.dem_path)
            return True
        return False
    
    def load_road_network(self):
        """Load and prepare road network for analysis."""
        if self.road_network_path and os.path.exists(self.road_network_path):
            # Load road network as GeoDataFrame
            self._road_network = gpd.read_file(self.road_network_path)
            
            # Create networkx graph
            G = nx.Graph()
            
            # Extract nodes and edges from linestrings
            for idx, row in self._road_network.iterrows():
                geom = row.geometry
                if isinstance(geom, LineString):
                    # Add nodes for start and end points
                    start = geom.coords[0]
                    end = geom.coords[-1]
                    
                    # Add nodes and edge with attributes
                    G.add_node(start, pos=start)
                    G.add_node(end, pos=end)
                    
                    # Calculate length as edge weight
                    length = geom.length
                    
                    # Add attributes from GeoDataFrame
                    attrs = {k: v for k, v in row.items() if k != 'geometry'}
                    attrs['length'] = length
                    
                    G.add_edge(start, end, **attrs)
            
            self._road_graph = G
            return True
        return False
    
    def engineer_spatial_features(self, 
                                 properties: gpd.GeoDataFrame,
                                 pois: Optional[gpd.GeoDataFrame] = None,
                                 network_centrality: bool = False,
                                 viewshed: bool = False,
                                 spatial_lag: bool = False,
                                 add_knn_features: bool = True,
                                 k: int = 5) -> gpd.GeoDataFrame:
        """
        Engineer spatial features for property data.
        
        Args:
            properties: GeoDataFrame of properties
            pois: GeoDataFrame of points of interest
            network_centrality: Whether to compute network centrality
            viewshed: Whether to compute viewshed metrics
            spatial_lag: Whether to compute spatial lag variables
            add_knn_features: Whether to add k-nearest neighbor features
            k: Number of neighbors to consider
            
        Returns:
            GeoDataFrame with engineered features added
        """
        # Create a copy to avoid modifying the original
        result = properties.copy()
        
        # Create spatial index for properties
        self.spatial_index.create_index(result, 'properties')
        
        # Add KNN features if requested
        if add_knn_features and pois is not None:
            result = self._add_knn_features(result, pois, k)
        
        # Add network centrality metrics if requested
        if network_centrality and self._road_graph is not None:
            result = self._add_network_centrality(result)
        
        # Add viewshed metrics if requested
        if viewshed and self._dem is not None:
            result = self._add_viewshed_metrics(result)
        
        # Add spatial lag variables if requested
        if spatial_lag:
            result = self._add_spatial_lag_variables(result)
        
        return result
    
    def _add_knn_features(self, 
                        properties: gpd.GeoDataFrame,
                        pois: gpd.GeoDataFrame,
                        k: int = 5) -> gpd.GeoDataFrame:
        """
        Add K-nearest neighbor features to properties.
        
        Args:
            properties: GeoDataFrame of properties
            pois: GeoDataFrame of points of interest
            k: Number of neighbors to consider
            
        Returns:
            GeoDataFrame with KNN features
        """
        # Group POIs by category
        if 'category' in pois.columns:
            poi_categories = pois['category'].unique()
            
            # Create spatial index for POIs
            self.spatial_index.create_index(pois, 'pois')
            
            # Extract coordinates for KD-tree
            property_coords = np.vstack(
                (properties.geometry.x, properties.geometry.y)
            ).T
            
            poi_coords = np.vstack((pois.geometry.x, pois.geometry.y)).T
            
            # Build KD-tree for efficient nearest neighbor search
            tree = cKDTree(poi_coords)
            
            # Find k nearest POIs for each property
            distances, indices = tree.query(property_coords, k=k)
            
            # Calculate distance to nearest POI of each category
            for category in poi_categories:
                cat_pois = pois[pois['category'] == category]
                
                if len(cat_pois) > 0:
                    cat_coords = np.vstack(
                        (cat_pois.geometry.x, cat_pois.geometry.y)
                    ).T
                    
                    cat_tree = cKDTree(cat_coords)
                    cat_distances, _ = cat_tree.query(property_coords, k=1)
                    
                    # Add as a new column
                    col_name = f"dist_nearest_{category.lower().replace(' ', '_')}"
                    properties[col_name] = cat_distances
            
            # Add mean and min distance to k-nearest POIs
            properties['mean_dist_k_nearest_pois'] = np.mean(distances, axis=1)
            properties['min_dist_nearest_poi'] = np.min(distances, axis=1)
            
            # Add POI density within buffer
            for buffer_dist in [100, 500, 1000]:  # meters
                properties[f'poi_density_{buffer_dist}m'] = [
                    self._count_pois_in_buffer(geom, pois, buffer_dist) / (np.pi * buffer_dist**2)
                    for geom in properties.geometry
                ]
        
        return properties
    
    def _count_pois_in_buffer(self, 
                            geom: Point, 
                            pois: gpd.GeoDataFrame, 
                            buffer_dist: float) -> int:
        """
        Count POIs within a buffer distance of a geometry.
        
        Args:
            geom: Geometry to buffer
            pois: GeoDataFrame of POIs
            buffer_dist: Buffer distance in meters
            
        Returns:
            Count of POIs within buffer
        """
        buffer = geom.buffer(buffer_dist)
        return sum(pois.geometry.intersects(buffer))
    
    def _add_network_centrality(self, properties: gpd.GeoDataFrame) -> gpd.GeoDataFrame:
        """
        Add network centrality metrics to properties.
        
        Args:
            properties: GeoDataFrame of properties
            
        Returns:
            GeoDataFrame with network centrality metrics
        """
        if self._road_graph is None:
            print("Road network not loaded. Skipping network centrality.")
            return properties
        
        # Calculate network centrality metrics
        closeness = nx.closeness_centrality(self._road_graph)
        betweenness = nx.betweenness_centrality(self._road_graph)
        
        # For each property, find the nearest network node and assign its centrality
        for idx, row in properties.iterrows():
            geom = row.geometry
            if not isinstance(geom, Point):
                continue
                
            # Find the nearest node in the road network
            nearest_node = self._find_nearest_node(geom)
            
            # Assign centrality metrics
            properties.at[idx, 'road_closeness_centrality'] = closeness.get(nearest_node, 0)
            properties.at[idx, 'road_betweenness_centrality'] = betweenness.get(nearest_node, 0)
        
        return properties
    
    def _find_nearest_node(self, point: Point) -> Tuple[float, float]:
        """
        Find the nearest node in the road network to a point.
        
        Args:
            point: Point to find nearest node for
            
        Returns:
            Coordinates of the nearest node
        """
        if self._road_graph is None:
            return None
            
        # Get point coordinates
        x, y = point.x, point.y
        
        # Get all node positions
        node_positions = nx.get_node_attributes(self._road_graph, 'pos')
        
        # Find the nearest node
        nearest_node = None
        min_dist = float('inf')
        
        for node, pos in node_positions.items():
            dist = ((pos[0] - x) ** 2 + (pos[1] - y) ** 2) ** 0.5
            if dist < min_dist:
                min_dist = dist
                nearest_node = node
        
        return nearest_node
    
    def _add_viewshed_metrics(self, properties: gpd.GeoDataFrame) -> gpd.GeoDataFrame:
        """
        Add viewshed metrics to properties.
        
        Args:
            properties: GeoDataFrame of properties
            
        Returns:
            GeoDataFrame with viewshed metrics
        """
        if self._dem is None:
            print("DEM not loaded. Skipping viewshed metrics.")
            return properties
        
        # For each property, calculate viewshed metrics
        for idx, row in properties.iterrows():
            geom = row.geometry
            if not isinstance(geom, Point):
                continue
                
            # Calculate viewshed
            viewshed_score = self._calculate_viewshed(geom)
            
            # Assign viewshed metrics
            properties.at[idx, 'viewshed_score'] = viewshed_score
        
        return properties
    
    def _calculate_viewshed(self, point: Point, radius: int = 1000) -> float:
        """
        Calculate viewshed score for a point.
        
        Args:
            point: Point to calculate viewshed for
            radius: Radius to consider in meters
            
        Returns:
            Viewshed score (0-1)
        """
        if self._dem is None:
            return 0
            
        try:
            # Create a circular buffer around the point
            buffer = point.buffer(radius)
            
            # Mask the DEM with the buffer
            out_image, out_transform = mask(self._dem, [buffer], crop=True)
            
            # Extract elevation data
            elevation_data = out_image[0]
            
            # Get elevation at the point
            point_elevation = self._get_point_elevation(point)
            
            # Calculate visibility (simplified)
            visible_cells = np.sum(elevation_data < point_elevation)
            total_cells = np.sum(~np.isnan(elevation_data))
            
            if total_cells == 0:
                return 0
                
            # Calculate viewshed score (0-1)
            viewshed_score = visible_cells / total_cells
            
            return viewshed_score
        
        except Exception as e:
            print(f"Error calculating viewshed: {e}")
            return 0
    
    def _get_point_elevation(self, point: Point) -> float:
        """
        Get elevation at a point from the DEM.
        
        Args:
            point: Point to get elevation for
            
        Returns:
            Elevation in meters
        """
        if self._dem is None:
            return 0
            
        try:
            # Get pixel coordinates
            row, col = self._dem.index(point.x, point.y)
            
            # Get elevation value
            elevation = self._dem.read(1)[row, col]
            
            return float(elevation)
        
        except Exception as e:
            print(f"Error getting point elevation: {e}")
            return 0
    
    def _add_spatial_lag_variables(self, properties: gpd.GeoDataFrame) -> gpd.GeoDataFrame:
        """
        Add spatial lag variables to properties.
        
        Args:
            properties: GeoDataFrame of properties
            
        Returns:
            GeoDataFrame with spatial lag variables
        """
        # Check if 'price' column exists
        if 'price' not in properties.columns:
            print("Price column not found. Skipping spatial lag variables.")
            return properties
        
        # Create spatial weights matrix
        weights = self._create_spatial_weights(properties, k=5)
        
        # Calculate spatial lag of price
        properties['price_spatial_lag'] = self._calculate_spatial_lag(
            properties['price'], weights
        )
        
        return properties
    
    def _create_spatial_weights(self, 
                              gdf: gpd.GeoDataFrame, 
                              k: int = 5) -> List[List[float]]:
        """
        Create spatial weights matrix.
        
        Args:
            gdf: GeoDataFrame of properties
            k: Number of neighbors to consider
            
        Returns:
            Spatial weights matrix
        """
        n = len(gdf)
        weights = [[0] * n for _ in range(n)]
        
        # Extract coordinates
        coords = np.vstack((gdf.geometry.x, gdf.geometry.y)).T
        
        # Build KD-tree
        tree = cKDTree(coords)
        
        # Find k nearest neighbors for each point
        for i in range(n):
            distances, indices = tree.query(coords[i], k=k+1)  # +1 to include self
            
            # Exclude self
            distances = distances[1:]
            indices = indices[1:]
            
            # Calculate inverse distance weights
            if np.sum(distances) > 0:
                inv_distances = 1 / distances
                weights_sum = np.sum(inv_distances)
                
                if weights_sum > 0:
                    for j, idx in enumerate(indices):
                        weights[i][idx] = inv_distances[j] / weights_sum
        
        return weights
    
    def _calculate_spatial_lag(self, 
                             values: pd.Series, 
                             weights: List[List[float]]) -> pd.Series:
        """
        Calculate spatial lag of a variable.
        
        Args:
            values: Series of values
            weights: Spatial weights matrix
            
        Returns:
            Series of spatial lag values
        """
        n = len(values)
        spatial_lag = np.zeros(n)
        
        for i in range(n):
            spatial_lag[i] = np.sum(weights[i] * values)
        
        return pd.Series(spatial_lag, index=values.index)