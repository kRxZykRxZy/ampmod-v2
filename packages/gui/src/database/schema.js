const { Pool } = require("pg");

const connectionString = `postgres://${process.env.DATABASE_USERNAME}:${process.env.DATABASE_PASSWORD}@${process.env.DATABASE_URL}/${process.env.DATABASE_NAME}`;

const pool = new Pool({
  connectionString,
});

  // Helper for running queries
const query = (text, params) => {
  return pool.query(text, params);
};

module.exports = {
  pool,
  query,
};
