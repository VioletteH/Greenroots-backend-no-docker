import pg from "pg";
import "dotenv/config";

const { Pool } = pg;

// Creation of the PostgreSQL connection pool 
export const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: Number(process.env.DB_PORT),
});

// Function to test the connection (called at application startup)
export const connectDB = async () => {
  try {
    const client = await pool.connect();
    console.log("PostgreSQL is connected.");
    client.release();
  } catch (error) {
    console.error("Failed to connect to PostgreSQL:", error);
    process.exit(1);
  }
};

// Utility method to execute SQL queries
export const query = async (text: string, params?: any[]) => {
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result.rows;
  } catch (error) {
    console.error("Query error:", error);
    throw error;
  } finally {
    client.release();
  }
};