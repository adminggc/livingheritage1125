/**
 * Database Connection Module
 * Manages PostgreSQL connections with connection pooling
 */

const { Pool } = require('pg');

// Build connection config from environment variables
const connectionConfig = {
  connectionString: process.env.DATABASE_URL ||
    `postgresql://${process.env.DB_USER || 'postgres'}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT || 5432}/${process.env.DB_NAME || 'railway'}`,

  // Connection pooling settings
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  application_name: 'livingheritage',

  // SSL configuration - always disable certificate validation for self-signed certs
  ssl: {
    rejectUnauthorized: false
  }
};

let pool = null;

class DatabaseConnection {
  constructor() {
    this.isConnected = false;
    this.connectionAttempts = 0;
  }

  /**
   * Initialize database connection
   */
  async connect() {
    try {
      pool = new Pool(connectionConfig);

      // Test the connection
      const client = await pool.connect();
      const result = await client.query('SELECT NOW()');
      client.release();

      this.isConnected = true;
      this.connectionAttempts++;

      // Log connection details (without password)
      const safeConfig = { ...connectionConfig };
      safeConfig.connectionString = safeConfig.connectionString
        .replace(/:[^:@]*@/, ':****@'); // Hide password

      console.log('✓ PostgreSQL connected successfully');
      console.log(`  Config: ${safeConfig.connectionString}`);

      return true;
    } catch (error) {
      this.connectionAttempts++;
      this.isConnected = false;

      // Log error details
      console.error('❌ Database connection failed:');
      if (error.code === 'ECONNREFUSED') {
        console.error(`   Host unreachable: ${process.env.DB_HOST}:${process.env.DB_PORT}`);
      } else if (error.code === 'ENOTFOUND') {
        console.error(`   Host not found: ${process.env.DB_HOST}`);
      } else if (error.code === '28P01') {
        console.error('   Authentication failed - check DB_USER and DB_PASSWORD');
      } else if (error.code === '3D000') {
        console.error(`   Database not found: ${process.env.DB_NAME}`);
      }
      console.error(`   Error: ${error.message}`);

      throw error;
    }
  }

  /**
   * Execute a query
   */
  async query(sql, params = []) {
    if (!pool) {
      throw new Error('Database not connected');
    }

    try {
      return await pool.query(sql, params);
    } catch (error) {
      console.error(`Query error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get a client from the pool for transactions
   */
  async getClient() {
    if (!pool) {
      throw new Error('Database not connected');
    }
    return pool.connect();
  }

  /**
   * Health check query
   */
  async healthCheck() {
    try {
      const result = await this.query('SELECT 1 as health');
      return result.rows[0].health === 1;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get connection pool info
   */
  getPoolInfo() {
    if (!pool) {
      return { connected: false, idle: 0, waiting: 0 };
    }

    return {
      connected: this.isConnected,
      idle: pool.idleCount,
      waiting: pool.waitingCount,
      total: pool.totalCount
    };
  }

  /**
   * Close database connection
   */
  async disconnect() {
    if (pool) {
      await pool.end();
      pool = null;
      this.isConnected = false;
    }
  }
}

// Export singleton instance
module.exports = new DatabaseConnection();
