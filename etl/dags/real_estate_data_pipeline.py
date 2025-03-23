"""
Real Estate Data Pipeline

This DAG handles the extraction, transformation, and loading of real estate data
from various sources into our data warehouse.

It orchestrates:
1. Data extraction from MLS, tax records, and other sources
2. Data cleaning and transformation
3. Geocoding and spatial enrichment
4. Loading into our PostgreSQL database
5. Generation of market analytics
"""

from datetime import datetime, timedelta
from airflow import DAG
from airflow.operators.python import PythonOperator
from airflow.operators.bash import BashOperator
from airflow.providers.http.operators.http import SimpleHttpOperator
from airflow.providers.sqlite.operators.sqlite import SqliteOperator
from airflow.utils.dates import days_ago
import json
import os
import sys

# Add the project root to the path for imports
sys.path.append('/home/runner/${REPL_SLUG}')

# Import custom modules
try:
    from microservices.common.db_init import PropertyListing, DataSource, DataFetchLog, ETLJob
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker
    import pandas as pd
except ImportError as e:
    print(f"Error importing modules: {e}")

# Define default arguments for the DAG
default_args = {
    'owner': 'airflow',
    'depends_on_past': False,
    'start_date': days_ago(1),
    'email_on_failure': False,
    'email_on_retry': False,
    'retries': 1,
    'retry_delay': timedelta(minutes=5),
}

# Create the DAG
dag = DAG(
    'real_estate_data_pipeline',
    default_args=default_args,
    description='ETL pipeline for real estate data',
    schedule_interval=timedelta(hours=1),
    catchup=False,
)

# Task functions
def fetch_mls_data(**context):
    """Fetch data from MLS source(s)"""
    try:
        # Get database connection
        db_url = os.environ.get('DATABASE_URL')
        if not db_url:
            raise EnvironmentError("DATABASE_URL environment variable not set")
        
        engine = create_engine(db_url)
        Session = sessionmaker(bind=engine)
        session = Session()
        
        # Record ETL job start
        etl_job = ETLJob(
            job_name="fetch_mls_data",
            start_time=datetime.utcnow(),
            status="running",
            records_processed=0
        )
        session.add(etl_job)
        session.commit()
        
        # Get MLS data sources
        mls_sources = session.query(DataSource).filter(
            DataSource.source_type == 'mls',
            DataSource.is_active == True
        ).all()
        
        if not mls_sources:
            print("No active MLS data sources found")
            
            etl_job.end_time = datetime.utcnow()
            etl_job.status = "completed"
            etl_job.details_json = json.dumps({"message": "No active MLS data sources found"})
            session.commit()
            
            return "No active MLS data sources"
        
        total_records = 0
        
        # Process each MLS source
        for source in mls_sources:
            print(f"Fetching data from {source.name}")
            
            # Create fetch log
            fetch_log = DataFetchLog(
                source_id=source.id,
                start_time=datetime.utcnow(),
                status="running"
            )
            session.add(fetch_log)
            session.commit()
            
            try:
                # Here we would make API calls to the actual MLS service
                # For now, we'll log that we would make this call
                print(f"Would make API call to {source.url} with config: {source.config_json}")
                
                # Instead of actual API call, we're logging the intent
                records = []
                records_fetched = 0
                
                # Update fetch log with success
                fetch_log.end_time = datetime.utcnow()
                fetch_log.status = "success"
                fetch_log.records_fetched = records_fetched
                fetch_log.details_json = json.dumps({
                    "message": "Test execution log - would fetch data in production"
                })
                
                # Update source with last fetch date
                source.last_fetch_date = datetime.utcnow()
                
                total_records += records_fetched
                
            except Exception as e:
                # Update fetch log with error
                fetch_log.end_time = datetime.utcnow()
                fetch_log.status = "failed"
                fetch_log.error_message = str(e)
                
                print(f"Error fetching data from {source.name}: {e}")
            
            session.commit()
        
        # Update ETL job record
        etl_job.end_time = datetime.utcnow()
        etl_job.status = "success"
        etl_job.records_processed = total_records
        etl_job.details_json = json.dumps({
            "sources_processed": len(mls_sources),
            "total_records": total_records
        })
        
        session.commit()
        session.close()
        
        return f"Processed {len(mls_sources)} MLS sources with {total_records} total records"
        
    except Exception as e:
        print(f"Error in fetch_mls_data task: {e}")
        
        # Try to update ETL job if possible
        try:
            etl_job.end_time = datetime.utcnow()
            etl_job.status = "failed"
            etl_job.error_message = str(e)
            session.commit()
            session.close()
        except:
            pass
        
        raise


def fetch_tax_data(**context):
    """Fetch data from tax record sources"""
    try:
        # Get database connection
        db_url = os.environ.get('DATABASE_URL')
        if not db_url:
            raise EnvironmentError("DATABASE_URL environment variable not set")
        
        engine = create_engine(db_url)
        Session = sessionmaker(bind=engine)
        session = Session()
        
        # Record ETL job start
        etl_job = ETLJob(
            job_name="fetch_tax_data",
            start_time=datetime.utcnow(),
            status="running",
            records_processed=0
        )
        session.add(etl_job)
        session.commit()
        
        # Get tax data sources
        tax_sources = session.query(DataSource).filter(
            DataSource.source_type == 'tax',
            DataSource.is_active == True
        ).all()
        
        if not tax_sources:
            print("No active tax record data sources found")
            
            etl_job.end_time = datetime.utcnow()
            etl_job.status = "completed"
            etl_job.details_json = json.dumps({"message": "No active tax data sources found"})
            session.commit()
            
            return "No active tax data sources"
        
        total_records = 0
        
        # Process each tax source
        for source in tax_sources:
            print(f"Fetching data from {source.name}")
            
            # Create fetch log
            fetch_log = DataFetchLog(
                source_id=source.id,
                start_time=datetime.utcnow(),
                status="running"
            )
            session.add(fetch_log)
            session.commit()
            
            try:
                # Here we would make API calls to the tax record service
                # For now, we'll log that we would make this call
                print(f"Would make API call to {source.url} with config: {source.config_json}")
                
                # Instead of actual API call, we're logging the intent
                records_fetched = 0
                
                # Update fetch log with success
                fetch_log.end_time = datetime.utcnow()
                fetch_log.status = "success"
                fetch_log.records_fetched = records_fetched
                fetch_log.details_json = json.dumps({
                    "message": "Test execution log - would fetch tax data in production"
                })
                
                # Update source with last fetch date
                source.last_fetch_date = datetime.utcnow()
                
                total_records += records_fetched
                
            except Exception as e:
                # Update fetch log with error
                fetch_log.end_time = datetime.utcnow()
                fetch_log.status = "failed"
                fetch_log.error_message = str(e)
                
                print(f"Error fetching data from {source.name}: {e}")
            
            session.commit()
        
        # Update ETL job record
        etl_job.end_time = datetime.utcnow()
        etl_job.status = "success"
        etl_job.records_processed = total_records
        etl_job.details_json = json.dumps({
            "sources_processed": len(tax_sources),
            "total_records": total_records
        })
        
        session.commit()
        session.close()
        
        return f"Processed {len(tax_sources)} tax sources with {total_records} total records"
        
    except Exception as e:
        print(f"Error in fetch_tax_data task: {e}")
        
        # Try to update ETL job if possible
        try:
            etl_job.end_time = datetime.utcnow()
            etl_job.status = "failed"
            etl_job.error_message = str(e)
            session.commit()
            session.close()
        except:
            pass
        
        raise


def geocode_properties(**context):
    """Geocode properties and enrich with spatial data"""
    try:
        # Get database connection
        db_url = os.environ.get('DATABASE_URL')
        if not db_url:
            raise EnvironmentError("DATABASE_URL environment variable not set")
        
        engine = create_engine(db_url)
        Session = sessionmaker(bind=engine)
        session = Session()
        
        # Record ETL job start
        etl_job = ETLJob(
            job_name="geocode_properties",
            start_time=datetime.utcnow(),
            status="running",
            records_processed=0
        )
        session.add(etl_job)
        session.commit()
        
        # Get properties that need geocoding (missing lat/long)
        properties_to_geocode = session.query(PropertyListing).filter(
            (PropertyListing.latitude.is_(None)) | 
            (PropertyListing.longitude.is_(None))
        ).limit(100).all()  # Process in batches
        
        if not properties_to_geocode:
            print("No properties found that need geocoding")
            
            etl_job.end_time = datetime.utcnow()
            etl_job.status = "completed"
            etl_job.details_json = json.dumps({"message": "No properties need geocoding"})
            session.commit()
            
            return "No properties need geocoding"
        
        print(f"Found {len(properties_to_geocode)} properties that need geocoding")
        
        # Here we would connect to a geocoding service
        # For example, we might use OpenStreetMap Nominatim, Google Geocoding API, etc.
        # For now, we'll log the intent
        
        properties_geocoded = 0
        
        # Update ETL job record
        etl_job.end_time = datetime.utcnow()
        etl_job.status = "success"
        etl_job.records_processed = properties_geocoded
        etl_job.details_json = json.dumps({
            "properties_geocoded": properties_geocoded
        })
        
        session.commit()
        session.close()
        
        return f"Geocoded {properties_geocoded} properties"
        
    except Exception as e:
        print(f"Error in geocode_properties task: {e}")
        
        # Try to update ETL job if possible
        try:
            etl_job.end_time = datetime.utcnow()
            etl_job.status = "failed"
            etl_job.error_message = str(e)
            session.commit()
            session.close()
        except:
            pass
        
        raise


def generate_market_metrics(**context):
    """Generate market metrics from the property data"""
    try:
        # Get database connection
        db_url = os.environ.get('DATABASE_URL')
        if not db_url:
            raise EnvironmentError("DATABASE_URL environment variable not set")
        
        engine = create_engine(db_url)
        Session = sessionmaker(bind=engine)
        session = Session()
        
        # Record ETL job start
        etl_job = ETLJob(
            job_name="generate_market_metrics",
            start_time=datetime.utcnow(),
            status="running",
            records_processed=0
        )
        session.add(etl_job)
        session.commit()
        
        # Here we would calculate market metrics by area (zip, city, etc.)
        # For now, we'll log the intent
        print("Would calculate market metrics here")
        
        # Update ETL job record
        etl_job.end_time = datetime.utcnow()
        etl_job.status = "success"
        etl_job.records_processed = 0
        etl_job.details_json = json.dumps({
            "metrics_generated": 0
        })
        
        session.commit()
        session.close()
        
        return "Generated market metrics"
        
    except Exception as e:
        print(f"Error in generate_market_metrics task: {e}")
        
        # Try to update ETL job if possible
        try:
            etl_job.end_time = datetime.utcnow()
            etl_job.status = "failed"
            etl_job.error_message = str(e)
            session.commit()
            session.close()
        except:
            pass
        
        raise


# Define the tasks
fetch_mls_task = PythonOperator(
    task_id='fetch_mls_data',
    python_callable=fetch_mls_data,
    provide_context=True,
    dag=dag,
)

fetch_tax_task = PythonOperator(
    task_id='fetch_tax_data',
    python_callable=fetch_tax_data,
    provide_context=True,
    dag=dag,
)

geocode_task = PythonOperator(
    task_id='geocode_properties',
    python_callable=geocode_properties,
    provide_context=True,
    dag=dag,
)

market_metrics_task = PythonOperator(
    task_id='generate_market_metrics',
    python_callable=generate_market_metrics,
    provide_context=True,
    dag=dag,
)

# Define task dependencies
fetch_mls_task >> geocode_task
fetch_tax_task >> geocode_task
geocode_task >> market_metrics_task