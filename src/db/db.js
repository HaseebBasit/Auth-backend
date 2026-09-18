import pg from "pg";

const { Pool } = pg;

const db = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

db.connect()
    .then((client) => {
        console.log("PostgreSQL connected successfully!");
        client.release();
    })
    .catch((err) => {
        console.log("PostgreSQL connection error:", err);
    });

export default db;