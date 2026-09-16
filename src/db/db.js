import pg from "pg";

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

pool
  .connect()
  .then((res) => {
    console.log("Postgres DB connected successfully!");
    res.release();
  })
  .catch((err) => {
    console.log("Err while connecting to postgres:", err.message);
  });

export default pool;