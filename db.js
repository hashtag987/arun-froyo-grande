const { Client } = require("pg");

const pool = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  }
});

pool.connect((err) => {
  if (err) {
    console.log(err);
  } else {
    console.log("Successfully connected to database");
  }
});

module.exports = pool;
