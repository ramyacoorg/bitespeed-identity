const { Pool } = require("pg");

const isProduction = process.env.DATABASE_URL;

const pool = new Pool({
  connectionString: isProduction ? process.env.DATABASE_URL : undefined,
  user: isProduction ? undefined : process.env.DB_USER,
  host: isProduction ? undefined : process.env.DB_HOST,
  database: isProduction ? undefined : process.env.DB_NAME,
  password: isProduction ? undefined : process.env.DB_PASSWORD,
  port: isProduction ? undefined : process.env.DB_PORT,
  ssl: isProduction
    ? { rejectUnauthorized: false }
    : false,
});

module.exports = pool;