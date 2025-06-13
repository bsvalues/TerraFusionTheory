# TerraFusionTheory Spatial Module

This module provides advanced spatial feature engineering and spatial indexing utilities for property valuation and geospatial analytics.

## Key Components

- **engineer_features.py**: Implements `SpatialFeatureEngineer` for generating spatial features such as network centrality, viewshed analysis, and spatial lag variables. Integrates DEM and road network data.
- **indexing/rtree_index.py**: Provides `SpatialIndexManager` for efficient R-tree spatial indexing and `QuadTreeGrid` for spatial aggregation and analysis.

## Usage

### Feature Engineering Example
```python
from spatial.features.engineer_features import SpatialFeatureEngineer

engineer = SpatialFeatureEngineer(
    data_dir='./data',
    dem_path='./data/dem.tif',
    road_network_path='./data/roads.geojson'
)
engineer.load_dem()
engineer.load_road_network()
features = engineer.generate_features(property_gdf)
```

### Spatial Indexing Example
```python
from spatial.indexing.rtree_index import SpatialIndexManager

index_mgr = SpatialIndexManager(data_dir='./data')
index = index_mgr.create_index(property_gdf, name='properties')
results = list(index.intersection((xmin, ymin, xmax, ymax)))
```

## Dependencies
- geopandas
- shapely
- rasterio
- networkx
- rtree
- numpy
- pandas

Install with:
```sh
pip install geopandas shapely rasterio networkx rtree numpy pandas
```

## Extending
- Add new feature engineering methods to `SpatialFeatureEngineer`.
- Use `SpatialIndexManager` for efficient spatial queries.
- Use `QuadTreeGrid` for grid-based aggregation/analysis.

## Testing
Add test scripts or notebooks in the `tests/` directory for reproducibility and validation.
