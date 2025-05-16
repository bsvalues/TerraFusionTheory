#!/bin/bash
# TerraFusion Data Flow Script
# This script runs the CSV import and data connector utilities to get real data flowing through the system

echo "==== STARTING TERRAFUSION DATA FLOW PROCESS ===="

# Create output directory if it doesn't exist
mkdir -p output

# Set the environment variables for API keys (replace with your real API keys as needed)
export RAPIDAPI_KEY="451301875bmsh347cde0b3c6bf7ep1fad23jsn9f94e7d04b55"
export WEATHER_API_KEY="$RAPIDAPI_KEY"

# Step 1: Import CSV data
echo "1. Importing property data from CSV files..."
echo "---------------------------------------------"
# Import first CSV file
npx tsx scripts/import_csv_data.ts "./attached_assets/CMA_Spreadsheet (3).csv"

# Import second CSV file if needed
npx tsx scripts/import_csv_data.ts "./attached_assets/Titan_Analytics2.0 (1).csv"

# Step 2: Run data connectors
echo ""
echo "2. Running data connectors to fetch external data..."
echo "---------------------------------------------------"
npx tsx scripts/run_data_connectors.ts

# Step 3: Verify data was imported
echo ""
echo "3. Verifying data in database..."
echo "-------------------------------"
npx tsx scripts/verify_data.ts

echo ""
echo "==== DATA FLOW PROCESS COMPLETE ===="
echo "Check the output/ directory for generated data files"
echo "Check the database for imported data"