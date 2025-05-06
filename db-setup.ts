import { db } from './server/db';
import { 
  users, projects, conversations, analysis, logs, badges, userBadges,
  properties, propertySales, neighborhoods
} from './shared/schema';
import { sql } from 'drizzle-orm';

async function createTables() {
  console.log('Starting database setup...');
  
  try {
    // Create tables one by one
    console.log('Creating users table...');
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        email TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    console.log('Creating projects table...');
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS projects (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        type TEXT,
        target_platform TEXT,
        technology_stack TEXT,
        status TEXT,
        overview TEXT,
        progress INTEGER,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    console.log('Creating conversations table...');
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS conversations (
        id SERIAL PRIMARY KEY,
        project_id INTEGER NOT NULL,
        messages JSONB,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    console.log('Creating analysis table...');
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS analysis (
        id SERIAL PRIMARY KEY,
        project_id INTEGER NOT NULL,
        identified_requirements JSONB,
        suggested_tech_stack JSONB,
        missing_information JSONB,
        next_steps JSONB,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    console.log('Creating logs table...');
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS logs (
        id SERIAL PRIMARY KEY,
        project_id INTEGER,
        timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
        level TEXT NOT NULL,
        category TEXT NOT NULL,
        message TEXT NOT NULL,
        details JSONB,
        source TEXT,
        user_id INTEGER,
        session_id TEXT,
        duration INTEGER,
        status_code INTEGER,
        endpoint TEXT,
        tags TEXT[]
      )
    `);
    
    console.log('Creating badges table...');
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS badges (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        type TEXT NOT NULL,
        level TEXT NOT NULL,
        criteria JSONB,
        icon TEXT,
        color TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    console.log('Creating user_badges table...');
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS user_badges (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        badge_id INTEGER NOT NULL,
        project_id INTEGER,
        progress INTEGER DEFAULT 0,
        metadata JSONB DEFAULT '{}',
        awarded_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    console.log('Creating properties table...');
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS properties (
        id SERIAL PRIMARY KEY,
        parcel_id TEXT NOT NULL UNIQUE,
        address TEXT NOT NULL,
        city TEXT NOT NULL,
        state TEXT NOT NULL,
        zip_code TEXT,
        county TEXT NOT NULL,
        property_type TEXT NOT NULL,
        land_use TEXT,
        year_built INTEGER,
        building_area NUMERIC,
        lot_size NUMERIC,
        bedrooms INTEGER,
        bathrooms NUMERIC,
        stories INTEGER,
        condition TEXT,
        quality TEXT,
        heating_type TEXT,
        cooling_type TEXT,
        garage_type TEXT,
        garage_capacity INTEGER,
        basement BOOLEAN,
        roof_type TEXT,
        external_wall_type TEXT,
        foundation_type TEXT,
        porch_type TEXT,
        deck_type TEXT,
        pool_type TEXT,
        assessed_value NUMERIC,
        market_value NUMERIC,
        taxable_value NUMERIC,
        last_sale_price NUMERIC,
        last_sale_date DATE,
        latitude NUMERIC,
        longitude NUMERIC,
        zoning TEXT,
        flood_zone TEXT,
        parcel_geometry JSONB,
        tax_district TEXT,
        school TEXT,
        neighborhood TEXT,
        neighborhood_code TEXT,
        metadata JSONB DEFAULT '{}',
        images JSONB,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    console.log('Creating property_sales table...');
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS property_sales (
        id SERIAL PRIMARY KEY,
        property_id INTEGER NOT NULL,
        parcel_id TEXT NOT NULL,
        sale_price NUMERIC NOT NULL,
        sale_date DATE NOT NULL,
        transaction_type TEXT NOT NULL,
        deed_type TEXT,
        buyer_name TEXT,
        seller_name TEXT,
        verified BOOLEAN DEFAULT FALSE,
        valid_for_analysis BOOLEAN DEFAULT TRUE,
        financing_type TEXT,
        assessed_value_at_sale NUMERIC,
        sale_price_per_sqft NUMERIC,
        assessment_ratio NUMERIC,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    console.log('Creating neighborhoods table...');
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS neighborhoods (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        code TEXT NOT NULL UNIQUE,
        city TEXT NOT NULL,
        county TEXT NOT NULL,
        state TEXT NOT NULL,
        description TEXT,
        characteristics JSONB DEFAULT '{}',
        boundaries JSONB,
        median_home_value NUMERIC,
        avg_home_value NUMERIC,
        avg_year_built NUMERIC,
        total_properties INTEGER,
        total_sales INTEGER,
        avg_sale_price NUMERIC,
        median_sale_price NUMERIC,
        avg_days_on_market NUMERIC,
        school_rating NUMERIC,
        crime_rate NUMERIC,
        walk_score NUMERIC,
        transit_score NUMERIC,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    console.log('Database setup completed successfully!');
  } catch (error) {
    console.error('Error setting up database:', error);
  }
}

// Run the setup
createTables()
  .then(() => {
    console.log('Setup complete. Exiting...');
    process.exit(0);
  })
  .catch(err => {
    console.error('Failed to set up database:', err);
    process.exit(1);
  });