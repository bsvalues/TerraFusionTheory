"""
R-tree spatial indexing module for efficient spatial queries.

This module provides functions to create and query R-tree spatial indexes
for efficient spatial operations on property data.
"""

import os
import rtree
import numpy as np
import geopandas as gpd
from shapely.geometry import Point, Polygon, box
from typing import List, Dict, Tuple, Any, Optional, Union


class SpatialIndexManager:
    """Manager for R-tree spatial indexing of property and POI data."""
    
    def __init__(self, data_dir: str = './data'):
        """
        Initialize the spatial index manager.
        
        Args:
            data_dir: Directory to store index files
        """
        self.data_dir = data_dir
        self.indices = {}
        self._ensure_data_dir()
    
    def _ensure_data_dir(self):
        """Ensure the data directory exists."""
        if not os.path.exists(self.data_dir):
            os.makedirs(self.data_dir, exist_ok=True)
    
    def create_index(self, gdf: gpd.GeoDataFrame, name: str, overwrite: bool = False) -> rtree.index.Index:
        """
        Create a spatial index from a GeoDataFrame.
        
        Args:
            gdf: GeoDataFrame containing geometries to index
            name: Name of the index
            overwrite: Whether to overwrite existing index
            
        Returns:
            R-tree index object
        """
        index_path = os.path.join(self.data_dir, f"{name}_index")
        
        # Check if index already exists
        if os.path.exists(f"{index_path}.dat") and not overwrite:
            print(f"Loading existing index: {name}")
            idx = rtree.index.Index(index_path)
            self.indices[name] = idx
            return idx
        
        # Create a new index
        p = rtree.index.Property()
        p.dimension = 2
        p.buffering_capacity = 10
        idx = rtree.index.Index(index_path, properties=p)
        
        # Insert geometries into the index
        for i, row in gdf.iterrows():
            geom = row.geometry
            # Handle different geometry types
            if geom.geom_type == 'Point':
                bounds = (geom.x, geom.y, geom.x, geom.y)
            else:
                bounds = geom.bounds
            
            idx.insert(int(i), bounds, obj=i)
        
        self.indices[name] = idx
        return idx
    
    def query_index(self, 
                   name: str, 
                   bounds: Tuple[float, float, float, float], 
                   return_objects: bool = False
                   ) -> List[int]:
        """
        Query the spatial index to find objects within bounds.
        
        Args:
            name: Name of the index to query
            bounds: Bounds to query (minx, miny, maxx, maxy)
            return_objects: Whether to return the original objects
            
        Returns:
            List of matching object IDs
        """
        if name not in self.indices:
            raise ValueError(f"Index {name} not found. Create it first.")
        
        idx = self.indices[name]
        return list(idx.intersection(bounds, objects=return_objects))
    
    def nearest_neighbors(self, 
                         name: str, 
                         point: Tuple[float, float], 
                         num_neighbors: int = 5
                         ) -> List[int]:
        """
        Find the nearest neighbors to a point.
        
        Args:
            name: Name of the index to query
            point: The reference point (x, y)
            num_neighbors: Number of neighbors to return
            
        Returns:
            List of IDs of the nearest objects
        """
        if name not in self.indices:
            raise ValueError(f"Index {name} not found. Create it first.")
        
        idx = self.indices[name]
        # Create a small query rectangle around the point
        x, y = point
        bounds = (x-0.0001, y-0.0001, x+0.0001, y+0.0001)
        
        # Get all objects in the vicinity
        nearby_objects = list(idx.nearest(bounds, num_neighbors))
        return nearby_objects


class QuadTreeGrid:
    """Implementation of a quadtree grid for spatial aggregation and analysis."""
    
    def __init__(self, bounds: Tuple[float, float, float, float], max_depth: int = 5):
        """
        Initialize a quadtree grid.
        
        Args:
            bounds: Overall bounds (minx, miny, maxx, maxy)
            max_depth: Maximum depth of the quadtree
        """
        self.bounds = bounds
        self.max_depth = max_depth
        self.cells = {}
        self.init_grid()
    
    def init_grid(self):
        """Initialize the quadtree grid structure."""
        self._subdivide(self.bounds, 0, "0")
    
    def _subdivide(self, bounds: Tuple[float, float, float, float], depth: int, cell_id: str):
        """
        Recursively subdivide the grid.
        
        Args:
            bounds: Current cell bounds
            depth: Current depth
            cell_id: Current cell ID
        """
        # Add current cell
        minx, miny, maxx, maxy = bounds
        self.cells[cell_id] = {
            'bounds': bounds,
            'geometry': box(minx, miny, maxx, maxy),
            'depth': depth,
            'children': []
        }
        
        # Stop if max depth reached
        if depth >= self.max_depth:
            return
        
        # Calculate midpoints
        mid_x = (minx + maxx) / 2
        mid_y = (miny + maxy) / 2
        
        # Define the four quadrants
        quadrants = [
            ((minx, miny, mid_x, mid_y), f"{cell_id}0"),  # SW
            ((mid_x, miny, maxx, mid_y), f"{cell_id}1"),  # SE
            ((minx, mid_y, mid_x, maxy), f"{cell_id}2"),  # NW
            ((mid_x, mid_y, maxx, maxy), f"{cell_id}3"),  # NE
        ]
        
        # Subdivide each quadrant
        for quad_bounds, quad_id in quadrants:
            self._subdivide(quad_bounds, depth + 1, quad_id)
            self.cells[cell_id]['children'].append(quad_id)
    
    def point_to_cell(self, 
                      point: Tuple[float, float], 
                      max_depth: Optional[int] = None
                      ) -> str:
        """
        Find the cell ID containing a point at the specified depth.
        
        Args:
            point: Point coordinates (x, y)
            max_depth: Maximum depth to consider (defaults to self.max_depth)
            
        Returns:
            Cell ID at the specified depth
        """
        if max_depth is None:
            max_depth = self.max_depth
            
        x, y = point
        
        # Check if point is within overall bounds
        minx, miny, maxx, maxy = self.bounds
        if not (minx <= x <= maxx and miny <= y <= maxy):
            raise ValueError(f"Point {point} is outside grid bounds {self.bounds}")
        
        # Start with root cell
        cell_id = "0"
        
        # Navigate down the quadtree
        for depth in range(max_depth):
            # Get current cell bounds
            current_bounds = self.cells[cell_id]['bounds']
            minx, miny, maxx, maxy = current_bounds
            
            # Find quadrant
            mid_x = (minx + maxx) / 2
            mid_y = (miny + maxy) / 2
            
            if x < mid_x:
                if y < mid_y:
                    quadrant = "0"  # SW
                else:
                    quadrant = "2"  # NW
            else:
                if y < mid_y:
                    quadrant = "1"  # SE
                else:
                    quadrant = "3"  # NE
            
            cell_id = cell_id + quadrant
            
            # Check if we've reached a leaf node
            if cell_id not in self.cells:
                # Return parent
                return cell_id[:-1]
        
        return cell_id
    
    def get_cell_geometry(self, cell_id: str) -> Polygon:
        """
        Get the geometry for a cell.
        
        Args:
            cell_id: Cell ID
            
        Returns:
            Shapely polygon for the cell
        """
        if cell_id not in self.cells:
            raise ValueError(f"Cell {cell_id} not found")
            
        return self.cells[cell_id]['geometry']
    
    def aggregate_to_cells(self, 
                          gdf: gpd.GeoDataFrame, 
                          value_column: str, 
                          depth: int,
                          agg_func: str = 'mean'
                          ) -> gpd.GeoDataFrame:
        """
        Aggregate point data to grid cells.
        
        Args:
            gdf: GeoDataFrame with point geometries
            value_column: Column to aggregate
            depth: Depth of grid cells to use
            agg_func: Aggregation function ('mean', 'sum', 'count', 'median')
            
        Returns:
            GeoDataFrame with aggregated values per cell
        """
        # Create a new DataFrame to hold results
        result_data = []
        
        # Filter cells at the specified depth
        depth_cells = {k: v for k, v in self.cells.items() if len(k) == depth + 1}
        
        # Create function lookup
        agg_functions = {
            'mean': np.mean,
            'sum': np.sum,
            'count': len,
            'median': np.median,
            'min': np.min,
            'max': np.max
        }
        
        if agg_func not in agg_functions:
            raise ValueError(f"Unsupported aggregation function: {agg_func}")
        
        func = agg_functions[agg_func]
        
        # Process each cell
        for cell_id, cell_info in depth_cells.items():
            cell_geom = cell_info['geometry']
            
            # Find points within this cell
            mask = gdf.geometry.within(cell_geom)
            points_in_cell = gdf.loc[mask]
            
            # Skip empty cells
            if len(points_in_cell) == 0:
                continue
                
            # Aggregate the values
            agg_value = func(points_in_cell[value_column])
            
            # Store result
            result_data.append({
                'cell_id': cell_id,
                'geometry': cell_geom,
                'depth': depth,
                'point_count': len(points_in_cell),
                f'{value_column}_{agg_func}': agg_value
            })
        
        # Create GeoDataFrame from results
        result_gdf = gpd.GeoDataFrame(result_data, geometry='geometry')
        return result_gdf