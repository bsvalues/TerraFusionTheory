import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

// Configure Neon DB to use WebSockets
neonConfig.webSocketConstructor = ws;
// Other connection settings will be specified in the pool configuration

// Validate environment variables
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Configure pool with improved settings
export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  max: 10, // maximum connections
  idleTimeoutMillis: 30000, // how long a client is allowed to remain idle before being closed
  connectionTimeoutMillis: 5000, // how long to wait for a connection
  maxUses: 100, // close idle clients after this many uses
});

// Add connection event listeners
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

pool.on('connect', (client) => {
  console.log('New client connected to PostgreSQL');
});

// Create and export Drizzle ORM instance
export const db = drizzle({ client: pool, schema });

// Function to test database connection
export async function testDatabaseConnection(): Promise<boolean> {
  let client;
  try {
    client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    console.log('Database connection successful:', result.rows[0]);
    return true;
  } catch (error) {
    console.error('Database connection error:', error);
    return false;
  } finally {
    if (client) {
      client.release();
    }
  }
}
