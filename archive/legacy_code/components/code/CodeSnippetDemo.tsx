import React from 'react';
import CodeSnippetTheater, { CodeLine, CodeStep } from './CodeSnippetTheater';
import { Card } from '@/components/ui/card';

const CodeSnippetDemo = () => {
  // Example 1: JavaScript Sorting Algorithm
  const jsSortingAlgorithmLines: CodeLine[] = [
    { lineNumber: 1, indent: 0, code: "function bubbleSort(arr) {", isComment: false },
    { lineNumber: 2, indent: 1, code: "// Bubble sort implementation", isComment: true },
    { lineNumber: 3, indent: 1, code: "let swapped;", isComment: false },
    { lineNumber: 4, indent: 1, code: "", isComment: false },
    { lineNumber: 5, indent: 1, code: "do {", isComment: false },
    { lineNumber: 6, indent: 2, code: "swapped = false;", isComment: false },
    { lineNumber: 7, indent: 2, code: "", isComment: false },
    { lineNumber: 8, indent: 2, code: "for (let i = 0; i < arr.length - 1; i++) {", isComment: false },
    { lineNumber: 9, indent: 3, code: "if (arr[i] > arr[i + 1]) {", isComment: false },
    { lineNumber: 10, indent: 4, code: "// Swap elements", isComment: true },
    { lineNumber: 11, indent: 4, code: "let temp = arr[i];", isComment: false },
    { lineNumber: 12, indent: 4, code: "arr[i] = arr[i + 1];", isComment: false },
    { lineNumber: 13, indent: 4, code: "arr[i + 1] = temp;", isComment: false },
    { lineNumber: 14, indent: 4, code: "swapped = true;", isComment: false },
    { lineNumber: 15, indent: 3, code: "}", isComment: false },
    { lineNumber: 16, indent: 2, code: "}", isComment: false },
    { lineNumber: 17, indent: 1, code: "} while (swapped);", isComment: false },
    { lineNumber: 18, indent: 1, code: "", isComment: false },
    { lineNumber: 19, indent: 1, code: "return arr;", isComment: false },
    { lineNumber: 20, indent: 0, code: "}", isComment: false },
    { lineNumber: 21, indent: 0, code: "", isComment: false },
    { lineNumber: 22, indent: 0, code: "// Test the function", isComment: true },
    { lineNumber: 23, indent: 0, code: "const numbers = [64, 34, 25, 12, 22, 11, 90];", isComment: false },
    { lineNumber: 24, indent: 0, code: "console.log(bubbleSort(numbers));", isComment: false },
  ];

  const jsSortingAlgorithmSteps: CodeStep[] = [
    {
      id: 1,
      title: "Function Declaration",
      description: "Define a function named bubbleSort that takes an array as input.",
      highlightLines: [1],
      variables: {}
    },
    {
      id: 2,
      title: "Initialize Variables",
      description: "Create a variable 'swapped' that will track if any elements were swapped during a pass.",
      highlightLines: [3],
      variables: { arr: [64, 34, 25, 12, 22, 11, 90], swapped: undefined }
    },
    {
      id: 3,
      title: "Start Do-While Loop",
      description: "Begin a do-while loop that will continue until no swaps are needed.",
      highlightLines: [5],
      variables: { arr: [64, 34, 25, 12, 22, 11, 90], swapped: undefined }
    },
    {
      id: 4,
      title: "Reset Swapped Flag",
      description: "Set swapped to false at the beginning of each pass through the array.",
      highlightLines: [6],
      variables: { arr: [64, 34, 25, 12, 22, 11, 90], swapped: false }
    },
    {
      id: 5,
      title: "Start Inner Loop",
      description: "Create a for loop to iterate through the array elements.",
      highlightLines: [8],
      variables: { arr: [64, 34, 25, 12, 22, 11, 90], swapped: false, i: 0 }
    },
    {
      id: 6,
      title: "Compare Adjacent Elements",
      description: "Check if the current element is greater than the next element.",
      highlightLines: [9],
      variables: { arr: [64, 34, 25, 12, 22, 11, 90], swapped: false, i: 0, "arr[i]": 64, "arr[i+1]": 34 }
    },
    {
      id: 7,
      title: "Swap Elements if Needed",
      description: "If the current element is greater, swap it with the next element using a temporary variable.",
      highlightLines: [11, 12, 13, 14],
      variables: { arr: [64, 34, 25, 12, 22, 11, 90], swapped: false, i: 0, temp: 64, "arr[i]": 64, "arr[i+1]": 34 },
      output: "Before swap: [64, 34, 25, 12, 22, 11, 90]\nAfter swap: [34, 64, 25, 12, 22, 11, 90]"
    },
    {
      id: 8,
      title: "Mark as Swapped",
      description: "Set the swapped flag to true to indicate that a swap occurred.",
      highlightLines: [14],
      variables: { arr: [34, 64, 25, 12, 22, 11, 90], swapped: true, i: 0 }
    },
    {
      id: 9,
      title: "Continue Inner Loop",
      description: "Move to the next pair of elements in the array.",
      highlightLines: [8],
      variables: { arr: [34, 64, 25, 12, 22, 11, 90], swapped: true, i: 1 }
    },
    {
      id: 10,
      title: "Complete First Pass",
      description: "After a complete pass through the array, continue the outer loop if any swaps were made.",
      highlightLines: [17],
      variables: { arr: [34, 25, 12, 22, 11, 64, 90], swapped: true }
    },
    {
      id: 11,
      title: "Final Result",
      description: "When no swaps are needed on a complete pass, the array is sorted.",
      highlightLines: [19],
      variables: { arr: [11, 12, 22, 25, 34, 64, 90], swapped: false },
      output: "Final sorted array: [11, 12, 22, 25, 34, 64, 90]"
    }
  ];

  // Example 2: Python Data Analysis
  const pythonDataAnalysisLines: CodeLine[] = [
    { lineNumber: 1, indent: 0, code: "import pandas as pd", isComment: false },
    { lineNumber: 2, indent: 0, code: "import matplotlib.pyplot as plt", isComment: false },
    { lineNumber: 3, indent: 0, code: "", isComment: false },
    { lineNumber: 4, indent: 0, code: "# Load the dataset", isComment: true },
    { lineNumber: 5, indent: 0, code: "df = pd.read_csv('real_estate_data.csv')", isComment: false },
    { lineNumber: 6, indent: 0, code: "", isComment: false },
    { lineNumber: 7, indent: 0, code: "# Basic data exploration", isComment: true },
    { lineNumber: 8, indent: 0, code: "print(df.head())", isComment: false },
    { lineNumber: 9, indent: 0, code: "print(df.describe())", isComment: false },
    { lineNumber: 10, indent: 0, code: "", isComment: false },
    { lineNumber: 11, indent: 0, code: "# Clean the data", isComment: true },
    { lineNumber: 12, indent: 0, code: "df = df.dropna(subset=['price', 'bedrooms', 'bathrooms', 'sqft'])", isComment: false },
    { lineNumber: 13, indent: 0, code: "", isComment: false },
    { lineNumber: 14, indent: 0, code: "# Filter properties", isComment: true },
    { lineNumber: 15, indent: 0, code: "filtered_df = df[(df['price'] > 100000) & (df['price'] < 1000000)]", isComment: false },
    { lineNumber: 16, indent: 0, code: "", isComment: false },
    { lineNumber: 17, indent: 0, code: "# Calculate price per square foot", isComment: true },
    { lineNumber: 18, indent: 0, code: "filtered_df['price_per_sqft'] = filtered_df['price'] / filtered_df['sqft']", isComment: false },
    { lineNumber: 19, indent: 0, code: "", isComment: false },
    { lineNumber: 20, indent: 0, code: "# Group by neighborhood", isComment: true },
    { lineNumber: 21, indent: 0, code: "neighborhood_stats = filtered_df.groupby('neighborhood').agg({", isComment: false },
    { lineNumber: 22, indent: 1, code: "'price': 'mean',", isComment: false },
    { lineNumber: 23, indent: 1, code: "'price_per_sqft': 'mean',", isComment: false },
    { lineNumber: 24, indent: 1, code: "'bedrooms': 'mean',", isComment: false },
    { lineNumber: 25, indent: 1, code: "'sqft': 'mean'", isComment: false },
    { lineNumber: 26, indent: 0, code: "}).sort_values('price_per_sqft', ascending=False)", isComment: false },
    { lineNumber: 27, indent: 0, code: "", isComment: false },
    { lineNumber: 28, indent: 0, code: "# Visualize the top 10 neighborhoods by price", isComment: true },
    { lineNumber: 29, indent: 0, code: "top_neighborhoods = neighborhood_stats.head(10)", isComment: false },
    { lineNumber: 30, indent: 0, code: "plt.figure(figsize=(12, 6))", isComment: false },
    { lineNumber: 31, indent: 0, code: "plt.bar(top_neighborhoods.index, top_neighborhoods['price'])", isComment: false },
    { lineNumber: 32, indent: 0, code: "plt.title('Average Property Price by Neighborhood')", isComment: false },
    { lineNumber: 33, indent: 0, code: "plt.xticks(rotation=45)", isComment: false },
    { lineNumber: 34, indent: 0, code: "plt.ylabel('Average Price ($)')", isComment: false },
    { lineNumber: 35, indent: 0, code: "plt.tight_layout()", isComment: false },
    { lineNumber: 36, indent: 0, code: "plt.savefig('neighborhood_prices.png')", isComment: false },
    { lineNumber: 37, indent: 0, code: "plt.show()", isComment: false },
  ];

  const pythonDataAnalysisSteps: CodeStep[] = [
    {
      id: 1,
      title: "Import Libraries",
      description: "Import necessary Python libraries for data analysis: pandas for data manipulation and matplotlib for visualization.",
      highlightLines: [1, 2],
      variables: {}
    },
    {
      id: 2,
      title: "Load Dataset",
      description: "Read the real estate CSV file into a pandas DataFrame.",
      highlightLines: [5],
      variables: { "df.shape": "(1500, 15)" },
      output: "Loading real_estate_data.csv...\nDataset loaded with 1500 rows and 15 columns."
    },
    {
      id: 3,
      title: "Explore Data",
      description: "View the first few rows and get statistical summaries of the data.",
      highlightLines: [8, 9],
      variables: { "df.shape": "(1500, 15)" },
      output: "   id  price  bedrooms  bathrooms  sqft  neighborhood\n0  1   450000      3        2.5  2100  Downtown\n1  2   325000      2        1.0  1200  Westside\n2  3   550000      4        3.0  2800  Northend\n..."
    },
    {
      id: 4,
      title: "Clean Data",
      description: "Remove rows with missing values in important columns.",
      highlightLines: [12],
      variables: { "df.shape": "(1423, 15)" },
      output: "Removed 77 rows with missing values.\nDataset now has 1423 rows."
    },
    {
      id: 5,
      title: "Filter Properties",
      description: "Filter properties to include only those within a specific price range.",
      highlightLines: [15],
      variables: { "filtered_df.shape": "(1248, 15)" },
      output: "Filtered to prices between $100,000 and $1,000,000.\n1248 properties remain in the dataset."
    },
    {
      id: 6,
      title: "Calculate Price per Square Foot",
      description: "Compute a new metric: price per square foot for each property.",
      highlightLines: [18],
      variables: { "filtered_df.columns": "['id', 'price', 'bedrooms', 'bathrooms', 'sqft', 'neighborhood', 'price_per_sqft']" },
      output: "Added new column 'price_per_sqft'.\nAverage price per square foot: $245.32"
    },
    {
      id: 7,
      title: "Group by Neighborhood",
      description: "Calculate average statistics for each neighborhood.",
      highlightLines: [21, 22, 23, 24, 25, 26],
      variables: { "neighborhood_stats.shape": "(42, 4)" },
      output: "Grouped data by 42 unique neighborhoods and calculated average metrics."
    },
    {
      id: 8,
      title: "Select Top Neighborhoods",
      description: "Identify the top 10 neighborhoods by price per square foot.",
      highlightLines: [29],
      variables: { "top_neighborhoods.shape": "(10, 4)" },
      output: "Top neighborhood: Lakeside with avg price per sqft: $425.18"
    },
    {
      id: 9,
      title: "Create Visualization",
      description: "Set up a bar chart to visualize the average prices by neighborhood.",
      highlightLines: [30, 31, 32, 33, 34, 35],
      variables: {},
      output: "Preparing bar chart visualization..."
    },
    {
      id: 10,
      title: "Save and Display Chart",
      description: "Save the visualization as an image file and display it.",
      highlightLines: [36, 37],
      variables: {},
      output: "Chart saved as 'neighborhood_prices.png'\nDisplaying visualization..."
    }
  ];

  // Example 3: SQL Database Queries
  const sqlDatabaseLines: CodeLine[] = [
    { lineNumber: 1, indent: 0, code: "-- Create tables for real estate database", isComment: true },
    { lineNumber: 2, indent: 0, code: "CREATE TABLE properties (", isComment: false },
    { lineNumber: 3, indent: 1, code: "property_id SERIAL PRIMARY KEY,", isComment: false },
    { lineNumber: 4, indent: 1, code: "address VARCHAR(255) NOT NULL,", isComment: false },
    { lineNumber: 5, indent: 1, code: "city VARCHAR(100) NOT NULL,", isComment: false },
    { lineNumber: 6, indent: 1, code: "state VARCHAR(50) NOT NULL,", isComment: false },
    { lineNumber: 7, indent: 1, code: "zip VARCHAR(20) NOT NULL,", isComment: false },
    { lineNumber: 8, indent: 1, code: "property_type VARCHAR(50) NOT NULL,", isComment: false },
    { lineNumber: 9, indent: 1, code: "bedrooms INT,", isComment: false },
    { lineNumber: 10, indent: 1, code: "bathrooms DECIMAL(3,1),", isComment: false },
    { lineNumber: 11, indent: 1, code: "square_feet INT,", isComment: false },
    { lineNumber: 12, indent: 1, code: "year_built INT,", isComment: false },
    { lineNumber: 13, indent: 1, code: "lot_size DECIMAL(10,2),", isComment: false },
    { lineNumber: 14, indent: 1, code: "neighborhood_id INT", isComment: false },
    { lineNumber: 15, indent: 0, code: ");", isComment: false },
    { lineNumber: 16, indent: 0, code: "", isComment: false },
    { lineNumber: 17, indent: 0, code: "CREATE TABLE listings (", isComment: false },
    { lineNumber: 18, indent: 1, code: "listing_id SERIAL PRIMARY KEY,", isComment: false },
    { lineNumber: 19, indent: 1, code: "property_id INT REFERENCES properties(property_id),", isComment: false },
    { lineNumber: 20, indent: 1, code: "list_price DECIMAL(12,2) NOT NULL,", isComment: false },
    { lineNumber: 21, indent: 1, code: "listing_date DATE NOT NULL,", isComment: false },
    { lineNumber: 22, indent: 1, code: "status VARCHAR(50) NOT NULL,", isComment: false },
    { lineNumber: 23, indent: 1, code: "description TEXT,", isComment: false },
    { lineNumber: 24, indent: 1, code: "agent_id INT", isComment: false },
    { lineNumber: 25, indent: 0, code: ");", isComment: false },
    { lineNumber: 26, indent: 0, code: "", isComment: false },
    { lineNumber: 27, indent: 0, code: "-- Insert sample data", isComment: true },
    { lineNumber: 28, indent: 0, code: "INSERT INTO properties (address, city, state, zip, property_type, bedrooms, bathrooms, square_feet, year_built, neighborhood_id)", isComment: false },
    { lineNumber: 29, indent: 0, code: "VALUES ('123 Main St', 'Anytown', 'CA', '90210', 'Single Family', 3, 2.5, 2200, 1985, 1);", isComment: false },
    { lineNumber: 30, indent: 0, code: "", isComment: false },
    { lineNumber: 31, indent: 0, code: "-- Query for property analysis", isComment: true },
    { lineNumber: 32, indent: 0, code: "SELECT ", isComment: false },
    { lineNumber: 33, indent: 1, code: "p.property_type,", isComment: false },
    { lineNumber: 34, indent: 1, code: "COUNT(*) as total_properties,", isComment: false },
    { lineNumber: 35, indent: 1, code: "ROUND(AVG(l.list_price), 2) as avg_price,", isComment: false },
    { lineNumber: 36, indent: 1, code: "ROUND(AVG(p.square_feet), 2) as avg_square_feet,", isComment: false },
    { lineNumber: 37, indent: 1, code: "ROUND(AVG(l.list_price / p.square_feet), 2) as avg_price_per_sqft", isComment: false },
    { lineNumber: 38, indent: 0, code: "FROM ", isComment: false },
    { lineNumber: 39, indent: 1, code: "properties p", isComment: false },
    { lineNumber: 40, indent: 0, code: "JOIN ", isComment: false },
    { lineNumber: 41, indent: 1, code: "listings l ON p.property_id = l.property_id", isComment: false },
    { lineNumber: 42, indent: 0, code: "WHERE ", isComment: false },
    { lineNumber: 43, indent: 1, code: "l.listing_date >= '2023-01-01'", isComment: false },
    { lineNumber: 44, indent: 0, code: "GROUP BY ", isComment: false },
    { lineNumber: 45, indent: 1, code: "p.property_type", isComment: false },
    { lineNumber: 46, indent: 0, code: "ORDER BY ", isComment: false },
    { lineNumber: 47, indent: 1, code: "avg_price_per_sqft DESC;", isComment: false },
  ];

  const sqlDatabaseSteps: CodeStep[] = [
    {
      id: 1,
      title: "Create Properties Table",
      description: "Start by creating a table to store property information with various fields such as address, bedrooms, and square footage.",
      highlightLines: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
      variables: {},
      output: "Creating properties table with 12 columns."
    },
    {
      id: 2,
      title: "Create Listings Table",
      description: "Create a table for property listings that references the properties table and includes listing-specific information.",
      highlightLines: [17, 18, 19, 20, 21, 22, 23, 24, 25],
      variables: {},
      output: "Creating listings table with 7 columns, including a foreign key to properties."
    },
    {
      id: 3,
      title: "Insert Sample Data",
      description: "Add a sample property record to the properties table.",
      highlightLines: [28, 29],
      variables: {},
      output: "Inserted 1 row into properties table."
    },
    {
      id: 4,
      title: "Start Analysis Query",
      description: "Begin a query to analyze property data by selecting fields for the result set.",
      highlightLines: [32, 33, 34, 35, 36, 37],
      variables: {},
      output: "Setting up SELECT clause with property type, count, and price metrics."
    },
    {
      id: 5,
      title: "Specify Data Sources",
      description: "Define the data sources and how they are joined in the FROM and JOIN clauses.",
      highlightLines: [38, 39, 40, 41],
      variables: {},
      output: "Joining properties and listings tables on property_id."
    },
    {
      id: 6,
      title: "Filter Results",
      description: "Add a WHERE clause to filter listings based on date.",
      highlightLines: [42, 43],
      variables: {},
      output: "Filtering for listings created since January 1, 2023."
    },
    {
      id: 7,
      title: "Group and Sort Results",
      description: "Group results by property type and sort by average price per square foot.",
      highlightLines: [44, 45, 46, 47],
      variables: {},
      output: "Results grouped by property_type and ordered by avg_price_per_sqft in descending order.\n\nproperty_type | total_properties | avg_price | avg_square_feet | avg_price_per_sqft\n-------------|-----------------|-----------|-----------------|------------------\nCondo        | 423             | 325450.00 | 1150.25         | 282.94\nSingle Family| 658             | 575212.50 | 2245.75         | 256.13\nTownhouse    | 201             | 410825.75 | 1725.50         | 238.09"
    }
  ];

  return (
    <div className="space-y-12 py-8">
      <div>
        <h2 className="text-2xl font-bold mb-4">Interactive Code Snippet Theater</h2>
        <p className="text-muted-foreground mb-6">
          Explore code snippets with interactive playback controls. Watch as the code executes step by step,
          with explanations and variable states at each point in the process.
        </p>
      </div>
      
      <Card className="p-6">
        <h3 className="text-xl font-semibold mb-4">JavaScript Sorting Algorithm</h3>
        <CodeSnippetTheater
          title="Bubble Sort Implementation"
          description="Step through a bubble sort algorithm to see how it works."
          language="javascript"
          codeLines={jsSortingAlgorithmLines}
          steps={jsSortingAlgorithmSteps}
        />
      </Card>
      
      <Card className="p-6">
        <h3 className="text-xl font-semibold mb-4">Python Real Estate Data Analysis</h3>
        <CodeSnippetTheater
          title="Real Estate Data Analysis with Pandas"
          description="Analyze property data and create visualizations using Python."
          language="python"
          codeLines={pythonDataAnalysisLines}
          steps={pythonDataAnalysisSteps}
        />
      </Card>
      
      <Card className="p-6">
        <h3 className="text-xl font-semibold mb-4">SQL Real Estate Database</h3>
        <CodeSnippetTheater
          title="SQL Database for Real Estate Analysis"
          description="Create database schema and analyze property data with SQL queries."
          language="sql"
          codeLines={sqlDatabaseLines}
          steps={sqlDatabaseSteps}
        />
      </Card>
    </div>
  );
};

export default CodeSnippetDemo;