import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
});

pool
  .connect()
  .then((res) => {
    console.log("Postgres DB connected successfully!");
    res.release();
  })
  .catch((err) => {
    console.log("Err while connection with postgres:", err.message);
  });

export default pool;