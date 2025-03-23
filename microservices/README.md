# IntelligentEstate Microservices

This directory contains the microservices that power the IntelligentEstate real estate analytics platform.

## Architecture Overview

The platform uses a microservices architecture with the following services:

1. **Property Service** (`property/app.py`): Manages property listings, valuations, and basic property data
2. **Market Service** (`market/app.py`): Provides market analytics, trends, and metrics
3. **Spatial Service** (`spatial/app.py`): Handles geospatial operations, mapping, and location-based queries
4. **Analytics Service** (`analytics/app.py`): Offers ML predictions and advanced analytics

Each service is a separate FastAPI application that can be deployed and scaled independently.

## Database Setup

The platform uses PostgreSQL for data storage. Before running the microservices, you need to set up the database:

```bash
# Set the DATABASE_URL environment variable
export DATABASE_URL='postgresql://username:password@localhost:5432/intelligentestate'

# Initialize the database
python init_database.py
```

## Running the Microservices

There are two ways to run the microservices:

### 1. All at once using the launcher

```bash
# Run all services
python launch.py

# Run specific services
python launch.py --services property market
```

### 2. Individually for development

```bash
# Run property service
cd property
uvicorn app:app --host 0.0.0.0 --port 8001 --reload

# Run market service
cd market
uvicorn app:app --host 0.0.0.0 --port 8002 --reload

# Run spatial service
cd spatial
uvicorn app:app --host 0.0.0.0 --port 8003 --reload

# Run analytics service
cd analytics
uvicorn app:app --host 0.0.0.0 --port 8004 --reload
```

## API Documentation

Each microservice provides its own Swagger documentation at the `/docs` endpoint:

- Property Service: http://localhost:8001/docs
- Market Service: http://localhost:8002/docs
- Spatial Service: http://localhost:8003/docs
- Analytics Service: http://localhost:8004/docs

## Environment Variables

The following environment variables are used:

- `DATABASE_URL`: PostgreSQL connection string (required)
- `LOG_LEVEL`: Logging level (optional, default: INFO)
- `ENABLE_CORS`: Whether to enable CORS (optional, default: true)
- `API_KEY`: API key for authentication (optional)

## Development

### Adding a New Microservice

1. Create a new directory for your service: `mkdir my_service`
2. Create an app.py file with your FastAPI application
3. Register your service in `run_services.py` by adding it to the `MICROSERVICES` dictionary
4. Update the database schema in `common/db_init.py` if needed

### Database Schema

The database schema is defined in `common/db_init.py`. If you need to modify the schema:

1. Update the SQLAlchemy models in `common/db_init.py`
2. Run `python init_database.py --force` to recreate the tables (this will delete existing data)

## Data ETL

Data ingestion is handled by Airflow DAGs in the `etl/dags` directory. To set up the ETL pipeline:

```bash
cd ../etl
export AIRFLOW_HOME=$(pwd)
airflow db init
airflow scheduler
```

## Testing

To test the microservices:

```bash
# Install test dependencies
pip install pytest pytest-asyncio httpx

# Run tests
pytest tests/
```